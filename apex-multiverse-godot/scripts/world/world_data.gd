extends Node
## Autoload "World": el país único de Fransterra. Carga relieve, biomas, carreteras, edificios y puntos de interés.
## Todo es de solo lectura tras _load(), así que puede consultarse desde hilos de trabajo.

const DIR := "res://assets/world/"
const CHUNK := 256.0

enum Biome { MEADOW, FIELD, FOREST, CITY, REDZONE, BEACH, ROCK, SNOW, SEA, RIVER, VINEYARD, AIRPORT, PORT, VILLAGE, PARK }

var loaded := false
## Reloj del mundo (semáforos, puente levadizo, tren, animaciones en GPU).
var time := 0.0
var n := 2048
var cell := 8.0
var half := 8192.0
var _h := PackedByteArray()   # RGB: alto = (R*256+G)/40 - 100
var _b := PackedByteArray()   # RGB: bioma, dist. carretera, departamento
var data := {}
var roads: Array = []          # RoadPath
var road_by_name := {}
var departments: Array = []
var pois := {}
var river: Dictionary = {}
var buildings := PackedFloat32Array()
var chunk_buildings := {}      # Vector2i -> PackedInt32Array
var chunk_roads := {}          # Vector2i -> Array[[road_idx, i0, i1]]
var chunk_river := {}          # Vector2i -> [i0, i1]
var portals: Array = []        # {pos, dir, right, half, road}
var chunk_portals := {}
var chunk_junctions := {}      # Vector2i -> Array[{pos, road, s, other, kind, phase}]

func _ready() -> void:
	ensure_loaded()

func ensure_loaded() -> void:
	if loaded:
		return
	var t0 := Time.get_ticks_msec()
	var himg := Image.new()
	himg.load_png_from_buffer(FileAccess.get_file_as_bytes(DIR + "height.png.bin"))
	if himg.get_format() != Image.FORMAT_RGB8:
		himg.convert(Image.FORMAT_RGB8)
	n = himg.get_width()
	_h = himg.get_data()
	var bimg := Image.new()
	bimg.load_png_from_buffer(FileAccess.get_file_as_bytes(DIR + "biome.png.bin"))
	if bimg.get_format() != Image.FORMAT_RGB8:
		bimg.convert(Image.FORMAT_RGB8)
	_b = bimg.get_data()
	data = JSON.parse_string(FileAccess.get_file_as_string(DIR + "world.json.bin"))
	cell = float(data["cell"])
	half = float(data["size"]) * 0.5
	departments = data["departments"]
	pois = data["pois"]
	river = data["river"]
	for i in data["roads"].size():
		var r := RoadPath.from_dict(data["roads"][i], i)
		roads.append(r)
		road_by_name[r.name] = r
	buildings = FileAccess.get_file_as_bytes(DIR + "buildings.bin").to_float32_array()
	_index()
	loaded = true
	print("Mundo cargado en %d ms: %d carreteras, %d edificios" % [Time.get_ticks_msec() - t0, roads.size(), buildings.size() / 8])

func chunk_of(x: float, z: float) -> Vector2i:
	return Vector2i(int(floor((x + half) / CHUNK)), int(floor((z + half) / CHUNK)))

func chunk_origin(c: Vector2i) -> Vector2:
	return Vector2(c.x * CHUNK - half, c.y * CHUNK - half)

func _index() -> void:
	for i in buildings.size() / 8:
		var c := chunk_of(buildings[i * 8], buildings[i * 8 + 2])
		if not chunk_buildings.has(c):
			chunk_buildings[c] = PackedInt32Array()
		chunk_buildings[c].append(i)
	for ri in roads.size():
		var r: RoadPath = roads[ri]
		var cur := Vector2i(-999, -999)
		var start := 0
		var cnt := r.pos.size()
		for i in cnt + 1:
			var c := Vector2i(-998, -998)
			if i < cnt:
				c = chunk_of(r.pos[i].x, r.pos[i].z)
			if c != cur:
				if i > 0:
					if not chunk_roads.has(cur):
						chunk_roads[cur] = []
					var end := i if (i < cnt or r.closed) else cnt - 1
					chunk_roads[cur].append([ri, start, end])
				cur = c
				start = i
		# Bocas de túnel
		for i in cnt:
			var j := (i + 1) % cnt
			if not r.closed and j == 0:
				break
			var a: bool = (r.flags[i] & 1) != 0
			var b: bool = (r.flags[j] & 1) != 0
			if a != b:
				var k := j if b else i
				var d: Vector3 = r.fwd[k] * (1.0 if b else -1.0)
				var p := {"pos": r.pos[k] - d * 4.0, "dir": d, "right": r.right[k] * (1.0 if b else -1.0), "half": r.half_width(k) + 1.0, "road": ri}
				portals.append(p)
				var c2 := chunk_of(p["pos"].x, p["pos"].z)
				for dx in [-1, 0, 1]:
					for dz in [-1, 0, 1]:
						var cc := c2 + Vector2i(dx, dz)
						if not chunk_portals.has(cc):
							chunk_portals[cc] = []
						chunk_portals[cc].append(p)
		# Cruces (semáforos)
		for jn in r.junctions:
			var s: float = jn[0]
			var fr := r.frame(s)
			var c3 := chunk_of(fr.origin.x, fr.origin.z)
			if not chunk_junctions.has(c3):
				chunk_junctions[c3] = []
			chunk_junctions[c3].append({"pos": fr.origin, "road": ri, "s": s, "other": int(jn[1]), "kind": jn[2], "basis": fr.basis, "phase": junction_phase(ri, int(jn[1]))})
	var rp: Array = river["pts"]
	var cur2 := Vector2i(-999, -999)
	var st := 0
	for i in rp.size() + 1:
		var c4 := Vector2i(-998, -998)
		if i < rp.size():
			c4 = chunk_of(rp[i][0], rp[i][2])
		if c4 != cur2:
			if i > 0:
				if not chunk_river.has(cur2):
					chunk_river[cur2] = []
				chunk_river[cur2].append([st, mini(i, rp.size() - 1)])
			cur2 = c4
			st = i

## Fase del ciclo de semáforo de un cruce (determinista: se dibuja en shader y lo consulta el juego).
static func junction_phase(a: int, b: int) -> float:
	return fmod(float(mini(a, b) * 7.31 + maxi(a, b) * 3.17), 1.0)

const LIGHT_CYCLE := 24.0
## Estado del semáforo para la vía principal o secundaria: 0 verde, 1 ámbar, 2 rojo.
static func light_state(phase: float, t: float, major: bool) -> int:
	var u := fposmod(t / LIGHT_CYCLE + phase, 1.0)
	if not major:
		u = fposmod(u + 0.5, 1.0)
	if u < 0.42:
		return 0
	if u < 0.5:
		return 1
	return 2

# ------------------------------------------------------------------ CONSULTAS
func _texel(x: float, z: float) -> Vector2:
	return Vector2((x + half) / cell - 0.5, (z + half) / cell - 0.5)

func _hraw(i: int, j: int) -> float:
	i = clampi(i, 0, n - 1)
	j = clampi(j, 0, n - 1)
	var k := (j * n + i) * 3
	return float(_h[k] * 256 + _h[k + 1]) / 40.0 - 100.0

func height(x: float, z: float) -> float:
	var t := _texel(x, z)
	var i := int(floor(t.x))
	var j := int(floor(t.y))
	var fx := t.x - i
	var fz := t.y - j
	var a := _hraw(i, j)
	var b := _hraw(i + 1, j)
	var c := _hraw(i, j + 1)
	var d := _hraw(i + 1, j + 1)
	return lerpf(lerpf(a, b, fx), lerpf(c, d, fx), fz)

func normal(x: float, z: float, e := 4.0) -> Vector3:
	var hx := height(x + e, z) - height(x - e, z)
	var hz := height(x, z + e) - height(x, z - e)
	return Vector3(-hx, 2.0 * e, -hz).normalized()

func _btex(x: float, z: float, ch: int) -> int:
	var t := _texel(x, z)
	var i := clampi(int(round(t.x)), 0, n - 1)
	var j := clampi(int(round(t.y)), 0, n - 1)
	return _b[(j * n + i) * 3 + ch]

func biome(x: float, z: float) -> int:
	return _btex(x, z, 0)

func road_dist(x: float, z: float) -> float:
	return float(_btex(x, z, 1))

func dept_index(x: float, z: float) -> int:
	return _btex(x, z, 2)

func dept_name(x: float, z: float) -> String:
	var i := dept_index(x, z)
	return departments[i]["name"] if i < departments.size() else ""

func water_level_sea() -> float:
	return 0.0

func building(i: int) -> Array:
	var k := i * 8
	return [buildings[k], buildings[k + 1], buildings[k + 2], buildings[k + 3], buildings[k + 4], buildings[k + 5], buildings[k + 6], int(buildings[k + 7])]

func road(name: String) -> RoadPath:
	return road_by_name.get(name)

func poi(key: String) -> Dictionary:
	return pois.get(key, {})

## Posición del mapa (0..1) para el minimapa.
func map_uv(p: Vector3) -> Vector2:
	return Vector2((p.x + half) / (2.0 * half), (p.z + half) / (2.0 * half))
