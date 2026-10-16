shader_type spatial;
// Piano (curb) rojo/blanco: franjas cada 'stripe' metros a lo largo de la pista.
uniform float stripe = 2.0;
uniform vec3 c1 : source_color = vec3(0.85, 0.06, 0.05);
uniform vec3 c2 : source_color = vec3(0.95, 0.95, 0.95);
void fragment() {
	float k = step(0.5, fract(UV.y / (stripe * 2.0)));
	ALBEDO = mix(c1, c2, k);
	ROUGHNESS = 0.5;
}
