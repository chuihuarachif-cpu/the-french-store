"""Compacta un GLB: elimina nodos por prefijo de nombre (y sus hijos) y
todo dato binario que deje de usarse. Conserva extensiones y texturas originales.
Uso: python3 tools/strip_glb.py in.glb out.glb Prefijo1 Prefijo2 ...
"""
import json, struct, sys

src, dst, prefixes = sys.argv[1], sys.argv[2], sys.argv[3:]
data = open(src, 'rb').read()
jl = struct.unpack('<I', data[12:16])[0]
j = json.loads(data[20:20 + jl])
bin_off = 20 + jl
bl = struct.unpack('<I', data[bin_off:bin_off + 4])[0]
binchunk = data[bin_off + 8:bin_off + 8 + bl]

nodes = j['nodes']
def drop(i):
    name = nodes[i].get('name') or ''
    return any(name.startswith(p) for p in prefixes)

keep_nodes = []
def walk(i):
    if drop(i):
        return
    keep_nodes.append(i)
    for c in nodes[i].get('children', []):
        walk(c)
for s in j['scenes']:
    for r in s['nodes']:
        walk(r)
nmap = {o: n for n, o in enumerate(keep_nodes)}
new_nodes = []
for o in keep_nodes:
    n = dict(nodes[o])
    if 'children' in n:
        ch = [nmap[c] for c in n['children'] if c in nmap]
        if ch: n['children'] = ch
        else: del n['children']
    new_nodes.append(n)

used_meshes = sorted({n['mesh'] for n in new_nodes if 'mesh' in n})
mmap = {o: i for i, o in enumerate(used_meshes)}
for n in new_nodes:
    if 'mesh' in n: n['mesh'] = mmap[n['mesh']]
meshes = [json.loads(json.dumps(j['meshes'][o])) for o in used_meshes]

used_acc, used_mat = set(), set()
for m in meshes:
    for p in m['primitives']:
        used_acc.update(p['attributes'].values())
        if 'indices' in p: used_acc.add(p['indices'])
        if 'material' in p: used_mat.add(p['material'])
        for t in p.get('targets', []): used_acc.update(t.values())
        v = p.get('extensions', {}).get('KHR_materials_variants')
        if v:
            for mp in v['mappings']: used_mat.add(mp['material'])
amap = {o: i for i, o in enumerate(sorted(used_acc))}
matmap = {o: i for i, o in enumerate(sorted(used_mat))}

used_tex = set()
def collect_tex(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k.endswith('Texture') and isinstance(v, dict) and 'index' in v: used_tex.add(v['index'])
            collect_tex(v)
    elif isinstance(o, list):
        for v in o: collect_tex(v)
mats = [json.loads(json.dumps(j['materials'][o])) for o in sorted(used_mat)]
collect_tex(mats)
tmap = {o: i for i, o in enumerate(sorted(used_tex))}
def fix_tex(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k.endswith('Texture') and isinstance(v, dict) and 'index' in v: v['index'] = tmap[v['index']]
            fix_tex(v)
    elif isinstance(o, list):
        for v in o: fix_tex(v)
fix_tex(mats)
textures = [dict(j['textures'][o]) for o in sorted(used_tex)]
used_img = sorted({t['source'] for t in textures})
imap = {o: i for i, o in enumerate(used_img)}
for t in textures: t['source'] = imap[t['source']]
images = [dict(j['images'][o]) for o in used_img]

for m in meshes:
    for p in m['primitives']:
        p['attributes'] = {k: amap[v] for k, v in p['attributes'].items()}
        if 'indices' in p: p['indices'] = amap[p['indices']]
        if 'material' in p: p['material'] = matmap[p['material']]
        if 'targets' in p: p['targets'] = [{k: amap[v] for k, v in t.items()} for t in p['targets']]
        v = p.get('extensions', {}).get('KHR_materials_variants')
        if v:
            for mp in v['mappings']: mp['material'] = matmap[mp['material']]
accessors = [dict(j['accessors'][o]) for o in sorted(used_acc)]
used_bv = sorted({a['bufferView'] for a in accessors if 'bufferView' in a} | {im['bufferView'] for im in images if 'bufferView' in im})
out = bytearray(); bvmap = {}; bvs = []
for o in used_bv:
    bv = dict(j['bufferViews'][o])
    chunk = binchunk[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
    while len(out) % 4: out.append(0)
    bv['byteOffset'] = len(out); bv['buffer'] = 0
    out += chunk
    bvmap[o] = len(bvs); bvs.append(bv)
for a in accessors:
    if 'bufferView' in a: a['bufferView'] = bvmap[a['bufferView']]
for im in images:
    if 'bufferView' in im: im['bufferView'] = bvmap[im['bufferView']]
while len(out) % 4: out.append(0)

j2 = dict(j)
j2['nodes'] = new_nodes; j2['meshes'] = meshes; j2['accessors'] = accessors; j2['materials'] = mats
j2['textures'] = textures; j2['images'] = images; j2['bufferViews'] = bvs
j2['buffers'] = [{'byteLength': len(out)}]
j2['scenes'] = [{'nodes': [nmap[r] for r in s['nodes'] if r in nmap]} for s in j['scenes']]
js = json.dumps(j2, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
tris = sum(accessors[p['indices']]['count'] // 3 for m in meshes for p in m['primitives'] if 'indices' in p)
print('nodes', len(new_nodes), 'meshes', len(meshes), 'tris', tris, 'bytes', len(glb))
