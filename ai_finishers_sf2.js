/* Adapter to this port's real normal, special, throw and projectile controllers.
 * Loaded before game.js; bindSF2 is called only after game actors are initialized.
 * The finishing presentation is an authored AI Edition extension, not ROM parity.
 */
'use strict';
window.SF2AIFINISHERS.bindSF2=()=>{
 let finisher,banner='',fire=null,portrait=null,pendingEcho=null,savedDeathVoice=null,contactSerial=0,lastMove=null,inputPrevious=0,promptPrevious=0,cinema=null,recovery=null,savedMusic=null,lastDamage=-Infinity,deathVoicePlayed=false,impactContext=null;const normalPlans=new Map();
 function portraitCutout(w,d){
  const source=CWIN?.[w.fid]?.win;if(!source)return null;const base=window.SF2CEFADE?.mirrorWinner?.(w.i,w.fid,d.fid)||source,image=aiPortraitImage(base,w.i,w.fid,'win'),c=document.createElement('canvas');c.width=image.width;c.height=image.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const p=g.getImageData(0,0,c.width,c.height),data=p.data,key=data.slice(0,4),seen=new Uint8Array(c.width*c.height),queue=[];
  const enqueue=i=>{if(i<0||i>=seen.length||seen[i])return;seen[i]=1;const k=i*4;if(data[k]===key[0]&&data[k+1]===key[1]&&data[k+2]===key[2]&&data[k+3]===key[3])queue.push(i);};
  for(let x=0;x<c.width;x++){enqueue(x);enqueue((c.height-1)*c.width+x);}for(let y=0;y<c.height;y++){enqueue(y*c.width);enqueue(y*c.width+c.width-1);}
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%c.width;data[i*4+3]=0;if(x)enqueue(i-1);if(x<c.width-1)enqueue(i+1);enqueue(i-c.width);enqueue(i+c.width);}
  g.putImageData(p,0,0);return c;
 }
 const nativeArt=p=>{const a=fighterArtBase(p);return aiFaceInjuryArt(p,aiClothesArt(p,a),a);};
 const anatomy=(p,a)=>{const r=a.rect,h=boxw(p,0),b=boxw(p,1),sign=p.FACE?-1:1,x=q=>(q[0]-p.X/256)*sign-r[4],y=q=>p.Y/256-q[1]-r[5];return{head:h?{x:x(h),y:y(h),rx:h[2]*1.28,ry:h[3]*1.4}:undefined,neck:h?y(h)+h[3]*.85:undefined,cx:b?x(b):r[2]*.5,hip:r[3]*.6,halfTorso:b?Math.max(9,b[2]*.62):r[2]*.17};};
 function resetActor(p){
  SF2CESPECIAL.interrupt(p);SF2CEDIZZY.interrupt(p);
  for(const k of['AINativeGrab','AINativeHeld','AIFFMove','AIFFHold','AIFFHeld','AIFFThrow','AIFFNormal','AIFFWall','AIFFSlide','AIFFProjectile','AIFFGrenades','AIFFBullets','AIHeroMove','AIHeroGrab','AIHeroWall','AIHeroAir','AIHeroPhase','AIHeroInvuln','AIDamndMove','AIDamndBarrel','AIAir','CES','CEPF','CEKO','CETH','CETHV','CEHH','CEHHV','CEHHRecovery','CEHHDesired','CEHHPrevKeys','CEHHVLAND','CEHHPush','CEHHPostPush','CEBV','CEB','CER','CERSTOP','CEGUARD','CESHAKE','CERHOSTTICK','CERRESUME','CEVSL','CEVNSTART','CENORMALINIT','CE_FatalHitPending','CEVLAND','AIFinishPose','AIFinishHurt','AIFinishRecovery','AIJuggle','AIJuggleLaunch','AIJuggleAirConfirm','AIJuggleUpPrevious'])delete p[k];
  p.THV=p.MV=p.AIRift=null;p.AIRiftRequest=0;p.VX=p.VY=p.AX=p.AY=p.KB=p.DIZZY=p.FBON=p.SCNT=p.PJ=p.JA=p.ZG=0;p.Y=0;p.ST=0;p.FORCE=0;p.VQ=null;SF2AIRULES.block(p,p.KEYS);aiBreakCombo(p);if(window.SF2AIHeroes?.get(p.aiProfile))SF2AIHeroes.normalStep(p);if(isEvilKen(p)&&p.AIEvilKen?.adapter.heat.move)SF2AIEvilKen.update(p,{keys:0,pressed:0,commands:[]},{anim:setanim,idle:toidle,tick:animstep,sound:()=>{}});
 }
 function victimPose(p){
  if(p.AIFinishPose){setanim(p,p.AIFinishPose.slot,p.AIFinishPose.entry);return;}
  let best={slot:isFFGuest(p)?22:20,entry:0,score:-1};
  const preferred=isFFGuest(p)?22:20;
  for(const slot of[preferred,22]){
   const a=p.F.anims[slot];if(!a)continue;
   for(let entry=0;entry<a.ents.length;entry++){
    setanim(p,slot,entry);p.ST=5;const art=nativeArt(p),parts=SF2AIFINISHERS.partition(art,anatomy(p,art));
    const score=Math.min(...parts.parts.map(q=>q.pixels));if(score>best.score)best={slot,entry,score};if(score>0&&slot===preferred)break;
   }if(best.score>0)break;
  }
  p.AIFinishPose=best;setanim(p,best.slot,best.entry);
 }
 function pose(p,name){
  if(name==='dizzy'){victimPose(p);p.ST=5;p.STUN=9999;return;}
  if(window.SF2AIHeroes?.get(p.aiProfile))SF2AIHeroWeapons.prepare(p);
  const n=name==='win'?31:name==='walk'?1:name==='jump'?5:name==='crouch'?3:0;if(p.cur!==n)setanim(p,n,0);else animstep(p);p.ST=name==='win'?9:name==='jump'?2:name==='crouch'?3:0;p.STUN=0;
 }
 function protectedVictim(d){return finisher?.isVictim(d)&&d.AIFinishProtected;}
 function victimOwned(d){return !!(d.AINativeHeld||d.AIFFHeld||d.CETHV||d.CEBV||d.CEHHV||d.CESpecial);}
 function retainReaction(d){
  if(!protectedVictim(d)||victimOwned(d)||!d.AIFinishPose)return;
  const {slot,entry}=d.AIFinishPose;if(d.cur!==slot||d.aidx!==entry)setanim(d,slot,entry);
  d.ST=5;d.STUN=9999;d.DIZZY=d.STP=0;
 }
 function stepProtectedVictim(d){
  if(!protectedVictim(d)||victimOwned(d)){update(d);return;}
  // Keep the visible source hurt pose hittable while the actual launch and
  // knockback continue. No position alignment or synthetic contact is applied.
  if(d.Y>0||d.VY>0)gravity(d);
  if(d.KB){d.X+=(d.KB*29)>>6;let k=d.KB-((d.KB*29)>>8);if(k+63>>>0<127)k=0;d.KB=k;}
  retainReaction(d);
 }
 function restoreTarget(d){const y=d.Y;pose(d,'dizzy');d.Y=y;d.KB=d.VX=d.VY=d.AX=d.AY=0;d.HP=1;d.HPD=0;if(d.AIFinishHurt){d.DIZZY=d.STP=0;SF2CEDIZZY.interrupt(d);}}
 function normalSlot(p,button,distance=Math.abs(p.opp.X-p.X)/256){return distance<NTHR[p.fid][button]&&p.F.anims[47+button]?47+button:8+button;}
 function normalPlan(p,d,button,section='ground'){
  const relativeHeight=section==='air'?Math.round(Math.max(-96,Math.min(96,(d.Y-p.Y)/256))/8)*8:0,key=section+':'+button+':'+d.AIFinishPose?.slot+':'+d.AIFinishPose?.entry+':'+relativeHeight,cached=normalPlans.get(key);if(cached&&cached.weapon===p.AIHeroWeaponAnimKey)return cached;
  const selected=d.AIFinishPose,target=selected?d.F.anims[selected.slot].ents[selected.entry]:ent(d),hurt=[target[2],target[3],target[4]].filter(b=>b?.[2]);let best=null;
  if(section==='air'){
   for(const base of[53,59]){const slot=base+button,a=p.F.anims[slot];if(!a)continue;
    // Probe the owning collision accessor, including CE's signed long-limb
    // offset correction (not just the raw descriptor's unsigned X field).
    const boxes=a.ents.map((e,i)=>boxw({...p,cur:slot,anim:a,aidx:i,X:0,Y:0,FACE:0},4)).filter(Boolean),forward=Math.max(...a.ents.map(e=>-(p.F.frames[e[0]]?.[4]??0)));
    for(let offset=-96;offset<=96;offset+=2)for(let gap=Math.max(22,Math.ceil((forward-60)/2)*2);gap<=320;gap+=2){let contacts=0;
    for(const b of boxes)if(hurt.some(h=>Math.abs(b[1]-offset-h[1])<b[3]+h[3]-3&&Math.abs(-b[0]-gap-h[0])<b[2]+h[2]-5))contacts++;
    const score=contacts*10-Math.abs(gap-46)-Math.abs(offset-relativeHeight)*1000;if(contacts&&(!best||score>best.score))best={slot,gap,offset,crouch:false,score,air:true};
    }
   }
  }else for(const crouch of section==='launch'&&p.fid===9&&button===5?[false]:['launch','crouching'].includes(section)?[true]:section==='standing'?[false]:[false,true]){
   for(let gap=20;gap<=144;gap++){
    const slot=crouch?14+button:normalSlot(p,button,gap),a=p.F.anims[slot];if(!a)continue;let contacts=0;
    for(const e of a.ents){const b=e[6];if(!b?.[2])continue;if(hurt.some(h=>Math.abs(b[1]-h[1])<b[3]+h[3]-1&&Math.abs(-b[0]-gap-h[0])<b[2]+h[2]-3))contacts++;}
    if(contacts){const score=contacts*100-Math.abs(gap-42);if(!best||score>best.score)best={slot,gap,crouch,score};}
   }if(best)break;
  }
  best??={slot:8+button,gap:40,crouch:false,score:0,air:false};best.weapon=p.AIHeroWeaponAnimKey;normalPlans.set(key,best);return best;
 }
 function tatsuPlan(w,d,strength,startup=false){
  const slot=AN_TAT+Math.min(2,strength),a=w.F.anims[slot],direction=w.FACE?1:-1;
  if(!a)return{distance:28,overlaps:0};const attack=boxw({...w,cur:slot,anim:a,aidx:0,X:0,Y:w.Y+(startup?Math.round(23.375*256):0)},4),hurt=[0,1,2].map(k=>boxw(d,k)).filter(Boolean);if(!attack)return{distance:28,overlaps:0};
  let best=null;for(let distance=20;distance<=56;distance++){
   const contacts=hurt.filter(b=>Math.abs(attack[1]-b[1])<attack[3]+b[3]-2&&Math.abs(attack[0]*direction-distance-(b[0]-d.X/256)*direction)<attack[2]+b[2]-3).length;
   const score=contacts*100-Math.abs(distance-38);if(contacts&&(!best||score>best.score))best={distance,score,overlaps:contacts};
  }return best??{distance:28,overlaps:0};
 }
 const tatsuSpacing=(w,d,strength,startup=false)=>tatsuPlan(w,d,strength,startup).distance;
 function flameSpacing(w,d,strength){
  const data=SF2CEDHALSIM.data,key='flame:'+strength+':'+w.FACE+':'+d.FACE+':'+d.AIFinishPose?.slot+':'+d.AIFinishPose?.entry,cached=normalPlans.get(key);if(cached)return cached.gap;
  const records=[],seen=new Set(),boxes=new Set();let source=data.sources[Math.min(2,strength)];
  while(source&&!seen.has(source)){seen.add(source);const f=data.frames[source];if(!f)break;const r=f.record;if(r?.[2]){const key=r.slice(0,4).join(':');if(!boxes.has(key)){boxes.add(key);records.push(r);}}if(f.flags&32768)break;source=f.next;}
  const sign=w.FACE?1:-1,hurt=[0,1,2].map(k=>boxw(d,k)).filter(Boolean).map(b=>[(b[0]-d.X/256)*sign,b[1]-d.Y/256,b[2],b[3]]);let best={gap:110,score:-Infinity};
  for(let distance=20;distance<=180;distance++){let contacts=0;for(const r of records)for(const offset of data.offsets.slice(1))if(hurt.some(h=>Math.abs(-offset[0]-r[0]-distance-h[0])<r[2]+h[2]-3&&Math.abs(offset[1]+r[1]-h[1])<r[3]+h[3]-2))contacts++;const score=contacts*100-Math.abs(distance-110);if(score>best.score)best={gap:distance,score};}
  normalPlans.set(key,best);return best.gap;
 }
 function gap(w,d,action){
  if(action.kind==='normal')return normalPlan(w,d,action.button,action.section).gap;
  const m=w.F.moves[action.index];if(!m)return 48;
  if(m.inp==='ppp'||m.inp==='kkk')return 38;
  if(m.kind==='tat')return tatsuSpacing(w,d,action.strength??2,true)+11*(TATVX[Math.min(2,action.strength??2)]/65536);
  if(w.fid===7&&m.inp==='hcf')return flameSpacing(w,d,action.strength??2);
  if(m.inp==='qcfu')return 58;
  if(isDamnd(w)&&m.a===100)return 96;
  if(m.role==='far')return 110;
  if(m.kind==='fb'||['pistol','pistol-burst','bolts','bolt-rain','grenade','grenade-barrage','bullet','burst','rain','retreat','belger-retreat','barrel'].includes(m.style)||isDamnd(w)&&action.index===3)return 110;
  if(['dash','sodom-charge','rage'].includes(m.style)||m.kind==='dash')return 110;
  return 38;
 }
 function normalLead(w,d,action){
  const plan=normalPlan(w,d,action.button,action.section),a=w.F.anims[plan.slot];if(!a)return 0;let lead=0;
  for(let i=0;i<a.ents.length;i++){
   const b=boxw({...w,cur:plan.slot,anim:a,aidx:i,X:0,Y:0,FACE:0},4);if(b?.[2]&&b[0]<=0)return lead;
   lead+=!plan.air&&ceNativeNormal(w,plan.slot)&&a.nativeDurations?a.nativeDurations[i]:a.ents[i][1];
  }return lead;
 }
 function readyForMove(w,d,action){
  let recovery=d.AIFinishRecovery;
  if(!recovery){
   if(!d.AIFinishHurt||w.Y!==0||d.Y!==0||victimOwned(d))return true;
   const source=w.F.moves[action.index],unreachable=action.kind==='normal'?action.section!=='air'&&normalPlan(w,d,action.button,action.section).score===0:source?.kind==='tat'&&!tatsuPlan(w,d,action.strength??2,true).overlaps;
   if(!unreachable&&!(isFFGuest(d)&&d.AIFinishPose?.slot===28))return true;
   if(!d.F.anims[30]||d.AIFinishPose?.slot===0)return true;
   recovery=d.AIFinishRecovery={tick:G.tick,started:G.tick,phase:d.CEPF?'projectile-stop':'getup',frames:[]};d.DIZZY=d.STP=0;SF2CEDIZZY.interrupt(d);if(recovery.phase==='getup')setanim(d,30,0);d.ST=10;d.STUN=0;d.KEYS=d.FORCE=0;SF2AIRULES.block(d,0);return false;
  }
  if(recovery.tick===G.tick)return false;recovery.tick=G.tick;d.KEYS=d.FORCE=0;SF2AIRULES.block(d,0);update(d);const frame=d.cur+':'+d.aidx;if(!recovery.frames.includes(frame))recovery.frames.push(frame);
  if(recovery.phase==='projectile-stop'){if(d.CEPF)return false;recovery.phase='getup';setanim(d,30,0);d.ST=10;d.STUN=0;return false;}
  if(d.ST===10)return false;
  d.AIFinishPose={slot:0,entry:0};setanim(d,0,0);d.ST=5;d.STUN=9999;d.DIZZY=d.STP=0;G.AIFinisherRecovery={slot:d.i,started:recovery.started,ended:G.tick,frames:recovery.frames.slice()};delete d.AIFinishRecovery;return true;
 }
 function begin(p,action,d,physics={}){
  const y=p.Y,vm=physics.victimMotion,motion=vm?{VX:Math.round(vm.vx*256),VY:Math.round(vm.vy*256),AX:0,AY:0x60}:{VX:d.VX,VY:d.VY,AX:d.AX,AY:d.AY};resetActor(p);p.Y=y;restoreTarget(d);
  if(action.kind==='special'){Object.assign(d,motion);if(d.Y>0&&!d.AY)d.AY=0x60;}
  p.KEYS=p.PREV=p.HZK=0;SF2AIRULES.block(p,0);
  lastMove={action,started:G.tick,nativeSlot:-1,nativeName:'starting',contacts:0,sourceFrames:[],contactFrames:[]};
  if(action.kind==='normal'){
   const plan=normalPlan(p,d,action.button,action.section),slot=plan.slot;lastMove.plan={...plan};setanim(p,slot,0);p.ST=plan.air?2:1;p.JA=plan.air?1:0;p.RETCR=plan.crouch?1:0;if(!plan.air)p.CENORMALINIT=ceNativeNormal(p,slot);
  }else if(action.command){
   if(action.command==='rift')return null;
   SF2AIEvilKen.reset(p);if(!SF2AIEvilKen.update(p,{keys:0,pressed:0,commands:['ember-kick']},{anim:setanim,idle:toidle,tick:animstep,sound:sfxc}))return null;
  }else if(!startspec(p,[],(action.strength<<4)|(action.index+1)))return null;
  if(action.kind==='special'&&p.fid===4&&p.MV?.kind==='tat')p.SPKD=0;
  lastMove.nativeSlot=p.cur;lastMove.nativeName=p.anim.name;lastMove.components=[{slot:p.cur,name:p.anim.name,index:action.index??null}];
  if(pendingEcho){aiSpecialKOEcho(pendingEcho.owner,{special:true,projectile:!!pendingEcho.owner.FBON});pendingEcho=null;}
  return{duration:600,contacts:[],nativeSlot:p.cur,nativeName:p.anim.name,action,projectileOrder:new Map()};
 }
 function animate(p,move,age,d){
  if(G.hfz>0){G.hfz--;return{advance:false};}
  const special=move.action.kind==='special';let keys=0;
  if(special&&p.MV?.style)lastMove.style=p.MV.style;
  if(move.escapeFollowup&&!move.followupStarted){
   const dir=d.X>p.X?1:-1,target=d.X/256-dir*gap(p,d,{kind:'special',index:0}),delta=target-p.X/256;
   p.X+=Math.trunc(Math.max(-4,Math.min(4,delta))*256);p.FACE=dir>0?1:0;pose(p,'walk');restoreTarget(d);
   if(Math.abs(delta)<=4){pose(p,'idle');if(!startspec(p,[],(2<<4)|1))return{done:true};move.followupStarted=true;move.projectileOrder.clear();lastMove.style=p.MV?.style;lastMove.components.push({slot:p.cur,name:p.anim.name,index:0});}
   return{};
  }
  if(special&&p.CES?.kind==='vegawall'&&p.CES.phase===4&&p.CES.vy<0&&p.Y<44*256&&Math.abs(p.X-d.X)<96*256){keys=(d.X<p.X?1:2)|16;d.ST=0;}
  // Original Andore hold: jump after two shakes, then punch in the air to invert.
  if(special&&p.aiProfile==='andore'&&p.AIFFHold){if(p.AIFFHold.pulses>=2&&!p.AIFFHold.airborne)keys=4;else if(p.AIFFHold.airborne&&p.AIFFHold.airAge>=12)keys=16;}
  if(special&&p.AIHeroGrab){const grab=p.AIHeroGrab;if(grab.phase==='hold'&&grab.age>=32)keys=4;else if(grab.phase==='jump'&&!grab.pile&&grab.airAge>=10)keys=16;}
  p.KEYS=keys;p.FORCE=0;SF2AIRULES.block(p,keys);d.KEYS=d.FORCE=0;SF2AIRULES.block(d,0);
  if(move.action.command){const current=p.AIEvilKen?.adapter.heat.move,target=move.action.command,next=current==='ember-kick'&&target!=='ember-kick'?'furnace-kick':current==='furnace-kick'&&target==='cinder-break'?'cinder-break':null;if(next)p.AIButtons.queue={command:next,tick:G.tick};}
  if(!special)restoreTarget(d);
  if(special&&p.MV?.kind==='tat'&&p.SPPH===1){
   // AI finisher steering stays within the selected native horizontal speed.
   // Approach accounts for startup travel; chase changes velocity, never X/Y.
   const direction=p.FACE?1:-1,delta=(d.X-p.X)/256-direction*tatsuSpacing(p,d,p.SPSTR),speed=TATVX[Math.min(2,p.SPSTR)]/65536;
   p.SVX=Math.round(Math.max(-speed,Math.min(speed,delta*.25))*65536);
  }
  if(special&&p.CES?.kind==='bird'&&p.CES.phase>=2&&p.CES.phase<5){
   const direction=p.FACE?1:-1,delta=(d.X-p.X)/256-direction*38;
   p.CES.vx=Math.round(Math.max(-0x380,Math.min(0x380,delta*64)));
  }
  if(VER.cur==='CE')SF2CEPROJECTILES.stepEffects({tick:G.tick});
  SF2CEDHALSIM.objects(G,P,{hit:ceYogaHit,fire:ceYogaCollision,visible:ceObjectVisible});
  if(move.action.section==='air'){animstep(p);}else update(p);if(special)stepProtectedVictim(d);clampx(p);
  const frame=p.cur+':'+p.aidx;if(lastMove.sourceFrames.length<128&&!lastMove.sourceFrames.includes(frame))lastMove.sourceFrames.push(frame);
  if(special&&p.AIHeroMove?.style==='wall'&&p.AIHeroMove.phase==='dive'&&!move.wallAimed){
   const attack=p.anim.ents.find(e=>e[6]?.[2])?.[6],head=boxw(d,0),sign=p.FACE?1:-1;if(attack&&head){let elapsed=0,activeEnd=0;for(const e of p.anim.ents){elapsed+=e[1];if(e[6]?.[2])activeEnd=elapsed;}const y=Math.max(0,head[1]-attack[1]),height=Math.max(0,p.Y/256-y),vy=p.VY/256,ay=Math.max(.1,p.AY/256),ticks=Math.max(8,Math.min(60,(vy+Math.sqrt(vy*vy+2*ay*height))/ay,activeEnd?activeEnd-3:60)),target=head[0]-(p.FACE?-attack[0]:attack[0]);p.VX=Math.round(sign*Math.max(0x200,Math.min(0x1600,Math.abs(target-p.X/256)/ticks*256)));lastMove.wallAim={vx:p.VX,ticks,target};}move.wallAimed=true;
  }
  if(move.action.command){const current=p.AIEvilKen?.adapter.heat.move;if(current&&move.heatVoice!==current){move.heatVoice=current;const code=current==='cinder-break'?p.F.sfx.sp[2][0][1]:p.F.sfx.wh[5];AI_SPECIAL_VOICES[p.i]={last:{commands:[[0,code]],sample:null,kind:'evil-ken-heat',tick:G.tick}};}}
  const priorContacts=lastMove.contacts,trajectory=special&&p.MV?.kind==='tat'&&priorContacts>0&&!victimOwned(d)?{VX:d.VX,VY:d.VY,AX:d.AX,AY:d.AY,KB:d.KB}:null;
  for(const o of[...(p.AIFFBullets||[]),...(p.AIFFGrenades||[])])if(!move.projectileOrder.has(o))move.projectileOrder.set(o,move.projectileOrder.size);
  lastMove.projectileOrder=move.projectileOrder;
  fbmove(p);const probe=hitprobe(p);hitcheck(p,probe);fbhit(p);fbafter(p);
  // A multihit whirlwind follows its first real launch arc. Later real spin
  // contacts change the hurt pose without restarting that arc on every pulse.
  if(trajectory&&lastMove.contacts>priorContacts&&protectedVictim(d)&&!victimOwned(d))Object.assign(d,trajectory);
  if(special)retainReaction(d);
  if(!special||move.action.command&&p.AIEvilKen?.adapter.heat.move!==move.action.command)restoreTarget(d);
  G.slow=0;
  const attached=!!(p.AINativeGrab||d.AINativeHeld||p.THV||p.AIFFHold||p.AIFFThrow||p.AIHeroGrab||p.CETH||d.CETHV||d.AIFFHeld),projectile=!!(p.FBON||p.AIFFBullets?.length||p.AIFFGrenades?.length||p.AIFFProjectile||p.AIDamndBarrel);
  const done=!attached&&!projectile&&p.ST!==1&&p.ST!==2&&p.ST!==11&&age>0;
  const selected=p.F.moves[move.action.index],escape=special&&(p.aiProfile==='vega'&&selected?.inp==='bb'||p.aiProfile==='belger'&&['vault','belger-hop','belger-retreat'].includes(selected?.style)||['escape','movement'].includes(selected?.role));
  if(done&&escape&&!move.escapeFollowup&&lastMove.contacts===0){move.escapeFollowup=true;return{};}
  return{done:!special?(p.adone||p.ST!==1&&p.ST!==2):done};
 }
 const hurtPoses=new WeakMap();
 function nextDamagePose(p){
  let poses=hurtPoses.get(p.F);if(!poses){const seen=new Set(),guest=isFFGuest(p),lying=new Set(guest?(p.F.anims[29]?.ents||[]).map(e=>e[0]):[]);poses=[];for(const slot of guest?[20,21,22,28]:[20,21,22]){const a=p.F.anims[slot];if(!a)continue;for(let entry=0;entry<a.ents.length;entry++){const e=a.ents[entry],frame=e[0];if(seen.has(frame)||lying.has(frame)||!e.slice(2,5).some(b=>b?.[2]))continue;seen.add(frame);poses.push({slot,entry});}}hurtPoses.set(p.F,poses);}
  if(!poses.length)return null;const at=poses.findIndex(q=>q.slot===p.AIFinishPose?.slot&&q.entry===p.AIFinishPose?.entry);return poses[(Math.max(-1,at)+1)%poses.length];
 }
 function damagePose(p,sequence){
  p.AIFinishHurt=true;p.DIZZY=0;SF2CEDIZZY.interrupt(p);
  if(p.AINativeHeld||p.AIFFHeld||p.CETHV||p.CEBV||p.CEHHV)return;
  const next=nextDamagePose(p);if(!next)return;p.AIFinishPose={...next};setanim(p,next.slot,next.entry);p.ST=5;p.STUN=9999;
 }
 function playDeathVoice(d){if(deathVoicePlayed)return;deathVoicePlayed=true;G.AIFinisherDeathVoice={tick:G.tick,slot:d.i};if(isFFGuest(d))ffSound(d,'ko');else sfxc(XS(d)?.ko,SN_KO);}
 const host={
  context:()=>({enabled:aiEnabled(),scene:G.scene,tick:G.tick,phase:G.gph,seed:G.AIMatchSeed,players:P,room:aiRoom(),training:!!AICFG.prototype&&!!AICFG.training,keys:P.map(p=>p.KEYS)}),
  art:nativeArt,anatomy,mouth:aiMouth,damagePose,
  captureSource:(w,d,source)=>({...source,special:source.special??(w.ST===11&&!['throw','athrow','ai-rift'].includes(w.MV?.kind))}),
  prepare(w,d){deathVoicePlayed=false;savedDeathVoice=AI_SPECIAL_VOICES[w.i];resetActor(w);resetActor(d);for(const p of[w,d])SF2AIFFChair.dismount(p,'finisher');normalPlans.clear();SF2CEDHALSIM.reset(G,P);window.SF2AIHeroWeapons?.disarm(d,d.FACE?-1:1);window.SF2AIHeroWeapons?.cancelFlights(null,aiRoom());inputPrevious=w.KEYS;promptPrevious=0;d.AIFinishProtected=true;d.HP=1;d.HPD=0;G.hfz=G.slow=0;G.CESpecialObjects=null;delete G.CESpecialSlow;AI_RETCH[d.i]=null;AI_FLOOR_COUGHS[d.i]=null;AI_DEATH_FX.length=0;},
  input(w,phase){const keys=w.KEYS,nw=keys&~inputPrevious,rel=inputPrevious&~keys,events=motion(w,keys,nw,rel);inputPrevious=keys;if(phase!=='prompt')return;for(const event of events){const index=w.F.moves.findIndex(m=>m.inp===event[0]&&m.btn===event[1]);if(index>=0&&finisher.request(w.i,{index,strength:event[2]},{fresh:true,serial:G.tick}))break;}},
  // Native knockdown physics, a one-second floor hold, then half-speed get-up.
  recover(d){fallst(d,7,d.FACE?-1:1);recovery={phase:'fall',age:0,hold:0};return 20;},
  recoverStep(d){recovery.age++;if(recovery.phase==='fall'){update(d);clampx(d);if(d.Y<=0&&d.cur===29){recovery.phase='floor';d.VX=d.VY=0;}}
   else if(recovery.phase==='floor'){if(!d.adone)animstep(d);if(++recovery.hold>=60){setanim(d,30,0);d.ST=10;d.DIZZY=1;recovery.phase='getup';}}
   else if(recovery.phase==='getup'&&!d.adone&&recovery.age%2===0)animstep(d);},
  recovered:()=>!!(recovery?.phase==='getup'&&P[finisher.view().victim].adone),
  stun(d){const slot=isFFGuest(d)?103:21;setanim(d,slot,0);d.anim={...d.anim,mode:0,loop:0};d.ST=5;d.STUN=9999;d.DIZZY=2;},
  promptMove(w,d,options={}){const raw=w.KEYS,keys=raw&15,previous=promptPrevious;promptPrevious=keys;w.X0=w.X;w.KEYS=keys;SF2AIRULES.block(w,keys);controls(w,{keys,nw:keys&~previous,rel:previous&~keys,ev:[],force:0});clampx(w);w.KEYS=raw;w.PREV=raw;if(!options.ready)animstep(d);},
  pose,gap,normalLead,readyForMove,airOffset:(w,d,a)=>normalPlan(w,d,a.button,a.section).offset??16,
  specials:p=>SF2AIRULES.mapping(p).filter(m=>m.command!=='rift'&&(!m.command||isEvilKen(p))).map(m=>({...m})),
  rotationMoves(p,moves){const selected=p.F.moves[finisher.info().request?.index],reserveKnife=p.aiProfile==='cody'&&['hero-knife','hero-knife-throw'].includes(selected?.style);return moves.filter(m=>m.command?isEvilKen(p):p.F.moves[m.index]?.kind!=='evade'&&!['escape','movement'].includes(p.F.moves[m.index]?.role)&&(!reserveKnife||['hero-uppercut','hero-knife'].includes(p.F.moves[m.index]?.style)));},
  valid:(p,m)=>m.command?isEvilKen(p):!!p.F.moves[m.index]&&(window.SF2AIHeroWeapons?.validMove(p,p.F.moves[m.index])??true),
  isCPU:p=>p.i===1&&!G.mode2p,
  begin,animate,
  travel:(w,d,dx)=>aiFinisherTravel(w,d,dx),
  finishMove(p){if(lastMove)lastMove.finished={tick:G.tick,state:p.ST,slot:p.cur,entry:p.aidx,adone:p.adone,FBTK:p.FBTK,SPEND:p.SPEND,SPPH:p.SPPH};resetActor(p);},
  position:(p,v)=>{p.X=Math.round(v.x*256);p.Y=Math.round(v.y*256);p.FACE=v.face;},
  lockVictim:(w,d,phase)=>phase!=='special'&&lastMove?.action.kind!=='special',
  remainingArt:(p,a)=>SF2AIFF.heldArt(p,a),
  partPoint(p,part,pose){
   const sign=p.FACE?-1:1;
   if(p.AIFFHeld?.inverted){const r=pose.art.rect,x=-Math.floor(r[2]/2)+r[2]-part.source[0]-part.source[2]/2,y=-Math.floor(r[3]/2)+r[3]-part.source[1]-part.source[3]/2;return{x:p.X/256+sign*x,y:p.Y/256-y,face:p.FACE,angle:Math.PI};}
   return{x:p.X/256+sign*part.pivot[0],y:p.Y/256-part.pivot[1],face:p.FACE,angle:0};
  },
  blood:(packet,d)=>aiBloodAdd(packet,d.i),stain:aiClothesStain,
  backdrop(ctx,args){ctx.save();ctx.translate(-aiHorizontalInset,0);window.SF2AIFinisherTunnel?.draw(ctx,{...args,top:aiWorldTop,width:aiViewWidth(),height:aiWorldSurface.height});ctx.restore();},
  hitstop(){G.hfz=0;},
  impact:e=>{G.AIFinisherContact={tick:G.tick,button:e.button,special:e.special,sequence:e.sequence};},
  finalImpact:e=>{playDeathVoice(e.victim);aiFinalHitEcho(e.winner);},
  fire:e=>{fire={tick:G.tick,x:e.point.x,y:e.point.y};AI_RETCH[e.victim.i]=AI_TEETH[e.victim.i]=AI_FLOOR_COUGHS[e.victim.i]=null;},
  echo:(w,request)=>{if(lastMove?.nativeSlot===-1)pendingEcho={owner:w,request};else aiSpecialKOEcho(w,{special:true,projectile:!!w.FBON});},
  start(w){if(AC&&!muted)try{aiFinalHitBuffer(w);}catch{}const v=SF2CECAMERA.state;cinema={started:G.tick,fromCam:G.cam,fromWidth:aiViewWidth(),cam:G.cam,width:aiViewWidth(),panY:0,inset:G.AICamera?.inset||0,vertical:{...v,video:{...v.video}},frame:null};AI_SKO_VIEW=null;},
  camera(w,active,meta={}){
   AI_SKO_VIEW=null;if(!active){cinema=null;return;}if(!cinema||!['approach','combo','special','settle'].includes(meta.phase))return;
   const f=measureFraming(false);if(!f)return;const room=aiRoom(),v=cinema.vertical;
   // Keep the captured projection. Expand only when a fighter reaches its bounds.
   const required=Math.min(room.right-room.left,Math.max(cinema.width,f.right-f.left+16,(f.top-f.bottom+16)*W/(H-56)));
   cinema.width=Math.max(cinema.width,required);
   const zoom=W/cinema.width,top=GROUND+zoom*(v.main-f.top),bottom=GROUND+zoom*(v.main-f.bottom);cinema.panY=Math.max(56-top,Math.min(H-8-bottom,cinema.panY));
   const lo=Math.max(room.left,f.right+8+cinema.inset-cinema.width),hi=Math.min(room.right-cinema.width,f.left-8+cinema.inset);
   if(lo<=hi)cinema.cam=Math.max(lo,Math.min(hi,cinema.cam));
   cinema.cam=Math.max(room.left,Math.min(room.right-cinema.width,cinema.cam));cinema.frame=f;
  },
  // SF2ENDCE[8].mus = 0x8c: original CE boss-ending march, not stage BGM.
  banner(text){banner=text;if(text&&savedMusic===null){savedMusic=MUS;music(0x8c);}},
  complete(w,d){if(savedMusic!==null){music(savedMusic);savedMusic=null;}savedDeathVoice=null;resetActor(w);resetActor(d);delete d.AIFinishProtected;d.HP=d.HPD=0;d.ST=8;pose(w,'win');portrait=portraitCutout(w,d);endround(1<<w.i,false,{koVoicePlayed:deathVoicePlayed});},
  fallback(w,d,source={special:false}){if(!source.alreadyFinished)playDeathVoice(d);resetActor(w);resetActor(d);if(savedDeathVoice)AI_SPECIAL_VOICES[w.i]=savedDeathVoice;savedDeathVoice=null;delete d.AIFinishProtected;d.HP=d.HPD=0;aiDeathBegin(d,{...source,special:source.special&&!source.alreadyFinished});fallst(d,8,d.FACE?-1:1);endround(1<<w.i,false,{koVoicePlayed:deathVoicePlayed});},
  cleanup(reason,w,d,meta={}){aiEchoStop();cinema=recovery=null;if(savedMusic!==null){music(savedMusic);savedMusic=null;}lastDamage=-Infinity;if(w)resetActor(w);if(d){resetActor(d);if(d.AIFinishProtected){delete d.AIFinishProtected;d.HP=d.HPD=0;}}if(reason==='winner-ko'){for(const p of[w,d])if(p&&p.HP<=0)fallst(p,8,p.FACE?-1:1);}if(!meta.fallback)savedDeathVoice=null;banner='';fire=portrait=pendingEcho=null;lastMove=null;AI_SKO_VIEW=null;},
  aborted:reason=>{G.AIFinisherAbort=reason;}
 };
 finisher=SF2AIFINISHERS.create(host);
 window.render_game_to_text??=()=>JSON.stringify({edition:VER.edition,scene:G.scene,phase:G.gph,players:P.map(p=>({slot:p.i,profile:aiIdentity(p),baseProfile:p.aiProfile||CE_KEYS[p.fid],x:p.X/256,y:p.Y/256,hp:finisher.isVictim(p)?0:p.HP,maxHP:aiMax(p),wins:p.WINS,state:p.ST,animation:p.anim?.name,frame:p.aidx})),finisher:finisher.info(),blood:{particles:AI_BLOOD.particles.length,stains:AI_BLOOD.stains.length},camera:{x:G.cam,width:aiViewWidth()},coordinates:'world pixels; Y upwards'});
 // Preview only the original native action controller and animation clock.
 // No damage, contact callback, sound, game clock or real actor is advanced.
 function reactionForecast(p,{strength=ent(p)[8],knockdown=ent(p)[9]||p.SPKD}={}){
  const d=p.opp,dir=d.X>=p.X?1:-1,next=nextDamagePose(d),pose=next?{...d,cur:next.slot,anim:d.F.anims[next.slot],aidx:next.entry}:d,q={...d},hurt=[0,1,2].map(k=>boxw(pose,k)).filter(Boolean).map(b=>[b[0]-(d.X>>8),b[1]-(d.Y>>8),b[2],b[3]]);
  if(d.Y>0||knockdown)Object.assign(q,{VX:dir*0x200,VY:0x500,AX:0,AY:0x48,KB:0});else q.KB=dir*PUSHKB[Math.min(2,strength)];
  return{actor:q,hurt,step(){if(q.Y>0||q.VY>0)gravity(q);if(q.KB){q.X+=(q.KB*29)>>6;let k=q.KB-((q.KB*29)>>8);if(k+63>>>0<127)k=0;q.KB=k;}},overlaps(b){return b&&hurt.some(h=>Math.abs(b[0]-(q.X>>8)-h[0])<=b[2]+h[2]&&Math.abs(b[1]-(q.Y>>8)-h[1])<=b[3]+h[3]);}};
 }
 function previewTravel(owner,victim,objects=[]){
  if(!G.AIFinisherTravel)return;const limits=SF2AIFINISHERS.LIMITS,dx=Math.round((owner.FACE?1:-1)*limits.trailDrift/limits.trailLife*256)/256,centre=(owner.X+victim.actor.X)/512+dx,rebase=centre<1024||centre>3072?Math.round((2048-centre)*256)/256:0,shift=dx+rebase,fixed=Math.round(shift*256);
  owner.X+=fixed;victim.actor.X+=fixed;for(const o of objects)o.x+=shift;
 }
 function futureNativeWindow(p){
  const c=p.CES,q={...p,CES:{...c},hitdone:1},h={find:AI,anim:setanim,tick:animstep,idle:a=>{a.ST=0;a.CES=null;},sound:()=>{},land:()=>{},wall:()=>false,cam:G.cam,stage:G.stage};
  const victim=reactionForecast(p);
  for(let tick=1;tick<=180&&q.ST===11&&q.CES;tick++){
   previewTravel(q,victim);
   if(c.kind==='bird'&&q.CES.phase>=2&&q.CES.phase<5){const direction=q.FACE?1:-1,delta=(victim.actor.X-q.X)/256-direction*38;q.CES.vx=Math.round(Math.max(-0x380,Math.min(0x380,delta*64)));}
   SF2CESPECIALS.step(q,h);if(q.ST!==11||!q.CES)break;animstep(q);victim.step();
   if(c.kind==='hundredhands')SF2CEHONDAHANDS.probe(q);
   if(!q.hitdone&&victim.overlaps(boxw(q,4)))return true;
  }return false;
 }
 function futureSpinWindow(p){
  const s=p.AIFFMove,q={...p},phase=s.phase,victim=reactionForecast(p);
  for(let tick=1;tick<=85-s.age&&!q.adone;tick++){
   previewTravel(q,victim);animstep(q);victim.step();const next=Math.min(2,Math.floor((s.age+tick-6)/9));
   if(next>phase&&victim.overlaps(boxw(q,4)))return true;
  }return false;
 }
 function futureHeroWindow(p){
  const q={...p,AIHeroMove:{...p.AIHeroMove},hitdone:1},victim=reactionForecast(p),h={anim:setanim,idle:a=>{a.ST=0;delete a.AIHeroMove;},gravity,room:aiRoom,sound:()=>{},cost:()=>{}};
  for(let tick=1;tick<=100&&q.ST===11&&q.AIHeroMove;tick++){previewTravel(q,victim);victim.step();SF2AIHeroes.step(q,h);if(q.ST!==11||!q.AIHeroMove)break;animstep(q);if(!q.hitdone&&victim.overlaps(boxw(q,4)))return true;}return false;
 }
 function futureDamndWindow(p){
  const q={...p,AIDamndMove:{...p.AIDamndMove},hitdone:1},victim=reactionForecast(p),h={idle:a=>{a.ST=0;delete a.AIDamndMove;},gravity,sound:()=>{}};
  for(let tick=1;tick<=90&&q.ST===11&&q.AIDamndMove;tick++){previewTravel(q,victim);SF2AIDamnd.step(q,h);if(q.ST!==11||!q.AIDamndMove)break;animstep(q);victim.step();SF2AIDamnd.contactWindow(q);const b=boxw(q,4),overlap=victim.overlaps(b);if(!q.hitdone&&overlap)return true;}return false;
 }
 function futureVolleyContact(p,impact,style){
  if(!['bolt-rain','belger-retreat'].includes(style))return null;
  const pending=(p.AIFFBullets||[]).filter(b=>b!==impact.object&&!b.hit).map(b=>({...b})),victim=reactionForecast(p,{strength:2,knockdown:0}),q={...p},s=p.AIFFMove?{...p.AIFFMove}:null;
  // A rain volley has already emitted all three bolts before its first possible
  // descending contact. A retreat can still owe its age-40 diagonal release.
  if(style==='bolt-rain'&&lastMove.projectileOrder.size<3)return null;
  if(style==='belger-retreat'&&lastMove.projectileOrder.size<3&&(!s||s.age>40))return null;
  let emitted=lastMove.projectileOrder.size;
  for(let tick=1;tick<=180;tick++){
   previewTravel(q,victim,pending);
   victim.step();
   if(style==='belger-retreat'&&s&&s.age<40){
    s.age++;if([20,30,40].includes(s.age)){const dir=q.FACE?1:-1;pending.push({type:'bolt',x:q.X/256+dir*36,y:q.Y/256+32,vx:dir*(0x5a700/65536),vy:-0x5a700/65536,ay:0,dir,age:0,hit:false,rain:false,diagonal:true,fresh:true});emitted++;}
    // Original belgerStep airborne recoil, including its twelve-tick apex hold.
    if(!s.hovered&&(q.VY>>8)===1){s.hovered=true;s.hover=0;}
    if(s.hover!==undefined&&s.hover<12){q.X+=q.VX;q.Y+=[1,1,0,0,0,0,0,0,0,0,-1,-1][s.hover++]*256;if(s.hover===12)q.VY=-0x1c0;}else gravity(q);
   }
   for(const b of pending){if(b.hit)continue;if(b.fresh){delete b.fresh;continue;}b.age++;if(b.rain&&b.age===1)continue;b.x+=b.vx;b.vy-=b.ay;b.y+=b.vy;if(b.y<0||b.age>120){b.hit=true;continue;}if(b.rain&&b.age<33)continue;const warm=!b.rain&&!b.diagonal&&b.age<3,box=[b.x+(warm?-27*b.dir:0),b.y,warm?44:16,16];if(victim.overlaps(box))return true;}
   if(emitted>=3&&pending.every(b=>b.hit))return false;
  }return null;
 }
 function lastMoveFinal(p,target,current,impact){
  if(finisher.view()?.phase!=='special')return false;
  if(target)return target===current;
  const selected=p.F.moves[lastMove?.action.index],style=p.MV?.style||lastMove.style||selected?.style;
  if(impact?.kind==='grenade')return !impact.object.combo||impact.object.index===2;
  if(impact?.kind==='bullet'){
   const count=['pistol-burst','bolts','bolt-rain','belger-retreat'].includes(style)?3:1;
   if(lastMove.projectileOrder?.get(impact.object)===count-1)return true;
   return futureVolleyContact(p,impact,style)===false;
  }
  if(p.AIFFHold){const c=p.AIFFHold;if(c.kind==='abigail-choke')return c.pulses===6;if(c.kind==='batter')return c.pulses===(p.aiProfile==='sodom'?1:3);return false;}
  if(p.AIHeroGrab&&p.AIHeroGrab.phase==='hold')return p.AIHeroGrab.punches===4;
  if(p.AIDamndMove&&[100,101].includes(p.MV?.a))return !futureDamndWindow(p);
  if(p.AIFFMove&&style==='sodom-double')return p.AIFFMove.phase===1;
  if(p.AIFFMove&&style==='spin')return !futureSpinWindow(p);
  if(p.AIHeroMove?.style==='escape')return !futureHeroWindow(p);
  if(p.CES&&['hundredhands','legs','bird'].includes(p.CES.kind))return !futureNativeWindow(p);
  if(p.CES?.kind==='scissor')return p.anim.groups?.[p.aidx]===23;
  if(p.CES?.kind==='vegaroll'){const last=p.anim.ents.findLastIndex(e=>e[6]?.[2]);return p.aidx>=last;}
  if(p.MV?.kind!=='tat')return true;
  if(p.SPPH!==1)return false;
  const active=ent(p)[6];if(!active?.[2]||active[0]>0)return false;
  const end=p.SPEND-(TATLANDF[p.fid]||12);if(!p.SPEND)return false;
  const entries=p.anim.ents;let remaining=-p.acc,first=0,found=false;
  for(let i=0;i<entries.length;i++){if(i>=p.aidx)remaining+=entries[i][1];const b=entries[i][6];if(!found&&b?.[2]&&b[0]<=0)found=true;else if(!found)first+=entries[i][1];}
  return found&&p.FBTK+Math.max(1,remaining)+first>=end;
 }
 function measureFraming(render=false){
  const state=finisher.view();if(!state||G.scene!=='fight')return null;const actors=render?SF2CECAMERA.poses||P:P,bounds=[];
  for(const p of actors){if(finisher.hidden(p))continue;const r=finisher.art(p,nativeArt(p)).rect,x=p.X/256,y=p.Y/256,left=x+(p.FACE?-r[4]-r[2]:r[4]);bounds.push({left,right:left+r[2],top:y-r[5],bottom:y-r[5]-r[3]});}
  if(!bounds.length)return null;const left=Math.min(...bounds.map(b=>b.left)),right=Math.max(...bounds.map(b=>b.right)),top=Math.max(...bounds.map(b=>b.top)),bottom=Math.min(...bounds.map(b=>b.bottom)),width=right-left+28,height=top-bottom+12,zoom=Math.min(2.2,W/width,(H-72)/height);
  return{left,right,top,bottom,zoom,width:Math.max(320,width,height*W/(H-72))};
 }
 const burn=Object.values(SF2CESPECIALDATA.fighters[0]).find(a=>a.name==='ceSpecialBurn15350'),frames=burn.extraArt.map(a=>{const image=new Image();image.src=SF2CESPECIALDATA.images[a.images[0]];return{image,rect:a.rect};});
 return Object.assign(finisher,{
  withImpact(owner,metadata,resolve){const previous=impactContext;impactContext={owner,...metadata};try{return resolve();}finally{impactContext=previous;}},
  damage(d,amount,effect){if(!protectedVictim(d))return false;if(amount>0){lastDamage=G.tick;lastMove&&(lastMove.contacts++);const w=d.opp,target=lastMove?.action.command,current=w.AIEvilKen?.adapter.heat.move,impact=impactContext?.owner===w?impactContext:null,final=lastMoveFinal(w,target,current,impact);if(lastMove&&lastMove.contactFrames.length<128)lastMove.contactFrames.push({tick:G.tick,slot:w.cur,entry:w.aidx,acc:w.acc,FBTK:w.FBTK,SPEND:w.SPEND,SPPH:w.SPPH,final,impact:impact?{kind:impact.kind,index:impact.object.index,order:lastMove.projectileOrder?.get(impact.object)}:null,attack:impact?.box||boxw(w,4),hurt:[0,1,2].map(k=>boxw(d,k))});finisher.notify(w,d,++contactSerial,{final});}d.HP=1;d.HPD=0;return true;},
  nativeMove:()=>lastMove?{...lastMove,action:{...lastMove.action}}:null,
  previewContactWindow:(p,metadata)=>lastMoveFinal(p,lastMove?.action.command,p.AIEvilKen?.adapter.heat.move,metadata||(impactContext?.owner===p?impactContext:null)),
  sourceBox(p,k){const selected=p.AIFinishPose;if(!protectedVictim(p)||k>2||!selected||!(p.AIFFHeld||p.CETHV||p.CEBV))return undefined;const b=p.F.anims[selected.slot].ents[selected.entry][2+k];return b?.[2]?[(p.FACE?-b[0]:b[0])+p.X/256,b[1]+p.Y/256,b[2],b[3]]:null;},
  banner:()=>banner,
  shade:()=>finisher.active()&&finisher.view()?.phase!=='ready' ? .64 : 0,
  counter:()=>{const s=finisher.info();return s.contacts&&s.phase!=='result'?s.contacts+' HIT'+(s.contacts===1?'':'S'):'';},
  framing:()=>cinema&&G.scene==='fight'?cinema.frame:null,
  cameraLock:()=>cinema&&G.scene==='fight'?cinema:null,
  focus:()=>null,
  drawFire(ctx,camera,ground){if(!fire)return;const age=G.tick-fire.tick;if(age>=24)return;const a=frames[Math.floor(age/2)%frames.length];if(!a.image.complete)return;ctx.save();ctx.globalAlpha=.9;spr(a.image,a.rect,fire.x-camera,ground-12,0);ctx.restore();},
  drawResult(ctx){if(G.scene!=='win'||!finisher.retained()||!portrait)return;const s=finisher.view();ctx.save();if(s.winner===1){ctx.translate(W,0);ctx.scale(-1,1);}ctx.beginPath();ctx.rect(0,16,192,144);ctx.clip();for(const offset of[18,12,6]){ctx.globalAlpha=.7-offset/40;ctx.drawImage(portrait,offset+Math.round(Math.sin(G.tick/9)),16);}ctx.globalAlpha=1;ctx.drawImage(portrait,0,16);ctx.restore();},
  ready:Promise.all(frames.map(a=>a.image.decode()))
 });
};
