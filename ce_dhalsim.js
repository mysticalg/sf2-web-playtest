/* Original Dhalsim432a6 parent and32406 pool4 Yoga Flame object. */
'use strict';
(()=>{
 const D=window.SF2CEDHALSIMDATA,O=window.SF2CEOBJECTS,prior=window.SF2CESPECIALS,PARENT={step(a,D,h){
 const tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer){a.source=D.frames[a.source].next;const f=D.frames[a.source];a.timer=f.duration;a.flags=f.flags;}};
 if(a.stop){a.stop=(a.stop-1)&255;return;}
 if(a.phase===0){a.phase=2;h.sound(0x85);a.voiceTimer=10;a.source=D.sources[(a.strength>>1)+(a.selector?3:0)];a.timer=D.frames[a.source].duration;a.flags=D.frames[a.source].flags;return;}
 if(a.phase===2){
  if((a.flags&255)!==1){tick();return;}
  a.phase=4;const b=h.allocate();
  if(b){const word=(v,n)=>(((n&65535)<<16)|(v&65535))>>>0;b.used=1;b.kind=a.selector?2:1;b.x=word(b.x,a.x>>>16);b.y=word(b.y,a.y>>>16);b.face=a.face;b.strength=a.strength;b.owner=a.address;a.companion=b.address;if(a.selector)h.sound(0x6f);}
  if(!a.selector)a.recovery=D.fireRecovery[a.strength>>1];tick();return;
 }
 if(a.phase!==4)throw Error('Unknown native Yoga phase '+a.phase);
 if(a.selector){if(!a.companion){h.idle(a);return;}}
 else{a.recovery=(a.recovery-1)&255;if(!a.recovery){h.idle(a);return;}}
 a.voiceTimer=(a.voiceTimer-1)&65535;if(!a.voiceTimer)h.sound(a.selector?0x6f:0x6e);tick();
}},FLAME={step(a,parent,D,collision,release){
 const word=(v,n)=>(((n&65535)<<16)|(v&65535))>>>0;
 const select=source=>{a.source=source;a.timer=D.frames[source].duration;a.flags=D.frames[source].flags;};
 const tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer)select(D.frames[a.source].next);};
 if(a.main===0){a.main=2;a.priority=1;a.orientation=a.face^1;a.group=1;a.health=0x100;a.hitPointer=0x335c2;a.hurtPointer=0x3362e;a.x=word(a.x,(a.x>>>16)+(a.face?-0x48:0x48));a.y=word(a.y,(a.y>>>16)+0x1e);select(D.sources[a.strength>>1]);return false;}
 if(a.main===2){
  collision(a);
  const offset=D.offsets[parent.flags&255];if(!offset)throw Error('Invalid source flame owner flag '+parent.flags);
  a.x=word(a.x,(parent.x>>>16)+(a.face?-offset[0]:offset[0]));a.y=word(a.y,(parent.y>>>16)+offset[1]);
  const retire=()=>{a.main+=2;if(a.health===65535){a.main+=2;parent.companion=0;}};
  if(parent.health&32768||parent.main===4||parent.state===0x0e||parent.cancel){retire();return false;}
  if(a.health&32768){select(D.sources[3]);a.health=0;}
  if(a.flags&32768){retire();return false;}
  tick();return true;
 }
 if(a.main===4){a.main=6;parent.companion=0;return false;}
 if(a.main===6){release(a);return false;}
 throw Error('Unknown source flame main '+a.main);
}};
 const images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 function register(p){if(p.fid!==7)return null;Object.assign(SF2CESHADOWDATA.selectors,D.shadows);Object.assign(SF2CEREACTIONDATA.postures,D.postures);const combat=SF2CECOMBATDATA.fighters[7];for(const key of["frames","postures","criticalBoxes"])Object.assign(combat[key],D.drillCombat[key]);if(registered.has(p.F))return registered.get(p.F);const poses={},slots=[];for(const a of[...D.parents,...D.drills]){slots.push(p.F.anims.length);p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slots[slots.length-1],i];}const q={poses,slots};registered.set(p.F,q);return q;}
 const nativePos=p=>({x:((((p.X>>8)+256)<<16)|((p.X&255)<<8))>>>0,y:((((p.Y>>8)+40)<<16)|((p.Y&255)<<8))>>>0});
 function reset(G,P){delete G.CEYogaObjects;for(const p of P){delete p.CEYogaLink;delete p.CEYogaMetrics;}if(window.SF2.edition==='ai'&&P.some(p=>p.fid===7))G.CEYogaObjects={pools:{4:O.create().pools[4]},task:0};}
 const pool=G=>G.CEObjects||G.CEYogaObjects;
 function publish(p,c){const q=register(p).poses[c.source];if(!q)throw Error('Missing original Yoga parent '+c.source);p.cur=q[0];p.anim=p.F.anims[p.cur];p.aidx=q[1];p.acc=D.frames[c.source].duration-c.timer-1;p.adone=0;}
 function owner(p){return{...nativePos(p),flags:p.anim?.flags?.[p.aidx]||0,health:p.HP&65535,main:p.HP<0?4:2,state:[5,7,8,10].includes(p.ST)?0x0e:12,cancel:p.ST!==11||p.CES?.kind!=='yoga'?1:0,companion:p.CEYogaLink||0};}
 function parentStep(p,c,h){const G=window.SF2.G,s=pool(G);c.x=nativePos(p).x;c.y=nativePos(p).y;c.face=p.FACE;c.companion=p.CEYogaLink||0;
  PARENT.step(c,{sources:D.parents.map(a=>a.source),frames:D.frames,fireRecovery:D.fireRecovery},{sound:h.sound,allocate:()=>{if(!c.selector)throw Error('Fire child322d8 is not yet bound');const a=O.allocate(s,4);if(a){a.born=G.tick;p.CEYogaMetrics.spawns++;}return a;},idle:()=>{p.CES=null;h.idle(p);}});
  p.CEYogaLink=c.companion;if(p.CES?.kind==='yoga')publish(p,c);
 }
 function art(p,alternate){if(!p.anim?.name?.startsWith('ceDhalsimSpecial'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function objects(G,P,h){const s=pool(G);if(!s||!P.some(p=>p.fid===7))return;for(const p of P)if(p.CES?.kind==='yoga'&&p.ST!==11){if(p.MV===p.CES.move)p.MV=null;p.CES=null;}for(const a of s.pools[4].slots){if(!a.used||a.kind!==2)continue;a.draw=false;if(a.born===G.tick)continue;const p=P[a.owner===0x83be?0:1],parent=owner(p);a.health??=0;a.source??=0;a.strength??=a.child||0;
   const draw=FLAME.step(a,parent,D,q=>h.hit(q,p),q=>{O.release(s,q);q.strength=q.orientation=q.paletteMode=q.field5a=0;delete q.born;});a.draw=draw;p.CEYogaLink=parent.companion;
  }
 }
 function draw(ctx,G,cam,ground){for(const a of pool(G)?.pools[4].slots||[]){if(!a.used||a.kind!==2||!a.draw)continue;const f=D.art[a.source+':'+a.face];if(!f)continue;ctx.drawImage(images[f.image],(a.x>>>16)-256-cam+f.x,ground-((a.y>>>16)-40)+f.y);}}
 window.SF2CEDHALSIM={ready,register,reset,objects,draw,art,record:a=>D.frames[a.source]?.record,models:{PARENT,FLAME},data:D};
 window.SF2CESPECIALS={
  init(p,m,h){if(p.fid!==7||m.btn!=='P'||m.inp!=='hcf')return prior.init(p,m,h);register(p);p.VQ=null;p.VT=0;p.CEYogaMetrics??={spawns:0};const c=p.CES={kind:'yoga',move:m,selector:2,phase:0,address:p.i?0x86be:0x83be,strength:p.SPSTR*2,voiceTimer:0,recovery:0,stop:0,companion:0};parentStep(p,c,h);return true;},
  step(p,h){if(p.CES?.kind!=='yoga')return prior.step(p,h);const c=p.CES;if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}parentStep(p,c,h);return true;}
 };
})();
