shader_type spatial;
// Camino de tierra: roderas, barro (COLOR.r) y charcos en baches (COLOR.g).
// UV.x = lateral (m), UV.y = distancia (m)
uniform sampler2D dirt_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D dirt_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D mud_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D mud_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float scale = 0.22;
varying vec4 vcol;
void vertex() { vcol = COLOR; }
void fragment() {
	vec2 uv = UV * scale;
	vec3 d = texture(dirt_tex, uv).rgb;
	vec3 m = texture(mud_tex, uv * 0.8).rgb;
	float mud = vcol.r;
	float hole = vcol.g;
	float rut = exp(-pow((abs(UV.x) - 1.05) / 0.38, 2.0));
	vec3 col = mix(d, m, mud);
	col *= 1.0 - rut * (0.16 + mud * 0.2);
	float edge = smoothstep(3.0, 4.4, abs(UV.x));
	col = mix(col, col * 0.8 + vec3(0.02, 0.03, 0.0), edge);
	col = mix(col, vec3(0.09, 0.075, 0.06), hole * 0.75);
	ALBEDO = col;
	NORMAL_MAP = mix(mix(texture(dirt_nrm, uv).rgb, texture(mud_nrm, uv * 0.8).rgb, mud), vec3(0.5, 0.5, 1.0), hole * 0.85);
	ROUGHNESS = mix(mix(0.95, 0.55, mud), 0.08, hole);
	SPECULAR = 0.3 + hole * 0.4;
}
