extends Node3D
func _ready() -> void:
	EnvFactory.build(self, "sunset")
	var hud := HUD.new()
	add_child(hud)
	var o := Overlays.new()
	add_child(o)
	if OS.get_environment("PAUSE") == "1":
		o.show_pause()
	else:
		o.show_results("¡VICTORIA!", "Has vencido a Vega \"La Sombra\". La liga Apex ya conoce tu nombre.", [["Posición", "1 / 8"], ["Tiempo total", "1:08.20"], ["Mejor vuelta", "0:33.10"], ["Derribos", "3"], ["Estrellas", "★★★"]], "CAPÍTULO 1 COMPLETADO", true)
	var cam := Camera3D.new()
	add_child(cam)
