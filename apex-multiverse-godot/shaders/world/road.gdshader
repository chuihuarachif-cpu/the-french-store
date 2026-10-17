shader_type spatial;
// Calzada: asfalto + marcas viales desde un perfil lateral. UV.x = lateral (m), UV.y = distancia (m).
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D profile_tex : filter_linear, repeat_disable;
uniform float x_min = -15.0;
uniform float x_max = 15.0;
uniform float dash_len = 12.0;
uniform float dash_on = 0.4;
uniform vec3 tint : source_color = vec3(1.0);
uniform vec3 line_color : source_color = vec3(0.93, 0.93, 0.9);
uniform vec3 center_color : source_color = vec3(0.95, 0.75, 0.15);
uniform float dirt = 0.0;
global uniform float wet;
global uniform float night;
global uniform float snow;
uniform float lamp_mode = 0.0;   // 0 sin farolas, 1 autopista (mediana cada 48 m), 2 avenida (alternadas cada 32 m)

varying vec2 ruv;

void vertex() {
	ruv = UV;
}

void fragment() {
	vec2 tuv = ruv * 0.2;
	vec3 a = texture(albedo_tex, tuv).rgb;
	a = mix(vec3(dot(a, vec3(0.333))), a, 0.5);
	float big = texture(albedo_tex, ruv * 0.011).r;
	a *= (0.75 + big * 1.4) * tint;
	float px = clamp((ruv.x - x_min) / (x_max - x_min), 0.0, 1.0);
	vec4 prof = texture(profile_tex, vec2(px, 0.5));
	float dash = step(fract(ruv.y / dash_len), dash_on);
	float paint = clamp(max(prof.r, prof.g * dash), 0.0, 1.0) * (1.0 - dirt);
	vec3 lc = mix(line_color, center_color, prof.b);
	a *= 1.0 - prof.a * 0.25;
	float w = wet * (1.0 - dirt);
	vec3 alb = mix(a * (1.0 - w * 0.4), lc, paint);
	// nieve acumulada en los bordes (los carriles quedan con rodadas)
	float lane_clear = smoothstep(0.0, 0.6, abs(fract(abs(ruv.x) / 3.7) - 0.5) * 2.0);
	alb = mix(alb, vec3(0.92, 0.94, 0.97), snow * mix(0.35, 0.9, lane_clear) * (1.0 - dirt * 0.3));
	ALBEDO = alb;
	ROUGHNESS = mix(mix(0.85, 0.6, paint), 0.1, w);
	SPECULAR = 0.4 + w * 0.45;
	// charcos: manchas más brillantes con el suelo mojado
	float puddle = smoothstep(0.55, 0.75, texture(albedo_tex, ruv * 0.031).g) * w;
	ROUGHNESS = mix(ROUGHNESS, 0.02, puddle);
	ALBEDO *= 1.0 - puddle * 0.35;
	// luz de las farolas (falsa, sin coste de luces reales)
	if (lamp_mode > 0.5 && night > 0.02) {
		float L = 0.0;
		if (lamp_mode < 1.5) {
			float dy = mod(ruv.y + 24.0, 48.0) - 24.0;
			float d = length(vec2(abs(ruv.x) - 6.0, dy * 0.8));
			L = exp(-d * d / 90.0);
		} else {
			float k = floor((ruv.y + 16.0) / 32.0);
			float dy = ruv.y - k * 32.0;
			float side = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
			float d = length(vec2(ruv.x - side * 5.0, dy * 0.8));
			L = exp(-d * d / 60.0);
		}
		EMISSION = (ALBEDO * 0.8 + vec3(0.07)) * vec3(1.0, 0.72, 0.42) * L * night * (3.0 + w * 2.5);
	}
}
