class_name VehicleCatalog
## 20 vehículos por modo. Estadísticas de 1 a 10. "price" 0 = disponible desde el inicio.
## "body" describe la forma procedural (ver VehicleVisual). "colors": pinturas disponibles
## (las 3 primeras gratis, el resto se desbloquea con monedas).

const COLOR_PRICE := 400

const PALETTE := {
	"rojo": Color(0.78, 0.04, 0.05), "azul": Color(0.03, 0.22, 0.75), "blanco": Color(0.93, 0.93, 0.95), "negro": Color(0.05, 0.05, 0.06),
	"naranja": Color(1.0, 0.45, 0.02), "verde": Color(0.05, 0.5, 0.22), "amarillo": Color(1.0, 0.78, 0.05), "plata": Color(0.66, 0.68, 0.72),
	"morado": Color(0.42, 0.08, 0.62), "cian": Color(0.0, 0.7, 0.85), "rosa": Color(0.95, 0.3, 0.6), "grafito": Color(0.22, 0.23, 0.26),
	"oro": Color(0.85, 0.62, 0.15), "lima": Color(0.55, 0.85, 0.08), "vino": Color(0.4, 0.04, 0.08), "arena": Color(0.78, 0.68, 0.5),
	"oliva": Color(0.32, 0.36, 0.2), "camuflaje": Color(0.36, 0.4, 0.3), "gris naval": Color(0.45, 0.5, 0.55), "azul marino": Color(0.08, 0.12, 0.3),
}

static func _car(id: String, name: String, shape: String, stats: Array, price: int, colors: Array, extra := {}) -> Dictionary:
	var d := {"id": id, "name": name, "kind": "car", "shape": shape, "speed": stats[0], "accel": stats[1], "handling": stats[2], "nitro": stats[3], "price": price, "colors": colors}
	d.merge(extra)
	return d

static func _moto(id: String, name: String, shape: String, stats: Array, price: int, colors: Array) -> Dictionary:
	return {"id": id, "name": name, "kind": "moto", "shape": shape, "speed": stats[0], "accel": stats[1], "handling": stats[2], "nitro": stats[3], "price": price, "colors": colors}

static func _truck(id: String, name: String, cab: String, trailer: String, stats: Array, price: int, colors: Array) -> Dictionary:
	return {"id": id, "name": name, "kind": "truck", "shape": cab, "trailer": trailer, "speed": stats[0], "accel": stats[1], "handling": stats[2], "nitro": stats[3], "price": price, "colors": colors}

static func _plane(id: String, name: String, shape: String, stats: Array, price: int, colors: Array) -> Dictionary:
	## stats: velocidad, aceleración, maniobra, armas
	return {"id": id, "name": name, "kind": "plane", "shape": shape, "speed": stats[0], "accel": stats[1], "handling": stats[2], "nitro": stats[3], "price": price, "colors": colors}

static var _lists := {}

static func list(mode: String) -> Array:
	if _lists.has(mode):
		return _lists[mode]
	var l := []
	match mode:
		"highway":
			l = [
				_car("hw_lumina", "Lumina GT", "coupe", [5, 5, 6, 5], 0, ["rojo", "blanco", "negro", "azul", "amarillo", "cian"]),
				_car("hw_citadin", "Citadin S", "hatch", [4, 6, 7, 4], 0, ["azul", "blanco", "rojo", "lima", "rosa", "naranja"]),
				_moto("hw_vespa", "Riviera 300", "scooter", [3, 6, 8, 4], 0, ["cian", "blanco", "rosa", "rojo", "amarillo", "negro"]),
				_car("hw_berline", "Berline 508", "sedan", [5, 5, 6, 5], 1500, ["plata", "negro", "blanco", "azul marino", "vino", "grafito"]),
				_moto("hw_strada", "Strada 650", "naked", [6, 7, 8, 5], 2000, ["rojo", "negro", "blanco", "naranja", "verde", "amarillo"]),
				_car("hw_vortex", "Vortex RS", "sport", [7, 6, 6, 6], 3500, ["naranja", "negro", "blanco", "verde", "morado", "cian"]),
				_moto("hw_falcon", "Falcon RR", "superbike", [8, 8, 7, 7], 4500, ["rojo", "blanco", "azul", "negro", "verde", "amarillo"]),
				_car("hw_atlas", "Atlas SUV", "suv", [5, 4, 5, 5], 2500, ["grafito", "blanco", "negro", "arena", "azul marino", "rojo"]),
				_car("hw_muscle", "Diablo 69", "muscle", [7, 7, 5, 6], 5000, ["negro", "rojo", "naranja", "verde", "amarillo", "azul"]),
				_moto("hw_touring", "Gran Tourer", "tourer", [6, 5, 6, 6], 3000, ["negro", "plata", "vino", "azul marino", "blanco", "grafito"]),
				_car("hw_eclair", "Éclair EV", "ev", [7, 9, 7, 6], 6500, ["blanco", "cian", "negro", "plata", "azul", "rojo"]),
				_moto("hw_cafe", "Café Racer 900", "cafe", [6, 6, 7, 6], 3800, ["verde", "negro", "plata", "rojo", "arena", "azul marino"]),
				_car("hw_spectre", "Spectre V12", "supercar", [9, 8, 7, 8], 9000, ["amarillo", "negro", "blanco", "rojo", "verde", "morado"]),
				_moto("hw_cross", "Dune MX", "dirt", [5, 8, 9, 5], 2800, ["naranja", "lima", "blanco", "azul", "rojo", "amarillo"]),
				_car("hw_pickup", "Rancher 4x4", "pickup", [5, 5, 5, 5], 2200, ["rojo", "negro", "blanco", "oliva", "arena", "azul"]),
				_car("hw_roadster", "Riviera Roadster", "roadster", [7, 7, 8, 6], 5500, ["rojo", "cian", "blanco", "verde", "oro", "negro"]),
				_moto("hw_hyper", "Hyperion H2", "superbike", [10, 9, 7, 9], 12000, ["negro", "verde", "plata", "rojo", "cian", "oro"]),
				_car("hw_hyper", "Apex Hyper", "hyper", [10, 9, 8, 9], 15000, ["negro", "naranja", "cian", "blanco", "morado", "rojo"]),
				_car("hw_van", "Furgo Express", "van", [4, 4, 4, 4], 800, ["blanco", "amarillo", "plata", "azul", "rojo", "verde"]),
				_car("hw_police", "Gendarme Interceptor", "sedan", [8, 8, 7, 8], 8000, ["azul marino", "blanco", "negro", "azul", "plata", "grafito"], {"police": true}),
			]
		"race":
			l = [
				_car("rc_rally", "Rallye 97", "rally", [6, 7, 8, 6], 0, ["blanco", "azul", "rojo", "amarillo", "verde", "naranja"], {"stripes": true, "number": 7}),
				_car("rc_gt3", "Lumina GT3", "gt", [7, 6, 7, 6], 0, ["rojo", "negro", "blanco", "cian", "naranja", "oro"], {"wing": true, "number": 21}),
				_car("rc_tuner", "Kaze Tuner", "coupe", [6, 7, 7, 7], 0, ["morado", "cian", "lima", "rosa", "negro", "blanco"], {"wing": true, "stripes": true, "number": 33}),
				_car("rc_muscle", "Diablo Drag", "muscle", [8, 8, 5, 7], 2500, ["negro", "naranja", "rojo", "verde", "azul", "amarillo"], {"stripes": true, "number": 69}),
				_car("rc_vortex", "Vortex RS-R", "sport", [8, 7, 7, 7], 3500, ["naranja", "negro", "blanco", "verde", "azul", "rojo"], {"wing": true, "number": 12}),
				_car("rc_baja", "Baja Raider", "rally", [6, 8, 8, 6], 3000, ["arena", "naranja", "negro", "blanco", "rojo", "oliva"], {"rally_lights": true, "number": 4}),
				_car("rc_spectre", "Spectre GTR", "supercar", [9, 8, 7, 8], 6000, ["amarillo", "negro", "blanco", "rojo", "cian", "verde"], {"wing": true, "number": 1}),
				_car("rc_le_mans", "Mans Prototype", "proto", [10, 8, 9, 7], 12000, ["blanco", "rojo", "azul", "negro", "oro", "cian"], {"wing": true, "number": 8}),
				_car("rc_roadster", "Riviera Cup", "roadster", [7, 8, 9, 6], 2800, ["rojo", "blanco", "azul", "amarillo", "verde", "negro"], {"stripes": true, "number": 14}),
				_car("rc_ev", "Éclair Formula E", "ev", [8, 10, 8, 7], 7000, ["cian", "blanco", "negro", "azul", "lima", "rosa"], {"wing": true, "number": 22}),
				_car("rc_hyper", "Apex Hyper R", "hyper", [10, 9, 8, 9], 15000, ["negro", "naranja", "cian", "blanco", "morado", "rojo"], {"wing": true, "number": 99}),
				_car("rc_hatch", "Citadin Cup", "hatch", [5, 8, 9, 6], 1200, ["amarillo", "rojo", "blanco", "azul", "verde", "negro"], {"stripes": true, "number": 46}),
				_car("rc_drift", "Kitsune Drift", "coupe", [7, 7, 9, 8], 4200, ["blanco", "rosa", "negro", "cian", "lima", "rojo"], {"wing": true, "stripes": true, "number": 86}),
				_car("rc_classic", "Monte Classic", "classic", [6, 6, 7, 6], 2200, ["verde", "azul marino", "rojo", "plata", "blanco", "oro"], {"stripes": true, "number": 3}),
				_car("rc_gt1", "Lumina GT1 Evo", "gt", [9, 8, 8, 8], 9000, ["plata", "negro", "rojo", "azul", "blanco", "naranja"], {"wing": true, "number": 11}),
				_car("rc_truck", "Monstre Trophy", "trophy", [7, 9, 6, 7], 5000, ["naranja", "negro", "rojo", "azul", "arena", "lima"], {"rally_lights": true, "number": 55}),
				_car("rc_muscle2", "Bastille Brawler", "muscle", [8, 9, 6, 9], 6500, ["grafito", "negro", "rojo", "amarillo", "verde", "vino"], {"number": 13, "armor": true}),
				_car("rc_police", "Gendarme Pursuit", "sedan", [9, 8, 7, 8], 8000, ["azul marino", "blanco", "negro", "azul", "plata", "grafito"], {"police": true}),
				_car("rc_concept", "Lumière Concept", "concept", [10, 10, 9, 9], 20000, ["blanco", "cian", "negro", "oro", "morado", "rojo"], {"wing": true}),
				_car("rc_legend", "Apex Leyenda", "proto", [10, 10, 10, 10], 30000, ["oro", "negro", "blanco", "rojo", "azul", "cian"], {"wing": true, "number": 0}),
			]
		"truck":
			l = [
				_truck("tk_routier", "Routier 440", "cabover", "box", [5, 5, 6, 5], 0, ["blanco", "azul", "rojo", "plata", "verde", "amarillo"]),
				_truck("tk_kodiak", "Kodiak W900", "conventional", "container", [6, 5, 5, 5], 0, ["negro", "vino", "blanco", "azul marino", "rojo", "plata"]),
				_truck("tk_bucheron", "Bûcheron 6x6", "offroad", "logs", [4, 7, 6, 6], 0, ["blanco", "azul", "rojo", "naranja", "verde", "negro"]),
				_truck("tk_citerne", "Citerne LT", "cabover", "tanker", [5, 5, 5, 5], 1500, ["blanco", "rojo", "amarillo", "plata", "verde", "azul"]),
				_truck("tk_plateau", "Plateau HD", "conventional", "flatbed", [6, 6, 5, 5], 1800, ["rojo", "negro", "blanco", "azul", "naranja", "amarillo"]),
				_truck("tk_benne", "Benne Titan", "offroad", "dump", [4, 8, 5, 6], 2200, ["amarillo", "naranja", "blanco", "rojo", "negro", "verde"]),
				_truck("tk_porteur", "Porte-Voitures", "cabover", "carrier", [5, 5, 4, 5], 3000, ["plata", "blanco", "azul", "negro", "rojo", "verde"]),
				_truck("tk_frigo", "Frigo Express", "cabover", "reefer", [6, 6, 6, 5], 2600, ["blanco", "cian", "azul", "verde", "plata", "rojo"]),
				_truck("tk_legend", "Kodiak Legend", "conventional", "box", [7, 6, 5, 6], 4500, ["negro", "oro", "vino", "blanco", "azul marino", "rojo"]),
				_truck("tk_mammouth", "Mammouth 8x8", "offroad", "heavy", [3, 9, 4, 7], 6000, ["oliva", "arena", "negro", "naranja", "amarillo", "blanco"]),
				_truck("tk_alpin", "Alpin 4x4", "offroad", "flatbed", [5, 7, 7, 6], 3500, ["rojo", "blanco", "azul", "naranja", "negro", "lima"]),
				_truck("tk_aero", "Aéro Liner", "cabover", "box", [8, 6, 6, 6], 5500, ["plata", "blanco", "azul", "negro", "rojo", "cian"]),
				_truck("tk_bulldog", "Bulldog Classic", "conventional", "logs", [5, 6, 5, 6], 3200, ["verde", "negro", "rojo", "blanco", "arena", "azul"]),
				_truck("tk_militaire", "Militaire 6x6", "offroad", "military", [5, 8, 6, 7], 7000, ["oliva", "camuflaje", "arena", "negro", "gris naval", "blanco"]),
				_truck("tk_container2", "Port Hauler", "cabover", "container", [6, 6, 5, 5], 2400, ["azul", "naranja", "blanco", "verde", "rojo", "plata"]),
				_truck("tk_pompier", "Pompiers FPT", "cabover", "fire", [6, 7, 6, 7], 8000, ["rojo", "amarillo", "blanco", "rojo", "negro", "plata"]),
				_truck("tk_chrome", "Chrome Shadow", "conventional", "tanker", [8, 7, 5, 7], 9000, ["negro", "plata", "vino", "azul marino", "oro", "blanco"]),
				_truck("tk_grue", "Grue Mobile", "offroad", "crane", [4, 6, 4, 6], 6500, ["amarillo", "naranja", "blanco", "rojo", "negro", "azul"]),
				_truck("tk_desert", "Désert King", "conventional", "flatbed", [7, 7, 6, 7], 7500, ["arena", "naranja", "negro", "blanco", "rojo", "azul"]),
				_truck("tk_titan", "Titan Road Train", "conventional", "double", [9, 8, 5, 8], 14000, ["negro", "rojo", "blanco", "oro", "azul", "plata"]),
			]
		"plane":
			l = [
				_plane("pl_cessna", "Libellule 172", "highwing", [3, 4, 6, 2], 0, ["blanco", "rojo", "azul", "amarillo", "verde", "naranja"]),
				_plane("pl_tucano", "Toucan T-27", "trainer", [4, 5, 7, 4], 0, ["azul", "blanco", "amarillo", "rojo", "gris naval", "camuflaje"]),
				_plane("pl_warbird", "Spitfire Lumière", "warbird", [5, 5, 7, 5], 0, ["verde", "gris naval", "oliva", "plata", "azul", "camuflaje"]),
				_plane("pl_alpha", "Alpha Jet", "trainerjet", [5, 6, 8, 5], 1800, ["blanco", "azul", "rojo", "gris naval", "camuflaje", "negro"]),
				_plane("pl_f5", "Tigre F-5", "light", [6, 7, 8, 5], 2500, ["gris naval", "camuflaje", "arena", "azul", "blanco", "negro"]),
				_plane("pl_mirage", "Mirage 2000", "delta", [7, 7, 7, 6], 3500, ["gris naval", "azul", "camuflaje", "arena", "negro", "blanco"]),
				_plane("pl_f16", "Faucon F-16", "fighter", [7, 8, 9, 6], 4500, ["gris naval", "azul", "camuflaje", "negro", "arena", "rojo"]),
				_plane("pl_hornet", "Frelon F/A-18", "twin", [7, 7, 8, 7], 5000, ["gris naval", "azul marino", "camuflaje", "negro", "blanco", "arena"]),
				_plane("pl_rafale", "Rafale Lumière", "canard", [8, 8, 9, 8], 7500, ["gris naval", "azul", "negro", "camuflaje", "blanco", "oro"]),
				_plane("pl_typhoon", "Typhon EF", "canard", [8, 9, 8, 7], 7000, ["gris naval", "camuflaje", "azul", "negro", "blanco", "rojo"]),
				_plane("pl_gripen", "Griffon JAS", "canard", [7, 8, 9, 6], 5800, ["gris naval", "blanco", "azul", "camuflaje", "negro", "arena"]),
				_plane("pl_su27", "Flanker S-27", "heavy", [8, 7, 9, 8], 8500, ["azul", "gris naval", "camuflaje", "blanco", "negro", "arena"]),
				_plane("pl_mig29", "Fulcrum M-29", "twin", [7, 8, 9, 7], 6200, ["gris naval", "camuflaje", "azul", "arena", "negro", "rojo"]),
				_plane("pl_f15", "Aigle F-15", "heavy", [9, 8, 7, 8], 9500, ["gris naval", "azul marino", "camuflaje", "negro", "arena", "blanco"]),
				_plane("pl_a10", "Phacochère A-10", "attacker", [4, 5, 6, 10], 6000, ["gris naval", "camuflaje", "oliva", "arena", "negro", "blanco"]),
				_plane("pl_harrier", "Busard AV-8", "vtol", [5, 7, 8, 6], 6800, ["gris naval", "camuflaje", "azul", "oliva", "negro", "arena"]),
				_plane("pl_f22", "Raptor F-22", "stealth", [9, 9, 10, 8], 14000, ["gris naval", "negro", "grafito", "azul", "camuflaje", "blanco"]),
				_plane("pl_f35", "Éclair F-35", "stealth1", [8, 8, 9, 9], 12000, ["gris naval", "grafito", "negro", "azul", "camuflaje", "blanco"]),
				_plane("pl_su57", "Félon S-57", "stealth", [9, 9, 10, 9], 16000, ["camuflaje", "gris naval", "azul", "negro", "grafito", "blanco"]),
				_plane("pl_concept", "Apex X-1 Phantom", "concept", [10, 10, 10, 10], 25000, ["negro", "blanco", "cian", "oro", "morado", "rojo"]),
			]
	_lists[mode] = l
	return l

static func get_vehicle(mode: String, id: String) -> Dictionary:
	for v in list(mode):
		if v["id"] == id:
			return v
	return list(mode)[0]

static func color_of(name: String) -> Color:
	return PALETTE.get(name, Color(0.7, 0.7, 0.7))
