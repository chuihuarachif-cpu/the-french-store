shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec4 albedo_color : source_color = vec4(0.15, 0.65, 0.95, 0.88);
uniform vec4 rim_color : source_color = vec4(0.6, 0.95, 1.0, 1.0);
uniform float roughness : hint_range(0.0, 1.0) = 0.18;
uniform float metallic : hint_range(0.0, 1.0) = 0.1;
uniform float rim_power : hint_range(0.5, 8.0) = 2.8;
uniform float prism_iridescence : hint_range(0.0, 1.0) = 0.35;

void fragment() {
	float fresnel = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), rim_power);

	// Desplazamiento cromático sutil en los bordes (efecto Prisma)
	vec3 prism_shift = vec3(
		sin(fresnel * 6.2831 + 0.0) * 0.5 + 0.5,
		sin(fresnel * 6.2831 + 2.094) * 0.5 + 0.5,
		sin(fresnel * 6.2831 + 4.188) * 0.5 + 0.5
	);

	vec3 edge_glow = mix(rim_color.rgb, prism_shift, prism_iridescence) * fresnel;

	ALBEDO = albedo_color.rgb + edge_glow * 0.45;
	EMISSION = edge_glow * 0.35;
	ROUGHNESS = roughness;
	METALLIC = metallic;
	ALPHA = clamp(albedo_color.a + fresnel * 0.12, 0.0, 1.0);
}
