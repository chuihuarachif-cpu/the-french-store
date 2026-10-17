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
N = 2048
CELL = 8.0
HALF = N * CELL / 2.0  # 8192
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
n_hills = fbm(6, 6, 1)
n_ridge = 1.0 - np.abs(fbm(6, 5, 2) * 2 - 1)
n_det = fbm(5, 24, 3)
n_patch = fbm(4, 12, 4)

def coast_x(z):
    z = np.asarray(z, dtype=float)
    cx = 5100 + 300 * np.sin(z / 1500.0) + 150 * np.sin(z / 550.0 + 1.0)
    cx = cx - 750 * np.exp(-((z + 900) / 900.0) ** 2)  # bahía de la desembocadura
    return cx

CX = coast_x(Z)
# Montañas al norte (Alpes du Nord) y al noreste
mount = smoothstep(-2800, -5600, Z) * (0.65 + 0.35 * smoothstep(-6000, 2000, X))
mount = np.maximum(mount, smoothstep(-3800, -6600, Z))
h = 16 + 30 * n_hills + 6 * n_det
h += mount * (110 + 560 * n_ridge ** 1.7 + 90 * n_det)
# Crestas que la autopista atraviesa con túneles
h += 210 * np.exp(-((Z + 3950) / 380.0) ** 2) * np.exp(-((X + 900) / 1000.0) ** 2)
h += 150 * np.exp(-((X + 6150) / 330.0) ** 2) * np.exp(-((Z + 1300) / 800.0) ** 2)
h += 120 * np.exp(-((X - 3300) / 600.0) ** 2) * np.exp(-((Z + 3000) / 300.0) ** 2)
# Colinas del bosque (noroeste)
forest_hill = smoothstep(-1000, -2600, Z) * smoothstep(-2200, -3600, X)
h += forest_hill * 90 * n_hills
# Costa: baja hasta el mar
land = smoothstep(CX + 120, CX - 700, X)
h = h * land + (1 - land) * (-28 + 10 * n_det)
# Playas: rampa suave
beach = smoothstep(CX - 450, CX - 60, X) * (1 - smoothstep(CX - 60, CX + 200, X))
# Capital: llanura
D0 = np.hypot(X, Z + 100)
city_t = 1 - smoothstep(1800, 2600, D0)
h = h * (1 - city_t) + 14 * city_t
# Zona roja: un poco más baja
# Aeropuerto principal
AIR = {"x": -4600.0, "z": 5350.0, "len": 3200.0, "w": 60.0, "yaw": 0.0, "h": 22.0, "name": "Aeropuerto Saint-Exupéry"}
air_m = smoothstep(2300, 1700, np.abs(X - AIR["x"])) * smoothstep(900, 500, np.abs(Z - AIR["z"]))
h = h * (1 - air_m) + AIR["h"] * air_m
# Aeródromo de Provence
AIR2 = {"x": -6300.0, "z": -200.0, "len": 1700.0, "w": 40.0, "yaw": 0.0, "h": 0.0, "name": "Aeródromo de Provence"}
a2 = smoothstep(1300, 950, np.abs(X - AIR2["x"])) * smoothstep(420, 220, np.abs(Z - AIR2["z"]))

def sample(arr, x, z):
    xa = np.atleast_1d(np.asarray(x, float))
    za = np.atleast_1d(np.asarray(z, float))
    px, pz = to_px(xa, za)
    out = ndimage.map_coordinates(arr, [pz, px], order=1, mode="nearest")
    return out if np.ndim(x) > 0 else out[0]

AIR2["h"] = float(sample(h, AIR2["x"], AIR2["z"]))
h = h * (1 - a2) + AIR2["h"] * a2

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
RIVER_CP = [(-7600, -7000), (-6500, -5700), (-5400, -4000), (-4300, -2600), (-3100, -1400), (-1800, -350), (-500, 200),
            (900, 120), (2200, 330), (3400, -150), (4500, -650), (5600, -900), (7200, -1000), (8300, -1000)]
river = catmull(RIVER_CP, False, 8.0)
rn = len(river)
rs = np.arange(rn) * 8.0
r_w = np.interp(rs / rs[-1], [0, 0.35, 0.55, 0.8, 1], [40, 70, 120, 200, 420])
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
ring_c = np.array([-700.0, 700.0])
ring_cp = []
for i in range(48):
    t = i / 48 * math.tau
    r = 5450 + 420 * math.sin(3 * t + 0.7) + 230 * math.sin(5 * t + 2.0)
    x = ring_c[0] + math.cos(t) * r
    z = ring_c[1] + math.sin(t) * r * (0.98 if math.sin(t) > 0 else 0.86)
    x = min(x, float(coast_x(z)) - 420)
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

# Boulevard Circulaire (circuito urbano)
bc = []
for i in range(36):
    t = i / 36 * math.tau
    r = 1250 + 110 * math.sin(4 * t) + 70 * math.sin(7 * t + 1)
    bc.append((math.cos(t) * r, -150 + math.sin(t) * r * 0.92))
add_road("Boulevard Circulaire", bc, "avenue", True)
# Avenidas de la capital
for x in [-1500, -760, 0, 760, 1500]:
    lim = math.sqrt(max(0, 1900 ** 2 - x ** 2))
    add_road("Avenue %s" % ["Voltaire", "Molière", "des Champs", "Hugo", "Rousseau"][[-1500, -760, 0, 760, 1500].index(x)],
             [(x, -lim), (x + 10, 0), (x, lim)], "avenue")
for z in [-1350, -650, 850, 1450]:
    lim = math.sqrt(max(0, 1900 ** 2 - (z + 100) ** 2))
    add_road("Rue %s" % ["Lafayette", "Montmartre", "Bastille", "Opéra"][[-1350, -650, 850, 1450].index(z)],
             [(-lim, z), (0, z + 8), (lim, z)], "avenue")
# Calles secundarias (malla fina) dentro de la capital
for x in [-1130, -380, 380, 1130]:
    lim = math.sqrt(max(0, 1750 ** 2 - x ** 2))
    add_road("Rue %d" % (x // 10), [(x, -lim), (x - 6, 0), (x, lim)], "road")
for z in [-1700, -1000, -300, 500, 1150]:
    lim = math.sqrt(max(0, 1750 ** 2 - (z + 100) ** 2))
    add_road("Rue N%d" % (z // 10), [(-lim, z), (0, z - 5), (lim, z)], "road")
# Radiales
for ang, nm, kind in [(205, "N12 · Ruta del Oeste", "road"), (240, "N7 · Ruta del Bosque", "road"), (300, "N4 · Ruta Norte", "road"),
                      (150, "N10 · Ruta del Aeropuerto", "road"), (95, "N2 · Ruta del Sur", "road"), (35, "N5 · Ruta de la Costa", "road")]:
    a = math.radians(ang)
    s0 = np.array([math.cos(a) * 1880, -100 + math.sin(a) * 1880])
    e = ring_point(ang)
    mid = (s0 + e) * 0.5 + np.array([-math.sin(a), math.cos(a)]) * 260
    add_road(nm, [tuple(s0), tuple(mid), tuple(e)], kind)
# Ruta del Puerto (puente levadizo)
add_road("Avenue du Port", [(1500, -1350), (2400, -1150), (3150, -900), (3500, -350), (3600, 250), (3900, 700), (4400, 900)], "avenue",
         extra={"drawbridge": True})
# Corniche d'Azur (costera)
cor = [(4400, 900)]
for z in np.linspace(1500, 6200, 10):
    cor.append((float(coast_x(z)) - 330, z))
cor += [(3000, 6900), (1700, 7150)]
add_road("Corniche d'Azur", cor, "avenue")
# Route des Alpes (puerto de montaña con curvas de herradura)
add_road("Route des Alpes", [(-1400, -2050), (-1500, -3300), (-1150, -4300), (-1900, -4700), (-1100, -5200), (-1800, -5650), (-900, -6050),
                             (-250, -6700), (800, -6550), (1500, -6050), (1050, -5500), (2000, -5150), (2650, -4450), (3300, -3800)], "road", extra={"grade": 0.13, "smooth": 70.0})
# Chemin Forestier (tierra) y aserradero
add_road("Chemin Forestier", [(-2700, -2350), (-3500, -3050), (-4700, -2700), (-5600, -3300), (-6250, -2450), (-5600, -1650), (-4500, -1700)], "dirt")
# Rutas de camiones (A→B)
T1 = add_road("Ruta Maderera", [(-4500, -1700), (-4200, -1050), (-3700, -700), (-3100, -900), (-2600, -1700), (-2050, -2100), (-1500, -2150)], "road")
for i in range(0, 60):
    T1["types"][i] = "dirt"
add_road("Ruta de Saint-Clair", [(-6000, 1900), (-5000, 1300), (-3800, 650), (-3000, 200), (-2400, 400), (-1880, 250)], "road")
add_road("Ruta del Aeropuerto Carga", [(-3800, 4700), (-2700, 4000), (-1500, 3500), (-300, 3000), (300, 2700)], "road")
# Bastille Sur (zona roja): circuito y calles
add_road("Circuito Bastille", [(250, 2150), (1000, 2050), (1650, 2250), (1700, 2900), (1500, 3350), (800, 3400), (300, 3150), (150, 2600)], "avenue", True)
add_road("Rue des Ombres", [(150, 2700), (900, 2620), (1700, 2650)], "avenue")
add_road("Rue du Feu", [(950, 2050), (900, 2700), (850, 3400)], "avenue")
# Route des Vins (circuito de viñedos)
rv = []
for i in range(24):
    t = i / 24 * math.tau
    r = 1150 + 160 * math.sin(3 * t)
    rv.append((-700 + math.cos(t) * r, 6000 + math.sin(t) * r * 0.75))
add_road("Route des Vins", rv, "road", True)
# Perímetro del aeropuerto
add_road("Perímetro Saint-Exupéry", [(AIR["x"] - 1900, AIR["z"] - 650), (AIR["x"] + 1900, AIR["z"] - 650), (AIR["x"] + 2050, AIR["z"]), (AIR["x"] + 1900, AIR["z"] + 650),
                                     (AIR["x"] - 1900, AIR["z"] + 650), (AIR["x"] - 2050, AIR["z"])], "road", True)
# Pueblos
VILLAGES = [("Saint-Clair", -3000, 200), ("Beaumont", -5700, 1900), ("Vignac", -1300, 5700), ("Montclar", 2100, 5200),
            ("Valfroid", -2600, -3300), ("Sainte-Marie", 4000, 3300), ("Rochefort", -6400, 4200)]
for vn, vx, vz in VILLAGES:
    add_road("Grande Rue de " + vn, [(vx - 520, vz - 40), (vx, vz), (vx + 520, vz + 50)], "road")
    add_road("Rue de l'Église (" + vn + ")", [(vx + 30, vz - 480), (vx, vz), (vx - 20, vz + 480)], "road")
# Ferrocarril
RAIL = add_road("Ferrocarril Nacional", [(-1200, 1200), (-2600, 1500), (-4300, 2200), (-5900, 3300), (-5200, 4500)][:0] or
                [(-1300, 1300), (-2700, 1650), (-4300, 2500), (-5800, 3500), (-4300, 4200), (-2600, 4500), (-1000, 4300), (600, 4000), (2200, 4300), (3600, 4100)], "rail")

# ------------------------------------------------------------------ PERFILES Y EXPLANACIÓN
order = sorted(range(len(roads)), key=lambda i: -PRIO[roads[i]["kind"]])
placed = []  # (idx) ya colocados, para enganchar cruces
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
    # sobre el agua no bajar del gálibo
    prof = np.where(over_w, np.maximum(prof, w_lvl + 9.0), prof)
    # Enganche de cruces con vías ya colocadas
    pins = []
    for pj in placed:
        o = roads[pj]
        oxz = o["xz"]
        d2 = (xz[:, None, 0] - oxz[None, ::2, 0]) ** 2 + (xz[:, None, 1] - oxz[None, ::2, 1]) ** 2 if n * len(oxz) < 4e7 else None
        if d2 is None:
            continue
        mi = np.unravel_index(np.argmin(d2), d2.shape)
        if d2[mi] < (TYPES[o["kind"]][0] + 2) ** 2:
            oy = o["y"][mi[1] * 2]
            if abs(oy - prof[mi[0]]) < 12 and r["kind"] != "rail" and o["kind"] != "rail":
                pins.append((mi[0], oy, pj))
    for (i0, oy, pj) in pins:
        k = np.arange(n)
        dd = np.abs(k - i0)
        if r["closed"]:
            dd = np.minimum(dd, n - dd)
        wgt = smoothstep(16, 3, dd)
        prof = prof * (1 - wgt) + oy * wgt
    # límite de pendiente (ida y vuelta)
    lim = grade * 8.0
    for _ in range(3):
        for i in range(1, n):
            prof[i] = np.clip(prof[i], prof[i - 1] - lim, prof[i - 1] + lim)
        for i in range(n - 2, -1, -1):
            prof[i] = np.clip(prof[i], prof[i + 1] - lim, prof[i + 1] + lim)
    r["y"] = prof
    flags = np.zeros(n, np.int32)
    g2 = sample(h, xz[:, 0], xz[:, 1])
    tunnel = (g2 - prof) > 16.0
    bridge = ((prof - g2) > 7.0) | over_w
    # limpiar tramos cortos
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
    rd2, rid2 = nearest_field(xz)
    yy = prof[rid2]
    ff = flags[rid2]
    w = smoothstep(flat + 34, flat, rd2) * ((ff & 3) == 0)
    if r["kind"] == "rail":
        w *= 1.0
    newh = yy - 0.35
    # en desmonte/terraplén: mezcla suave
    h = h * (1 - w) + newh * w
    r["dist"] = rd2.astype(np.float32)
    placed.append(ri)
    print("  %-34s %6.0f m  túnel %4d  puente %4d" % (r["name"], n * 8, int((flags & 1).sum() * 8), int((flags & 2).sum() * 8)))

# Distancia combinada a cualquier carretera (para colocar edificios y árboles)
road_dist = np.full((N, N), 999.0, np.float32)
road_half = np.zeros((N, N), np.float32)
for r in roads:
    d = r["dist"] - TYPES[r["kind"]][0]
    better = d < road_dist
    road_dist = np.where(better, d, road_dist)
for r in roads:
    del r["dist"]

# Ocultar el tramo de las vías de menor prioridad que queda dentro de otra calzada (cruces limpios)
for r in roads:
    if r["kind"] == "rail":
        continue
    xz = r["xz"]
    hide = np.zeros(len(xz), bool)
    for o in roads:
        if o is r or PRIO[o["kind"]] < PRIO[r["kind"]] or o["kind"] == "rail":
            continue
        if PRIO[o["kind"]] == PRIO[r["kind"]] and roads.index(o) > roads.index(r):
            continue
        oxz = o["xz"]
        if len(xz) * len(oxz) > 5e7:
            continue
        d2 = (xz[:, None, 0] - oxz[None, :, 0]) ** 2 + (xz[:, None, 1] - oxz[None, :, 1]) ** 2
        md = np.sqrt(d2.min(1))
        oy = o["y"][d2.argmin(1)]
        hide |= (md < TYPES[o["kind"]][0] - 1.0) & (np.abs(oy - r["y"]) < 3.0)
    r["flags"][hide] |= 8

# Cruces (para semáforos): pares de vías que se tocan a nivel
for r in roads:
    r["junctions"] = []
for a in range(len(roads)):
    for b in range(a + 1, len(roads)):
        ra, rb = roads[a], roads[b]
        if "rail" in (ra["kind"], rb["kind"]) and not ("rail" in (ra["kind"], rb["kind"]) and ra["kind"] != rb["kind"]):
            continue
        A = ra["xz"][::2]
        B = rb["xz"][::2]
        if len(A) * len(B) > 3e7:
            continue
        d2 = (A[:, None, 0] - B[None, :, 0]) ** 2 + (A[:, None, 1] - B[None, :, 1]) ** 2
        lim = (min(TYPES[ra["kind"]][0], TYPES[rb["kind"]][0]) + 6) ** 2
        hits = np.argwhere(d2 < lim)
        last = -999
        for (i, j) in hits:
            if i - last < 20:
                continue
            ya, yb = ra["y"][i * 2], rb["y"][j * 2]
            if abs(ya - yb) > 4:
                continue
            last = i
            kind = "rail" if "rail" in (ra["kind"], rb["kind"]) else "cross"
            ra["junctions"].append([float(i * 16.0), b, kind])
            rb["junctions"].append([float(j * 16.0), a, kind])

# ------------------------------------------------------------------ AGUA FINAL
sea = (X > CX - 80) & (h < 0.3)
river_mask = river_mask & (h < r_lvl + 0.5)

# ------------------------------------------------------------------ BIOMAS Y DEPARTAMENTOS
print("biomas...")
DEPTS = [
    ("Lumière", "Capital", 0, -100),
    ("Bastille Sur", "Zona roja", 950, 2750),
    ("Côte d'Azur", "Playas", 4100, 3900),
    ("Provence Verte", "Campos y pueblos", -5200, 1700),
    ("Alpes du Nord", "Montañas", -900, -6300),
    ("Forêt Noire", "Bosque", -4800, -2900),
    ("Seine-Marine", "Puerto y río", 3900, -1900),
    ("Saint-Exupéry", "Aeropuerto", -4300, 5600),
    ("Vallée d'Or", "Viñedos", -500, 6200),
    ("Mont-Blanc Est", "Alta montaña", 3200, -6000),
]
dpos = np.array([[d[2], d[3]] for d in DEPTS])
best = np.full((N, N), 1e18)
dept = np.zeros((N, N), np.uint8)
warp_x = (fbm(3, 8, 11) - 0.5) * 900
warp_z = (fbm(3, 8, 12) - 0.5) * 900
for i, (dx, dz) in enumerate(dpos):
    w = 1.0 if i != 0 else 0.55  # la capital es más pequeña
    d = ((X + warp_x - dx) ** 2 + (Z + warp_z - dz) ** 2) * (1 / w)
    m = d < best
    best = np.where(m, d, best)
    dept[m] = i

# ids: 0 pradera,1 campo,2 bosque,3 ciudad,4 zona roja,5 playa,6 roca,7 nieve,8 mar,9 río,10 viñedo,11 aeropuerto,12 puerto,13 pueblo,14 parque
B = np.zeros((N, N), np.uint8)
slope = np.hypot(*np.gradient(h, CELL))
fields = (dept == 3) | ((dept == 8) & False)
B[(dept == 3) | (dept == 7)] = 1
forest_m = ((dept == 5) & (n_patch > 0.3)) | ((dept == 4) & (h < 420) & (n_patch > 0.35)) | ((dept == 9) & (h < 450) & (n_patch > 0.45)) | (n_patch > 0.78)
B[forest_m] = 2
B[(dept == 8)] = 10
B[(dept == 8) & (n_patch > 0.7)] = 0
B[(slope > 0.55) | ((h > 330) & (n_det > 0.45))] = 6
B[h > 600 + 80 * n_det] = 7
city = D0 < 1850
B[city] = 3
park = np.hypot(X + 600, Z + 750) < 260
B[park] = 14
red = np.hypot(X - 950, Z - 2750) < 900
B[red] = 4
port = (X > 3650) & (X < 4950) & (Z > -250) & (Z < 750)
B[port] = 12
air = (np.abs(X - AIR["x"]) < 1900) & (np.abs(Z - AIR["z"]) < 640)
B[air] = 11
air2 = (np.abs(X - AIR2["x"]) < 950) & (np.abs(Z - AIR2["z"]) < 200)
B[air2] = 11
for vn, vx, vz in VILLAGES:
    B[np.hypot(X - vx, Z - vz) < 420] = 13
B[(beach > 0.25) & (h < 6) & (h > -1)] = 5
B[river_mask] = 9
B[sea] = 8

# ------------------------------------------------------------------ EDIFICIOS
print("edificios...")
occ = np.zeros((N, N), bool)
occ |= road_dist < 3
occ |= river_mask | sea
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

def scatter(mask_fn, spacing, gen, tries=1):
    xs = np.arange(-HALF + spacing / 2, HALF, spacing)
    for z in xs:
        for x in xs:
            for _ in range(tries):
                jx = x + rng.uniform(-0.35, 0.35) * spacing
                jz = z + rng.uniform(-0.35, 0.35) * spacing
                px, pz = to_px(jx, jz)
                ix, iz = int(px), int(pz)
                if ix < 0 or iz < 0 or ix >= N or iz >= N:
                    continue
                if not mask_fn(ix, iz, jx, jz):
                    continue
                gen(jx, jz)

def city_gen(x, z):
    dc = math.hypot(x, z + 100)
    core = max(0.0, 1.0 - dc / 1700.0)
    if rng.random() < core ** 1.5 * 0.85:
        hgt = rng.uniform(70, 120) + core * rng.uniform(40, 180)
        w = rng.uniform(26, 38); d = rng.uniform(24, 34); sty = STY["tower"]
    else:
        hgt = rng.uniform(14, 40) + core * 30
        w = rng.uniform(22, 40); d = rng.uniform(16, 26); sty = STY["mid"] if rng.random() > 0.15 else STY["shop"]
    try_place(x, z, w, d, hgt, sty, 4.0)

scatter(lambda ix, iz, x, z: B[iz, ix] == 3 and road_dist[iz, ix] < 120, 26.0, city_gen, 3)
scatter(lambda ix, iz, x, z: B[iz, ix] == 4 and road_dist[iz, ix] < 60, 30.0,
        lambda x, z: try_place(x, z, rng.uniform(16, 30), rng.uniform(12, 20), rng.uniform(8, 26), STY["ruin"], 3.5), 2)
scatter(lambda ix, iz, x, z: B[iz, ix] == 13 and road_dist[iz, ix] < 45, 20.0,
        lambda x, z: try_place(x, z, rng.uniform(8, 13), rng.uniform(8, 11), rng.uniform(5, 9), STY["house"], 3.0), 1)
scatter(lambda ix, iz, x, z: B[iz, ix] == 12 and road_dist[iz, ix] < 90, 60.0,
        lambda x, z: try_place(x, z, rng.uniform(40, 70), rng.uniform(25, 40), rng.uniform(10, 16), STY["warehouse"], 6.0), 1)
scatter(lambda ix, iz, x, z: (B[iz, ix] in (0, 5)) and dept[iz, ix] == 2 and road_dist[iz, ix] < 60 and h[iz, ix] > 2, 55.0,
        lambda x, z: try_place(x, z, rng.uniform(26, 44), rng.uniform(16, 22), rng.uniform(18, 60), STY["hotel"], 6.0), 1)
scatter(lambda ix, iz, x, z: B[iz, ix] in (0, 1, 10) and road_dist[iz, ix] < 50 and rng.random() < 0.05, 80.0,
        lambda x, z: try_place(x, z, rng.uniform(10, 18), rng.uniform(16, 26), rng.uniform(6, 9), STY["barn"], 6.0), 1)
scatter(lambda ix, iz, x, z: B[iz, ix] in (0, 1, 2) and road_dist[iz, ix] < 40 and rng.random() < 0.035, 70.0,
        lambda x, z: try_place(x, z, rng.uniform(8, 12), rng.uniform(8, 10), rng.uniform(5, 8), STY["house"], 4.0), 1)
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
print("  %d edificios" % len(buildings))

# ------------------------------------------------------------------ PUNTOS DE INTERÉS
CARRIER = {"x": 6500.0, "z": -1700.0, "yaw": 0.0, "len": 330.0, "name": "Portaaviones FS Lumière"}
pois = {
    "airport": AIR, "airfield": AIR2, "carrier": CARRIER,
    "villages": [{"name": v[0], "x": v[1], "z": v[2]} for v in VILLAGES],
    "sawmill": {"x": -4500, "z": -1700, "name": "Aserradero de Forêt Noire"},
    "port": {"x": 4300, "z": 250, "name": "Puerto de Lumière"},
    "redzone": {"x": 950, "z": 2750, "r": 900},
    "park": {"x": -600, "z": -750, "r": 260},
    "capital": {"x": 0, "z": -100, "r": 1850, "name": "Port-Lumière"},
}
# barriles con fuego / indigentes en zona roja
spots = []
for _ in range(220):
    a = rng.uniform(0, math.tau)
    rr = math.sqrt(rng.uniform(0, 1)) * 850
    x, z = 950 + math.cos(a) * rr, 2750 + math.sin(a) * rr
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
biome_img = np.stack([B, rdq, dept, np.full((N, N), 255, np.uint8)], -1)
Image.fromarray(biome_img, "RGBA").save(os.path.join(OUT, "biome.png.bin"), format="PNG", optimize=True)

# splat (1024)
def down(a):
    return a.reshape(1024, 2, 1024, 2).mean((1, 3))
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
tint = tint.reshape(512, 4, 512, 4, 3).mean((1, 3))
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
mp = Image.fromarray(img).resize((1024, 1024), Image.LANCZOS)
dr = ImageDraw.Draw(mp)
def mpx(x, z):
    return ((x + HALF) / (2 * HALF) * 1024, (z + HALF) / (2 * HALF) * 1024)
colk = {"highway": (255, 196, 40), "avenue": (245, 245, 245), "road": (230, 230, 220), "dirt": (150, 110, 70), "rail": (60, 60, 60)}
wk = {"highway": 4, "avenue": 2, "road": 2, "dirt": 1, "rail": 1}
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
