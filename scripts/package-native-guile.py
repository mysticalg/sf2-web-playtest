"""Package the native Guile dispatch recovery, preserving the current AI presentation."""
from pathlib import Path
import argparse,hashlib,json,re,shutil,zipfile
p=argparse.ArgumentParser();p.add_argument('--recovery',type=Path,required=True);a=p.parse_args();root=Path(__file__).resolve().parents[1];r=root/'ssf2t-ai';h=a.recovery.resolve();w=h/'private/native-next6';candidate=h/'candidate-next6';out=root/'work/native-guile-candidate';out.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
with zipfile.ZipFile(r/'corresponding-source.zip')as z:src={n.removeprefix('source/'):z.read(n) for n in z.namelist()}
old_wasm=sha((r/'ssf2t-native.wasm').read_bytes());changed=[]
for f in (w/'gen').iterdir():
 if f.suffix not in ['.h','.cpp']:continue
 data=re.sub(r'^\s*// [0-9A-Fa-f]{6}:.*\n','',f.read_text(encoding='utf-8'),flags=re.M).encode()
 key='native/'+f.name
 if src[key]!=data:changed.append(key)
 src[key]=data
for n in ['ssf2t-native.js','ssf2t-native.wasm']:shutil.copyfile(candidate/n,out/n)
new_wasm=sha((out/'ssf2t-native.wasm').read_bytes());assert new_wasm!=old_wasm
for n in ['bridge.js','ai-combat.js','rom-loader.js','rom-manifest.js']:assert src['web/'+n]==(r/n).read_bytes();shutil.copyfile(r/n,out/n)
for n in ['ssf2t-guile-charge.browser.cjs']:
 src['qa/'+n]=(root/'tests'/n).read_bytes()
s=(root/'tests/ssf2t-arcade.browser.cjs').read_text(encoding='utf-8').replace('ssf2t-cammy-arcade.json','ssf2t-guile-arcade.json');src['qa/ssf2t-guile-arcade.browser.cjs']=s.encode()
for n in ['ssf2t-guile-charge.json','ssf2t-guile-arcade.json']:src['qa/fixtures/'+n]=(root/'tests/fixtures'/n).read_bytes()
short=json.loads((root/'tests/fixtures/ssf2t-guile-charge.json').read_text(encoding='utf-8'));full=json.loads((w/'guile-clear-oracle-proof.json').read_text(encoding='utf-8'));coverage=json.loads((w/'coverage-proof.json').read_text(encoding='utf-8'));browser=json.loads((root/'work/native-guile-charge/arcade-proof.json').read_text(encoding='utf-8'));assert browser['errors']==[] and browser['result']['roundWins']==24 and browser['result']['title'] and browser['result']['finalAkuma']
compat={}
for fighter in ['ryu','ken','cammy']:
 q=json.loads((root/f'work/native-guile-charge/{fighter}-compatibility-proof.json').read_text(encoding='utf-8'));assert q['errors']==[] and q['result']['roundWins']==24 and q['result']['title'];compat[fighter]=q['result']
recovery={'entries':['083EC4','084068'],'inputs':['charge-back then forward+punch','charge-down then up+kick'],'context':'original Guile reversal admission','baselineStopsAtFrame':13208,'independentReference':'Full Mode::Blocks for both 68000 and Z80','shortReplayFrames':28000,'shortStateSamples':sum(len(q['states']) for q in short['cases']),'shortRGBPictures':sum(len(q['pictures']) for q in short['cases']),'shortPCMBytes':sum(q['oracle']['native-audio.pcm']['bytes'] for q in short['cases']),'browserShortProof':json.loads((root/'work/native-guile-charge/proof.json').read_text(encoding='utf-8')),'nativeMatrix':coverage,'compatibilityArcade':compat,'nativeDecoderLinked':False,'stateLoadsInReplay':False,'onlySettingWrite':'original operator difficulty after frame3001'}
clear={'fighter':'Guile','frames':69000,'stateSamples':full['state.csv'],'RGBPictures':full['pictures'],'PCMBytes':full['native-audio.pcm']['bytes'],'roundWins':24,'roundLosses':0,'matches':12,'cpuAkumaFinal':True,'nativeEnding':True,'staffRoll':True,'returnedToTitle':True,'reference':'Full Mode::Blocks for both 68000 and Z80','offlinePlanningOnly':True,'inputReplayContainsStateLoads':False,'browser':browser['result']}
text='Two original Guile reversal dispatch entries,083EC4 and084068, are restored after genuine back-charge/forward+punch and down-charge/up+kick inputs stopped the prior native build. Both old-build stops reproduce at frame13208. The two repaired14000-frame ordinary-input tapes match932state samples,321completeRGBpictures and45143484PCMbytes against a full68000/Z80 instruction oracle. The browser independently matches every saved state and picture. No health, stage, ladder, timer, RNG or result writes or state loads occur; only original operator difficulty1 is selected.'
text2='A new Guile tape genuinely wins24rounds and12matches without losses, defeats CPUAkuma, plays his original ending and credits, and returns to title. Its69000frames match2300state samples,683completeRGBpictures and111246956PCMbytes against full instruction execution for both CPUs; the browser independently matches all states/pictures and counts the wins, final opponent and ending/title. Offline planning generated the controller tape, but independent replay has no planner or state restoration. All98existing native/reference cases and196pictures remain identical, and Ryu/Ken/Cammy browser arcade tapes still pass. Other mechanics and native AI/Final Fight integration remain incomplete.'
for name in ['SCOPE.md']:
 src['web/'+name]+=('\n\n## Guile reversal recovery and genuine arcade clear\n\n'+text+'\n\n'+text2+'\n').encode()
s=src['web/about.html'].decode().replace('Complete Ryu, Ken and Cammy arcade clears','Complete Ryu, Ken, Cammy and Guile arcade clears').replace('Complete Ryu, Ken and Cammy arcade runs','Complete Ryu, Ken, Cammy and Guile arcade runs');s=s.replace('<p><a href="corresponding-source.zip">','<p>'+text+' '+text2+'</p><p><a href="corresponding-source.zip">');src['web/about.html']=s.encode()
s=src['web/index.html'].decode().replace('Complete Ryu, Ken and Cammy arcade runs','Complete Ryu, Ken, Cammy and Guile arcade runs');src['web/index.html']=s.encode()
reference=json.loads(src['web/reference-proof.json']);reference['previousReferenceWasmSHA256']=reference.get('referenceWasmSHA256',old_wasm);reference['referenceWasmSHA256']=new_wasm;reference['fullActualArcadeClears']=4;reference['guileReversalRecovery']=recovery;reference['guileArcadeClear']=clear;src['web/reference-proof.json']=json.dumps(reference,indent=2).encode()
src['qa/README.md']+=b'\nGuile reversal regression: node qa/ssf2t-guile-charge.browser.cjs. Full original-input clear: node qa/ssf2t-guile-arcade.browser.cjs. Set SF2_NATIVE_URL and SF2_NATIVE_ROM; install Playwright. Planning generated the input tapes offline; these browser replays do not plan or load states.\n'
src['source-files.json']=json.dumps(sorted(src),indent=2).encode()
with zipfile.ZipFile(out/'corresponding-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name,data in sorted(src.items()):
  info=zipfile.ZipInfo('source/'+name,(2026,11,26,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
proof=json.loads((r/'source-proof.json').read_text(encoding='utf-8'));proof['sourceFiles']=len(src);proof['sourceArchiveSHA256']=sha((out/'corresponding-source.zip').read_bytes());proof['guileReversalRecovery']=recovery;proof['guileArcadeClear']=clear;proof['fullActualArcadeClears']=4
for n in ['ssf2t-native.js','ssf2t-native.wasm']:proof['artifacts'][n]={'bytes':(out/n).stat().st_size,'sha256':sha((out/n).read_bytes())}
proof['packageVersion']=sha((proof['sourceArchiveSHA256']+json.dumps(proof['artifacts'],sort_keys=True)).encode());(out/'source-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
for n in ['SCOPE.md','SOURCE-LICENSES.md','about.html','index.html']:(out/n).write_bytes(src['web/'+n])
for n in ['SOURCE-LICENSES.md','about.html']:
 s=(out/n).read_text(encoding='utf-8')
 for link,digest in [('corresponding-source.zip',proof['sourceArchiveSHA256']),('source-proof.json',proof['packageVersion']),('SCOPE.md',proof['packageVersion']),('SOURCE-LICENSES.md',proof['packageVersion'])]:s=s.replace(link,link+'?v='+digest[:16])
 (out/n).write_text(s,encoding='utf-8')
s=(out/'index.html').read_text(encoding='utf-8').replace('__SSF2T_WASM_SHA256__',new_wasm).replace('about.html','about.html?v='+sha((out/'about.html').read_bytes())[:16])
for n in ['bridge.js','ai-combat.js','rom-loader.js','rom-manifest.js','ssf2t-native.js']:s=s.replace('src="'+n+'"','src="'+n+'?v='+sha((out/n).read_bytes())[:16]+'"')
(out/'index.html').write_text(s,encoding='utf-8')
allow=json.loads((r/'deployment-allowlist.json').read_text(encoding='utf-8'));allow['totalBytesWithoutThisManifest']=sum((out/n).stat().st_size for n in allow['files'] if n!='deployment-allowlist.json');(out/'deployment-allowlist.json').write_text(json.dumps(allow,indent=2)+'\n');assert set(p.name for p in out.iterdir())==set(allow['files'])
print(json.dumps({'sourceFiles':len(src),'changedNativeSources':len(changed),'wasmSHA256':new_wasm,'sourceArchiveSHA256':proof['sourceArchiveSHA256']}))
