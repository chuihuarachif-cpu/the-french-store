class_name HUD
extends CanvasLayer
## HUD común para todos los modos. Cada modo activa los widgets que necesita.

signal pause_pressed

var root: Control
var score_lbl: Label
var best_lbl: Label
var title_tag: Label
var mult_lbl: Label
var combo_bar: ProgressBar
var dist_lbl: Label
var dist_tag: Label
var gauge: SpeedGauge
var feed: VBoxContainer
var banner_box: VBoxContainer
var banner_title: Label
var banner_sub: Label
var lives_box: HBoxContainer
var pos_lbl: Label
var pos_box: PanelContainer
var extra_lbl: Label
var warn_lbl: Label
var _banner_tw: Tween

func _ready() -> void:
	layer = 10
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	# --- Arriba izquierda: puntuación ---
	var tl := UIKit.panel(UIKit.GLASS, UIKit.ACCENT, 4, -0.12)
	tl.position = Vector2(28, 18)
	root.add_child(tl)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", -6)
	tl.add_child(v)
	title_tag = UIKit.label("PUNTOS", 15, "Orbitron-Bold", UIKit.ACCENT)
	v.add_child(title_tag)
	score_lbl = UIKit.label("0", 44, "Orbitron-Black")
	v.add_child(score_lbl)
	best_lbl = UIKit.label("MEJOR 0", 17, "Rajdhani-Bold", Color(0.75, 0.8, 0.88))
	v.add_child(best_lbl)
	lives_box = HBoxContainer.new()
	lives_box.position = Vector2(34, 150)
	lives_box.add_theme_constant_override("separation", 6)
	root.add_child(lives_box)
	# --- Arriba centro: multiplicador ---
	var tc := VBoxContainer.new()
	tc.set_anchors_preset(Control.PRESET_CENTER_TOP)
	tc.position = Vector2(-90, 14)
	tc.custom_minimum_size = Vector2(180, 0)
	tc.alignment = BoxContainer.ALIGNMENT_CENTER
	tc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(tc)
	mult_lbl = UIKit.label("x1", 46, "Orbitron-Black", UIKit.WARN, HORIZONTAL_ALIGNMENT_CENTER)
	tc.add_child(mult_lbl)
	combo_bar = ProgressBar.new()
	combo_bar.custom_minimum_size = Vector2(180, 7)
	combo_bar.show_percentage = false
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(1, 1, 1, 0.15)
	bg.set_corner_radius_all(4)
	var fg := StyleBoxFlat.new()
	fg.bg_color = UIKit.WARN
	fg.set_corner_radius_all(4)
	combo_bar.add_theme_stylebox_override("background", bg)
	combo_bar.add_theme_stylebox_override("fill", fg)
	combo_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tc.add_child(combo_bar)
	feed = VBoxContainer.new()
	feed.alignment = BoxContainer.ALIGNMENT_CENTER
	feed.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tc.add_child(feed)
	# --- Posición (modo historia) ---
	pos_box = UIKit.panel(UIKit.GLASS, UIKit.WARN, 4, -0.12)
	pos_box.position = Vector2(28, 160)
	pos_box.visible = false
	root.add_child(pos_box)
	pos_lbl = UIKit.label("1/8", 52, "Orbitron-Black", Color.WHITE)
	pos_box.add_child(pos_lbl)
	# --- Arriba derecha: distancia + pausa ---
	var tr := HBoxContainer.new()
	tr.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	tr.position = Vector2(-330, 18)
	tr.custom_minimum_size = Vector2(300, 0)
	tr.alignment = BoxContainer.ALIGNMENT_END
	tr.add_theme_constant_override("separation", 14)
	root.add_child(tr)
	var dp := UIKit.panel(UIKit.GLASS)
	tr.add_child(dp)
	var dv := VBoxContainer.new()
	dv.add_theme_constant_override("separation", -6)
	dp.add_child(dv)
	dist_tag = UIKit.label("DISTANCIA", 13, "Orbitron-Bold", UIKit.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	dv.add_child(dist_tag)
	dist_lbl = UIKit.label("0.00 km", 30, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_RIGHT)
	dv.add_child(dist_lbl)
	var pb := UIKit.button("II", false, 26)
	pb.custom_minimum_size = Vector2(76, 64)
	pb.pressed.connect(func(): pause_pressed.emit())
	tr.add_child(pb)
	extra_lbl = UIKit.label("", 20, "Rajdhani-Bold", Color(0.85, 0.9, 1.0), HORIZONTAL_ALIGNMENT_RIGHT)
	extra_lbl.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	extra_lbl.position = Vector2(-330, 104)
	extra_lbl.size = Vector2(300, 60)
	root.add_child(extra_lbl)
	# --- Abajo derecha: velocímetro ---
	gauge = SpeedGauge.new()
	gauge.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	gauge.position = Vector2(-150, -246)
	root.add_child(gauge)
	# --- Centro: banner ---
	banner_box = VBoxContainer.new()
	banner_box.set_anchors_preset(Control.PRESET_CENTER)
	banner_box.position = Vector2(-400, -150)
	banner_box.custom_minimum_size = Vector2(800, 0)
	banner_box.alignment = BoxContainer.ALIGNMENT_CENTER
	banner_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	banner_box.modulate.a = 0.0
	root.add_child(banner_box)
	banner_title = UIKit.label("", 84, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	banner_title.add_theme_constant_override("outline_size", 10)
	banner_title.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.5))
	banner_box.add_child(banner_title)
	banner_sub = UIKit.label("", 28, "Rajdhani-Bold", UIKit.ACCENT, HORIZONTAL_ALIGNMENT_CENTER)
	banner_box.add_child(banner_sub)
	warn_lbl = UIKit.label("", 30, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	var wp := UIKit.panel(Color(0.85, 0.08, 0.15, 0.85))
	wp.set_anchors_preset(Control.PRESET_CENTER_TOP)
	wp.position = Vector2(-260, 150)
	wp.custom_minimum_size = Vector2(520, 0)
	wp.visible = false
	wp.add_child(warn_lbl)
	root.add_child(wp)

func set_score(v: int, best: int) -> void:
	score_lbl.text = _fmt(v)
	best_lbl.text = "MEJOR " + _fmt(best)

func set_title(t: String) -> void:
	title_tag.text = t

func set_mult(m: float, combo: float) -> void:
	mult_lbl.text = "x%s" % (str(int(m)) if is_equal_approx(m, round(m)) else "%.1f" % m)
	combo_bar.value = combo * 100.0
	mult_lbl.modulate = Color(1, 1, 1, 0.35 if m <= 1.0 else 1.0)

func set_distance(tag: String, text: String) -> void:
	dist_tag.text = tag
	dist_lbl.text = text

func set_extra(t: String) -> void:
	extra_lbl.text = t

func set_speed(kmh: float, nitro01: float, nitro_on: bool) -> void:
	gauge.speed = kmh
	gauge.nitro = nitro01
	gauge.nitro_active = nitro_on

func set_lives(n: int, total := 3) -> void:
	for c in lives_box.get_children():
		c.queue_free()
	for i in total:
		var p := Panel.new()
		p.custom_minimum_size = Vector2(34, 10)
		var sb := StyleBoxFlat.new()
		sb.bg_color = UIKit.OK if i < n else Color(1, 1, 1, 0.15)
		sb.set_corner_radius_all(3)
		sb.skew = Vector2(-0.3, 0)
		p.add_theme_stylebox_override("panel", sb)
		lives_box.add_child(p)

func set_position_rank(pos: int, total: int) -> void:
	pos_box.visible = true
	pos_lbl.text = "%d/%d" % [pos, total]

func warn(text: String) -> void:
	var wp: Control = warn_lbl.get_parent()
	wp.visible = text != ""
	warn_lbl.text = text

func popup(text: String, pts := 0, col := UIKit.WARN) -> void:
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var t := UIKit.label(text, 26, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	box.add_child(t)
	if pts != 0:
		box.add_child(UIKit.label("+%s" % _fmt(pts), 24, "Orbitron-Bold", col, HORIZONTAL_ALIGNMENT_CENTER))
	feed.add_child(box)
	while feed.get_child_count() > 3:
		feed.get_child(0).free()
	box.scale = Vector2(1.4, 1.4)
	box.pivot_offset = Vector2(90, 20)
	var tw := box.create_tween()
	tw.tween_property(box, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK)
	tw.tween_interval(1.0)
	tw.tween_property(box, "modulate:a", 0.0, 0.35)
	tw.tween_callback(box.queue_free)

func banner(title: String, sub := "", dur := 1.6, col := Color.WHITE) -> void:
	banner_title.text = title
	banner_title.add_theme_color_override("font_color", col)
	banner_sub.text = sub
	if _banner_tw:
		_banner_tw.kill()
	banner_box.scale = Vector2(1.25, 1.25)
	banner_box.pivot_offset = Vector2(400, 60)
	_banner_tw = create_tween()
	_banner_tw.tween_property(banner_box, "modulate:a", 1.0, 0.12)
	_banner_tw.parallel().tween_property(banner_box, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK)
	if dur > 0.0:
		_banner_tw.tween_interval(dur)
		_banner_tw.tween_property(banner_box, "modulate:a", 0.0, 0.3)

static func _fmt(v: int) -> String:
	var s := str(absi(v))
	var out := ""
	var c := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		c += 1
		if c % 3 == 0 and i > 0:
			out = "." + out
	return ("-" if v < 0 else "") + out
