shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never;
// Agujero negro: disco de acreción giratorio con núcleo oscuro (se dibuja en un plano).
uniform vec3 hot : source_color = vec3(1.0, 0.55, 0.15);
uniform vec3 cool : source_color = vec3(0.55, 0.25, 1.0);
void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float r = length(p);
	float a = atan(p.y, p.x);
	float swirl = sin(a * 3.0 + r * 14.0 - TIME * 3.0) * 0.5 + 0.5;
	float swirl2 = sin(a * 7.0 - r * 22.0 - TIME * 5.0) * 0.5 + 0.5;
	float ring = smoothstep(0.22, 0.32, r) * smoothstep(1.0, 0.45, r);
	vec3 c = mix(cool, hot, smoothstep(0.9, 0.3, r)) * (0.5 + swirl * 0.7 + swirl2 * 0.3) * ring * 3.0;
	float halo = exp(-pow((r - 0.27) / 0.03, 2.0)) * 4.0;
	c += vec3(1.0, 0.85, 0.6) * halo;
	ALBEDO = c;
}
