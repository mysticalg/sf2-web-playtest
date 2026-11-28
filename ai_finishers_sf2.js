/* Adapter to this port's real normal, special, throw and projectile controllers.
 * Loaded before game.js; bindSF2 is called only after game actors are initialized.
 * The finishing presentation is an authored AI Edition extension, not ROM parity.
 */
'use strict';
window.SF2AIFINISHERS.bindSF2=()=>{
 let finisher,banner='',fire=null,portrait=null,pendingEcho=null,savedDeathVoice=null,contactSerial=0,lastMove=null,inputPrevious=0,promptPrevious=0,cinema=null,recovery=null,savedMusic=null,lastDamage=-Infinity,deathVoicePlayed=false;const normalPlans=new Map();
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
  for(const k of['AIFFMove','AIFFHold','AIFFHeld','AIFFThrow','AIFFNormal','AIFFWall','AIFFSlide','AIFFProjectile','AIFFGrenades','AIFFBullets','AIHeroMove','AIHeroGrab','AIHeroWall','AIHeroAir','AIHeroPhase','AIHeroInvuln','AIDamndMove','AIDamndBarrel','AIAir','CES','CEPF','CEKO','CETH','CETHV','CEHH','CEHHV','CEHHPush','CEHHPostPush','CEBV','CEB','CER','CERSTOP','CEGUARD','CESHAKE','CERHOSTTICK','CERRESUME','CEVSL','CEVNSTART','CENORMALINIT','CE_FatalHitPending','CEVLAND','AIFinishPose'])delete p[k];
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
 function restoreTarget(d){const y=d.Y;pose(d,'dizzy');d.Y=y;d.KB=d.VX=d.VY=d.AX=d.AY=0;d.HP=1;d.HPD=0;}
 function normalSlot(p,button,distance=Math.abs(p.opp.X-p.X)/256){return distance<NTHR[p.fid][button]&&p.F.anims[47+button]?47+button:8+button;}
 function normalPlan(p,d,button,section='ground'){
  const key=section+':'+button,cached=normalPlans.get(key);if(cached&&cached.weapon===p.AIHeroWeaponAnimKey)return cached;
  const selected=d.AIFinishPose,target=selected?d.F.anims[selected.slot].ents[selected.entry]:ent(d),hurt=[target[2],target[3],target[4]].filter(b=>b?.[2]);let best=null;
  if(section==='air'){
   for(const base of[53,59]){const slot=base+button,a=p.F.anims[slot];if(!a)continue;
    // Probe the owning collision accessor, including CE's signed long-limb
    // offset correction (not just the raw descriptor's unsigned X field).
    const boxes=a.ents.map((e,i)=>boxw({...p,cur:slot,anim:a,aidx:i,X:0,Y:0,FACE:0},4)).filter(Boolean),forward=Math.max(...a.ents.map(e=>-(p.F.frames[e[0]]?.[4]??0)));
    for(let offset=-40;offset<=60;offset+=2)for(let gap=Math.max(22,Math.ceil((forward-60)/2)*2);gap<=320;gap+=2){let contacts=0;
    for(const b of boxes)if(hurt.some(h=>Math.abs(b[1]-offset-h[1])<b[3]+h[3]-3&&Math.abs(-b[0]-gap-h[0])<b[2]+h[2]-5))contacts++;
    const score=contacts*10-Math.abs(gap-46)-Math.abs(offset-16)*1000;if(contacts&&(!best||score>best.score))best={slot,gap,offset,crouch:false,score,air:true};
    }
   }
  }else for(const crouch of ['launch','crouching'].includes(section)?[true]:section==='standing'?[false]:[false,true]){
   for(let gap=20;gap<=144;gap++){
    const slot=crouch?14+button:normalSlot(p,button,gap),a=p.F.anims[slot];if(!a)continue;let contacts=0;
    for(const e of a.ents){const b=e[6];if(!b?.[2])continue;if(hurt.some(h=>Math.abs(b[1]-h[1])<b[3]+h[3]-1&&Math.abs(-b[0]-gap-h[0])<b[2]+h[2]-3))contacts++;}
    if(contacts){const score=contacts*100-Math.abs(gap-42);if(!best||score>best.score)best={slot,gap,crouch,score};}
   }if(best)break;
  }
  best??={slot:8+button,gap:40,crouch:false,score:0,air:false};best.weapon=p.AIHeroWeaponAnimKey;normalPlans.set(key,best);return best;
 }
 function gap(w,d,action){
  if(action.kind==='normal')return normalPlan(w,d,action.button,action.section).gap;
  const m=w.F.moves[action.index];if(!m)return 48;
  if(m.inp==='ppp'||m.inp==='kkk')return 38;
  if(m.inp==='qcfu')return 58;
  if(m.role==='far')return 110;
  if(m.kind==='fb'||['pistol','pistol-burst','bolts','bolt-rain','grenade','grenade-barrage','bullet','burst','rain','retreat','belger-retreat','barrel'].includes(m.style)||isDamnd(w)&&action.index===3)return 110;
  if(['dash','sodom-charge','rage'].includes(m.style)||m.kind==='dash')return 110;
  return 38;
 }
 function begin(p,action,d){
  const y=p.Y;resetActor(p);p.Y=y;restoreTarget(d);p.KEYS=p.PREV=p.HZK=0;SF2AIRULES.block(p,0);
  lastMove={action,started:G.tick,nativeSlot:-1,nativeName:'starting',contacts:0};
  if(action.kind==='normal'){
   const plan=normalPlan(p,d,action.button,action.section),slot=plan.slot;setanim(p,slot,0);p.ST=plan.air?2:1;p.JA=plan.air?1:0;p.RETCR=plan.crouch?1:0;if(!plan.air)p.CENORMALINIT=ceNativeNormal(p,slot);
  }else if(action.command){
   if(action.command==='rift')return null;
   SF2AIEvilKen.reset(p);if(!SF2AIEvilKen.update(p,{keys:0,pressed:0,commands:['ember-kick']},{anim:setanim,idle:toidle,tick:animstep,sound:sfxc}))return null;
  }else if(!startspec(p,[],(action.strength<<4)|(action.index+1)))return null;
  lastMove.nativeSlot=p.cur;lastMove.nativeName=p.anim.name;lastMove.components=[{slot:p.cur,name:p.anim.name,index:action.index??null}];
  if(pendingEcho){aiSpecialKOEcho(pendingEcho.owner,{special:true,projectile:!!pendingEcho.owner.FBON});pendingEcho=null;}
  return{duration:600,contacts:[],nativeSlot:p.cur,nativeName:p.anim.name,action};
 }
 function animate(p,move,age,d){
  if(G.hfz>0){G.hfz--;return{advance:false};}
  const special=move.action.kind==='special';let keys=0;
  if(move.escapeFollowup&&!move.followupStarted){
   const dir=d.X>p.X?1:-1,target=d.X/256-dir*gap(p,d,{kind:'special',index:0}),delta=target-p.X/256;
   p.X+=Math.trunc(Math.max(-4,Math.min(4,delta))*256);p.FACE=dir>0?1:0;pose(p,'walk');restoreTarget(d);
   if(Math.abs(delta)<=4){pose(p,'idle');if(!startspec(p,[],(2<<4)|1))return{done:true};move.followupStarted=true;lastMove.components.push({slot:p.cur,name:p.anim.name,index:0});}
   return{};
  }
  if(special&&p.CES?.kind==='vegawall'&&p.CES.phase===4&&p.CES.vy<0&&p.Y<44*256&&Math.abs(p.X-d.X)<96*256){keys=(d.X<p.X?1:2)|16;d.ST=0;}
  // Original Andore hold: jump after two shakes, then punch in the air to invert.
  if(special&&p.AIFFHold){if(p.AIFFHold.pulses>=2&&!p.AIFFHold.airborne)keys=4;else if(p.AIFFHold.airborne&&p.AIFFHold.airAge>=12)keys=16;}
  if(special&&p.AIHeroGrab){const grab=p.AIHeroGrab;if(grab.phase==='hold'&&grab.age>=32)keys=4;else if(grab.phase==='jump'&&!grab.pile&&grab.airAge>=10)keys=16;}
  p.KEYS=keys;p.FORCE=0;SF2AIRULES.block(p,keys);d.KEYS=d.FORCE=0;SF2AIRULES.block(d,0);
  if(move.action.command){const current=p.AIEvilKen?.adapter.heat.move,target=move.action.command,next=current==='ember-kick'&&target!=='ember-kick'?'furnace-kick':current==='furnace-kick'&&target==='cinder-break'?'cinder-break':null;if(next)p.AIButtons.queue={command:next,tick:G.tick};}
  if(!special)restoreTarget(d);
  if(VER.cur==='CE')SF2CEPROJECTILES.stepEffects({tick:G.tick});
  SF2CEDHALSIM.objects(G,P,{hit:ceYogaHit,fire:ceYogaCollision,visible:ceObjectVisible});
  if(move.action.section==='air'){animstep(p);}else update(p);if(special)update(d);clampx(p);
  if(special&&p.AIHeroMove?.style==='wall'&&p.AIHeroMove.phase==='dive'&&!move.wallAimed){
   const attack=p.anim.ents.find(e=>e[6]?.[2])?.[6],head=boxw(d,0),sign=p.FACE?1:-1;if(attack&&head){let elapsed=0,activeEnd=0;for(const e of p.anim.ents){elapsed+=e[1];if(e[6]?.[2])activeEnd=elapsed;}const y=Math.max(0,head[1]-attack[1]),height=Math.max(0,p.Y/256-y),vy=p.VY/256,ay=Math.max(.1,p.AY/256),ticks=Math.max(8,Math.min(60,(vy+Math.sqrt(vy*vy+2*ay*height))/ay,activeEnd?activeEnd-3:60)),target=head[0]-(p.FACE?-attack[0]:attack[0]);p.VX=Math.round(sign*Math.max(0x200,Math.min(0x1600,Math.abs(target-p.X/256)/ticks*256)));lastMove.wallAim={vx:p.VX,ticks,target};}move.wallAimed=true;
  }
  if(move.action.command){const current=p.AIEvilKen?.adapter.heat.move;if(current&&move.heatVoice!==current){move.heatVoice=current;const code=current==='cinder-break'?p.F.sfx.sp[2][0][1]:p.F.sfx.wh[5];AI_SPECIAL_VOICES[p.i]={last:{commands:[[0,code]],sample:null,kind:'evil-ken-heat',tick:G.tick}};}}
  fbmove(p);const probe=hitprobe(p);hitcheck(p,probe);fbhit(p);fbafter(p);
  if(!special||move.action.command&&p.AIEvilKen?.adapter.heat.move!==move.action.command)restoreTarget(d);
  G.slow=0;
  const attached=!!(p.THV||p.AIFFHold||p.AIFFThrow||p.AIHeroGrab||p.CETH||d.CETHV||d.AIFFHeld),projectile=!!(p.FBON||p.AIFFBullets?.length||p.AIFFGrenades?.length||p.AIFFProjectile||p.AIDamndBarrel);
  const done=!attached&&!projectile&&p.ST!==1&&p.ST!==2&&p.ST!==11&&age>0;
  const selected=p.F.moves[move.action.index],escape=special&&(p.aiProfile==='vega'&&selected?.inp==='bb'||p.aiProfile==='belger'&&['vault','belger-hop','belger-retreat'].includes(selected?.style)||['escape','movement'].includes(selected?.role));
  if(done&&escape&&!move.escapeFollowup&&lastMove.contacts===0){move.escapeFollowup=true;return{};}
  return{done:!special?lastMove.contacts>0||p.adone:done};
 }
 function playDeathVoice(d){if(deathVoicePlayed)return;deathVoicePlayed=true;G.AIFinisherDeathVoice={tick:G.tick,slot:d.i};if(isFFGuest(d))ffSound(d,'ko');else sfxc(XS(d)?.ko,SN_KO);}
 const host={
  context:()=>({enabled:aiEnabled(),scene:G.scene,tick:G.tick,phase:G.gph,seed:G.AIMatchSeed,players:P,room:aiRoom(),training:!!AICFG.prototype&&!!AICFG.training,keys:P.map(p=>p.KEYS)}),
  art:nativeArt,anatomy,mouth:aiMouth,
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
  pose,gap,airOffset:(w,d,a)=>normalPlan(w,d,a.button,a.section).offset??16,
  specials:p=>SF2AIRULES.mapping(p).filter(m=>m.command!=='rift'&&(!m.command||isEvilKen(p))).map(m=>({...m})),
  valid:(p,m)=>m.command?isEvilKen(p):!!p.F.moves[m.index]&&(window.SF2AIHeroWeapons?.validMove(p,p.F.moves[m.index])??true),
  isCPU:p=>p.i===1&&!G.mode2p,
  begin,animate,
  finishMove(p){resetActor(p);},
  position:(p,v)=>{p.X=Math.round(v.x*256);p.Y=Math.round(v.y*256);p.FACE=v.face;},
  lockVictim:(w,d,phase)=>phase!=='special',
  remainingArt:(p,a)=>SF2AIFF.heldArt(p,a),
  partPoint(p,part,pose){
   const sign=p.FACE?-1:1;
   if(p.AIFFHeld?.inverted){const r=pose.art.rect,x=-Math.floor(r[2]/2)+r[2]-part.source[0]-part.source[2]/2,y=-Math.floor(r[3]/2)+r[3]-part.source[1]-part.source[3]/2;return{x:p.X/256+sign*x,y:p.Y/256-y,face:p.FACE,angle:Math.PI};}
   return{x:p.X/256+sign*part.pivot[0],y:p.Y/256-part.pivot[1],face:p.FACE,angle:0};
  },
  blood:(packet,d)=>aiBloodAdd(packet,d.i),stain:aiClothesStain,
  impact:e=>{if(!e.special)G.hfz=Math.min(G.hfz,Math.round(4*(1-(e.progress??0))**2));G.AIFinisherContact={tick:G.tick,button:e.button,special:e.special,sequence:e.sequence};},
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
 function measureFraming(render=false){
  const state=finisher.view();if(!state||G.scene!=='fight')return null;const actors=render?SF2CECAMERA.poses||P:P,bounds=[];
  for(const p of actors){if(finisher.hidden(p))continue;const r=finisher.art(p,nativeArt(p)).rect,x=p.X/256,y=p.Y/256,left=x+(p.FACE?-r[4]-r[2]:r[4]);bounds.push({left,right:left+r[2],top:y-r[5],bottom:y-r[5]-r[3]});}
  if(!bounds.length)return null;const left=Math.min(...bounds.map(b=>b.left)),right=Math.max(...bounds.map(b=>b.right)),top=Math.max(...bounds.map(b=>b.top)),bottom=Math.min(...bounds.map(b=>b.bottom)),width=right-left+28,height=top-bottom+12,zoom=Math.min(2.2,W/width,(H-72)/height);
  return{left,right,top,bottom,zoom,width:Math.max(320,width,height*W/(H-72))};
 }
 const burn=Object.values(SF2CESPECIALDATA.fighters[0]).find(a=>a.name==='ceSpecialBurn15350'),frames=burn.extraArt.map(a=>{const image=new Image();image.src=SF2CESPECIALDATA.images[a.images[0]];return{image,rect:a.rect};});
 return Object.assign(finisher,{
  damage(d,amount){if(!protectedVictim(d))return false;if(amount>0&&G.tick-lastDamage>=finisher.info().contactInterval){lastDamage=G.tick;lastMove&&(lastMove.contacts++);const target=lastMove?.action.command,current=d.opp.AIEvilKen?.adapter.heat.move;finisher.notify(d.opp,d,++contactSerial,{final:!target||target===current});}d.HP=1;d.HPD=0;return true;},
  nativeMove:()=>lastMove?{...lastMove,action:{...lastMove.action}}:null,
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
