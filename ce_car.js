/* Original CE car composition: scroll1 holds the static wreck/chassis/wheels;
   damage-state objects cover it. tools/ce_car_art.py verifies the intact
   composition pixel-for-pixel against the native VRAM capture. */
'use strict';
window.SF2CECAR=(()=>{
  const hpTable=[3,5,4,5,3,4,5,4,4,4,5,3,4,3,5,3];
  const scores=[500,500,500,1000,1000,1000,1000,1000,1000,2000,2000,3000,3000,3000,3000];
  const data=()=>window.SF2CECARDATA;
  const hp=rand=>hpTable[rand()&15];
  // Native FX32 suspension/impact impulses, measured in original world pixels.
  const mount=[[0,0,-1],[4,0,-1],[8,0,-1],[12,0,1]],unmount=[[0,0,1],[4,0,1]];
  const impact=[[0,1,-1],[2,1,-1],[5,0,2],[9,-1,-1],[14,-1,1]];
  function impulse(c,steps,sign=1){c.effects.push({age:0,steps,sign});}
  function init(B,p,rand,image){
    B.car={phase:0,a:0,b:0,left:0,right:0,health:[hp(rand),hp(rand),0],heroStop:0,done:false,finishReported:false,scoreCount:0,hits:0,clanks:0,yOffset:0,dx:0,dy:0,effects:[],supported:false};
    if(p){p.X=p.X0=96<<8;p.Y=0;}if(image)for(const s of data()?.states||[])image(s.img);sync(B);return B.car;
  }
  function sync(B){const c=B.car;B.fr=Math.min(4,c.left*2);B.rr=c.phase===2||c.right>=3?4:0;B.dmg=c.done?9:Math.min(8,c.left+c.right);}
  function before(B,p,rand){
    const c=B.car||init(B,p,rand),reset=i=>{c.health[i]=hp(rand);};
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
        if(c.a<18){c.a+=2;c.left++;reset(0);if(c.left===15)c.done=true;} // 0x349ce: native bonus-complete flag.
        else{c.a=20;c.done=true;c.yOffset=24;}
      }
    }
    sync(B);const frozen=c.heroStop>0;if(frozen)c.heroStop--;return frozen;
  }
  function regions(B){
    const c=B.car;if(!c)return [];
    const index=Math.min(15,c.left+c.right),refs=data()?.states[index]?.hurt||(index<6?[1,2,0]:[3,0,0]);
    const boxes=data()?.boxes||[[0,0,0,0],[-56,72,22,25],[56,72,22,25],[0,33,61,22]];
    return refs.map((ref,pool)=>ref?{pool,box:[192+(c.dx||0)+boxes[ref][0],boxes[ref][1]+(c.dy||0)-c.yOffset,boxes[ref][2],boxes[ref][3]]}:null).filter(Boolean);
  }
  function overlap(a,b){return Math.abs(a[0]-b[0])<=a[2]+b[2]&&Math.abs(a[1]-b[1])<=a[3]+b[3];}
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
        if(c.health[hit.pool]<0){c.scoreCount=Math.min(14,c.scoreCount+1);h.score(scores[c.scoreCount]);}else h.score(100);
      }
      // CE0x95a60 averages attack and selected target centres, including clanks.
      B.fx.push({x:Math.floor((box[0]+hit.box[0])/2),y:200-Math.floor((box[1]+hit.box[1])/2),t:0});
    }
  }
  return {init,before,check,regions,platform,
  draw(cx,car,bonus,image,shake=0){
    const paint=(state,dx=0)=>{const s=car.st[state];if(!s)return;const im=image(s.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,s.x+dx,s.y);};
    paint(9);
    const c=bonus.car,states=data()?.states;
    if(c&&states){const s=states[Math.min(15,c.left+c.right)],im=image(s.img);if(im.complete&&im.naturalWidth)cx.drawImage(im,s.x+(c.dx||0),s.y+c.yOffset-(c.dy||0));}
    else if(bonus.dmg<9)paint(bonus.dmg,shake);
  }
  };
})();
