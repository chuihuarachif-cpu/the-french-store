extends Node3D
## Prueba del mapa: cámara fija en POS/LOOK (o recorrido), captura tras cargar.
var streamer: WorldStreamer
var cam: Camera3D

func _ready() -> void:
	var preset := OS.get_environment("PRESET") if OS.get_environment("PRESET") != "" else "day"
	EnvFactory.build(self, preset)
	RenderingServer.global_shader_parameter_set("night", 1.0 if preset == "night" else 0.0)
	streamer = WorldStreamer.new()
	add_child(streamer)
	cam = Camera3D.new()
	cam.far = 6000.0
	add_child(cam)
	var p := _vec(OS.get_environment("POS"), Vector3(0, 40, 300))
	var l := _vec(OS.get_environment("LOOK"), Vector3(0, 20, 0))
	if OS.get_environment("ROAD") != "":
		var r: RoadPath = World.road(OS.get_environment("ROAD"))
		var s := float(OS.get_environment("S"))
		var fr := r.frame(s)
		p = fr.origin + fr.basis.z * 9.0 + fr.basis.y * 3.5 + fr.basis.x * 3.0
		l = fr.origin - fr.basis.z * 30.0 + fr.basis.x * 3.0
	if OS.get_environment("GROUND") == "1":
		p.y += World.height(p.x, p.z)
		l.y += World.height(l.x, l.z)
	cam.position = p
	cam.look_at(l)
	var t0 := Time.get_ticks_msec()
	streamer.prewarm(p, -cam.global_transform.basis.z)
	print("prewarm ms ", Time.get_ticks_msec() - t0, " chunks ", streamer.chunks.size())
	streamer.focus = p
	streamer.focus_dir = -cam.global_transform.basis.z

func _vec(s: String, d: Vector3) -> Vector3:
	if s == "":
		return d
	var a := s.split(",")
	return Vector3(float(a[0]), float(a[1]), float(a[2]))
