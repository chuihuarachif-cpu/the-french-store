shader_type spatial;
// Terreno del país: mezcla por mapas del mundo (splat + tinte) con texturas en mosaico.
uniform sampler2D splat_map : filter_linear, repeat_disable;
uniform sampler2D tint_map : filter_linear, repeat_disable;
uniform sampler2D grass_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D dirt_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D rock_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D sand_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D urban_tex : source_color, filter_linear_mipmap, repeat_enable;
uniform float world_half = 8192.0;
uniform float snow_height = 600.0;
uniform bool hq = true;
global uniform float night;

varying vec3 wpos;
varying vec3 wn;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	wn = NORMAL;
}

void fragment() {
	vec2 muv = (wpos.xz + world_half) / (2.0 * world_half);
	vec4 sp = texture(splat_map, muv);
	vec3 tn = texture(tint_map, muv).rgb * 1.4;
	vec2 uv = wpos.xz * 0.09;
	vec3 g = texture(grass_tex, uv).rgb;
	float big = texture(grass_tex, wpos.xz * 0.0071).g;
	if (hq) {
		g = mix(g, texture(grass_tex, uv * 0.13).rgb, 0.4);
	}
	g *= tn * (0.8 + big * 0.5);
	vec3 d = texture(dirt_tex, uv * 0.9).rgb;
	vec3 r = texture(rock_tex, vec2(wpos.x + wpos.y * 0.6, wpos.z - wpos.y * 0.4) * 0.05).rgb;
	vec3 s = texture(sand_tex, uv * 0.8).rgb;
	vec3 u = texture(urban_tex, uv * 0.6).rgb * vec3(0.46, 0.46, 0.48);
	vec3 col = mix(g, d * mix(vec3(1.0), tn, 0.35), sp.r);
	col = mix(col, s, sp.b);
	col = mix(col, u, sp.a);
	float rm = max(sp.g, smoothstep(0.8, 0.6, wn.y));
	col = mix(col, r, clamp(rm, 0.0, 1.0));
	float sm = smoothstep(snow_height, snow_height + 50.0, wpos.y + big * 60.0) * smoothstep(0.5, 0.8, wn.y);
	col = mix(col, vec3(0.8, 0.83, 0.88) * (0.85 + big * 0.2), sm);
	// lecho marino / fondo de río
	float under = smoothstep(0.5, -6.0, wpos.y);
	col = mix(col, s * vec3(0.55, 0.62, 0.6), under);
	ALBEDO = col;
	ROUGHNESS = 0.92 - sm * 0.35;
	SPECULAR = 0.25;
}
