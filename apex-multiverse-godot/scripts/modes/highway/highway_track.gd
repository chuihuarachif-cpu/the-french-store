class_name HighwayTrack
extends RefCounted
## Trazado analítico infinito (curvas suaves y colinas). frame(s) devuelve un Transform3D
## con origen en el eje del carril propio: basis.x = derecha, basis.y = arriba, -basis.z = adelante.

var seed_off := 0.0

func _init(seed_value := 0.0) -> void:
	seed_off = seed_value

func center(s: float) -> Vector3:
	var t := s + seed_off
	var cx := 70.0 * sin(t / 900.0) + 26.0 * sin(t / 330.0 + 1.3) + 8.0 * sin(t / 151.0 + 0.4)
	var cy := 9.0 * sin(t / 640.0) + 3.5 * sin(t / 233.0 + 0.7)
	# Arranque recto y plano
	var k := smoothstep(0.0, 400.0, s)
	return Vector3(cx * k, cy * k, -s)

func frame(s: float) -> Transform3D:
	var p := center(s)
	var f := (center(s + 1.0) - center(s - 1.0)).normalized()
	var r := f.cross(Vector3.UP).normalized()
	# Peralte leve según curvatura
	var c0 := center(s - 12.0)
	var c2 := center(s + 12.0)
	var curv := ((c2 - p) - (p - c0)).x / 144.0
	var bank := clampf(-curv * 55.0, -0.07, 0.07)
	r = r.rotated(f, bank)
	var u := r.cross(f).normalized()
	return Transform3D(Basis(r, u, -f), p)

func point(s: float, x: float, y := 0.0) -> Vector3:
	var fr := frame(s)
	return fr.origin + fr.basis.x * x + fr.basis.y * y
