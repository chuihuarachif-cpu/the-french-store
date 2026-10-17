shader_type spatial;
// Lluvia, granizo y nieve: cilindros alrededor de la cámara con trazos procedurales (sin partículas).
// COLOR.r = capa (0 cerca, 1 lejos). UV.x = metros alrededor del cilindro, UV.y = altura en metros.
render_mode unshaded, blend_mix, cull_disabled, depth_draw_never, shadows_disabled, fog_disabled;
uniform float intensity = 0.0;
uniform float kind = 0.0;      // 0 lluvia, 1 granizo, 2 nieve
uniform vec3 tint : source_color = vec3(0.7, 0.75, 0.8);
uniform float cam_y = 0.0;
global uniform float game_time;
global uniform float lightning;

float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

void fragment() {
	float layer = COLOR.r;
	float dens = mix(6.0, 2.2, layer) * (kind > 1.5 ? 2.2 : 1.0);
	vec2 uv = UV;
	float speed = kind < 0.5 ? 11.0 : (kind < 1.5 ? 16.0 : 1.4);
	uv.x += uv.y * (kind < 1.5 ? 0.12 : 0.0);
	float colx = uv.x * dens;
	float aa = clamp(1.6 - fwidth(colx) * 3.0, 0.0, 1.0);
	float id = floor(colx);
	float fx = fract(colx);
	float h = hash(id + layer * 37.0);
	float h2 = hash(id * 1.7 + 11.0 + layer * 5.0);
	if (kind > 1.5) {
		fx += sin(game_time * (0.7 + h * 0.8) + h2 * 6.28) * 0.25;
	}
	float y = uv.y + cam_y + game_time * speed * (0.8 + h * 0.45) + h2 * 37.0;
	float spacing = kind < 0.5 ? 3.2 : (kind < 1.5 ? 2.3 : 1.6);
	float seg = fract(y / spacing + h * 3.0);
	float a = 0.0;
	if (kind < 0.5) {
		float len = 0.22 + h2 * 0.18;
		a = smoothstep(0.0, 0.03, seg) * (1.0 - smoothstep(len - 0.05, len, seg));
		a *= pow(clamp(1.0 - abs(fx - 0.5) * 2.0, 0.0, 1.0), 6.0) * 0.55;
	} else {
		float len = kind < 1.5 ? 0.1 : 0.07;
		vec2 q = vec2((fx - 0.5) * 2.0, (seg - len * 0.5) / len * 2.0);
		a = 1.0 - smoothstep(0.35, 1.0, length(q));
		a *= kind < 1.5 ? 0.95 : 0.85;
	}
	// solo una parte de las columnas tiene gota en cada momento (según la intensidad)
	a *= step(h2, 0.25 + intensity * 0.75);
	a *= mix(1.0, 0.55, layer) * aa;
	// sin trazos justo frente a la cámara ni muy arriba/abajo
	a *= smoothstep(-14.0, -6.0, UV.y) * (1.0 - smoothstep(10.0, 18.0, UV.y));
	ALBEDO = tint * (1.0 + lightning * 2.0);
	ALPHA = clamp(a * intensity, 0.0, 1.0);
}
