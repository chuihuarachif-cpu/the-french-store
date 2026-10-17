class_name RoutePlanner
extends RefCounted
## Rutas reales por la red de carreteras: grafo de cruces a nivel (Dijkstra) y una RoadPath compuesta
## que encadena los tramos de cada vía, redondeando las esquinas en los cruces.

const COST := {"highway": 0.8, "avenue": 1.0, "road": 1.0, "dirt": 1.7, "rail": 99.0}
const CORNER := 14.0

static var _graph := {}   # nodo "r:s" -> Array[[vecino, coste, road, s_from, s_to]]
static var _road_nodes := {}  # road -> Array[float] (s ordenadas de sus nodos)

static func _key(r: int, s: float) -> String:
	return "%d:%d" % [r, int(round(s))]

static func _ensure_graph() -> void:
	if not _road_nodes.is_empty():
		return
	for r in World.roads:
		var rp: RoadPath = r
		if rp.kind == "rail":
			continue
		var ss: Array = []
		for j in rp.junctions:
			if str(j[2]) != "cross":
				continue
			ss.append(float(j[0]))
		_road_nodes[rp.id] = ss
	# los extremos de las vías abiertas también son nodos (para llegar a sus depósitos)
	for rid in _road_nodes:
		var rp: RoadPath = World.roads[rid]
		if not rp.closed:
			_road_nodes[rid].append(0.0)
			_road_nodes[rid].append(rp.length)
		_road_nodes[rid].sort()
	_rebuild()

static func _rebuild(extra := {}) -> void:
	_graph.clear()
	for rid in _road_nodes:
		var rp: RoadPath = World.roads[rid]
		var ss: Array = _road_nodes[rid].duplicate()
		if extra.has(rid):
			ss.append_array(extra[rid])
			ss.sort()
		var uniq: Array = []
		for s in ss:
			if uniq.is_empty() or absf(s - uniq[-1]) > 1.0:
				uniq.append(s)
		var cnt := uniq.size()
		var segs := cnt if rp.closed else cnt - 1
		for i in segs:
			var a: float = uniq[i]
			var b: float = uniq[(i + 1) % cnt]
			var L := b - a
			if rp.closed and i == cnt - 1:
				L = rp.length - a + b
			if L <= 0.5:
				continue
			var w: float = COST.get(rp.kind_at(fposmod(a + L * 0.5, rp.length) if rp.closed else a + L * 0.5), 1.0)
			_link(_key(rid, a), _key(rid, b), L * w, rid, a, b)
			_link(_key(rid, b), _key(rid, a), L * w, rid, b, a)
	# cruces: pasar de una vía a otra cuesta un poco (giro)
	for rid in _road_nodes:
		var rp: RoadPath = World.roads[rid]
		for j in rp.junctions:
			if str(j[2]) != "cross" or j.size() < 4 or not _road_nodes.has(int(j[1])):
				continue
			_link(_key(rid, float(j[0])), _key(int(j[1]), float(j[3])), 25.0, -1, 0.0, 0.0)

static func _link(a: String, b: String, c: float, road: int, s0: float, s1: float) -> void:
	if not _graph.has(a):
		_graph[a] = []
	_graph[a].append([b, c, road, s0, s1])

## Tramos [[road, s_desde, s_hasta], ...] del camino más corto entre dos puntos de la red.
static func find(from_road: int, from_s: float, to_road: int, to_s: float) -> Array:
	_ensure_graph()
	var extra := {}
	extra[from_road] = [from_s]
	if extra.has(to_road):
		extra[to_road].append(to_s)
	else:
		extra[to_road] = [to_s]
	_rebuild(extra)
	var start := _key(from_road, from_s)
	var goal := _key(to_road, to_s)
	var dist := {start: 0.0}
	var prev := {}
	var open: Array = [[0.0, start]]
	var done := {}
	while not open.is_empty():
		# cola de prioridad sencilla (el grafo es pequeño)
		var bi := 0
		for i in open.size():
			if open[i][0] < open[bi][0]:
				bi = i
		var cur: Array = open[bi]
		open.remove_at(bi)
		var u: String = cur[1]
		if done.has(u):
			continue
		done[u] = true
		if u == goal:
			break
		for e in _graph.get(u, []):
			var v: String = e[0]
			var nd: float = dist[u] + float(e[1])
			if nd < dist.get(v, INF):
				dist[v] = nd
				prev[v] = [u, e]
				open.append([nd, v])
	_rebuild()
	if not prev.has(goal) and start != goal:
		return []
	var legs: Array = []
	var k := goal
	while k != start:
		var pe: Array = prev[k]
		var e: Array = pe[1]
		if int(e[2]) >= 0:
			legs.push_front([int(e[2]), float(e[3]), float(e[4])])
		k = pe[0]
	# fusionar tramos consecutivos de la misma vía
	var merged: Array = []
	for l in legs:
		if not merged.is_empty() and merged[-1][0] == l[0] and absf(merged[-1][2] - l[1]) < 1.0:
			merged[-1][2] = l[2]
		else:
			merged.append(l)
	return merged

## Construye la ruta compuesta. Devuelve una RoadPath con junctions [s, otra, tipo, s_otra, vía_base].
static func compose(legs: Array, route_name := "Ruta") -> RoadPath:
	var pts := PackedVector3Array()
	var fl := PackedInt32Array()
	var kd := PackedStringArray()
	var arc := PackedFloat32Array()
	var juncs: Array = []
	var total := 0.0
	var draw_cs := -1.0
	for li in legs.size():
		var rp: RoadPath = World.roads[legs[li][0]]
		var s0: float = legs[li][1]
		var s1: float = legs[li][2]
		var span := s1 - s0
		if rp.closed:
			# por el lado más corto del anillo
			span = wrapf(span, -rp.length * 0.5, rp.length * 0.5)
		var dir := signf(span) if absf(span) > 0.01 else 1.0
		var n := maxi(1, int(ceil(absf(span) / RoadPath.STEP)))
		var leg_pts := PackedVector3Array()
		var leg_s := PackedFloat32Array()
		for i in n + 1:
			var s := s0 + span * float(i) / n
			leg_pts.append(rp.frame(rp.clamp_s(s)).origin)
			leg_s.append(s)
		# recortar la esquina con la ruta anterior
		var skip := 0
		if li > 0 and pts.size() > 2:
			var corner := leg_pts[0]
			while pts.size() > 2 and pts[pts.size() - 1].distance_to(corner) < CORNER:
				pts.resize(pts.size() - 1)
				fl.resize(fl.size() - 1)
				kd.resize(kd.size() - 1)
				arc.resize(arc.size() - 1)
			total = arc[arc.size() - 1]
			while skip < leg_pts.size() - 2 and leg_pts[skip].distance_to(corner) < CORNER:
				skip += 1
			var a := pts[pts.size() - 1]
			var b := leg_pts[skip]
			for k in range(1, 6):
				var t := k / 6.0
				var q := a.lerp(corner, t).lerp(corner.lerp(b, t), t)
				total += q.distance_to(pts[pts.size() - 1])
				pts.append(q)
				fl.append(0)
				kd.append(kd[kd.size() - 1])
				arc.append(total)
		for i in range(skip, leg_pts.size()):
			var p := leg_pts[i]
			if pts.size() > 0:
				total += p.distance_to(pts[pts.size() - 1])
			pts.append(p)
			var s := rp.clamp_s(leg_s[i])
			fl.append(rp.flag_at(s) & 7)
			kd.append(rp.kind_at(s))
			arc.append(total)
		if rp.draw_s >= 0.0:
			var drel := rp.draw_s - s0
			var df := drel / span if absf(span) > 0.01 else -1.0
			if df > 0.0 and df < 1.0:
				draw_cs = total - absf(span) * (1.0 - df)
		# cruces de esta vía dentro del tramo (semáforos, pasos a nivel)
		for j in rp.junctions:
			var js: float = j[0]
			var rel := js - s0
			if rp.closed:
				rel = wrapf(rel, -rp.length * 0.5, rp.length * 0.5)
			var f := rel / span if absf(span) > 0.01 else -1.0
			if f > 0.0 and f <= 1.0:
				var cs := total - absf(span) * (1.0 - f)
				juncs.append([cs, int(j[1]), str(j[2]), float(j[3]) if j.size() > 3 else 0.0, rp.id])
	# remuestreo uniforme cada 8 m
	var out := RoadPath.new()
	out.id = -1
	out.name = route_name
	out.kind = "road"
	out.closed = false
	var L := total
	var cnt := maxi(2, int(L / RoadPath.STEP) + 1)
	var seg := 0
	for i in cnt:
		var s := minf(i * RoadPath.STEP, L)
		while seg < arc.size() - 2 and arc[seg + 1] < s:
			seg += 1
		var a0 := arc[seg]
		var a1 := arc[seg + 1]
		var t := 0.0 if a1 - a0 < 0.001 else (s - a0) / (a1 - a0)
		out.pos.append(pts[seg].lerp(pts[seg + 1], clampf(t, 0.0, 1.0)))
		out.flags.append(fl[seg] if t < 0.5 else fl[seg + 1])
		out.kinds.append(kd[seg])
	juncs.sort_custom(func(x, y): return x[0] < y[0])
	out.junctions = juncs
	out.draw_s = draw_cs
	out._prepare()
	# el tipo principal de la ruta
	var cnt_k := {}
	for k in out.kinds:
		cnt_k[k] = cnt_k.get(k, 0) + 1
	var best := 0
	for k in cnt_k:
		if cnt_k[k] > best:
			best = cnt_k[k]
			out.kind = k
	return out

## Vía base de un cruce (en rutas compuestas, la vía real que lo contiene).
static func junction_base(r: RoadPath, j: Array) -> int:
	return int(j[4]) if j.size() > 4 else r.id
