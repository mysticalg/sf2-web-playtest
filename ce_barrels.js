/* Original CE barrel bonus: manager2b904, NPC366f4, contact95cb2, remaining9650.
   Standalone: parent supplies player reaction and score/UI integration; no game loop owned. */
'use strict';
window.SF2CEBARRELS=(()=>{
 const D=window.SF2CEBARRELDATA,F=65536,images=new Map();
 const entry=o=>o.animation.entries[o.index],anim=(o,a)=>{o.animation=a;o.index=0;o.timer=a.entries[0].duration;};
 function tick(o){if(--o.timer<=0){o.index++;if(o.index>=o.animation.entries.length)o.index=o.animation.loop;o.timer=entry(o).duration;}}
 const health=rand=>D.health[(rand()&30)>>1],overlap=(a,b)=>a&&b&&Math.abs(a[0]-b[0])<=a[2]+b[2]&&Math.abs(a[1]-b[1])<=a[3]+b[3];
 function image(url,bim){if(bim)return bim(url);if(!images.has(url)){const i=new Image();i.src=url;images.set(url,i);}return images.get(url);}
 function sync(B){const s=B.barrels;B.need=20;B.hits=s.destroyed;B.spawned=s.spawned;B.pts=s.points[0];B.time=0;B.ob=s.slots.filter(o=>o.request);return s;}
 function init(B,p,rand,bim){
  const s=B.barrels={fighterId:p?.fid??0,spawnBudget:20,spawnTimer:1,remaining:20,counterPhase:0,counterTimer:0,counterPalette:13,ready:false,spawned:0,resolved:0,destroyed:0,missed:0,points:[0,0],done:false,reported:false,tick:0,kills:[0,0],blinkTimers:[0,0],ledDark:[false,false,false,false],debris:[],sparks:[],slots:[]};
  for(let i=0;i<8;i++){const o={id:i,state:2,phase:0,sub:0,request:false,flag:2,X:0,Y:256*F,vx:0,vy:0,ay:-0x4000,face:0,priority:0,visible:false,groups:[0,0,0,0],distances:[256,256],hp:0,oldHP:0};o.oldHP=o.hp;anim(o,D.animations[0]);s.slots.push(o);}
  if(p){p.X=p.X0=104<<8;p.Y=0;p.HP=1;}
  if(bim){image(D.background,bim);for(const d of [...D.counterDigits,...(D.counterWarningDigits||[])])image(d,bim);for(const n of D.fighterNames||[])for(const v of n.views)image(v.image,bim);for(const f of D.frames)image(f.image,bim);}sync(B);return s;
 }
 function manager(s){
  if(s.spawnBudget<0)return;
  if(--s.spawnTimer!==0)return;
  const o=s.slots.find(o=>!o.request);
  if(!o){s.spawnTimer=1;return;}
  if(--s.spawnBudget<0)return;
  s.spawnTimer=D.spawnIntervals[s.spawnBudget];o.request=true;s.spawned++;
 }
 function worldBox(o,q){if(!q)return null;return [(o.X>>16)+(o.face?-q[0]:q[0]),(o.Y>>16)-40+q[1],q[2],q[3]];}
 function counterWarning(s){
  if(s.done){s.counterPalette=13;return;}
  if(s.remaining>5)return;
  if(!s.counterPhase){s.counterPhase=2;s.counterTimer=4;s.counterPalette=13;return;}
  if(--s.counterTimer!==0)return;
  if(s.counterPhase===2){s.counterPhase=4;s.counterTimer=2;s.counterPalette=14;}
  else{s.counterPhase=2;s.counterTimer=4;s.counterPalette=13;}
 }
 function resolve(s,o){
  if(!o.request)return;o.request=false;o.state=2;o.phase=o.sub=0;o.flag=2;o.Y=256*F;o.visible=false;o.groups.fill(0);if(!o.broken)s.missed++;o.broken=false;
  s.remaining--;s.resolved++;if(!s.remaining){s.done=true;s.counterPalette=13;}
 }
 function fragments(s,o){for(let i=0;i<7;i++)s.debris.push({pending:true,small:i!==0,X:o.X,Y:o.Y,face:o.face,visible:false});}
 function stepDebris(s,rand,worldTick){
  for(const f of s.debris){
   if(f.pending){let vx=3*F,vy=3*F,a;
    if(f.small){const i=(rand()&28)>>2;vx=D.fragments.vx[i];vy=D.fragments.vy[i];f.Y+=40*F;}
    if(!f.face)vx=-vx;
    a=f.small?D.fragments.small[D.fragments.selector[rand()&15]]:D.fragments.large[rand()&1];
    Object.assign(f,{vx,vy,ay:-0x4000,pending:false,visible:true,blink:false});anim(f,a);continue;
   }
   f.X=(f.X+(f.vx>>16)*F)|0;f.Y=(f.Y+f.vy)|0;f.vy=(f.vy+f.ay)|0;
   f.visible=(f.X>>16)>=-64&&(f.X>>16)<=448&&(f.Y>>16)>=-64&&(f.Y>>16)<=288;f.blink=!(worldTick&1);
  }
  s.debris=s.debris.filter(f=>f.pending||f.visible);
 }
 function stepSparks(s,rand){const d=window.SF2CECLASHDATA;if(!d)return;
  for(let i=s.sparks.length-1;i>=0;i--){const f=s.sparks[i];if(f.pending){const q=d.randomOffsets[(rand()&12)>>2];f.x+=q[0];f.y+=q[1];f.pending=false;continue;}
   if(--f.timer===0){f.index++;const e=d.animations[f.selector].entries[f.index];if(!e||e.terminal){s.sparks.splice(i,1);continue;}f.timer=e.ticks;}f.visible=true;
  }
 }
 function fall(o){o.Y=(o.Y+o.vy)|0;o.vy=(o.vy+o.ay)|0;return o.vy;}
 function move(o,s,rand){
  if(o.state===4){fragments(s,o);o.state=6;return;}
  if(o.state===6){resolve(s,o);return;}
  if(o.phase===0){if(!o.request)return;o.broken=false;o.X=(s.spawnBudget&1)?384*F:0;o.Y=214*F;o.phase=2;o.face=0;o.side=(s.spawnBudget&1)?0:2;o.vx=D.firstVelocity[o.side>>1]*F;if(o.vx<0)o.face=1;o.hp=o.oldHP=health(rand);o.priority=0;anim(o,D.animations[0]);}
  else if(o.phase===2){o.X=(o.X+((o.vx>>16)*F))|0;if((o.X>>>16)>=160&&(o.X>>>16)<224){o.phase=4;o.vy=0;o.ay=-0x4000;}tick(o);}
  else if(o.phase===4){o.X=(o.X+(o.vx>>16)*F)|0;fall(o);if((o.Y>>16)<160){o.phase=6;o.vy=0x4c000;o.vx=D.bounceVelocity[(rand()&4)/4+o.side];}tick(o);}
  else if(o.phase===6){o.X=(o.X+o.vx)|0;const vy=fall(o);if(!o.sub){if(vy<0){o.sub=2;o.priority=2;o.flag=1;}}else if(vy<0&&(o.Y>>16)<40){o.phase=8;o.sub=0;o.face=0;o.vx=D.floorVelocity[(rand()&4)/4];if(o.vx<0)o.face=1;o.vy=0x28000;}tick(o);}
  else if(o.phase===8){o.X=(o.X+o.vx)|0;const vy=fall(o);if(vy<0&&(o.Y>>16)<40){o.phase=10;anim(o,D.animations[3]);}tick(o);}
  else if(o.phase===10){if(!o.visible){o.state=6;o.hp=o.oldHP=0;o.face=o.lastFace||0;}else{o.X=(o.X+(o.vx>>16)*F)|0;tick(o);}}
  o.visible=(o.X>>16)>=-64&&(o.X>>16)<=448&&(o.Y>>16)>=-64&&(o.Y>>16)<=288;
 }
 function impact(s,o,owner,raw,h,projectile=false,point){
  // Original95d72 uses raw record byte8 (0..2), NOT doubled actor reaction56.
  const damage=raw[8]+1;o.hp-=damage;o.lastFace=owner.FACE||0;h.hitStop?.(owner,14,o,projectile);if(projectile)h.projectileConsumed?.(owner);
  const command=window.SF2CECOMBATDATA?.score[raw[4]&63];if(command!=null)h.scoreCommand?.(command,owner.i||0);
  if(o.hp<0){o.hp=-1;o.flag=2;o.face=o.lastFace;o.state=4;o.broken=true;s.destroyed++;s.kills[owner.i||0]++;s.blinkTimers[owner.i||0]=60;s.points[owner.i||0]+=1000;h.sound?.(0x32);}
  else{
   s.points[owner.i||0]+=100;h.sound?.(raw[6]);o.oldHP=o.hp;o.face=o.lastFace?0:1;
   const high=o.face?-2:2;o.vx=((high<<16)|(o.vx&65535))|0;o.ay=-0x4000;
   if(o.phase<8){o.phase=6;o.sub=2;o.vy=0x40000;}else{o.phase=8;o.vy=0x30000;}
   tick(o);
  }
  const f=window.SF2CECLASHDATA;if(f&&point){const type=f.boxes[owner.FBAN?.source+24*owner.FBI]?.type,selector=projectile?(f.clashSelectors[type]??4):Math.max(0,Math.min(2,raw[8]));s.sparks.push({selector,x:point[0],y:point[1],face:projectile?(owner.FBVX>=0?1:0):owner.FACE,index:0,timer:f.animations[selector].entries[0].ticks,pending:true,visible:false});}
  h.bonusPoints?.(owner.i||0,s.points[owner.i||0]);return damage;
 }
 function contacts(s,o,p,attack,projectile,h){
  if(o.flag!==1||o.state!==2)return false;let hit=false;const hurt=worldBox(o,entry(o).boxes.head);if(!hurt)return false;
  for(const [index,box,raw,isProjectile]of [[p.i||0,attack,h.record||window.SF2CECOMBAT?.record(p),false],[2+(p.i||0),projectile,h.projectileRecord||window.SF2CECOMBAT?.projectileRecord(p),true]]){
   const group=raw?(raw[5]&128?1:raw[5]):0;
   if(!group||!box||!overlap(box,hurt)){o.groups[index]=0;continue;}
   if(o.groups[index]===group)continue;o.groups[index]=group;hit=true;impact(s,o,p,raw,h,isProjectile,[Math.floor((box[0]+hurt[0])/2),Math.floor((box[1]+hurt[1])/2)]);if(o.state!==2)break;
  }return hit;
 }
 function step(B,p,h={}){
  const s=B.barrels||init(B,p,h.rand,h.image);if(h.ready===false)return sync(B);
  if(!s.ready){for(const o of s.slots)o.hp=o.oldHP=health(h.rand);s.ready=true;return sync(B);}s.tick++;counterWarning(s);
  for(let i=0;i<4;i++){const side=i>>1;let dark=false;if(s.blinkTimers[side]){s.blinkTimers[side]--;dark=!((h.tick??s.tick)&2);}s.ledDark[i]=dark;}
  stepSparks(s,h.rand);stepDebris(s,h.rand,h.tick??s.tick);
  manager(s);
  for(const o of s.slots){
   if(o.request&&o.state===2&&o.flag===1&&!s.player?.invulnerability&&h.playerHurt){const raw=entry(o).boxes.hit,box=worldBox(o,raw);if(box&&h.playerHurt.some(q=>overlap(box,q)))h.onPlayerHit?.(p,{direction:o.face?1:-1,record:raw,source:entry(o).source,barrel:o,attackBox:box,hurtBoxes:h.playerHurt});}
   const hit=o.request&&o.state===2&&contacts(s,o,p,h.attack,h.projectile,h);
   if(!hit){if(o.state===2)o.distances=[o.flag===2?256:Math.max(0,Math.abs((p.X>>8)-(o.X>>16))-24),256];move(o,s,h.rand);}
  }
  sync(B);
  if(s.done&&!s.reported){s.reported=true;h.finish?.({kind:'barrels-resolved',remaining:0,spawned:s.spawned,destroyed:s.destroyed,missed:20-s.destroyed,points:s.points.slice(),winner:s.points[0]===s.points[1]?-1:s.points[0]>s.points[1]?0:1,timeBonus:0,completionAward:s.points[0],payoutUnit:100,payoutUnitsPerUpdate:2});}
  return s;
 }
 function distance(B,p){const s=B.barrels;return s?Math.min(256,...s.slots.map(o=>o.distances?.[p.i||0]??256)):256;}
 function closeByDistance(p,attack,value){
  const rule=D.closeRules?.[p.fid]?.[attack];
  if(!rule||!Number.isFinite(value)||attack<0||attack>=6)return null;
  const unsupported=rule.unsupportedDirection;
  if(unsupported&&((p.KEYS||0)&unsupported.browserKeyMask)&&value<=unsupported.maximumDistance)return null;
  return rule.kind==='range'?value<=rule.maximumNear:false;
 }
 function closeNormalAt(value,p,attack){return closeByDistance(p,attack,value);}
 function closeNormal(B,p,attack){return closeNormalAt(distance(B,p),p,attack);}
 function attackBoxes(B){const s=B.barrels;if(!s)return[];return s.slots.filter(o=>o.flag===1&&o.state===2&&entry(o).boxes.hit).map(o=>({barrel:o,box:worldBox(o,entry(o).boxes.hit),record:entry(o).boxes.hit,source:entry(o).source}));}
 function impactEffect(B,{selector,x,y,face}){const d=window.SF2CECLASHDATA;if(!d?.animations[selector])return;B.barrels.sparks.push({selector,x,y,face,index:0,timer:d.animations[selector].entries[0].ticks,pending:true,visible:false});}
 function drawEffects(ctx,B,bim){const d=window.SF2CECLASHDATA;if(!d)return;for(const e of B.barrels?.sparks||[]){if(!e.visible)continue;const q=d.animations[e.selector].entries[e.index],f=d.frames[q.frame],im=image(f.img,bim);if(!im.width)continue;ctx.save();if(e.face){ctx.translate(e.x,200-e.y);ctx.scale(-1,1);ctx.drawImage(im,f.x,f.y);}else ctx.drawImage(im,e.x+f.x,200-e.y+f.y);ctx.restore();}}
 function drawBackground(ctx,B,bim){const im=image(D.background,bim);if(im.width)ctx.drawImage(im,0,0);}
 function draw(ctx,B,bim,layer='all'){
  const s=B.barrels;if(!s)return;
  for(const o of [...s.slots,...s.debris]){const fragment=Object.hasOwn(o,'small');if(!o.visible||o.blink||!o.animation||layer==='back'&&(fragment||o.priority===2)||layer==='middle'&&(fragment||o.priority!==2)||layer==='front'&&!fragment)continue;const f=D.frames[entry(o).views[o.face?1:0]],im=image(f.image,bim);if(im.width)ctx.drawImage(im,(o.X>>16)+f.x,240-(o.Y>>16)+f.y);}
 }
 function digits(ctx,value,count,x,y,bim,palette=13){const text=Math.max(0,value).toString().padStart(count,'0').slice(-count);for(let i=0;i<count;i++){const im=image((palette===14?D.counterWarningDigits:D.counterDigits)[+text[i]],bim);if(im.width)ctx.drawImage(im,x+16*i,y);}}
 function drawHUD(ctx,B,bim,{tick:worldTick=B.barrels?.tick||0,resultReady=false,nameAlternate=false}={}){
  const s=B.barrels;if(!s)return;const name=D.fighterNames?.[s.fighterId],label=name?.views[nameAlternate?1:0];if(label){const im=image(label.image,bim);if(im.width)ctx.drawImage(im,name.x,name.y);}digits(ctx,s.remaining,2,176,32,bim,s.counterPalette||13);digits(ctx,s.points[0],5,48,16,bim);
  for(let i=0;i<4;i++){const side=i>>1;if(!resultReady&&((worldTick&1)!==side))continue;const value=s.kills[side],digit=i&1?value%10:Math.floor(value/10)%10,f=D.frames[D.ledDigits[digit][s.ledDark[i]?1:0]],im=image(f.image,bim);if(im.width)ctx.drawImage(im,D.ledPositions[i]+f.x,76+f.y);}
 }
 function payout(B,h={}){const s=B.barrels;if(s.payoutRemaining==null)s.payoutRemaining=s.points[0];let units=0;for(let i=0;i<2;i++){if(s.payoutRemaining<100)break;s.payoutRemaining-=100;units++;h.scoreCommand?.(0x2002,0);}if(units&&!((h.tick??s.tick)&3))h.sound?.(0x24);return {remaining:s.payoutRemaining,units,done:s.payoutRemaining===0};}
 return {init,step,draw,drawBackground,drawEffects,impactEffect,drawHUD,payout,distance,closeNormal,closeNormalAt,closeByDistance,counterWarning,attackBoxes,entry,worldBox,overlap,impact,manager,move,resolve,data:D,
  contract:{strength:'Original record byte8/index0..2; damage=strength+1; never multiply by2',coordinates:'NPC16.16 X in viewport space; nativeY40 is ground; player/boxY0 is ground',score:'scoreCommand adds actualglobal score; bonusPoints is separate native+152 metric; payout() queues2x100 perworkerupdate, no second flataward; nativeasynchronous taskcommit timing remainsparent-owned',playerContact:'attackBoxes exposes exact native rolling attack; native953a0 supplies120tick invulnerability and reaction from rolling record; parent must use bonus recovery/HP guard instead of generic fightKO'}};
})();
