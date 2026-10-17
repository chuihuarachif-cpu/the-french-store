class_name RoadMode
extends Node3D
## Base de los modos sobre carretera (Infinito, Historia, Camiones): mundo por chunks, física en el carril,
## cámara, HUD, controles táctiles, efectos, sonido y tráfico.

const PRESET_NAMES := {"day": "DÍA", "sunset": "ATARDECER", "sunrise": "AMANECER", "night": "NOCHE"}

var road: RoadPath
var streamer: WorldStreamer
var env_info := {}
var preset := "day"
var night := false
var spec := {}
var paint := Color.RED
var car := ArcadeCar.new()
var pvis: VehicleVisual
var cam: Camera3D
var hud: HUD
var touch: TouchControls
var overlays: Overlays
var minimap: WorldMinimap
var traffic: TrafficSystem
var state := "intro"
var state_t := 0.0
var shake := 0.0
var cam_yaw := 0.0
var cam_dist := 6.4
var cam_mode := 0
var spin := 0.0
var yaw_vis := 0.0
var sparks_l: CPUParticles3D
var sparks_r: CPUParticles3D
var smoke: CPUParticles3D
var speed_lines: CPUParticles3D
var trails: Array = []
var engine: AudioStreamPlayer
var wind: AudioStreamPlayer
var own_side_only := true     # no invadir el sentido contrario (autopista con mediana)
var s_end := INF              # fin de la ruta (sprint / entrega)
var lap_mode := false
var _dept := -1
var _loading: Control
var steer_in := 0.0
var brake_in := false
var nitro_in := false
var is_moto := false
var is_truck := false

# ------------------------------------------------------------------ PREPARACIÓN
func setup_world(r: RoadPath, s_start: float, time_preset: String) -> void:
	road = r
	preset = time_preset
	if OS.get_environment("PRESET") != "":
		preset = OS.get_environment("PRESET")
	night = preset == "night"
	env_info = EnvFactory.build(self, preset)
	_tune_env()
	RenderingServer.global_shader_parameter_set("night", 1.0 if night else 0.0)
	RenderingServer.global_shader_parameter_set("wet", 0.55 if night else 0.0)
	var tm := TrafficFactory.mats()
	(tm["tail"] as StandardMaterial3D).emission_energy_multiplier = 4.5 if night else 1.3
	(tm["head"] as StandardMaterial3D).emission_energy_multiplier = 7.0 if night else 1.2
	streamer = WorldStreamer.new()
	streamer.exclude_road = r.id
	add_child(streamer)
	car.s = s_start
	var sel := Game.selected()
	spec = sel["spec"]
	paint = sel["color"]
	is_moto = spec.get("kind", "car") == "moto"
	is_truck = spec.get("kind", "car") == "truck"
	apply_stats(car, spec)
	pvis = VehicleVisual.new()
	add_child(pvis)
	pvis.setup(spec, paint)
	cam = Camera3D.new()
	cam.far = streamer.radius[2] + 600.0
	cam.near = 0.2
	cam.fov = 64.0
	add_child(cam)
	cam.make_current()
	speed_lines = FX.speed_lines()
	speed_lines.emitting = false
	cam.add_child(speed_lines)
	sparks_l = FX.sparks()
	sparks_r = FX.sparks()
	pvis.add_child(sparks_l)
	pvis.add_child(sparks_r)
	sparks_l.position = Vector3(-pvis.width * 0.5, 0.35, 0.2)
	sparks_r.position = Vector3(pvis.width * 0.5, 0.35, 0.2)
	smoke = FX.smoke()
	pvis.add_child(smoke)
	smoke.position = Vector3(0, 0.3, pvis.length * 0.35)
	if not is_truck:
		for i in 2:
			var tr := FX.Trail.new(Color(0.25, 0.6, 1.0), 0.05)
			add_child(tr)
			trails.append(tr)
	traffic = TrafficSystem.new()
	add_child(traffic)
	traffic.setup(r)
	traffic.night = night
	hud = HUD.new()
	add_child(hud)
	touch = TouchControls.new(touch_layout())
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
	overlays.restart.connect(func(): Engine.time_scale = 1.0; Game.start_mode(Game.current_mode, Game.current_level))
	overlays.quit_to_menu.connect(func(): Engine.time_scale = 1.0; Game.goto_menu())
	engine = Sfx.make_loop("truck_loop" if is_truck else "engine_loop", -6.0)
	add_child(engine)
	wind = Sfx.make_loop("wind_loop", -30.0)
	add_child(wind)
	if engine.stream:
		engine.play()
	if wind.stream:
		wind.play()
	if OS.get_environment("CAM") != "":
		cam_mode = int(OS.get_environment("CAM"))
	_show_loading()
	var fr := road.frame(car.s)
	streamer.prewarm(fr.origin, -fr.basis.z)
	_hide_loading()

func _tune_env() -> void:
	var env: Environment = env_info["env"]
	var sun: DirectionalLight3D = env_info["sun"]
	var q := Game.quality()
	env.fog_density *= 0.9
	if q == 0:
		env.fog_density = maxf(env.fog_density, 0.0021)
		sun.shadow_enabled = false
		env.glow_enabled = false
		env.adjustment_enabled = false
		env.sky.radiance_size = Sky.RADIANCE_SIZE_32
	else:
		sun.directional_shadow_max_distance = 60.0 if q == 1 else 110.0
		sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL if q == 1 else DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
		env.sky.radiance_size = Sky.RADIANCE_SIZE_64

## Estadísticas del catálogo (1..10) -> física arcade.
static func apply_stats(c: ArcadeCar, v: Dictionary) -> void:
	var k: String = v.get("kind", "car")
	if k == "truck":
		c.max_speed = 20.0 + float(v["speed"]) * 1.6
		c.nitro_speed = c.max_speed * 1.18
		c.accel = 2.6 + float(v["accel"]) * 0.45
		c.brake_decel = 9.0
		c.grip = 2.6 + float(v["handling"]) * 0.25
		c.steer_rate = 6.0
	else:
		c.max_speed = 50.0 + float(v["speed"]) * 4.0
		c.nitro_speed = c.max_speed * 1.28
		c.accel = 9.0 + float(v["accel"]) * 1.5
		c.grip = 5.0 + float(v["handling"]) * 0.55
		c.brake_decel = 30.0 + float(v["handling"]) * 1.2
		if k == "moto":
			c.grip += 1.5
	c.nitro = 40.0 + float(v["nitro"]) * 4.0

func touch_layout() -> Array:
	var l := TouchControls.racing_layout()
	l.append({"action": "camera", "text": "CAM", "anchor": Vector2(1, 1), "offset": Vector2(-470, -70), "radius": 40.0, "color": Color(1, 1, 1), "font_size": 14})
	return l

func _show_loading() -> void:
	_loading = ColorRect.new()
	(_loading as ColorRect).color = Color(0.01, 0.015, 0.03)
	_loading.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hud.root.add_child(_loading)
	var l := UIKit.label("CARGANDO FRANSTERRA…", 30, "Orbitron-Black", UIKit.ACCENT, HORIZONTAL_ALIGNMENT_CENTER)
	l.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	l.position -= Vector2(300, 20)
	l.custom_minimum_size = Vector2(600, 0)
	_loading.add_child(l)

func _hide_loading() -> void:
	if _loading:
		var tw := _loading.create_tween()
		tw.tween_property(_loading, "modulate:a", 0.0, 0.5)
		tw.tween_callback(_loading.queue_free)

func _pause() -> void:
	if state == "over" or state == "done":
		return
	get_tree().paused = true
	touch.release_all()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()
	if event.is_action_pressed("camera"):
		cam_mode = (cam_mode + 1) % 3

func read_input() -> void:
	steer_in = Input.get_axis("steer_left", "steer_right")
	brake_in = Input.is_action_pressed("brake")
	nitro_in = Input.is_action_pressed("nitro")
	if Input.is_action_just_pressed("camera"):
		cam_mode = (cam_mode + 1) % 3

# ------------------------------------------------------------------ LÍMITES DE LA CALZADA
func x_limits(s: float) -> Vector2:
	var k := road.kind_at(s)
	var E: float = ChunkBuilder.ROAD_E.get(k, 5.0)
	var m := 0.9 if not is_truck else 1.4
	if own_side_only and k == "highway":
		return Vector2(1.2, E - m)
	if own_side_only and is_truck:
		return Vector2(-E + m, E - m)
	return Vector2(-E + m, E - m)

func step_player(dt: float, steer: float, braking: bool, want_nitro: bool) -> void:
	var lim := x_limits(car.s)
	car.x_min = lim.x
	car.x_max = lim.y
	var was := car.nitro_on
	car.step(dt, steer, braking, want_nitro, road.curvature(car.s) if absf(road.curvature(car.s)) > 0.0006 else 0.0)
	if road.closed:
		car.s = road.clamp_s(car.s) if not lap_mode else car.s
	if car.nitro_on and not was:
		Sfx.play("nitro", -3.0)
		shake = maxf(shake, 0.3)
	if car.scraping != 0:
		shake = maxf(shake, 0.25)

func road_s(s: float) -> float:
	return road.clamp_s(s) if road.closed else s

# ------------------------------------------------------------------ VISUAL / CÁMARA
func place_player(dt: float, steer: float) -> void:
	var fr := road.frame(road_s(car.s))
	yaw_vis = lerpf(yaw_vis, car.yaw(), clampf(dt * 10.0, 0.0, 1.0))
	if state == "wreck":
		yaw_vis += spin * dt
	var b := fr.basis.rotated(fr.basis.y, yaw_vis)
	b = b * Basis(Vector3(0, 0, 1), clampf(-car.vx * 0.012, -0.08, 0.08) if not is_moto else 0.0)
	if car.airborne:
		b = b * Basis(Vector3(1, 0, 0), clampf(car.vy * 0.02, -0.25, 0.25))
	pvis.global_transform = Transform3D(b, fr.origin + fr.basis.x * car.x + fr.basis.y * car.y)
	pvis.nitro_on = car.nitro_on and state == "run"
	pvis.brake_on = brake_in and state == "run"
	pvis.update_visual(dt, car.speed, steer)
	if is_truck:
		# el remolque sigue la curva con retraso
		var k := road.curvature(road_s(car.s - 6.0))
		pvis.set_trailer_yaw(clampf(k * pvis.trailer_len * 1.1 + yaw_vis * -0.6, -0.5, 0.5))

func update_camera(dt: float) -> void:
	var fr := road.frame(road_s(car.s))
	cam_yaw = lerpf(cam_yaw, yaw_vis * 0.35, clampf(dt * 4.0, 0.0, 1.0))
	var base_d := 6.2 if not is_truck else 9.0 + pvis.trailer_len + 4.0
	if is_moto:
		base_d = 4.6
	if cam_mode == 1:
		base_d *= 1.6
	var want_dist := base_d + car.speed * 0.012 + (0.9 if car.nitro_on else 0.0)
	cam_dist = lerpf(cam_dist, want_dist, clampf(dt * 2.5, 0.0, 1.0))
	var b := fr.basis.rotated(fr.basis.y, cam_yaw)
	var cp := pvis.global_position
	var hgt := (2.0 if not is_truck else 6.8) + car.speed * 0.004
	if is_moto:
		hgt = 1.7
	if cam_mode == 1:
		hgt *= 1.5
	var pos := cp + b.z * cam_dist + b.y * hgt
	var look := cp - b.z * 8.0 + b.y * (0.9 if not is_truck else 2.2)
	if cam_mode == 2:
		# cámara interior / capó (como en los videos de motos y camiones)
		var pb := pvis.global_transform.basis
		var eye := Vector3(0, pvis.height * 0.78, -pvis.length * 0.12) if not is_truck else Vector3(-0.5, 3.2, -4.6)
		if is_moto:
			eye = Vector3(0, 1.3, -0.42)
		pos = pvis.global_transform * eye
		look = pos - pb.z * 20.0 + pb.y * -0.6
		if is_moto:
			b = pb
	if state == "wreck":
		pos = cp + b.z * 9.0 + b.y * 3.6 + b.x * 2.5
	cam.global_position = pos
	cam.look_at(look, fr.basis.y if cam_mode != 2 or not is_moto else (pvis.body.global_transform.basis.y))
	if cam_mode != 2:
		cam.rotate_object_local(Vector3(0, 0, 1), clampf(-car.vx * 0.004, -0.04, 0.04))
	shake = maxf(0.0, shake - dt * 1.8)
	var sh := shake * shake
	cam.h_offset = randf_range(-1, 1) * sh * 0.25
	cam.v_offset = randf_range(-1, 1) * sh * 0.18
	var target_fov := 62.0 + clampf(car.speed - 20.0, 0.0, 80.0) * 0.17 + (7.0 if car.nitro_on else 0.0)
	if is_truck:
		target_fov = 60.0 + car.speed * 0.2
	cam.fov = lerpf(cam.fov, target_fov, clampf(dt * 3.0, 0.0, 1.0))
	streamer.focus = cam.global_position
	streamer.focus_dir = -cam.global_transform.basis.z

func update_fx(dt: float) -> void:
	sparks_l.emitting = car.scraping < 0 and state == "run"
	sparks_r.emitting = car.scraping > 0 and state == "run"
	smoke.emitting = (absf(car.drift) > 0.4 and car.speed > 25.0) or state == "wreck"
	speed_lines.emitting = (car.speed > 62.0 or car.nitro_on) and cam_mode != 2
	for i in trails.size():
		var tr: FX.Trail = trails[i]
		tr.active = car.nitro_on and state == "run"
		tr.push(pvis.global_transform * Vector3(-0.6 if i == 0 else 0.6, 0.7, pvis.length * 0.5 - 0.1), cam.global_position)
	if engine.stream:
		var top := car.nitro_speed
		var gears := 6.0 if not is_truck else 10.0
		var g := clampf(car.speed / top, 0.0, 0.999) * gears
		engine.pitch_scale = (0.62 + (g - floor(g)) * 0.75 + floor(g) * 0.05) * (1.25 if is_moto else 1.0)
		engine.volume_db = -9.0 + clampf(car.speed / top, 0.0, 1.0) * 5.0
	if wind.stream:
		wind.volume_db = lerpf(-40.0, -10.0, clampf(car.speed / 90.0, 0.0, 1.0))

func update_minimap() -> void:
	var fr := road.frame(road_s(car.s))
	minimap.center = fr.origin
	var f := -fr.basis.z
	minimap.heading = atan2(f.x, -f.z)
	# Departamento actual
	var di: int = World.dept_index(fr.origin.x, fr.origin.z)
	if di != _dept:
		if _dept >= 0 and state == "run":
			var d: Dictionary = World.departments[di]
			hud.popup("%s · %s" % [d["name"].to_upper(), d["desc"]], 0, UIKit.ACCENT)
		_dept = di

## Choque contra el tráfico. Devuelve "" / "scrape" / "crash" / "takedown".
func collide_traffic() -> String:
	var res := ""
	var pl := pvis.length * 0.5 if not is_truck else 4.0
	var pw := pvis.width * 0.5
	for t in traffic.cars:
		var ds := traffic._ds(t["s"], road_s(car.s))
		var dx: float = t["x"] - car.x
		var lim_s: float = pl + t["hl"]
		var lim_x: float = pw + t["hw"] - 0.08
		if absf(ds) < lim_s and absf(dx) < lim_x and not t["hit"]:
			var pen_s := lim_s - absf(ds)
			var pen_x := lim_x - absf(dx)
			if pen_x > pen_s * 0.8 or absf(dx) < lim_x * 0.55:
				var closing: float = car.speed - t["speed"] * t["dir"]
				if ds > 0.0 and closing > 9.0:
					t["hit"] = true
					t["speed"] = 0.0
					_wreck_traffic(t)
					return "crash" if (not car.nitro_on or t["dir"] < 0 or t["type"] in ["semi", "bus"]) else "takedown"
				car.speed = minf(car.speed, t["speed"] * 0.92)
				shake = 0.4
			else:
				car.x -= signf(dx) * (pen_x + 0.05)
				car.vx = -signf(dx) * 4.0
				car.speed *= 0.95
				t["tx"] = t["x"] + signf(dx) * 0.4
				shake = 0.5
				(sparks_r if dx > 0 else sparks_l).emitting = true
				Sfx.play("scrape", -6.0, randf_range(0.9, 1.1))
				res = "scrape"
	return res

func _wreck_traffic(t: Dictionary) -> void:
	var n: Node3D = t["node"]
	FX.burst(self, n.global_position + Vector3(0, 1.0, 0), Color(1.0, 0.6, 0.2), 50, 14.0)
	Debris.spawn(self, n.global_position + Vector3(0, 1.0, 0), Color(0.5, 0.5, 0.55), -road.frame(road_s(car.s)).basis.z * car.speed * 0.4, 8)
	Sfx.play("crash", -2.0)
	t["spin_v"] = randf_range(-6.0, 6.0)
