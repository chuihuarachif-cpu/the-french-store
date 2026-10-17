extends Node3D
## Muestra 10 vehículos de un modo (MODE, PAGE) en fila para revisar los modelos.
func _ready() -> void:
	EnvFactory.build(self, "day")
	var gm := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(400, 400)
	gm.mesh = pm
	gm.material_override = MatLib.color(Color(0.3, 0.32, 0.34), 0.8)
	add_child(gm)
	var mode := OS.get_environment("MODE") if OS.get_environment("MODE") != "" else "highway"
	var page := int(OS.get_environment("PAGE"))
	var l: Array = VehicleCatalog.list(mode)
	var sp := 7.0 if mode != "truck" else 9.0
	if mode == "plane":
		sp = 20.0
	for i in 10:
		var idx := page * 10 + i
		if idx >= l.size():
			break
		var v := VehicleVisual.new()
		add_child(v)
		v.setup(l[idx], VehicleCatalog.color_of(l[idx]["colors"][0]))
		v.position = Vector3((i % 5) * sp - sp * 2.0, 0, (i / 5) * sp * (2.4 if mode == "truck" else 1.2))
		v.rotation.y = 0.7
		v.update_visual(0.0, 0.0, 0.3)
	var cam := Camera3D.new()
	add_child(cam)
	cam.position = Vector3(0, sp * 1.6, -sp * 3.2)
	cam.look_at(Vector3(0, 0, sp * 0.6))
	cam.fov = 55.0
