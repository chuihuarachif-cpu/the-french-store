class_name WorldAssets
## Materiales y mallas compartidas del mundo (se crean una vez en el hilo principal).

static var _mats := {}
static var _meshes := {}
static var hq := true

static func tex(n: String) -> Texture2D:
	return MatLib.tex(n)

static func mat(key: String) -> Material:
	if _mats.has(key):
		return _mats[key]
	var m: Material
	match key:
		"terrain":
			var sm := ShaderMaterial.new()
			sm.shader = load("res://shaders/world/terrain.gdshader")
			sm.set_shader_parameter("splat_map", load("res://assets/world/splat.png"))
			sm.set_shader_parameter("tint_map", load("res://assets/world/tint.png"))
			sm.set_shader_parameter("grass_tex", tex("grass_albedo"))
			sm.set_shader_parameter("dirt_tex", tex("dirt_albedo"))
			sm.set_shader_parameter("rock_tex", tex("rock_albedo"))
			sm.set_shader_parameter("sand_tex", tex("sand_albedo"))
			sm.set_shader_parameter("urban_tex", tex("concrete_albedo"))
			sm.set_shader_parameter("hq", hq)
			m = sm
		"road_highway":
			m = _road(-14.6, 14.6, [
				{"x": 12.0, "w": 0.22, "k": "solid"}, {"x": -12.0, "w": 0.22, "k": "solid"},
				{"x": 0.75, "w": 0.15, "k": "solid"}, {"x": -0.75, "w": 0.15, "k": "solid"},
				{"x": 4.6, "w": 0.16, "k": "dash"}, {"x": 8.3, "w": 0.16, "k": "dash"}, {"x": -4.6, "w": 0.16, "k": "dash"}, {"x": -8.3, "w": 0.16, "k": "dash"},
				{"x": 13.3, "w": 2.4, "k": "shoulder"}, {"x": -13.3, "w": 2.4, "k": "shoulder"}], [2.75, 6.45, 10.15, -2.75, -6.45, -10.15], Color(1, 1, 1), 0.0)
		"road_avenue":
			m = _road(-7.4, 7.4, [
				{"x": 0.14, "w": 0.12, "k": "center"}, {"x": -0.14, "w": 0.12, "k": "center"},
				{"x": 3.7, "w": 0.14, "k": "dash"}, {"x": -3.7, "w": 0.14, "k": "dash"},
				{"x": 7.15, "w": 0.16, "k": "solid"}, {"x": -7.15, "w": 0.16, "k": "solid"}], [1.85, 5.55, -1.85, -5.55], Color(0.95, 0.95, 0.97), 0.0)
		"road_road":
			m = _road(-5.2, 5.2, [
				{"x": 0.0, "w": 0.14, "k": "dash"}, {"x": 3.5, "w": 0.15, "k": "solid"}, {"x": -3.5, "w": 0.15, "k": "solid"},
				{"x": 4.4, "w": 1.6, "k": "shoulder"}, {"x": -4.4, "w": 1.6, "k": "shoulder"}], [1.8, -1.8], Color(1.0, 1.0, 0.98), 0.0)
		"road_dirt":
			var dm := _road(-3.8, 3.8, [], [1.2, -1.2], Color(1.0, 0.9, 0.75), 1.0)
			dm.set_shader_parameter("albedo_tex", tex("dirt_albedo"))
			m = dm
		"road_rail":
			var rm := _road(-2.6, 2.6, [], [], Color(0.7, 0.68, 0.66), 1.0)
			rm.set_shader_parameter("albedo_tex", tex("rock_albedo"))
			m = rm
		"concrete":
			m = _std(Color.WHITE, 0.85, 0.0, "concrete_albedo", 0.25)
		"sidewalk":
			m = _std(Color(0.78, 0.76, 0.74), 0.9, 0.0, "concrete_albedo", 0.35)
		"skirt":
			m = _std(Color(0.42, 0.38, 0.3), 1.0, 0.0, "dirt_albedo", 0.2)
		"tunnel":
			m = _std(Color(1, 1, 1), 0.8, 0.0, "concrete_albedo", 0.3)
		"metal":
			m = _std(Color(0.7, 0.72, 0.75), 0.35, 0.8)
		"sleepers":
			m = _std(Color.WHITE, 0.9, 0.0)
		"tunnel_light", "lamp":
			var lm := ShaderMaterial.new()
			lm.shader = load("res://shaders/world/lamp.gdshader")
			lm.set_shader_parameter("always", key == "tunnel_light")
			m = lm
		"building":
			var bm := ShaderMaterial.new()
			bm.shader = load("res://shaders/world/building.gdshader")
			bm.set_shader_parameter("grime", tex("grime"))
			bm.set_shader_parameter("graffiti", tex("graffiti"))
			m = bm
		"tree", "prop":
			var tm := ShaderMaterial.new()
			tm.shader = load("res://shaders/world/tree.gdshader")
			tm.set_shader_parameter("grime", tex("grime"))
			tm.set_shader_parameter("wind", 0.06 if key == "tree" else 0.0)
			tm.set_shader_parameter("tint_mul", 1.5 if key == "tree" else 1.0)
			m = tm
		"people":
			var pm := ShaderMaterial.new()
			pm.shader = load("res://shaders/world/people.gdshader")
			m = pm
		"ambient_car":
			var am := ShaderMaterial.new()
			am.shader = load("res://shaders/world/ambient_car.gdshader")
			m = am
		"traffic_light":
			var tl := ShaderMaterial.new()
			tl.shader = load("res://shaders/world/traffic_light.gdshader")
			m = tl
		"flame":
			var fm := ShaderMaterial.new()
			fm.shader = load("res://shaders/world/flame.gdshader")
			fm.set_shader_parameter("noise_tex", tex("grime"))
			m = fm
		"water":
			var wm := ShaderMaterial.new()
			wm.shader = load("res://shaders/water.gdshader")
			wm.set_shader_parameter("nrm", tex("water_normal"))
			wm.set_shader_parameter("wave_height", 0.0)
			wm.set_shader_parameter("deep", Color(0.04, 0.16, 0.18))
			wm.set_shader_parameter("shallow", Color(0.08, 0.3, 0.3))
			m = wm
		"sea":
			var sm2 := ShaderMaterial.new()
			sm2.shader = load("res://shaders/water.gdshader")
			sm2.set_shader_parameter("nrm", tex("water_normal"))
			sm2.set_shader_parameter("wave_height", 0.15)
			sm2.set_shader_parameter("scale", 0.02)
			sm2.set_shader_parameter("deep", Color(0.02, 0.14, 0.26))
			sm2.set_shader_parameter("shallow", Color(0.05, 0.36, 0.45))
			m = sm2
		"runway":
			var rw := ShaderMaterial.new()
			rw.shader = load("res://shaders/world/runway.gdshader")
			rw.set_shader_parameter("albedo_tex", tex("asphalt_albedo"))
			m = rw
		_:
			m = _std(Color(1, 0, 1), 0.8)
	_mats[key] = m
	return m

static func _std(c: Color, rough := 0.8, metal := 0.0, texname := "", uv := 1.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	m.metallic = metal
	m.vertex_color_use_as_albedo = true
	if texname != "":
		m.albedo_texture = tex(texname)
		m.uv1_scale = Vector3(uv, uv, 1)
	return m

static func _road(x0: float, x1: float, marks: Array, lanes: Array, tint: Color, dirt: float) -> ShaderMaterial:
	var img := Image.create(512, 1, false, Image.FORMAT_RGBA8)
	for i in 512:
		var x := lerpf(x0, x1, (i + 0.5) / 512.0)
		var c := Color(0, 0, 0, 0)
		for mk in marks:
			var d := absf(x - mk["x"])
			if d < mk["w"] * 0.5:
				match mk["k"]:
					"solid":
						c.r = 1.0
					"dash":
						c.g = 1.0
					"center":
						c.r = 1.0
						c.b = 1.0
		for l in lanes:
			for o in [-0.85, 0.85]:
				var d2 := absf(x - (l + o))
				c.a = maxf(c.a, clampf(1.0 - d2 / 0.45, 0.0, 1.0) * 0.8)
		img.set_pixel(i, 0, c)
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/world/road.gdshader")
	m.set_shader_parameter("albedo_tex", tex("asphalt_albedo"))
	m.set_shader_parameter("profile_tex", ImageTexture.create_from_image(img))
	m.set_shader_parameter("x_min", x0)
	m.set_shader_parameter("x_max", x1)
	m.set_shader_parameter("tint", tint)
	m.set_shader_parameter("dirt", dirt)
	return m

# ------------------------------------------------------------------ MALLAS INSTANCIADAS
static func mesh(key: String) -> Mesh:
	if _meshes.has(key):
		return _meshes[key]
	var md := MeshData.new()
	var mt := "prop"
	match key:
		"pine":
			mt = "tree"
			md.prism(Vector3.ZERO, 0.3, 0.12, 3.0, 6, Color(0.42, 0.3, 0.2))
			var g := Color(0.13, 0.27, 0.16)
			md.prism(Vector3(0, 2.0, 0), 3.2, 0.0, 5.0, 9, g, Vector2.ZERO, false)
			md.prism(Vector3(0, 4.6, 0), 2.5, 0.0, 4.5, 9, g.lightened(0.06), Vector2.ZERO, false)
			md.prism(Vector3(0, 7.0, 0), 1.7, 0.0, 4.0, 8, g.lightened(0.12), Vector2.ZERO, false)
			_bottom_disc(md, Vector3(0, 2.0, 0), 3.2, 9, g.darkened(0.3))
		"pine_lo":
			mt = "tree"
			md.prism(Vector3.ZERO, 0.3, 0.12, 2.5, 4, Color(0.42, 0.3, 0.2))
			md.prism(Vector3(0, 2.0, 0), 3.0, 0.0, 9.0, 6, Color(0.13, 0.27, 0.16), Vector2.ZERO, false)
		"broad", "tree_street":
			mt = "tree"
			var sc := 1.0 if key == "broad" else 0.7
			md.prism(Vector3.ZERO, 0.35 * sc, 0.2 * sc, 4.0 * sc, 6, Color(0.4, 0.3, 0.22))
			var g2 := Color(0.2, 0.33, 0.13)
			_blob(md, Vector3(0, 5.6, 0) * sc, Vector3(3.2, 2.6, 3.2) * sc, g2)
			_blob(md, Vector3(1.4, 4.6, 0.8) * sc, Vector3(2.0, 1.8, 2.0) * sc, g2.lightened(0.08))
			_blob(md, Vector3(-1.3, 4.9, -0.9) * sc, Vector3(2.1, 1.8, 2.1) * sc, g2.darkened(0.05))
		"bush":
			mt = "tree"
			_blob(md, Vector3(0, 0.6, 0), Vector3(1.4, 1.0, 1.4), Color(0.18, 0.3, 0.13))
		"palm":
			mt = "tree"
			var top := Vector3.ZERO
			for i in 6:
				var t0 := i / 6.0
				var t1 := (i + 1) / 6.0
				var p0 := Vector3(sin(t0 * 1.1) * 1.2, t0 * 10.0, 0)
				var p1 := Vector3(sin(t1 * 1.1) * 1.2, t1 * 10.0, 0)
				md.prism(p0, lerpf(0.28, 0.18, t0), lerpf(0.28, 0.18, t1), p1.y - p0.y, 6, Color(0.55, 0.45, 0.32), Vector2.ZERO, false, Transform3D(Basis.IDENTITY, Vector3(p1.x - p0.x, 0, 0) * 0.0))
				top = p1
			for i in 9:
				var a := TAU * i / 9.0
				var d := Vector3(cos(a), 0, sin(a))
				var side := d.cross(Vector3.UP).normalized() * 0.7
				var mid := top + d * 2.6 + Vector3(0, 0.4, 0)
				var tip := top + d * 4.8 + Vector3(0, -1.5, 0)
				var lc := Color(0.18, 0.34, 0.14)
				md.quad(top - side * 0.3, top + side * 0.3, mid + side, mid - side, lc)
				md.quad(mid + side, top + side * 0.3, top - side * 0.3, mid - side, lc)
				md.quad(mid - side, mid + side, tip, tip, lc)
				md.quad(mid + side, mid - side, tip, tip, lc)
		"rock":
			_blob(md, Vector3(0, 0.6, 0), Vector3(2.2, 1.6, 1.8), Color(0.5, 0.48, 0.45), 5)
		"hay":
			md.prism(Vector3.ZERO, 0.8, 0.8, 1.2, 10, Color(0.85, 0.72, 0.38), Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(0, 0.8, -0.6)))
		"vine":
			md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.7, 0)), Vector3(19.0, 1.3, 0.8), Color(0.35, 0.5, 0.22), Vector2.ZERO, 5)
		"container":
			md.box(Transform3D(Basis.IDENTITY, Vector3(0, 1.3, 0)), Vector3(12.0, 2.6, 2.45), Color(0.5, 0.5, 0.5), Vector2.ZERO, 5)
			for k in 9:
				md.box(Transform3D(Basis.IDENTITY, Vector3(-5.4 + k * 1.35, 1.3, 1.24)), Vector3(0.12, 2.4, 0.05), Color(0.4, 0.4, 0.4), Vector2.ZERO, 4)
		"lamp_double", "lamp_single":
			mt = "lamp"
			var pole := Color(0.45, 0.47, 0.5, 0.0)
			md.prism(Vector3.ZERO, 0.12, 0.08, 9.0, 6, pole)
			var arms := [1.0, -1.0] if key == "lamp_double" else [-1.0]
			for sx in arms:
				md.box(Transform3D(Basis.IDENTITY, Vector3(sx * 1.2, 9.0, 0)), Vector3(2.4, 0.12, 0.12), pole)
				md.box(Transform3D(Basis.IDENTITY, Vector3(sx * 2.3, 8.9, 0)), Vector3(0.9, 0.18, 0.4), Color(0.3, 0.3, 0.32, 0.0))
				md.box(Transform3D(Basis.IDENTITY, Vector3(sx * 2.3, 8.78, 0)), Vector3(0.8, 0.06, 0.32), Color(1, 0.95, 0.8, 1.0))
		"traffic_light":
			mt = "traffic_light"
			md.prism(Vector3.ZERO, 0.09, 0.08, 4.6, 6, Color(0, 0, 0))
			md.box(Transform3D(Basis.IDENTITY, Vector3(-1.6, 4.6, 0)), Vector3(3.4, 0.12, 0.12), Color(0, 0, 0))
			for k in 2:
				var x := -0.05 if k == 0 else -3.1
				var y0 := 2.6 if k == 0 else 4.2
				md.box(Transform3D(Basis.IDENTITY, Vector3(x, y0, 0.1)), Vector3(0.36, 1.05, 0.28), Color(0, 0, 0))
				var lamps := [[Color(1, 0, 0), 0.32], [Color(0, 1, 0), 0.0], [Color(0, 0, 1), -0.32]]
				for l in lamps:
					md.box(Transform3D(Basis.IDENTITY, Vector3(x, y0 + l[1], 0.25)), Vector3(0.22, 0.22, 0.04), l[0])
		"crossbuck":
			md.prism(Vector3.ZERO, 0.07, 0.07, 3.4, 6, Color(0.9, 0.9, 0.9))
			for a in [0.6, -0.6]:
				md.box(Transform3D(Basis(Vector3.FORWARD, a), Vector3(0, 3.1, 0.06)), Vector3(1.4, 0.22, 0.03), Color(0.95, 0.95, 0.95))
				md.box(Transform3D(Basis(Vector3.FORWARD, a), Vector3(0, 3.1, 0.08)), Vector3(0.5, 0.22, 0.03), Color(0.85, 0.1, 0.1))
		"person":
			mt = "people"
			_person(md)
		"acar0", "acar1", "acar2":
			mt = "ambient_car"
			_ambient_car(md, int(key.right(1)))
		"barrel":
			md.prism(Vector3.ZERO, 0.32, 0.32, 0.95, 10, Color(0.45, 0.25, 0.15))
			md.prism(Vector3(0, 0.95, 0), 0.3, 0.3, 0.02, 10, Color(0.08, 0.05, 0.03))
		"flame":
			mt = "flame"
			md.quad(Vector3(-0.6, -0.5, 0), Vector3(0.6, -0.5, 0), Vector3(0.6, 1.4, 0), Vector3(-0.6, 1.4, 0), Color.WHITE, Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1))
		"debris":
			for k in 6:
				md.box(Transform3D(Basis(Vector3(0.3, 1, 0.2).normalized(), k * 1.3), Vector3(k * 0.4 - 1.0, 0.3, (k % 3) * 0.5 - 0.5)), Vector3(0.9, 0.5, 0.7), Color(0.25 + k * 0.03, 0.22, 0.2))
		"umbrella":
			md.prism(Vector3.ZERO, 0.04, 0.04, 2.3, 5, Color(0.9, 0.9, 0.9))
			md.prism(Vector3(0, 1.9, 0), 1.6, 0.0, 0.6, 10, Color(1, 1, 1), Vector2.ZERO, false)
			_bottom_disc(md, Vector3(0, 1.9, 0), 1.6, 10, Color(0.8, 0.8, 0.8))
		_:
			md.box(Transform3D.IDENTITY, Vector3.ONE, Color(1, 0, 1))
	var m := md.to_mesh(mat(mt))
	_meshes[key] = m
	return m

static func _bottom_disc(md: MeshData, c: Vector3, r: float, sides: int, col: Color) -> void:
	var ctr := md.vert(c, Vector3.DOWN, Vector2.ZERO, col)
	for i in sides:
		var a0 := TAU * i / sides
		var a1 := TAU * (i + 1) / sides
		var q0 := md.vert(c + Vector3(cos(a0) * r, 0, sin(a0) * r), Vector3.DOWN, Vector2.ZERO, col)
		var q1 := md.vert(c + Vector3(cos(a1) * r, 0, sin(a1) * r), Vector3.DOWN, Vector2.ZERO, col)
		md.tri(ctr, q0, q1)

## Esfera baja deformada (copa de árbol, roca).
static func _blob(md: MeshData, c: Vector3, s: Vector3, col: Color, seed := 0) -> void:
	var rings := 4
	var segs := 7
	var rng := RandomNumberGenerator.new()
	rng.seed = 1234 + seed + int(c.x * 10.0)
	var pts := []
	for j in rings + 1:
		var row := []
		var phi := PI * j / rings
		for i in segs:
			var th := TAU * i / segs
			var k := 1.0 + rng.randf_range(-0.15, 0.15) if j > 0 and j < rings else 1.0
			row.append(c + Vector3(sin(phi) * cos(th) * s.x * k, cos(phi) * s.y * k, sin(phi) * sin(th) * s.z * k))
		pts.append(row)
	for j in rings:
		for i in segs:
			var i2 := (i + 1) % segs
			var a: Vector3 = pts[j][i]
			var b: Vector3 = pts[j][i2]
			var cc: Vector3 = pts[j + 1][i2]
			var d: Vector3 = pts[j + 1][i]
			var shade := 1.0 - 0.25 * float(j) / rings
			var nn := ((a + b + cc + d) * 0.25 - c).normalized()
			var cl := Color(col.r * shade, col.g * shade, col.b * shade)
			var i0 := md.vert(a, nn, Vector2(a.x, a.z), cl)
			var i1 := md.vert(b, nn, Vector2(b.x, b.z), cl)
			var i3 := md.vert(cc, nn, Vector2(cc.x, cc.z), cl)
			var i4 := md.vert(d, nn, Vector2(d.x, d.z), cl)
			md.tri(i0, i1, i3)
			md.tri(i0, i3, i4)

## Persona low-poly (~1.75 m). COLOR.rgb = zona (r camiseta, g pantalón, b piel); COLOR.a = parte.
static func _person(md: MeshData) -> void:
	var shirt := Color(1, 0, 0, 0.0)
	var pants_l := Color(0, 1, 0, 0.25)
	var pants_r := Color(0, 1, 0, 0.5)
	var arm_l := Color(1, 0, 0, 0.75)
	var arm_r := Color(1, 0, 0, 1.0)
	var skin := Color(0, 0, 1, 0.0)
	var hair := Color(0, 0, 0, 0.0)
	md.box(Transform3D(Basis.IDENTITY, Vector3(-0.11, 0.45, 0)), Vector3(0.15, 0.9, 0.18), pants_l)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0.11, 0.45, 0)), Vector3(0.15, 0.9, 0.18), pants_r)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 1.2, 0)), Vector3(0.42, 0.62, 0.24), shirt)
	md.box(Transform3D(Basis.IDENTITY, Vector3(-0.27, 1.17, 0)), Vector3(0.11, 0.6, 0.13), arm_l)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0.27, 1.17, 0)), Vector3(0.11, 0.6, 0.13), arm_r)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 1.62, 0)), Vector3(0.21, 0.24, 0.22), skin)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 1.76, 0.01)), Vector3(0.23, 0.07, 0.24), hair)

## Auto ambiental simple. COLOR.a = 1 pintura; UV.x = 2 pilotos traseros.
static func _ambient_car(md: MeshData, v: int) -> void:
	var L = [4.5, 4.7, 5.2][v]
	var Wd = [1.8, 1.9, 2.0][v]
	var body_h = [0.75, 0.95, 1.6][v]
	var cab_h = [0.55, 0.65, 0.0][v]
	var paint := Color(1, 1, 1, 1)
	var glass := Color(0.05, 0.07, 0.09, 0.0)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3 + body_h * 0.5, 0)), Vector3(Wd, body_h, L), paint)
	if cab_h > 0.0:
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3 + body_h + cab_h * 0.5, 0.2)), Vector3(Wd * 0.86, cab_h, L * 0.5), glass)
	else:
		md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3 + body_h * 0.75, -L * 0.42)), Vector3(Wd * 0.9, body_h * 0.4, 0.05), glass)
	for z in [-L * 0.32, L * 0.32]:
		for x in [-Wd * 0.45, Wd * 0.45]:
			md.box(Transform3D(Basis.IDENTITY, Vector3(x, 0.32, z)), Vector3(0.22, 0.64, 0.64), Color(0.03, 0.03, 0.03, 0.0))
	var b := md.v.size()
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3 + body_h * 0.7, L * 0.5 + 0.02)), Vector3(Wd * 0.85, 0.12, 0.04), Color(0.6, 0.0, 0.0, 0.0))
	for i in range(b, md.v.size()):
		md.uv[i] = Vector2(0.0, -5.0)
	md.box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3 + body_h * 0.55, -L * 0.5 - 0.02)), Vector3(Wd * 0.8, 0.1, 0.04), Color(1.0, 1.0, 0.9, 0.0))
