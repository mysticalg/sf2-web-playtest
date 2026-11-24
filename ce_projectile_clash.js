/* Original CE projectile-vs-projectile boxes and type-0x20 disappearance effects.
 * 0x9523a/0x96190/0x961b6, 0x3194c/0x323c2, 0x28dc6/0x28e6a.
 * Called only by CE core hooks. WW and custom unbound projectiles are untouched.
 */
(()=>{'use strict';
  const data=window.SF2CECLASHDATA;if(!data)return;
  const images=data.frames.map(f=>{const i=new Image();i.src=f.img;return i;});
  const effects=[];
  const source=p=>p.FBAN?.source+24*p.FBI;
  function record(p){return p.FBDEF&&data.boxes[source(p)]||null;}
  function box(p){
    const r=record(p);if(!r?.box)return null;
    const [x,y,w,h]=r.box;
    return [(p.FBX>>8)+(p.FBVX>0?-x:x),(p.FBY>>8)+y,w,h];
  }
  function overlap(a,b){return !!(a&&b&&Math.abs(a[0]-b[0])<=a[2]+b[2]&&Math.abs(a[1]-b[1])<=a[3]+b[3]);}
  function spawn(p,h,point){
    const r=record(p),selector=r&&data.clashSelectors[r.type];if(selector===undefined)return;
    const offset=data.randomOffsets[(h.rand()&12)>>2],animation=data.animations[selector];
    effects.push({selector,x:(point?point[0]:p.FBX>>8)+offset[0],y:(point?point[1]:p.FBY>>8)+offset[1],face:p.FBVX>0?1:0,index:0,timer:animation.entries[0].ticks,born:h.tick,visible:false});
  }
  // 0x951204 -> 0x958c0: hit and block both create this burst. The core
  // supplies the 0x95a60 midpoint of the pre-reaction attack/hurt centres.
  function bodyImpact(p,point,h){if(!Array.isArray(point)||point.length<2)return;spawn(p,h,point);}
  // AI fighter contacts use the original strength-sized burst scripts (0..2).
  // The first frame is visible during hitstop, before animation resumes.
  function contactImpact({x,y,face,strength,blocked,tick}){
    const selector=Math.max(0,Math.min(2,strength|0)),animation=data.animations[selector];
    effects.push({selector,x,y,face,index:0,timer:animation.entries[0].ticks,born:tick,visible:true,contact:true,blocked});
  }
  function beforeAdvance(p,h){
    if(!record(p))return false;
    if(p.FBCLASH){
      if(p.FBCLASH===1){p.FBCLASH=2;spawn(p,h);}
      else{p.FBON=0;delete p.FBCLASH;}
      return true;
    }
    if(!((h.tick+(p.FBSLOT||0))&1)){
      if(h.body)h.body(p);
      return !!p.FBIMPACT||!p.FBON;
    }
    const o=p.opp;
    if(!o?.FBON||o.FBINIT||o.FBIMPACT||o.FBCLASH||!record(o))return false;
    if(!overlap(box(p),box(o)))return false;
    // The other pool slot processes this mark on its own turn, possibly next frame.
    p.FBCLASH=2;o.FBCLASH=1;spawn(p,h);return true;
  }
  function stepEffects(h){
    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];if(e.contact||e.born===h.tick)continue;
      const animation=data.animations[e.selector];
      if(--e.timer===0){e.index++;const entry=animation.entries[e.index];if(!entry||entry.terminal){effects.splice(i,1);continue;}e.timer=entry.ticks;}
      e.visible=true;
    }
  }
  // Contact flashes run on visual ticks, including hitstop. Projectile effects
  // retain the original simulation scheduling above.
  function stepContactEffects(tick){
    for(let i=effects.length-1;i>=0;i--){const e=effects[i];if(!e.contact)continue;
      let age=tick-e.born,index=0;const entries=data.animations[e.selector].entries;
      while(entries[index]&&!entries[index].terminal&&age>=entries[index].ticks){age-=entries[index].ticks;index++;}
      if(!entries[index]||entries[index].terminal){effects.splice(i,1);continue;}
      e.index=index;e.timer=entries[index].ticks-age;e.visible=true;
    }
  }
  function drawEffects(cx,ground,camera,h={}){
    for(const e of effects){
      if(!e.visible)continue;const entry=data.animations[e.selector].entries[e.index],f=data.frames[entry.frame],im=e.contact&&!e.blocked&&h.contactImage?h.contactImage(entry.frame):images[entry.frame];
      if(!im.complete||!im.naturalWidth)continue;
      const image=h.image?h.image(im,'object'):im;if(!image)continue;
      const x=e.x-camera,y=ground-e.y;cx.save();
      if(e.face){cx.translate(x,y);cx.scale(-1,1);cx.drawImage(image,f.x,f.y);}
      else cx.drawImage(image,x+f.x,y+f.y);
      cx.restore();
    }
  }
  function reset(players=[]){effects.length=0;for(const p of players)delete p.FBCLASH;}
  window.SF2CEPROJECTILES={box,overlap,record,beforeAdvance,bodyImpact,contactImpact,stepEffects,stepContactEffects,drawEffects,reset,
    ready:Promise.all(images.map(i=>i.decode())),get effects(){return effects;},data};
})();
