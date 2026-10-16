# Apex Multiverse (Godot 4.3)

Juego de conducción con 4 modos (nivel 1 de cada uno; estructura preparada para 120 niveles por modo).

| Modo | Escena | Descripción |
|---|---|---|
| Infinito | `scenes/Highway.tscn` | Autopista infinita con tráfico, obras, nitro y rozones. Hora aleatoria: día, amanecer, atardecer o noche. |
| Historia | `scenes/Race.tscn` | Capítulo 1 "Costa del Sol": 2 vueltas contra 7 rivales con IA, rampa, turbos y derribos. |
| Camiones | `scenes/Truck.tscn` | Física real (VehicleBody3D, 6 ruedas) con carga suelta: barro con baches, curvas cerradas, puente colgante, fauna y árboles que caen. |
| Cohetes | `scenes/Space.tscn` | Vuelo infinito: meteoros, estrellas fugaces, agujeros negros, satélites, orbes y anillos. |

- Renderizador: Compatibility (OpenGL ES 3) para funcionar en la mayoría de móviles Android.
- Casi todo (escenarios, vehículos de tráfico, camión, nave, efectos) se genera por código en `scripts/`.
- Texturas y audio procedurales: `../tools/gen_textures.py` y `../tools/gen_audio.py`.
- Cada push a la rama `game/apex-multiverse` compila el APK (GitHub Actions) y lo publica en *Releases* con la etiqueta `apex-multiverse-vN`.

## Pruebas locales
`tools/shot.sh <escena> <salida.png> [frames] VAR=valor` renderiza una captura (variables: `AUTOPILOT=1`, `SKIP=segundos`, `PRESET=night|day|sunset|sunrise`, `START_S=metros` en Camiones).

## Créditos
- "Car Concept": Eric Chadwick / Darmstadt Graphics Group, Khronos glTF Sample Assets — CC BY 4.0 (modificado: sin interior).
- "Fox": PixelMannen (CC0); rigging/animación tomkranis (CC BY 4.0).
- HDRIs: Poly Haven — CC0.
- Fuentes Orbitron y Rajdhani — SIL OFL 1.1.
