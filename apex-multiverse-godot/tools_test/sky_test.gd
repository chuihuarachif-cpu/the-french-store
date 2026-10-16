extends Node3D
func _ready() -> void:
	var u := float(OS.get_environment("U"))
	var v := float(OS.get_environment("V"))
	var env := Environment.new()
	var sky := Sky.new()
	var m := ShaderMaterial.new()
	m.shader = load("res://shaders/sky_hdri.gdshader")
	m.set_shader_parameter("panorama", load(OS.get_environment("HDR")))
	m.set_shader_parameter("horizon_offset", -1.0)
	sky.sky_material = m
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	# Mapeo inverso del shader: a = atan(x,-z)/TAU+0.5, v = acos(y)/PI
	var phi := (u - 0.5) * TAU
	var theta := v * PI
	var dir := Vector3(sin(phi) * sin(theta), cos(theta), -cos(phi) * sin(theta))
	var cam := Camera3D.new()
	cam.fov = 30
	add_child(cam)
	cam.look_at_from_position(Vector3.ZERO, dir, Vector3.UP)
	add_child(preload("res://tools_test/shot.gd").new())
