class_name TouchControls
extends Control
## Controles táctiles multitouch dibujados a mano. Cada botón activa una acción de InputMap.
## buttons: [{action, text, icon, anchor: Vector2(0..1), offset: Vector2 px, radius, color, shape: "circle"|"pedal", size}]
## Dirección según el ajuste global (Game.control_mode()):
##   "pedals": flechas izquierda/derecha · "wheel": volante que se gira con el dedo · "tilt": inclinación del celular.

var buttons: Array = []
var steer_widget := ""          # "", "wheel", "tilt"
var steer_left := "steer_left"
var steer_right := "steer_right"
var _touch := {}  # index -> action
var _pressed := {}
var alpha := 0.55
# volante
var wheel_anchor := Vector2(0, 1)
var wheel_offset := Vector2(205, -185)
var wheel_r := 128.0
var wheel_angle := 0.0
const WHEEL_MAX := PI * 0.72
var _wheel_idx := -1
var _wheel_last := 0.0
# inclinación
var tilt_neutral := 0.0
var tilt_value := 0.0
var _tilt_cal := 0.0

func _init(layout: Array = []) -> void:
	buttons = layout

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)
	queue_redraw.call_deferred()

## Arma los controles de conducción según el ajuste global y añade botones extra (cámara, bocina…).
static func driving(extra: Array = [], nitro_text := "NITRO") -> TouchControls:
	var mode := Game.control_mode()
	var l: Array = []
	if mode == "pedals":
		l.append({"action": "steer_left", "icon": "left", "anchor": Vector2(0, 1), "offset": Vector2(118, -125), "radius": 84.0, "color": UIKit.ACCENT})
		l.append({"action": "steer_right", "icon": "right", "anchor": Vector2(0, 1), "offset": Vector2(312, -125), "radius": 84.0, "color": UIKit.ACCENT})
	l.append({"action": "brake", "text": "FRENO", "shape": "pedal", "size": Vector2(118, 150), "anchor": Vector2(1, 1), "offset": Vector2(-330, -110), "color": UIKit.DANGER, "font_size": 15})
	l.append({"action": "accelerate", "text": "GAS", "shape": "pedal", "size": Vector2(112, 200), "anchor": Vector2(1, 1), "offset": Vector2(-150, -132), "color": UIKit.OK, "font_size": 17})
	l.append({"action": "nitro", "text": nitro_text, "anchor": Vector2(1, 1), "offset": Vector2(-150, -330), "radius": 56.0, "color": Color(0.35, 0.8, 1.0), "font_size": 14})
	l.append_array(extra)
	var t := TouchControls.new(l)
	if mode == "wheel":
		t.steer_widget = "wheel"
	elif mode == "tilt":
		t.steer_widget = "tilt"
	return t

func _btn_center(b: Dictionary) -> Vector2:
	return Vector2(size.x * b["anchor"].x, size.y * b["anchor"].y) + b.get("offset", Vector2.ZERO)

func _wheel_center() -> Vector2:
	return Vector2(size.x * wheel_anchor.x, size.y * wheel_anchor.y) + wheel_offset

func _hit(p: Vector2) -> String:
	var best := ""
	var bd := 1e9
	for b in buttons:
		var c := _btn_center(b)
		var d := p.distance_to(c)
		if b.get("shape", "circle") == "pedal":
			var hs: Vector2 = b["size"] * 0.5 + Vector2(18, 18)
			if absf(p.x - c.x) < hs.x and absf(p.y - c.y) < hs.y and d < bd:
				bd = d
				best = b["action"]
		elif d < b["radius"] * 1.35 and d < bd:
			bd = d
			best = b["action"]
	return best

func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if event is InputEventScreenTouch:
		var p: Vector2 = get_global_transform_with_canvas().affine_inverse() * event.position
		if event.pressed:
			if steer_widget == "wheel" and _wheel_idx < 0 and p.distance_to(_wheel_center()) < wheel_r * 1.45:
				_wheel_idx = event.index
				_wheel_last = (p - _wheel_center()).angle()
				return
			var a := _hit(p)
			if a != "":
				_touch[event.index] = a
				_set_action(a, true)
		else:
			if event.index == _wheel_idx:
				_wheel_idx = -1
				return
			if _touch.has(event.index):
				var a: String = _touch[event.index]
				_touch.erase(event.index)
				if not _touch.values().has(a):
					_set_action(a, false)
	elif event is InputEventScreenDrag:
		var p: Vector2 = get_global_transform_with_canvas().affine_inverse() * event.position
		if event.index == _wheel_idx:
			var ang := (p - _wheel_center()).angle()
			var da := wrapf(ang - _wheel_last, -PI, PI)
			# cerca del centro el ángulo es inestable: usa el arrastre horizontal
			if p.distance_to(_wheel_center()) < wheel_r * 0.3:
				da = event.relative.x / wheel_r
			_wheel_last = ang
			wheel_angle = clampf(wheel_angle + da, -WHEEL_MAX, WHEEL_MAX)
			_apply_steer(wheel_angle / WHEEL_MAX)
			return
		var a := _hit(p)
		var prev: String = _touch.get(event.index, "")
		if a != prev:
			if prev != "":
				_touch.erase(event.index)
				if not _touch.values().has(prev):
					_set_action(prev, false)
			if a != "":
				_touch[event.index] = a
				_set_action(a, true)

func _process(dt: float) -> void:
	if steer_widget == "wheel":
		if _wheel_idx < 0 and absf(wheel_angle) > 0.001:
			# el volante vuelve solo al centro
			wheel_angle = move_toward(wheel_angle, 0.0, dt * 5.0)
			_apply_steer(wheel_angle / WHEEL_MAX)
		queue_redraw()
	elif steer_widget == "tilt" and is_visible_in_tree():
		var g := Input.get_gravity()
		if g.length() < 0.1:
			g = Input.get_accelerometer()
		var raw := -g.x / 9.8
		if Game.save.get("tilt_invert", false):
			raw = -raw
		# calibración: el primer segundo fija la posición neutral
		if _tilt_cal < 1.0:
			_tilt_cal += dt
			tilt_neutral = lerpf(tilt_neutral, raw, 0.2)
		var v := (raw - tilt_neutral) / 0.42
		if absf(v) < 0.06:
			v = 0.0
		tilt_value = clampf(v, -1.0, 1.0)
		_apply_steer(tilt_value)
		queue_redraw()

func _apply_steer(v: float) -> void:
	if v > 0.03:
		Input.action_press(steer_right, v)
		Input.action_release(steer_left)
	elif v < -0.03:
		Input.action_press(steer_left, -v)
		Input.action_release(steer_right)
	else:
		Input.action_release(steer_left)
		Input.action_release(steer_right)

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
	_wheel_idx = -1
	wheel_angle = 0.0
	if steer_widget != "":
		_apply_steer(0.0)
	queue_redraw()

func _draw() -> void:
	var f := UIKit.font("Orbitron-Black")
	for b in buttons:
		var c := _btn_center(b)
		var on: bool = _pressed.get(b["action"], false)
		var col: Color = b.get("color", Color(1, 1, 1))
		var t: String = b.get("text", "")
		var fs := int(b.get("font_size", 20))
		if b.get("shape", "circle") == "pedal":
			_draw_pedal(c, b["size"], col, on)
			if t != "":
				var tw := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
				draw_string(f, c + Vector2(-tw * 0.5, b["size"].y * 0.5 - 14.0), t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(1, 1, 1, 0.95))
			continue
		var r: float = b["radius"]
		draw_circle(c, r, Color(0.02, 0.04, 0.08, alpha * (0.85 if on else 0.55)))
		draw_arc(c, r, 0, TAU, 32, Color(col.r, col.g, col.b, 0.95 if on else 0.6), 4.0 if on else 2.5, false)
		if on:
			draw_circle(c, r * 0.92, Color(col.r, col.g, col.b, 0.22))
		var icon: String = b.get("icon", "")
		if icon == "left" or icon == "right" or icon == "up" or icon == "down":
			var dir: Vector2 = {"left": Vector2.LEFT, "right": Vector2.RIGHT, "up": Vector2.UP, "down": Vector2.DOWN}[icon]
			var perp := Vector2(-dir.y, dir.x)
			var s := r * 0.42
			draw_colored_polygon(PackedVector2Array([c + dir * s, c - dir * s * 0.6 + perp * s * 0.9, c - dir * s * 0.6 - perp * s * 0.9]), Color(1, 1, 1, 0.92))
		if t != "":
			var w := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			draw_string(f, c + Vector2(-w * 0.5, fs * 0.35 + (r * 0.5 if icon != "" else 0.0)), t, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(1, 1, 1, 0.95))
	if steer_widget == "wheel":
		_draw_wheel(_wheel_center(), wheel_r, wheel_angle)
	elif steer_widget == "tilt":
		var c := _wheel_center()
		draw_arc(c, 70, PI * 1.15, PI * 1.85, 24, Color(1, 1, 1, 0.35), 3.0, false)
		var a := PI * 1.5 + tilt_value * PI * 0.35
		draw_circle(c + Vector2(cos(a), sin(a)) * 70.0, 12.0, Color(0.35, 0.8, 1.0, 0.85))
		draw_string(UIKit.font("Orbitron-Bold"), c + Vector2(-80, 30), "INCLINA EL CELULAR", HORIZONTAL_ALIGNMENT_CENTER, 160, 13, Color(1, 1, 1, 0.55))

func _draw_pedal(c: Vector2, sz: Vector2, col: Color, on: bool) -> void:
	# pedal de aluminio con estrías de goma, se hunde al pisarlo
	var press := 0.93 if on else 1.0
	var s := sz * press
	var r := Rect2(c - s * 0.5, s)
	var body := StyleBoxFlat.new()
	body.bg_color = Color(0.13, 0.14, 0.16, 0.78) if not on else Color(0.2, 0.21, 0.24, 0.9)
	body.border_color = Color(col.r, col.g, col.b, 0.95 if on else 0.65)
	body.set_border_width_all(4 if on else 3)
	body.set_corner_radius_all(16)
	body.corner_radius_top_left = 26
	body.corner_radius_top_right = 26
	draw_style_box(body, r)
	var n := int(s.y / 22.0)
	for i in n - 1:
		var y := r.position.y + 18.0 + i * 20.0
		if y > r.end.y - 40.0:
			break
		draw_rect(Rect2(r.position.x + 16, y, s.x - 32, 8), Color(0.04, 0.04, 0.05, 0.75))
		draw_rect(Rect2(r.position.x + 16, y, s.x - 32, 2), Color(1, 1, 1, 0.12))

func _draw_wheel(c: Vector2, r: float, ang: float) -> void:
	var rim := Color(0.06, 0.065, 0.075, 0.82)
	var hi := Color(0.85, 0.88, 0.95, 0.5)
	draw_arc(c, r, 0, TAU, 48, rim, 26.0, true)
	draw_arc(c, r + 12.0, 0, TAU, 48, Color(1, 1, 1, 0.18), 2.0, true)
	draw_arc(c, r - 12.0, 0, TAU, 48, Color(1, 1, 1, 0.1), 2.0, true)
	# marca superior (centro del volante)
	var up := Vector2(sin(ang), -cos(ang))
	draw_line(c + up * (r - 13.0), c + up * (r + 13.0), Color(1.0, 0.75, 0.1, 0.95), 8.0, true)
	# radios
	for k in [-1.0, 1.0]:
		var d := Vector2(cos(ang) * k, sin(ang) * k)
		draw_line(c + d * 30.0, c + d * (r - 10.0), rim, 20.0, true)
	var down := -up
	draw_line(c + down * 30.0, c + down * (r - 10.0), rim, 20.0, true)
	draw_circle(c, 40.0, Color(0.04, 0.045, 0.055, 0.9))
	draw_arc(c, 40.0, 0, TAU, 32, hi, 2.0, true)
	draw_string(UIKit.font("Orbitron-Bold"), c + Vector2(-30, 6), "APEX", HORIZONTAL_ALIGNMENT_CENTER, 60, 14, Color(1, 1, 1, 0.7))
