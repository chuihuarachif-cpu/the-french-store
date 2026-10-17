class_name MeshData
extends RefCounted
## Constructor de mallas con arrays empaquetados (rápido y apto para hilos de trabajo).
## Los quads se dan en orden antihorario visto desde la cara visible.

var v := PackedVector3Array()
var n := PackedVector3Array()
var uv := PackedVector2Array()
var uv2 := PackedVector2Array()
var col := PackedColorArray()
var idx := PackedInt32Array()

func is_empty() -> bool:
	return idx.is_empty()

func vert(p: Vector3, nn: Vector3, t := Vector2.ZERO, c := Color.WHITE, t2 := Vector2.ZERO) -> int:
	v.append(p)
	n.append(nn)
	uv.append(t)
	uv2.append(t2)
	col.append(c)
	return v.size() - 1

func tri(a: int, b: int, c: int) -> void:
	idx.append(a)
	idx.append(c)
	idx.append(b)

func quad(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, c := Color.WHITE, t0 := Vector2(0, 0), t1 := Vector2(1, 0), t2 := Vector2(1, 1), t3 := Vector2(0, 1), u2 := Vector2.ZERO, nn := Vector3.ZERO) -> void:
	if nn == Vector3.ZERO:
		nn = (p1 - p0).cross(p3 - p0).normalized()
	var b := v.size()
	vert(p0, nn, t0, c, u2)
	vert(p1, nn, t1, c, u2)
	vert(p2, nn, t2, c, u2)
	vert(p3, nn, t3, c, u2)
	tri(b, b + 1, b + 2)
	tri(b, b + 2, b + 3)

## Caja orientada. UV en metros (u horizontal a lo largo de la cara, v altura). faces: máscara (1 arriba, 2 abajo, 4 laterales).
func box(xf: Transform3D, size: Vector3, c := Color.WHITE, u2 := Vector2.ZERO, faces := 5, top_c := Color(-1, 0, 0)) -> void:
	var h := size * 0.5
	var P := [Vector3(-h.x, -h.y, -h.z), Vector3(h.x, -h.y, -h.z), Vector3(h.x, h.y, -h.z), Vector3(-h.x, h.y, -h.z),
		Vector3(-h.x, -h.y, h.z), Vector3(h.x, -h.y, h.z), Vector3(h.x, h.y, h.z), Vector3(-h.x, h.y, h.z)]
	for i in 8:
		P[i] = xf * P[i]
	if faces & 4:
		# frente (+z), atrás (-z), derecha (+x), izquierda (-x)
		quad(P[4], P[5], P[6], P[7], c, Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.y), Vector2(0, size.y), u2)
		quad(P[1], P[0], P[3], P[2], c, Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.y), Vector2(0, size.y), u2)
		quad(P[5], P[1], P[2], P[6], c, Vector2(0, 0), Vector2(size.z, 0), Vector2(size.z, size.y), Vector2(0, size.y), u2)
		quad(P[0], P[4], P[7], P[3], c, Vector2(0, 0), Vector2(size.z, 0), Vector2(size.z, size.y), Vector2(0, size.y), u2)
	if faces & 1:
		var tc := c if top_c.r < 0 else top_c
		quad(P[7], P[6], P[2], P[3], tc, Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.z), Vector2(0, size.z), Vector2(0, u2.y))
	if faces & 2:
		quad(P[0], P[1], P[5], P[4], c, Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.z), Vector2(0, size.z), u2)

## Prisma de n lados (eje Y) desde base hasta base+altura.
func prism(base: Vector3, r0: float, r1: float, hgt: float, sides: int, c := Color.WHITE, u2 := Vector2.ZERO, cap := true, xf := Transform3D.IDENTITY) -> void:
	for i in sides:
		var a0 := TAU * i / sides
		var a1 := TAU * (i + 1) / sides
		var b0 := xf * (base + Vector3(cos(a0) * r0, 0, sin(a0) * r0))
		var b1 := xf * (base + Vector3(cos(a1) * r0, 0, sin(a1) * r0))
		var t0 := xf * (base + Vector3(cos(a0) * r1, hgt, sin(a0) * r1))
		var t1 := xf * (base + Vector3(cos(a1) * r1, hgt, sin(a1) * r1))
		var w := TAU * r0 / sides
		quad(b1, b0, t0, t1, c, Vector2(0, 0), Vector2(w, 0), Vector2(w, hgt), Vector2(0, hgt), u2)
	if cap and r1 > 0.001:
		var ctr := vert(xf * (base + Vector3(0, hgt, 0)), (xf.basis * Vector3.UP).normalized(), Vector2.ZERO, c, Vector2(0, u2.y))
		for i in sides:
			var a0 := TAU * i / sides
			var a1 := TAU * (i + 1) / sides
			var q0 := vert(xf * (base + Vector3(cos(a0) * r1, hgt, sin(a0) * r1)), (xf.basis * Vector3.UP).normalized(), Vector2.ZERO, c, Vector2(0, u2.y))
			var q1 := vert(xf * (base + Vector3(cos(a1) * r1, hgt, sin(a1) * r1)), (xf.basis * Vector3.UP).normalized(), Vector2.ZERO, c, Vector2(0, u2.y))
			tri(ctr, q1, q0)

func append(o: MeshData) -> void:
	var b := v.size()
	v.append_array(o.v)
	n.append_array(o.n)
	uv.append_array(o.uv)
	uv2.append_array(o.uv2)
	col.append_array(o.col)
	for i in o.idx:
		idx.append(i + b)

func arrays(with_uv2 := false, with_col := true) -> Array:
	var a := []
	a.resize(Mesh.ARRAY_MAX)
	a[Mesh.ARRAY_VERTEX] = v
	a[Mesh.ARRAY_NORMAL] = n
	a[Mesh.ARRAY_TEX_UV] = uv
	if with_uv2:
		a[Mesh.ARRAY_TEX_UV2] = uv2
	if with_col:
		a[Mesh.ARRAY_COLOR] = col
	a[Mesh.ARRAY_INDEX] = idx
	return a

func to_mesh(mat: Material, with_uv2 := false, with_col := true, mesh: ArrayMesh = null) -> ArrayMesh:
	if mesh == null:
		mesh = ArrayMesh.new()
	if is_empty():
		return mesh
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays(with_uv2, with_col))
	mesh.surface_set_material(mesh.get_surface_count() - 1, mat)
	return mesh
