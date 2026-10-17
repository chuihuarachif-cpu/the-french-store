shader_type spatial;
// Detalles de vehículos en una sola superficie (barato en móviles).
// COLOR.rgb = color; COLOR.a: 0 mate (plástico, neumático), 0.5 brillante (vidrio, cromo), 1 luz emisiva.
global uniform float night;

void fragment() {
	float glossy = step(0.25, COLOR.a) * step(COLOR.a, 0.75);
	float lamp = step(0.9, COLOR.a);
	ALBEDO = COLOR.rgb;
	ROUGHNESS = mix(0.75, 0.06, glossy);
	METALLIC = glossy * 0.55;
	SPECULAR = 0.5;
	EMISSION = COLOR.rgb * lamp * (1.2 + night * 3.5);
}
