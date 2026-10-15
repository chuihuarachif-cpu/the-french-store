extends Node3D
class_name Level01Penguin

## Nivel 1 de Prism Realm: Pingüino Prismático ("Emperador de Cristal").
## Todo el modelo, la física y la interfaz se generan por código (sin archivos .glb).

signal level_completed(level_number: int, moves_count: int, elapsed_seconds: float)
signal level_failed(reason: String)

enum ScrewColor { CYAN, AMBER, VIOLET }

const COLOR_HEX := {
	ScrewColor.CYAN: Color("00E5FF"),
	ScrewColor.AMBER: Color("FFB300"),
	ScrewColor.VIOLET: Color("D500F9")
}

const COLOR_NAMES := {
	ScrewColor.CYAN: "CIAN",
	ScrewColor.AMBER: "ÁMBAR",
	ScrewColor.VIOLET: "VIOLETA"
}

const MAX_BUFFER_SLOTS: int = 5
const BOX_CAPACITY: int = 3
const DRAG_THRESHOLD_PX: float = 12.0
const LEVEL_NUMBER: int = 1

# Nodos principales generados en tiempo de ejecución
var camera: Camera3D
var pivot_root: Node3D
var penguin_root: Node3D

# Estado de juego
var plates: Array[Dictionary] = []
var screws: Array[Dictionary] = []
var box_queue: Array[int] = [
	ScrewColor.CYAN, ScrewColor.AMBER, ScrewColor.VIOLET,
	ScrewColor.CYAN, ScrewColor.AMBER, ScrewColor.VIOLET
]
var active_box_color: int = ScrewColor.CYAN
var active_box_count: int = 0
var buffer_slots: Array[int] = [] # ScrewColor de los tornillos en espera
var remaining_plates: int = 0
var moves_count: int = 0
var elapsed_time: float = 0.0
var is_game_over: bool = false

# Control táctil / rotación 360°
var is_pointer_down: bool = false
var pointer_down_pos: Vector2 = Vector2.ZERO
var is_dragging_model: bool = false
var target_yaw: float = 0.35
var target_pitch: float = -0.12

# Nodos de UI
var lbl_box_info: Label
var lbl_buffer_info: Label
var box_swatch: ColorRect
var buffer_swatches: Array[ColorRect] = []
var result_panel: PanelContainer
var lbl_result_title: Label
var lbl_result_detail: Label

var acrylic_shader: Shader


func _ready() -> void:
	_load_or_create_shader()
	_setup_environment_and_camera()
	_setup_ui()
	_build_prismatic_penguin_level_1()
	_advance_to_next_box()
	_refresh_hud()


func _process(delta: float) -> void:
	if not is_game_over:
		elapsed_time += delta
	if is_instance_valid(pivot_root):
		pivot_root.rotation.y = lerp_angle(pivot_root.rotation.y, target_yaw, delta * 10.0)
		pivot_root.rotation.x = lerp(pivot_root.rotation.x, target_pitch, delta * 10.0)


# ==========================================
# 1. ENTORNO, CÁMARA Y SHADER
# ==========================================
func _load_or_create_shader() -> void:
	if ResourceLoader.exists("res://shaders/prismatic_acrylic.gdshader"):
		acrylic_shader = load("res://shaders/prismatic_acrylic.gdshader")
	else:
		acrylic_shader = Shader.new()
		acrylic_shader.code = """
shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back;
uniform vec4 albedo_color : source_color = vec4(0.15, 0.65, 0.95, 0.88);
uniform vec4 rim_color : source_color = vec4(0.6, 0.95, 1.0, 1.0);
uniform float roughness = 0.18;
uniform float metallic = 0.1;
uniform float rim_power = 2.8;
void fragment() {
	float fresnel = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), rim_power);
	ALBEDO = albedo_color.rgb + rim_color.rgb * fresnel * 0.45;
	EMISSION = rim_color.rgb * fresnel * 0.35;
	ROUGHNESS = roughness;
	METALLIC = metallic;
	ALPHA = clamp(albedo_color.a + fresnel * 0.12, 0.0, 1.0);
}
"""


func _setup_environment_and_camera() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("0B1021")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("3A5088")
	env.ambient_light_energy = 1.15

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	add_child(world_env)

	var key_light := DirectionalLight3D.new()
	key_light.rotation_degrees = Vector3(-48, 35, 0)
	key_light.light_energy = 1.4
	add_child(key_light)

	var rim_light := OmniLight3D.new()
	rim_light.position = Vector3(-3.0, 2.5, -3.0)
	rim_light.light_color = Color("00E5FF")
	rim_light.light_energy = 2.0
	rim_light.omni_range = 10.0
	add_child(rim_light)

	camera = Camera3D.new()
	camera.position = Vector3(0.0, 0.6, 5.8)
	camera.fov = 45.0
	add_child(camera)
	camera.look_at(Vector3(0.0, 0.2, 0.0), Vector3.UP)

	pivot_root = Node3D.new()
	pivot_root.name = "PivotRoot"
	add_child(pivot_root)

	penguin_root = Node3D.new()
	penguin_root.name = "PenguinRoot"
	pivot_root.add_child(penguin_root)


# ==========================================
# 2. INTERFAZ (HUD, RESULTADO)
# ==========================================
func _setup_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)

	var top := VBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 24.0
	top.offset_right = -24.0
	top.offset_top = 36.0
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)

	var title := Label.new()
	title.text = "NIVEL %d · PINGÜINO PRISMÁTICO" % LEVEL_NUMBER
	title.add_theme_font_size_override("font_size", 30)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(title)

	var box_row := HBoxContainer.new()
	box_row.alignment = BoxContainer.ALIGNMENT_CENTER
	box_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(box_row)

	box_swatch = ColorRect.new()
	box_swatch.custom_minimum_size = Vector2(36, 36)
	box_swatch.mouse_filter = Control.MOUSE_FILTER_IGNORE
	box_row.add_child(box_swatch)

	lbl_box_info = Label.new()
	lbl_box_info.add_theme_font_size_override("font_size", 28)
	box_row.add_child(lbl_box_info)

	# Bandeja de espera (parte inferior)
	var bottom := VBoxContainer.new()
	bottom.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bottom.offset_left = 24.0
	bottom.offset_right = -24.0
	bottom.offset_top = -170.0
	bottom.offset_bottom = -40.0
	bottom.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(bottom)

	lbl_buffer_info = Label.new()
	lbl_buffer_info.add_theme_font_size_override("font_size", 26)
	lbl_buffer_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bottom.add_child(lbl_buffer_info)

	var slot_row := HBoxContainer.new()
	slot_row.alignment = BoxContainer.ALIGNMENT_CENTER
	slot_row.add_theme_constant_override("separation", 14)
	slot_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom.add_child(slot_row)
	for i in MAX_BUFFER_SLOTS:
		var slot := ColorRect.new()
		slot.custom_minimum_size = Vector2(64, 64)
		slot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		slot_row.add_child(slot)
		buffer_swatches.append(slot)

	var hint := Label.new()
	hint.text = "Arrastra para girar · Toca un tornillo para sacarlo"
	hint.add_theme_font_size_override("font_size", 20)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.modulate = Color(1, 1, 1, 0.65)
	bottom.add_child(hint)

	# Panel de resultado (victoria / derrota)
	result_panel = PanelContainer.new()
	result_panel.set_anchors_preset(Control.PRESET_CENTER)
	result_panel.custom_minimum_size = Vector2(560, 320)
	result_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	result_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	result_panel.visible = false
	root.add_child(result_panel)

	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 24)
	result_panel.add_child(vb)

	lbl_result_title = Label.new()
	lbl_result_title.add_theme_font_size_override("font_size", 44)
	lbl_result_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(lbl_result_title)

	lbl_result_detail = Label.new()
	lbl_result_detail.add_theme_font_size_override("font_size", 26)
	lbl_result_detail.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vb.add_child(lbl_result_detail)

	var btn := Button.new()
	btn.text = "Jugar de nuevo"
	btn.custom_minimum_size = Vector2(300, 80)
	btn.add_theme_font_size_override("font_size", 30)
	btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	btn.pressed.connect(_on_restart_pressed)
	vb.add_child(btn)


func _refresh_hud() -> void:
	if lbl_box_info == null:
		return
	box_swatch.color = COLOR_HEX[active_box_color]
	lbl_box_info.text = "  Caja %s: %d/%d" % [COLOR_NAMES[active_box_color], active_box_count, BOX_CAPACITY]
	lbl_buffer_info.text = "ESPERA %d/%d" % [buffer_slots.size(), MAX_BUFFER_SLOTS]
	for i in buffer_swatches.size():
		if i < buffer_slots.size():
			buffer_swatches[i].color = COLOR_HEX[buffer_slots[i]]
		else:
			buffer_swatches[i].color = Color(1, 1, 1, 0.12)


func _on_restart_pressed() -> void:
	get_tree().reload_current_scene()


# ==========================================
# 3. CONSTRUCCIÓN ORIGINAL DEL PINGÜINO 3D
# ==========================================
func _build_prismatic_penguin_level_1() -> void:
	# Núcleo interior estático (relleno sólido, no cae)
	var core := StaticBody3D.new()
	core.collision_layer = 0
	core.collision_mask = 0
	var core_mesh := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.32
	cyl.bottom_radius = 0.42
	cyl.height = 1.6
	cyl.radial_segments = 6 # Hexagonal prismático
	core_mesh.mesh = cyl
	var core_mat := StandardMaterial3D.new()
	core_mat.albedo_color = Color("162238")
	core_mat.metallic = 0.6
	core_mat.roughness = 0.25
	core_mesh.material_override = core_mat
	core.add_child(core_mesh)
	penguin_root.add_child(core)

	# 9 placas desmontables + 18 tornillos (6 cian, 6 ámbar, 6 violeta)

	# 1. Cresta prismática superior
	_create_plate_with_screws(
		"Cresta_Prismatica",
		Vector3(0.0, 1.38, 0.0),
		Vector3(0.28, 0.36, 0.48),
		Color(0.0, 0.90, 1.0, 0.88),
		[
			{"offset": Vector3(0.0, 0.18, 0.0), "normal": Vector3.UP, "color": ScrewColor.VIOLET}
		]
	)

	# 2. Pico geométrico biselado (frente superior)
	_create_plate_with_screws(
		"Pico_Biselado",
		Vector3(0.0, 0.88, 0.68),
		Vector3(0.36, 0.24, 0.34),
		Color(1.0, 0.68, 0.05, 0.92),
		[
			{"offset": Vector3(0.0, 0.0, 0.17), "normal": Vector3.BACK, "color": ScrewColor.AMBER}
		]
	)

	# 3. Placa facial / antifaz (cabeza frontal). Sus tornillos quedan bajo el pico:
	# hay que quitar primero el pico para poder sacarlos.
	_create_plate_with_screws(
		"Placa_Facial",
		Vector3(0.0, 0.92, 0.42),
		Vector3(0.82, 0.56, 0.18),
		Color(0.12, 0.22, 0.48, 0.90),
		[
			{"offset": Vector3(-0.12, 0.0, 0.09), "normal": Vector3.BACK, "color": ScrewColor.CYAN},
			{"offset": Vector3(0.12, 0.0, 0.09), "normal": Vector3.BACK, "color": ScrewColor.VIOLET}
		]
	)

	# 4. Casco / nuca dorsal (cabeza trasera)
	_create_plate_with_screws(
		"Casco_Dorsal",
		Vector3(0.0, 0.92, -0.42),
		Vector3(0.82, 0.56, 0.18),
		Color(0.10, 0.18, 0.42, 0.90),
		[
			{"offset": Vector3(-0.22, 0.0, -0.09), "normal": Vector3.FORWARD, "color": ScrewColor.CYAN},
			{"offset": Vector3(0.22, 0.0, -0.09), "normal": Vector3.FORWARD, "color": ScrewColor.AMBER}
		]
	)

	# 5. Pechera cristalina (panza translúcida frontal)
	_create_plate_with_screws(
		"Pechera_Cristalina",
		Vector3(0.0, 0.05, 0.50),
		Vector3(0.92, 1.05, 0.20),
		Color(0.92, 0.97, 1.0, 0.86),
		[
			{"offset": Vector3(0.0, 0.32, 0.10), "normal": Vector3.BACK, "color": ScrewColor.CYAN},
			{"offset": Vector3(-0.26, -0.22, 0.10), "normal": Vector3.BACK, "color": ScrewColor.AMBER},
			{"offset": Vector3(0.26, -0.22, 0.10), "normal": Vector3.BACK, "color": ScrewColor.VIOLET}
		]
	)

	# 6. Ala prismática izquierda
	_create_plate_with_screws(
		"Ala_Izquierda",
		Vector3(-0.62, 0.05, 0.0),
		Vector3(0.20, 0.98, 0.72),
		Color(0.08, 0.48, 0.88, 0.88),
		[
			{"offset": Vector3(-0.10, 0.24, 0.0), "normal": Vector3.LEFT, "color": ScrewColor.CYAN},
			{"offset": Vector3(-0.10, -0.24, 0.0), "normal": Vector3.LEFT, "color": ScrewColor.VIOLET}
		]
	)

	# 7. Ala prismática derecha
	_create_plate_with_screws(
		"Ala_Derecha",
		Vector3(0.62, 0.05, 0.0),
		Vector3(0.20, 0.98, 0.72),
		Color(0.08, 0.48, 0.88, 0.88),
		[
			{"offset": Vector3(0.10, 0.24, 0.0), "normal": Vector3.RIGHT, "color": ScrewColor.AMBER},
			{"offset": Vector3(0.10, -0.24, 0.0), "normal": Vector3.RIGHT, "color": ScrewColor.VIOLET}
		]
	)

	# 8. Espaldar glacial (espalda)
	_create_plate_with_screws(
		"Espaldar_Glacial",
		Vector3(0.0, 0.05, -0.50),
		Vector3(0.92, 1.05, 0.20),
		Color(0.10, 0.28, 0.62, 0.90),
		[
			{"offset": Vector3(0.0, 0.32, -0.10), "normal": Vector3.FORWARD, "color": ScrewColor.VIOLET},
			{"offset": Vector3(-0.26, -0.22, -0.10), "normal": Vector3.FORWARD, "color": ScrewColor.CYAN},
			{"offset": Vector3(0.26, -0.22, -0.10), "normal": Vector3.FORWARD, "color": ScrewColor.AMBER}
		]
	)

	# 9. Base de patitas (abajo)
	_create_plate_with_screws(
		"Base_Patitas",
		Vector3(0.0, -0.72, 0.22),
		Vector3(0.96, 0.26, 0.78),
		Color(1.0, 0.62, 0.02, 0.92),
		[
			{"offset": Vector3(-0.28, 0.0, 0.39), "normal": Vector3.BACK, "color": ScrewColor.CYAN},
			{"offset": Vector3(0.28, 0.0, 0.39), "normal": Vector3.BACK, "color": ScrewColor.AMBER}
		]
	)

	remaining_plates = plates.size()


func _create_plate_with_screws(plate_name: String, pos: Vector3, size: Vector3, color: Color, screw_defs: Array) -> void:
	var body := RigidBody3D.new()
	body.name = plate_name
	body.position = pos
	body.freeze = true
	body.freeze_mode = RigidBody3D.FREEZE_MODE_KINEMATIC
	body.collision_layer = 1 # Capa 1: placas
	body.collision_mask = 0

	var mesh_inst := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	mesh_inst.mesh = box_mesh

	var mat := ShaderMaterial.new()
	mat.shader = acrylic_shader
	mat.set_shader_parameter("albedo_color", color)
	mat.set_shader_parameter("rim_color", color.lightened(0.45))
	mesh_inst.material_override = mat
	body.add_child(mesh_inst)

	var col_shape := CollisionShape3D.new()
	var box_shape := BoxShape3D.new()
	box_shape.size = size * 0.94
	col_shape.shape = box_shape
	body.add_child(col_shape)

	penguin_root.add_child(body)

	var plate_entry := {
		"name": plate_name,
		"node": body,
		"outward_dir": pos.normalized() if pos.length() > 0.01 else Vector3.UP,
		"screw_ids": []
	}

	for s_def in screw_defs:
		var s_id: int = screws.size()
		var s_node := _spawn_screw_node(s_id, pos + s_def["offset"], s_def["normal"], s_def["color"])
		screws.append({
			"id": s_id,
			"node": s_node,
			"color": s_def["color"],
			"normal": s_def["normal"],
			"plate_name": plate_name,
			"removed": false
		})
		plate_entry["screw_ids"].append(s_id)

	plates.append(plate_entry)


func _spawn_screw_node(screw_id: int, local_pos: Vector3, normal: Vector3, s_color: int) -> Area3D:
	var area := Area3D.new()
	area.name = "Screw_%d" % screw_id
	area.position = local_pos
	area.collision_layer = 2 # Capa 2: tornillos interactivos
	area.collision_mask = 0
	area.set_meta("screw_id", screw_id)

	# Orientar el eje Y local hacia la normal de salida
	var up_vec := normal.normalized()
	var right_vec := up_vec.cross(Vector3.UP)
	if right_vec.length_squared() < 0.001:
		right_vec = up_vec.cross(Vector3.RIGHT)
	right_vec = right_vec.normalized()
	var fwd_vec := right_vec.cross(up_vec).normalized()
	area.basis = Basis(right_vec, up_vec, fwd_vec)

	# Vástago del tornillo
	var shaft := MeshInstance3D.new()
	var shaft_mesh := CylinderMesh.new()
	shaft_mesh.top_radius = 0.055
	shaft_mesh.bottom_radius = 0.055
	shaft_mesh.height = 0.22
	shaft.mesh = shaft_mesh

	# Cabeza hexagonal del color del tornillo
	var head := MeshInstance3D.new()
	var head_mesh := CylinderMesh.new()
	head_mesh.top_radius = 0.115
	head_mesh.bottom_radius = 0.115
	head_mesh.height = 0.065
	head_mesh.radial_segments = 6
	head.mesh = head_mesh
	head.position = Vector3(0.0, 0.11, 0.0)

	var mat := StandardMaterial3D.new()
	mat.albedo_color = COLOR_HEX[s_color]
	mat.metallic = 0.75
	mat.roughness = 0.2
	mat.emission_enabled = true
	mat.emission = COLOR_HEX[s_color] * 0.25
	shaft.material_override = mat
	head.material_override = mat

	area.add_child(shaft)
	area.add_child(head)

	# Colisionador táctil generoso
	var col := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.16
	col.shape = sphere
	col.position = Vector3(0.0, 0.08, 0.0)
	area.add_child(col)

	penguin_root.add_child(area)
	return area


# ==========================================
# 4. INTERACCIÓN TÁCTIL Y MECÁNICA DE TORNILLOS
# ==========================================
# project.godot emula toques desde el ratón, así que solo se manejan eventos táctiles.
func _unhandled_input(event: InputEvent) -> void:
	if is_game_over:
		return

	if event is InputEventScreenTouch:
		if event.pressed:
			is_pointer_down = true
			is_dragging_model = false
			pointer_down_pos = event.position
		else:
			if is_pointer_down and not is_dragging_model:
				_try_pick_screw_at(event.position)
			is_pointer_down = false
			is_dragging_model = false

	elif event is InputEventScreenDrag and is_pointer_down:
		if event.position.distance_to(pointer_down_pos) > DRAG_THRESHOLD_PX:
			is_dragging_model = true
		if is_dragging_model:
			target_yaw += event.relative.x * 0.009
			target_pitch = clamp(target_pitch + event.relative.y * 0.007, -0.95, 0.95)


func _try_pick_screw_at(screen_pos: Vector2) -> void:
	var space_state := get_world_3d().direct_space_state
	var ray_from := camera.project_ray_origin(screen_pos)
	var ray_to := ray_from + camera.project_ray_normal(screen_pos) * 20.0

	var query := PhysicsRayQueryParameters3D.create(ray_from, ray_to, 2) # Capa 2: tornillos
	query.collide_with_areas = true
	query.collide_with_bodies = false

	var hit := space_state.intersect_ray(query)
	if hit.is_empty():
		return

	var collider: Object = hit.get("collider")
	if collider and collider.has_meta("screw_id"):
		var screw_id: int = collider.get_meta("screw_id")
		_attempt_unscrew(screw_id)


func _attempt_unscrew(screw_id: int) -> void:
	var s_data: Dictionary = screws[screw_id]
	if s_data["removed"]:
		return

	var s_node: Area3D = s_data["node"]

	# ¿Otra placa bloquea la salida del tornillo?
	if _is_screw_path_blocked(s_node, s_data["plate_name"]):
		_play_blocked_shake(s_node)
		return

	s_data["removed"] = true
	moves_count += 1

	# Animación de desatornillado (giro + extracción en su eje local Y)
	var tw := create_tween().set_parallel(true)
	tw.tween_property(s_node, "position", s_node.position + s_node.basis.y * 0.65, 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(s_node, "rotation:y", s_node.rotation.y + TAU * 2.0, 0.22)
	tw.chain().tween_callback(func():
		if is_instance_valid(s_node):
			s_node.queue_free()
	)
	s_node.collision_layer = 0

	_route_screw_to_box_or_buffer(s_data["color"])
	_detach_screw_from_plate(screw_id, s_data["plate_name"])
	if not is_game_over:
		_refresh_hud()


func _is_screw_path_blocked(s_node: Area3D, own_plate_name: String) -> bool:
	var space_state := get_world_3d().direct_space_state
	var out_dir: Vector3 = s_node.global_transform.basis.y.normalized()
	var start_pos := s_node.global_position + out_dir * 0.14
	var end_pos := start_pos + out_dir * 0.55

	var query := PhysicsRayQueryParameters3D.create(start_pos, end_pos, 1) # Capa 1: placas
	query.hit_from_inside = true # detecta una placa aunque el rayo nazca dentro de ella
	var hit := space_state.intersect_ray(query)
	if not hit.is_empty():
		var hit_body: Node = hit.get("collider")
		if hit_body and hit_body.name != own_plate_name:
			return true
	return false


func _play_blocked_shake(s_node: Area3D) -> void:
	var orig_pos := s_node.position
	var tw := create_tween()
	tw.tween_property(s_node, "position", orig_pos + s_node.basis.x * 0.04, 0.04)
	tw.tween_property(s_node, "position", orig_pos - s_node.basis.x * 0.04, 0.04)
	tw.tween_property(s_node, "position", orig_pos, 0.04)


# ==========================================
# 5. CAJAS DE COLORES Y LIBERACIÓN DE PLACAS
# ==========================================
func _route_screw_to_box_or_buffer(s_color: int) -> void:
	if s_color == active_box_color:
		active_box_count += 1
		if active_box_count >= BOX_CAPACITY:
			_advance_to_next_box()
	else:
		buffer_slots.append(s_color)
		if buffer_slots.size() > MAX_BUFFER_SLOTS:
			_trigger_game_over("La bandeja de espera se llenó")


func _advance_to_next_box() -> void:
	if box_queue.is_empty():
		return
	active_box_color = box_queue.pop_front()
	active_box_count = 0

	# Auto-absorber tornillos de la bandeja que coincidan con la nueva caja
	var i := 0
	while i < buffer_slots.size():
		if buffer_slots[i] == active_box_color:
			buffer_slots.remove_at(i)
			active_box_count += 1
			if active_box_count >= BOX_CAPACITY:
				_advance_to_next_box()
				return
		else:
			i += 1


func _detach_screw_from_plate(screw_id: int, plate_name: String) -> void:
	for p in plates:
		if p["name"] == plate_name:
			p["screw_ids"].erase(screw_id)
			if p["screw_ids"].is_empty():
				_release_plate_physics(p)
			break


func _release_plate_physics(plate_entry: Dictionary) -> void:
	var body: RigidBody3D = plate_entry["node"]
	if not is_instance_valid(body):
		return

	# La placa deja de bloquear a las demás y cae libre en el mundo
	body.collision_layer = 0
	body.reparent(self, true)
	body.freeze = false
	var out_dir: Vector3 = pivot_root.global_transform.basis * (plate_entry["outward_dir"] as Vector3)
	body.apply_central_impulse(out_dir.normalized() * 2.2 + Vector3(0.0, 1.2, 0.0))
	body.apply_torque_impulse(Vector3(randf_range(-0.4, 0.4), randf_range(-0.4, 0.4), randf_range(-0.4, 0.4)))

	var timer := get_tree().create_timer(1.6)
	timer.timeout.connect(func():
		if is_instance_valid(body):
			body.queue_free()
	)

	remaining_plates -= 1
	if remaining_plates <= 0:
		_trigger_win()


# ==========================================
# 6. FIN DE PARTIDA
# ==========================================
func _trigger_win() -> void:
	if is_game_over:
		return
	is_game_over = true
	_refresh_hud()
	lbl_result_title.text = "¡NIVEL COMPLETADO!"
	lbl_result_detail.text = "Movimientos: %d · Tiempo: %.1f s" % [moves_count, elapsed_time]
	result_panel.visible = true
	level_completed.emit(LEVEL_NUMBER, moves_count, elapsed_time)


func _trigger_game_over(reason: String) -> void:
	if is_game_over:
		return
	is_game_over = true
	_refresh_hud()
	lbl_result_title.text = "SIN ESPACIO"
	lbl_result_detail.text = reason
	result_panel.visible = true
	level_failed.emit(reason)
