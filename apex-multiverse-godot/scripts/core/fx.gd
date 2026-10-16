class_name FX
## Efectos: chispas, humo de neumáticos, líneas de velocidad, explosiones.

static func _quad_mesh(size: Vector2) -> QuadMesh:
	var q := QuadMesh.new()
	q.size = size
	return q

static func sparks() -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 48
	p.lifetime = 0.45
	p.emitting = false
	p.local_coords = false
	p.mesh = _quad_mesh(Vector2(0.05, 0.38))
	var m := MatLib.additive("glow", Color(1.0, 0.65, 0.2), 4.0).duplicate()
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.billboard_keep_scale = true
	p.material_override = m
	p.direction = Vector3(0, 1, 1)
	p.spread = 55.0
	p.initial_velocity_min = 5.0
	p.initial_velocity_max = 13.0
	p.gravity = Vector3(0, -14, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.4
	p.particle_flag_align_y = true
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return p

static func smoke(col := Color(0.85, 0.85, 0.88, 0.5)) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 40
	p.lifetime = 1.4
	p.emitting = false
	p.local_coords = false
	p.mesh = _quad_mesh(Vector2(1.6, 1.6))
	var m := StandardMaterial3D.new()
	m.albedo_texture = MatLib.tex("smoke")
	m.albedo_color = col
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.disable_receive_shadows = true
	p.material_override = m
	p.direction = Vector3(0, 1, 0)
	p.spread = 40.0
	p.initial_velocity_min = 0.5
	p.initial_velocity_max = 2.0
	p.gravity = Vector3(0, 0.6, 0)
	p.scale_amount_min = 0.8
	p.scale_amount_max = 2.2
	var curve := Curve.new()
	curve.add_point(Vector2(0, 0.4))
	curve.add_point(Vector2(1, 1.6))
	p.scale_amount_curve = curve
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 0.55))
	g.set_color(1, Color(1, 1, 1, 0.0))
	p.color_ramp = g
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return p

static func speed_lines() -> CPUParticles3D:
	## Se añade como hijo de la cámara: estelas blancas que pasan rozando la vista.
	var p := CPUParticles3D.new()
	p.amount = 70
	p.lifetime = 0.35
	p.local_coords = true
	p.mesh = _quad_mesh(Vector2(0.03, 2.6))
	var m := MatLib.additive("glow", Color(0.85, 0.92, 1.0, 0.7), 1.2).duplicate()
	p.material_override = m
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(7, 4, 2)
	p.position = Vector3(0, 0, -30)
	p.direction = Vector3(0, 0, 1)
	p.spread = 0.0
	p.gravity = Vector3.ZERO
	p.initial_velocity_min = 80.0
	p.initial_velocity_max = 120.0
	p.rotation_degrees = Vector3(90, 0, 0)
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return p

static func burst(parent: Node3D, pos: Vector3, col := Color(1.0, 0.55, 0.15), count := 40, speed := 12.0) -> void:
	var p := sparks()
	p.amount = count
	p.one_shot = true
	p.explosiveness = 0.95
	p.initial_velocity_max = speed
	p.spread = 180.0
	(p.material_override as StandardMaterial3D).albedo_color = Color(col.r * 4.0, col.g * 4.0, col.b * 4.0, 1.0)
	parent.add_child(p)
	p.global_position = pos
	p.emitting = true
	parent.get_tree().create_timer(1.5).timeout.connect(p.queue_free)

## Estela de luz (cinta) que sigue un punto; ideal para luces traseras con nitro.
class Trail extends MeshInstance3D:
	var points: Array[Vector3] = []
	var max_points := 16
	var width := 0.16
	var color := Color(0.3, 0.7, 1.0)
	var active := false
	var _im := ImmediateMesh.new()

	func _init(col: Color, w := 0.16) -> void:
		color = col
		width = w
		mesh = _im
		top_level = true
		cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.vertex_color_use_as_albedo = true
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		material_override = m

	func push(p: Vector3, cam_pos: Vector3) -> void:
		if active:
			points.push_front(p)
		elif not points.is_empty():
			points.pop_back()
		while points.size() > max_points:
			points.pop_back()
		_im.clear_surfaces()
		if points.size() < 2:
			return
		global_transform = Transform3D.IDENTITY
		_im.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP)
		for i in points.size():
			var a := points[i]
			var dir := (points[i + 1] - a).normalized() if i < points.size() - 1 else (a - points[i - 1]).normalized()
			var side := dir.cross((cam_pos - a).normalized()).normalized() * width
			var t := 1.0 - float(i) / points.size()
			var c := Color(color.r * 3.0 * t, color.g * 3.0 * t, color.b * 3.0 * t, t)
			_im.surface_set_color(c)
			_im.surface_add_vertex(a + side)
			_im.surface_set_color(c)
			_im.surface_add_vertex(a - side)
		_im.surface_end()
