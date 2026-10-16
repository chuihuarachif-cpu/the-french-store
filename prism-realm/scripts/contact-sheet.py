import sys, os
from PIL import Image, ImageDraw
out_dir = sys.argv[1]; levels = [int(x) for x in sys.argv[2:]]
meta = {}
for line in open(os.path.join(out_dir, 'meta.tsv')):
    p = line.rstrip('\n').split('\t')
    if not p[0].isdigit(): continue
    meta[int(p[0])] = p[1] if len(p) > 1 else ''
for i in range(0, len(levels), 10):
    grp = levels[i:i+10]
    ims = []
    for L in grp:
        f = os.path.join(out_dir, 'L%03d.jpg' % L)
        im = Image.open(f).convert('RGB') if os.path.exists(f) else Image.new('RGB', (330, 420), 'red')
        d = ImageDraw.Draw(im); d.rectangle((0, 0, 330, 18), fill='white'); d.text((4, 3), f'{L} {meta.get(L, "")[:48]}', fill='black')
        ims.append(im)
    W, H = ims[0].size
    o = Image.new('RGB', (W * 5, H * ((len(ims) + 4) // 5)), 'white')
    for j, im in enumerate(ims): o.paste(im, ((j % 5) * W, (j // 5) * H))
    o.save(os.path.join(out_dir, 'sheet_%03d.jpg' % grp[0]), quality=85)
