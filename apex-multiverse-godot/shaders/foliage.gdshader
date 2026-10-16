shader_type spatial;
render_mode cull_disabled;
// Follaje con recorte alfa, viento y translucidez falsa.
uniform sampler2D tex : source_color, filter_linear_mipmap, repeat_disable;
uniform vec3 tint : source_color = vec3(1.0);
uniform float wind = 0.08;
uniform float cutoff = 0.4;

void vertex() {
	vec3 w = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float sway = sin(TIME * 1.7 + w.x * 0.35 + w.z * 0.27) * wind * max(VERTEX.y, 0.0) * 0.15;
	VERTEX.x += sway;
	VERTEX.z += sway * 0.6;
}

void fragment() {
	vec4 c = texture(tex, UV);
	if (c.a < cutoff) discard;
	ALBEDO = c.rgb * tint * (0.75 + 0.35 * UV.y);
	ROUGHNESS = 0.8;
	SPECULAR = 0.2;
	BACKLIGHT = vec3(0.25, 0.32, 0.12);
}
