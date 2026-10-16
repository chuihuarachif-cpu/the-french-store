extends Node3D
func _ready() -> void:
	EnvFactory.build(self, "night")
	var ground := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(100, 100)
	ground.mesh = pm
	ground.material_override = MatLib.pbr("asphalt", 20.0)
	add_child(ground)
	var sl := SpotLight3D.new()
	sl.position = Vector3(0, 0.7, 0)
	sl.light_energy = float(OS.get_environment("E")) if OS.get_environment("E") != "" else 6.0
	sl.spot_range = 60
	sl.spot_angle = 28
	sl.rotation_degrees = Vector3(-4, 0, 0)
	add_child(sl)
	var sl2 := SpotLight3D.new()
	sl2.position = Vector3(6, 5, -10)
	sl2.light_energy = 8
	sl2.spot_range = 20
	sl2.spot_angle = 40
	sl2.rotation_degrees = Vector3(-90, 0, 0)
	add_child(sl2)
	var cam := Camera3D.new()
	add_child(cam)
	cam.position = Vector3(0, 3, 6)
	cam.look_at(Vector3(0, 0, -15))
