class_name WorldStreamer
extends Node3D
## Carga y descarga el mapa por chunks alrededor de la cámara. Solo existe lo que el jugador puede ver:
## el resto se genera poco a poco en hilos de trabajo y se añade sin bloquear el juego.

signal ready_initial

var focus := Vector3.ZERO
var focus_dir := Vector3.FORWARD
var exclude_road := -1
## Radios (m) de cada LOD; se ajustan según la calidad y el modo (los aviones ven más lejos).
var radius := [330.0, 800.0, 1500.0]
var max_tasks := 2
var chunks := {}     # Vector2i -> {"node": Node3D, "lod": int}
var tasks := {}      # Vector2i -> {"id": int, "b": ChunkBuilder, "lod": int}
var sea: MeshInstance3D
var landmarks: WorldLandmarks
var shadows := false
var _time := 0.0
var _initial_done := false

const VIS_END := {"person": 300.0, "flame": 320.0, "debris": 300.0, "umbrella": 340.0, "bush": 380.0, "vine": 380.0}

func _ready() -> void:
	World.ensure_loaded()
	var q: int = Game.quality()
	WorldAssets.hq = q >= 1
	shadows = q >= 2
	max_tasks = 2 if OS.get_processor_count() <= 4 else 3
	match q:
		0:
			radius = [260.0, 620.0, 1150.0]
		1:
			radius = [320.0, 780.0, 1450.0]
		_:
			radius = [380.0, 950.0, 1800.0]
	_make_sea()
	landmarks = WorldLandmarks.new()
	add_child(landmarks)

## Para el modo aviones: ve más lejos con menos detalle cercano.
func set_air_mode(on: bool) -> void:
	if on:
		radius = [radius[0] * 0.8, radius[1] * 1.4, radius[2] * 1.7]

func _make_sea() -> void:
	sea = MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(9000, 9000)
	pm.subdivide_width = 48
	pm.subdivide_depth = 48
	sea.mesh = pm
	sea.material_override = WorldAssets.mat("sea")
	sea.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(sea)

func lod_for(c: Vector2i) -> int:
	var o: Vector2 = World.chunk_origin(c) + Vector2(World.CHUNK, World.CHUNK) * 0.5
	var d := Vector2(o.x - focus.x, o.y - focus.z).length() - World.CHUNK * 0.5
	# a gran altura (aviones) bajamos el detalle cercano
	d += maxf(focus.y - World.height(focus.x, focus.z) - 120.0, 0.0) * 0.8
	for i in 3:
		if d < radius[i]:
			return i
	return -1

func _process(dt: float) -> void:
	World.time += dt
	RenderingServer.global_shader_parameter_set("game_time", World.time)
	sea.position = Vector3(snappedf(focus.x, 64.0), 0.0, snappedf(focus.z, 64.0))
	_collect()
	_schedule()
	landmarks.update(focus)

func _schedule() -> void:
	var cc: Vector2i = World.chunk_of(focus.x, focus.z)
	var rr := int(ceil(radius[2] / World.CHUNK)) + 1
	var want := []
	for dz in range(-rr, rr + 1):
		for dx in range(-rr, rr + 1):
			var c := cc + Vector2i(dx, dz)
			if c.x < 0 or c.y < 0 or c.x >= 64 or c.y >= 64:
				continue
			var l := lod_for(c)
			var have: Dictionary = chunks.get(c, {})
			if l < 0:
				if not have.is_empty() and not tasks.has(c):
					have["node"].queue_free()
					chunks.erase(c)
				continue
			if have.is_empty() or have["lod"] != l:
				if not tasks.has(c):
					var o: Vector2 = World.chunk_origin(c) + Vector2(World.CHUNK, World.CHUNK) * 0.5
					var to := Vector3(o.x - focus.x, 0, o.y - focus.z)
					var pri := to.length() - to.normalized().dot(Vector3(focus_dir.x, 0, focus_dir.z).normalized()) * 220.0
					if have.is_empty():
						pri -= 400.0
					want.append([pri, c, l])
	# descarga lo que quedó fuera del área
	for c in chunks.keys():
		if absi(c.x - cc.x) > rr or absi(c.y - cc.y) > rr:
			if not tasks.has(c):
				chunks[c]["node"].queue_free()
				chunks.erase(c)
	if want.is_empty():
		if not _initial_done and tasks.is_empty():
			_initial_done = true
			ready_initial.emit()
		return
	want.sort_custom(func(a, b): return a[0] < b[0])
	for w in want:
		if tasks.size() >= max_tasks:
			break
		_start_task(w[1], w[2])

func _start_task(c: Vector2i, l: int) -> void:
	var b := ChunkBuilder.new(World, c, l, exclude_road)
	var id := WorkerThreadPool.add_task(b.build, false, "chunk")
	tasks[c] = {"id": id, "b": b, "lod": l}

func _collect() -> void:
	var made := 0
	for c in tasks.keys():
		var t: Dictionary = tasks[c]
		if not WorkerThreadPool.is_task_completed(t["id"]):
			continue
		WorkerThreadPool.wait_for_task_completion(t["id"])
		tasks.erase(c)
		var node := _make_node(c, t["b"].out)
		if chunks.has(c):
			chunks[c]["node"].queue_free()
		chunks[c] = {"node": node, "lod": t["lod"]}
		made += 1
		if made >= 2:
			break

## Construye todo de golpe alrededor de un punto (pantalla de carga).
func prewarm(p: Vector3, dir: Vector3) -> void:
	focus = p
	focus_dir = dir
	var cc: Vector2i = World.chunk_of(p.x, p.z)
	var rr := int(ceil(radius[1] / World.CHUNK)) + 1
	var ids := {}
	for dz in range(-rr, rr + 1):
		for dx in range(-rr, rr + 1):
			var c := cc + Vector2i(dx, dz)
			var l := lod_for(c)
			if l < 0 or l > 1 or chunks.has(c):
				continue
			var b := ChunkBuilder.new(World, c, l, exclude_road)
			ids[c] = [WorkerThreadPool.add_task(b.build, false, "chunk"), b, l]
	for c in ids:
		WorkerThreadPool.wait_for_task_completion(ids[c][0])
		chunks[c] = {"node": _make_node(c, ids[c][1].out), "lod": ids[c][2]}
	landmarks.update(focus, true)

func _make_node(c: Vector2i, data: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.name = "C%d_%d" % [c.x, c.y]
	add_child(root)
	var surfs: Dictionary = data.get("surf", {})
	if not surfs.is_empty():
		var mesh := ArrayMesh.new()
		var cast_mesh := ArrayMesh.new()
		for k in surfs:
			var target := cast_mesh if (k == "building" or k == "concrete") else mesh
			target.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, surfs[k])
			target.surface_set_material(target.get_surface_count() - 1, WorldAssets.mat(k))
		if mesh.get_surface_count() > 0:
			var mi := MeshInstance3D.new()
			mi.mesh = mesh
			mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			root.add_child(mi)
		if cast_mesh.get_surface_count() > 0:
			var mi2 := MeshInstance3D.new()
			mi2.mesh = cast_mesh
			mi2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			root.add_child(mi2)
	var mms: Dictionary = data.get("mm", {})
	for k in mms:
		var d: Dictionary = mms[k]
		if d["count"] == 0:
			continue
		var m := MultiMesh.new()
		m.transform_format = MultiMesh.TRANSFORM_3D
		m.use_custom_data = true
		m.use_colors = true
		m.mesh = WorldAssets.mesh(k)
		m.instance_count = d["count"]
		m.buffer = d["data"]
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = m
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if (shadows and k in ["pine", "broad", "palm"]) else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		if VIS_END.has(k):
			mmi.visibility_range_end = VIS_END[k]
			mmi.visibility_range_end_margin = 20.0
		root.add_child(mmi)
	return root

func is_ready_around() -> bool:
	return _initial_done

func clear_all() -> void:
	for c in tasks:
		WorkerThreadPool.wait_for_task_completion(tasks[c]["id"])
	tasks.clear()
	for c in chunks:
		chunks[c]["node"].queue_free()
	chunks.clear()

func _exit_tree() -> void:
	for c in tasks:
		WorkerThreadPool.wait_for_task_completion(tasks[c]["id"])
	tasks.clear()
