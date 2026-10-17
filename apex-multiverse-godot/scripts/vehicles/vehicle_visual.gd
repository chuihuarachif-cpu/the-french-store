class_name VehicleVisual
extends Node3D
## Modelo procedural de cualquier vehículo del catálogo: autos, motos (con piloto que se inclina),
## camiones con remolque articulado y aviones. Frente hacia -Z, suelo en y = 0.

const SHAPES := {
	"hatch": {"L": 4.1, "W": 1.8, "y0": 0.25, "belt": 0.88, "hood": 0.92, "deck": 1.02, "roof": 1.5, "cab_a": 0.3, "cab_b": 0.97, "ws": 0.3, "rs": 0.12, "wr": 0.31, "wb": 2.55},
	"sedan": {"L": 4.8, "W": 1.88, "y0": 0.26, "belt": 0.86, "hood": 0.92, "deck": 1.0, "roof": 1.45, "cab_a": 0.32, "cab_b": 0.82, "ws": 0.32, "rs": 0.3, "wr": 0.33, "wb": 2.85},
	"coupe": {"L": 4.5, "W": 1.9, "y0": 0.22, "belt": 0.78, "hood": 0.82, "deck": 0.9, "roof": 1.28, "cab_a": 0.36, "cab_b": 0.84, "ws": 0.42, "rs": 0.45, "wr": 0.34, "wb": 2.65},
	"suv": {"L": 4.85, "W": 1.98, "y0": 0.4, "belt": 1.12, "hood": 1.18, "deck": 1.24, "roof": 1.82, "cab_a": 0.28, "cab_b": 0.97, "ws": 0.24, "rs": 0.08, "wr": 0.39, "wb": 2.9},
	"pickup": {"L": 5.4, "W": 2.0, "y0": 0.45, "belt": 1.15, "hood": 1.22, "deck": 1.22, "roof": 1.9, "cab_a": 0.26, "cab_b": 0.58, "ws": 0.3, "rs": 0.1, "wr": 0.41, "wb": 3.3, "bed": true},
	"trophy": {"L": 5.2, "W": 2.15, "y0": 0.7, "belt": 1.35, "hood": 1.4, "deck": 1.4, "roof": 2.05, "cab_a": 0.28, "cab_b": 0.62, "ws": 0.3, "rs": 0.15, "wr": 0.5, "wb": 3.2, "bed": true},
	"sport": {"L": 4.5, "W": 1.95, "y0": 0.2, "belt": 0.7, "hood": 0.74, "deck": 0.84, "roof": 1.2, "cab_a": 0.38, "cab_b": 0.8, "ws": 0.45, "rs": 0.5, "wr": 0.34, "wb": 2.65},
	"supercar": {"L": 4.6, "W": 2.02, "y0": 0.16, "belt": 0.62, "hood": 0.64, "deck": 0.82, "roof": 1.12, "cab_a": 0.36, "cab_b": 0.7, "ws": 0.5, "rs": 0.6, "wr": 0.35, "wb": 2.7},
	"hyper": {"L": 4.7, "W": 2.05, "y0": 0.14, "belt": 0.58, "hood": 0.6, "deck": 0.78, "roof": 1.08, "cab_a": 0.34, "cab_b": 0.68, "ws": 0.55, "rs": 0.65, "wr": 0.36, "wb": 2.75},
	"concept": {"L": 4.8, "W": 2.06, "y0": 0.12, "belt": 0.55, "hood": 0.56, "deck": 0.74, "roof": 1.04, "cab_a": 0.36, "cab_b": 0.66, "ws": 0.6, "rs": 0.7, "wr": 0.36, "wb": 2.8},
	"muscle": {"L": 4.9, "W": 1.95, "y0": 0.26, "belt": 0.82, "hood": 0.9, "deck": 0.92, "roof": 1.3, "cab_a": 0.42, "cab_b": 0.78, "ws": 0.3, "rs": 0.35, "wr": 0.36, "wb": 2.85},
	"roadster": {"L": 4.3, "W": 1.9, "y0": 0.2, "belt": 0.7, "hood": 0.72, "deck": 0.8, "roof": 1.02, "cab_a": 0.44, "cab_b": 0.64, "ws": 0.5, "rs": 0.5, "wr": 0.33, "wb": 2.5},
	"ev": {"L": 4.7, "W": 1.92, "y0": 0.2, "belt": 0.78, "hood": 0.8, "deck": 0.9, "roof": 1.34, "cab_a": 0.3, "cab_b": 0.86, "ws": 0.45, "rs": 0.5, "wr": 0.34, "wb": 2.85},
	"rally": {"L": 4.3, "W": 1.86, "y0": 0.3, "belt": 0.86, "hood": 0.92, "deck": 1.0, "roof": 1.42, "cab_a": 0.32, "cab_b": 0.86, "ws": 0.3, "rs": 0.3, "wr": 0.34, "wb": 2.55},
	"gt": {"L": 4.7, "W": 2.0, "y0": 0.18, "belt": 0.68, "hood": 0.7, "deck": 0.86, "roof": 1.18, "cab_a": 0.4, "cab_b": 0.78, "ws": 0.45, "rs": 0.55, "wr": 0.35, "wb": 2.75},
	"proto": {"L": 4.9, "W": 2.0, "y0": 0.12, "belt": 0.55, "hood": 0.55, "deck": 0.8, "roof": 1.05, "cab_a": 0.4, "cab_b": 0.62, "ws": 0.55, "rs": 0.6, "wr": 0.35, "wb": 2.9},
	"classic": {"L": 4.4, "W": 1.8, "y0": 0.25, "belt": 0.8, "hood": 0.86, "deck": 0.88, "roof": 1.32, "cab_a": 0.4, "cab_b": 0.78, "ws": 0.35, "rs": 0.35, "wr": 0.33, "wb": 2.5},
}

var spec := {}
var paint := Color.RED
var accent := Color.WHITE
var kind := "car"
var length := 4.6
var width := 2.0
var height := 1.4
var wheels: Array = []        # {"spin": Node3D, "steer": Node3D o null, "r": float}
var body: Node3D               # se inclina (motos) y balancea
var trailer: Node3D
var trailer2: Node3D
var trailer_len := 0.0
var props: Array[Node3D] = []  # hélices
var flames: Array[MeshInstance3D] = []
var nitro_on := false
var brake_on := false
var lean := 0.0
var _wheel_a := 0.0
var _steer := 0.0
var _flame_t := 0.0
var _brake: StandardMaterial3D
var _paint_mat: StandardMaterial3D
var _accent_mat: StandardMaterial3D
var lite := false

static var _wheel_cache := {}

func setup(s: Dictionary, color: Color, is_lite := false) -> void:
	spec = s
	paint = color
	kind = s.get("kind", "car")
	lite = is_lite
	accent = Color(0.95, 0.95, 0.95) if color.get_luminance() < 0.45 else Color(0.06, 0.06, 0.07)
	_paint_mat = _make_paint(color)
	_accent_mat = _make_paint(accent)
	_brake = (TrafficFactory.mats()["tail"] as StandardMaterial3D).duplicate()
	body = Node3D.new()
	add_child(body)
	match kind:
		"car":
			_build_car()
		"moto":
			_build_moto()
		"truck":
			_build_truck()
		"plane":
			_build_plane()

func _make_paint(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.metallic = 0.5
	m.roughness = 0.3
	if not lite and Game.quality() >= 1:
		m.clearcoat_enabled = true
		m.clearcoat = 0.9
		m.clearcoat_roughness = 0.1
	return m

func set_paint(c: Color) -> void:
	paint = c
	_paint_mat.albedo_color = c

func _mi(mesh: Mesh, parent: Node3D = null, shadow := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if (shadow and not lite) else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	(parent if parent else body).add_child(mi)
	return mi

## Malla con varias superficies a partir de MeshData por material.
func _compose(parts: Dictionary) -> ArrayMesh:
	var mesh := ArrayMesh.new()
	var m := TrafficFactory.mats()
	for k in parts:
		var md: MeshData = parts[k]
		if md.is_empty():
			continue
		var mat: Material
		match k:
			"paint":
				mat = _paint_mat
			"accent":
				mat = _accent_mat
			"brake":
				mat = _brake
			"emit_blue":
				mat = MatLib.emissive(Color(0.1, 0.35, 1.0), 4.0)
			"emit_red":
				mat = MatLib.emissive(Color(1.0, 0.08, 0.05), 4.0)
			"emit_white":
				mat = MatLib.emissive(Color(1.0, 0.95, 0.85), 3.0)
			"wood":
				mat = MatLib.pbr("bark", 0.5, Color(0.9, 0.8, 0.7))
			"canvas":
				mat = MatLib.color(Color(0.35, 0.38, 0.26), 0.9)
			"metal":
				mat = MatLib.color(Color(0.55, 0.57, 0.6), 0.35, 0.8)
			_:
				mat = m.get(k, m["plastic"])
		md.to_mesh(mat, false, true, mesh)
	return mesh

func _parts(keys: Array) -> Dictionary:
	var d := {}
	for k in keys:
		d[k] = MeshData.new()
	return d

# ------------------------------------------------------------------ RUEDAS
func _wheel_mesh(r: float, w: float, moto := false) -> Mesh:
	var key := "%s_%s_%s" % [r, w, moto]
	if _wheel_cache.has(key):
		return _wheel_cache[key]
	var p := _parts(["tire", "rim", "plastic"])
	var ax := Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3(w * 0.5, 0, 0))
	p["tire"].prism(Vector3.ZERO, r, r, w, 16, Color.WHITE, Vector2.ZERO, true, ax)
	p["tire"].prism(Vector3.ZERO, r, r, w, 16, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3(0, 0, 1), -PI * 0.5), Vector3(-w * 0.5, 0, 0)))
	for sx in [1.0, -1.0]:
		var hub := Transform3D(Basis(Vector3(0, 0, 1), -PI * 0.5 * sx), Vector3(sx * (w * 0.5 + 0.004), 0, 0))
		p["rim"].prism(Vector3.ZERO, r * 0.66, r * 0.58, 0.03, 14, Color.WHITE, Vector2.ZERO, true, hub)
		for k in 5:
			var a := TAU * k / 5.0
			p["plastic"].box(Transform3D(Basis(Vector3.RIGHT, a), Vector3(sx * (w * 0.5 + 0.02), 0, 0)) * Transform3D(Basis.IDENTITY, Vector3(0, r * 0.32, 0)), Vector3(0.02, r * 0.3, 0.07), Color.WHITE, Vector2.ZERO, 5)
	var mesh := _compose(p)
	_wheel_cache[key] = mesh
	return mesh

func _add_wheel(pos: Vector3, r: float, w: float, steer: bool, parent: Node3D = null) -> void:
	var st := Node3D.new()
	st.position = pos
	(parent if parent else self).add_child(st)
	var sp := Node3D.new()
	st.add_child(sp)
	var mi := MeshInstance3D.new()
	mi.mesh = _wheel_mesh(r, w, kind == "moto")
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	sp.add_child(mi)
	wheels.append({"spin": sp, "steer": st if steer else null, "r": r})

# ------------------------------------------------------------------ AUTOS
func _build_car() -> void:
	var shape: String = spec.get("shape", "sedan")
	var d: Dictionary
	if shape == "van":
		d = TrafficFactory.get_type("van")
		var mi := _mi(d["mesh"])
		mi.set_surface_override_material(0, _paint_mat)
		length = d["length"]
		width = d["width"]
		height = d["height"]
		return
	var p: Dictionary = SHAPES.get(shape, SHAPES["sedan"]).duplicate()
	p["no_wheels"] = true
	d = TrafficFactory._car(p)
	var bmi := _mi(d["mesh"])
	bmi.set_surface_override_material(0, _paint_mat)
	bmi.set_surface_override_material(4, _brake)
	length = d["length"]
	width = d["width"]
	height = d["height"]
	var wr: float = d["wr"]
	var wb: float = d["wb"]
	var tr: float = d["track"]
	for z in [-wb * 0.5, wb * 0.5]:
		for sx in [-1.0, 1.0]:
			_add_wheel(Vector3(sx * tr, wr, z), wr, 0.26 if shape != "trophy" else 0.38, z < 0.0)
	# extras
	var ex := _parts(["paint", "accent", "plastic", "chrome", "emit_blue", "emit_red", "emit_white", "head"])
	var L := length
	var deck: float = d["deck"]
	var roof: float = d["roof"]
	var hood: float = d["hood"]
	if spec.get("wing", false):
		var wy := deck + 0.32
		for sx in [-0.55, 0.55]:
			ex["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(sx, deck + 0.16, L * 0.5 - 0.3)), Vector3(0.06, 0.32, 0.18))
		ex["accent"].box(Transform3D(Basis(Vector3.RIGHT, 0.12), Vector3(0, wy, L * 0.5 - 0.28)), Vector3(width * 0.95, 0.05, 0.36))
		for sx in [-1.0, 1.0]:
			ex["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(sx * width * 0.48, wy - 0.05, L * 0.5 - 0.28)), Vector3(0.03, 0.2, 0.42))
		# difusor y faldones
		ex["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.2, L * 0.5 - 0.05)), Vector3(width * 0.8, 0.12, 0.3))
	if spec.get("stripes", false):
		for sx in [-0.22, 0.22]:
			ex["accent"].box(Transform3D(Basis.IDENTITY, Vector3(sx, hood + 0.012, -L * 0.3)), Vector3(0.22, 0.02, L * 0.35))
			ex["accent"].box(Transform3D(Basis.IDENTITY, Vector3(sx, roof + 0.012, L * 0.05)), Vector3(0.22, 0.02, L * 0.25))
	if spec.get("rally_lights", false):
		for k in 4:
			ex["head"].prism(Vector3.ZERO, 0.1, 0.1, 0.06, 10, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, -PI * 0.5), Vector3(-0.45 + k * 0.3, roof + 0.08, -0.1 - L * 0.08)))
		ex["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, roof + 0.04, -L * 0.08)), Vector3(1.2, 0.06, 0.12))
	if spec.get("police", false):
		ex["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, roof + 0.05, 0)), Vector3(1.1, 0.08, 0.3))
		ex["emit_blue"].box(Transform3D(Basis.IDENTITY, Vector3(-0.3, roof + 0.13, 0)), Vector3(0.45, 0.12, 0.25))
		ex["emit_red"].box(Transform3D(Basis.IDENTITY, Vector3(0.3, roof + 0.13, 0)), Vector3(0.45, 0.12, 0.25))
		for sx in [-1.0, 1.0]:
			ex["accent"].box(Transform3D(Basis.IDENTITY, Vector3(sx * (width * 0.5 - 0.02), d["belt"] - 0.25, 0.1)), Vector3(0.02, 0.35, 1.6))
	if spec.get("armor", false):
		ex["chrome"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.55, -L * 0.5 - 0.1)), Vector3(width * 0.9, 0.12, 0.12))
		ex["chrome"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.35, -L * 0.5 - 0.1)), Vector3(width * 0.9, 0.12, 0.12))
	# escapes
	for sx in [-0.35, 0.35]:
		ex["chrome"].prism(Vector3.ZERO, 0.055, 0.055, 0.25, 8, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(sx, 0.3, L * 0.5 - 0.05)))
	_mi(_compose(ex), null, false)
	_add_flames(Vector3(0, 0.3, L * 0.5 + 0.35), [-0.35, 0.35])

func _add_flames(base: Vector3, xs: Array) -> void:
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.12
	cone.height = 1.0
	cone.radial_segments = 8
	var fm := StandardMaterial3D.new()
	fm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	fm.albedo_color = Color(0.45, 0.75, 1.0, 0.9)
	fm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	fm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	for x in xs:
		var f := MeshInstance3D.new()
		f.mesh = cone
		f.material_override = fm
		f.rotation_degrees = Vector3(90, 0, 0)
		f.position = base + Vector3(x, 0, 0)
		f.visible = false
		f.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		body.add_child(f)
		flames.append(f)

# ------------------------------------------------------------------ MOTOS
func _build_moto() -> void:
	var shape: String = spec.get("shape", "naked")
	var p := _parts(["paint", "accent", "plastic", "chrome", "head", "brake", "rider", "skin"])
	var wr := 0.31
	var wb := 1.42
	var seat_y := 0.82
	match shape:
		"scooter":
			wr = 0.22
			wb = 1.3
			seat_y = 0.75
		"dirt":
			wr = 0.36
			wb = 1.48
			seat_y = 0.95
		"tourer":
			wb = 1.6
	length = wb + wr * 2.0 + 0.2
	width = 0.8
	height = 1.5
	var zf := -wb * 0.5
	var zr := wb * 0.5
	# chasis y horquilla
	p["plastic"].box(Transform3D(Basis(Vector3.RIGHT, -0.35), Vector3(0, wr + 0.35, zf + 0.25)), Vector3(0.1, 0.75, 0.08))
	p["chrome"].box(Transform3D(Basis(Vector3.RIGHT, 0.35), Vector3(0, wr + 0.32, zf + 0.12)), Vector3(0.14, 0.7, 0.06))
	p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, wr + 0.12, 0.05)), Vector3(0.32, 0.36, wb * 0.55))
	p["chrome"].box(Transform3D(Basis(Vector3.RIGHT, -0.15), Vector3(0, wr + 0.05, zr - 0.3)), Vector3(0.08, 0.08, 0.7))
	if shape == "scooter":
		p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.45, 0.25)), Vector3(0.44, 0.45, 0.95))
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, -0.25), Vector3(0, 0.75, zf + 0.25)), Vector3(0.42, 0.85, 0.12))
		p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.3, -0.15)), Vector3(0.36, 0.06, 0.5))
	else:
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, 0.12), Vector3(0, seat_y + 0.02, -0.18)), Vector3(0.36, 0.26, 0.55))
		p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, seat_y - 0.02, 0.32)), Vector3(0.28, 0.1, 0.55))
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, -0.2), Vector3(0, seat_y + 0.05, zr - 0.12)), Vector3(0.22, 0.1, 0.45))
	if shape in ["superbike", "tourer"]:
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, -0.5), Vector3(0, seat_y + 0.02, zf + 0.42)), Vector3(0.5, 0.55, 0.3))
		p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, wr + 0.32, -0.05)), Vector3(0.46, 0.4, 0.75))
		p["accent"].box(Transform3D(Basis(Vector3.RIGHT, -0.5), Vector3(0, seat_y + 0.28, zf + 0.5)), Vector3(0.36, 0.3, 0.03))
	if shape == "tourer":
		for sx in [-1.0, 1.0]:
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 0.32, 0.55, zr - 0.25)), Vector3(0.22, 0.38, 0.55))
	if shape == "dirt":
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, -0.3), Vector3(0, wr * 2 + 0.05, zf - 0.02)), Vector3(0.2, 0.04, 0.5))
		p["paint"].box(Transform3D(Basis(Vector3.RIGHT, 0.3), Vector3(0, wr * 2 + 0.1, zr - 0.05)), Vector3(0.2, 0.04, 0.6))
	p["chrome"].prism(Vector3.ZERO, 0.05, 0.06, 0.65, 8, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5 - 0.1), Vector3(0.18, wr + 0.08, zr - 0.6)))
	p["head"].box(Transform3D(Basis.IDENTITY, Vector3(0, seat_y - 0.05 if shape != "scooter" else 0.95, zf + 0.12)), Vector3(0.18, 0.12, 0.05))
	p["brake"].box(Transform3D(Basis.IDENTITY, Vector3(0, seat_y + 0.02, zr + 0.06)), Vector3(0.16, 0.06, 0.04))
	# manillar
	p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, seat_y + 0.2 if shape != "superbike" else seat_y + 0.08, zf + 0.35)), Vector3(0.7, 0.04, 0.04))
	# piloto
	var crouch := 0.55 if shape in ["superbike", "cafe"] else (0.25 if shape != "scooter" else 0.0)
	var hip := Vector3(0, seat_y + 0.12, 0.2)
	var chest := hip + Vector3(0, 0.55 - crouch * 0.2, -0.15 - crouch * 0.35)
	_limb(p["rider"], hip, chest, 0.36, 0.22)
	_limb(p["accent"], chest + Vector3(0, 0.1, -0.05), chest + Vector3(0, 0.34, -0.12 - crouch * 0.1), 0.26, 0.28)
	for sx in [-1.0, 1.0]:
		var hand := Vector3(sx * 0.32, seat_y + 0.2 if shape != "superbike" else seat_y + 0.1, zf + 0.36)
		var sh := chest + Vector3(sx * 0.2, 0.12, 0)
		_limb(p["rider"], sh, hand, 0.1, 0.1)
		var knee := hip + Vector3(sx * 0.2, -0.05, -0.38)
		_limb(p["rider"], hip + Vector3(sx * 0.12, 0, 0), knee, 0.13, 0.13)
		_limb(p["rider"], knee, Vector3(sx * 0.2, wr + 0.08, 0.05), 0.11, 0.11)
	_mi(_compose(p))
	_add_wheel(Vector3(0, wr, zf), wr, 0.14 if shape != "dirt" else 0.12, true, body)
	_add_wheel(Vector3(0, wr, zr), wr, 0.18 if shape != "scooter" else 0.14, false, body)
	_add_flames(Vector3(0.18, wr + 0.05, zr + 0.1), [0.0])

func _limb(md: MeshData, a: Vector3, b: Vector3, w: float, d: float) -> void:
	var dir := b - a
	var l := dir.length()
	var y := dir / maxf(l, 0.001)
	var x := Vector3.RIGHT if absf(y.dot(Vector3.RIGHT)) < 0.9 else Vector3.FORWARD
	var z := x.cross(y).normalized()
	x = y.cross(z).normalized()
	md.box(Transform3D(Basis(x, y, z), (a + b) * 0.5), Vector3(w, l + 0.04, d))

# ------------------------------------------------------------------ CAMIONES
func _build_truck() -> void:
	var cab: String = spec.get("shape", "cabover")
	var tr: String = spec.get("trailer", "box")
	var p := _parts(["paint", "accent", "plastic", "chrome", "glass", "head", "brake", "metal"])
	var Wd := 2.5
	var zf := 0.0
	# chasis del tractor (frente en z = -6)
	var front := -6.0
	match cab:
		"conventional":
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.7, front + 1.2)), Vector3(1.9, 1.15, 2.3))
			p["paint"].box(Transform3D(Basis(Vector3.RIGHT, 0.08), Vector3(0, 2.3, front + 1.25)), Vector3(1.6, 0.15, 2.1))
			p["chrome"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.75, front + 0.02)), Vector3(1.3, 1.1, 0.06))
			for k in 8:
				p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(-0.5 + k * 0.14, 1.75, front - 0.02)), Vector3(0.04, 0.95, 0.04))
			for sx in [-1.0, 1.0]:
				p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 1.1, 1.2, front + 1.2)), Vector3(0.45, 0.35, 2.2))
				p["chrome"].prism(Vector3(sx * 1.05, 1.6, front + 3.3), 0.1, 0.1, 3.4, 10)
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.4, front + 3.4)), Vector3(Wd, 2.2, 2.0))
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.6, front + 5.2)), Vector3(Wd, 2.6, 1.8))
			p["glass"].quad(Vector3(-1.05, 2.65, front + 2.38), Vector3(1.05, 2.65, front + 2.38), Vector3(1.0, 3.35, front + 2.55), Vector3(-1.0, 3.35, front + 2.55))
			for sx in [-1.0, 1.0]:
				p["head"].prism(Vector3.ZERO, 0.17, 0.17, 0.06, 12, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, -PI * 0.5), Vector3(sx * 0.8, 1.35, front + 0.02)))
			zf = front + 6.2
		"offroad":
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.0, front + 1.1)), Vector3(2.3, 1.4, 2.2))
			p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.3, front - 0.15)), Vector3(2.5, 1.0, 0.25))
			for k in 6:
				p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(-1.0 + k * 0.4, 1.9, front - 0.25)), Vector3(0.08, 1.2, 0.08))
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.8, front + 3.3)), Vector3(Wd, 2.6, 2.4))
			p["glass"].quad(Vector3(-1.15, 3.0, front + 2.08), Vector3(1.15, 3.0, front + 2.08), Vector3(1.1, 3.8, front + 2.2), Vector3(-1.1, 3.8, front + 2.2))
			for k in 4:
				p["head"].box(Transform3D(Basis.IDENTITY, Vector3(-0.6 + k * 0.4, 4.2, front + 2.3)), Vector3(0.22, 0.14, 0.1))
			p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 4.15, front + 2.4)), Vector3(1.8, 0.08, 0.2))
			for sx in [-1.0, 1.0]:
				p["head"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 0.95, 1.85, front - 0.02)), Vector3(0.3, 0.16, 0.04))
				p["chrome"].prism(Vector3(sx * 1.15, 2.2, front + 4.6), 0.1, 0.1, 3.2, 10)
			zf = front + 4.8
		_:
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.55, front + 1.25)), Vector3(Wd, 2.9, 2.5))
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 4.15, front + 1.4)), Vector3(Wd * 0.96, 0.4, 2.2))
			p["glass"].quad(Vector3(-1.15, 2.6, front - 0.02), Vector3(1.15, 2.6, front - 0.02), Vector3(1.12, 3.7, front + 0.05), Vector3(-1.12, 3.7, front + 0.05))
			p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.5, front - 0.04)), Vector3(1.8, 0.6, 0.06))
			p["accent"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.3, front - 0.03)), Vector3(2.2, 0.12, 0.04))
			for sx in [-1.0, 1.0]:
				p["head"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 0.9, 1.15, front - 0.03)), Vector3(0.4, 0.16, 0.04))
				p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 1.4, 3.3, front + 0.25)), Vector3(0.06, 0.55, 0.3))
			zf = front + 2.7
	p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 0.95, -2.0)), Vector3(1.1, 0.35, 8.0))
	p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.35, 0.8)), Vector3(1.6, 0.12, 1.4))
	for sx in [-1.0, 1.0]:
		p["chrome"].prism(Vector3.ZERO, 0.32, 0.32, 1.3, 12, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(sx * 1.0, 0.95, zf + 0.2)))
		p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 1.05, 1.3, 1.0)), Vector3(0.4, 0.1, 2.0))
	var rigid := tr in ["dump", "fire", "crane", "military"]
	var tmi := _mi(_compose(p))
	tmi.name = "Cab"
	var wr := 0.55
	_add_wheel(Vector3(-1.05, wr, front + 1.2), wr, 0.4, true)
	_add_wheel(Vector3(1.05, wr, front + 1.2), wr, 0.4, true)
	for z in ([0.4, 1.8] if not rigid else [2.0, 3.4]):
		for sx in [-1.0, 1.0]:
			_add_wheel(Vector3(sx * 1.0, wr, z), wr, 0.55, false)
	length = 8.0
	width = Wd
	height = 4.0
	if rigid:
		var rp := _parts(["paint", "accent", "plastic", "metal", "canvas", "brake", "emit_blue", "emit_red", "chrome"])
		match tr:
			"dump":
				rp["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.4, 1.6)), Vector3(2.5, 1.6, 4.6))
				rp["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 3.3, 1.6)), Vector3(2.2, 0.2, 4.2))
			"fire":
				rp["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.4, 1.6)), Vector3(2.5, 2.6, 4.6))
				for k in 4:
					rp["chrome"].box(Transform3D(Basis.IDENTITY, Vector3(1.26, 1.8 + (k % 2) * 1.0, 0.2 + (k / 2) * 2.4)), Vector3(0.02, 0.8, 2.2))
				rp["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 3.9, 1.6)), Vector3(0.6, 0.3, 5.5))
				rp["emit_blue"].box(Transform3D(Basis.IDENTITY, Vector3(-0.6, 4.45, front + 1.3)), Vector3(0.6, 0.15, 0.3))
				rp["emit_red"].box(Transform3D(Basis.IDENTITY, Vector3(0.6, 4.45, front + 1.3)), Vector3(0.6, 0.15, 0.3))
			"crane":
				rp["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.0, 2.4)), Vector3(2.2, 1.2, 2.0))
				rp["accent"].box(Transform3D(Basis(Vector3.RIGHT, -0.12), Vector3(0, 3.0, -1.0)), Vector3(0.5, 0.5, 7.0))
			"military":
				rp["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.7, 1.6)), Vector3(2.5, 0.2, 4.8))
				rp["canvas"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.8, 1.6)), Vector3(2.5, 2.0, 4.8))
		rp["brake"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.1, 4.0)), Vector3(2.0, 0.15, 0.05))
		_mi(_compose(rp))
		length = 10.5
		return
	# remolque articulado: pivote en la quinta rueda (z = 0.8)
	trailer = Node3D.new()
	trailer.position = Vector3(0, 0, 0.8)
	add_child(trailer)
	trailer_len = 13.0
	_trailer_body(trailer, tr, 13.0)
	if tr == "double":
		trailer2 = Node3D.new()
		trailer2.position = Vector3(0, 0, 13.5)
		trailer.add_child(trailer2)
		_trailer_body(trailer2, "container", 11.0)
	length = 8.0 + trailer_len

func _trailer_body(root: Node3D, tr: String, L: float) -> void:
	var p := _parts(["paint", "accent", "plastic", "metal", "chrome", "wood", "brake", "canvas"])
	var z0 := -0.6
	var z1 := z0 + L
	var zc := (z0 + z1) * 0.5
	p["plastic"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.3, zc)), Vector3(2.4, 0.3, L))
	match tr:
		"box", "reefer":
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.85, zc)), Vector3(2.55, 2.9, L))
			p["accent"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.2, zc)), Vector3(2.57, 0.4, L * 0.9))
			if tr == "reefer":
				p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 3.2, z0 - 0.25)), Vector3(2.0, 1.6, 0.5))
		"container":
			p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.75, zc)), Vector3(2.5, 2.6, L - 0.4))
			for k in int(L / 0.6):
				p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(1.26, 2.75, z0 + 0.3 + k * 0.6)), Vector3(0.04, 2.5, 0.1))
				p["paint"].box(Transform3D(Basis.IDENTITY, Vector3(-1.26, 2.75, z0 + 0.3 + k * 0.6)), Vector3(0.04, 2.5, 0.1))
		"logs":
			for k in 4:
				p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(-1.2, 2.4, z0 + 1.5 + k * (L - 3.0) / 3.0)), Vector3(0.12, 2.0, 0.12))
				p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(1.2, 2.4, z0 + 1.5 + k * (L - 3.0) / 3.0)), Vector3(0.12, 2.0, 0.12))
			for row in 3:
				for k in 4 - row:
					var x := -0.9 + k * 0.6 + row * 0.3
					p["wood"].prism(Vector3.ZERO, 0.3, 0.3, L - 0.8, 8, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(x, 1.75 + row * 0.52, z0 + 0.4)))
		"tanker":
			p["chrome"].prism(Vector3.ZERO, 1.25, 1.25, L - 1.0, 16, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(0, 2.75, z0 + 0.5)))
			p["paint"].prism(Vector3.ZERO, 1.27, 1.27, 1.0, 16, Color.WHITE, Vector2.ZERO, false, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(0, 2.75, zc - 0.5)))
		"flatbed":
			p["wood"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.5, zc)), Vector3(2.5, 0.12, L))
			for k in 3:
				p["accent"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.3, z0 + 2.0 + k * 4.0)), Vector3(2.2, 1.5, 3.2))
		"carrier":
			p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 3.0, zc)), Vector3(2.5, 0.12, L))
			for sx in [-1.0, 1.0]:
				for k in 5:
					p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(sx * 1.2, 2.3, z0 + 1.0 + k * (L - 2.0) / 4.0)), Vector3(0.1, 2.0, 0.1))
			for k in 3:
				var c := TrafficFactory.get_type(["sedan", "hatch", "suv"][k])
				var mi := MeshInstance3D.new()
				mi.mesh = c["mesh"]
				mi.position = Vector3(0, 1.45, z0 + 2.4 + k * 4.2)
				mi.set_surface_override_material(0, TrafficFactory.paint_material(TrafficFactory.PAINTS[(k * 3 + 1) % TrafficFactory.PAINTS.size()]))
				root.add_child(mi)
				var mi2 := MeshInstance3D.new()
				mi2.mesh = c["mesh"]
				mi2.position = Vector3(0, 3.06, z0 + 2.4 + k * 4.2)
				mi2.set_surface_override_material(0, TrafficFactory.paint_material(TrafficFactory.PAINTS[(k * 5 + 2) % TrafficFactory.PAINTS.size()]))
				root.add_child(mi2)
		"heavy":
			p["metal"].box(Transform3D(Basis.IDENTITY, Vector3(0, 1.0, zc)), Vector3(3.0, 0.3, L))
			p["accent"].box(Transform3D(Basis.IDENTITY, Vector3(0, 2.4, zc)), Vector3(2.8, 2.4, 5.0))
			p["accent"].box(Transform3D(Basis(Vector3.RIGHT, 0.3), Vector3(0, 3.0, zc - 4.0)), Vector3(0.6, 0.5, 5.0))
	p["brake"].box(Transform3D(Basis.IDENTITY, Vector3(-0.9, 1.15, z1 + 0.02)), Vector3(0.4, 0.14, 0.04))
	p["brake"].box(Transform3D(Basis.IDENTITY, Vector3(0.9, 1.15, z1 + 0.02)), Vector3(0.4, 0.14, 0.04))
	var mi3 := MeshInstance3D.new()
	mi3.mesh = _compose(p)
	mi3.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if not lite else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mi3)
	for z in [z1 - 3.2, z1 - 1.8]:
		for sx in [-1.0, 1.0]:
			_add_wheel(Vector3(sx * 1.0, 0.52, z), 0.52, 0.5, false, root)

# ------------------------------------------------------------------ AVIONES
func _build_plane() -> void:
	var shape: String = spec.get("shape", "fighter")
	var p := _parts(["paint", "accent", "plastic", "glass", "metal", "emit_red", "emit_white"])
	var L := 15.0
	var R := 0.75
	var span := 9.5
	var sweep := 0.6
	var wing_root := 4.2
	var wing_tip := 1.4
	var wing_z := 1.5
	var twin := false
	var canard := false
	var delta := false
	var prop := false
	var high := false
	var cockpit_z := -4.0
	match shape:
		"highwing":
			L = 8.0; R = 0.62; span = 11.0; sweep = 0.0; wing_root = 1.6; wing_tip = 1.4; wing_z = -0.6; prop = true; high = true; cockpit_z = -1.2
		"trainer":
			L = 10.0; R = 0.6; span = 11.0; sweep = 0.05; wing_root = 2.4; wing_tip = 1.2; wing_z = 0.0; prop = true; cockpit_z = -1.2
		"warbird":
			L = 9.5; R = 0.65; span = 11.2; sweep = 0.05; wing_root = 2.6; wing_tip = 1.0; wing_z = -0.2; prop = true; cockpit_z = 0.2
		"trainerjet":
			L = 12.0; R = 0.65; span = 9.0; sweep = 0.4; wing_root = 3.0; wing_tip = 1.2; wing_z = 0.8; cockpit_z = -3.2
		"light":
			L = 14.0; R = 0.6; span = 8.0; sweep = 0.45; wing_root = 3.6; wing_tip = 0.9; wing_z = 1.0
		"delta":
			L = 14.5; R = 0.7; span = 9.0; delta = true; wing_root = 8.5; wing_tip = 0.6; wing_z = 2.6
		"fighter":
			L = 15.0; R = 0.72; span = 9.6; sweep = 0.7; wing_root = 4.6; wing_tip = 1.2; wing_z = 1.4
		"twin":
			L = 17.0; R = 0.8; span = 12.0; sweep = 0.5; wing_root = 4.8; wing_tip = 1.6; wing_z = 1.8; twin = true
		"canard":
			L = 15.3; R = 0.72; span = 10.8; delta = true; wing_root = 7.0; wing_tip = 0.8; wing_z = 2.4; canard = true
		"heavy":
			L = 21.0; R = 0.9; span = 14.5; sweep = 0.6; wing_root = 6.5; wing_tip = 1.6; wing_z = 2.6; twin = true
		"attacker":
			L = 16.0; R = 0.8; span = 17.5; sweep = 0.0; wing_root = 3.2; wing_tip = 1.8; wing_z = 0.8
		"vtol":
			L = 14.0; R = 0.8; span = 9.2; sweep = 0.55; wing_root = 4.0; wing_tip = 1.2; wing_z = 0.6; high = true
		"stealth":
			L = 19.0; R = 0.85; span = 13.6; sweep = 0.72; wing_root = 8.0; wing_tip = 1.4; wing_z = 3.0; twin = true
		"stealth1":
			L = 15.7; R = 0.85; span = 10.7; sweep = 0.6; wing_root = 6.0; wing_tip = 1.2; wing_z = 2.2; twin = true
		"concept":
			L = 18.0; R = 0.8; span = 12.0; delta = true; wing_root = 10.0; wing_tip = 0.4; wing_z = 3.0; canard = true; twin = true
	length = L
	width = span
	height = 3.5
	var nose := -L * 0.5
	var tail := L * 0.5
	# fuselaje (loft por anillos octogonales)
	var rings := []
	var n := 10
	for i in n + 1:
		var t := float(i) / n
		var z := lerpf(nose, tail, t)
		var r := R * (sqrt(clampf(t / 0.28, 0.0, 1.0)) if not prop else (0.55 + 0.45 * sqrt(clampf(t / 0.15, 0.0, 1.0))))
		r *= lerpf(1.0, 0.55, smoothstep(0.7, 1.0, t))
		var wsc := 1.0 + (0.6 if (twin and t > 0.3 and t < 0.95) else 0.0)
		rings.append([z, maxf(r, 0.02), wsc])
	for i in n:
		var A: Array = rings[i]
		var B: Array = rings[i + 1]
		for k in 8:
			var a0 := TAU * k / 8.0
			var a1 := TAU * (k + 1) / 8.0
			var pa0 := Vector3(cos(a0) * A[1] * A[2], sin(a0) * A[1], A[0])
			var pa1 := Vector3(cos(a1) * A[1] * A[2], sin(a1) * A[1], A[0])
			var pb0 := Vector3(cos(a0) * B[1] * B[2], sin(a0) * B[1], B[0])
			var pb1 := Vector3(cos(a1) * B[1] * B[2], sin(a1) * B[1], B[0])
			var mdk: MeshData = p["paint"] if not (shape in ["stealth", "stealth1"] and k < 4 and false) else p["accent"]
			mdk.quad(pa1, pa0, pb0, pb1)
	# cabina
	var cz := cockpit_z
	p["glass"].box(Transform3D(Basis(Vector3.RIGHT, -0.05), Vector3(0, R * 0.85, cz)), Vector3(R * 0.9, R * 0.7, L * (0.18 if not prop else 0.25)), Color.WHITE, Vector2.ZERO, 5)
	# alas
	var y_w := (R * 0.75) if high else (-R * 0.25)
	for sx in [-1.0, 1.0]:
		var root_le := Vector3(sx * R * 0.9, y_w, wing_z - wing_root * 0.5)
		var root_te := Vector3(sx * R * 0.9, y_w, wing_z + wing_root * 0.5)
		var tip_x = sx * span * 0.5
		var tip_le := Vector3(tip_x, y_w + 0.05, root_le.z + (span * 0.5) * (sweep if not delta else 1.0) * (1.0 if not delta else (wing_root - wing_tip) / (span * 0.5)))
		var tip_te := tip_le + Vector3(0, 0, wing_tip)
		if delta:
			tip_te = Vector3(tip_x, y_w + 0.05, root_te.z)
			tip_le = tip_te - Vector3(0, 0, wing_tip)
		var th := Vector3(0, 0.12, 0)
		if sx > 0:
			p["paint"].quad(root_le + th, root_te + th, tip_te + th * 0.5, tip_le + th * 0.5)
			p["paint"].quad(root_te - th, root_le - th, tip_le - th * 0.5, tip_te - th * 0.5)
		else:
			p["paint"].quad(root_te + th, root_le + th, tip_le + th * 0.5, tip_te + th * 0.5)
			p["paint"].quad(root_le - th, root_te - th, tip_te - th * 0.5, tip_le - th * 0.5)
		if sx > 0:
			p["paint"].quad(root_le + th, tip_le + th * 0.5, tip_le - th * 0.5, root_le - th)
		else:
			p["paint"].quad(tip_le + th * 0.5, root_le + th, root_le - th, tip_le - th * 0.5)
		# luces de navegación
		(p["emit_red"] if sx < 0 else p["emit_white"]).box(Transform3D(Basis.IDENTITY, tip_le + Vector3(0, 0, wing_tip * 0.5)), Vector3(0.15, 0.15, 0.3))
		# misiles bajo el ala (cazas)
		if not prop:
			for k in 2:
				var mx = sx * lerpf(span * 0.2, span * 0.42, k)
				p["metal"].prism(Vector3.ZERO, 0.11, 0.11, 2.8, 6, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(mx, y_w - 0.3, wing_z - 1.2)))
	# cola: horizontales y verticales
	var tz := tail - 1.6
	var hspan := span * 0.36 if not delta else 0.0
	if hspan > 0.0:
		for sx in [-1.0, 1.0]:
			var a := Vector3(sx * R * 0.5, 0.0, tz - 1.0)
			var b := Vector3(sx * R * 0.5, 0.0, tz + 1.2)
			var c := Vector3(sx * hspan, 0.0, tz + 1.4)
			var d := Vector3(sx * hspan, 0.0, tz + 0.4)
			if sx > 0:
				p["paint"].quad(a, b, c, d)
				p["paint"].quad(b, a, d, c)
			else:
				p["paint"].quad(b, a, d, c)
				p["paint"].quad(a, b, c, d)
	var fins := [0.0] if not twin else [-R * 1.0, R * 1.0]
	for fx in fins:
		var cant := 0.0 if not twin else signf(fx) * 0.35
		var bse := Vector3(fx, R * 0.6, tz - 1.6)
		var top := Vector3(fx + cant * 2.5, R * 0.6 + (3.0 if not prop else 1.8), tz + 0.4)
		var top2 := top + Vector3(0, 0, 1.2)
		var bse2 := Vector3(fx, R * 0.6, tz + 1.4)
		p["accent"].quad(bse, bse2, top2, top)
		p["accent"].quad(bse2, bse, top, top2)
	if canard:
		for sx in [-1.0, 1.0]:
			var a2 := Vector3(sx * R * 0.7, R * 0.3, cz + 1.6)
			var c2 := Vector3(sx * (R + 1.6), R * 0.35, cz + 2.4)
			p["paint"].quad(a2, a2 + Vector3(0, 0, 1.4), c2 + Vector3(0, 0, 0.4), c2)
			p["paint"].quad(a2 + Vector3(0, 0, 1.4), a2, c2, c2 + Vector3(0, 0, 0.4))
	# toberas / hélice
	if prop:
		var hub := Node3D.new()
		hub.position = Vector3(0, 0, nose - 0.15)
		body.add_child(hub)
		var bl := _parts(["plastic", "metal"])
		bl["metal"].prism(Vector3.ZERO, 0.25, 0.02, 0.5, 8, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3.RIGHT, -PI * 0.5), Vector3.ZERO))
		for k in 3:
			bl["plastic"].box(Transform3D(Basis(Vector3.FORWARD, TAU * k / 3.0), Vector3(0, 0.9, 0)), Vector3(0.18, 1.7, 0.04))
		var hm := MeshInstance3D.new()
		hm.mesh = _compose(bl)
		hub.add_child(hm)
		props.append(hub)
	else:
		var noz := [0.0] if not (twin or shape == "heavy") else [-R * 0.45, R * 0.45]
		for nx in noz:
			p["metal"].prism(Vector3.ZERO, R * 0.45, R * 0.4, 0.8, 10, Color.WHITE, Vector2.ZERO, false, Transform3D(Basis(Vector3.RIGHT, PI * 0.5), Vector3(nx, 0, tail - 0.3)))
		_add_flames(Vector3(0, 0, tail + 0.6), noz)
		for f in flames:
			f.scale = Vector3(R * 3.0, 2.5, R * 3.0)
	# tren de aterrizaje (se oculta en vuelo)
	var gear := _parts(["plastic", "metal"])
	for gp in [Vector3(0, -R - 0.5, nose * 0.6), Vector3(-1.4, -R - 0.5, wing_z + 0.8), Vector3(1.4, -R - 0.5, wing_z + 0.8)]:
		gear["metal"].box(Transform3D(Basis.IDENTITY, gp + Vector3(0, 0.45, 0)), Vector3(0.12, 0.9, 0.12))
		gear["plastic"].prism(Vector3.ZERO, 0.32, 0.32, 0.2, 10, Color.WHITE, Vector2.ZERO, true, Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), gp + Vector3(0.1, 0, 0)))
	var gmi := MeshInstance3D.new()
	gmi.name = "Gear"
	gmi.mesh = _compose(gear)
	body.add_child(gmi)
	_mi(_compose(p))
	# altura sobre el suelo con el tren: ruedas a y = 0
	body.position.y = R + 0.82

func set_gear(down: bool) -> void:
	var g := body.get_node_or_null("Gear")
	if g:
		g.visible = down

# ------------------------------------------------------------------ ACTUALIZACIÓN
func update_visual(dt: float, speed_ms: float, steer: float) -> void:
	_wheel_a += speed_ms * dt / 0.34
	_steer = lerpf(_steer, steer * 0.42, clampf(dt * 10.0, 0.0, 1.0))
	for w in wheels:
		(w["spin"] as Node3D).rotation.x = -_wheel_a * 0.34 / w["r"]
		if w["steer"] != null:
			(w["steer"] as Node3D).rotation.y = -_steer
	for pr in props:
		pr.rotation.z += dt * (8.0 + speed_ms * 0.8)
	if kind == "moto":
		lean = lerpf(lean, -steer * clampf(speed_ms / 25.0, 0.0, 1.0) * 0.55, clampf(dt * 6.0, 0.0, 1.0))
		body.rotation.z = lean
	_flame_t += dt
	for f in flames:
		f.visible = nitro_on
		if nitro_on and kind != "plane":
			f.scale = Vector3(1.0, 0.8 + 0.35 * sin(_flame_t * 47.0 + f.position.x * 9.0) + randf() * 0.2, 1.0)
	_brake.emission_energy_multiplier = 6.0 if brake_on else 1.4

## Ángulo del remolque respecto a la cabina (rad); el modo lo calcula con la curvatura.
func set_trailer_yaw(a: float) -> void:
	if trailer:
		trailer.rotation.y = a
		if trailer2:
			trailer2.rotation.y = a * 0.8
