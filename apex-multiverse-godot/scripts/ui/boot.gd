extends Control
## Pantalla de arranque: logo animado y paso al menú.

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color(0.01, 0.015, 0.03)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var v := VBoxContainer.new()
	UIKit.place(v, Vector2(0.5, 0.5), Vector2(-400, -90))
	v.custom_minimum_size = Vector2(800, 0)
	v.add_theme_constant_override("separation", -10)
	add_child(v)
	v.add_child(UIKit.label("APEX", 110, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UIKit.label("M U L T I V E R S E", 30, "Orbitron-Bold", UIKit.ACCENT, HORIZONTAL_ALIGNMENT_CENTER))
	v.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(v, "modulate:a", 1.0, 0.6)
	tw.tween_interval(0.9)
	tw.tween_callback(func(): Game.goto_menu())
