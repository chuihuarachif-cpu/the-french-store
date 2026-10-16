class_name FaunaAnimal
extends Node3D
## Animal salvaje (modelo Fox de Khronos, CC0/CC-BY) que cruza el camino de lado a lado.
## Si el camión lo golpea, se dispara la señal 'hit'.

signal hit(animal)

var speed := 4.0
var a := Vector3.ZERO
var b := Vector3.ZERO
var t := 0.0
var dir := 1.0
var wait := 0.0
var fleeing := 0.0
var ap: AnimationPlayer
var model: Node3D
var radius := 0.8
var active := true

func setup(scale_len: float, tint: Color, from: Vector3, to: Vector3, spd: float, phase: float) -> void:
	model = (load("res://assets/models/Fox.glb") as PackedScene).instantiate()
	add_child(model)
	var k := scale_len / 155.0
	model.scale = Vector3(k, k, k)
	radius = scale_len * 0.45
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		var m: MeshInstance3D = mi
		for si in m.mesh.get_surface_count():
			var src := m.mesh.surface_get_material(si)
			if src is StandardMaterial3D:
				var mm: StandardMaterial3D = src.duplicate()
				mm.albedo_color = tint
				m.set_surface_override_material(si, mm)
	ap = model.find_child("AnimationPlayer", true, false)
	a = from
	b = to
	speed = spd
	t = phase
	if ap:
		var anim := ap.get_animation("Run")
		if anim:
			anim.loop_mode = Animation.LOOP_LINEAR
		var w := ap.get_animation("Survey")
		if w:
			w.loop_mode = Animation.LOOP_LINEAR
		ap.play("Run")

func _process(dt: float) -> void:
	if fleeing > 0.0:
		fleeing -= dt
		global_position += (b - a).normalized() * dir * 9.0 * dt + Vector3(0, (fleeing - 0.6) * 6.0 * dt, 0)
		if fleeing <= 0.0:
			visible = false
			active = false
		return
	if wait > 0.0:
		wait -= dt
		if wait <= 0.0 and ap:
			ap.play("Run")
		return
	var l := a.distance_to(b)
	t += dir * speed * dt / l
	if t >= 1.0 or t <= 0.0:
		t = clampf(t, 0.0, 1.0)
		dir = -dir
		wait = randf_range(0.8, 2.6)
		if ap:
			ap.play("Survey")
	var p := a.lerp(b, t)
	global_position = p
	var fwd := (b - a).normalized() * dir
	look_at(p - fwd, Vector3.UP)

func scare() -> void:
	fleeing = 1.2
	if ap:
		ap.play("Run")
		ap.speed_scale = 1.6
