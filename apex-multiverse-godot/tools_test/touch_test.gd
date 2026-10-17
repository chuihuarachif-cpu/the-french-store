extends Node
## Prueba táctil: abre el garaje, toca CONTINUAR y luego la primera tarjeta de evento con un leve temblor del dedo.
var f := 0
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
func _tap(p: Vector2, jitter: float) -> void:
	var d := InputEventScreenTouch.new()
	d.index = 0; d.position = p; d.pressed = true
	Input.parse_input_event(d)
	for k in 3:
		var m := InputEventScreenDrag.new()
		m.index = 0; m.position = p + Vector2(jitter * (k + 1), jitter * 0.5 * (k + 1)); m.relative = Vector2(jitter, jitter * 0.5)
		Input.parse_input_event(m)
	var u := InputEventScreenTouch.new()
	u.index = 0; u.position = p + Vector2(jitter * 3, jitter * 1.5); u.pressed = false
	Input.parse_input_event(u)
func _ctrl_center(c: Control) -> Vector2:
	return c.get_global_rect().get_center()
func _process(_dt: float) -> void:
	f += 1
	var sc = get_tree().current_scene
	if f == 30:
		print("TOUCH escena ", sc.name)
		if sc.has_method("_on_action"):
			_tap(_ctrl_center(sc.action_btn), 4.0)
	if f == 50 and sc.get("events_panel"):
		print("TOUCH eventos visibles ", sc.events_panel.visible)
		var btns = sc.events_panel.find_children("*", "Button", true, false)
		for b in btns:
			if b.custom_minimum_size.x >= 600:
				_tap(_ctrl_center(b), float(OS.get_environment("JIT")))
				break
	if f == 52 and sc.get("list_box"):
		pass
	if f == 90:
		print("TOUCH final escena ", get_tree().current_scene.name, " nivel ", Game.current_level)
		get_tree().quit()
