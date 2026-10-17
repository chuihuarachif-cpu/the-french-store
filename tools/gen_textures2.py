"""Texturas extra para el mapa único: grafitis de la zona roja y ruido de fachadas.
Uso: python3 tools/gen_textures2.py <carpeta_salida>"""
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1]
random.seed(7)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(FONT):
    FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def graffiti():
    W, H = 2048, 256
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    words = ["FRENCH", "LUMIÈRE", "BASTILLE", "ZONA ROJA", "APEX", "NO FUTURE", "FS-13", "REBEL", "KAOS", "VIVE", "STORE", "OMBRE", "FEU", "LIBRE"]
    palette = [(255, 60, 120), (40, 220, 255), (255, 210, 40), (120, 255, 90), (255, 120, 20), (200, 90, 255), (255, 255, 255), (30, 30, 30)]
    x = 10
    while x < W - 60:
        w = random.choice(words)
        size = random.randint(70, 140)
        f = ImageFont.truetype(FONT, size)
        col = random.choice(palette)
        out = random.choice([c for c in palette if c != col])
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        y = random.randint(10, H - size - 10)
        d.text((x, y), w, font=f, fill=col + (235,), stroke_width=random.randint(4, 9), stroke_fill=out + (255,))
        layer = layer.rotate(random.uniform(-7, 7), center=(x + 100, y + size // 2), resample=Image.BICUBIC)
        img = Image.alpha_composite(img, layer)
        tw = d.textlength(w, font=f) + f.size * 0.2
        x += int(tw) + random.randint(20, 140)
    # chorreones y tags pequeños
    d = ImageDraw.Draw(img)
    for _ in range(140):
        cx, cy = random.randint(0, W), random.randint(0, H)
        col = random.choice(palette)
        d.line([(cx, cy), (cx + random.randint(-3, 3), cy + random.randint(10, 60))], fill=col + (200,), width=random.randint(2, 4))
    for _ in range(30):
        f = ImageFont.truetype(FONT, random.randint(22, 40))
        d.text((random.randint(0, W - 100), random.randint(0, H - 40)), random.choice(words), font=f, fill=random.choice(palette) + (220,))
    a = np.array(img).astype(float)
    noise = np.random.default_rng(3).random(a.shape[:2])
    a[..., 3] *= (0.75 + 0.25 * noise)
    Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, "graffiti.png"), optimize=True)

def grime():
    # Ruido en escala de grises tileable para envejecer fachadas, tejados y asfalto lejano.
    n = 512
    r = np.random.default_rng(9)
    acc = np.zeros((n, n))
    for o, amp in [(4, 1.0), (8, 0.5), (16, 0.25), (32, 0.12), (64, 0.06)]:
        g = r.random((o, o))
        g = np.array(Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)).astype(float) / 255
        acc += g * amp
    acc = (acc - acc.min()) / (acc.max() - acc.min())
    # rayas verticales de suciedad
    streak = np.array(Image.fromarray((r.random((1, n)) * 255).astype(np.uint8)).resize((n, n), Image.BILINEAR)).astype(float) / 255
    img = np.stack([acc, streak, r.random((n, n))], -1)
    Image.fromarray((img * 255).astype(np.uint8), "RGB").save(os.path.join(OUT, "grime.png"), optimize=True)

graffiti()
grime()
print("ok")
