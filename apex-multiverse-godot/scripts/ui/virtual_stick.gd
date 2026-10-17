class_name VirtualStick
extends Control
## Joystick táctil: arrastrando dentro de su zona genera ejes analógicos (acciones con fuerza 0..1).

var act_left := "steer_left"
var act_right := "steer_right"
var act_up := "pitch_up"
var act_down := "pitch_down"
var radius := 110.0
var value := Vector2.ZERO
var _idx := -1
var _origin := Vector2.ZERO
var _cur := Vector2.ZERO

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	var rect := Rect2(Vector2.ZERO, size)
	var inv := get_global_transform_with_canvas().affine_inverse()
	if event is InputEventScreenTouch:
		var p: Vector2 = inv * event.position
		if event.pressed and _idx < 0 and rect.has_point(p):
			_idx = event.index
			_origin = p
			_cur = p
			_apply()
		elif not event.pressed and event.index == _idx:
			_idx = -1
			value = Vector2.ZERO
			_apply()
	elif event is InputEventScreenDrag and event.index == _idx:
		_cur = inv * event.position
		_apply()

func _apply() -> void:
	if _idx >= 0:
		var d := (_cur - _origin) / radius
		if d.length() > 1.0:
			d = d.normalized()
		value = d
	_press(act_left, maxf(-value.x, 0.0))
	_press(act_right, maxf(value.x, 0.0))
	# arrastrar hacia abajo = tirar de la palanca = subir el morro
	_press(act_up, maxf(value.y, 0.0))
	_press(act_down, maxf(-value.y, 0.0))
	queue_redraw()

func _press(a: String, s: float) -> void:
	if s > 0.05:
		Input.action_press(a, s)
	else:
		Input.action_release(a)

func release() -> void:
	_idx = -1
	value = Vector2.ZERO
	_apply()

func _draw() -> void:
	var c := _origin if _idx >= 0 else Vector2(size.x * 0.32, size.y * 0.62)
	draw_circle(c, radius, Color(0.02, 0.04, 0.08, 0.35))
	draw_arc(c, radius, 0, TAU, 48, Color(0.6, 0.55, 1.0, 0.55), 3.0, true)
	draw_circle(c + value * radius, radius * 0.38, Color(0.6, 0.55, 1.0, 0.5))
	if _idx < 0:
		var f := UIKit.font("Orbitron-Bold")
		draw_string(f, c + Vector2(-60, radius + 26), "PALANCA", HORIZONTAL_ALIGNMENT_CENTER, 120, 16, Color(1, 1, 1, 0.6))
