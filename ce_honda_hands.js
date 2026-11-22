/* CE Hundred Hand Slap, input0x3e23c..0x3e344 and controller0x3e996..0x3eae0. */
'use strict';
(()=>{
 const prior=window.SF2CESPECIALS,D=window.SF2CEHONDAHANDSDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 function register(p){let slots=registered.get(p.F);if(slots)return slots;slots=D.poses.map(a=>{const n=p.F.anims.length;p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});return n;});registered.set(p.F,slots);Object.assign(SF2CESHADOWDATA.selectors,D.shadows);for(const[source,index]of Object.entries(D.frames))if(index)SF2CECOMBATDATA.fighters[1].frames[source]=index;return slots;}
 function input(p,edges){const c=p.CEHHSInput||(p.CEHHSInput={timer:[15,12,9],count:[0,0,0]});p.CEHHSEdges=edges;for(let i=0;i<3;i++){if(edges&(1<<i)){c.count[i]++;c.timer[i]=[15,12,9][i];}else if(!--c.timer[i]){c.count[i]=0;c.timer[i]=[15,12,9][i];}}for(let i=0;i<3;i++)if(edges&(1<<i)&&c.count[i]>=4)return ['mash','P',i];return null;}
 function art(p,alternate){if(!p.anim?.ceHondaHands)return null;const a=p.anim.extraArt[p.aidx];return{image:images[a.images[alternate?1:0]],rect:a.rect};}
 function probe(p){const c=p.CES;if(c?.kind!=='hundredhands')return;const group=window.SF2CECOMBAT.record(p)?.[5];if(group!==c.group){p.hitdone=0;c.group=group;}}
 window.SF2CEHONDAHANDS={ready,register,input,art,probe};
 window.SF2CESPECIALS={
  init(p,m,h){if(p.fid!==1||m.inp!=='mash'||m.btn!=='P')return prior.init(p,m,h);const slots=register(p);p.CES={kind:'hundredhands',move:m,phase:0,strength:p.SPSTR,time:15,slots,group:null};p.VQ=null;h.anim(p,slots[p.SPSTR],0);p.acc=0;return true;},
  step(p,h){const c=p.CES;if(c?.kind!=='hundredhands')return prior.step(p,h);if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}const flags=p.anim.flags[p.aidx];if(c.phase===2){if(flags){p.CES=null;h.idle(p);}return true;}if(c.phase===0){if(!flags)return true;c.phase=1;}
   if(flags&0x8000)h.sound(0x47);if(window.SF2.G.gph!==1){c.phase=2;h.anim(p,c.slots[3+c.strength],0);p.acc=-1;return true;}
   let strength=-1;for(let i=0;i<3;i++)if((p.CEHHSEdges||0)&(1<<i)){strength=i;break;}
   if(strength>=0&&[0,3,6][strength]<c.time){c.time=15;if(strength!==c.strength){const entry=Math.max(2,Math.min(7,(flags&0x1ff)/24));c.strength=p.SPSTR=strength;h.anim(p,c.slots[strength],entry);p.acc=-1;}}
   else if(!--c.time){c.phase=2;h.anim(p,c.slots[3+c.strength],0);p.acc=-1;return true;}
   const direction=p.KEYS&15;if(direction===1)p.X-=p.FACE?0xc0:0x120;else if(direction===2)p.X+=p.FACE?0x120:0xc0;
   return true;
  }
 };
})();
