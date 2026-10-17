shader_type spatial;
// Farolas y luces de túnel: COLOR.a = 1 en la lámpara (se enciende de noche o siempre si always=true).
global uniform float night;
uniform bool always = false;
uniform vec3 light_color : source_color = vec3(1.0, 0.85, 0.6);

void fragment() {
	float on = always ? 1.0 : night;
	ALBEDO = COLOR.rgb;
	ROUGHNESS = 0.5;
	METALLIC = 0.4 * (1.0 - COLOR.a);
	EMISSION = light_color * COLOR.a * (0.3 + on * 3.5);
}
