class_name Overlays
extends CanvasLayer
## Menú de pausa y pantalla de resultados compartidos por todos los modos.

signal resume
signal restart
signal quit_to_menu

var _pause: Control
var _results: Control

func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS

func _dim() -> ColorRect:
	var d := ColorRect.new()
	d.color = Color(0.0, 0.01, 0.03, 0.72)
	d.set_anchors_preset(Control.PRESET_FULL_RECT)
	return d

func show_pause(title := "PAUSA") -> void:
	if _pause:
		_pause.queue_free()
	_pause = _dim()
	add_child(_pause)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.position = Vector2(-220, -230)
	box.custom_minimum_size = Vector2(440, 0)
	box.add_theme_constant_override("separation", 16)
	_pause.add_child(box)
	box.add_child(UIKit.label(title, 56, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER))
	var r := UIKit.button("REANUDAR")
	r.pressed.connect(func(): hide_pause(); resume.emit())
	box.add_child(r)
	var rs := UIKit.button("REINICIAR", false)
	rs.pressed.connect(func(): hide_pause(); restart.emit())
	box.add_child(rs)
	var q := UIKit.button("MENÚ", false)
	q.pressed.connect(func(): hide_pause(); quit_to_menu.emit())
	box.add_child(q)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 12)
	box.add_child(row)
	var mus := UIKit.button("MÚSICA: %s" % ("SÍ" if Game.save["music"] else "NO"), false, 16)
	mus.pressed.connect(func():
		Game.save["music"] = not Game.save["music"]
		Game.write_save()
		mus.text = "MÚSICA: %s" % ("SÍ" if Game.save["music"] else "NO")
		if Game.save["music"]: Sfx.music.play()
		else: Sfx.music.stop())
	row.add_child(mus)
	var q_names := ["RENDIMIENTO", "EQUILIBRADA", "ALTA"]
	var ql := UIKit.button("CALIDAD: %s" % q_names[Game.save["quality"]], false, 16)
	ql.pressed.connect(func():
		Game.save["quality"] = (int(Game.save["quality"]) + 1) % 3
		Game.write_save()
		Game.apply_quality()
		ql.text = "CALIDAD: %s" % q_names[Game.save["quality"]])
	row.add_child(ql)

func hide_pause() -> void:
	if _pause:
		_pause.queue_free()
		_pause = null

## rows: [[etiqueta, valor], ...]; headline: "NUEVO RÉCORD" etc.
func show_results(title: String, subtitle: String, rows: Array, headline := "", win := true) -> void:
	if _results:
		_results.queue_free()
	_results = _dim()
	add_child(_results)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.95), UIKit.OK if win else UIKit.DANGER, 6, 0.0)
	card.set_anchors_preset(Control.PRESET_CENTER)
	card.position = Vector2(-330, -280)
	card.custom_minimum_size = Vector2(660, 0)
	_results.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	card.add_child(v)
	if headline != "":
		var h := UIKit.label(headline, 18, "Orbitron-Bold", Color(0.02, 0.04, 0.08), HORIZONTAL_ALIGNMENT_CENTER)
		var hp := PanelContainer.new()
		var sb := UIKit.panel_style(UIKit.WARN, Color(0, 0, 0, 0), 0, 6)
		sb.content_margin_top = 2
		sb.content_margin_bottom = 2
		hp.add_theme_stylebox_override("panel", sb)
		hp.add_child(h)
		v.add_child(hp)
	v.add_child(UIKit.label(title, 50, "Orbitron-Black", UIKit.OK if win else UIKit.DANGER, HORIZONTAL_ALIGNMENT_CENTER))
	var sub := UIKit.label(subtitle, 22, "Rajdhani-Bold", Color(0.8, 0.86, 0.95), HORIZONTAL_ALIGNMENT_CENTER)
	sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(sub)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 40)
	grid.add_theme_constant_override("v_separation", 4)
	v.add_child(grid)
	for r in rows:
		var a := UIKit.label(str(r[0]), 22, "Rajdhani-Bold", Color(0.65, 0.72, 0.82))
		a.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		grid.add_child(a)
		grid.add_child(UIKit.label(str(r[1]), 26, "Orbitron-Bold", Color.WHITE, HORIZONTAL_ALIGNMENT_RIGHT))
	var hb := HBoxContainer.new()
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	hb.add_theme_constant_override("separation", 18)
	v.add_child(hb)
	var again := UIKit.button("OTRA VEZ")
	again.pressed.connect(func(): restart.emit())
	hb.add_child(again)
	var menu := UIKit.button("MENÚ", false)
	menu.pressed.connect(func(): quit_to_menu.emit())
	hb.add_child(menu)
	card.modulate.a = 0.0
	card.scale = Vector2(0.9, 0.9)
	card.pivot_offset = Vector2(330, 250)
	var tw := card.create_tween()
	tw.tween_property(card, "modulate:a", 1.0, 0.25)
	tw.parallel().tween_property(card, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK)
