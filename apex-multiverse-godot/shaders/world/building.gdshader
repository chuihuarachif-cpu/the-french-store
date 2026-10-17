shader_type spatial;
// Edificios con ventanas procedurales. UV = (m a lo largo de la fachada, m de altura).
// UV2.x = estilo, UV2.y = semilla. COLOR = color de la pared.
// Estilos: 0 liso, 1 torre de cristal, 2 oficinas, 3 casa, 4 ruina, 5 chapa, 6 hotel, 7 granero, 8 tienda, 9 cristal total, 10 piedra
uniform sampler2D grime : filter_linear_mipmap, repeat_enable;
uniform sampler2D graffiti : source_color, filter_linear_mipmap, repeat_enable;
global uniform float night;

varying vec2 st;
varying float style;
varying float seed;
varying vec3 wn;
varying float wy;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void vertex() {
	st = UV;
	style = UV2.x;
	seed = UV2.y;
	wn = NORMAL;
	wy = VERTEX.y;
}

void fragment() {
	vec3 wall = COLOR.rgb;
	float s = floor(style + 0.5);
	vec3 g = texture(grime, st * vec2(0.05, 0.03) + seed).rgb;
	vec3 col = wall * (0.82 + g.r * 0.3) * (1.0 - g.g * 0.12 * smoothstep(0.0, 30.0, st.y));
	float rough = 0.85;
	float metal = 0.0;
	vec3 emit = vec3(0.0);
	bool facade = abs(wn.y) < 0.5 && s > 0.5;
	if (facade) {
		float fh = (s == 3.0 || s == 7.0) ? 3.0 : 3.6;
		float wsp = (s == 1.0 || s == 9.0) ? 1.6 : ((s == 3.0) ? 3.2 : 2.6);
		vec2 cellp = st / vec2(wsp, fh);
		vec2 id = floor(cellp);
		vec2 f = fract(cellp);
		float h = hash(id + seed * 13.0);
		float win = 0.0;
		vec3 glass = vec3(0.12, 0.16, 0.2);
		if (s == 1.0) {
			win = step(0.06, f.x) * step(f.x, 0.94) * step(0.1, f.y) * step(f.y, 0.92);
			glass = mix(vec3(0.16, 0.26, 0.36), vec3(0.32, 0.42, 0.5), h);
		} else if (s == 9.0) {
			win = step(0.04, f.x) * step(0.05, f.y);
			glass = vec3(0.2, 0.3, 0.36);
		} else if (s == 5.0 || s == 7.0) {
			// chapa ondulada / tablones
			col *= 0.85 + 0.15 * step(0.5, fract(st.x * (s == 5.0 ? 2.0 : 0.8)));
			win = (s == 7.0) ? step(0.3, f.x) * step(f.x, 0.7) * step(0.3, f.y) * step(f.y, 0.75) * step(0.8, h) : 0.0;
		} else {
			win = step(0.2, f.x) * step(f.x, 0.8) * step(0.25, f.y) * step(f.y, 0.82);
		}
		// planta baja comercial
		if ((s == 2.0 || s == 8.0 || s == 6.0) && st.y < 4.2) {
			win = step(0.05, fract(st.x / 5.0)) * step(0.6, st.y) * step(st.y, 3.6);
			glass = vec3(0.25, 0.3, 0.32);
		}
		if (s == 6.0) {
			// balcones blancos
			col = mix(col, vec3(0.95), step(0.86, f.y) * 0.8);
		}
		float lit = step(0.55, h) * night;
		vec3 wcol = glass;
		if (s == 4.0) {
			// ventanas rotas o tapiadas
			if (h < 0.35) { wcol = vec3(0.02); }
			else if (h < 0.6) { wcol = vec3(0.32, 0.22, 0.12) * (0.7 + 0.3 * step(0.5, fract(f.y * 6.0))); }
			else { wcol = vec3(0.06, 0.07, 0.08) + vec3(0.1) * step(0.5, fract((f.x + f.y) * 9.0)); }
			lit = step(0.93, h) * night;
			vec4 gr = texture(graffiti, vec2(st.x * 0.04 + seed, clamp(1.0 - st.y / 3.4, 0.0, 1.0)));
			col = mix(col, gr.rgb, gr.a * step(st.y, 3.4));
		}
		col = mix(col, wcol, win);
		rough = mix(rough, 0.08, win * step(s, 9.5) * (1.0 - step(3.5, s) * step(s, 4.5)));
		metal = (s == 1.0 || s == 9.0) ? win * 0.5 : 0.0;
		emit = vec3(1.0, 0.78, 0.45) * lit * win * (0.6 + h);
	} else if (wn.y > 0.5) {
		// azotea o tejado
		col = wall * (0.75 + g.r * 0.4);
	}
	ALBEDO = col;
	ROUGHNESS = rough;
	METALLIC = metal;
	SPECULAR = 0.4;
	EMISSION = emit * 2.2;
}
