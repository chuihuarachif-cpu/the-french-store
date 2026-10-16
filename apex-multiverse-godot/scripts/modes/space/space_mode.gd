extends Node3D
## MODO 4 — COHETES: vuelo infinito por la galaxia.
## La nave avanza hacia -Z; el mundo se desplaza hacia la cámara. Esquiva meteoros, estrellas fugaces,
## agujeros negros (te atraen) y satélites; recoge orbes de energía y atraviesa anillos de impulso.

const BOUNDS := Vector2(15.0, 8.5)
const SPAWN_Z := -700.0
const SHIP_R := 1.1

var ship: Node3D
var ship_pos := Vector2.ZERO
var ship_vel := Vector2.ZERO
var speed := 60.0
var dist := 0.0
var score := 0.0
var shield := 100.0
var energy := 60.0
var boost := false
var state := "intro"
var state_t := 0.0
var cam: Camera3D
var hud: HUD
var touch: TouchControls
var overlays: Overlays
var objects: Array = []
var next_spawn := 0.0
var rng := RandomNumberGenerator.new()
var dust: CPUParticles3D
var engine: AudioStreamPlayer
var trails: Array = []
var shake := 0.0
var hit_flash := 0.0
var orbs := 0
var rings := 0
var near_miss := 0
var best := 0
var mult := 1.0
var combo := 0.0
var flames: Array[MeshInstance3D] = []
var shield_mesh: MeshInstance3D
var asteroid_meshes: Array[Mesh] = []
var backdrop: Node3D

func _ready() -> void:
	rng.randomize()
	var e := EnvFactory.build(self, "space")
	var env: Environment = e["env"]
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.35, 0.3, 0.5)
	env.ambient_light_energy = 0.6
	_build_backdrop()
	var fill := DirectionalLight3D.new()
	fill.light_color = Color(0.55, 0.65, 1.0)
	fill.light_energy = 0.9
	fill.rotation_degrees = Vector3(-25, 0, 0)
	add_child(fill)
	for i in 4:
		asteroid_meshes.append(_asteroid_mesh(i))
	ship = _build_ship()
	add_child(ship)
	cam = Camera3D.new()
	cam.position = Vector3(0, 2.4, 10.5)
	cam.fov = 66.0
	cam.far = 6000.0
	add_child(cam)
	cam.make_current()
	dust = _space_dust()
	cam.add_child(dust)
	for x in [-0.95, 0.95]:
		var tr := FX.Trail.new(Color(0.12, 0.4, 0.6), 0.05)
		tr.max_points = 12
		add_child(tr)
		trails.append([tr, x])
	hud = HUD.new()
	add_child(hud)
	hud.set_title("PUNTOS")
	hud.gauge.unit = "MACH"
	hud.gauge.max_speed = 30.0
	hud.gauge.label_nitro = "HIPERIMPULSO"
	hud.set_lives(5, 5)
	touch = TouchControls.new([
		{"action": "steer_left", "icon": "left", "anchor": Vector2(0, 1), "offset": Vector2(110, -125), "radius": 78.0, "color": Color(0.7, 0.45, 1.0)},
		{"action": "steer_right", "icon": "right", "anchor": Vector2(0, 1), "offset": Vector2(290, -125), "radius": 78.0, "color": Color(0.7, 0.45, 1.0)},
		{"action": "accelerate", "icon": "up", "anchor": Vector2(1, 1), "offset": Vector2(-150, -255), "radius": 70.0, "color": Color(0.7, 0.45, 1.0)},
		{"action": "brake", "icon": "down", "anchor": Vector2(1, 1), "offset": Vector2(-150, -95), "radius": 70.0, "color": Color(0.7, 0.45, 1.0)},
		{"action": "nitro", "text": "TURBO", "anchor": Vector2(1, 1), "offset": Vector2(-330, -120), "radius": 66.0, "color": UIKit.ACCENT, "font_size": 16},
	])
	hud.root.add_child(touch)
	overlays = Overlays.new()
	add_child(overlays)
	hud.pause_pressed.connect(_pause)
	overlays.resume.connect(func(): get_tree().paused = false)
	overlays.restart.connect(func(): Game.start_mode("space"))
	overlays.quit_to_menu.connect(func(): Game.goto_menu())
	best = int(Game.save.get("best_space", 0))
	engine = Sfx.make_loop("rocket_loop", -8.0)
	add_child(engine)
	if engine.stream:
		engine.play()
	Sfx.play_music("music_space")
	hud.banner("GALAXIA INFINITA", "Esquiva meteoros, estrellas fugaces y agujeros negros", 2.2, Color(0.8, 0.6, 1.0))
	_update_ship(0.016)
	_update_camera(1.0)
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	for i in int(skip / 0.05):
		_process(0.05)

func _pause() -> void:
	if state == "over":
		return
	get_tree().paused = true
	touch.release_all()
	overlays.show_pause()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_pause()

# ------------------------------------------------------------------ CONSTRUCCIÓN
func _build_ship() -> Node3D:
	var root := Node3D.new()
	var mesh := ArrayMesh.new()
	var hull := StandardMaterial3D.new()
	hull.albedo_texture = MatLib.tex("hull_albedo")
	hull.normal_enabled = true
	hull.normal_texture = MatLib.tex("hull_normal")
	hull.metallic = 0.75
	hull.roughness = 0.3
	hull.albedo_color = Color(0.92, 0.94, 1.0)
	hull.uv1_scale = Vector3(0.6, 0.6, 1)
	var accent := StandardMaterial3D.new()
	accent.albedo_color = Color(0.55, 0.12, 0.85)
	accent.metallic = 0.6
	accent.roughness = 0.25
	accent.clearcoat_enabled = true
	var st := MeshKit.begin()
	# Fuselaje: secciones octogonales con morro afilado (frente -Z)
	var secs := [[-4.2, 0.02, 0.02], [-3.4, 0.32, 0.22], [-2.2, 0.62, 0.42], [-0.6, 0.85, 0.55], [1.0, 0.9, 0.6], [2.4, 0.8, 0.55], [3.0, 0.65, 0.48]]
	var ring_n := 10
	for i in secs.size() - 1:
		var A: Array = secs[i]
		var B: Array = secs[i + 1]
		for k in ring_n:
			var a0 := TAU * k / ring_n
			var a1 := TAU * (k + 1) / ring_n
			var pa0 := Vector3(cos(a0) * A[1], sin(a0) * A[2], A[0])
			var pa1 := Vector3(cos(a1) * A[1], sin(a1) * A[2], A[0])
			var pb0 := Vector3(cos(a0) * B[1], sin(a0) * B[2], B[0])
			var pb1 := Vector3(cos(a1) * B[1], sin(a1) * B[2], B[0])
			MeshKit.quad(st, pa0, pb0, pb1, pa1, Vector2(k * 0.3, A[0] * 0.3), Vector2(k * 0.3, B[0] * 0.3), Vector2((k + 1) * 0.3, B[0] * 0.3), Vector2((k + 1) * 0.3, A[0] * 0.3))
	# Alas en flecha
	for sx in [-1.0, 1.0]:
		var w0 := Vector3(sx * 0.7, -0.05, -0.8)
		var w1 := Vector3(sx * 3.6, -0.25, 1.9)
		var w2 := Vector3(sx * 3.3, -0.25, 2.6)
		var w3 := Vector3(sx * 0.75, -0.05, 2.5)
		var up := Vector3(0, 0.09, 0)
		if sx > 0:
			MeshKit.quad(st, w0 + up, w1 + up, w2 + up, w3 + up)
			MeshKit.quad(st, w3 - up, w2 - up, w1 - up, w0 - up)
		else:
			MeshKit.quad(st, w0 + up, w3 + up, w2 + up, w1 + up)
			MeshKit.quad(st, w1 - up, w2 - up, w3 - up, w0 - up)
		MeshKit.box(st, Vector3.ZERO, Vector3(0.12, 1.1, 1.2), 1.0, Transform3D(Basis(Vector3(0, 0, 1), sx * -0.35), Vector3(sx * 3.4, 0.25, 2.2)))
	MeshKit.commit(st, mesh, hull)
	var ac := MeshKit.begin()
	for sx in [-1.0, 1.0]:
		MeshKit.cylinder(ac, Vector3.ZERO, 0.42, 0.38, 3.4, 12, true, Transform3D(Basis(Vector3(1, 0, 0), PI * 0.5), Vector3(sx * 0.95, -0.12, -0.2)))
		MeshKit.box(ac, Vector3(sx * 2.0, -0.1, 1.3), Vector3(2.0, 0.24, 0.5))
	MeshKit.box(ac, Vector3(0, 0.62, 1.6), Vector3(0.12, 0.8, 1.6))
	MeshKit.commit(ac, mesh, accent)
	var gl := MeshKit.begin()
	var cp := [[-2.3, 0.05, 0.05], [-1.6, 0.36, 0.3], [-0.6, 0.42, 0.42], [0.4, 0.3, 0.32], [0.9, 0.05, 0.1]]
	for i in cp.size() - 1:
		var A2: Array = cp[i]
		var B2: Array = cp[i + 1]
		for k in 6:
			var a0 := PI * k / 6.0
			var a1 := PI * (k + 1) / 6.0
			var y0 := 0.48
			var pa0 := Vector3(cos(a0) * A2[1], y0 + sin(a0) * A2[2], A2[0])
			var pa1 := Vector3(cos(a1) * A2[1], y0 + sin(a1) * A2[2], A2[0])
			var pb0 := Vector3(cos(a0) * B2[1], y0 + sin(a0) * B2[2], B2[0])
			var pb1 := Vector3(cos(a1) * B2[1], y0 + sin(a1) * B2[2], B2[0])
			MeshKit.quad(gl, pa0, pb0, pb1, pa1)
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.05, 0.25, 0.4)
	glass.metallic = 0.4
	glass.roughness = 0.03
	glass.emission_enabled = true
	glass.emission = Color(0.0, 0.3, 0.5)
	glass.emission_energy_multiplier = 0.6
	MeshKit.commit(gl, mesh, glass)
	var em := MeshKit.begin()
	for sx in [-1.0, 1.0]:
		MeshKit.cylinder(em, Vector3.ZERO, 0.3, 0.3, 0.05, 12, true, Transform3D(Basis(Vector3(1, 0, 0), PI * 0.5), Vector3(sx * 0.95, -0.12, 1.52)))
		MeshKit.box(em, Vector3(sx * 3.45, -0.2, 2.55), Vector3(0.2, 0.06, 0.08))
	MeshKit.commit(em, mesh, MatLib.emissive(Color(0.3, 0.9, 1.0), 6.0), false)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	root.add_child(mi)
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.28
	cone.height = 2.2
	for sx in [-0.95, 0.95]:
		var f := MeshInstance3D.new()
		f.mesh = cone
		f.material_override = MatLib.additive("glow", Color(0.35, 0.85, 1.0), 2.5)
		f.rotation_degrees = Vector3(90, 0, 0)
		f.position = Vector3(sx, -0.12, 2.65)
		root.add_child(f)
		flames.append(f)
	var engine_light := OmniLight3D.new()
	engine_light.light_color = Color(0.3, 0.8, 1.0)
	engine_light.light_energy = 2.0
	engine_light.omni_range = 7.0
	engine_light.position = Vector3(0, 0, 3.0)
	root.add_child(engine_light)
	shield_mesh = MeshInstance3D.new()
	var sp := SphereMesh.new()
	sp.radius = 3.4
	sp.height = 4.0
	shield_mesh.mesh = sp
	var sm := StandardMaterial3D.new()
	sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	sm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	sm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	sm.albedo_color = Color(0.3, 0.7, 1.0, 0.0)
	sm.rim_enabled = false
	shield_mesh.material_override = sm
	root.add_child(shield_mesh)
	return root

func _asteroid_mesh(variant: int) -> Mesh:
	var mesh := ArrayMesh.new()
	var sm := SphereMesh.new()
	sm.radius = 1.0
	sm.height = 2.0
	sm.radial_segments = 20
	sm.rings = 12
	var arr := sm.get_mesh_arrays()
	var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var n := FastNoiseLite.new()
	n.seed = 100 + variant
	n.frequency = 0.8
	for i in verts.size():
		var v := verts[i]
		verts[i] = v * (1.0 + n.get_noise_3dv(v * 1.6) * 0.38) * Vector3(1.0, 0.75 + variant * 0.07, 0.9)
	arr[Mesh.ARRAY_VERTEX] = verts
	var st := SurfaceTool.new()
	st.create_from_arrays(arr)
	st.generate_normals()
	st.generate_tangents()
	var m := StandardMaterial3D.new()
	m.albedo_texture = MatLib.tex("asteroid_albedo")
	m.normal_enabled = true
	m.normal_texture = MatLib.tex("asteroid_normal")
	m.normal_scale = 1.6
	m.emission_enabled = true
	m.emission_texture = MatLib.tex("asteroid_emission")
	m.emission_energy_multiplier = 2.0 if variant == 3 else 0.0
	m.roughness = 0.95
	m.uv1_scale = Vector3(2, 1, 1)
	st.set_material(m)
	st.commit(mesh)
	return mesh

func _build_backdrop() -> void:
	backdrop = Node3D.new()
	add_child(backdrop)
	var specs := [
		["planet_gas", Vector3(-900, 260, -2600), 520.0, Color(1.0, 0.7, 0.45), true],
		["planet_earthlike", Vector3(1100, -380, -3200), 380.0, Color(0.4, 0.65, 1.0), false],
		["planet_lava", Vector3(500, 520, -2000), 160.0, Color(1.0, 0.35, 0.1), false],
	]
	for sp in specs:
		var p := MeshInstance3D.new()
		var s := SphereMesh.new()
		s.radius = sp[2]
		s.height = sp[2] * 2.0
		s.radial_segments = 48
		s.rings = 24
		p.mesh = s
		p.material_override = MatLib.shader_mat("res://shaders/planet.gdshader", {"tex": MatLib.tex(sp[0]), "atmo": sp[3], "emission": 0.6 if sp[0] == "planet_lava" else 0.0})
		p.position = sp[1]
		p.rotation_degrees = Vector3(18, 0, -12)
		p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		backdrop.add_child(p)
		if sp[4]:
			var ring := MeshInstance3D.new()
			var rm := ArrayMesh.new()
			var st := MeshKit.begin()
			var r0: float = sp[2] * 1.35
			var r1: float = sp[2] * 2.3
			for k in 96:
				var a0 := TAU * k / 96.0
				var a1 := TAU * (k + 1) / 96.0
				MeshKit.quad(st, Vector3(cos(a0) * r0, 0, sin(a0) * r0), Vector3(cos(a0) * r1, 0, sin(a0) * r1), Vector3(cos(a1) * r1, 0, sin(a1) * r1), Vector3(cos(a1) * r0, 0, sin(a1) * r0), Vector2(0, 0.5), Vector2(1, 0.5), Vector2(1, 0.5), Vector2(0, 0.5))
			var m := StandardMaterial3D.new()
			m.albedo_texture = MatLib.tex("planet_ring")
			m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			m.cull_mode = BaseMaterial3D.CULL_DISABLED
			m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			m.albedo_color = Color(1.1, 1.0, 0.9, 0.9)
			MeshKit.commit(st, rm, m, false)
			ring.mesh = rm
			ring.position = sp[1]
			ring.rotation_degrees = Vector3(22, 0, -16)
			backdrop.add_child(ring)
	var sun := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(900, 900)
	sun.mesh = q
	sun.material_override = MatLib.billboard("flare", Color(1.0, 0.85, 0.6), 2.5)
	var sd := EnvFactory.sun_dir(50.0, 20.0)
	sun.position = sd * 3500.0
	backdrop.add_child(sun)

func _space_dust() -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 160
	p.lifetime = 1.2
	p.local_coords = false
	var q := BoxMesh.new()
	q.size = Vector3(0.04, 0.04, 2.6)
	p.mesh = q
	p.material_override = MatLib.emissive(Color(0.7, 0.75, 1.0), 1.5)
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(40, 25, 60)
	p.position = Vector3(0, 0, -70)
	p.gravity = Vector3.ZERO
	p.direction = Vector3(0, 0, 1)
	p.spread = 0.0
	p.initial_velocity_min = 110.0
	p.initial_velocity_max = 140.0
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return p

# ------------------------------------------------------------------ OBJETOS
func _spawn_wave() -> void:
	var difficulty := clampf(dist / 25000.0, 0.0, 1.0)
	var roll := rng.randf()
	var z := SPAWN_Z
	if roll < 0.5:
		# Campo de meteoros
		for i in rng.randi_range(3, 5 + int(difficulty * 5)):
			_add_asteroid(Vector3(rng.randf_range(-BOUNDS.x - 4, BOUNDS.x + 4), rng.randf_range(-BOUNDS.y - 3, BOUNDS.y + 3), z - rng.randf_range(0, 80)), rng.randf_range(1.4, 4.2))
	elif roll < 0.64:
		_add_shooting_star(z)
	elif roll < 0.74 and dist > 1500.0:
		_add_black_hole(z)
	elif roll < 0.86:
		_add_satellite(Vector3(rng.randf_range(-BOUNDS.x, BOUNDS.x), rng.randf_range(-BOUNDS.y, BOUNDS.y), z))
	else:
		_add_ring(Vector3(rng.randf_range(-BOUNDS.x + 3, BOUNDS.x - 3), rng.randf_range(-BOUNDS.y + 2, BOUNDS.y - 2), z))
	# Orbes de energía casi siempre
	if rng.randf() < 0.7:
		var base := Vector3(rng.randf_range(-BOUNDS.x + 2, BOUNDS.x - 2), rng.randf_range(-BOUNDS.y + 1, BOUNDS.y - 1), z - 40.0)
		for k in 5:
			_add_orb(base + Vector3(sin(k * 0.8) * 2.5, cos(k * 0.6) * 1.5, -k * 9.0))
	# Meteoros sueltos de fondo y gigantes
	if rng.randf() < 0.25 + difficulty * 0.3:
		_add_asteroid(Vector3(rng.randf_range(-BOUNDS.x, BOUNDS.x), rng.randf_range(-BOUNDS.y, BOUNDS.y), z - 120.0), rng.randf_range(6.0, 9.0))

func _add(node: Node3D, data: Dictionary) -> void:
	add_child(node)
	data["node"] = node
	objects.append(data)

func _add_asteroid(p: Vector3, r: float) -> void:
	var mi := MeshInstance3D.new()
	mi.mesh = asteroid_meshes[rng.randi() % asteroid_meshes.size()]
	mi.scale = Vector3.ONE * r
	mi.position = p
	mi.rotation = Vector3(rng.randf() * TAU, rng.randf() * TAU, 0)
	_add(mi, {"kind": "rock", "r": r * 0.85, "spin": Vector3(rng.randf_range(-1, 1), rng.randf_range(-1, 1), rng.randf_range(-1, 1)).normalized() * rng.randf_range(0.3, 1.5), "vel": Vector3(rng.randf_range(-2, 2), rng.randf_range(-1, 1), 0), "dmg": 22.0 + r * 4.0, "passed": false})

func _add_shooting_star(z: float) -> void:
	var n := Node3D.new()
	var core := MeshInstance3D.new()
	var s := SphereMesh.new()
	s.radius = 1.0
	s.height = 2.0
	core.mesh = s
	core.material_override = MatLib.emissive(Color(1.0, 0.8, 0.4), 8.0)
	n.add_child(core)
	var glow := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(6, 6)
	glow.mesh = q
	glow.material_override = MatLib.billboard("flare", Color(1.0, 0.7, 0.3), 1.3)
	n.add_child(glow)
	var tail := CPUParticles3D.new()
	tail.amount = 60
	tail.lifetime = 0.8
	tail.local_coords = false
	var tq := QuadMesh.new()
	tq.size = Vector2(1.6, 1.6)
	tail.mesh = tq
	var tm := MatLib.billboard("glow", Color(1.0, 0.55, 0.2), 0.6).duplicate()
	tm.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	tail.material_override = tm
	tail.gravity = Vector3.ZERO
	tail.initial_velocity_max = 1.0
	var c := Curve.new()
	c.add_point(Vector2(0, 1))
	c.add_point(Vector2(1, 0))
	tail.scale_amount_curve = c
	n.add_child(tail)
	var side := -1.0 if rng.randf() < 0.5 else 1.0
	n.position = Vector3(side * (BOUNDS.x + 30.0), rng.randf_range(-BOUNDS.y, BOUNDS.y), z * 0.45)
	var vel := Vector3(-side * rng.randf_range(38.0, 55.0), rng.randf_range(-6, 6), 0)
	_add(n, {"kind": "star", "r": 1.6, "spin": Vector3.ZERO, "vel": vel, "dmg": 45.0, "passed": false})
	hud.popup("¡ESTRELLA FUGAZ!", 0, UIKit.WARN)

func _add_black_hole(z: float) -> void:
	var n := Node3D.new()
	var disc := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(26, 26)
	disc.mesh = q
	disc.material_override = MatLib.shader_mat("res://shaders/blackhole.gdshader")
	n.add_child(disc)
	var core := MeshInstance3D.new()
	var s := SphereMesh.new()
	s.radius = 3.2
	s.height = 6.4
	core.mesh = s
	core.material_override = MatLib.color(Color(0, 0, 0), 1.0)
	n.add_child(core)
	n.position = Vector3(rng.randf_range(-BOUNDS.x + 4, BOUNDS.x - 4), rng.randf_range(-BOUNDS.y + 2, BOUNDS.y - 2), z)
	_add(n, {"kind": "hole", "r": 3.2, "spin": Vector3.ZERO, "vel": Vector3.ZERO, "dmg": 100.0, "passed": false})
	hud.popup("¡AGUJERO NEGRO!", 0, Color(0.8, 0.5, 1.0))

func _add_satellite(p: Vector3) -> void:
	var n := Node3D.new()
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	MeshKit.box(st, Vector3.ZERO, Vector3(1.6, 1.6, 2.2))
	MeshKit.cylinder(st, Vector3(0, 0.8, 0), 0.05, 0.05, 1.8, 6, false)
	MeshKit.commit(st, mesh, MatLib.color(Color(0.85, 0.7, 0.25), 0.25, 1.0))
	var pn := MeshKit.begin()
	for sx in [-1.0, 1.0]:
		MeshKit.box(pn, Vector3(sx * 3.4, 0, 0), Vector3(4.6, 0.06, 1.6))
	var pm := StandardMaterial3D.new()
	pm.albedo_color = Color(0.08, 0.15, 0.45)
	pm.metallic = 0.8
	pm.roughness = 0.15
	MeshKit.commit(pn, mesh, pm)
	var bl := MeshKit.begin()
	MeshKit.box(bl, Vector3(0, 1.0, 1.15), Vector3(0.25, 0.25, 0.1))
	MeshKit.commit(bl, mesh, MatLib.emissive(Color(1.0, 0.1, 0.1), 6.0), false)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	n.add_child(mi)
	n.position = p
	_add(n, {"kind": "sat", "r": 2.4, "spin": Vector3(0, 0, rng.randf_range(-1.0, 1.0)), "vel": Vector3(rng.randf_range(-3, 3), 0, 0), "dmg": 30.0, "passed": false})

func _add_ring(p: Vector3) -> void:
	var mi := MeshInstance3D.new()
	var t := TorusMesh.new()
	t.inner_radius = 3.4
	t.outer_radius = 3.9
	t.rings = 48
	t.ring_segments = 10
	mi.mesh = t
	mi.material_override = MatLib.emissive(Color(0.2, 1.0, 0.6), 5.0)
	mi.rotation_degrees = Vector3(90, 0, 0)
	mi.position = p
	_add(mi, {"kind": "ring", "r": 3.4, "spin": Vector3.ZERO, "vel": Vector3.ZERO, "dmg": 0.0, "passed": false})

func _add_orb(p: Vector3) -> void:
	var n := Node3D.new()
	var mi := MeshInstance3D.new()
	var s := SphereMesh.new()
	s.radius = 0.45
	s.height = 0.9
	mi.mesh = s
	mi.material_override = MatLib.emissive(Color(0.3, 0.9, 1.0), 5.0)
	n.add_child(mi)
	var g := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(3.0, 3.0)
	g.mesh = q
	g.material_override = MatLib.billboard("glow", Color(0.3, 0.8, 1.0), 1.4)
	n.add_child(g)
	n.position = p
	_add(n, {"kind": "orb", "r": 1.2, "spin": Vector3.ZERO, "vel": Vector3.ZERO, "dmg": 0.0, "passed": false})

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	var ix := Input.get_axis("steer_left", "steer_right")
	var iy := Input.get_axis("brake", "accelerate")
	var want_boost := Input.is_action_pressed("nitro")
	if Game.autopilot:
		var ap := _autopilot()
		ix = ap[0]
		iy = ap[1]
		want_boost = energy > 50.0
	if state == "intro" and state_t > 1.5:
		state = "run"
	if state == "over":
		ix = 0.0
		iy = 0.0
		want_boost = false
	boost = want_boost and energy > 1.0 and state == "run"
	if boost:
		energy = maxf(0.0, energy - 20.0 * dt)
	var target_speed := 60.0 + minf(dist / 220.0, 70.0)
	if boost:
		target_speed += 55.0
	if state == "over":
		target_speed = 0.0
	speed = move_toward(speed, target_speed, (40.0 if boost else 15.0) * dt)
	if state != "over":
		dist += speed * dt
		score += speed * dt * 0.4 * mult
	combo = maxf(0.0, combo - dt / 4.0)
	if combo <= 0.0:
		mult = 1.0
	ship_vel = ship_vel.lerp(Vector2(ix, iy) * 17.0, clampf(dt * 6.0, 0.0, 1.0))
	ship_pos += ship_vel * dt
	ship_pos.x = clampf(ship_pos.x, -BOUNDS.x, BOUNDS.x)
	ship_pos.y = clampf(ship_pos.y, -BOUNDS.y, BOUNDS.y)
	next_spawn -= speed * dt
	if next_spawn <= 0.0 and state == "run":
		_spawn_wave()
		next_spawn = rng.randf_range(55.0, 95.0) * lerpf(1.0, 0.6, clampf(dist / 25000.0, 0.0, 1.0))
	_update_objects(dt)
	_update_ship(dt)
	_update_camera(dt)
	_update_hud()

func _update_objects(dt: float) -> void:
	var sp := Vector3(ship_pos.x, ship_pos.y, 0)
	var i := objects.size() - 1
	while i >= 0:
		var o: Dictionary = objects[i]
		var n: Node3D = o["node"]
		n.position += (Vector3(0, 0, speed) + o["vel"]) * dt
		if o["spin"] != Vector3.ZERO:
			n.rotate(o["spin"].normalized(), o["spin"].length() * dt)
		var d := n.position.distance_to(sp)
		var kind: String = o["kind"]
		if kind == "hole":
			# Atracción gravitatoria
			if absf(n.position.z) < 120.0:
				var pull := (Vector2(n.position.x, n.position.y) - ship_pos)
				var strength := 26.0 / maxf(pull.length(), 2.0)
				ship_vel += pull.normalized() * strength * dt * 6.0
				n.get_child(0).rotate_z(dt * 2.0)
		if state == "run" and not o["passed"]:
			if kind == "orb" and d < o["r"] + SHIP_R:
				o["passed"] = true
				orbs += 1
				energy = minf(100.0, energy + 8.0)
				score += 50 * mult
				Sfx.play("pickup", -8.0, 1.0 + (orbs % 5) * 0.08)
				n.visible = false
			elif kind == "ring" and absf(n.position.z) < 1.5:
				o["passed"] = true
				if Vector2(n.position.x, n.position.y).distance_to(ship_pos) < o["r"]:
					rings += 1
					var pts := int(400 * mult)
					score += pts
					mult = minf(8.0, mult + 0.5)
					combo = 1.0
					energy = minf(100.0, energy + 25.0)
					speed += 20.0
					hud.popup("¡ANILLO!", pts, UIKit.OK)
					Sfx.play("nitro", -4.0)
			elif o["dmg"] > 0.0 and d < o["r"] + SHIP_R:
				o["passed"] = true
				_hit(o)
			elif o["dmg"] > 0.0 and n.position.z > 2.0:
				o["passed"] = true
				var gap: float = Vector2(n.position.x, n.position.y).distance_to(ship_pos) - o["r"] - SHIP_R
				if gap < 1.6 and kind != "hole":
					near_miss += 1
					var pts2 := int(250 * mult)
					score += pts2
					mult = minf(8.0, mult + 0.5)
					combo = 1.0
					hud.popup("¡ROZÓN!", pts2)
					Sfx.play("whoosh", -6.0, 1.2)
		if n.position.z > 40.0 or absf(n.position.x) > 140.0:
			n.queue_free()
			objects.remove_at(i)
		i -= 1

func _hit(o: Dictionary) -> void:
	shield -= o["dmg"]
	shake = 1.0
	hit_flash = 1.0
	mult = 1.0
	combo = 0.0
	FX.burst(self, Vector3(ship_pos.x, ship_pos.y, -1.0), Color(1.0, 0.6, 0.3), 40, 18.0)
	Sfx.play("explosion" if o["kind"] == "hole" else "crash", -4.0)
	hud.set_lives(clampi(int(ceil(shield / 20.0)), 0, 5), 5)
	if o["kind"] == "hole":
		hud.banner("¡ABSORBIDO!", "El agujero negro te atrapó", 1.4, UIKit.DANGER)
	if shield <= 0.0:
		_game_over()
	else:
		hud.popup("ESCUDO %d%%" % int(shield), 0, UIKit.DANGER)

func _game_over() -> void:
	state = "over"
	ship.visible = false
	touch.release_all()
	FX.burst(self, Vector3(ship_pos.x, ship_pos.y, 0), Color(1.0, 0.5, 0.2), 120, 30.0)
	FX.burst(self, Vector3(ship_pos.x, ship_pos.y, 0), Color(0.5, 0.8, 1.0), 80, 20.0)
	Sfx.play("explosion", 0.0)
	var fs := int(score)
	var record := fs > best
	if record:
		Game.save["best_space"] = fs
	Game.save["coins"] = int(Game.save.get("coins", 0)) + fs / 100
	Game.write_save()
	await get_tree().create_timer(1.4).timeout
	overlays.show_results("NAVE DESTRUIDA", "Galaxia infinita · Nivel %d" % Game.current_level, [
		["Puntos", HUD._fmt(fs)],
		["Distancia", "%.1f km" % (dist / 1000.0)],
		["Orbes", str(orbs)],
		["Anillos", str(rings)],
		["Rozones", str(near_miss)],
		["Récord", HUD._fmt(maxi(best, fs))],
	], "NUEVO RÉCORD" if record else "", record)

func _update_ship(dt: float) -> void:
	var roll := -ship_vel.x * 0.035
	var pitch := ship_vel.y * 0.025
	ship.transform = Transform3D(Basis.from_euler(Vector3(pitch, -ship_vel.x * 0.01, roll)), Vector3(ship_pos.x, ship_pos.y, 0))
	var t := Time.get_ticks_msec() / 1000.0
	for f in flames:
		var s := (1.6 if boost else 1.0) * (0.85 + 0.25 * sin(t * 40.0 + f.position.x * 7.0))
		f.scale = Vector3(1.0, s, 1.0)
	hit_flash = maxf(0.0, hit_flash - dt * 2.0)
	(shield_mesh.material_override as StandardMaterial3D).albedo_color = Color(0.3, 0.7, 1.0, hit_flash * 0.35)
	for tr in trails:
		(tr[0] as FX.Trail).active = state == "run"
		var p: Vector3 = ship.global_transform * Vector3(tr[1], -0.12, 2.6)
		# El mundo avanza hacia la cámara: desplazar puntos anteriores
		for k in (tr[0] as FX.Trail).points.size():
			(tr[0] as FX.Trail).points[k] += Vector3(0, 0, speed * dt * 0.08)
		(tr[0] as FX.Trail).push(p, cam.global_position if cam else Vector3(0, 3, 10))
	dust.speed_scale = speed / 60.0
	if engine.stream:
		engine.pitch_scale = 0.8 + speed / 200.0
	backdrop.position = Vector3(-ship_pos.x * 0.05, -ship_pos.y * 0.05, 0)

func _update_camera(dt: float) -> void:
	var target := Vector3(ship_pos.x * 0.75, ship_pos.y * 0.7 + 3.0, 12.5 + (2.0 if boost else 0.0))
	cam.position = cam.position.lerp(target, clampf(dt * 5.0, 0.0, 1.0))
	cam.look_at(Vector3(ship_pos.x * 0.85, ship_pos.y * 0.85 + 0.4, -20.0), Vector3.UP)
	cam.rotate_object_local(Vector3(0, 0, 1), -ship_vel.x * 0.006)
	shake = maxf(0.0, shake - dt * 2.0)
	cam.h_offset = randf_range(-1, 1) * shake * shake * 0.4
	cam.v_offset = randf_range(-1, 1) * shake * shake * 0.3
	cam.fov = lerpf(cam.fov, 64.0 + (speed - 60.0) * 0.12 + (6.0 if boost else 0.0), clampf(dt * 3.0, 0.0, 1.0))

func _update_hud() -> void:
	hud.set_score(int(score), maxi(best, int(score)))
	hud.set_mult(mult, combo)
	hud.set_distance("DISTANCIA", "%.1f km" % (dist / 1000.0))
	hud.set_speed(speed / 8.0, energy / 100.0, boost)
	var warn := ""
	for o in objects:
		if o["kind"] == "hole" and o["node"].position.z > -260.0 and o["node"].position.z < 0.0:
			warn = "⚠ GRAVEDAD EXTREMA · ALÉJATE DEL AGUJERO NEGRO"
	hud.warn(warn)

## Piloto automático de pruebas: busca el punto más despejado.
func _autopilot() -> Array:
	var best_p := ship_pos
	var best_c := -1e9
	for cx in range(-3, 4):
		for cy in range(-2, 3):
			var cand := Vector2(cx * BOUNDS.x / 3.0, cy * BOUNDS.y / 2.0)
			var cost := -cand.distance_to(ship_pos) * 0.3
			for o in objects:
				var n: Node3D = o["node"]
				if n.position.z < -160.0 or n.position.z > 2.0:
					continue
				var dd := Vector2(n.position.x, n.position.y).distance_to(cand)
				if o["dmg"] > 0.0:
					cost -= 60.0 / maxf(dd - o["r"], 0.5)
				elif o["kind"] == "orb" or o["kind"] == "ring":
					cost += 8.0 / maxf(dd, 1.0)
			if cost > best_c:
				best_c = cost
				best_p = cand
	var d := best_p - ship_pos
	return [clampf(d.x * 0.3, -1.0, 1.0), clampf(d.y * 0.3, -1.0, 1.0)]
