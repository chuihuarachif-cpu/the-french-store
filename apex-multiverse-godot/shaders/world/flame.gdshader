shader_type spatial;
render_mode blend_add, unshaded, cull_disabled, shadows_disabled, depth_draw_never;
// Llama de barril (cartelera animada).
uniform sampler2D noise_tex : filter_linear, repeat_enable;
global uniform float game_time;

void vertex() {
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(INV_VIEW_MATRIX[0], INV_VIEW_MATRIX[1], INV_VIEW_MATRIX[2], MODEL_MATRIX[3]);
}

void fragment() {
	vec2 uv = UV;
	float n = texture(noise_tex, vec2(uv.x * 0.6, uv.y * 0.5 + game_time * 1.3)).r;
	float shape = smoothstep(0.5, 0.0, abs(uv.x - 0.5) * (1.4 - uv.y * 0.2) + (1.0 - uv.y) * 0.45 - n * 0.35);
	vec3 c = mix(vec3(1.0, 0.25, 0.02), vec3(1.0, 0.85, 0.3), uv.y);
	ALBEDO = c * shape * 2.5;
}
