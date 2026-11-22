/* Original CE shared round/death controllers. WW/AI integration is guarded by game.js. */
'use strict';
(()=>{
 const D=window.SF2CEROUNDDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 function register(p){const F=p.F||p,fid=p.fid;if(registered.has(F))return registered.get(F);const slots={};for(const [key,a]of Object.entries(D.fighters[fid])){slots[key]=F.anims.length;F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});}Object.assign(window.SF2CESHADOWDATA?.selectors||{},D.shadows);if(fid===11)for(const [at,from]of Object.entries(D.clawAliases))SF2VEGACLAWDATA.poses[at]=SF2VEGACLAWDATA.poses[from];registered.set(F,slots);return slots;}
 function select(p,status,variant,h){h.anim(p,register(p)[status+':'+variant],0);}
 function art(p,alternate){const a=p.anim?.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function claw(ctx,p,x,y,alternate){const a=p.anim?.extraClaw?.[p.aidx]?.[(alternate?2:0)+(p.FACE?1:0)];if(!a||window.SF2CEVEGACLAW?.unequipped(p))return false;ctx.drawImage(images[a[0]],x+a[1],y+a[2]);return true;}
 function beginKO(p,dir,stop){delete p.CEWin;delete p.CEPF;p.CEKO={phase:0,stop,dir,vx:0,vy:0,ax:0,ay:0,pause:0,ignoreWall:false,ready:false};p.ST=8;p.KB=p.STUN=0;}
 function koStep(p,h){const c=p.CEKO;if(!c)return false;
  if(c.ready){h.tick(p);return true;}
  if(c.phase===0){c.phase=2;h.sound(p.fid===5?0x45:0x43);p.Y+=16*256;select(p,0x26,0,h);return true;}
  if(c.phase===2){if(c.stop>0&&--c.stop>0)return true;c.phase=4;c.vx=0x300*c.dir;c.vy=0x700;c.ax=0;c.ay=0x48;return true;}
  if(c.phase===4){
   if(c.pause){c.ignoreWall=true;if(--c.pause){h.tick(p);return true;}}
   c.vx-=c.ax;c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;
   if(p.CEWALL&&!c.ignoreWall){c.pause=12;c.vx=0;if(c.vy>=0)c.vy=0;h.sound(0x2e);}
   if(c.vy<0&&(p.Y>>8)<0){p.Y&=255;c.phase=6;c.wait=4;select(p,0x26,1,h);h.sound(0x2e);return true;}h.tick(p);return true;
  }
  if(c.phase===6){if(--c.wait){h.tick(p);return true;}c.phase=8;c.vx=0x280*c.dir;c.vy=0x300;c.ax=0;c.ay=0x48;select(p,0x26,2,h);return true;}
  if(c.phase===8){c.vx-=c.ax;c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;if(p.CEWALL)c.vx=0;if((p.Y>>8)<0){p.Y&=255;c.phase=10;c.vx=0x100*c.dir;c.ax=0x14*c.dir;c.vy=c.ay=0;select(p,0x26,3,h);return true;}h.tick(p);return true;}
  c.vx-=c.ax;if(c.vx*c.dir<0)c.vx=0;p.X+=c.vx;if(!c.vx||p.CEWALL)c.ready=true;h.tick(p);return true;
 }
 function admit(p,loss=false,fresh=false,h){if(p.CEWin||p.CEKO)return;h.anim(p,0,0);p.CEWin={phase:0,wait:0,loss,fresh,ready:false,handshake:0,extra:null};}
 function winStep(p,blocked,h){const c=p.CEWin;if(!c)return false;if(c.nativeWinner)return SF2CEWINNER.step(p,h);if(c.ready){if(p.fid!==7||c.loss)return false;const flags=p.anim.flags[p.aidx];if(c.variant===0){if(flags&255)p.FACE^=1;h.tick(p);}else if(!flags)h.tick(p);else{p.Y+=D.dhalsimFloat[c.floatIndex||0];c.floatIndex=((c.floatIndex||0)+1)&31;}return true;}if(c.fresh){c.fresh=false;return true;}
  if(c.phase===0){c.phase=2;c.wait=5;return true;}
  if(c.phase===2){if(!--c.wait)c.phase=4;return true;}
  if(c.phase===4){if(!blocked){c.phase=6;c.wait=40;}return true;}
  if(c.phase===6){if(!--c.wait){c.phase=8;if(c.loss){c.ready=true;p.ST=9;select(p,0x3c,0,h);}}return true;}
  if(p.fid===7){if(c.extra===null){c.extra=60;return true;}if(--c.extra)return true;}
  else if([0,4,9].includes(p.fid)&&!c.handshake){c.handshake=2;return true;}
  if(!c.loss&&SF2CEWINNER.handles(p,h)){c.nativeWinner=SF2CEWINNER.create(p);return SF2CEWINNER.step(p,h);}
  c.ready=true;h.victory(p);return true;
 }
 function create({ko,draw,time,winner,human,vitality,round}){return {ko,draw,time,winner,human,vitality,round,finalRound:round===4,pendingGate:ko,gate:0,divider:3,period:3,actorUpdates:0,ui:null,bonus:[],bonusMask:0,counting:false,total:0,done:false};}
 function blocked(s){return s.pendingGate||s.gate>0;}
 function physical(s,stopped){if(s.pendingGate&&!stopped){s.pendingGate=false;s.gate=180;s.divider=s.period=3;}if(s.gate>0){s.gate--;s.divider--;if(s.divider){return false;}s.divider=s.period;}s.actorUpdates++;return true;}
 function uiStep(s,allReady,h){
  if(!s.ui){if(allReady)s.ui={phase:'admission',age:0,wait:0};return;}
  const u=s.ui;u.age++;
  if(u.phase==='admission'){u.phase='initial';return;}
  if(u.phase==='initial'){if(!s.ko){u.phase='timeout';u.wait=240;}else u.phase='route';return;}
  if(u.phase==='timeout'){if(!--u.wait)u.phase='route';return;}
  if(u.phase==='route'){h.banner(s);u.wait=s.draw?180:60;u.phase='message';if(!s.draw)h.announce(s);return;}
  if(u.phase==='message'){if(!--u.wait){if(s.draw){s.done=true;return;}u.phase='scoreInit';}return;}
  if(u.phase==='scoreInit'){u.wait=s.human?3:180;u.phase=s.human?'scoreStart':'cpuWait';return;}
  if(u.phase==='cpuWait'){if(!--u.wait)s.done=true;return;}
  if(u.phase==='scoreStart'){if(!--u.wait)u.phase='spawnTime';return;}
  if(u.phase==='spawnTime'&&s.finalRound){u.wait=120;u.phase='finishWait';return;}
  if(u.phase==='spawnTime'){s.bonus.push({kind:0,fresh:true,left:s.time});u.wait=30;u.phase='waitVital';}
  else if(u.phase==='waitVital'){if(!--u.wait)u.phase='spawnVital';}
  else if(u.phase==='spawnVital'){s.bonus.push({kind:2,fresh:true,left:s.vitality});u.wait=50;u.phase='waitTotal';}
  else if(u.phase==='waitTotal'){if(!--u.wait)u.phase='spawnTotal';}
  else if(u.phase==='spawnTotal'){s.bonus.push({kind:4,fresh:true,left:0});u.phase='waitAll';}
  else if(u.phase==='waitAll'){if(!s.bonusMask){u.wait=120;u.phase='finishWait';}}
  else if(u.phase==='finishWait'){if(!--u.wait)s.done=true;}
 }
 function bonusStep(s,h){
  // Original actor order: time, total, vitality. Allocator-dependent UI sampling stays visible in fixtures.
  for(const a of s.bonus.slice().sort((a,b)=>[0,2,1][a.kind>>1]-[0,2,1][b.kind>>1])){
   if(a.fresh){a.fresh=false;if(a.kind!==4){if(a.left)s.bonusMask|=1<<(a.kind>>1);if(a.kind===2&&s.vitality>=300)h.perfect(s);}continue;}
   if(a.kind===4){s.counting=true;if(s.total&&(h.clock&3)===0&&a.seenTotal!==s.total){a.seenTotal=s.total;h.sound?.(0x24);}continue;}
   if(!s.counting)continue;
   if(a.left){a.left--;s.total++;h.score(s,100);}else s.bonusMask&=~(1<<(a.kind>>1));
  }
 }
 if(window.SF2CEFADE?.profiles)SF2CEFADE.profiles['fight>round']=D.roundFade;
 window.SF2CEROUND={ready,register,select,art,claw,beginKO,koStep,admit,winStep,create,blocked,physical,uiStep,bonusStep,data:D};
})();
