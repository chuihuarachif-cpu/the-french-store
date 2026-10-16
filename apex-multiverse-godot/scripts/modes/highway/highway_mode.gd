extends Node3D
## MODO 1 — INFINITO: autopista sin fin con tráfico, obras viales, nitro y combos de "rozones".
## La hora del día es aleatoria en cada partida (día, amanecer, atardecer o noche).

const LANES := [-5.7, -1.9, 1.9, 5.7]
const PLAYER_HL := 2.2
const PLAYER_HW := 0.95
const TRAFFIC_TYPES := ["sedan", "sedan", "sedan", "hatch", "hatch", "suv", "suv", "suv", "pickup", "van", "semi", "semi", "bus", "coupe"]
const PRESET_NAMES := {"day": ["DÍA", "Sol de mediodía"], "sunset": ["ATARDECER", "Hora dorada"], "sunrise": ["AMANECER", "Primera luz"], "night": ["NOCHE", "Asfalto mojado y luces de neón"]}

var track: HighwayTrack
var world: HighwayWorld
var car := ArcadeCar.new()
var car_vis: CarVisual
var cam: Camera3D
var hud: HUD
var touch: TouchControls
var overlays: Overlays
var preset := "day"
var night := false
var traffic: Array = []
var oncoming: Array = []
var obstacles: Array = []
var debris: Array = []
var score := 0.0
var mult := 1.0
var combo := 0.0
var close_calls := 0
var top_speed := 0.0
var lives := 3
var invuln := 0.0
var state := "intro"
var state_t := 0.0
var next_work_s := 950.0
var shake := 0.0
var cam_yaw := 0.0
var cam_dist := 6.4
var spin := 0.0
var max_speed_t := 0.0
var sparks_l: CPUParticles3D
var sparks_r: CPUParticles3D
var smoke: CPUParticles3D
var trails: Array = []
var speed_lines: CPUParticles3D
var engine: AudioStreamPlayer
var wind: AudioStreamPlayer
var best := 0
var _last_steer := 0.0

func _ready() -> void:
	var roll := randf()
	preset = "night" if roll < 0.38 else ("sunset" if roll < 0.62 else ("sunrise" if roll < 0.74 else "day"))
	if OS.get_environment("PRESET") != "":
		preset = OS.get_environment("PRESET")
	night = preset == "night"
	EnvFactory.build(self, preset)
	var tm := TrafficFactory.mats()
	(tm["tail"] as StandardMaterial3D).emission_energy_multiplier = 4.5 if night else 1.3
	(tm["head"] as StandardMaterial3D).emission_energy_multiplier = 7.0 if night else 1.2
	track = HighwayTrack.new(Game.rng.randf_range(0.0, 20000.0))
	world = HighwayWorld.new()
	add_child(world)
	world.setup(track, preset)
	world.prebuild(0.0)
	car.x = LANES[2]
	car.x_min = -8.4
	car.x_max = 9.0
	car.speed = 0.0
	car.nitro = 60.0
	car_vis = CarVisual.new()
	add_child(car_vis)
	car_vis.setup(Game.car_color(), night)
	if night:
		var fill := OmniLight3D.new()
		fill.light_color = Color(0.75, 0.82, 1.0)
		fill.light_energy = 1.2
		fill.omni_range = 9.0
		fill.position = Vector3(0, 3.2, 3.5)
		car_vis.add_child(fill)
	cam = Camera3D.new()
	cam.far = 4000.0
	cam.near = 0.15
	cam.fov = 64.0
	add_child(cam)
	cam.make_current()
	speed_lines = FX.speed_lines()
	speed_lines.emitting = false
	cam.add_child(speed_lines)
	sparks_l = FX.sparks()
	sparks_r = FX.sparks()
	car_vis.add_child(sparks_l)
	car_vis.add_child(sparks_r)
	sparks_l.position = Vector3(-1.0, 0.35, 0.2)
	sparks_r.position = Vector3(1.0, 0.35, 0.2)
	smoke = FX.smoke()
	car_vis.add_child(smoke)
	smoke.position = Vector3(0, 0.3, 1.6)
	for i in 2:
		var tr := FX.Trail.new(Color(0.25, 0.6, 1.0), 0.05)
		add_child(tr)
		trails.append(tr)
	hud = HUD.new()
	add_child(hud)
	hud.set_title("PUNTOS")
	hud.set_lives(lives)
	touch = TouchControls.new(TouchControls.racing_layout())
	hud.root.add_child(touch)
	overlays = Overlays.new()
	add_child(overlays)
	hud.pause_pressed.connect(_pause)
	overlays.resume.connect(func(): get_tree().paused = false)
	overlays.restart.connect(func(): Engine.time_scale = 1.0; Game.start_mode("highway"))
	overlays.quit_to_menu.connect(func(): Engine.time_scale = 1.0; Game.goto_menu())
	best = int(Game.save.get("best_highway", 0))
	engine = Sfx.make_loop("engine_loop", -6.0)
	add_child(engine)
	wind = Sfx.make_loop("wind_loop", -30.0)
	add_child(wind)
	if engine.stream:
		engine.play()
	if wind.stream:
		wind.play()
	Sfx.play_music("music_drive")
	for i in 12:
		_spawn_traffic(car.s + 60.0 + i * 32.0 + randf() * 20.0)
	for i in 6:
		_spawn_oncoming(car.s + 80.0 + i * 90.0)
	var pn: Array = PRESET_NAMES[preset]
	hud.banner(pn[0], "AUTOPISTA INFINITA · " + pn[1], 1.8, UIKit.WARN if preset != "night" else UIKit.ACCENT)
	_place_player(0.016, 0.0)
	_update_camera(1.0)

func _pause() -> void:
	if state == "over":
		return
	get_tree().paused = true
	touch.release_all()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()

# ------------------------------------------------------------------ TRÁFICO
func _lane_free(lane_x: float, s: float, gap: float) -> bool:
	for t in traffic:
		if absf(t["x"] - lane_x) < 2.0 and absf(t["s"] - s) < gap:
			return false
	for o in obstacles:
		if absf(o["x"] - lane_x) < 2.6 and absf(o["s"] - s) < gap + 40.0:
			return false
	return true

func _spawn_traffic(s: float) -> void:
	var lanes := [0, 1, 2, 3]
	lanes.shuffle()
	for li in lanes:
		var lx: float = LANES[li]
		var tp: String = TRAFFIC_TYPES[randi() % TRAFFIC_TYPES.size()]
		if (tp == "semi" or tp == "bus") and li < 1:
			tp = "suv"
		if _lane_free(lx, s, 34.0):
			var node := TrafficFactory.spawn(tp, TrafficFactory.PAINTS[randi() % TrafficFactory.PAINTS.size()])
			world.add_child(node)
			var spd := lerpf(19.0, 31.0, float(li) / 3.0) + randf_range(-2.0, 2.0)
			if tp == "semi" or tp == "bus":
				spd -= 3.0
			var d := {"node": node, "s": s, "x": lx, "tx": lx, "speed": spd, "base_speed": spd, "type": tp,
				"hl": float(node.get_meta("length")) * 0.5, "hw": float(node.get_meta("width")) * 0.5, "passed": false, "lc_t": randf_range(4.0, 14.0), "blink": null, "hit": false}
			if night:
				_add_glows(node, d, false)
			traffic.append(d)
			return

func _add_glows(node: Node3D, d: Dictionary, front: bool) -> void:
	var q := QuadMesh.new()
	q.size = Vector2(1.4, 1.4) if not front else Vector2(3.0, 3.0)
	var m := MatLib.billboard("glow", Color(1.0, 0.1, 0.05) if not front else Color(1.0, 0.95, 0.85), 1.2 if not front else 1.0)
	var hl: float = d["hl"]
	var hw: float = d["hw"]
	var y := 0.85 if d["type"] != "semi" else 0.85
	var rq := QuadMesh.new()
	rq.size = Vector2(0.9, 7.0) if not front else Vector2(1.6, 12.0)
	rq.orientation = PlaneMesh.FACE_Y
	var rm := MatLib.additive("glow", Color(1.0, 0.12, 0.06) if not front else Color(1.0, 0.92, 0.75), 0.55)
	for sx in [-1, 1]:
		var g := MeshInstance3D.new()
		g.mesh = q
		g.material_override = m
		g.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		g.position = Vector3(sx * hw * 0.7, y, (-hl - 0.3) if front else (hl + 0.15))
		node.add_child(g)
		# Reflejo alargado sobre el asfalto mojado
		var r := MeshInstance3D.new()
		r.mesh = rq
		r.material_override = rm
		r.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		r.position = Vector3(sx * hw * 0.7, 0.04, (-hl - 6.0) if front else (hl + 3.6))
		node.add_child(r)

func _spawn_oncoming(s: float) -> void:
	var lx: float = HighwayWorld.ONCOMING[randi() % 3]
	for o in oncoming:
		if absf(o["x"] - lx) < 1.0 and absf(o["s"] - s) < 40.0:
			return
	var tp: String = TRAFFIC_TYPES[randi() % TRAFFIC_TYPES.size()]
	var node := TrafficFactory.spawn(tp, TrafficFactory.PAINTS[randi() % TrafficFactory.PAINTS.size()])
	world.add_child(node)
	var d := {"node": node, "s": s, "x": lx, "speed": -randf_range(24.0, 33.0), "type": tp, "hl": float(node.get_meta("length")) * 0.5, "hw": float(node.get_meta("width")) * 0.5}
	if night:
		_add_glows(node, d, true)
	oncoming.append(d)

func _blinker(t: Dictionary, dir: float) -> void:
	if t["blink"] != null:
		t["blink"].queue_free()
	var b := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.7, 0.7)
	b.mesh = q
	b.material_override = MatLib.billboard("glow", Color(1.0, 0.55, 0.0), 2.0)
	b.position = Vector3(dir * t["hw"] * 0.9, 0.9, t["hl"] + 0.1)
	b.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	t["node"].add_child(b)
	t["blink"] = b

func _update_traffic(dt: float) -> void:
	var difficulty := clampf(car.s / 12000.0, 0.0, 1.0)
	var target := 14 + int(difficulty * 10)
	var i := traffic.size() - 1
	while i >= 0:
		var t: Dictionary = traffic[i]
		# Seguir al de delante en el mismo carril
		var want: float = t["base_speed"]
		for o in traffic:
			if o != t and absf(o["x"] - t["x"]) < 2.2:
				var ds: float = o["s"] - t["s"]
				if ds > 0.0 and ds < 22.0:
					want = minf(want, o["speed"] - 1.0)
		for ob in obstacles:
			if absf(ob["x"] - t["x"]) < 2.2:
				var ds2: float = ob["s"] - t["s"]
				if ds2 > 0.0 and ds2 < 90.0 and t["tx"] == t["x"]:
					_try_lane_change(t, true)
		t["speed"] = move_toward(t["speed"], want, 8.0 * dt)
		t["s"] += t["speed"] * dt
		# Cambios de carril con intermitente
		t["lc_t"] -= dt
		if t["lc_t"] <= 0.0:
			t["lc_t"] = randf_range(6.0, 16.0)
			_try_lane_change(t, false)
		if absf(t["x"] - t["tx"]) > 0.01:
			t["x"] = move_toward(t["x"], t["tx"], 1.5 * dt)
			if t["blink"] != null:
				t["blink"].visible = fmod(Time.get_ticks_msec() / 1000.0, 0.7) < 0.35
		elif t["blink"] != null:
			t["blink"].queue_free()
			t["blink"] = null
		if t["hit"]:
			t["speed"] = move_toward(t["speed"], 0.0, 10.0 * dt)
		var fr := track.frame(t["s"])
		var yaw: float = -(t["tx"] - t["x"]) * 0.05 if absf(t["x"] - t["tx"]) > 0.01 else 0.0
		t["node"].global_transform = Transform3D(fr.basis.rotated(fr.basis.y, yaw), fr.origin + fr.basis.x * t["x"])
		if t["s"] < car.s - 90.0 or t["s"] > car.s + 900.0:
			t["node"].queue_free()
			traffic.remove_at(i)
		i -= 1
	var tries := 0
	while traffic.size() < target and tries < 3:
		_spawn_traffic(car.s + randf_range(300.0, 520.0))
		tries += 1
	# Sentido contrario
	i = oncoming.size() - 1
	while i >= 0:
		var o: Dictionary = oncoming[i]
		o["s"] += o["speed"] * dt
		var fr := track.frame(o["s"])
		o["node"].global_transform = Transform3D(fr.basis.rotated(fr.basis.y, PI), fr.origin + fr.basis.x * o["x"])
		if o["s"] < car.s - 60.0:
			o["node"].queue_free()
			oncoming.remove_at(i)
		i -= 1
	if oncoming.size() < 9:
		_spawn_oncoming(car.s + randf_range(500.0, 750.0))

func _try_lane_change(t: Dictionary, forced: bool) -> void:
	var li := LANES.find(t["tx"])
	if li < 0:
		return
	var opts := []
	for d in [-1, 1]:
		var nl: int = li + d
		if nl >= 0 and nl < 4:
			var nx: float = LANES[nl]
			var ok := true
			for o in traffic:
				if o != t and absf(o["x"] - nx) < 2.0 and absf(o["s"] - t["s"]) < 18.0:
					ok = false
			# No cerrar al jugador si está justo al lado
			if absf(car.x - nx) < 2.0 and absf(car.s - t["s"]) < 14.0:
				ok = false
			if ok:
				opts.append(nx)
	if opts.is_empty():
		return
	if not forced and randf() < 0.5:
		return
	var nx2: float = opts[randi() % opts.size()]
	t["tx"] = nx2
	_blinker(t, signf(nx2 - t["x"]))

# ------------------------------------------------------------------ OBRAS
func _spawn_workzone(s0: float) -> void:
	var li := randi() % 4
	var lx: float = LANES[li]
	var length := randf_range(70.0, 130.0)
	var side := -1.0 if li >= 2 else 1.0  # hacia dónde se desvía el tráfico
	var near_edge := lx + side * 1.9
	var far_edge := lx - side * 1.9
	var board := MeshInstance3D.new()
	board.mesh = Props.arrow_board()
	world.add_child(board)
	var bd := {"node": board, "s": s0, "x": lx, "hl": 1.7, "hw": 1.15, "kind": "hard", "yaw": 0.0 if side < 0 else PI, "arrow": true}
	obstacles.append(bd)
	for i in 9:
		var t := float(i) / 8.0
		var c := MeshInstance3D.new()
		c.mesh = Props.cone()
		world.add_child(c)
		obstacles.append({"node": c, "s": s0 - 55.0 + t * 52.0, "x": lerpf(far_edge + side * 0.2, near_edge - side * 0.3, t), "hl": 0.3, "hw": 0.3, "kind": "cone"})
	var s := s0 + 4.0
	while s < s0 + length:
		var b := MeshInstance3D.new()
		b.mesh = Props.work_barrier()
		world.add_child(b)
		obstacles.append({"node": b, "s": s, "x": near_edge - side * 0.35, "hl": 0.95, "hw": 0.3, "kind": "hard"})
		s += 2.05
	s = s0 + 10.0
	while s < s0 + length:
		var c2 := MeshInstance3D.new()
		c2.mesh = Props.cone()
		world.add_child(c2)
		obstacles.append({"node": c2, "s": s, "x": lx + randf_range(-0.6, 0.6), "hl": 0.3, "hw": 0.3, "kind": "cone"})
		s += 16.0
	for o in obstacles:
		if not o.has("placed"):
			o["placed"] = true
			var fr := track.frame(o["s"])
			var b2 := fr.basis
			if o.has("yaw"):
				b2 = b2.rotated(fr.basis.y, o["yaw"])
			o["node"].global_transform = Transform3D(b2, fr.origin + fr.basis.x * o["x"])
	# Avisos: carteles de obra antes de la zona
	for k in [180.0, 110.0]:
		var sign_n := Label3D.new()
		sign_n.text = "⚠ OBRAS\n%d m" % int(k)
		sign_n.font = UIKit.font("Rajdhani-Bold")
		sign_n.font_size = 120
		sign_n.pixel_size = 0.008
		sign_n.modulate = Color(1.0, 0.7, 0.05)
		sign_n.outline_modulate = Color(0.05, 0.05, 0.05)
		sign_n.outline_size = 40
		var fr2 := track.frame(s0 - k)
		sign_n.global_transform = Transform3D(fr2.basis, fr2.origin + fr2.basis.x * 9.4 + fr2.basis.y * 2.6)
		world.add_child(sign_n)
		obstacles.append({"node": sign_n, "s": s0 - k, "x": 99.0, "hl": 0.0, "hw": 0.0, "kind": "deco", "placed": true})

func _update_obstacles(dt: float) -> void:
	if car.s + 560.0 > next_work_s:
		_spawn_workzone(next_work_s)
		var difficulty := clampf(car.s / 15000.0, 0.0, 1.0)
		next_work_s += randf_range(lerpf(900.0, 520.0, difficulty), lerpf(1400.0, 800.0, difficulty))
	var i := obstacles.size() - 1
	var blink_on := fmod(Time.get_ticks_msec() / 1000.0, 0.8) < 0.45
	while i >= 0:
		var o: Dictionary = obstacles[i]
		if o["s"] < car.s - 60.0:
			o["node"].queue_free()
			obstacles.remove_at(i)
		i -= 1
	# Conos volando
	i = debris.size() - 1
	while i >= 0:
		var d: Dictionary = debris[i]
		d["vel"] += Vector3(0, -18.0, 0) * dt
		d["node"].global_position += d["vel"] * dt
		d["node"].rotate(d["axis"], d["spin"] * dt)
		d["life"] -= dt
		if d["life"] <= 0.0:
			d["node"].queue_free()
			debris.remove_at(i)
		i -= 1

# ------------------------------------------------------------------ COLISIONES
func _check_collisions() -> void:
	if state != "run":
		return
	for t in traffic:
		var ds: float = t["s"] - car.s
		var dx: float = t["x"] - car.x
		var lim_s: float = PLAYER_HL + t["hl"]
		var lim_x: float = PLAYER_HW + t["hw"] - 0.08
		if absf(ds) < lim_s and absf(dx) < lim_x:
			if invuln > 0.0:
				continue
			var pen_s := lim_s - absf(ds)
			var pen_x := lim_x - absf(dx)
			if pen_x > pen_s * 0.8 or absf(dx) < lim_x * 0.55:
				# Choque frontal / por alcance
				if ds > 0.0 and car.speed - t["speed"] > 9.0:
					t["hit"] = true
					t["speed"] += 6.0
					_wreck(t["node"].global_position)
					return
				car.speed = minf(car.speed, t["speed"] * 0.92)
				shake = 0.4
			else:
				# Roce lateral
				car.x -= signf(dx) * (pen_x + 0.05)
				car.vx = -signf(dx) * 4.0
				car.speed *= 0.94
				t["tx"] = t["x"] + signf(dx) * 0.4
				shake = 0.5
				(sparks_r if dx > 0 else sparks_l).emitting = true
				Sfx.play("scrape", -6.0, randf_range(0.9, 1.1))
				hud.popup("¡ROCE!", 0, UIKit.DANGER)
				mult = 1.0
				combo = 0.0
		# Rozón (close call): adelantamiento muy ajustado
		if not t["passed"] and ds < -t["hl"]:
			t["passed"] = true
			var gap: float = absf(dx) - (PLAYER_HW + t["hw"])
			if gap < 1.15 and gap > -0.2 and car.speed > 30.0:
				_close_call(t, gap)
	for o in obstacles:
		if o["kind"] == "deco":
			continue
		var ds2: float = o["s"] - car.s
		if absf(ds2) > 6.0:
			continue
		if absf(ds2) < PLAYER_HL + o["hl"] and absf(o["x"] - car.x) < PLAYER_HW + o["hw"]:
			if o["kind"] == "cone":
				o["kind"] = "deco"
				debris.append({"node": o["node"], "vel": track.frame(car.s).basis * Vector3(randf_range(-4, 4), 7.0, -car.speed * 0.7), "axis": Vector3(randf(), randf(), randf()).normalized(), "spin": randf_range(8, 16), "life": 1.6})
				o["s"] = -99999.0
				car.speed *= 0.97
				Sfx.play("cone", -4.0, randf_range(0.9, 1.2))
				score = maxf(0.0, score - 50.0)
				hud.popup("CONO", 0, UIKit.DANGER)
			elif invuln <= 0.0:
				_wreck(o["node"].global_position)
				return

func _close_call(t: Dictionary, gap: float) -> void:
	close_calls += 1
	var big: bool = t["type"] == "semi" or t["type"] == "bus"
	var base := 300.0 + (1.15 - gap) * 420.0
	if big:
		base *= 1.6
	var pts := int(base * mult)
	score += pts
	mult = minf(10.0, mult + 0.5)
	combo = 1.0
	car.nitro = minf(100.0, car.nitro + (14.0 if big else 9.0))
	var txt := "¡AL LÍMITE!" if gap < 0.35 else "¡CERCA!"
	if big:
		txt = "¡GIGANTE!" if gap >= 0.35 else "¡LOCURA!"
	hud.popup(txt, pts)
	Sfx.play("whoosh", -2.0, randf_range(0.9, 1.15))
	shake = maxf(shake, 0.18)

func _wreck(at: Vector3) -> void:
	lives -= 1
	hud.set_lives(lives)
	state = "wreck"
	state_t = 0.0
	spin = (1.0 if randf() < 0.5 else -1.0) * 7.0
	Engine.time_scale = 0.35
	shake = 1.2
	FX.burst(self, at + Vector3(0, 0.8, 0), Color(1.0, 0.6, 0.2), 70, 16.0)
	FX.burst(self, at + Vector3(0, 0.8, 0), Color(0.9, 0.95, 1.0), 30, 9.0)
	Sfx.play("crash", 0.0)
	mult = 1.0
	combo = 0.0
	hud.banner("¡CHOQUE!", "Te quedan %d" % lives if lives > 0 else "Sin vidas", 1.2, UIKit.DANGER)

func _respawn() -> void:
	Engine.time_scale = 1.0
	var i := traffic.size() - 1
	while i >= 0:
		var t: Dictionary = traffic[i]
		if t["s"] > car.s - 30.0 and t["s"] < car.s + 140.0:
			t["node"].queue_free()
			traffic.remove_at(i)
		i -= 1
	for o in obstacles:
		if o["kind"] != "deco" and o["s"] > car.s - 10.0 and o["s"] < car.s + 80.0:
			o["node"].visible = false
			o["kind"] = "deco"
	var bestl: float = LANES[0]
	for l in LANES:
		if absf(l - car.x) < absf(bestl - car.x):
			bestl = l
	car.x = bestl
	car.vx = 0.0
	car.speed = maxf(car.speed, 32.0)
	spin = 0.0
	invuln = 2.6
	state = "run"
	hud.banner("¡DE VUELTA!", "", 0.8, UIKit.OK)

func _game_over() -> void:
	Engine.time_scale = 1.0
	state = "over"
	touch.release_all()
	var final_score := int(score)
	var record := final_score > best
	if record:
		Game.save["best_highway"] = final_score
	Game.save["coins"] = int(Game.save.get("coins", 0)) + final_score / 100
	Game.write_save()
	overlays.show_results("FIN DE LA RUTA", "Autopista %s · Nivel %d" % [PRESET_NAMES[preset][0].to_lower(), Game.current_level], [
		["Puntos", HUD._fmt(final_score)],
		["Distancia", "%.2f km" % (car.s / 1000.0)],
		["Rozones", str(close_calls)],
		["Velocidad máxima", "%d km/h" % int(top_speed)],
		["Récord", HUD._fmt(maxi(best, final_score))],
	], "NUEVO RÉCORD" if record else "", record)

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	var steer := Input.get_axis("steer_left", "steer_right")
	var braking := Input.is_action_pressed("brake")
	var want_nitro := Input.is_action_pressed("nitro")
	if Game.autopilot:
		var ap := _autopilot()
		steer = ap[0]
		want_nitro = ap[1]
	match state:
		"intro":
			if state_t > 2.0:
				state = "count"
				state_t = 0.0
		"count":
			var n := 3 - int(state_t / 0.7)
			if n > 0 and hud.banner_title.text != str(n):
				hud.banner(str(n), "", 0.45, Color.WHITE)
				Sfx.play("beep", -4.0)
			if state_t >= 2.1:
				state = "run"
				hud.banner("¡YA!", "", 0.6, UIKit.OK)
				Sfx.play("beep", -2.0, 1.6)
				car.speed = 12.0
		"run":
			car.step(dt, steer, braking, want_nitro)
			invuln = maxf(0.0, invuln - dt)
			score += car.speed * dt * 0.5 * mult
			combo = maxf(0.0, combo - dt / 4.0)
			if combo <= 0.0:
				mult = 1.0
			top_speed = maxf(top_speed, car.speed_kmh())
			if car.speed > car.max_speed * 0.97:
				max_speed_t += dt
				if max_speed_t > 6.0:
					max_speed_t = 0.0
					var pts := int(500 * mult)
					score += pts
					hud.popup("VELOCIDAD PUNTA", pts, UIKit.ACCENT)
			else:
				max_speed_t = 0.0
			if car.scraping != 0:
				shake = maxf(shake, 0.25)
			if braking and car.drift != 0.0 and absf(car.drift) > 0.6 and car.speed > 35.0:
				score += 40.0 * dt * mult
		"wreck":
			car.speed = move_toward(car.speed, 0.0, 55.0 * dt)
			car.s += car.speed * dt
			spin = move_toward(spin, 0.0, 6.0 * dt)
			if state_t > 0.75:
				if lives > 0:
					_respawn()
				else:
					_game_over()
		"over":
			car.speed = move_toward(car.speed, 0.0, 20.0 * dt)
			car.s += car.speed * dt
	_place_player(dt, steer if state == "run" else 0.0)
	_update_traffic(dt)
	_update_obstacles(dt)
	_check_collisions()
	world.update(car.s, cam.global_position)
	_update_camera(dt)
	_update_fx(dt)
	_update_hud()

## Piloto automático (pruebas y demo): elige el carril con más espacio libre.
func _autopilot() -> Array:
	var best_x := car.x
	var best_free := -1.0
	for lx in LANES:
		var free := 400.0
		for t in traffic:
			if absf(t["x"] - lx) < 2.3:
				var ds: float = t["s"] - car.s
				if ds > -4.0 and ds < free:
					free = ds
		for o in obstacles:
			if o["kind"] != "deco" and absf(o["x"] - lx) < 2.4:
				var ds2: float = o["s"] - car.s
				if ds2 > -3.0 and ds2 < free:
					free = ds2
		free -= absf(lx - car.x) * 2.0
		if free > best_free:
			best_free = free
			best_x = lx
	return [clampf((best_x - car.x) * 0.9, -1.0, 1.0), car.nitro > 30.0]

var _yaw_vis := 0.0
func _place_player(dt: float, steer: float) -> void:
	var fr := track.frame(car.s)
	_yaw_vis = lerpf(_yaw_vis, car.yaw(), clampf(dt * 10.0, 0.0, 1.0))
	if state == "wreck" or (state == "over" and lives <= 0):
		_yaw_vis += spin * dt
	var b := fr.basis.rotated(fr.basis.y, _yaw_vis)
	var roll := clampf(-car.vx * 0.012, -0.08, 0.08)
	b = b * Basis(Vector3(0, 0, 1), roll)
	var pitch := -0.015 if car.nitro_on else 0.0
	b = b * Basis(Vector3(1, 0, 0), pitch)
	car_vis.global_transform = Transform3D(b, fr.origin + fr.basis.x * car.x)
	car_vis.nitro_on = car.nitro_on and state == "run"
	car_vis.brake_on = Input.is_action_pressed("brake") and state == "run"
	car_vis.update_visual(dt, car.speed, steer)
	if invuln > 0.0:
		car_vis.visible = fmod(invuln, 0.24) > 0.08
	else:
		car_vis.visible = true

func _update_camera(dt: float) -> void:
	var fr := track.frame(car.s)
	cam_yaw = lerpf(cam_yaw, _yaw_vis * 0.35, clampf(dt * 4.0, 0.0, 1.0))
	var want_dist := 6.2 + car.speed * 0.012 + (0.9 if car.nitro_on else 0.0)
	cam_dist = lerpf(cam_dist, want_dist, clampf(dt * 2.5, 0.0, 1.0))
	var b := fr.basis.rotated(fr.basis.y, cam_yaw)
	var car_pos := car_vis.global_position
	var pos := car_pos + b.z * cam_dist + b.y * (2.0 + car.speed * 0.004)
	var look := car_pos - b.z * 8.0 + b.y * 0.9
	if state == "wreck":
		pos = car_pos + b.z * 8.5 + b.y * 3.2 + b.x * 2.5
	if OS.get_environment("CAMDBG") == "1":
		pos = car_pos + b.z * 14.0 + b.y * 9.0 + b.x * 6.0
		look = car_pos - b.z * 12.0
	cam.global_position = pos
	cam.look_at(look, fr.basis.y)
	cam.rotate_object_local(Vector3(0, 0, 1), clampf(-car.vx * 0.004, -0.04, 0.04))
	shake = maxf(0.0, shake - dt * 1.8)
	var sh := shake * shake
	cam.h_offset = randf_range(-1, 1) * sh * 0.25
	cam.v_offset = randf_range(-1, 1) * sh * 0.18
	var target_fov := 62.0 + clampf(car.speed - 20.0, 0.0, 80.0) * 0.17 + (7.0 if car.nitro_on else 0.0)
	cam.fov = lerpf(cam.fov, target_fov, clampf(dt * 3.0, 0.0, 1.0))

func _update_fx(dt: float) -> void:
	sparks_l.emitting = car.scraping < 0 and state == "run"
	sparks_r.emitting = car.scraping > 0 and state == "run"
	smoke.emitting = (absf(car.drift) > 0.4 and car.speed > 25.0) or state == "wreck"
	speed_lines.emitting = car.speed > 62.0 or car.nitro_on
	var tail_y := 0.75
	for i in trails.size():
		var tr: FX.Trail = trails[i]
		tr.active = car.nitro_on and state == "run"
		var p := car_vis.global_transform * Vector3(-0.7 if i == 0 else 0.7, tail_y, car_vis.length * 0.5 - 0.1)
		tr.push(p, cam.global_position)
	if engine.stream:
		var top := car.nitro_speed
		var gears := 6.0
		var g := clampf(car.speed / top, 0.0, 0.999) * gears
		var frac: float = g - floor(g)
		engine.pitch_scale = 0.62 + frac * 0.75 + floor(g) * 0.05
		engine.volume_db = -9.0 + clampf(car.speed / top, 0.0, 1.0) * 5.0
	if wind.stream:
		wind.volume_db = lerpf(-40.0, -10.0, clampf(car.speed / 90.0, 0.0, 1.0))

func _update_hud() -> void:
	hud.set_score(int(score), maxi(best, int(score)))
	hud.set_mult(mult, combo)
	hud.set_distance("DISTANCIA", "%.2f km" % (car.s / 1000.0))
	hud.set_speed(car.speed_kmh(), car.nitro / 100.0, car.nitro_on)
	var ahead := ""
	for o in obstacles:
		if o["kind"] == "hard" and o["s"] - car.s > 0.0 and o["s"] - car.s < 160.0 and absf(o["x"] - car.x) < 2.2:
			ahead = "⚠ OBRAS EN TU CARRIL"
			break
	hud.warn(ahead)
