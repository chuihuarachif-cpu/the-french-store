extends Node3D
## MODO 2 — HISTORIA: Capítulo 1 "Costa del Sol". Carrera corta a 2 vueltas contra 7 rivales con IA.
## Estilo Asphalt: nitro, rampa de salto, pads de turbo, derribos y posiciones en vivo.

const TRACK_POINTS := [
	Vector3(0, 6, 260), Vector3(0, 7, 40), Vector3(30, 9, -110), Vector3(140, 15, -210),
	Vector3(300, 22, -220), Vector3(400, 19, -110), Vector3(410, 13, 40), Vector3(470, 6, 180),
	Vector3(450, 5, 330), Vector3(330, 5, 400), Vector3(180, 6, 380), Vector3(70, 6, 400)]
const LAPS := 2
const RIVALS := [
	{"name": "VEGA", "title": "La Sombra", "color": Color(0.05, 0.05, 0.06), "skill": 1.0},
	{"name": "KAITO", "color": Color(0.95, 0.95, 0.97), "skill": 0.97},
	{"name": "ROSSI", "color": Color(0.85, 0.65, 0.05), "skill": 0.95},
	{"name": "NADIA", "color": Color(0.55, 0.1, 0.75), "skill": 0.93},
	{"name": "BRENNER", "color": Color(0.1, 0.55, 0.3), "skill": 0.91},
	{"name": "OKAFOR", "color": Color(0.95, 0.45, 0.05), "skill": 0.89},
	{"name": "LUCÍA", "color": Color(0.1, 0.35, 0.9), "skill": 0.87},
]

var track: RaceTrack
var world: RaceWorld
var racers: Array = []  # {car: ArcadeCar, vis: CarVisual, name, ai: bool, skill, lane, finished, time, wreck, label}
var player: Dictionary
var cam: Camera3D
var hud: HUD
var touch: TouchControls
var overlays: Overlays
var minimap: Minimap
var state := "intro"
var state_t := 0.0
var race_time := 0.0
var lap_start := 0.0
var best_lap := 0.0
var takedowns := 0
var shake := 0.0
var cam_yaw := 0.0
var cam_dist := 6.4
var engine: AudioStreamPlayer
var sparks_l: CPUParticles3D
var sparks_r: CPUParticles3D
var smoke: CPUParticles3D
var trails: Array = []
var speed_lines: CPUParticles3D
var jump_s := 0.0
var finish_order: Array = []
var _intro_card: Control
var _last_lap := 1

func _ready() -> void:
	EnvFactory.build(self, "coast")
	track = RaceTrack.new(TRACK_POINTS)
	jump_s = track.nearest(TRACK_POINTS[6]).x - 120.0
	world = RaceWorld.new()
	add_child(world)
	world.build(track, TRACK_POINTS, jump_s)
	# Parrilla: 4 filas de 2; el jugador sale 6º
	var grid_order := [0, 1, 2, 3, 4, -1, 5, 6]
	for gi in grid_order.size():
		var idx: int = grid_order[gi]
		var c := ArcadeCar.new()
		c.s = -6.0 - int(gi / 2) * 9.0
		c.x = -3.2 if gi % 2 == 0 else 3.2
		c.x_min = -10.0
		c.x_max = 10.0
		c.nitro = 40.0
		var vis := CarVisual.new()
		add_child(vis)
		var r := {"car": c, "vis": vis, "ai": idx >= 0, "finished": false, "time": 0.0, "wreck": 0.0, "lane": randf_range(-4.0, 4.0), "nitro_t": 0.0, "grid": gi + 1}
		if idx >= 0:
			var rd: Dictionary = RIVALS[idx]
			vis.setup(rd["color"], false, true)
			r["name"] = rd["name"]
			r["skill"] = rd["skill"]
			c.max_speed = 70.0 * rd["skill"] + 2.0
			c.nitro_speed = 88.0 * rd["skill"] + 4.0
			var lbl := Label3D.new()
			lbl.text = rd["name"]
			lbl.font = UIKit.font("Orbitron-Bold")
			lbl.font_size = 40
			lbl.pixel_size = 0.0009
			lbl.fixed_size = true
			lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			lbl.no_depth_test = true
			lbl.modulate = Color(1, 1, 1, 0.85)
			lbl.outline_size = 12
			lbl.position = Vector3(0, 2.3, 0)
			vis.add_child(lbl)
			r["label"] = lbl
		else:
			vis.setup(Game.car_color(), false)
			r["name"] = "TÚ"
			r["skill"] = 1.0
			player = r
		r["yaw_vis"] = 0.0
		racers.append(r)
	cam = Camera3D.new()
	cam.far = 4000.0
	cam.near = 0.15
	cam.fov = 64.0
	add_child(cam)
	cam.make_current()
	speed_lines = FX.speed_lines()
	speed_lines.emitting = false
	cam.add_child(speed_lines)
	var pv: CarVisual = player["vis"]
	sparks_l = FX.sparks()
	sparks_r = FX.sparks()
	pv.add_child(sparks_l)
	pv.add_child(sparks_r)
	sparks_l.position = Vector3(-1.0, 0.35, 0.2)
	sparks_r.position = Vector3(1.0, 0.35, 0.2)
	smoke = FX.smoke()
	pv.add_child(smoke)
	smoke.position = Vector3(0, 0.3, 1.6)
	for i in 2:
		var tr := FX.Trail.new(Color(0.25, 0.6, 1.0), 0.05)
		add_child(tr)
		trails.append(tr)
	hud = HUD.new()
	add_child(hud)
	hud.set_title("TIEMPO")
	hud.lives_box.visible = false
	hud.mult_lbl.visible = false
	hud.combo_bar.visible = false
	touch = TouchControls.new(TouchControls.racing_layout())
	hud.root.add_child(touch)
	minimap = Minimap.new()
	minimap.setup(track.pos, Vector2(230, 190))
	UIKit.place(minimap, Vector2(1, 0), Vector2(-262, 150))
	hud.root.add_child(minimap)
	overlays = Overlays.new()
	add_child(overlays)
	hud.pause_pressed.connect(_pause)
	overlays.resume.connect(func(): get_tree().paused = false)
	overlays.restart.connect(func(): Game.start_mode("race"))
	overlays.quit_to_menu.connect(func(): Game.goto_menu())
	engine = Sfx.make_loop("engine_loop", -6.0)
	add_child(engine)
	if engine.stream:
		engine.play()
	Sfx.play_music("music_race")
	_show_intro()
	for r in racers:
		_place(r, 0.016)
	_update_camera(1.0)
	# Pruebas: avanzar la simulación N segundos (SKIP=n)
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	if skip > 0.0:
		_start_countdown()
	for i in int(skip / 0.05):
		_process(0.05)

func _show_intro() -> void:
	_intro_card = Control.new()
	_intro_card.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.root.add_child(_intro_card)
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.55)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_intro_card.add_child(dim)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.94), UIKit.WARN, 6)
	UIKit.place(card, Vector2(0.5, 0.5), Vector2(-360, -210))
	card.custom_minimum_size = Vector2(720, 0)
	_intro_card.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	card.add_child(v)
	v.add_child(UIKit.label("CAPÍTULO 1 · NIVEL %d" % Game.current_level, 18, "Orbitron-Bold", UIKit.WARN))
	v.add_child(UIKit.label("COSTA DEL SOL", 54, "Orbitron-Black", Color.WHITE))
	var t := UIKit.label("Tu primera carrera en la liga Apex. Dos vueltas al circuito costero contra 7 pilotos. Vega \"La Sombra\" es la campeona local: si la vences, la liga se fijará en ti.\n\nUsa el NITRO en las rectas, salta la rampa de la bajada y pasa por los pads azules. Choca de lado a los rivales para DERRIBARLOS.", 22, "Rajdhani-Bold", Color(0.82, 0.87, 0.95))
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size = Vector2(680, 0)
	v.add_child(t)
	var go := UIKit.button("¡A CORRER!")
	go.pressed.connect(_start_countdown)
	v.add_child(go)
	if Game.autopilot:
		_start_countdown.call_deferred()

func _start_countdown() -> void:
	if state != "intro":
		return
	_intro_card.queue_free()
	state = "count"
	state_t = 0.0

func _pause() -> void:
	if state == "done":
		return
	get_tree().paused = true
	touch.release_all()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()

# ------------------------------------------------------------------ IA
func _ai_drive(r: Dictionary, dt: float) -> Array:
	var c: ArcadeCar = r["car"]
	var look := 30.0 + c.speed * 0.9
	var k_max := 0.0
	var k_sign := 0.0
	for d in [look * 0.4, look * 0.7, look]:
		var k := track.curvature(c.s + d)
		if absf(k) > k_max:
			k_max = absf(k)
			k_sign = signf(k)
	var v_corner: float = sqrt(26.0 / maxf(k_max, 0.0004)) * (0.92 + 0.08 * r["skill"])
	var target_v := minf(c.max_speed, v_corner)
	# Goma elástica: se adaptan a la distancia con el jugador para mantener la carrera reñida
	var gap: float = c.s - player["car"].s
	var band := clampf(-gap / 120.0, -0.18, 0.12)
	target_v *= 1.0 + band
	var braking := c.speed > target_v + 4.0
	# Línea: por dentro en las curvas, carril propio en recta
	var tx: float = r["lane"] - k_sign * clampf(k_max * 300.0, 0.0, 4.5)
	for o in racers:
		if o == r:
			continue
		var oc: ArcadeCar = o["car"]
		var ds := oc.s - c.s
		if ds > 0.0 and ds < 18.0 and absf(oc.x - tx) < 2.6:
			tx = oc.x + (3.4 if oc.x < 0.0 else -3.4)
	tx = clampf(tx, -7.0, 7.0)
	var steer := clampf((tx - c.x) * 0.45 - c.vx * 0.06 + c.speed * c.speed * track.curvature(c.s) * 0.55 / (6.5 + c.speed * 0.075) * 0.9, -1.0, 1.0)
	r["nitro_t"] -= dt
	var want_nitro := false
	if k_max < 0.003 and c.nitro > 25.0 and r["nitro_t"] <= 0.0 and randf() < 0.01:
		r["nitro_t"] = randf_range(2.0, 3.5)
	if r["nitro_t"] > 0.0:
		want_nitro = true
	c.max_speed = 70.0 * r["skill"] + 2.0
	return [steer, braking and not want_nitro, want_nitro]

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	match state:
		"count":
			var n := 3 - int(state_t / 0.8)
			for i in world.start_lights.size():
				var on := state_t >= i * 0.48
				world.start_lights[i].material_override = MatLib.emissive(Color(1.0, 0.05, 0.03) if on else Color(0.25, 0.02, 0.02), 6.0 if on else 1.0)
			if n > 0 and hud.banner_title.text != str(n):
				hud.banner(str(n), "", 0.5, Color.WHITE)
				Sfx.play("beep", -4.0)
			if state_t >= 2.4:
				state = "race"
				state_t = 0.0
				for l in world.start_lights:
					l.material_override = MatLib.emissive(Color(0.1, 1.0, 0.3), 6.0)
				hud.banner("¡YA!", "", 0.6, UIKit.OK)
				Sfx.play("beep", -2.0, 1.6)
		"race", "done":
			if state == "race":
				race_time += dt
			for r in racers:
				_step_racer(r, dt)
			_collisions()
			_check_progress()
	for r in racers:
		_place(r, dt)
	_update_camera(dt)
	_update_fx(dt)
	_update_hud()

func _step_racer(r: Dictionary, dt: float) -> void:
	var c: ArcadeCar = r["car"]
	var steer := 0.0
	var braking := false
	var want_nitro := false
	if r["wreck"] > 0.0:
		r["wreck"] -= dt
		c.speed = move_toward(c.speed, 18.0, 30.0 * dt)
		c.step(dt, 0.0, false, false, track.curvature(c.s) * 0.2)
		return
	if r["ai"] or r["finished"] or Game.autopilot:
		var a := _ai_drive(r, dt)
		steer = a[0]
		braking = a[1]
		want_nitro = a[2]
		if r == player and Game.autopilot:
			want_nitro = c.nitro > 30.0 and absf(track.curvature(c.s + 60.0)) < 0.003
	else:
		steer = Input.get_axis("steer_left", "steer_right")
		braking = Input.is_action_pressed("brake")
		want_nitro = Input.is_action_pressed("nitro")
	var prev_s := c.s
	c.step(dt, steer, braking, want_nitro, track.curvature(c.s))
	c.nitro = minf(100.0, c.nitro + 1.5 * dt)
	r["steer"] = steer
	# Rampa
	var js := fposmod(c.s, track.length)
	var jp := fposmod(prev_s, track.length)
	if not c.airborne and jp < jump_s + 12.0 and js >= jump_s + 12.0 and absf(c.x) < 4.6:
		c.launch(c.speed * 0.2)
		if r == player:
			hud.popup("¡SALTO!", 300, UIKit.ACCENT)
			c.nitro = minf(100.0, c.nitro + 20.0)
			Sfx.play("whoosh", 0.0, 0.8)
	if c.landed:
		c.landed = false
		if r == player:
			shake = 0.6
			Sfx.play("thud", -2.0)
	# Pads de turbo
	for bs in world.boost_s:
		if jp < bs and js >= bs and absf(c.x) < 2.4:
			c.speed = minf(c.speed + 14.0, c.nitro_speed + 6.0)
			c.nitro = minf(100.0, c.nitro + 25.0)
			if r == player:
				hud.popup("TURBO", 0, UIKit.ACCENT)
				Sfx.play("nitro", -3.0)
				shake = 0.3
	if r == player and c.scraping != 0:
		shake = maxf(shake, 0.2)

func _collisions() -> void:
	for i in racers.size():
		for j in range(i + 1, racers.size()):
			var a: Dictionary = racers[i]
			var b: Dictionary = racers[j]
			var ca: ArcadeCar = a["car"]
			var cb: ArcadeCar = b["car"]
			var ds := cb.s - ca.s
			var dx := cb.x - ca.x
			if absf(ds) < 4.3 and absf(dx) < 1.9 and absf(ca.y - cb.y) < 1.0:
				var pen_x := 1.9 - absf(dx)
				var pen_s := 4.3 - absf(ds)
				var involves_player: bool = a == player or b == player
				if pen_x < pen_s:
					# Lateral: separar y posible derribo
					var rel := absf(ca.vx - cb.vx)
					ca.x -= signf(dx) * pen_x * 0.5
					cb.x += signf(dx) * pen_x * 0.5
					var tmp := ca.vx
					ca.vx = cb.vx * 0.6 - signf(dx) * 2.0
					cb.vx = tmp * 0.6 + signf(dx) * 2.0
					if involves_player:
						shake = 0.5
						var other: Dictionary = b if a == player else a
						var pc: ArcadeCar = player["car"]
						if (rel > 7.0 or pc.nitro_on) and other["wreck"] <= 0.0:
							_takedown(other)
						else:
							Sfx.play("scrape", -6.0)
							(sparks_r if (dx > 0) == (a == player) else sparks_l).emitting = true
				else:
					# Por alcance: el de atrás frena
					var back: ArcadeCar = ca if ds > 0.0 else cb
					var front: ArcadeCar = cb if ds > 0.0 else ca
					var back_r: Dictionary = a if ds > 0.0 else b
					var front_r: Dictionary = b if ds > 0.0 else a
					if back_r == player and (back.speed - front.speed > 12.0 or back.nitro_on) and front_r["wreck"] <= 0.0:
						_takedown(front_r)
					back.speed = minf(back.speed, front.speed * 0.95)
					back.s = front.s - 4.3 if ds > 0.0 else back.s
					if involves_player:
						shake = 0.4
						Sfx.play("thud", -6.0)

func _takedown(r: Dictionary) -> void:
	r["wreck"] = 2.6
	var c: ArcadeCar = r["car"]
	c.speed *= 0.35
	takedowns += 1
	var pc: ArcadeCar = player["car"]
	pc.nitro = 100.0
	hud.popup("¡DERRIBO! " + r["name"], 1000, UIKit.DANGER)
	Sfx.play("crash", -3.0)
	FX.burst(self, (r["vis"] as Node3D).global_position + Vector3(0, 0.8, 0), Color(1.0, 0.6, 0.2), 50, 14.0)
	shake = 0.9

func _check_progress() -> void:
	var total := track.length * LAPS
	for r in racers:
		var c: ArcadeCar = r["car"]
		if not r["finished"] and c.s >= total:
			r["finished"] = true
			r["time"] = race_time
			finish_order.append(r)
			if r == player:
				_player_finished()
	var lap := clampi(int(floor(player["car"].s / track.length)) + 1, 1, LAPS)
	if lap != _last_lap and state == "race":
		var lt := race_time - lap_start
		best_lap = lt if best_lap == 0.0 else minf(best_lap, lt)
		lap_start = race_time
		_last_lap = lap
		hud.banner("ÚLTIMA VUELTA", "Vuelta anterior %s" % Game.fmt_time(lt), 1.4, UIKit.WARN)

func _rank() -> Array:
	var arr := racers.duplicate()
	arr.sort_custom(func(a, b):
		if a["finished"] and b["finished"]:
			return a["time"] < b["time"]
		if a["finished"] != b["finished"]:
			return a["finished"]
		return a["car"].s > b["car"].s)
	return arr

func _player_finished() -> void:
	state = "done"
	var lt := race_time - lap_start
	best_lap = lt if best_lap == 0.0 else minf(best_lap, lt)
	var pos := _rank().find(player) + 1
	var stars := 3 if pos == 1 else (2 if pos <= 3 else (1 if pos <= 5 else 0))
	var prev_best := float(Game.save.get("best_race_time", 0))
	if pos == 1 and (prev_best == 0.0 or race_time < prev_best):
		Game.save["best_race_time"] = race_time
	Game.save["stars_race"] = maxi(int(Game.save.get("stars_race", 0)), stars)
	Game.save["coins"] = int(Game.save.get("coins", 0)) + [0, 500, 300, 200, 120, 80, 60, 40, 30][pos]
	Game.write_save()
	touch.release_all()
	Sfx.play("win" if pos <= 3 else "lose", -2.0)
	var title := "¡VICTORIA!" if pos == 1 else ("PODIO · %dº" % pos if pos <= 3 else "%dº LUGAR" % pos)
	var sub := "Has vencido a Vega \"La Sombra\". La liga Apex ya conoce tu nombre." if pos == 1 else "Vega \"La Sombra\" sigue invicta. Vuelve a intentarlo: usa el nitro en las rectas y los derribos."
	await get_tree().create_timer(1.6).timeout
	overlays.show_results(title, sub, [
		["Posición", "%d / %d" % [pos, racers.size()]],
		["Tiempo total", Game.fmt_time(race_time)],
		["Mejor vuelta", Game.fmt_time(best_lap)],
		["Derribos", str(takedowns)],
		["Estrellas", "★".repeat(stars) + "☆".repeat(3 - stars)],
	], "CAPÍTULO 1 COMPLETADO" if pos <= 3 else "", pos <= 3)

# ------------------------------------------------------------------ VISUAL
func _place(r: Dictionary, dt: float) -> void:
	var c: ArcadeCar = r["car"]
	var vis: CarVisual = r["vis"]
	var fr := track.frame(c.s)
	var yaw_target := c.yaw()
	if r["wreck"] > 0.0:
		yaw_target = sin(r["wreck"] * 5.0) * 0.9
	r["yaw_vis"] = lerpf(r["yaw_vis"], yaw_target, clampf(dt * 10.0, 0.0, 1.0))
	var b := fr.basis.rotated(fr.basis.y, r["yaw_vis"])
	b = b * Basis(Vector3(0, 0, 1), clampf(-c.vx * 0.012, -0.08, 0.08))
	if c.airborne:
		b = b * Basis(Vector3(1, 0, 0), clampf(c.vy * 0.02, -0.25, 0.25))
	vis.global_transform = Transform3D(b, fr.origin + fr.basis.x * c.x + fr.basis.y * c.y)
	vis.nitro_on = c.nitro_on
	vis.brake_on = r.get("steer", 0.0) != 0.0 and c.drift != 0.0
	vis.update_visual(dt, c.speed, r.get("steer", 0.0))
	if r.has("label"):
		var dcam := vis.global_position.distance_to(cam.global_position) if cam else 99.0
		(r["label"] as Label3D).visible = dcam > 14.0 and dcam < 260.0

func _update_camera(dt: float) -> void:
	var c: ArcadeCar = player["car"]
	var fr := track.frame(c.s)
	cam_yaw = lerpf(cam_yaw, player["yaw_vis"] * 0.35, clampf(dt * 4.0, 0.0, 1.0))
	var want_dist := 6.2 + c.speed * 0.012 + (0.9 if c.nitro_on else 0.0)
	cam_dist = lerpf(cam_dist, want_dist, clampf(dt * 2.5, 0.0, 1.0))
	var b := fr.basis.rotated(fr.basis.y, cam_yaw)
	var car_pos: Vector3 = (player["vis"] as Node3D).global_position - fr.basis.y * c.y * 0.6
	var pos := car_pos + b.z * cam_dist + b.y * (2.0 + c.speed * 0.004)
	var look := car_pos - b.z * 8.0 + b.y * 0.9
	if state == "intro":
		var a := state_t * 0.25
		pos = car_pos + b.z * (7.0 * cos(a)) + b.x * (7.0 * sin(a)) + b.y * 2.2
		look = car_pos + b.y * 0.6
	cam.global_position = pos
	cam.look_at(look, fr.basis.y)
	cam.rotate_object_local(Vector3(0, 0, 1), clampf(-c.vx * 0.004, -0.04, 0.04))
	shake = maxf(0.0, shake - dt * 1.8)
	var sh := shake * shake
	cam.h_offset = randf_range(-1, 1) * sh * 0.25
	cam.v_offset = randf_range(-1, 1) * sh * 0.18
	var target_fov := 62.0 + clampf(c.speed - 20.0, 0.0, 80.0) * 0.17 + (7.0 if c.nitro_on else 0.0)
	cam.fov = lerpf(cam.fov, target_fov, clampf(dt * 3.0, 0.0, 1.0))

func _update_fx(dt: float) -> void:
	var c: ArcadeCar = player["car"]
	sparks_l.emitting = c.scraping < 0
	sparks_r.emitting = c.scraping > 0
	smoke.emitting = absf(c.drift) > 0.4 and c.speed > 25.0
	speed_lines.emitting = c.speed > 62.0 or c.nitro_on
	var vis: CarVisual = player["vis"]
	for i in trails.size():
		var tr: FX.Trail = trails[i]
		tr.active = c.nitro_on
		tr.push(vis.global_transform * Vector3(-0.7 if i == 0 else 0.7, 0.75, vis.length * 0.5 - 0.1), cam.global_position)
	if engine.stream:
		var g := clampf(c.speed / c.nitro_speed, 0.0, 0.999) * 6.0
		engine.pitch_scale = 0.62 + (g - floor(g)) * 0.75 + floor(g) * 0.05
		engine.volume_db = -9.0 + clampf(c.speed / c.nitro_speed, 0.0, 1.0) * 5.0

func _update_hud() -> void:
	var c: ArcadeCar = player["car"]
	hud.score_lbl.text = Game.fmt_time(race_time)
	hud.best_lbl.text = "VUELTA %s" % Game.fmt_time(race_time - lap_start)
	var lap := clampi(int(floor(c.s / track.length)) + 1, 1, LAPS)
	hud.set_distance("VUELTA", "%d / %d" % [lap, LAPS])
	hud.set_speed(c.speed_kmh(), c.nitro / 100.0, c.nitro_on)
	var ranking := _rank()
	hud.set_position_rank(ranking.find(player) + 1, racers.size())
	var dots := []
	for r in racers:
		dots.append({"pos": (r["vis"] as Node3D).global_position, "color": UIKit.WARN if r == player else Color(1, 1, 1, 0.85), "size": 6.0 if r == player else 4.0})
	minimap.dots = dots
	var lead: Dictionary = ranking[0]
	if lead != player:
		var gap: float = lead["car"].s - c.s
		hud.set_extra("Líder: %s  +%d m" % [lead["name"], int(gap)])
	else:
		var second: Dictionary = ranking[1]
		hud.set_extra("Ventaja sobre %s: %d m" % [second["name"], int(c.s - second["car"].s)])
