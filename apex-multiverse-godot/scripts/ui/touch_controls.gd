class_name TouchControls
extends Control
## Botones táctiles multitouch dibujados a mano. Cada botón activa una acción de InputMap.
## buttons: [{action, text, anchor: Vector2(0..1), offset: Vector2 px, radius, color}]

var buttons: Array = []
var _touch := {}  # index -> action
var _pressed := {}
var alpha := 0.55

func _init(layout: Array = []) -> void:
	buttons = layout

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)
	queue_redraw.call_deferred()

func _btn_center(b: Dictionary) -> Vector2:
	return Vector2(size.x * b["anchor"].x, size.y * b["anchor"].y) + b.get("offset", Vector2.ZERO)

func _hit(p: Vector2) -> String:
	var best := ""
	var bd := 1e9
	for b in buttons:
		var d := p.distance_to(_btn_center(b))
		if d < b["radius"] * 1.35 and d < bd:
			bd = d
			best = b["action"]
	return best

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		var p: Vector2 = get_global_transform_with_canvas().affine_inverse() * event.position
		if event.pressed:
			var a := _hit(p)
			if a != "":
				_touch[event.index] = a
				_set_action(a, false)
		elif _touch.has(event.index):
			var a: String = _touch[event.index]
			_touch.erase(event.index)
			if not _touch.values().has(a):
				_set_action(a, false)
	elif event is InputEventScreenDrag:
		var p: Vector2 = get_global_transform_with_canvas().affine_inverse() * event.position
		var a := _hit(p)
		var prev: String = _touch.get(event.index, "")
		if a != prev:
			if prev != "":
				_touch.erase(event.index)
				if not _touch.values().has(prev):
					_set_action(prev, false)
			if a != "":
				_touch[event.index] = a
				_set_action(a, false)

func _set_action(action: String, on: bool) -> void:
	_pressed[action] = on
	if on:
		Input.action_press(action)
	else:
		Input.action_release(action)
	queue_redraw()

func release_all() -> void:
	for a in _pressed:
		if _pressed[a]:
			Input.action_release(a)
	_pressed.clear()
	_touch.clear()
	queue_redraw()

func _draw() -> void:
	for b in buttons:
		var c := _btn_center(b)
		var r: float = b["radius"]
		var on: bool = _pressed.get(b["action"], false)
		var col: Color = b.get("color", Color(1, 1, 1))
		draw_circle(c, r, Color(0.02, 0.04, 0.08, alpha * (0.85 if on else 0.55)))
		draw_arc(c, r, 0, TAU, 24, Color(col.r, col.g, col.b, 0.95 if on else 0.6), 4.0 if on else 2.5, false)
		if on:
			draw_circle(c, r * 0.92, Color(col.r, col.g, col.b, 0.22))
		var t: String = b.get("text", "")
		var icon: String = b.get("icon", "")
		if icon == "left" or icon == "right" or icon == "up" or icon == "down":
			var dir: Vector2 = {"left": Vector2.LEFT, "right": Vector2.RIGHT, "up": Vector2.UP, "down": Vector2.DOWN}[icon]
			var perp := Vector2(-dir.y, dir.x)
			var s := r * 0.42
			draw_colored_polygon(PackedVector2Array([c + dir * s, c - dir * s * 0.6 + perp * s * 0.9, c - dir * s * 0.6 - perp * s * 0.9]), Color(1, 1, 1, 0.92))
		if t != "":
			var f := UIKit.font("Orbitron-Black")
			var fs := int(b.get("font_size", 20))
			var w := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			draw_string(f, c + Vector2(-w * 0.5, fs * 0.35 + (r * 0.5 if icon != "" else 0.0)), t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(1, 1, 1, 0.95))

static func racing_layout() -> Array:
	return [
		{"action": "steer_left", "icon": "left", "anchor": Vector2(0, 1), "offset": Vector2(120, -120), "radius": 82.0, "color": UIKit.ACCENT},
		{"action": "steer_right", "icon": "right", "anchor": Vector2(0, 1), "offset": Vector2(310, -120), "radius": 82.0, "color": UIKit.ACCENT},
		{"action": "brake", "text": "FRENO", "anchor": Vector2(1, 1), "offset": Vector2(-330, -95), "radius": 62.0, "color": UIKit.DANGER, "font_size": 16},
		{"action": "nitro", "text": "NITRO", "anchor": Vector2(1, 1), "offset": Vector2(-140, -150), "radius": 92.0, "color": Color(0.35, 0.8, 1.0), "font_size": 22},
	]
