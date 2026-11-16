/* Original CE bird lifecycle 0x18ea6..0x19080. Cosmetic RNG stays independent. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEBIRDDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 let actors,recycled,delay,age,origin,seed;
 function reset(){actors=D.initial.map(a=>({...a}));recycled=[];delay=D.managerDelay;age=0;origin=null;seed=0x42495244;}
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
 function select(a,src){a.source=src;a.timer=D.frames[src].duration;}
 function tick(a){a.timer=(a.timer-1)&65535;if(!a.timer)select(a,D.frames[a.source].next);}
 function init(a,position){a.draw=false;a.main=2;a.phase=0;a.delay=32;a.x=((position[0]<<16)|(a.x&65535))>>>0;a.y=((position[1]<<16)|(a.y&65535))>>>0;a.vx=0;a.vy=0x4000;select(a,D.starts[0]);}
 function step(a){
  if(a.main!==2)return;
  a.draw=true;a.delay=(a.delay-1)&255;
  if(a.delay===0){a.draw=false;
   switch(a.phase){
    case 0:a.phase=2;a.delay=16;a.vy=0x8000;select(a,D.starts[1]);return;
    case 2:a.phase=4;a.delay=24;a.vy=0x10000;select(a,D.starts[2]);return;
    case 4:a.phase=6;a.delay=128;select(a,D.starts[3]);return;
    case 6:a.phase=8;a.delay=16;a.vy=-0x10000;select(a,D.starts[2]);return;
    case 8:a.phase=10;a.delay=8;select(a,D.starts[1]);return;
    case 10:a.phase=12;a.delay=16;a.vy=-0x8000;select(a,D.starts[0]);return;
    case 12:a.main=6;return;
   }
  }
  if(a.phase!==6){a.x=(a.x+a.vx)>>>0;a.y=(a.y-a.vy)>>>0;}
  tick(a);
 }
 function advance(now){if(origin===null)origin=now;let elapsed=Math.max(0,Math.floor(now-origin));if(elapsed<age){reset();origin=now;elapsed=0;}while(age<elapsed){actors=actors.filter(a=>{if(a.main!==6)return true;recycled.push(a);return false;});for(const a of actors){if(a.pending){init(a,a.position);delete a.pending;}else step(a);}delay=(delay-1)&255;if(!delay){delay=30;if(actors.length<3&&(random()&3)===0)actors.push({...recycled.pop(),pending:true,main:0,position:D.positions[(random()&30)>>1]});}age++;}}
 function drawAt(ctx,cam,states=actors){for(const a of states){if(a.main!==2||a.draw===false||!D.frames[a.source])continue;const f=D.frames[a.source],im=images[f.image];if(im.complete)ctx.drawImage(im,(a.x>>>16)-D.cameras[Math.max(0,Math.min(384,cam|0))]+f.left,240-(a.y>>>16)+f.top);}}
 function draw(ctx,cam,now){advance(now);drawAt(ctx,cam);}
 reset();window.SF2CESTAGEBIRDS={ready,reset,init,step,drawAt,draw,state(){return {age,delay,actors:actors.map(a=>({...a}))};},data:D};
})();
