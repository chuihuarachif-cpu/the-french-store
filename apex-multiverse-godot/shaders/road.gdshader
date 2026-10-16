shader_type spatial;
// Carretera: asfalto PBR + marcas viales procedurales desde un perfil lateral.
// UV.x = posición lateral (m), UV.y = distancia recorrida (m).
uniform sampler2D albedo_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rough_tex : hint_default_white, filter_linear_mipmap_anisotropic, repeat_enable;
// R = línea continua, G = línea discontinua, B = arcén, A = desgaste de neumáticos
uniform sampler2D profile_tex : filter_linear, repeat_disable;
uniform float x_min = -24.0;
uniform float x_max = 10.0;
uniform float tex_scale = 0.2;
uniform float dash_len = 12.0;
uniform float dash_on = 0.3;
uniform float wet = 0.0;
uniform vec3 line_color : source_color = vec3(0.93, 0.93, 0.9);
uniform vec3 tint : source_color = vec3(1.0);

varying vec2 ruv;

void vertex() {
	ruv = UV;
}

void fragment() {
	vec2 tuv = ruv * tex_scale;
	vec3 a = texture(albedo_tex, tuv).rgb;
	a = mix(vec3(dot(a, vec3(0.333))), a, 0.6);
	a = mix(vec3(0.16), a, 0.7);
	float big = texture(albedo_tex, ruv * 0.013).r;
	a *= 0.8 + big * 1.6;
	float px = clamp((ruv.x - x_min) / (x_max - x_min), 0.0, 1.0);
	vec4 prof = texture(profile_tex, vec2(px, 0.5));
	float dash = step(fract(ruv.y / dash_len), dash_on);
	float paint = max(prof.r, prof.g * dash);
	// grano de la pintura
	paint *= 0.82 + 0.18 * texture(albedo_tex, tuv * 3.1).g * 4.0;
	paint = clamp(paint, 0.0, 1.0);
	vec3 base = a * tint;
	base = mix(base, base * 1.18 + vec3(0.015), prof.b);
	base *= 1.0 - prof.a * 0.28;
	ALBEDO = mix(base * (1.0 - wet * 0.45), line_color, paint);
	float r = texture(rough_tex, tuv).r;
	r = mix(r, 0.55, paint);
	r = mix(r, r * 0.25 + 0.04, wet * (1.0 - paint * 0.6));
	ROUGHNESS = r;
	SPECULAR = 0.5 + wet * 0.3;
	NORMAL_MAP = mix(texture(normal_tex, tuv).rgb, vec3(0.5, 0.5, 1.0), paint * 0.7 + wet * 0.5);
	NORMAL_MAP_DEPTH = 0.45;
}
