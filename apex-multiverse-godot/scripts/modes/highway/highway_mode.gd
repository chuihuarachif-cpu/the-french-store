extends RoadMode
## MODO 1 — INFINITO: la autopista A1 rodea todo Fransterra (33 km con túnel, viaductos, costa y campo).
## Tráfico de autos, camiones, buses y motos. Rozones, nitro, obras viales y 3 vidas. Hora aleatoria.

var score := 0.0
var mult := 1.0
var combo := 0.0
var close_calls := 0
var top_speed := 0.0
var lives := 3
var invuln := 0.0
var dist := 0.0
var best := 0
var max_speed_t := 0.0
var obstacles: Array = []
var debris: Array = []
var next_work := 900.0

func _ready() -> void:
	Game.current_mode = "highway"
	var roll := randf()
	var p := "night" if roll < 0.35 else ("sunset" if roll < 0.6 else ("sunrise" if roll < 0.72 else "day"))
	var a1: RoadPath = World.road("A1 · Autopista Nacional")
	var start := randf_range(0.0, a1.length)
	if OS.get_environment("START_S") != "":
		start = float(OS.get_environment("START_S"))
	setup_world(a1, start, p)
	own_side_only = true
	car.x = 6.45
	car.speed = 0.0
	traffic.allow_oncoming = true
	traffic.obey_lights = false
	hud.set_title("PUNTOS")
	hud.set_lives(lives)
	best = int(Game.save.get("best_highway", 0))
	Sfx.play_music("music_drive")
	for i in 14:
		traffic.spawn(road_s(car.s + 70.0 + i * 36.0 + randf() * 20.0), 1)
	for i in 6:
		traffic.spawn(road_s(car.s + 90.0 + i * 100.0), -1)
	traffic.player_s = car.s
	hud.banner(PRESET_NAMES[preset], "AUTOPISTA A1 · %s" % World.dept_name(road.frame(car.s).origin.x, road.frame(car.s).origin.z), 1.8, UIKit.WARN if not night else UIKit.ACCENT)
	minimap.route = PackedVector3Array()
	place_player(0.016, 0.0)
	update_camera(1.0)
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	for i in int(skip / 0.05):
		_process(0.05)

# ------------------------------------------------------------------ OBRAS
func _spawn_workzone(s0: float) -> void:
	if road.is_tunnel(s0) or road.is_bridge(s0) or road.is_tunnel(s0 + 150.0):
		return
	var lanes: Array = road.lanes_at(s0)
	var li := randi() % lanes.size()
	var lx: float = lanes[li]
	var length := randf_range(70.0, 130.0)
	var side := -1.0 if li == lanes.size() - 1 else 1.0
	var near_edge := lx + side * 1.85
	var far_edge := lx - side * 1.85
	_obstacle(Props.arrow_board(), s0, lx, 1.7, 1.15, "hard", 0.0 if side < 0 else PI)
	for i in 9:
		var t := float(i) / 8.0
		_obstacle(Props.cone(), s0 - 55.0 + t * 52.0, lerpf(far_edge + side * 0.2, near_edge - side * 0.3, t), 0.3, 0.3, "cone")
	var s := s0 + 4.0
	while s < s0 + length:
		_obstacle(Props.work_barrier(), s, near_edge - side * 0.35, 0.95, 0.3, "hard")
		s += 2.05
	traffic.obstacles.append({"s": s0 + length * 0.5, "x": lx, "hl": length * 0.5, "hw": 1.9})

func _obstacle(mesh: Mesh, s: float, x: float, hl: float, hw: float, kind: String, yaw := 0.0) -> void:
	var n := MeshInstance3D.new()
	n.mesh = mesh
	add_child(n)
	s = road_s(s)
	var fr := road.frame(s)
	n.global_transform = Transform3D(fr.basis.rotated(fr.basis.y, yaw), fr.origin + fr.basis.x * x)
	obstacles.append({"node": n, "s": s, "x": x, "hl": hl, "hw": hw, "kind": kind})

func _update_obstacles(dt: float) -> void:
	if dist + 560.0 > next_work:
		_spawn_workzone(road_s(car.s + 560.0))
		var diff := clampf(dist / 15000.0, 0.0, 1.0)
		next_work += randf_range(lerpf(1000.0, 550.0, diff), lerpf(1500.0, 850.0, diff))
	var i := obstacles.size() - 1
	while i >= 0:
		var o: Dictionary = obstacles[i]
		if traffic._ds(o["s"], road_s(car.s)) < -60.0:
			o["node"].queue_free()
			obstacles.remove_at(i)
		i -= 1
	i = traffic.obstacles.size() - 1
	while i >= 0:
		if traffic._ds(traffic.obstacles[i]["s"], road_s(car.s)) < -200.0:
			traffic.obstacles.remove_at(i)
		i -= 1
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
func _check() -> void:
	if state != "run":
		return
	if invuln <= 0.0:
		var r := collide_traffic()
		if r == "crash":
			_wreck()
			return
		elif r == "takedown":
			score += 1500 * mult
			hud.popup("¡DERRIBO!", int(1500 * mult), UIKit.DANGER)
			car.nitro = 100.0
			shake = 0.8
		elif r == "scrape":
			hud.popup("¡ROCE!", 0, UIKit.DANGER)
			mult = 1.0
			combo = 0.0
	# rozones
	for t in traffic.cars:
		if t["dir"] < 0 or t["passed"]:
			continue
		var ds := traffic._ds(t["s"], road_s(car.s))
		if ds < -t["hl"]:
			t["passed"] = true
			var gap: float = absf(t["x"] - car.x) - (pvis.width * 0.5 + t["hw"])
			if gap < 1.15 and gap > -0.2 and car.speed > 30.0:
				_close_call(t, gap)
	for o in obstacles:
		if o["kind"] == "deco":
			continue
		var ds2 := traffic._ds(o["s"], road_s(car.s))
		if absf(ds2) > 6.0:
			continue
		if absf(ds2) < pvis.length * 0.5 + o["hl"] and absf(o["x"] - car.x) < pvis.width * 0.5 + o["hw"]:
			if o["kind"] == "cone":
				o["kind"] = "deco"
				debris.append({"node": o["node"], "vel": road.frame(road_s(car.s)).basis * Vector3(randf_range(-4, 4), 7.0, -car.speed * 0.7), "axis": Vector3(randf(), randf(), randf()).normalized(), "spin": randf_range(8, 16), "life": 1.6})
				o["s"] = -99999.0
				car.speed *= 0.97
				Sfx.play("cone", -4.0, randf_range(0.9, 1.2))
				score = maxf(0.0, score - 50.0)
				hud.popup("CONO", 0, UIKit.DANGER)
			elif invuln <= 0.0:
				_wreck()
				return

func _close_call(t: Dictionary, gap: float) -> void:
	close_calls += 1
	var big: bool = t["type"] in ["semi", "bus"]
	var base := 300.0 + (1.15 - gap) * 420.0
	if big:
		base *= 1.6
	if t["moto"]:
		base *= 1.3
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

func _wreck() -> void:
	lives -= 1
	hud.set_lives(lives)
	state = "wreck"
	state_t = 0.0
	spin = (1.0 if randf() < 0.5 else -1.0) * 7.0
	Engine.time_scale = 0.35
	shake = 1.2
	var p := pvis.global_position + Vector3(0, 0.8, 0)
	FX.burst(self, p, Color(1.0, 0.6, 0.2), 70, 16.0)
	Debris.spawn(self, p, paint, -road.frame(road_s(car.s)).basis.z * car.speed * 0.3, 12)
	Sfx.play("crash", 0.0)
	mult = 1.0
	combo = 0.0
	hud.banner("¡CHOQUE!", "Te quedan %d" % lives if lives > 0 else "Sin vidas", 1.2, UIKit.DANGER)

func _respawn() -> void:
	Engine.time_scale = 1.0
	traffic.clear_near(road_s(car.s), 30.0, 150.0)
	for o in obstacles:
		var ds := traffic._ds(o["s"], road_s(car.s))
		if o["kind"] != "deco" and ds > -10.0 and ds < 90.0:
			o["node"].visible = false
			o["kind"] = "deco"
	var lanes: Array = road.lanes_at(car.s)
	var bl: float = lanes[0]
	for l in lanes:
		if absf(l - car.x) < absf(bl - car.x):
			bl = l
	car.x = bl
	car.vx = 0.0
	car.speed = maxf(car.speed, 30.0)
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
	Game.add_coins(final_score / 80 + int(dist / 100.0))
	overlays.show_results("FIN DE LA RUTA", "Autopista A1 · %s" % PRESET_NAMES[preset].to_lower(), [
		["Puntos", HUD._fmt(final_score)],
		["Distancia", "%.2f km" % (dist / 1000.0)],
		["Rozones", str(close_calls)],
		["Velocidad máxima", "%d km/h" % int(top_speed)],
		["Monedas ganadas", "◆ %d" % (final_score / 80 + int(dist / 100.0))],
	], "NUEVO RÉCORD" if record else "", record)

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	read_input()
	var steer := steer_in
	var want_nitro := nitro_in
	if Game.autopilot:
		var ap := _autopilot()
		steer = ap[0]
		want_nitro = ap[1]
	match state:
		"intro":
			if state_t > 1.6:
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
				car.speed = 14.0
		"run":
			step_player(dt, steer, brake_in, want_nitro)
			dist += car.speed * dt
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
			if brake_in and absf(car.drift) > 0.6 and car.speed > 35.0:
				score += 40.0 * dt * mult
		"wreck":
			car.speed = move_toward(car.speed, 0.0, 55.0 * dt)
			car.s = road_s(car.s + car.speed * dt)
			spin = move_toward(spin, 0.0, 6.0 * dt)
			if state_t > 0.75:
				if lives > 0:
					_respawn()
				else:
					_game_over()
		"over":
			car.speed = move_toward(car.speed, 0.0, 20.0 * dt)
			car.s = road_s(car.s + car.speed * dt)
	traffic.player_s = road_s(car.s)
	traffic.player_x = car.x
	traffic.density = 1.0 + clampf(dist / 20000.0, 0.0, 0.6)
	traffic.update(dt)
	_update_obstacles(dt)
	_check()
	place_player(dt, steer if state == "run" else 0.0)
	if invuln > 0.0:
		pvis.visible = fmod(invuln, 0.24) > 0.08
	else:
		pvis.visible = true
	update_camera(dt)
	update_fx(dt)
	update_minimap()
	_update_hud()

func _autopilot() -> Array:
	var best_x := car.x
	var best_free := -1.0
	for lx in road.lanes_at(car.s):
		var free := 400.0
		for t in traffic.cars:
			if absf(t["x"] - lx) < 2.3:
				var ds := traffic._ds(t["s"], road_s(car.s))
				if ds > -4.0 and ds < free:
					free = ds
		for o in obstacles:
			if o["kind"] != "deco" and absf(o["x"] - lx) < 2.4:
				var ds2 := traffic._ds(o["s"], road_s(car.s))
				if ds2 > -3.0 and ds2 < free:
					free = ds2
		free -= absf(lx - car.x) * 2.0
		if free > best_free:
			best_free = free
			best_x = lx
	return [clampf((best_x - car.x) * 0.9, -1.0, 1.0), car.nitro > 30.0]

func _update_hud() -> void:
	hud.set_score(int(score), maxi(best, int(score)))
	hud.set_mult(mult, combo)
	hud.set_distance("DISTANCIA", "%.2f km" % (dist / 1000.0))
	hud.set_speed(car.speed_kmh(), car.nitro / 100.0, car.nitro_on)
	var ahead := ""
	for o in obstacles:
		var ds := traffic._ds(o["s"], road_s(car.s))
		if o["kind"] == "hard" and ds > 0.0 and ds < 160.0 and absf(o["x"] - car.x) < 2.2:
			ahead = "⚠ OBRAS EN TU CARRIL"
			break
	if road.is_tunnel(car.s + 120.0) and not road.is_tunnel(car.s):
		ahead = "TÚNEL"
	hud.warn(ahead)
