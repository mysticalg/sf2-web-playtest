/* Grounded original burn/shock and KO binding. Airborne hit admission is a
   separate source path; global scheduler/RNG phase parity remains unfinished. */
'use strict';
(()=>{
 const D=SF2CESPECIALDATA,O=SF2CEOBJECTS,CORE=SF2CEDIZZYCORE;
 const images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode())),registered=new WeakMap();
 const MODEL=(()=>{const module={exports:{}};
/* Original 38CAE/38D60 and shared 39926. Private byte-state component.
   Animation metadata, ground, wall push, dizzy admission and common return
   are explicit source dependencies. This is not a global scheduler model. */
'use strict';
module.exports={step(bytes,entry,D,h){
 const b=bytes,v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 const w=n=>v.getUint16(n),s=n=>v.getInt16(n),l=n=>v.getUint32(n);
 const W=(n,x)=>v.setUint16(n,x&65535),L=(n,x)=>v.setUint32(n,x>>>0);
 const select=source=>{const f=D.frames[source];if(!f)throw Error('Missing source '+source.toString(16));L(26,source);W(24,f.duration);W(20,f.flags);};
 const pose=(status,variant=0)=>select(D.sources[b[0x291]][status+':'+variant]);
 const tick=()=>{W(24,w(24)-1);if(!w(24))select(D.frames[l(26)].next);};
 const move=()=>{W(0x3c,w(0x3c)-w(0x40));W(0x3e,w(0x3e)-w(0x42));L(6,l(6)+s(0x3c)*256);L(10,l(10)+s(0x3e)*256);};
 const wall=()=>b[0x48]||b[0x5b];
 const ground=()=>{if(b[0x4d]){b[0x4e]=1;return true;}if(((w(10)-h.ground)&65535)&32768){W(10,h.ground);return true;}return false;};
 const params=vy=>{L(0x11a,0x3893a);for(const[n,x]of[[0x100,0x200],[0x104,0],[0x102,vy],[0x106,0x48],[0x108,0x280],[0x10c,0],[0x10a,0x280],[0x10e,0x48],[0x110,0x100],[0x114,0x14],[0x112,0],[0x116,0],[0x128,0x26]])W(n,x);};
 const load=(base,accelSign=false)=>{for(const[n,from]of[[0x3c,base],[0x40,base+4],[0x3e,base+2],[0x42,base+6]])W(n,w(from));if(!b[0x54]){W(0x3c,-w(0x3c));if(accelSign)W(0x40,-w(0x40));}};
 const push=()=>{if(b[0x71]||b[5]<4)return;const at=l(0x11a),raw=D.wallPush[at-0x3893a];if(raw===undefined)throw Error('Missing push byte');const n=raw<0?0:raw;L(0x11a,at+(raw<0?0:1));if(wall()===(s(0x12a)<0?1:2)&&!b[0x15b])h.push(s(0x12a)<0?n:-n);};
 const fall=()=>{
  switch(b[5]){
   case 0:b[5]=2;b[0x119]=1;b[0x118]=b[0x145]=0;W(10,w(10)+16);b[0x181]=255;if(b[0x190])select(b[0x190]===1?0x3bf6:0x3d1a);else pose(w(0x128));return;
   case 2:if(b[0x47]){b[0x47]--;if(b[0x47]){W(0x12a,w(0x3c));return;}}b[5]=4;b[0x1e]=0;load(0x100);W(0x12a,w(0x3c));return;
   case 4:
    if(b[0x145]){b[0x118]=1;b[0x145]--;if(b[0x145]){tick();return;}}
    move();if(wall()&&!b[0x118]){h.sound(0x2e);b[0x145]=12;W(0x3c,0);if(s(0x3e)>=0)W(0x3e,0);}
    if(s(0x3e)<0&&ground()){b[5]=6;h.dust(b[0x190]);h.sound(0x2e);b[0x1e]=4;b[0x181]=0;pose(w(0x128),1);return;}tick();return;
   case 6:b[0x1e]=(b[0x1e]-1)&255;if(!b[0x1e]){b[5]=8;load(0x108);b[0x181]=1;pose(w(0x128),2);}else tick();return;
   case 8:move();if(wall())W(0x3c,0);if(ground()){b[5]=10;load(0x110,true);b[0x181]=0;pose(w(0x128),3);}else tick();return;
   case 10:{const old=s(0x3c),next=(w(0x3c)-w(0x40))&65535;W(0x3c,((old>=0)===(!!(next&32768)))?0:next);L(6,l(6)+s(0x3c)*256);if(!w(0x3c)||wall())b[5]=b[0x119]=0;tick();return;}
   default:throw Error('Unknown fall phase '+b[5]);
  }
 };
 const dizzyAdmission=()=>{if(b[0x123]){b[0x124]=1;h.dizzyDuration(bytes);b[0x123]=0;h.stars(bytes);}};
 const finish=()=>{b[0x1bf]=b[0x196]=0;b[0x16c]=1;b[0x16e]=0;h.idle(bytes);};
 const recovery=waitPhase=>{
  if(b[4]===waitPhase){b[0x1e]=(b[0x1e]-1)&255;if(!b[0x1e]){b[4]+=2;b[0x151]=60;pose(0x28);}return;}
  if(b[4]===waitPhase+2){tick();if(b[0x15]){const n=h.random(0x38af2)&31;b[0x143]=D.getupNoise[n];if(!n)h.canonicalCheck();if(!b[0x124])finish();else{b[4]+=2;b[5]=b[0x143]=b[0x1bf]=b[0x196]=0;}}return;}
  if(b[4]===waitPhase+4){h.activeDizzy(bytes);if(!b[0x124])finish();return;}
  throw Error('Unknown recovery phase '+b[4]);
 };
 if(entry===0x39926){fall();return;}
 if(entry===0x3954e){
  if(b[4]===0){b[4]=2;b[5]=0;h.sound(b[0x291]===5?0x45:0x43);const prior=l(0x11a);params(0x700);L(0x11a,prior);W(0x100,0x300);W(0x10a,0x300);if(b[3])b[0x190]=b[3]===12?2:1;}
  if(b[4]===2){fall();if(!b[0x119]){b[4]=4;b[0x1a0]=1;}return;}
  if(b[4]===4){tick();return;}throw Error('Unknown original KO fall phase '+b[4]);
 }
 if(entry===0x3960a){
  if(b[4]===0){b[4]=2;b[0x1e]=60;pose(0x2e);h.sound(b[0x291]===5?0x45:0x43);return;}
  if(b[4]===2){b[0x1e]=(b[0x1e]-1)&255;if(b[0x1e]){tick();return;}b[4]=4;b[5]=0;const prior=l(0x11a);params(0x700);L(0x11a,prior);W(0x100,0x300);W(0x10a,0x300);W(0x3e,0);b[0x47]=0;fall();b[4]+=2;pose(0x2e);return;}
  if(b[4]===4){fall();if(s(0x3e)<0){b[4]=6;pose(0x26);}return;}
  if(b[4]===6){fall();if(!b[0x119]){b[4]=8;b[0x1a0]=1;}return;}
  if(b[4]===8){tick();return;}throw Error('Unknown original shock KO phase '+b[4]);
 }
 if(entry===0x38cae){
  if(b[4]===0){b[4]=2;b[5]=0;params(0x500);if(b[0x55]===24)b[0x190]=1;else if(b[0x55]===34)b[0x190]=2;}
  if(b[4]===2){fall();if(!b[0x119]){b[4]=4;b[0x190]=0;b[0x1e]=10;dizzyAdmission();}else push();return;}
  recovery(4);return;
 }
 if(entry===0x38d60){
  if(b[4]===0){b[4]=2;b[0x1e]=60;pose(0x2e);return;}
  if(b[4]===2){b[0x1e]=(b[0x1e]-1)&255;if(b[0x1e]){tick();return;}b[4]=4;b[5]=0;params(0x600);W(0x3c,0);W(0x3e,0);b[0x47]=0;fall();b[4]+=2;pose(0x2e);push();return;}
  if(b[4]===4){fall();if(s(0x3e)<0){b[4]=6;pose(0x26);}push();return;}
  if(b[4]===6){fall();if(!b[0x119]){b[4]=8;b[0x1e]=10;dizzyAdmission();}else push();return;}
  recovery(8);return;
 }
 throw Error('Unknown original reaction entry '+entry.toString(16));
}};

return module.exports;})();
 function register(p){if(registered.has(p.F))return registered.get(p.F);const poses={};for(const a of Object.values(D.fighters[p.fid])){const slot=p.F.anims.length;p.F.anims.push({...a,ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),flags:a.flags.slice()});for(let i=0;i<a.ents.length;i++)poses[a.source+24*i]=[slot,i];}Object.assign(SF2CESHADOWDATA.selectors,D.shadows);Object.assign(SF2CEREACTIONDATA.postures,D.postures);const r={poses};registered.set(p.F,r);return r;}
 const accepts=(p,reaction)=>!!reaction?.record&&[24,26,34].includes(reaction.reactionCode)&&((p.Y>>8)===0||window.SF2?.edition==='ai'&&[24,34].includes(reaction.reactionCode)&&!!(window.SF2AIFF?.get(p.aiProfile)||window.SF2AIHeroes?.get(p.aiProfile)||p.aiProfile==='damnd'));
 function reset(p){delete p.CESpecial;}
 function interrupt(p){if(!p.CESpecial)return;reset(p);SF2CEDIZZY.interrupt(p);}
 // AI guests reuse the native burn fall from their current airborne height.
 // The record still supplies the actual orange/blue reaction, never move names.
 function aiReaction(d,raw,region,block){
  const native=SF2CEREACTION.reactionCode(d,raw,region,block);
  const guest=window.SF2?.edition==='ai'&&!!(window.SF2AIFF?.get(d.aiProfile)||window.SF2AIHeroes?.get(d.aiProfile)||d.aiProfile==='damnd');
  return native===null&&guest&&(d.Y>>8)>0&&!block?.blocked&&raw[7]>=3&&[24,34].includes(raw[11])?raw[11]:native;
 }
 function describe(p,d,region){const record=SF2CECOMBAT.record(p);if(!record)return null;const reactionCode=aiReaction(d,record,region,{});return [24,26,34].includes(reactionCode)?{record,reactionCode,strength:record[8],profile:{projectile:false}}:null;}
 function start(p,reaction,dir,h,fatal=false){
  const dc=SF2CEDIZZY.state(p),raw=reaction.record,kind=raw[5]&255;
  dc.activeDizzy=dc.dizzy=0;dc.fall=dc.pending=null;dc.legacy=false;p.DIZZY=0;
  if(!fatal){const result=CORE.event.event({reaction:reaction.reactionCode,strength:reaction.strength,attackKind:kind&128?1:kind,heavyFlag:raw[7]>=3&&raw[7]!==4?1:0,skipRoster:0,blockFlag:0,throwStop:0,temporary:0,timer:dc.timer,points:dc.points,dizzy:0,fid:p.fid,opponentFid:p.opp.fid,alternateStrength:dc.alternateStrength},SF2CEDIZZYDATA.event,()=>h.random('special-dizzy-points',p));dc.timer=result.state.timer;dc.points=result.state.points;dc.dizzy=result.state.dizzy;}p.STP=dc.points;p.STPE=h.clock+dc.timer;
  const bytes=new Uint8Array(0x300),v=new DataView(bytes.buffer);bytes[2]=2;bytes[3]=14;bytes[0x55]=reaction.reactionCode;bytes[0x54]=dir>0?1:0;bytes[0x12]=p.FACE;bytes[0x291]=p.fid;bytes[0x123]=dc.dizzy;bytes[0x47]=14;bytes[0x71]=reaction.profile?.projectile?1:0;v.setUint32(6,((p.X+256*256)*256)>>>0);v.setUint32(10,((p.Y+40*256)*256)>>>0);v.setUint32(26,p.anim.source+24*p.aidx);v.setUint16(24,Math.max(1,p.anim.ents[p.aidx][1]-p.acc));v.setUint16(20,p.anim.flags?.[p.aidx]||0);
  p.CESpecial={bytes:Array.from(bytes),entry:reaction.reactionCode===26?0x38d60:0x38cae,age:0,remaining:0,escapeCount:0};p.ST=reaction.reactionCode===26?5:7;p.KB=p.STUN=p.VX=p.VY=p.AX=p.AY=0;p.CES=p.MV=null;p.NSL=null;
  if(fatal){bytes[2]=4;bytes[3]=D.model.deathRoutes[reaction.reactionCode>>1];bytes[0x123]=0;v.setUint16(42,65535);p.CESpecial.bytes=Array.from(bytes);p.CESpecial.entry=bytes[3]===6?0x3960a:0x3954e;p.CESpecial.fatal=true;p.CEKO={nativeSpecial:true,phase:0,stop:14,ready:false};delete p.CEKO_GROUND;delete p.CE_FatalHitPending;p.ST=8;}
  else if(reaction.profile?.projectile){const a=O.allocate(objects(h.world),8);if(a)Object.assign(a,{used:1,kind:56,parent:dc.address,bypass:0});}
  for(const key of['CER','CERSTOP','CEPF','CEGUARD','CEVNSTART','CENORMALINIT'])delete p[key];
 }
 function pose(p,a){const at=register(p).poses[a.source]||SF2CEDIZZY.register(p).poses[a.source];if(!at)throw Error('Unregistered special reaction '+a.source.toString(16));p.cur=at[0];p.anim=p.F.anims[p.cur];p.aidx=at[1];p.acc=p.anim.ents[p.aidx][1]-a.timer;p.adone=0;}
 function objects(G){return G.CEObjects||(G.CESpecialObjects??=O.create());}
 function body(p,G,h){const c=p.CESpecial;if(!c)return false;if(!c.fatal&&!h.alive(p)){reset(p);return false;}const bytes=Uint8Array.from(c.bytes),v=new DataView(bytes.buffer),dc=SF2CEDIZZY.state(p);let done=false;
  v.setUint32(6,((p.X+256*256)*256)>>>0);v.setUint32(10,((p.Y+40*256)*256)>>>0);bytes[0x48]=p.CEWALL||0;bytes[0x5b]=p.CESIDE||0;bytes[0x12]=p.FACE;
  MODEL.step(bytes,c.entry,D.model,{ground:40,sound:h.sound,random:pc=>h.random(pc,p),canonicalCheck(){},push:n=>{p.opp.X+=n*256;},dust:burn=>{const a=O.allocate(objects(G),8);if(a)Object.assign(a,{used:1,kind:53,x:v.getUint32(6),y:v.getUint32(10),subtype:p.FACE,draw:false,specialBurn:burn});h.random('0x2aa1e',p);},dizzyDuration(){const a={remaining:0,address:dc.address};CORE.active.duration(a,SF2CEDIZZYDATA.active,pc=>h.random(pc,p));c.remaining=a.remaining;dc.dizzy=0;p.DIZZY=2;h.countDizzy();},stars(){dc.activeDizzy=1;O.spawnDizzy(objects(G),p,c.remaining);},activeDizzy(){
   const a={address:dc.address,fid:p.fid,phase:bytes[5],remaining:c.remaining,activeDizzy:bytes[0x124],escapeCount:c.escapeCount,source:v.getUint32(26),timer:v.getUint16(24),flags:v.getUint16(20),y:v.getUint32(10),inputRole:h.human(p)?1:0,keys:SF2CEDIZZY.keys(p.KEYS),previousKeys:SF2CEDIZZY.keys(p.CEDizzyPrev||0),level:p.CE_HANDICAP??16,field4d:0,field4e:0};CORE.active.step(a,SF2CEDIZZYDATA.active,pc=>h.random(pc,p));c.remaining=a.remaining;c.escapeCount=a.escapeCount;bytes[5]=a.phase;bytes[0x124]=a.activeDizzy;v.setUint32(26,a.source);v.setUint16(24,a.timer);v.setUint16(20,a.flags);v.setUint32(10,a.y);
  },idle(){done=true;}});
  p.X=(v.getUint32(6)/256|0)-256*256;p.Y=(v.getUint32(10)/256|0)-40*256;p.FACE=bytes[0x12];p.CEDizzyPrev=p.KEYS;dc.activeDizzy=bytes[0x124];dc.dizzy=bytes[0x123];c.age++;c.bytes=Array.from(bytes);
  if(done){delete p.CESpecial;dc.activeDizzy=dc.dizzy=0;p.DIZZY=0;h.release(p);h.tick(p);return true;}
  p.ST=c.fatal?8:bytes[0x124]&&bytes[4]===(c.entry===0x38cae?8:12)?5:c.entry===0x38d60&&bytes[4]===2?5:7;if(c.fatal)Object.assign(p.CEKO,{phase:bytes[4],stop:bytes[0x47],ready:!!bytes[0x1a0]});pose(p,{source:v.getUint32(26),timer:v.getUint16(24)});return true;
 }
 function art(p,alternate){if(p.CESpecial&&p.anim?.name?.startsWith('ceDizzy'))return SF2CEDIZZY.art(p,alternate);if(!p.anim?.name?.startsWith('ceSpecial'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect,fixedPalette:a.fixedPalette||p.anim.name.startsWith('ceSpecialBurn')}:null;}
 function aiObjects(G,P,h){if(!G.CESpecialObjects)return;const proxy={CEObjects:G.CESpecialObjects,CEObjectSerial:G.CESpecialSerial||0};SF2CEDIZZY.objects(proxy,P,h);G.CESpecialSerial=proxy.CEObjectSerial;}
 function physical(G,P){const s=G.CESpecialSlow;if(s?.pending){if(P[s.victim].CEKO?.stop>0)return true;s.pending=false;s.gate=180;}if(!s?.gate)return true;s.gate--;s.divider--;if(!s.divider){s.divider=s.period;return true;}return false;}
 function aiKO(G,P){const p=P.find(p=>p.CESpecial?.fatal);if(p){G.slow=0;G.CESpecialSlow={pending:true,victim:p.i,gate:0,divider:3,period:3};return true;}return false;}
 function gateObject(a,P,h){const p=P[a.parent===0x83be?0:1];if(!a.bypass&&(p.CESpecial?.bytes[0x47]||p.CEKO?.stop||p.CERSTOP?.ticks||0))return false;h.world.CESpecialSlow={gate:a.child?180:60,divider:a.child?3:2,period:a.child?3:2};return true;}
 window.SF2CESPECIAL={ready,register,accepts,reset,interrupt,aiReaction,describe,start,body,art,aiObjects,physical,gateObject,aiKO};
})();
