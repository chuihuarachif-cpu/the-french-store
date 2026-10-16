"""Genera efectos de sonido y música sintetizada (sin muestras externas).
Uso: python3 tools/gen_audio.py <carpeta_salida>"""
import sys, os, struct, math
import numpy as np

OUT = sys.argv[1]
SR = 44100
rng = np.random.default_rng(7)

def write_wav(name, x, loop=False):
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype('<i2').tobytes()
    chunks = b'fmt ' + struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16)
    chunks += b'data' + struct.pack('<I', len(data)) + data
    if loop:
        smpl = struct.pack('<9I', 0, 0, int(1e9 / SR), 60, 0, 0, 0, 1, 0)
        smpl += struct.pack('<6I', 0, 0, 0, len(x) - 1, 0, 0)
        chunks += b'smpl' + struct.pack('<I', len(smpl)) + smpl
    with open(os.path.join(OUT, name + '.wav'), 'wb') as f:
        f.write(b'RIFF' + struct.pack('<I', 4 + len(chunks)) + b'WAVE' + chunks)

def t_arr(d):
    return np.arange(int(SR * d)) / SR

def lowpass(x, cutoff):
    # filtro de un polo (puede ser variable en el tiempo)
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y

def lp_fast(x, cutoff):
    a = 1 - math.exp(-2 * math.pi * cutoff / SR)
    from itertools import accumulate
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y

def hp(x, cutoff):
    return x - lp_fast(x, cutoff)

def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(na, 1))[:na]
    e[na:na + nd] = np.linspace(1, s, max(nd, 1))[:len(e[na:na + nd])]
    if nr > 0:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e

def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1

def norm(x, peak=0.9):
    return x / (np.max(np.abs(x)) + 1e-9) * peak

def crossfade_loop(x, fade=0.15):
    n = int(fade * SR)
    out = x[:-n].copy()
    out[:n] = out[:n] * np.linspace(0, 1, n) + x[-n:] * np.linspace(1, 0, n)
    return out

# ---------- MOTOR DEPORTIVO (bucle 1 s) ----------
t = t_arr(1.0)
f0 = 90.0
x = 0.5 * saw(f0, t) + 0.3 * saw(f0 * 2, t) + 0.15 * np.sin(2 * np.pi * f0 * 3 * t) + 0.12 * saw(f0 * 0.5, t)
puls = (np.sin(2 * np.pi * f0 * 0.5 * t) > 0.6).astype(float) * 0.25
x = x + puls
x = lp_fast(x, 1800) + 0.04 * lp_fast(rng.standard_normal(len(t)), 3000)
write_wav('engine_loop', norm(x, 0.7), loop=True)

# ---------- MOTOR DIÉSEL ----------
f0 = 46.0
x = 0.6 * saw(f0, t) + 0.3 * np.sin(2 * np.pi * f0 * 2 * t)
knock = np.zeros_like(t)
period = int(SR / (f0 / 2))
for i in range(0, len(t), period):
    k = rng.standard_normal(min(900, len(t) - i)) * np.exp(-np.arange(min(900, len(t) - i)) / 150)
    knock[i:i + len(k)] += k * 0.6
x = lp_fast(x + knock, 900)
write_wav('truck_loop', norm(x, 0.75), loop=True)

# ---------- COHETE ----------
n = rng.standard_normal(int(SR * 2.15))
roar = lp_fast(n, 700) * 1.0 + lp_fast(n, 2500) * 0.25
hum = np.sin(2 * np.pi * 55 * t_arr(2.15)) * 0.3
write_wav('rocket_loop', norm(crossfade_loop(roar + hum), 0.7), loop=True)

# ---------- VIENTO ----------
n = rng.standard_normal(int(SR * 3.15))
w = lp_fast(n, 500) * (1 + 0.3 * np.sin(2 * np.pi * 0.7 * t_arr(3.15)))
write_wav('wind_loop', norm(crossfade_loop(w), 0.6), loop=True)

# ---------- EFECTOS ----------
d = 0.55; tt = t_arr(d)
n = rng.standard_normal(len(tt))
cut = 400 + 3500 * np.sin(np.pi * tt / d) ** 2
wh = lowpass(n, cut) * np.sin(np.pi * tt / d) ** 1.5
write_wav('whoosh', norm(wh, 0.85))

d = 1.3; tt = t_arr(d)
n = rng.standard_normal(len(tt))
thump = np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 6)
crunch = lp_fast(n, 3000) * np.exp(-tt * 4)
clang = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in ((520, 5), (1310, 7), (2210, 9))) * 0.25
glass = hp(n, 4000) * np.exp(-tt * 9) * 0.5
write_wav('crash', norm(thump * 1.2 + crunch + clang + glass, 0.95))

d = 0.45; tt = t_arr(d)
n = rng.standard_normal(len(tt))
sc = hp(n, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt)) * np.exp(-tt * 4)
write_wav('scrape', norm(sc, 0.7))

d = 0.3; tt = t_arr(d)
k = np.sin(2 * np.pi * 320 * tt) * np.exp(-tt * 30) + lp_fast(rng.standard_normal(len(tt)), 2000) * np.exp(-tt * 40)
write_wav('cone', norm(k, 0.8))

d = 0.18; tt = t_arr(d)
write_wav('beep', norm(np.sin(2 * np.pi * 880 * tt) * env_adsr(len(tt), 0.005, 0.02, 0.8, 0.05), 0.6))

d = 0.07; tt = t_arr(d)
write_wav('ui_click', norm(np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt * 70) + 0.3 * rng.standard_normal(len(tt)) * np.exp(-tt * 120), 0.5))

d = 0.9; tt = t_arr(d)
n = rng.standard_normal(len(tt))
nit = lowpass(n, 300 + 4000 * tt / d) * env_adsr(len(tt), 0.05, 0.2, 0.7, 0.4)
write_wav('nitro', norm(nit, 0.8))

d = 1.6; tt = t_arr(d)
n = rng.standard_normal(len(tt))
boom = lp_fast(n, 900) * np.exp(-tt * 2.5) + np.sin(2 * np.pi * (60 - 25 * tt) * tt) * np.exp(-tt * 3)
write_wav('explosion', norm(boom, 0.95))

d = 0.45; tt = t_arr(d)
x = np.zeros(len(tt))
for i, f in enumerate((880, 1108, 1318, 1760)):
    s0 = int(i * 0.06 * SR)
    seg = tt[: len(tt) - s0]
    x[s0:] += np.sin(2 * np.pi * f * seg) * np.exp(-seg * 9) * 0.5
write_wav('pickup', norm(x, 0.6))

d = 0.6; tt = t_arr(d)
lz = np.sin(2 * np.pi * (1800 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 5)
write_wav('laser', norm(lz, 0.6))

d = 0.35; tt = t_arr(d)
th = np.sin(2 * np.pi * (90 - 40 * tt) * tt) * np.exp(-tt * 12) + lp_fast(rng.standard_normal(len(tt)), 1200) * np.exp(-tt * 20) * 0.5
write_wav('thud', norm(th, 0.9))

d = 2.2; tt = t_arr(d)
x = np.zeros(len(tt))
for i, f in enumerate((523, 659, 784, 1046)):
    s0 = int(i * 0.12 * SR)
    seg = tt[: len(tt) - s0]
    x[s0:] += (saw(f, seg) * 0.3 + np.sin(2 * np.pi * f * seg)) * np.exp(-seg * 2.2) * 0.4
write_wav('win', norm(lp_fast(x, 5000), 0.7))

d = 1.4; tt = t_arr(d)
x = sum(saw(f * (1 - 0.25 * tt / d), tt) for f in (220, 233)) * np.exp(-tt * 1.6)
write_wav('lose', norm(lp_fast(x, 1500), 0.6))

# ---------- MÚSICA ----------
def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def kick(n):
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (50 + 120 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)

def snare(n):
    tt = np.arange(n) / SR
    return (rng.standard_normal(n) * 0.7 + np.sin(2 * np.pi * 190 * tt) * 0.5) * np.exp(-tt * 16)

def hat(n):
    tt = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-tt * 60)

def song(name, bpm, prog, bars=16, lead=True, drums=True, dark=False):
    beat = 60.0 / bpm
    total = int(SR * beat * 4 * bars)
    out = np.zeros(total + SR)
    step = beat / 4
    ns = int(step * SR)
    for b in range(bars):
        chord = prog[b % len(prog)]
        root = chord[0]
        for s16 in range(16):
            i0 = int((b * 16 + s16) * step * SR)
            # bajo en semicorcheas con octava
            f = note(root - 24 + (12 if s16 % 4 == 2 else 0))
            tt = np.arange(int(ns * 0.95)) / SR
            bass = saw(f, tt) * np.exp(-tt * 8)
            out[i0:i0 + len(tt)] += lp_fast(bass, 700 if not dark else 450) * 0.35
            if drums:
                if s16 % 4 == 0:
                    k = kick(int(0.3 * SR)); out[i0:i0 + len(k)] += k * 0.8
                if s16 in (4, 12):
                    sn = snare(int(0.2 * SR)); out[i0:i0 + len(sn)] += sn * 0.32
                if s16 % 2 == 1:
                    h = hat(int(0.05 * SR)); out[i0:i0 + len(h)] += h * 0.12
            # arpegio
            arp = chord[s16 % len(chord)] + (12 if (s16 // 4) % 2 else 0)
            tt2 = np.arange(int(ns * 0.9)) / SR
            a = (saw(note(arp), tt2) * 0.5 + np.sin(2 * np.pi * note(arp) * tt2)) * np.exp(-tt2 * 14)
            out[i0:i0 + len(tt2)] += lp_fast(a, 2600 if not dark else 1400) * 0.10
        # pad del acorde
        i0 = int(b * 16 * step * SR)
        tt3 = np.arange(int(16 * step * SR)) / SR
        pad = sum(saw(note(m) * (1 + det), tt3) for m in chord for det in (-0.004, 0.004)) / (len(chord) * 2)
        pad *= env_adsr(len(tt3), 0.4, 0.3, 0.8, 0.4)
        out[i0:i0 + len(tt3)] += lp_fast(pad, 1100 if not dark else 700) * 0.22
        if lead and b % 4 in (1, 3):
            mel = [chord[2] + 12, chord[1] + 12, chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[2] + 14, chord[2] + 12, chord[0] + 12]
            for k2, m in enumerate(mel):
                j0 = i0 + int(k2 * 2 * step * SR)
                tt4 = np.arange(int(2 * step * SR)) / SR
                vib = 1 + 0.004 * np.sin(2 * np.pi * 6 * tt4)
                ld = (saw(note(m) * vib, tt4) * 0.4 + np.sin(2 * np.pi * note(m) * vib * tt4) * 0.6) * env_adsr(len(tt4), 0.01, 0.1, 0.6, 0.08)
                out[j0:j0 + len(tt4)] += lp_fast(ld, 3200) * 0.13
    loop = out[:total]
    tail = out[total:total + SR]
    loop[:len(tail)] += tail
    write_wav(name, norm(loop, 0.8), loop=True)

song('music_drive', 118, [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]])
song('music_menu', 96, [[50, 53, 57], [46, 50, 53], [43, 47, 50], [45, 49, 52]], bars=8, lead=False)
song('music_space', 104, [[52, 55, 59], [48, 52, 55], [50, 53, 57], [47, 50, 54]], dark=True)
song('music_race', 128, [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]])
print('audio ok')
