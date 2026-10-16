extends SceneTree
func _init() -> void:
	var pts := [
	Vector3(0, 6, 260), Vector3(0, 7, 40), Vector3(30, 9, -110), Vector3(140, 15, -210),
	Vector3(300, 22, -220), Vector3(400, 19, -110), Vector3(410, 13, 40), Vector3(470, 6, 180),
	Vector3(450, 5, 330), Vector3(330, 5, 400), Vector3(180, 6, 380), Vector3(70, 6, 400)]
	print("start")
	var t = load("res://scripts/modes/race/race_track.gd").new(pts)
	print("track length: ", t.length)
	var mx := 0.0
	for i in t.curv.size():
		mx = max(mx, abs(t.curv[i]))
	print("max curvature: ", mx, " min radius: ", 1.0 / mx)
	quit()
