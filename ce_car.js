/* Original CE car composition: scroll1 holds the static wreck/chassis/wheels;
   damage-state objects cover it. tools/ce_car_art.py verifies the intact
   composition pixel-for-pixel against the native VRAM capture. */
'use strict';
window.SF2CECAR=(()=>{
  const hpTable=[3,5,4,5,3,4,5,4,4,4,5,3,4,3,5,3];
  const scores=[500,500,500,1000,1000,1000,1000,1000,1000,2000,2000,3000,3000,3000,3000];
  const data=()=>window.SF2CECARDATA;
  const fxdata=()=>window.SF2CECLASHDATA;
  const hp=rand=>hpTable[rand()&15];
  // Native FX32 suspension/impact impulses, measured in original world pixels.
  const mount=[[0,0,-1],[4,0,-1],[8,0,-1],[12,0,1]],unmount=[[0,0,1],[4,0,1]];
  const impact=[[0,1,-1],[2,1,-1],[5,0,2],[9,-1,-1],[14,-1,1]];
  function impulse(c,steps,sign=1){c.effects.push({age:0,steps,sign});}
  function init(B,p,rand,image){
    B.car={phase:0,a:0,b:0,left:0,right:0,health:[hp(rand),hp(rand),0],heroStop:0,perfect:false,done:false,collapseAge:null,finishReported:false,scoreCount:0,hits:0,clanks:0,yOffset:0,dx:0,dy:0,effects:[],sparks:[],debris:[],tick:0,supported:false};
    if(p){p.X=p.X0=96<<8;p.Y=0;}if(image){for(const s of data()?.states||[])image(s.img);for(const k of ['background','finalUnderlay'])if(data()?.[k])image(data()[k].img);for(const f of fxdata()?.frames||[])image(f.img);for(const f of data()?.debris?.frames||[])image(f.img);}sync(B);return B.car;
  }
  function sync(B){const c=B.car;B.fr=Math.min(4,c.left*2);B.rr=c.phase===2||c.right>=3?4:0;B.dmg=c.done?9:Math.min(8,c.left+c.right);}
  function stepSparks(c,rand){
    const f=fxdata();if(!f)return;
    for(let i=c.sparks.length-1;i>=0;i--){const e=c.sparks[i];
      if(e.pending){const off=f.randomOffsets[(rand()&12)>>2];e.x+=off[0];e.y+=off[1];e.pending=false;continue;}
      if(--e.timer===0){e.index++;const entry=f.animations[e.selector].entries[e.index];if(!entry||entry.terminal){c.sparks.splice(i,1);continue;}e.timer=entry.ticks;}
      e.visible=true;
    }
  }
  function setDebrisAnim(e,name){e.animation=name;e.index=0;e.timer=data().debris.animations[name].entries[0].ticks;}
  function tickDebrisAnim(e){const a=data().debris.animations[e.animation];if(--e.timer===0){e.index=a.entries[e.index].flags&0x8000?a.loop:e.index+1;e.timer=a.entries[e.index].ticks;}}
  function spawnChunks(c,count,material,variant,group,x,y){for(let i=0;i<count;i++)c.debris.push({kind:26,material,variant,group,originX:x,originY:y,initialized:false,x:0,y:0,visible:false});}
  function spawnDebris(c){if(!data()?.debris)return;for(const [kind,count]of [[7,2],[6,3],[5,4]])for(let side=0;side<count;side++)c.debris.push({kind,side,initialized:false,x:0,y:0,repeat:3,visible:false});for(const [count,material,variant,group,x,y]of data().debris.chunk.finalGroups)spawnChunks(c,count,material,variant,group,x,y-40);}
  function stepDebris(c,rand){
    const d=data()?.debris;if(!d)return;
    for(const e of c.debris){
      e.visible=false;if(e.dead)continue;
      if(e.removeNext){e.dead=true;continue;}
      if(e.kind===26){
        const ch=d.chunk;
        if(!e.initialized){const life=ch.life[(rand()&30)>>1];e.life=life>>8;e.full=life&255;e.x=((e.originX+ch.jitter[(rand()&30)>>1])<<8)+(e.x&255);e.y=((e.originY+ch.jitter[(rand()&30)>>1])<<8)+(e.y&255);[e.vx,e.ax,e.vy,e.ay]=ch.vectors[e.group*8+(rand()&7)];const material=e.material<0?rand()&1:e.material;setDebrisAnim(e,'chunk'+material+'_'+e.variant);e.initialized=true;continue;}
        e.vx-=e.ax;e.vy-=e.ay;e.x+=e.vx;e.y+=e.vy;if(--e.life===0)e.removeNext=true;tickDebrisAnim(e);if(e.full>0){e.full--;e.visible=true;}else e.visible=!(e.life&1);continue;
      }
      if(!e.initialized){const m=d.motion[e.kind];e.x=(m.x[e.side]<<8)+(e.x&255);e.y=((m.y[e.side]-40)<<8)+(e.y&255);e.vx=m.vx?.[e.side]||0;e.vy=m.vy?.[e.side]||0;e.ay=m.ay||0;e.phase=0;e.hidden=false;e.wait=0;e.life=20;e.blink=0;e.initialized=true;setDebrisAnim(e,String(e.kind));continue;}
      if(e.kind===5){
        if(e.phase===0){e.vy-=e.ay;e.x+=e.vx;e.y+=e.vy;if(e.vy<0){e.phase=1;e.hidden=true;e.wait=30;}}
        else if(--e.wait<0){if(--e.repeat===0)e.removeNext=true;else e.initialized=false;}
        tickDebrisAnim(e);e.visible=!!(c.globalTick&1)&&!e.hidden;
      }else if(e.kind===6){
        if(e.phase===0){if(--e.life===0){e.phase=1;e.blink=20;}}
        else if(--e.blink===0)e.removeNext=true;
        e.vy-=e.ay;e.x+=e.vx;e.y+=e.vy;e.visible=!(e.blink&1);
      }else{
        const entry=d.animations[e.animation].entries[e.index];
        if(entry.flags&0x8000){if(e.phase===0){e.phase=1;setDebrisAnim(e,'7hold');e.timer=d.holdTimers[(rand()&14)>>1];}else{e.phase=0;setDebrisAnim(e,'7');}}
        tickDebrisAnim(e);e.visible=!!(c.globalTick&1);
      }
    }
    c.debris=c.debris.filter(e=>!e.dead);
  }
  function before(B,p,rand,tick){
    const c=B.car||init(B,p,rand),reset=i=>{c.health[i]=hp(rand);};
    c.tick++;c.globalTick=tick??c.tick;if(c.collapseAge!==null)c.collapseAge++;
    const supported=!!p.CARSUPPORT;if(supported!==c.supported){impulse(c,supported?mount:unmount);c.supported=supported;}
    let dx=0,dy=0;
    for(const e of c.effects){for(const [at,x,y] of e.steps)if(e.age===at){dx+=x*e.sign;dy+=y;}e.age++;}
    c.effects=c.effects.filter(e=>e.age<=e.steps[e.steps.length-1][0]);c.dx+=dx;c.dy+=dy;
    if(supported){p.X+=dx<<8;p.Y+=dy<<8;}
    // Literal 0x3488e..0x34a12. Health changes occur in the preceding hit pass.
    if(!c.done){
      if(c.phase===0){
        if(c.a===0){
          if(c.b===0){if(c.health[0]<0){c.b=2;c.left++;reset(0);}if(c.health[1]<0){c.a=2;c.right=3;}}
          else if(c.b===2){if(c.health[0]<0){c.b=4;c.left++;}if(c.health[1]<0){c.a=2;c.right=3;}}
          else if(c.health[1]<0){c.a=2;c.right=3;reset(0);reset(1);}
        }else{
          if(c.b===0){if(c.health[0]<0){c.b=2;c.left++;reset(0);}}
          else if(c.b===2){if(c.health[0]<0){c.b=4;c.left++;reset(0);reset(1);}}
          else if(c.health[0]<0||c.health[1]<0){c.phase=2;c.a=c.b=c.right=0;c.left=6;reset(0);}
        }
      }else if(c.health[0]<0){
        if(c.a<18){c.a+=2;c.left++;reset(0);if(c.left===15)c.perfect=true;} // Raw 0xff0b12 marker only; native PERFECT requires final A51.
        else{c.a=20;c.done=true;c.yOffset=24;c.collapseAge=0;}
      }
    }
    stepSparks(c,rand);
    stepDebris(c,rand);
    sync(B);const frozen=c.heroStop>0;if(frozen)c.heroStop--;return frozen;
  }
  function regions(B){
    const c=B.car;if(!c)return [];
    const index=Math.min(15,c.left+c.right),refs=data()?.states[index]?.hurt||(index<6?[1,2,0]:[3,0,0]);
    const boxes=data()?.boxes||[[0,0,0,0],[-56,72,22,25],[56,72,22,25],[0,33,61,22]];
    return refs.map((ref,pool)=>ref?{pool,box:[192+(c.dx||0)+boxes[ref][0],boxes[ref][1]+(c.dy||0)-c.yOffset,boxes[ref][2],boxes[ref][3]]}:null).filter(Boolean);
  }
  function overlap(a,b){return Math.abs(a[0]-b[0])<=a[2]+b[2]&&Math.abs(a[1]-b[1])<=a[3]+b[3];}
  function distance(B,p){const x=p.X>>8,extent=data()?.playerExtents?.[p.fid];return Number.isInteger(extent)?Math.max(0,Math.abs((x<176?144:240)-x)-extent):null;}
  function closeNormal(B,p,attack){const d=distance(B,p);return window.SF2CEBARRELS?.closeByDistance?.(p,attack,d)??null;}
  function platform(B,p){
    // Native 0x34f28..0x34fac. Bonus extents use 0x3958, not camera 0x394c.
    const extent=(data()?.playerExtents||[24,43,33,28,24,32,32,28,32,32,30,35])[p.fid],radius=72+extent;
    const floorY=56+(B.car?.dy||0)-(B.car?.yOffset||0),dx=192+(B.car?.dx||0)-(p.X>>8),dy=floorY-(p.Y>>8);
    if(Math.abs(dx)>radius||dy<0)return {within:Math.abs(dx)<=radius,supported:false,pushX:0,floorY};
    const pushX=dx+(dx>=0?-radius:radius);
    const deltaY=p.Y-(p.CARY0??p.Y);
    if(dy<=Math.abs(pushX)&&dy<=32&&deltaY<=0)return {within:true,supported:true,pushX:0,floorY};
    return {within:true,supported:false,pushX,floorY};
  }
  function check(B,p,attack,projectile,h){
    const c=B.car||init(B,p,h.rand);
    if(c.done){if(!c.finishReported){c.finishReported=true;if(c.a>=20)h.sound(0x31);h.finish();}return;}
    for(const [box,isProjectile] of [[attack,false],[projectile,true]]){
      if(!box||!isProjectile&&p.hitdone)continue;const hit=regions(B).find(r=>overlap(box,r.box));if(!hit)continue;
      impulse(c,impact,isProjectile?(p.FBVX>=0?1:-1):(p.FACE?1:-1));
      if(isProjectile)p.FBON=0;else{p.hitdone=1;c.heroStop=14;}
      const blocked=c.health[hit.pool]<0,damage=1+Math.max(0,Math.min(2,(isProjectile?h.projectileStrength:h.strength)|0));
      if(blocked){c.clanks++;h.sound(0x72);}
      else{
        c.hits++;B.hits=(B.hits||0)+1;c.health[hit.pool]=Math.max(-1,c.health[hit.pool]-damage);h.sound(0x33);
        if(c.health[hit.pool]<0){c.scoreCount=Math.min(14,c.scoreCount+1);h.score(scores[c.scoreCount]);if(c.scoreCount===14)spawnDebris(c);}else{h.score(100);const event=c.scoreCount;if(event>=1&&event<=3||event>=7)spawnChunks(c,3,event<=3?0:1,0,0,Math.floor((box[0]+hit.box[0])/2),Math.floor((box[1]+hit.box[1])/2));}
      }
      h.contact?.(!isProjectile,blocked);
      // 0x95bd6 -> 0x95910. NPCs allocate after the generic effect pass:
      // initialize next tick, then first draw the tick after initialization.
      const f=fxdata(),type=p.FBDEF&&f?.boxes[p.FBAN?.source+24*p.FBI]?.type;
      const selector=blocked?3:isProjectile?(f?.clashSelectors[type]??4):Math.max(0,Math.min(2,h.strength|0));
      if(f)c.sparks.push({selector,x:Math.floor((box[0]+hit.box[0])/2),y:Math.floor((box[1]+hit.box[1])/2),face:isProjectile?(p.FBVX>=0?1:0):p.FACE,index:0,timer:f.animations[selector].entries[0].ticks,pending:true,visible:false});
    }
  }
  return {init,before,check,regions,platform,distance,closeNormal,
  sceneOffset(B){const age=B.car?.collapseAge;return age!==null&&age>=2&&age<=62&&!(age&1)?3:0;},
  drawBackground(cx,B,image){const f=data()?.background;if(!f)return false;const im=image(f.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,f.x,f.y);return true;},
  drawEffects(cx,B,image){
    const f=fxdata();if(!f)return;
    for(const e of B.car?.sparks||[]){if(!e.visible)continue;const entry=f.animations[e.selector].entries[e.index],a=f.frames[entry.frame],im=image(a.img);if(!im.complete||!im.naturalWidth)continue;
      cx.save();if(e.face){cx.translate(e.x,200-e.y);cx.scale(-1,1);cx.drawImage(im,a.x,a.y);}else cx.drawImage(im,e.x+a.x,200-e.y+a.y);cx.restore();}
    const d=data()?.debris;if(d)for(const e of B.car?.debris||[]){if(!e.visible)continue;const entry=d.animations[e.animation].entries[e.index],frame=e.kind===7&&e.side===1?entry.frameAlt:entry.frame,a=d.frames[frame],im=image(a.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,(e.x>>8)+a.x,200-(e.y>>8)+a.y);}
  },
  draw(cx,car,bonus,image,shake=0){
    const paint=(state,dx=0)=>{const s=car.st[state];if(!s)return;const im=image(s.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,s.x+dx,s.y);};
    const final=bonus.car?.done&&data()?.finalUnderlay;
    if(final){const im=image(final.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,final.x,final.y);}else paint(9);
    const c=bonus.car,states=data()?.states;
    if(c&&states){const s=states[Math.min(15,c.left+c.right)],im=image(s.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,s.x+(c.dx||0),s.y+c.yOffset-(c.dy||0));}
    else if(bonus.dmg<9)paint(bonus.dmg,shake);
  }
  };
})();
