class_name TruckVehicle
extends VehicleBody3D
## Camión 6x4 con física real (VehicleBody3D, 6 ruedas) y caja de carga abierta.
## El modelo es procedural: cabina con capó largo, parrilla cromada, escapes, depósitos y plataforma de madera.

const WHEEL_R := 0.55
var paint := Color(0.75, 0.08, 0.05)
var wheels: Array[VehicleWheel3D] = []
var front_wheels: Array[VehicleWheel3D] = []
var throttle := 0.0
var steer_in := 0.0
var braking := false
var boost := false
var in_mud := false
var _steer := 0.0
var brake_lights: StandardMaterial3D
var head_lights: Array[SpotLight3D] = []

func _init() -> void:
	mass = 3200.0
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, 0.7, -0.3)
	can_sleep = false
	continuous_cd = true
	angular_damp = 0.4
	linear_damp = 0.05
	var pm := PhysicsMaterial.new()
	pm.friction = 0.8
	physics_material_override = pm

func _ready() -> void:
	_build_collision()
	_build_body()
	# VehicleBody3D avanza hacia +Z: el modelo se construyó mirando a -Z, así que se gira 180°.
	for c in get_children():
		if c is Node3D:
			c.transform = Transform3D(Basis(Vector3.UP, PI), Vector3.ZERO) * c.transform
	_build_wheels()

func _box_shape(size: Vector3, pos: Vector3) -> void:
	var cs := CollisionShape3D.new()
	var b := BoxShape3D.new()
	b.size = size
	cs.shape = b
	cs.position = pos
	add_child(cs)

func _build_collision() -> void:
	_box_shape(Vector3(2.3, 0.55, 9.2), Vector3(0, 1.05, 0.2))      # chasis
	_box_shape(Vector3(2.4, 2.0, 2.4), Vector3(0, 2.25, -2.75))     # cabina
	_box_shape(Vector3(2.2, 1.0, 1.9), Vector3(0, 1.7, -4.55))      # capó
	_box_shape(Vector3(2.6, 0.14, 5.3), Vector3(0, 1.4, 1.95))      # plataforma
	_box_shape(Vector3(0.12, 0.5, 5.3), Vector3(-1.27, 1.72, 1.95)) # laterales
	_box_shape(Vector3(0.12, 0.5, 5.3), Vector3(1.27, 1.72, 1.95))
	_box_shape(Vector3(2.6, 1.5, 0.14), Vector3(0, 2.15, -0.68))    # cabecero
	_box_shape(Vector3(2.6, 0.32, 0.12), Vector3(0, 1.62, 4.58))    # trampilla baja

func _build_wheels() -> void:
	var tire_mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	var axis := Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3(0.21, 0, 0))
	MeshKit.cylinder(st, Vector3.ZERO, WHEEL_R, WHEEL_R, 0.42, 20, true, axis)
	MeshKit.commit(st, tire_mesh, TrafficFactory.mats()["tire"])
	var rim := MeshKit.begin()
	MeshKit.cylinder(rim, Vector3.ZERO, WHEEL_R * 0.62, WHEEL_R * 0.55, 0.03, 16, true, Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3(0.225, 0, 0)))
	MeshKit.cylinder(rim, Vector3.ZERO, WHEEL_R * 0.66, WHEEL_R * 0.66, 0.03, 16, true, Transform3D(Basis(Vector3(0, 0, 1), -PI * 0.5), Vector3(-0.225, 0, 0)))
	for k in 8:
		var a := TAU * k / 8.0
		MeshKit.box(rim, Vector3.ZERO, Vector3(0.06, 0.07, 0.07), 1.0, Transform3D(Basis.IDENTITY, Vector3(0.245, cos(a) * WHEEL_R * 0.35, sin(a) * WHEEL_R * 0.35)))
	MeshKit.commit(rim, tire_mesh, TrafficFactory.mats()["chrome"])
	var tread := MeshKit.begin()
	for k in 24:
		var a2 := TAU * k / 24.0
		var b := Basis(Vector3(1, 0, 0), a2)
		MeshKit.box(tread, Vector3.ZERO, Vector3(0.4, 0.05, 0.1), 1.0, Transform3D(b, b * Vector3(0, WHEEL_R + 0.012, 0)))
	MeshKit.commit(tread, tire_mesh, TrafficFactory.mats()["tire"])
	for spec in [[-1.08, -3.05, true], [1.08, -3.05, true], [-1.02, 1.55, false], [1.02, 1.55, false], [-1.02, 2.85, false], [1.02, 2.85, false]]:
		var w := VehicleWheel3D.new()
		w.position = Vector3(spec[0], 0.95, -spec[1])
		w.wheel_radius = WHEEL_R
		w.wheel_rest_length = 0.38
		w.suspension_travel = 0.32
		w.suspension_stiffness = 42.0
		w.suspension_max_force = 30000.0
		w.damping_compression = 0.9
		w.damping_relaxation = 1.3
		w.wheel_friction_slip = 2.4
		w.wheel_roll_influence = 0.25
		w.use_as_steering = spec[2]
		w.use_as_traction = not spec[2]
		var mi := MeshInstance3D.new()
		mi.mesh = tire_mesh
		if spec[0] < 0:
			mi.rotation.y = PI
		w.add_child(mi)
		add_child(w)
		wheels.append(w)
		if spec[2]:
			front_wheels.append(w)

func _build_body() -> void:
	var mesh := ArrayMesh.new()
	var pm := StandardMaterial3D.new()
	pm.albedo_color = paint
	pm.metallic = 0.5
	pm.roughness = 0.28
	pm.clearcoat_enabled = true
	pm.clearcoat = 0.9
	var m := TrafficFactory.mats()
	var p := MeshKit.begin()
	# Cabina y capó (frente hacia -Z)
	MeshKit.box(p, Vector3(0, 2.3, -2.75), Vector3(2.4, 2.0, 2.4))
	MeshKit.box(p, Vector3(0, 3.42, -2.55), Vector3(2.3, 0.28, 2.0))
	MeshKit.box(p, Vector3(0, 1.72, -4.55), Vector3(1.9, 1.05, 1.9))
	MeshKit.box(p, Vector3(0, 2.26, -4.5), Vector3(1.7, 0.08, 1.75))
	for sx in [-1.0, 1.0]:
		MeshKit.box(p, Vector3(sx * 1.06, 1.38, -4.25), Vector3(0.42, 0.38, 2.3))
		MeshKit.box(p, Vector3(sx * 1.32, 2.7, -3.85), Vector3(0.36, 0.5, 0.14))
	MeshKit.commit(p, mesh, pm)
	var g := MeshKit.begin()
	MeshKit.quad(g, Vector3(-1.08, 2.45, -3.97), Vector3(1.08, 2.45, -3.97), Vector3(1.04, 3.22, -3.72), Vector3(-1.04, 3.22, -3.72))
	for sx in [-1.0, 1.0]:
		var x: float = sx * 1.205
		MeshKit.box(g, Vector3(x, 2.85, -2.85), Vector3(0.02, 0.75, 1.5))
	MeshKit.box(g, Vector3(0, 2.75, -1.54), Vector3(1.6, 0.6, 0.02))
	MeshKit.commit(g, mesh, m["glass"])
	var c := MeshKit.begin()
	MeshKit.box(c, Vector3(0, 1.72, -5.51), Vector3(1.5, 0.95, 0.06))
	MeshKit.box(c, Vector3(0, 0.98, -5.62), Vector3(2.5, 0.38, 0.32))
	for sx in [-1.0, 1.0]:
		MeshKit.cylinder(c, Vector3(sx * 1.05, 1.9, -1.45), 0.11, 0.11, 2.6, 10, true)
		MeshKit.cylinder(c, Vector3.ZERO, 0.32, 0.32, 1.2, 14, true, Transform3D(Basis(Vector3(1, 0, 0), PI * 0.5), Vector3(sx * 1.08, 0.95, -2.0)))
		MeshKit.box(c, Vector3(sx * 1.55, 2.75, -3.85), Vector3(0.08, 0.6, 0.3))
	MeshKit.commit(c, mesh, m["chrome"])
	var d := MeshKit.begin()
	for k in 9:
		MeshKit.box(d, Vector3(-0.6 + k * 0.15, 1.72, -5.55), Vector3(0.05, 0.85, 0.04))
	MeshKit.box(d, Vector3(0, 1.05, 0.2), Vector3(2.0, 0.4, 9.2))
	for sx in [-1.0, 1.0]:
		for z in [1.55, 2.85]:
			MeshKit.box(d, Vector3(sx * 1.05, 1.4, z), Vector3(0.6, 0.12, 1.2))
		MeshKit.box(d, Vector3(sx * 1.05, 0.65, 3.6), Vector3(0.5, 0.6, 0.04))
		MeshKit.box(d, Vector3(sx * 1.05, 0.65, -1.9), Vector3(0.5, 0.5, 0.04))
	MeshKit.commit(d, mesh, m["plastic"])
	var wd := MeshKit.begin()
	MeshKit.box(wd, Vector3(0, 1.42, 1.95), Vector3(2.6, 0.12, 5.3), 0.5)
	for sx in [-1.0, 1.0]:
		MeshKit.box(wd, Vector3(sx * 1.27, 1.72, 1.95), Vector3(0.1, 0.48, 5.3), 0.5)
		for z in [-0.4, 0.9, 2.2, 3.5, 4.5]:
			MeshKit.box(wd, Vector3(sx * 1.27, 2.0, z), Vector3(0.14, 1.0, 0.14), 0.5)
	MeshKit.box(wd, Vector3(0, 2.15, -0.68), Vector3(2.6, 1.5, 0.12), 0.5)
	MeshKit.box(wd, Vector3(0, 1.62, 4.58), Vector3(2.6, 0.32, 0.1), 0.5)
	MeshKit.commit(wd, mesh, MatLib.pbr("planks", 0.5, Color(0.85, 0.7, 0.5)))
	var hl := MeshKit.begin()
	for sx in [-1.0, 1.0]:
		MeshKit.cylinder(hl, Vector3.ZERO, 0.16, 0.16, 0.06, 14, true, Transform3D(Basis(Vector3(1, 0, 0), PI * 0.5), Vector3(sx * 0.95, 1.55, -5.5)))
	for k in 5:
		MeshKit.box(hl, Vector3(-0.6 + k * 0.3, 3.6, -3.4), Vector3(0.14, 0.08, 0.1))
	MeshKit.commit(hl, mesh, m["head"])
	brake_lights = StandardMaterial3D.new()
	brake_lights.albedo_color = Color(0.5, 0, 0)
	brake_lights.emission_enabled = true
	brake_lights.emission = Color(1.0, 0.05, 0.02)
	brake_lights.emission_energy_multiplier = 1.5
	var bl := MeshKit.begin()
	for sx in [-1.0, 1.0]:
		MeshKit.box(bl, Vector3(sx * 0.95, 1.2, 4.66), Vector3(0.4, 0.14, 0.04))
	MeshKit.commit(bl, mesh, brake_lights)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)

func set_controls(t: float, s: float, b: bool, boost_on: bool) -> void:
	throttle = t
	steer_in = s
	braking = b
	boost = boost_on

func forward_speed() -> float:
	return global_transform.basis.z.dot(linear_velocity)

func _physics_process(dt: float) -> void:
	var v := forward_speed()
	var top := 17.0 if not boost else 20.0
	var force := 0.0
	var brk := 0.0
	if braking:
		if v > 1.2:
			brk = 70.0
		else:
			force = -7000.0
	elif throttle > 0.0:
		var k := clampf(1.0 - v / top, 0.0, 1.0)
		force = 11000.0 * throttle * (0.35 + 0.65 * k)
		if boost:
			force *= 1.9
	else:
		brk = 6.0
	engine_force = force
	brake = brk
	var max_steer := lerpf(0.6, 0.22, clampf(absf(v) / 16.0, 0.0, 1.0))
	_steer = move_toward(_steer, -steer_in * max_steer, dt * 1.8)
	steering = _steer
	for w in front_wheels:
		w.use_as_traction = boost
	for w in wheels:
		w.wheel_friction_slip = (1.25 if not boost else 1.8) if in_mud else 2.4
	if in_mud:
		apply_central_force(-linear_velocity * mass * 0.35)
	# Ayuda anti-vuelco suave
	var up := global_transform.basis.y
	if up.y < 0.82 and up.y > 0.2:
		var axis := up.cross(Vector3.UP)
		apply_torque(axis * mass * 9.0)
	brake_lights.emission_energy_multiplier = 6.0 if braking else 1.5
