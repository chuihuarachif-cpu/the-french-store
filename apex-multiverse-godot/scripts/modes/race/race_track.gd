class_name RaceTrack
extends RefCounted
## Circuito cerrado desde puntos de control (Catmull-Rom -> Curve3D).
## Pre-muestrea marcos cada STEP metros para consultas rápidas: frame(s), curvature(s).

const STEP := 2.0
var length := 0.0
var pos := PackedVector3Array()
var right := PackedVector3Array()
var up := PackedVector3Array()
var fwd := PackedVector3Array()
var curv := PackedFloat32Array()
var curve := Curve3D.new()

func _init(points: Array, bank_k := 22.0) -> void:
	var n := points.size()
	for i in n + 1:
		var p: Vector3 = points[i % n]
		var prev: Vector3 = points[(i - 1 + n) % n]
		var next: Vector3 = points[(i + 1) % n]
		var tan := (next - prev) / 6.0
		curve.add_point(p, -tan, tan)
	curve.bake_interval = 1.0
	length = curve.get_baked_length()
	var count := int(length / STEP)
	length = count * STEP
	for i in count:
		pos.append(curve.sample_baked(i * STEP * curve.get_baked_length() / length, true))
	for i in count:
		var a := pos[(i - 1 + count) % count]
		var b := pos[(i + 1) % count]
		fwd.append((b - a).normalized())
	# Curvatura con signo (+ = gira a la derecha) suavizada
	var raw := PackedFloat32Array()
	for i in count:
		var f0 := fwd[(i - 4 + count) % count]
		var f1 := fwd[(i + 4) % count]
		var cr := f0.cross(f1).y
		raw.append(-cr / (8.0 * STEP))
	for i in count:
		var acc := 0.0
		for k in range(-6, 7):
			acc += raw[(i + k + count) % count]
		curv.append(acc / 13.0)
	for i in count:
		var f := fwd[i]
		var r := f.cross(Vector3.UP).normalized()
		var bank := clampf(curv[i] * bank_k, -0.12, 0.12)
		r = r.rotated(f, -bank)
		right.append(r)
		up.append(r.cross(f).normalized())

func _idx(s: float) -> Array:
	var count := pos.size()
	var t := fposmod(s, length) / STEP
	var i := int(t) % count
	return [i, (i + 1) % count, t - floor(t)]

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

func curvature(s: float) -> float:
	var k := _idx(s)
	return lerpf(curv[k[0]], curv[k[1]], k[2])

func point(s: float, x: float, y := 0.0) -> Vector3:
	var fr := frame(s)
	return fr.origin + fr.basis.x * x + fr.basis.y * y

## Proyección aproximada de un punto del mundo a (s, x) buscando la muestra más cercana.
func nearest(p: Vector3, hint := -1) -> Vector2:
	var count := pos.size()
	var best := 0
	var bd := 1e20
	if hint >= 0:
		for k in range(-40, 41):
			var i := (hint + k + count) % count
			var d := pos[i].distance_squared_to(p)
			if d < bd:
				bd = d
				best = i
	else:
		for i in count:
			var d := pos[i].distance_squared_to(p)
			if d < bd:
				bd = d
				best = i
	var x := (p - pos[best]).dot(right[best])
	return Vector2(best * STEP, x)
