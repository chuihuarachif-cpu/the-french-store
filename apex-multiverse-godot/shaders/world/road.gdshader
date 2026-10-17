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
	ALBEDO = mix(a * (1.0 - w * 0.4), lc, paint);
	ROUGHNESS = mix(mix(0.85, 0.6, paint), 0.12, w);
	SPECULAR = 0.4 + w * 0.4;
}
