shader_type spatial;
render_mode cull_disabled;
// Agua: olas por normales animadas, reflejos del cielo y espuma cerca de la orilla.
uniform vec3 deep : source_color = vec3(0.02, 0.12, 0.2);
uniform vec3 shallow : source_color = vec3(0.05, 0.32, 0.38);
uniform sampler2D nrm : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float scale = 0.035;
uniform float speed = 0.03;
uniform float wave_height = 0.25;

varying vec3 wpos;

void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += sin(wpos.x * 0.08 + TIME * 1.1) * wave_height + sin(wpos.z * 0.11 + TIME * 0.8) * wave_height * 0.6;
}

void fragment() {
	vec2 uv = wpos.xz * scale;
	vec3 n1 = texture(nrm, uv + vec2(TIME * speed, TIME * speed * 0.4)).rgb;
	vec3 n2 = texture(nrm, uv * 2.3 - vec2(TIME * speed * 0.7, -TIME * speed)).rgb;
	NORMAL_MAP = normalize(n1 + n2 - 1.0) * 0.5 + 0.5;
	NORMAL_MAP_DEPTH = 0.6;
	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 4.0);
	ALBEDO = mix(shallow, deep, 0.6 + fres * 0.4);
	ROUGHNESS = 0.03;
	METALLIC = 0.0;
	SPECULAR = 0.8;
}
