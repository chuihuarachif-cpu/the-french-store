extends Node
## Captura de pantalla automática para pruebas: SHOT=ruta.png FRAMES=n. Imprime métricas de rendimiento.
var frames := 0
var acc := {"proc": 0.0, "draws": 0.0, "prims": 0.0, "n": 0}
func _process(_dt: float) -> void:
	frames += 1
	var target := int(OS.get_environment("FRAMES")) if OS.get_environment("FRAMES") != "" else 30
	if frames == 5 and OS.get_environment("NOHUD") != "":
		var sc0 = get_tree().current_scene
		if sc0 and "hud" in sc0 and sc0.hud:
			sc0.hud.visible = false
		if OS.get_environment("NOHUD") >= "2":
			for n in sc0.get_children():
				if n is WorldStreamer:
					n.visible = false
				if OS.get_environment("NOHUD") == "3" and n is TrafficSystem:
					n.visible = false
				if OS.get_environment("NOHUD") == "4" and n is Node3D and not (n is Camera3D):
					n.visible = false
	if frames > target - 10:
		acc["proc"] += Performance.get_monitor(Performance.TIME_PROCESS) * 1000.0
		acc["draws"] += Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
		acc["prims"] += Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
		acc["n"] += 1
	if frames == target:
		var n: int = maxi(acc["n"], 1)
		print("PERF proceso %.2f ms · draw calls %d · triángulos %d · nodos %d" % [acc["proc"] / n, acc["draws"] / n, acc["prims"] / n, Performance.get_monitor(Performance.OBJECT_NODE_COUNT)])
		var sc = get_tree().current_scene
		if sc and "streamer" in sc and sc.streamer:
			var cnt := {}
			var lods := [0, 0, 0]
			for c in sc.streamer.chunks:
				lods[sc.streamer.chunks[c]["lod"]] += 1
				for ch in sc.streamer.chunks[c]["node"].get_children():
					if ch is MeshInstance3D:
						cnt["surf_L%d" % sc.streamer.chunks[c]["lod"]] = cnt.get("surf_L%d" % sc.streamer.chunks[c]["lod"], 0) + ch.mesh.get_surface_count()
					else:
						cnt["mm_L%d" % sc.streamer.chunks[c]["lod"]] = cnt.get("mm_L%d" % sc.streamer.chunks[c]["lod"], 0) + 1
			print("CHUNKS ", lods, " ", cnt)
		if DisplayServer.get_name() == "headless":
			get_tree().quit()
			return
		var img := get_viewport().get_texture().get_image()
		img.save_png(OS.get_environment("SHOT") if OS.get_environment("SHOT") != "" else "/tmp/shot.png")
		print("SHOT SAVED")
		get_tree().quit()
