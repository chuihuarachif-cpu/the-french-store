class_name CarVisual
extends Node3D
## Auto deportivo realista (modelo CarConcept, CC-BY 4.0 Eric Chadwick / DGG).
## Se encarga de pintura, ruedas que giran, dirección, luces, llamas de nitro y estelas.

const CAR_SCENE := "res://assets/models/apex_car.glb"
static var _paint_normal: Texture2D

var paint_color := Color(0.75, 0.05, 0.06)
var model: Node3D
var wheels := []  # [{steer: Node3D, spin: Node3D, front: bool, radius: float}]
var length := 4.6
var width := 2.0
var wheel_angle := 0.0
var steer_angle := 0.0
var nitro_on := false
var brake_on := false
var lights_on := false
var _flames: Array[MeshInstance3D] = []
var _brake_mats: Array[StandardMaterial3D] = []
var _head_lights: Array[SpotLight3D] = []
var _flame_t := 0.0

func setup(color: Color, with_lights := false, lite := false) -> void:
	paint_color = color
	model = (load(CAR_SCENE) as PackedScene).instantiate()
	add_child(model)
	_fix_orientation()
	_apply_materials()
	_rig_wheels()
	_add_flames()
	if with_lights:
		_add_headlights()
	if lite:
		for n in _all(model):
			if n is MeshInstance3D and String(n.name).contains("BrakePad"):
				n.visible = false

func _all(n: Node) -> Array:
	var out := []
	for c in n.get_children():
		out.append(c)
		out.append_array(_all(c))
	return out

func _mesh_aabb(root: Node3D) -> AABB:
	var first := true
	var box := AABB()
	for n in _all(root):
		if n is MeshInstance3D and n.mesh:
			var a: AABB = (root.global_transform.affine_inverse() * n.global_transform) * n.get_aabb()
			if first:
				box = a
				first = false
			else:
				box = box.merge(a)
	return box

func _fix_orientation() -> void:
	# Mide el modelo y lo centra: frente hacia -Z (convención Godot), ruedas apoyadas en y=0.
	var box := _mesh_aabb(self)
	# El eje más largo es el largo del auto.
	if box.size.x > box.size.z:
		model.rotate_y(PI * 0.5)
		box = _mesh_aabb(self)
	length = box.size.z
	width = box.size.x
	model.position -= Vector3(box.get_center().x, box.position.y, box.get_center().z)
	# Frente: el faro (Headlight) debe quedar en -Z.
	for n in _all(model):
		if n is MeshInstance3D and String(n.name).begins_with("BodyHeadlights"):
			var c: Vector3 = (global_transform.affine_inverse() * n.global_transform) * n.get_aabb().get_center()
			if c.z > 0.0:
				model.rotate_y(PI)
				var b2 := _mesh_aabb(self)
				model.position -= Vector3(b2.get_center().x, 0, b2.get_center().z)
			break

func _apply_materials() -> void:
	var paint := StandardMaterial3D.new()
	paint.albedo_color = paint_color
	paint.metallic = 0.55
	paint.roughness = 0.28
	paint.clearcoat_enabled = true
	paint.clearcoat = 1.0
	paint.clearcoat_roughness = 0.08
	paint.rim_enabled = true
	paint.rim = 0.25
	paint.rim_tint = 0.6
	var paint2 := paint.duplicate()
	paint2.albedo_color = paint_color.darkened(0.55)
	paint2.metallic = 0.7
	paint2.roughness = 0.35
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color(0.015, 0.02, 0.028)
	glass.metallic = 0.2
	glass.roughness = 0.02
	glass.metallic_specular = 1.0
	for n in _all(model):
		if not (n is MeshInstance3D) or n.mesh == null:
			continue
		var mi: MeshInstance3D = n
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		for s in mi.mesh.get_surface_count():
			var m: Material = mi.mesh.surface_get_material(s)
			var nm := String(m.resource_name) if m else ""
			if nm.begins_with("Paint 1"):
				mi.set_surface_override_material(s, paint)
			elif nm.begins_with("Paint 2"):
				mi.set_surface_override_material(s, paint2)
			elif nm == "Glass":
				mi.set_surface_override_material(s, glass)
			elif nm == "Brakelight" and m is StandardMaterial3D:
				var bm: StandardMaterial3D = m.duplicate()
				bm.emission_enabled = true
				bm.emission = Color(1.0, 0.04, 0.02)
				bm.emission_energy_multiplier = 2.0
				mi.set_surface_override_material(s, bm)
				_brake_mats.append(bm)
			elif nm == "Headlight" and m is StandardMaterial3D:
				var hm: StandardMaterial3D = m.duplicate()
				hm.emission_enabled = true
				hm.emission = Color(0.75, 0.88, 1.0)
				hm.emission_energy_multiplier = 6.0
				mi.set_surface_override_material(s, hm)

func set_paint(color: Color) -> void:
	paint_color = color
	for n in _all(model):
		if n is MeshInstance3D:
			for s in n.mesh.get_surface_count():
				var m = n.get_surface_override_material(s)
				if m is StandardMaterial3D and m.clearcoat_enabled:
					m.albedo_color = color if m.metallic < 0.6 else color.darkened(0.55)

func _rig_wheels() -> void:
	for wname in ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"]:
		var w: Node3D = model.find_child(wname, true, false)
		if w == null:
			continue
		var box := AABB()
		var first := true
		for n in _all(w):
			if n is MeshInstance3D and not String(n.name).contains("Brake"):
				var a: AABB = (global_transform.affine_inverse() * n.global_transform) * n.get_aabb()
				box = a if first else box.merge(a)
				first = false
		var center := box.get_center()
		var steer := Node3D.new()
		steer.name = wname + "Steer"
		add_child(steer)
		steer.position = center
		var spin := Node3D.new()
		steer.add_child(spin)
		var parts := w.get_children()
		for p in parts:
			var gt: Transform3D = p.global_transform
			p.get_parent().remove_child(p)
			if String(p.name).contains("BrakePad"):
				steer.add_child(p)
			else:
				spin.add_child(p)
			p.global_transform = gt
		wheels.append({"steer": steer, "spin": spin, "front": wname.contains("Front"), "radius": max(box.size.y * 0.5, 0.3)})

func _add_flames() -> void:
	var box := _mesh_aabb(self)
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.11
	cone.height = 0.9
	cone.radial_segments = 12
	var fm := StandardMaterial3D.new()
	fm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	fm.albedo_color = Color(0.4, 0.75, 1.0, 0.85)
	fm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	fm.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	fm.emission_enabled = true
	fm.emission = Color(0.35, 0.65, 1.0)
	fm.emission_energy_multiplier = 4.0
	for x in [-0.42, 0.42]:
		var f := MeshInstance3D.new()
		f.mesh = cone
		f.material_override = fm
		f.rotation_degrees = Vector3(90, 0, 0)
		f.position = Vector3(x, 0.38, box.end.z + 0.4)
		f.visible = false
		f.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(f)
		_flames.append(f)

func _add_headlights() -> void:
	lights_on = true
	var box := _mesh_aabb(self)
	for x in [-0.65, 0.65]:
		var sl := SpotLight3D.new()
		sl.light_color = Color(0.9, 0.95, 1.0)
		sl.light_energy = 22.0
		sl.spot_range = 75.0
		sl.spot_angle = 24.0
		sl.spot_attenuation = 0.35
		sl.spot_angle_attenuation = 0.6
		sl.position = Vector3(x, 0.7, box.position.z - 0.3)
		sl.rotation_degrees = Vector3(-5, x * -3.0, 0)
		add_child(sl)
		_head_lights.append(sl)

func update_visual(dt: float, speed_ms: float, steer: float) -> void:
	wheel_angle += speed_ms * dt / 0.36
	steer_angle = lerp(steer_angle, steer * 0.42, clamp(dt * 10.0, 0.0, 1.0))
	for w in wheels:
		(w["spin"] as Node3D).rotation.x = -wheel_angle
		if w["front"]:
			(w["steer"] as Node3D).rotation.y = -steer_angle
	_flame_t += dt
	for f in _flames:
		f.visible = nitro_on
		if nitro_on:
			var s := 0.8 + 0.35 * sin(_flame_t * 47.0 + f.position.x * 9.0) + randf() * 0.2
			f.scale = Vector3(1.0, s, 1.0)
	for bm in _brake_mats:
		bm.emission_energy_multiplier = 6.0 if brake_on else 1.6
