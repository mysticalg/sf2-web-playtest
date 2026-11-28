"""Build the browser runtime package from the user's verified local SF2T set."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive', type=Path)
args = parser.parse_args()
manifest = json.loads((root / 'ssf2t-ai/rom-manifest.js').read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
with zipfile.ZipFile(args.archive) as archive:
    files = {}
    for expected in manifest['files']:
        entry = next((e for e in archive.infolist() if e.CRC == int(expected['crc32'], 16) and e.file_size == expected['bytes']), None)
        if entry is None:
            raise ValueError('Missing original file: ' + expected['name'])
        data = archive.read(entry)
        if hashlib.sha256(data).hexdigest() != expected['sha256']:
            raise ValueError('Original checksum mismatch: ' + expected['name'])
        files[expected['name']] = data

program = bytearray(0x400000)
for n, name in enumerate(['sfxe.03c', 'sfxe.04a', 'sfxe.05', 'sfxe.06a', 'sfxe.07', 'sfxe.08', 'sfx.09']):
    data = files[name]
    start = n * 0x80000
    program[start:start+len(data):2] = data[1::2]
    program[start+1:start+len(data):2] = data[::2]
graphics = bytearray(0x1000000)
base = 0
for group in [['sfx.13m','sfx.15m','sfx.17m','sfx.19m'], ['sfx.14m','sfx.16m','sfx.18m','sfx.20m'], ['sfx.21m','sfx.23m','sfx.25m','sfx.27m']]:
    length = len(files[group[0]]) * 4
    for lane, name in enumerate(group):
        data = files[name]
        graphics[base+lane*2:base+length:8] = data[::2]
        graphics[base+lane*2+1:base+length:8] = data[1::2]
    base += length
for start in range(0, len(graphics), 0x200000):
    block = graphics[start:start+0x200000]
    for lane in range(8):
        graphics[start+lane:start+0x100000:8] = block[lane::16]
        graphics[start+0x100000+lane:start+0x200000:8] = block[8+lane::16]
sound = files['sfx.01'] + files['sfx.02']
samples = bytearray(0x400000)
for n, name in enumerate(['sfx.11m', 'sfx.12m']):
    data = files[name]
    start = n * 0x200000
    samples[start:start+len(data):2] = data[1::2]
    samples[start+1:start+len(data):2] = data[::2]
regions = dict(program=program, graphics=graphics, sound=sound, samples=samples)
for name, data in regions.items():
    if hashlib.sha256(data).hexdigest() != manifest['regions'][name]:
        raise ValueError('Prepared region mismatch: ' + name)
payload = b'SF2TPK01' + b''.join(regions.values())
packed = gzip.compress(payload, compresslevel=9, mtime=0)
(root / 'ssf2t-ai/native-assets.pack').write_bytes(packed)
meta = dict(file='native-assets.pack', sha256=hashlib.sha256(packed).hexdigest(), bytes=len(packed), decodedBytes=len(payload), set=manifest['set'])
(root / 'ssf2t-ai/bundled-assets.js').write_text('window.SSF2TBundledAssets=' + json.dumps(meta, separators=(',', ':')) + ';\n', encoding='utf-8')
print(json.dumps(meta))
