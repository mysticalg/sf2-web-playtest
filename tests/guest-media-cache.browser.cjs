const {chromium,repo}=require('./browser-runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 const revisions={},walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 for(const dir of ['ai-ff','ai-heroes'])for(const file of walk(path.join(repo,dir)))if(/\.(png|mp3)$/.test(file))revisions[path.relative(repo,file).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,16);
 const preview=path.join(repo,'work','guest-media-cache-preview.html'),original=fs.readFileSync(path.join(repo,'index.html'),'utf8');
 const prior=JSON.parse(original.match(/window\.SF2BUILD=(\{[^;\r\n]*\});/)[1]);
 const html=original.replace('<head>','<head><base href="/">').replace(/window\.SF2BUILD=\{[^;\r\n]*\};/,'window.SF2BUILD='+JSON.stringify({...prior,commit:'a'.repeat(40),assetRevisions:revisions})+';');
 fs.writeFileSync(preview,html);
 const browser=await chromium.launch({args:['--disable-http2']}),page=await browser.newPage(),errors=[],media=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const u=new URL(r.url()),file=u.pathname.slice(1);if(file in revisions)media.push({file,v:u.searchParams.get('v')});});
 await page.goto('http://127.0.0.1:8765/work/guest-media-cache-preview.html?edition=ai',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>SF2.VER.loading===2,null,{timeout:90000});
 const result=await page.evaluate(async()=>{
  await SF2AIFF.prepareSound(new AudioContext());
  const rows=[];
  for(const [p1,p2]of [['sodom','belger'],['edi','damnd'],['guy','haggar'],['cody','abigail']]){
   await SF2AI.configure({p1,p2,mode:'versus',training:false,seed:42});SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   for(let i=0;i<30;i++)SF2.step([2,1]);
   rows.push(P.map(p=>({id:p.aiProfile,atlas:!!p.AIAtlas?.width,state:p.ST})));SF2.render();
  }
  return rows;
 });
 await page.screenshot({path:path.join(repo,'work','guest-media-cache.png')});
 fs.writeFileSync(path.join(repo,'work','guest-media-cache-result.json'),JSON.stringify({result,media,errors},null,2));
 await browser.close();
 assert.deepEqual(errors,[]);assert.ok(media.length>30);assert.ok(media.some(r=>r.file==='ai-ff/audio/12.mp3'));
 for(const r of media)assert.equal(r.v,revisions[r.file],r.file);
 for(const row of result)for(const fighter of row)assert.ok(fighter.atlas,fighter.id);
 console.log(JSON.stringify({matches:result.length,mediaRequests:media.length,revisionedFiles:Object.keys(revisions).length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
