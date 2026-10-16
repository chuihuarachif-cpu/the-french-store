extends Node3D
## Menú principal: garaje 3D con el auto girando + tarjetas de los 4 modos y selector de niveles.

const MODE_ORDER := ["highway", "race", "truck", "space"]
const MODE_INFO := {
	"highway": {"num": "01", "color": Color(0.0, 0.86, 1.0), "desc": "Autopista sin fin con tráfico real, obras viales y rozones al límite. La hora es aleatoria: día, amanecer, atardecer o noche."},
	"race": {"num": "02", "color": Color(1.0, 0.68, 0.0), "desc": "Capítulo 1 · Costa del Sol. Carrera corta contra 7 rivales con nitro, curvas rápidas y un gran salto."},
	"truck": {"num": "03", "color": Color(0.45, 0.95, 0.35), "desc": "Cruza el tramo peligroso: puente colgante, barro que atrapa, cuestas y curvas cerradas. La fauna y la flora son tus rivales."},
	"space": {"num": "04", "color": Color(0.78, 0.45, 1.0), "desc": "Vuelo infinito por la galaxia: esquiva meteoros, estrellas fugaces, agujeros negros y satélites a la deriva."},
}
const PAINTS := [Color(0.78, 0.04, 0.05), Color(0.02, 0.35, 0.85), Color(0.95, 0.95, 0.97), Color(0.06, 0.06, 0.07), Color(1.0, 0.55, 0.0), Color(0.1, 0.6, 0.3), Color(0.55, 0.1, 0.75)]

var car: CarVisual
var cam: Camera3D
var turntable: Node3D
var ui: CanvasLayer
var t := 0.0
var level_panel: Control

func _ready() -> void:
	Sfx.play_music("music_menu")
	_build_garage()
	_build_ui()
	if OS.get_environment("MENU_OPEN") != "":
		_open_levels(OS.get_environment("MENU_OPEN"))

func _build_garage() -> void:
	var e := EnvFactory.build(self, "sunset")
	var env: Environment = e["env"]
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.015, 0.02, 0.04)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.25, 0.3, 0.4)
	env.ambient_light_energy = 0.6
	env.fog_enabled = false
	env.glow_intensity = 0.9
	(e["sun"] as DirectionalLight3D).light_energy = 0.6
	(e["sun"] as DirectionalLight3D).shadow_enabled = false
	turntable = Node3D.new()
	add_child(turntable)
	var floor_mi := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 4.2
	disc.bottom_radius = 4.3
	disc.height = 0.12
	disc.radial_segments = 64
	floor_mi.mesh = disc
	floor_mi.position.y = -0.06
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(0.03, 0.035, 0.045)
	fm.metallic = 0.6
	fm.roughness = 0.12
	floor_mi.material_override = fm
	turntable.add_child(floor_mi)
	var ring := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 4.25
	tor.outer_radius = 4.38
	tor.rings = 96
	ring.mesh = tor
	ring.material_override = MatLib.emissive(Color(0.0, 0.8, 1.0), 4.0)
	add_child(ring)
	var big := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(80, 80)
	big.mesh = pm
	big.position.y = -0.1
	var bm := StandardMaterial3D.new()
	bm.albedo_color = Color(0.01, 0.012, 0.016)
	bm.roughness = 0.35
	bm.metallic = 0.0
	bm.metallic_specular = 0.25
	big.material_override = bm
	add_child(big)
	var wall := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 15.0
	cyl.bottom_radius = 15.0
	cyl.height = 9.0
	cyl.radial_segments = 64
	cyl.cap_top = false
	cyl.cap_bottom = false
	wall.mesh = cyl
	wall.position.y = 4.4
	var wm := StandardMaterial3D.new()
	wm.albedo_color = Color(0.02, 0.025, 0.035)
	wm.roughness = 0.6
	wm.cull_mode = BaseMaterial3D.CULL_FRONT
	wall.material_override = wm
	add_child(wall)
	# Paneles de luz verticales al fondo
	for i in 14:
		var a := PI * 0.15 + i * PI * 0.7 / 13.0
		var strip := MeshInstance3D.new()
		var bx := BoxMesh.new()
		bx.size = Vector3(0.12, 5.0, 0.12)
		strip.mesh = bx
		strip.material_override = MatLib.emissive(Color(0.25, 0.55, 1.0) if i % 2 == 0 else Color(1.0, 0.45, 0.15), 2.5)
		strip.position = Vector3(cos(a) * -14.0, 2.5, -sin(a) * 14.0)
		add_child(strip)
	for p in [Vector3(-3, 6, 3), Vector3(3, 6, -3), Vector3(0.6, 7, 0.4)]:
		var sl := SpotLight3D.new()
		sl.position = p
		sl.light_energy = 18.0
		sl.spot_range = 14.0
		sl.spot_angle = 38.0
		sl.light_color = Color(0.9, 0.95, 1.0)
		add_child(sl)
		sl.look_at(Vector3(0, 0.5, 0))
	car = CarVisual.new()
	turntable.add_child(car)
	car.setup(Game.car_color())
	cam = Camera3D.new()
	cam.fov = 42.0
	add_child(cam)

func _process(dt: float) -> void:
	t += dt
	turntable.rotation.y += dt * 0.25
	var a := 0.6 + sin(t * 0.15) * 0.25
	cam.position = Vector3(sin(a) * 10.5, 1.5 + sin(t * 0.2) * 0.25, cos(a) * 10.5)
	cam.look_at(Vector3(0, -0.55, 0))
	cam.h_offset = 0.0
	car.update_visual(dt, 0.0, 0.0)

func _build_ui() -> void:
	ui = CanvasLayer.new()
	add_child(ui)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(root)
	var grad := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.0, 0.0, 0.02, 0.0))
	g.set_color(1, Color(0.0, 0.01, 0.03, 0.85))
	gt.gradient = g
	gt.fill_from = Vector2(0, 0.35)
	gt.fill_to = Vector2(0, 1)
	grad.texture = gt
	grad.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	grad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(grad)
	var logo := VBoxContainer.new()
	logo.position = Vector2(48, 30)
	logo.add_theme_constant_override("separation", -6)
	root.add_child(logo)
	var l1 := UIKit.label("APEX", 88, "Orbitron-Black", Color.WHITE)
	l1.add_theme_color_override("font_shadow_color", Color(0.0, 0.7, 1.0, 0.6))
	l1.add_theme_constant_override("shadow_offset_y", 0)
	l1.add_theme_constant_override("shadow_outline_size", 12)
	logo.add_child(l1)
	logo.add_child(UIKit.label("M U L T I V E R S E", 26, "Orbitron-Bold", UIKit.ACCENT))
	var tag := UIKit.label("4 MODOS · 120 NIVELES CADA UNO", 18, "Rajdhani-Bold", Color(0.7, 0.76, 0.86))
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 14)
	logo.add_child(gap)
	logo.add_child(tag)
	# Monedas + ajustes
	var tr := HBoxContainer.new()
	UIKit.place(tr, Vector2(1, 0), Vector2(-700, 30))
	tr.custom_minimum_size = Vector2(660, 0)
	tr.alignment = BoxContainer.ALIGNMENT_END
	tr.add_theme_constant_override("separation", 12)
	root.add_child(tr)
	var cp := UIKit.panel()
	cp.add_child(UIKit.label("◆ %s" % HUD._fmt(int(Game.save.get("coins", 0))), 26, "Orbitron-Bold", UIKit.WARN))
	tr.add_child(cp)
	var q_names := ["RENDIMIENTO", "EQUILIBRADA", "ALTA"]
	var qb := UIKit.button("CALIDAD: %s" % q_names[Game.save["quality"]], false, 14)
	qb.pressed.connect(func():
		Game.save["quality"] = (int(Game.save["quality"]) + 1) % 3
		Game.write_save()
		Game.apply_quality()
		qb.text = "CALIDAD: %s" % q_names[Game.save["quality"]])
	tr.add_child(qb)
	var mb := UIKit.button("♪" if Game.save["music"] else "♪̶", false, 18)
	mb.text = "MÚSICA" if Game.save["music"] else "SILENCIO"
	mb.pressed.connect(func():
		Game.save["music"] = not Game.save["music"]
		Game.write_save()
		mb.text = "MÚSICA" if Game.save["music"] else "SILENCIO"
		if Game.save["music"]: Sfx.music.play()
		else: Sfx.music.stop())
	tr.add_child(mb)
	var cb := UIKit.button("CRÉDITOS", false, 14)
	cb.pressed.connect(_show_credits)
	tr.add_child(cb)
	# Pintura
	var pv := VBoxContainer.new()
	UIKit.place(pv, Vector2(1, 0.5), Vector2(-90, -170))
	pv.add_theme_constant_override("separation", 10)
	root.add_child(pv)
	pv.add_child(UIKit.label("PINTURA", 14, "Orbitron-Bold", Color(0.7, 0.76, 0.86), HORIZONTAL_ALIGNMENT_CENTER))
	for c in PAINTS:
		var b := Button.new()
		b.custom_minimum_size = Vector2(52, 36)
		var sb := StyleBoxFlat.new()
		sb.bg_color = c
		sb.set_corner_radius_all(6)
		sb.border_color = Color(1, 1, 1, 0.8)
		sb.set_border_width_all(2)
		sb.skew = Vector2(-0.2, 0)
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_stylebox_override("pressed", sb)
		b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
		b.pressed.connect(func():
			Game.save["car_color"] = c.to_html()
			Game.write_save()
			car.set_paint(c)
			Sfx.play("ui_click", -4.0))
		pv.add_child(b)
	# Tarjetas de modo
	var cards := HBoxContainer.new()
	UIKit.place(cards, Vector2(0.5, 1), Vector2(-610, -250))
	cards.custom_minimum_size = Vector2(1220, 220)
	cards.add_theme_constant_override("separation", 18)
	cards.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_child(cards)
	for m in MODE_ORDER:
		cards.add_child(_mode_card(m))
	level_panel = Control.new()
	level_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	level_panel.visible = false
	root.add_child(level_panel)

func _show_credits() -> void:
	for c in level_panel.get_children():
		c.queue_free()
	level_panel.visible = true
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.85)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	level_panel.add_child(dim)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.97), UIKit.ACCENT, 6)
	UIKit.place(card, Vector2(0.5, 0.5), Vector2(-480, -300))
	card.custom_minimum_size = Vector2(960, 0)
	level_panel.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	card.add_child(v)
	v.add_child(UIKit.label("CRÉDITOS", 40, "Orbitron-Black", UIKit.ACCENT))
	var t := UIKit.label("""Auto deportivo: \"Car Concept\" de Eric Chadwick / Darmstadt Graphics Group (Khronos glTF Sample Assets), licencia CC BY 4.0. Basado en un modelo de dominio público de Unity Fan. Modificado (sin interior) para móviles.
Zorro/lobo: \"Fox\" de PixelMannen (CC0), rigging y animación de tomkranis (CC BY 4.0), Khronos glTF Sample Assets.
Cielos HDR: Poly Haven (venice_sunset, quarry_01, spruit_sunrise, moonless_golf, blouberg_sunrise_2), CC0.
Fuentes: Orbitron y Rajdhani (SIL Open Font License).
Texturas, vehículos de tráfico, camión, nave, escenarios, efectos, música y sonidos: generados proceduralmente para Apex Multiverse.
Motor: Godot Engine 4.3 (MIT).""", 20, "Rajdhani-Bold", Color(0.85, 0.9, 0.97))
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size = Vector2(900, 0)
	v.add_child(t)
	var back := UIKit.button("VOLVER", false)
	back.pressed.connect(func(): level_panel.visible = false)
	v.add_child(back)

func _mode_card(mode: String) -> Control:
	var info: Dictionary = MODE_INFO[mode]
	var col: Color = info["color"]
	var b := Button.new()
	b.custom_minimum_size = Vector2(285, 210)
	var n := StyleBoxFlat.new()
	n.bg_color = Color(0.04, 0.06, 0.11, 0.88)
	n.border_color = col
	n.border_width_bottom = 5
	n.border_width_left = 2
	n.set_corner_radius_all(10)
	n.skew = Vector2(-0.12, 0)
	n.shadow_color = Color(col.r, col.g, col.b, 0.25)
	n.shadow_size = 14
	var h: StyleBoxFlat = n.duplicate()
	h.bg_color = Color(col.r * 0.25, col.g * 0.25, col.b * 0.25, 0.92)
	b.add_theme_stylebox_override("normal", n)
	b.add_theme_stylebox_override("hover", h)
	b.add_theme_stylebox_override("pressed", h)
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	var v := VBoxContainer.new()
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 26
	v.offset_top = 14
	v.offset_right = -18
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_theme_constant_override("separation", 0)
	b.add_child(v)
	v.add_child(UIKit.label("MODO " + info["num"], 15, "Orbitron-Bold", col))
	v.add_child(UIKit.label(Game.MODES[mode]["title"], 34, "Orbitron-Black", Color.WHITE))
	v.add_child(UIKit.label(Game.MODES[mode]["subtitle"], 20, "Rajdhani-Bold", Color(0.75, 0.8, 0.9)))
	var sp := Control.new()
	sp.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(sp)
	v.add_child(UIKit.label("NIVEL 1 / %d" % Game.MODES[mode]["levels"], 16, "Orbitron-Bold", Color(0.85, 0.9, 1.0)))
	var best := _best_text(mode)
	v.add_child(UIKit.label(best, 18, "Rajdhani-Bold", UIKit.WARN))
	var pr := ProgressBar.new()
	pr.custom_minimum_size = Vector2(0, 6)
	pr.show_percentage = false
	pr.value = 100.0 / 120.0
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(1, 1, 1, 0.12)
	var fg := StyleBoxFlat.new()
	fg.bg_color = col
	pr.add_theme_stylebox_override("background", bg)
	pr.add_theme_stylebox_override("fill", fg)
	pr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(pr)
	var pad := Control.new()
	pad.custom_minimum_size = Vector2(0, 12)
	v.add_child(pad)
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0); _open_levels(mode))
	return b

func _best_text(mode: String) -> String:
	match mode:
		"highway":
			return "RÉCORD %s" % HUD._fmt(int(Game.save.get("best_highway", 0)))
		"space":
			return "RÉCORD %s" % HUD._fmt(int(Game.save.get("best_space", 0)))
		"race":
			var t2: float = float(Game.save.get("best_race_time", 0))
			return "MEJOR TIEMPO %s" % (Game.fmt_time(t2) if t2 > 0 else "--:--")
		"truck":
			var t3: float = float(Game.save.get("best_truck_time", 0))
			return "MEJOR TIEMPO %s" % (Game.fmt_time(t3) if t3 > 0 else "--:--")
	return ""

func _open_levels(mode: String) -> void:
	for c in level_panel.get_children():
		c.queue_free()
	level_panel.visible = true
	var info: Dictionary = MODE_INFO[mode]
	var col: Color = info["color"]
	var dim := ColorRect.new()
	dim.color = Color(0, 0.01, 0.03, 0.8)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	level_panel.add_child(dim)
	var card := UIKit.panel(Color(0.04, 0.06, 0.11, 0.97), col, 6)
	UIKit.place(card, Vector2(0.5, 0.5), Vector2(-520, -320))
	card.custom_minimum_size = Vector2(1040, 640)
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	level_panel.add_child(card)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	card.add_child(v)
	v.add_child(UIKit.label("MODO %s · %s" % [info["num"], Game.MODES[mode]["title"]], 40, "Orbitron-Black", col))
	var d := UIKit.label(info["desc"], 22, "Rajdhani-Bold", Color(0.82, 0.87, 0.95))
	d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	d.custom_minimum_size = Vector2(980, 0)
	v.add_child(d)
	var sc := ScrollContainer.new()
	sc.custom_minimum_size = Vector2(0, 390)
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	var grid := GridContainer.new()
	grid.columns = 12
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	sc.add_child(grid)
	for i in range(1, Game.MODES[mode]["levels"] + 1):
		var lb := Button.new()
		lb.custom_minimum_size = Vector2(76, 58)
		lb.text = str(i)
		lb.add_theme_font_override("font", UIKit.font("Orbitron-Bold"))
		lb.add_theme_font_size_override("font_size", 20)
		var playable := i <= Game.PLAYABLE_LEVELS
		var st := StyleBoxFlat.new()
		st.set_corner_radius_all(8)
		st.bg_color = Color(col.r, col.g, col.b, 0.9) if playable else Color(1, 1, 1, 0.06)
		st.border_color = Color(1, 1, 1, 0.08)
		st.set_border_width_all(1)
		lb.add_theme_stylebox_override("normal", st)
		lb.add_theme_stylebox_override("hover", st)
		lb.add_theme_stylebox_override("pressed", st)
		lb.add_theme_stylebox_override("disabled", st)
		lb.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
		lb.add_theme_color_override("font_color", Color(0.02, 0.03, 0.06) if playable else Color(1, 1, 1, 0.3))
		lb.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.25))
		lb.disabled = not playable
		if not playable:
			lb.tooltip_text = "Próximamente"
		lb.pressed.connect(func(): Game.start_mode(mode, i))
		grid.add_child(lb)
	var hb := HBoxContainer.new()
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	hb.add_theme_constant_override("separation", 20)
	v.add_child(hb)
	var play := UIKit.button("JUGAR NIVEL 1")
	play.pressed.connect(func(): Game.start_mode(mode, 1))
	hb.add_child(play)
	var back := UIKit.button("VOLVER", false)
	back.pressed.connect(func(): level_panel.visible = false)
	hb.add_child(back)
	hb.add_child(UIKit.label("Niveles 2-120: próximamente", 18, "Rajdhani-Bold", Color(0.6, 0.66, 0.76)))
