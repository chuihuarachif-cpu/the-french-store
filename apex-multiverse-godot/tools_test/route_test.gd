extends Node
## Prueba de la bolsa de trabajos y de las rutas reales.
func _ready() -> void:
	var js := Career.truck_jobs()
	print("TRABAJOS ", js.size())
	for j in js:
		print("  ", j["cargo"], " ", j["from"], "->", j["to"], " km=", snappedf(j["km"], 0.1), " vacio=", snappedf(j["empty_km"], 0.1), " locked=", j["locked"])
	var d := Career.depot("dealer")
	for dd in Career.depots():
		print("KM dealer->", dd["id"], " ", Career.route_km(d, dd), " via ", World.roads[int(dd["road"])].name)
	for id in []:
		var b := Career.depot(id)
		var t0 := Time.get_ticks_msec()
		var legs := RoutePlanner.find(int(d["road"]), float(d["s"]), int(b["road"]), float(b["s"]))
		var r: RoadPath = RoutePlanner.compose(legs, "x") if not legs.is_empty() else null
		print("RUTA dealer->", id, " tramos=", legs.size(), " km=", (r.length / 1000.0) if r else -1.0, " ms=", Time.get_ticks_msec() - t0, " cruces=", r.junctions.size() if r else 0)
	get_tree().quit()
