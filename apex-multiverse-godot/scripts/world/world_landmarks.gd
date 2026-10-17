class_name WorldLandmarks
extends Node3D
## Elementos únicos del país que se muestran cuando el jugador está cerca:
## pistas de aterrizaje, portaaviones, puente levadizo, Torre Lumière, grúas del puerto y el tren.

const DRAW_PERIOD := 90.0
const DRAW_OPEN_AT := 52.0   # segundos del ciclo en que empieza a abrirse
const DRAW_MOVE := 7.0
const DRAW_HOLD := 20.0

var items := {}   # nombre -> {"node": Node3D, "pos": Vector3, "range": float, "build": Callable}
var drawbridge_leaves: Array[Node3D] = []
var draw_frame := Transform3D()
var draw_road: RoadPath
var train: Node3D
var train_road: RoadPath
var train_s := 0.0

func _ready() -> void:
	var air: Dictionary = World.poi("airport")
	var air2: Dictionary = World.poi("airfield")
	_reg("runway_main", Vector3(air["x"], World.height(air["x"], air["z"]), air["z"]), 6000.0, func(): return _runway(air, true))
	_reg("runway_field", Vector3(air2["x"], World.height(air2["x"], air2["z"]), air2["z"]), 4500.0, func(): return _runway(air2, false))
	var cv: Dictionary = World.poi("carrier")
	_reg("carrier", Vector3(cv["x"], 0, cv["z"]), 7000.0, func(): return _carrier(cv))
	var park: Dictionary = World.poi("park")
	_reg("tower", Vector3(park["x"], World.height(park["x"], park["z"]), park["z"]), 9000.0, func(): return _tower())
	_reg("cranes", Vector3(4300, 0, -250), 3000.0, func(): return _cranes())
	for r in World.roads:
		if r.draw_s >= 0.0:
			draw_road = r
			draw_frame = r.frame(r.draw_s)
			_reg("drawbridge", draw_frame.origin, 2500.0, func(): return _drawbridge())
		if r.kind == "rail":
			train_road = r

func _reg(n: String, p: Vector3, rng: float, build: Callable) -> void:
	items[n] = {"node": null, "pos": p, "range": rng, "build": build}

func update(focus: Vector3, force := false) -> void:
	for k in items:
		var it: Dictionary = items[k]
		var d := Vector2(it["pos"].x - focus.x, it["pos"].z - focus.z).length()
		if d < it["range"] and it["node"] == null:
			it["node"] = it["build"].call()
			add_child(it["node"])
		elif d > it["range"] * 1.15 and it["node"] != null:
			it["node"].queue_free()
			it["node"] = null
			if k == "drawbridge":
				drawbridge_leaves.clear()
	_animate_drawbridge()
	_update_train(focus)

# ------------------------------------------------------------------ PUENTE LEVADIZO
## Ángulo de apertura (0 cerrado .. 1 abierto) en el instante t.
static func drawbridge_open(t: float) -> float:
	var u := fposmod(t, DRAW_PERIOD)
	if u < DRAW_OPEN_AT:
		return 0.0
	u -= DRAW_OPEN_AT
	if u < DRAW_MOVE:
		return smoothstep(0.0, DRAW_MOVE, u)
	u -= DRAW_MOVE
	if u < DRAW_HOLD:
		return 1.0
	u -= DRAW_HOLD
	if u < DRAW_MOVE:
		return 1.0 - smoothstep(0.0, DRAW_MOVE, u)
	return 0.0

## Segundos hasta que empiece a abrirse (negativo si ya está abierto o moviéndose).
static func drawbridge_time_to_open(t: float) -> float:
	var u := fposmod(t, DRAW_PERIOD)
	return DRAW_OPEN_AT - u

func _animate_drawbridge() -> void:
	if drawbridge_leaves.is_empty():
		return
	var a := drawbridge_open(World.time) * deg_to_rad(72.0)
	drawbridge_leaves[0].rotation.x = -a
	drawbridge_leaves[1].rotation.x = a

func _drawbridge() -> Node3D:
	var root := Node3D.new()
	root.transform = draw_frame
	var span := 60.0
	var hw := 7.6
	var con := MeshData.new()
	var col := Color(0.55, 0.57, 0.6)
	# torres en los extremos
	for z in [-span - 6.0, span + 6.0]:
		for x in [-hw - 2.5, hw + 2.5]:
			con.box(Transform3D(Basis.IDENTITY, Vector3(x, 4.0, z)), Vector3(3.5, 30.0, 8.0), col.darkened(0.1), Vector2.ZERO, 5)
			con.box(Transform3D(Basis.IDENTITY, Vector3(x, 20.0, z)), Vector3(4.2, 2.0, 9.0), Color(0.75, 0.3, 0.15), Vector2.ZERO, 5)
		con.box(Transform3D(Basis.IDENTITY, Vector3(0, 17.0, z)), Vector3(hw * 2 + 8.0, 2.0, 3.0), col, Vector2.ZERO, 7)
	var base := MeshInstance3D.new()
	base.mesh = con.to_mesh(WorldAssets.mat("concrete"))
	root.add_child(base)
	drawbridge_leaves.clear()
	for sgn in [-1.0, 1.0]:
		var pivot := Node3D.new()
		pivot.position = Vector3(0, 0, sgn * span)
		root.add_child(pivot)
		var leaf := MeshData.new()
		var zc = -sgn * span * 0.5
		var deck := MeshData.new()
		deck.quad(Vector3(-hw, 0.0, zc + span * 0.5), Vector3(hw, 0.0, zc + span * 0.5), Vector3(hw, 0.0, zc - span * 0.5), Vector3(-hw, 0.0, zc - span * 0.5), Color.WHITE,
			Vector2(-hw, 0), Vector2(hw, 0), Vector2(hw, span), Vector2(-hw, span))
		leaf.box(Transform3D(Basis.IDENTITY, Vector3(0, -1.0, zc)), Vector3(hw * 2 + 1.0, 1.9, span), Color(0.3, 0.32, 0.35), Vector2.ZERO, 6)
		for x in [-hw - 0.3, hw + 0.3]:
			leaf.box(Transform3D(Basis.IDENTITY, Vector3(x, 0.6, zc)), Vector3(0.3, 1.2, span), Color(0.8, 0.25, 0.12), Vector2.ZERO, 5)
		var mi := MeshInstance3D.new()
		var mesh := deck.to_mesh(WorldAssets.mat("road_avenue"))
		leaf.to_mesh(WorldAssets.mat("metal"), false, true, mesh)
		mi.mesh = mesh
		pivot.add_child(mi)
		drawbridge_leaves.append(pivot)
	return root

# ------------------------------------------------------------------ PISTAS
func _runway(a: Dictionary, main: bool) -> Node3D:
	var root := Node3D.new()
	var L: float = a["len"]
	var Wd: float = a["w"]
	var y: float = a["h"] + 0.25
	var cx: float = a["x"]
	var cz: float = a["z"]
	root.position = Vector3(cx, y, cz)
	var rw := MeshData.new()
	# la pista va a lo largo del eje X (oeste -> este). UV.y = distancia desde la cabecera oeste.
	rw.quad(Vector3(-L * 0.5, 0, Wd * 0.5), Vector3(L * 0.5, 0, Wd * 0.5), Vector3(L * 0.5, 0, -Wd * 0.5), Vector3(-L * 0.5, 0, -Wd * 0.5), Color.WHITE,
		Vector2(-Wd * 0.5, 0), Vector2(-Wd * 0.5, L), Vector2(Wd * 0.5, L), Vector2(Wd * 0.5, 0), Vector2.ZERO, Vector3.UP)
	var mat: ShaderMaterial = WorldAssets.mat("runway").duplicate()
	mat.set_shader_parameter("len", L)
	mat.set_shader_parameter("wid", Wd)
	var mi := MeshInstance3D.new()
	mi.mesh = rw.to_mesh(mat)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mi)
	# rodadura y plataforma
	var tw := MeshData.new()
	var tz := -150.0 if main else -90.0
	tw.quad(Vector3(-L * 0.45, -0.02, tz + 12), Vector3(L * 0.45, -0.02, tz + 12), Vector3(L * 0.45, -0.02, tz - 12), Vector3(-L * 0.45, -0.02, tz - 12), Color(0.5, 0.5, 0.52))
	for k in 5:
		var x := lerpf(-L * 0.42, L * 0.42, k / 4.0)
		tw.quad(Vector3(x - 10, -0.03, tz), Vector3(x + 10, -0.03, tz), Vector3(x + 10, -0.03, -Wd * 0.5), Vector3(x - 10, -0.03, -Wd * 0.5), Color(0.5, 0.5, 0.52))
	if main:
		tw.quad(Vector3(-420, -0.02, -380), Vector3(420, -0.02, -380), Vector3(420, -0.02, -170), Vector3(-420, -0.02, -170), Color(0.62, 0.62, 0.63))
	var mi2 := MeshInstance3D.new()
	mi2.mesh = tw.to_mesh(WorldAssets.mat("concrete"))
	mi2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mi2)
	# luces de aproximación
	var lights := MeshData.new()
	for k in 12:
		for sx in [-1.0, 1.0]:
			lights.box(Transform3D(Basis.IDENTITY, Vector3(sx * (L * 0.5 + 30.0 + k * 30.0), 0.5, 0)), Vector3(1.0, 1.0, 8.0), Color(1, 1, 1, 1))
	var mi3 := MeshInstance3D.new()
	mi3.mesh = lights.to_mesh(WorldAssets.mat("tunnel_light"))
	root.add_child(mi3)
	return root

## Marco de la pista: origen en la cabecera oeste, -Z = rumbo de despegue hacia el este.
static func runway_frame(a: Dictionary, from_east := false) -> Transform3D:
	var L: float = a["len"]
	var y: float = a["h"] + 0.25
	if from_east:
		return Transform3D(Basis(Vector3.UP, PI * 0.5), Vector3(a["x"] + L * 0.5, y, a["z"]))
	return Transform3D(Basis(Vector3.UP, -PI * 0.5), Vector3(a["x"] - L * 0.5, y, a["z"]))

# ------------------------------------------------------------------ PORTAAVIONES
const CARRIER_DECK := 19.0

static func carrier_frame() -> Transform3D:
	var cv: Dictionary = World.poi("carrier")
	return Transform3D(Basis.IDENTITY, Vector3(cv["x"], CARRIER_DECK, cv["z"]))

func _carrier(cv: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.position = Vector3(cv["x"], 0, cv["z"])
	var hull := MeshData.new()
	var grey := Color(0.42, 0.45, 0.48)
	var L := 330.0
	# casco por secciones
	var secs := 12
	for i in secs:
		var z0 := lerpf(-L * 0.5, L * 0.5, float(i) / secs)
		var z1 := lerpf(-L * 0.5, L * 0.5, float(i + 1) / secs)
		var w0 := 20.0 * sin(clampf((z0 + L * 0.5) / 60.0, 0.15, 1.0) * PI * 0.5)
		var w1 := 20.0 * sin(clampf((z1 + L * 0.5) / 60.0, 0.15, 1.0) * PI * 0.5)
		for sx in [-1.0, 1.0]:
			var a := Vector3(sx * w0, -8, z0)
			var b := Vector3(sx * w1, -8, z1)
			var c := Vector3(sx * (w1 + 6.0), CARRIER_DECK - 1.0, z1)
			var d := Vector3(sx * (w0 + 6.0), CARRIER_DECK - 1.0, z0)
			if sx > 0:
				hull.quad(b, a, d, c, grey)
			else:
				hull.quad(a, b, c, d, grey)
	hull.box(Transform3D(Basis.IDENTITY, Vector3(6, CARRIER_DECK - 0.6, 0)), Vector3(70.0, 1.2, L), Color(0.3, 0.32, 0.34), Vector2.ZERO, 5)
	# isla
	hull.box(Transform3D(Basis.IDENTITY, Vector3(34, CARRIER_DECK + 10, 30)), Vector3(10, 20, 36), grey.lightened(0.1), Vector2(2, 0.3), 5)
	hull.box(Transform3D(Basis.IDENTITY, Vector3(34, CARRIER_DECK + 26, 34)), Vector3(4, 14, 4), grey, Vector2.ZERO, 5)
	var mi := MeshInstance3D.new()
	mi.mesh = hull.to_mesh(WorldAssets.mat("concrete"))
	root.add_child(mi)
	# cubierta con marcas (reutiliza el shader de pista)
	var deck := MeshData.new()
	deck.quad(Vector3(-8, CARRIER_DECK + 0.02, L * 0.5 - 5), Vector3(20, CARRIER_DECK + 0.02, L * 0.5 - 5), Vector3(20, CARRIER_DECK + 0.02, -L * 0.5 + 5), Vector3(-8, CARRIER_DECK + 0.02, -L * 0.5 + 5), Color.WHITE,
		Vector2(-14, 0), Vector2(14, 0), Vector2(14, L - 10), Vector2(-14, L - 10), Vector2.ZERO, Vector3.UP)
	var dm: ShaderMaterial = WorldAssets.mat("runway").duplicate()
	dm.set_shader_parameter("len", L - 10.0)
	dm.set_shader_parameter("wid", 28.0)
	var mi2 := MeshInstance3D.new()
	mi2.mesh = deck.to_mesh(dm)
	mi2.position.x = 0.0
	root.add_child(mi2)
	return root

# ------------------------------------------------------------------ TORRE LUMIÈRE
func _tower() -> Node3D:
	var root := Node3D.new()
	var park: Dictionary = World.poi("park")
	root.position = Vector3(park["x"], World.height(park["x"], park["z"]) - 1.0, park["z"])
	var md := MeshData.new()
	var col := Color(0.42, 0.33, 0.25)
	var H := 300.0
	for k in 40:
		var t0 := k / 40.0
		var t1 := (k + 1) / 40.0
		var r0 := 52.0 * pow(1.0 - t0, 2.2) + 3.0
		var r1 := 52.0 * pow(1.0 - t1, 2.2) + 3.0
		for i in 4:
			var a := PI * 0.25 + PI * 0.5 * i
			var p0 := Vector3(cos(a) * r0, t0 * H, sin(a) * r0)
			var p1 := Vector3(cos(a) * r1, t1 * H, sin(a) * r1)
			var th := lerpf(4.5, 1.0, t0)
			var dir := (p1 - p0).normalized()
			var side := Vector3(-sin(a), 0, cos(a)) * th
			var out := Vector3(cos(a), 0, sin(a)) * th
			md.quad(p0 - side + out, p0 + side + out, p1 + side + out, p1 - side + out, col)
			md.quad(p0 + side - out, p0 - side - out, p1 - side - out, p1 + side - out, col)
			md.quad(p0 + side + out, p0 + side - out, p1 + side - out, p1 + side + out, col)
			md.quad(p0 - side - out, p0 - side + out, p1 - side + out, p1 - side - out, col)
	for lvl in [[57.0, 40.0], [115.0, 20.0], [276.0, 6.0]]:
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, lvl[0], 0)), Vector3(lvl[1] * 1.6, 5.0, lvl[1] * 1.6), col.darkened(0.1), Vector2.ZERO, 7)
	# arcos de la base
	for i in 4:
		var a2 := PI * 0.5 * i
		var b := Basis(Vector3.UP, a2)
		for k in 8:
			var t := k / 8.0
			var x0 := lerpf(-30.0, 30.0, t)
			var x1 := lerpf(-30.0, 30.0, t + 0.125)
			var y0 := 40.0 + 14.0 * sin(t * PI)
			var y1 := 40.0 + 14.0 * sin((t + 0.125) * PI)
			md.quad(b * Vector3(x0, y0, 36), b * Vector3(x1, y1, 36), b * Vector3(x1, y1 + 3, 36), b * Vector3(x0, y0 + 3, 36), col)
	md.prism(Vector3(0, H, 0), 2.0, 0.3, 24.0, 6, Color(0.8, 0.8, 0.8))
	var lights := MeshData.new()
	lights.box(Transform3D(Basis.IDENTITY, Vector3(0, H + 24, 0)), Vector3(2, 2, 2), Color(1, 1, 1, 1))
	var mi := MeshInstance3D.new()
	var mesh := md.to_mesh(WorldAssets.mat("metal"))
	lights.to_mesh(WorldAssets.mat("lamp"), false, true, mesh)
	mi.mesh = mesh
	root.add_child(mi)
	return root

# ------------------------------------------------------------------ GRÚAS DEL PUERTO
func _cranes() -> Node3D:
	var root := Node3D.new()
	var md := MeshData.new()
	var cols := [Color(0.85, 0.3, 0.1), Color(0.1, 0.45, 0.75)]
	for i in 5:
		var x := 3850.0 + i * 220.0
		var z := -330.0
		var y: float = World.height(x, z + 60.0)
		var c: Color = cols[i % 2]
		var xf := Transform3D(Basis.IDENTITY, Vector3(x, y, z))
		for lx in [-9.0, 9.0]:
			for lz in [-8.0, 8.0]:
				md.box(xf * Transform3D(Basis.IDENTITY, Vector3(lx, 22.0, lz)), Vector3(1.6, 44.0, 1.6), c, Vector2.ZERO, 5)
		md.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, 45.0, -10.0)), Vector3(4.0, 3.0, 110.0), c, Vector2.ZERO, 7)
		md.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, 40.0, 4.0)), Vector3(22.0, 2.0, 2.0), c, Vector2.ZERO, 7)
		md.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, 48.0, 6.0)), Vector3(8.0, 6.0, 10.0), Color(0.9, 0.9, 0.9), Vector2(2, 0.5), 5)
	var mi := MeshInstance3D.new()
	mi.mesh = md.to_mesh(WorldAssets.mat("metal"))
	root.add_child(mi)
	return root

# ------------------------------------------------------------------ TREN
func _update_train(focus: Vector3) -> void:
	if train_road == null:
		return
	# Ida y vuelta por la vía a 28 m/s
	var L := train_road.length
	var period := L * 2.0 / 28.0
	var u := fposmod(World.time + 40.0, period) / period
	var dir := 1.0 if u < 0.5 else -1.0
	train_s = (u * 2.0 if u < 0.5 else (1.0 - u) * 2.0) * L
	var head := train_road.frame(train_s)
	var near := Vector2(head.origin.x - focus.x, head.origin.z - focus.z).length() < 2200.0
	if near and train == null:
		train = _build_train()
		add_child(train)
	elif not near and train != null:
		train.queue_free()
		train = null
	if train == null:
		return
	for i in train.get_child_count():
		var car: Node3D = train.get_child(i)
		var s := train_road.clamp_s(train_s - dir * i * 21.0)
		var fr := train_road.frame(s)
		var b := fr.basis if dir > 0 else Basis(-fr.basis.x, fr.basis.y, -fr.basis.z)
		car.global_transform = Transform3D(b, fr.origin)

## Posición del tren (s en la vía) para cruces a nivel.
func train_position() -> float:
	return train_s

func _build_train() -> Node3D:
	var root := Node3D.new()
	for i in 7:
		var md := MeshData.new()
		var body := Color(0.85, 0.12, 0.15) if i == 0 else Color(0.88, 0.88, 0.9)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 2.4, 0)), Vector3(3.0, 3.4, 20.0), body, Vector2(9 if i > 0 else 0, 0.2), 5)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.6, 0)), Vector3(2.6, 0.9, 18.0), Color(0.15, 0.15, 0.16), Vector2.ZERO, 4)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 2.9, 0)), Vector3(3.04, 0.9, 18.5), Color(0.1, 0.12, 0.15), Vector2.ZERO, 4)
		if i == 0:
			md.box(Transform3D(Basis.IDENTITY, Vector3(0, 2.6, -10.5)), Vector3(2.8, 2.8, 2.0), body, Vector2.ZERO, 5)
			md.box(Transform3D(Basis.IDENTITY, Vector3(0, 3.0, -11.55)), Vector3(2.2, 0.9, 0.1), Color(0.1, 0.12, 0.15), Vector2.ZERO, 4)
		var mi := MeshInstance3D.new()
		mi.mesh = md.to_mesh(WorldAssets.mat("building"), true)
		root.add_child(mi)
	return root
