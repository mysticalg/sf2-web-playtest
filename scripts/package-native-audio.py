"""Package the ROM-free native audio presentation change and its matching sources."""
from pathlib import Path
import subprocess,zipfile,io,json,hashlib,re
root=Path(__file__).resolve().parent.parent;r=root/'ssf2t-ai';revision='79074759315ab145eca00f19f0446a2a8cee937b'
def prior(name):return subprocess.check_output(['git','show',revision+':ssf2t-ai/'+name],cwd=root)
def sha(b):return hashlib.sha256(b).hexdigest()
with zipfile.ZipFile(io.BytesIO(prior('corresponding-source.zip')))as z:src={n[7:]:z.read(n) for n in z.namelist()}
proof=json.loads(prior('source-proof.json'));evidence=json.loads((root/'work/native-audio/browser-proof.json').read_text());assert evidence[0]['replay']==evidence[1]['replay'] and evidence[1]['playback']['info']['backend']=='worklet';assert all(not x['errors']for x in evidence)
for name in ['bridge.js','audio-worklet.js','SCOPE.md']:src['web/'+name]=(r/name).read_bytes()
src['web/SOURCE-LICENSES.md']+=b'\nThe native audio streaming adapter and worklet are GPL-3.0-only. They play the original mixer PCM; no ROM assets are included.\n'
index=re.sub(r'\?v=[a-f0-9]+','',(r/'index.html').read_text(encoding='utf8'));index=re.sub(r'wasmSHA256:"[a-f0-9]+"','wasmSHA256:"__SSF2T_WASM_SHA256__"',index);src['web/index.html']=index.encode()
for name in ['ssf2t-audio-stream.test.cjs','ssf2t-audio-stream.browser.cjs','ssf2t-audio-fallback.browser.cjs']:
 s=(root/'tests'/name).read_text(encoding='utf8').replace("require('../ssf2t-ai/audio-worklet.js')","require('../web/audio-worklet.js')")
 s=s.replace("cp.execFileSync('git',['show','7907475:ssf2t-ai/bridge.js'],{cwd:repo,encoding:'utf8'})","fs.readFileSync(require('path').join(__dirname,'fixtures/native-audio-before-bridge.js'),'utf8')").replace("'tests/fixtures/ssf2t-cammy-arcade.json'","require('path').join(__dirname,'cammy-arcade-fixture.json')")
 src['qa/'+name]=s.encode()
src['qa/fixtures/native-audio-before-bridge.js']=prior('bridge.js');src['qa/native-audio-proof.json']=json.dumps(evidence,indent=2).encode();src['qa/native-audio-fallback-proof.json']=(root/'work/native-audio/fallback-proof.json').read_bytes()
src['qa/README.md']+=b'\nAudio streaming: node qa/ssf2t-audio-stream.test.cjs; node qa/ssf2t-audio-stream.browser.cjs; node qa/ssf2t-audio-fallback.browser.cjs. Set SF2_NATIVE_URL and SF2_NATIVE_ROM; serve JS as application/javascript for AudioWorklet modules. Browser QA compares the included prior presentation bridge; native code/ROM inputs are unchanged.\n'
build=src['build.py'].decode();build=build.replace("'bridge.js','ai-combat.js'","'bridge.js','audio-worklet.js','ai-combat.js'");src['build.py']=build.encode();src['source-files.json']=json.dumps(sorted(src),indent=2).encode()
with zipfile.ZipFile(r/'corresponding-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name,data in sorted(src.items()):
  item=zipfile.ZipInfo('source/'+name,(2026,11,26,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;z.writestr(item,data)
proof['previousCleanSourceRebuild']=proof.pop('cleanSourceRebuild');proof.update(sourceFiles=len(src),sourceArchiveSHA256=sha((r/'corresponding-source.zip').read_bytes()),nativeAudioStreaming={'browser':evidence[1]['playback'],'samples':21,'frames':4200,'rawNativeStatePixelsPCMUnchanged':True,'nativeSourcesUnchanged':True})
for name in ['bridge.js','audio-worklet.js']:proof['artifacts'][name]={'bytes':(r/name).stat().st_size,'sha256':sha((r/name).read_bytes())}
proof['packageVersion']=sha((proof['sourceArchiveSHA256']+json.dumps(proof['artifacts'],sort_keys=True)).encode());(r/'source-proof.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf8')
for name in ['SOURCE-LICENSES.md','about.html']:
 text=src['web/'+name].decode('utf8')
 for link,digest in [('corresponding-source.zip',proof['sourceArchiveSHA256']),('source-proof.json',proof['packageVersion']),('SCOPE.md',proof['packageVersion']),('SOURCE-LICENSES.md',proof['packageVersion'])]:text=re.sub(re.escape(link)+r'(?:\?v=[a-f0-9]+)?',link+'?v='+digest[:16],text)
 (r/name).write_text(text,encoding='utf8')
index=index.replace('__SSF2T_WASM_SHA256__',proof['wasmCacheVersion']);index=index.replace('about.html','about.html?v='+sha((r/'about.html').read_bytes())[:16])
for name in ['bridge.js','ai-combat.js','ai-shortcuts.js','rom-loader.js','rom-manifest.js','ssf2t-native.js','audio-worklet.js']:
 index=index.replace('src="'+name+'"','src="'+name+'?v='+sha((r/name).read_bytes())[:16]+'"').replace('href="'+name+'"','href="'+name+'?v='+sha((r/name).read_bytes())[:16]+'"')
(r/'index.html').write_text(index,encoding='utf8')
allow=json.loads((r/'deployment-allowlist.json').read_text());allow['totalBytesWithoutThisManifest']=sum((r/n).stat().st_size for n in allow['files'] if n!='deployment-allowlist.json');(r/'deployment-allowlist.json').write_text(json.dumps(allow,indent=2)+'\n')
print(json.dumps({'sourceFiles':len(src),'archiveSHA256':proof['sourceArchiveSHA256'],'wasmSHA256':proof['wasmCacheVersion']}))
