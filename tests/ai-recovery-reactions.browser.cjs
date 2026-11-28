const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const kicks=[],burns=[];
  for(const variant of['sagat','evil-sagat'])for(const side of[0,1])for(const distance of[40,75,110,210])for(const guard of[false,true]){
   await SF2AI.configure({p1:side?'andore':variant==='sagat'?'ryu':variant,p2:side?variant==='sagat'?'ryu':variant:'andore',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;
   const w=P[side],d=w.opp;if(variant==='sagat'){AICFG.selectedProfiles[side]=null;setfighter(w,9);resetround();G.gph=1;}
   w.WINS=d.WINS=0;w.X=360*256;d.X=w.X+(side?-distance:distance)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;d.HP=1000;d.STP=0;
   const frames=[],events=[],old=hpDamage;hpDamage=function(p,n,...rest){if(p===d&&n>0)events.push({tick:G.tick,entry:w.aidx,hp:p.HP});return old(p,n,...rest);};
   const pair=[0,0];pair[side]=512;pair[d.i]=guard?(side?1:2):0;SF2.step(pair);for(let n=0;n<110;n++){pair[side]=0;SF2.step(pair);if(w.ST===1&&w.aidx>=2&&w.aidx<=3)frames.push({tick:G.tick,entry:w.aidx,hitdone:w.hitdone,box:boxw(w,4),hurt:[0,1,2].map(k=>boxw(d,k)),region:hurtregion(boxw(w,4),d),state:d.ST,probe:hitprobe(w),positions:[w.X/256,d.X/256]});}hpDamage=old;
   kicks.push({variant,side,distance,guard,events,frames,damage:1000-d.HP,combo:w.AIMetrics.maxCombo});
  }
  for(const profile of['damnd','andore','abigail','sodom','rolento','edi','belger','cody','guy','haggar'])for(const code of[24,34])for(const fatal of[false,true]){
   await SF2AI.configure({p1:'ryu',p2:profile,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;const d=P[1];d.HP=fatal?0:aiMax(d);d.WINS=0;
   SF2CESPECIAL.start(d,{record:[0,0,0,0,0,1,0,0,2],reactionCode:code,strength:2,profile:{projectile:false}},1,ceDizzyHooks(),fatal);
   SF2.step([0,0]);const a=SF2CESPECIAL.art(d,false),rendered=fighterArtBase0(d);burns.push({profile,code,fatal,name:d.anim.name,native:!!a,same:!!a&&a.image===rendered.image&&JSON.stringify(a.rect)===JSON.stringify(rendered.rect),rect:rendered.rect});
  }
  return{kicks,burns};
 });
 fs.writeFileSync(artifacts('ai-recovery-reactions.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({errors,kicks:result.kicks.map(({frames,...r})=>r),burnFailures:result.burns.filter(r=>!r.native||!r.same)},null,2));assert.deepEqual(errors,[]);
 for(const r of result.kicks){assert.ok(r.events.length<=2);assert.equal(new Set(r.events.map(e=>e.entry)).size,r.events.length);if(r.distance===75&&!r.guard){assert.deepEqual(r.events.map(e=>e.entry),[2,3]);assert.ok(r.combo>=2);}if(r.distance===40&&!r.guard)assert.deepEqual(r.events.map(e=>e.entry),[2]);if(r.distance===110&&!r.guard)assert.deepEqual(r.events.map(e=>e.entry),[3]);if(r.distance===210)assert.equal(r.events.length,0);if(r.guard)assert.equal(r.damage,0);}
 for(const r of result.burns){assert.ok(r.native,JSON.stringify(r));assert.ok(r.same,JSON.stringify(r));}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
