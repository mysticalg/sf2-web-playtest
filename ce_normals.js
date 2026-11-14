/* CE Bison crouching HK, 0x43c44..0x43cc8; motion helper 0x3200.
   The active pose is held until 8.8 horizontal velocity decays to zero. */
'use strict';
window.SF2CENORMALS={
  step(p,h){
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
