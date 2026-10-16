extends Node
## Estado global: modos, niveles, guardado y transiciones.

const MODES := {
	"highway": {"title": "INFINITO", "subtitle": "Autopista sin fin", "scene": "res://scenes/Highway.tscn", "levels": 120},
	"race": {"title": "HISTORIA", "subtitle": "Carreras de leyenda", "scene": "res://scenes/Race.tscn", "levels": 120},
	"truck": {"title": "CAMIONES", "subtitle": "Tramo peligroso", "scene": "res://scenes/Truck.tscn", "levels": 120},
	"space": {"title": "COHETES", "subtitle": "Galaxia infinita", "scene": "res://scenes/Space.tscn", "levels": 120},
}
## Niveles jugables actualmente por modo (el resto se muestra como "próximamente").
const PLAYABLE_LEVELS := 1

var autopilot := false
var current_mode := "highway"
var current_level := 1
var rng := RandomNumberGenerator.new()
var save := {}
const SAVE_PATH := "user://apex_save.json"

func _ready() -> void:
	rng.randomize()
	_load()
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_input()
	apply_quality()
	autopilot = OS.get_environment("AUTOPILOT") == "1"
	if OS.get_environment("SHOT") != "":
		add_child(load("res://tools_test/shot.gd").new())

const ACTIONS := {
	"steer_left": [KEY_LEFT, KEY_A], "steer_right": [KEY_RIGHT, KEY_D],
	"accelerate": [KEY_UP, KEY_W], "brake": [KEY_DOWN, KEY_S],
	"nitro": [KEY_SPACE, KEY_SHIFT], "pause": [KEY_ESCAPE, KEY_P], "camera": [KEY_C],
}

func _setup_input() -> void:
	for a in ACTIONS:
		if not InputMap.has_action(a):
			InputMap.add_action(a)
		for k in ACTIONS[a]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(a, ev)

## Calidad: 0 = rendimiento (720p), 1 = equilibrado (900p), 2 = alta (resolución nativa)
func apply_quality() -> void:
	var q: int = save.get("quality", 1)
	var win := get_tree().root
	if q >= 2:
		win.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	else:
		win.content_scale_mode = Window.CONTENT_SCALE_MODE_VIEWPORT
		win.content_scale_size = Vector2i(1280, 720) if q == 0 else Vector2i(1600, 900)
	win.msaa_3d = Viewport.MSAA_DISABLED if q == 0 else Viewport.MSAA_2X

func _load() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
		var d = JSON.parse_string(f.get_as_text())
		if d is Dictionary:
			save = d
	for k in ["best_highway", "best_space", "best_race_time", "best_truck_time", "coins", "stars_race", "stars_truck"]:
		if not save.has(k):
			save[k] = 0
	if not save.has("music"):
		save["music"] = true
	if not save.has("sfx"):
		save["sfx"] = true
	if not save.has("quality"):
		save["quality"] = 1

func car_color() -> Color:
	var c = save.get("car_color", "")
	return Color.html(c) if c is String and c != "" else Color(0.78, 0.04, 0.05)

static func fmt_time(sec: float) -> String:
	var m := int(sec) / 60
	var s := fmod(sec, 60.0)
	return "%d:%05.2f" % [m, s]

func write_save() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save))

func start_mode(mode: String, level: int = 1) -> void:
	current_mode = mode
	current_level = level
	goto_scene(MODES[mode]["scene"])

func goto_menu() -> void:
	goto_scene("res://scenes/Menu.tscn")

func goto_scene(path: String) -> void:
	get_tree().paused = false
	var fade := _fade_layer()
	var tw := create_tween()
	tw.tween_property(fade.get_child(0), "modulate:a", 1.0, 0.25)
	await tw.finished
	get_tree().change_scene_to_file(path)
	await get_tree().process_frame
	await get_tree().process_frame
	var tw2 := create_tween()
	tw2.tween_property(fade.get_child(0), "modulate:a", 0.0, 0.35)

var _fade: CanvasLayer
func _fade_layer() -> CanvasLayer:
	if _fade:
		return _fade
	_fade = CanvasLayer.new()
	_fade.layer = 100
	var r := ColorRect.new()
	r.color = Color(0.01, 0.015, 0.03)
	r.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	r.modulate.a = 0.0
	_fade.add_child(r)
	add_child(_fade)
	return _fade
