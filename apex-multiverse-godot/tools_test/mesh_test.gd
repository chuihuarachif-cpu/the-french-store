extends Node3D
func _ready() -> void:
	EnvFactory.build(self, "day")
	var keys := ["lamp_single", "acar0", "acar1", "broad", "pine", "person", "traffic_light", "container"]
	for i in keys.size():
		var m := MultiMesh.new()
		m.transform_format = MultiMesh.TRANSFORM_3D
		m.use_custom_data = true
		m.use_colors = true
		m.mesh = WorldAssets.mesh(keys[i])
		m.instance_count = 1
		m.set_instance_color(0, Color.WHITE)
		m.set_instance_transform(0, Transform3D(Basis.IDENTITY, Vector3(i * 6.0 - 21.0, 0, 0)))
		m.set_instance_custom_data(0, Color(0.6, 0.06, 0.05, 330.5) if keys[i].begins_with("acar") else Color(0.5, 0.5, 0.45, 0.3))
		var mi := MultiMeshInstance3D.new()
		mi.multimesh = m
		add_child(mi)
	var cam := Camera3D.new()
	add_child(cam)
	cam.position = Vector3(0, 6, -22)
	cam.look_at(Vector3(0, 2, 0))
