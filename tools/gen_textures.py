"""Genera texturas PBR procedurales (tileables) para Apex Multiverse.
Uso: python3 tools/gen_textures.py <carpeta_salida>
Todo es procedural (numpy), sin dependencias de terceros salvo Pillow.
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1234)

def spectral(n, beta, seed=None, lo=1.0):
    """Ruido tileable 1/f^beta normalizado a 0..1."""
    r = np.random.default_rng(seed)
    w = r.standard_normal((n, n))
    F = np.fft.fft2(w)
    fx = np.fft.fftfreq(n)[:, None]; fy = np.fft.fftfreq(n)[None, :]
    f = np.sqrt(fx * fx + fy * fy) * n
    f[0, 0] = 1
    amp = 1.0 / np.power(np.maximum(f, lo), beta)
    amp[0, 0] = 0
    out = np.real(np.fft.ifft2(F * amp))
    out -= out.min(); out /= max(out.max(), 1e-9)
    return out

def band(n, fmin, fmax, seed=None, aniso=(1.0, 1.0)):
    r = np.random.default_rng(seed)
    w = r.standard_normal((n, n))
    F = np.fft.fft2(w)
    fx = np.fft.fftfreq(n)[:, None] * n * aniso[0]; fy = np.fft.fftfreq(n)[None, :] * n * aniso[1]
    f = np.sqrt(fx * fx + fy * fy)
    mask = ((f >= fmin) & (f <= fmax)).astype(float)
    out = np.real(np.fft.ifft2(F * mask))
    out -= out.min(); out /= max(out.max(), 1e-9)
    return out

def normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    nz = np.ones_like(h)
    l = np.sqrt(dx * dx + dy * dy + nz * nz)
    n = np.stack([-dx / l, dy / l, nz / l], -1)  # OpenGL (Y+) convention
    return ((n * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)

def save_rgb(name, arr):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGB').save(os.path.join(OUT, name), optimize=True)

def save_rgba(name, arr):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGBA').save(os.path.join(OUT, name), optimize=True)

def save_gray(name, arr):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'L').save(os.path.join(OUT, name), optimize=True)

def save_n(name, n):
    Image.fromarray(n, 'RGB').save(os.path.join(OUT, name), optimize=True)

def lerp(a, b, t):
    return a + (b - a) * t

def col(*c):
    return np.array(c, dtype=float).reshape(1, 1, 3) / 255.0

def speckles(n, count, rmin, rmax, seed):
    r = np.random.default_rng(seed)
    h = np.zeros((n, n))
    yy, xx = np.mgrid[0:n, 0:n]
    for _ in range(count):
        cx, cy = r.integers(0, n, 2)
        rad = r.uniform(rmin, rmax)
        s = int(rad * 2 + 2)
        y0, x0 = cy - s, cx - s
        ys = (np.arange(y0, cy + s) % n); xs = (np.arange(x0, cx + s) % n)
        gy, gx = np.meshgrid(np.arange(y0, cy + s) - cy, np.arange(x0, cx + s) - cx, indexing='ij')
        d = np.sqrt(gx * gx + gy * gy) / rad
        v = np.clip(1 - d * d, 0, 1) * r.uniform(0.4, 1.0)
        h[np.ix_(ys, xs)] = np.maximum(h[np.ix_(ys, xs)], v)
    return h

N = 1024

# ---------------- ASFALTO ----------------
def asphalt():
    base = spectral(N, 1.6, 1)
    fine = band(N, 180, 512, 2)
    stones = speckles(N, 26000, 0.8, 2.6, 3)
    patches = spectral(N, 2.4, 4)
    h = 0.55 * stones + 0.25 * fine + 0.2 * base
    patch = np.clip((patches - 0.62) * 5, 0, 1)
    g = 0.13 + 0.05 * base + 0.06 * stones * (0.6 + 0.4 * fine) - 0.025 * patch
    tint = np.stack([g * 1.0, g * 1.0, g * 1.035], -1)
    # grietas finas y escasas
    cr = band(N, 6, 14, 5)
    crack = np.exp(-((cr - 0.5) ** 2) / 0.00003) * np.clip((spectral(N, 2.0, 6) - 0.72) * 6, 0, 1)
    tint *= (1 - 0.35 * crack[..., None])
    save_rgb('asphalt_albedo.png', tint)
    save_n('asphalt_normal.png', normal_from_height(h - crack * 0.6, 3.2))
    rough = 0.78 + 0.18 * fine - 0.25 * stones * 0.4 + 0.08 * patch
    save_gray('asphalt_rough.png', rough)

# ---------------- CÉSPED ----------------
def grass():
    b = spectral(N, 1.8, 11)
    blades = band(N, 200, 512, 12, aniso=(0.35, 1.6))
    clumps = spectral(N, 1.2, 13)
    dry = spectral(N, 2.2, 14)
    c = lerp(col(42, 74, 22), col(92, 128, 38), b[..., None])
    c = lerp(c, col(140, 132, 60), (np.clip(dry - 0.55, 0, 1) * 2.2)[..., None])
    c *= (0.65 + 0.55 * blades[..., None]) * (0.85 + 0.3 * clumps[..., None])
    save_rgb('grass_albedo.png', c)
    save_n('grass_normal.png', normal_from_height(blades * 0.7 + b * 0.3, 2.5))

# ---------------- TIERRA / BARRO ----------------
def dirt():
    b = spectral(N, 1.7, 21)
    pebbles = speckles(N, 9000, 1.2, 5.0, 22)
    fine = band(N, 150, 512, 23)
    c = lerp(col(92, 66, 42), col(142, 108, 72), b[..., None])
    c = lerp(c, col(160, 150, 135), (pebbles * 0.8)[..., None])
    c *= (0.85 + 0.25 * fine[..., None])
    save_rgb('dirt_albedo.png', c)
    save_n('dirt_normal.png', normal_from_height(pebbles * 0.8 + b * 0.4 + fine * 0.2, 3.0))
    # barro húmedo
    wet = spectral(N, 2.0, 24)
    m = lerp(col(58, 40, 24), col(86, 62, 38), b[..., None]) * (0.85 + 0.2 * fine[..., None])
    m = lerp(m, col(40, 30, 20), (wet > 0.55)[..., None] * 0.6)
    save_rgb('mud_albedo.png', m)
    save_n('mud_normal.png', normal_from_height(b * 0.6 + fine * 0.25 + pebbles * 0.3, 2.2))
    save_gray('mud_rough.png', 0.85 - 0.6 * (wet > 0.55) * (0.5 + 0.5 * wet))

# ---------------- ROCA ----------------
def rock():
    b = spectral(N, 1.4, 31)
    strata = band(N, 3, 40, 32, aniso=(0.15, 3.0))
    cracks = band(N, 10, 30, 33)
    cr = np.exp(-((cracks - 0.5) ** 2) / 0.0006)
    h = 0.5 * b + 0.35 * strata - 0.3 * cr
    c = lerp(col(88, 80, 72), col(150, 140, 126), h[..., None])
    c = lerp(c, col(110, 92, 70), (spectral(N, 2.0, 34) > 0.6)[..., None] * 0.4)
    moss = np.clip((spectral(N, 1.8, 35) - 0.62) * 4, 0, 1)
    c = lerp(c, col(60, 80, 34), moss[..., None] * 0.7)
    save_rgb('rock_albedo.png', c)
    save_n('rock_normal.png', normal_from_height(h, 5.0))

# ---------------- ARENA ----------------
def sand():
    b = spectral(N, 1.9, 41)
    ripples = band(N, 18, 30, 42, aniso=(0.2, 1.0))
    fine = band(N, 250, 512, 43)
    c = lerp(col(196, 170, 124), col(228, 206, 160), b[..., None]) * (0.92 + 0.12 * fine[..., None])
    save_rgb('sand_albedo.png', c)
    save_n('sand_normal.png', normal_from_height(ripples * 0.6 + fine * 0.3, 2.0))

# ---------------- MADERA TABLONES ----------------
def planks():
    n = N
    yy, xx = np.mgrid[0:n, 0:n] / n
    planks_n = 6
    idx = np.floor(yy * planks_n)
    v = (yy * planks_n) % 1
    r = np.random.default_rng(51)
    offs = r.uniform(0, 1, planks_n)
    tones = r.uniform(0.75, 1.15, planks_n)
    grain_noise = band(n, 2, 60, 52, aniso=(4.0, 0.12))
    grain = np.sin((v * 7 + grain_noise * 9 + offs[idx.astype(int)] * 10) * math.pi * 2) * 0.5 + 0.5
    gap = (v < 0.035) | (v > 0.965)
    seam_x = ((xx + offs[idx.astype(int)]) % 0.5) < 0.006
    c = lerp(col(92, 62, 36), col(150, 108, 66), grain[..., None]) * tones[idx.astype(int)][..., None]
    weather = spectral(n, 1.8, 53)
    c = lerp(c, col(110, 104, 96), (weather > 0.6)[..., None] * 0.35)
    c = np.where((gap | seam_x)[..., None], c * 0.25, c)
    # clavos
    nails = np.zeros((n, n))
    for i in range(planks_n):
        for xn in (0.03, 0.47, 0.53, 0.97):
            cy = int((i + 0.5) / planks_n * n); cx = int(((xn - offs[i]) % 1) * n)
            for dy in (-int(n / planks_n * 0.25), int(n / planks_n * 0.25)):
                yy0 = (cy + dy) % n
                nails[max(0, yy0 - 3):yy0 + 3, max(0, cx - 3):cx + 3] = 1
    c = np.where(nails[..., None] > 0, col(70, 70, 76), c)
    h = grain * 0.3 - gap * 1.0 - seam_x * 0.8 + nails * 0.4
    save_rgb('planks_albedo.png', c)
    save_n('planks_normal.png', normal_from_height(h, 2.5))

# ---------------- CORTEZA ----------------
def bark():
    n = 512
    g = band(n, 2, 40, 61, aniso=(6.0, 0.25))
    f = band(n, 40, 200, 62)
    h = np.power(g, 1.5) * 0.8 + f * 0.2
    c = lerp(col(48, 36, 26), col(112, 90, 68), h[..., None])
    save_rgb('bark_albedo.png', c)
    save_n('bark_normal.png', normal_from_height(h, 6.0))

# ---------------- HOJAS (atlas con alfa) ----------------
def foliage():
    n = 512
    img = Image.new('RGBA', (n * 2, n), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    r = np.random.default_rng(71)
    # Celda 0: rama de pino (agujas)
    for i in range(1400):
        t = r.uniform(0, 1)
        x0 = n * 0.5 + r.normal(0, 4)
        y0 = n * (0.05 + 0.9 * t)
        side = r.choice([-1, 1])
        ln = (1 - abs(t - 0.45)) * n * 0.42 * r.uniform(0.6, 1)
        ang = math.radians(r.uniform(15, 40)) * side
        x1 = x0 + math.sin(ang) * ln; y1 = y0 + math.cos(abs(ang)) * ln * 0.35
        g = int(r.uniform(60, 110)); cc = (int(g * 0.35), g, int(g * 0.4), 255)
        d.line([(x0, y0), (x1, y1)], fill=cc, width=2)
    d.line([(n * 0.5, n * 0.03), (n * 0.5, n * 0.97)], fill=(70, 50, 30, 255), width=6)
    # Celda 1: copa de hojas anchas
    for i in range(900):
        cx = r.normal(n * 1.5, n * 0.2); cy = r.normal(n * 0.5, n * 0.2)
        if (cx - n * 1.5) ** 2 + (cy - n * 0.5) ** 2 > (n * 0.46) ** 2:
            continue
        s = r.uniform(10, 22)
        a = r.uniform(0, math.pi)
        g = int(r.uniform(70, 150))
        cc = (int(g * 0.45 + r.uniform(0, 30)), g, int(g * 0.3), 255)
        pts = [(cx + math.cos(a) * s, cy + math.sin(a) * s), (cx + math.cos(a + 1.9) * s * 0.45, cy + math.sin(a + 1.9) * s * 0.45),
               (cx - math.cos(a) * s, cy - math.sin(a) * s), (cx + math.cos(a - 1.2) * s * 0.45, cy + math.sin(a - 1.2) * s * 0.45)]
        d.polygon(pts, fill=cc)
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(OUT, 'foliage_atlas.png'))
    # Hoja de palmera
    pal = Image.new('RGBA', (512, 256), (0, 0, 0, 0))
    dp = ImageDraw.Draw(pal)
    for i in range(110):
        t = i / 110
        x = 10 + t * 490
        droop = math.sin(t * math.pi) * 6
        ln = math.sin(min(1, t * 1.6) * math.pi * 0.5) * 115 * (1 - t * 0.5)
        g = int(r.uniform(80, 140))
        for s in (-1, 1):
            dp.line([(x, 128 + droop), (x + 30, 128 + droop + s * ln)], fill=(int(g * 0.5), g, int(g * 0.25), 255), width=4)
    dp.line([(5, 128), (505, 134)], fill=(120, 100, 50, 255), width=6)
    pal.save(os.path.join(OUT, 'palm_leaf.png'))
    # Hierba (tufo)
    gr = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    dg = ImageDraw.Draw(gr)
    for i in range(160):
        x0 = r.uniform(20, 236); h = r.uniform(80, 240); bend = r.normal(0, 25)
        g = int(r.uniform(70, 150))
        dg.line([(x0, 256), (x0 + bend * 0.5, 256 - h * 0.5), (x0 + bend, 256 - h)], fill=(int(g * 0.55), g, int(g * 0.3), 255), width=3)
    gr.save(os.path.join(OUT, 'grass_tuft.png'))

# ---------------- CONCRETO ----------------
def concrete():
    b = spectral(N, 1.6, 81)
    f = band(N, 120, 512, 82)
    pores = speckles(N, 6000, 0.6, 1.6, 83)
    c = lerp(col(150, 148, 142), col(196, 194, 188), b[..., None]) * (0.92 + 0.1 * f[..., None]) - pores[..., None] * 0.15
    stains = np.clip((spectral(N, 2.2, 84) - 0.6) * 3, 0, 1)
    c = lerp(c, col(110, 104, 96), stains[..., None] * 0.5)
    save_rgb('concrete_albedo.png', c)
    save_n('concrete_normal.png', normal_from_height(b * 0.3 + f * 0.3 - pores * 0.5, 2.0))

# ---------------- FACHADAS (día/noche) ----------------
def facades():
    W, H = 512, 1024
    r = np.random.default_rng(91)
    for variant in range(3):
        cols, rows = [(8, 24), (6, 20), (10, 30)][variant]
        base = [col(150, 160, 175), col(186, 170, 150), col(90, 100, 115)][variant]
        img = np.ones((H, W, 3)) * base
        noise = spectral(1024, 1.5, 92 + variant)[:H, :W]
        img *= (0.85 + 0.25 * noise[..., None])
        emi = np.zeros((H, W, 3))
        cw, ch = W / cols, H / rows
        for i in range(cols):
            for j in range(rows):
                x0 = int(i * cw + cw * 0.14); x1 = int((i + 1) * cw - cw * 0.14)
                y0 = int(j * ch + ch * 0.2); y1 = int((j + 1) * ch - ch * 0.12)
                glass = col(40, 55, 70) * r.uniform(0.6, 1.3) if variant != 2 else col(30, 50, 80) * r.uniform(0.7, 1.4)
                img[y0:y1, x0:x1] = glass
                img[y0:y0 + 2, x0:x1] += 0.25
                if r.uniform() < 0.42:
                    warm = r.choice([0, 1, 2], p=[0.6, 0.25, 0.15])
                    lc = [col(255, 210, 140), col(200, 225, 255), col(255, 170, 90)][warm] * r.uniform(0.6, 1.0)
                    emi[y0:y1, x0:x1] = lc
                    # cortina parcial
                    cut = int(r.uniform(0, 0.5) * (y1 - y0))
                    emi[y0:y0 + cut, x0:x1] *= 0.35
        save_rgb('facade%d_albedo.png' % variant, img)
        save_rgb('facade%d_emission.png' % variant, emi)

# ---------------- ASTEROIDE ----------------
def asteroid():
    b = spectral(N, 1.5, 101)
    f = band(N, 100, 512, 102)
    craters = np.zeros((N, N))
    r = np.random.default_rng(103)
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(140):
        cx, cy = r.integers(0, N, 2); rad = r.uniform(6, 60) * (r.uniform() ** 1.5 + 0.2)
        dx = (xx - cx + N / 2) % N - N / 2; dy = (yy - cy + N / 2) % N - N / 2
        d = np.sqrt(dx * dx + dy * dy) / rad
        craters += np.where(d < 1, -(1 - d * d) * 0.8, 0) + np.where((d >= 1) & (d < 1.35), (1 - (d - 1) / 0.35) * 0.35, 0)
    h = b * 0.6 + craters * 0.45 + f * 0.15
    c = lerp(col(52, 46, 42), col(128, 116, 104), np.clip(h, 0, 1)[..., None])
    c = lerp(c, col(120, 70, 40), (spectral(N, 2.0, 104) > 0.62)[..., None] * 0.35)
    save_rgb('asteroid_albedo.png', c)
    save_n('asteroid_normal.png', normal_from_height(h, 6.0))
    lava = np.clip((band(N, 8, 30, 105) - 0.5) * 6, 0, 1) * np.clip(-craters * 2, 0, 1)
    save_rgb('asteroid_emission.png', np.stack([lava, lava * 0.35, lava * 0.05], -1))

# ---------------- PANELES DE NAVE / METAL ----------------
def hull():
    n = 1024
    img = np.ones((n, n, 3)) * col(170, 176, 186)
    h = np.zeros((n, n))
    r = np.random.default_rng(111)
    for _ in range(90):
        x0, y0 = r.integers(0, n, 2); w, hh = r.integers(40, 260, 2)
        tone = r.uniform(0.82, 1.12)
        ys = np.arange(y0, y0 + hh) % n; xs = np.arange(x0, x0 + w) % n
        img[np.ix_(ys, xs)] *= tone
        h[np.ix_(ys, xs)] += 0.15
        for yy0 in (y0, y0 + hh - 1):
            img[yy0 % n, xs] *= 0.35; h[yy0 % n, xs] -= 0.6
        for xx0 in (x0, x0 + w - 1):
            img[ys, xx0 % n] *= 0.35; h[ys, xx0 % n] -= 0.6
    f = band(n, 100, 512, 112)
    img *= (0.92 + 0.1 * f[..., None])
    save_rgb('hull_albedo.png', img)
    save_n('hull_normal.png', normal_from_height(h, 2.0))

# ---------------- CIELO ESPACIAL (equirectangular) ----------------
def space_sky():
    W, H = 2048, 1024
    b1 = spectral(2048, 1.9, 121)[:H, :]
    b2 = spectral(2048, 1.6, 122)[:H, :]
    b3 = spectral(2048, 2.3, 123)[:H, :]
    yy = np.linspace(-1, 1, H)[:, None]
    lat = np.cos(yy * math.pi / 2)
    neb = np.clip((b1 - 0.45) * 2.4, 0, 1) ** 1.6
    neb2 = np.clip((b2 - 0.5) * 2.2, 0, 1) ** 1.8
    band_mw = np.exp(-((yy - 0.12 * np.sin(np.linspace(0, 2 * math.pi, W))[None, :]) ** 2) / 0.04)
    c = np.zeros((H, W, 3))
    c += neb[..., None] * col(120, 40, 160) * 1.1
    c += neb2[..., None] * col(30, 110, 200) * 0.9
    c += (band_mw * b3)[..., None] * col(255, 200, 170) * 0.45
    dust = np.clip((b3 - 0.55) * 3, 0, 1) * band_mw
    c *= (1 - dust[..., None] * 0.7)
    r = np.random.default_rng(124)
    for count, br, sz in ((14000, 0.5, 0), (2500, 0.9, 0), (260, 1.0, 1)):
        ys = r.integers(0, H, count); xs = r.integers(0, W, count)
        tint = r.choice(4, count)
        tc = np.array([[1, 1, 1], [0.75, 0.85, 1.0], [1.0, 0.85, 0.7], [1, 0.95, 0.85]])[tint]
        v = r.uniform(0.3, 1, count)[:, None] * br * tc
        for dy in range(-sz, sz + 1):
            for dx in range(-sz, sz + 1):
                fall = 1.0 if (dx == 0 and dy == 0) else 0.35
                c[(ys + dy) % H, (xs + dx) % W] = np.maximum(c[(ys + dy) % H, (xs + dx) % W], v * fall)
    save_rgb('space_sky.png', c)

# ---------------- PLANETAS ----------------
def planets():
    W, H = 1024, 512
    bnd = band(1024, 1, 40, 131, aniso=(0.05, 1.0))[:H, :]
    turb = spectral(1024, 1.6, 132)[:H, :]
    v = np.clip(bnd * 0.8 + turb * 0.35, 0, 1)
    gas = lerp(col(160, 110, 70), col(240, 210, 170), v[..., None])
    gas = lerp(gas, col(190, 90, 60), (np.clip((turb - 0.7) * 4, 0, 1))[..., None] * 0.6)
    save_rgb('planet_gas.png', gas)
    t = spectral(1024, 1.9, 133)[:H, :]
    land = t > 0.52
    ice = np.abs(np.linspace(-1, 1, H))[:, None] > 0.82
    pc = np.where(land[..., None], lerp(col(70, 110, 50), col(150, 130, 90), ((t - 0.52) * 3)[..., None]), lerp(col(10, 40, 100), col(30, 90, 160), t[..., None]))
    pc = np.where(ice[..., None], col(235, 240, 245), pc)
    clouds = np.clip((spectral(1024, 1.7, 134)[:H, :] - 0.5) * 3, 0, 1)
    pc = lerp(pc, col(255, 255, 255), clouds[..., None] * 0.8)
    save_rgb('planet_earthlike.png', pc)
    lv = spectral(1024, 1.6, 135)[:H, :]
    lavaplanet = lerp(col(30, 22, 20), col(90, 70, 60), lv[..., None])
    cr = np.exp(-((band(1024, 4, 20, 136)[:H, :] - 0.5) ** 2) / 0.001)
    lavaplanet = lerp(lavaplanet, col(255, 110, 20), cr[..., None])
    save_rgb('planet_lava.png', lavaplanet)
    # anillo
    x = np.linspace(0, 1, 1024)
    rb = band(1024, 2, 120, 137)[0]
    a = np.clip(np.sin(x * math.pi) ** 0.6 * (0.3 + rb), 0, 1)
    ring = np.zeros((16, 1024, 4))
    ring[..., 0] = 0.85 + 0.15 * rb; ring[..., 1] = 0.75 + 0.15 * rb; ring[..., 2] = 0.62; ring[..., 3] = a
    save_rgba('planet_ring.png', ring)

# ---------------- SPRITES ----------------
def sprites():
    n = 128
    yy, xx = np.mgrid[0:n, 0:n] / (n - 1) * 2 - 1
    d = np.sqrt(xx * xx + yy * yy)
    soft = np.clip(1 - d, 0, 1) ** 2
    save_rgba('glow.png', np.stack([np.ones_like(d), np.ones_like(d), np.ones_like(d), soft], -1))
    smoke_n = spectral(128, 1.5, 141)
    sm = np.clip(1 - d, 0, 1) ** 1.5 * (0.5 + 0.7 * smoke_n)
    save_rgba('smoke.png', np.stack([np.ones_like(d) * 0.9, np.ones_like(d) * 0.9, np.ones_like(d) * 0.92, np.clip(sm, 0, 1)], -1))
    # destello estrella (4 puntas)
    st = np.clip(1 - d * 1.2, 0, 1) ** 3 + np.exp(-np.abs(xx) * 40) * np.clip(1 - np.abs(yy), 0, 1) ** 2 + np.exp(-np.abs(yy) * 40) * np.clip(1 - np.abs(xx), 0, 1) ** 2
    save_rgba('flare.png', np.stack([np.ones_like(d), np.ones_like(d), np.ones_like(d), np.clip(st, 0, 1)], -1))
    # chevron de curva
    ch = np.zeros((128, 256, 4)); ch[..., 0:3] = col(20, 20, 20); ch[..., 3] = 1
    Y, X = np.mgrid[0:128, 0:256]
    for k in range(3):
        cx = 40 + k * 80
        m = (np.abs((X - cx) - np.abs(Y - 64) * 0.6) < 16)
        ch[m, 0:3] = np.array([255, 200, 0]) / 255.0
    save_rgba('chevron.png', ch)
    # cartel de meta / patrocinador (franja a cuadros)
    ck = ((X // 32 + Y // 32) % 2).astype(float)
    save_rgb('checker.png', np.stack([ck, ck, ck], -1)[:, :256])

only = sys.argv[2:]
for fn in (asphalt, grass, dirt, rock, sand, planks, bark, foliage, concrete, facades, asteroid, hull, space_sky, planets, sprites):
    if only and fn.__name__ not in only:
        continue
    fn()
    print('ok', fn.__name__)

# ---------------- PATROCINADORES Y PÚBLICO (marcas ficticias) ----------------
def banners():
    from PIL import ImageDraw, ImageFont
    fp = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    brands = [('APEX ENERGY', (10, 14, 24), (0, 220, 255)), ('TURBO COLA', (200, 20, 30), (255, 255, 255)),
              ('NEXUS MOBILE', (250, 250, 250), (20, 30, 60)), ('VOLTA TIRES', (255, 196, 0), (15, 15, 15)),
              ('ORBITA OIL', (10, 60, 140), (255, 210, 60)), ('SOLARIS', (255, 120, 0), (255, 255, 255)),
              ('KAIROS', (20, 20, 20), (230, 230, 230)), ('RAPIDO', (0, 150, 80), (255, 255, 255))]
    W, H = 1024, 512
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for i, (txt, bg, fg) in enumerate(brands):
        x0, y0 = (i % 2) * 512, (i // 2) * 128
        d.rectangle([x0, y0, x0 + 511, y0 + 127], fill=bg)
        d.rectangle([x0 + 8, y0 + 8, x0 + 503, y0 + 119], outline=fg, width=3)
        size = 70
        f = ImageFont.truetype(fp, size)
        while d.textlength(txt, font=f) > 460:
            size -= 4
            f = ImageFont.truetype(fp, size)
        tw = d.textlength(txt, font=f)
        d.text((x0 + 256 - tw / 2, y0 + 64 - size * 0.6), txt, font=f, fill=fg)
        d.polygon([(x0 + 18, y0 + 100), (x0 + 60, y0 + 100), (x0 + 50, y0 + 112), (x0 + 8, y0 + 112)], fill=fg)
    img.save(os.path.join(OUT, 'banners.png'))
    # Público en gradas
    r = np.random.default_rng(301)
    cw, ch = 512, 256
    crowd = np.zeros((ch, cw, 3))
    for row in range(8):
        y = row * 32
        crowd[y:y + 32] = (0.18, 0.19, 0.22)
        crowd[y + 28:y + 32] = (0.35, 0.36, 0.4)
        for k in range(64):
            x = k * 8 + r.integers(0, 3)
            c = r.choice([(0.9, 0.2, 0.2), (0.2, 0.4, 0.9), (0.95, 0.85, 0.2), (0.95, 0.95, 0.95), (0.1, 0.1, 0.1), (0.2, 0.7, 0.3), (0.95, 0.5, 0.1)])
            skin = r.choice([(0.85, 0.65, 0.5), (0.6, 0.42, 0.3), (0.4, 0.28, 0.2)])
            crowd[y + 14:y + 27, x:x + 6] = c
            crowd[y + 8:y + 14, x + 1:x + 5] = skin
    save_rgb('crowd.png', crowd)
    # Línea de meta a cuadros (1024x128)
    Y, X = np.mgrid[0:128, 0:1024]
    ck = ((X // 64 + Y // 64) % 2).astype(float) * 0.9 + 0.05
    save_rgb('finish_line.png', np.stack([ck, ck, ck], -1))
    # Agua: mapa de normales tileable
    hgt = band(512, 4, 40, 311) * 0.6 + band(512, 30, 120, 312) * 0.4
    save_n('water_normal.png', normal_from_height(hgt, 4.0))
    # Neumático (barrera de neumáticos) y flecha de turbo
    a = np.zeros((128, 256, 4))
    Yy, Xx = np.mgrid[0:128, 0:256]
    for k in range(3):
        cx = 50 + k * 75
        m = (np.abs((Xx - cx) - np.abs(Yy - 64) * 0.7) < 14) & (np.abs(Yy - 64) < 50)
        a[m] = (0.3, 0.8, 1.0, 1.0)
    save_rgba('boost_arrows.png', a)

if not only or 'banners' in only:
    banners()
    print('ok banners')
