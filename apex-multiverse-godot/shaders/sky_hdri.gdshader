shader_type sky;
// Cielo HDR real (Poly Haven, CC0) solo en el hemisferio superior; bajo el horizonte se funde con la niebla.
uniform sampler2D panorama : source_color, filter_linear, repeat_enable;
uniform float energy = 1.0;
uniform vec3 horizon_color : source_color = vec3(0.7, 0.75, 0.8);
uniform float horizon_blend = 0.06;
uniform float horizon_offset = 0.0;
uniform float rotation = 0.0;

void sky() {
	vec3 d = EYEDIR;
	float a = atan(d.x, -d.z) / 6.2831853 + 0.5 + rotation;
	float v = acos(clamp(d.y, -1.0, 1.0)) / 3.14159265;
	vec3 c = texture(panorama, vec2(a, min(v, 0.499))).rgb;
	c = c / (1.0 + max(c - vec3(4.0), vec3(0.0)) * 0.25) * energy;
	float t = smoothstep(horizon_offset - 0.005, horizon_offset + horizon_blend, d.y);
	COLOR = mix(horizon_color * energy, c, t);
}
