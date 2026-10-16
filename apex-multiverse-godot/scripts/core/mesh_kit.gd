class_name MeshKit
## Utilidades para construir geometría procedural con SurfaceTool.

## Añade un quad (a,b,c,d antihorario visto desde la cara visible; Godot usa horario como frente).
static func quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3, uva := Vector2(0, 0), uvb := Vector2(1, 0), uvc := Vector2(1, 1), uvd := Vector2(0, 1)) -> void:
	var n := (b - a).cross(d - a).normalized()
	for v in [[a, uva], [c, uvc], [b, uvb], [a, uva], [d, uvd], [c, uvc]]:
		st.set_normal(n)
		st.set_uv(v[1])
		st.add_vertex(v[0])

## Caja con UV por cara (en metros * uv_scale).
static func box(st: SurfaceTool, center: Vector3, size: Vector3, uv_scale := 1.0, xform := Transform3D.IDENTITY) -> void:
	var h := size * 0.5
	var p := [
		Vector3(-h.x, -h.y, -h.z), Vector3(h.x, -h.y, -h.z), Vector3(h.x, h.y, -h.z), Vector3(-h.x, h.y, -h.z),
		Vector3(-h.x, -h.y, h.z), Vector3(h.x, -h.y, h.z), Vector3(h.x, h.y, h.z), Vector3(-h.x, h.y, h.z)]
	for i in p.size():
		p[i] = xform * (center + p[i])
	var faces := [[4, 5, 6, 7, size.x, size.y], [1, 0, 3, 2, size.x, size.y], [5, 1, 2, 6, size.z, size.y], [0, 4, 7, 3, size.z, size.y], [7, 6, 2, 3, size.x, size.z], [0, 1, 5, 4, size.x, size.z]]
	for f in faces:
		var u: float = f[4] * uv_scale
		var v: float = f[5] * uv_scale
		quad(st, p[f[0]], p[f[1]], p[f[2]], p[f[3]], Vector2(0, v), Vector2(u, v), Vector2(u, 0), Vector2(0, 0))

## Cilindro (eje Y) con tapas opcionales.
static func cylinder(st: SurfaceTool, base: Vector3, radius_bottom: float, radius_top: float, height: float, seg := 12, caps := true, xform := Transform3D.IDENTITY, uv_v := 1.0) -> void:
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		var b0 := base + Vector3(cos(a0) * radius_bottom, 0, sin(a0) * radius_bottom)
		var b1 := base + Vector3(cos(a1) * radius_bottom, 0, sin(a1) * radius_bottom)
		var t0 := base + Vector3(cos(a0) * radius_top, height, sin(a0) * radius_top)
		var t1 := base + Vector3(cos(a1) * radius_top, height, sin(a1) * radius_top)
		var n0 := xform.basis * Vector3(cos(a0), (radius_bottom - radius_top) / max(height, 0.001), sin(a0)).normalized()
		var n1 := xform.basis * Vector3(cos(a1), (radius_bottom - radius_top) / max(height, 0.001), sin(a1)).normalized()
		var u0 := float(i) / seg
		var u1 := float(i + 1) / seg
		for v in [[b0, n0, Vector2(u0, uv_v)], [b1, n1, Vector2(u1, uv_v)], [t1, n1, Vector2(u1, 0)], [b0, n0, Vector2(u0, uv_v)], [t1, n1, Vector2(u1, 0)], [t0, n0, Vector2(u0, 0)]]:
			st.set_normal(v[1])
			st.set_uv(v[2])
			st.add_vertex(xform * v[0])
		if caps:
			var nt := xform.basis * Vector3.UP
			for v in [base + Vector3(0, height, 0), t0, t1]:
				st.set_normal(nt)
				st.set_uv(Vector2(0.5, 0.5))
				st.add_vertex(xform * v)
			var nb := xform.basis * Vector3.DOWN
			for v in [base, b1, b0]:
				st.set_normal(nb)
				st.set_uv(Vector2(0.5, 0.5))
				st.add_vertex(xform * v)

## Extruye un perfil 2D (x lateral, y alto) a lo largo de una lista de marcos Transform3D.
## Los marcos tienen basis.x = derecha, basis.y = arriba. v_dist = distancia acumulada para UV.
static func extrude(st: SurfaceTool, profile: PackedVector2Array, frames: Array, dists: PackedFloat32Array, uv_scale := 1.0, closed := false, flip := false) -> void:
	var pn := profile.size()
	var plen := PackedFloat32Array()
	plen.resize(pn)
	var acc := 0.0
	for i in pn:
		plen[i] = acc
		if i < pn - 1:
			acc += profile[i].distance_to(profile[i + 1])
	var segs := pn if closed else pn - 1
	for f in frames.size() - 1:
		var A: Transform3D = frames[f]
		var B: Transform3D = frames[f + 1]
		for i in segs:
			var j := (i + 1) % pn
			var a0 := A * Vector3(profile[i].x, profile[i].y, 0)
			var a1 := A * Vector3(profile[j].x, profile[j].y, 0)
			var b0 := B * Vector3(profile[i].x, profile[i].y, 0)
			var b1 := B * Vector3(profile[j].x, profile[j].y, 0)
			var ua := Vector2(plen[i] * uv_scale, dists[f] * uv_scale)
			var ub := Vector2(plen[j] * uv_scale if j > 0 else acc * uv_scale, dists[f] * uv_scale)
			var uc := Vector2(ub.x, dists[f + 1] * uv_scale)
			var ud := Vector2(ua.x, dists[f + 1] * uv_scale)
			if flip:
				quad(st, a0, b0, b1, a1, ua, ud, uc, ub)
			else:
				quad(st, a0, a1, b1, b0, ua, ub, uc, ud)

## Cinta horizontal entre dos desplazamientos laterales a lo largo de marcos.
## UV.x = posición lateral en metros, UV.y = distancia (para shaders de carretera).
static func ribbon(st: SurfaceTool, frames: Array, dists: PackedFloat32Array, x0: float, x1: float, y := 0.0, steps := 1) -> void:
	for f in frames.size() - 1:
		var A: Transform3D = frames[f]
		var B: Transform3D = frames[f + 1]
		for k in steps:
			var xa := lerpf(x0, x1, float(k) / steps)
			var xb := lerpf(x0, x1, float(k + 1) / steps)
			var p0 := A * Vector3(xa, y, 0)
			var p1 := A * Vector3(xb, y, 0)
			var p2 := B * Vector3(xb, y, 0)
			var p3 := B * Vector3(xa, y, 0)
			var na := A.basis.y
			var nb := B.basis.y
			for v in [[p0, na, Vector2(xa, dists[f])], [p2, nb, Vector2(xb, dists[f + 1])], [p1, na, Vector2(xb, dists[f])], [p0, na, Vector2(xa, dists[f])], [p3, nb, Vector2(xa, dists[f + 1])], [p2, nb, Vector2(xb, dists[f + 1])]]:
				st.set_normal(v[1])
				st.set_uv(v[2])
				st.add_vertex(v[0])

static func begin() -> SurfaceTool:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	return st

## Añade la superficie de un SurfaceTool a un ArrayMesh con material.
static func commit(st: SurfaceTool, mesh: ArrayMesh, mat: Material, tangents := true) -> void:
	if tangents:
		st.generate_tangents()
	st.set_material(mat)
	st.commit(mesh)
