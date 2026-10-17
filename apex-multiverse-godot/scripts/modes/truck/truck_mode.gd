extends RoadMode
## MODO 3 — CAMIONES: lleva la carga de A a B por las carreteras de Fransterra.
## Semáforos (multa si pasas en rojo), límites de velocidad, animales que cruzan (multa por atropello),
## árboles caídos que obligan a desviarse, pasos a nivel con tren, puentes y el puente levadizo.

const FINE_RED := 250
const FINE_ANIMAL := 500
const FINE_SPEED := 150
const FINE_CRASH := 200

var job: Dictionary
var s0 := 0.0
var s1 := 0.0
var time := 0.0
var fines: Array = []      # [motivo, importe]
var damage := 0.0
var animals: Array = []    # {node: FaunaAnimal, s, hit}
var trees: Array = []      # {s, node, fallen, side, t}
var detours: Array = []    # {s0, s1, side}
var next_animal := 0.0
var speeding_t := 0.0
var passed_junctions := {}
var horn_t := 0.0
var limit_kmh := 90
var boost := 100.0
var _draw_barrier: Node3D

func _ready() -> void:
	Game.current_mode = "truck"
	job = Game.TRUCK_JOBS[clampi(Game.current_level, 0, Game.TRUCK_JOBS.size() - 1)]
	var r: RoadPath = World.road(job["road"])
	s0 = job["s0"]
	s1 = minf(job["s1"], r.length - 10.0)
	setup_world(r, s0, job["time"])
	own_side_only = true
	car.allow_reverse = true
	car.speed = 0.0
	var lanes: Array = road.lanes_at(s0)
	car.x = lanes[lanes.size() - 1] if road.kind_at(s0) != "highway" else 6.45
	traffic.obey_lights = true
	traffic.allow_oncoming = true
	traffic.density = 0.9
	hud.set_title("PAGO")
	hud.lives_box.visible = false
	hud.combo_bar.visible = false
	hud.mult_lbl.visible = false
	hud.gauge.label_nitro = "TURBO"
	minimap.set_route_from(road, s0, s1)
	minimap.target = road.frame(s1).origin
	_place_trees()
	next_animal = s0 + randf_range(250.0, 450.0)
	_destination_marker()
	Sfx.play_music("music_drive")
	hud.banner(job["name"].to_upper(), "%s ➜ %s · %s" % [job["from"], job["to"], job["cargo"]], 2.6, UIKit.OK)
	for i in 8:
		traffic.spawn(s0 + 80.0 + i * 70.0)
	state = "run"
	place_player(0.016, 0.0)
	update_camera(1.0)
	var skip := float(OS.get_environment("SKIP")) if OS.get_environment("SKIP") != "" else 0.0
	for i in int(skip / 0.05):
		_process(0.05)

func touch_layout() -> Array:
	var l := TouchControls.racing_layout()
	l[3]["text"] = "TURBO"
	l.append({"action": "horn", "text": "BOCINA", "anchor": Vector2(1, 1), "offset": Vector2(-150, -300), "radius": 46.0, "color": UIKit.WARN, "font_size": 13})
	l.append({"action": "camera", "text": "CAM", "anchor": Vector2(1, 1), "offset": Vector2(-470, -70), "radius": 40.0, "color": Color(1, 1, 1), "font_size": 14})
	return l

# ------------------------------------------------------------------ PELIGROS
func _place_trees() -> void:
	var count := 1 + Game.current_level % 3
	var tries := 0
	while trees.size() < count and tries < 40:
		tries += 1
		var s := randf_range(s0 + 600.0, s1 - 300.0)
		var p := road.frame(s).origin
		var b: int = World.biome(p.x, p.z)
		if road.is_bridge(s) or road.is_tunnel(s) or road.is_bridge(s + 60.0) or road.is_tunnel(s - 60.0) or b in [3, 4, 12, 13]:
			continue
		var ok := true
		for t in trees:
			if absf(t["s"] - s) < 500.0:
				ok = false
		if ok:
			trees.append({"s": s, "node": null, "fallen": false, "side": 1.0, "t": 0.0})
			detours.append({"s0": s - 55.0, "s1": s + 55.0, "side": 1.0})

func _build_tree(t: Dictionary) -> void:
	var fr := road.frame(t["s"])
	var root := Node3D.new()
	add_child(root)
	var E := road.half_at(t["s"]) + 1.6
	root.global_transform = Transform3D(fr.basis, fr.origin + fr.basis.x * -(E + 1.5))
	var trunk := MeshInstance3D.new()
	var md := MeshData.new()
	md.prism(Vector3.ZERO, 0.45, 0.3, 16.0, 8, Color(0.4, 0.3, 0.2))
	var m := md.to_mesh(WorldAssets.mat("prop"))
	trunk.mesh = m
	var pivot := Node3D.new()
	root.add_child(pivot)
	pivot.add_child(trunk)
	var crown := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = WorldAssets.mesh("pine")
	mm.instance_count = 1
	mm.set_instance_transform(0, Transform3D(Basis.IDENTITY.scaled(Vector3(1.3, 1.6, 1.3)), Vector3(0, 0, 0)))
	mm.set_instance_color(0, Color.WHITE)
	mm.set_instance_custom_data(0, Color(0.5, 0.55, 0.45, 0))
	crown.multimesh = mm
	pivot.add_child(crown)
	t["node"] = root
	t["pivot"] = pivot
	# desvío de tierra por la derecha
	var dt := MeshData.new()
	var dirt_w := 7.0
	var ss: float = t["s"] - 60.0
	while ss < t["s"] + 60.0:
		var a := road.frame(ss)
		var b := road.frame(ss + 6.0)
		var off := smoothstep(0.0, 1.0, 1.0 - absf(ss + 3.0 - t["s"]) / 60.0)
		var xa := E - 1.5 + off * dirt_w
		var bo := smoothstep(0.0, 1.0, 1.0 - absf(ss + 9.0 - t["s"]) / 60.0)
		var xb := E - 1.5 + bo * dirt_w
		dt.quad(a.origin + a.basis.x * (xa - 3.5) + a.basis.y * 0.08, a.origin + a.basis.x * (xa + 3.5) + a.basis.y * 0.08,
			b.origin + b.basis.x * (xb + 3.5) + b.basis.y * 0.08, b.origin + b.basis.x * (xb - 3.5) + b.basis.y * 0.08, Color(0.55, 0.45, 0.32),
			Vector2(xa - 3.5, ss), Vector2(xa + 3.5, ss), Vector2(xb + 3.5, ss + 6.0), Vector2(xb - 3.5, ss + 6.0))
		ss += 6.0
	var dmi := MeshInstance3D.new()
	dmi.mesh = dt.to_mesh(WorldAssets.mat("road_dirt"))
	add_child(dmi)
	t["detour_mesh"] = dmi
	for k in 5:
		var cone := MeshInstance3D.new()
		cone.mesh = Props.cone()
		add_child(cone)
		var cf := road.frame(t["s"] - 90.0 + k * 8.0)
		cone.global_transform = Transform3D(cf.basis, cf.origin + cf.basis.x * lerpf(-E + 1.0, E - 2.0, k / 4.0))

func _update_trees(dt: float) -> void:
	for t in trees:
		var ds: float = t["s"] - car.s
		if t["node"] == null and ds < 400.0 and ds > -50.0:
			_build_tree(t)
		if t["node"] != null and not t["fallen"] and ds < 170.0:
			t["fallen"] = true
			Sfx.play("thud", 0.0, 0.6)
			hud.banner("¡ÁRBOL CAÍDO!", "Desvíate por el camino de tierra de la derecha", 2.2, UIKit.WARN)
			traffic.obstacles.append({"s": t["s"], "x": 0.0, "hl": 3.0, "hw": 20.0})
		if t["fallen"] and t["t"] < 1.0:
			t["t"] = minf(1.0, t["t"] + dt * 1.2)
			(t["pivot"] as Node3D).rotation.z = -PI * 0.5 * pow(t["t"], 2.0)
		if t["node"] != null and ds < -120.0:
			t["node"].queue_free()
			t["detour_mesh"].queue_free()
			t["node"] = null
		# choque con el tronco: bloquea la calzada
		if t["fallen"] and absf(ds) < pvis.length * 0.5 + 1.2 and car.x < road.half_at(t["s"]) + 0.5:
			if car.speed > 2.0:
				_crash("¡CHOCASTE CON EL ÁRBOL!", 18.0)
			car.s = t["s"] - pvis.length * 0.5 - 1.3
			car.speed = minf(car.speed, 0.0)

func _spawn_animal() -> void:
	var s := car.s + randf_range(150.0, 230.0)
	if s > s1 - 50.0 or road.is_tunnel(s) or road.is_bridge(s):
		return
	var fr := road.frame(s)
	var b: int = World.biome(fr.origin.x, fr.origin.z)
	if b in [3, 4, 12, 11]:
		return
	var E := road.half_at(s) + 7.0
	var dir := 1.0 if randf() < 0.5 else -1.0
	var a := fr.origin + fr.basis.x * (-E * dir)
	var bb := fr.origin + fr.basis.x * (E * dir)
	a.y = World.height(a.x, a.z)
	bb.y = World.height(bb.x, bb.z)
	var an := FaunaAnimal.new()
	add_child(an)
	var kinds := [[1.6, Color(0.55, 0.38, 0.22)], [1.3, Color(0.45, 0.45, 0.48)], [1.0, Color(0.8, 0.45, 0.2)], [2.2, Color(0.35, 0.25, 0.18)]]
	var k: Array = kinds[randi() % kinds.size()]
	an.setup(k[0], k[1], a, bb, randf_range(3.0, 5.5), 0.0)
	animals.append({"node": an, "s": s, "hit": false, "name": ["Ciervo", "Lobo", "Zorro", "Jabalí"][kinds.find(k)]})
	hud.warn("⚠ ANIMALES EN LA VÍA")

func _update_animals(dt: float) -> void:
	if car.s > next_animal:
		next_animal = car.s + randf_range(500.0, 900.0)
		_spawn_animal()
	var i := animals.size() - 1
	var cab := pvis.global_transform * Vector3(0, 1.0, -pvis.length * 0.25)
	while i >= 0:
		var a: Dictionary = animals[i]
		var an: FaunaAnimal = a["node"]
		if horn_t > 0.0 and an.active and an.global_position.distance_to(pvis.global_position) < 70.0 and an.fleeing <= 0.0:
			an.dir = -an.dir
			an.speed *= 1.8
		if not a["hit"] and an.active:
			var p := an.global_position + Vector3(0, 0.5, 0)
			var local := pvis.global_transform.affine_inverse() * p
			if absf(local.x) < 1.6 + an.radius and local.z > -pvis.length * 0.5 - an.radius and local.z < 9.0 and absf(local.y) < 3.0 and absf(car.speed) > 1.5:
				a["hit"] = true
				an.scare()
				_fine("ATROPELLO DE FAUNA (%s)" % a["name"], FINE_ANIMAL)
				damage += 8.0
				shake = 0.6
				Sfx.play("thud", 0.0)
				FX.burst(self, p, Color(0.8, 0.1, 0.05), 30, 8.0)
		if a["s"] < car.s - 80.0:
			an.queue_free()
			animals.remove_at(i)
		i -= 1

# ------------------------------------------------------------------ SEMÁFOROS, PASOS A NIVEL, PUENTE LEVADIZO
func _check_junctions() -> void:
	for jn in road.junctions:
		var js: float = jn[0]
		var key := "%d_%d" % [int(js), int(jn[1])]
		if passed_junctions.has(key):
			continue
		var stop = js - (ChunkBuilder.ROAD_E.get(World.roads[int(jn[1])].kind, 5.0) + 3.0)
		if car.s - pvis.length * 0.1 > stop and car.s < js + 10.0:
			passed_junctions[key] = true
			var other: RoadPath = World.roads[int(jn[1])]
			if jn[2] == "cross" and road.kind_at(js) != "highway":
				var st := World.light_state(World.junction_phase(road.id, other.id), World.time, TrafficSystem._is_major(road, other))
				if st == 2 and car.speed > 2.0:
					_fine("SEMÁFORO EN ROJO", FINE_RED)
			elif jn[2] == "rail":
				if _train_near(other, js):
					_crash("¡EL TREN TE ARROLLÓ!", 60.0)

func _train_near(rail: RoadPath, js: float) -> bool:
	var lm: WorldLandmarks = streamer.landmarks
	if lm.train_road == null:
		return false
	var cross_s := -1.0
	for j2 in rail.junctions:
		if int(j2[1]) == road.id:
			cross_s = j2[0]
	if cross_s < 0.0:
		return false
	return absf(lm.train_s - cross_s) < 160.0

func _drawbridge_state() -> String:
	if road.draw_s < 0.0:
		return ""
	var ds := road.draw_s - car.s
	if ds < -70.0 or ds > 400.0:
		return ""
	var open := WorldLandmarks.drawbridge_open(World.time)
	var tto := WorldLandmarks.drawbridge_time_to_open(World.time)
	if open > 0.0 or (tto < 8.0 and tto > 0.0):
		return "open"
	return "closed"

func _update_drawbridge() -> void:
	var st := _drawbridge_state()
	if st == "":
		return
	var gate := road.draw_s - 72.0
	if st == "open":
		hud.warn("PUENTE LEVADIZO ABIERTO · DETENTE")
		traffic.obstacles = traffic.obstacles.filter(func(o): return o.get("draw", false) == false)
		traffic.obstacles.append({"s": gate + 8.0, "x": 0.0, "hl": 2.0, "hw": 20.0, "draw": true})
		if car.s > gate and car.s < road.draw_s + 60.0 and WorldLandmarks.drawbridge_open(World.time) > 0.15:
			_crash("¡CAÍSTE AL RÍO POR EL PUENTE LEVADIZO!", 50.0)
			car.s = gate - 25.0
			car.speed = 0.0
	else:
		traffic.obstacles = traffic.obstacles.filter(func(o): return o.get("draw", false) == false)

# ------------------------------------------------------------------ MULTAS Y DAÑOS
func _fine(reason: String, amount: int) -> void:
	fines.append([reason, amount])
	hud.banner("MULTA ◆ %d" % amount, reason, 2.0, UIKit.DANGER)
	Sfx.play("lose", -6.0)

func _crash(msg: String, dmg: float) -> void:
	if state != "run":
		return
	damage += dmg
	shake = 1.0
	Sfx.play("crash", -2.0)
	FX.burst(self, pvis.global_position + Vector3(0, 2.0, 0), Color(1.0, 0.6, 0.2), 40, 10.0)
	hud.banner("¡CHOQUE!", msg, 1.8, UIKit.DANGER)
	if damage >= 100.0:
		_finish(false, "La carga quedó destrozada")

# ------------------------------------------------------------------ BUCLE
func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	state_t += dt
	read_input()
	horn_t = maxf(0.0, horn_t - dt)
	if Input.is_action_just_pressed("horn"):
		horn_t = 1.2
		Sfx.play("beep", 0.0, 0.5)
	var steer := steer_in
	var braking := brake_in
	if Game.autopilot:
		var ap := _autopilot()
		steer = ap[0]
		braking = ap[1]
	if state == "run":
		time += dt
		# turbo limitado
		var want_boost := nitro_in and boost > 1.0
		if want_boost:
			boost = maxf(0.0, boost - 18.0 * dt)
		else:
			boost = minf(100.0, boost + 3.0 * dt)
		car.nitro = boost
		step_player(dt, steer, braking, want_boost)
		_update_trees(dt)
		_update_animals(dt)
		_check_junctions()
		_update_drawbridge()
		_speed_check(dt)
		var r := collide_traffic()
		if r == "crash" or r == "takedown":
			_fine("ACCIDENTE DE TRÁFICO", FINE_CRASH)
			_crash("Golpeaste a otro vehículo", 20.0)
			car.speed = 0.0
		elif r == "scrape":
			damage += 1.0
		if car.s >= s1 - 4.0:
			car.speed = minf(car.speed, 8.0)
			if absf(car.speed) < 1.0 or car.s >= s1 + 20.0:
				_finish(true, "")
		car.s = clampf(car.s, s0 - 20.0, s1 + 25.0)
	elif state == "done":
		car.speed = move_toward(car.speed, 0.0, 10.0 * dt)
	traffic.player_s = car.s
	traffic.player_x = car.x
	traffic.update(dt)
	place_player(dt, steer)
	update_camera(dt)
	update_fx(dt)
	update_minimap()
	_hud()

func x_limits(s: float) -> Vector2:
	var k := road.kind_at(s)
	var E: float = ChunkBuilder.ROAD_E.get(k, 5.0)
	var lo := -E + 1.4 if k != "highway" else 1.6
	var hi := E - 1.4
	for d in detours:
		if s > d["s0"] and s < d["s1"]:
			var t: float = 1.0 - absf(s - (d["s0"] + d["s1"]) * 0.5) / ((d["s1"] - d["s0"]) * 0.5)
			hi += smoothstep(0.0, 1.0, t) * 8.0
	return Vector2(lo, hi)

func _speed_check(dt: float) -> void:
	var p := road.frame(car.s).origin
	var b: int = World.biome(p.x, p.z)
	var k := road.kind_at(car.s)
	limit_kmh = 110 if k == "highway" else (50 if b in [3, 4, 13] else (40 if k == "dirt" else 80))
	if car.speed_kmh() > limit_kmh + 20:
		speeding_t += dt
		if speeding_t > 3.0:
			speeding_t = -6.0
			_fine("EXCESO DE VELOCIDAD (%d km/h en zona de %d)" % [int(car.speed_kmh()), limit_kmh], FINE_SPEED)
	else:
		speeding_t = maxf(0.0, speeding_t - dt)

func _autopilot() -> Array:
	var lanes: Array = road.lanes_at(car.s)
	var tx: float = lanes[lanes.size() - 1] if road.kind_at(car.s) != "dirt" else 0.0
	var braking := false
	for t in trees:
		if t["fallen"] and t["s"] - car.s > -10.0 and t["s"] - car.s < 70.0:
			tx = road.half_at(t["s"]) + 6.5
	for jn in road.junctions:
		var g: float = jn[0] - car.s
		if g > 0.0 and g < 40.0 and jn[2] == "cross":
			var other: RoadPath = World.roads[int(jn[1])]
			if World.light_state(World.junction_phase(road.id, other.id), World.time, TrafficSystem._is_major(road, other)) == 2:
				braking = true
	for c in traffic.cars:
		if c["dir"] > 0 and absf(c["x"] - car.x) < 2.0:
			var g2 := traffic._ds(c["s"], car.s)
			if g2 > 0.0 and g2 < 22.0:
				braking = true
	if car.speed_kmh() > limit_kmh + 5:
		braking = true
	return [clampf((tx - car.x) * 0.5 - car.vx * 0.1, -1.0, 1.0), braking]

func _destination_marker() -> void:
	var fr := road.frame(s1)
	var m := MeshInstance3D.new()
	var md := MeshData.new()
	var E := road.half_at(s1) + 1.0
	for sx in [-1.0, 1.0]:
		md.box(Transform3D(fr.basis, fr.origin + fr.basis.x * sx * E + fr.basis.y * 4.0), Vector3(0.6, 8.0, 0.6), Color(1, 1, 1, 1))
	md.box(Transform3D(fr.basis, fr.origin + fr.basis.y * 8.0), Vector3(E * 2.0, 1.2, 0.4), Color(1, 1, 1, 1))
	m.mesh = md.to_mesh(MatLib.emissive(Color(0.1, 1.0, 0.4), 3.0))
	add_child(m)
	var l := Label3D.new()
	l.text = "ENTREGA · " + job["to"]
	l.font = UIKit.font("Orbitron-Black")
	l.font_size = 140
	l.pixel_size = 0.01
	l.modulate = Color(0.2, 1.0, 0.5)
	l.outline_size = 30
	l.global_transform = Transform3D(Basis(fr.basis.x * -1.0, fr.basis.y, fr.basis.z * -1.0), fr.origin + fr.basis.y * 10.0)
	add_child(l)

func _finish(win: bool, why: String) -> void:
	if state != "run":
		return
	state = "done"
	touch.release_all()
	var total_fines := 0
	for f in fines:
		total_fines += f[1]
	var pay: int = job["pay"]
	var dmg_cut := int(pay * clampf(damage / 100.0, 0.0, 1.0) * 0.6)
	var earned := maxi(0, pay - total_fines - dmg_cut) if win else 0
	var stars := 0
	if win:
		stars = 3 if (fines.is_empty() and damage < 20.0) else (2 if total_fines <= 300 and damage < 50.0 else 1)
		Game.complete_event("truck", Game.current_level, stars)
	Game.add_coins(earned)
	Sfx.play("win" if win else "lose", -2.0)
	var rows := [["Tiempo", Game.fmt_time(time)], ["Pago del trabajo", "◆ %d" % pay], ["Multas", "- ◆ %d (%d)" % [total_fines, fines.size()]], ["Daños a la carga", "%d%% (- ◆ %d)" % [int(damage), dmg_cut]], ["Ganancia", "◆ %d" % earned], ["Estrellas", "★".repeat(stars) + "☆".repeat(3 - stars)]]
	for f in fines.slice(0, 3):
		rows.append(["· " + f[0], "◆ %d" % f[1]])
	await get_tree().create_timer(1.0).timeout
	overlays.show_results("¡ENTREGADO!" if win else "TRABAJO FALLIDO", job["name"] if win else why, rows, "SIN MULTAS" if win and fines.is_empty() else "", win)

func _hud() -> void:
	var total_fines := 0
	for f in fines:
		total_fines += f[1]
	hud.score_lbl.text = "◆ %d" % maxi(0, int(job["pay"]) - total_fines)
	hud.best_lbl.text = "MULTAS %d · DAÑO %d%%" % [fines.size(), int(damage)]
	hud.set_distance("DESTINO", "%.2f km" % maxf(0.0, (s1 - car.s) / 1000.0))
	hud.set_speed(car.speed_kmh(), boost / 100.0, car.nitro_on)
	hud.set_extra("Límite %d km/h · %s" % [limit_kmh, job["cargo"]])
	var warn := ""
	for jn in road.junctions:
		var g: float = jn[0] - car.s
		if g > 0.0 and g < 120.0 and jn[2] == "cross" and road.kind_at(jn[0]) != "highway":
			var other: RoadPath = World.roads[int(jn[1])]
			var st := World.light_state(World.junction_phase(road.id, other.id), World.time, TrafficSystem._is_major(road, other))
			warn = ["SEMÁFORO EN VERDE", "SEMÁFORO EN ÁMBAR", "SEMÁFORO EN ROJO · DETENTE"][st]
			break
		if g > 0.0 and g < 200.0 and jn[2] == "rail" and _train_near(World.roads[int(jn[1])], jn[0]):
			warn = "PASO A NIVEL · TREN CERCA"
			break
	if _drawbridge_state() == "open":
		warn = "PUENTE LEVADIZO ABIERTO · DETENTE"
	for t in trees:
		if t["fallen"] and t["s"] - car.s > 0.0 and t["s"] - car.s < 160.0:
			warn = "⚠ ÁRBOL CAÍDO · DESVÍO A LA DERECHA"
	if not animals.is_empty() and animals[-1]["s"] - car.s > 0.0 and animals[-1]["s"] - car.s < 200.0 and not animals[-1]["hit"]:
		warn = "⚠ ANIMALES EN LA VÍA · TOCA LA BOCINA"
	if road.is_tunnel(car.s + 100.0) and not road.is_tunnel(car.s) and warn == "":
		warn = "TÚNEL"
	hud.warn(warn)
