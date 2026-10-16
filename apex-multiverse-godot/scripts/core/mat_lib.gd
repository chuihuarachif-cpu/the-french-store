class_name MatLib
## Biblioteca de materiales PBR compartidos (se cachean para no duplicar recursos).

static var _cache := {}

static func tex(name: String) -> Texture2D:
	var key := "tex:" + name
	if not _cache.has(key):
		_cache[key] = load("res://assets/textures/%s.png" % name)
	return _cache[key]

static func pbr(name: String, uv_scale := 1.0, color := Color.WHITE, roughness := 1.0, metallic := 0.0, normal_strength := 1.0, triplanar := false) -> StandardMaterial3D:
	var key := "pbr:%s:%s:%s:%s:%s:%s" % [name, uv_scale, color, roughness, metallic, triplanar]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex(name + "_albedo")
	m.albedo_color = color
	if ResourceLoader.exists("res://assets/textures/%s_normal.png" % name):
		m.normal_enabled = true
		m.normal_texture = tex(name + "_normal")
		m.normal_scale = normal_strength
	if ResourceLoader.exists("res://assets/textures/%s_rough.png" % name):
		m.roughness_texture = tex(name + "_rough")
	m.roughness = roughness
	m.metallic = metallic
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if triplanar:
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		m.uv1_scale = Vector3.ONE * uv_scale
	else:
		m.uv1_scale = Vector3(uv_scale, uv_scale, 1)
	_cache[key] = m
	return m

static func color(c: Color, roughness := 0.6, metallic := 0.0, emission := Color.BLACK, emission_energy := 1.0) -> StandardMaterial3D:
	var key := "col:%s:%s:%s:%s:%s" % [c, roughness, metallic, emission, emission_energy]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = roughness
	m.metallic = metallic
	if emission != Color.BLACK:
		m.emission_enabled = true
		m.emission = emission
		m.emission_energy_multiplier = emission_energy
	if c.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_cache[key] = m
	return m

static func emissive(c: Color, energy := 3.0, unshaded := true) -> StandardMaterial3D:
	var key := "emi:%s:%s:%s" % [c, energy, unshaded]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	if unshaded:
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.emission_enabled = true
	m.emission = c
	m.emission_energy_multiplier = energy
	_cache[key] = m
	return m

static func additive(texname: String, c: Color, energy := 1.0) -> StandardMaterial3D:
	## Sprite aditivo (halos de luz, reflejos falsos en asfalto mojado, estelas).
	var key := "add:%s:%s:%s" % [texname, c, energy]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.albedo_texture = tex(texname)
	m.albedo_color = Color(c.r * energy, c.g * energy, c.b * energy, c.a)
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.no_depth_test = false
	m.disable_receive_shadows = true
	_cache[key] = m
	return m

static func billboard(texname: String, c: Color, energy := 1.0) -> StandardMaterial3D:
	var key := "bb:%s:%s:%s" % [texname, c, energy]
	if _cache.has(key):
		return _cache[key]
	var m: StandardMaterial3D = additive(texname, c, energy).duplicate()
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	_cache[key] = m
	return m

static func shader_mat(path: String, params := {}) -> ShaderMaterial:
	var key := "sh:%s:%s" % [path, str(params)]
	if _cache.has(key):
		return _cache[key]
	var m := ShaderMaterial.new()
	m.shader = load(path)
	for k in params:
		m.set_shader_parameter(k, params[k])
	_cache[key] = m
	return m

static func terrain(grass_tint := Color.WHITE, dirt := 0.35, snow_height := 9999.0) -> ShaderMaterial:
	return shader_mat("res://shaders/terrain.gdshader", {
		"grass_tex": tex("grass_albedo"), "grass_nrm": tex("grass_normal"),
		"dirt_tex": tex("dirt_albedo"), "dirt_nrm": tex("dirt_normal"),
		"rock_tex": tex("rock_albedo"), "rock_nrm": tex("rock_normal"),
		"grass_tint": grass_tint, "dirt_amount": dirt, "snow_height": snow_height})

static func foliage(texname: String, tint := Color.WHITE) -> ShaderMaterial:
	return shader_mat("res://shaders/foliage.gdshader", {"tex": tex(texname), "tint": tint})

## Perfil lateral de marcas viales: lista de {x, w, kind} con kind "solid"/"dash"/"shoulder"/"wear".
static func road_profile(x_min: float, x_max: float, marks: Array, res := 1024) -> ImageTexture:
	var img := Image.create(res, 1, false, Image.FORMAT_RGBA8)
	for i in res:
		var x := lerpf(x_min, x_max, (i + 0.5) / res)
		var c := Color(0, 0, 0, 0)
		for m in marks:
			var d := absf(x - m["x"])
			var hw: float = m["w"] * 0.5
			match m["kind"]:
				"solid":
					if d < hw: c.r = 1.0
				"dash":
					if d < hw: c.g = 1.0
				"shoulder":
					if d < hw: c.b = 1.0
				"wear":
					c.a = maxf(c.a, clampf(1.0 - d / hw, 0.0, 1.0) * 0.8)
		img.set_pixel(i, 0, c)
	return ImageTexture.create_from_image(img)

static func road(profile: ImageTexture, x_min: float, x_max: float, wet := 0.0, tint := Color.WHITE) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/road.gdshader")
	m.set_shader_parameter("albedo_tex", tex("asphalt_albedo"))
	m.set_shader_parameter("normal_tex", tex("asphalt_normal"))
	m.set_shader_parameter("rough_tex", tex("asphalt_rough"))
	m.set_shader_parameter("profile_tex", profile)
	m.set_shader_parameter("x_min", x_min)
	m.set_shader_parameter("x_max", x_max)
	m.set_shader_parameter("wet", wet)
	m.set_shader_parameter("tint", tint)
	return m
