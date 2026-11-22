/* CE Dhalsim42d86 slide phases and original descriptor durations.
   Existing Bison43c44..43cc8/3200 behavior is retained below.
   Collision, stop admission and37faa shared air transition remain port-owned. */
'use strict';
// Original status46 slide descriptors; no generated frames or hit data.
const DHSLIDE={"500844":[4,4,3,4,4],"500968":[4,4,3,20,4],"500620":[1,1,3,4,4]};
window.SF2CENORMALS={
  step(p,h){
    if(p.fid===7&&p.ST===1&&[17,18,19].includes(p.cur)){
      let c=p.NSL;
      if(!c||c.anim!==p.anim){
        const durations=DHSLIDE[p.anim.source];if(!durations){p.NSL=null;return;}
        const original=p.anim;p.anim={...original,ents:original.ents.map((e,i)=>{const q=e.slice();q[1]=durations[i];return q;})};
        c=p.NSL={phase:2,vx:(10+2*(p.cur-17))*65536,ax:-65536,anim:p.anim};p.acc=0;return true;
      }
      const flag=p.anim.flags[p.aidx];
      if(c.phase===2){if(flag&255)c.phase=4;h.tick(p);return true;}
      if(c.phase===4){p.X+=(p.FACE?1:-1)*(c.vx>>8);c.vx+=c.ax;if(c.vx<0)c.phase=6;return true;}
      if(c.phase===6){if(flag&0x8000){p.NSL=null;h.slideFinish(p);}else h.tick(p);return true;}
      throw Error('Dhalsim slide phase '+c.phase);
    }

    if(p.fid!==8||p.ST!==1||p.cur!==19){p.NSL=null;return;}
    let c=p.NSL;
    if(!c||c.anim!==p.anim){
      const original=p.anim,durations=[6,8,16,3];p.acc=-1;
      p.anim={...original,ents:original.ents.map((e,i)=>{const q=e.slice();q[1]=durations[i];return q;})};
      c=p.NSL={phase:0,vx:(p.FACE?1:-1)*0xe00,ax:(p.FACE?1:-1)*0x80,anim:p.anim};
    }
    const flag=p.anim.flags[p.aidx];
    if(c.phase===0){if(flag&255)c.phase=1;return;}
    if(c.phase===1){
      const before=c.vx;c.vx-=c.ax;if((before>=0)!==(c.vx>=0)||!c.vx)c.vx=0;
      p.X+=c.vx;
      if(c.vx===0){c.phase=2;p.aidx++;p.acc=-1;p.hitdone=0;}else p.acc--;
      return;
    }
    if(flag&0x8000){p.NSL=null;h.finish(p);}
  }
};
