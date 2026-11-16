/* Original CE scroll animation loops, native 0x432c and tile writes 0x4358.
   Only admitted source/timer/raster fixtures; sprite props and result branches stay separate. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEANIMATIONDATA;if(!D)throw Error('CE stage animation data missing');
 const images=D.images.map(url=>{const im=new Image();im.src=url;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 let origin=null,lastStage=-1;const cache=new Map();
 function frameAt(actor,elapsed){
  let t=Math.max(0,Math.floor(elapsed)),first=actor.timer;
  for(let i=1;i<actor.frames.length;i++)first+=actor.frames[i].duration;
  let start=0;
  if(t>=first){t-=first;start=actor.loop;const period=actor.frames.slice(start).reduce((s,f)=>s+f.duration,0);t%=period;}
  for(let i=start;i<actor.frames.length;i++){const duration=i===0&&start===0&&elapsed<first?actor.timer:actor.frames[i].duration;if(t<duration)return {index:i,source:actor.frames[i].source,timer:duration-t};t-=duration;}
  throw Error('Invalid native stage animation schedule');
 }
 function reset(){origin=null;lastStage=-1;cache.clear();}
 function layer(stage,index,base,tick){
  const actors=D.stages[stage]?.filter(a=>a.layer===index);if(!actors?.length)return base;
  if(lastStage!==stage||origin===null){origin=tick;lastStage=stage;cache.clear();}
  const states=actors.map(a=>frameAt(a,tick-origin)),key=states.map(s=>s.index).join(',');let entry=cache.get(index);
  if(entry?.key===key&&entry.base===base)return entry.image;
  if(!base.complete||!base.naturalWidth||actors.some((a,i)=>!images[a.frames[states[i].index].image].complete))return base;
  const canvas=document.createElement('canvas');canvas.width=base.naturalWidth;canvas.height=base.naturalHeight;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
  actors.forEach((a,i)=>{ctx.clearRect(a.x,a.y,a.width,a.height);ctx.drawImage(images[a.frames[states[i].index].image],a.x,a.y);});
  cache.set(index,{key,base,image:canvas});return canvas;
 }
 window.SF2CESTAGEANIMATIONS={ready,frameAt,reset,layer,data:D,scope:'43 admitted scroll3 idle actors across7 stages. Scroll1 culling, palette lamps, sprite props and result-dependent branches pending.'};
})();
