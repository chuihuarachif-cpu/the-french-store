class_name EnvFactory
## Ambientes de iluminación: cielo HDR real (Poly Haven, CC0), sol, niebla, bloom y tonemap.

const PRESETS := {
	"day": {"hdri": "res://assets/hdri/quarry_01_1k.hdr", "sun_u": 0.6001, "sun_az": 35.0, "sun_elev": 42.0, "sky_energy": 0.9,
		"sun": Color(1.0, 0.95, 0.87), "sun_energy": 1.5, "fog": Color(0.66, 0.74, 0.84), "fog_density": 0.0011, "ambient": 1.0, "exposure": 0.9, "glow": 0.3},
	"sunset": {"hdri": "res://assets/hdri/venice_sunset_1k.hdr", "sun_u": 0.6001, "sun_az": -12.0, "sun_elev": 9.0, "sky_energy": 0.5,
		"sun": Color(1.0, 0.62, 0.34), "sun_energy": 1.7, "fog": Color(0.80, 0.60, 0.48), "fog_density": 0.0016, "ambient": 0.6, "exposure": 0.85, "glow": 0.6},
	"sunrise": {"hdri": "res://assets/hdri/spruit_sunrise_1k.hdr", "sun_u": 0.5991, "sun_az": 20.0, "sun_elev": 14.0, "sky_energy": 0.55,
		"sun": Color(1.0, 0.76, 0.52), "sun_energy": 1.6, "fog": Color(0.72, 0.70, 0.66), "fog_density": 0.0016, "ambient": 0.65, "exposure": 0.85, "glow": 0.5},
	"night": {"hdri": "res://assets/hdri/moonless_golf_1k.hdr", "sun_u": 0.25, "sun_az": 60.0, "sun_elev": 50.0, "sky_energy": 0.7,
		"sun": Color(0.5, 0.62, 1.0), "sun_energy": 0.14, "fog": Color(0.02, 0.025, 0.05), "fog_density": 0.0032, "ambient": 0.18, "exposure": 1.15, "glow": 1.2},
	"canyon": {"hdri": "res://assets/hdri/quarry_01_1k.hdr", "sun_u": 0.6001, "sun_az": -55.0, "sun_elev": 38.0, "sky_energy": 0.9,
		"sun": Color(1.0, 0.92, 0.80), "sun_energy": 1.6, "fog": Color(0.70, 0.74, 0.80), "fog_density": 0.0014, "ambient": 1.0, "exposure": 0.9, "glow": 0.3},
	"coast": {"hdri": "res://assets/hdri/blouberg_sunrise_2_1k.hdr", "sun_u": 0.0562, "sun_az": 40.0, "sun_elev": 30.0, "sky_energy": 0.9,
		"sun": Color(1.0, 0.88, 0.72), "sun_energy": 1.6, "fog": Color(0.76, 0.79, 0.84), "fog_density": 0.0010, "ambient": 1.1, "exposure": 0.9, "glow": 0.4},
}

## Dirección hacia el sol a partir de azimut (grados, + a la derecha de -Z) y elevación.
static func sun_dir(az: float, elev: float) -> Vector3:
	var a := deg_to_rad(az)
	var e := deg_to_rad(elev)
	return Vector3(sin(a) * cos(e), sin(e), -cos(a) * cos(e))

static func build(parent: Node, preset: String) -> Dictionary:
	var p: Dictionary = PRESETS[preset]
	var env := Environment.new()
	var sky := Sky.new()
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/sky_hdri.gdshader")
	mat.set_shader_parameter("panorama", load(p.get("hdri", p.get("panorama", ""))))
	mat.set_shader_parameter("energy", p["sky_energy"])
	mat.set_shader_parameter("horizon_color", p["fog"])
	if p.has("panorama"):
		mat.set_shader_parameter("horizon_offset", -2.0)
	# Gira el panorama para que su sol quede en el azimut deseado: a_sol = 0.5 + az/360.
	mat.set_shader_parameter("rotation", p["sun_u"] - (0.5 + p["sun_az"] / 360.0))
	sky.sky_material = mat
	sky.radiance_size = Sky.RADIANCE_SIZE_256
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 1.0
	env.ambient_light_energy = p["ambient"]
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = p["exposure"]
	env.tonemap_white = 6.0
	env.glow_enabled = true
	env.glow_intensity = p["glow"]
	env.glow_strength = 1.0
	env.glow_bloom = 0.04
	env.glow_hdr_threshold = 1.0
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
	env.set_glow_level(0, 0.0)
	env.set_glow_level(1, 1.0)
	env.set_glow_level(2, 0.8)
	env.set_glow_level(3, 0.6)
	env.set_glow_level(4, 0.4)
	if p["fog_density"] > 0.0:
		env.fog_enabled = true
		env.fog_light_color = p["fog"]
		env.fog_density = p["fog_density"]
		env.fog_sky_affect = 0.25
		env.fog_aerial_perspective = 0.4
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.08
	env.adjustment_saturation = 1.12
	var we := WorldEnvironment.new()
	we.environment = env
	parent.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.light_color = p["sun"]
	sun.light_energy = p["sun_energy"]
	parent.add_child(sun)
	var sd := sun_dir(p["sun_az"], p["sun_elev"])
	sun.look_at(sun.global_position - sd, Vector3.UP if absf(sd.y) < 0.99 else Vector3.FORWARD)
	sun.shadow_enabled = true
	sun.shadow_blur = 1.5
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 90.0
	sun.directional_shadow_split_1 = 0.25
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.2
	return {"env": env, "sun": sun, "world_env": we, "preset": p}
