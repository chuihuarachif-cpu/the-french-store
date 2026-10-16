extends SceneTree
func _init() -> void:
	var sc: PackedScene = load(OS.get_environment("GLB"))
	var n := sc.instantiate()
	root.add_child(n)
	await process_frame
	var ap := n.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if ap:
		print("anims: ", ap.get_animation_list())
	var box := AABB()
	var first := true
	for c in n.find_children("*", "MeshInstance3D", true, false):
		var a: AABB = c.global_transform * c.get_aabb()
		box = a if first else box.merge(a)
		first = false
	for c in n.find_children("*", "Skeleton3D", true, false):
		print("skeleton ", c.name)
	print("aabb ", box)
	quit()
