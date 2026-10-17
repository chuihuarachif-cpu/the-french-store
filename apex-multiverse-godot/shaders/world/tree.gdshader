shader_type spatial;
// Vegetación opaca (barata en móviles): color por vértice e instancia, viento suave.
uniform sampler2D grime : filter_linear_mipmap, repeat_enable;
uniform float wind = 0.05;
uniform float tint_mul = 1.0;
varying vec3 vc;

void vertex() {
	vec3 w = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float k = max(VERTEX.y - 1.0, 0.0);
	VERTEX.x += sin(TIME * 1.3 + w.x * 0.2 + w.z * 0.15) * wind * k * 0.12;
	vc = COLOR.rgb * INSTANCE_CUSTOM.rgb * tint_mul;
}

void fragment() {
	float n = texture(grime, UV * 0.5).b;
	ALBEDO = vc * (0.8 + n * 0.35);
	ROUGHNESS = 0.9;
	SPECULAR = 0.15;
}
