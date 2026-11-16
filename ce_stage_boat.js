/* Ken boat controller 0x156e2 and far-camera offset 0x9cbfa. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEBOATDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 let state,age,origin,seed;
 function reset(){state={...D.initial,displayBob:D.initial.flags&15};age=0;origin=null;seed=0x424f4154;}
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
 function step(a,tick){a.displayBob=a.flags&15;if(tick){a.timer=(a.timer-1)&65535;if(!a.timer){a.source=D.frames[a.source].next;const f=D.frames[a.source];a.timer=f.duration;a.flags=f.flags;}}return a;}
 function advance(now){if(origin===null)origin=now;let t=Math.max(0,Math.floor(now-origin));if(t<age){reset();origin=now;t=0;}while(age<t){step(state,!!(D.mask&(1<<(random()&15))));age++;}}
 function drawAt(ctx,cam,a=state){const f=D.frames[a.source],im=images[f.image];if(im.complete)ctx.drawImage(im,a.x-D.cameras[Math.max(0,Math.min(384,cam|0))]+f.left,240-a.y-(a.flags&15)+f.top);}
 reset();window.SF2CESTAGEBOAT={ready,reset,step,advance,drawAt,get state(){return {...state};},get offset(){return (D.initial.flags&15)-state.displayBob;},data:D};
})();
