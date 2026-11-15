/* CE special-motion translations. ROM addresses are from s92e_23b/s92_22b.
   Original actor motion is retained: uppercuts use 16.16 add-then-accelerate;
   Flash Kick/Tiger Knee use the 8.8 subtract-acceleration-then-move routine.
   Animation flags control launch, in-air holds and landing recovery. */
'use strict';
window.SF2CESPECIALS=(()=>{
  const flag=p=>p.anim.flags[p.aidx], hold=p=>{p.acc--;};
  const UPPER={
    0:{vx:[0x40000,0x60000,0x80000],vy:[0x50000,0x70000,0x90000]}, // 0x3ddee..0x3de12
    4:{vx:[0x40000,0x80000,0xb0000],vy:[0x50000,0x70000,0x90000]}, // 0x3de1e..0x3de42
    9:{vx:[0x40000,0x60000,0x80000],vy:[0x50000,0x70000,0x90000]}  // 0x44a84..0x44aa2
  };
  function init(p,m,h){
    p.CES=null;
    if(!p.anim.flags)return false;
    const s=p.SPSTR;
    if(m.inp==='dp'&&m.kind==='rise'&&UPPER[p.fid]){
      const t=UPPER[p.fid];p.CES={kind:'upper',phase:0,vx:t.vx[s],vy:t.vy[s]};
      // Init jumps directly to the animation setter, without 0x22d8 this frame.
      p.acc=-1;return true;
    }
    if(p.fid===3&&m.inp==='cdu'&&m.kind==='rise'){
      p.CES={kind:'flash',phase:0,vx:0x180,vy:[0x800,0x900,0xa00][s],ay:0x60}; // 0x406c6
      return true;
    }
    if(p.fid===9&&m.inp==='qcfu'&&m.btn==='K'){
      const a=h.find(p,'knee'+s),fall=h.find(p,'kneefall');if(a<0||fall<0)return false;
      p.CES={kind:'knee',phase:0,vx:[0x900,0x880,0x800][s],vy:[0xb00,0xc00,0xd00][s],ay:0x1a0,fall}; // 0x448fc
      h.anim(p,a,0);p.acc=-1;return true;
    }
    return false;
  }
  function land(p,c,h){p.Y&=255;c.phase=3;h.land(p);}
  function finish(p,c,h){
    // 0x3deec / 0x40716 / 0x4498c: last-entry flag, then neutral next frame.
    if(c.phase===4){p.CES=null;h.idle(p);return;}
    if(flag(p)&0x8000){c.phase=4;hold(p);}
  }
  function step(p,h){
    const c=p.CES;if(!c)return false;
    const m=p.MV;if(!m||c.kind==='upper'&&m.inp!=='dp'||c.kind==='flash'&&m.inp!=='cdu'||c.kind==='knee'&&m.inp!=='qcfu'){p.CES=null;return false;}
    if(c.phase>=3){finish(p,c,h);return true;}
    const f=flag(p)&255,dir=p.FACE?1:-1;
    if(c.kind==='upper'){
      // 0x3de62 / 0x44ab6 waits for the ROM animation's launch marker.
      if(c.phase===0){if(f===0)c.phase=1;return true;}
      if(c.phase===1){
        // The original spends one transition frame here without moving.
        if(c.vx<0){c.phase=2;return true;}
        p.Y+=c.vy>>8;c.vy-=0x6000;p.X+=dir*(c.vx>>8);c.vx-=0x8000;return true;
      }
      p.Y+=c.vy>>8;c.vy-=0x6000;
      if(c.vy<0&&p.Y<0)land(p,c,h);
      else if(f!==0)hold(p);
      return true;
    }
    if(c.kind==='flash'){
      // 0x406d8: unlike uppercuts, the nonzero marker releases the jump.
      if(c.phase===0){if(f!==0)c.phase=1;return true;}
      c.vy-=c.ay;p.X+=dir*c.vx;p.Y+=c.vy; // 0x2346
      if(c.vy<0){if(p.Y<0)land(p,c,h);else if(f!==0)hold(p);}
      return true;
    }
    if(c.kind==='knee'){
      if(c.phase===0){if(f===0)c.phase=1;return true;}
      c.vy-=c.ay;p.X+=dir*c.vx;p.Y+=c.vy; // 0x44928 / 0x44964
      if(c.phase===1){
        if(c.vy<0){c.phase=2;c.vx=0x100;c.vy=0;c.ay=0x60;h.anim(p,c.fall,0);p.acc=-1;}
      }else if(p.Y<0)land(p,c,h);
      else if(f!==0)hold(p);
      return true;
    }
    return false;
  }
  return {init,step};
})();
