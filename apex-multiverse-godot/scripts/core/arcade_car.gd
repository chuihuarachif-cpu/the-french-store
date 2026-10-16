class_name ArcadeCar
extends RefCounted
## Física arcade en "espacio de pista": s = distancia a lo largo de la vía, x = desplazamiento lateral.
## Usada por el modo Infinito y por el modo Historia (jugador e IA).

var s := 0.0
var x := 0.0
var vx := 0.0
var speed := 0.0
var max_speed := 72.0
var nitro_speed := 94.0
var accel := 16.0
var brake_decel := 34.0
var steer_rate := 10.0
var grip := 7.0
var nitro := 50.0
var nitro_on := false
var drift := 0.0
var x_min := -8.0
var x_max := 8.0
var scraping := 0
var throttle := 1.0
# Vertical (saltos)
var y := 0.0
var vy := 0.0
var airborne := false

func step(dt: float, steer: float, braking: bool, want_nitro: bool) -> void:
	nitro_on = want_nitro and nitro > 0.5 and not braking
	var top := nitro_speed if nitro_on else max_speed
	if nitro_on:
		nitro = maxf(0.0, nitro - 24.0 * dt)
	if braking:
		speed = maxf(0.0, speed - brake_decel * dt)
	elif speed < top:
		var a := accel * (1.0 - pow(speed / top, 2.2) * 0.75) * throttle
		if nitro_on:
			a += 22.0
		speed = minf(top, speed + a * dt)
	else:
		speed = maxf(top, speed - 9.0 * dt)
	# Dirección: velocidad lateral objetivo (más ágil a alta velocidad pero con límite)
	var lat_max := 6.5 + speed * 0.075
	var target := steer * lat_max
	if braking and absf(steer) > 0.3 and speed > 30.0:
		drift = move_toward(drift, signf(steer), dt * 3.0)
		target *= 1.25
		nitro = minf(100.0, nitro + 9.0 * dt)
	else:
		drift = move_toward(drift, 0.0, dt * 2.5)
	vx = lerpf(vx, target, clampf(grip * dt, 0.0, 1.0))
	x += vx * dt
	scraping = 0
	if x < x_min:
		x = x_min
		vx = maxf(vx, 0.0) + 1.5
		scraping = -1
		speed *= 1.0 - 0.6 * dt
	elif x > x_max:
		x = x_max
		vx = minf(vx, 0.0) - 1.5
		scraping = 1
		speed *= 1.0 - 0.6 * dt
	s += speed * dt

## Ángulo visual de guiñada (rad) respecto a la vía.
func yaw() -> float:
	return -atan2(vx, maxf(speed, 4.0)) * 0.9 - drift * 0.35

func speed_kmh() -> float:
	return speed * 3.6
