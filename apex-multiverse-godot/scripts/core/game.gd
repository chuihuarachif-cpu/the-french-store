extends Node
## Estado global: modos, eventos del mapa único, garaje (vehículos y colores), guardado y transiciones.

const COUNTRY := "Fransterra"
const MODES := {
	"highway": {"title": "INFINITO", "subtitle": "Autopista A1 sin fin", "scene": "res://scenes/Highway.tscn"},
	"race": {"title": "HISTORIA", "subtitle": "Carreras callejeras", "scene": "res://scenes/Race.tscn"},
	"truck": {"title": "CAMIONES", "subtitle": "Entregas de A a B", "scene": "res://scenes/Truck.tscn"},
	"plane": {"title": "AVIONES", "subtitle": "Combate aéreo", "scene": "res://scenes/Plane.tscn"},
}

## Eventos del modo Historia: carreras sobre carreteras reales del país.
## road + [s0, s1] (tramo) o laps (circuito cerrado). rivals = cantidad de rivales.
const RACES := [
	{"name": "Gran Premio de Lumière", "road": "Boulevard Circulaire", "laps": 1, "rivals": 7, "dept": "Lumière", "time": "day", "desc": "El circuito urbano de la capital: rascacielos, puentes sobre el Sena y rivales que no frenan."},
	{"name": "Corniche d'Azur", "road": "Corniche d'Azur", "s0": 200.0, "s1": 5200.0, "rivals": 7, "dept": "Côte d'Azur", "time": "sunset", "desc": "Sprint por la costa al atardecer, entre playas, palmeras y hoteles."},
	{"name": "Barrio Rojo", "road": "Circuito Bastille", "laps": 1, "rivals": 7, "dept": "Bastille Sur", "time": "night", "desc": "Noche en Bastille Sur: barriles en llamas, edificios abandonados y pilotos sin reglas."},
	{"name": "Ruta de los Viñedos", "road": "Route des Vins", "laps": 1, "rivals": 7, "dept": "Vallée d'Or", "time": "sunrise", "desc": "Curvas rápidas entre viñedos al amanecer. Usa el nitro en las rectas."},
	{"name": "Duelo en la A1", "road": "A1 · Autopista Nacional", "s0": 2000.0, "s1": 8500.0, "rivals": 7, "dept": "Provence Verte", "time": "day", "desc": "Autopista nacional a fondo, con tráfico real. Los derribos valen doble."},
	{"name": "Bosque Negro", "road": "Chemin Forestier", "s0": 100.0, "s1": 6500.0, "rivals": 5, "dept": "Forêt Noire", "time": "day", "desc": "Rally por caminos de tierra del bosque. Saltos, árboles y polvo."},
	{"name": "Puerto Levadizo", "road": "Avenue du Port", "s0": 50.0, "s1": 4000.0, "rivals": 7, "dept": "Seine-Marine", "time": "sunset", "desc": "Hasta el puerto por el puente levadizo. Si se está abriendo... ¡salta!"},
	{"name": "Perímetro del Aeropuerto", "road": "Perímetro Saint-Exupéry", "laps": 1, "rivals": 7, "dept": "Saint-Exupéry", "time": "day", "desc": "Rectas eternas junto a la pista mientras despegan los aviones."},
	{"name": "Rally Alpino", "road": "Route des Alpes", "s0": 200.0, "s1": 12000.0, "rivals": 5, "dept": "Alpes du Nord", "time": "day", "desc": "Puerto de montaña con túneles, viaductos y curvas de herradura."},
	{"name": "Final: Vuelta a Fransterra", "road": "A1 · Autopista Nacional", "s0": 9000.0, "s1": 24000.0, "rivals": 7, "dept": "Fransterra", "time": "night", "desc": "La gran final: 15 km de autopista nocturna contra los mejores del país."},
]

## Trabajos del modo Camiones: de A a B por carreteras del país.
const TRUCK_JOBS := [
	{"name": "Madera para Saint-Clair", "road": "Ruta Maderera", "s0": 30.0, "s1": 4100.0, "from": "Aserradero de Forêt Noire", "to": "Ruta del Bosque (N7)", "cargo": "Troncos", "time": "day", "pay": 900},
	{"name": "Contenedores al puerto", "road": "Avenue du Port", "s0": 40.0, "s1": 4000.0, "from": "Port-Lumière", "to": "Puerto de Lumière", "cargo": "Contenedores", "time": "day", "pay": 1100},
	{"name": "Cruce de los Alpes", "road": "Route des Alpes", "s0": 100.0, "s1": 12400.0, "from": "Lumière Norte", "to": "Mont-Blanc Est", "cargo": "Maquinaria", "time": "day", "pay": 2400},
	{"name": "Reparto en la costa", "road": "Corniche d'Azur", "s0": 100.0, "s1": 8500.0, "from": "Puerto de Lumière", "to": "Vallée d'Or", "cargo": "Alimentos", "time": "sunset", "pay": 1500},
	{"name": "Carga aérea a Bastille", "road": "Ruta del Aeropuerto Carga", "s0": 20.0, "s1": 4500.0, "from": "Aeropuerto Saint-Exupéry", "to": "Bastille Sur", "cargo": "Paquetería", "time": "night", "pay": 1300},
	{"name": "Granja de Saint-Clair", "road": "Ruta de Saint-Clair", "s0": 20.0, "s1": 4600.0, "from": "Beaumont", "to": "Port-Lumière", "cargo": "Cosecha", "time": "sunrise", "pay": 1000},
	{"name": "Ronda Nacional", "road": "A1 · Autopista Nacional", "s0": 12000.0, "s1": 22000.0, "from": "Saint-Exupéry", "to": "Côte d'Azur", "cargo": "Combustible", "time": "day", "pay": 2000},
	{"name": "Bosque profundo", "road": "Chemin Forestier", "s0": 20.0, "s1": 6700.0, "from": "Valfroid", "to": "Aserradero de Forêt Noire", "cargo": "Troncos", "time": "sunset", "pay": 1700},
]

## Misiones aéreas: despegue (aeropuerto, aeródromo o portaaviones), combate y aterrizaje.
const AIR_MISSIONS := [
	{"name": "Bautismo de vuelo", "start": "airport", "land": "airport", "enemies": 2, "target": [-2000.0, 3000.0], "time": "day", "desc": "Despega del Saint-Exupéry, derriba a 2 intrusos sobre Vallée d'Or y vuelve a aterrizar."},
	{"name": "Defensa de la capital", "start": "airport", "land": "airfield", "enemies": 4, "target": [0.0, -200.0], "time": "sunset", "desc": "Cazas enemigos sobre Port-Lumière. Protege la Torre Lumière y aterriza en Provence."},
	{"name": "Operación Sena", "start": "carrier", "land": "carrier", "enemies": 4, "target": [3800.0, -1500.0], "time": "day", "desc": "Despega del portaaviones, limpia el cielo del puerto y aterriza de nuevo en la cubierta."},
	{"name": "Cañones de los Alpes", "start": "airfield", "land": "airport", "enemies": 5, "target": [-500.0, -5600.0], "time": "day", "desc": "Persecución entre montañas nevadas. Cuidado con los picos."},
	{"name": "Costa en llamas", "start": "carrier", "land": "airport", "enemies": 6, "target": [4200.0, 3600.0], "time": "sunset", "desc": "Un escuadrón ataca la Côte d'Azur. Derríbalos sobre el mar."},
	{"name": "Noche sobre Bastille", "start": "airport", "land": "airport", "enemies": 5, "target": [900.0, 2700.0], "time": "night", "desc": "Combate nocturno sobre la zona roja. Usa el radar."},
	{"name": "Tormenta del norte", "start": "airfield", "land": "carrier", "enemies": 7, "target": [3200.0, -6000.0], "time": "day", "desc": "Escuadrón de élite sobre Mont-Blanc Est. Aterriza después en el portaaviones."},
	{"name": "Última batalla", "start": "carrier", "land": "carrier", "enemies": 10, "target": [-3000.0, 0.0], "time": "sunset", "desc": "Toda la fuerza aérea enemiga. Defiende Fransterra."},
]

var autopilot := false
var current_mode := "highway"
var current_level := 0
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
	if OS.get_environment("MODE") != "":
		current_mode = OS.get_environment("MODE")
	if OS.get_environment("LEVEL") != "":
		current_level = int(OS.get_environment("LEVEL"))
	if OS.get_environment("SHOT") != "":
		add_child(load("res://tools_test/shot.gd").new())

const ACTIONS := {
	"steer_left": [KEY_LEFT, KEY_A], "steer_right": [KEY_RIGHT, KEY_D],
	"accelerate": [KEY_UP, KEY_W], "brake": [KEY_DOWN, KEY_S],
	"nitro": [KEY_SPACE, KEY_SHIFT], "pause": [KEY_ESCAPE, KEY_P], "camera": [KEY_C],
	"pitch_up": [KEY_UP, KEY_W], "pitch_down": [KEY_DOWN, KEY_S], "fire": [KEY_F, KEY_ENTER], "missile": [KEY_R], "throttle_up": [KEY_E], "throttle_down": [KEY_Q], "horn": [KEY_H],
}

func _setup_input() -> void:
	for a in ACTIONS:
		if not InputMap.has_action(a):
			InputMap.add_action(a)
		for k in ACTIONS[a]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(a, ev)

## Calidad: 0 = rendimiento (móviles modestos), 1 = equilibrada, 2 = alta.
func quality() -> int:
	return int(save.get("quality", 0))

func apply_quality() -> void:
	var q := quality()
	var win := get_tree().root
	win.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	win.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_EXPAND
	win.content_scale_size = Vector2i(1280, 720)
	win.msaa_3d = Viewport.MSAA_DISABLED if q == 0 else Viewport.MSAA_2X
	# Render 3D a menor resolución en móviles (la interfaz sigue nítida).
	win.scaling_3d_mode = Viewport.SCALING_3D_MODE_BILINEAR
	var native := DisplayServer.screen_get_size()
	var target_h = [600.0, 760.0, 1080.0][q]
	var sc := clampf(target_h / maxf(float(mini(native.x, native.y)), 1.0), 0.45, 1.0)
	if OS.get_name() != "Android" and OS.get_name() != "iOS":
		sc = 1.0
	win.scaling_3d_scale = sc
	Engine.max_fps = 60
	RenderingServer.directional_shadow_atlas_set_size(1024 if q < 2 else 2048, true)

func _load() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
		var d = JSON.parse_string(f.get_as_text())
		if d is Dictionary:
			save = d
	for k in ["best_highway", "coins"]:
		if not save.has(k):
			save[k] = 0
	if not save.has("music"):
		save["music"] = true
	if not save.has("sfx"):
		save["sfx"] = true
	if not save.has("quality"):
		save["quality"] = 0 if OS.get_name() == "Android" else 1
	if OS.get_environment("QUALITY") != "":
		save["quality"] = int(OS.get_environment("QUALITY"))
	for k in ["owned", "colors", "selected", "progress", "stars"]:
		if not (save.get(k) is Dictionary):
			save[k] = {}
	# Vehículos gratuitos de cada modo
	for m in MODES:
		for v in VehicleCatalog.list(m):
			if int(v["price"]) == 0:
				save["owned"][v["id"]] = true
		if not save["selected"].has(m):
			save["selected"][m] = {"id": VehicleCatalog.list(m)[0]["id"], "color": VehicleCatalog.list(m)[0]["colors"][0]}

func write_save() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save))

func coins() -> int:
	return int(save.get("coins", 0))

func add_coins(n: int) -> void:
	save["coins"] = coins() + n
	write_save()

# ------------------------------------------------------------------ GARAJE
func owns(id: String) -> bool:
	return save["owned"].get(id, false)

func color_owned(id: String, color_idx: int) -> bool:
	return color_idx < 3 or save["colors"].get("%s:%d" % [id, color_idx], false)

func buy_vehicle(v: Dictionary) -> bool:
	if owns(v["id"]) or coins() < int(v["price"]):
		return false
	save["coins"] = coins() - int(v["price"])
	save["owned"][v["id"]] = true
	write_save()
	return true

func buy_color(id: String, idx: int) -> bool:
	if color_owned(id, idx) or coins() < VehicleCatalog.COLOR_PRICE:
		return false
	save["coins"] = coins() - VehicleCatalog.COLOR_PRICE
	save["colors"]["%s:%d" % [id, idx]] = true
	write_save()
	return true

func select_vehicle(mode: String, id: String, color_name: String) -> void:
	save["selected"][mode] = {"id": id, "color": color_name}
	write_save()

## Vehículo y color elegidos para el modo actual.
func selected(mode := "") -> Dictionary:
	if mode == "":
		mode = current_mode
	var sel: Dictionary = save["selected"].get(mode, {})
	var v := VehicleCatalog.get_vehicle(mode, sel.get("id", ""))
	return {"spec": v, "color": VehicleCatalog.color_of(sel.get("color", v["colors"][0]))}

func car_color() -> Color:
	return selected("highway")["color"]

# ------------------------------------------------------------------ PROGRESO
func events(mode: String) -> Array:
	match mode:
		"race":
			return RACES
		"truck":
			return TRUCK_JOBS
		"plane":
			return AIR_MISSIONS
	return []

func unlocked_events(mode: String) -> int:
	return int(save["progress"].get(mode, 0)) + 1

func complete_event(mode: String, idx: int, stars: int) -> void:
	save["progress"][mode] = maxi(int(save["progress"].get(mode, 0)), idx + 1)
	var key := "%s:%d" % [mode, idx]
	save["stars"][key] = maxi(int(save["stars"].get(key, 0)), stars)
	write_save()

func event_stars(mode: String, idx: int) -> int:
	return int(save["stars"].get("%s:%d" % [mode, idx], 0))

static func fmt_time(sec: float) -> String:
	var m := int(sec) / 60
	var s := fmod(sec, 60.0)
	return "%d:%05.2f" % [m, s]

# ------------------------------------------------------------------ ESCENAS
func start_mode(mode: String, level: int = 0) -> void:
	current_mode = mode
	current_level = level
	goto_scene(MODES[mode]["scene"])

func open_garage(mode: String) -> void:
	current_mode = mode
	goto_scene("res://scenes/Garage.tscn")

func goto_menu() -> void:
	goto_scene("res://scenes/Menu.tscn")

func goto_scene(path: String) -> void:
	get_tree().paused = false
	Engine.time_scale = 1.0
	var fade := _fade_layer()
	var tw := create_tween()
	tw.tween_property(fade.get_child(0), "modulate:a", 1.0, 0.2)
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
