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
 const FIREMODELS={FIRE:{step(a,parent,D,h){
 const word=(v,n)=>(((n&65535)<<16)|(v&65535))>>>0;
 const select=source=>{a.source=source;a.timer=D.frames[source].duration;a.flags=D.frames[source].flags;};
 const tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer)select(D.frames[a.source].next);};
 if(a.main===0){a.main=2;a.priority=1;a.orientation=a.face^1;a.group=1;a.health=256;a.hitPointer=D.hitPointer;a.hurtPointer=D.hurtPointer;a.x=word(a.x,(a.x>>>16)+(a.face?56:-56));a.y=word(a.y,(a.y>>>16)+40);a.velocityPointer=D.velocityPointers[a.strength>>1];select(D.sources[a.strength>>1]);return false;}
 if(a.main===2){h.collision(a);
  if(!(a.health&32768)&&a.priority){const v=D.velocities[a.velocityPointer][a.orientation];a.x=(a.x+(v[0]<<8))>>>0;a.y=(a.y+(v[1]<<8))>>>0;tick();h.enqueue(a);return true;}
  if(a.health===65535){a.main=(a.main+2)&255;const b=h.allocateImpact();if(b){b.used=1;b.kind=32;b.x=word(b.x,a.x>>>16);b.y=word(b.y,a.y>>>16);b.face=a.face;b.child=5;parent.companion=0;}}
  a.main=(a.main+2)&255;return false;
 }
 if(a.main===4){a.main=6;parent.companion=0;return false;}
 if(a.main===6){h.release(a);return false;}
 throw Error('Unknown native Fire phase '+a.main);
}},EFFECT:{step(a,D,h){
 const word=(v,n)=>(((n&65535)<<16)|(v&65535))>>>0;
 const select=source=>{a.source=source;a.timer=D.frames[source].duration;a.flags=D.frames[source].flags;};
 if(a.main===0){a.main=2;a.paletteMode=0;const offset=D.effectOffsets[(h.random()&12)>>2];a.x=word(a.x,(a.x>>>16)+offset[0]);a.y=word(a.y,(a.y>>>16)+offset[1]);select(D.effectSource);return false;}
 if(a.main===2){a.timer=(a.timer-1)&65535;if(!a.timer)select(D.frames[a.source].next);if(a.flags&32768){a.main=4;return false;}h.enqueue(a);return true;}
 if(a.main===4||a.main===6){h.release(a);return false;}
 throw Error('Unknown native Fire effect phase '+a.main);
}}},FD={...D.fire,frames:D.frames};
 const images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 function register(p){if(p.fid!==7)return null;Object.assign(SF2CESHADOWDATA.selectors,D.shadows);Object.assign(SF2CEREACTIONDATA.postures,D.postures);const combat=SF2CECOMBATDATA.fighters[7];for(const key of["frames","postures","criticalBoxes"])Object.assign(combat[key],D.drillCombat[key]);if(registered.has(p.F))return registered.get(p.F);const poses={},slots=[];for(const a of[...D.parents,...D.drills]){slots.push(p.F.anims.length);p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slots[slots.length-1],i];}const q={poses,slots};registered.set(p.F,q);return q;}
 const nativePos=p=>({x:((((p.X>>8)+256)<<16)|((p.X&255)<<8))>>>0,y:((((p.Y>>8)+40)<<16)|((p.Y&255)<<8))>>>0});
 function reset(G,P){delete G.CEYogaObjects;for(const p of P){delete p.CEYogaLink;delete p.CEYogaFire;delete p.CEYogaMetrics;}if(window.SF2.edition==='ai'&&P.some(p=>p.fid===7)){const all=O.create();G.CEYogaObjects={pools:{4:all.pools[4],8:all.pools[8]},task:0};};}
 const pool=G=>G.CEObjects||G.CEYogaObjects;
 function publish(p,c){const q=register(p).poses[c.source];if(!q)throw Error('Missing original Yoga parent '+c.source);p.cur=q[0];p.anim=p.F.anims[p.cur];p.aidx=q[1];p.acc=D.frames[c.source].duration-c.timer-1;p.adone=0;}
 function owner(p){return{...nativePos(p),flags:p.anim?.flags?.[p.aidx]||0,health:p.HP&65535,main:p.HP<0?4:2,state:[5,7,8,10].includes(p.ST)?0x0e:12,cancel:p.ST!==11||p.CES?.kind!=='yoga'?1:0,companion:p.CEYogaLink||0};}
 function parentStep(p,c,h){const G=window.SF2.G,s=pool(G);c.x=nativePos(p).x;c.y=nativePos(p).y;c.face=p.FACE;c.companion=p.CEYogaLink||0;
  PARENT.step(c,{sources:D.parents.map(a=>a.source),frames:D.frames,fireRecovery:D.fireRecovery},{sound:h.sound,allocate:()=>{const a=O.allocate(s,4);if(a){a.health??=0;a.born=G.tick;p.CEYogaMetrics.spawns++;}return a;},idle:()=>{p.CES=null;h.idle(p);}});
  p.CEYogaLink=c.companion;if(!c.selector&&c.companion){p.CEYogaFire=c.companion;syncFire(p,O.actor(s,4,c.companion));}if(p.CES?.kind==='yoga')publish(p,c);
 }
 function art(p,alternate){if(!p.anim?.name?.startsWith('ceDhalsimSpecial'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function projectile(p,G=window.SF2.G){const s=pool(G),a=p.CEYogaFire&&s?O.actor(s,4,p.CEYogaFire):null;return a?.used&&a.kind===1?a:null;}
 function syncFire(p,a){const def=window.SF2CEFX.projectiles.yoga,index=a.strength>>1,source=a.main===0?D.fire.sources[index]:a.source;p.FBK='yoga';p.FBDEF=def;p.FBSTR=index;p.FBAN=def.anims[index];p.FBI=Math.max(0,(source-p.FBAN.source)/24);p.FBC=a.timer;p.FBX=((a.x>>>16)-256)*256+((a.x&65535)>>>8);p.FBY=((a.y>>>16)-40)*256+((a.y&65535)>>>8);p.FBVX=D.fire.velocities[D.fire.velocityPointers[index]][a.face^1][0];p.FBINIT=a.main===0?1:0;p.FBON=a.used&&a.main<4?1:0;p.FBIMPACT=0;p.FBDEFER=0;p.FBSLOT=(7-(a.address-0x9376)/192)&1;}
 function objects(G,P,h){const s=pool(G);if(!s||!P.some(p=>p.fid===7))return;for(const p of P)if(p.CES?.kind==='yoga'&&p.ST!==11){if(p.MV===p.CES.move)p.MV=null;p.CES=null;}for(const a of s.pools[4].slots){if(!a.used||![1,2].includes(a.kind))continue;a.draw=false;if(a.born===G.tick)continue;const p=P[a.owner===0x83be?0:1],parent=owner(p);a.health??=0;a.source??=0;a.strength??=a.child||0;
   const release=q=>{const fire=q.kind===1;O.release(s,q);q.strength=q.orientation=q.paletteMode=q.field5a=0;delete q.born;if(fire&&p.CEYogaFire===q.address){delete p.CEYogaFire;p.FBON=0;delete p.FBCLASH;}};
   if(a.kind===1){syncFire(p,a);a.draw=FIREMODELS.FIRE.step(a,parent,FD,{collision:q=>h.fire(q,p),enqueue:q=>{q.renderX=q.x>>>16;q.priority=+h.visible(q);},allocateImpact:()=>{const b=O.allocate(s,8);if(b)b.yogaImpact=1;return b;},release});if(a.used)syncFire(p,a);}
   else a.draw=FLAME.step(a,parent,D,q=>h.hit(q,p),release);
   p.CEYogaLink=parent.companion;
  }
 }
 function effectStep(a,s,h){a.draw=FIREMODELS.EFFECT.step(a,FD,{random:()=>h.random('0x28dfe',null),enqueue:q=>{q.renderX=q.x>>>16;q.priority=+h.visible(q);},release:q=>{O.release(s,q);delete q.yogaImpact;}});}
 function effects(G,h){const s=pool(G);if(s)O.traverse(s,8,a=>{if(a.kind===32&&a.yogaImpact)effectStep(a,s,h);});}
 function draw(ctx,G,cam,ground){for(const a of pool(G)?.pools[4].slots||[]){if(!a.used||![1,2].includes(a.kind)||!a.draw)continue;const f=D.art[a.source+':'+a.face];if(!f)continue;ctx.drawImage(images[f.image],(a.x>>>16)-256-cam+f.x,ground-((a.y>>>16)-40)+f.y);}for(const a of pool(G)?.pools[8].slots||[]){if(!a.used||!a.yogaImpact||!a.draw)continue;const f=D.art[a.source+':'+a.face];if(f)ctx.drawImage(images[f.image],(a.x>>>16)-256-cam+f.x,ground-((a.y>>>16)-40)+f.y);}}
 window.SF2CEDHALSIM={ready,register,reset,objects,effectStep,effects,projectile,draw,art,record:a=>D.frames[a.source]?.record,models:{PARENT,FLAME,...FIREMODELS},data:D};
 window.SF2CESPECIALS={
  init(p,m,h){if(p.fid!==7||m.btn!=='P'||m.inp!=='hcf'&&!(m.inp==='qcf'&&window.SF2.G.scene==='fight'))return prior.init(p,m,h);register(p);p.VQ=null;p.VT=0;p.CEYogaMetrics??={spawns:0};const c=p.CES={kind:'yoga',move:m,selector:m.inp==='hcf'?2:0,phase:0,address:p.i?0x86be:0x83be,strength:p.SPSTR*2,voiceTimer:0,recovery:0,stop:0,companion:0};parentStep(p,c,h);return true;},
  step(p,h){if(p.CES?.kind!=='yoga')return prior.step(p,h);const c=p.CES;if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}parentStep(p,c,h);return true;}
 };
})();
