extends Node3D

func _ready() -> void:
	var e := EnvFactory.build(self, OS.get_environment("PRESET") if OS.get_environment("PRESET") != "" else "sunset")
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(200, 200)
	ground.mesh = pm
	var gm := StandardMaterial3D.new()
	gm.albedo_texture = load("res://assets/textures/asphalt_albedo.png")
	gm.normal_enabled = true
	gm.normal_texture = load("res://assets/textures/asphalt_normal.png")
	gm.roughness_texture = load("res://assets/textures/asphalt_rough.png")
	gm.uv1_scale = Vector3(40, 40, 1)
	ground.material_override = gm
	add_child(ground)
	var car := CarVisual.new()
	add_child(car)
	car.setup(Color(0.8, 0.06, 0.05), OS.get_environment("PRESET") == "night")
	car.rotation_degrees.y = 0 if OS.get_environment("CX") != "" else 35
	print("car len ", car.length, " width ", car.width, " wheels ", car.wheels.size())
	var cam := Camera3D.new()
	cam.fov = 55
	add_child(cam)
	cam.position = Vector3(float(OS.get_environment("CX")) if OS.get_environment("CX") != "" else 4.2, 1.6, -5.2)
	cam.look_at(Vector3(0, 0.6, -6.0 if OS.get_environment("CX") != "" else 0.0))
	var om := OmniLight3D.new()
	om.position = Vector3(-6, 6, -12)
	om.omni_range = 20
	om.light_energy = 4
	add_child(om)
	var shot := preload("res://tools_test/shot.gd").new()
	add_child(shot)
