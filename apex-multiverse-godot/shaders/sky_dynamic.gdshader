shader_type sky;
// Cielo dinámico: mezcla de cielos HDR reales (día, dorado, noche) según la hora, más una capa de nubes
// procedural cuya cobertura depende del clima (nublado, lluvia, tormenta, granizo, nieve, niebla) y relámpagos.
// No usa TIME (así el mapa de reflejos no se recalcula cada fotograma): el movimiento de las nubes
// viene de la variable global game_time.
uniform sampler2D pano_day : source_color, filter_linear, repeat_enable;
uniform sampler2D pano_gold : source_color, filter_linear, repeat_enable;
uniform sampler2D pano_night : source_color, filter_linear, repeat_enable;
uniform sampler2D noise_tex : filter_linear_mipmap, repeat_enable;
uniform float w_day = 1.0;
uniform float w_gold = 0.0;
uniform float w_night = 0.0;
uniform float rot_day = 0.0;
uniform float rot_gold = 0.0;
uniform float rot_night = 0.0;
uniform float energy = 1.0;
uniform vec3 horizon_color : source_color = vec3(0.7, 0.75, 0.8);
uniform float cloud_cover = 0.2;
uniform float cloud_dark = 0.0;
uniform vec3 cloud_lit : source_color = vec3(1.0);
uniform vec3 cloud_shade : source_color = vec3(0.55, 0.58, 0.64);
uniform float haze = 0.0;
uniform vec3 sun_dir = vec3(0.0, 0.7, -0.7);
uniform vec3 moon_dir = vec3(0.0, 0.7, 0.7);
uniform float moon_vis = 0.0;
global uniform float game_time;
global uniform float lightning;

vec3 pano(sampler2D t, vec3 d, float rot) {
	float a = atan(d.x, -d.z) / 6.2831853 + 0.5 + rot;
	float v = acos(clamp(d.y, -1.0, 1.0)) / 3.14159265;
	vec3 c = texture(t, vec2(a, min(v, 0.499))).rgb;
	return c / (1.0 + max(c - vec3(4.0), vec3(0.0)) * 0.25);
}

float fbm(vec2 p) {
	float f = 0.0;
	f += texture(noise_tex, p).r * 0.5;
	f += texture(noise_tex, p * 2.13 + vec2(0.31, 0.17)).r * 0.27;
	f += texture(noise_tex, p * 4.37 + vec2(0.71, 0.53)).r * 0.15;
	f += texture(noise_tex, p * 9.1 + vec2(0.11, 0.83)).r * 0.08;
	return f;
}

void sky() {
	vec3 d = EYEDIR;
	vec3 c = vec3(0.0);
	if (w_day > 0.001) c += pano(pano_day, d, rot_day) * w_day;
	if (w_gold > 0.001) c += pano(pano_gold, d, rot_gold) * w_gold;
	if (w_night > 0.001) c += pano(pano_night, d, rot_night) * w_night;
	c *= energy;
	// luna
	float md = dot(d, normalize(moon_dir));
	c += vec3(0.85, 0.9, 1.0) * smoothstep(0.99955, 0.99975, md) * moon_vis * 2.5;
	c += vec3(0.25, 0.3, 0.45) * pow(max(md, 0.0), 60.0) * moon_vis * 0.25;
	// capa de nubes proyectada sobre una cúpula
	float up = max(d.y, 0.0);
	if (cloud_cover > 0.02 && d.y > -0.05) {
		vec2 cp = d.xz / (up + 0.12) * 0.11;
		float drift = game_time * 0.0022;
		float n = fbm(cp + vec2(drift, drift * 0.37));
		float n2 = fbm(cp * 0.47 + vec2(-drift * 0.6, 0.2));
		float density = smoothstep(1.0 - cloud_cover * 1.08, 1.12 - cloud_cover * 0.5, n * 0.65 + n2 * 0.55);
		density = max(density, smoothstep(0.75, 1.0, cloud_cover) * 0.92);
		// iluminación: el lado hacia el sol más claro, base oscura
		float sunf = pow(max(dot(d, normalize(sun_dir)), 0.0), 6.0);
		float thick = clamp((n * 0.65 + n2 * 0.55 - 0.45) * 1.6, 0.0, 1.0);
		vec3 cc = mix(cloud_lit, cloud_shade, clamp(thick * 0.8 + cloud_dark, 0.0, 1.0));
		cc += cloud_lit * sunf * (1.0 - cloud_dark) * 0.5;
		cc *= energy;
		float fade = smoothstep(-0.05, 0.12, d.y);
		c = mix(c, cc, density * fade);
	}
	// bruma del horizonte y niebla espesa
	float hz = 1.0 - smoothstep(-0.02, 0.10 + haze * 0.45, d.y);
	c = mix(c, horizon_color * energy, clamp(hz + haze * 0.55, 0.0, 1.0));
	c += vec3(0.75, 0.8, 1.0) * lightning * (0.4 + cloud_cover);
	COLOR = c;
}
