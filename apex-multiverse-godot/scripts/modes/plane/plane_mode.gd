extends Node3D
## MODO 4 — AVIONES: despega del aeropuerto, del aeródromo o del portaaviones, vuela sobre todo Fransterra,
## derriba a los cazas enemigos con ametralladora y misiles, y aterriza con éxito en el destino.

const G := 9.8

var mission: Dictionary
var spec := {}
var paint := Color.GRAY
var streamer: WorldStreamer
var env_info := {}
var plane: VehicleVisual
var cam: Camera3D
var hud: HUD
var overlays: Overlays
var minimap: WorldMinimap
var stick: VirtualStick
var touch: TouchControls
var preset := "day"
# física
var pos := Vector3.ZERO
var pb := Basis.IDENTITY
var speed := 0.0
var throttle := 0.6
var vmax := 160.0
var vrot := 55.0
var vstall := 45.0
var pitch_k := 1.2
var roll_k := 2.4
var on_ground := true
var gear := true
var hp := 100.0
var boost := 100.0
var missiles := 6
var gun_heat := 0.0
var gun_cd := 0.0
var lock_t := 0.0
var lock_target = null
# misión
var state := "ready"   # ready, takeoff, fly, land, done
var state_t := 0.0
var enemies: Array = []
var bullets: Array = []
var rockets: Array = []
var kills := 0
var time := 0.0
var target := Vector3.ZERO
var start_kind := "airport"
var land_kind := "airport"
var catapult := false
var shake := 0.0
var cam_pos := Vector3.ZERO
var engine: AudioStreamPlayer
var is_prop := false
var _ground_y := 0.0
var _tracer_mesh: Mesh
var _enemy_spec: Dictionary
var land_frame := Transform3D.IDENTITY
var _assist_on := false
var _ap_turnin := false

func _ready() -> void:
	Game.current_mode = "plane"
	mission = Game.AIR_MISSIONS[clampi(Game.current_level, 0, Game.AIR_MISSIONS.size() - 1)]
	preset = mission["time"]
	if OS.get_environment("PRESET") != "":
		preset = OS.get_environment("PRESET")
	env_info = EnvFactory.build(self, preset)
	var env: Environment = env_info["env"]
	env.fog_density *= 0.45
	if Game.quality() == 0:
		(env_info["sun"] as DirectionalLight3D).shadow_enabled = false
		env.glow_enabled = false
		env.sky.radiance_size = Sky.RADIANCE_SIZE_32
	RenderingServer.global_shader_parameter_set("night", 1.0 if preset == "night" else 0.0)
	RenderingServer.global_shader_parameter_set("wet", 0.0)
	var sel := Game.selected("plane")
	spec = sel["spec"]
	paint = sel["color"]
	is_prop = spec["shape"] in ["highwing", "trainer", "warbird"]
	vmax = (60.0 + float(spec["speed"]) * 9.0) if is_prop else (120.0 + float(spec["speed"]) * 12.0)
	vrot = vmax * 0.36
	vstall = vmax * 0.28
	pitch_k = 0.7 + float(spec["handling"]) * 0.09
	roll_k = 1.5 + float(spec["handling"]) * 0.18
	missiles = 2 + int(spec["nitro"]) / 2
	streamer = WorldStreamer.new()
	add_child(streamer)
	streamer.set_air_mode(true)
	plane = VehicleVisual.new()
	add_child(plane)
	plane.setup(spec, paint)
	cam = Camera3D.new()
	cam.far = streamer.radius[2] + 1500.0
	cam.near = 0.5
	cam.fov = 66.0
	add_child(cam)
	cam.make_current()
	_build_hud()
	_setup_start()
	target = Vector3(mission["target"][0], 0, mission["target"][1])
	target.y = World.height(target.x, target.z)
	minimap.target = target
	minimap.view = 5000.0
	_enemy_spec = VehicleCatalog.list("plane")[(Game.current_level * 3 + 4) % 20]
	_tracer_mesh = _make_tracer()
	engine = Sfx.make_loop("engine_loop" if is_prop else "rocket_loop", -6.0)
	add_child(engine)
	if engine.stream:
		engine.play()
	Sfx.play_music("music_race")
	streamer.prewarm(pos, -pb.z)
	cam_pos = pos + pb.z * 22.0 + Vector3.UP * 6.0
	hud.banner(mission["name"].to_upper(), mission["desc"], 3.0, Color(0.65, 0.55, 1.0))
	if OS.get_environment("LANDTEST") != "":
		# prueba: empezar en la aproximación final
		var la: Dictionary = World.poi(land_kind) if land_kind != "carrier" else {}
		land_frame = WorldLandmarks.runway_frame(la, false) if land_kind != "carrier" else WorldLandmarks.carrier_frame()
		pos = land_frame * Vector3(float(OS.get_environment("LANDTEST")), 300, 4500)
		pb = Basis.looking_at(-land_frame.basis.z, Vector3.UP)
		speed = vrot * 1.6
		on_ground = false
		state = "land"
		kills = 1
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	for i in int(skip / 0.05):
		_process(0.05)

func _setup_start() -> void:
	start_kind = mission["start"]
	land_kind = mission["land"]
	var fr: Transform3D
	match start_kind:
		"carrier":
			fr = WorldLandmarks.carrier_frame()
			fr.origin += Vector3(6.0, 0.0, 140.0)
			catapult = true
		"airfield":
			fr = WorldLandmarks.runway_frame(World.poi("airfield"))
			fr.origin += -fr.basis.z * 30.0
		_:
			fr = WorldLandmarks.runway_frame(World.poi("airport"))
			fr.origin += -fr.basis.z * 40.0
	pb = fr.basis
	pos = fr.origin
	_ground_y = pos.y
	on_ground = true
	speed = 0.0

# ------------------------------------------------------------------ INTERFAZ
func _build_hud() -> void:
	hud = HUD.new()
	add_child(hud)
	hud.set_title("MISIÓN")
	hud.lives_box.visible = false
	hud.combo_bar.visible = false
	hud.mult_lbl.visible = false
	hud.gauge.label_nitro = "POSTQUEMADOR"
	stick = VirtualStick.new()
	stick.anchor_top = 0.35
	stick.anchor_bottom = 1.0
	stick.anchor_right = 0.42
	hud.root.add_child(stick)
	# controles según el ajuste: palanca (volante), flechas o inclinación
	var cm := Game.control_mode()
	stick.visible = cm == "wheel"
	var arrows: Array = []
	if cm != "wheel":
		arrows.append({"action": "pitch_down", "icon": "up", "anchor": Vector2(0, 1), "offset": Vector2(215, -300), "radius": 62.0, "color": UIKit.ACCENT})
		arrows.append({"action": "pitch_up", "icon": "down", "anchor": Vector2(0, 1), "offset": Vector2(215, -105), "radius": 62.0, "color": UIKit.ACCENT})
	if cm == "pedals":
		arrows.append({"action": "steer_left", "icon": "left", "anchor": Vector2(0, 1), "offset": Vector2(95, -200), "radius": 62.0, "color": UIKit.ACCENT})
		arrows.append({"action": "steer_right", "icon": "right", "anchor": Vector2(0, 1), "offset": Vector2(335, -200), "radius": 62.0, "color": UIKit.ACCENT})
	touch = TouchControls.new(arrows + [
		{"action": "fire", "text": "FUEGO", "anchor": Vector2(1, 1), "offset": Vector2(-130, -140), "radius": 86.0, "color": UIKit.DANGER, "font_size": 20},
		{"action": "missile", "text": "MISIL", "anchor": Vector2(1, 1), "offset": Vector2(-300, -95), "radius": 60.0, "color": UIKit.WARN, "font_size": 16},
		{"action": "nitro", "text": "TURBO", "anchor": Vector2(1, 1), "offset": Vector2(-120, -330), "radius": 54.0, "color": Color(0.35, 0.8, 1.0), "font_size": 14},
		{"action": "brake", "text": "FRENO", "anchor": Vector2(1, 1), "offset": Vector2(-290, -270), "radius": 50.0, "color": Color(1, 1, 1), "font_size": 13},
	])
	if cm == "tilt":
		touch.steer_widget = "tilt"
		touch.wheel_offset = Vector2(215, -200)
	hud.root.add_child(touch)
	minimap = WorldMinimap.new()
	minimap.anchor_left = 1.0
	minimap.anchor_right = 1.0
	minimap.offset_left = -214
	minimap.offset_top = 120
	hud.root.add_child(minimap)
	overlays = Overlays.new()
	add_child(overlays)
	hud.pause_pressed.connect(_pause)
	overlays.resume.connect(func(): get_tree().paused = false)
	overlays.restart.connect(func(): Game.start_mode("plane", Game.current_level))
	overlays.quit_to_menu.connect(func(): Game.goto_menu())

func _pause() -> void:
	if state == "done":
		return
	get_tree().paused = true
	touch.release_all()
	stick.release()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()

# ------------------------------------------------------------------ ENEMIGOS
func _spawn_enemies() -> void:
	for i in int(mission["enemies"]):
		var a := TAU * i / float(mission["enemies"])
		var p := target + Vector3(cos(a) * 900.0, 0, sin(a) * 900.0)
		p.y = maxf(World.height(p.x, p.z), 0.0) + randf_range(250.0, 450.0)
		var v := VehicleVisual.new()
		add_child(v)
		v.setup(_enemy_spec, Color(0.6, 0.12, 0.1) if i % 2 == 0 else Color(0.2, 0.22, 0.25), true)
		v.set_gear(false)
		var fwd := Vector3(-sin(a), 0, cos(a))
		var b := Basis.looking_at(fwd, Vector3.UP)
		enemies.append({"node": v, "pos": p, "pb": b, "speed": vmax * randf_range(0.7, 0.85), "hp": 100.0, "orbit": a, "cd": randf_range(1.0, 3.0), "jink": 0.0})

func _update_enemies(dt: float) -> void:
	var i := enemies.size() - 1
	while i >= 0:
		var e: Dictionary = enemies[i]
		var p: Vector3 = e["pos"]
		var b: Basis = e["pb"]
		var to_player := pos - p
		var dist := to_player.length()
		var desired: Vector3
		if dist < 1800.0 and state == "fly":
			# persecución con anticipación
			desired = (pos + (-pb.z) * speed * 0.8 - p).normalized()
			# si el jugador está detrás, maniobra evasiva
			if (-b.z).dot(to_player.normalized()) < -0.6:
				e["jink"] -= dt
				if e["jink"] <= 0.0:
					e["jink"] = randf_range(1.0, 2.0)
					e["jdir"] = Vector3(randf_range(-1, 1), randf_range(-0.4, 0.6), randf_range(-1, 1)).normalized()
				desired = (desired + e.get("jdir", Vector3.UP) * 1.4).normalized()
		else:
			e["orbit"] += dt * 0.12
			var op: Vector3 = target + Vector3(cos(e["orbit"]) * 900.0, 380.0, sin(e["orbit"]) * 900.0)
			desired = (op - p).normalized()
		var gy := maxf(World.height(p.x, p.z), 0.0)
		if p.y - gy < 160.0:
			desired = (desired + Vector3.UP * 1.5).normalized()
		var fwd := (-b.z).slerp(desired, clampf(dt * 0.9, 0.0, 1.0)).normalized()
		var bank := clampf((-b.z).cross(fwd).y * 25.0, -1.2, 1.2)
		var up := Vector3.UP.rotated(fwd, -bank)
		b = Basis.looking_at(fwd, up)
		p += fwd * e["speed"] * dt
		e["pos"] = p
		e["pb"] = b
		var n: VehicleVisual = e["node"]
		n.global_transform = Transform3D(b, p)
		n.update_visual(dt, e["speed"], 0.0)
		# disparo enemigo
		e["cd"] -= dt
		if state == "fly" and dist < 700.0 and (-b.z).dot(to_player / dist) > 0.96 and e["cd"] <= 0.0:
			e["cd"] = randf_range(0.12, 0.2)
			_fire_bullet(p - b.z * 8.0, -b.z, e["speed"], false)
		if e["hp"] <= 0.0:
			FX.burst(self, p, Color(1.0, 0.5, 0.15), 90, 30.0)
			Debris.spawn(self, p, n.paint, -b.z * e["speed"] * 0.5, 14)
			Sfx.play("explosion", -2.0)
			n.queue_free()
			enemies.remove_at(i)
			kills += 1
			hud.popup("¡DERRIBADO!", 500, UIKit.OK)
			if lock_target == e:
				lock_target = null
		i -= 1

# ------------------------------------------------------------------ ARMAS
func _make_tracer() -> Mesh:
	var bm := BoxMesh.new()
	bm.size = Vector3(0.12, 0.12, 6.0)
	bm.material = MatLib.emissive(Color(1.0, 0.8, 0.3), 6.0)
	return bm

func _fire_bullet(from: Vector3, dir: Vector3, base_speed: float, mine: bool) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = _tracer_mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	var d := (dir + Vector3(randf_range(-1, 1), randf_range(-1, 1), randf_range(-1, 1)) * 0.008).normalized()
	mi.global_transform = Transform3D(Basis.looking_at(d, Vector3.UP), from)
	bullets.append({"node": mi, "pos": from, "vel": d * (base_speed + 700.0), "life": 1.4, "mine": mine})

func _update_bullets(dt: float) -> void:
	var i := bullets.size() - 1
	while i >= 0:
		var b: Dictionary = bullets[i]
		var p0: Vector3 = b["pos"]
		var p1: Vector3 = p0 + b["vel"] * dt
		b["pos"] = p1
		b["life"] -= dt
		(b["node"] as Node3D).global_position = p1
		var hit := false
		if b["mine"]:
			for e in enemies:
				if _seg_hit(p0, p1, e["pos"], 7.0):
					e["hp"] -= 9.0
					hit = true
					FX.burst(self, e["pos"], Color(1.0, 0.8, 0.3), 8, 6.0)
					break
		elif _seg_hit(p0, p1, pos, 5.0):
			hp -= 3.0
			shake = 0.3
			hit = true
		if hit or b["life"] <= 0.0:
			b["node"].queue_free()
			bullets.remove_at(i)
		i -= 1

static func _seg_hit(a: Vector3, b: Vector3, c: Vector3, r: float) -> bool:
	var ab := b - a
	var t := clampf((c - a).dot(ab) / maxf(ab.length_squared(), 0.0001), 0.0, 1.0)
	return (a + ab * t).distance_to(c) < r

func _update_lock(dt: float) -> void:
	var best = null
	var best_a := 0.35
	for e in enemies:
		var to: Vector3 = e["pos"] - pos
		var d := to.length()
		if d > 2600.0:
			continue
		var a := (-pb.z).angle_to(to / d)
		if a < best_a:
			best_a = a
			best = e
	if best != lock_target:
		lock_target = best
		lock_t = 0.0
	elif best != null:
		lock_t += dt

func _fire_missile() -> void:
	if missiles <= 0:
		return
	missiles -= 1
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.12
	cm.bottom_radius = 0.15
	cm.height = 2.6
	cm.radial_segments = 8
	mi.mesh = cm
	mi.material_override = MatLib.color(Color(0.85, 0.85, 0.88), 0.4, 0.5)
	add_child(mi)
	var fl := FX.smoke(Color(0.9, 0.9, 0.95, 0.6))
	fl.amount = 30
	fl.lifetime = 0.8
	fl.emitting = true
	mi.add_child(fl)
	var tgt = lock_target if lock_t > 1.0 else null
	rockets.append({"node": mi, "pos": pos - pb.y * 1.2, "dir": -pb.z, "speed": speed + 60.0, "life": 7.0, "target": tgt})
	Sfx.play("whoosh", 0.0, 0.7)
	hud.popup("MISIL FIJADO" if tgt != null else "MISIL", 0, UIKit.WARN)

func _update_rockets(dt: float) -> void:
	var i := rockets.size() - 1
	while i >= 0:
		var r: Dictionary = rockets[i]
		r["speed"] = minf(r["speed"] + 200.0 * dt, vmax * 2.6)
		var t = r["target"]
		if t != null and enemies.has(t):
			var want: Vector3 = (t["pos"] - r["pos"]).normalized()
			r["dir"] = (r["dir"] as Vector3).slerp(want, clampf(dt * 4.0, 0.0, 1.0)).normalized()
		r["pos"] += r["dir"] * r["speed"] * dt
		r["life"] -= dt
		var n: Node3D = r["node"]
		n.global_transform = Transform3D(Basis.looking_at(r["dir"], Vector3.UP) * Basis(Vector3.RIGHT, PI * 0.5), r["pos"])
		var done = r["life"] <= 0.0 or r["pos"].y < World.height(r["pos"].x, r["pos"].z)
		for e in enemies:
			if (e["pos"] as Vector3).distance_to(r["pos"]) < 14.0:
				e["hp"] -= 120.0
				done = true
		if done:
			FX.burst(self, r["pos"], Color(1.0, 0.55, 0.15), 40, 18.0)
			n.queue_free()
			rockets.remove_at(i)
		i -= 1

# ------------------------------------------------------------------ VUELO
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	var roll_in := Input.get_axis("steer_left", "steer_right")
	var pitch_in := Input.get_action_strength("pitch_up") - Input.get_action_strength("pitch_down")
	var want_boost := Input.is_action_pressed("nitro") and boost > 1.0
	var airbrake := Input.is_action_pressed("brake")
	if Game.autopilot:
		var ap := _autopilot()
		roll_in = ap[0]
		pitch_in = ap[1]
	match state:
		"ready":
			if state_t > 2.0:
				state = "takeoff"
				state_t = 0.0
				hud.banner("¡DESPEGA!", "Acelera y tira de la palanca hacia ti" if not catapult else "¡CATAPULTA!", 1.6, UIKit.OK)
				if catapult:
					speed = vrot * 1.15
					Sfx.play("nitro", 0.0)
					shake = 0.8
		"takeoff", "fly", "land":
			time += dt
	if state != "ready" and state != "done":
		_flight(dt, roll_in, pitch_in, want_boost, airbrake)
	if state == "takeoff" and not on_ground and pos.y - _terrain_y(pos) > 60.0:
		state = "fly"
		gear = false
		plane.set_gear(false)
		_spawn_enemies()
		hud.banner("OBJETIVO", "Vuela hacia la zona marcada y derriba %d enemigos" % mission["enemies"], 2.4, UIKit.WARN)
	if state == "fly" and enemies.is_empty() and kills > 0:
		state = "land"
		if land_kind == "carrier":
			land_frame = WorldLandmarks.carrier_frame()
			land_frame.origin += Vector3(6.0, 0.0, 150.0)
		else:
			var la: Dictionary = World.poi(land_kind)
			land_frame = WorldLandmarks.runway_frame(la, pos.x > float(la["x"]))
		var ldst := _land_target()
		minimap.target = ldst
		hud.banner("ZONA DESPEJADA", "Ahora aterriza en %s" % {"airport": "el Aeropuerto Saint-Exupéry", "airfield": "el Aeródromo de Provence", "carrier": "el portaaviones"}[land_kind], 3.0, UIKit.OK)
	if state in ["fly", "land"]:
		var ap_fire: bool = Game.autopilot and lock_target != null and (-pb.z).angle_to((lock_target["pos"] - pos).normalized()) < 0.08 and pos.distance_to(lock_target["pos"]) < 900.0
		if (Input.is_action_pressed("fire") or ap_fire) and gun_heat < 1.0:
			gun_cd -= dt
			if gun_cd <= 0.0:
				gun_cd = 0.07
				gun_heat += 0.02
				for sx in [-1.2, 1.2]:
					_fire_bullet(pos + pb.x * sx - pb.z * 6.0, -pb.z, speed, true)
				Sfx.play("laser", -16.0, randf_range(1.6, 1.9))
		gun_heat = maxf(0.0, gun_heat - dt * 0.3)
		if Input.is_action_just_pressed("missile") or (Game.autopilot and lock_t > 1.2 and missiles > 0 and fmod(time, 3.0) < 0.02):
			_fire_missile()
		_update_lock(dt)
	_update_enemies(dt)
	_update_bullets(dt)
	_update_rockets(dt)
	if hp <= 0.0 and state != "done":
		_crash("Te derribaron")
	_place(dt, roll_in)
	_hud()

func _terrain_y(p: Vector3) -> float:
	return maxf(World.height(p.x, p.z), 0.0)

## Superficie bajo el avión: pista, cubierta del portaaviones o terreno. Devuelve [altura, es_pista].
func _surface(p: Vector3) -> Array:
	var cv := WorldLandmarks.carrier_frame()
	var lc := cv.affine_inverse() * p
	if lc.x > -10.0 and lc.x < 22.0 and absf(lc.z) < 165.0 and p.y > cv.origin.y - 6.0:
		return [cv.origin.y, true, "carrier"]
	for k in ["airport", "airfield"]:
		var a: Dictionary = World.poi(k)
		if absf(p.x - a["x"]) < a["len"] * 0.5 and absf(p.z - a["z"]) < a["w"] * 0.5 + 4.0:
			return [a["h"] + 0.6, true, k]
	var h := World.height(p.x, p.z)
	return [maxf(h, 0.0), false, "water" if h < 0.0 else "ground"]

func _flight(dt: float, roll_in: float, pitch_in: float, want_boost: bool, airbrake: bool) -> void:
	var thrust_target := 1.0 if not airbrake else 0.2
	if want_boost:
		boost = maxf(0.0, boost - 20.0 * dt)
	else:
		boost = minf(100.0, boost + 4.0 * dt)
	var assist := _landing_assist()
	if not assist.is_empty():
		thrust_target = 0.3
		speed = move_toward(speed, vstall * 1.45, 12.0 * dt)
	if on_ground and state == "land":
		thrust_target = 0.0
		speed = move_toward(speed, 0.0, 14.0 * dt)
	throttle = move_toward(throttle, thrust_target, dt * 0.6)
	var top := vmax * (1.3 if want_boost else 1.0) * throttle
	var fwd := -pb.z
	# aceleración: empuje - resistencia - componente de la gravedad
	var acc := (top - speed) * (0.12 if not want_boost else 0.3) - fwd.y * G * 0.9
	if airbrake:
		acc -= speed * 0.4
	speed = clampf(speed + acc * dt, 0.0, vmax * 1.45)
	var surf := _surface(pos)
	var gy: float = surf[0]
	if on_ground:
		# rodando: dirección con el timón, morro arriba al alcanzar la velocidad de rotación
		pb = pb.rotated(Vector3.UP, -roll_in * 0.5 * dt)
		var f2 := Vector3(-pb.z.x, 0, -pb.z.z).normalized()
		pb = Basis.looking_at(f2, Vector3.UP)
		pos += f2 * speed * dt
		pos.y = gy
		if speed > vrot and pitch_in > 0.2:
			on_ground = false
			pb = pb.rotated(pb.x, 0.12)
			Sfx.play("whoosh", -4.0, 0.6)
		elif not surf[1] and speed > 8.0:
			_crash("Te saliste de la pista")
		if state == "land" and speed < 4.0 and surf[1] and surf[2] == land_kind:
			_finish(true)
		return
	# en el aire: alabeo, cabeceo y viraje coordinado
	var roll := atan2(-pb.x.y, pb.y.y)
	var roll_rate := roll_in * roll_k
	if absf(roll_in) < 0.05:
		roll_rate = -roll * 1.2   # se nivela solo (fácil en móvil)
	pb = pb.rotated(pb.z.normalized(), -roll_rate * dt)
	var lift := clampf((speed - vstall) / (vrot - vstall), 0.0, 1.0)
	pb = pb.rotated(pb.x.normalized(), pitch_in * pitch_k * dt * (0.4 + 0.6 * lift))
	var turn := -sin(roll) * 0.9 * clampf(speed / vrot, 0.3, 1.5) * (G / maxf(speed, 30.0)) * 4.0
	pb = pb.rotated(Vector3.UP, turn * dt)
	if lift < 1.0:
		# pérdida: el morro cae
		pb = pb.rotated(pb.x.normalized(), -(1.0 - lift) * 0.6 * dt)
	if not assist.is_empty() and absf(roll_in) < 0.2 and absf(pitch_in) < 0.2:
		var want: Vector3 = assist["dir"]
		pb = pb.slerp(Basis.looking_at(want, Vector3.UP), clampf(dt * 1.8, 0.0, 1.0))
	pb = pb.orthonormalized()
	fwd = -pb.z
	pos += fwd * speed * dt + Vector3(0, -(1.0 - lift) * 9.0 * dt, 0)
	# límites del país
	var lim := World.half - 400.0
	if absf(pos.x) > lim or absf(pos.z) > lim:
		var back := (-Vector3(pos.x, 0, pos.z)).normalized()
		pb = Basis.looking_at(((-pb.z).slerp(back, dt * 0.8)).normalized(), Vector3.UP)
		hud.warn("⚠ FRONTERA DE FRANSTERRA · VUELVE")
	pos.y = minf(pos.y, 2400.0)
	gear = (pos.y - gy < 70.0 and speed < vrot * 1.8) or state == "land" and pos.y - gy < 120.0
	plane.set_gear(gear)
	var vs := fwd.y * speed - (1.0 - lift) * 9.0
	if pos.y <= gy + 0.3 and vs <= 0.5:
		var ok: bool = surf[1] and gear and vs > -7.0 and absf(roll) < 0.35 and fwd.y > -0.2 and (state != "land" or speed < vrot * 1.8)
		if ok and state == "land":
			on_ground = true
			pos.y = gy
			hud.banner("¡TOCASTE PISTA!", "Frena hasta detenerte", 1.6, UIKit.OK)
			Sfx.play("thud", -4.0)
			if surf[2] == "carrier":
				speed *= 0.35   # cable de frenado
			shake = 0.5
		elif ok:
			on_ground = true
			pos.y = gy
			pb = Basis.looking_at(Vector3(fwd.x, 0, fwd.z).normalized(), Vector3.UP)
		else:
			_crash("Te estrellaste" if surf[2] != "water" else "Caíste al agua")

## Asistente de aterrizaje: dirección deseada (alineación + senda de planeo de ~4°) cerca de la pista de destino.
func _landing_assist() -> Dictionary:
	if state != "land" or on_ground:
		return {}
	var rf := land_frame
	var lp := rf.affine_inverse() * pos
	if OS.get_environment("DBG") != "" and Engine.get_process_frames() % 60 == 0:
		print("LAND lp=", lp, " v=", speed, " agl=", pos.y - rf.origin.y, " on=", _assist_on, " fwd=", -pb.z)
	var aligned := (-pb.z).dot(-rf.basis.z) > 0.45
	if not _assist_on:
		if lp.z > 900.0 and lp.z < 5500.0 and absf(lp.x) < 2200.0 and pos.y - rf.origin.y < 700.0 and aligned:
			_assist_on = true
			hud.popup("ASISTENTE DE ATERRIZAJE", 0, UIKit.OK)
		else:
			return {}
	if lp.z < -400.0 or (-pb.z).dot(-rf.basis.z) < 0.0 or (lp.z < 250.0 and lp.y > 45.0):
		_assist_on = false
		_ap_turnin = false
		hud.banner("APROXIMACIÓN FALLIDA", "Demasiado alto o desalineado: da otra vuelta", 2.0, UIKit.WARN)
		return {}
	var aim := rf * Vector3(0, 0, minf(lp.z - maxf(180.0, lp.z * 0.22), -60.0))
	var flat := Vector3(aim.x - pos.x, 0, aim.z - pos.z).normalized()
	var glide_h := maxf(lp.z, 0.0) * 0.085 + 2.0
	var vy := clampf((glide_h - (pos.y - rf.origin.y)) * 0.012 - 0.05, -0.16, 0.06)
	vy *= clampf(1.0 - (absf(lp.x) - 60.0) / 300.0, 0.0, 1.0)   # baja solo cuando está alineado
	if lp.z < 60.0:
		vy = -0.035
	return {"dir": (flat + Vector3(0, vy, 0)).normalized()}

func _land_target() -> Vector3:
	match land_kind:
		"carrier":
			return WorldLandmarks.carrier_frame().origin
		"airfield":
			var a: Dictionary = World.poi("airfield")
			return Vector3(a["x"], a["h"], a["z"])
	var b: Dictionary = World.poi("airport")
	return Vector3(b["x"], b["h"], b["z"])

func _place(dt: float, roll_in: float) -> void:
	plane.global_transform = Transform3D(pb, pos)
	plane.nitro_on = Input.is_action_pressed("nitro") and boost > 1.0 and not on_ground
	plane.update_visual(dt, speed, roll_in)
	for f in plane.flames:
		f.visible = not is_prop and state != "ready" and state != "done"
		f.scale = Vector3(1, 1.5 + (2.0 if plane.nitro_on else 0.0) + randf() * 0.4, 1) * 1.6
	# cámara de persecución suave
	var want := pos + pb.z * (24.0 + speed * 0.04) + pb.y * 6.0
	if on_ground:
		want = pos + pb.z * 26.0 + Vector3.UP * 7.0
	cam_pos = cam_pos.lerp(want, clampf(dt * 5.0, 0.0, 1.0))
	var cy := _terrain_y(cam_pos) + 2.0
	cam_pos.y = maxf(cam_pos.y, cy)
	cam.global_position = cam_pos
	cam.look_at(pos - pb.z * 40.0 + pb.y * 2.0, pb.y.lerp(Vector3.UP, 0.4).normalized())
	shake = maxf(0.0, shake - dt * 1.5)
	cam.h_offset = randf_range(-1, 1) * shake * shake * 0.4
	cam.v_offset = randf_range(-1, 1) * shake * shake * 0.3
	cam.fov = lerpf(cam.fov, 62.0 + speed / vmax * 12.0 + (8.0 if plane.nitro_on else 0.0), dt * 3.0)
	streamer.focus = pos
	streamer.focus_dir = -pb.z
	if engine.stream:
		engine.pitch_scale = 0.7 + speed / vmax * 0.8
		engine.volume_db = -10.0 + throttle * 6.0

func _crash(why: String) -> void:
	print("CRASH ", why, " pos=", pos, " speed=", speed, " state=", state, " t=", time)
	if state == "done":
		return
	FX.burst(self, pos, Color(1.0, 0.5, 0.15), 120, 30.0)
	Debris.spawn(self, pos + Vector3(0, 2, 0), paint, -pb.z * speed * 0.3, 16)
	Sfx.play("explosion", 0.0)
	plane.visible = false
	speed = 0.0
	_finish(false, why)

func _finish(win: bool, why := "") -> void:
	if state == "done":
		return
	state = "done"
	touch.release_all()
	stick.release()
	var reward := 0
	var stars := 0
	if win:
		stars = 3 if hp > 70.0 else (2 if hp > 35.0 else 1)
		reward = 800 + kills * 300 + int(hp) * 5
		Game.complete_event("plane", Game.current_level, stars)
		Game.add_coins(reward)
		Sfx.play("win", -2.0)
	else:
		reward = kills * 150
		Game.add_coins(reward)
		Sfx.play("lose", -2.0)
	await get_tree().create_timer(1.5).timeout
	overlays.show_results("¡MISIÓN CUMPLIDA!" if win else "MISIÓN FALLIDA", mission["name"] if win else why, [
		["Enemigos derribados", "%d / %d" % [kills, mission["enemies"]]],
		["Tiempo", Game.fmt_time(time)],
		["Integridad", "%d%%" % int(maxf(hp, 0.0))],
		["Estrellas", "★".repeat(stars) + "☆".repeat(3 - stars)],
		["Monedas", "◆ %d" % reward],
	], "ATERRIZAJE PERFECTO" if win and stars == 3 else "", win)

func _hud() -> void:
	var agl := pos.y - _terrain_y(pos)
	hud.score_lbl.text = "%d/%d" % [kills, mission["enemies"]]
	hud.best_lbl.text = "INTEGRIDAD %d%% · MISILES %d" % [int(maxf(hp, 0.0)), missiles]
	hud.set_distance("ALTITUD", "%d m" % int(agl))
	hud.set_speed(speed * 3.6, boost / 100.0, plane.nitro_on)
	var dst := target if state != "land" else minimap.target
	hud.set_extra("%s · %.1f km" % [{"ready": "PREPARADO", "takeoff": "DESPEGUE", "fly": "COMBATE", "land": "ATERRIZAJE", "done": ""}[state], pos.distance_to(dst) / 1000.0])
	var warn := ""
	if lock_target != null and state in ["fly", "land"]:
		warn = "BLANCO FIJADO · DISPARA EL MISIL" if lock_t > 1.0 else "FIJANDO BLANCO…"
	if agl < 90.0 and not on_ground and state != "land" and state != "takeoff":
		warn = "⚠ ¡SUBE! TERRENO CERCA"
	if speed < vstall * 1.1 and not on_ground and state != "ready":
		warn = "⚠ PÉRDIDA · ACELERA"
	if state == "land" and not _landing_assist().is_empty():
		warn = "ASISTENTE DE ATERRIZAJE · SUELTA LA PALANCA"
	hud.warn(warn)
	minimap.center = pos
	var f := -pb.z
	minimap.heading = atan2(f.x, -f.z)
	var dots := []
	for e in enemies:
		dots.append({"pos": e["pos"], "color": Color(1, 0.25, 0.2), "size": 5.0})
	minimap.dots = dots

func _autopilot() -> Array:
	var tgt := target + Vector3(0, 400, 0)
	if not enemies.is_empty():
		tgt = enemies[0]["pos"]
	if state == "land":
		if not _landing_assist().is_empty():
			return [0.0, 0.0]
		var lpa := land_frame.affine_inverse() * pos
		if lpa.z > 5600.0 or _ap_turnin:
			_ap_turnin = true
			tgt = land_frame * Vector3(0, 200, 0)
		else:
			tgt = land_frame * Vector3(0, 380, 6000)
	var to := (tgt - pos).normalized()
	var local := pb.inverse() * to
	var fwd := -pb.z
	var want_climb := clampf(to.y, -0.25, 0.35)
	if pos.y - _terrain_y(pos) < 200.0:
		want_climb = 0.3
	var pitch := clampf((want_climb - fwd.y) * 4.0, -1.0, 1.0)
	if on_ground:
		pitch = 1.0 if speed > vrot else 0.0
	var agl := pos.y - _terrain_y(pos)
	var rl := clampf(local.x * 3.0, -1.0, 1.0)
	if local.z > 0.0:
		rl = 1.0 if local.x >= 0.0 else -1.0
	var roll_now := atan2(-pb.x.y, pb.y.y)
	rl = clampf(rl * 0.9 - roll_now * 0.0, -1.0, 1.0) if absf(roll_now) < 1.0 else -signf(roll_now)
	return [rl if agl > 90.0 else 0.0, pitch]
