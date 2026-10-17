shader_type spatial;
// Autos ambientales en otras calles, movidos en GPU a lo largo de un tramo recto.
// INSTANCE_CUSTOM: rgb pintura, a = fase + longitud del tramo * 10 (parte entera).
global uniform float game_time;
global uniform float night;
varying vec3 vc;
varying float lamp;

void vertex() {
	float L = floor(INSTANCE_CUSTOM.a) / 10.0;
	float ph = fract(INSTANCE_CUSTOM.a);
	float spd = 13.0;
	float t = fract(game_time * spd / max(L, 1.0) + ph);
	float fade = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.94, t);
	VERTEX *= fade;
	VERTEX.z -= t * L;
	vc = mix(COLOR.rgb, INSTANCE_CUSTOM.rgb, COLOR.a);
	lamp = step(UV.y, -4.0);
}

void fragment() {
	ALBEDO = vc + vec3(0.5, 0.0, 0.0) * lamp;
	ROUGHNESS = 0.35;
	METALLIC = 0.3;
	EMISSION = vec3(1.0, 0.05, 0.02) * lamp * (0.6 + night * 3.0);
}
