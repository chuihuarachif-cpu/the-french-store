#!/bin/bash
# Reimporta el proyecto y muestra errores de script.
cd "$(dirname "$0")/../apex-multiverse-godot"
timeout 300 godot --headless --path . --import 2>&1 | grep -E "SCRIPT ERROR|Parse Error|ERROR: Failed|at: GDScript" | head -40
for f in $(find scripts -name "*.gd"); do :; done
