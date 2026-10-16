class_name Props
## Mallas de escenografía procedurales y cacheadas: árboles, faroles, conos, barreras, rocas, señales.

static var _c := {}

static func _cached(key: String, fn: Callable) -> Mesh:
	if not _c.has(key):
		_c[key] = fn.call()
	return _c[key]

static func metal() -> StandardMaterial3D:
	return MatLib.color(Color(0.62, 0.64, 0.66), 0.38, 0.85)

## ---------- ÁRBOLES ----------
static func pine() -> Mesh:
	return _cached("pine", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.cylinder(st, Vector3.ZERO, 0.28, 0.06, 10.5, 8, false, Transform3D.IDENTITY, 3.0)
		MeshKit.commit(st, mesh, MatLib.pbr("bark", 1.0))
		var fs := MeshKit.begin()
		var layers := 8
		for l in layers:
			var t := float(l) / (layers - 1)
			var y := lerpf(2.2, 10.2, t)
			var rad := lerpf(3.4, 0.7, t)
			var n := 9 - int(t * 3)
			for i in n:
				var a := TAU * (i + l * 0.37) / n
				var dir := Vector3(cos(a), 0, sin(a))
				var side := dir.cross(Vector3.UP) * 0.8 * (1.0 - t * 0.4)
				var base := Vector3(0, y + 0.4, 0)
				var tip := dir * rad + Vector3(0, y - rad * 0.45, 0)
				# Tarjeta de ramas: atlas celda 0 (u 0..0.5), v a lo largo
				MeshKit.quad(fs, base - side * 0.3, base + side * 0.3, tip + side, tip - side, Vector2(0.0, 0.0), Vector2(0.5, 0.0), Vector2(0.5, 1.0), Vector2(0.0, 1.0))
		MeshKit.commit(fs, mesh, MatLib.foliage("foliage_atlas", Color(0.75, 0.95, 0.75)), false)
		return mesh)

static func broadleaf() -> Mesh:
	return _cached("broadleaf", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.cylinder(st, Vector3.ZERO, 0.3, 0.16, 4.2, 8, false, Transform3D.IDENTITY, 2.0)
		for a in [0.0, 2.1, 4.2]:
			var b := Basis(Vector3(cos(a), 0, sin(a)), 0.6)
			MeshKit.cylinder(st, Vector3.ZERO, 0.14, 0.05, 2.6, 6, false, Transform3D(b, Vector3(0, 3.4, 0)), 1.0)
		MeshKit.commit(st, mesh, MatLib.pbr("bark", 1.0))
		var fs := MeshKit.begin()
		var rng := RandomNumberGenerator.new()
		rng.seed = 77
		for i in 11:
			var c := Vector3(rng.randf_range(-1.8, 1.8), rng.randf_range(4.6, 7.4), rng.randf_range(-1.8, 1.8))
			var size := rng.randf_range(2.2, 3.2)
			for k in 3:
				var a := PI * k / 3.0 + rng.randf() * 0.5
				var d := Vector3(cos(a), 0, sin(a)) * size
				var up := Vector3(0, size, 0)
				MeshKit.quad(fs, c - d - up * 0.5, c + d - up * 0.5, c + d + up * 0.5, c - d + up * 0.5, Vector2(0.5, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0.5, 0))
			MeshKit.quad(fs, c + Vector3(-size, 0.2, -size), c + Vector3(size, 0.2, -size), c + Vector3(size, 0.2, size), c + Vector3(-size, 0.2, size), Vector2(0.5, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0.5, 1))
		MeshKit.commit(fs, mesh, MatLib.foliage("foliage_atlas", Color(0.85, 1.0, 0.8)), false)
		return mesh)

static func palm() -> Mesh:
	return _cached("palm", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		var segs := 8
		var top := Vector3.ZERO
		for i in segs:
			var t0 := float(i) / segs
			var p0 := Vector3(sin(t0 * 1.2) * 1.4, t0 * 11.0, 0)
			var t1 := float(i + 1) / segs
			var p1 := Vector3(sin(t1 * 1.2) * 1.4, t1 * 11.0, 0)
			var dir := (p1 - p0)
			var b := Basis(Vector3.UP.cross(dir.normalized()).normalized() if Vector3.UP.cross(dir.normalized()).length() > 0.01 else Vector3.RIGHT, Vector3.UP.angle_to(dir.normalized()))
			MeshKit.cylinder(st, Vector3.ZERO, lerpf(0.3, 0.18, t0), lerpf(0.3, 0.18, t1), dir.length(), 8, false, Transform3D(b, p0), 1.5)
			top = p1
		MeshKit.commit(st, mesh, MatLib.pbr("bark", 1.0, Color(0.85, 0.75, 0.6)))
		var fs := MeshKit.begin()
		for i in 10:
			var a := TAU * i / 10.0
			var d := Vector3(cos(a), 0, sin(a))
			var side := d.cross(Vector3.UP).normalized() * 0.9
			var mid := top + d * 2.6 + Vector3(0, 0.7, 0)
			var tip := top + d * 5.0 + Vector3(0, -1.6, 0)
			MeshKit.quad(fs, top - side, top + side, mid + side * 1.3, mid - side * 1.3, Vector2(0, 0), Vector2(0, 1), Vector2(0.5, 1), Vector2(0.5, 0))
			MeshKit.quad(fs, mid - side * 1.3, mid + side * 1.3, tip + side * 0.4, tip - side * 0.4, Vector2(0.5, 0), Vector2(0.5, 1), Vector2(1, 1), Vector2(1, 0))
		MeshKit.commit(fs, mesh, MatLib.foliage("palm_leaf"), false)
		return mesh)

static func bush() -> Mesh:
	return _cached("bush", func():
		var mesh := ArrayMesh.new()
		var fs := MeshKit.begin()
		for k in 3:
			var a := PI * k / 3.0
			var d := Vector3(cos(a), 0, sin(a)) * 1.3
			MeshKit.quad(fs, -d, d, d + Vector3(0, 1.8, 0), -d + Vector3(0, 1.8, 0), Vector2(0.5, 1), Vector2(1, 1), Vector2(1, 0.15), Vector2(0.5, 0.15))
		MeshKit.commit(fs, mesh, MatLib.foliage("foliage_atlas", Color(0.8, 0.95, 0.7)), false)
		return mesh)

static func grass_tuft() -> Mesh:
	return _cached("tuft", func():
		var mesh := ArrayMesh.new()
		var fs := MeshKit.begin()
		for k in 2:
			var a := PI * k / 2.0 + 0.4
			var d := Vector3(cos(a), 0, sin(a)) * 0.7
			MeshKit.quad(fs, -d, d, d + Vector3(0, 0.9, 0), -d + Vector3(0, 0.9, 0), Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 0))
		MeshKit.commit(fs, mesh, MatLib.foliage("grass_tuft", Color(0.85, 0.95, 0.7)), false)
		return mesh)

static func rock(variant := 0) -> Mesh:
	return _cached("rock%d" % variant, func():
		var mesh := ArrayMesh.new()
		var sm := SphereMesh.new()
		sm.radius = 1.0
		sm.height = 2.0
		sm.radial_segments = 14
		sm.rings = 8
		var arr := sm.get_mesh_arrays()
		var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
		var noise := FastNoiseLite.new()
		noise.seed = 11 + variant * 7
		noise.frequency = 0.9
		for i in verts.size():
			var v := verts[i]
			var k := 1.0 + noise.get_noise_3dv(v * 1.3) * 0.45
			v *= k
			v.y *= 0.62
			if v.y < -0.2:
				v.y = -0.2
			verts[i] = v
		arr[Mesh.ARRAY_VERTEX] = verts
		var st := SurfaceTool.new()
		st.create_from_arrays(arr)
		st.generate_normals()
		st.generate_tangents()
		st.set_material(MatLib.pbr("rock", 0.35, Color.WHITE, 1.0, 0.0, 1.0, true))
		st.commit(mesh)
		return mesh)

## ---------- VIALES ----------
static func streetlight() -> Mesh:
	return _cached("streetlight", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.cylinder(st, Vector3.ZERO, 0.17, 0.11, 10.0, 10, true)
		for sx in [-1, 1]:
			var b := Basis(Vector3(0, 0, 1), -sx * 1.32)
			MeshKit.cylinder(st, Vector3.ZERO, 0.08, 0.07, 2.9, 8, false, Transform3D(b, Vector3(0, 9.6, 0)))
			MeshKit.box(st, Vector3(sx * 2.85, 10.0, 0), Vector3(0.9, 0.18, 0.42))
		MeshKit.box(st, Vector3(0, 0.25, 0), Vector3(0.5, 0.5, 0.5))
		MeshKit.commit(st, mesh, metal())
		var ls := MeshKit.begin()
		for sx in [-1, 1]:
			MeshKit.box(ls, Vector3(sx * 2.85, 9.9, 0), Vector3(0.75, 0.04, 0.32))
		MeshKit.commit(ls, mesh, MatLib.emissive(Color(1.0, 0.82, 0.55), 5.0), false)
		return mesh)

static func light_pool() -> Mesh:
	## Charco de luz falso sobre el asfalto (aditivo) para farolas de noche.
	return _cached("light_pool", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.quad(st, Vector3(-5.0, 0.06, 9.0), Vector3(5.0, 0.06, 9.0), Vector3(5.0, 0.06, -9.0), Vector3(-5.0, 0.06, -9.0), Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 0))
		MeshKit.commit(st, mesh, MatLib.additive("glow", Color(1.0, 0.68, 0.38, 1.0), 0.75), false)
		return mesh)

static func cone() -> Mesh:
	return _cached("cone", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.cylinder(st, Vector3(0, 0.05, 0), 0.2, 0.04, 0.72, 12, true)
		MeshKit.commit(st, mesh, MatLib.color(Color(1.0, 0.32, 0.02), 0.5))
		var w := MeshKit.begin()
		MeshKit.cylinder(w, Vector3(0, 0.36, 0), 0.128, 0.098, 0.14, 12, false)
		MeshKit.commit(w, mesh, MatLib.color(Color(0.95, 0.95, 0.95), 0.3, 0.0, Color(0.6, 0.6, 0.6), 0.6))
		var b := MeshKit.begin()
		MeshKit.box(b, Vector3(0, 0.025, 0), Vector3(0.48, 0.05, 0.48))
		MeshKit.commit(b, mesh, MatLib.color(Color(0.05, 0.05, 0.05), 0.8))
		return mesh)

static func work_barrier() -> Mesh:
	## Barrera plástica de obra (naranja/blanca).
	return _cached("work_barrier", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.box(st, Vector3(0, 0.45, 0), Vector3(0.55, 0.9, 1.9))
		MeshKit.commit(st, mesh, MatLib.color(Color(1.0, 0.36, 0.03), 0.55))
		var w := MeshKit.begin()
		MeshKit.box(w, Vector3(0, 0.62, 0), Vector3(0.57, 0.16, 1.92))
		MeshKit.commit(w, mesh, MatLib.color(Color(0.95, 0.95, 0.95), 0.4, 0.0, Color(0.5, 0.5, 0.5), 0.5))
		return mesh)

static func arrow_board() -> Mesh:
	return _cached("arrow_board", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.box(st, Vector3(0, 0.75, 0.6), Vector3(2.0, 0.9, 3.0))
		MeshKit.box(st, Vector3(0, 2.0, 0), Vector3(0.15, 2.0, 0.15))
		MeshKit.commit(st, mesh, MatLib.color(Color(1.0, 0.75, 0.05), 0.5))
		var p := MeshKit.begin()
		MeshKit.box(p, Vector3(0, 3.0, -0.08), Vector3(2.4, 1.3, 0.1))
		MeshKit.cylinder(p, Vector3(-0.8, 0.0, 1.5), 0.35, 0.35, 0.2, 10, true, Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3(-0.9, 0.35, 1.4)))
		MeshKit.cylinder(p, Vector3(0.8, 0.0, 1.5), 0.35, 0.35, 0.2, 10, true, Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3(1.1, 0.35, 1.4)))
		MeshKit.commit(p, mesh, MatLib.color(Color(0.04, 0.04, 0.04), 0.6))
		var a := MeshKit.begin()
		# Flecha luminosa (apunta a la izquierda por defecto)
		var pts := [Vector3(0.9, 3.08, -0.14), Vector3(-0.2, 3.08, -0.14), Vector3(-0.2, 2.92, -0.14), Vector3(0.9, 2.92, -0.14)]
		MeshKit.quad(a, pts[0], pts[1], pts[2], pts[3])
		MeshKit.quad(a, Vector3(-0.2, 3.45, -0.14), Vector3(-0.85, 3.0, -0.14), Vector3(-0.2, 2.55, -0.14), Vector3(-0.2, 3.0, -0.14))
		MeshKit.commit(a, mesh, MatLib.emissive(Color(1.0, 0.75, 0.2), 6.0), false)
		return mesh)

static func gantry(width: float) -> Mesh:
	## Pórtico con cartel verde de autopista sobre los carriles.
	return _cached("gantry%d" % int(width), func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		for x in [-width * 0.5, width * 0.5]:
			MeshKit.box(st, Vector3(x, 3.6, 0), Vector3(0.35, 7.2, 0.35))
		MeshKit.box(st, Vector3(0, 7.0, 0), Vector3(width, 0.3, 0.3))
		MeshKit.box(st, Vector3(0, 7.6, 0), Vector3(width, 0.3, 0.3))
		MeshKit.commit(st, mesh, metal())
		var g := MeshKit.begin()
		MeshKit.box(g, Vector3(-width * 0.18, 7.4, 0.3), Vector3(width * 0.36, 2.1, 0.12))
		MeshKit.box(g, Vector3(width * 0.22, 7.4, 0.3), Vector3(width * 0.3, 2.1, 0.12))
		MeshKit.commit(g, mesh, MatLib.color(Color(0.02, 0.32, 0.16), 0.5))
		return mesh)

static func billboard_frame() -> Mesh:
	return _cached("billboard", func():
		var mesh := ArrayMesh.new()
		var st := MeshKit.begin()
		MeshKit.box(st, Vector3(0, 4.5, 0), Vector3(0.6, 9.0, 0.6))
		MeshKit.box(st, Vector3(0, 11.0, 0.35), Vector3(12.4, 4.4, 0.3))
		MeshKit.commit(st, mesh, metal())
		return mesh)

static func mountain_ring(radius: float, seed_value: int, height := 260.0, snow := true) -> Mesh:
	## Anillo de montañas lejanas (silueta con niebla); sigue a la cámara.
	return _cached("mountains%d_%d" % [seed_value, int(radius)], func():
		var mesh := ArrayMesh.new()
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		var noise := FastNoiseLite.new()
		noise.seed = seed_value
		noise.frequency = 2.2
		noise.fractal_octaves = 5
		var seg := 256
		var rows := 6
		for i in seg:
			for r in rows:
				var verts := []
				for c in [[i, r], [i + 1, r], [i + 1, r + 1], [i, r + 1]]:
					var a: float = TAU * c[0] / seg
					var t: float = float(c[1]) / rows
					var h := (0.55 + noise.get_noise_2d(cos(a), sin(a)) * 0.7) * height
					h = maxf(h, 30.0)
					var prof := sin(t * PI * 0.5)
					var rad := radius * (1.0 - t * 0.12)
					verts.append(Vector3(cos(a) * rad, h * prof - 20.0, sin(a) * rad))
				var cols := []
				for v in verts:
					var sn := clampf((v.y - height * 0.55) / (height * 0.25), 0.0, 1.0) if snow else 0.0
					cols.append(Color(0.32, 0.34, 0.33).lerp(Color(0.93, 0.95, 1.0), sn))
				for k in [0, 2, 1, 0, 3, 2]:
					st.set_color(cols[k])
					st.set_uv(Vector2(float(i) / seg * 30.0, verts[k].y * 0.02))
					st.add_vertex(verts[k])
		st.generate_normals()
		var m := StandardMaterial3D.new()
		m.vertex_color_use_as_albedo = true
		m.albedo_texture = MatLib.tex("rock_albedo")
		m.roughness = 1.0
		m.disable_receive_shadows = true
		st.set_material(m)
		st.commit(mesh)
		return mesh)
