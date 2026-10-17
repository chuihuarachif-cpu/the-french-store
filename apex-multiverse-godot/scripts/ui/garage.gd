extends Node3D
## Garaje: antes de cualquier modo el jugador elige vehículo y color (según lo que tenga disponible),
## y después el evento (carrera, trabajo o misión).

const MODE_COLOR := {"highway": Color(0.0, 0.86, 1.0), "race": Color(1.0, 0.62, 0.0), "truck": Color(0.45, 0.95, 0.35), "plane": Color(0.65, 0.55, 1.0)}

var mode := "highway"
var list: Array = []
var idx := 0
var color_idx := 0
var preview: VehicleVisual
var turntable: Node3D
var cam: Camera3D
var ui: Control
var name_lbl: Label
var price_lbl: Label
var coins_lbl: Label
var stats_box: VBoxContainer
var colors_box: HBoxContainer
var action_btn: Button
var list_box: HBoxContainer
var events_panel: Control
var t := 0.0
var _cam_dist := 9.0

func _ready() -> void:
	mode = Game.current_mode
	list = VehicleCatalog.list(mode)
	var sel: Dictionary = Game.save["selected"].get(mode, {})
	for i in list.size():
		if list[i]["id"] == sel.get("id", ""):
			idx = i
	var cols: Array = list[idx]["colors"]
	color_idx = maxi(0, cols.find(sel.get("color", cols[0])))
	Sfx.play_music("music_menu")
	_build_scene()
	_build_ui()
	_refresh()
	if OS.get_environment("GARAGE_EVENTS") == "1":
		_show_events()

func _build_scene() -> void:
	var e := EnvFactory.build(self, "sunset")
	var env: Environment = e["env"]
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.015, 0.02, 0.035)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.35, 0.4, 0.5)
	env.ambient_light_energy = 0.8
	env.fog_enabled = false
	(e["sun"] as DirectionalLight3D).light_energy = 1.1
	(e["sun"] as DirectionalLight3D).directional_shadow_max_distance = 40.0
	turntable = Node3D.new()
	add_child(turntable)
	var floor_mi := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 9.0
	disc.bottom_radius = 9.2
	disc.height = 0.2
	disc.radial_segments = 64
	floor_mi.mesh = disc
	floor_mi.position.y = -0.1
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(0.04, 0.045, 0.055)
	fm.metallic = 0.6
	fm.roughness = 0.15
	floor_mi.material_override = fm
	turntable.add_child(floor_mi)
	var ring := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 9.1
	tor.outer_radius = 9.3
	tor.rings = 96
	ring.mesh = tor
	ring.material_override = MatLib.emissive(MODE_COLOR[mode], 4.0)
	add_child(ring)
	var big := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(200, 200)
	big.mesh = pm
	big.position.y = -0.2
	big.material_override = MatLib.color(Color(0.012, 0.014, 0.02), 0.4)
	add_child(big)
	for i in 16:
		var a := PI * 0.1 + i * PI * 0.8 / 15.0
		var strip := MeshInstance3D.new()
		var bx := BoxMesh.new()
		bx.size = Vector3(0.2, 9.0, 0.2)
		strip.mesh = bx
		strip.material_override = MatLib.emissive(MODE_COLOR[mode] if i % 2 == 0 else Color(1.0, 0.45, 0.15), 2.5)
		strip.position = Vector3(cos(a) * -26.0, 4.5, -sin(a) * 26.0)
		add_child(strip)
	cam = Camera3D.new()
	cam.fov = 40.0
	add_child(cam)

func _set_preview() -> void:
	if preview:
		preview.queue_free()
	var v: Dictionary = list[idx]
	preview = VehicleVisual.new()
	turntable.add_child(preview)
	preview.setup(v, VehicleCatalog.color_of(v["colors"][color_idx]))
	if v["kind"] == "plane":
		preview.set_gear(true)
	_cam_dist = clampf(preview.length * 1.6 + 2.5, 6.0, 40.0)

func _process(dt: float) -> void:
	t += dt
	turntable.rotation.y += dt * 0.3
	var a := 0.7 + sin(t * 0.17) * 0.2
	var h := 1.8 + _cam_dist * 0.12
	cam.position = Vector3(sin(a) * _cam_dist, h, cos(a) * _cam_dist)
	cam.look_at(Vector3(-_cam_dist * 0.14, 0.4 + _cam_dist * 0.02, 0))
	if preview:
		preview.update_visual(dt, 2.0, 0.0)

# ------------------------------------------------------------------ INTERFAZ
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	ui = Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(ui)
	var col: Color = MODE_COLOR[mode]
	# cabecera
	var top := HBoxContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 24
	top.offset_right = -24
	top.offset_top = 16
	top.add_theme_constant_override("separation", 14)
	ui.add_child(top)
	var back := UIKit.button("◀", false, 22)
	back.pressed.connect(func(): Game.goto_menu())
	top.add_child(back)
	var tv := VBoxContainer.new()
	tv.add_theme_constant_override("separation", -6)
	top.add_child(tv)
	tv.add_child(UIKit.label("GARAJE · " + Game.MODES[mode]["title"], 30, "Orbitron-Black", col))
	tv.add_child(UIKit.label("Elige tu vehículo y su color", 18, "Rajdhani-Bold", Color(0.75, 0.8, 0.9)))
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(sp)
	var cp := UIKit.panel()
	coins_lbl = UIKit.label("", 26, "Orbitron-Bold", UIKit.WARN)
	cp.add_child(coins_lbl)
	top.add_child(cp)
	# panel derecho: nombre, estadísticas, colores, acción
	var right := UIKit.panel(Color(0.03, 0.05, 0.09, 0.82), col, 4)
	right.anchor_left = 1.0
	right.anchor_right = 1.0
	right.anchor_top = 0.0
	right.anchor_bottom = 0.0
	right.offset_left = -440
	right.offset_right = -24
	right.offset_top = 104
	right.offset_bottom = 520
	right.mouse_filter = Control.MOUSE_FILTER_STOP
	ui.add_child(right)
	var rv := VBoxContainer.new()
	rv.add_theme_constant_override("separation", 8)
	right.add_child(rv)
	name_lbl = UIKit.label("", 30, "Orbitron-Black", Color.WHITE)
	rv.add_child(name_lbl)
	price_lbl = UIKit.label("", 18, "Rajdhani-Bold", UIKit.WARN)
	rv.add_child(price_lbl)
	stats_box = VBoxContainer.new()
	stats_box.add_theme_constant_override("separation", 4)
	rv.add_child(stats_box)
	rv.add_child(UIKit.label("COLOR", 14, "Orbitron-Bold", Color(0.7, 0.76, 0.86)))
	colors_box = HBoxContainer.new()
	colors_box.add_theme_constant_override("separation", 8)
	rv.add_child(colors_box)
	action_btn = UIKit.button("ELEGIR", true, 22)
	action_btn.pressed.connect(_on_action)
	rv.add_child(action_btn)
	# lista inferior de vehículos
	var sc := ScrollContainer.new()
	sc.anchor_left = 0.0
	sc.anchor_right = 1.0
	sc.anchor_top = 1.0
	sc.anchor_bottom = 1.0
	sc.offset_left = 24
	sc.offset_right = -24
	sc.offset_top = -176
	sc.offset_bottom = -12
	sc.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	ui.add_child(sc)
	list_box = HBoxContainer.new()
	list_box.add_theme_constant_override("separation", 10)
	sc.add_child(list_box)
	for i in list.size():
		list_box.add_child(_card(i))
	events_panel = Control.new()
	events_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	events_panel.visible = false
	ui.add_child(events_panel)

func _card(i: int) -> Button:
	var v: Dictionary = list[i]
	var b := Button.new()
	b.custom_minimum_size = Vector2(178, 150)
	b.focus_mode = Control.FOCUS_NONE
	var vb := VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 12
	vb.offset_top = 8
	vb.offset_right = -8
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_theme_constant_override("separation", 2)
	b.add_child(vb)
	var kind_txt = {"car": "AUTO", "moto": "MOTO", "truck": "CAMIÓN", "plane": "AVIÓN"}[v["kind"]]
	vb.add_child(UIKit.label("%02d · %s" % [i + 1, kind_txt], 13, "Orbitron-Bold", MODE_COLOR[mode]))
	var nl := UIKit.label(v["name"], 19, "Rajdhani-Bold", Color.WHITE)
	nl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	nl.custom_minimum_size = Vector2(150, 0)
	vb.add_child(nl)
	var sw := ColorRect.new()
	sw.custom_minimum_size = Vector2(150, 8)
	sw.color = VehicleCatalog.color_of(v["colors"][0])
	sw.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_child(sw)
	var tot: int = int(v["speed"]) + int(v["accel"]) + int(v["handling"]) + int(v["nitro"])
	vb.add_child(UIKit.label("PODER %d" % (tot * 25), 15, "Orbitron-Bold", Color(0.85, 0.9, 1.0)))
	var st := UIKit.label("", 16, "Rajdhani-Bold", UIKit.OK)
	st.name = "State"
	vb.add_child(st)
	b.pressed.connect(func():
		idx = i
		var sel: Dictionary = Game.save["selected"].get(mode, {})
		color_idx = 0 if list[i]["id"] != sel.get("id", "") else maxi(0, list[i]["colors"].find(sel.get("color", "")))
		Sfx.play("ui_click", -4.0)
		_refresh())
	return b

func _style_card(b: Button, active: bool, owned: bool) -> void:
	var col: Color = MODE_COLOR[mode]
	var n := StyleBoxFlat.new()
	n.bg_color = Color(col.r * 0.22, col.g * 0.22, col.b * 0.22, 0.95) if active else Color(0.04, 0.06, 0.1, 0.88)
	n.border_color = col if active else Color(1, 1, 1, 0.1)
	n.set_border_width_all(3 if active else 1)
	n.set_corner_radius_all(10)
	for s in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(s, n)
	b.modulate = Color(1, 1, 1, 1.0 if owned else 0.75)

func _refresh() -> void:
	var v: Dictionary = list[idx]
	coins_lbl.text = "◆ %s" % HUD._fmt(Game.coins())
	name_lbl.text = v["name"].to_upper()
	var owned := Game.owns(v["id"])
	price_lbl.text = "EN TU GARAJE" if owned else "PRECIO ◆ %s" % HUD._fmt(int(v["price"]))
	price_lbl.add_theme_color_override("font_color", UIKit.OK if owned else UIKit.WARN)
	for c in stats_box.get_children():
		c.queue_free()
	var names := ["VELOCIDAD", "ACELERACIÓN", "MANEJO", "NITRO" if v["kind"] != "plane" else "ARMAS"]
	var keys := ["speed", "accel", "handling", "nitro"]
	for k in 4:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		var l := UIKit.label(names[k], 15, "Orbitron-Bold", Color(0.75, 0.8, 0.9))
		l.custom_minimum_size = Vector2(150, 0)
		row.add_child(l)
		var bar := ProgressBar.new()
		bar.custom_minimum_size = Vector2(200, 12)
		bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		bar.show_percentage = false
		bar.max_value = 10
		bar.value = v[keys[k]]
		var bg := StyleBoxFlat.new()
		bg.bg_color = Color(1, 1, 1, 0.12)
		bg.set_corner_radius_all(4)
		var fg := StyleBoxFlat.new()
		fg.bg_color = MODE_COLOR[mode]
		fg.set_corner_radius_all(4)
		bar.add_theme_stylebox_override("background", bg)
		bar.add_theme_stylebox_override("fill", fg)
		row.add_child(bar)
		stats_box.add_child(row)
	for c in colors_box.get_children():
		c.queue_free()
	var cols: Array = v["colors"]
	for ci in cols.size():
		var b := Button.new()
		b.custom_minimum_size = Vector2(52, 44)
		b.focus_mode = Control.FOCUS_NONE
		var sb := StyleBoxFlat.new()
		sb.bg_color = VehicleCatalog.color_of(cols[ci])
		sb.set_corner_radius_all(8)
		sb.border_color = Color.WHITE if ci == color_idx else Color(1, 1, 1, 0.2)
		sb.set_border_width_all(3 if ci == color_idx else 1)
		for s in ["normal", "hover", "pressed"]:
			b.add_theme_stylebox_override(s, sb)
		if not Game.color_owned(v["id"], ci):
			b.text = "◆"
			b.tooltip_text = "◆ %d" % VehicleCatalog.COLOR_PRICE
		b.pressed.connect(func():
			color_idx = ci
			Sfx.play("ui_click", -4.0)
			_refresh())
		colors_box.add_child(b)
	var color_ok := Game.color_owned(v["id"], color_idx)
	if not owned:
		action_btn.text = "COMPRAR ◆ %s" % HUD._fmt(int(v["price"]))
		action_btn.disabled = Game.coins() < int(v["price"])
	elif not color_ok:
		action_btn.text = "COLOR ◆ %d" % VehicleCatalog.COLOR_PRICE
		action_btn.disabled = Game.coins() < VehicleCatalog.COLOR_PRICE
	else:
		action_btn.text = "CONTINUAR ▶"
		action_btn.disabled = false
	for i in list_box.get_child_count():
		var cb: Button = list_box.get_child(i)
		_style_card(cb, i == idx, Game.owns(list[i]["id"]))
		var st: Label = cb.find_child("State", true, false)
		st.text = "✔ TUYO" if Game.owns(list[i]["id"]) else "◆ %s" % HUD._fmt(int(list[i]["price"]))
		st.add_theme_color_override("font_color", UIKit.OK if Game.owns(list[i]["id"]) else UIKit.WARN)
	if preview == null or preview.spec.get("id", "") != v["id"]:
		_set_preview()
	else:
		preview.set_paint(VehicleCatalog.color_of(cols[color_idx]))

func _on_action() -> void:
	var v: Dictionary = list[idx]
	if not Game.owns(v["id"]):
		if Game.buy_vehicle(v):
			Sfx.play("win", -6.0)
		_refresh()
		return
	if not Game.color_owned(v["id"], color_idx):
		if Game.buy_color(v["id"], color_idx):
			Sfx.play("pickup", -4.0)
		_refresh()
		return
	Game.select_vehicle(mode, v["id"], v["colors"][color_idx])
	if mode == "highway":
		Game.start_mode("highway", 0)
	else:
		_show_events()

# ------------------------------------------------------------------ EVENTOS
func _show_events() -> void:
	for c in events_panel.get_children():
		c.queue_free()
	events_panel.visible = true
	var col: Color = MODE_COLOR[mode]
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.88)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	events_panel.add_child(dim)
	var title = {"race": "MODO HISTORIA · CARRERAS", "truck": "TRABAJOS DE TRANSPORTE", "plane": "MISIONES AÉREAS"}[mode]
	var head := UIKit.label(title, 34, "Orbitron-Black", col)
	head.position = Vector2(40, 24)
	events_panel.add_child(head)
	var sub := UIKit.label("Todo ocurre en el mismo país: República de Fransterra", 18, "Rajdhani-Bold", Color(0.75, 0.8, 0.9))
	sub.position = Vector2(42, 70)
	events_panel.add_child(sub)
	var back := UIKit.button("VOLVER", false, 18)
	back.position = Vector2(1100, 22)
	back.anchor_left = 1.0
	back.anchor_right = 1.0
	back.offset_left = -200
	back.offset_right = -30
	back.pressed.connect(func(): events_panel.visible = false)
	events_panel.add_child(back)
	var sc := ScrollContainer.new()
	sc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	sc.offset_top = 110
	sc.offset_left = 30
	sc.offset_right = -30
	sc.offset_bottom = -20
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	events_panel.add_child(sc)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 12)
	sc.add_child(grid)
	var evs := Game.events(mode)
	var unlocked := Game.unlocked_events(mode)
	for i in evs.size():
		var e: Dictionary = evs[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(600, 128)
		b.focus_mode = Control.FOCUS_NONE
		var open := i < unlocked
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.05, 0.07, 0.12, 0.95) if open else Color(0.04, 0.04, 0.05, 0.9)
		sb.border_color = col if open else Color(1, 1, 1, 0.1)
		sb.border_width_left = 5
		sb.set_corner_radius_all(10)
		for s in ["normal", "hover", "pressed", "disabled"]:
			b.add_theme_stylebox_override(s, sb)
		b.disabled = not open
		var vb := VBoxContainer.new()
		vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		vb.offset_left = 18
		vb.offset_top = 8
		vb.offset_right = -12
		vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vb.add_theme_constant_override("separation", 2)
		b.add_child(vb)
		var stars := Game.event_stars(mode, i)
		vb.add_child(UIKit.label("%02d · %s   %s" % [i + 1, e["name"].to_upper(), "★".repeat(stars) + "☆".repeat(3 - stars)], 20, "Orbitron-Bold", Color.WHITE if open else Color(1, 1, 1, 0.35)))
		var info := ""
		match mode:
			"race":
				info = "%s · %d rivales · %s" % [e["dept"], e["rivals"], {"day": "Día", "night": "Noche", "sunset": "Atardecer", "sunrise": "Amanecer"}[e["time"]]]
			"truck":
				info = "%s ➜ %s · %s · pago ◆ %d" % [e["from"], e["to"], e["cargo"], e["pay"]]
			"plane":
				info = "Despegue: %s · Aterrizaje: %s · %d enemigos" % [{"airport": "Aeropuerto", "airfield": "Aeródromo", "carrier": "Portaaviones"}[e["start"]], {"airport": "Aeropuerto", "airfield": "Aeródromo", "carrier": "Portaaviones"}[e["land"]], e["enemies"]]
		vb.add_child(UIKit.label(info, 16, "Rajdhani-Bold", col if open else Color(1, 1, 1, 0.3)))
		var d := UIKit.label(e.get("desc", "Lleva la carga a destino sin multas: respeta los semáforos y no atropelles animales.") if open else "BLOQUEADO · Completa el evento anterior para desbloquear", 16, "Rajdhani-Bold", Color(0.78, 0.83, 0.92) if open else Color(1, 1, 1, 0.3))
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.custom_minimum_size = Vector2(560, 0)
		vb.add_child(d)
		b.pressed.connect(func(): Game.start_mode(mode, i))
		grid.add_child(b)
