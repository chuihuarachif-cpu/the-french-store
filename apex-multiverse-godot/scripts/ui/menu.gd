extends Control
## Menú principal: mapa de la República de Fransterra + los 4 modos. Al elegir un modo se abre el garaje.

const MODE_ORDER := ["highway", "race", "truck", "plane"]
const MODE_INFO := {
	"highway": {"num": "01", "color": Color(0.0, 0.86, 1.0), "desc": "La autopista A1 rodea todo el país: túneles, viaductos, costa y campo. Tráfico de autos y motos, sin fin."},
	"race": {"num": "02", "color": Color(1.0, 0.62, 0.0), "desc": "10 carreras agresivas por la capital, la costa, la zona roja y los Alpes. Nitro, choques y derribos."},
	"truck": {"num": "03", "color": Color(0.45, 0.95, 0.35), "desc": "Carrera de camionero: empiezas en la concesionaria sin dinero, alquilas camión y remolque, haces trabajos y compras tu flota."},
	"plane": {"num": "04", "color": Color(0.65, 0.55, 1.0), "desc": "Carrera de piloto: acepta vuelos en el centro de pilotos, gana reputación para volar a aeropuertos lejanos y misiones de combate."},
}

var map_rect: TextureRect
var settings_panel: Control

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	Sfx.play_music("music_menu")
	var bg := ColorRect.new()
	bg.color = Color(0.015, 0.02, 0.035)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_build_map()
	_build_header()
	_build_cards()
	settings_panel = Control.new()
	settings_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings_panel.visible = false
	add_child(settings_panel)

func _build_map() -> void:
	# mapa del país a la derecha
	var frame := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.02, 0.04, 0.07)
	sb.border_color = Color(1, 1, 1, 0.12)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(14)
	frame.add_theme_stylebox_override("panel", sb)
	frame.anchor_left = 1.0
	frame.anchor_right = 1.0
	frame.offset_left = -470
	frame.offset_right = -24
	frame.offset_top = 96
	frame.offset_bottom = 96 + 446
	add_child(frame)
	map_rect = TextureRect.new()
	map_rect.texture = load("res://assets/world/map.png")
	map_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	map_rect.stretch_mode = TextureRect.STRETCH_SCALE
	map_rect.custom_minimum_size = Vector2(440, 440)
	frame.add_child(map_rect)
	var labels := Control.new()
	labels.mouse_filter = Control.MOUSE_FILTER_IGNORE
	map_rect.add_child(labels)
	for d in World.departments:
		var uv := World.map_uv(Vector3(d["x"], 0, d["z"]))
		var l := UIKit.label(d["name"], 13, "Orbitron-Bold", Color.WHITE)
		l.add_theme_constant_override("outline_size", 6)
		l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
		l.position = uv * 440.0 - Vector2(40, 8)
		labels.add_child(l)
	var cap := UIKit.label("REPÚBLICA DE FRANSTERRA · 10 departamentos", 14, "Rajdhani-Bold", Color(0.75, 0.8, 0.9))
	cap.anchor_left = 1.0
	cap.anchor_right = 1.0
	cap.offset_left = -470
	cap.offset_top = 548
	add_child(cap)

func _build_header() -> void:
	var logo := VBoxContainer.new()
	logo.position = Vector2(40, 22)
	logo.add_theme_constant_override("separation", -8)
	add_child(logo)
	var l1 := UIKit.label("APEX", 78, "Orbitron-Black", Color.WHITE)
	l1.add_theme_color_override("font_shadow_color", Color(0.0, 0.7, 1.0, 0.6))
	l1.add_theme_constant_override("shadow_outline_size", 12)
	logo.add_child(l1)
	logo.add_child(UIKit.label("M U L T I V E R S E", 24, "Orbitron-Bold", UIKit.ACCENT))
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 12)
	logo.add_child(gap)
	logo.add_child(UIKit.label("UN SOLO PAÍS · 4 MODOS · 80 VEHÍCULOS", 18, "Rajdhani-Bold", Color(0.7, 0.76, 0.86)))
	var tr := HBoxContainer.new()
	tr.anchor_left = 1.0
	tr.anchor_right = 1.0
	tr.offset_left = -520
	tr.offset_right = -24
	tr.offset_top = 22
	tr.alignment = BoxContainer.ALIGNMENT_END
	tr.add_theme_constant_override("separation", 12)
	add_child(tr)
	var cp := UIKit.panel()
	cp.add_child(UIKit.label("◆ %s" % HUD._fmt(Game.coins()), 24, "Orbitron-Bold", UIKit.WARN))
	tr.add_child(cp)
	var sb := UIKit.button("AJUSTES", false, 16)
	sb.pressed.connect(_show_settings)
	tr.add_child(sb)

func _build_cards() -> void:
	var cards := GridContainer.new()
	cards.columns = 2
	cards.position = Vector2(40, 214)
	cards.add_theme_constant_override("h_separation", 16)
	cards.add_theme_constant_override("v_separation", 16)
	add_child(cards)
	for m in MODE_ORDER:
		cards.add_child(_mode_card(m))

func _mode_card(mode: String) -> Control:
	var info: Dictionary = MODE_INFO[mode]
	var col: Color = info["color"]
	var b := Button.new()
	b.custom_minimum_size = Vector2(370, 230)
	b.focus_mode = Control.FOCUS_NONE
	var n := StyleBoxFlat.new()
	n.bg_color = Color(0.04, 0.06, 0.11, 0.92)
	n.border_color = col
	n.border_width_bottom = 5
	n.border_width_left = 2
	n.set_corner_radius_all(12)
	n.shadow_color = Color(col.r, col.g, col.b, 0.22)
	n.shadow_size = 12
	var h: StyleBoxFlat = n.duplicate()
	h.bg_color = Color(col.r * 0.22, col.g * 0.22, col.b * 0.22, 0.95)
	b.add_theme_stylebox_override("normal", n)
	b.add_theme_stylebox_override("hover", h)
	b.add_theme_stylebox_override("pressed", h)
	var v := VBoxContainer.new()
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 22
	v.offset_top = 14
	v.offset_right = -16
	v.offset_bottom = -12
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_theme_constant_override("separation", 4)
	b.add_child(v)
	v.add_child(UIKit.label("MODO " + info["num"], 15, "Orbitron-Bold", col))
	v.add_child(UIKit.label(Game.MODES[mode]["title"], 34, "Orbitron-Black", Color.WHITE))
	var d := UIKit.label(info["desc"], 17, "Rajdhani-Bold", Color(0.78, 0.84, 0.94))
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	d.custom_minimum_size = Vector2(330, 0)
	v.add_child(d)
	var spc := Control.new()
	spc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(spc)
	var prog := ""
	if mode == "highway":
		prog = "RÉCORD %s" % HUD._fmt(int(Game.save.get("best_highway", 0)))
	elif mode == "truck" or mode == "plane":
		prog = "%s · NIVEL %d" % [Career.fmt_eur(Career.money()), Career.level(mode)]
	else:
		prog = "COMPLETADOS %d / %d" % [Game.unlocked_events(mode) - 1, Game.events(mode).size()]
	v.add_child(UIKit.label(prog, 16, "Orbitron-Bold", UIKit.WARN))
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0); Game.open_garage(mode))
	return b

func _show_settings() -> void:
	for c in settings_panel.get_children():
		c.queue_free()
	settings_panel.visible = true
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.88)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings_panel.add_child(dim)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.97), UIKit.ACCENT, 6)
	UIKit.place(card, Vector2(0.5, 0.5), Vector2(-430, -290))
	card.custom_minimum_size = Vector2(860, 0)
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	settings_panel.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	card.add_child(v)
	v.add_child(UIKit.label("AJUSTES", 36, "Orbitron-Black", UIKit.ACCENT))
	var q_names := ["RENDIMIENTO (móviles modestos)", "EQUILIBRADA", "ALTA"]
	var qb := UIKit.button("GRÁFICOS: %s" % q_names[Game.quality()], false, 18)
	qb.pressed.connect(func():
		Game.save["quality"] = (Game.quality() + 1) % 3
		Game.write_save()
		Game.apply_quality()
		qb.text = "GRÁFICOS: %s" % q_names[Game.quality()])
	v.add_child(qb)
	var c_names := {"pedals": "FLECHAS Y PEDALES", "wheel": "VOLANTE", "tilt": "INCLINACIÓN DEL CELULAR"}
	var cb := UIKit.button("CONTROLES: %s" % c_names[Game.control_mode()], false, 18)
	cb.pressed.connect(func():
		var order := ["pedals", "wheel", "tilt"]
		Game.save["controls"] = order[(order.find(Game.control_mode()) + 1) % 3]
		Game.write_save()
		cb.text = "CONTROLES: %s" % c_names[Game.control_mode()])
	v.add_child(cb)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	v.add_child(row)
	var gb := UIKit.button("ACELERADOR: %s" % ("AUTOMÁTICO" if Game.save.get("auto_gas", false) else "PEDAL"), false, 16)
	gb.pressed.connect(func():
		Game.save["auto_gas"] = not Game.save.get("auto_gas", false)
		Game.write_save()
		gb.text = "ACELERADOR: %s" % ("AUTOMÁTICO" if Game.save.get("auto_gas", false) else "PEDAL"))
	row.add_child(gb)
	var ib := UIKit.button("INCLINACIÓN: %s" % ("INVERTIDA" if Game.save.get("tilt_invert", false) else "NORMAL"), false, 16)
	ib.pressed.connect(func():
		Game.save["tilt_invert"] = not Game.save.get("tilt_invert", false)
		Game.write_save()
		ib.text = "INCLINACIÓN: %s" % ("INVERTIDA" if Game.save.get("tilt_invert", false) else "NORMAL"))
	row.add_child(ib)
	var mb := UIKit.button("MÚSICA: %s" % ("SÍ" if Game.save["music"] else "NO"), false, 18)
	mb.pressed.connect(func():
		Game.save["music"] = not Game.save["music"]
		Game.write_save()
		mb.text = "MÚSICA: %s" % ("SÍ" if Game.save["music"] else "NO")
		if Game.save["music"]: Sfx.music.play()
		else: Sfx.music.stop())
	v.add_child(mb)
	var t := UIKit.label("""Créditos: cielos HDR de Poly Haven (CC0). Zorro: "Fox" de PixelMannen (CC0) y tomkranis (CC BY 4.0). Fuentes Orbitron y Rajdhani (OFL).
El país, sus carreteras, ciudades, vehículos, texturas, música y sonidos se generan proceduralmente para Apex Multiverse. Motor: Godot Engine (MIT).""", 16, "Rajdhani-Bold", Color(0.8, 0.85, 0.95))
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size = Vector2(800, 0)
	v.add_child(t)
	var back := UIKit.button("VOLVER", true, 20)
	back.pressed.connect(func(): settings_panel.visible = false)
	v.add_child(back)
