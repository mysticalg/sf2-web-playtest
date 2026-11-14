/* Bison Psycho Crusher: literal state transitions from CE 0x43cf2..0x43e10.
   Physics is 0x2346 (8.8 acceleration first). The flight counter reads use
   the program's original four-byte stride at 0x43d98: 32, 36, 62 frames. */
'use strict';
(()=>{
  const prior=window.SF2CESPECIALS,hold=p=>{p.acc--;};
  function anim(p,c,key,h){h.anim(p,c[key],0);p.acc=-1;}
  function move(p,c){c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;}
  window.SF2CESPECIALS={
    init(p,m,h){
      if(p.fid!==8||m.inp!=='cbf'||m.btn!=='P')return prior.init(p,m,h);
      const s=p.SPSTR,start=h.find(p,'crush'+s+'s'),rise=h.find(p,'crush'+s+'r'),flight=h.find(p,'crush'+s+'f');
      if(start<0||rise<0||flight<0||!p.F.anims[start].flags)return prior.init(p,m,h);
      const c=p.CES={kind:'crusher',move:m,phase:0,start,rise,flight,vx:(p.FACE?1:-1)*[0x500,0x700,0x900][s],vy:0,ay:0,time:[32,36,62][s]};
      anim(p,c,'start',h);return true;
    },
    step(p,h){
      const c=p.CES;
      if(!c||c.kind!=='crusher')return prior.step(p,h);
      if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
      const flags=p.anim.flags[p.aidx];
      if(c.phase===0){c.phase=1;hold(p);return true;} // original sound-only state
      if(c.phase===1){
        if(flags&0x8000){c.phase=2;c.vy=0x400;c.ay=0xc0;anim(p,c,'rise',h);}
        return true;
      }
      if(c.phase===2){
        if(c.vy<0){c.phase=3;c.vy=c.ay=0;anim(p,c,'flight',h);}
        else{move(p,c);hold(p);}return true;
      }
      if(c.phase===3){
        if(--c.time===0||h.wall&&h.wall(p)){c.phase=4;c.ay=0xc0;anim(p,c,'rise',h);}
        move(p,c);return true;
      }
      if(c.phase===4){
        if(p.Y<0){p.Y&=255;c.phase=5;}else{move(p,c);hold(p);}return true;
      }
      if(c.phase===5){
        if(flags&0x8000){p.CES=null;h.idle(p);}return true;
      }
      return false;
    }
  };
})();
