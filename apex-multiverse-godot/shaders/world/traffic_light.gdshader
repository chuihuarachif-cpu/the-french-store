shader_type spatial;
// Semáforo: COLOR.r/g/b marcan las lámparas roja/ámbar/verde. INSTANCE_CUSTOM.x = fase, y = 1 vía principal.
// Misma lógica que World.light_state() para que lo que se ve coincida con las multas.
global uniform float game_time;
uniform float cycle = 24.0;
varying vec3 lamp;
varying float state;

void vertex() {
	float u = fract(game_time / cycle + INSTANCE_CUSTOM.x);
	if (INSTANCE_CUSTOM.y < 0.5) { u = fract(u + 0.5); }
	state = u < 0.42 ? 0.0 : (u < 0.5 ? 1.0 : 2.0);
	lamp = COLOR.rgb;
}

void fragment() {
	vec3 base = vec3(0.05, 0.05, 0.055);
	float r = lamp.r * step(1.5, state);
	float y = lamp.g * step(0.5, state) * step(state, 1.5);
	float g = lamp.b * step(state, 0.5);
	vec3 e = vec3(1.0, 0.08, 0.04) * r + vec3(1.0, 0.6, 0.0) * y + vec3(0.1, 1.0, 0.35) * g;
	float any_lamp = max(lamp.r, max(lamp.g, lamp.b));
	ALBEDO = mix(base, vec3(0.1), any_lamp);
	EMISSION = e * 5.0;
	ROUGHNESS = 0.4;
}
