/* Original ordinary Ryu/Ken/Honda/Vega winner phases; Ken finale remains unbound. */
'use strict';
(()=>{
 const D=window.SF2CEWINNERDATA,CORE={step(a,world,D,random,sound){
 const select=(status,variant)=>{a.source=D.sources[a.fid][status+':'+variant];const f=D.frames[a.source];a.timer=f.duration;a.flags=f.flags;};
 const tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer){a.source=D.frames[a.source].next;const f=D.frames[a.source];a.timer=f.duration;a.flags=f.flags;}};
 if([0,4].includes(a.fid)){
  if(a.phase===0){
   if(world.gate)return;
   if(!a.handshake){a.handshake=2;return;}
   a.phase=2;a.handshake=0;a.ready=1;a.face=a.priorFace;world.ad1=1;
   const value=random('0x3d924'),mask=a.wins===1?0x1082:0xef7d;
   select(0x52,world.bonus?value&1:(mask>>>(value&15))&1);
  }
  if(a.phase!==2)throw Error('Shoto finale phase is not yet translated: '+a.phase);
  if(a.fid===4&&a.wins===2&&world.flag2e9&&!world.flag303&&world.stageMode===2)throw Error('Native Ken finale allocation/movement remains unbound');
  tick();return;
 }
 if(![1,11].includes(a.fid))throw Error('Winner controller not translated for fighter '+a.fid);
 if(a.phase===0){a.phase=2;
  if(a.fid===1){a.face=(a.x>>>16)<world.opponentX?1:0;world.ad1=1;const mask=world.bonus?0xaaaa:a.wins===1?0x1044:0xefbb;const value=random('0x3eb32');select(0x4c,(mask>>>(value&15))&1);}
  else{const value=random('0x4bd84'),mask=a.wins===1?0x1084:0xdefb;select(0x40,(mask>>>(value&31))&1);world.ad1=1;a.face=(a.x>>>16)<world.opponentX?1:0;}
  return;
 }
 if(a.phase!==2)throw Error('Unknown original winner phase '+a.phase);
 a.ready=1;const command=a.flags&255;if(command)sound(command);tick();
}},images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 const table={sources:Object.fromEntries(Object.entries(D.fighters).map(([fid,rows])=>[fid,Object.fromEntries(Object.entries(rows).map(([key,a])=>[key,a.source]))])),frames:D.nativeFrames};
 function register(p){if(registered.has(p.F))return registered.get(p.F);const poses={};for(const a of Object.values(D.fighters[p.fid])){const slot=p.F.anims.length;p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slot,i];}Object.assign(window.SF2CESHADOWDATA?.selectors||{},D.shadows);if(p.fid===11)for(const[to,from]of Object.entries(D.clawAliases))SF2VEGACLAWDATA.poses[to]=SF2VEGACLAWDATA.poses[from];registered.set(p.F,poses);return poses;}
 function handles(p,h){return[0,1,11].includes(p.fid)||p.fid===4&&(p.WINS!==2||!h.winnerContext().finalArcade);}
 function create(p){return{handshake:p.CEWin.handshake||0,priorFace:p.CEPriorFace??p.FACE,fid:p.fid,phase:0,x:0,source:0,timer:0,flags:0,face:p.FACE,ready:0,wins:p.WINS};}
 function step(p,h){const c=p.CEWin,a=c.nativeWinner;if(!a)return false;a.x=(p.X*256+(256<<16))>>>0;a.face=p.FACE;if([0,4].includes(p.fid))a.priorFace=p.CEPriorFace;const round=h.winnerState(),world={bonus:0,gate:round.gate||0,ad1:round.ad1||0,opponentX:(p.opp.X>>8)+256};CORE.step(a,world,table,()=>h.random(),code=>h.sound(code));round.ad1=world.ad1;if([0,4].includes(p.fid))c.handshake=a.handshake;const at=register(p)[a.source];if(!at)throw Error('Missing native winner pose '+a.source);p.FACE=a.face;p.ST=9;p.VX=p.VY=0;p.cur=at[0];p.anim=p.F.anims[p.cur];p.aidx=at[1];p.acc=p.anim.ents[p.aidx][1]-a.timer;p.adone=0;c.ready=!!a.ready;return true;}
 function art(p,alternate){if(!p.anim?.name?.startsWith('ceWinner'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function claw(ctx,p,x,y,alternate){const a=p.anim?.extraClaw?.[p.aidx]?.[(alternate?2:0)+(p.FACE?1:0)];if(!a||window.SF2CEVEGACLAW?.unequipped(p))return false;ctx.drawImage(images[a[0]],x+a[1],y+a[2]);return true;}
 window.SF2CEWINNER={ready,register,handles,create,step,art,claw};
})();
