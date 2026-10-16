extends Node3D
## MODO 3 — CAMIONES: lleva la carga por el tramo peligroso del Cañón del Río Bravo.
## Barro con baches que atrapan, cuesta con curvas cerradas, puente colgante y fauna/flora como rivales.

const ROUTE_POINTS := [
	Vector3(0, 10, 0), Vector3(0, 10, -120), Vector3(15, 9.5, -230), Vector3(-10, 10, -340),
	Vector3(-5, 15, -420), Vector3(30, 23, -468), Vector3(80, 29, -482), Vector3(90, 32.5, -506),
	Vector3(60, 36, -522), Vector3(12, 40, -530), Vector3(3, 42, -552), Vector3(26, 44, -578),
	Vector3(40, 45, -615), Vector3(40, 45, -705), Vector3(30, 42, -790), Vector3(-20, 36, -890),
	Vector3(-10, 32, -1000), Vector3(20, 30, -1080)]
const CRATES := 6

var route: TruckRoute
var world: TruckWorld
var truck: TruckVehicle
var cam: Camera3D
var hud: HUD
var touch: TouchControls
var overlays: Overlays
var crates: Array[RigidBody3D] = []
var crate_lost := []
var animals: Array = []
var trees: Array = []
var boulders: Array = []
var boulder_zone := 0.0
var boulder_t := 0.0
var state := "intro"
var state_t := 0.0
var time := 0.0
var s_prog := 0.0
var checkpoint := 0
var respawns := 0
var hits := 0
var boost_energy := 100.0
var boost_on := false
var engine: AudioStreamPlayer
var mud_fx: CPUParticles3D
var flipped_t := 0.0
var cam_pos := Vector3.ZERO
var score := 0

func _ready() -> void:
	EnvFactory.build(self, "canyon")
	route = TruckRoute.new(ROUTE_POINTS)
	world = TruckWorld.new()
	add_child(world)
	world.build(route, ROUTE_POINTS)
	truck = TruckVehicle.new()
	add_child(truck)
	var start_s: float = float(OS.get_environment("START_S")) if OS.get_environment("START_S") != "" else world.checkpoints[0]
	_place_truck(start_s)
	s_prog = start_s
	_spawn_crates()
	_spawn_fauna()
	_spawn_flora()
	mud_fx = FX.smoke(Color(0.35, 0.25, 0.15, 0.8))
	mud_fx.amount = 30
	truck.add_child(mud_fx)
	mud_fx.position = Vector3(0, 0.4, -3.6)
	cam = Camera3D.new()
	cam.far = 3000.0
	cam.fov = 60.0
	add_child(cam)
	cam.make_current()
	cam_pos = truck.global_transform * Vector3(0, 6, -14)
	hud = HUD.new()
	add_child(hud)
	hud.set_title("TIEMPO")
	hud.mult_lbl.visible = false
	hud.combo_bar.visible = false
	hud.gauge.max_speed = 80.0
	hud.gauge.label_nitro = "TRACCIÓN 6x6"
	hud.set_lives(CRATES, CRATES)
	touch = TouchControls.new([
		{"action": "steer_left", "icon": "left", "anchor": Vector2(0, 1), "offset": Vector2(120, -120), "radius": 82.0, "color": UIKit.ACCENT},
		{"action": "steer_right", "icon": "right", "anchor": Vector2(0, 1), "offset": Vector2(310, -120), "radius": 82.0, "color": UIKit.ACCENT},
		{"action": "accelerate", "icon": "up", "text": "GAS", "anchor": Vector2(1, 1), "offset": Vector2(-130, -150), "radius": 88.0, "color": UIKit.OK, "font_size": 18},
		{"action": "brake", "icon": "down", "text": "FRENO", "anchor": Vector2(1, 1), "offset": Vector2(-320, -90), "radius": 64.0, "color": UIKit.DANGER, "font_size": 14},
		{"action": "nitro", "text": "6x6", "anchor": Vector2(1, 1), "offset": Vector2(-300, -260), "radius": 56.0, "color": UIKit.WARN, "font_size": 22},
	])
	hud.root.add_child(touch)
	var rescue := UIKit.button("RESCATE", false, 14)
	UIKit.place(rescue, Vector2(1, 0), Vector2(-560, 22))
	rescue.pressed.connect(func(): if state == "drive": _respawn("Rescate"))
	hud.root.add_child(rescue)
	overlays = Overlays.new()
	add_child(overlays)
	hud.pause_pressed.connect(_pause)
	overlays.resume.connect(func(): get_tree().paused = false)
	overlays.restart.connect(func(): Game.start_mode("truck"))
	overlays.quit_to_menu.connect(func(): Game.goto_menu())
	engine = Sfx.make_loop("truck_loop", -4.0)
	add_child(engine)
	if engine.stream:
		engine.play()
	Sfx.play_music("music_drive")
	hud.banner("CAÑÓN DEL RÍO BRAVO", "Nivel %d · Entrega %d cajas en el aserradero" % [Game.current_level, CRATES], 2.4, UIKit.OK)

func _pause() -> void:
	if state == "done":
		return
	get_tree().paused = true
	touch.release_all()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()

func _place_truck(s: float) -> void:
	var f := route.frame(s)
	truck.global_transform = Transform3D(f.basis.rotated(Vector3.UP, PI), f.origin + Vector3(0, 0.6, 0))
	truck.linear_velocity = Vector3.ZERO
	truck.angular_velocity = Vector3.ZERO

func _spawn_crates() -> void:
	var slots := [Vector3(-0.6, 2.05, -0.15), Vector3(0.6, 2.05, -0.15), Vector3(-0.6, 2.05, -1.45), Vector3(0.6, 2.05, -1.45), Vector3(-0.6, 2.05, -2.75), Vector3(0.6, 2.05, -2.75)]
	var mesh := BoxMesh.new()
	mesh.size = Vector3(1.0, 1.0, 1.0)
	var cm := MatLib.pbr("planks", 1.0, Color(0.95, 0.8, 0.55))
	mesh.material = cm
	var pm := PhysicsMaterial.new()
	pm.friction = 0.9
	pm.bounce = 0.05
	for i in CRATES:
		var c := RigidBody3D.new()
		c.mass = 110.0
		c.physics_material_override = pm
		c.continuous_cd = true
		var cs := CollisionShape3D.new()
		var b := BoxShape3D.new()
		b.size = Vector3(0.98, 0.98, 0.98)
		cs.shape = b
		c.add_child(cs)
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		c.add_child(mi)
		var band := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = Vector3(1.02, 0.12, 1.02)
		band.mesh = bm
		band.material_override = MatLib.color(Color(0.2, 0.2, 0.22), 0.4, 0.8)
		c.add_child(band)
		add_child(c)
		c.global_transform = Transform3D(truck.global_transform.basis, truck.global_transform * slots[i])
		c.set_meta("slot", slots[i])
		crates.append(c)
		crate_lost.append(false)

func _reload_crates() -> void:
	for i in crates.size():
		if crate_lost[i]:
			continue
		var c := crates[i]
		c.linear_velocity = Vector3.ZERO
		c.angular_velocity = Vector3.ZERO
		c.global_transform = Transform3D(truck.global_transform.basis, truck.global_transform * (c.get_meta("slot") as Vector3))

func _spawn_fauna() -> void:
	var specs := [
		[world.mud_s0 + 60.0, 1.2, Color(1, 1, 1), 5.0], [world.mud_s0 + 75.0, 1.0, Color(1, 1, 1), 4.2],
		[world.bridge_s1 + 90.0, 1.9, Color(0.55, 0.55, 0.6), 4.0], [world.bridge_s1 + 102.0, 1.8, Color(0.5, 0.5, 0.55), 4.6],
		[world.bridge_s1 + 115.0, 2.0, Color(0.45, 0.45, 0.5), 3.6], [route.length - 220.0, 1.2, Color(1, 1, 1), 5.5],
		[route.length - 140.0, 1.9, Color(0.5, 0.5, 0.55), 4.4],
	]
	for sp in specs:
		var f := route.frame(sp[0])
		var a := f.origin + f.basis.x * -11.0
		var b := f.origin + f.basis.x * 11.0
		a.y = world.height_at(a.x, a.z) + 0.05
		b.y = world.height_at(b.x, b.z) + 0.05
		var mid := f.origin
		var an := FaunaAnimal.new()
		add_child(an)
		# Trayecto a ras del camino: pasa por el centro de la vía
		an.setup(sp[1], sp[2], a, b, sp[3], randf())
		an.set_meta("s", sp[0])
		an.set_meta("mid_y", mid.y)
		animals.append(an)

func _spawn_flora() -> void:
	for fs in [world.bridge_s1 + 160.0, route.length - 300.0]:
		var f := route.frame(fs)
		var root := Node3D.new()
		add_child(root)
		var base := f.origin + f.basis.x * 5.2
		base.y = world.height_at(base.x, base.z)
		root.global_transform = Transform3D(f.basis, base)
		var tree := MeshInstance3D.new()
		tree.mesh = Props.pine()
		tree.scale = Vector3(1.1, 1.0, 1.1)
		root.add_child(tree)
		trees.append({"root": root, "s": fs, "fallen": false, "t": 0.0, "frame": f})
	boulder_zone = route.length - 420.0

func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	var gas := Input.is_action_pressed("accelerate")
	var brk := Input.is_action_pressed("brake")
	var steer := Input.get_axis("steer_left", "steer_right")
	var want_boost := Input.is_action_pressed("nitro")
	if Game.autopilot:
		var ap := _autopilot()
		gas = ap[0]
		brk = ap[1]
		steer = ap[2]
		want_boost = ap[3]
	if state == "intro" and state_t > 1.0:
		state = "drive"
	if state == "done" and truck.linear_velocity.length() < 0.5:
		truck.freeze = true
	if state != "drive":
		gas = false
		brk = true
		steer = 0.0
		want_boost = false
	boost_on = want_boost and boost_energy > 1.0
	if boost_on:
		boost_energy = maxf(0.0, boost_energy - 22.0 * dt)
	else:
		boost_energy = minf(100.0, boost_energy + 6.0 * dt)
	truck.set_controls(1.0 if gas else 0.0, steer, brk, boost_on)
	if state == "drive":
		time += dt
	var p := truck.global_position
	s_prog = route.nearest_s(p, s_prog)
	truck.in_mud = world.is_mud(s_prog)
	mud_fx.emitting = truck.in_mud and absf(truck.forward_speed()) > 2.0
	# Checkpoints
	for i in range(checkpoint + 1, world.checkpoints.size()):
		if s_prog > world.checkpoints[i] and state == "drive":
			checkpoint = i
			hud.popup("PUNTO DE CONTROL", 0, UIKit.OK)
			Sfx.play("pickup", -6.0)
	# Caída o vuelco
	var road_y := route.frame(s_prog).origin.y
	if state == "drive":
		if p.y < road_y - 9.0:
			_respawn("¡Caíste!")
		if truck.global_transform.basis.y.y < 0.35:
			flipped_t += dt
			if flipped_t > 2.5:
				_respawn("¡Volcaste!")
		else:
			flipped_t = 0.0
	_update_cargo()
	_update_hazards(dt)
	if state == "drive" and s_prog > route.length - 14.0:
		_finish(true)
	_update_camera(dt)
	_update_hud()
	if OS.get_environment("TRUCKDBG") == "1" and Engine.get_process_frames() % 120 == 0:
		print("t=%.1f s=%.1f/%.0f v=%.1f pos=%s cargo=%d cp=%d resp=%d up=%.2f mud=%s" % [time, s_prog, route.length, truck.forward_speed(), truck.global_position.snapped(Vector3(0.1, 0.1, 0.1)), cargo_count(), checkpoint, respawns, truck.global_transform.basis.y.y, truck.in_mud])
	if engine.stream:
		engine.pitch_scale = 0.7 + clampf(absf(truck.forward_speed()) / 18.0, 0.0, 1.0) * 0.7 + (0.15 if gas else 0.0)
		engine.volume_db = -8.0 + (4.0 if gas else 0.0)

func _respawn(reason: String) -> void:
	respawns += 1
	hud.banner(reason, "Volviendo al último punto de control", 1.2, UIKit.DANGER)
	_place_truck(world.checkpoints[checkpoint])
	_reload_crates()
	flipped_t = 0.0

func _update_cargo() -> void:
	var on_board := 0
	var inv := truck.global_transform.affine_inverse()
	for i in crates.size():
		if crate_lost[i]:
			continue
		var lp := inv * crates[i].global_position
		var on := absf(lp.x) < 1.9 and lp.z < 1.2 and lp.z > -5.2 and lp.y > 0.9 and lp.y < 4.5
		if not on:
			var far := crates[i].global_position.distance_to(truck.global_position) > 7.0 or crates[i].global_position.y < truck.global_position.y - 2.5
			if far:
				crate_lost[i] = true
				hud.popup("¡CAJA PERDIDA!", 0, UIKit.DANGER)
				Sfx.play("thud", -2.0)
				continue
		on_board += 1
	hud.set_lives(on_board, CRATES)
	if on_board == 0 and state == "drive":
		_finish(false)

func cargo_count() -> int:
	var n := 0
	for l in crate_lost:
		if not l:
			n += 1
	return n

func _update_hazards(dt: float) -> void:
	var tp := truck.global_position
	var spd := truck.linear_velocity.length()
	for an in animals:
		var a: FaunaAnimal = an
		if not a.active or a.fleeing > 0.0:
			continue
		var d := Vector2(a.global_position.x - tp.x, a.global_position.z - tp.z)
		var local := truck.global_transform.affine_inverse() * a.global_position
		if absf(local.x) < 1.6 + a.radius and local.z < 6.0 and local.z > -5.0 and absf(local.y) < 3.0:
			if spd > 1.5:
				hits += 1
				a.scare()
				hud.popup("¡CUIDADO CON LA FAUNA!", 0, UIKit.DANGER)
				Sfx.play("thud", 0.0)
				for c in crates:
					c.apply_central_impulse(Vector3(randf_range(-1, 1), 2.0, randf_range(-1, 1)) * 22.0)
				truck.linear_velocity *= 0.75
		if d.length() < 26.0 and a.wait <= 0.0 and a.fleeing <= 0.0 and randf() < 0.002:
			hud.popup("¡ANIMALES CRUZANDO!", 0, UIKit.WARN)
	for t in trees:
		if t["fallen"]:
			continue
		if s_prog > t["s"] - 38.0 and s_prog < t["s"]:
			t["fallen"] = true
			hud.banner("¡ÁRBOL CAYENDO!", "Pasa por encima del tronco despacio", 1.6, UIKit.WARN)
			Sfx.play("crash", -6.0, 0.6)
			var root: Node3D = t["root"]
			var tw := create_tween()
			var target := root.transform.basis * Basis(Vector3(0, 0, 1), PI * 0.5)
			tw.tween_method(func(k: float): root.transform.basis = root.transform.basis.slerp(target, k * k), 0.0, 1.0, 1.4)
			tw.tween_callback(_add_log.bind(t))
	# Rocas rodando
	if s_prog > boulder_zone - 70.0 and s_prog < boulder_zone + 40.0 and state == "drive":
		boulder_t -= dt
		if boulder_t <= 0.0:
			boulder_t = randf_range(2.2, 3.6)
			_spawn_boulder()
	var i := boulders.size() - 1
	while i >= 0:
		var b: RigidBody3D = boulders[i]
		if b.get_meta("life") < Time.get_ticks_msec():
			b.queue_free()
			boulders.remove_at(i)
		i -= 1

func _add_log(t: Dictionary) -> void:
	var f: Transform3D = t["frame"]
	var body := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = 0.34
	cyl.height = 10.0
	cs.shape = cyl
	body.add_child(cs)
	add_child(body)
	var c := f.origin
	body.global_transform = Transform3D(Basis(f.basis.z, PI * 0.5) * f.basis, Vector3(c.x, c.y + 0.2, c.z) + f.basis.x * 0.2)
	body.rotate_object_local(Vector3(0, 0, 1), 0.0)
	cs.rotation = Vector3(0, 0, PI * 0.5)
	body.global_transform = Transform3D(f.basis, Vector3(c.x, c.y + 0.22, c.z))

func _spawn_boulder() -> void:
	var f := route.frame(boulder_zone + randf_range(-20.0, 20.0))
	var b := RigidBody3D.new()
	b.mass = 900.0
	var cs := CollisionShape3D.new()
	var sp := SphereShape3D.new()
	sp.radius = 1.05
	cs.shape = sp
	b.add_child(cs)
	var mi := MeshInstance3D.new()
	mi.mesh = Props.rock(0)
	mi.scale = Vector3(1.1, 1.6, 1.1)
	b.add_child(mi)
	add_child(b)
	var start := f.origin + f.basis.x * -16.0
	start.y = world.height_at(start.x, start.z) + 2.5
	b.global_position = start
	b.linear_velocity = f.basis.x * randf_range(8.0, 11.0) + Vector3(0, 1.0, 0)
	b.angular_velocity = f.basis.z * -8.0
	b.set_meta("life", Time.get_ticks_msec() + 9000)
	boulders.append(b)
	Sfx.play("thud", -8.0, 0.6)

func _finish(win: bool) -> void:
	if state == "done":
		return
	state = "done"
	touch.release_all()
	truck.set_controls(0.0, 0.0, true, false)
	var n := cargo_count()
	var stars := 0
	if win:
		stars = 1
		if n >= CRATES - 2:
			stars = 2
		if n == CRATES and time < 240.0:
			stars = 3
		var prev := float(Game.save.get("best_truck_time", 0))
		if prev == 0.0 or time < prev:
			Game.save["best_truck_time"] = time
		Game.save["stars_truck"] = maxi(int(Game.save.get("stars_truck", 0)), stars)
		Game.save["coins"] = int(Game.save.get("coins", 0)) + n * 60
		Game.write_save()
	Sfx.play("win" if win else "lose", -2.0)
	await get_tree().create_timer(1.2).timeout
	overlays.show_results("¡ENTREGA COMPLETADA!" if win else "CARGA PERDIDA",
		"Llegaste al aserradero con %d de %d cajas." % [n, CRATES] if win else "Todas las cajas cayeron por el camino. Conduce más despacio en baches y curvas.",
		[["Tiempo", Game.fmt_time(time)], ["Carga entregada", "%d / %d" % [n, CRATES]], ["Golpes con fauna", str(hits)], ["Rescates", str(respawns)], ["Estrellas", "★".repeat(stars) + "☆".repeat(3 - stars)]],
		"NIVEL 1 SUPERADO" if win else "", win)

func _update_camera(dt: float) -> void:
	var t := truck.global_transform
	var back := -t.basis.z
	back.y = 0.0
	back = back.normalized()
	var want := t.origin + back * 13.5 + Vector3(0, 6.2, 0)
	cam_pos = cam_pos.lerp(want, clampf(dt * 3.0, 0.0, 1.0))
	cam.global_position = cam_pos
	cam.look_at(t.origin - back * 4.0 + Vector3(0, 1.6, 0), Vector3.UP)

func _update_hud() -> void:
	hud.score_lbl.text = Game.fmt_time(time)
	hud.best_lbl.text = "CARGA %d/%d" % [cargo_count(), CRATES]
	hud.set_distance("RECORRIDO", "%.2f / %.2f km" % [s_prog / 1000.0, route.length / 1000.0])
	hud.set_speed(absf(truck.forward_speed()) * 3.6, boost_energy / 100.0, boost_on)
	var warn := ""
	if truck.in_mud:
		warn = "BARRO · MANTÉN 6x6 PARA SALIR DE LOS BACHES"
	elif s_prog > world.bridge_s0 - 20.0 and s_prog < world.bridge_s1:
		warn = "PUENTE ESTRECHO · VE DESPACIO Y RECTO"
	elif curve_ahead(34.0) > 0.9:
		warn = "CURVA CERRADA · FRENA O PERDERÁS LA CARGA"
	hud.warn(warn)
	hud.set_extra("Punto de control %d/%d" % [checkpoint + 1, world.checkpoints.size()])

## Cambio de rumbo (rad) en los próximos metros: detecta curvas cerradas.
func curve_ahead(dist := 26.0) -> float:
	var a := route.frame(s_prog + 4.0).basis.z
	var b := route.frame(s_prog + dist).basis.z
	var m := 0.0
	for d in [dist * 0.5, dist]:
		m = maxf(m, a.angle_to(route.frame(s_prog + d).basis.z))
	return m

## Piloto automático de pruebas: sigue el centro del camino.
func _autopilot() -> Array:
	var la := s_prog + 9.0
	var target := route.frame(la).origin
	var local := truck.global_transform.affine_inverse() * target
	var steer := clampf(-local.x * 0.35, -1.0, 1.0)
	var v := truck.forward_speed()
	var want := 9.0 if (truck.in_mud or (s_prog > world.bridge_s0 - 30.0 and s_prog < world.bridge_s1)) else 13.0
	want = minf(want, lerpf(13.0, 4.0, clampf(curve_ahead() / 1.3, 0.0, 1.0)))
	return [v < want, v > want + 3.0, steer, truck.in_mud]
