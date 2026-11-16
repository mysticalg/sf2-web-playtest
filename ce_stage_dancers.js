/* Original CE Vegas walking dancers: 0x14b96..0x14bde and 0x22d8.
   Neutral walking loop only; result celebration controller remains separate. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEDANCERDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode()));let origin=null;
 function stateAt(actor,elapsed){let x=actor.x,face=actor.face,mode=actor.mode;for(let t=0,n=Math.max(0,Math.floor(elapsed))%176;t<n;t++){x+=mode===0?1:-1;if(mode===0&&x>=802){mode=2;face^=1;}else if(mode===2&&x<715){mode=0;face^=1;}}return {...SF2CESTAGEANIMATIONS.frameAt(actor,elapsed),x,face,mode};}
 function drawAt(ctx,index,cam,elapsed){const actor=D.actors.find(a=>a.layer===index);if(!actor)return false;const s=stateAt(actor,elapsed),im=images[actor.frames[s.index].images[s.face]];if(!im.complete)return false;ctx.drawImage(im,s.x-D.cameras[Math.max(0,Math.min(384,cam|0))]-48,64);return true;}
 function draw(ctx,stage,index,cam,tick){if(stage!==10||!D.actors.some(a=>a.layer===index))return false;if(origin===null)origin=tick;return drawAt(ctx,index,cam,tick-origin);}
 window.SF2CESTAGEDANCERS={ready,stateAt,drawAt,draw,reset(){origin=null;},data:D};
})();
