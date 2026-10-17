class_name Debris
extends Node3D
## Piezas que salen volando en los choques (puertas, parachoques, cristales). Sin física real: barato.

var parts: Array = []   # {node, vel, spin_axis, spin}
var life := 2.6
static var _mesh: BoxMesh

static func spawn(parent: Node, pos: Vector3, col: Color, base_vel: Vector3, count := 10) -> void:
	var d := Debris.new()
	parent.add_child(d)
	d.global_position = pos
	if _mesh == null:
		_mesh = BoxMesh.new()
		_mesh.size = Vector3(0.5, 0.12, 0.7)
	var mats := [MatLib.color(col, 0.35, 0.5), MatLib.color(Color(0.05, 0.05, 0.06), 0.6), MatLib.color(Color(0.6, 0.7, 0.75, 0.7), 0.05, 0.3)]
	for i in count:
		var mi := MeshInstance3D.new()
		mi.mesh = _mesh
		mi.material_override = mats[i % mats.size()]
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		mi.scale = Vector3.ONE * randf_range(0.4, 1.4)
		d.add_child(mi)
		d.parts.append({"node": mi, "vel": base_vel + Vector3(randf_range(-7, 7), randf_range(4, 12), randf_range(-7, 7)),
			"axis": Vector3(randf(), randf(), randf()).normalized(), "spin": randf_range(6, 18)})

func _process(dt: float) -> void:
	life -= dt
	for p in parts:
		var n: Node3D = p["node"]
		p["vel"] += Vector3(0, -20.0, 0) * dt
		n.position += p["vel"] * dt
		n.rotate(p["axis"], p["spin"] * dt)
		if life < 0.6:
			n.scale *= 0.92
	if life <= 0.0:
		queue_free()
