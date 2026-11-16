/* Native CE camera 0x9c880, near parallax 0x9ca50, far parallax 0x9cb84.
   Camera sampling precedes actor simulation. Fractional layer coordinates persist. */
'use strict';
(()=>{
 const D=window.SF2CECAMERADATA,decode=url=>{const im=new Image();im.src=url;return im;},stages=D.stages.map(s=>({...s,layers:s.layers.map(l=>({...l,im:decode(l.top)}))})),ryu=D.ryu.map(p=>({...p,im:decode(p.top)}));
 const ready=Promise.all([...stages.flatMap(s=>s.layers.map(l=>l.im)),...ryu.map(p=>p.im)].map(im=>im.decode())),pads=new WeakMap();
 let state,poses=null;
 function reset(){state={main:0,near:0,far:0,delta:0,direction:0};poses=null;}
 function controller(s,rawY,ignore,gates,bounds){
  if(gates.throw||gates.shake)return s;
  const y=Math.min(168,Math.max(...rawY.map((v,i)=>ignore[i]?40:v&65535))),target=((y-40)&65535)>>>3,d=target-s.main;
  s.direction=d<0?8:0;const old=s.main,next=s.main+Math.max(-2,Math.min(2,d));s.main=d<0?Math.max(bounds.min,next):Math.min(bounds.max,next);s.delta=s.main-old;return s;
 }
 function parallax(fixed,type,delta,main,near){
  if(type===0)return fixed;if(type===2)return (fixed&65535)|(main<<16);
  const rates=near?{4:32768,6:81920,8:73728,10:57344,12:40960,14:65536}:{4:49152,6:32768,8:57344,10:81920};
  if(type===12&&!near)return (fixed&65535)|(main<<16);return fixed+delta*(rates[type]||0);
 }
 function step(stage,players,gates={}){const s=stages[stage];state.delta=0;controller(state,players.map(p=>40+(p.Y>>8)),players.map(p=>!!p.CECameraIgnore),gates,s);if(!gates.shake){state.near=parallax(state.near,s.types[0],state.delta,state.main,true);state.far=parallax(state.far,s.types[2],state.delta,state.main,false);}return state;}
 function offset(stage,index){const L=stages[stage].layers[index].nativeLayer;if(stage===0&&index===4)return state.far>>16;return L===1?state.near>>16:L===3?(state.far>>16)+(stage===4?(window.SF2CESTAGEBOAT?.offset||0):0):state.main;}
 function pad(base,top,key,paint){let rows=pads.get(base);if(!rows){rows=new Map();pads.set(base,rows);}if(rows.has(key))return rows.get(key);if(!top.complete||!(base.width||base.naturalWidth))return base;const c=document.createElement('canvas');c.width=base.naturalWidth||base.width;c.height=256;const x=c.getContext('2d');x.drawImage(top,0,0);x.drawImage(base,0,32);if(paint)paint(x);rows.set(key,c);return c;}
 function image(stage,index,base,tick){return pad(base,stages[stage].layers[index].im,stage+':'+index,ctx=>window.SF2CESTAGEANIMATIONS?.top(stage,index,ctx,tick));}
 function padRyu(index,base){return pad(base,ryu[index-3].im,'ryu:'+index);}
 function latch(players){poses=players.map(p=>({...p,CECLAW:p.CECLAW?{...p.CECLAW}:undefined}));}
 reset();window.SF2CECAMERA={ready,reset,controller,parallax,step,offset,image,padRyu,latch,get poses(){return poses;},get state(){return state;},data:D};
})();
