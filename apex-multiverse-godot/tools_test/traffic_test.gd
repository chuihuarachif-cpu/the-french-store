extends Node3D

func _ready() -> void:
	EnvFactory.build(self, "day")
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(200, 200)
	ground.mesh = pm
	ground.material_override = MatLib.pbr("asphalt", 40.0)
	add_child(ground)
	var x := -14.0
	for t in TrafficFactory.TYPES:
		var v := TrafficFactory.spawn(t, TrafficFactory.PAINTS[randi() % TrafficFactory.PAINTS.size()])
		add_child(v)
		v.position = Vector3(x, 0, 0)
		v.rotation_degrees.y = float(OS.get_environment("ROT")) if OS.get_environment("ROT") != "" else 30.0
		x += 5.0
	var st := MeshKit.begin()
	MeshKit.box(st, Vector3(0, 0.5, 8), Vector3(1, 1, 1))
	MeshKit.cylinder(st, Vector3(3, 0, 8), 0.5, 0.3, 1.2, 12, true)
	var am := ArrayMesh.new()
	MeshKit.commit(st, am, MatLib.color(Color(0.9, 0.2, 0.2)))
	var mi := MeshInstance3D.new()
	mi.mesh = am
	add_child(mi)
	var cam := Camera3D.new()
	add_child(cam)
	cam.position = Vector3(float(OS.get_environment("CX")), 3.2, 9)
	cam.look_at(Vector3(float(OS.get_environment("CX")), 0.8, 0))
	cam.fov = 50
	add_child(preload("res://tools_test/shot.gd").new())
