/* AI-only binding of original CE grabs. Native animation lists/attachment rows
 * are retained; guest-body attachment and input escape are authored adapters.
 * WW and CE keep their existing controllers. See AI-NATIVE-GRABS.md. */
'use strict';
window.SF2AINativeGrabs=(()=>{
 const D=SF2AINATIVEGRABDATA,slots=new WeakMap(),images=D.images.map(src=>{const im=new Image();im.src=src;return im;});
 const ready=Promise.all(images.map(im=>im.decode())),clone=x=>JSON.parse(JSON.stringify(x));
 function register(p){let s=slots.get(p.F);if(s)return s;s={poses:{},victims:{}};for(const[k,a]of Object.entries(D.poses[p.fid]||{})){s.poses[k]=p.F.anims.length;p.F.anims.push(clone(a));}for(const[k,a]of Object.entries(D.victims[p.fid]||{})){s.victims[k]=p.F.anims.length;p.F.anims.push(clone(a));}slots.set(p.F,s);Object.assign(SF2CESHADOWDATA.selectors,D.shadows);return s;}
 function art(p,alternate){if(!p.anim?.name?.startsWith('aiGrab_'))return null;const a=p.anim.extraArt?.[p.aidx];return a?{image:images[a.images[alternate?1:0]],rect:a.rect,nativeEyeFrame:null}:null;}
 function find(p,name,guest=false){
  if(guest){if(/^thpose/.test(name))return 22;if(/^throwfall|^vegaizunafall/.test(name))return /3$/.test(name)?29:28;if(name==='bitetoss')return 28;if(name==='biteland')return 30;return undefined;}
  const match=/^thpose(\d+)$/.exec(name);return match?register(p).victims[match[1]]:undefined;
 }
 function dimensions(p){const r=p.anim?.extraArt?.[p.aidx]?.rect||p.F.frames[p.anim.ents[p.aidx][0]];return p.AIFFHeld?.inverted?[0,0,r[2],r[3],-Math.floor(r[2]/2),-Math.floor(r[3]/2)]:r;}
 function clampPair(p,d,h){const room=h.room(),bounds=q=>{const r=dimensions(q),x=q.X/256,left=x+(q.FACE?-r[4]-r[2]:r[4]);return[left,left+r[2]];},a=bounds(p),b=bounds(d),lo=Math.min(a[0],b[0]),hi=Math.max(a[1],b[1]);let shift=lo<room.left?room.left-lo:hi>room.right?room.right-hi:0;if(hi-lo>room.right-room.left)shift=0;p.X+=Math.round(shift*256);d.X+=Math.round(shift*256);}
 function poseVictim(p,c,h){const d=p.opp,index=p.anim.attachIndices?.[p.aidx]??0,row=D.rows[p.fid]?.[d.fid]?.[index];if(!row)return;
  if(h.guest(d)){
   if(d.cur!==22)h.anim(d,22,0);d.ST=5;d.STUN=999;d.FACE=p.FACE^1;
   const inverted=['spd','jump-slam'].includes(c.kind)&&c.phase>0&&c.phase<=3;d.AIFFHeld={owner:p.i,native:true,inverted};
   const point=inverted?h.invertedHead(d):h.head(d),sign=p.FACE?1:-1,target={x:p.X/256+(inverted?0:sign*38),y:p.Y/256+(inverted?12:86)};
   if(point){d.X+=Math.round((target.x-point.x)*256);d.Y+=Math.round((target.y-point.y)*256);}else{d.X=p.X+sign*32*256;d.Y=p.Y;}if(!inverted)d.Y=Math.max(0,d.Y);
  }else{
   const slot=register(d).victims[row[3]];if(slot!==undefined&&d.cur!==slot)h.anim(d,slot,0);d.X=(p.X&~255)+(p.FACE?-row[0]:row[0])*256+(d.X&255);d.Y=(p.Y&~255)+row[1]*256+(d.Y&255);d.FACE=p.FACE^((row[2]>>5)&1);
  }
  d.ST=5;d.STUN=999;d.KB=d.VX=d.VY=d.AX=d.AY=0;clampPair(p,d,h);
 }
 function unlink(p){const d=p.opp;if(d.AINativeHeld?.owner===p.i)delete d.AINativeHeld;if(d.AIFFHeld?.native&&d.AIFFHeld.owner===p.i)delete d.AIFFHeld;}
 function cancel(p,h){const c=p.AINativeGrab;if(!c)return false;delete p.AINativeGrab;unlink(p);p.THV=null;const d=p.opp;if(d.ST===5&&d.STUN>=500){d.STUN=0;h.fall(d,h.alive(d)?7:8,c.dir);}if(p.MV?.kind==='ai-native-grab')p.MV=null;if(p.ST===11){if(p.Y>0||!h.alive(p))h.fall(p,h.alive(p)?7:8,c.dir);else h.idle(p);}return true;}
 function finish(p,h){unlink(p);delete p.AINativeGrab;p.THV=p.MV=null;if(p.Y>0){h.fall(p,h.alive(p)?7:8,p.FACE?1:-1);}else h.idle(p);}
 function start(p,name,kind,h,extra={}){const slot=register(p).poses[name];if(slot===undefined)return false;const d=p.opp;h.interrupt(d);d.DIZZY=0;p.CES=p.CETH=p.THV=null;p.MV={kind:'ai-native-grab'};p.ST=11;p.KB=p.RETCR=p.SPK=p.SPKD=0;p.hitdone=1;p.Y=p.VX=p.VY=p.AX=p.AY=0;p.AINativeGrab={kind,name,phase:0,age:0,dir:p.FACE?1:-1,face:p.FACE,hits:0,escape:0,previous:d.KEYS,ownerPrevious:p.KEYS,lastMarker:-1,cameraVictimOffset:(d.X-p.X)/256,...extra};d.AINativeHeld={owner:p.i};d.ST=5;d.STUN=999;d.KB=0;h.anim(p,slot,0);p.acc=-1;poseVictim(p,p.AINativeGrab,h);h.sound(kind==='spd'?0x47:kind==='hold'?(p.fid===7?0x25:0x23):p.fid===6?(name==='giefMP'?0x46:0x47):(p.F.sfx?.thr||0x27));return true;}
 function init(p,button,h){
  if(h.guest(p))return false;
  if(p.fid===1&&button===1)return start(p,'hondaMP','toss',h,{flip:true,finishShift:40});
  if(p.fid===7&&button===1)return start(p,'noogie','hold',h,{time:180});
  if(p.fid===7&&button===2)return start(p,'yogaThrow','toss',h,{flip:true});
  if(p.fid===10&&[1,2].includes(button))return start(p,'headbuttHold','hold',h,{time:300});
  if(p.fid===9&&[1,2].includes(button))return start(p,'sagatThrow','toss',h,{flip:true});
  if(p.fid===6&&[1,2,4,5].includes(button)){const name={1:'giefMP',2:'giefHP',4:'giefMK',5:'giefHK'}[button];return start(p,name,button===1?'jump-slam':'toss',h,{flip:true,descriptor:button>=3?2:0});}
  return false;
 }
 function crouch(p,button,h){return p.fid===6&&[1,2].includes(button)?start(p,button===1?'giefCMP':'giefCHP','toss',h,{damageCode:12,flip:false}):false;}
 function special(p,move,strength,h){if(h.guest(p)||p.fid!==6||move.inp!=='360'||p.Y!==0||p.opp.Y!==0||!h.alive(p.opp))return false;return start(p,'giefSPD','spd',h,{strength,flip:false});}
 function release(p,c,h,code=13){const d=p.opp;unlink(p);const damage=h.throwDamage(p,d,code);h.release(d,c.descriptor||0,c.dir,damage);c.released=true;}
 function move(p,c){c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;}
 function step(p,h){const c=p.AINativeGrab;if(!c)return false;if(p.ST!==11||!h.alive(p)||h.roundOver()){cancel(p,h);return true;}c.age++;const d=p.opp;if(!c.released&&!h.alive(d)){cancel(p,h);h.idle(p);return true;}const marker=p.anim.flags[p.aidx]&255;
  if(c.kind==='hold'){
   const pressed=d.KEYS&~c.previous;c.previous=d.KEYS;c.escape+=(pressed&15?3:0)+(pressed&1008?1:0);if(!h.human(d)&&c.age%10===0)c.escape++;
   const squeeze=p.KEYS&~c.ownerPrevious;c.ownerPrevious=p.KEYS;if(squeeze&1008)p.acc=p.anim.ents[p.aidx][1]-1;
   if(c.age>=c.time||c.escape>=40){unlink(p);d.STUN=12;d.Y=0;finish(p,h);return true;}
   if(marker&&c.lastMarker!==p.aidx){c.lastMarker=p.aidx;if(marker===0x85)h.sound(0x85);else{h.damage(p,d,h.throwDamage(p,d,c.hits?10:12));c.hits++;h.freeze(12);h.sound(p.fid===7?0x29:0x2c);}}
   if(!marker)c.lastMarker=-1;poseVictim(p,c,h);return true;
  }
  if(c.kind==='toss'){
   if(!c.released&&marker){c.dir=-(c.face?1:-1);release(p,c,h,c.damageCode??13);}
   if(p.adone||p.anim.flags[p.aidx]&0x8000){if(c.flip)p.FACE^=1;if(c.finishShift)p.X+=(p.FACE?1:-1)*c.finishShift*256;if(!c.released){c.dir=-(c.face?1:-1);release(p,c,h);}finish(p,h);}else if(!c.released)poseVictim(p,c,h);return true;
  }
  // MP 041DF8..041E1A samples absolute RIGHT at takeoff; neutral goes left.
  if(c.phase===0){if(marker===1){c.phase=1;c.vx=c.kind==='spd'?c.dir*0x100:(p.KEYS&2?1:-1)*0x200;c.vy=c.kind==='spd'?0x700:0x600;c.ay=c.kind==='spd'?0x28:0x48;p.VX=c.vx;p.VY=c.vy;p.AY=c.ay;}poseVictim(p,c,h);return true;}
  if(c.phase===1||c.phase===2){
   move(p,c);if(c.kind==='spd'&&c.phase===1&&c.vy<0){c.phase=2;c.vy=0;c.ay=0x90;}
   if(c.kind==='jump-slam'&&marker===2)p.acc--;
   // Original victim descriptor2 (0391B6) and14 (0394CA) launch after the slam.
   if(c.vy<0&&p.Y<=0){p.Y=0;c.phase=3;c.at=c.age;p.VX=p.VY=0;if(c.kind==='spd'){h.anim(p,register(p).poses.giefSPDImpact,0);p.acc=-1;}poseVictim(p,c,h);h.damage(p,d,h.throwDamage(p,d,c.kind==='spd'?16:13));c.hits++;h.freeze(12);h.sound(0x2e);unlink(p);if(h.guest(d))d.Y=0;h.release(d,c.kind==='spd'?14:2,c.dir,0);if(d.CETHV){Object.assign(d.CETHV,{vx:c.dir*(c.kind==='spd'?0x280:0x200),vy:c.kind==='spd'?0x880:0x600,ay:0x58});}c.released=true;return true;}poseVictim(p,c,h);return true;
  }
  if(c.phase===3){if(c.age-c.at<1){p.acc--;return true;}c.phase=4;c.vx=-(c.face?1:-1)*(c.kind==='spd'?0x300:0x280);c.vy=c.kind==='spd'?0x800:0x280;c.ay=c.kind==='spd'?0x60:0x48;return true;}
  move(p,c);if(c.vy<0&&p.Y<=0){p.Y=0;p.VX=p.VY=0;finish(p,h);}return true;
 }
 function victim(p,h){const link=p.AINativeHeld;if(!link)return false;const owner=p.opp;if(owner.i!==link.owner||!owner.AINativeGrab||owner.ST!==11||!h.alive(owner)){if(owner.AINativeGrab)cancel(owner,h);delete p.AINativeHeld;return false;}p.ST=5;p.STUN=999;p.KB=0;p.acc--;return true;}
 function sync(p,h){if(p.AINativeGrab&&!p.AINativeGrab.released)poseVictim(p,p.AINativeGrab,h);}
 return{ready,register,art,find,init,crouch,special,step,victim,sync,cancel};
})();
