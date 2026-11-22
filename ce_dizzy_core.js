/* Source-translated CE primitives, original execution comparisons retained privately. */
window.SF2CEDIZZYCORE={event:(()=>{const module={exports:{}};
/* Private literal CE dizzy event and per-actor decay. Scheduler integration unfinished. */
'use strict';
module.exports={
 tick(p){p={...p};if(p.timer)p.timer=(p.timer-1)&65535;if(!p.timer)p.points=0;return p;},
 event(p,data,random){
  const word=n=>n&65535,signed=n=>(n&32768)?n-65536:n,keep=[0x18,0x1a,0x1c,0x1e,0x0e,0x22];p={...p};let draws=0;
  const trigger=()=>{p.dizzy=1;p.points=p.timer=0;if(!keep.includes(p.reaction))p.reaction=0x12;return{state:p,draws};};
  if(p.throwStop)return{state:p,draws};p.temporary=0;if(p.blockFlag)return{state:p,draws};if(p.dizzy)return trigger();
  let pair;
  if(p.attackKind>=16&&p.attackKind<32)pair=data.special[p.attackKind&15];
  else if(p.heavyFlag)pair=[p.reaction===0x16?8:15,120];
  else{
   const route=data.reactions[p.reaction];if(route==='none')return{state:p,draws};
   if(route==='ordinary')pair=data.ordinary[p.strength];
   else if(route==='alternate')pair=data.alternate[p.alternateStrength];
   else if(route==='sweep')pair=[8,130];else throw Error('Unknown native dizzy reaction '+p.reaction);
  }
  if(!pair)throw Error('Unknown native dizzy strength');p.temporary=word(p.temporary+pair[0]);p.timer=word(p.timer+pair[1]);
  const draw=()=>{draws++;return random()&31;};p.temporary=word(p.temporary+data.base[draw()]);
  if(!p.skipRoster){
   p.temporary=word(p.temporary+data.opponent[p.opponentFid][draw()]);if(signed(p.temporary)<0)p.temporary=1;
   p.temporary=word(p.temporary+data.victim[p.fid][draw()]);if(signed(p.temporary)<0)p.temporary=1;
  }
  p.points=word(p.points+p.temporary);return p.points>=31?trigger():{state:p,draws};
 }
};

return module.exports;})(),
active:(()=>{const module={exports:{}};
/* Private original active-grounded dizzy/escape controller,39808. Caller/knockdown scheduling remain external. */
'use strict';
function escape(a,D,random){
 if(a.inputRole){if(!(a.previousKeys&15)&&((~a.previousKeys)&a.keys&15))a.escapeCount=(a.escapeCount+2)&255;if((~a.previousKeys)&a.keys&0x770)a.escapeCount=(a.escapeCount+1)&255;}
 else{if(!Number.isInteger(D.cpuMasks[a.level]))throw Error('Unknown native CPU handicap '+a.level);const value=random('0x39902',a.address)&31;if((D.cpuMasks[a.level]>>>value)&1)a.escapeCount=(a.escapeCount+D.cpuEscape[a.fid])&255;}
}
module.exports={duration(a,D,random){a.remaining=D.duration[(random('0x397f8',a.address)&62)>>1];},escape,step(a,D,random){
 const word=n=>n&65535;
 const select=source=>{a.source=source;a.timer=D.frames[source].duration;a.flags=D.frames[source].flags;};
 const tick=()=>{a.timer=word(a.timer-1);if(!a.timer)select(D.frames[a.source].next);};
 if(a.phase===0){a.phase=2;a.activeDizzy=1;a.escapeCount=0;select(D.sources[a.fid]);return;}
 if(a.phase!==2)throw Error('Unknown active dizzy phase '+a.phase);
 if(a.field4e&&a.field4d){/*39fb8 returns0 without the ground test*/}
 else{if(a.field4e)a.field4e=0;if((a.y>>>16)>40)throw Error('Native airborne exit requires separate source controller');a.y=((40<<16)|(a.y&65535))>>>0;}
 a.remaining=word(a.remaining-1);
 const release=()=>{a.activeDizzy=0;a.phase=0;tick();};
 if(!a.remaining){release();return;}tick();
 escape(a,D,random);
 if(a.escapeCount>=3){a.escapeCount=0;const prior=a.timer;a.timer=1;a.remaining=word(a.remaining-prior);if(!a.remaining||a.remaining&32768){release();return;}tick();}
}};

return module.exports;})(),
stars:(()=>{const module={exports:{}};
/* Private literal CE star-child4 controller; observed allocation/task/parent lifecycle remain external. */
'use strict';
module.exports={step(a,p,tick,D,random){
 const word=n=>n&65535,signed=n=>n&32768?n-65536:n,integer=n=>n>>>16;
 const write=(n,v)=>(((v&65535)<<16)|(n&65535))>>>0;
 const select=i=>{a.source=D.sources[i];const f=D.frames[a.source];if(!f)throw Error('Unknown star source '+a.source);a.timer=f.duration;a.flags=f.flags;};
 if(a.main===0){
  if(a.phase===0){a.phase=2;a.delay=1;const value=random('0x29556',a.address);if((0x4a>>(value&7))&1&&!D.canonicalWordCheck.allMatch)throw Error('Unsupported original word-check mismatch path');return;}
  if(a.phase!==2)throw Error('Unknown star init phase '+a.phase);
  a.delay=(a.delay-1)&255;if(a.delay)return;
  a.main=2;select(a.child+a.variant);
  const [dx,dy]=D.attach[p.fid][a.child];a.x=write(a.x,p.x+(p.face?-dx:dx));a.y=write(a.y,p.y+dy);
  a.face=p.face;a.parentX=p.x;a.parentY=p.y;a.centreX=integer(a.x);a.centreY=integer(a.y);
  const [ox,vx,oy,vy]=D.orbits[a.offset];a.x=write(a.x,integer(a.x)+ox);a.y=write(a.y,integer(a.y)+oy);a.vx=word(vx);a.vy=word(vy);return;
 }
 if(a.main===2){
  if(!p.activeDizzy||![0x0e,0x14].includes(p.state))a.main=4;
  a.vx=word(a.vx+(signed(integer(a.x))<signed(a.centreX)?256:-256));
  a.vy=word(a.vy+(integer(a.y)<a.centreY?64:-64));
  const dx=word(p.x-a.parentX),dy=word(p.y-a.parentY);a.x=write(a.x,integer(a.x)+dx);a.y=write(a.y,integer(a.y)+dy);a.centreX=word(a.centreX+dx);a.centreY=word(a.centreY+dy);a.parentX=p.x;a.parentY=p.y;
  a.face=signed(a.vx)>=0?1:0;a.camera=a.face*4;select(a.face*2+4+a.variant);
  a.x=(a.x+signed(a.vx)*256)>>>0;a.y=(a.y+signed(a.vy)*256)>>>0;
  if(!a.variant){a.priority=1;a.palette=D.palettes[(tick&6)>>1];}return;
 }
 if(a.main===4||a.main===6){Object.assign(a,{used:0,main:0,phase:0,kind:0,child:0,camera:0,face:0,priority:0,variant:0});return;}
 throw Error('Unknown star state '+a.main);
}};

return module.exports;})()};
