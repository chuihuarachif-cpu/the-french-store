class_name WorldLandmarks
extends Node3D
## Elementos únicos del país que se muestran cuando el jugador está cerca:
## pistas de aterrizaje, portaaviones, puente levadizo, Torre Lumière, grúas del puerto y el tren.

## Escala del mapa respecto al diseño original de 16 km (para monumentos con coordenadas fijas).
const MS := 2.0
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
	var rws: Array = World.pois.get("runways", [World.poi("airport"), World.poi("airfield")])
	for rw in rws:
		var a: Dictionary = rw
		_reg("runway_" + str(a.get("id", a["name"])), Vector3(a["x"], World.height(a["x"], a["z"]), a["z"]), 6000.0 if a.get("id", "") == "airport" else 4500.0,
			func(): return _runway(a, a.get("id", "") == "airport"))
	for dp in World.pois.get("depots", []):
		var d: Dictionary = dp
		_reg("depot_" + str(d["id"]), Vector3(d["x"], d["y"], d["z"]), 1600.0, func(): return _depot(d))
	var cv: Dictionary = World.poi("carrier")
	_reg("carrier", Vector3(cv["x"], 0, cv["z"]), 7000.0, func(): return _carrier(cv))
	var park: Dictionary = World.poi("park")
	_reg("tower", Vector3(park["x"], World.height(park["x"], park["z"]), park["z"]), 9000.0, func(): return _tower())
	_reg("cranes", Vector3(4300, 0, -250) * MS, 3000.0, func(): return _cranes())
	_reg("ships", Vector3(5600, 0, -900) * MS, 5000.0, func(): return _ships())
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
	var y: float = a["h"] + 0.6
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
	if main:
		_parked_planes(root, [Vector3(-300, 0, -260), Vector3(-250, 0, -260), Vector3(-200, 0, -260), Vector3(200, 0, -250), Vector3(260, 0, -250)], PI)
	else:
		_parked_planes(root, [Vector3(-400, 0, 90), Vector3(-280, 0, 90)], PI)
	return root

## Marco de la pista: origen en la cabecera oeste, -Z = rumbo de despegue hacia el este.
static func runway_frame(a: Dictionary, from_east := false) -> Transform3D:
	var L: float = a["len"]
	var y: float = a["h"] + 0.6
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
	# casco: caja principal + proa en cuña
	hull.box(Transform3D(Basis.IDENTITY, Vector3(4, (CARRIER_DECK - 8.0) * 0.5 - 4.0, 20.0)), Vector3(44.0, CARRIER_DECK + 6.0, L - 70.0), grey, Vector2.ZERO, 6)
	var pz := -L * 0.5 + 35.0
	for k in 6:
		var t0 := k / 6.0
		var t1 := (k + 1) / 6.0
		var w0 := lerpf(22.0, 3.0, t0)
		var w1 := lerpf(22.0, 3.0, t1)
		var z0 := pz - t0 * 35.0 + 20.0
		var z1 := pz - t1 * 35.0 + 20.0
		for sx in [-1.0, 1.0]:
			var a0 := Vector3(4 + sx * w0, -8.0, z0)
			var a1 := Vector3(4 + sx * w1, -8.0, z1)
			var b0 := Vector3(4 + sx * (w0 + 8.0), CARRIER_DECK - 1.0, z0)
			var b1 := Vector3(4 + sx * (w1 + 8.0), CARRIER_DECK - 1.0, z1)
			hull.quad(a0, a1, b1, b0, grey)
			hull.quad(a1, a0, b0, b1, grey)
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
	_parked_planes(root, [Vector3(16, CARRIER_DECK, 60), Vector3(16, CARRIER_DECK, 80), Vector3(16, CARRIER_DECK, 100), Vector3(-2, CARRIER_DECK, 130)], -0.6)
	return root

func _parked_planes(root: Node3D, spots: Array, yaw: float) -> void:
	var l: Array = VehicleCatalog.list("plane")
	for i in spots.size():
		var v := VehicleVisual.new()
		root.add_child(v)
		v.setup(l[[5, 6, 8, 7, 13, 1][i % 6]], VehicleCatalog.color_of("gris naval"), true)
		v.set_gear(true)
		v.position = spots[i]
		v.rotation.y = yaw

# ------------------------------------------------------------------ DEPÓSITOS, EMPRESAS Y CONCESIONARIA
func _depot(d: Dictionary) -> Node3D:
	var root := Node3D.new()
	var fw := Vector3(d["fx"], 0, d["fz"])
	var rt := Vector3(-fw.z, 0, fw.x) * float(d["side"])   # hacia el fondo del patio
	root.transform = Transform3D(Basis(Vector3.UP.cross(rt).normalized(), Vector3.UP, rt.normalized()), Vector3(d["x"], d["y"], d["z"]))
	var W: float = d["w"]
	var D: float = d["d"]
	# losa de hormigón con marcas de aparcamiento
	var slab := MeshData.new()
	slab.box(Transform3D(Basis.IDENTITY, Vector3(0, -0.4, 0)), Vector3(W, 1.0, D), Color(0.58, 0.58, 0.57), Vector2.ZERO, 5)
	# acceso desde la carretera
	slab.box(Transform3D(Basis.IDENTITY, Vector3(0, -0.45, -D * 0.5 - 9)), Vector3(44, 1.0, 18), Color(0.5, 0.5, 0.5), Vector2.ZERO, 5)
	for k in int(W / 9.0) - 2:
		var x := -W * 0.5 + 14.0 + k * 9.0
		slab.box(Transform3D(Basis.IDENTITY, Vector3(x, 0.11, D * 0.5 - 61)), Vector3(0.16, 0.02, 18), Color(0.95, 0.85, 0.2), Vector2.ZERO, 5)
	var mi := MeshInstance3D.new()
	mi.mesh = slab.to_mesh(WorldAssets.mat("concrete"))
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mi)
	# valla perimetral (con hueco en la entrada) y farolas
	var fence := MeshData.new()
	var posts := []
	for side in [[Vector3(-W * 0.5, 0, -D * 0.5), Vector3(-26, 0, -D * 0.5)], [Vector3(26, 0, -D * 0.5), Vector3(W * 0.5, 0, -D * 0.5)],
			[Vector3(W * 0.5, 0, -D * 0.5), Vector3(W * 0.5, 0, D * 0.5)], [Vector3(W * 0.5, 0, D * 0.5), Vector3(-W * 0.5, 0, D * 0.5)], [Vector3(-W * 0.5, 0, D * 0.5), Vector3(-W * 0.5, 0, -D * 0.5)]]:
		var a: Vector3 = side[0]
		var b: Vector3 = side[1]
		var n := int(a.distance_to(b) / 4.0)
		for k in n + 1:
			posts.append(a.lerp(b, float(k) / maxf(n, 1)))
		var up := Vector3(0, 2.2, 0)
		fence.quad(a + Vector3(0, 0.1, 0), b + Vector3(0, 0.1, 0), b + up, a + up, Color(0.55, 0.6, 0.6, 0.5))
		fence.quad(b + Vector3(0, 0.1, 0), a + Vector3(0, 0.1, 0), a + up, b + up, Color(0.55, 0.6, 0.6, 0.5))
	for p in posts:
		fence.box(Transform3D(Basis.IDENTITY, p + Vector3(0, 1.15, 0)), Vector3(0.08, 2.3, 0.08), Color(0.35, 0.37, 0.4))
	var fm := MeshInstance3D.new()
	fm.mesh = fence.to_mesh(WorldAssets.mat("metal"))
	fm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(fm)
	for k in 4:
		var lp := MultiMeshInstance3D.new()
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = WorldAssets.mesh("lamp_single")
		mm.instance_count = 1
		mm.set_instance_transform(0, Transform3D(Basis(Vector3.UP, PI * 0.5 if k % 2 == 0 else -PI * 0.5), Vector3((-0.35 + 0.23 * k) * W, 0, 0)))
		lp.multimesh = mm
		root.add_child(lp)
	# cartel con el nombre de la empresa
	var sign := Label3D.new()
	sign.text = str(d["name"]).to_upper()
	sign.font = UIKit.font("Orbitron-Black")
	sign.font_size = 96
	sign.pixel_size = 0.02
	sign.modulate = Color(1, 1, 1) if d["id"] != "dealer" else Color(1.0, 0.82, 0.2)
	sign.outline_size = 24
	sign.outline_modulate = Color(0.05, 0.08, 0.15)
	sign.position = Vector3(0, 9.0, -D * 0.5 - 2.0)
	sign.rotation.y = PI
	root.add_child(sign)
	var post := MeshData.new()
	for sx in [-14.0, 14.0]:
		post.box(Transform3D(Basis.IDENTITY, Vector3(sx, 4.0, -D * 0.5 - 2.0)), Vector3(0.4, 8.0, 0.4), Color(0.2, 0.22, 0.25))
	post.box(Transform3D(Basis.IDENTITY, Vector3(0, 9.0, -D * 0.5 - 1.8)), Vector3(30.0, 3.0, 0.3), Color(0.08, 0.12, 0.25) if d["id"] != "dealer" else Color(0.7, 0.05, 0.08))
	var pm := MeshInstance3D.new()
	pm.mesh = post.to_mesh(WorldAssets.mat("metal"))
	root.add_child(pm)
	# carga típica apilada en el patio (contenedores, troncos, depósitos)
	var props := MeshData.new()
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(d["id"])
	var kind: String = d["id"]
	for k in 10:
		var px := lerpf(-W * 0.4, W * 0.4, rng.randf())
		var pz := lerpf(D * 0.05, D * 0.3, rng.randf())
		match kind:
			"containers", "aircargo":
				for hgt in rng.randi_range(1, 3):
					props.box(Transform3D(Basis.IDENTITY, Vector3(px, 1.3 + hgt * 2.6, pz)), Vector3(12.2, 2.6, 2.45), Color.from_hsv(rng.randf(), 0.7, 0.6), Vector2.ZERO, 5)
			"sawmill":
				for h2 in 3:
					props.prism(Vector3(px, 0.4 + h2 * 0.7, pz), 0.35, 0.35, 10.0, 6, Color(0.45, 0.32, 0.2), Vector2.ZERO, true, Transform3D(Basis(Vector3.FORWARD, PI * 0.5), Vector3.ZERO))
			"refinery", "winery", "dairy":
				props.prism(Vector3(px, 0.0, pz), 5.0, 5.0, 12.0, 14, Color(0.85, 0.86, 0.88), Vector2.ZERO, true)
			"quarry", "steel":
				props.box(Transform3D(Basis(Vector3.UP, rng.randf() * PI), Vector3(px, 1.0, pz)), Vector3(3.0, 2.0, 3.0), Color(0.6, 0.58, 0.55) if kind == "quarry" else Color(0.4, 0.42, 0.45), Vector2.ZERO, 5)
			"farm":
				props.prism(Vector3(px, 0.0, pz), 1.0, 1.0, 1.4, 10, Color(0.85, 0.72, 0.35), Vector2.ZERO, true, Transform3D(Basis(Vector3.FORWARD, PI * 0.5), Vector3.ZERO))
			_:
				props.box(Transform3D(Basis.IDENTITY, Vector3(px, 0.7, pz)), Vector3(1.2, 1.4, 1.0), Color(0.6, 0.45, 0.25), Vector2.ZERO, 5)
	var prm := MeshInstance3D.new()
	prm.mesh = props.to_mesh(WorldAssets.mat("building"), true)
	root.add_child(prm)
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

# ------------------------------------------------------------------ BUQUES (bahía y río)
func _ships() -> Node3D:
	var root := Node3D.new()
	var defs := [[Vector3(5350, 0, -820) * MS, 0.3, 200.0], [Vector3(5900, 0, -420) * MS, -1.2, 240.0], [Vector3(6150, 0, -1150) * MS, 1.5, 180.0], [Vector3(4700, 0, -600) * MS, 1.7, 90.0], [Vector3(1500, 0, 230) * MS, 1.55, 60.0]]
	var cols := [Color(0.75, 0.15, 0.1), Color(0.1, 0.35, 0.65), Color(0.1, 0.5, 0.3), Color(0.85, 0.6, 0.1), Color(0.55, 0.55, 0.58), Color(0.9, 0.9, 0.9)]
	var rng := RandomNumberGenerator.new()
	rng.seed = 99
	for d in defs:
		var L: float = d[2]
		var Wd := L * 0.15
		var md := MeshData.new()
		var hull := Color(0.12, 0.14, 0.18) if L > 100.0 else Color(0.3, 0.2, 0.15)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 2.0, 0)), Vector3(Wd, 10.0, L * 0.8), hull, Vector2.ZERO, 5, Color(0.5, 0.2, 0.15))
		md.prism(Vector3(0, -3.0, -L * 0.4), Wd * 0.5, Wd * 0.5, 10.0, 6, hull, Vector2.ZERO, true)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, -2.4, 0)), Vector3(Wd * 0.98, 1.2, L * 0.79), Color(0.6, 0.12, 0.1), Vector2.ZERO, 4)
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 13.0, L * 0.33)), Vector3(Wd * 0.9, 12.0, L * 0.1), Color(0.92, 0.92, 0.9), Vector2(2, 0.4), 5)
		if L > 100.0:
			for k in int(L * 0.55 / 12.5):
				for row in 3:
					for h in rng.randi_range(1, 4):
						md.box(Transform3D(Basis.IDENTITY, Vector3((row - 1) * Wd * 0.3, 8.3 + h * 2.6, -L * 0.3 + k * 12.5)), Vector3(Wd * 0.28, 2.5, 12.0), cols[rng.randi() % cols.size()], Vector2.ZERO, 5)
		var mi := MeshInstance3D.new()
		mi.mesh = md.to_mesh(WorldAssets.mat("building"), true)
		var p: Vector3 = d[0]
		var wl := 0.0
		if p.x < 3000.0 * MS:
			wl = World.height(p.x, p.z) + 6.0
		mi.transform = Transform3D(Basis(Vector3.UP, d[1]), Vector3(p.x, wl, p.z))
		root.add_child(mi)
	return root

# ------------------------------------------------------------------ GRÚAS DEL PUERTO
func _cranes() -> Node3D:
	var root := Node3D.new()
	var md := MeshData.new()
	var cols := [Color(0.85, 0.3, 0.1), Color(0.1, 0.45, 0.75)]
	for i in 5:
		var x := 3850.0 * MS + i * 260.0
		var z := -330.0 * MS
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
