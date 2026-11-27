"""Prepare the ROM-free native recovery/shortcut release and corresponding source."""
from pathlib import Path
import argparse,hashlib,json,re,shutil,zipfile,subprocess,io
p=argparse.ArgumentParser();p.add_argument('--recovery',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1];r=root/'ssf2t-ai';h=a.recovery.resolve();w=h/'private/native-next7';out=root/'work/native-shortcut-release';out.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
baseline='870d28f1d16e4095d8d14fcf43073cd31e26dd0c'
def prior(name):return subprocess.check_output(['git','show',baseline+':ssf2t-ai/'+name],cwd=root)
with zipfile.ZipFile(io.BytesIO(prior('corresponding-source.zip')))as z:src={n.removeprefix('source/'):z.read(n) for n in z.namelist()}
changed=[]
for f in (w/'gen').iterdir():
 if f.suffix not in ['.h','.cpp']:continue
 data=re.sub(r'^\s*// [0-9A-Fa-f]{6}:.*\n','',f.read_text(encoding='utf8'),flags=re.M).encode()
 key='native/'+f.name
 if src.get(key)!=data:changed.append(key)
 src[key]=data
config=json.loads(src['build-config.json']);config['sources']=[n for n in config['sources'] if not n.startswith('native/')]+sorted(n for n in src if n.startswith('native/') and n.endswith('.cpp'));src['build-config.json']=json.dumps(config,indent=2).encode()
assert len(config['sources'])==91
artifact_names=['ssf2t-native.js','ssf2t-native.wasm','bridge.js','ai-combat.js','ai-shortcuts.js','rom-loader.js','rom-manifest.js']
for n in artifact_names:
 origin=h/'candidate-next7'/n if n.startswith('ssf2t-native.') else r/n
 shutil.copyfile(origin,out/n)
 if not n.startswith('ssf2t-native.'):src['web/'+n]=origin.read_bytes()
new_wasm=sha((out/'ssf2t-native.wasm').read_bytes())
assert new_wasm=='4bbbe2c3526639404c7bc0670dfaac438c5fa17c804ff315fdc293cc2abc6e67'
src['web/index.html']=re.sub(r'\?v=[a-f0-9]+','',re.sub(r'wasmSHA256:"[a-f0-9]+"','wasmSHA256:"__SSF2T_WASM_SHA256__"',(r/'index.html').read_text(encoding='utf8'))).encode()
qa=['ssf2t-shortcuts.test.cjs','ssf2t-shortcuts.browser.cjs','ssf2t-native-diagnostics.browser.cjs']
for n in qa:
 data=(root/'tests'/n).read_text(encoding='utf8')
 if n.endswith('.test.cjs'):data=data.replace("require('../ssf2t-ai/ai-shortcuts.js')","require('../web/ai-shortcuts.js')")
 src['qa/'+n]=data.encode()
for n in ['native-shortcut-harness.js','ssf2t-shortcut-activations.json','ssf2t-native-shortcut-diagnostics.json']:src['qa/fixtures/'+n]=(root/'tests/fixtures'/n).read_bytes()
guide=(root/'NATIVE-SSF2T-SHORTCUTS.md').read_text().split('Local validation and remaining release work:')[0].replace('# Native special shortcuts (local candidate)', '# Native special shortcuts').replace('This feature is not published yet. The native preview remains an incomplete part of the full AI Edition integration.', 'The native preview remains an incomplete part of the full AI Edition integration.')
src['web/SHORTCUTS.md']=(guide+'Validation and native recovery evidence are included in reference-proof.json and qa/native-shortcuts-proof.json.\n').encode()
activation=json.loads((root/'work/native-shortcuts/activation-proof.json').read_text());assert activation['cases']==300 and activation['errors']==[]
diagnostic=json.loads((root/'work/native-shortcuts/browser-diagnostic-proof.json').read_text());assert len(diagnostic['results'])==10 and diagnostic['errors']==[]
arcade={}
for fighter in ['ryu','ken','cammy','guile']:
 q=json.loads((root/f'work/native-shortcuts/arcade/{fighter}-proof.json').read_text());assert not q['errors'] and q['result']['roundWins']==24 and q['result']['title'] and q['result']['finalAkuma'];arcade[fighter]=q['result']
evidence={'originalDispatchEntries':['0747D0','09CF72','09E5C4','09F9C0','0A1806','0A385C','0A4AC2'],'activation':activation,'browserDiagnostics':diagnostic,'independentReference':'Full Mode::Blocks for both 68000 and Z80','offlineOldDiagnostics':json.loads((w/'old-special-oracle-proof.json').read_text()),'offlineBufferedSpecials':json.loads((w/'buffered-special-oracle-proof.json').read_text()),'compatibility':json.loads((w/'coverage-proof.json').read_text()),'arcade':arcade,'defaultEnabled':False,'inputAdapterWritesRAM':False,'diagnosticSetup':'Logged gauge/position writes and heap checkpoints are test-only; input tapes replay independently. No native state writes in the product adapter.'}
src['qa/native-shortcuts-proof.json']=json.dumps(evidence,indent=2).encode()
for n in ['SCOPE.md','about.html']:
 text=src['web/'+n].decode('utf8')
 extra='Optional two-button special shortcuts send ordinary original controller motions. All 300 listed new/old-style activations across both slots pass. Charge, meter and grab eligibility remain native; 720 supers use jump buffering, and Vega flying grabs require a second airborne chord. Seven newly exposed native dispatch paths are recovered. Ten diagnostic tapes match independent instruction execution in state, RGB and PCM; documented setup writes are confined to tests. All 98 compatibility cases and four full browser arcade clears pass on this build. Native Final Fight/possessed/death-combo integration remains unfinished.'
 text=text.replace('</html>','<p>'+extra+'</p></html>') if n.endswith('.html') else text+'\n\n'+extra+'\n';src['web/'+n]=text.encode()
src['web/SOURCE-LICENSES.md']+=b'\nThe native AI controller shortcut adapter is GPL-3.0-only. It emits original controller input and reads native state; no game assets are included in the adapter.\n'
reference=json.loads(src['web/reference-proof.json']);reference['previousReferenceWasmSHA256']=reference.get('referenceWasmSHA256');reference['referenceWasmSHA256']=new_wasm;reference.update(compiledSourceUnits=91,nativeEntries=9107,wasmCacheVersion=new_wasm);reference['nativeSpecialShortcuts']=evidence;src['web/reference-proof.json']=json.dumps(reference,indent=2).encode()
src['qa/README.md']+=b'\nNative shortcut control contract: node qa/ssf2t-shortcuts.test.cjs. Activation diagnostics: node qa/ssf2t-shortcuts.browser.cjs. Independent captured-tape browser regression: node qa/ssf2t-native-diagnostics.browser.cjs. Set SF2_NATIVE_URL and SF2_NATIVE_ROM, install Playwright. Diagnostic gauge/position writes and checkpoint restores are confined to QA; the product adapter emits controller input only.\n'
build=src['build.py'].decode();build=build.replace("'bridge.js','ai-combat.js',","'bridge.js','ai-combat.js','ai-shortcuts.js',");src['build.py']=build.encode()
src['source-files.json']=json.dumps(sorted(src),indent=2).encode()
with zipfile.ZipFile(out/'corresponding-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name,data in sorted(src.items()):
  item=zipfile.ZipInfo('source/'+name,(2026,11,26,0,0,0));item.compress_type=zipfile.ZIP_DEFLATED;z.writestr(item,data)
proof=json.loads(prior('source-proof.json'));proof.update(compiledSourceUnits=91,nativeEntries=9107,wasmCacheVersion=new_wasm,sourceFiles=len(src),sourceArchiveSHA256=sha((out/'corresponding-source.zip').read_bytes()),nativeSpecialShortcuts=evidence)
for n in artifact_names:proof['artifacts'][n]={'bytes':(out/n).stat().st_size,'sha256':sha((out/n).read_bytes())}
proof['packageVersion']=sha((proof['sourceArchiveSHA256']+json.dumps(proof['artifacts'],sort_keys=True)).encode());(out/'source-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
for n in ['SCOPE.md','SOURCE-LICENSES.md','about.html','index.html']:(out/n).write_bytes(src['web/'+n])
for n in ['SOURCE-LICENSES.md','about.html']:
 text=(out/n).read_text(encoding='utf8')
 for link,digest in [('corresponding-source.zip',proof['sourceArchiveSHA256']),('source-proof.json',proof['packageVersion']),('SCOPE.md',proof['packageVersion']),('SOURCE-LICENSES.md',proof['packageVersion'])]:text=text.replace(link,link+'?v='+digest[:16])
 (out/n).write_text(text,encoding='utf8')
index=(out/'index.html').read_text(encoding='utf8').replace('__SSF2T_WASM_SHA256__',new_wasm).replace('about.html','about.html?v='+sha((out/'about.html').read_bytes())[:16])
for n in ['bridge.js','ai-combat.js','ai-shortcuts.js','rom-loader.js','rom-manifest.js','ssf2t-native.js']:index=index.replace('src="'+n+'"','src="'+n+'?v='+sha((out/n).read_bytes())[:16]+'"')
(out/'index.html').write_text(index,encoding='utf8')
allow=json.loads(prior('deployment-allowlist.json'));allow['files'].insert(3,'ai-shortcuts.js');allow['totalBytesWithoutThisManifest']=sum((out/n).stat().st_size for n in allow['files'] if n!='deployment-allowlist.json');(out/'deployment-allowlist.json').write_text(json.dumps(allow,indent=2)+'\n');assert set(f.name for f in out.iterdir())==set(allow['files'])
print(json.dumps({'sourceFiles':len(src),'compilationUnits':len(config['sources']),'changedNativeSources':len(changed),'wasmSHA256':new_wasm,'sourceArchiveSHA256':proof['sourceArchiveSHA256']}))
