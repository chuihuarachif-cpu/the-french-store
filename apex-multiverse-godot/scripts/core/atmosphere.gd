class_name Atmosphere
extends Node
## Cielo, luz, niebla y clima de la escena a partir del reloj y el clima universales (Game.hour, Game.weather).
## Mezcla cielos HDR reales según la altura del sol, mueve el sol/la luna, nubes, lluvia, granizo, nieve,
## neblina, relámpagos y calzada mojada. Actualiza las variables globales de shader night/wet/snow/lightning.

const PANO := {
	"day": {"tex": "res://assets/hdri/quarry_01_1k.hdr", "sun_u": 0.6001},
	"gold": {"tex": "res://assets/hdri/spruit_sunrise_1k.hdr", "sun_u": 0.5991},
	"night": {"tex": "res://assets/hdri/moonless_golf_1k.hdr", "sun_u": 0.25},
}
const FOG_DAY := Color(0.64, 0.72, 0.82)
const FOG_GOLD := Color(0.82, 0.62, 0.48)
const FOG_NIGHT := Color(0.07, 0.08, 0.115)

var env: Environment
var sun: DirectionalLight3D
var sky_mat: ShaderMaterial
var precip: MeshInstance3D
var precip_mat: ShaderMaterial
var rain_snd: AudioStreamPlayer
var base_fog := 0.0011
var fog_scale := 1.0           # el modo avión usa menos niebla
var night_w := 0.0             # 0 día … 1 noche cerrada
var sun_elev := 40.0
var light_dir := Vector3.DOWN
var _sky_t := 99.0
var _bolt_t := 6.0
var _flash := 0.0
var _thunder_t := -1.0
var _q := 0

static func create(parent: Node) -> Dictionary:
	var a := Atmosphere.new()
	a.name = "Atmosphere"
	parent.add_child(a)
	a._build()
	return {"env": a.env, "sun": a.sun, "atmos": a}

func _build() -> void:
	_q = Game.quality()
	env = Environment.new()
	var sky := Sky.new()
	sky_mat = ShaderMaterial.new()
	sky_mat.shader = load("res://shaders/sky_dynamic.gdshader")
	sky_mat.set_shader_parameter("pano_day", load(PANO["day"]["tex"]))
	sky_mat.set_shader_parameter("pano_gold", load(PANO["gold"]["tex"]))
	sky_mat.set_shader_parameter("pano_night", load(PANO["night"]["tex"]))
	sky_mat.set_shader_parameter("noise_tex", load("res://assets/textures/noise_tile.png"))
	sky.sky_material = sky_mat
	sky.process_mode = Sky.PROCESS_MODE_QUALITY
	sky.radiance_size = Sky.RADIANCE_SIZE_32 if _q == 0 else Sky.RADIANCE_SIZE_64
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 1.0
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_white = 6.0
	env.glow_enabled = _q > 0
	env.glow_intensity = 0.4
	env.glow_strength = 1.0
	env.glow_bloom = 0.03
	env.glow_hdr_threshold = 1.0
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
	env.set_glow_level(0, 0.0)
	env.set_glow_level(1, 1.0)
	env.set_glow_level(2, 0.8)
	env.set_glow_level(3, 0.6)
	env.set_glow_level(4, 0.4)
	env.fog_enabled = true
	env.fog_sky_affect = 0.3
	env.fog_aerial_perspective = 0.45
	base_fog = 0.0019 if _q == 0 else 0.0011
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.07
	env.adjustment_saturation = 1.1
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = _q > 0
	sun.shadow_blur = 1.5
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL if _q == 1 else DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 70.0 if _q == 1 else 110.0
	sun.directional_shadow_split_1 = 0.25
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.2
	add_child(sun)
	_build_precip()
	rain_snd = Sfx.make_loop("rain_loop", -40.0)
	add_child(rain_snd)
	_apply(0.0, true)

func _build_precip() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var radii := [3.5, 9.0, 20.0] if _q > 0 else [4.0, 12.0]
	var seg := 20
	for li in radii.size():
		var r: float = radii[li]
		var layer := float(li) / float(maxi(radii.size() - 1, 1))
		var circ := TAU * r
		for i in seg:
			var a0 := TAU * i / seg
			var a1 := TAU * (i + 1) / seg
			var p0 := Vector3(cos(a0) * r, 0, sin(a0) * r)
			var p1 := Vector3(cos(a1) * r, 0, sin(a1) * r)
			var u0 := circ * i / seg
			var u1 := circ * (i + 1) / seg
			var lo := -16.0
			var hi := 20.0
			var col := Color(layer, 0, 0)
			for v in [[p0, u0, lo], [p1, u1, lo], [p1, u1, hi], [p0, u0, lo], [p1, u1, hi], [p0, u0, hi]]:
				st.set_color(col)
				st.set_uv(Vector2(v[1], v[2]))
				st.add_vertex(v[0] + Vector3(0, v[2], 0))
	precip = MeshInstance3D.new()
	precip.mesh = st.commit()
	precip.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	precip.extra_cull_margin = 100.0
	precip_mat = ShaderMaterial.new()
	precip_mat.shader = load("res://shaders/precip.gdshader")
	precip.material_override = precip_mat
	precip.visible = false
	add_child(precip)

static func _sun_dir(az: float, elev: float) -> Vector3:
	var a := deg_to_rad(az)
	var e := deg_to_rad(elev)
	return Vector3(sin(a) * cos(e), sin(e), -cos(a) * cos(e))

func _process(dt: float) -> void:
	_apply(dt, false)

func _apply(dt: float, force: bool) -> void:
	var h := Game.hour
	# --- sol: sale a las 6:00, se pone a las 19:30
	var day_len := 13.5
	var az := 0.0
	if h >= 6.0 and h <= 6.0 + day_len:
		var f := (h - 6.0) / day_len
		sun_elev = 62.0 * sin(PI * f)
		az = lerpf(-105.0, 105.0, f)
	else:
		var nh := fposmod(h - (6.0 + day_len), 24.0)
		var f := nh / (24.0 - day_len)
		sun_elev = -28.0 * sin(PI * f)
		az = lerpf(105.0, 255.0, f)
	var sd := _sun_dir(az, sun_elev)
	var md := _sun_dir(az + 180.0, 38.0)
	var w_day := smoothstep(4.0, 16.0, sun_elev)
	var w_night := 1.0 - smoothstep(-9.0, -1.5, sun_elev)
	var w_gold := clampf(1.0 - w_day - w_night, 0.0, 1.0)
	night_w = w_night
	var cl := Game.cloud
	var pr := Game.precipitation()
	var fogw := Game.fog_amount()
	var storm := Game.weather_level if Game.weather == "storm" else 0.0
	var snowing := Game.weather == "snow"
	# --- luz direccional: sol de día, luna de noche
	var sun_col := FOG_GOLD.lerp(Color(1.0, 0.95, 0.88), smoothstep(3.0, 28.0, sun_elev))
	sun_col = Color(1.0, 0.62, 0.36).lerp(sun_col, smoothstep(-1.0, 8.0, sun_elev))
	var e_sun := 1.55 * smoothstep(-2.5, 7.0, sun_elev)
	var e_moon := 0.32 * w_night
	var overcast := 1.0 - cl * 0.82
	if e_sun >= e_moon:
		light_dir = sd
		sun.light_color = sun_col
		sun.light_energy = e_sun * overcast
	else:
		light_dir = md
		sun.light_color = Color(0.55, 0.66, 1.0)
		sun.light_energy = e_moon * (1.0 - cl * 0.5)
	sun.look_at(sun.global_position - light_dir, Vector3.UP)
	if _q > 0:
		sun.shadow_enabled = sun.light_energy > 0.3
	# --- ambiente y exposición
	var amb := lerpf(1.0, 0.85, w_night)
	# cielo cubierto: menos sol directo pero luz difusa más pareja
	env.ambient_light_energy = amb * (1.0 + cl * 0.35 * (1.0 - w_night)) + _flash * 3.0
	# de noche el cielo HDR es casi negro: luz de luna/ciudad azulada como base
	env.ambient_light_sky_contribution = lerpf(1.0, 0.3, w_night)
	env.ambient_light_color = Color(0.36, 0.42, 0.6)
	env.tonemap_exposure = lerpf(0.9, 1.5, w_night) + cl * 0.1
	var fog_c := FOG_DAY * w_day + FOG_GOLD * w_gold + FOG_NIGHT * w_night
	var gray := Color(0.56, 0.59, 0.63) * (w_day + w_gold * 0.6) + FOG_NIGHT * w_night
	fog_c = fog_c.lerp(gray, clampf(cl * 0.9 + fogw * 0.5, 0.0, 1.0))
	if storm > 0.0:
		fog_c = fog_c.darkened(storm * 0.35)
	env.fog_light_color = fog_c
	env.fog_density = (base_fog + fogw * 0.011 + pr * 0.0028 + (pr * 0.003 if snowing else 0.0)) * fog_scale
	# --- cielo (los parámetros que fuerzan recalcular reflejos se envían 1 vez por segundo)
	_sky_t += dt
	if force or _sky_t > 1.0:
		_sky_t = 0.0
		var sky_e := (0.78 * w_day + 0.6 * w_gold + 0.75 * w_night) * (1.0 - cl * 0.42 - storm * 0.2)
		sky_mat.set_shader_parameter("w_day", w_day)
		sky_mat.set_shader_parameter("w_gold", w_gold)
		sky_mat.set_shader_parameter("w_night", w_night)
		sky_mat.set_shader_parameter("rot_day", PANO["day"]["sun_u"] - (0.5 + az / 360.0))
		sky_mat.set_shader_parameter("rot_gold", PANO["gold"]["sun_u"] - (0.5 + az / 360.0))
		sky_mat.set_shader_parameter("rot_night", h / 24.0 * 0.25)
		sky_mat.set_shader_parameter("energy", sky_e)
		sky_mat.set_shader_parameter("horizon_color", fog_c)
		sky_mat.set_shader_parameter("cloud_cover", cl)
		sky_mat.set_shader_parameter("cloud_dark", clampf(pr * 0.45 + storm * 0.4, 0.0, 0.9))
		var lit := Color(1.0, 0.98, 0.95).lerp(Color(1.0, 0.72, 0.52), w_gold) * (w_day + w_gold) + Color(0.09, 0.1, 0.14) * w_night
		sky_mat.set_shader_parameter("cloud_lit", lit)
		sky_mat.set_shader_parameter("cloud_shade", lit * 0.5)
		sky_mat.set_shader_parameter("haze", fogw * 0.9 + pr * 0.25)
		sky_mat.set_shader_parameter("sun_dir", sd)
		sky_mat.set_shader_parameter("moon_dir", md)
		sky_mat.set_shader_parameter("moon_vis", w_night * (1.0 - cl))
	# --- relámpagos
	if storm > 0.4:
		_bolt_t -= dt
		if _bolt_t <= 0.0:
			_bolt_t = randf_range(5.0, 16.0)
			_flash = 1.0
			_thunder_t = randf_range(0.4, 2.5)
	_flash = maxf(0.0, _flash - dt * 5.0)
	var fl := _flash * (0.6 + 0.4 * sin(_flash * 40.0))
	if _thunder_t > 0.0:
		_thunder_t -= dt
		if _thunder_t <= 0.0:
			Sfx.play("explosion", -6.0, randf_range(0.28, 0.4))
	# --- variables globales para los shaders del mundo
	RenderingServer.global_shader_parameter_set("night", night_w)
	RenderingServer.global_shader_parameter_set("wet", Game.wetness)
	RenderingServer.global_shader_parameter_set("snow", Game.snow_cover)
	RenderingServer.global_shader_parameter_set("lightning", fl)
	# --- lluvia / granizo / nieve alrededor de la cámara
	var cam := get_viewport().get_camera_3d()
	precip.visible = pr > 0.02 and cam != null
	if precip.visible:
		precip.global_position = cam.global_position
		precip_mat.set_shader_parameter("intensity", pr)
		precip_mat.set_shader_parameter("cam_y", cam.global_position.y)
		var k := 0.0
		if Game.weather == "hail":
			k = 1.0
		elif snowing:
			k = 2.0
		precip_mat.set_shader_parameter("kind", k)
		var tint := Color(0.75, 0.8, 0.86) * (0.35 + 0.65 * (1.0 - w_night))
		if k > 0.5:
			tint = Color(0.95, 0.97, 1.0) * (0.45 + 0.55 * (1.0 - w_night))
		precip_mat.set_shader_parameter("tint", tint)
	if rain_snd.stream:
		var vol := pr if not snowing else pr * 0.15
		if vol > 0.03:
			if not rain_snd.playing:
				rain_snd.play()
			rain_snd.volume_db = linear_to_db(vol) - 6.0 + (4.0 if Game.weather == "hail" else 0.0)
			rain_snd.pitch_scale = 1.5 if Game.weather == "hail" else 1.0
		elif rain_snd.playing:
			rain_snd.stop()

## Texto para el HUD: "18:42 · LLUVIA".
static func hud_text() -> String:
	var w: String = Game.WEATHER_NAMES[Game.weather] if Game.weather_level > 0.3 else Game.WEATHER_NAMES["clear"]
	return "%s · %s" % [Game.clock_text(), w]
