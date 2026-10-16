extends Node
## Captura de pantalla automática para pruebas: SHOT=ruta.png FRAMES=n
var frames := 0
func _process(_dt: float) -> void:
	frames += 1
	var target := int(OS.get_environment("FRAMES")) if OS.get_environment("FRAMES") != "" else 30
	if frames == target:
		var img := get_viewport().get_texture().get_image()
		img.save_png(OS.get_environment("SHOT") if OS.get_environment("SHOT") != "" else "/tmp/shot.png")
		print("SHOT SAVED")
		get_tree().quit()
