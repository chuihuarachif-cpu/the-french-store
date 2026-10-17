extends Node
## Carga todos los scripts para detectar errores de análisis (prueba).
func _ready() -> void:
	for f in _scan("res://scripts"):
		var s = load(f)
		if s == null:
			print("FALLO ", f)
	print("LOAD_ALL_DONE")
	get_tree().quit()

func _scan(d: String) -> Array:
	var out := []
	var da := DirAccess.open(d)
	for f in da.get_files():
		if f.ends_with(".gd"):
			out.append(d + "/" + f)
	for sd in da.get_directories():
		out.append_array(_scan(d + "/" + sd))
	return out
