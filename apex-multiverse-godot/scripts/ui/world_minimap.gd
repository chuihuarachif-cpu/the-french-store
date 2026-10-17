class_name WorldMinimap
extends Control
## Minimapa del país: recorte del mapa alrededor del jugador (gira con él), ruta y puntos.

var tex: Texture2D
var center := Vector3.ZERO
var heading := 0.0          # rad, 0 = norte
var view := 1400.0          # metros visibles de lado a lado
var route := PackedVector3Array()
var dots: Array = []        # {pos, color, size}
var target := Vector3.INF
var radius := 92.0

func _ready() -> void:
	tex = load("res://assets/world/map.png")
	custom_minimum_size = Vector2(radius * 2, radius * 2)
	size = custom_minimum_size
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func set_route_from(r: RoadPath, s0: float, s1: float) -> void:
	route = PackedVector3Array()
	var s := s0
	while s <= s1:
		route.append(r.frame(s).origin)
		s += 40.0

func _process(_dt: float) -> void:
	queue_redraw()

func _w2m(p: Vector3) -> Vector2:
	var d := Vector2(p.x - center.x, p.z - center.z)
	d = d.rotated(-heading)
	return Vector2(radius, radius) + d * (radius * 2.0 / view)

func _draw() -> void:
	var c := Vector2(radius, radius)
	draw_rect(Rect2(Vector2.ZERO, size), Color(0, 0, 0, 0.55))
	# mapa: dibujado como polígono texturizado girado
	var half := view * 0.75
	var corners := [Vector3(-half, 0, -half), Vector3(half, 0, -half), Vector3(half, 0, half), Vector3(-half, 0, half)]
	var pts := PackedVector2Array()
	var uvs := PackedVector2Array()
	var ws: float = World.half * 2.0
	for k in corners:
		var wp: Vector3 = center + k
		pts.append(_w2m(wp))
		uvs.append(Vector2((wp.x + World.half) / ws, (wp.z + World.half) / ws))
	draw_colored_polygon(pts, Color(1, 1, 1, 0.92), uvs, tex)
	draw_rect(Rect2(Vector2.ZERO, size), Color(1, 1, 1, 0.45), false, 2.0)
	# ruta
	if route.size() > 1:
		var poly := PackedVector2Array()
		for p in route:
			var m := _w2m(p)
			if m.distance_to(c) < radius * 2.2:
				poly.append(m)
			elif poly.size() > 1:
				_line(poly)
				poly = PackedVector2Array()
			else:
				poly = PackedVector2Array()
		if poly.size() > 1:
			_line(poly)
	for d in dots:
		var m2 := _w2m(d["pos"])
		if absf(m2.x - c.x) < radius - 4 and absf(m2.y - c.y) < radius - 4:
			draw_circle(m2, d.get("size", 4.0), d["color"])
		else:
			var dir := (m2 - c).normalized()
			draw_circle(c + dir * (radius - 6) / maxf(absf(dir.x), absf(dir.y)), 3.0, d["color"])
	if target != Vector3.INF:
		var mt := _w2m(target)
		if mt.distance_to(c) > radius - 8:
			mt = c + (mt - c).normalized() * (radius - 8)
		draw_circle(mt, 7.0, Color(1.0, 0.8, 0.1))
		draw_arc(mt, 10.0, 0, TAU, 20, Color(0, 0, 0, 0.7), 2.0)
	# jugador (flecha)
	draw_colored_polygon(PackedVector2Array([c + Vector2(0, -10), c + Vector2(7, 8), c + Vector2(0, 4), c + Vector2(-7, 8)]), Color(0.1, 0.9, 1.0))

func _line(poly: PackedVector2Array) -> void:
	draw_polyline(poly, Color(0, 0, 0, 0.6), 6.0, true)
	draw_polyline(poly, Color(1.0, 0.75, 0.1), 3.5, true)
