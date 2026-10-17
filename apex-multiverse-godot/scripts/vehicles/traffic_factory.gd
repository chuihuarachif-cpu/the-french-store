class_name TrafficFactory
## Vehículos de tráfico procedurales (sedán, hatchback, SUV, pickup, furgoneta, camión, autobús).
## Carrocería por secciones transversales (loft) con superficies separadas:
## 0 pintura (color por instancia), 1 vidrio, 2 plástico oscuro, 3 cromo, 4 luz trasera, 5 faro, 6 neumático, 7 llanta.

const TYPES := ["sedan", "hatch", "suv", "pickup", "van", "semi", "bus", "coupe"]
const PAINTS := [Color(0.92, 0.92, 0.94), Color(0.08, 0.08, 0.09), Color(0.55, 0.57, 0.6), Color(0.1, 0.18, 0.45), Color(0.6, 0.06, 0.05),
	Color(0.85, 0.75, 0.2), Color(0.12, 0.3, 0.2), Color(0.3, 0.32, 0.36), Color(0.95, 0.45, 0.08), Color(0.25, 0.08, 0.3), Color(0.75, 0.78, 0.82)]

static var _meshes := {}
static var _mats := {}

static func mats() -> Dictionary:
	if not _mats.is_empty():
		return _mats
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.03, 0.045, 0.06)
	glass.roughness = 0.04
	glass.metallic = 0.3
	var plastic := StandardMaterial3D.new()
	plastic.albedo_color = Color(0.035, 0.035, 0.04)
	plastic.roughness = 0.6
	var chrome := StandardMaterial3D.new()
	chrome.albedo_color = Color(0.85, 0.86, 0.9)
	chrome.metallic = 1.0
	chrome.roughness = 0.12
	var tail := StandardMaterial3D.new()
	tail.albedo_color = Color(0.5, 0.0, 0.0)
	tail.emission_enabled = true
	tail.emission = Color(1.0, 0.05, 0.03)
	tail.emission_energy_multiplier = 2.6
	var head := StandardMaterial3D.new()
	head.albedo_color = Color(0.9, 0.92, 1.0)
	head.emission_enabled = true
	head.emission = Color(0.95, 0.95, 1.0)
	head.emission_energy_multiplier = 3.0
	var tire := StandardMaterial3D.new()
	tire.albedo_color = Color(0.03, 0.03, 0.03)
	tire.roughness = 0.85
	var rim := StandardMaterial3D.new()
	rim.albedo_color = Color(0.7, 0.72, 0.75)
	rim.metallic = 0.9
	rim.roughness = 0.25
	var paint := StandardMaterial3D.new()
	paint.albedo_color = Color.WHITE
	paint.metallic = 0.45
	paint.roughness = 0.3
	paint.clearcoat_enabled = true
	paint.clearcoat = 0.8
	paint.clearcoat_roughness = 0.1
	_mats = {"paint": paint, "glass": glass, "plastic": plastic, "chrome": chrome, "tail": tail, "head": head, "tire": tire, "rim": rim}
	return _mats

static func paint_material(c: Color) -> StandardMaterial3D:
	var key := "paint_" + c.to_html()
	if not _mats.has(key):
		var m: StandardMaterial3D = mats()["paint"].duplicate()
		m.albedo_color = c
		_mats[key] = m
	return _mats[key]

## Secciones: {z, w (semi-ancho), y0 (bajo), y1 (cintura), y2 (capó/techo del cuerpo)}
static func _ring(sec: Dictionary) -> PackedVector2Array:
	var w: float = sec["w"]
	var y0: float = sec["y0"]
	var y1: float = sec["y1"]
	var y2: float = sec["y2"]
	var r := PackedVector2Array()
	var pts := [
		Vector2(-w * 0.93, y0), Vector2(-w * 0.99, y0 + (y1 - y0) * 0.3), Vector2(-w, y0 + (y1 - y0) * 0.75), Vector2(-w * 0.985, y1),
		Vector2(-w * 0.94, y1 + (y2 - y1) * 0.55), Vector2(-w * 0.82, y2 - 0.01), Vector2(-w * 0.45, y2), Vector2(0, y2 + 0.01)]
	for p in pts:
		r.append(p)
	for i in range(pts.size() - 2, -1, -1):
		r.append(Vector2(-pts[i].x, pts[i].y))
	return r

static func _loft(st: SurfaceTool, secs: Array, ring_fn: Callable, flip := false) -> void:
	var rings := []
	for s in secs:
		rings.append(ring_fn.call(s))
	for i in secs.size() - 1:
		var za: float = secs[i]["z"]
		var zb: float = secs[i + 1]["z"]
		var ra: PackedVector2Array = rings[i]
		var rb: PackedVector2Array = rings[i + 1]
		for k in ra.size() - 1:
			var a0 := Vector3(ra[k].x, ra[k].y, za)
			var a1 := Vector3(ra[k + 1].x, ra[k + 1].y, za)
			var b0 := Vector3(rb[k].x, rb[k].y, zb)
			var b1 := Vector3(rb[k + 1].x, rb[k + 1].y, zb)
			var u0 := float(k) / ra.size()
			var u1 := float(k + 1) / ra.size()
			var tri := [[a0, Vector2(u0, za)], [a1, Vector2(u1, za)], [b1, Vector2(u1, zb)], [a0, Vector2(u0, za)], [b1, Vector2(u1, zb)], [b0, Vector2(u0, zb)]]
			if flip:
				tri = [tri[0], tri[2], tri[1], tri[3], tri[5], tri[4]]
			for v in tri:
				st.set_normal(Vector3.UP)
				st.set_uv(v[1])
				st.add_vertex(v[0])

static func _cap(st: SurfaceTool, ring: PackedVector2Array, z: float, facing_back: bool) -> void:
	var c := Vector2.ZERO
	for p in ring:
		c += p
	c /= ring.size()
	for k in ring.size() - 1:
		var a := Vector3(c.x, c.y, z)
		var b := Vector3(ring[k].x, ring[k].y, z)
		var d := Vector3(ring[k + 1].x, ring[k + 1].y, z)
		var n := Vector3(0, 0, 1 if facing_back else -1)
		var order := [a, d, b] if facing_back else [a, b, d]
		for v in order:
			st.set_normal(n)
			st.set_uv(Vector2(v.x, v.y))
			st.add_vertex(v)

static func _smooth(st: SurfaceTool) -> void:
	st.index()
	st.generate_normals()

static func _wheel(sts: Dictionary, pos: Vector3, radius: float, width: float) -> void:
	var rot := Transform3D(Basis(Vector3(0, 0, 1), PI * 0.5), Vector3.ZERO)
	var side := signf(pos.x)
	var xf := Transform3D(rot.basis, pos + Vector3(-width * 0.5 * side, 0, 0))
	var axis := Transform3D(Basis(Vector3(0, 0, 1), -PI * 0.5 * side), pos - Vector3(width * 0.5 * side, 0, 0))
	MeshKit.cylinder(sts["tire"], Vector3.ZERO, radius, radius, width, 18, true, axis)
	var hub := Transform3D(axis.basis, pos + Vector3(width * 0.5 * side + 0.005 * side, 0, 0))
	MeshKit.cylinder(sts["rim"], Vector3.ZERO, radius * 0.66, radius * 0.6, 0.02, 14, true, hub)
	MeshKit.cylinder(sts["plastic"], Vector3.ZERO, radius * 0.2, radius * 0.16, 0.03, 8, true, hub)

static func _new_sts() -> Dictionary:
	var d := {}
	for k in ["paint", "glass", "plastic", "chrome", "tail", "head", "tire", "rim"]:
		d[k] = MeshKit.begin()
	return d

static func _finish(sts: Dictionary, smooth_keys := ["paint", "glass"]) -> ArrayMesh:
	var mesh := ArrayMesh.new()
	var m := mats()
	for k in ["paint", "glass", "plastic", "chrome", "tail", "head", "tire", "rim"]:
		var st: SurfaceTool = sts[k]
		if k in smooth_keys:
			_smooth(st)
		st.set_material(m[k])
		var arrays := st.commit_to_arrays()
		if arrays[Mesh.ARRAY_VERTEX] == null or (arrays[Mesh.ARRAY_VERTEX] as PackedVector3Array).is_empty():
			# Mantén índices de superficie estables con una superficie vacía mínima.
			var tmp := MeshKit.begin()
			tmp.set_normal(Vector3.UP)
			for v in [Vector3.ZERO, Vector3(0.001, 0, 0), Vector3(0, 0, 0.001)]:
				tmp.add_vertex(v)
			arrays = tmp.commit_to_arrays()
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
		mesh.surface_set_material(mesh.get_surface_count() - 1, m[k])
	return mesh

## Turismo genérico parametrizado.
static func _car(p: Dictionary) -> Dictionary:
	var sts := _new_sts()
	var L: float = p["L"]
	var W: float = p["W"] * 0.5
	var y0: float = p["y0"]
	var belt: float = p["belt"]
	var hood: float = p["hood"]
	var deck: float = p["deck"]
	var roof: float = p["roof"]
	var zf := -L * 0.5
	var zr := L * 0.5
	# Perfil del cuerpo inferior (frente redondeado y trasera)
	var secs := []
	var n := 14
	for i in n + 1:
		var t := float(i) / n
		var z := lerpf(zf, zr, t)
		var nose := clampf(t / 0.09, 0.0, 1.0)
		var tailr := clampf((1.0 - t) / 0.06, 0.0, 1.0)
		var e: float = min(sin(nose * PI * 0.5), sin(tailr * PI * 0.5))
		var top := lerpf(hood, deck, smoothstep(0.35, 0.75, t))
		if p.get("bed", false) and t > 0.55:
			top = deck
		secs.append({"z": z, "w": W * (0.86 + 0.14 * e), "y0": y0 + (1.0 - e) * 0.08, "y1": lerpf(y0 + 0.12, belt, 0.4 + 0.6 * e), "y2": lerpf(belt - 0.05, top, 0.3 + 0.7 * e)})
	_loft(sts["paint"], secs, _ring)
	_cap(sts["paint"], _ring(secs[0]), secs[0]["z"], false)
	_cap(sts["paint"], _ring(secs[-1]), secs[-1]["z"], true)
	# Habitáculo (greenhouse)
	var ca: float = p["cab_a"]  # base del parabrisas (0..1 del largo)
	var cb: float = p["cab_b"]  # base de la luneta trasera
	var cw := W * 0.84
	var gsecs := []
	var m := 10
	for i in m + 1:
		var t := float(i) / m
		var z := lerpf(zf + L * ca, zf + L * cb, t)
		var rise: float = smoothstep(0.0, p["ws"], t) * smoothstep(1.0, 1.0 - p["rs"], t)
		var base_y := lerpf(hood, deck, smoothstep(0.35, 0.75, lerpf(ca, cb, t))) - 0.02
		gsecs.append({"z": z, "w": cw * (0.93 + 0.07 * rise), "y0": base_y, "top": lerpf(base_y + 0.02, roof, rise), "roof": rise > 0.97})
	for i in m:
		var A: Dictionary = gsecs[i]
		var B: Dictionary = gsecs[i + 1]
		var ra := [Vector2(-A["w"], A["y0"]), Vector2(-A["w"] * 0.8, A["top"] - 0.04), Vector2(-A["w"] * 0.55, A["top"]), Vector2(A["w"] * 0.55, A["top"]), Vector2(A["w"] * 0.8, A["top"] - 0.04), Vector2(A["w"], A["y0"])]
		var rb := [Vector2(-B["w"], B["y0"]), Vector2(-B["w"] * 0.8, B["top"] - 0.04), Vector2(-B["w"] * 0.55, B["top"]), Vector2(B["w"] * 0.55, B["top"]), Vector2(B["w"] * 0.8, B["top"] - 0.04), Vector2(B["w"], B["y0"])]
		for k in 5:
			var is_roof: bool = k >= 1 and k <= 3 and A["roof"] and B["roof"]
			var st: SurfaceTool = sts["paint"] if is_roof else sts["glass"]
			var a0 := Vector3(ra[k].x, ra[k].y, A["z"])
			var a1 := Vector3(ra[k + 1].x, ra[k + 1].y, A["z"])
			var b0 := Vector3(rb[k].x, rb[k].y, B["z"])
			var b1 := Vector3(rb[k + 1].x, rb[k + 1].y, B["z"])
			for v in [[a0, Vector2(k, A["z"])], [a1, Vector2(k + 1, A["z"])], [b1, Vector2(k + 1, B["z"])], [a0, Vector2(k, A["z"])], [b1, Vector2(k + 1, B["z"])], [b0, Vector2(k, B["z"])]]:
				st.set_normal(Vector3.UP)
				st.set_uv(v[1])
				st.add_vertex(v[0])
	# Pilares (franjas de pintura sobre el vidrio lateral)
	for zz in [zf + L * ca + 0.02, zf + L * cb - 0.05]:
		pass
	# Detalles traseros
	var rear_z := zr + 0.005
	var ty := belt - 0.06
	MeshKit.box(sts["tail"], Vector3(-W * 0.62, ty, rear_z - 0.02), Vector3(W * 0.55, 0.12, 0.05))
	MeshKit.box(sts["tail"], Vector3(W * 0.62, ty, rear_z - 0.02), Vector3(W * 0.55, 0.12, 0.05))
	MeshKit.box(sts["tail"], Vector3(0, ty + 0.02, rear_z - 0.03), Vector3(W * 0.7, 0.025, 0.04))
	MeshKit.box(sts["plastic"], Vector3(0, y0 + 0.1, rear_z - 0.02), Vector3(W * 1.86, 0.16, 0.08))
	MeshKit.box(sts["chrome"], Vector3(0, y0 + 0.32, rear_z), Vector3(0.52, 0.12, 0.02))
	# Frente
	var fz := zf - 0.005
	MeshKit.box(sts["head"], Vector3(-W * 0.66, hood - 0.12, fz + 0.03), Vector3(W * 0.42, 0.09, 0.06))
	MeshKit.box(sts["head"], Vector3(W * 0.66, hood - 0.12, fz + 0.03), Vector3(W * 0.42, 0.09, 0.06))
	MeshKit.box(sts["plastic"], Vector3(0, y0 + 0.22, fz + 0.02), Vector3(W * 0.9, 0.18, 0.05))
	MeshKit.box(sts["plastic"], Vector3(0, y0 + 0.06, fz + 0.03), Vector3(W * 1.8, 0.1, 0.08))
	# Espejos
	for sx in [-1, 1]:
		MeshKit.box(sts["paint"], Vector3(sx * (cw + 0.12), belt + 0.08, zf + L * ca + 0.25), Vector3(0.14, 0.11, 0.2))
	# Ruedas
	var wr: float = p["wr"]
	var wb: float = p["wb"]
	if not p.get("no_wheels", false):
		for z in [-wb * 0.5 + p.get("wo", 0.0), wb * 0.5 + p.get("wo", 0.0)]:
			for sx in [-1, 1]:
				_wheel(sts, Vector3(sx * (W - 0.12), wr, z), wr, 0.24)
	if p.get("bed", false):
		MeshKit.box(sts["plastic"], Vector3(0, deck - 0.05, zf + L * 0.79), Vector3(W * 1.7, 0.04, L * 0.38))
	return {"mesh": _finish(sts), "length": L, "width": W * 2.0, "height": roof, "wr": wr, "wb": wb, "wo": p.get("wo", 0.0), "track": W - 0.12, "belt": belt, "deck": deck, "roof": roof, "hood": hood}

static func _boxy(L: float, W: float, H: float, cab_len: float, trailer: bool, bus: bool) -> Dictionary:
	var sts := _new_sts()
	var hw := W * 0.5
	var zf := -L * 0.5
	var zr := L * 0.5
	if trailer:
		# Cabina de camión
		var cz0 := zf
		var cz1 := zf + cab_len
		MeshKit.box(sts["paint"], Vector3(0, 1.75, (cz0 + cz1) * 0.5 + 0.1), Vector3(W, 2.3, cab_len - 0.2))
		MeshKit.box(sts["paint"], Vector3(0, 1.05, cz0 + 0.45), Vector3(W * 0.96, 1.2, 0.9))
		MeshKit.box(sts["glass"], Vector3(0, 2.25, cz0 + 0.19), Vector3(W * 0.86, 0.95, 0.02))
		MeshKit.box(sts["chrome"], Vector3(0, 1.0, cz0 - 0.01), Vector3(W * 0.62, 0.8, 0.04))
		MeshKit.box(sts["head"], Vector3(-hw * 0.78, 0.8, cz0 - 0.02), Vector3(0.3, 0.14, 0.04))
		MeshKit.box(sts["head"], Vector3(hw * 0.78, 0.8, cz0 - 0.02), Vector3(0.3, 0.14, 0.04))
		MeshKit.box(sts["plastic"], Vector3(0, 0.45, cz0 + 0.1), Vector3(W * 1.02, 0.35, 0.3))
		for sx in [-1, 1]:
			MeshKit.cylinder(sts["chrome"], Vector3(sx * (hw - 0.05), 1.2, cz1 - 0.15), 0.09, 0.09, 2.9, 10, true)
			MeshKit.box(sts["plastic"], Vector3(sx * (hw + 0.18), 2.1, cz0 + 0.35), Vector3(0.06, 0.45, 0.25))
		# Remolque
		MeshKit.box(sts["paint"], Vector3(0, 2.45, (cz1 + 0.4 + zr) * 0.5), Vector3(W * 1.02, 2.9, zr - cz1 - 0.4))
		MeshKit.box(sts["chrome"], Vector3(0, 0.98, (cz1 + 0.4 + zr) * 0.5), Vector3(W * 0.9, 0.12, zr - cz1 - 0.4))
		MeshKit.box(sts["plastic"], Vector3(0, 2.45, zr + 0.01), Vector3(W * 0.98, 2.8, 0.02))
		MeshKit.box(sts["chrome"], Vector3(0, 2.45, zr + 0.025), Vector3(0.04, 2.7, 0.02))
		for sx in [-1, 1]:
			MeshKit.box(sts["tail"], Vector3(sx * hw * 0.8, 0.85, zr + 0.03), Vector3(0.35, 0.12, 0.04))
			MeshKit.box(sts["tail"], Vector3(sx * hw * 0.92, 3.85, zr + 0.03), Vector3(0.08, 0.08, 0.04))
			for t in 4:
				MeshKit.box(sts["tail"], Vector3(sx * (hw + 0.012), 1.0, cz1 + 1.5 + t * 2.8), Vector3(0.02, 0.06, 0.1))
		MeshKit.box(sts["plastic"], Vector3(0, 0.75, zr - 0.15), Vector3(W * 0.95, 0.15, 0.2))
		for z in [cz0 + 0.95, cz1 + 0.2, cz1 + 1.5, zr - 2.6, zr - 1.4]:
			for sx in [-1, 1]:
				_wheel(sts, Vector3(sx * (hw - 0.22), 0.52, z), 0.52, 0.42)
	else:
		# Autobús / furgoneta grande
		MeshKit.box(sts["paint"], Vector3(0, H * 0.5 + 0.2, 0), Vector3(W, H - 0.4, L))
		MeshKit.box(sts["paint"], Vector3(0, 0.45, 0), Vector3(W * 0.98, 0.5, L * 0.98))
		var wy := H * 0.62
		MeshKit.box(sts["glass"], Vector3(0, wy, 0), Vector3(W + 0.01, H * 0.32, L * 0.82))
		MeshKit.box(sts["glass"], Vector3(0, wy + 0.1, zf - 0.005), Vector3(W * 0.9, H * 0.5, 0.02))
		MeshKit.box(sts["glass"], Vector3(0, wy + 0.15, zr + 0.005), Vector3(W * 0.8, H * 0.28, 0.02))
		MeshKit.box(sts["chrome"], Vector3(0, H * 0.42, 0), Vector3(W + 0.015, 0.06, L * 0.84))
		for sx in [-1, 1]:
			MeshKit.box(sts["tail"], Vector3(sx * hw * 0.8, 0.9, zr + 0.01), Vector3(0.3, 0.3, 0.04))
			MeshKit.box(sts["head"], Vector3(sx * hw * 0.75, 0.8, zf - 0.01), Vector3(0.35, 0.15, 0.04))
		MeshKit.box(sts["plastic"], Vector3(0, 0.3, zr + 0.02), Vector3(W, 0.3, 0.06))
		MeshKit.box(sts["plastic"], Vector3(0, 0.3, zf - 0.02), Vector3(W, 0.3, 0.06))
		var wr := 0.5 if bus else 0.38
		for z in [zf + L * 0.2, zr - L * 0.22]:
			for sx in [-1, 1]:
				_wheel(sts, Vector3(sx * (hw - 0.2), wr, z), wr, 0.36)
	return {"mesh": _finish(sts, []), "length": L, "width": W, "height": H}

static func get_type(t: String) -> Dictionary:
	if _meshes.has(t):
		return _meshes[t]
	var d: Dictionary
	match t:
		"sedan":
			d = _car({"L": 4.75, "W": 1.86, "y0": 0.26, "belt": 0.86, "hood": 0.92, "deck": 1.0, "roof": 1.45, "cab_a": 0.32, "cab_b": 0.82, "ws": 0.32, "rs": 0.3, "wr": 0.33, "wb": 2.8})
		"coupe":
			d = _car({"L": 4.5, "W": 1.9, "y0": 0.22, "belt": 0.78, "hood": 0.82, "deck": 0.9, "roof": 1.28, "cab_a": 0.36, "cab_b": 0.84, "ws": 0.42, "rs": 0.45, "wr": 0.34, "wb": 2.65})
		"hatch":
			d = _car({"L": 4.1, "W": 1.78, "y0": 0.25, "belt": 0.88, "hood": 0.92, "deck": 1.02, "roof": 1.5, "cab_a": 0.3, "cab_b": 0.97, "ws": 0.3, "rs": 0.12, "wr": 0.31, "wb": 2.55})
		"suv":
			d = _car({"L": 4.85, "W": 1.98, "y0": 0.4, "belt": 1.12, "hood": 1.18, "deck": 1.24, "roof": 1.82, "cab_a": 0.28, "cab_b": 0.97, "ws": 0.24, "rs": 0.08, "wr": 0.39, "wb": 2.9})
		"pickup":
			d = _car({"L": 5.4, "W": 2.0, "y0": 0.45, "belt": 1.15, "hood": 1.22, "deck": 1.22, "roof": 1.9, "cab_a": 0.26, "cab_b": 0.58, "ws": 0.3, "rs": 0.1, "wr": 0.41, "wb": 3.3, "bed": true})
		"van":
			d = _boxy(5.4, 2.05, 2.5, 0.0, false, false)
		"bus":
			d = _boxy(12.0, 2.55, 3.3, 0.0, false, true)
		"semi":
			d = _boxy(16.5, 2.5, 4.0, 2.6, true, false)
	_meshes[t] = d
	return d

## Crea una instancia lista para colocar: Node3D con MeshInstance3D y el color de pintura aplicado.
static func spawn(t: String, paint: Color) -> Node3D:
	var d := get_type(t)
	var root := Node3D.new()
	var mi := MeshInstance3D.new()
	mi.name = "Body"
	mi.mesh = d["mesh"]
	mi.set_surface_override_material(0, paint_material(paint))
	root.add_child(mi)
	root.set_meta("length", d["length"])
	root.set_meta("width", d["width"])
	root.set_meta("height", d["height"])
	return root
