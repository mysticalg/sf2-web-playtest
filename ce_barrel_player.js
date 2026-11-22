/* CE barrel-player reaction14:953a0,37836,38962..38b78; original turn3835a.
   Bonus-local descriptors never append fighter slots or alter faithful atlases. */
'use strict';
window.SF2CEBARRELPLAYER=(()=>{
 const D=window.SF2CEBARRELPLAYERDATA,NAMES=['fall','lie','getup','turn','cturn','airfall','land'];
 const images=(D?.art||[]).map(a=>{const i=new Image();i.src=a.image;return i;});
 const ready=Promise.all(images.map(i=>i.decode()));
 const enabled=B=>B?.kind===1&&(!window.SF2||['ce','ai'].includes(SF2.edition));
 function state(B,p){return B.barrels.player||init(B,p);}
 function init(B,p){
  if(!enabled(B))return null;
  if(!B?.barrels)throw Error('Initialize native barrel manager before player helper');
  Object.assign(window.SF2CESHADOWDATA?.selectors||{},D.shadows);
  const c=B.barrels.player={hp:1,oldHP:1,invulnerability:0,bodyStop:0,phase:null,age:-1,vx:0,vy:0,pause:0,rebounded:false,animName:null,lastFrame:null,lastOwned:false,native143:0,desiredFacing:1,airborne:false};
  B.nativeDesiredFacing=1;
  p.HP=1;return c;
 }
 function select(p,c,name,index=0,preserveTimer=false){
  const a=D.fighters[p.fid]?.[name];if(!a)throw Error('Missing native bonus-player pose '+p.fid+'/'+name);
  const left=p.anim?.ents[p.aidx]?.[1]-p.acc;
  p.cur=-1001-p.fid*NAMES.length-NAMES.indexOf(name);p.anim=a;p.aidx=index;p.acc=preserveTimer&&Number.isFinite(left)?a.ents[index][1]-left:0;p.adone=0;p.hitdone=1;c.animName=name;
 }
 function restore(p,c,h){const y=p.Y;h.idle(p);p.Y=y;c.animName=null;c.phase=null;}
 function stop(B,p,ticks=14){if(!enabled(B))return false;const c=state(B,p);if(!c.phase)c.bodyStop=ticks;return true;}
 function begin(B,p,options={}){
  if(!enabled(B))return false;
  const c=state(B,p);if(c.invulnerability)return false;
  const airborne=options.airborne??(c.phase?c.airborne:p.ST===2);
  c.hp=(c.hp-1)&65535;p.HP=c.hp;c.invulnerability=120;c.bodyStop=0;c.phase='pending';c.age=-1;c.direction=options.direction<0?-1:1;c.record=options.record?Array.from(options.record).slice(0,12):null;c.strength=c.record?.[8]??2;c.pause=0;c.rebounded=false;c.animName=null;c.reaction=airborne?16:14;c.airborne=airborne;
  p.ST=7;p.KB=p.STUN=0;p.CES=null;p.MV=null;
  options.sound?.(0x2c);return true;
 }
 function facing(B,p,options={}){
  if(![0,1].includes(B?.kind)||(window.SF2&&!['ce','ai'].includes(SF2.edition)))return p.FACE;
  if(B.nativeDesiredFacing!==0&&B.nativeDesiredFacing!==1)B.nativeDesiredFacing=1;
  const airborne=options.airborne??p.ST===2;
  if(options.ready!==false&&!airborne){if(p.KEYS&1)B.nativeDesiredFacing=0;else if(p.KEYS&2)B.nativeDesiredFacing=1;}
  return B.nativeDesiredFacing;
 }
 const attackPressed=(p,h)=>h.pressed!==undefined?!!(h.pressed&0x3f0):!!(p.KEYS&0x3f0);
 function controls(p,h){return !!(p.KEYS&7)||attackPressed(p,h);}
 function finishGetup(p,c,h){
  const face=c.desiredFacing,down=!!(p.KEYS&8);
  restore(p,c,h);
  if(face!==p.FACE&&!controls(p,h)){p.FACE=face;p.ST=4;c.phase='turn';select(p,c,down?'cturn':'turn');return true;}
  p.FACE=face;return false;
 }
 function landing(p,c,h){
  if(p.FACE!==c.desiredFacing)return finishGetup(p,c,h);
  if((p.KEYS&8)||controls(p,h)){restore(p,c,h);return false;}
  if(--c.wait===0){restore(p,c,h);return false;}
  return true;
 }
 function actor(B,p,h){
  if(!enabled(B))return false;
  const c=state(B,p);
  if(h.frame!==undefined&&c.lastFrame===h.frame)return c.lastOwned;
  c.lastFrame=h.frame??null;
  if(c.invulnerability)c.invulnerability--;
  if(c.native143)c.native143--;
  // Bonus-specific37b40..37b74 replaces opponent-relative facing: keep the
  // last horizontal input while grounded; retain it while airborne/neutral.
  const airborne=c.phase?c.airborne:(h.airborne!==undefined?h.airborne:p.ST===2);
  c.desiredFacing=facing(B,p,{airborne,ready:!h.intro});
  // Native bonus HP is a notification bit; repair negative transient before KO.
  if(c.hp!==c.oldHP)c.hp=c.oldHP^1;p.HP=c.hp;
  const owned=()=>{c.lastOwned=true;return true;},free=()=>{c.lastOwned=false;return false;};
  if(!c.phase){
   if(c.bodyStop>0){c.bodyStop--;return owned();}
   if((p.ST===0||p.ST===3)&&p.FACE!==c.desiredFacing){
    p.FACE=c.desiredFacing;if(!controls(p,h)){c.phase='turn';p.ST=4;select(p,c,p.KEYS&8?'cturn':'turn');return owned();}
   }
   return free();
  }
  c.age++;
  if(c.phase==='pending'){c.oldHP=c.hp;c.phase='fallInit';return owned();}
  if(c.phase==='fallInit'){p.FACE=c.direction>0?0:1;select(p,c,c.reaction===16?'airfall':'fall');c.stop=14;c.phase='stop';return owned();}
  if(c.phase==='stop'){
   if(c.stop>0){c.stop--;return owned();}
   c.vx=c.direction*0x200;c.vy=0x5c0;c.phase='air';c.airborne=true;if(c.reaction===16)p.Y+=16*256;return owned();
  }
  if(c.phase==='air'){
   if(c.pause){c.rebounded=true;if(--c.pause)return owned();}
   c.vy-=0x48;p.X+=c.vx;p.Y+=c.vy;
   const wall=h.wall?h.wall(p):(p.CEWALL||p.CARSIDE||0);
   if(wall&&!c.rebounded){if(c.reaction!==16)h.sound?.(0x2e);c.pause=12;c.vx=0;if(c.vy>=0)c.vy=0;}
   const landed=h.floor?h.floor(p):(p.Y>>8)<0;
   if(landed){
    if(!h.floor)p.Y&=255;c.airborne=false;
    if(c.reaction===16){const random=h.random?h.random():h.rand?h.rand():0;c.native143=D.getupRandom[random&31];c.invulnerability=120;c.phase='landing';c.wait=7;select(p,c,'land');h.sound?.(0x2f);return landing(p,c,h)?owned():free();}
    c.phase='lie';c.wait=10;select(p,c,'lie');h.sound?.(0x2e);return owned();
   }
   h.tick(p);return owned();
  }
  if(c.phase==='lie'){
   if(--c.wait)return owned();c.phase='getup';c.invulnerability=60;select(p,c,'getup');return owned();
  }
  if(c.phase==='getup'){
   h.tick(p);if(!(p.anim.flags[p.aidx]&255))return owned();
   const random=h.random?h.random():h.rand?h.rand():0;c.native143=D.getupRandom[random&31];
   return finishGetup(p,c,h)?owned():free();
  }
  if(c.phase==='landing')return landing(p,c,h)?owned():free();
  if(c.phase==='turn'){
   h.tick(p);
   if(controls(p,h)){restore(p,c,h);return free();}
   const down=!!(p.KEYS&8),name=down?'cturn':'turn';
   if(p.anim.flags[p.aidx]&0x8000){restore(p,c,h);return free();}
   if(name!==c.animName){const selector=p.anim.flags[p.aidx]&255,a=D.fighters[p.fid][name];select(p,c,name,a.selectors[selector]??0,true);}
   return owned();
  }
  throw Error('Unknown native barrel-player phase '+c.phase);
 }
 function draw(ctx,B,p,screenX,groundY,bim,paint=im=>im){
  if(!enabled(B))return {body:false,claw:false};
  const c=B?.barrels?.player;if(!c?.phase||!p.anim?.supplement)return {body:false,claw:false};
  const views=p.anim.supplement[p.aidx],parts=p.anim.claw[p.aidx],face=p.FACE?1:0;
  const part=v=>{if(!v)return;const art=D.art[v[0]],im=bim?bim(art.image):images[v[0]];if(im?.complete&&im.naturalWidth)ctx.drawImage(paint(im),screenX+v[1],groundY-(p.Y>>8)+v[2]);};
  if(views)part(views[face]);if(parts)part(parts[face]);
  return {body:!!views,claw:!!parts};
 }
 return {init,begin,actor,stop,facing,bonusFacing:facing,draw,ready,data:D,contract:{direction:'world sign -1/+1, native FACE1 pushes right',frame:'actor hook after input bookkeeping, exactly once per G.tick incl freeze',facing:'facing(B,p,{ready,airborne}) is shared bonus37b40 last grounded horizontal input, stored B.nativeDesiredFacing; no opponent/NPC target',draw:'groundY is ground baseline; helper subtracts integer playerY; returns independent body/claw ownership',scope:'native CE barrel bonus and AI Edition; facing shared by car/barrel; optional palette-only paint callback for AI body/claw parts',random:'supply random:rand; helper consumes the one native getup RNG344 call and masks low5bits',contactSound:0x2c}};
})();
