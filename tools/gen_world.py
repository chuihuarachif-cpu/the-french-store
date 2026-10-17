"""Genera el país "Fransterra" (mapa único) para Apex Multiverse.
Uso: python3 tools/gen_world.py <carpeta_salida>
Salidas:
  height.png   16 bits, 2048x2048, 8 m por píxel. h = valor/40 - 100 (metros)
  biome.png    RGBA 2048x2048: R=bioma, G=distancia a carretera (m, máx 255), B=departamento
  splat.png    RGBA 1024: R=tierra/campo, G=roca, B=arena, A=urbano
  tint.png     RGB 512: tinte del césped (bosque, campos, viñedos...)
  map.png      RGB 1024: mapa ilustrado para el menú y el minimapa
  world.json   carreteras (puntos y banderas), ríos, puntos de interés, eventos
  buildings.bin float32 [x, y, z, ancho, fondo, alto, yaw, estilo] por edificio
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

OUT = sys.argv[1] if len(sys.argv) > 1 else "world"
os.makedirs(OUT, exist_ok=True)
N = 4096
CELL = 8.0
HALF = N * CELL / 2.0  # 16384
S = 2.0  # escala del diseño original (país de 16 km -> 32 km)

def P(x, z):
    return (x * S, z * S)

def PL(lst):
    return [P(p[0], p[1]) for p in lst]
rng = np.random.default_rng(20261017)

ax = (np.arange(N) + 0.5) * CELL - HALF
X, Z = np.meshgrid(ax, ax)  # X[row, col] = x(col), Z[row,col] = z(row)

def to_px(x, z):
    return (x + HALF) / CELL - 0.5, (z + HALF) / CELL - 0.5

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)

def fbm(octaves, base_cells, seed, persistence=0.5):
    r = np.random.default_rng(seed)
    out = np.zeros((N, N))
    amp = 1.0
    tot = 0.0
    cells = base_cells
    for o in range(octaves):
        g = r.standard_normal((cells + 3, cells + 3))
        up = ndimage.zoom(g, (N + 3 * N / cells) / (cells + 3), order=3)[:N, :N]
        out += up * amp
        tot += amp
        amp *= persistence
        cells *= 2
    out /= tot
    out = (out - out.min()) / (out.max() - out.min())
    return out

# ------------------------------------------------------------------ RELIEVE BASE
print("relieve...")
n_hills = fbm(6, 12, 1)
n_ridge = 1.0 - np.abs(fbm(6, 10, 2) * 2 - 1)
n_det = fbm(5, 48, 3)
n_patch = fbm(4, 24, 4)

def coast_x(z):
    z = np.asarray(z, dtype=float) / S
    cx = 5100 + 300 * np.sin(z / 1500.0) + 150 * np.sin(z / 550.0 + 1.0)
    cx = cx - 750 * np.exp(-((z + 900) / 900.0) ** 2)  # bahía de la desembocadura
    return cx * S

CX = coast_x(Z)
# Montañas al norte (Alpes du Nord) y al noreste
mount = smoothstep(-2800 * S, -5600 * S, Z) * (0.65 + 0.35 * smoothstep(-6000 * S, 2000 * S, X))
mount = np.maximum(mount, smoothstep(-3800 * S, -6600 * S, Z))
h = 16 + 34 * n_hills + 7 * n_det
h += mount * (120 + 640 * n_ridge ** 1.7 + 100 * n_det)
# Crestas que la autopista atraviesa con túneles
h += 210 * np.exp(-((Z + 3950 * S) / (380.0 * S)) ** 2) * np.exp(-((X + 900 * S) / (1000.0 * S)) ** 2)
h += 150 * np.exp(-((X + 6150 * S) / (330.0 * S)) ** 2) * np.exp(-((Z + 1300 * S) / (800.0 * S)) ** 2)
h += 120 * np.exp(-((X - 3300 * S) / (600.0 * S)) ** 2) * np.exp(-((Z + 3000 * S) / (300.0 * S)) ** 2)
# Colinas del bosque (noroeste) y del oeste
forest_hill = smoothstep(-1000 * S, -2600 * S, Z) * smoothstep(-2200 * S, -3600 * S, X)
h += forest_hill * 110 * n_hills
h += smoothstep(-9000, -15000, X) * 70 * n_hills
# Costa: baja hasta el mar
land = smoothstep(CX + 120, CX - 700, X)
h = h * land + (1 - land) * (-28 + 10 * n_det)
# Playas: rampa suave
beach = smoothstep(CX - 450, CX - 60, X) * (1 - smoothstep(CX - 60, CX + 200, X))
# Ciudades: llanuras urbanas
CITIES = [
    {"name": "Port-Lumière", "x": 0.0, "z": -200.0, "r": 2800.0, "tower": 1.0, "h": 14.0},
    {"name": "Val-Royal", "x": 5600.0, "z": 14000.0, "r": 1500.0, "tower": 0.65},
    {"name": "Mont-Ferrand", "x": -12400.0, "z": -9600.0, "r": 1300.0, "tower": 0.45},
]
D0 = np.hypot(X - CITIES[0]["x"], Z - CITIES[0]["z"])
for ci in CITIES:
    dci = np.hypot(X - ci["x"], Z - ci["z"])
    if "h" not in ci:
        px_, pz_ = (ci["x"] + HALF) / CELL, (ci["z"] + HALF) / CELL
        ci["h"] = float(max(6.0, h[int(pz_) - 40:int(pz_) + 40, int(px_) - 40:int(px_) + 40].mean()))
    city_t = 1 - smoothstep(ci["r"], ci["r"] + 900, dci)
    h = h * (1 - city_t) + ci["h"] * city_t
# Zona roja: un poco más baja
# Aeropuerto principal
AIR = {"x": -10200.0, "z": 11900.0, "len": 3200.0, "w": 60.0, "yaw": 0.0, "h": 22.0, "name": "Aeropuerto Saint-Exupéry", "id": "airport", "tier": 0}
air_m = smoothstep(2300, 1700, np.abs(X - AIR["x"])) * smoothstep(900, 500, np.abs(Z - AIR["z"]))
h = h * (1 - air_m) + AIR["h"] * air_m
# Aeródromos y aeropuertos regionales (la altura se toma del relieve)
AIR2 = {"x": -12600.0, "z": -400.0, "len": 1700.0, "w": 40.0, "yaw": 0.0, "h": 0.0, "name": "Aeródromo de Provence", "id": "airfield", "tier": 0}
RUNWAYS_X = [
    {"x": 1300.0, "z": 15300.0, "len": 2600.0, "w": 50.0, "yaw": 0.0, "h": 0.0, "name": "Aeropuerto Val-Royal", "id": "valroyal", "tier": 1},
    {"x": -14200.0, "z": -6400.0, "len": 2200.0, "w": 45.0, "yaw": 0.0, "h": 0.0, "name": "Aeropuerto Mont-Ferrand", "id": "montferrand", "tier": 2},
    {"x": 3000.0, "z": -12600.0, "len": 1000.0, "w": 30.0, "yaw": 0.0, "h": 0.0, "name": "Altiport des Alpes", "id": "altiport", "tier": 3},
]
a2 = smoothstep(1300, 950, np.abs(X - AIR2["x"])) * smoothstep(420, 220, np.abs(Z - AIR2["z"]))

def sample(arr, x, z):
    xa = np.atleast_1d(np.asarray(x, float))
    za = np.atleast_1d(np.asarray(z, float))
    px, pz = to_px(xa, za)
    out = ndimage.map_coordinates(arr, [pz, px], order=1, mode="nearest")
    return out if np.ndim(x) > 0 else out[0]

AIR2["h"] = float(sample(h, AIR2["x"], AIR2["z"]))
h = h * (1 - a2) + AIR2["h"] * a2
for rw in RUNWAYS_X:
    rw["h"] = float(max(4.0, sample(h, rw["x"], rw["z"])))
    hl = rw["len"] * 0.5
    am = smoothstep(hl + 650, hl + 250, np.abs(X - rw["x"])) * smoothstep(rw["w"] * 4 + 350, rw["w"] * 4, np.abs(Z - rw["z"]))
    h = h * (1 - am) + rw["h"] * am

# ------------------------------------------------------------------ CURVAS
def catmull(pts, closed, step):
    pts = [np.array(p, float) for p in pts]
    n = len(pts)
    out = []
    segs = n if closed else n - 1
    for i in range(segs):
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[0] * 2 - pts[1]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2 * 2 - p1
        d = np.linalg.norm(p2 - p1)
        k = max(2, int(d / 2.0))
        for j in range(k):
            t = j / k
            t2, t3 = t * t, t * t * t
            p = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
            out.append(p)
    if not closed:
        out.append(pts[-1])
    out = np.array(out)
    # remuestreo uniforme
    seg = np.linalg.norm(np.diff(out, axis=0), axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    total = cum[-1]
    if closed:
        total += np.linalg.norm(out[0] - out[-1])
        out = np.vstack([out, out[:1]])
        cum = np.concatenate([cum, [total]])
    m = max(2, int(round(total / step)))
    ss = np.linspace(0, total, m + (0 if closed else 1), endpoint=not closed)
    res = np.stack([np.interp(ss, cum, out[:, 0]), np.interp(ss, cum, out[:, 1])], 1)
    return res

# ------------------------------------------------------------------ RÍO SENA
print("río...")
RIVER_CP = PL([(-7600, -7000), (-6500, -5700), (-5400, -4000), (-4300, -2600), (-3100, -1400), (-1800, -350), (-500, 200),
            (900, 120), (2200, 330), (3400, -150), (4500, -650), (5600, -900), (7200, -1000), (8300, -1000)])
river = catmull(RIVER_CP, False, 8.0)
rn = len(river)
rs = np.arange(rn) * 8.0
r_w = np.interp(rs / rs[-1], [0, 0.35, 0.55, 0.8, 1], [50, 85, 150, 240, 520])
r_ground = sample(h, river[:, 0], river[:, 1])
# nivel del agua: mínimo acumulado suavizado (siempre baja hacia el mar)
lvl = np.minimum.accumulate(ndimage.uniform_filter1d(r_ground, 60, mode="nearest") - 6)
lvl = np.maximum(lvl, 0.0)
lvl = np.where(sample(CX, river[:, 0], river[:, 1]) < river[:, 0] + 200, np.minimum(lvl, 0.0), lvl)
lvl = ndimage.uniform_filter1d(lvl, 25, mode="nearest")
lvl[-60:] = 0.0

def nearest_field(points, mask_radius_px=None):
    """Para cada píxel: distancia (m) e índice del punto más cercano de la polilínea."""
    seed = np.ones((N, N), bool)
    idx_map = -np.ones((N, N), np.int32)
    px, pz = to_px(points[:, 0], points[:, 1])
    ix = np.clip(np.round(px).astype(int), 0, N - 1)
    iz = np.clip(np.round(pz).astype(int), 0, N - 1)
    seed[iz, ix] = False
    idx_map[iz, ix] = np.arange(len(points))
    dist, inds = ndimage.distance_transform_edt(seed, return_indices=True)
    nid = idx_map[inds[0], inds[1]]
    return dist * CELL, nid

rd, rid = nearest_field(river)
rw_px = r_w[rid] * 0.5
r_lvl = lvl[rid]
in_river = rd < rw_px
bank = smoothstep(rw_px + 70, rw_px, rd) * smoothstep(CX - 150, CX - 900, X)
h = np.where(in_river & (X < CX - 100), np.minimum(h, r_lvl - 5 - 3 * smoothstep(rw_px, 0, rd)), h)
h = h * (1 - bank * (~in_river)) + np.maximum(r_lvl + 2.5, np.minimum(h, r_lvl + 9)) * bank * (~in_river)
river_mask = in_river | ((rd < rw_px + 6) & (h < r_lvl))
sea = (X > CX - 80) & (h < 0.5)

# ------------------------------------------------------------------ CARRETERAS
print("carreteras...")
TYPES = {  # medio ancho de calzada visible, medio ancho de explanación, pendiente máx, suavizado (m)
    "highway": (14.6, 26.0, 0.05, 520.0),
    "avenue": (11.0, 16.0, 0.08, 160.0),
    "road": (5.2, 11.0, 0.09, 110.0),
    "dirt": (3.6, 8.0, 0.12, 90.0),
    "rail": (2.6, 7.0, 0.03, 600.0),
}
PRIO = {"highway": 5, "rail": 4, "avenue": 3, "road": 2, "dirt": 1}
roads = []

def add_road(name, cps, kind, closed=False, extra=None, step=8.0):
    pts = catmull(cps, closed, step)
    if not closed:
        pass
    r = {"name": name, "kind": kind, "closed": closed, "xz": pts, "types": [kind] * len(pts)}
    if extra:
        r.update(extra)
    roads.append(r)
    return r

# A1 — Autopista Nacional (anillo)
ring_c = np.array([-700.0 * S, 700.0 * S])
ring_cp = []
for i in range(64):
    t = i / 64 * math.tau
    r = (5450 + 420 * math.sin(3 * t + 0.7) + 230 * math.sin(5 * t + 2.0)) * S
    x = ring_c[0] + math.cos(t) * r
    z = ring_c[1] + math.sin(t) * r * (0.98 if math.sin(t) > 0 else 0.86)
    x = min(x, float(coast_x(z)) - 900)
    ring_cp.append((x, z))
A1 = add_road("A1 · Autopista Nacional", ring_cp, "highway", True)

def ring_point(angle_deg):
    a = math.radians(angle_deg)
    d = np.array([math.cos(a), math.sin(a)])
    rel = A1["xz"] - ring_c
    proj = rel @ d
    perp = np.abs(rel[:, 0] * d[1] - rel[:, 1] * d[0])
    score = perp - proj * 0.05
    score[proj < 0] = 1e9
    return A1["xz"][int(np.argmin(score))]

CAP = CITIES[0]
CR = CAP["r"]
# Boulevard Circulaire (circuito urbano)
bc = []
for i in range(40):
    t = i / 40 * math.tau
    r = 2000 + 160 * math.sin(4 * t) + 90 * math.sin(7 * t + 1)
    bc.append((CAP["x"] + math.cos(t) * r, CAP["z"] + math.sin(t) * r * 0.92))
add_road("Boulevard Circulaire", bc, "avenue", True)
# Avenidas de la capital (norte-sur y este-oeste) y calles secundarias
AV_NS = ["Voltaire", "Molière", "Diderot", "des Champs", "Hugo", "Rousseau", "Zola"]
for i, x in enumerate([-2400, -1600, -800, 0, 800, 1600, 2400]):
    lim = math.sqrt(max(0, (CR + 150) ** 2 - x ** 2))
    add_road("Avenue " + AV_NS[i], [(x, CAP["z"] - lim), (x + 10, CAP["z"]), (x, CAP["z"] + lim)], "avenue")
AV_EW = ["Lafayette", "Montmartre", "Saint-Honoré", "Bastille", "Opéra", "Rivoli"]
for i, dz in enumerate([-2300, -1500, -700, 700, 1500, 2300]):
    lim = math.sqrt(max(0, (CR + 150) ** 2 - dz ** 2))
    add_road("Rue " + AV_EW[i], [(CAP["x"] - lim, CAP["z"] + dz), (CAP["x"], CAP["z"] + dz + 8), (CAP["x"] + lim, CAP["z"] + dz)], "avenue")
for x in [-2000, -1200, -400, 400, 1200, 2000]:
    lim = math.sqrt(max(0, (CR - 50) ** 2 - x ** 2))
    add_road("Rue %d" % (x // 10), [(x, CAP["z"] - lim), (x - 6, CAP["z"]), (x, CAP["z"] + lim)], "road")
for dz in [-1900, -1100, -300, 300, 1100, 1900]:
    lim = math.sqrt(max(0, (CR - 50) ** 2 - dz ** 2))
    add_road("Rue N%d" % (dz // 10), [(CAP["x"] - lim, CAP["z"] + dz), (CAP["x"], CAP["z"] + dz - 5), (CAP["x"] + lim, CAP["z"] + dz)], "road")
# Radiales capital -> A1
for ang, nm in [(205, "N12 · Ruta del Oeste"), (240, "N7 · Ruta del Bosque"), (300, "N4 · Ruta Norte"),
                (150, "N10 · Ruta del Aeropuerto"), (95, "N2 · Ruta del Sur"), (35, "N5 · Ruta de la Costa")]:
    a = math.radians(ang)
    s0 = np.array([CAP["x"] + math.cos(a) * (CR + 80), CAP["z"] + math.sin(a) * (CR + 80)])
    e = ring_point(ang)
    mid = (s0 + e) * 0.5 + np.array([-math.sin(a), math.cos(a)]) * 520
    add_road(nm, [tuple(s0), tuple(mid), tuple(e)], "road")
# Ciudades nuevas: cuadrícula de avenidas
for ci in CITIES[1:]:
    cr = ci["r"]
    for j, dx in enumerate([-cr * 0.55, 0.0, cr * 0.55]):
        lim = math.sqrt(max(0, (cr + 100) ** 2 - dx ** 2))
        add_road("Avenue %d de %s" % (j + 1, ci["name"]), [(ci["x"] + dx, ci["z"] - lim), (ci["x"] + dx + 6, ci["z"]), (ci["x"] + dx, ci["z"] + lim)], "avenue")
    for j, dz in enumerate([-cr * 0.55, 0.0, cr * 0.55]):
        lim = math.sqrt(max(0, (cr + 100) ** 2 - dz ** 2))
        add_road("Rue %d de %s" % (j + 1, ci["name"]), [(ci["x"] - lim, ci["z"] + dz), (ci["x"], ci["z"] + dz + 6), (ci["x"] + lim, ci["z"] + dz)], "road")
# Autopistas nuevas
VR = CITIES[1]; MF = CITIES[2]
add_road("A2 · Autopista del Sur", [tuple(ring_point(72)), (2600, 13300), (VR["x"] - VR["r"] - 100, VR["z"] + 6)], "highway")
add_road("A3 · Autopista del Norte", [tuple(ring_point(226)), (-10200, -6400), (MF["x"] + MF["r"] + 100, MF["z"] + 6)], "highway")
# Ruta del Puerto (puente levadizo)
add_road("Avenue du Port", PL([(1500, -1350), (2400, -1150), (3150, -900), (3500, -350), (3600, 250), (3900, 700), (4400, 900)]), "avenue",
         extra={"drawbridge": True})
# Corniche d'Azur (costera)
cor = [P(4400, 900)]
for z in np.linspace(1500 * S, 6600 * S, 14):
    cor.append((float(coast_x(z)) - 700, z))
cor += [(VR["x"] + VR["r"] + 600, VR["z"] - 300), (VR["x"] + VR["r"] + 100, VR["z"] + 6)]
add_road("Corniche d'Azur", cor, "avenue")
# Route des Alpes (puerto de montaña con curvas de herradura)
add_road("Route des Alpes", PL([(-1400, -2050), (-1500, -3300), (-1150, -4300), (-1900, -4700), (-1100, -5200), (-1800, -5650), (-900, -6050),
                             (-250, -6700), (800, -6550), (1500, -6050), (1050, -5500), (2000, -5150), (2650, -4450), (3300, -3800)]), "road", extra={"grade": 0.12, "smooth": 80.0})
# Chemin Forestier (tierra) y aserradero
add_road("Chemin Forestier", PL([(-2700, -2350), (-3500, -3050), (-4700, -2700), (-5600, -3300), (-6250, -2450), (-5600, -1650), (-4500, -1700)]), "dirt")
T1 = add_road("Ruta Maderera", PL([(-4500, -1700), (-4200, -1050), (-3700, -700), (-3100, -900), (-2600, -1700), (-2050, -2100), (-1500, -2150)]), "road")
for i in range(0, 120):
    T1["types"][i] = "dirt"
add_road("Ruta de Saint-Clair", PL([(-6000, 1900), (-5000, 1300), (-3800, 650), (-3000, 200), (-2400, 400), (-1880, 250)]), "road")
add_road("Ruta del Aeropuerto Carga", [(AIR["x"] + 1900, AIR["z"] - 440), (AIR["x"] + 2600, AIR["z"] - 900)] + PL([(-2700, 4000), (-1500, 3500), (-300, 3000), (300, 2700)]), "road")
# Bastille Sur (zona roja): circuito y calles (escala propia 1.4 alrededor de su centro)
BC0 = np.array([950.0, 2750.0]); BCN = np.array(P(950.0, 2750.0))
def BZ(lst):
    return [tuple(BCN + (np.array(p, float) - BC0) * 1.4) for p in lst]
add_road("Circuito Bastille", BZ([(250, 2150), (1000, 2050), (1650, 2250), (1700, 2900), (1500, 3350), (800, 3400), (300, 3150), (150, 2600)]), "avenue", True)
add_road("Rue des Ombres", BZ([(150, 2700), (900, 2620), (1700, 2650)]), "avenue")
add_road("Rue du Feu", BZ([(950, 2050), (900, 2700), (850, 3400)]), "avenue")
# Route des Vins (circuito de viñedos)
rv = []
for i in range(28):
    t = i / 28 * math.tau
    r = (1150 + 160 * math.sin(3 * t)) * 1.5
    rv.append((-700 * S + math.cos(t) * r, 6000 * S + math.sin(t) * r * 0.75))
add_road("Route des Vins", rv, "road", True)
# Perímetros de aeropuertos
def perimeter(a, nm):
    hx = a["len"] * 0.5 + 300
    hz = max(a["w"] * 4 + 200, 420)
    add_road(nm, [(a["x"] - hx, a["z"] - hz), (a["x"] + hx, a["z"] - hz), (a["x"] + hx + 150, a["z"]), (a["x"] + hx, a["z"] + hz),
                  (a["x"] - hx, a["z"] + hz), (a["x"] - hx - 150, a["z"])], "road", True)
perimeter(AIR, "Perímetro Saint-Exupéry")
# Pueblos
VILLAGES = [(n_, x_ * S, z_ * S) for (n_, x_, z_) in [("Saint-Clair", -3000, 200), ("Beaumont", -5700, 1900), ("Vignac", -1300, 5700), ("Montclar", 2100, 5200),
            ("Valfroid", -2600, -3300), ("Sainte-Marie", 4000, 3300), ("Rochefort", -6400, 4200)]]
VILLAGES += [("Lacombe", -14300.0, 2600.0), ("Fontaine-Bleue", -7000.0, -9800.0), ("Saint-Rémy", 3000.0, 9300.0), ("Belvédère", 6800.0, -8600.0),
             ("Les Halles", -5600.0, 14200.0), ("Pont-Neuf", 5600.0, -5200.0), ("Mireval", -13400.0, 8600.0), ("Sainte-Croix", -9000.0, 4800.0),
             ("Haut-Rhin", -4200.0, -13600.0)]
for vn, vx, vz in VILLAGES:
    add_road("Grande Rue de " + vn, [(vx - 560, vz - 40), (vx, vz), (vx + 560, vz + 50)], "road")
    add_road("Rue de l'Église (" + vn + ")", [(vx + 30, vz - 520), (vx, vz), (vx - 20, vz + 520)], "road")
# Rutas regionales (unen ciudades, pueblos y aeropuertos)
def vpos(name):
    for v in VILLAGES:
        if v[0] == name:
            return (v[1], v[2])
add_road("D20 · Val-Royal – Saint-Rémy", [(VR["x"], VR["z"] - VR["r"] - 100), (4300, 11200), vpos("Saint-Rémy")], "road")
add_road("D22 · Val-Royal – Aeropuerto", [(VR["x"] - math.sqrt((VR["r"] + 100) ** 2 - (VR["r"] * 0.55) ** 2), VR["z"] + VR["r"] * 0.55 + 6), (3200, 15000), (RUNWAYS_X[0]["x"] + 1700, RUNWAYS_X[0]["z"] - 700)], "road")
add_road("D31 · Mont-Ferrand – Aeropuerto", [(MF["x"] - MF["r"] - 100, MF["z"] + 6), (MF["x"] - MF["r"] - 500, MF["z"] + 250), (-13900, -8300), (RUNWAYS_X[1]["x"], RUNWAYS_X[1]["z"] - 700)], "road")
add_road("D33 · Ruta del Oeste", [(RUNWAYS_X[1]["x"] + 1300, RUNWAYS_X[1]["z"] + 500), (-13400, -2800), (AIR2["x"] - 1100, AIR2["z"] - 300), vpos("Lacombe"), vpos("Mireval"), (AIR["x"] - 2500, AIR["z"] - 900), (AIR["x"] - 1900, AIR["z"] - 440)], "road")
add_road("D35 · Lacombe – Beaumont", [vpos("Lacombe"), (-12800, 3400), vpos("Beaumont")], "road")
add_road("D40 · Sainte-Croix", [vpos("Rochefort"), vpos("Sainte-Croix"), vpos("Beaumont")], "road")
add_road("D41 · Les Halles", [(AIR["x"] + 1900, AIR["z"] + 440), (AIR["x"] + 2600, AIR["z"] + 900), vpos("Les Halles"), (-3000, 14600), vpos("Vignac")], "road")
add_road("D50 · Fontaine-Bleue", [(MF["x"], MF["z"] - MF["r"] - 100), (MF["x"] + 400, MF["z"] - MF["r"] - 500), vpos("Fontaine-Bleue"), (-5600, -8400), P(-2600, -3300)], "road")
add_road("D52 · Haut-Rhin", [vpos("Fontaine-Bleue"), (-5600, -12000), vpos("Haut-Rhin"), (-1500, -13400), P(-900, -6050)], "road", extra={"grade": 0.12, "smooth": 80.0})
add_road("D60 · Belvédère – Altiport", [P(3300, -3800), vpos("Pont-Neuf"), vpos("Belvédère"), (5200, -11000), (RUNWAYS_X[2]["x"] + 900, RUNWAYS_X[2]["z"] + 250)], "road", extra={"grade": 0.12, "smooth": 80.0})
add_road("D70 · Saint-Rémy – Sainte-Marie", [vpos("Saint-Rémy"), (5400, 8000), vpos("Sainte-Marie")], "road")
# Conectores: la red queda unida (rutas de camión a todos los depósitos)
add_road("N3 · Acceso a los Alpes", [(CAP["x"], CAP["z"] - (CR + 150)), (-1400, -3700), P(-1400, -2050)], "road")
zl = math.sqrt((CR + 150) ** 2 - 2400 ** 2)
add_road("Quai de Seine", [(2400, CAP["z"] - zl), (2700, -2300), P(1500, -1350)], "avenue")
# Ferrocarril
RAIL = add_road("Ferrocarril Nacional", PL([(-1300, 1300), (-2700, 1650), (-4300, 2500), (-5800, 3500), (-4300, 4200), (-2600, 4500), (-1000, 4300), (600, 4000), (2200, 4300), (3600, 4100)]) + [(5600, 9400), (VR["x"] - 600, VR["z"] - VR["r"] - 300)], "rail")

# ------------------------------------------------------------------ PERFILES Y EXPLANACIÓN
from scipy.spatial import cKDTree

def nearest_window(points, margin):
    """Distancia (m) e índice del punto más cercano, solo en la ventana que rodea la vía (rápido)."""
    px, pz = to_px(points[:, 0], points[:, 1])
    m = int(margin / CELL) + 3
    x0 = max(0, int(px.min()) - m); x1 = min(N, int(px.max()) + m + 1)
    z0 = max(0, int(pz.min()) - m); z1 = min(N, int(pz.max()) + m + 1)
    seed = np.ones((z1 - z0, x1 - x0), bool)
    idx_map = -np.ones((z1 - z0, x1 - x0), np.int32)
    ix = np.clip(np.round(px).astype(int) - x0, 0, x1 - x0 - 1)
    iz = np.clip(np.round(pz).astype(int) - z0, 0, z1 - z0 - 1)
    seed[iz, ix] = False
    idx_map[iz, ix] = np.arange(len(points))
    dist, inds = ndimage.distance_transform_edt(seed, return_indices=True)
    return (z0, z1, x0, x1), dist * CELL, idx_map[inds[0], inds[1]]

road_dist = np.full((N, N), 999.0, np.float32)
order = sorted(range(len(roads)), key=lambda i: -PRIO[roads[i]["kind"]])
placed = []
trees = {}
for ri in order:
    r = roads[ri]
    xz = r["xz"]
    n = len(xz)
    half, flat, grade, smooth = TYPES[r["kind"]]
    grade = r.get("grade", grade)
    smooth = r.get("smooth", smooth)
    g = sample(h, xz[:, 0], xz[:, 1])
    over_w = sample((river_mask | sea).astype(float), xz[:, 0], xz[:, 1]) > 0.3
    w_lvl = np.where(over_w, sample(np.where(river_mask, r_lvl, 0.0), xz[:, 0], xz[:, 1]), -999)
    target = np.where(over_w, np.maximum(g, w_lvl + 10.0), g)
    target = np.maximum(target, 1.5)
    win = max(3, int(smooth / 8.0))
    mode = "wrap" if r["closed"] else "nearest"
    prof = ndimage.uniform_filter1d(target, win, mode=mode)
    prof = ndimage.uniform_filter1d(prof, win, mode=mode)
    prof = np.where(over_w, np.maximum(prof, w_lvl + 9.0), prof)
    # Enganche de cruces con vías ya colocadas
    pins = []
    for pj in placed:
        o = roads[pj]
        d, j = trees[pj].query(xz, distance_upper_bound=TYPES[o["kind"]][0] + 2)
        ok = np.isfinite(d)
        if not ok.any():
            continue
        i0 = int(np.argmin(np.where(ok, d, 1e9)))
        oy = o["y"][j[i0]]
        if abs(oy - prof[i0]) < 12 and r["kind"] != "rail" and o["kind"] != "rail":
            pins.append((i0, oy, pj))
    for (i0, oy, pj) in pins:
        k = np.arange(n)
        dd = np.abs(k - i0)
        if r["closed"]:
            dd = np.minimum(dd, n - dd)
        wgt = smoothstep(16, 3, dd)
        prof = prof * (1 - wgt) + oy * wgt
    lim = grade * 8.0
    for _ in range(3):
        for i in range(1, n):
            prof[i] = np.clip(prof[i], prof[i - 1] - lim, prof[i - 1] + lim)
        for i in range(n - 2, -1, -1):
            prof[i] = np.clip(prof[i], prof[i + 1] - lim, prof[i + 1] + lim)
    r["y"] = prof
    flags = np.zeros(n, np.int32)
    g2 = sample(h, xz[:, 0], xz[:, 1])
    # en carreteras de montaña se prefieren terraplenes y desmontes a puentes y túneles
    t_lim = {"highway": 18.0, "rail": 16.0}.get(r["kind"], 30.0)
    b_lim = {"highway": 9.0, "rail": 8.0}.get(r["kind"], 15.0)
    tunnel = (g2 - prof) > t_lim
    bridge = ((prof - g2) > b_lim) | over_w
    tunnel = ndimage.binary_closing(tunnel, np.ones(9))
    tunnel = ndimage.binary_opening(tunnel, np.ones(12))
    bridge = ndimage.binary_closing(bridge, np.ones(5))
    bridge = ndimage.binary_opening(bridge, np.ones(3))
    bridge &= ~tunnel
    if r["kind"] == "dirt":
        tunnel[:] = False
    flags[tunnel] |= 1
    flags[bridge] |= 2
    if r.get("drawbridge"):
        wi = np.where(over_w)[0]
        if len(wi):
            c = int(np.median(wi))
            flags[max(0, c - 7):c + 8] |= 4
            r["draw_s"] = c * 8.0
    r["flags"] = flags
    # explanación del terreno (no en túneles ni puentes)
    (z0, z1, x0, x1), rd2, rid2 = nearest_window(xz, flat + 60)
    yy = prof[rid2]
    ff = flags[rid2]
    w = smoothstep(flat + 46, flat, rd2) * ((ff & 3) == 0)
    hs = h[z0:z1, x0:x1]
    h[z0:z1, x0:x1] = hs * (1 - w) + (yy - 0.35) * w
    dwin = (rd2 - half).astype(np.float32)
    rdw = road_dist[z0:z1, x0:x1]
    road_dist[z0:z1, x0:x1] = np.minimum(rdw, dwin)
    trees[ri] = cKDTree(xz)
    placed.append(ri)
    print("  %-38s %6.0f m  túnel %4d  puente %4d" % (r["name"], n * 8, int((flags & 1).sum() * 8), int((flags & 2).sum() * 8)), flush=True)

# Ocultar el tramo de las vías de menor prioridad que queda dentro de otra calzada (cruces limpios)
for ri, r in enumerate(roads):
    if r["kind"] == "rail":
        continue
    xz = r["xz"]
    hide = np.zeros(len(xz), bool)
    for oi, o in enumerate(roads):
        if o is r or PRIO[o["kind"]] < PRIO[r["kind"]] or o["kind"] == "rail":
            continue
        if PRIO[o["kind"]] == PRIO[r["kind"]] and oi > ri:
            continue
        d, j = trees[oi].query(xz, distance_upper_bound=TYPES[o["kind"]][0])
        ok = np.isfinite(d)
        if not ok.any():
            continue
        jj = np.where(ok, j, 0)
        oy = o["y"][jj]
        hide |= ok & (d < TYPES[o["kind"]][0] - 1.0) & (np.abs(oy - r["y"]) < 3.0)
    r["flags"][hide] |= 8

# Cruces (para semáforos y rutas): pares de vías que se tocan a nivel. [s, otra, tipo, s_en_la_otra]
for r in roads:
    r["junctions"] = []
for a_ in range(len(roads)):
    for b_ in range(a_ + 1, len(roads)):
        ra, rb = roads[a_], roads[b_]
        if "rail" in (ra["kind"], rb["kind"]) and not ("rail" in (ra["kind"], rb["kind"]) and ra["kind"] != rb["kind"]):
            continue
        lim = min(TYPES[ra["kind"]][0], TYPES[rb["kind"]][0]) + 6
        A = ra["xz"][::2]
        d, j = trees[b_].query(A, distance_upper_bound=lim)
        hits = np.where(np.isfinite(d))[0]
        last = -999
        for i in hits:
            # mínimo local de la distancia en este tramo de contacto
            if i - last < 20:
                continue
            k = i
            while k + 1 < len(A) and np.isfinite(d[k + 1]) and d[k + 1] <= d[k]:
                k += 1
            jj = int(j[k])
            ya, yb = ra["y"][k * 2], rb["y"][jj]
            last = k
            if abs(ya - yb) > 4:
                continue
            kind = "rail" if "rail" in (ra["kind"], rb["kind"]) else "cross"
            ra["junctions"].append([float(k * 16.0), b_, kind, float(jj * 8.0)])
            rb["junctions"].append([float(jj * 8.0), a_, kind, float(k * 16.0)])

# ------------------------------------------------------------------ DEPÓSITOS, EMPRESAS Y CONCESIONARIA
print("depósitos...")
road_idx = {r["name"]: i for i, r in enumerate(roads)}
DEPOT_DEFS = [
    ("dealer", "Concesionaria French Store Trucks", "N10 · Ruta del Aeropuerto", 0.5, 1, 260, 170, ["Paquetería", "Electrodomésticos"]),
    ("sawmill", "Aserradero de Forêt Noire", "Ruta Maderera", 0.05, -1, 200, 140, ["Troncos", "Madera aserrada"]),
    ("refinery", "Refinería del Sena", "Avenue du Port", 0.14, -1, 220, 150, ["Combustible", "Gas"]),
    ("containers", "Terminal de Contenedores", "Avenue du Port", 0.86, 1, 240, 150, ["Contenedor"]),
    ("farm", "Granja de Provence", "Ruta de Saint-Clair", 0.12, 1, 180, 130, ["Ganado", "Heno"]),
    ("quarry", "Cantera de los Alpes", "Route des Alpes", 0.1, -1, 200, 140, ["Maquinaria pesada", "Bloques de piedra"]),
    ("carfactory", "Fábrica de Autos Mont-Ferrand", "D31 · Mont-Ferrand – Aeropuerto", 0.35, 1, 240, 160, ["Autos nuevos", "Repuestos"]),
    ("logistics", "Centro Logístico Val-Royal", "D20 · Val-Royal – Saint-Rémy", 0.3, -1, 220, 150, ["Alimentos congelados", "Frutas", "Paquetería"]),
    ("winery", "Bodega Vallée d'Or", "Route des Vins", 0.6, 1, 170, 120, ["Vino"]),
    ("market", "Mercado Central Lumière", "N2 · Ruta del Sur", 0.3, 1, 200, 130, ["Verduras", "Electrodomésticos"]),
    ("aircargo", "Carga Aérea Saint-Exupéry", "Ruta del Aeropuerto Carga", 0.05, 1, 200, 140, ["Contenedor", "Paquetería"]),
    ("dairy", "Lechería de Mireval", "D33 · Ruta del Oeste", 0.72, -1, 170, 120, ["Leche", "Ganado"]),
    ("steel", "Acería de Pont-Neuf", "D60 · Belvédère – Altiport", 0.1, 1, 220, 150, ["Acero", "Maquinaria pesada"]),
]
DEPOTS = []
for (did, dname, rname, frac, side, dw, dd, cargo) in DEPOT_DEFS:
    ri = road_idx[rname]
    r = roads[ri]
    xz = r["xz"]
    n = len(xz)
    i = int(frac * (n - 1))
    # evitar puentes, túneles y cruces
    for _ in range(80):
        if (r["flags"][max(0, i - 25):i + 25] & 15).any():
            i = (i + 7) % n
        else:
            break
    p = xz[i]
    fw = xz[min(n - 1, i + 2)] - xz[max(0, i - 2)]
    fw = fw / max(np.linalg.norm(fw), 1e-6)
    right = np.array([-fw[1], fw[0]])
    E = TYPES[r["kind"]][0]
    c = p + right * side * (E + 14 + dd * 0.5)
    y = float(r["y"][i])
    # explanar el patio a la altura de la vía
    U = (X - c[0]) * fw[0] + (Z - c[1]) * fw[1]
    V = (X - c[0]) * right[0] + (Z - c[1]) * right[1]
    wgt = smoothstep(dw * 0.5 + 40, dw * 0.5 + 4, np.abs(U)) * smoothstep(dd * 0.5 + 40, dd * 0.5 + 4, np.abs(V))
    h = h * (1 - wgt) + (y - 0.25) * wgt
    yaw = math.atan2(-side * right[0], -side * right[1])  # la entrada mira a la vía
    DEPOTS.append({"id": did, "name": dname, "x": round(float(c[0]), 1), "z": round(float(c[1]), 1), "y": round(y, 2),
                   "yaw": round(yaw, 4), "w": dw, "d": dd, "road": ri, "s": float(i * 8.0), "side": side,
                   "fx": round(float(fw[0]), 4), "fz": round(float(fw[1]), 4), "cargo": cargo})
    print("  %-34s %s s=%d" % (dname, rname, i * 8))

# ------------------------------------------------------------------ AGUA FINAL
sea = (X > CX - 80) & (h < 0.3)
river_mask = river_mask & (h < r_lvl + 0.5)

# ------------------------------------------------------------------ BIOMAS Y DEPARTAMENTOS
print("biomas...")
DEPTS = [
    ("Lumière", "Capital", 0, -200),
    ("Bastille Sur", "Zona roja", 1900, 5500),
    ("Côte d'Azur", "Playas", 8200, 7800),
    ("Provence Verte", "Campos y pueblos", -10400, 3400),
    ("Alpes du Nord", "Montañas", -1800, -12600),
    ("Forêt Noire", "Bosque", -9600, -5800),
    ("Seine-Marine", "Puerto y río", 7800, -3800),
    ("Saint-Exupéry", "Aeropuerto", -9600, 12000),
    ("Vallée d'Or", "Viñedos", -1000, 12400),
    ("Mont-Blanc Est", "Alta montaña", 6400, -12000),
    ("Val-Royal", "Ciudad del sur", 5600, 14000),
    ("Mont-Ferrand", "Ciudad industrial", -12400, -9600),
    ("Plateau de l'Ouest", "Llanuras del oeste", -14000, -1500),
]
dpos = np.array([[d[2], d[3]] for d in DEPTS])
best = np.full((N, N), 1e18)
dept = np.zeros((N, N), np.uint8)
warp_x = (fbm(3, 8, 11) - 0.5) * 1800
warp_z = (fbm(3, 8, 12) - 0.5) * 1800
for i, (dx, dz) in enumerate(dpos):
    w = {0: 0.55, 10: 0.45, 11: 0.5}.get(i, 1.0)  # las ciudades ocupan menos
    d = ((X + warp_x - dx) ** 2 + (Z + warp_z - dz) ** 2) * (1 / w)
    m = d < best
    best = np.where(m, d, best)
    dept[m] = i

# ids: 0 pradera,1 campo,2 bosque,3 ciudad,4 zona roja,5 playa,6 roca,7 nieve,8 mar,9 río,10 viñedo,11 aeropuerto,12 puerto,13 pueblo,14 parque
B = np.zeros((N, N), np.uint8)
slope = np.hypot(*np.gradient(h, CELL))
fields = (dept == 3) | ((dept == 8) & False)
B[(dept == 3) | (dept == 7) | (dept == 12) | (dept == 10)] = 1
forest_m = ((dept == 5) & (n_patch > 0.3)) | ((dept == 4) & (h < 480) & (n_patch > 0.35)) | ((dept == 9) & (h < 500) & (n_patch > 0.45)) | ((dept == 11) & (n_patch > 0.45)) | (n_patch > 0.78)
B[forest_m] = 2
B[(dept == 8)] = 10
B[(dept == 8) & (n_patch > 0.7)] = 0
B[(slope > 0.55) | ((h > 330) & (n_det > 0.45))] = 6
B[h > 600 + 80 * n_det] = 7
for ci in CITIES:
    B[np.hypot(X - ci["x"], Z - ci["z"]) < ci["r"] - 50] = 3
park = np.hypot(X + 1200, Z + 1500) < 420
B[park] = 14
RED = {"x": 1900.0, "z": 5500.0, "r": 1300.0}
red = np.hypot(X - RED["x"], Z - RED["z"]) < RED["r"]
B[red] = 4
PORT = {"x0": 7300.0, "x1": 9900.0, "z0": -500.0, "z1": 1500.0}
port = (X > PORT["x0"]) & (X < PORT["x1"]) & (Z > PORT["z0"]) & (Z < PORT["z1"])
B[port] = 12
for rw in [AIR, AIR2] + RUNWAYS_X:
    am = (np.abs(X - rw["x"]) < rw["len"] * 0.5 + 300) & (np.abs(Z - rw["z"]) < (640 if rw is AIR else rw["w"] * 4 + 160))
    B[am] = 11
for vn, vx, vz in VILLAGES:
    B[np.hypot(X - vx, Z - vz) < 470] = 13
B[(beach > 0.25) & (h < 6) & (h > -1)] = 5
B[river_mask] = 9
B[sea] = 8

# ------------------------------------------------------------------ EDIFICIOS
print("edificios...")
occ = np.zeros((N, N), bool)
occ |= road_dist < 3
occ |= river_mask | sea
for dp in DEPOTS:
    U = (X - dp["x"]) * dp["fx"] + (Z - dp["z"]) * dp["fz"]
    V = (X - dp["x"]) * (-dp["fz"]) + (Z - dp["z"]) * dp["fx"]
    occ |= (np.abs(U) < dp["w"] * 0.5 + 10) & (np.abs(V) < dp["d"] * 0.5 + 10)
buildings = []
STY = {"tower": 0, "mid": 1, "house": 2, "ruin": 3, "warehouse": 4, "hotel": 5, "barn": 6, "hangar": 7, "terminal": 8, "control": 9, "church": 10, "shop": 11}
# dirección de la vía más cercana: gradiente del campo de distancias
gz, gx = np.gradient(ndimage.gaussian_filter(road_dist, 1.5))

def try_place(x, z, w, d, hgt, style, front_gap):
    px, pz = to_px(x, z)
    ix, iz = int(round(px)), int(round(pz))
    if ix < 2 or iz < 2 or ix >= N - 2 or iz >= N - 2:
        return False
    rdist = road_dist[iz, ix]
    if rdist < front_gap + d * 0.5 or rdist > front_gap + d * 0.5 + 70:
        return False
    nx, nz = gx[iz, ix], gz[iz, ix]
    ln = math.hypot(nx, nz)
    if ln < 1e-4:
        return False
    nx, nz = nx / ln, nz / ln  # apunta alejándose de la vía
    # empuja el edificio para que su fachada quede a front_gap de la vía
    push = rdist - (front_gap + d * 0.5)
    if push > 12:
        push = 0.0  # edificio interior de manzana: se queda donde está
    x -= nx * push
    z -= nz * push
    yaw = math.atan2(nx, nz)  # fachada (−fondo) mira a la vía
    # huella en celdas
    cs, sn = math.cos(yaw), math.sin(yaw)
    cells = []
    for u in np.arange(-w / 2 + 2, w / 2 - 1, 6):
        for v in np.arange(-d / 2 + 2, d / 2 - 1, 6):
            cx_ = x + u * cs + v * sn
            cz_ = z - u * sn + v * cs
            qx, qz = to_px(cx_, cz_)
            qi, qk = int(round(qx)), int(round(qz))
            if qi < 0 or qk < 0 or qi >= N or qk >= N or occ[qk, qi]:
                return False
            cells.append((qk, qi))
    for (qk, qi) in cells:
        occ[max(0, qk - 1):qk + 2, max(0, qi - 1):qi + 2] = True
    y = float(sample(h, x, z))
    buildings.append([x, y, z, w, d, hgt, yaw, style])
    return True

def scatter(mask, spacing, gen, tries=1, prob=1.0):
    """mask: matriz booleana N×N. Solo se recorren los puntos de la rejilla que caen dentro."""
    xs = np.arange(-HALF + spacing / 2, HALF, spacing)
    GX, GZ = np.meshgrid(xs, xs)
    for _ in range(tries):
        jx = GX + rng.uniform(-0.35, 0.35, GX.shape) * spacing
        jz = GZ + rng.uniform(-0.35, 0.35, GZ.shape) * spacing
        px, pz = to_px(jx, jz)
        ix = np.clip(px.astype(int), 0, N - 1)
        iz = np.clip(pz.astype(int), 0, N - 1)
        ok = mask[iz, ix]
        if prob < 1.0:
            ok &= rng.random(ok.shape) < prob
        for x, z in zip(jx[ok], jz[ok]):
            gen(float(x), float(z))

def city_gen(x, z):
    best_c = min(CITIES, key=lambda c: math.hypot(x - c["x"], z - c["z"]) / c["r"])
    dc = math.hypot(x - best_c["x"], z - best_c["z"])
    core = max(0.0, 1.0 - dc / (best_c["r"] * 0.9)) * best_c["tower"]
    if rng.random() < core ** 1.5 * 0.85:
        hgt = rng.uniform(70, 120) + core * rng.uniform(40, 180)
        w = rng.uniform(26, 38); d = rng.uniform(24, 34); sty = STY["tower"]
    elif best_c["tower"] < 0.5 and rng.random() < 0.45:
        hgt = rng.uniform(10, 18); w = rng.uniform(40, 70); d = rng.uniform(25, 40); sty = STY["warehouse"]
    else:
        hgt = rng.uniform(14, 40) + core * 30
        w = rng.uniform(22, 40); d = rng.uniform(16, 26); sty = STY["mid"] if rng.random() > 0.15 else STY["shop"]
    try_place(x, z, w, d, hgt, sty, 4.0)

scatter((B == 3) & (road_dist < 120), 26.0, city_gen, 3)
scatter((B == 4) & (road_dist < 60), 30.0,
        lambda x, z: try_place(x, z, rng.uniform(16, 30), rng.uniform(12, 20), rng.uniform(8, 26), STY["ruin"], 3.5), 2)
scatter((B == 13) & (road_dist < 45), 20.0,
        lambda x, z: try_place(x, z, rng.uniform(8, 13), rng.uniform(8, 11), rng.uniform(5, 9), STY["house"], 3.0), 1)
scatter((B == 12) & (road_dist < 90), 60.0,
        lambda x, z: try_place(x, z, rng.uniform(40, 70), rng.uniform(25, 40), rng.uniform(10, 16), STY["warehouse"], 6.0), 1)
scatter(np.isin(B, (0, 5)) & (dept == 2) & (road_dist < 60) & (h > 2), 55.0,
        lambda x, z: try_place(x, z, rng.uniform(26, 44), rng.uniform(16, 22), rng.uniform(18, 60), STY["hotel"], 6.0), 1)
scatter(np.isin(B, (0, 1, 10)) & (road_dist < 50), 80.0,
        lambda x, z: try_place(x, z, rng.uniform(10, 18), rng.uniform(16, 26), rng.uniform(6, 9), STY["barn"], 6.0), 1, 0.05)
scatter(np.isin(B, (0, 1, 2)) & (road_dist < 40), 70.0,
        lambda x, z: try_place(x, z, rng.uniform(8, 12), rng.uniform(8, 10), rng.uniform(5, 8), STY["house"], 4.0), 1, 0.035)
for vn, vx, vz in VILLAGES:
    try_place(vx + 40, vz + 40, 14, 26, 24, STY["church"], 6.0)

# Aeropuerto: terminal, torre, hangares (orientados a la pista)
def add_fixed(x, z, w, d, hgt, yaw, style):
    y = float(sample(h, x, z))
    buildings.append([x, y, z, w, d, hgt, yaw, style])

add_fixed(AIR["x"], AIR["z"] - 430, 520, 70, 22, 0.0, STY["terminal"])
add_fixed(AIR["x"] + 420, AIR["z"] - 380, 14, 14, 55, 0.0, STY["control"])
for i in range(5):
    add_fixed(AIR["x"] - 1300 + i * 140, AIR["z"] + 430, 100, 70, 24, math.pi, STY["hangar"])
for i in range(3):
    add_fixed(AIR2["x"] - 400 + i * 120, AIR2["z"] + 140, 60, 40, 14, math.pi, STY["hangar"])
add_fixed(AIR2["x"] + 300, AIR2["z"] + 120, 10, 10, 22, 0.0, STY["control"])
for rw in RUNWAYS_X:
    zz = rw["z"] - rw["w"] * 4 - 90
    add_fixed(rw["x"] - 200, zz, min(260, rw["len"] * 0.18), 50, 16, 0.0, STY["terminal"])
    add_fixed(rw["x"] + 160, zz + 10, 12, 12, 40, 0.0, STY["control"])
    for i in range(2):
        add_fixed(rw["x"] + 320 + i * 120, zz - 10, 80, 60, 20, 0.0, STY["hangar"])
# naves de los depósitos (al fondo del patio, mirando a la vía)
for dp in DEPOTS:
    bx = dp["x"] - (-dp["fz"]) * dp["side"] * (dp["d"] * 0.5 - 28)
    bz = dp["z"] - dp["fx"] * dp["side"] * (dp["d"] * 0.5 - 28)
    yaw = math.atan2(-dp["side"] * -dp["fz"], -dp["side"] * dp["fx"])
    if dp["id"] == "dealer":
        add_fixed(bx, bz, 90, 40, 14, yaw, STY["shop"])
        add_fixed(bx + dp["fx"] * 85, bz + dp["fz"] * 85, 70, 44, 15, yaw, STY["warehouse"])
    else:
        add_fixed(bx, bz, dp["w"] * 0.45, 44, 14, yaw, STY["warehouse"])
print("  %d edificios" % len(buildings))

# ------------------------------------------------------------------ PUNTOS DE INTERÉS
CARRIER = {"x": 13000.0, "z": -3400.0, "yaw": 0.0, "len": 330.0, "name": "Portaaviones FS Lumière"}
pois = {
    "airport": AIR, "airfield": AIR2, "carrier": CARRIER,
    "runways": [AIR, AIR2] + RUNWAYS_X,
    "cities": CITIES,
    "villages": [{"name": v[0], "x": v[1], "z": v[2]} for v in VILLAGES],
    "depots": DEPOTS,
    "sawmill": {"x": DEPOTS[1]["x"], "z": DEPOTS[1]["z"], "name": "Aserradero de Forêt Noire"},
    "port": {"x": 8600, "z": 500, "name": "Puerto de Lumière"},
    "redzone": RED,
    "park": {"x": -1200, "z": -1500, "r": 420},
    "capital": {"x": CAP["x"], "z": CAP["z"], "r": CAP["r"], "name": "Port-Lumière"},
}
# barriles con fuego / indigentes en zona roja
spots = []
for _ in range(420):
    a = rng.uniform(0, math.tau)
    rr = math.sqrt(rng.uniform(0, 1)) * (RED["r"] - 60)
    x, z = RED["x"] + math.cos(a) * rr, RED["z"] + math.sin(a) * rr
    px, pz = to_px(x, z)
    rdv = road_dist[int(pz), int(px)]
    if 5 < rdv < 14:
        spots.append([round(x, 1), round(float(sample(h, x, z)), 2), round(z, 1)])
pois["fire_spots"] = spots

# ------------------------------------------------------------------ EXPORTAR
print("exportando...")
hq = np.clip((h + 100.0) * 40.0, 0, 65535).astype(np.uint16)
hrgb = np.stack([(hq >> 8).astype(np.uint8), (hq & 255).astype(np.uint8), np.zeros((N, N), np.uint8)], -1)
# extensión .bin para que Godot no la importe (se decodifica en tiempo de ejecución sin perder precisión)
Image.fromarray(hrgb, "RGB").save(os.path.join(OUT, "height.png.bin"), format="PNG", optimize=True)
rdq = np.clip(road_dist, 0, 255).astype(np.uint8)
biome_img = np.stack([B, rdq, dept], -1)
Image.fromarray(biome_img, "RGB").save(os.path.join(OUT, "biome.png.bin"), format="PNG", optimize=True)

# splat (1024)
def down(a):
    return a.reshape(N // 2, 2, N // 2, 2).mean((1, 3))
fb = lambda ids: np.isin(B, ids).astype(float)
dirtw = fb([1]) * 0.35 + fb([10]) * 0.45 + fb([2]) * 0.3 + fb([4]) * 0.5 + fb([12, 11]) * 0.15 + fb([13]) * 0.2
rockw = np.clip(fb([6]) + fb([7]) * 0.5 + smoothstep(0.45, 0.9, slope), 0, 1)
sandw = np.clip(fb([5, 8]) + fb([9]) * 0.6, 0, 1)
urbw = fb([3]) * 0.9 + fb([4]) * 0.7 + fb([12]) * 0.95 + fb([11]) * 0.25 + fb([13]) * 0.3
# arcenes de tierra junto a las carreteras rurales
dirtw = np.maximum(dirtw, smoothstep(9, 2, road_dist) * 0.55 * (1 - urbw))
sp = np.stack([dirtw, rockw, sandw, urbw], -1)
sp = ndimage.gaussian_filter(sp, (1.2, 1.2, 0))
sp = np.stack([down(sp[..., i]) for i in range(4)], -1)
Image.fromarray((np.clip(sp, 0, 1) * 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, "splat.png"), optimize=True)

# tinte (512)
tint = np.ones((N, N, 3)) * np.array([0.95, 1.0, 0.85])
patch = fbm(3, 64, 21)
field_cols = np.array([[1.25, 1.1, 0.55], [0.85, 1.05, 0.55], [1.15, 0.95, 0.6], [0.7, 0.95, 0.5]])
fi = (patch * 3.99).astype(int)
fm = (B == 1)
tint[fm] = field_cols[fi[fm]]
tint[B == 2] = [0.55, 0.75, 0.5]
tint[B == 10] = [0.9, 0.85, 0.55]
tint[B == 14] = [0.8, 1.15, 0.7]
tint[(dept == 9) | (dept == 4)] *= np.array([0.85, 0.9, 0.95])
tint = ndimage.gaussian_filter(tint, (2, 2, 0))
tint = tint.reshape(N // 4, 4, N // 4, 4, 3).mean((1, 3))
Image.fromarray((np.clip(tint / 1.4, 0, 1) * 255).astype(np.uint8), "RGB").save(os.path.join(OUT, "tint.png"), optimize=True)

# mapa ilustrado (1024)
pal = {0: (122, 158, 86), 1: (196, 182, 104), 2: (58, 98, 58), 3: (150, 152, 160), 4: (128, 96, 92), 5: (232, 214, 160), 6: (128, 122, 114),
       7: (236, 240, 246), 8: (38, 104, 160), 9: (52, 128, 188), 10: (150, 120, 90), 11: (120, 124, 120), 12: (112, 116, 128), 13: (190, 150, 120), 14: (96, 170, 90)}
img = np.zeros((N, N, 3))
for k, c in pal.items():
    img[B == k] = c
shade = np.clip(1.0 + (np.gradient(h, axis=1) - np.gradient(h, axis=0)) * 0.08, 0.6, 1.3)
img *= shade[..., None]
img = np.clip(img, 0, 255).astype(np.uint8)
MAPW = 2048
mp = Image.fromarray(img).resize((MAPW, MAPW), Image.LANCZOS)
dr = ImageDraw.Draw(mp)
def mpx(x, z):
    return ((x + HALF) / (2 * HALF) * MAPW, (z + HALF) / (2 * HALF) * MAPW)
colk = {"highway": (255, 196, 40), "avenue": (245, 245, 245), "road": (230, 230, 220), "dirt": (150, 110, 70), "rail": (60, 60, 60)}
wk = {"highway": 5, "avenue": 3, "road": 2, "dirt": 2, "rail": 1}
for r in sorted(roads, key=lambda r: PRIO[r["kind"]]):
    pts = [mpx(p[0], p[1]) for p in r["xz"][::3]]
    if r["closed"]:
        pts.append(pts[0])
    dr.line(pts, fill=colk[r["kind"]], width=wk[r["kind"]])
mp.save(os.path.join(OUT, "map.png"), optimize=True)

world = {
    "size": 2 * HALF, "cell": CELL, "n": N, "height_scale": 40.0, "height_offset": 100.0,
    "country": "República de Fransterra",
    "departments": [{"name": d[0], "desc": d[1], "x": d[2], "z": d[3]} for d in DEPTS],
    "roads": [],
    "river": {"pts": [[round(float(p[0]), 1), round(float(l), 2), round(float(p[1]), 1)] for p, l in zip(river[::2], lvl[::2]) if p[0] < float(coast_x(p[1])) + 300], "w": [round(float(v), 1) for v, p in zip(r_w[::2], river[::2]) if p[0] < float(coast_x(p[1])) + 300]},
    "pois": pois,
}
for r in roads:
    pts = []
    for (p, y) in zip(r["xz"], r["y"]):
        pts += [round(float(p[0]), 2), round(float(y), 2), round(float(p[1]), 2)]
    world["roads"].append({"name": r["name"], "kind": r["kind"], "closed": r["closed"], "pts": pts,
                           "flags": [int(f) for f in r["flags"]], "types": [t[0] for t in r["types"]],
                           "junctions": r["junctions"], "draw_s": r.get("draw_s", -1.0)})
with open(os.path.join(OUT, "world.json.bin"), "w") as f:
    json.dump(world, f, separators=(",", ":"))
np.array(buildings, np.float32).tofile(os.path.join(OUT, "buildings.bin"))
print("listo: %d carreteras, %d edificios" % (len(roads), len(buildings)))
