class_name Career
## Carreras de camionero y de piloto: dinero (€), reputación, flota propia, alquileres y bolsa de trabajos.
## Se empieza sin dinero: el primer trabajo se hace con un camión (o avión) alquilado.

const CARGO := {
	"Paquetería": {"trailer": "box", "rate": 1.0, "rep": 0},
	"Electrodomésticos": {"trailer": "box", "rate": 1.15, "rep": 0},
	"Repuestos": {"trailer": "box", "rate": 1.05, "rep": 0},
	"Troncos": {"trailer": "logs", "rate": 1.1, "rep": 0},
	"Madera aserrada": {"trailer": "flatbed", "rate": 1.05, "rep": 0},
	"Heno": {"trailer": "flatbed", "rate": 0.95, "rep": 0},
	"Verduras": {"trailer": "reefer", "rate": 1.2, "rep": 0},
	"Contenedor": {"trailer": "container", "rate": 1.2, "rep": 1},
	"Frutas": {"trailer": "reefer", "rate": 1.25, "rep": 1},
	"Alimentos congelados": {"trailer": "reefer", "rate": 1.35, "rep": 1},
	"Leche": {"trailer": "tanker", "rate": 1.3, "rep": 1},
	"Bloques de piedra": {"trailer": "flatbed", "rate": 1.2, "rep": 1},
	"Ganado": {"trailer": "livestock", "rate": 1.45, "rep": 2},
	"Vino": {"trailer": "tanker", "rate": 1.4, "rep": 2},
	"Combustible": {"trailer": "tanker", "rate": 1.5, "rep": 2},
	"Acero": {"trailer": "flatbed", "rate": 1.3, "rep": 2},
	"Gas": {"trailer": "tanker", "rate": 1.55, "rep": 3},
	"Autos nuevos": {"trailer": "carrier", "rate": 1.55, "rep": 3},
	"Maquinaria pesada": {"trailer": "lowboy", "rate": 1.75, "rep": 4},
}
const TRAILERS := {
	"box": {"name": "Furgón seco", "desc": "Paquetería, electrodomésticos y repuestos", "price": 9000},
	"flatbed": {"name": "Plataforma", "desc": "Madera, heno, piedra y acero", "price": 7000},
	"logs": {"name": "Maderero", "desc": "Troncos", "price": 10000},
	"reefer": {"name": "Frigorífico", "desc": "Alimentos congelados, frutas y verduras", "price": 16000},
	"container": {"name": "Portacontenedores", "desc": "Contenedores del puerto", "price": 8000},
	"tanker": {"name": "Cisterna", "desc": "Líquidos: combustible, gas, leche y vino", "price": 18000},
	"livestock": {"name": "Ganadero", "desc": "Animales vivos", "price": 15000},
	"carrier": {"name": "Portacoches", "desc": "Autos nuevos", "price": 22000},
	"lowboy": {"name": "Góndola de carga pesada", "desc": "Maquinaria pesada", "price": 26000},
}
const VISUAL_TRAILERS := ["box", "container", "logs", "tanker", "flatbed", "carrier", "reefer", "heavy", "double"]
const SEMI := ["box", "container", "logs", "tanker", "flatbed", "carrier", "reefer", "heavy", "double", "livestock", "lowboy"]
const REP_LEVELS := [0, 300, 900, 2000, 3800, 6500, 10000]
const MAX_KM := [26.0, 36.0, 50.0, 70.0, 90.0, 120.0, 999.0]
const RENT_TRUCK := 0.2
const RENT_TRAILER := 0.1
const RENT_PLANE := 0.25

static func data(kind: String) -> Dictionary:
	var key := "career_" + kind
	if not (Game.save.get(key) is Dictionary):
		Game.save[key] = {}
	var d: Dictionary = Game.save[key]
	for k in ["rep", "jobs", "km"]:
		if not d.has(k):
			d[k] = 0
	for k in ["vehicles", "trailers"]:
		if not (d.get(k) is Array):
			d[k] = []
	if not Game.save.has("euros"):
		Game.save["euros"] = 0
	return d

static func money() -> int:
	return int(Game.save.get("euros", 0))

static func add_money(n: int) -> void:
	Game.save["euros"] = money() + n
	Game.write_save()

static func level(kind: String) -> int:
	var rep := int(data(kind)["rep"])
	var lv := 0
	for i in REP_LEVELS.size():
		if rep >= REP_LEVELS[i]:
			lv = i
	return lv

static func next_level_rep(kind: String) -> int:
	var lv := level(kind)
	return REP_LEVELS[mini(lv + 1, REP_LEVELS.size() - 1)]

static func fmt_eur(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "." + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if n < 0 else "") + s + out + " €"

# ------------------------------------------------------------------ CAMIONES
## Tractoras (cabezas que enganchan remolques) del catálogo.
static func tractors() -> Array:
	var out := []
	for v in VehicleCatalog.list("truck"):
		if v.get("trailer", "") in SEMI:
			out.append(v)
	return out

static func truck_price(v: Dictionary) -> int:
	return 12000 + int(v["price"]) * 6

static func trailer_visual(t: String) -> String:
	## Tipo de remolque que sabe dibujar VehicleVisual (por si falta alguno).
	if t in VISUAL_TRAILERS:
		return t
	return {"lowboy": "heavy", "livestock": "box"}.get(t, t)

static func owns_truck(id: String) -> bool:
	return id in data("truck")["vehicles"]

static func owns_trailer(t: String) -> bool:
	return t in data("truck")["trailers"]

static func buy_truck(v: Dictionary) -> bool:
	var p := truck_price(v)
	if money() < p or owns_truck(v["id"]):
		return false
	Game.save["euros"] = money() - p
	data("truck")["vehicles"].append(v["id"])
	Game.write_save()
	return true

static func buy_trailer(t: String) -> bool:
	var p: int = TRAILERS[t]["price"]
	if money() < p or owns_trailer(t):
		return false
	Game.save["euros"] = money() - p
	data("truck")["trailers"].append(t)
	Game.write_save()
	return true

static func depots() -> Array:
	return World.pois.get("depots", [])

static func depot(id: String) -> Dictionary:
	for d in depots():
		if d["id"] == id:
			return d
	return {}

## Bolsa de trabajos: cambia cada hora del juego. Más reputación = viajes más largos y cargas especiales.
## Las distancias son las de la ruta real por carretera.
static func truck_jobs() -> Array:
	var deps := depots()
	if deps.size() < 3:
		return []
	var lv := level("truck")
	var rng := RandomNumberGenerator.new()
	rng.seed = int(Game.hour) * 7919 + int(data("truck")["jobs"]) * 131 + 17
	var dealer := depot("dealer")
	var cands := []
	for k in 60:
		var a: Dictionary = deps[rng.randi() % deps.size()]
		var b: Dictionary = deps[rng.randi() % deps.size()]
		if a["id"] == b["id"] or b["id"] == "dealer":
			continue
		var cargo: String = a["cargo"][rng.randi() % a["cargo"].size()]
		var cinfo: Dictionary = CARGO.get(cargo, {"trailer": "box", "rate": 1.0, "rep": 0})
		var est := Vector2(dealer["x"], dealer["z"]).distance_to(Vector2(a["x"], a["z"])) + Vector2(a["x"], a["z"]).distance_to(Vector2(b["x"], b["z"]))
		cands.append({"a": a, "b": b, "cargo": cargo, "cinfo": cinfo, "est": est})
	# 4 trabajos accesibles (cortos y de tu nivel) + 5 al azar
	var easy := cands.filter(func(c): return int(c["cinfo"]["rep"]) <= lv)
	easy.sort_custom(func(x, y): return x["est"] < y["est"])
	var pick := []
	var used := {}
	for c in easy.slice(0, 12):
		var key: String = c["a"]["id"] + c["b"]["id"] + c["cargo"]
		if pick.size() < 4 and not used.has(key):
			pick.append(c)
			used[key] = true
	for c in cands:
		var key: String = c["a"]["id"] + c["b"]["id"] + c["cargo"]
		if pick.size() < 9 and not used.has(key):
			pick.append(c)
			used[key] = true
	var out := []
	for c in pick:
		var a: Dictionary = c["a"]
		var b: Dictionary = c["b"]
		var empty_km := 0.0
		if a["id"] != "dealer":
			empty_km = route_km(dealer, a)
		var km := route_km(a, b)
		if km <= 0.0:
			continue
		var cinfo: Dictionary = c["cinfo"]
		var locked = int(cinfo["rep"]) > lv or (empty_km + km) > MAX_KM[lv]
		var pay := int(round((900.0 + km * 380.0 * float(cinfo["rate"]) + empty_km * 90.0) / 50.0) * 50.0)
		out.append({"cargo": c["cargo"], "trailer": cinfo["trailer"], "from": a["id"], "to": b["id"], "from_name": a["name"], "to_name": b["name"],
			"km": km, "empty_km": empty_km, "pay": pay, "rep_req": int(cinfo["rep"]), "locked": locked,
			"rep_gain": int(60 + km * 14.0 * float(cinfo["rate"]))})
	out.sort_custom(func(x, y): return int(x["locked"]) < int(y["locked"]) or (x["locked"] == y["locked"] and x["km"] + x["empty_km"] < y["km"] + y["empty_km"]))
	return out

static var _km_cache := {}
static func route_km(a: Dictionary, b: Dictionary) -> float:
	var key: String = a["id"] + ">" + b["id"]
	if not _km_cache.has(key):
		var legs := RoutePlanner.find(int(a["road"]), float(a["s"]), int(b["road"]), float(b["s"]))
		var L := 0.0
		for l in legs:
			var rp: RoadPath = World.roads[l[0]]
			var span: float = l[2] - l[1]
			if rp.closed:
				span = wrapf(span, -rp.length * 0.5, rp.length * 0.5)
			L += absf(span)
		_km_cache[key] = L / 1000.0 if not legs.is_empty() else -1.0
	return _km_cache[key]

# ------------------------------------------------------------------ AVIONES
static func plane_price(v: Dictionary) -> int:
	return 25000 + int(v["price"]) * 9

static func owns_plane(id: String) -> bool:
	return id in data("plane")["vehicles"]

static func buy_plane(v: Dictionary) -> bool:
	var p := plane_price(v)
	if money() < p or owns_plane(v["id"]):
		return false
	Game.save["euros"] = money() - p
	data("plane")["vehicles"].append(v["id"])
	Game.write_save()
	return true

static func runways() -> Array:
	return World.pois.get("runways", [])

static func runway(id: String) -> Dictionary:
	for r in runways():
		if r.get("id", "") == id:
			return r
	if id == "carrier":
		return World.poi("carrier")
	return {}

## Trabajos de piloto: carga y pasajeros entre aeropuertos (los lejanos se desbloquean con reputación)
## y misiones de combate.
static func plane_jobs() -> Array:
	var lv := level("plane")
	var rws := runways()
	var out := []
	var rng := RandomNumberGenerator.new()
	rng.seed = int(Game.hour) * 4111 + int(data("plane")["jobs"]) * 97 + 5
	var kinds := [["Carga urgente", 1.0], ["Vuelo de pasajeros", 1.2], ["Correo aéreo", 0.9], ["Traslado médico", 1.4]]
	for r in rws:
		if r["id"] == "airport":
			continue
		var k: Array = kinds[rng.randi() % kinds.size()]
		var km := Vector2(r["x"], r["z"]).distance_to(Vector2(rws[0]["x"], rws[0]["z"])) / 1000.0
		var tier := int(r.get("tier", 0))
		out.append({"type": "transport", "name": "%s a %s" % [k[0], r["name"]], "from": "airport", "to": r["id"], "to_name": r["name"],
			"km": km, "pay": int(round((1500.0 + km * 700.0 * float(k[1])) / 50.0) * 50.0), "rep_req": tier, "locked": tier > lv,
			"rep_gain": int(80 + km * 25.0)})
	# vuelta al aeropuerto desde los regionales y misiones de combate
	for i in Game.AIR_MISSIONS.size():
		var m: Dictionary = Game.AIR_MISSIONS[i]
		var req := mini(i / 2, 5)
		out.append({"type": "combat", "name": m["name"], "mission": i, "to": m["land"], "to_name": m["land"], "km": 0.0,
			"pay": 2500 + i * 900, "rep_req": req, "locked": req > lv, "rep_gain": 150 + i * 60, "desc": m.get("desc", "")})
	out.sort_custom(func(x, y): return int(x["locked"]) < int(y["locked"]) or (x["locked"] == y["locked"] and int(x["rep_req"]) < int(y["rep_req"])))
	return out

## Cierra un trabajo: paga, suma reputación y kilómetros.
static func complete(kind: String, pay: int, rep_gain: int, km: float) -> void:
	var d := data(kind)
	add_money(pay)
	d["rep"] = int(d["rep"]) + rep_gain
	d["jobs"] = int(d["jobs"]) + 1
	d["km"] = float(d["km"]) + km
	Game.write_save()
