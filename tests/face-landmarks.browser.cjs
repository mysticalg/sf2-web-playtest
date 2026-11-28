const {chromium,url,artifacts,repo}=require('./browser-runtime.cjs'),fs=require('fs'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const oldBox={window:{}},newBox={window:{}};vm.runInNewContext(cp.execFileSync('git',['show','5726497:ai_evil_eyes_data.js'],{cwd:repo,encoding:'utf8'}),oldBox);vm.runInNewContext(fs.readFileSync(repo+'/ai_evil_eyes_data.js','utf8'),newBox);
for(const [id,frames]of Object.entries(oldBox.window.SF2AIEVILEYES.frames))if(id!=='sodom')assert.equal(JSON.stringify(newBox.window.SF2AIEVILEYES.frames[id]),JSON.stringify(frames),id+' eye map changed');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[],eyeRows=[],views=[],viewCounts={};
  const crop=art=>{const r=art.rect,c=document.createElement('canvas');c.width=r[2];c.height=r[3];c.getContext('2d').drawImage(art.image,...r.slice(0,4),0,0,c.width,c.height);return c;};
  for(const profile of['ryu','ken','evil-sagat','abigail','andore','edi','evil-sodom']){
   await SF2AI.configure({p1:profile,p2:'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;G.gph=1;const p=P[0];p.HP=Math.max(1,Math.floor(aiMax(p)*.08));p.X=340*256;p.Y=7*256;AI_BLOOD.clothes[0]=0;
   const seen=new Set();for(const slot of[0,1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,20,21,22,28,29]){
    const a=p.F.anims[slot];if(!a)continue;for(let entry=0;entry<a.ents.length;entry++){
     const frame=a.ents[entry][0];if(seen.has(frame))continue;seen.add(frame);setanim(p,slot,entry);p.ST=slot>=53&&slot<=64?2:slot===28?7:slot===29?8:slot>=20&&slot<=22?5:slot===3?3:slot>=8?1:0;
     const started=performance.now(),base=fighterArtBase(p),landmark=aiFaceLandmark(p,base),region=aiFaceRegion(p,base),reviewed=SF2AIEVILEYES.frames[SF2AIEVIL.base(p)]?.[base.nativeEyeFrame],rendered=fighterArt(p),before={tick:G.tick,ST:p.ST,cur:p.cur,entry:p.aidx,HP:p.HP};
     const stable=JSON.stringify(region),texture=rendered.image;let stableFacing=true,stableMovement=true,stableHitbox=true,allocations=0;const create=document.createElement;
     document.createElement=function(name,...args){if(name==='canvas')allocations++;return create.call(this,name,...args);};
     try{for(let n=0;n<16;n++){p.X=340*256+n;p.Y=7*256+n;p.FACE=n%2;if(JSON.stringify(aiFaceRegion(p,fighterArtBase(p)))!==stable)stableFacing=false;if(fighterArt(p).image!==texture)stableMovement=false;}}
     finally{document.createElement=create;}
     // A descriptor's collider can change without changing a single facial pixel.
     const original=p.anim.ents[p.aidx];p.anim={...p.anim,ents:p.anim.ents.map(e=>e.slice())};p.anim.ents[p.aidx][2]=[30,40,35,30];stableHitbox=JSON.stringify(aiFaceRegion(p,fighterArtBase(p)))===stable;p.anim=a;
     rows.push({profile,frame,slot,entry,initialMilliseconds:performance.now()-started,landmark,region,reference:!!AI_CLOTH_SOURCES.get(base.image),templateCount:AI_FACE_LANDMARKS.get(AI_CLOTH_SOURCES.get(base.image)?.image)?.get(SF2AIEVIL.base(p)+':templates')?.length,reviewed:!!reviewed,stableFacing,stableMovement,stableHitbox,allocations,pure:JSON.stringify(before)===JSON.stringify({tick:G.tick,ST:p.ST,cur:p.cur,entry:p.aidx,HP:p.HP})});
     if((viewCounts[profile]||0)<8&&(landmark?.source==='matched'||reviewed&&slot<4)){viewCounts[profile]=(viewCounts[profile]||0)+1;const raw=crop(base),hurt=crop(rendered);views.push({profile,frame,source:landmark?.source||'none',raw:raw.toDataURL(),hurt:hurt.toDataURL()});}
    }
   }
   if(profile==='evil-sodom')for(const [key,points]of Object.entries(SF2AIEVILEYES.frames.sodom)){
    const frame=+key,rect=p.F.frames[frame];if(!rect)throw Error('Missing mapped Sodom frame '+frame);p.anim={...p.F.anims[0],ents:[[frame,8,[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],0,0,0,0]],guest:true};p.aidx=0;p.ST=0;p.HP=aiMax(p);p.Y=0;p.FACE=0;const raw=fighterArtBase(p),paint=SF2AIEVIL.art(p,raw,frame),raster=crop(raw),source=raster.getContext('2d').getImageData(0,0,raster.width,raster.height).data,after=crop(paint).getContext('2d').getImageData(0,0,raster.width,raster.height).data;
    let transparent=0,trim=0,notRed=0;for(const [x,y]of points){const at=(y*raster.width+x)*4;transparent+=source[at+3]!==255;trim+=source[at]+source[at+1]+source[at+2]>480;notRed+=after[at]!==248||after[at+1]!==0||after[at+2]!==0;}
    eyeRows.push({frame,points,transparent,trim,notRed});if([2,18,19,20].includes(frame))views.push({profile:'Sodom visor',frame,source:'corrected',raw:raster.toDataURL(),hurt:crop(paint).toDataURL()});
   }
  }
  const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=Math.ceil(views.length/5)*180;const ctx=sheet.getContext('2d');ctx.fillStyle='#34424c';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.imageSmoothingEnabled=false;ctx.font='10px monospace';
  for(let n=0;n<views.length;n++){const v=views[n],raw=new Image(),hurt=new Image();raw.src=v.raw;hurt.src=v.hurt;await Promise.all([raw.decode(),hurt.decode()]);const x=n%5*200,y=Math.floor(n/5)*180,scale=Math.min(1.3,90/raw.width,145/raw.height);ctx.fillStyle='#fff';ctx.fillText(v.profile+' '+v.frame+' '+v.source,x+2,y+11);ctx.drawImage(raw,x,y+24,raw.width*scale,raw.height*scale);ctx.drawImage(hurt,x+100,y+24,hurt.width*scale,hurt.height*scale);}
  return{rows,eyeRows,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync(artifacts('face-landmarks.png'),Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;fs.writeFileSync(artifacts('face-landmarks.json'),JSON.stringify({result,errors},null,2));const bad=result.rows.filter(r=>!r.stableFacing||!r.stableMovement||!r.stableHitbox||r.allocations||!r.pure);console.log(JSON.stringify({cases:result.rows.length,matched:result.rows.filter(r=>r.landmark?.source==='matched').length,reviewed:result.rows.filter(r=>r.reviewed).length,hidden:result.rows.filter(r=>!r.region).length,eyes:result.eyeRows.length,bad,eyeFailures:result.eyeRows.filter(r=>r.transparent||r.trim||r.notRed),errors},null,2));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);assert.ok(result.rows.some(r=>r.landmark?.source==='matched'));assert.ok(result.eyeRows.every(r=>!r.transparent&&!r.trim&&!r.notRed));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
