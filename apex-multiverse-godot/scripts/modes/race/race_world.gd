class_name RaceWorld
extends Node3D
## Construye el circuito "Costa del Sol": pista, pianos, muros con patrocinadores, gradas,
## terreno con playa y mar, ciudad, vegetación, faro, barcos y globos.

const HALF_ROAD := 8.0
const WALL_X := 11.3
var track: RaceTrack
var noise := FastNoiseLite.new()
var rng := RandomNumberGenerator.new()
var sector_s := []  # s de cada punto de control
var jump_s := 0.0
var boost_s := []
var start_lights: Array[MeshInstance3D] = []
var _hash := {}
const HASH := 40.0

func build(t: RaceTrack, control_points: Array, jump_at: float) -> void:
	track = t
	jump_s = jump_at
	rng.seed = 2026
	noise.seed = 77
	noise.frequency = 0.004
	noise.fractal_octaves = 4
	for p in control_points:
		sector_s.append(track.nearest(p).x)
	for i in track.pos.size():
		var k := Vector2i(floor(track.pos[i].x / HASH), floor(track.pos[i].z / HASH))
		if not _hash.has(k):
			_hash[k] = []
		_hash[k].append(i)
	_build_road()
	_build_walls()
	_build_start()
	_build_terrain()
	_build_water()
	_build_scenery()
	_build_jump()

## Sector según s: "start", "hills", "coast", "city"
func sector(s: float) -> String:
	var ss := fposmod(s, track.length)
	if ss < sector_s[1] or ss > sector_s[11]:
		return "start"
	if ss < sector_s[6]:
		return "hills"
	if ss < sector_s[9]:
		return "coast"
	return "city"

func _road_dist(p: Vector3) -> Vector2:
	## (distancia horizontal al eje de pista, altura de la pista en ese punto)
	var k := Vector2i(floor(p.x / HASH), floor(p.z / HASH))
	var bd := 1e20
	var by := 0.0
	for dx in range(-2, 3):
		for dz in range(-2, 3):
			var kk := Vector2i(k.x + dx, k.y + dz)
			if _hash.has(kk):
				for i in _hash[kk]:
					var q: Vector3 = track.pos[i]
					var d := Vector2(q.x - p.x, q.z - p.z).length_squared()
					if d < bd:
						bd = d
						by = q.y
	return Vector2(sqrt(bd), by)

func natural_height(x: float, z: float) -> float:
	var h := 10.0 + noise.get_noise_2d(x, z) * 34.0
	h += smoothstep(-200.0, -380.0, z) * 30.0
	var sea := smoothstep(0.0, 150.0, (x - 480.0) * 0.75 + (z - 300.0) * 0.6)
	return lerpf(h, -14.0, sea)

func height_at(x: float, z: float) -> float:
	var rd := _road_dist(Vector3(x, 0, z))
	var nat := natural_height(x, z)
	var k := smoothstep(13.0, 65.0, rd.x)
	return lerpf(rd.y - 0.5, nat, k)

func _frames(s0: float, s1: float, step: float) -> Array:
	var out := []
	var n := int(round((s1 - s0) / step))
	for i in n + 1:
		out.append(track.frame(s0 + i * step))
	return out

func _dists(s0: float, s1: float, step: float) -> PackedFloat32Array:
	var d := PackedFloat32Array()
	var n := int(round((s1 - s0) / step))
	for i in n + 1:
		d.append(s0 + i * step)
	return d

func _build_road() -> void:
	var marks := [{"x": 7.85, "w": 0.22, "kind": "solid"}, {"x": -7.85, "w": 0.22, "kind": "solid"},
		{"x": 10.0, "w": 2.6, "kind": "shoulder"}, {"x": -10.0, "w": 2.6, "kind": "shoulder"},
		{"x": -2.0, "w": 2.0, "kind": "wear"}, {"x": 2.0, "w": 2.0, "kind": "wear"}]
	var prof := MatLib.road_profile(-11.6, 11.6, marks)
	var mat := MatLib.road(prof, -11.6, 11.6, 0.0)
	var seg := 100.0
	var s := 0.0
	while s < track.length - 0.01:
		var e := minf(s + seg, track.length)
		var frames := _frames(s, e, 4.0)
		var dists := _dists(s, e, 4.0)
		var st := MeshKit.begin()
		MeshKit.ribbon(st, frames, dists, -11.6, 11.6, 0.0, 4)
		var mesh := ArrayMesh.new()
		MeshKit.commit(st, mesh, mat)
		# Pianos en curvas
		var cs := MeshKit.begin()
		var any := false
		for i in frames.size() - 1:
			var c := track.curvature(dists[i])
			if absf(c) > 0.0035:
				any = true
				var side := 1.0 if c < 0.0 else -1.0  # exterior de la curva
				for sd in [side, -side]:
					var x0: float = sd * 7.95
					var x1: float = sd * 9.3
					var A: Transform3D = frames[i]
					var B: Transform3D = frames[i + 1]
					MeshKit.quad(cs, A * Vector3(minf(x0, x1), 0.035, 0), A * Vector3(maxf(x0, x1), 0.035, 0), B * Vector3(maxf(x0, x1), 0.035, 0), B * Vector3(minf(x0, x1), 0.035, 0), Vector2(0, dists[i]), Vector2(1, dists[i]), Vector2(1, dists[i + 1]), Vector2(0, dists[i + 1]))
		if any:
			MeshKit.commit(cs, mesh, MatLib.shader_mat("res://shaders/curb.gdshader"), false)
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		add_child(mi)
		s = e

func _build_walls() -> void:
	var wall := PackedVector2Array([Vector2(0.0, -0.4), Vector2(0.0, 1.05), Vector2(0.35, 1.1), Vector2(0.4, -0.4)])
	var banner_mat := StandardMaterial3D.new()
	banner_mat.albedo_texture = MatLib.tex("banners")
	banner_mat.roughness = 0.4
	banner_mat.emission_enabled = true
	banner_mat.emission_texture = MatLib.tex("banners")
	banner_mat.emission_energy_multiplier = 0.25
	var seg := 100.0
	var s := 0.0
	while s < track.length - 0.01:
		var e := minf(s + seg, track.length)
		var frames := _frames(s, e, 4.0)
		var dists := _dists(s, e, 4.0)
		var mesh := ArrayMesh.new()
		var ws := MeshKit.begin()
		for side in [1.0, -1.0]:
			var fr := []
			for f in frames:
				var b: Basis = f.basis
				if side < 0:
					b = Basis(-b.x, b.y, -b.z)
				fr.append(Transform3D(b, f.origin + f.basis.x * WALL_X * side))
			MeshKit.extrude(ws, wall, fr, dists, 0.5, false, side < 0)
		MeshKit.commit(ws, mesh, MatLib.pbr("concrete", 1.0, Color(0.95, 0.95, 0.97)))
		# Banners de patrocinadores en la cara interior del muro
		var bs := MeshKit.begin()
		var k := int(s / 12.0)
		var bsx := ceilf(s / 12.0) * 12.0
		while bsx + 11.0 <= e:
			for side in [1.0, -1.0]:
				var cell := (k * 3 + (1 if side > 0 else 5)) % 8
				var u0 := (cell % 2) * 0.5
				var v0 := (cell / 2) * 0.25
				var A := track.frame(bsx)
				var B := track.frame(bsx + 11.0)
				var xo: float = (WALL_X - 0.03) * side
				var a0: Vector3 = A.origin + A.basis.x * xo + A.basis.y * 0.12
				var a1: Vector3 = A.origin + A.basis.x * xo + A.basis.y * 1.0
				var b0: Vector3 = B.origin + B.basis.x * xo + B.basis.y * 0.12
				var b1: Vector3 = B.origin + B.basis.x * xo + B.basis.y * 1.0
				if side > 0:
					MeshKit.quad(bs, b0, a0, a1, b1, Vector2(u0, v0 + 0.25), Vector2(u0 + 0.5, v0 + 0.25), Vector2(u0 + 0.5, v0), Vector2(u0, v0))
				else:
					MeshKit.quad(bs, a0, b0, b1, a1, Vector2(u0, v0 + 0.25), Vector2(u0 + 0.5, v0 + 0.25), Vector2(u0 + 0.5, v0), Vector2(u0, v0))
			bsx += 12.0
			k += 1
		MeshKit.commit(bs, mesh, banner_mat, false)
		var mi := MeshInstance3D.new()
		mi.mesh = mesh
		add_child(mi)
		s = e

func _build_start() -> void:
	var f := track.frame(0.0)
	# Línea de meta a cuadros
	var lm := MeshInstance3D.new()
	var q := PlaneMesh.new()
	q.size = Vector2(16.0, 2.0)
	lm.mesh = q
	var m := StandardMaterial3D.new()
	m.albedo_texture = MatLib.tex("finish_line")
	m.roughness = 0.6
	lm.material_override = m
	lm.global_transform = Transform3D(f.basis, f.origin + f.basis.y * 0.03)
	add_child(lm)
	# Pórtico de salida con semáforo
	var g := MeshInstance3D.new()
	g.mesh = Props.gantry(23.6)
	g.global_transform = Transform3D(f.basis, f.origin - f.basis.z * 2.0)
	add_child(g)
	var lbl := Label3D.new()
	lbl.text = "SALIDA · META"
	lbl.font = UIKit.font("Orbitron-Black")
	lbl.font_size = 110
	lbl.pixel_size = 0.009
	lbl.modulate = Color(1, 1, 1)
	lbl.position = Vector3(-23.6 * 0.18, 7.45, 0.38)
	g.add_child(lbl)
	var lbl2 := lbl.duplicate()
	lbl2.text = "COSTA DEL SOL"
	lbl2.position = Vector3(23.6 * 0.22, 7.45, 0.38)
	g.add_child(lbl2)
	var sph := SphereMesh.new()
	sph.radius = 0.32
	sph.height = 0.64
	for i in 5:
		var l := MeshInstance3D.new()
		l.mesh = sph
		l.material_override = MatLib.emissive(Color(0.25, 0.02, 0.02), 1.0)
		l.position = Vector3(-2.4 + i * 1.2, 6.2, 0.4)
		g.add_child(l)
		start_lights.append(l)
	# Gradas a ambos lados de la recta
	var crowd := StandardMaterial3D.new()
	crowd.albedo_texture = MatLib.tex("crowd")
	crowd.roughness = 0.9
	crowd.uv1_scale = Vector3(6, 1, 1)
	for s0 in [-150.0, -70.0, 10.0, 90.0]:
		for side in [1.0, -1.0]:
			if side < 0 and s0 > 0.0:
				continue
			var fr := track.frame(s0 + 35.0)
			var stand := Node3D.new()
			var b: Basis = fr.basis if side > 0 else Basis(-fr.basis.x, fr.basis.y, -fr.basis.z)
			stand.global_transform = Transform3D(b, fr.origin + fr.basis.x * (WALL_X + 6.0) * side)
			add_child(stand)
			var sm := ArrayMesh.new()
			var st := MeshKit.begin()
			for row in 8:
				MeshKit.box(st, Vector3(0.75 + row * 1.0, 0.3 + row * 0.55, 0), Vector3(1.0, 0.6 + row * 1.1, 70.0), 0.5)
			MeshKit.commit(st, sm, MatLib.pbr("concrete", 1.0, Color(0.7, 0.72, 0.78)))
			var cs := MeshKit.begin()
			for row in 8:
				var x0 := 0.3 + row * 1.0
				var y0 := 0.62 + row * 0.55 + row * 0.55
				MeshKit.quad(cs, Vector3(x0, y0 - 0.05, 35.0), Vector3(x0, y0 - 0.05, -35.0), Vector3(x0 + 0.1, y0 + 0.75, -35.0), Vector3(x0 + 0.1, y0 + 0.75, 35.0), Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 0))
			MeshKit.commit(cs, sm, crowd, false)
			var rs := MeshKit.begin()
			MeshKit.box(rs, Vector3(5.0, 12.0, 0), Vector3(11.0, 0.3, 72.0))
			for z in [-34.0, 0.0, 34.0]:
				MeshKit.box(rs, Vector3(9.5, 6.0, z), Vector3(0.4, 12.0, 0.4))
			MeshKit.commit(rs, sm, Props.metal())
			var mi := MeshInstance3D.new()
			mi.mesh = sm
			stand.add_child(mi)

func _build_terrain() -> void:
	var minp := Vector3(1e9, 0, 1e9)
	var maxp := Vector3(-1e9, 0, -1e9)
	for p in track.pos:
		minp = Vector3(minf(minp.x, p.x), 0, minf(minp.z, p.z))
		maxp = Vector3(maxf(maxp.x, p.x), 0, maxf(maxp.z, p.z))
	minp -= Vector3(420, 0, 420)
	maxp += Vector3(420, 0, 420)
	var cell := 14.0
	var nx := int((maxp.x - minp.x) / cell)
	var nz := int((maxp.z - minp.z) / cell)
	var heights := []
	for j in nz + 1:
		var row := PackedFloat32Array()
		for i in nx + 1:
			var x := minp.x + i * cell
			var z := minp.z + j * cell
			var d := Vector2(x, z)
			# Celdas lejanas: altura natural (más barato)
			row.append(height_at(x, z))
		heights.append(row)
	var mat := MatLib.terrain(Color(1.0, 1.0, 0.95), 0.3, 9999.0, 2.2)
	var chunk := 20
	for cj in range(0, nz, chunk):
		for ci in range(0, nx, chunk):
			var st := SurfaceTool.new()
			st.begin(Mesh.PRIMITIVE_TRIANGLES)
			for j in range(cj, mini(cj + chunk, nz)):
				for i in range(ci, mini(ci + chunk, nx)):
					var a := Vector3(minp.x + i * cell, heights[j][i], minp.z + j * cell)
					var b := Vector3(minp.x + (i + 1) * cell, heights[j][i + 1], minp.z + j * cell)
					var c := Vector3(minp.x + (i + 1) * cell, heights[j + 1][i + 1], minp.z + (j + 1) * cell)
					var d := Vector3(minp.x + i * cell, heights[j + 1][i], minp.z + (j + 1) * cell)
					for v in [a, b, c, a, c, d]:
						st.set_uv(Vector2(v.x, v.z))
						st.add_vertex(v)
			st.index()
			st.generate_normals()
			st.generate_tangents()
			st.set_material(mat)
			var mesh := st.commit()
			var mi := MeshInstance3D.new()
			mi.mesh = mesh
			add_child(mi)

func _build_water() -> void:
	var w := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(5000, 5000)
	pm.subdivide_width = 60
	pm.subdivide_depth = 60
	w.mesh = pm
	w.position = Vector3(600, 0.0, 300)
	w.material_override = MatLib.shader_mat("res://shaders/water.gdshader", {"nrm": MatLib.tex("water_normal"), "wave_height": 0.18})
	w.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(w)
	var mtn := MeshInstance3D.new()
	mtn.mesh = Props.mountain_ring(2400.0, 5, 380.0, true)
	mtn.position = Vector3(200, 0, 100)
	mtn.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mtn)

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

func _ground(p: Vector3) -> Vector3:
	return Vector3(p.x, height_at(p.x, p.z), p.z)

func _build_scenery() -> void:
	var palms := []
	var pines := []
	var leafs := []
	var bushes := []
	var tufts := []
	var rocks := []
	var lamps := []
	var s := 0.0
	while s < track.length:
		var sec := sector(s)
		var f := track.frame(s)
		for side in [1.0, -1.0]:
			var dist := rng.randf_range(14.0, 24.0)
			var p := _ground(f.origin + f.basis.x * dist * side)
			if p.y < 1.4:
				continue
			var sc := rng.randf_range(0.85, 1.25)
			var xf := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc, sc)), p - Vector3(0, 0.1, 0))
			match sec:
				"coast", "start":
					if int(s) % 2 == 0:
						palms.append(xf)
				"city":
					if rng.randf() < 0.35:
						palms.append(xf)
				"hills":
					if rng.randf() < 0.6:
						pines.append(xf)
					else:
						leafs.append(xf)
		for k in 3:
			var side2 := 1.0 if rng.randf() < 0.5 else -1.0
			var d2 := rng.randf_range(12.5, 40.0)
			var p2 := _ground(f.origin + f.basis.x * d2 * side2)
			if p2.y < 1.5:
				continue
			var sc2 := rng.randf_range(0.7, 1.3)
			tufts.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc2, sc2, sc2)), p2))
		if rng.randf() < 0.5:
			var side3 := 1.0 if rng.randf() < 0.5 else -1.0
			var p3 := _ground(f.origin + f.basis.x * rng.randf_range(13.0, 30.0) * side3)
			if p3.y > 1.5:
				var sc3 := rng.randf_range(0.6, 1.2)
				bushes.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc3, sc3, sc3)), p3))
		# Farolas cada 40 m (lado exterior)
		if int(s) % 40 == 0 and sec != "hills":
			var lp := f.origin + f.basis.x * (WALL_X + 1.0)
			lamps.append(Transform3D(f.basis.rotated(f.basis.y, PI * 0.5), _ground(lp)))
		s += 10.0
	# Bosque en las colinas y rocas en la costa (más lejos de la pista)
	for i in 900:
		var x := rng.randf_range(-350.0, 800.0)
		var z := rng.randf_range(-600.0, 700.0)
		var rd := _road_dist(Vector3(x, 0, z))
		if rd.x < 28.0:
			continue
		var h := height_at(x, z)
		if h < 2.5:
			if h > -3.0 and rng.randf() < 0.3:
				var scr := rng.randf_range(1.0, 4.0)
				rocks.append(Transform3D(Basis(Vector3(rng.randf(), 1, rng.randf()).normalized(), rng.randf() * TAU).scaled(Vector3(scr * 1.3, scr, scr)), Vector3(x, h, z)))
			continue
		var sc4 := rng.randf_range(0.9, 1.6)
		var xf4 := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc4, sc4, sc4)), Vector3(x, h - 0.2, z))
		if h < 9.0 and rng.randf() < 0.5:
			palms.append(xf4)
		elif rng.randf() < 0.65:
			pines.append(xf4)
		else:
			leafs.append(xf4)
	_mm(Props.palm(), palms)
	_mm(Props.pine(), pines)
	_mm(Props.broadleaf(), leafs)
	_mm(Props.bush(), bushes, false)
	_mm(Props.grass_tuft(), tufts, false)
	_mm(Props.rock(1), rocks)
	_mm(_lamp_post(), lamps)
	_build_city()
	_build_landmarks()

func _lamp_post() -> Mesh:
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	MeshKit.cylinder(st, Vector3.ZERO, 0.12, 0.08, 8.0, 8, true)
	MeshKit.box(st, Vector3(0, 8.0, -1.2), Vector3(0.12, 0.12, 2.4))
	MeshKit.box(st, Vector3(0, 7.9, -2.3), Vector3(0.35, 0.15, 0.7))
	MeshKit.commit(st, mesh, Props.metal())
	var ls := MeshKit.begin()
	MeshKit.box(ls, Vector3(0, 7.81, -2.3), Vector3(0.28, 0.02, 0.55))
	MeshKit.commit(ls, mesh, MatLib.emissive(Color(1.0, 0.85, 0.6), 3.0), false)
	return mesh

func _build_city() -> void:
	var facades := []
	for i in 3:
		var m := StandardMaterial3D.new()
		m.albedo_texture = MatLib.tex("facade%d_albedo" % i)
		m.roughness = 0.35
		m.metallic = 0.2
		m.emission_enabled = true
		m.emission_texture = MatLib.tex("facade%d_emission" % i)
		m.emission_energy_multiplier = 0.15
		facades.append(m)
	var roof := MatLib.pbr("concrete", 0.2, Color(0.55, 0.56, 0.6))
	var s: float = sector_s[9] - 30.0
	var e: float = sector_s[11] + 40.0
	while s < e:
		var f := track.frame(s)
		for side in [1.0, -1.0]:
			if rng.randf() < 0.15:
				continue
			var dist := rng.randf_range(26.0, 40.0)
			var w := rng.randf_range(14.0, 24.0)
			var dpt := rng.randf_range(14.0, 22.0)
			var hgt := rng.randf_range(16.0, 58.0)
			var base := _ground(f.origin + f.basis.x * (dist + dpt * 0.5) * side)
			var b := Node3D.new()
			add_child(b)
			b.global_transform = Transform3D(Basis(Vector3.UP, atan2(-f.basis.z.x, -f.basis.z.z)), base)
			var mesh := ArrayMesh.new()
			var st := MeshKit.begin()
			var fm: StandardMaterial3D = facades[rng.randi() % 3]
			var hh := hgt
			# Fachada con UV en "pisos": 1 repetición de textura = 10 m de ancho x 30 m de alto
			var hs := Vector3(dpt * 0.5, hh * 0.5, w * 0.5)
			var c := Vector3(0, hh * 0.5 - 2.0, 0)
			var p := [c + Vector3(-hs.x, -hs.y, -hs.z), c + Vector3(hs.x, -hs.y, -hs.z), c + Vector3(hs.x, hs.y, -hs.z), c + Vector3(-hs.x, hs.y, -hs.z),
				c + Vector3(-hs.x, -hs.y, hs.z), c + Vector3(hs.x, -hs.y, hs.z), c + Vector3(hs.x, hs.y, hs.z), c + Vector3(-hs.x, hs.y, hs.z)]
			var u_w := dpt / 10.0
			var u_d := w / 10.0
			var v_h := hh / 30.0
			MeshKit.quad(st, p[4], p[5], p[6], p[7], Vector2(0, v_h), Vector2(u_w, v_h), Vector2(u_w, 0), Vector2(0, 0))
			MeshKit.quad(st, p[1], p[0], p[3], p[2], Vector2(0, v_h), Vector2(u_w, v_h), Vector2(u_w, 0), Vector2(0, 0))
			MeshKit.quad(st, p[5], p[1], p[2], p[6], Vector2(0, v_h), Vector2(u_d, v_h), Vector2(u_d, 0), Vector2(0, 0))
			MeshKit.quad(st, p[0], p[4], p[7], p[3], Vector2(0, v_h), Vector2(u_d, v_h), Vector2(u_d, 0), Vector2(0, 0))
			MeshKit.commit(st, mesh, fm)
			var rs := MeshKit.begin()
			MeshKit.quad(rs, p[7], p[6], p[2], p[3])
			MeshKit.box(rs, Vector3(rng.randf_range(-2, 2), hh - 1.0, rng.randf_range(-3, 3)), Vector3(3.0, 2.2, 4.0))
			MeshKit.commit(rs, mesh, roof)
			var mi := MeshInstance3D.new()
			mi.mesh = mesh
			b.add_child(mi)
		s += rng.randf_range(24.0, 34.0)

func _build_landmarks() -> void:
	# Faro en el acantilado de la costa
	var f := track.frame(sector_s[8])
	var lp := f.origin + f.basis.x * 60.0
	lp.y = maxf(height_at(lp.x, lp.z), 2.0)
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	MeshKit.cylinder(st, Vector3.ZERO, 3.2, 2.2, 26.0, 20, true, Transform3D.IDENTITY, 4.0)
	MeshKit.commit(st, mesh, MatLib.color(Color(0.95, 0.95, 0.95), 0.5))
	var rs := MeshKit.begin()
	for i in 3:
		MeshKit.cylinder(rs, Vector3(0, 4.0 + i * 8.0, 0), 3.05 - i * 0.33, 2.85 - i * 0.33, 3.0, 20, false)
	MeshKit.commit(rs, mesh, MatLib.color(Color(0.8, 0.08, 0.08), 0.5))
	var ls := MeshKit.begin()
	MeshKit.cylinder(ls, Vector3(0, 26.0, 0), 1.6, 1.6, 2.6, 16, true)
	MeshKit.commit(ls, mesh, MatLib.emissive(Color(1.0, 0.95, 0.7), 4.0), false)
	var lh := MeshInstance3D.new()
	lh.mesh = mesh
	lh.position = lp
	add_child(lh)
	# Barcos en el mar
	for i in 7:
		var bx := MeshInstance3D.new()
		var bm := ArrayMesh.new()
		var bs := MeshKit.begin()
		MeshKit.box(bs, Vector3(0, 0.6, 0), Vector3(4.0, 1.6, 14.0))
		MeshKit.box(bs, Vector3(0, 2.0, 1.5), Vector3(3.0, 1.4, 6.0))
		MeshKit.commit(bs, bm, MatLib.color(Color(0.96, 0.96, 0.98), 0.3))
		var ms := MeshKit.begin()
		MeshKit.cylinder(ms, Vector3(0, 1.2, -2.0), 0.12, 0.08, 12.0, 6, false)
		MeshKit.commit(ms, bm, Props.metal())
		bx.mesh = bm
		bx.position = Vector3(rng.randf_range(620, 1100), 0.0, rng.randf_range(100, 900))
		bx.rotation.y = rng.randf() * TAU
		add_child(bx)
	# Globos aerostáticos
	var cols := [Color(0.9, 0.2, 0.15), Color(0.1, 0.5, 0.95), Color(1.0, 0.75, 0.1), Color(0.2, 0.75, 0.35)]
	for i in 5:
		var g := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 9.0
		sm.height = 22.0
		g.mesh = sm
		g.material_override = MatLib.color(cols[i % 4], 0.6)
		g.position = Vector3(rng.randf_range(-200, 700), rng.randf_range(90, 180), rng.randf_range(-500, 600))
		add_child(g)
		var basket := MeshInstance3D.new()
		var bxm := BoxMesh.new()
		bxm.size = Vector3(2.4, 1.8, 2.4)
		basket.mesh = bxm
		basket.material_override = MatLib.pbr("planks", 0.5)
		basket.position = Vector3(0, -15.0, 0)
		g.add_child(basket)

func _build_jump() -> void:
	# Rampa de salto (kicker) con chevrones
	var len := 12.0
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	var frames := _frames(jump_s, jump_s + len, 1.0)
	for i in frames.size() - 1:
		var A: Transform3D = frames[i]
		var B: Transform3D = frames[i + 1]
		var ha := 1.5 * pow(float(i) / (frames.size() - 1), 1.4)
		var hb := 1.5 * pow(float(i + 1) / (frames.size() - 1), 1.4)
		MeshKit.quad(st, A * Vector3(-4.5, ha, 0), A * Vector3(4.5, ha, 0), B * Vector3(4.5, hb, 0), B * Vector3(-4.5, hb, 0), Vector2(0, i / len * 3.0), Vector2(1, i / len * 3.0), Vector2(1, (i + 1) / len * 3.0), Vector2(0, (i + 1) / len * 3.0))
	var top: Transform3D = frames[-1]
	MeshKit.quad(st, top * Vector3(-4.5, 0, 0), top * Vector3(4.5, 0, 0), top * Vector3(4.5, 1.5, 0), top * Vector3(-4.5, 1.5, 0))
	var rm := StandardMaterial3D.new()
	rm.albedo_texture = MatLib.tex("chevron")
	rm.roughness = 0.5
	rm.emission_enabled = true
	rm.emission = Color(0.4, 0.3, 0.0)
	MeshKit.commit(st, mesh, rm)
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	add_child(mi)
	# Pads de turbo
	for frac in [0.12, 0.47, 0.83]:
		var bs: float = track.length * frac
		boost_s.append(bs)
		var fr := track.frame(bs)
		var pad := MeshInstance3D.new()
		var pm := PlaneMesh.new()
		pm.size = Vector2(4.0, 7.0)
		pad.mesh = pm
		var pmat := MatLib.additive("boost_arrows", Color(0.3, 0.8, 1.0), 2.0).duplicate()
		pmat.albedo_texture = MatLib.tex("boost_arrows")
		pad.material_override = pmat
		pad.global_transform = Transform3D(fr.basis * Basis(Vector3.UP, PI * 0.5), fr.origin + fr.basis.y * 0.05)
		add_child(pad)
