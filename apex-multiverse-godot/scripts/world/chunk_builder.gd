class_name ChunkBuilder
extends RefCounted
## Construye los datos de un chunk de 256 m (en un hilo de trabajo). Solo produce arrays;
## el WorldStreamer crea las mallas y nodos en el hilo principal.
## LOD 0: todo (vida, vegetación densa) · LOD 1: terreno medio, edificios, árboles ralos · LOD 2: lejano.

const RES := [32, 16, 8]
const ROAD_E := {"highway": 14.6, "avenue": 7.4, "road": 5.2, "dirt": 3.8, "rail": 2.6}
const PRIO := {"highway": 5, "rail": 4, "avenue": 3, "road": 2, "dirt": 1}

var c := Vector2i.ZERO
var lod := 0
var exclude_road := -1
var rng := RandomNumberGenerator.new()
var W  # autoload World

# salida
var out := {}
var surf := {}   # clave de material -> MeshData
var mm := {}     # clave de malla -> {"data": PackedFloat32Array, "count": int}

func _init(world, coord: Vector2i, level: int, exclude := -1) -> void:
	W = world
	c = coord
	lod = level
	exclude_road = exclude
	rng.seed = hash(Vector3i(coord.x, coord.y, 77))

func md(key: String) -> MeshData:
	if not surf.has(key):
		surf[key] = MeshData.new()
	return surf[key]

func inst(key: String, xf: Transform3D, custom := Color(0.5, 0.5, 0.5, 0.0)) -> void:
	if not mm.has(key):
		mm[key] = {"data": PackedFloat32Array(), "count": 0}
	var d: PackedFloat32Array = mm[key]["data"]
	var b := xf.basis
	var o := xf.origin
	# formato: transformación (12) + color (4, blanco) + datos propios (4)
	d.append_array([b.x.x, b.y.x, b.z.x, o.x, b.x.y, b.y.y, b.z.y, o.y, b.x.z, b.y.z, b.z.z, o.z, 1.0, 1.0, 1.0, 1.0, custom.r, custom.g, custom.b, custom.a])
	mm[key]["data"] = d
	mm[key]["count"] += 1

func build() -> Dictionary:
	_terrain()
	_roads()
	if lod == 0:
		_junction_props()
	_buildings()
	_vegetation()
	if lod == 0:
		_life()
	_river()
	out["surf"] = {}
	for k in surf:
		if not surf[k].is_empty():
			out["surf"][k] = surf[k].arrays(k == "building", true)
	out["mm"] = mm
	return out

# ------------------------------------------------------------------ TERRENO
func _terrain() -> void:
	var res: int = RES[lod]
	var st = W.CHUNK / res
	var o: Vector2 = W.chunk_origin(c)
	var hs := PackedFloat32Array()
	var g := res + 3
	hs.resize(g * g)
	for j in g:
		for i in g:
			hs[j * g + i] = W.height(o.x + (i - 1) * st, o.y + (j - 1) * st)
	var portals: Array = W.chunk_portals.get(c, [])
	var m := md("terrain")
	var base := m.v.size()
	for j in res + 1:
		for i in res + 1:
			var hx := hs[(j + 1) * g + i + 2] - hs[(j + 1) * g + i]
			var hz := hs[(j + 2) * g + i + 1] - hs[j * g + i + 1]
			var nn := Vector3(-hx, 2.0 * st, -hz).normalized()
			m.vert(Vector3(o.x + i * st, hs[(j + 1) * g + i + 1], o.y + j * st), nn)
	for j in res:
		for i in res:
			var a := base + j * (res + 1) + i
			var cx = o.x + (i + 0.5) * st
			var cz = o.y + (j + 0.5) * st
			if not portals.is_empty() and _in_portal(portals, cx, cz, st):
				continue
			var h00 := hs[(j + 1) * g + i + 1]
			if h00 < -22.0 and hs[(j + 2) * g + i + 2] < -22.0:
				continue
			# triángulos (orden horario visto desde arriba)
			m.idx.append_array([a, a + 1, a + res + 2, a, a + res + 2, a + res + 1])
	# faldón en los bordes para tapar grietas entre LODs
	var edges := [[Vector2i(0, 0), Vector2i(1, 0)], [Vector2i(res, 0), Vector2i(0, 1)], [Vector2i(res, res), Vector2i(-1, 0)], [Vector2i(0, res), Vector2i(0, -1)]]
	for e in edges:
		var p0: Vector2i = e[0]
		var dv: Vector2i = e[1]
		for k in res:
			var q0 := p0 + dv * k
			var q1 := p0 + dv * (k + 1)
			var v0: Vector3 = m.v[base + q0.y * (res + 1) + q0.x]
			var v1: Vector3 = m.v[base + q1.y * (res + 1) + q1.x]
			var nn := Vector3(dv.y, 0, -dv.x)
			m.quad(v1 - Vector3(0, 8, 0), v0 - Vector3(0, 8, 0), v0, v1, Color.WHITE, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector3.UP)
			m.quad(v0 - Vector3(0, 8, 0), v1 - Vector3(0, 8, 0), v1, v0, Color.WHITE, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector3.UP)

func _in_portal(portals: Array, x: float, z: float, st: float) -> bool:
	for p in portals:
		var d: Vector3 = Vector3(x, 0, z) - Vector3(p["pos"].x, 0, p["pos"].z)
		var dir: Vector3 = p["dir"]
		var along := d.x * dir.x + d.z * dir.z
		var r: Vector3 = p["right"]
		var lat := d.x * r.x + d.z * r.z
		if along > -st * 0.75 and along < 30.0 and absf(lat) < p["half"] + 5.0 + st * 0.5:
			return true
	return false

# ------------------------------------------------------------------ CARRETERAS
func _P(r: RoadPath, i: int, x: float, y := 0.0) -> Vector3:
	return r.pos[i] + r.right[i] * x + r.up[i] * y

func _roads() -> void:
	var runs: Array = W.chunk_roads.get(c, [])
	for run in runs:
		var r: RoadPath = W.roads[run[0]]
		var cnt := r.pos.size()
		for a in range(run[1], run[2]):
			var ia := a % cnt
			var ib := (a + 1) % cnt
			if not r.closed and a + 1 >= cnt:
				break
			_segment(r, ia, ib, float(a) * RoadPath.STEP)

func _segment(r: RoadPath, a: int, b: int, s0: float) -> void:
	var s1 := s0 + RoadPath.STEP
	var k: String = r.kinds[a]
	var fa: int = r.flags[a]
	var fb: int = r.flags[b]
	if (fa & 4) and (fb & 4):
		return  # puente levadizo: lo dibuja el monumento
	var E: float = ROAD_E[k]
	var tunnel := (fa & 1) and (fb & 1)
	var bridge := (fa & 2) and (fb & 2)
	var hidden := (fa & 8) and (fb & 8)
	var mkey := "road_" + k
	if not hidden:
		var steps := 2 if k == "highway" else 1
		for q in steps:
			var x0 := lerpf(-E, E, float(q) / steps)
			var x1 := lerpf(-E, E, float(q + 1) / steps)
			md(mkey).quad(_P(r, a, x0), _P(r, a, x1), _P(r, b, x1), _P(r, b, x0), Color.WHITE,
				Vector2(x0, s0), Vector2(x1, s0), Vector2(x1, s1), Vector2(x0, s1), Vector2.ZERO, r.up[a])
	if lod == 2 and not bridge:
		return
	var con := md("concrete")
	if not tunnel and not bridge and not hidden:
		# faldones laterales
		var sk := md("skirt")
		var outer := E + (3.6 if k == "avenue" else 0.0)
		for sx in [-1.0, 1.0]:
			var y0 := 0.18 if k == "avenue" else 0.0
			var p0 := _P(r, a, sx * outer, y0)
			var p1 := _P(r, b, sx * outer, y0)
			if sx > 0:
				sk.quad(p0 - Vector3(0, 3, 0), p1 - Vector3(0, 3, 0), p1, p0)
			else:
				sk.quad(p1 - Vector3(0, 3, 0), p0 - Vector3(0, 3, 0), p0, p1)
	if k == "avenue" and not tunnel and not hidden:
		var sw := md("sidewalk")
		for sx in [-1.0, 1.0]:
			var xi = sx * E
			var xo = sx * (E + 3.6)
			var A0 := _P(r, a, xi, 0.18)
			var A1 := _P(r, a, xo, 0.18)
			var B0 := _P(r, b, xi, 0.18)
			var B1 := _P(r, b, xo, 0.18)
			if sx > 0:
				sw.quad(A0, A1, B1, B0, Color.WHITE, Vector2(0, s0), Vector2(3.6, s0), Vector2(3.6, s1), Vector2(0, s1))
				sw.quad(_P(r, b, xi, 0.0), _P(r, a, xi, 0.0), A0, B0, Color(0.8, 0.8, 0.8))
			else:
				sw.quad(A1, A0, B0, B1, Color.WHITE, Vector2(0, s0), Vector2(3.6, s0), Vector2(3.6, s1), Vector2(0, s1))
				sw.quad(_P(r, a, xi, 0.0), _P(r, b, xi, 0.0), B0, A0, Color(0.8, 0.8, 0.8))
	if k == "highway" and not hidden:
		# barrera New Jersey central
		var prof := [Vector2(-0.4, 0.0), Vector2(-0.16, 0.3), Vector2(-0.1, 0.85), Vector2(0.1, 0.85), Vector2(0.16, 0.3), Vector2(0.4, 0.0)]
		for q in prof.size() - 1:
			var u: Vector2 = prof[q]
			var w: Vector2 = prof[q + 1]
			con.quad(_P(r, a, u.x, u.y), _P(r, a, w.x, w.y), _P(r, b, w.x, w.y), _P(r, b, u.x, u.y), Color(0.85, 0.85, 0.82))
		if not tunnel and not bridge:
			var mt := md("metal")
			for sx in [-1.0, 1.0]:
				var x = sx * (E - 0.2)
				var a0 := _P(r, a, x, 0.45)
				var a1 := _P(r, a, x, 0.78)
				var b0 := _P(r, b, x, 0.45)
				var b1 := _P(r, b, x, 0.78)
				mt.quad(a0, b0, b1, a1)
				mt.quad(b0, a0, a1, b1)
				if lod == 0:
					mt.box(Transform3D(Basis(r.right[a], r.up[a], -r.fwd[a]), _P(r, a, x + sx * 0.1, 0.37)), Vector3(0.1, 0.75, 0.1), Color.WHITE, Vector2.ZERO, 4)
	if tunnel:
		_tunnel_segment(r, a, b, E, s0)
	if bridge:
		_bridge_segment(r, a, b, E, k)
	if k == "rail":
		var mt2 := md("metal")
		for x in [-0.72, 0.72]:
			mt2.quad(_P(r, a, x - 0.05, 0.32), _P(r, a, x + 0.05, 0.32), _P(r, b, x + 0.05, 0.32), _P(r, b, x - 0.05, 0.32))
			mt2.quad(_P(r, b, x - 0.05, 0.12), _P(r, a, x - 0.05, 0.12), _P(r, a, x - 0.05, 0.32), _P(r, b, x - 0.05, 0.32))
			mt2.quad(_P(r, a, x + 0.05, 0.12), _P(r, b, x + 0.05, 0.12), _P(r, b, x + 0.05, 0.32), _P(r, a, x + 0.05, 0.32))
		if lod == 0:
			var wd := md("sleepers")
			for t in 7:
				var f := (t + 0.5) / 7.0
				var p := r.pos[a].lerp(r.pos[b], f)
				var rt := r.right[a]
				var fw := r.fwd[a] * 0.13
				var up := r.up[a] * 0.14
				wd.quad(p - rt * 1.25 - fw + up, p + rt * 1.25 - fw + up, p + rt * 1.25 + fw + up, p - rt * 1.25 + fw + up, Color(0.45, 0.35, 0.25))
	# farolas y árboles de acera
	if lod == 0 and not tunnel:
		var fwd := r.fwd[a]
		if k == "highway" and a % 6 == 0 and not hidden:
			inst("lamp_double", Transform3D(Basis(r.right[a], Vector3.UP, -fwd), _P(r, a, 0.0, 0.85)))
		elif k == "avenue" and a % 4 == 0 and not hidden:
			var sx := 1.0 if (a / 4) % 2 == 0 else -1.0
			var yaw_b := Basis(r.right[a] * sx, Vector3.UP, -fwd * sx)
			inst("lamp_single", Transform3D(yaw_b, _P(r, a, sx * (E + 0.7), 0.18)))
			if lod == 0 and not bridge and a % 8 == 4:
				for sx2 in [-1.0, 1.0]:
					inst("tree_street", Transform3D(Basis(Vector3.UP, rng.randf() * TAU), _P(r, a, sx2 * (E + 2.6), 0.18)), Color(0.42, 0.55, 0.3))

func _tunnel_segment(r: RoadPath, a: int, b: int, E: float, s0: float) -> void:
	var t := md("tunnel")
	var W2 := E + 0.6
	var prof := [Vector2(W2, -0.2), Vector2(W2, 5.4), Vector2(W2 * 0.55, 7.4), Vector2(-W2 * 0.55, 7.4), Vector2(-W2, 5.4), Vector2(-W2, -0.2)]
	for q in prof.size() - 1:
		var u: Vector2 = prof[q]
		var w: Vector2 = prof[q + 1]
		# caras hacia el interior
		t.quad(_P(r, a, u.x, u.y), _P(r, a, w.x, w.y), _P(r, b, w.x, w.y), _P(r, b, u.x, u.y), Color(0.82, 0.82, 0.8) if q < 1 or q > 3 else Color(0.5, 0.5, 0.52),
			Vector2(0, 0), Vector2(8, 0), Vector2(8, 1), Vector2(0, 1))
	var lt := md("tunnel_light")
	for sx in [-1.0, 1.0]:
		var p := (_P(r, a, sx * W2 * 0.4, 7.25) + _P(r, b, sx * W2 * 0.4, 7.25)) * 0.5
		lt.box(Transform3D(Basis(r.right[a], r.up[a], -r.fwd[a]), p), Vector3(0.5, 0.12, 4.5), Color(1, 1, 1, 1))
	# franja reflectante en las paredes
	for sx in [-1.0, 1.0]:
		var y0 := 0.9
		var q0 := _P(r, a, sx * (W2 - 0.02), y0)
		var q1 := _P(r, b, sx * (W2 - 0.02), y0)
		var q2 := _P(r, b, sx * (W2 - 0.02), y0 + 0.12)
		var q3 := _P(r, a, sx * (W2 - 0.02), y0 + 0.12)
		if sx > 0:
			lt.quad(q1, q0, q3, q2, Color(0.9, 0.5, 0.1, 0.6))
		else:
			lt.quad(q0, q1, q2, q3, Color(0.9, 0.5, 0.1, 0.6))

func _bridge_segment(r: RoadPath, a: int, b: int, E: float, k: String) -> void:
	var con := md("concrete")
	var W2 := E + 0.7
	var col := Color(0.72, 0.72, 0.7)
	# tablero: bajo, laterales y pretiles
	con.quad(_P(r, b, -W2, -1.8), _P(r, b, W2, -1.8), _P(r, a, W2, -1.8), _P(r, a, -W2, -1.8), col.darkened(0.25))
	for sx in [-1.0, 1.0]:
		var x = sx * W2
		var lo := _P(r, a, x, -1.8)
		var lo2 := _P(r, b, x, -1.8)
		var hi := _P(r, a, x, 1.0)
		var hi2 := _P(r, b, x, 1.0)
		if sx > 0:
			con.quad(lo, lo2, hi2, hi, col)
		else:
			con.quad(lo2, lo, hi, hi2, col)
		var xi = sx * (W2 - 0.35)
		if sx > 0:
			con.quad(_P(r, b, xi, 0.0), _P(r, a, xi, 0.0), _P(r, a, xi, 1.0), _P(r, b, xi, 1.0), col)
		else:
			con.quad(_P(r, a, xi, 0.0), _P(r, b, xi, 0.0), _P(r, b, xi, 1.0), _P(r, a, xi, 1.0), col)
		if sx > 0:
			con.quad(_P(r, a, xi, 1.0), _P(r, a, x, 1.0), _P(r, b, x, 1.0), _P(r, b, xi, 1.0), col.lightened(0.1))
		else:
			con.quad(_P(r, a, x, 1.0), _P(r, a, xi, 1.0), _P(r, b, xi, 1.0), _P(r, b, x, 1.0), col.lightened(0.1))
	if a % 5 == 0:
		var p := r.pos[a]
		var g: float = W.height(p.x, p.z)
		if p.y - g > 3.0:
			var xs := [0.0] if k != "highway" else [-7.0, 7.0]
			for x in xs:
				var top := _P(r, a, x, -1.8)
				var hgt := top.y - g + 3.0
				con.box(Transform3D(Basis(r.right[a], Vector3.UP, -r.fwd[a]), Vector3(top.x, g - 3.0 + hgt * 0.5, top.z)), Vector3(2.4, hgt, 2.4), col.darkened(0.1), Vector2.ZERO, 4)
			# cabezal
			con.box(Transform3D(Basis(r.right[a], Vector3.UP, -r.fwd[a]), _P(r, a, 0, -2.4)), Vector3(W2 * 1.6, 1.2, 2.6), col.darkened(0.15), Vector2.ZERO, 6)

# ------------------------------------------------------------------ CRUCES: semáforos y pasos a nivel
func _junction_props() -> void:
	for j in W.chunk_junctions.get(c, []):
		var r: RoadPath = W.roads[j["road"]]
		var o: RoadPath = W.roads[j["other"]]
		var s: float = j["s"]
		var k := r.kind_at(s)
		var ok := o.kind
		if k == "highway" or k == "rail":
			continue
		var E: float = ROAD_E[k]
		var oh: float = ROAD_E.get(ok, 5.0)
		if j["kind"] == "rail":
			for sg in [-1.0, 1.0]:
				var fr := r.frame(s + sg * -(oh + 4.0))
				var b := fr.basis if sg < 0 else Basis(-fr.basis.x, fr.basis.y, -fr.basis.z)
				inst("crossbuck", Transform3D(b, fr.origin + b.x * (E + 0.8)))
			continue
		var major = PRIO.get(k, 1) > PRIO.get(ok, 1) or (PRIO.get(k, 1) == PRIO.get(ok, 1) and r.id < o.id)
		for sg in [-1.0, 1.0]:
			var fr := r.frame(s - sg * (oh + 3.0))
			var b := fr.basis if sg > 0 else Basis(-fr.basis.x, fr.basis.y, -fr.basis.z)
			inst("traffic_light", Transform3D(b, fr.origin + b.x * (E + 0.9) + Vector3(0, 0.15, 0)), Color(j["phase"], 1.0 if major else 0.0, 0, 0))

# ------------------------------------------------------------------ EDIFICIOS
const STY := {"tower": 0, "mid": 1, "house": 2, "ruin": 3, "warehouse": 4, "hotel": 5, "barn": 6, "hangar": 7, "terminal": 8, "control": 9, "church": 10, "shop": 11}
const PAL := {
	0: [Color(0.55, 0.62, 0.7), Color(0.42, 0.5, 0.58), Color(0.6, 0.6, 0.62), Color(0.3, 0.38, 0.45)],
	1: [Color(0.85, 0.8, 0.7), Color(0.92, 0.9, 0.86), Color(0.7, 0.66, 0.6), Color(0.78, 0.55, 0.42), Color(0.6, 0.62, 0.66)],
	2: [Color(0.95, 0.9, 0.78), Color(0.98, 0.96, 0.92), Color(0.95, 0.85, 0.6), Color(0.88, 0.78, 0.7), Color(0.8, 0.88, 0.85)],
	3: [Color(0.5, 0.47, 0.44), Color(0.45, 0.4, 0.36), Color(0.58, 0.55, 0.5), Color(0.4, 0.38, 0.38)],
	4: [Color(0.4, 0.5, 0.62), Color(0.55, 0.57, 0.6), Color(0.45, 0.55, 0.45), Color(0.7, 0.45, 0.3)],
	5: [Color(0.97, 0.97, 0.95), Color(0.95, 0.9, 0.82), Color(0.85, 0.92, 0.95)],
	6: [Color(0.6, 0.15, 0.1), Color(0.55, 0.2, 0.12)],
	7: [Color(0.62, 0.64, 0.66)],
	8: [Color(0.85, 0.87, 0.9)],
	9: [Color(0.92, 0.92, 0.92)],
	10: [Color(0.78, 0.72, 0.62)],
	11: [Color(0.9, 0.7, 0.5), Color(0.75, 0.8, 0.9), Color(0.92, 0.88, 0.8)],
}
const ROOFS := [Color(0.62, 0.27, 0.16), Color(0.55, 0.24, 0.15), Color(0.3, 0.32, 0.36), Color(0.45, 0.3, 0.22)]

func _buildings() -> void:
	var ids: PackedInt32Array = W.chunk_buildings.get(c, PackedInt32Array())
	if ids.is_empty():
		return
	var m := md("building")
	for i in ids:
		var b: Array = W.building(i)
		var x: float = b[0]
		var z: float = b[2]
		var w: float = b[3]
		var d: float = b[4]
		var h: float = b[5]
		var yaw: float = b[6]
		var sty: int = b[7]
		var seed := fmod(absf(x * 0.013 + z * 0.007), 1.0)
		var pal: Array = PAL[sty]
		var col: Color = pal[int(seed * 997.0) % pal.size()] * Color(0.82, 0.82, 0.82, 1.0)
		var gy: float = W.height(x, z) - 1.2
		var basis := Basis(Vector3.UP, yaw)
		var xf := Transform3D(basis, Vector3(x, gy, z))
		var roof_c := Color(0.32, 0.32, 0.33)
		match sty:
			0:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(1, seed), 5, roof_c)
				if lod < 2:
					m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h + 3.0, 0)), Vector3(w * 0.7, 6.0, d * 0.7), col.darkened(0.2), Vector2(9, seed), 5, roof_c)
					if seed > 0.6:
						m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h + 14.0, 0)), Vector3(0.6, 16.0, 0.6), Color(0.8, 0.8, 0.82), Vector2.ZERO, 5)
			1:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(2, seed), 5, roof_c)
				if lod < 2:
					m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h + 0.5, 0)), Vector3(w + 0.4, 1.0, d + 0.4), col.darkened(0.15), Vector2.ZERO, 5)
			11:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(8, seed), 5, roof_c)
			2:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(3, seed), 4)
				_gable(m, xf, w, d, h, w * 0.32, ROOFS[int(seed * 31.0) % ROOFS.size()])
			3:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(4, seed), 5, Color(0.22, 0.2, 0.2))
				if lod < 2 and seed > 0.4:
					m.box(xf * Transform3D(Basis.IDENTITY, Vector3(w * 0.25, h + 2.0, 0)), Vector3(w * 0.4, 4.0, d * 0.8), col.darkened(0.2), Vector2(4, seed + 0.3), 5, Color(0.2, 0.18, 0.18))
			4:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(5, seed), 4)
				_gable(m, xf, w, d, h, 2.5, Color(0.5, 0.52, 0.55))
			5:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(6, seed), 5, Color(0.6, 0.62, 0.64))
			6:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(7, seed), 4)
				_gable(m, xf, w, d, h, w * 0.45, Color(0.3, 0.3, 0.32))
			7:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.3, 0)), Vector3(w, h * 0.6, d), col, Vector2(5, seed), 4)
				_vault(m, xf, w, d, h * 0.6, h * 0.4, Color(0.55, 0.57, 0.6))
			8:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.5, 0)), Vector3(w, h, d), col, Vector2(9, seed), 4)
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h + 0.6, 0)), Vector3(w + 8, 1.2, d + 10), Color(0.9, 0.9, 0.92), Vector2.ZERO, 7)
			9:
				m.prism(Vector3.ZERO, w * 0.35, w * 0.3, h, 8, col, Vector2(2, seed), false, xf)
				m.prism(Vector3(0, h, 0), w * 0.55, w * 0.62, 6.0, 8, Color(0.3, 0.4, 0.45), Vector2(9, seed), true, xf)
				m.prism(Vector3(0, h + 6.0, 0), w * 0.7, w * 0.1, 1.5, 8, Color(0.85, 0.85, 0.85), Vector2.ZERO, true, xf)
			10:
				m.box(xf * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.35, 0)), Vector3(w, h * 0.7, d), col, Vector2(10, seed), 4)
				_gable(m, xf, w, d, h * 0.7, w * 0.5, Color(0.35, 0.36, 0.4))
				var tx := xf * Transform3D(Basis.IDENTITY, Vector3(0, 0, -d * 0.5 + 2.5))
				m.box(tx * Transform3D(Basis.IDENTITY, Vector3(0, h * 0.75, 0)), Vector3(5, h * 1.5, 5), col, Vector2(10, seed), 4)
				m.prism(Vector3(0, h * 1.5, 0), 3.6, 0.0, 9.0, 4, Color(0.3, 0.32, 0.36), Vector2.ZERO, false, tx * Transform3D(Basis(Vector3.UP, PI * 0.25), Vector3.ZERO))

## Tejado a dos aguas a lo largo del eje X local (cumbrera a lo largo de w).
func _gable(m: MeshData, xf: Transform3D, w: float, d: float, h: float, rise: float, col: Color) -> void:
	var o := 0.4
	var a := xf * Vector3(-w * 0.5 - o, h, -d * 0.5 - o)
	var b := xf * Vector3(w * 0.5 + o, h, -d * 0.5 - o)
	var cc := xf * Vector3(w * 0.5 + o, h, d * 0.5 + o)
	var dd := xf * Vector3(-w * 0.5 - o, h, d * 0.5 + o)
	var r0 := xf * Vector3(-w * 0.5 - o, h + rise, 0)
	var r1 := xf * Vector3(w * 0.5 + o, h + rise, 0)
	m.quad(dd, cc, r1, r0, col)
	m.quad(b, a, r0, r1, col)
	var e0 := xf * Vector3(-w * 0.5, h, -d * 0.5)
	var e1 := xf * Vector3(-w * 0.5, h, d * 0.5)
	var e2 := xf * Vector3(-w * 0.5, h + rise, 0)
	var f0 := xf * Vector3(w * 0.5, h, -d * 0.5)
	var f1 := xf * Vector3(w * 0.5, h, d * 0.5)
	var f2 := xf * Vector3(w * 0.5, h + rise, 0)
	var wc := col.lightened(0.35)
	var nl := (xf.basis * Vector3.LEFT).normalized()
	var i0 := m.vert(e0, nl, Vector2.ZERO, wc)
	var i1 := m.vert(e1, nl, Vector2.ZERO, wc)
	var i2 := m.vert(e2, nl, Vector2.ZERO, wc)
	m.tri(i0, i1, i2)
	var nr := -nl
	var j0 := m.vert(f0, nr, Vector2.ZERO, wc)
	var j1 := m.vert(f1, nr, Vector2.ZERO, wc)
	var j2 := m.vert(f2, nr, Vector2.ZERO, wc)
	m.tri(j1, j0, j2)

## Bóveda (hangar) a lo largo de X local.
func _vault(m: MeshData, xf: Transform3D, w: float, d: float, h: float, rise: float, col: Color) -> void:
	var seg := 6
	for i in seg:
		var a0 := PI * i / seg
		var a1 := PI * (i + 1) / seg
		var z0 := -cos(a0) * d * 0.5
		var z1 := -cos(a1) * d * 0.5
		var y0 := h + sin(a0) * rise
		var y1 := h + sin(a1) * rise
		m.quad(xf * Vector3(w * 0.5, y0, z0), xf * Vector3(-w * 0.5, y0, z0), xf * Vector3(-w * 0.5, y1, z1), xf * Vector3(w * 0.5, y1, z1), col)

# ------------------------------------------------------------------ VEGETACIÓN
func _vegetation() -> void:
	if lod == 2:
		return
	var sp := 11.0 if lod == 0 else 22.0
	var o: Vector2 = W.chunk_origin(c)
	var cells := int(W.CHUNK / sp)
	for j in cells:
		for i in cells:
			var x := o.x + (i + rng.randf()) * sp
			var z := o.y + (j + rng.randf()) * sp
			var b: int = W.biome(x, z)
			var rd: float = W.road_dist(x, z)
			var roll := rng.randf()
			if rd < 7.0:
				continue
			var y: float = W.height(x, z)
			if y < 0.6:
				continue
			var kind := ""
			var tint := Color(0.5, 0.5, 0.5)
			match b:
				2:  # bosque
					if roll < (0.75 if lod == 0 else 0.9):
						kind = "pine" if rng.randf() < 0.62 else "broad"
				0:
					if roll < 0.035:
						kind = "broad"
					elif roll < 0.06 and lod == 0:
						kind = "bush"
				14:
					if roll < 0.3:
						kind = "broad"
				13:
					if roll < 0.08:
						kind = "broad"
				5:
					if roll < 0.06 and rd > 10.0 and y > 1.5:
						kind = "palm"
				6:
					if y < 520.0 and roll < 0.12:
						kind = "pine"
					elif roll < 0.16 and lod == 0:
						kind = "rock"
				1:
					if roll < 0.006 and lod == 0:
						kind = "hay"
					elif roll < 0.012:
						kind = "broad"
				10:
					if roll < 0.01:
						kind = "broad"
			if kind == "":
				continue
			var nrm: Vector3 = W.normal(x, z)
			if nrm.y < 0.7 and kind != "rock":
				continue
			var sc := rng.randf_range(0.8, 1.35)
			tint = Color(rng.randf_range(0.42, 0.58), rng.randf_range(0.45, 0.58), rng.randf_range(0.38, 0.52))
			if b == 6 or W.dept_index(x, z) == 4:
				tint = tint.darkened(0.15)
			if kind == "rock" or kind == "hay":
				tint = Color(0.95, 0.95, 0.95)
			inst(kind if lod == 0 or kind != "pine" else "pine_lo", Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc * rng.randf_range(0.9, 1.25), sc)), Vector3(x, y - 0.3, z)), tint)
	# Viñedos: hileras
	if lod == 0:
		for j in 64:
			var z := o.y + j * 4.0 + 2.0
			for i in 12:
				var x := o.x + i * 21.0 + 10.0
				if W.biome(x, z) != 10 or W.road_dist(x, z) < 8.0:
					continue
				var y: float = W.height(x, z)
				inst("vine", Transform3D(Basis.IDENTITY, Vector3(x, y, z)), Color(0.45, 0.5, 0.3))
	# Puerto: pilas de contenedores
	if lod <= 1:
		var cols := [Color(0.75, 0.15, 0.1), Color(0.1, 0.35, 0.65), Color(0.1, 0.5, 0.3), Color(0.85, 0.6, 0.1), Color(0.55, 0.55, 0.58), Color(0.9, 0.9, 0.9), Color(0.45, 0.2, 0.5)]
		for j in 16:
			for i in 9:
				var x := o.x + i * 28.0 + 14.0
				var z := o.y + j * 16.0 + 8.0
				if W.biome(x, z) != 12 or W.road_dist(x, z) < 12.0 or rng.randf() < 0.3:
					continue
				var y: float = W.height(x, z)
				var stack := rng.randi_range(1, 4)
				for k in stack:
					inst("container", Transform3D(Basis.IDENTITY, Vector3(x, y + k * 2.6, z)), cols[rng.randi() % cols.size()])

# ------------------------------------------------------------------ VIDA: peatones, autos, zona roja
func _life() -> void:
	var runs: Array = W.chunk_roads.get(c, [])
	var shirts := [Color(0.85, 0.1, 0.1), Color(0.1, 0.3, 0.8), Color(0.95, 0.95, 0.95), Color(0.1, 0.1, 0.12), Color(0.95, 0.75, 0.1),
		Color(0.2, 0.6, 0.3), Color(0.9, 0.45, 0.6), Color(0.5, 0.3, 0.7), Color(0.95, 0.5, 0.1)]
	var paints := [Color(0.92, 0.92, 0.94), Color(0.08, 0.08, 0.09), Color(0.55, 0.57, 0.6), Color(0.1, 0.18, 0.45), Color(0.6, 0.06, 0.05),
		Color(0.85, 0.75, 0.2), Color(0.12, 0.3, 0.2), Color(0.3, 0.32, 0.36), Color(0.95, 0.45, 0.08)]
	for run in runs:
		var r: RoadPath = W.roads[run[0]]
		var cnt := r.pos.size()
		for a in range(run[1], run[2]):
			var ia := a % cnt
			var k: String = r.kinds[ia]
			if (r.flags[ia] & 15) != 0:
				continue
			var biome: int = W.biome(r.pos[ia].x, r.pos[ia].z)
			# peatones en aceras
			if k == "avenue" and ia % 2 == 0:
				var dens := 0.7 if biome == 3 else (0.35 if biome in [4, 13, 5] else 0.15)
				for sx in [-1.0, 1.0]:
					if rng.randf() < dens:
						var dirz := r.fwd[ia] * (1.0 if rng.randf() < 0.5 else -1.0)
						var b := _face(dirz)
						var p := _P(r, ia, sx * rng.randf_range(8.6, 10.2), 0.18)
						var sh: Color = shirts[rng.randi() % shirts.size()]
						inst("person", Transform3D(b, p), Color(sh.r, sh.g, sh.b, rng.randf()))
			elif k == "road" and biome == 13 and ia % 3 == 0 and rng.randf() < 0.4:
				var sx2 := 1.0 if rng.randf() < 0.5 else -1.0
				var dirz2 := r.fwd[ia] * (1.0 if rng.randf() < 0.5 else -1.0)
				var b2 := _face(dirz2)
				var sh2: Color = shirts[rng.randi() % shirts.size()]
				inst("person", Transform3D(b2, _P(r, ia, sx2 * 6.4, 0.0)), Color(sh2.r, sh2.g, sh2.b, rng.randf()))
			# autos ambientales en otras vías
			if r.id != exclude_road and ia % 4 == 0 and k in ["avenue", "road", "highway"]:
				var ib := ia + 4
				if r.closed:
					ib = ib % cnt
				elif ib >= cnt:
					continue
				var L := r.pos[ia].distance_to(r.pos[ib])
				var dens2 := 0.4 if k == "highway" else (0.45 if biome == 3 else 0.22)
				for lane in RoadPath.LANES[k]:
					for dirn in [1.0, -1.0]:
						if rng.randf() > dens2:
							continue
						var pa := _P(r, ia, dirn * lane) if dirn > 0 else _P(r, ib, -lane)
						var pb := _P(r, ib, lane) if dirn > 0 else _P(r, ia, -lane)
						var fwd := (pb - pa).normalized()
						var bb := _face(fwd)
						var pc: Color = paints[rng.randi() % paints.size()]
						var key := "acar%d" % (rng.randi() % 3)
						inst(key, Transform3D(bb, pa + Vector3(0, 0.05, 0)), Color(pc.r, pc.g, pc.b, floor(L * 10.0) + rng.randf() * 0.99))
	# Zona roja: barriles con fuego y gente sin hogar
	var o: Vector2 = W.chunk_origin(c)
	for sp in W.pois.get("fire_spots", []):
		var x: float = sp[0]
		var z: float = sp[2]
		if x < o.x or z < o.y or x >= o.x + W.CHUNK or z >= o.y + W.CHUNK:
			continue
		var y: float = W.height(x, z)
		inst("barrel", Transform3D(Basis.IDENTITY, Vector3(x, y, z)), Color(0.3, 0.22, 0.15))
		inst("flame", Transform3D(Basis.IDENTITY, Vector3(x, y + 1.6, z)))
		for k in rng.randi_range(1, 3):
			var a := rng.randf() * TAU
			var p := Vector3(x + cos(a) * 1.6, y, z + sin(a) * 1.6)
			var toward := (Vector3(x, y, z) - p).normalized()
			var b := _face(toward)
			var rag := Color(rng.randf_range(0.15, 0.35), rng.randf_range(0.13, 0.25), rng.randf_range(0.1, 0.2))
			inst("person", Transform3D(b, p), Color(rag.r, rag.g, rag.b, -2.0 if rng.randf() < 0.5 else -1.0))
		if rng.randf() < 0.5:
			var a2 := rng.randf() * TAU
			inst("debris", Transform3D(Basis(Vector3.UP, a2), Vector3(x + 5.0, y, z + 3.0)), Color(0.3, 0.28, 0.25))
	# Playa: sombrillas y bañistas
	for t in 40:
		var x = o.x + rng.randf() * W.CHUNK
		var z = o.y + rng.randf() * W.CHUNK
		if W.biome(x, z) != 5:
			continue
		var y: float = W.height(x, z)
		if y < 0.4 or y > 5.0 or W.road_dist(x, z) < 8.0:
			continue
		if rng.randf() < 0.5:
			inst("umbrella", Transform3D(Basis(Vector3.UP, rng.randf() * TAU), Vector3(x, y, z)), [Color(0.9, 0.2, 0.2), Color(0.1, 0.5, 0.9), Color(1, 0.8, 0.1), Color(0.1, 0.7, 0.4)][rng.randi() % 4])
		else:
			var sh3: Color = shirts[rng.randi() % shirts.size()]
			var a3 := rng.randf() * TAU
			inst("person", Transform3D(Basis(Vector3.UP, a3), Vector3(x, y, z)), Color(sh3.r, sh3.g, sh3.b, rng.randf()))

## Base cuyo -Z local apunta en la dirección dada (sobre el plano horizontal).
func _face(dir: Vector3) -> Basis:
	var z := -Vector3(dir.x, 0, dir.z).normalized()
	var x := Vector3.UP.cross(z).normalized()
	return Basis(x, Vector3.UP, z)

# ------------------------------------------------------------------ RÍO
func _river() -> void:
	var runs: Array = W.chunk_river.get(c, [])
	if runs.is_empty():
		return
	var pts: Array = W.river["pts"]
	var ws: Array = W.river["w"]
	var m := md("water")
	for run in runs:
		for i in range(run[0], mini(run[1] + 1, pts.size() - 1)):
			var a := Vector3(pts[i][0], pts[i][1], pts[i][2])
			var b := Vector3(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2])
			var dir := (b - a).normalized()
			var rt := Vector3(-dir.z, 0, dir.x)
			var wa: float = ws[i] * 0.5 + 12.0
			var wb: float = ws[i + 1] * 0.5 + 12.0
			m.quad(a - rt * wa, a + rt * wa, b + rt * wb, b - rt * wb, Color.WHITE, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector3.UP)
