class_name TruckWorld
extends Node3D
## Nivel 1 de Camiones: "Cañón del Río Bravo".
## Camino de tierra con barro y baches, cuesta con curvas cerradas, puente colgante sobre el río
## y bosque con fauna. Colisiones: malla del camino (con baches reales) + terreno por trozos.

const ROAD_HALF := 3.6
var route: TruckRoute
var noise := FastNoiseLite.new()
var rng := RandomNumberGenerator.new()
var bridge_s0 := 0.0
var bridge_s1 := 0.0
var mud_s0 := 140.0
var mud_s1 := 330.0
var potholes: Array = []  # {s, x, ra, rb, depth}
var checkpoints: Array = []
var _hash := {}
const HASH := 24.0
var valley_p := Vector3.ZERO
var valley_dir := Vector3.RIGHT

func build(r: TruckRoute, pts: Array) -> void:
	route = r
	rng.seed = 909
	noise.seed = 31
	noise.frequency = 0.006
	noise.fractal_octaves = 4
	bridge_s0 = route.nearest_s(pts[12]) - 2.0
	bridge_s1 = route.nearest_s(pts[13]) + 2.0
	var bc := route.frame((bridge_s0 + bridge_s1) * 0.5)
	valley_p = bc.origin
	valley_dir = bc.basis.x
	# Baches: muchos en el barro, algunos en el bosque
	var s := mud_s0 + 10.0
	while s < mud_s1 - 10.0:
		potholes.append({"s": s, "x": rng.randf_range(-2.2, 2.2), "ra": rng.randf_range(1.4, 2.4), "rb": rng.randf_range(1.2, 2.0), "depth": rng.randf_range(0.35, 0.75)})
		s += rng.randf_range(11.0, 19.0)
	s = bridge_s1 + 80.0
	while s < route.length - 60.0:
		potholes.append({"s": s, "x": rng.randf_range(-2.0, 2.0), "ra": rng.randf_range(1.2, 1.8), "rb": rng.randf_range(1.0, 1.5), "depth": rng.randf_range(0.25, 0.45)})
		s += rng.randf_range(40.0, 70.0)
	checkpoints = [6.0, mud_s0 - 10.0, mud_s1 + 20.0, route.nearest_s(pts[8]), bridge_s0 - 25.0, bridge_s1 + 15.0, route.nearest_s(pts[15]), route.nearest_s(pts[16])]
	for i in route.pos.size():
		var ss := i * TruckRoute.STEP
		if ss > bridge_s0 - 3.0 and ss < bridge_s1 + 3.0:
			continue
		var p := route.pos[i]
		var k := Vector2i(floor(p.x / HASH), floor(p.z / HASH))
		if not _hash.has(k):
			_hash[k] = []
		_hash[k].append(i)
	_build_road()
	_build_terrain()
	_build_bridge()
	_build_river()
	_build_scenery()
	_build_landmarks()

func is_mud(s: float) -> bool:
	return s > mud_s0 and s < mud_s1

func hole_depth(s: float, x: float) -> float:
	var d := 0.0
	for h in potholes:
		var ds: float = (s - h["s"]) / h["ra"]
		if absf(ds) > 1.0:
			continue
		var dx: float = (x - h["x"]) / h["rb"]
		var q := 1.0 - (ds * ds + dx * dx)
		if q > 0.0:
			d = maxf(d, pow(q, 0.7) * h["depth"])
	return d

func _road_info(p: Vector3) -> Vector2:
	var k := Vector2i(floor(p.x / HASH), floor(p.z / HASH))
	var bd := 1e20
	var by := 0.0
	for dx in range(-2, 3):
		for dz in range(-2, 3):
			var kk := Vector2i(k.x + dx, k.y + dz)
			if _hash.has(kk):
				for i in _hash[kk]:
					var q: Vector3 = route.pos[i]
					var d := Vector2(q.x - p.x, q.z - p.z).length_squared()
					if d < bd:
						bd = d
						by = q.y
	return Vector2(sqrt(bd), by)

func natural_height(x: float, z: float) -> float:
	var h := 18.0 + noise.get_noise_2d(x, z) * 26.0
	h += smoothstep(-380.0, -560.0, z) * 30.0
	h += absf(noise.get_noise_2d(x * 0.5 + 300.0, z * 0.5)) * 30.0 * smoothstep(60.0, 200.0, absf(x - 20.0))
	# Cañón del río
	var rel := Vector3(x, 0, z) - Vector3(valley_p.x, 0, valley_p.z)
	var across := rel.dot(Vector3(-valley_dir.z, 0, valley_dir.x))
	var gorge := smoothstep(70.0, 22.0, absf(across))
	h = lerpf(h, 3.0, gorge)
	return h

func height_at(x: float, z: float) -> float:
	var ri := _road_info(Vector3(x, 0, z))
	var nat := natural_height(x, z)
	var k := smoothstep(5.5, 30.0, ri.x)
	return lerpf(ri.y - 0.45, nat, k)

# ------------------------------------------------------------------ CAMINO
func _build_road() -> void:
	var mat := MatLib.shader_mat("res://shaders/dirt_road.gdshader", {"dirt_tex": MatLib.tex("dirt_albedo"), "dirt_nrm": MatLib.tex("dirt_normal"), "mud_tex": MatLib.tex("mud_albedo"), "mud_nrm": MatLib.tex("mud_normal")})
	var xs := PackedFloat32Array()
	var x := -ROAD_HALF - 1.2
	while x <= ROAD_HALF + 1.2 + 0.001:
		xs.append(x)
		x += 0.5
	var seg_start := 0.0
	while seg_start < route.length - 0.5:
		var seg_end := minf(seg_start + 60.0, route.length)
		var s_list := PackedFloat32Array()
		var s := seg_start
		while s < seg_end:
			s_list.append(s)
			var fine := is_mud(s) or hole_depth(s, 0.0) > 0.0 or hole_depth(s + 1.5, 0.0) > 0.0
			for h in potholes:
				if absf(s - h["s"]) < 3.0:
					fine = true
			s += 0.75 if fine else 2.0
		s_list.append(seg_end)
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		var faces := PackedVector3Array()
		var on_bridge := func(sv: float) -> bool: return sv > bridge_s0 + 1.0 and sv < bridge_s1 - 1.0
		for i in s_list.size() - 1:
			var sa := s_list[i]
			var sb := s_list[i + 1]
			if on_bridge.call(sa) and on_bridge.call(sb):
				continue
			var fa := route.frame(sa)
			var fb := route.frame(sb)
			for j in xs.size() - 1:
				var verts := []
				for c in [[sa, fa, xs[j]], [sa, fa, xs[j + 1]], [sb, fb, xs[j + 1]], [sb, fb, xs[j]]]:
					var cs: float = c[0]
					var cf: Transform3D = c[1]
					var cx: float = c[2]
					var hd := hole_depth(cs, cx)
					var edge_drop := smoothstep(ROAD_HALF, ROAD_HALF + 1.2, absf(cx)) * 0.35
					var p := cf.origin + cf.basis.x * cx + Vector3(0, -hd - edge_drop, 0)
					var mud := 1.0 if is_mud(cs) else (0.35 if hd > 0.0 else 0.0)
					verts.append([p, Vector2(cx, cs), Color(mud, clampf(hd * 2.5, 0.0, 1.0), 0, 1)])
				for k in [0, 2, 1, 0, 3, 2]:
					st.set_color(verts[k][2])
					st.set_uv(verts[k][1])
					st.add_vertex(verts[k][0])
					faces.append(verts[k][0])
		st.generate_normals()
		st.generate_tangents()
		st.set_material(mat)
		var mesh := st.commit()
		if faces.size() >= 3:
			var mi := MeshInstance3D.new()
			mi.mesh = mesh
			add_child(mi)
			var body := StaticBody3D.new()
			var cs2 := CollisionShape3D.new()
			var shape := ConcavePolygonShape3D.new()
			shape.set_faces(faces)
			cs2.shape = shape
			body.add_child(cs2)
			body.set_meta("surface", "road")
			add_child(body)
		seg_start = seg_end

# ------------------------------------------------------------------ TERRENO
func _build_terrain() -> void:
	var minp := Vector3(1e9, 0, 1e9)
	var maxp := Vector3(-1e9, 0, -1e9)
	for p in route.pos:
		minp = Vector3(minf(minp.x, p.x), 0, minf(minp.z, p.z))
		maxp = Vector3(maxf(maxp.x, p.x), 0, maxf(maxp.z, p.z))
	minp -= Vector3(260, 0, 220)
	maxp += Vector3(260, 0, 220)
	var cell := 4.0
	var nx := int((maxp.x - minp.x) / cell)
	var nz := int((maxp.z - minp.z) / cell)
	var hts := []
	var dist := []
	for j in nz + 1:
		var row := PackedFloat32Array()
		var drow := PackedFloat32Array()
		for i in nx + 1:
			var x := minp.x + i * cell
			var z := minp.z + j * cell
			var ri := _road_info(Vector3(x, 0, z))
			var nat := natural_height(x, z)
			row.append(lerpf(ri.y - 0.45, nat, smoothstep(5.5, 30.0, ri.x)))
			drow.append(ri.x)
		hts.append(row)
		dist.append(drow)
	var mat := MatLib.terrain(Color(0.92, 1.0, 0.85), 0.45)
	var chunk := 24
	for cj in range(0, nz, chunk):
		for ci in range(0, nx, chunk):
			var st := SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			var faces := PackedVector3Array()
			var near := false
			for j in range(cj, mini(cj + chunk, nz)):
				for i in range(ci, mini(ci + chunk, nx)):
					var a := Vector3(minp.x + i * cell, hts[j][i], minp.z + j * cell)
					var b := Vector3(minp.x + (i + 1) * cell, hts[j][i + 1], minp.z + j * cell)
					var c := Vector3(minp.x + (i + 1) * cell, hts[j + 1][i + 1], minp.z + (j + 1) * cell)
					var d := Vector3(minp.x + i * cell, hts[j + 1][i], minp.z + (j + 1) * cell)
					if dist[j][i] < 70.0:
						near = true
					for v in [a, b, c, a, c, d]:
						st.set_uv(Vector2(v.x, v.z))
						st.add_vertex(v)
						faces.append(v)
			st.index()
			st.generate_normals()
			st.generate_tangents()
			st.set_material(mat)
			var mi := MeshInstance3D.new()
			mi.mesh = st.commit()
			add_child(mi)
			if near:
				var body := StaticBody3D.new()
				var cs := CollisionShape3D.new()
				var shape := ConcavePolygonShape3D.new()
				shape.set_faces(faces)
				shape.backface_collision = true
				cs.shape = shape
				body.add_child(cs)
				body.set_meta("surface", "terrain")
				add_child(body)
	var mtn := MeshInstance3D.new()
	mtn.mesh = Props.mountain_ring(2200.0, 3, 520.0, true)
	mtn.position = Vector3(0, 0, -550)
	mtn.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mtn)

# ------------------------------------------------------------------ PUENTE
func _build_bridge() -> void:
	var plank_mm := []
	var body := StaticBody3D.new()
	body.set_meta("surface", "bridge")
	add_child(body)
	var len := bridge_s1 - bridge_s0
	var mid := (bridge_s0 + bridge_s1) * 0.5
	var y0 := route.frame(bridge_s0).origin.y
	var y1 := route.frame(bridge_s1).origin.y
	var holes := [bridge_s0 + len * 0.33, bridge_s0 + len * 0.68]
	var s := bridge_s0
	var plank_mesh := BoxMesh.new()
	plank_mesh.size = Vector3(4.9, 0.12, 0.34)
	plank_mesh.material = MatLib.pbr("planks", 0.5)
	while s < bridge_s1:
		var t := (s - bridge_s0) / len
		var sag := sin(t * PI) * 0.35
		var f := route.frame(s)
		var y := lerpf(y0, y1, t) - sag
		var p := Vector3(f.origin.x, y - 0.06, f.origin.z)
		var broken := false
		for hs in holes:
			if absf(s - hs) < 0.5:
				broken = true
		var tilt := sin(s * 3.1) * 0.03
		if not broken:
			plank_mm.append(Transform3D(f.basis * Basis(Vector3(0, 0, 1), tilt), p))
		s += 0.38
	# Colisión de la cubierta por tramos (con huecos donde faltan tablones a un lado)
	s = bridge_s0
	while s < bridge_s1:
		var e := minf(s + 2.0, bridge_s1)
		var t0 := (s - bridge_s0) / len
		var t1 := (e - bridge_s0) / len
		var fa := route.frame(s)
		var fb := route.frame(e)
		var ya := lerpf(y0, y1, t0) - sin(t0 * PI) * 0.35
		var yb := lerpf(y0, y1, t1) - sin(t1 * PI) * 0.35
		var pa := Vector3(fa.origin.x, ya, fa.origin.z)
		var pb := Vector3(fb.origin.x, yb, fb.origin.z)
		var hole_here := false
		for hs in holes:
			if hs > s and hs < e:
				hole_here = true
		var cs := CollisionShape3D.new()
		var bx := BoxShape3D.new()
		bx.size = Vector3(4.9 if not hole_here else 2.4, 0.3, pa.distance_to(pb) + 0.02)
		cs.shape = bx
		var dir := (pb - pa).normalized()
		var basis := Basis.looking_at(dir, Vector3.UP)
		var off := Vector3.ZERO if not hole_here else fa.basis.x * 1.25
		cs.transform = Transform3D(basis, (pa + pb) * 0.5 - Vector3(0, 0.15, 0) + off)
		body.add_child(cs)
		# Bordillos bajos
		for side in [-1.0, 1.0]:
			var cb := CollisionShape3D.new()
			var bb := BoxShape3D.new()
			bb.size = Vector3(0.2, 0.3, pa.distance_to(pb))
			cb.shape = bb
			cb.transform = Transform3D(basis, (pa + pb) * 0.5 + fa.basis.x * 2.45 * side + Vector3(0, 0.15, 0))
			body.add_child(cb)
		s = e
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = plank_mesh
	mm.instance_count = plank_mm.size()
	for i in plank_mm.size():
		mm.set_instance_transform(i, plank_mm[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	add_child(mmi)
	# Vigas, torres, cables y tirantes
	var mesh := ArrayMesh.new()
	var wood := MeshKit.begin()
	var rope := MeshKit.begin()
	for side in [-1.0, 1.0]:
		var prev := Vector3.ZERO
		var prev_c := Vector3.ZERO
		var k := 0
		s = bridge_s0
		while s <= bridge_s1 + 0.01:
			var t := (s - bridge_s0) / len
			var f := route.frame(s)
			var y := lerpf(y0, y1, t) - sin(t * PI) * 0.35
			var base: Vector3 = Vector3(f.origin.x, y, f.origin.z) + f.basis.x * 2.45 * side
			var cable: Vector3 = base + Vector3(0, 1.15 + (1.0 - sin(t * PI)) * 7.0, 0)
			MeshKit.box(wood, Vector3.ZERO, Vector3(0.14, 1.2, 0.14), 1.0, Transform3D(f.basis, base + Vector3(0, 0.55, 0)))
			if k > 0:
				_beam(rope, prev + Vector3(0, 1.05, 0), base + Vector3(0, 1.05, 0), 0.05)
				_beam(rope, prev_c, cable, 0.07)
				_beam(wood, prev - Vector3(0, 0.25, 0), base - Vector3(0, 0.25, 0), 0.16)
			_beam(rope, base + Vector3(0, 1.05, 0), cable, 0.025)
			prev = base
			prev_c = cable
			k += 1
			s += 3.0
	for es in [bridge_s0, bridge_s1]:
		var f := route.frame(es)
		var y := f.origin.y
		for side in [-1.0, 1.0]:
			var b: Vector3 = f.origin + f.basis.x * 2.9 * side
			b.y = y - 3.0
			MeshKit.box(wood, Vector3.ZERO, Vector3(0.6, 12.5, 0.6), 1.0, Transform3D(f.basis, b + Vector3(0, 6.2, 0)))
		MeshKit.box(wood, Vector3.ZERO, Vector3(6.4, 0.5, 0.5), 1.0, Transform3D(f.basis, Vector3(f.origin.x, y + 8.6, f.origin.z)))
	MeshKit.commit(wood, mesh, MatLib.pbr("bark", 0.6, Color(0.75, 0.6, 0.45)))
	MeshKit.commit(rope, mesh, MatLib.color(Color(0.55, 0.45, 0.3), 0.9), false)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	var sign_s := bridge_s0 - 14.0
	_sign(sign_s, 5.2, "PUENTE ANTIGUO\nMÁX 8 t · DESPACIO", Color(1.0, 0.8, 0.1))

func _beam(st: SurfaceTool, a: Vector3, b: Vector3, r: float) -> void:
	var d := b - a
	var l := d.length()
	if l < 0.01:
		return
	var y := d / l
	var x := y.cross(Vector3.FORWARD if absf(y.dot(Vector3.FORWARD)) < 0.9 else Vector3.RIGHT).normalized()
	var z := x.cross(y)
	MeshKit.cylinder(st, Vector3.ZERO, r, r, l, 6, false, Transform3D(Basis(x, y, z), a))

func _build_river() -> void:
	var w := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(70, 900)
	pm.subdivide_depth = 60
	w.mesh = pm
	var ang := atan2(valley_dir.x, valley_dir.z)
	w.global_transform = Transform3D(Basis(Vector3.UP, ang), Vector3(valley_p.x, 6.0, valley_p.z))
	w.material_override = MatLib.shader_mat("res://shaders/water.gdshader", {"nrm": MatLib.tex("water_normal"), "speed": 0.12, "wave_height": 0.12, "shallow": Color(0.12, 0.35, 0.3), "deep": Color(0.03, 0.14, 0.16)})
	add_child(w)

# ------------------------------------------------------------------ ESCENOGRAFÍA
func _ground(x: float, z: float) -> Vector3:
	return Vector3(x, height_at(x, z), z)

func _mm(mesh: Mesh, xforms: Array, shadows := true) -> void:
	if xforms.is_empty():
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i])
	var mi := MultiMeshInstance3D.new()
	mi.multimesh = mm
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)

func _build_scenery() -> void:
	var pines := []
	var leafs := []
	var bushes := []
	var tufts := []
	var rocks := []
	var stakes := []
	var s := 0.0
	while s < route.length:
		var f := route.frame(s)
		if s < bridge_s0 - 4.0 or s > bridge_s1 + 4.0:
			for side in [-1.0, 1.0]:
				for k in 2:
					var d := rng.randf_range(9.5, 28.0)
					var p: Vector3 = f.origin + f.basis.x * d * side
					var ri := _road_info(p)
					if ri.x < 9.0:
						continue
					var g := _ground(p.x, p.z)
					if g.y < 7.0:
						continue
					var sc := rng.randf_range(0.8, 1.5)
					var xf := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc, sc)), g - Vector3(0, 0.2, 0))
					if rng.randf() < 0.7:
						pines.append(xf)
					else:
						leafs.append(xf)
				var pt: Vector3 = f.origin + f.basis.x * rng.randf_range(4.6, 9.0) * side
				if _road_info(pt).x > 4.4:
					var gt := _ground(pt.x, pt.z)
					var sct := rng.randf_range(0.7, 1.4)
					tufts.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sct, sct, sct)), gt))
					if rng.randf() < 0.4:
						bushes.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sct, sct, sct)), gt))
			# Estacas de borde con reflectante cada 12 m
			if int(s) % 12 == 0:
				for side2 in [-1.0, 1.0]:
					var sp: Vector3 = f.origin + f.basis.x * (ROAD_HALF + 0.9) * side2
					stakes.append(Transform3D(f.basis, Vector3(sp.x, f.origin.y - 0.3, sp.z)))
		s += 6.0
	for i in 2200:
		var x := rng.randf_range(-250.0, 300.0)
		var z := rng.randf_range(-1300.0, 200.0)
		var ri2 := _road_info(Vector3(x, 0, z))
		if ri2.x < 24.0:
			continue
		var h := height_at(x, z)
		if h < 7.5:
			if rng.randf() < 0.25:
				var scr := rng.randf_range(1.2, 4.5)
				rocks.append(Transform3D(Basis(Vector3(rng.randf(), 1, rng.randf()).normalized(), rng.randf() * TAU).scaled(Vector3(scr * 1.3, scr, scr)), Vector3(x, h - 0.4, z)))
			continue
		var sc4 := rng.randf_range(0.9, 1.7)
		var xf4 := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc4, sc4, sc4)), Vector3(x, h - 0.3, z))
		if rng.randf() < 0.75:
			pines.append(xf4)
		else:
			leafs.append(xf4)
	for i in 160:
		var x2 := rng.randf_range(-200.0, 260.0)
		var z2 := rng.randf_range(-1250.0, 150.0)
		if _road_info(Vector3(x2, 0, z2)).x < 9.0:
			continue
		var scr2 := rng.randf_range(0.6, 2.6)
		rocks.append(Transform3D(Basis(Vector3(rng.randf(), 1, rng.randf()).normalized(), rng.randf() * TAU).scaled(Vector3(scr2 * 1.3, scr2, scr2)), _ground(x2, z2) - Vector3(0, 0.3, 0)))
	_mm(Props.pine(), pines)
	_mm(Props.broadleaf(), leafs)
	_mm(Props.bush(), bushes, false)
	_mm(Props.grass_tuft(), tufts, false)
	_mm(Props.rock(2), rocks)
	var stake := ArrayMesh.new()
	var ss := MeshKit.begin()
	MeshKit.box(ss, Vector3(0, 0.6, 0), Vector3(0.12, 1.2, 0.12))
	MeshKit.commit(ss, stake, MatLib.color(Color(0.95, 0.95, 0.95), 0.6))
	var rs := MeshKit.begin()
	MeshKit.box(rs, Vector3(0, 1.05, 0), Vector3(0.13, 0.12, 0.13))
	MeshKit.commit(rs, stake, MatLib.color(Color(1.0, 0.4, 0.0), 0.3, 0.0, Color(1.0, 0.35, 0.0), 1.5))
	_mm(stake, stakes, false)
	_sign(mud_s0 - 18.0, 5.0, "¡PELIGRO!\nBARRO Y BACHES", Color(1.0, 0.75, 0.1))
	_sign(mud_s1 + 40.0, -5.0, "CURVAS CERRADAS\nPENDIENTE 14%", Color(1.0, 0.75, 0.1))
	_sign(bridge_s1 + 60.0, 5.0, "ZONA DE FAUNA\nANIMALES SUELTOS", Color(0.6, 1.0, 0.3))

func _sign(s: float, x: float, text: String, col: Color) -> void:
	var f := route.frame(s)
	var p := f.origin + f.basis.x * x
	var g := _ground(p.x, p.z)
	var n := Node3D.new()
	add_child(n)
	n.global_transform = Transform3D(f.basis, g)
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	MeshKit.box(st, Vector3(-1.1, 1.2, 0), Vector3(0.12, 2.4, 0.12))
	MeshKit.box(st, Vector3(1.1, 1.2, 0), Vector3(0.12, 2.4, 0.12))
	MeshKit.commit(st, mesh, MatLib.pbr("bark", 1.0))
	var bs := MeshKit.begin()
	MeshKit.box(bs, Vector3(0, 2.6, 0), Vector3(2.8, 1.3, 0.08))
	MeshKit.commit(bs, mesh, MatLib.pbr("planks", 0.4, Color(0.9, 0.8, 0.6)))
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	n.add_child(mi)
	var l := Label3D.new()
	l.text = text
	l.font = UIKit.font("Rajdhani-Bold")
	l.font_size = 80
	l.pixel_size = 0.006
	l.modulate = col
	l.outline_size = 18
	l.outline_modulate = Color(0.1, 0.06, 0.02)
	l.position = Vector3(0, 2.6, 0.06)
	n.add_child(l)

func _build_landmarks() -> void:
	# Campamento maderero (salida) y aserradero (meta)
	for spec in [[18.0, -14.0, "CAMPAMENTO"], [route.length - 30.0, 14.0, "ASERRADERO"]]:
		var f := route.frame(spec[0])
		var p: Vector3 = f.origin + f.basis.x * spec[1]
		var g := _ground(p.x, p.z)
		var cab := Node3D.new()
		add_child(cab)
		cab.global_transform = Transform3D(f.basis, g)
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.box(st, Vector3(0, 2.0, 0), Vector3(8.0, 4.0, 12.0), 0.5)
		MeshKit.commit(st, mesh, MatLib.pbr("planks", 0.35, Color(0.85, 0.65, 0.45)))
		var rs := MeshKit.begin()
		MeshKit.quad(rs, Vector3(-4.6, 4.0, 6.5), Vector3(0, 6.2, 6.5), Vector3(0, 6.2, -6.5), Vector3(-4.6, 4.0, -6.5))
		MeshKit.quad(rs, Vector3(0, 6.2, 6.5), Vector3(4.6, 4.0, 6.5), Vector3(4.6, 4.0, -6.5), Vector3(0, 6.2, -6.5))
		MeshKit.commit(rs, mesh, MatLib.color(Color(0.45, 0.12, 0.08), 0.7))
		var ls := MeshKit.begin()
		for k in 9:
			MeshKit.cylinder(ls, Vector3.ZERO, 0.35, 0.35, 7.0, 10, true, Transform3D(Basis(Vector3(1, 0, 0), PI * 0.5), Vector3(-8.0 + (k % 3) * 0.72, 0.35 + (k / 3) * 0.66, -3.5)))
		MeshKit.commit(ls, mesh, MatLib.pbr("bark", 1.0))
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		cab.add_child(mi)
		var l := Label3D.new()
		l.text = spec[2]
		l.font = UIKit.font("Orbitron-Black")
		l.font_size = 120
		l.pixel_size = 0.01
		l.position = Vector3(-4.1, 3.0, 0)
		l.rotation_degrees.y = -90.0 if spec[1] < 0 else 90.0
		l.outline_size = 20
		cab.add_child(l)
	# Arco de meta
	var fe := route.frame(route.length - 12.0)
	var arch := MeshInstance3D.new()
	arch.mesh = Props.gantry(10.0)
	arch.global_transform = Transform3D(fe.basis, fe.origin - Vector3(0, 0.3, 0))
	add_child(arch)
	var ml := Label3D.new()
	ml.text = "META · ENTREGA"
	ml.font = UIKit.font("Orbitron-Black")
	ml.font_size = 100
	ml.pixel_size = 0.01
	ml.position = Vector3(0, 7.4, 0.4)
	ml.outline_size = 16
	arch.add_child(ml)
