shader_type spatial;
// Pista de aterrizaje: UV.x = lateral (m), UV.y = longitudinal (m). length/width uniforms.
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform float len = 3200.0;
uniform float wid = 60.0;
global uniform float night;

void fragment() {
	vec2 p = UV;
	vec3 a = texture(albedo_tex, p * 0.15).rgb * 0.75;
	float paint = 0.0;
	// línea central discontinua
	paint += step(abs(p.x), 0.45) * step(fract(p.y / 60.0), 0.5) * step(80.0, p.y) * step(p.y, len - 80.0);
	// bordes
	paint += step(wid * 0.5 - 1.2, abs(p.x)) * step(abs(p.x), wid * 0.5 - 0.3);
	// teclas de piano en cabeceras
	float ends = step(p.y, 60.0) + step(len - 60.0, p.y);
	paint += ends * step(fract(p.x / 3.6), 0.5) * step(abs(p.x), wid * 0.5 - 4.0) * step(8.0, min(p.y, len - p.y));
	// zonas de toma de contacto
	float tz = step(abs(p.x - 6.0 * sign(p.x)), 2.5) * step(4.0, abs(p.x));
	paint += tz * (step(abs(p.y - 300.0), 25.0) + step(abs(p.y - (len - 300.0)), 25.0) + step(abs(p.y - 450.0), 12.0) + step(abs(p.y - (len - 450.0)), 12.0));
	paint = clamp(paint, 0.0, 1.0);
	ALBEDO = mix(a, vec3(0.92), paint);
	// luces de borde de pista
	float lights = step(abs(abs(p.x) - wid * 0.5 + 0.2), 0.35) * step(fract(p.y / 30.0), 0.02);
	EMISSION = vec3(1.0, 0.9, 0.6) * lights * (0.5 + night * 6.0);
	ROUGHNESS = 0.8;
}
