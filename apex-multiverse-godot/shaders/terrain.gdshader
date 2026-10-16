shader_type spatial;
// Terreno: mezcla césped / tierra / roca por pendiente y ruido; UV en coordenadas de mundo.
uniform sampler2D grass_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D dirt_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D dirt_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_tex : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_nrm : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float scale = 0.12;
uniform float rock_slope = 0.72;
uniform float dirt_amount = 0.35;
uniform vec3 grass_tint : source_color = vec3(1.0);
uniform vec3 snow_color : source_color = vec3(0.92, 0.94, 0.98);
uniform float snow_height = 9999.0;

varying vec3 wpos;
varying vec3 wnrm;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wnrm = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
}

void fragment() {
	vec2 uv = wpos.xz * scale;
	vec3 g = texture(grass_tex, uv).rgb * grass_tint;
	vec3 gfar = texture(grass_tex, uv * 0.11).rgb * grass_tint;
	g = mix(g, gfar, 0.45);
	vec3 d = texture(dirt_tex, uv * 0.8).rgb;
	float n = texture(dirt_tex, wpos.xz * 0.004).r;
	float dm = smoothstep(0.55 - dirt_amount * 0.3, 0.75 - dirt_amount * 0.3, n + (1.0 - wnrm.y) * 0.8);
	// roca triplanar simple (proyección lateral)
	vec3 rx = texture(rock_tex, wpos.zy * scale * 0.6).rgb;
	vec3 rz = texture(rock_tex, wpos.xy * scale * 0.6).rgb;
	vec3 r = mix(rx, rz, abs(wnrm.z) / (abs(wnrm.x) + abs(wnrm.z) + 0.001));
	float rm = smoothstep(rock_slope + 0.06, rock_slope - 0.06, wnrm.y);
	vec3 col = mix(g, d, dm);
	col = mix(col, r, rm);
	float sm = smoothstep(snow_height, snow_height + 12.0, wpos.y + n * 10.0) * smoothstep(0.45, 0.7, wnrm.y);
	col = mix(col, snow_color, sm);
	ALBEDO = col;
	vec3 nm = mix(texture(grass_nrm, uv).rgb, texture(dirt_nrm, uv * 0.8).rgb, dm);
	nm = mix(nm, texture(rock_nrm, wpos.zy * scale * 0.6).rgb, rm);
	NORMAL_MAP = nm;
	ROUGHNESS = mix(0.92, 0.8, rm) - sm * 0.3;
	SPECULAR = 0.3;
}
