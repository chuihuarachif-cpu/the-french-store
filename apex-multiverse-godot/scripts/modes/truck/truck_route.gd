class_name TruckRoute
extends RefCounted
## Ruta abierta del modo Camiones (Curve3D desde puntos de control, Catmull-Rom).

const STEP := 1.0
var length := 0.0
var pos := PackedVector3Array()
var fwd := PackedVector3Array()
var right := PackedVector3Array()
var curve := Curve3D.new()

func _init(points: Array) -> void:
	var n := points.size()
	for i in n:
		var p: Vector3 = points[i]
		var prev: Vector3 = points[maxi(i - 1, 0)]
		var next: Vector3 = points[mini(i + 1, n - 1)]
		var tan := (next - prev) / 6.0
		curve.add_point(p, -tan, tan)
	curve.bake_interval = 0.5
	length = curve.get_baked_length()
	var count := int(length / STEP)
	for i in count + 1:
		pos.append(curve.sample_baked(minf(i * STEP, length), true))
	for i in pos.size():
		var a := pos[maxi(i - 2, 0)]
		var b := pos[mini(i + 2, pos.size() - 1)]
		var f := (b - a)
		f.y *= 0.0
		f = f.normalized()
		fwd.append(f)
		right.append(f.cross(Vector3.UP).normalized())
	length = (pos.size() - 1) * STEP

func _k(s: float) -> Array:
	var t := clampf(s, 0.0, length - 0.001) / STEP
	var i := int(t)
	return [i, mini(i + 1, pos.size() - 1), t - i]

func frame(s: float) -> Transform3D:
	var k := _k(s)
	var p := pos[k[0]].lerp(pos[k[1]], k[2])
	var f := fwd[k[0]].lerp(fwd[k[1]], k[2]).normalized()
	var r := right[k[0]].lerp(right[k[1]], k[2]).normalized()
	return Transform3D(Basis(r, Vector3.UP, -f), p)

func point(s: float, x: float) -> Vector3:
	var fr := frame(s)
	return fr.origin + fr.basis.x * x

func nearest_s(p: Vector3, hint := -1) -> float:
	var best := 0
	var bd := 1e20
	var r0 := 0
	var r1 := pos.size()
	if hint >= 0:
		r0 = maxi(int(hint / STEP) - 60, 0)
		r1 = mini(int(hint / STEP) + 60, pos.size())
	for i in range(r0, r1):
		var d := Vector2(pos[i].x - p.x, pos[i].z - p.z).length_squared()
		if d < bd:
			bd = d
			best = i
	return best * STEP
