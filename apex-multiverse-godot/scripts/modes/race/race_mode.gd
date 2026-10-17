extends RoadMode
## MODO 2 — HISTORIA: 10 carreras agresivas por las carreteras reales de Fransterra.
## Rivales que embisten, derribos con piezas volando, nitro por rozones y derrapes, posiciones en vivo.

const NAMES := ["VEGA", "DUBOIS", "MOREAU", "KAITO", "ROSSI", "NADIA", "LEFÈVRE", "OKAFOR", "BRENNER", "LUCÍA"]

var ev: Dictionary
var racers: Array = []   # {car, vis, name, ai, skill, finished, time, wreck, lane, nitro_t, aggro, yaw_vis, label, steer}
var player: Dictionary
var s_start := 0.0
var total := 0.0
var laps := 1
var race_time := 0.0
var takedowns := 0
var wrecked := 0
var damage := 0.0
var finish_order: Array = []
var _intro: Control
var _lap := 1

func _ready() -> void:
	Game.current_mode = "race"
	ev = Game.RACES[clampi(Game.current_level, 0, Game.RACES.size() - 1)]
	var r: RoadPath = World.road(ev["road"])
	laps = int(ev.get("laps", 0))
	s_start = float(ev.get("s0", 20.0))
	setup_world(r, s_start, ev["time"])
	lap_mode = laps > 0 and r.closed
	total = r.length * laps if lap_mode else float(ev.get("s1", r.length)) - s_start
	var with_traffic: bool = r.kind == "highway"
	own_side_only = with_traffic
	traffic.density = 0.7 if with_traffic else 0.0
	traffic.allow_oncoming = true
	traffic.obey_lights = false
	# parrilla: 2 por fila; el jugador sale en penúltima fila
	var n: int = ev["rivals"] + 1
	var player_slot := n - 2
	var pool := VehicleCatalog.list("race")
	var lanes := [-3.2, 3.2] if not own_side_only else [4.5, 9.0]
	var names := NAMES.duplicate()
	names.shuffle()
	var ai_i := 0
	for gi in n:
		var c := ArcadeCar.new()
		c.s = s_start + 6.0 + (n - 1 - gi) / 2 * 10.0
		c.x = lanes[gi % 2]
		var r_data := {"car": c, "finished": false, "time": 0.0, "wreck": 0.0, "lane": randf_range(-3.0, 3.0), "nitro_t": 0.0, "aggro": randf_range(0.4, 1.0), "yaw_vis": 0.0, "steer": 0.0, "grid": gi}
		if gi == player_slot:
			c.s = s_start + 6.0 + (n - 1 - gi) / 2 * 10.0
			car = c
			apply_stats(car, spec)
			r_data["ai"] = false
			r_data["vis"] = pvis
			r_data["name"] = "TÚ"
			r_data["skill"] = 1.0
			player = r_data
		else:
			var vs: Dictionary = pool[(ai_i * 3 + Game.current_level * 2 + 1) % pool.size()]
			ai_i += 1
			apply_stats(c, vs)
			var skill := 0.86 + 0.02 * Game.current_level + 0.1 * float(gi) / n + randf_range(-0.02, 0.02)
			c.max_speed *= skill
			c.nitro_speed *= skill
			var vis := VehicleVisual.new()
			add_child(vis)
			vis.setup(vs, VehicleCatalog.color_of(vs["colors"][randi() % vs["colors"].size()]), true)
			r_data["ai"] = true
			r_data["vis"] = vis
			r_data["skill"] = skill
			r_data["name"] = names[ai_i % names.size()]
			var lbl := Label3D.new()
			lbl.text = r_data["name"]
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
			r_data["label"] = lbl
		racers.append(r_data)
	hud.set_title("TIEMPO")
	hud.lives_box.visible = false
	hud.mult_lbl.visible = false
	hud.combo_bar.visible = false
	if lap_mode:
		minimap.set_route_from(road, 0.0, road.length)
	else:
		minimap.set_route_from(road, s_start, s_start + total)
	minimap.target = road.frame(road_s(s_start + total)).origin
	Sfx.play_music("music_race")
	_show_intro()
	for r2 in racers:
		_place(r2, 0.016)
	update_camera(1.0)
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	if skip > 0.0:
		_start()
	for i in int(skip / 0.05):
		_process(0.05)

func _show_intro() -> void:
	_intro = Control.new()
	_intro.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.root.add_child(_intro)
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.55)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_intro.add_child(dim)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.94), UIKit.WARN, 6)
	UIKit.place(card, Vector2(0.5, 0.5), Vector2(-380, -220))
	card.custom_minimum_size = Vector2(760, 0)
	_intro.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	card.add_child(v)
	v.add_child(UIKit.label("CARRERA %d · %s" % [Game.current_level + 1, ev["dept"].to_upper()], 18, "Orbitron-Bold", UIKit.WARN))
	v.add_child(UIKit.label(ev["name"].to_upper(), 46, "Orbitron-Black", Color.WHITE))
	var dist_txt := "%d vuelta%s · %.1f km" % [laps, "s" if laps > 1 else "", total / 1000.0] if lap_mode else "Sprint · %.1f km" % (total / 1000.0)
	var t := UIKit.label("%s\n%s · %d rivales\n\nNITRO: llénalo con rozones, derrapes y derribos. Embiste de lado a los rivales para DERRIBARLOS… ellos también lo harán contigo." % [ev["desc"], dist_txt, ev["rivals"]], 21, "Rajdhani-Bold", Color(0.82, 0.87, 0.95))
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size = Vector2(720, 0)
	v.add_child(t)
	var go := UIKit.button("¡A CORRER!")
	go.pressed.connect(_start)
	v.add_child(go)
	if Game.autopilot:
		_start.call_deferred()

func _start() -> void:
	if state != "intro":
		return
	if _intro:
		_intro.queue_free()
	state = "count"
	state_t = 0.0

# ------------------------------------------------------------------ IA AGRESIVA
func _ai(r: Dictionary, dt: float) -> Array:
	var c: ArcadeCar = r["car"]
	var look := 30.0 + c.speed * 0.9
	var k_max := 0.0
	var k_sign := 0.0
	for d in [look * 0.4, look * 0.7, look]:
		var k := road.curvature(road_s(c.s + d))
		if absf(k) > k_max:
			k_max = absf(k)
			k_sign = signf(k)
	var v_corner: float = sqrt(24.0 / maxf(k_max, 0.0004)) * (0.92 + 0.08 * r["skill"])
	var target_v := minf(c.max_speed, v_corner)
	# goma elástica: carrera siempre reñida
	var gap: float = c.s - player["car"].s
	target_v *= 1.0 + clampf(-gap / 140.0, -0.16, 0.14)
	var braking := c.speed > target_v + 4.0
	var lim := x_limits(road_s(c.s))
	var tx: float = clampf(r["lane"] - k_sign * clampf(k_max * 300.0, 0.0, 4.0), lim.x + 1.0, lim.y - 1.0)
	# agresividad: si el jugador va al lado, lo embiste
	var pc: ArcadeCar = player["car"]
	var dsp := pc.s - c.s
	if absf(dsp) < 7.0 and absf(pc.x - c.x) < 4.5 and r["aggro"] > 0.5 and r["wreck"] <= 0.0:
		tx = pc.x
	for o in racers:
		if o == r:
			continue
		var oc: ArcadeCar = o["car"]
		var ds := oc.s - c.s
		if ds > 0.0 and ds < 16.0 and absf(oc.x - tx) < 2.6 and o != player:
			tx = oc.x + (3.2 if oc.x < 0.0 else -3.2)
	for t in traffic.cars:
		var ds2 := traffic._ds(t["s"], road_s(c.s))
		if ds2 > 0.0 and ds2 < 40.0 and absf(t["x"] - tx) < 2.6:
			tx = t["x"] + (3.6 if t["x"] < (lim.x + lim.y) * 0.5 else -3.6)
	tx = clampf(tx, lim.x + 0.5, lim.y - 0.5)
	var steer := clampf((tx - c.x) * 0.45 - c.vx * 0.06 + c.speed * c.speed * road.curvature(road_s(c.s)) * 0.55 / (6.5 + c.speed * 0.075) * 0.9, -1.0, 1.0)
	r["nitro_t"] -= dt
	if k_max < 0.003 and c.nitro > 25.0 and r["nitro_t"] <= 0.0 and randf() < 0.012:
		r["nitro_t"] = randf_range(2.0, 3.5)
	return [steer, braking and r["nitro_t"] <= 0.0, r["nitro_t"] > 0.0]

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	read_input()
	match state:
		"intro":
			pass
		"count":
			var n := 3 - int(state_t / 0.8)
			if n > 0 and hud.banner_title.text != str(n):
				hud.banner(str(n), "", 0.5, Color.WHITE)
				Sfx.play("beep", -4.0)
			if state_t >= 2.4:
				state = "run"
				state_t = 0.0
				hud.banner("¡YA!", "", 0.6, UIKit.OK)
				Sfx.play("beep", -2.0, 1.6)
		"run", "done", "wreck":
			if state != "done":
				race_time += dt
			for r in racers:
				_step(r, dt)
			_collisions()
			_progress()
			if state == "wreck" and state_t > 1.4:
				_respawn_player()
	traffic.player_s = road_s(car.s)
	traffic.player_x = car.x
	if traffic.density > 0.0:
		traffic.update(dt)
		if state == "run":
			var r2 := collide_traffic()
			if r2 == "crash":
				_player_wreck("¡CHOCASTE CON EL TRÁFICO!")
			elif r2 == "takedown":
				takedowns += 1
				car.nitro = 100.0
				hud.popup("¡DERRIBO DE TRÁFICO!", 500, UIKit.DANGER)
	for r in racers:
		_place(r, dt)
	update_camera(dt)
	update_fx(dt)
	update_minimap()
	_hud()

func _step(r: Dictionary, dt: float) -> void:
	var c: ArcadeCar = r["car"]
	var steer := 0.0
	var braking := false
	var want_nitro := false
	if r["wreck"] > 0.0:
		r["wreck"] -= dt
		c.speed = move_toward(c.speed, 0.0, 40.0 * dt)
		c.s += c.speed * dt
		if r["wreck"] <= 0.0 and r != player:
			c.speed = 22.0
			c.x = clampf(c.x, x_limits(road_s(c.s)).x + 1.0, x_limits(road_s(c.s)).y - 1.0)
		return
	if r == player and state == "wreck":
		return
	if r["ai"] or r["finished"] or (r == player and Game.autopilot):
		var a := _ai(r, dt)
		steer = a[0]
		braking = a[1]
		want_nitro = a[2]
		if r == player and Game.autopilot:
			want_nitro = c.nitro > 30.0 and absf(road.curvature(road_s(c.s + 60.0))) < 0.003
	else:
		steer = steer_in
		braking = brake_in
		want_nitro = nitro_in
	if r == player:
		step_player(dt, steer, braking, want_nitro)
		if c.drift != 0.0 and absf(c.drift) > 0.5 and c.speed > 30.0:
			c.nitro = minf(100.0, c.nitro + 6.0 * dt)
	else:
		var lim := x_limits(road_s(c.s))
		c.x_min = lim.x
		c.x_max = lim.y
		c.step(dt, steer, braking, want_nitro, road.curvature(road_s(c.s)) if absf(road.curvature(road_s(c.s))) > 0.0006 else 0.0)
	c.nitro = minf(100.0, c.nitro + 1.2 * dt)
	r["steer"] = steer

func _collisions() -> void:
	for i in racers.size():
		for j in range(i + 1, racers.size()):
			var a: Dictionary = racers[i]
			var b: Dictionary = racers[j]
			if a["wreck"] > 0.0 or b["wreck"] > 0.0:
				continue
			var ca: ArcadeCar = a["car"]
			var cb: ArcadeCar = b["car"]
			var ds := cb.s - ca.s
			var dx := cb.x - ca.x
			if absf(ds) < 4.4 and absf(dx) < 1.95 and absf(ca.y - cb.y) < 1.0:
				var pen_x := 1.95 - absf(dx)
				var pen_s := 4.4 - absf(ds)
				var with_player: bool = a == player or b == player
				if pen_x < pen_s:
					var rel := absf(ca.vx - cb.vx)
					ca.x -= signf(dx) * pen_x * 0.5
					cb.x += signf(dx) * pen_x * 0.5
					var tmp := ca.vx
					ca.vx = cb.vx * 0.6 - signf(dx) * 2.5
					cb.vx = tmp * 0.6 + signf(dx) * 2.5
					if with_player:
						shake = 0.5
						var other: Dictionary = b if a == player else a
						var pc: ArcadeCar = player["car"]
						var oc: ArcadeCar = other["car"]
						var p_push := absf(pc.vx) + (6.0 if pc.nitro_on else 0.0)
						var o_push = absf(oc.vx) + (6.0 if oc.nitro_on else 0.0) + other["aggro"] * 2.0
						if rel > 6.5 or pc.nitro_on or oc.nitro_on:
							if p_push >= o_push:
								_takedown(other)
							elif damage > 60.0 or randf() < 0.35:
								_player_wreck("¡%s TE DERRIBÓ!" % other["name"])
							else:
								damage += 25.0
								hud.popup("¡GOLPE! DAÑO %d%%" % int(damage), 0, UIKit.DANGER)
								Sfx.play("crash", -8.0)
						else:
							Sfx.play("scrape", -6.0)
							(sparks_r if (dx > 0) == (a == player) else sparks_l).emitting = true
							damage += 2.0
					elif rel > 9.0 and randf() < 0.3:
						_ai_wreck(a if randf() < 0.5 else b)
				else:
					var back_r: Dictionary = a if ds > 0.0 else b
					var front_r: Dictionary = b if ds > 0.0 else a
					var back: ArcadeCar = back_r["car"]
					var front: ArcadeCar = front_r["car"]
					if back_r == player and (back.speed - front.speed > 11.0 or back.nitro_on):
						_takedown(front_r)
					elif front_r == player and (back.speed - front.speed > 14.0) and randf() < 0.5:
						_player_wreck("¡%s TE EMBISTIÓ!" % back_r["name"])
					back.speed = minf(back.speed, front.speed * 0.95)
					back.s = front.s - 4.4
					if with_player:
						shake = 0.4
						Sfx.play("thud", -6.0)

func _takedown(r: Dictionary) -> void:
	_ai_wreck(r)
	takedowns += 1
	car.nitro = 100.0
	hud.popup("¡DERRIBO! " + r["name"], 1000, UIKit.DANGER)
	shake = 0.9
	Engine.time_scale = 0.5
	get_tree().create_timer(0.25, true, false, true).timeout.connect(func(): Engine.time_scale = 1.0)

func _ai_wreck(r: Dictionary) -> void:
	if r == player:
		return
	r["wreck"] = 2.8
	var c: ArcadeCar = r["car"]
	c.speed *= 0.4
	var p: Vector3 = (r["vis"] as Node3D).global_position + Vector3(0, 0.8, 0)
	Sfx.play("crash", -3.0)
	FX.burst(self, p, Color(1.0, 0.6, 0.2), 50, 14.0)
	Debris.spawn(self, p, (r["vis"] as VehicleVisual).paint, -road.frame(road_s(c.s)).basis.z * c.speed, 10)

func _player_wreck(msg: String) -> void:
	if state != "run":
		return
	state = "wreck"
	state_t = 0.0
	wrecked += 1
	damage = 0.0
	spin = (1.0 if randf() < 0.5 else -1.0) * 7.0
	shake = 1.2
	Engine.time_scale = 0.4
	var p := pvis.global_position + Vector3(0, 0.8, 0)
	FX.burst(self, p, Color(1.0, 0.6, 0.2), 70, 16.0)
	Debris.spawn(self, p, paint, -road.frame(road_s(car.s)).basis.z * car.speed * 0.4, 14)
	Sfx.play("crash", 0.0)
	hud.banner("¡DESTROZADO!", msg, 1.3, UIKit.DANGER)

func _respawn_player() -> void:
	Engine.time_scale = 1.0
	state = "run"
	spin = 0.0
	yaw_vis = 0.0
	var lim := x_limits(road_s(car.s))
	car.x = clampf(car.x, lim.x + 1.0, lim.y - 1.0)
	car.vx = 0.0
	car.speed = 24.0
	traffic.clear_near(road_s(car.s), 20.0, 120.0)
	hud.banner("¡DE VUELTA!", "", 0.7, UIKit.OK)

func _progress() -> void:
	for r in racers:
		var c: ArcadeCar = r["car"]
		if not r["finished"] and c.s - s_start >= total:
			r["finished"] = true
			r["time"] = race_time
			finish_order.append(r)
			if r == player:
				_finished()
	if lap_mode and state == "run":
		var lap := clampi(int(floor((car.s - s_start) / road.length)) + 1, 1, laps)
		if lap != _lap:
			_lap = lap
			hud.banner("ÚLTIMA VUELTA" if lap == laps else "VUELTA %d" % lap, "", 1.4, UIKit.WARN)

func _rank() -> Array:
	var arr := racers.duplicate()
	arr.sort_custom(func(a, b):
		if a["finished"] and b["finished"]:
			return a["time"] < b["time"]
		if a["finished"] != b["finished"]:
			return a["finished"]
		return a["car"].s > b["car"].s)
	return arr

func _finished() -> void:
	state = "done"
	var pos := _rank().find(player) + 1
	var stars := 3 if pos == 1 else (2 if pos <= 2 else (1 if pos <= 3 else 0))
	var reward: int = [0, 1200, 800, 500, 250, 150, 100, 80, 60][mini(pos, 8)] + takedowns * 150
	Game.add_coins(reward)
	if pos <= 3:
		Game.complete_event("race", Game.current_level, stars)
	touch.release_all()
	Sfx.play("win" if pos <= 3 else "lose", -2.0)
	var title := "¡VICTORIA!" if pos == 1 else ("PODIO · %dº" % pos if pos <= 3 else "%dº LUGAR" % pos)
	await get_tree().create_timer(1.6).timeout
	overlays.show_results(title, ev["name"] + (" · Siguiente carrera desbloqueada" if pos <= 3 and Game.current_level < Game.RACES.size() - 1 else ""), [
		["Posición", "%d / %d" % [pos, racers.size()]],
		["Tiempo", Game.fmt_time(race_time)],
		["Derribos", str(takedowns)],
		["Veces destrozado", str(wrecked)],
		["Estrellas", "★".repeat(stars) + "☆".repeat(3 - stars)],
		["Monedas", "◆ %d" % reward],
	], "TERMINA EN EL PODIO PARA AVANZAR" if pos > 3 else "", pos <= 3)

# ------------------------------------------------------------------ VISUAL
func _place(r: Dictionary, dt: float) -> void:
	if r == player:
		place_player(dt, r.get("steer", 0.0) if state == "run" else 0.0)
		return
	var c: ArcadeCar = r["car"]
	var vis: VehicleVisual = r["vis"]
	var fr := road.frame(road_s(c.s))
	var yt := c.yaw()
	if r["wreck"] > 0.0:
		yt = sin(r["wreck"] * 5.0) * 1.2
	r["yaw_vis"] = lerpf(r["yaw_vis"], yt, clampf(dt * 10.0, 0.0, 1.0))
	var b := fr.basis.rotated(fr.basis.y, r["yaw_vis"])
	b = b * Basis(Vector3(0, 0, 1), clampf(-c.vx * 0.012, -0.08, 0.08))
	vis.global_transform = Transform3D(b, fr.origin + fr.basis.x * c.x + fr.basis.y * c.y)
	vis.nitro_on = c.nitro_on
	var dcam := vis.global_position.distance_to(cam.global_position)
	vis.visible = dcam < 900.0
	if vis.visible:
		vis.update_visual(dt, c.speed, r.get("steer", 0.0))
	if r.has("label"):
		(r["label"] as Label3D).visible = dcam > 14.0 and dcam < 260.0

func _hud() -> void:
	hud.score_lbl.text = Game.fmt_time(race_time)
	hud.best_lbl.text = "DAÑO %d%%" % int(damage)
	if lap_mode:
		hud.set_distance("VUELTA", "%d / %d" % [_lap, laps])
	else:
		hud.set_distance("META", "%.2f km" % maxf(0.0, (total - (car.s - s_start)) / 1000.0))
	hud.set_speed(car.speed_kmh(), car.nitro / 100.0, car.nitro_on)
	var ranking := _rank()
	hud.set_position_rank(ranking.find(player) + 1, racers.size())
	var dots := []
	for r in racers:
		if r != player:
			dots.append({"pos": (r["vis"] as Node3D).global_position, "color": Color(1, 0.3, 0.3), "size": 4.0})
	minimap.dots = dots
	var lead: Dictionary = ranking[0]
	if lead != player:
		hud.set_extra("Líder: %s  +%d m" % [lead["name"], int(lead["car"].s - car.s)])
	else:
		var second: Dictionary = ranking[1]
		hud.set_extra("Ventaja sobre %s: %d m" % [second["name"], int(car.s - second["car"].s)])
	hud.warn("TÚNEL" if road.is_tunnel(road_s(car.s + 100.0)) and not road.is_tunnel(road_s(car.s)) else "")
