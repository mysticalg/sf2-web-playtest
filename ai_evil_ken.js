/* Reviewed AI Edition adapter, revision4 pack d59af8cc2fb1f6e9.
   Root integration evidence is separate from source-pack readiness. Authored heat timings
   reuse approved edited native Ken poses; these are not original CE moves. */
'use strict';
(function(){
// Pure 60 Hz action controller. The engine adapter supplies shared action-layer
// commands and collision results; this file never reads devices or DOM events.
const RULES=Object.freeze({cap:100,finisherCost:40,overheatUnlock:35,coolEvery:6,
  idleCoolingDelay:90,reentryLock:24,chainWindow:8});
const PHASES=Object.freeze({
  'ember-kick':{startup:9,active:3,recovery:22,damage:16,heat:24,dx256:128,slot:51},
  'furnace-kick':{startup:10,active:4,recovery:26,damage:20,heat:30,dx256:160,slot:52},
  'cinder-break':{startup:12,active:5,recovery:34,damage:30,heat:0,dx256:192,slot:41}
});
function create(){return {tick:0,heat:0,overheated:false,lastHeatTick:-90,lock:0,
  move:null,elapsed:0,contact:false,chain:null,chainAge:0,serial:0};}
function phase(s){if(!s.move)return 'neutral';const m=PHASES[s.move];
  return s.elapsed<m.startup?'startup':s.elapsed<m.startup+m.active?'active':'recovery';}
function start(s,id,out){const m=PHASES[id];s.move=id;s.elapsed=0;s.contact=false;
  s.chain=null;s.chainAge=0;s.serial++;
  if(id==='cinder-break')s.heat-=RULES.finisherCost;
  else {s.heat=Math.min(RULES.cap,s.heat+m.heat);s.lastHeatTick=s.tick;
    if(s.heat===RULES.cap)s.overheated=true;}
  out.push({type:'start',id,serial:s.serial,animationSlot:m.slot,heat:s.heat});}
function finish(s,out,reason){if(s.move)out.push({type:'end',id:s.move,reason});
  s.move=null;s.elapsed=0;s.contact=false;s.chain=null;s.lock=RULES.reentryLock;}
function step(s,input={}){const out=[];s.tick++;
  if(input.roundReset){Object.assign(s,create());return out;}
  if(s.lock>0)s.lock--;
  if(!s.move&&s.tick-s.lastHeatTick>=RULES.idleCoolingDelay&&s.tick%RULES.coolEvery===0)
    s.heat=Math.max(0,s.heat-1);
  if(s.overheated&&s.heat<=RULES.overheatUnlock){s.overheated=false;out.push({type:'cooled'});}
  if(input.interrupted||input.airborne){finish(s,out,'interrupted');return out;}
  const commands=new Set(input.commands||[]);
  if(!s.move){if(commands.has('ember-kick')&&input.canAct===true&&s.lock===0){
    start(s,'ember-kick',out);out.push({type:'pose',id:s.move,elapsed:0,phase:'startup'});s.elapsed=1;
  }return out;}
  const m=PHASES[s.move],p=phase(s);
  if(p==='active'&&!s.contact&&(input.contact==='hit'||input.contact==='block')){
    s.contact=true;out.push({type:'contact',id:s.move,result:input.contact});}
  // Chain only late in recovery. The next startup still runs in full, giving
  // defenders an interruptible gap; no active-frame teleport to the next hit.
  const next=s.move==='ember-kick'?'furnace-kick':s.move==='furnace-kick'?'cinder-break':null;
  const remaining=m.startup+m.active+m.recovery-s.elapsed;
  if(next&&p==='recovery'&&remaining<=RULES.chainWindow&&commands.has(next)){
    if(next!=='cinder-break'||!s.overheated&&s.heat>=RULES.finisherCost){s.chain=next;s.chainAge=0;}
    else out.push({type:'reject',id:next,reason:s.overheated?'overheated':'heat'});
  }
  out.push({type:'pose',id:s.move,elapsed:s.elapsed,phase:p});
  if(p==='active')out.push({type:'attack',id:s.move,serial:s.serial,damage:m.damage,
    dx256:m.dx256,knockdown:s.move==='cinder-break',oncePerTarget:true});
  if(s.chain)s.chainAge++;
  s.elapsed++;
  if(s.elapsed>=m.startup+m.active+m.recovery){
    const q=s.chain&&s.chainAge<=RULES.chainWindow?s.chain:null;
    if(q)start(s,q,out);else finish(s,out,'recovered');
  }
  return out;
}
const API={RULES,PHASES,create,phase,step};
if(typeof module==='object'&&module.exports)module.exports=API;
else globalThis.SF2EvilKenController=API;
})();

'use strict';
(function(){
// Browser: load controller.cjs then adapter.cjs as scripts. Node: require.
// Host owns device sampling, hitstop, world collision and native state updates.
const Controller=typeof module==='object'&&module.exports?require('./controller.cjs'):globalThis.SF2EvilKenController;
function create(){return {heat:Controller.create(),motion:{stage:0,expires:0,lastDir:5},hitTargets:new Set(),lastSerial:0};}
function commands(state,frame){
  const h=state.heat,q=state.motion,d=frame.direction||5;
  if(h.tick>q.expires)q.stage=0;
  if(d!==q.lastDir){
    if(d===2){q.stage=1;q.expires=h.tick+18;}
    else if(q.stage===1&&d===3)q.stage=2;
    else if(q.stage===2&&d===6)q.stage=3;
    else if(d!==5&&d!==6)q.stage=0;
  }
  q.lastDir=d;
  const p=frame.pressed||{},kick=p.LK||p.MK||p.HK,result=[];
  if(h.move==='ember-kick'&&kick)result.push('furnace-kick');
  else if(kick&&q.stage===3){
    if(!h.move)result.push('ember-kick');
    else if(h.move==='furnace-kick'&&p.HK)result.push('cinder-break');
    q.stage=0;
  }
  return result;
}
function pose(manifest,phaseMap,id,elapsed,facingRight){
  let local=elapsed,segment;
  for(const s of phaseMap.moves[id]){segment=s;if(local<s.ticks)break;local-=s.ticks;}
  const a=manifest.animations.find(a=>a.sourceSlot===segment.slot),e=a.entries[segment.entry];
  const boxes={};for(const [name,b] of Object.entries(e.boxes))boxes[name]=[facingRight?-b[0]:b[0],b[1],b[2],b[3]];
  if(segment.phase!=='active')boxes.hit=[0,0,0,0];
  return {frame:e.frame,phase:segment.phase,boxes,shadow:e.shadow,sourceSlot:segment.slot,sourceEntry:segment.entry,
    effect:segment.phase==='active'&&manifest.effectsEnabled!==false?{id:`heat-${Math.floor(elapsed/2)%6}`,
      x:facingRight?-e.boxes.hit[0]-8:e.boxes.hit[0]-8,y:-e.boxes.hit[1]-8,mirrorX:!!facingRight}:null,mirrorX:!!facingRight};
}
function step(state,frame,context,manifest,phaseMap){
  if(context.hitstop)return {events:[],pose:null,attack:null,heat:state.heat.heat,
    overheated:state.heat.overheated,handled:!!state.heat.move,suppressNativeSpecial:!!state.heat.move,frozen:true};
  const input=commands(state,frame);
  const events=Controller.step(state.heat,{commands:input,canAct:context.canAct===true,
    airborne:context.airborne===true,interrupted:context.interrupted===true,
    roundReset:context.roundReset===true,contact:context.contact});
  if(context.roundReset){state.motion={stage:0,expires:0,lastDir:5};state.hitTargets.clear();state.lastSerial=0;}
  if(state.lastSerial!==state.heat.serial){state.hitTargets.clear();state.lastSerial=state.heat.serial;}
  const p=events.find(e=>e.type==='pose'),attack=events.find(e=>e.type==='attack');
  return {events,pose:p?pose(manifest,phaseMap,p.id,p.elapsed,context.facingRight):null,
    attack:attack?{...attack,dx256:attack.dx256*(context.facingRight?1:-1)}:null,
    heat:state.heat.heat,overheated:state.heat.overheated,handled:!!p,
    suppressNativeSpecial:events.some(e=>e.type==='start')||!!state.heat.move};
}
function claimHit(state,targetId,serial){
  if(!state.heat.move||serial!==state.heat.serial||state.hitTargets.has(targetId))return false;
  state.hitTargets.add(targetId);return true;
}
function projectileOverride(native){
  // Works on a copied description; never mutates shared native fighter tables.
  return {...native,startup:(native.startup||0)+6,recovery:(native.recovery||0)+8,
    damage:Math.floor((native.damage||0)*192/256)};
}
const API={create,commands,pose,step,claimHit,projectileOverride};
if(typeof module==='object'&&module.exports)module.exports=API;
else globalThis.SF2EvilKenAdapter=API;
})();

(()=>{
 const C=window.SF2EvilKenController,A=window.SF2EvilKenAdapter;
 const slots={'ember-kick':92,'furnace-kick':93,'cinder-break':94};
 let pack=null;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function check(ok,message){if(!ok)throw new Error('Evil Ken: '+message);}
 async function register(data,host){
  const runtime=data.runtime,character=data.character,phaseMap=data.phaseMap,native=host.native;
  check(runtime?.characterId==='ai:evil-ken'&&runtime.nativeFighterId===4&&runtime.assetRevision===4,'wrong runtime identity/revision');
  check(runtime.publishReady===false&&runtime.selectable===false,'expected immutable source-pack readiness flags');
  check(character?.id==='ai:evil-ken'&&character.effectsEnabled===false,'invalid manifest or unsupported effects');
  const f=clone(runtime.fighter);
  check(f?.anims?.length===97&&f.frames?.length===180,'expected 97 animations and 180 frames');
  for(let i=0;i<92;i++){
   const a=f.anims[i],b=native.anims[i];
   check(a.name===b.name&&a.source===b.source&&a.ents.length===b.ents.length,'native slot '+i+' differs');
   for(let j=0;j<a.ents.length;j++){
    check(JSON.stringify(a.ents[j].filter((_,k)=>k!==1))===JSON.stringify(b.ents[j].filter((_,k)=>k!==1)),'native boxes/frame/combat '+i+':'+j+' differ');
    a.ents[j][1]=b.ents[j][1]; // Retain the engine's ROM-derived action timing fixes.
   }
   a.mode=b.mode;a.loop=b.loop;a.flags=b.flags.slice();
  }
  check(f.pal.length===15&&f.pal2.length===15,'missing primary/alternate palette');
  for(const palette of [f.pal,f.pal2])check(palette.every(rgb=>rgb.length===3&&rgb.every(v=>Number.isInteger(v)&&v>=0&&v<=255&&v%17===0)),'non-CPS1 palette');
  const shadows=[];
  for(const a of character.animations){const slot=runtime.animationIdToSlot[a.id];check(Number.isInteger(slot)&&f.anims[slot]?.ents.length===a.entries.length,'animation binding '+a.id);shadows[slot]=a.entries.map(e=>e.shadow);}
  check(shadows.length===97&&shadows.every(a=>a.every(v=>Number.isInteger(v?.raw)&&v.raw>=0&&v.raw<=255)),'missing entry shadow');
  // Native Izuna victim descriptors reuse existing edited frame indices. Bind
  // these named aliases lazily so the accepted97-slot authored pack stays intact.
  const supplements=native.anims.filter(a=>/^vegaizunafall[0-3]$/.test(a.name)).map(clone);
  for(const a of supplements){check(a.ents.every(e=>e[0]>=0&&e[0]<172),'supplement needs unreviewed pixels');shadows.push(a.ents.map((_,i)=>({raw:window.SF2CESHADOWDATA.selectors[a.source+24*i]||0})));}
  const image=new Image();image.src=f.img;await image.decode();
  const alternate=host.makeAlt(f,image);check(alternate.ready,'alternate atlas not ready');
  const shadowImages=new Map(),shadowCache=new Map(),d=window.SF2CESHADOWDATA;
  check(d?.frames&&d.colors,'native shadow data is unavailable');
  for(const raw of new Set(shadows.flat().map(s=>s.raw).filter(Boolean))){
   const selector=raw&127;
   for(let face=0;face<2;face++){
    const frame=d.frames[selector]?.[face];check(frame,'shadow selector '+selector);
    const im=new Image();im.src=frame.png;await im.decode();shadowImages.set(selector+':'+face,{...frame,image:im});
   }
  }
  pack={fighter:f,character,phaseMap,shadows,image,alternate,shadowImages,shadowCache,supplements};
  return {id:'ai:evil-ken',assetRevision:4,animations:97,frames:180,publishReady:true,selectable:true};
 }
 function animation(p,name){
  if(!pack||!/^vegaizunafall[0-3]$/.test(name))return -1;
  if(!p.F.anims.some(a=>a.name==='vegaizunafall0'))p.F.anims.push(...pack.supplements.map(clone));
  return p.F.anims.findIndex(a=>a.name===name);
 }
 function reset(p){p.AIEvilKen={adapter:A.create(),turn:null,pendingFace:null,pose:null,attack:null,contact:null,cpu:{queue:[],tag:null},metrics:{starts:0,contacts:0,blocks:0,finisherSpends:0,interrupts:0}};}
 function bind(p){check(pack,'register the reviewed pack first');p.F=clone(pack.fighter);delete p.F._ai;p.AIAtlas=pack.image;p.AIAtlasAlt=pack.alternate;reset(p);}
 function direction(keys,right){const x=(keys&2?1:0)-(keys&1?1:0),y=(keys&4?1:0)-(keys&8?1:0),rel=right?x:-x;return y>0?rel<0?7:rel>0?9:8:y<0?rel<0?1:rel>0?3:2:rel<0?4:rel>0?6:5;}
 function turn(p,frame,h){
  const state=p.AIEvilKen,target=p.opp.X>p.X?1:p.opp.X<p.X?0:p.FACE;
  if(![0,3].includes(p.ST)||p.Y){state.turn=null;state.pendingFace=null;return false;}
  if(!state.turn&&target!==p.FACE){
   if(state.pendingFace!==target){state.pendingFace=target;return false;}
   p.FACE=target;state.pendingFace=null;state.turn={crouch:!!(frame.keys&8)};
   h.anim(p,state.turn.crouch?96:95,0);p.acc=-1;p.ST=state.turn.crouch?3:0;return true;
  }
  if(!state.turn){state.pendingFace=null;return false;}
  h.tick(p);p.acc--; // 0x3836a/0x383e4 advance before input and terminal-marker checks.
  const crouch=!!(frame.keys&8),attack=frame.pressed&1008,jump=frame.keys&4,horizontal=frame.keys&3;
  if(attack||jump||!crouch&&horizontal){state.turn=null;return false;}
  if(p.anim.flags[p.aidx]&0x8000){
   state.turn=null;
   if(crouch){h.anim(p,3,2);p.acc=-1;p.ST=3;} // Crouching turns return immediately to crouch.
   else {p.ST=0;state.standingEnd=true;} // Final standing turn entry displays for this one tick.
   return true;
  }
  if(crouch!==state.turn.crouch){const idx=p.aidx,acc=p.acc;h.anim(p,crouch?96:95,idx);p.acc=acc;p.ST=crouch?3:0;state.turn.crouch=crouch;}
  return true;
 }
 function update(p,frame,h){
  const state=p.AIEvilKen;if(!state)return false;
  if(state.standingEnd){state.standingEnd=false;h.idle(p);}
  const moving=!!state.adapter.heat.move;
  const pressed={LP:!!(frame.pressed&16),MP:!!(frame.pressed&32),HP:!!(frame.pressed&64),LK:!!(frame.pressed&128),MK:!!(frame.pressed&256),HK:!!(frame.pressed&512)};
  const result=A.step(state.adapter,{direction:direction(frame.keys,!!p.FACE),pressed},{canAct:p.Y===0&&[0,3,4].includes(p.ST),airborne:moving&&(p.Y>0||p.ST===2),interrupted:moving&&(p.ST!==11||p.MV?.kind!=='evil-ken-heat'),contact:state.contact,facingRight:!!p.FACE},pack.character,pack.phaseMap);
  state.contact=null;state.attack=result.attack;state.pose=result.pose;
  for(const event of result.events){
   if(event.type==='start'){state.metrics.starts++;if(event.id==='cinder-break')state.metrics.finisherSpends++;p.hitdone=0;h.sound(event.id==='cinder-break'?p.F.sfx.sp[2][0][1]:p.F.sfx.wh[5]);}
   if(event.type==='end'&&event.reason==='interrupted')state.metrics.interrupts++;
  }
  if(result.pose){
   state.turn=null;
   const pose=result.pose,id=result.events.find(e=>e.type==='pose').id,slot=slots[id],a=p.F.anims[slot];
   let local=result.events.find(e=>e.type==='pose').elapsed,index=0;
   while(index<a.ents.length-1&&local>=a.ents[index][1]){local-=a.ents[index][1];index++;}
   if(p.cur!==slot){h.anim(p,slot,index);}
   p.cur=slot;p.anim=a;p.aidx=index;p.acc=-1;p.adone=0;p.ST=11;p.MV={kind:'evil-ken-heat'};p.CES=null;p.SPKD=0;
   if(result.attack)p.X+=result.attack.dx256; // Already signed by adapter; do not mirror twice.
   if(result.events.some(e=>e.type==='end'&&e.reason==='recovered'))state.finishNext=true;
   return true;
  }
  if(state.finishNext){state.finishNext=false;state.attack=null;h.idle(p);}
  if(moving&&!result.handled&&p.MV?.kind==='evil-ken-heat'&&p.ST===11){h.idle(p);}
  return turn(p,frame,h);
 }
 function passive(p){
  // Shared CE held-victim handlers own the pose and return before ordinary input.
  // Resource time still advances; an interrupted heat move cannot survive a throw.
  const s=p.AIEvilKen;if(!s)return;
  const result=A.step(s.adapter,{direction:5,pressed:{}},{canAct:false,interrupted:!!s.adapter.heat.move,facingRight:!!p.FACE},pack.character,pack.phaseMap);
  if(result.events.some(e=>e.type==='end'&&e.reason==='interrupted'))s.metrics.interrupts++;
  s.pose=s.attack=s.contact=s.turn=s.pendingFace=null;s.finishNext=s.standingEnd=false;
 }
 function claim(p,target){const state=p.AIEvilKen;return !!state?.attack&&A.claimHit(state.adapter,target,state.attack.serial);}
 function contact(p,blocked){const s=p.AIEvilKen;s.contact=blocked?'block':'hit';s.adapter.heat.contact=true;s.metrics.contacts++;if(blocked)s.metrics.blocks++;}
 function shadow(p,stage){
  if(!pack)return null;const desc=pack.shadows[p.cur]?.[p.aidx];if(!desc?.raw)return null;
  const selector=desc.raw&127,face=p.FACE?1:0,f=pack.shadowImages.get(selector+':'+face),color=window.SF2CESHADOWDATA.colors[stage];if(!f||!color)return null;
  const key=selector+':'+face+':'+stage;let image=pack.shadowCache.get(key);
  if(!image){image=document.createElement('canvas');image.width=f.w;image.height=f.h;const c=image.getContext('2d');c.drawImage(f.image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='rgb('+color.join(',')+')';c.fillRect(0,0,f.w,f.h);pack.shadowCache.set(key,image);}
  return {image,x:f.x,y:f.y,w:f.w,h:f.h,selector,source:f.source};
 }
 function cpu(p,hitstop){
  const s=p.AIEvilKen;if(!s||hitstop)return null;const h=s.adapter.heat,control=s.cpu,fwd=p.FACE?2:1;
  if(control.queue.length)return control.queue.shift();
  if(h.move){
   const remain=C.PHASES[h.move].startup+C.PHASES[h.move].active+C.PHASES[h.move].recovery-h.elapsed;
   if(remain<=8&&control.tag!==h.serial){control.tag=h.serial;
    if(h.move==='ember-kick')return 128;
    if(h.move==='furnace-kick'&&!h.overheated&&h.heat>=40){control.queue=[8,8,8|fwd,8|fwd,8|fwd,fwd|512];return 8;}
   }return 0;
  }
  const distance=Math.abs(p.X-p.opp.X)>>8;
  if([0,3].includes(p.ST)&&!h.lock&&distance>=60&&distance<=120&&h.tick%180===0){control.queue=[8,8,8|fwd,8|fwd,8|fwd,fwd|128];return 8;}
  return null;
 }
 window.SF2AIEvilKen={register,bind,animation,reset,update,passive,claim,contact,shadow,cpu,get ready(){return !!pack;},get fighter(){return pack?.fighter;},get metadata(){return {id:'ai:evil-ken',nativeFighterId:4,assetRevision:4,publishReady:true,selectable:true};}};
})();
