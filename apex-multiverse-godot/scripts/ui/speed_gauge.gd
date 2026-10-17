class_name SpeedGauge
extends Control
## Velocímetro de arco + barra de nitro segmentada, dibujado a mano.

var speed := 0.0
var max_speed := 360.0
var nitro := 0.5
var nitro_active := false
var gear := 1
var unit := "KM/H"
var label_nitro := "NITRO"
var _num: Label
var _unit: Label
var _gear: Label

func _ready() -> void:
	custom_minimum_size = Vector2(300, 230)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_num = UIKit.label("0", 76, "Orbitron-Black", Color.WHITE, HORIZONTAL_ALIGNMENT_RIGHT)
	_num.position = Vector2(20, 60)
	_num.size = Vector2(210, 90)
	add_child(_num)
	_unit = UIKit.label(unit, 20, "Orbitron-Bold", UIKit.ACCENT, HORIZONTAL_ALIGNMENT_RIGHT)
	_unit.position = Vector2(20, 142)
	_unit.size = Vector2(210, 30)
	add_child(_unit)
	_gear = UIKit.label("1", 30, "Orbitron-Black", UIKit.WARN, HORIZONTAL_ALIGNMENT_CENTER)
	_gear.position = Vector2(232, 96)
	_gear.size = Vector2(50, 40)
	add_child(_gear)

func _process(_dt: float) -> void:
	_num.text = str(int(round(speed)))
	_unit.text = unit
	gear = clampi(1 + int(speed / (max_speed / 7.0)), 1, 7)
	_gear.text = str(gear) if speed > 2.0 else "N"
	queue_redraw()

func _draw() -> void:
	var c := Vector2(150, 125)
	var r := 112.0
	var a0 := deg_to_rad(150.0)
	var a1 := deg_to_rad(390.0)
	draw_arc(c, r, a0, a1, 32, Color(1, 1, 1, 0.12), 10.0, false)
	var t := clampf(speed / max_speed, 0.0, 1.0)
	var col := UIKit.ACCENT.lerp(UIKit.DANGER, smoothstep(0.7, 1.0, t))
	if t > 0.001:
		draw_arc(c, r, a0, lerpf(a0, a1, t), 32, col, 10.0, false)
	for i in 13:
		var a := lerpf(a0, a1, i / 12.0)
		var d := Vector2(cos(a), sin(a))
		draw_line(c + d * (r - 18), c + d * (r - 8), Color(1, 1, 1, 0.5), 2.0, false)
	# Nitro: 10 segmentos inclinados
	var segs := 10
	var w := 22.0
	for i in segs:
		var x := 30.0 + i * (w + 4.0)
		var on := float(i) / segs < nitro
		var nc := Color(0.25, 0.75, 1.0) if not nitro_active else Color(0.6, 0.95, 1.0)
		var poly := PackedVector2Array([Vector2(x + 6, 196), Vector2(x + w + 6, 196), Vector2(x + w, 212), Vector2(x, 212)])
		draw_colored_polygon(poly, nc if on else Color(1, 1, 1, 0.12))
	draw_string(UIKit.font("Orbitron-Bold"), Vector2(30, 232), label_nitro, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.6, 0.85, 1.0))
