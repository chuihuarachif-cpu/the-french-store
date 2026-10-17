extends Node3D
## Base de carrera dentro del mapa:
##  · Camiones: Concesionaria French Store Trucks (patio con tus camiones y remolques, flota de alquiler y bolsa de trabajos).
##  · Aviones: Centro de Pilotos Saint-Exupéry (plataforma con tus aviones, alquiler y trabajos de piloto).
## Se empieza sin dinero: el primer trabajo se hace alquilando.

const COL := {"truck": Color(0.45, 0.95, 0.35), "plane": Color(0.65, 0.55, 1.0)}
const RENT_TRUCKS := ["tk_routier", "tk_kodiak", "tk_frigo"]
const RENT_PLANES := ["pl_cessna", "pl_tucano", "pl_alpha"]

var kind := "truck"
var site := {}
var yard := Transform3D()
var W := 200.0
var D := 140.0
var streamer: WorldStreamer
var atmos: Atmosphere
var cam: Camera3D
var preview: VehicleVisual
var preview_key := ""
var parked_root: Node3D
var focus := Vector3.ZERO
var cam_yaw := 0.6
var cam_dist := 16.0
var _drag := false
var t := 0.0
# UI
var ui: Control
var money_lbl: Label
var rep_lbl: Label
var clock_lbl: Label
var list_box: VBoxContainer
var detail: VBoxContainer
var tabs: HBoxContainer
var tab := "jobs"
var jobs: Array = []
var sel := -1
var opt_vehicle := 0
var opt_trailer := 0
var _vehicle_opts: Array = []
var _trailer_opts: Array = []

func _ready() -> void:
	kind = Game.current_mode if Game.current_mode in ["truck", "plane"] else "truck"
	Game.hub_return = ""
	Career.data(kind)
	Sfx.play_music("music_menu")
	_build_world()
	_build_ui()
	_show_tab("jobs")

# ------------------------------------------------------------------ MUNDO
func _build_world() -> void:
	var e := Atmosphere.create(self)
	atmos = e["atmos"]
	if kind == "truck":
		site = Career.depot("dealer")
		if site.is_empty():
			site = {"x": 0.0, "z": 0.0, "y": World.height(0, 0), "fx": 1.0, "fz": 0.0, "side": 1, "w": 200.0, "d": 140.0}
		W = float(site["w"])
		D = float(site["d"])
		var fw := Vector3(site["fx"], 0, site["fz"])
		var rt := Vector3(-fw.z, 0, fw.x) * float(site["side"])
		yard = Transform3D(Basis(Vector3.UP.cross(rt).normalized(), Vector3.UP, rt.normalized()), Vector3(site["x"], site["y"], site["z"]))
	else:
		site = World.poi("airport")
		W = 500.0
		D = 200.0
		# plataforma al norte de la pista; -Z del patio mira hacia la pista (sur)
		yard = Transform3D(Basis(Vector3.LEFT, Vector3.UP, Vector3.BACK * -1.0), Vector3(site["x"], float(site["h"]) + 0.6, site["z"] - 280.0))
		yard.basis = Basis(Vector3(-1, 0, 0), Vector3.UP, Vector3(0, 0, -1))
	streamer = WorldStreamer.new()
	add_child(streamer)
	cam = Camera3D.new()
	cam.fov = 50.0
	cam.near = 0.2
	cam.far = 2500.0
	add_child(cam)
	cam.make_current()
	streamer.focus = yard.origin
	streamer.prewarm(yard.origin, -yard.basis.z)
	parked_root = Node3D.new()
	add_child(parked_root)
	_place_fleet()
	focus = yard * Vector3(0, 0, -D * 0.12)

func _yard_xf(x: float, z: float, yaw := 0.0) -> Transform3D:
	var p := yard * Vector3(x, 0, z)
	p.y = maxf(World.height(p.x, p.z), yard.origin.y) + (0.0 if kind == "truck" else 0.0)
	return Transform3D(yard.basis * Basis(Vector3.UP, yaw), p)

func _place_fleet() -> void:
	for c in parked_root.get_children():
		c.queue_free()
	var d := Career.data(kind)
	if kind == "truck":
		# tus camiones (en fila, de cara a la salida) y la flota de alquiler
		var x := -W * 0.42
		for id in d["vehicles"]:
			var v := _truck_spec(id, "none")
			if v.is_empty():
				continue
			_park(v, _yard_xf(x, D * 0.22), "TUYO")
			x += 7.5
		x = W * 0.42
		for id in RENT_TRUCKS:
			var v2 := _truck_spec(id, "none")
			if not v2.is_empty():
				_park(v2, _yard_xf(x, D * 0.22), "ALQUILER")
				x -= 7.5
		# remolques: los tuyos y los de alquiler (uno de cada tipo)
		var zx := -W * 0.4
		for tt in Career.TRAILERS:
			var mine := Career.owns_trailer(tt)
			var spec := {"id": "trailer_" + tt, "kind": "truck", "shape": "cabover", "trailer": Career.trailer_visual(tt), "trailer_only": true, "speed": 5, "accel": 5, "handling": 5, "nitro": 5, "colors": ["blanco"]}
			_park(spec, _yard_xf(zx, D * 0.4, PI * 0.5), "TUYO" if mine else "ALQUILER")
			zx += W * 0.8 / Career.TRAILERS.size()
	else:
		var x := -W * 0.4
		for id in d["vehicles"]:
			var v := _plane_spec(id)
			if v.is_empty():
				continue
			_park(v, _yard_xf(x, D * 0.15, PI), "TUYO")
			x += 30.0
		x = W * 0.4
		for id in RENT_PLANES:
			var v2 := _plane_spec(id)
			if not v2.is_empty():
				_park(v2, _yard_xf(x, D * 0.15, PI), "ALQUILER")
				x -= 30.0

func _park(spec: Dictionary, xf: Transform3D, tag: String) -> void:
	var v := VehicleVisual.new()
	parked_root.add_child(v)
	v.setup(spec, VehicleCatalog.color_of(spec["colors"][0]), true)
	if spec.get("kind", "") == "plane":
		v.set_gear(true)
	v.global_transform = xf
	var l := Label3D.new()
	l.text = tag
	l.font = UIKit.font("Orbitron-Black")
	l.font_size = 64
	l.pixel_size = 0.012
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.modulate = UIKit.OK if tag == "TUYO" else UIKit.WARN
	l.outline_size = 18
	l.position = Vector3(0, v.height + 1.6, 0)
	v.add_child(l)

func _truck_spec(id: String, trailer: String) -> Dictionary:
	for v in VehicleCatalog.list("truck"):
		if v["id"] == id:
			var s: Dictionary = v.duplicate()
			s["trailer"] = trailer
			return s
	return {}

func _plane_spec(id: String) -> Dictionary:
	for v in VehicleCatalog.list("plane"):
		if v["id"] == id:
			return v
	var l: Array = VehicleCatalog.list("plane")
	return l[RENT_PLANES.find(id) % l.size()] if RENT_PLANES.has(id) else {}

func _show_preview(spec: Dictionary, key: String) -> void:
	if key == preview_key:
		return
	preview_key = key
	if preview:
		preview.queue_free()
		preview = null
	if spec.is_empty():
		return
	preview = VehicleVisual.new()
	add_child(preview)
	preview.setup(spec, VehicleCatalog.color_of(spec["colors"][0]))
	if spec.get("kind", "") == "plane":
		preview.set_gear(true)
	preview.global_transform = _yard_xf(0.0, -D * 0.12, PI * 0.15)
	focus = preview.global_position + Vector3(0, preview.height * 0.45, 0)
	cam_dist = clampf(preview.length * 1.15 + 5.0, 9.0, 45.0)

func _process(dt: float) -> void:
	t += dt
	if not _drag:
		cam_yaw += dt * 0.08
	var base := yard.basis.get_euler().y
	var a := base + cam_yaw
	var hgt := 2.2 + cam_dist * 0.22
	var p := focus + Vector3(sin(a) * cam_dist, hgt, cos(a) * cam_dist)
	p.y = maxf(p.y, World.height(p.x, p.z) + 1.5)
	cam.global_position = cam.global_position.lerp(p, clampf(dt * 3.0, 0.0, 1.0)) if t > 0.2 else p
	cam.look_at(focus, Vector3.UP)
	cam.h_offset = cam_dist * 0.16
	streamer.focus = cam.global_position
	streamer.focus_dir = -cam.global_transform.basis.z
	if preview:
		preview.update_visual(dt, 0.0, 0.0)
	if Engine.get_process_frames() % 30 == 0:
		_refresh_header()

func _unhandled_input(e: InputEvent) -> void:
	if e is InputEventScreenDrag:
		cam_yaw -= e.relative.x * 0.006
		_drag = true
	elif e is InputEventScreenTouch:
		_drag = e.pressed
	elif e is InputEventMouseMotion and (e.button_mask & MOUSE_BUTTON_MASK_LEFT):
		cam_yaw -= e.relative.x * 0.006

# ------------------------------------------------------------------ INTERFAZ
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	ui = Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(ui)
	var col: Color = COL[kind]
	var top := HBoxContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 20
	top.offset_right = -20
	top.offset_top = 12
	top.add_theme_constant_override("separation", 12)
	ui.add_child(top)
	var back := UIKit.button("◀", false, 22)
	back.pressed.connect(func(): Game.goto_menu())
	top.add_child(back)
	var tv := VBoxContainer.new()
	tv.add_theme_constant_override("separation", -6)
	top.add_child(tv)
	tv.add_child(UIKit.label("CONCESIONARIA FRENCH STORE TRUCKS" if kind == "truck" else "CENTRO DE PILOTOS SAINT-EXUPÉRY", 26, "Orbitron-Black", col))
	clock_lbl = UIKit.label("", 17, "Rajdhani-Bold", Color(0.78, 0.84, 0.94))
	tv.add_child(clock_lbl)
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(sp)
	var rp := UIKit.panel()
	rep_lbl = UIKit.label("", 18, "Orbitron-Bold", Color(0.85, 0.9, 1.0))
	rp.add_child(rep_lbl)
	top.add_child(rp)
	var mp := UIKit.panel()
	money_lbl = UIKit.label("", 24, "Orbitron-Black", UIKit.OK)
	mp.add_child(money_lbl)
	top.add_child(mp)
	# panel izquierdo: pestañas + lista
	var left := UIKit.panel(Color(0.03, 0.05, 0.09, 0.86), col, 3)
	left.anchor_top = 0.0
	left.anchor_bottom = 1.0
	left.offset_left = 20
	left.offset_right = 560
	left.offset_top = 92
	left.offset_bottom = -16
	left.mouse_filter = Control.MOUSE_FILTER_STOP
	ui.add_child(left)
	var lv := VBoxContainer.new()
	lv.add_theme_constant_override("separation", 8)
	left.add_child(lv)
	tabs = HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 8)
	lv.add_child(tabs)
	var names := {"jobs": "TRABAJOS", "fleet": "CAMIONES" if kind == "truck" else "AVIONES", "trailers": "REMOLQUES"}
	for k in (["jobs", "fleet", "trailers"] if kind == "truck" else ["jobs", "fleet"]):
		var b := UIKit.button(names[k], false, 16)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func(): Sfx.play("ui_click", -4.0); _show_tab(k))
		b.set_meta("tab", k)
		tabs.add_child(b)
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	sc.scroll_deadzone = 18
	lv.add_child(sc)
	list_box = VBoxContainer.new()
	list_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list_box.add_theme_constant_override("separation", 8)
	sc.add_child(list_box)
	# panel derecho: detalle y acciones
	var right := UIKit.panel(Color(0.03, 0.05, 0.09, 0.86), col, 3)
	right.anchor_left = 1.0
	right.anchor_right = 1.0
	right.anchor_top = 1.0
	right.anchor_bottom = 1.0
	right.offset_left = -500
	right.offset_right = -20
	right.offset_top = -330
	right.offset_bottom = -16
	right.mouse_filter = Control.MOUSE_FILTER_STOP
	ui.add_child(right)
	detail = VBoxContainer.new()
	detail.add_theme_constant_override("separation", 6)
	right.add_child(detail)
	_refresh_header()

func _refresh_header() -> void:
	money_lbl.text = Career.fmt_eur(Career.money())
	var lv := Career.level(kind)
	var d := Career.data(kind)
	rep_lbl.text = "REPUTACIÓN NV %d · %d / %d" % [lv, int(d["rep"]), Career.next_level_rep(kind)]
	clock_lbl.text = Atmosphere.hud_text() + "  ·  " + ("Empiezas sin dinero: alquila un camión y un remolque para tu primer trabajo" if kind == "truck" else "Alquila un avión y acepta tu primer vuelo")

func _clear(box: Control) -> void:
	for c in box.get_children():
		c.queue_free()

func _show_tab(k: String) -> void:
	tab = k
	sel = -1
	for b in tabs.get_children():
		var on: bool = b.get_meta("tab") == k
		b.modulate = Color(1, 1, 1, 1.0 if on else 0.6)
	_clear(list_box)
	_clear(detail)
	match k:
		"jobs":
			jobs = Career.truck_jobs() if kind == "truck" else Career.plane_jobs()
			for i in jobs.size():
				list_box.add_child(_job_card(i))
			detail.add_child(UIKit.label("Elige un trabajo de la lista", 20, "Rajdhani-Bold", Color(0.8, 0.85, 0.95)))
		"fleet":
			var l: Array = Career.tractors() if kind == "truck" else VehicleCatalog.list("plane")
			for i in l.size():
				list_box.add_child(_vehicle_card(l[i]))
		"trailers":
			for tt in Career.TRAILERS:
				list_box.add_child(_trailer_card(tt))

func _card_button(lines: Array, locked := false) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(500, 26 + lines.size() * 24)
	var sb := UIKit.panel_style(Color(0.05, 0.07, 0.12, 0.95) if not locked else Color(0.04, 0.04, 0.05, 0.9), COL[kind] if not locked else Color(1, 1, 1, 0.1), 2, 8)
	for s in ["normal", "hover", "pressed", "disabled"]:
		b.add_theme_stylebox_override(s, sb)
	var vb := VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 14
	vb.offset_top = 8
	vb.offset_right = -10
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_theme_constant_override("separation", 0)
	b.add_child(vb)
	for l in lines:
		var lb := UIKit.label(l[0], l[1], l[2], l[3] if not locked else Color(1, 1, 1, 0.35))
		lb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lb.custom_minimum_size = Vector2(470, 0)
		vb.add_child(lb)
	return b

func _job_card(i: int) -> Button:
	var j: Dictionary = jobs[i]
	var col: Color = COL[kind]
	var lines := []
	if kind == "truck":
		var tr: Dictionary = Career.TRAILERS[j["trailer"]]
		lines.append([("🔒 " if j["locked"] else "") + "%s · %s" % [j["cargo"].to_upper(), Career.fmt_eur(int(j["pay"]))], 19, "Orbitron-Bold", Color.WHITE])
		lines.append(["%s ➜ %s" % [j["from_name"], j["to_name"]], 16, "Rajdhani-Bold", col])
		var req := "Remolque: %s · %.1f km (+%.1f km en vacío)" % [tr["name"], j["km"], j["empty_km"]] if j["from"] != "dealer" else "Remolque: %s · %.1f km" % [tr["name"], j["km"]]
		if j["locked"]:
			req = "Requiere reputación nivel %d o más experiencia para esta distancia" % maxi(int(j["rep_req"]), Career.level("truck") + 1)
		lines.append([req, 15, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)])
	else:
		lines.append([("🔒 " if j["locked"] else "") + "%s · %s" % [j["name"].to_upper(), Career.fmt_eur(int(j["pay"]))], 18, "Orbitron-Bold", Color.WHITE])
		if j["type"] == "transport":
			lines.append(["Saint-Exupéry ➜ %s · %.1f km" % [j["to_name"], j["km"]], 16, "Rajdhani-Bold", col])
		else:
			lines.append(["Misión de combate · " + str(j.get("desc", "")), 15, "Rajdhani-Bold", col])
		if j["locked"]:
			lines.append(["Requiere reputación nivel %d" % int(j["rep_req"]), 15, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)])
	var b := _card_button(lines, j["locked"])
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0); _select_job(i))
	return b

func _vehicle_card(v: Dictionary) -> Button:
	var owned := Career.owns_truck(v["id"]) if kind == "truck" else Career.owns_plane(v["id"])
	var price := Career.truck_price(v) if kind == "truck" else Career.plane_price(v)
	var b := _card_button([[v["name"].to_upper(), 19, "Orbitron-Bold", Color.WHITE],
		["✔ EN TU FLOTA" if owned else Career.fmt_eur(price), 17, "Rajdhani-Bold", UIKit.OK if owned else UIKit.WARN],
		["Velocidad %d · Fuerza %d · Manejo %d" % [v["speed"], v["accel"], v["handling"]], 15, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)]])
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0); _select_vehicle(v))
	return b

func _trailer_card(tt: String) -> Button:
	var info: Dictionary = Career.TRAILERS[tt]
	var owned := Career.owns_trailer(tt)
	var b := _card_button([[info["name"].to_upper(), 19, "Orbitron-Bold", Color.WHITE],
		["✔ TUYO" if owned else Career.fmt_eur(int(info["price"])), 17, "Rajdhani-Bold", UIKit.OK if owned else UIKit.WARN],
		[info["desc"], 15, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)]])
	b.pressed.connect(func(): Sfx.play("ui_click", -4.0); _select_trailer(tt))
	return b

# ------------------------------------------------------------------ DETALLE
func _select_vehicle(v: Dictionary) -> void:
	_clear(detail)
	if kind == "truck":
		_show_preview(_truck_spec(v["id"], "none"), "v_" + v["id"])
	else:
		_show_preview(v, "v_" + v["id"])
	var owned := Career.owns_truck(v["id"]) if kind == "truck" else Career.owns_plane(v["id"])
	var price := Career.truck_price(v) if kind == "truck" else Career.plane_price(v)
	detail.add_child(UIKit.label(v["name"].to_upper(), 26, "Orbitron-Black", Color.WHITE))
	detail.add_child(UIKit.label("Con tu propio vehículo no pagas alquiler en los trabajos.", 16, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)))
	var b := UIKit.button("EN TU FLOTA" if owned else "COMPRAR · " + Career.fmt_eur(price), true, 20)
	b.disabled = owned or Career.money() < price
	b.pressed.connect(func():
		var ok := Career.buy_truck(v) if kind == "truck" else Career.buy_plane(v)
		if ok:
			Sfx.play("win", -6.0)
			_place_fleet()
		_refresh_header()
		_show_tab("fleet")
		_select_vehicle(v))
	detail.add_child(b)
	if not owned and Career.money() < price:
		detail.add_child(UIKit.label("Te faltan %s" % Career.fmt_eur(price - Career.money()), 16, "Rajdhani-Bold", UIKit.DANGER))

func _select_trailer(tt: String) -> void:
	_clear(detail)
	var spec := {"id": "trailer_" + tt, "kind": "truck", "shape": "cabover", "trailer": Career.trailer_visual(tt), "trailer_only": true, "speed": 5, "accel": 5, "handling": 5, "nitro": 5, "colors": ["blanco"]}
	_show_preview(spec, "t_" + tt)
	var info: Dictionary = Career.TRAILERS[tt]
	var owned := Career.owns_trailer(tt)
	detail.add_child(UIKit.label(info["name"].to_upper(), 26, "Orbitron-Black", Color.WHITE))
	detail.add_child(UIKit.label(info["desc"], 16, "Rajdhani-Bold", Color(0.78, 0.83, 0.92)))
	var b := UIKit.button("TUYO" if owned else "COMPRAR · " + Career.fmt_eur(int(info["price"])), true, 20)
	b.disabled = owned or Career.money() < int(info["price"])
	b.pressed.connect(func():
		if Career.buy_trailer(tt):
			Sfx.play("win", -6.0)
			_place_fleet()
		_refresh_header()
		_show_tab("trailers")
		_select_trailer(tt))
	detail.add_child(b)

func _select_job(i: int) -> void:
	sel = i
	opt_vehicle = 0
	opt_trailer = 0
	var j: Dictionary = jobs[i]
	_vehicle_opts.clear()
	_trailer_opts.clear()
	var d := Career.data(kind)
	for id in d["vehicles"]:
		_vehicle_opts.append({"id": id, "rent": false})
	for id in (RENT_TRUCKS if kind == "truck" else RENT_PLANES):
		_vehicle_opts.append({"id": id, "rent": true})
	if kind == "truck":
		var need: String = j["trailer"]
		if Career.owns_trailer(need):
			_trailer_opts.append({"t": need, "rent": false})
		_trailer_opts.append({"t": need, "rent": true})
	_render_job()

func _render_job() -> void:
	_clear(detail)
	var j: Dictionary = jobs[sel]
	var vo: Dictionary = _vehicle_opts[opt_vehicle]
	var spec := _truck_spec(vo["id"], Career.trailer_visual(j["trailer"])) if kind == "truck" else _plane_spec(vo["id"])
	_show_preview(spec, "j_%d_%s" % [sel, vo["id"]])
	var pay := int(j["pay"])
	var rent := 0
	detail.add_child(UIKit.label((j["cargo"] if kind == "truck" else j["name"]).to_upper(), 22, "Orbitron-Black", Color.WHITE))
	if j["locked"]:
		detail.add_child(UIKit.label("🔒 Necesitas más reputación: haz trabajos más cortos primero.", 17, "Rajdhani-Bold", UIKit.DANGER))
		return
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	detail.add_child(row)
	var prev := UIKit.button("◀", false, 16)
	prev.pressed.connect(func(): opt_vehicle = (opt_vehicle - 1 + _vehicle_opts.size()) % _vehicle_opts.size(); _render_job())
	row.add_child(prev)
	var vname: String = spec.get("name", vo["id"])
	var vrent := int(pay * (Career.RENT_TRUCK if kind == "truck" else Career.RENT_PLANE)) if vo["rent"] else 0
	rent += vrent
	var vl := UIKit.label(("%s · alquiler %s" % [vname, Career.fmt_eur(vrent)]) if vo["rent"] else ("%s · propio" % vname), 17, "Rajdhani-Bold", UIKit.WARN if vo["rent"] else UIKit.OK)
	vl.custom_minimum_size = Vector2(330, 0)
	row.add_child(vl)
	var nxt := UIKit.button("▶", false, 16)
	nxt.pressed.connect(func(): opt_vehicle = (opt_vehicle + 1) % _vehicle_opts.size(); _render_job())
	row.add_child(nxt)
	if kind == "truck":
		var to: Dictionary = _trailer_opts[mini(opt_trailer, _trailer_opts.size() - 1)]
		var trent := int(pay * Career.RENT_TRAILER) if to["rent"] else 0
		rent += trent
		var tl := UIKit.label("Remolque %s · %s" % [Career.TRAILERS[to["t"]]["name"], ("alquiler " + Career.fmt_eur(trent)) if to["rent"] else "propio"], 17, "Rajdhani-Bold", UIKit.WARN if to["rent"] else UIKit.OK)
		detail.add_child(tl)
		if _trailer_opts.size() > 1:
			var tb := UIKit.button("CAMBIAR REMOLQUE", false, 14)
			tb.pressed.connect(func(): opt_trailer = (opt_trailer + 1) % _trailer_opts.size(); _render_job())
			detail.add_child(tb)
	detail.add_child(UIKit.label("Pago %s − alquiler %s = %s (antes de multas y daños)" % [Career.fmt_eur(pay), Career.fmt_eur(rent), Career.fmt_eur(pay - rent)], 16, "Rajdhani-Bold", Color(0.85, 0.9, 1.0)))
	var go := UIKit.button("ACEPTAR TRABAJO ▶", true, 22)
	go.pressed.connect(func(): _start_job(rent, spec))
	detail.add_child(go)

func _start_job(rent: int, spec: Dictionary) -> void:
	var j: Dictionary = jobs[sel].duplicate()
	j["rent"] = rent
	j["vehicle"] = spec
	j["career"] = kind
	Game.career_job = j
	Game.hub_return = kind
	Sfx.play("win", -8.0)
	Game.start_mode(kind, 0)
