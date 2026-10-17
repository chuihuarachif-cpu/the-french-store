class_name RoadPath
extends RefCounted
## Una carretera del mapa (polilínea con muestras cada 8 m). Da marcos de "espacio de pista":
## frame(s) -> Transform3D con basis.x = derecha, basis.y = arriba, -basis.z = adelante.
## Tráfico por la derecha: los carriles con x > 0 avanzan en +s.

const STEP := 8.0
## Carriles (centros, x>0 = sentido de avance) y medio ancho por tipo.
const LANES := {
	"highway": [2.75, 6.45, 10.15],
	"avenue": [1.85, 5.55],
	"road": [1.8],
	"dirt": [0.0],
	"rail": [0.0],
}
const HALF := {"highway": 12.0, "avenue": 7.4, "road": 3.6, "dirt": 3.4, "rail": 1.5}
const EDGE := {"highway": 14.6, "avenue": 11.0, "road": 5.2, "dirt": 3.8, "rail": 2.6}
const KIND_CODE := {"h": "highway", "a": "avenue", "r": "road", "d": "dirt", "r_": "rail"}

var id := 0
var name := ""
var kind := "road"
var closed := false
var length := 0.0
var pos := PackedVector3Array()
var fwd := PackedVector3Array()
var right := PackedVector3Array()
var up := PackedVector3Array()
var curv := PackedFloat32Array()
var flags := PackedInt32Array()
var kinds := PackedStringArray()
var junctions: Array = []
var draw_s := -1.0

static func from_dict(d: Dictionary, index: int) -> RoadPath:
	var r := RoadPath.new()
	r.id = index
	r.name = d["name"]
	r.kind = d["kind"]
	r.closed = d["closed"]
	r.draw_s = float(d.get("draw_s", -1.0))
	var p: Array = d["pts"]
	for i in p.size() / 3:
		r.pos.append(Vector3(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]))
	for f in d["flags"]:
		r.flags.append(int(f))
	for t in d["types"]:
		var k: String = t
		r.kinds.append({"h": "highway", "a": "avenue", "r": "road", "d": "dirt"}.get(k, r.kind) if r.kind != "rail" else "rail")
	r.junctions = d["junctions"]
	r._prepare()
	return r

func _prepare() -> void:
	var cnt := pos.size()
	length = (cnt if closed else cnt - 1) * STEP
	fwd.resize(cnt)
	right.resize(cnt)
	up.resize(cnt)
	curv.resize(cnt)
	for i in cnt:
		var a := pos[_wrap(i - 1)]
		var b := pos[_wrap(i + 1)]
		if not closed:
			a = pos[maxi(i - 1, 0)]
			b = pos[mini(i + 1, cnt - 1)]
		var f := (b - a).normalized()
		fwd[i] = f
	var raw := PackedFloat32Array()
	raw.resize(cnt)
	for i in cnt:
		var f0 := fwd[_wrap(i - 2) if closed else maxi(i - 2, 0)]
		var f1 := fwd[_wrap(i + 2) if closed else mini(i + 2, cnt - 1)]
		var c := Vector2(f0.x, f0.z).angle_to(Vector2(f1.x, f1.z))
		raw[i] = c / (4.0 * STEP)
	for i in cnt:
		var acc := 0.0
		var w := 0
		for k in range(-3, 4):
			var j := i + k
			if closed:
				j = _wrap(j)
			elif j < 0 or j >= cnt:
				continue
			acc += raw[j]
			w += 1
		curv[i] = acc / w
	for i in cnt:
		var f := fwd[i]
		var r := Vector3(-f.z, 0, f.x).normalized()
		var bank := clampf(curv[i] * (20.0 if kind == "highway" else 12.0), -0.06, 0.06)
		r = r.rotated(f, -bank)
		right[i] = r
		up[i] = r.cross(f).normalized()

func _wrap(i: int) -> int:
	var cnt := pos.size()
	return ((i % cnt) + cnt) % cnt

func clamp_s(s: float) -> float:
	if closed:
		return fposmod(s, length)
	return clampf(s, 0.0, length)

func _idx(s: float) -> Array:
	s = clamp_s(s)
	var t := s / STEP
	var i := int(floor(t))
	var f := t - i
	var cnt := pos.size()
	if closed:
		i = i % cnt
		return [i, (i + 1) % cnt, f]
	if i >= cnt - 1:
		return [cnt - 2, cnt - 1, 1.0]
	return [i, i + 1, f]

func frame(s: float) -> Transform3D:
	var k := _idx(s)
	var i: int = k[0]
	var j: int = k[1]
	var f: float = k[2]
	var p := pos[i].lerp(pos[j], f)
	var fw := fwd[i].lerp(fwd[j], f).normalized()
	var r := right[i].lerp(right[j], f).normalized()
	var u := up[i].lerp(up[j], f).normalized()
	return Transform3D(Basis(r, u, -fw), p)

func point(s: float, x: float, y := 0.0) -> Vector3:
	var fr := frame(s)
	return fr.origin + fr.basis.x * x + fr.basis.y * y

func curvature(s: float) -> float:
	var k := _idx(s)
	return lerpf(curv[k[0]], curv[k[1]], k[2])

func flag_at(s: float) -> int:
	var k := _idx(s)
	return flags[k[0] if k[2] < 0.5 else k[1]]

func kind_at(s: float) -> String:
	var k := _idx(s)
	return kinds[k[0]]

func half_width(i: int) -> float:
	return HALF.get(kinds[i], 4.0)

func half_at(s: float) -> float:
	return HALF.get(kind_at(s), 4.0)

func lanes_at(s: float) -> Array:
	return LANES.get(kind_at(s), [0.0])

func is_tunnel(s: float) -> bool:
	return (flag_at(s) & 1) != 0

func is_bridge(s: float) -> bool:
	return (flag_at(s) & 2) != 0

## Proyección de un punto del mundo a (s, x). hint_s acelera la búsqueda local.
func nearest(p: Vector3, hint_s := -1.0, window := 400.0) -> Vector2:
	var cnt := pos.size()
	var best := 0
	var bd := 1e20
	if hint_s >= 0.0:
		var c := int(clamp_s(hint_s) / STEP)
		var w := int(window / STEP)
		for k in range(-w, w + 1):
			var i := c + k
			if closed:
				i = _wrap(i)
			elif i < 0 or i >= cnt:
				continue
			var d := Vector2(pos[i].x - p.x, pos[i].z - p.z).length_squared()
			if d < bd:
				bd = d
				best = i
	else:
		for i in cnt:
			var d := Vector2(pos[i].x - p.x, pos[i].z - p.z).length_squared()
			if d < bd:
				bd = d
				best = i
	var x := (p - pos[best]).dot(right[best])
	var along := (p - pos[best]).dot(fwd[best])
	return Vector2(clamp_s(best * STEP + along), x)

## Lista de cruces a nivel (s, tipo) en el rango [s0, s1].
func junctions_between(s0: float, s1: float) -> Array:
	var out := []
	for j in junctions:
		var s: float = j[0]
		if s >= s0 and s <= s1:
			out.append(j)
	return out
