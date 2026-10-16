class_name Minimap
extends Control
## Minimapa del circuito: contorno de la pista y puntos de los coches.

var pts := PackedVector2Array()
var dots: Array = []  # [{pos: Vector3, color: Color, size: float}]
var _min := Vector2.ZERO
var _scale := 1.0
var _off := Vector2.ZERO

func setup(track_points: PackedVector3Array, box := Vector2(220, 180)) -> void:
	custom_minimum_size = box
	size = box
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mn := Vector2(1e9, 1e9)
	var mx := Vector2(-1e9, -1e9)
	for p in track_points:
		mn = Vector2(minf(mn.x, p.x), minf(mn.y, p.z))
		mx = Vector2(maxf(mx.x, p.x), maxf(mx.y, p.z))
	var ext := mx - mn
	_scale = minf((box.x - 24) / ext.x, (box.y - 24) / ext.y)
	_min = mn
	_off = (box - ext * _scale) * 0.5
	for i in range(0, track_points.size(), 4):
		pts.append(_map(track_points[i]))
	pts.append(pts[0])

func _map(p: Vector3) -> Vector2:
	return (Vector2(p.x, p.z) - _min) * _scale + _off

func _process(_dt: float) -> void:
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.02, 0.04, 0.08, 0.55), true)
	draw_polyline(pts, Color(0, 0, 0, 0.6), 8.0, true)
	draw_polyline(pts, Color(0.85, 0.9, 1.0, 0.9), 4.0, true)
	for d in dots:
		draw_circle(_map(d["pos"]), d.get("size", 5.0), d["color"])
