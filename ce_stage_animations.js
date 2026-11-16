/* Original CE scroll animation loops, native 0x432c and tile writes 0x4358.
   Only admitted source/timer/raster fixtures; sprite props and result branches stay separate. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEANIMATIONDATA;if(!D)throw Error('CE stage animation data missing');
 const images=D.images.map(url=>{const im=new Image();im.src=url;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 let origin=null,lastStage=-1;const cache=new Map();
 let elephantState=null,elephantAge=0,elephantSeed=0x454c45;
 function elephantReset(){elephantState=D.elephants?JSON.parse(JSON.stringify(D.elephants.initial)):null;elephantAge=0;elephantSeed=0x454c45;}
 function elephantRandom(){elephantSeed^=elephantSeed<<13;elephantSeed^=elephantSeed>>>17;elephantSeed^=elephantSeed<<5;return elephantSeed>>>0;}
 function elephantStep(state,choose){
  const select=(a,source)=>{const f=D.stages[7].find(v=>v.address===a.address).frames.find(f=>f.source===source);a.source=source;a.timer=f.duration;};
  for(const a of state.actors){
   if(a.phase===0){if(a.request){a.phase=2;a.request=0;a.active=1;a.delay=112;select(a,D.stages[7].find(v=>v.address===a.address).start);}}
   else if(a.phase===2){a.delay=(a.delay-1)&255;if(!a.delay){a.phase=0;a.active=0;}a.timer=(a.timer-1)&65535;if(!a.timer){const f=D.stages[7].find(v=>v.address===a.address).frames.find(f=>f.source===a.source);select(a,f.next);}}
  }
  const m=state.manager;
  if(m.phase===0){m.phase=2;m.delay=choose?choose('delay'):D.elephants.holds[elephantRandom()&7];}
  else if(m.phase===2){m.delay=(m.delay-1)&65535;if(!m.delay){m.phase=0;const index=choose?choose('pick'):elephantRandom()&3,a=state.actors.find(a=>a.address===D.elephants.order[index]);if(!a.active)a.request=1;}}
 }
 function elephantAt(actor,elapsed){if(!elephantState||elapsed<elephantAge)elephantReset();while(elephantAge<elapsed){elephantStep(elephantState);elephantAge++;}const a=elephantState.actors.find(a=>a.address===actor.address);return {index:actor.frames.findIndex(f=>f.source===a.source),source:a.source,timer:a.timer};}
 function frameAt(actor,elapsed){
  let t=Math.max(0,Math.floor(elapsed)),first=actor.timer;
  if(actor.controller==='elephant')return elephantAt(actor,t);
  for(let i=1;i<actor.frames.length;i++)first+=actor.frames[i].duration;
  let start=0;
  if(t>=first){t-=first;start=actor.loop;const period=actor.frames.slice(start).reduce((s,f)=>s+f.duration,0);t%=period;}
  for(let i=start;i<actor.frames.length;i++){const duration=i===0&&start===0&&elapsed<first?actor.timer:actor.frames[i].duration;if(t<duration)return {index:i,source:actor.frames[i].source,timer:duration-t};t-=duration;}
  throw Error('Invalid native stage animation schedule');
 }
 function reset(){origin=null;lastStage=-1;cache.clear();elephantReset();}
 function layer(stage,index,base,tick){
  const actors=D.stages[stage]?.filter(a=>a.layer===index);if(!actors?.length)return base;
  if(lastStage!==stage||origin===null){origin=tick;lastStage=stage;cache.clear();}
  const states=actors.map(a=>frameAt(a,tick-origin)),indices=actors.map((a,i)=>{const f=a.frames[states[i].index];return f.paletteImages?f.paletteImages[1+(window.SF2CESTAGEPALETTES?.lampPhase(tick-origin)??-1)]:f.image;}),key=indices.join(',');let entry=cache.get(index);
  if(entry?.key===key&&entry.base===base)return entry.image;
  if(!base.complete||!base.naturalWidth||actors.some((a,i)=>!images[indices[i]].complete))return base;
  const canvas=document.createElement('canvas');canvas.width=base.naturalWidth;canvas.height=base.naturalHeight;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
  actors.forEach((a,i)=>{if(a.bands?.length){for(const b of a.bands){ctx.clearRect(b.x,a.y+b.y0,a.width,b.y1-b.y0);ctx.drawImage(images[indices[i]],0,b.y0,a.width,b.y1-b.y0,b.x,a.y+b.y0,a.width,b.y1-b.y0);}}else{ctx.clearRect(a.x,a.y,a.width,a.height);ctx.drawImage(images[indices[i]],a.x,a.y);}});
  cache.set(index,{key,base,image:canvas});return canvas;
 }
 function top(stage,index,ctx,tick){for(const a of D.stages[stage]||[]){if(a.layer!==index||a.y>=0)continue;const s=frameAt(a,Math.max(0,tick-(origin??tick))),f=a.frames[s.index],id=f.paletteImages?f.paletteImages[1+(window.SF2CESTAGEPALETTES?.lampPhase(tick-origin)??-1)]:f.image,h=Math.min(a.height,-a.y);ctx.clearRect(a.x,a.y+32,a.width,h);ctx.drawImage(images[id],0,0,a.width,h,a.x,a.y+32,a.width,h);}}
 window.SF2CESTAGEANIMATIONS={ready,frameAt,reset,layer,top,elephantStep,data:D,scope:'57 scroll2/scroll3 idle loops and four conditional elephants. Remaining sprite props and result-dependent branches pending.'};
})();
