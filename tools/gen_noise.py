"""Ruido periódico (sin costuras) para nubes, lluvia y detalle: assets/textures/noise_tile.png (RGB = 3 octavas independientes)."""
import sys, numpy as np
from PIL import Image
out = sys.argv[1] if len(sys.argv) > 1 else "apex-multiverse-godot/assets/textures"
N = 256
rng = np.random.default_rng(7)
def periodic_noise(freq, seed):
    r = np.random.default_rng(seed)
    g = r.random((freq, freq))
    x = np.arange(N) / N * freq
    i0 = np.floor(x).astype(int) % freq; i1 = (i0 + 1) % freq
    f = x - np.floor(x); f = f * f * (3 - 2 * f)
    a = g[i0][:, i0]; b = g[i0][:, i1]; c = g[i1][:, i0]; d = g[i1][:, i1]
    fx = f[None, :]; fy = f[:, None]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
def fbm(seed):
    v = np.zeros((N, N)); amp = 1.0; tot = 0
    for o, fr in enumerate([4, 8, 16, 32, 64]):
        v += periodic_noise(fr, seed + o) * amp; tot += amp; amp *= 0.5
    v /= tot
    v = (v - v.min()) / (v.max() - v.min())
    return v
img = np.stack([fbm(1), fbm(20), fbm(40)], -1)
Image.fromarray((img * 255).astype(np.uint8)).save(f"{out}/noise_tile.png")
print("ok")

# Sonido de lluvia en bucle (ruido filtrado con gotas), assets/audio/rain_loop.wav
import wave
SR = 22050; T = 4.0; n = int(SR * T)
r = np.random.default_rng(3)
w = r.standard_normal(n)
# paso bajo suave (lluvia lejana) + paso alto (gotas cercanas)
k = np.exp(-np.arange(64) / 9.0); k /= k.sum()
low = np.convolve(np.concatenate([w[-64:], w]), k, "same")[64:]
high = w - np.convolve(np.concatenate([w[-8:], w]), np.ones(8) / 8, "same")[8:]
drops = np.zeros(n)
for i in r.integers(0, n, 900):
    L = int(r.integers(40, 220)); seg = np.exp(-np.arange(L) / (L / 5)) * r.standard_normal(L)
    e = min(n, i + L); drops[i:e] += seg[:e - i] * r.uniform(0.2, 1.0)
sig = low * 0.9 + high * 0.25 + drops * 0.18
# fundido circular para bucle sin clic
f = 2000; sig[:f] = sig[:f] * np.linspace(0, 1, f) + sig[-f:] * np.linspace(1, 0, f); sig = sig[:-f]
sig = sig / np.abs(sig).max() * 0.8
audio_out = sys.argv[2] if len(sys.argv) > 2 else "apex-multiverse-godot/assets/audio"
with wave.open(f"{audio_out}/rain_loop.wav", "wb") as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((sig * 32767).astype(np.int16).tobytes())
print("rain ok")
