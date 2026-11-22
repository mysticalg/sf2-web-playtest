/* Original ordinary Ryu/Ken/Honda/Vega winner phases; Ken finale remains unbound. */
'use strict';
(()=>{
 const D=window.SF2CEWINNERDATA,CORE={step(a,world,D,random,sound,allocate){
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
 if(a.fid===9){
  if(a.phase===0){
   if(world.gate)return;
   if(!a.handshakeB0){a.handshakeB0=2;return;}
   a.phase=2;a.handshakeB0=0;a.ready=1;a.face=a.priorFace;world.ad1=1;
   const value=random('0x4a63c'),mask=a.wins===1?0x2210:0xf77b,variant=(mask>>>(value&31))&1;
   if(variant)sound(0x4a);select(0x40,variant);
  }
  tick();return;
 }
 if(a.fid===10){
  if(a.phase===0){
   a.phase=2;a.ready=1;world.ad1=1;const value=random('0x4b1fc'),mask=a.wins===2?0xeeef:0x1110;
   a.selectorC0=((mask>>>(value&15))&1)?0:1;select(0x4e,a.selectorC0);tick();return;
  }
  if(!a.selectorC0&&!a.submodeC1&&(a.flags&255)){
   a.submodeC1=2;
   for(const child of[1,0]){
    const b=allocate();if(!b)break;
    b.used=1;b.kind=0x3a;b.child=child;b.group=0;b.x=(((a.x>>>16)<<16)|(b.x&65535))>>>0;b.y=(((a.y>>>16)<<16)|(b.y&65535))>>>0;b.owner=a.address;
   }
  }
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
}},CHILD={step(a,parent,D,sound,release){
 const setWord=(old,value)=>(((value&65535)<<16)|(old&65535))>>>0;
 const select=source=>{a.source=source;a.timer=D.frames[source].duration;a.flags=D.frames[source].flags;};
 const tick=()=>{a.timer=(a.timer-1)&65535;if(!a.timer)select(D.frames[a.source].next);};
 if(a.main===0){
  a.main=2;a.camera=0;
  if(!a.group&&parent.altPaletteFlag){a.paletteMode=1;a.palette=parent.altPalette;}
  a.x=setWord(a.x,(a.x>>>16)+(a.child?27:-40)+(parent.face?16:0));
  a.vx=a.child?0x100:0xff00;a.y=setWord(a.y,117);a.vy=0x100;a.ay=0x18;a.ax=0;
  sound(0x27);select(D.sources[a.child]);return false;
 }
 if(a.main===2){
  if(a.submode===0){
   a.vx=(a.vx-a.ax)&65535;a.vy=(a.vy-a.ay)&65535;
   a.x=(a.x+((a.vx<<16>>16)<<8))>>>0;a.y=(a.y+((a.vy<<16>>16)<<8))>>>0;
   if((a.y>>>16)<=40){a.submode=2;a.y=setWord(a.y,40);}
   if(a.flags&255)tick();
  }else if(a.submode===2)tick();
  else throw Error('Unknown original shirt fragment submode '+a.submode);
  return true;
 }
 if(a.main===4||a.main===6){release(a);return false;}
 throw Error('Unknown original shirt fragment main '+a.main);
}},images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 const table={sources:Object.fromEntries(Object.entries(D.fighters).map(([fid,rows])=>[fid,Object.fromEntries(Object.entries(rows).map(([key,a])=>[key,a.source]))])),frames:D.nativeFrames};
 function register(p){if(registered.has(p.F))return registered.get(p.F);const poses={};for(const a of Object.values(D.fighters[p.fid])){const slot=p.F.anims.length;p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slot,i];}Object.assign(window.SF2CESHADOWDATA?.selectors||{},D.shadows);if(p.fid===11)for(const[to,from]of Object.entries(D.clawAliases))SF2VEGACLAWDATA.poses[to]=SF2VEGACLAWDATA.poses[from];registered.set(p.F,poses);return poses;}
 function handles(p,h){return[0,1,9,10,11].includes(p.fid)||p.fid===4&&(p.WINS!==2||!h.winnerContext().finalArcade);}
 function create(p){return{address:p.i?0x86be:0x83be,handshakeB0:p.CEWin.handshake||0,selectorC0:0,submodeC1:0,altPaletteFlag:p.i===1&&p.opp.fid===10?1:0,altPalette:1,handshake:p.CEWin.handshake||0,priorFace:p.CEPriorFace??p.FACE,fid:p.fid,phase:0,x:0,source:0,timer:0,flags:0,face:p.FACE,ready:0,wins:p.WINS};}
 function step(p,h){const c=p.CEWin,a=c.nativeWinner;if(!a)return false;a.x=(p.X*256+(256<<16))>>>0;a.face=p.FACE;if([0,4,9].includes(p.fid))a.priorFace=p.CEPriorFace;const round=h.winnerState(),world={bonus:0,gate:round.gate||0,ad1:round.ad1||0,opponentX:(p.opp.X>>8)+256};const allocated=[];CORE.step(a,world,table,()=>h.random(),code=>h.sound(code),()=>{const slot=SF2CEOBJECTS.allocate(h.winnerObjects(),8);if(!slot)return null;const q={x:slot.x,y:slot.y};allocated.push([slot,q]);return q;});for(const[slot,q]of allocated)Object.assign(slot,{used:q.used,kind:q.kind,child:q.child,group:q.group,x:q.x,y:q.y,parent:q.owner,draw:false});round.ad1=world.ad1;if([0,4].includes(p.fid))c.handshake=a.handshake;else if(p.fid===9)c.handshake=a.handshakeB0;const at=register(p)[a.source];if(!at)throw Error('Missing native winner pose '+a.source);p.FACE=a.face;p.ST=9;p.VX=p.VY=0;p.cur=at[0];p.anim=p.F.anims[p.cur];p.aidx=at[1];p.acc=p.anim.ents[p.aidx][1]-a.timer;p.adone=0;c.ready=!!a.ready;return true;}
 function objectStep(slot,state,players,h){
  const p=players[slot.parent===0x83be?0:1],winner=p.CEWin?.nativeWinner;
  const a={main:slot.main,submode:slot.phase,x:slot.x,y:slot.y,camera:slot.camera,face:slot.face,paletteMode:slot.priority,palette:slot.palette,source:slot.source,timer:slot.timer,flags:slot.flags,group:slot.group,child:slot.child,vx:slot.vx,vy:slot.vy,ax:slot.ax||0,ay:slot.ay||0};
  const parent={face:p.FACE,altPaletteFlag:winner?.altPaletteFlag||0,altPalette:winner?.altPalette||0};let freed=false;
  const draw=CHILD.step(a,parent,{sources:D.childSources,frames:D.childFrames},code=>h.sound(code),()=>{SF2CEOBJECTS.release(state,slot);freed=true;});
  if(!freed)Object.assign(slot,{main:a.main,phase:a.submode,x:a.x,y:a.y,camera:a.camera,face:a.face,priority:a.paletteMode,palette:a.palette,source:a.source,timer:a.timer,flags:a.flags,vx:a.vx,vy:a.vy,ax:a.ax,ay:a.ay,draw});
 }
 function drawObjects(ctx,G,cam,ground){for(const a of G.CEObjects?.pools[8].slots||[]){if(!a.used||a.kind!==0x3a||!a.draw)continue;const bank=a.priority?a.palette:16,f=D.childArt[a.source+':'+bank+':'+a.face];if(!f)throw Error('Missing original shirt fragment '+a.source+':'+bank+':'+a.face);ctx.drawImage(images[f.image],(a.x>>>16)-256-cam+f.x,ground-((a.y>>>16)-40)+f.y);}}
 function art(p,alternate){if(!p.anim?.name?.startsWith('ceWinner'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect}:null;}
 function claw(ctx,p,x,y,alternate){const a=p.anim?.extraClaw?.[p.aidx]?.[(alternate?2:0)+(p.FACE?1:0)];if(!a||window.SF2CEVEGACLAW?.unequipped(p))return false;ctx.drawImage(images[a[0]],x+a[1],y+a[2]);return true;}
 window.SF2CEWINNER={ready,register,handles,create,step,objectStep,drawObjects,art,claw};
})();
