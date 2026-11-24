/* CE dizzy event/body and shared object binding. Original source constants only.
   Global boot/UI/CPU RNG phase is not claimed complete by this module. */
'use strict';
(()=>{
 const D=window.SF2CEDIZZYDATA,O=window.SF2CEOBJECTS,CORE=window.SF2CEDIZZYCORE;
 const images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 const registered=new WeakMap();
 function register(p){if(registered.has(p.F))return registered.get(p.F);const slots={},poses={};for(const[key,a]of Object.entries(D.fighters[p.fid])){slots[key]=p.F.anims.length;p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slots[key],i];}Object.assign(window.SF2CESHADOWDATA?.selectors||{},D.shadows);if(p.fid===11)for(const[to,from]of Object.entries(D.clawAliases))SF2VEGACLAWDATA.poses[to]=SF2VEGACLAWDATA.poses[from];const r={slots,poses};registered.set(p.F,r);return r;}
 function reset(p){delete p.CEDizzy;}
 function interrupt(p){const c=p.CEDizzy;if(!c)return;c.activeDizzy=c.dizzy=0;c.fall=c.pending=null;p.DIZZY=0;}
 const keys=k=>((k&1)<<1)|((k&2)>>1)|((k&4)<<1)|((k&8)>>1)|(k&0x70)|((k&0x380)<<1); // native R/L/D/U and kicks100/200/400.
 function state(p){return p.CEDizzy??=(Object.assign({address:p.i?0x86be:0x83be,points:0,timer:0,dizzy:0,activeDizzy:0,remaining:0,phase:0,escapeCount:0,alternateStrength:0,pending:null,fall:null},{}));}
 function pose(c,p,status,variant=0){const a=D.fighters[p.fid][status+':'+variant];if(!a)throw Error('Missing original dizzy animation');c.source=a.source;const f=D.nativeFrames[c.source];c.animTimer=f.duration;c.flags=f.flags;}
 function tick(c){c.animTimer=(c.animTimer-1)&65535;if(!c.animTimer){c.source=D.nativeFrames[c.source].next;const f=D.nativeFrames[c.source];c.animTimer=f.duration;c.flags=f.flags;}}
 function publishPose(c,p){const at=register(p).poses[c.source];if(!at)throw Error('Missing original dizzy pose '+c.source);p.cur=at[0];p.anim=p.F.anims[p.cur];p.aidx=at[1];p.acc=p.anim.ents[p.aidx][1]-c.animTimer;p.adone=0;}
 function art(p,alternate){if(!p.anim?.name?.startsWith('ceDizzy'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function claw(ctx,p,x,y,alternate){const a=p.anim?.extraClaw?.[p.aidx]?.[(alternate?2:0)+(p.FACE?1:0)];if(!a||window.SF2CEVEGACLAW?.unequipped(p))return false;ctx.drawImage(images[a[0]],x+a[1],y+a[2]);return true;}
 function beginWorld(G){const s=G.CEObjects=O.create();for(const kind of[33,34]){const a=O.allocate(s,8);Object.assign(a,{used:1,kind});}O.stage(s,D.stages[G.stage]);G.CEObjectSerial=0;return s;}
 function land(G,p,h){const a=O.allocate(G.CEObjects,8);if(a)Object.assign(a,{used:1,kind:53,x:((((p.X>>8)+256)&65535)<<16)>>>0,y:((((p.Y>>8)+40)&65535)<<16)>>>0,subtype:p.FACE,draw:false});h.random('0x2aa1e',p);}
 function queue(p,owner,reaction,dir){
  if(!reaction?.record||!Number.isInteger(reaction.reactionCode)||(p.Y>>8)!==0)return false;
  const c=state(p),raw=reaction.record,kind=raw[5]&255;
  if(c.legacy)return false;
  // Preserve existing unimplemented reaction families instead of replacing
  // the native kept fire/sweep/electric/air paths with the ordinary fall.
  if(![0,2,4,6,8,10,12,20,22,32,36,38].includes(reaction.reactionCode)){c.legacy=true;c.legacyReason=reaction.reactionCode;c.activeDizzy=c.dizzy=0;c.fall=c.pending=null;p.DIZZY=0;p.STP=c.points;p.STPE=c.lastTick+c.timer;return false;}
  c.pending={reaction:reaction.reactionCode,strength:reaction.strength,attackKind:kind&128?1:kind,heavyFlag:raw[7]>=3&&raw[7]!==4?1:0,skipRoster:0,blockFlag:reaction.nativeBlocked?1:0,dir,owner:owner.i,stop:14};return true;
 }
 function decay(p,h){
  const c=state(p);if(c.legacy)return;c.lastTick=h.clock;const dec=CORE.event.tick({timer:c.timer,points:c.points});c.timer=dec.timer;c.points=dec.points;p.STP=c.points;p.STPE=h.clock+c.timer;
  if(p.CER?.age===0&&p.CER.reaction===12)c.alternateStrength=p.CER.strength;
 }
 function admit(p,h){
  const c=state(p);if(c.legacy)return;
  if(!c.pending)return;c.lastAdmission=c.pending;c.pending=null;const q=c.lastAdmission;
  if(c.activeDizzy){c.activeDizzy=0;c.fall=null;c.dizzy=0;p.DIZZY=0;return;}
  const input={...q,throwStop:0,temporary:0,timer:c.timer,points:c.points,dizzy:c.dizzy,fid:p.fid,opponentFid:p.opp.fid,alternateStrength:c.alternateStrength};
  const result=CORE.event.event(input,D.event,()=>h.random('dizzy-points',p));Object.assign(c,{timer:result.state.timer,points:result.state.points,dizzy:result.state.dizzy});c.lastDrawCount=result.draws;
  p.STP=c.points;p.STPE=h.clock+c.timer;
  if(c.dizzy&&!q.blockFlag){p.DIZZY=1;if(!c.fall){h.countDizzy();delete p.CER;delete p.CERSTOP;delete p.CEPF;delete p.CEGUARD;p.KB=p.STUN=0;p.ST=7;c.fall={phase:0,sub:0,dir:q.dir,stop:q.stop,pause:0,ignoreWall:false,pushIndex:0};}}
 }
 function sourceMove(p,f){f.vx-=f.ax;f.vy-=f.ay;p.X+=f.vx;p.Y+=f.vy;}
 function motion(c,p,h){
  const f=c.fall;
  if(f.sub===0){f.sub=2;f.moving=true;p.Y+=16*256;pose(c,p,0x26,0);return;}
  if(f.sub===2){if(f.stop&&--f.stop)return;f.sub=4;f.vx=0x200*f.dir;f.vy=0x500;f.ax=0;f.ay=0x48;return;}
  if(f.sub===4){if(f.pause){f.ignoreWall=true;if(--f.pause){tick(c);return;}}sourceMove(p,f);if((p.CEWALL||p.CESIDE)&&!f.ignoreWall){f.pause=12;f.vx=0;if(f.vy>=0)f.vy=0;h.sound(0x2e);}if(f.vy<0&&(p.Y>>8)<0){p.Y&=255;f.sub=6;f.wait=4;pose(c,p,0x26,1);h.land(p);h.sound(0x2e);return;}tick(c);return;}
  if(f.sub===6){if(--f.wait){tick(c);return;}f.sub=8;f.vx=0x280*f.dir;f.vy=0x280;f.ax=0;f.ay=0x48;pose(c,p,0x26,2);return;}
  if(f.sub===8){sourceMove(p,f);if(p.CEWALL||p.CESIDE)f.vx=0;if((p.Y>>8)<0){p.Y&=255;f.sub=10;f.vx=0x100*f.dir;f.ax=0x14*f.dir;f.vy=f.ay=0;pose(c,p,0x26,3);return;}tick(c);return;}
  const before=f.vx;f.vx-=f.ax;if((before>=0)!==(f.vx>=0))f.vx=0;p.X+=f.vx;if(!f.vx||p.CEWALL||p.CESIDE){f.sub=0;f.moving=false;}tick(c);
 }
 function body(p,G,h){const c=state(p),f=c.fall;if(!f)return false;
  if(!h.alive(p)){c.activeDizzy=c.dizzy=0;c.fall=null;p.DIZZY=0;return false;}
  if(f.phase===0){f.phase=2;motion(c,p,h);}
  else if(f.phase===2){motion(c,p,h);if(!f.moving){f.phase=4;f.wait=10;c.activeDizzy=1;const a={remaining:0,address:c.address};CORE.active.duration(a,D.active,pc=>h.random(pc,p));c.remaining=a.remaining;c.dizzy=0;p.DIZZY=2;O.spawnDizzy(G.CEObjects,p,c.remaining);}else if(f.sub>=4){let n=D.wallPush[f.pushIndex++]??-1;if(n<0){n=0;f.pushIndex--;}const side=p.CESIDE||p.CEWALL;if(side===(f.dir<0?1:2))p.opp.X+=(f.dir>0?-n:n)*256;}}
  else if(f.phase===4){if(!--f.wait){f.phase=6;pose(c,p,0x28,0);}}
  else if(f.phase===6){tick(c);if(c.flags&255){h.random('0x38af2',p);f.phase=8;c.phase=0;c.escapeCount=0;p.ST=5;/* standing dizzy is hurt-able; body() still owns its controls */}}
  else{
   const a={address:c.address,fid:p.fid,phase:c.phase,remaining:c.remaining,activeDizzy:c.activeDizzy,escapeCount:c.escapeCount,source:c.source,timer:c.animTimer,flags:c.flags,y:((p.Y+40*256)*256)>>>0,inputRole:h.human(p)?1:0,keys:keys(p.KEYS),previousKeys:keys(p.CEDizzyPrev||0),level:p.CE_HANDICAP??16,field4d:0,field4e:0};
   CORE.active.step(a,D.active,pc=>h.random(pc,p));Object.assign(c,{phase:a.phase,remaining:a.remaining,activeDizzy:a.activeDizzy,escapeCount:a.escapeCount,source:a.source,animTimer:a.timer,flags:a.flags});p.Y=(a.y/256|0)-40*256;
   // 38b52 -> 37ddc -> 37d3e selects idle, then 37dd4 calls 22d8
   // in this same actor invocation. Preserve that first animation tick.
   if(!c.activeDizzy){c.fall=null;p.DIZZY=0;p.STP=c.points;p.STPE=h.clock+c.timer;h.release(p);h.tick(p);return true;}
  }
  p.CEDizzyPrev=p.KEYS;publishPose(c,p);return true;
 }
 function ui(a,s){
  if(a.main===0){a.main=2;a.palette=0;return;}
  if(a.main===4){a.main=6;return;}if(a.main===6){O.release(s,a);return;}
  switch(a.phase){case 0:a.phase=2;a.palette=0xfff0;break;case 2:if(a.palette)a.palette=(a.palette+2)&65535;else{a.phase=4;a.delay=40;}break;case 4:if(!--a.delay){a.phase=6;a.delay=30;}break;case 6:if(!--a.delay)a.phase=8;break;case 8:a.palette=(a.palette-1)&65535;if(a.palette===0xfff0)a.phase=10;break;case 10:if(a.palette)a.palette=(a.palette+2)&65535;else{a.phase=12;a.delay=50;}break;case 12:if(!--a.delay){a.main=4;a.phase=0;}break;}
 }
 function objects(G,P,h){const s=G.CEObjects||beginWorld(G);G.CEObjectSerial++;O.traverse(s,8,a=>{
  a.draw=false;
  if(a.kind===56){if(SF2CESPECIAL.gateObject(a,P,h))O.release(s,a);return;}
  if(a.kind===32&&a.yogaImpact){SF2CEDHALSIM.effectStep(a,s,h);return;}
  if(a.kind===0x3a){SF2CEWINNER.objectStep(a,s,P,h);return;}
  if(a.kind===34){ui(a,s);return;}
  if(a.kind===53){if(a.main===0){a.main=2;a.dustX=a.x>>>16;a.dustY=a.y>>>16;a.dustIndex=0;}else if(a.main===2){const q=D.dust[a.dustIndex++];if(!q||q[2]<0)a.main=4;else{a.x=(((a.dustX+(a.subtype?q[0]:-q[0]))&65535)<<16)>>>0;a.y=(((a.dustY+q[1])&65535)<<16)>>>0;a.dustDraw=q[2];}}else O.release(s,a);return;}
  if(a.kind===17){const B=window.SF2CESTAGEBIRDS;
   if(a.main===0){if(a.child)B.init(a,B.data.positions[(h.random('0x18ed2',null)&30)>>1]);else{a.main=2;a.delay=30;s.birdCount=0;}}
   else if(a.main===2){if(a.child)B.step(a);else{a.delay=(a.delay-1)&255;if(!a.delay){a.delay=30;if(s.birdCount<3&&!(h.random('0x18f34',null)&3)){const child=O.allocate(s,8);if(child){Object.assign(child,{used:1,main:0,phase:0,kind:17,child:1,draw:false});s.birdCount++;}}}}}
   else if(a.main===6){s.birdCount--;O.release(s,a);}return;
  }
  if(a.kind===35&&a.child===4){const p=P[a.parent===0x83be?0:1],c=p.CEDizzy;
   if(a.main===4||a.main===6){O.release(s,a);return;}
   const draw=a.main===2;CORE.stars.step(a,{fid:p.fid,face:p.FACE,x:((p.X>>8)+256)&65535,y:((p.Y>>8)+40)&65535,activeDizzy:h.alive(p)?c?.activeDizzy||0:0,state:c?.fall||p.CESpecial?0x0e:0},h.clock,D.stars,pc=>h.random(pc,p));a.draw=draw;
  }
 });}
 function drawStars(ctx,G,cam,ground,front=false){for(const a of G.CEObjects?.pools[8].slots||[]){if(!a.used||a.kind!==35||a.child!==4||!a.draw||front!==(a.camera===0))continue;const pal=a.variant?14:a.palette,f=D.starArt[a.source+':'+pal+':'+a.face];if(!f)continue;ctx.drawImage(images[f.image],(a.x>>>16)-256-cam+f.x,ground-((a.y>>>16)-40)+f.y);}}
 // AI uses the original star/bird art when its legacy dizzy body is active.
 // This presentation helper does not allocate native actors or consume RNG.
 function drawFallbackStars(ctx,p,cam,ground,tick,world){
  const parent=p.i?0x86be:0x83be;if([world?.CEObjects,world?.CESpecialObjects].some(s=>s?.pools[8].slots.some(a=>a.used&&a.kind===35&&a.child===4&&a.parent===parent)))return;
  const variant=p.fid&1,phase=Math.floor(tick/48)&1,source=D.stars.sources[4+variant+phase*2],attach=D.stars.attach[p.fid][4],face=p.FACE?1:0;
  const f=D.starArt[source+':'+(variant?14:11)+':'+face];if(!f)return;
  for(let i=0;i<3;i++){const angle=tick/12+i*Math.PI*2/3,x=p.X/256+(p.FACE?-attach[0]:attach[0])-cam+Math.cos(angle)*14,y=ground-p.Y/256-attach[1]+Math.sin(angle)*4;
    ctx.drawImage(images[f.image],Math.round(x)+f.x,Math.round(y)+f.y);
  }
 }
 function drawBirds(ctx,G,cam){const s=G.CEObjects;if(!s)return;SF2CESTAGEBIRDS.drawAt(ctx,cam,s.pools[8].slots.filter(a=>a.used&&a.kind===17&&a.child));}
 window.SF2CEDIZZY={ready,register,reset,interrupt,keys,state,beginWorld,land,queue,decay,admit,body,objects,art,claw,drawStars,drawFallbackStars,drawBirds};
})();
