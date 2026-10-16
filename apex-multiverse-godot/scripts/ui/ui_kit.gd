class_name UIKit
## Estilos y fábricas de controles para una interfaz tipo "racing" premium.

const ACCENT := Color(0.0, 0.86, 1.0)
const WARN := Color(1.0, 0.68, 0.0)
const DANGER := Color(1.0, 0.2, 0.33)
const OK := Color(0.1, 1.0, 0.55)
const GLASS := Color(0.03, 0.05, 0.09, 0.72)

static var _fonts := {}

static func font(name: String) -> Font:
	if not _fonts.has(name):
		var f: FontFile = load("res://assets/fonts/%s.woff2" % name)
		_fonts[name] = f
	return _fonts[name]

static func label(text: String, size := 24, fnt := "Rajdhani-Bold", col := Color.WHITE, align := HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font(fnt))
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.55))
	l.add_theme_constant_override("shadow_offset_x", 0)
	l.add_theme_constant_override("shadow_offset_y", 2)
	l.horizontal_alignment = align
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

static func panel_style(col := GLASS, border := Color(0, 0, 0, 0), bw := 0, radius := 10, skew := 0.0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = col
	sb.border_color = border
	sb.set_border_width_all(0)
	if bw > 0:
		sb.border_width_left = bw
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	sb.skew = Vector2(skew, 0)
	sb.shadow_color = Color(0, 0, 0, 0.35)
	sb.shadow_size = 8
	return sb

static func panel(col := GLASS, border := Color(0, 0, 0, 0), bw := 0, skew := 0.0) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", panel_style(col, border, bw, 10, skew))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p

static func button(text: String, primary := true, size := 30) -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_override("font", font("Orbitron-Bold"))
	b.add_theme_font_size_override("font_size", size)
	var base := ACCENT if primary else Color(1, 1, 1, 0.12)
	var n := StyleBoxFlat.new()
	n.bg_color = Color(base.r, base.g, base.b, 0.92 if primary else 0.14)
	n.set_corner_radius_all(8)
	n.skew = Vector2(-0.18, 0)
	n.content_margin_left = 34
	n.content_margin_right = 34
	n.content_margin_top = 14
	n.content_margin_bottom = 14
	n.shadow_color = Color(base.r, base.g, base.b, 0.35) if primary else Color(0, 0, 0, 0.3)
	n.shadow_size = 12
	var h: StyleBoxFlat = n.duplicate()
	h.bg_color = n.bg_color.lightened(0.15)
	var pr: StyleBoxFlat = n.duplicate()
	pr.bg_color = n.bg_color.darkened(0.2)
	b.add_theme_stylebox_override("normal", n)
	b.add_theme_stylebox_override("hover", h)
	b.add_theme_stylebox_override("pressed", pr)
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	b.add_theme_color_override("font_color", Color(0.02, 0.04, 0.08) if primary else Color.WHITE)
	b.add_theme_color_override("font_hover_color", Color(0.02, 0.04, 0.08) if primary else Color.WHITE)
	b.add_theme_color_override("font_pressed_color", Color(0.02, 0.04, 0.08) if primary else Color.WHITE)
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0))
	return b

## Ancla un control a un punto relativo del padre (0..1) con desplazamiento en píxeles (esquina sup. izq.).
static func place(c: Control, anchor: Vector2, offset: Vector2) -> void:
	c.anchor_left = anchor.x
	c.anchor_right = anchor.x
	c.anchor_top = anchor.y
	c.anchor_bottom = anchor.y
	c.offset_left = offset.x
	c.offset_top = offset.y
	c.offset_right = offset.x + c.custom_minimum_size.x
	c.offset_bottom = offset.y + c.custom_minimum_size.y
