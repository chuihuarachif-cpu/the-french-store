class_name HighwayWorld
extends Node3D
## Genera la autopista por tramos (chunks) delante del jugador y recicla los de atrás.
## Sección transversal (x en metros, + derecha):
##   carriles propios: centros -5.7, -1.9, 1.9, 5.7 (borde ±7.6), arcén derecho hasta 9.4, guardarraíl 9.9
##   mediana con barrera New Jersey en -10.0
##   calzada contraria: carriles -13.9, -17.7, -21.5 (bordes -12.0 / -23.4), guardarraíl -24.2

const CHUNK := 120.0
const STEP := 6.0
const AHEAD := 760.0
const BEHIND := 140.0
const LANES := [-5.7, -1.9, 1.9, 5.7]
const ONCOMING := [-13.9, -17.7, -21.5]
const X_MIN := -24.6
const X_MAX := 10.4

var track: HighwayTrack
var night := false
var preset := "day"
var chunks := {}  # idx -> Node3D
var road_mat: ShaderMaterial
var terrain_mat: ShaderMaterial
var noise := FastNoiseLite.new()
var mountains: MeshInstance3D
var _built_until := -1

func setup(t: HighwayTrack, time_preset: String) -> void:
	track = t
	preset = time_preset
	night = time_preset == "night"
	noise.seed = 4242
	noise.frequency = 0.0045
	noise.fractal_octaves = 4
	var marks := [
		{"x": 7.45, "w": 0.18, "kind": "solid"}, {"x": -7.45, "w": 0.18, "kind": "solid"},
		{"x": -3.8, "w": 0.16, "kind": "dash"}, {"x": 0.0, "w": 0.16, "kind": "dash"}, {"x": 3.8, "w": 0.16, "kind": "dash"},
		{"x": 8.5, "w": 1.8, "kind": "shoulder"}, {"x": -8.55, "w": 2.1, "kind": "shoulder"},
		{"x": -10.0, "w": 2.8, "kind": "shoulder"},
		{"x": -12.15, "w": 0.18, "kind": "solid"}, {"x": -23.25, "w": 0.18, "kind": "solid"},
		{"x": -15.8, "w": 0.16, "kind": "dash"}, {"x": -19.6, "w": 0.16, "kind": "dash"},
		{"x": -24.0, "w": 1.2, "kind": "shoulder"},
	]
	for lx in LANES + ONCOMING:
		marks.append({"x": lx - 0.85, "w": 0.9, "kind": "wear"})
		marks.append({"x": lx + 0.85, "w": 0.9, "kind": "wear"})
	var prof := MatLib.road_profile(X_MIN, X_MAX, marks)
	road_mat = MatLib.road(prof, X_MIN, X_MAX, 0.55 if night else 0.0)
	var tint := Color(0.85, 0.9, 0.75) if preset == "sunset" else Color(1, 1, 1)
	terrain_mat = MatLib.terrain(tint, 0.3)
	mountains = MeshInstance3D.new()
	mountains.mesh = Props.mountain_ring(2600.0, 9, 420.0, true)
	mountains.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mountains)

func update(player_s: float, cam_pos: Vector3, max_builds := 1) -> void:
	var first := int(floor((player_s - BEHIND) / CHUNK))
	var last := int(floor((player_s + AHEAD) / CHUNK))
	for idx in chunks.keys():
		if idx < first:
			chunks[idx].queue_free()
			chunks.erase(idx)
	var built := 0
	for idx in range(max(first, 0), last + 1):
		if not chunks.has(idx):
			chunks[idx] = _build_chunk(idx)
			built += 1
			if built >= max_builds:
				break
	mountains.position = Vector3(cam_pos.x, 0, cam_pos.z)

func prebuild(player_s: float) -> void:
	update(player_s, Vector3.ZERO, 100)

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

func ground_height(fr: Transform3D, x: float) -> Vector3:
	var p := fr.origin + fr.basis.x * x
	var ax := absf(x)
	var edge := 10.4 if x > 0 else 24.6
	var d := maxf(ax - edge, 0.0)
	var h := -0.35 * smoothstep(0.0, 2.0, d) + 0.35 * smoothstep(2.0, 6.0, d)
	var hills := (noise.get_noise_2d(p.x, p.z) * 0.5 + 0.5) * 34.0 + 6.0
	h += hills * smoothstep(8.0, 90.0, d)
	h += d * 0.06
	return Vector3(p.x, fr.origin.y + h, p.z)

func _build_chunk(idx: int) -> Node3D:
	var root := Node3D.new()
	root.name = "Chunk%d" % idx
	add_child(root)
	var s0 := idx * CHUNK
	var s1 := s0 + CHUNK
	var frames := _frames(s0, s1, STEP)
	var dists := _dists(s0, s1, STEP)
	var rng := RandomNumberGenerator.new()
	rng.seed = idx * 7919 + 13
	# --- Calzada ---
	var mesh := ArrayMesh.new()
	var st := MeshKit.begin()
	MeshKit.ribbon(st, frames, dists, X_MIN, X_MAX, 0.0, 3)
	MeshKit.commit(st, mesh, road_mat)
	# Barrera New Jersey (mediana)
	var jersey := PackedVector2Array([Vector2(-0.32, -0.05), Vector2(-0.3, 0.08), Vector2(-0.12, 0.3), Vector2(-0.08, 0.82), Vector2(0.08, 0.82), Vector2(0.12, 0.3), Vector2(0.3, 0.08), Vector2(0.32, -0.05)])
	var jf := []
	for f in frames:
		jf.append(Transform3D(f.basis, f.origin + f.basis.x * -10.0))
	var js := MeshKit.begin()
	MeshKit.extrude(js, jersey, jf, dists, 0.5, false, true)
	MeshKit.commit(js, mesh, MatLib.pbr("concrete", 1.0))
	# Guardarraíles (viga W) + postes
	var wbeam := PackedVector2Array([Vector2(0.0, 0.48), Vector2(0.09, 0.53), Vector2(0.02, 0.6), Vector2(0.09, 0.67), Vector2(0.0, 0.72)])
	var gs := MeshKit.begin()
	for gx in [9.9, -24.2]:
		var side := 1.0 if gx > 0 else -1.0
		var gfr := []
		for f in frames:
			var b: Basis = f.basis
			if side < 0:
				b = Basis(-b.x, b.y, -b.z)
			gfr.append(Transform3D(b, f.origin + f.basis.x * gx))
		MeshKit.extrude(gs, wbeam, gfr, dists, 0.5, false, side < 0)
	MeshKit.commit(gs, mesh, Props.metal())
	var ps := MeshKit.begin()
	for i in range(0, frames.size() - 1):
		for gx in [10.0, -24.3]:
			var f: Transform3D = frames[i]
			MeshKit.box(ps, Vector3.ZERO, Vector3(0.12, 0.75, 0.12), 1.0, Transform3D(f.basis, f.origin + f.basis.x * gx + f.basis.y * 0.37))
	MeshKit.commit(ps, mesh, MatLib.color(Color(0.45, 0.46, 0.48), 0.5, 0.7))
	var road := MeshInstance3D.new()
	road.mesh = mesh
	root.add_child(road)
	# --- Terreno a ambos lados ---
	var tframes := _frames(s0, s1, 12.0)
	var tm := ArrayMesh.new()
	var ts := MeshKit.begin()
	var cols_r := [10.4, 11.2, 12.4, 14.5, 19.0, 28.0, 42.0, 62.0, 90.0, 130.0, 190.0, 260.0]
	var cols_l := [-24.6, -25.4, -26.6, -28.7, -33.0, -42.0, -56.0, -76.0, -104.0, -144.0, -204.0, -274.0]
	for cols in [cols_r, cols_l]:
		var grid := []
		for f in tframes:
			var row := []
			for x in cols:
				row.append(ground_height(f, x))
			grid.append(row)
		for i in grid.size() - 1:
			for j in cols.size() - 1:
				var a: Vector3 = grid[i][j]
				var b: Vector3 = grid[i][j + 1]
				var c: Vector3 = grid[i + 1][j + 1]
				var d: Vector3 = grid[i + 1][j]
				if cols[0] > 0:
					for v in [a, c, b, a, d, c]:
						ts.set_uv(Vector2(v.x, v.z))
						ts.add_vertex(v)
				else:
					for v in [a, b, c, a, c, d]:
						ts.set_uv(Vector2(v.x, v.z))
						ts.add_vertex(v)
	ts.generate_normals()
	ts.generate_tangents()
	ts.set_material(terrain_mat)
	ts.commit(tm)
	var terr := MeshInstance3D.new()
	terr.mesh = tm
	root.add_child(terr)
	# --- Vegetación y rocas (MultiMesh) ---
	_scatter(root, rng, frames, s0)
	# --- Farolas cada 48 m en la mediana ---
	var lamps := []
	var pools := []
	var ls := ceilf(s0 / 48.0) * 48.0
	while ls < s1:
		var f := track.frame(ls)
		lamps.append(Transform3D(f.basis, f.origin + f.basis.x * -10.0))
		if night:
			for px in [-7.2, -12.8, 3.0]:
				pools.append(Transform3D(f.basis, f.origin + f.basis.x * px))
		ls += 48.0
	_multimesh(root, Props.streetlight(), lamps, true)
	if night:
		_multimesh(root, Props.light_pool(), pools, false)
	# --- Pórtico de señalización cada 720 m ---
	var gs_pos := ceilf(s0 / 720.0) * 720.0
	if gs_pos >= s0 and gs_pos < s1 and gs_pos > 200.0:
		var f := track.frame(gs_pos)
		var g := MeshInstance3D.new()
		g.mesh = Props.gantry(19.8)
		g.transform = Transform3D(f.basis, f.origin + f.basis.x * 0.15)
		root.add_child(g)
		_gantry_text(g, idx)
	return root

func _gantry_text(g: Node3D, idx: int) -> void:
	var names := ["APEX CITY", "COSTA AZUL", "SIERRA NORTE", "PUERTO VIEJO", "VALLE ROJO", "AEROPUERTO"]
	for k in 2:
		var l := Label3D.new()
		l.text = ("%s\n%d km" % [names[(idx + k * 3) % names.size()], 12 + (idx * 7 + k * 31) % 80]) if k == 0 else ("SALIDA %d\n%s" % [(idx % 40) + 1, names[(idx + 1) % names.size()]])
		l.font = load("res://assets/fonts/Rajdhani-Bold.woff2")
		l.font_size = 96
		l.pixel_size = 0.0075
		l.modulate = Color(0.95, 0.97, 0.95)
		l.outline_size = 0
		l.position = Vector3(-19.8 * 0.18 if k == 0 else 19.8 * 0.22, 7.4, 0.38)
		l.rotation_degrees.y = 180.0
		l.double_sided = false
		g.add_child(l)

func _multimesh(root: Node3D, mesh: Mesh, xforms: Array, shadows: bool) -> MultiMeshInstance3D:
	if xforms.is_empty():
		return null
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = mesh
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i])
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mmi)
	return mmi

func _scatter(root: Node3D, rng: RandomNumberGenerator, frames: Array, s0: float) -> void:
	var pines := []
	var leafs := []
	var bushes := []
	var tufts := []
	var rocks := []
	var count := 34
	for i in count:
		var s := s0 + rng.randf() * CHUNK
		var f := track.frame(s)
		var side := 1.0 if rng.randf() < 0.5 else -1.0
		var dist := rng.randf_range(4.0, 120.0) * (0.35 + 0.65 * rng.randf())
		var x := (14.0 + dist) if side > 0 else (-28.0 - dist)
		var p := ground_height(f, x)
		var sc := rng.randf_range(0.8, 1.45)
		var xf := Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc * rng.randf_range(0.9, 1.2), sc)), p - Vector3(0, 0.2, 0))
		if rng.randf() < 0.6:
			pines.append(xf)
		else:
			leafs.append(xf)
	for i in 22:
		var s := s0 + rng.randf() * CHUNK
		var f := track.frame(s)
		var x := rng.randf_range(11.5, 22.0) if rng.randf() < 0.55 else rng.randf_range(-26.0, -38.0)
		var p := ground_height(f, x)
		var sc := rng.randf_range(0.6, 1.3)
		bushes.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc, sc)), p))
	for i in 70:
		var s := s0 + rng.randf() * CHUNK
		var f := track.frame(s)
		var x := rng.randf_range(10.8, 30.0) if rng.randf() < 0.55 else rng.randf_range(-25.2, -45.0)
		var p := ground_height(f, x)
		var sc := rng.randf_range(0.7, 1.4)
		tufts.append(Transform3D(Basis(Vector3.UP, rng.randf() * TAU).scaled(Vector3(sc, sc, sc)), p))
	for i in 4:
		var s := s0 + rng.randf() * CHUNK
		var f := track.frame(s)
		var x := rng.randf_range(13.0, 50.0) * (1.0 if rng.randf() < 0.5 else -2.2)
		var p := ground_height(f, x)
		var sc := rng.randf_range(0.8, 3.0)
		rocks.append(Transform3D(Basis(Vector3(rng.randf(), 1, rng.randf()).normalized(), rng.randf() * TAU).scaled(Vector3(sc * 1.3, sc, sc)), p))
	_multimesh(root, Props.pine(), pines, true)
	_multimesh(root, Props.broadleaf(), leafs, true)
	_multimesh(root, Props.bush(), bushes, false)
	_multimesh(root, Props.grass_tuft(), tufts, false)
	_multimesh(root, Props.rock(rng.randi() % 3), rocks, true)
