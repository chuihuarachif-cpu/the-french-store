extends Node
## Sonido: efectos con pool de reproductores y música en bucle.

var _cache := {}
var _pool: Array[AudioStreamPlayer] = []
var music: AudioStreamPlayer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)
	music = AudioStreamPlayer.new()
	music.volume_db = -9.0
	add_child(music)

func stream(name: String) -> AudioStream:
	if not _cache.has(name):
		var st: AudioStream = null
		for ext in ["ogg", "wav"]:
			var path := "res://assets/audio/%s.%s" % [name, ext]
			if ResourceLoader.exists(path):
				st = load(path)
				break
		if name.begins_with("music") or name.ends_with("_loop"):
			if st is AudioStreamOggVorbis:
				st.loop = true
			elif st is AudioStreamWAV and st.loop_mode == AudioStreamWAV.LOOP_DISABLED:
				st.loop_mode = AudioStreamWAV.LOOP_FORWARD
				st.loop_end = st.data.size() / 2
		_cache[name] = st
	return _cache[name]

func play(name: String, vol_db := 0.0, pitch := 1.0) -> void:
	if not Game.save.get("sfx", true):
		return
	var s := stream(name)
	if s == null:
		return
	for p in _pool:
		if not p.playing:
			p.stream = s
			p.volume_db = vol_db
			p.pitch_scale = pitch
			p.play()
			return

func play_music(name: String) -> void:
	var s := stream(name)
	if s == null:
		return
	if music.stream == s and music.playing:
		return
	music.stream = s
	if Game.save.get("music", true):
		music.play()

func stop_music() -> void:
	music.stop()

func make_loop(name: String, vol_db := 0.0) -> AudioStreamPlayer:
	## Reproductor dedicado (motor, viento...). El nodo que lo pide lo añade a su escena.
	var p := AudioStreamPlayer.new()
	p.stream = stream(name)
	p.volume_db = vol_db
	return p
