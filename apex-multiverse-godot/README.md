# Apex Multiverse · República de Fransterra (Godot 4.3)

Juego de conducción y vuelo en **un solo país gigante** (16 × 16 km) inspirado en French Store.
Ya no hay 120 mapas por modo: todo ocurre en el mismo mapa y cada modo usa sus carreteras, ciudades, aeropuertos y el mar.

## El país
- **10 departamentos**: Lumière (capital con rascacielos), Bastille Sur (zona roja: edificios abandonados con ventanas rotas y grafitis, barriles con fuego, indigentes), Côte d'Azur (playas y hoteles), Provence Verte (campos y pueblos), Alpes du Nord y Mont-Blanc Est (montañas nevadas), Forêt Noire (bosque), Seine-Marine (río, puerto, grúas y buques), Saint-Exupéry (aeropuerto) y Vallée d'Or (viñedos).
- 53 carreteras: autopista nacional A1 (anillo de 33 km), avenidas, rutas, puertos de montaña y caminos de tierra; túneles, viaductos, puentes, **puente levadizo**, semáforos en cruces y pasos a nivel con **tren**.
- Peatones, autos ambientales, Torre Lumière, portaaviones y aeropuerto con aviones aparcados.

## Modos
| Modo | Escena | Descripción |
|---|---|---|
| Infinito | `scenes/Highway.tscn` | La A1 sin fin con tráfico de autos, camiones, buses y **motos**. Rozones, nitro, obras y 3 vidas. |
| Historia | `scenes/Race.tscn` | 10 carreras agresivas: rivales que embisten, derribos, piezas volando, nitro. |
| Camiones | `scenes/Truck.tscn` | 8 entregas de A a B: semáforos, límites de velocidad, animales (multa por atropello), árboles caídos con desvío, puente levadizo y trenes. |
| Aviones | `scenes/Plane.tscn` | 8 misiones: despegue (aeropuerto, aeródromo o portaaviones), combate con ametralladora y misiles, y aterrizaje. |

Antes de cada modo se abre el **garaje** (`scenes/Garage.tscn`): 20 vehículos por modo (80 en total) con sus colores; se compran con monedas.

## Rendimiento (móviles de gama media)
- Solo existe lo que el jugador ve: el mapa se divide en chunks de 256 m que se generan en **hilos de trabajo** y se cargan/descargan alrededor de la cámara con 3 niveles de detalle.
- Peatones y autos ambientales se animan en la GPU (sin coste de CPU); vegetación con MultiMesh; vehículos en 2 superficies.
- Calidad "Rendimiento" por defecto en Android: render 3D a ~600p, sin sombras ni bloom, niebla que oculta el horizonte.

## Herramientas
- `../tools/gen_world.py <salida>`: genera el país (relieve, biomas, carreteras, edificios, mapa) en `assets/world/`.
- `../tools/gen_textures.py`, `../tools/gen_textures2.py`, `../tools/gen_audio.py`: texturas y sonido procedurales.
- `tools/shot.sh <escena> <salida.png> [frames] VAR=valor`: captura de prueba (`AUTOPILOT=1`, `SKIP=s`, `LEVEL=n`, `PRESET=night|day|sunset|sunrise`, `QUALITY=0|1|2`, `CAM=0|1|2`). Imprime métricas de rendimiento.

## Créditos
- "Fox": PixelMannen (CC0); rigging/animación tomkranis (CC BY 4.0).
- HDRIs: Poly Haven — CC0.
- Fuentes Orbitron y Rajdhani — SIL OFL 1.1.
