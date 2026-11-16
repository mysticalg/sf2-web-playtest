/* Honda water controller: original CE 0x178c0..0x1798e, animation 0x22d8.
   Scenery randomness is local and never consumes combat RNG. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEWATERDATA,SD=window.SF2CESTAGESPRAYDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),sprayImages=SD.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all([...images,...sprayImages].map(im=>im.decode()));
 let actors,fan,age,origin,seed,spraySeed,sprays,recycled,sprayLatch,layerCache=null;
 function reset(){actors=D.initial.map(a=>({...a}));fan={...D.fan.initial,shown:D.fan.base};age=0;origin=null;seed=0x534632;spraySeed=0x53505259;sprays=SD.initial.map(a=>({...a}));recycled=[];sprayLatch=false;layerCache=null;}
 function randomWord(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
 function random(){return D.holds[randomWord()&7];}
 function select(a,src){a.source=src;const f=D.frames[src];a.timer=f.duration;a.flags=f.flags;}
 function tick(a){a.timer=(a.timer-1)&65535;if(!a.timer)select(a,D.frames[a.source].next);}
 function step(a,hold=random){
  switch(a.phase){
   case 0:a.phase=2;a.y=((a.high<<16)|(a.y&65535))>>>0;select(a,D.starts[0][a.subtype]);break;
   case 2:if((a.flags&255)===1){a.phase=4;a.delay=hold(a);}else tick(a);break;
   case 4:a.delay=(a.delay-1)&255;if(!a.delay){a.phase=6;a.vy=0;}break;
   case 6:if((a.flags&255)===2)a.phase=8;else tick(a);break;
   case 8:a.vy=Math.max(-1024,a.vy-24);a.y=(a.y+a.vy*256)>>>0;if((a.y>>>16)<=a.low){a.phase=10;select(a,D.starts[1][a.subtype]);}break;
   case 10:if(a.flags&255)a.phase=0;tick(a);break;
  }
 }
 function fanStep(a,hold=()=>D.fan.holds[randomWord()&7]){
  const select=src=>{a.source=src;a.timer=D.fan.frames[src].duration;a.flags=D.fan.frames[src].flags;};
  if(a.phase===0){a.phase=2;a.delay=hold();}
  else if(a.phase===2){a.delay=(a.delay-1)&255;if(!a.delay){a.phase=4;a.delay=50;}}
  else if(a.phase===4){a.delay=(a.delay-1)&255;if(!a.delay){a.phase=0;select(0x17576);}else{a.timer=(a.timer-1)&65535;if(!a.timer)select(D.fan.frames[a.source].next);}}
  const index=a.flags&15;
  if(index!==a.last){a.last=index;a.pending=1;}
  else if(a.pending){a.pending=0;a.shown=D.fan.images[index>>1];}
 }
 // Original secondary spray0x185d8..0x1868c, separate cosmetic RNG.
 function sprayRandom(){spraySeed^=spraySeed<<13;spraySeed^=spraySeed>>>17;spraySeed^=spraySeed<<5;return spraySeed>>>0;}
 function sprayStep(a,choose=kind=>kind==='delay'?1+(sprayRandom()&7):63-(sprayRandom()&3)){
  const select=src=>{const f=SD.frames[src];a.source=src;a.timer=f.duration;a.flags=f.flags;},tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer)select(SD.frames[a.source].next);};
  a.draw=false;if(a.main===4)return false;
  if(a.main===0){a.main=2;select(0x18690);return true;}
  a.draw=true;
  switch(a.phase){
   case 0:tick();if(a.flags){a.phase=2;a.vy=-128;a.delay=choose('delay');}break;
   case 2:a.delay=(a.delay-1)&255;if(!a.delay){a.phase=4;a.low=choose('low');}break;
   case 4:a.vy=((a.vy-32+32768)&65535)-32768;a.y=(a.y+a.vy*256)>>>0;if((a.y>>>16)<=a.low){a.phase=6;a.delay=15;a.y=((a.low<<16)|(a.y&65535))>>>0;select(0x186c0);}break;
   case 6:a.delay=(a.delay-1)&255;if(!a.delay){a.main=4;a.phase=0;}tick();break;
  }
  return true;
 }
 function sprayAdvance(){
  sprays=sprays.filter(a=>{if(sprayStep(a))return true;recycled.push(a);return false;});
 }
 function spraySpawn(){
  if((fan.flags&15)!==6){sprayLatch=false;return;}if(sprayLatch)return;sprayLatch=true;
  for(let i=9;i>=0;i--)if(sprayRandom()&1){const old=recycled.pop()||{},pos=SD.positions[i];sprays.push({...old,main:0,phase:0,x:SD.fan.x+pos[0],y:(((SD.fan.y+pos[1])<<16)|((old.y||0)&65535))>>>0,depth:SD.fan.depth,draw:false});}
 }
 function sprayDrawAt(ctx,cam,states=sprays){for(const a of states){if(a.draw===false||!SD.frames[a.source])continue;const f=SD.frames[a.source],im=sprayImages[f.image];if(im.complete)ctx.drawImage(im,a.x-SD.cameras[Math.max(0,Math.min(384,cam|0))]+f.left,240-(a.y>>>16)+f.top);}}
 function advance(tickNow){if(origin===null)origin=tickNow;let elapsed=Math.max(0,Math.floor(tickNow-origin));if(elapsed<age){reset();origin=tickNow;elapsed=0;}while(age<elapsed){sprayAdvance();fanStep(fan);spraySpawn();actors.forEach(a=>step(a));age++;}}
 function layer(stage,index,base,tickNow){if(stage!==1||index!==D.fan.layer)return base;advance(tickNow);if(layerCache?.shown===fan.shown&&layerCache.base===base)return layerCache.image;const im=images[fan.shown];if(!im.complete||!base.complete)return base;const c=document.createElement('canvas');c.width=base.naturalWidth;c.height=base.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(base,0,0);ctx.clearRect(D.fan.x,D.fan.y,336,16);ctx.drawImage(im,D.fan.x,D.fan.y);layerCache={shown:fan.shown,base,image:c};return c;}
 function drawAt(ctx,cam,states=actors){for(const a of states){const f=D.frames[a.source],im=images[f.image];if(im.complete)ctx.drawImage(im,a.x-D.cameras[a.depth][Math.max(0,Math.min(384,cam|0))]+f.left,240-(a.y>>>16)+f.top);}}
 function draw(ctx,stage,index,cam,tickNow){if(stage!==1||index!==5)return false;advance(tickNow);drawAt(ctx,cam);sprayDrawAt(ctx,cam);return true;}
 reset();window.SF2CESTAGEWATER={ready,reset,step,fanStep,sprayStep,sprayDrawAt,sprayState(){return {age,latch:sprayLatch,actors:sprays.map(a=>({...a}))};},layer,drawAt,draw,data:D,sprayData:SD};
})();
