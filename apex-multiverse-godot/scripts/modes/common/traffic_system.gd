class_name TrafficSystem
extends Node3D
## Tráfico en "espacio de pista" sobre la carretera de la partida: autos, furgonetas, camiones, buses y motos,
## en ambos sentidos. Respeta semáforos (los mismos que dibuja el mapa) y cambia de carril con intermitente.

const TYPES := ["sedan", "sedan", "sedan", "hatch", "hatch", "suv", "suv", "pickup", "van", "semi", "bus", "coupe", "moto", "moto", "moto"]
const MOTO_SHAPES := ["naked", "scooter", "superbike", "tourer", "cafe"]

var road: RoadPath
var cars: Array = []   # {node, s, x, tx, speed, base, dir, type, hl, hw, passed, lc_t, hit, moto}
var density := 1.0
var player_s := 0.0
var player_x := 0.0
var obey_lights := true
var night := false
var ahead := 650.0
var behind := 90.0
var allow_oncoming := true
var min_speed := 14.0
var max_speed := 30.0
var obstacles: Array = []   # [{s, x, hl, hw}] que el tráfico esquiva (obras, árboles)

func setup(r: RoadPath) -> void:
	road = r

func lanes_at(s: float, dir: int) -> Array:
	var ls: Array = road.lanes_at(s)
	var out := []
	for l in ls:
		if l == 0.0:
			continue
		out.append(l * dir)
	return out

func target_count() -> int:
	var k := road.kind_at(player_s)
	var base = {"highway": 22, "avenue": 16, "road": 9, "dirt": 0}.get(k, 8)
	return int(base * density)

func _free(s: float, x: float, gap: float) -> bool:
	for c in cars:
		if absf(c["x"] - x) < 2.2 and absf(c["s"] - s) < gap:
			return false
	for o in obstacles:
		if absf(o["x"] - x) < 3.0 and absf(o["s"] - s) < gap + 30.0:
			return false
	return true

func spawn(s: float, force_dir := 0) -> void:
	if not road.closed and (s < 5.0 or s > road.length - 5.0):
		return
	var dir := force_dir
	if dir == 0:
		dir = 1 if (randf() < 0.62 or not allow_oncoming) else -1
	var ls := lanes_at(s, dir)
	if ls.is_empty():
		return
	ls.shuffle()
	var tp: String = TYPES[randi() % TYPES.size()]
	for lx in ls:
		if (tp == "semi" or tp == "bus") and absf(lx) < 3.0 and ls.size() > 1:
			continue
		if not _free(s, lx, 30.0):
			continue
		var node: Node3D
		var hl := 2.3
		var hw := 0.95
		var moto := tp == "moto"
		if moto:
			var v := VehicleVisual.new()
			v.setup({"kind": "moto", "shape": MOTO_SHAPES[randi() % MOTO_SHAPES.size()]}, TrafficFactory.PAINTS[randi() % TrafficFactory.PAINTS.size()], true)
			node = v
			hl = 1.1
			hw = 0.45
		else:
			node = TrafficFactory.spawn(tp, TrafficFactory.PAINTS[randi() % TrafficFactory.PAINTS.size()])
			hl = float(node.get_meta("length")) * 0.5
			hw = float(node.get_meta("width")) * 0.5
		add_child(node)
		var k := road.kind_at(s)
		var lim = {"highway": 33.0, "avenue": 15.0, "road": 21.0, "dirt": 11.0}.get(k, 18.0)
		var spd := clampf(lim * randf_range(0.75, 1.0) + absf(lx) * 0.25, min_speed * 0.5, max_speed)
		if tp == "semi" or tp == "bus":
			spd *= 0.85
		if moto:
			spd *= 1.12
		var d := {"node": node, "s": s, "x": lx, "tx": lx, "speed": spd, "base": spd, "dir": dir, "type": tp, "hl": hl, "hw": hw,
			"passed": false, "lc_t": randf_range(4.0, 14.0), "hit": false, "moto": moto, "blink": null, "stop": false}
		if night and not moto:
			_glows(node, d)
		cars.append(d)
		return

static var _glow_cache := {}

func _glows(node: Node3D, d: Dictionary) -> void:
	var key := "%.2f_%.2f" % [d["hl"], d["hw"]]
	if not _glow_cache.has(key):
		var mesh := ArrayMesh.new()
		for front in [false, true]:
			var md := MeshData.new()
			for sx in [-1.0, 1.0]:
				var c := Vector3(sx * d["hw"] * 0.7, 0.85, (-d["hl"] - 0.25) if front else (d["hl"] + 0.2))
				var w := 0.7
				md.quad(c + Vector3(-w, -w, 0), c + Vector3(w, -w, 0), c + Vector3(w, w, 0), c + Vector3(-w, w, 0), Color.WHITE, Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 0))
			var m := MatLib.additive("glow", Color(1.0, 0.95, 0.85) if front else Color(1.0, 0.1, 0.05), 1.0)
			md.to_mesh(m, false, false, mesh)
		_glow_cache[key] = mesh
	var g := MeshInstance3D.new()
	g.mesh = _glow_cache[key]
	g.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	node.add_child(g)

func clear() -> void:
	for c in cars:
		c["node"].queue_free()
	cars.clear()

## Elimina el tráfico cerca de un punto (reaparición tras choque).
func clear_near(s: float, back: float, fwd: float) -> void:
	var i := cars.size() - 1
	while i >= 0:
		var c: Dictionary = cars[i]
		var ds := _ds(c["s"], s)
		if ds > -back and ds < fwd:
			c["node"].queue_free()
			cars.remove_at(i)
		i -= 1

func _ds(a: float, b: float) -> float:
	var d := a - b
	if road.closed:
		var L := road.length
		d = fposmod(d + L * 0.5, L) - L * 0.5
	return d

func update(dt: float) -> void:
	var i := cars.size() - 1
	while i >= 0:
		var c: Dictionary = cars[i]
		var want: float = c["base"]
		var dir: int = c["dir"]
		# seguir al de delante en el mismo carril y sentido
		for o in cars:
			if o == c or o["dir"] != dir:
				continue
			if absf(o["x"] - c["x"]) < 2.0:
				var gap := _ds(o["s"], c["s"]) * dir
				if gap > 0.0 and gap < 24.0:
					want = minf(want, o["speed"] - 1.0 if gap > 9.0 else 0.0)
		# obstáculos (obras, árboles caídos)
		for ob in obstacles:
			if absf(ob["x"] - c["x"]) < 2.6:
				var g2 := _ds(ob["s"], c["s"]) * dir
				if g2 > 0.0 and g2 < 90.0 and c["tx"] == c["x"]:
					if not _lane_change(c, true) and g2 < 26.0:
						want = 0.0
		# semáforos
		c["stop"] = false
		if obey_lights:
			for jn in road.junctions:
				if jn[2] != "cross":
					continue
				var js: float = jn[0]
				var g3 := _ds(js, c["s"]) * dir - 9.0
				if g3 > 0.0 and g3 < 45.0:
					var other: RoadPath = World.roads[int(jn[1])]
					var major := _is_major(road, other)
					if World.light_state(World.junction_phase(road.id, other.id), World.time, major) != 0:
						want = minf(want, maxf(0.0, (g3 - 2.0) * 0.6))
						c["stop"] = true
		# jugador delante: frena un poco (no se lo come por detrás)
		if dir > 0 and absf(player_x - c["x"]) < 2.0:
			var gp := _ds(player_s, c["s"])
			if gp > 0.0 and gp < 18.0:
				want = minf(want, 4.0)
		if c["hit"]:
			want = 0.0
		c["speed"] = move_toward(c["speed"], want, (9.0 if want < c["speed"] else 4.0) * dt)
		c["s"] = road.clamp_s(c["s"] + c["speed"] * dt * dir) if road.closed else c["s"] + c["speed"] * dt * dir
		c["lc_t"] -= dt
		if c["lc_t"] <= 0.0 and not c["hit"]:
			c["lc_t"] = randf_range(6.0, 16.0)
			if randf() < 0.5:
				_lane_change(c, false)
		if absf(c["x"] - c["tx"]) > 0.01:
			c["x"] = move_toward(c["x"], c["tx"], 1.6 * dt)
			if c["blink"] != null:
				c["blink"].visible = fmod(World.time, 0.7) < 0.35
		elif c["blink"] != null:
			c["blink"].queue_free()
			c["blink"] = null
		var fr := road.frame(c["s"])
		var yaw: float = -(c["tx"] - c["x"]) * 0.06 * dir if absf(c["x"] - c["tx"]) > 0.01 else 0.0
		var b := fr.basis if dir > 0 else Basis(-fr.basis.x, fr.basis.y, -fr.basis.z)
		if c.has("spin_v"):
			c["spin_a"] = c.get("spin_a", 0.0) + c["spin_v"] * dt
			c["spin_v"] = move_toward(c["spin_v"], 0.0, 3.0 * dt)
			yaw += c["spin_a"]
		b = b.rotated(fr.basis.y, yaw)
		c["node"].global_transform = Transform3D(b, fr.origin + fr.basis.x * c["x"])
		if c["moto"]:
			(c["node"] as VehicleVisual).update_visual(dt, c["speed"], 0.0)
		var rel := _ds(c["s"], player_s)
		if rel < -behind or rel > ahead + 150.0 or (not road.closed and (c["s"] < 0.0 or c["s"] > road.length)):
			c["node"].queue_free()
			cars.remove_at(i)
		i -= 1
	var tries := 0
	while cars.size() < target_count() and tries < 3:
		tries += 1
		var s := player_s + randf_range(ahead * 0.55, ahead)
		if road.closed:
			s = road.clamp_s(s)
		spawn(s)

static func _is_major(r: RoadPath, o: RoadPath) -> bool:
	var pr := {"highway": 5, "rail": 4, "avenue": 3, "road": 2, "dirt": 1}
	var a: int = pr.get(r.kind, 1)
	var b: int = pr.get(o.kind, 1)
	return a > b or (a == b and r.id < o.id)

func _lane_change(c: Dictionary, forced: bool) -> bool:
	var ls := lanes_at(c["s"], c["dir"])
	var cur := -1
	for k in ls.size():
		if absf(ls[k] - c["tx"]) < 0.3:
			cur = k
	if cur < 0:
		return false
	var opts := []
	for d in [-1, 1]:
		var nk: int = cur + d
		if nk < 0 or nk >= ls.size():
			continue
		var nx: float = ls[nk]
		var ok := true
		for o in cars:
			if o != c and absf(o["x"] - nx) < 2.0 and absf(_ds(o["s"], c["s"])) < 18.0:
				ok = false
		if absf(player_x - nx) < 2.2 and absf(_ds(player_s, c["s"])) < 14.0:
			ok = false
		for ob in obstacles:
			if absf(ob["x"] - nx) < 2.6 and absf(_ds(ob["s"], c["s"])) < 60.0:
				ok = false
		if ok:
			opts.append(nx)
	if opts.is_empty():
		return false
	var nx2: float = opts[randi() % opts.size()]
	c["tx"] = nx2
	if not c["moto"]:
		var bl := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(0.6, 0.6)
		bl.mesh = q
		bl.material_override = MatLib.billboard("glow", Color(1.0, 0.55, 0.0), 2.0)
		bl.position = Vector3(signf(nx2 - c["x"]) * c["dir"] * c["hw"] * 0.9, 0.9, c["hl"] + 0.1)
		bl.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		c["node"].add_child(bl)
		if c["blink"] != null:
			c["blink"].queue_free()
		c["blink"] = bl
	return true
