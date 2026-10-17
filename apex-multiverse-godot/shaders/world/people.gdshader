shader_type spatial;
// Peatones animados en GPU (sin coste de CPU). COLOR.rgb marca la zona: r camiseta, g pantalón, b piel.
// COLOR.a: parte del cuerpo (0 tronco, .25 pierna izq, .5 pierna der, .75 brazo izq, 1 brazo der).
// INSTANCE_CUSTOM: rgb color de ropa, a = fase (>=0 camina 24 m ida y vuelta; <0 quieto).
global uniform float game_time;
varying vec3 vc;

float hash(float p) { return fract(sin(p * 91.3458) * 47453.5453); }

void vertex() {
	float ph = INSTANCE_CUSTOM.a;
	float walking = step(0.0, ph);
	float t = game_time * 1.35 / 24.0 + ph;
	float tri = abs(fract(t) * 2.0 - 1.0);
	float dir = fract(t) < 0.5 ? 1.0 : -1.0;
	float part = COLOR.a;
	float sw = sin(game_time * 7.0 + ph * 40.0) * walking;
	if (part > 0.1 && part < 0.6) {
		float s = part < 0.35 ? 1.0 : -1.0;
		VERTEX.z += sw * s * (0.92 - VERTEX.y) * 0.55;
	} else if (part > 0.6) {
		float s = part < 0.85 ? -1.0 : 1.0;
		VERTEX.z += sw * s * (1.45 - VERTEX.y) * 0.45;
	}
	// sentado / quieto: leve balanceo
	VERTEX.y -= (1.0 - walking) * step(INSTANCE_CUSTOM.a, -1.5) * 0.45 * step(VERTEX.y, 0.9) * VERTEX.y;
	VERTEX.xz *= mix(1.0, dir, walking);
	VERTEX.z += walking * (tri - 0.5) * 24.0;
	float h = hash(ph * 13.0 + INSTANCE_CUSTOM.r);
	vec3 skin = mix(vec3(0.95, 0.76, 0.6), vec3(0.36, 0.22, 0.14), h);
	vec3 pants = mix(vec3(0.12, 0.16, 0.3), vec3(0.25, 0.22, 0.2), hash(h));
	vc = COLOR.r * INSTANCE_CUSTOM.rgb + COLOR.g * pants + COLOR.b * skin + (1.0 - min(COLOR.r + COLOR.g + COLOR.b, 1.0)) * vec3(0.06);
}

void fragment() {
	ALBEDO = vc;
	ROUGHNESS = 0.85;
}
