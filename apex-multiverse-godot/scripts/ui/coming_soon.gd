extends Control
## Marcador temporal mientras se construye el modo.
func _ready() -> void:
	var l := UIKit.label("EN CONSTRUCCIÓN", 60, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	add_child(l)
	await get_tree().create_timer(1.5).timeout
	Game.goto_menu()
