shader_type spatial;
// Planeta con atmósfera (rim) y textura equirectangular.
uniform sampler2D tex : source_color, filter_linear_mipmap, repeat_enable;
uniform vec3 atmo : source_color = vec3(0.4, 0.6, 1.0);
uniform float atmo_strength = 1.4;
uniform float spin = 0.01;
uniform float emission = 0.0;
void fragment() {
	vec2 uv = UV + vec2(TIME * spin, 0.0);
	vec3 c = texture(tex, uv).rgb;
	ALBEDO = c;
	ROUGHNESS = 0.9;
	SPECULAR = 0.2;
	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	EMISSION = atmo * rim * atmo_strength + c * emission;
}
