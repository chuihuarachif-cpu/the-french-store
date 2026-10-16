#!/bin/bash
# Uso: tools/shot.sh <escena> <salida.png> [frames] [VAR=valor ...]
cd "$(dirname "$0")/../apex-multiverse-godot"
timeout 300 godot --headless --path . --import >/dev/null 2>&1
SCENE=$1; OUT=$2; FR=${3:-20}; shift 3 2>/dev/null
env "$@" SHOT=$OUT FRAMES=$FR timeout 300 xvfb-run -a -s "-screen 0 1280x720x24" godot --path . --rendering-driver opengl3 --resolution 1280x720 $SCENE 2>&1 | grep -v -E "^\s*$|HDR|ALSA|audio|at: (init_output|initialize)" | tail -25
