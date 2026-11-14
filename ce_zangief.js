/* CE Double Lariat: original 0x424ec..0x4256c. The 60-frame
   counter and absolute left/right movement are independent of facing. */
'use strict';
(()=>{
  const prior=window.SF2CESPECIALS;
  window.SF2CESPECIALS={
    init(p,m,h){
      if(p.fid!==6||m.inp!=='ppp')return prior.init(p,m,h);
      p.CES={kind:'lariat',move:m,time:60};
      // The initialization frame sets the animation without advancing it.
      p.acc=-1;return true;
    },
    step(p,h){
      const c=p.CES;
      if(!c||c.kind!=='lariat')return prior.step(p,h);
      if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
      // 0x4254c tests the two absolute direction bits separately.
      p.X+=((p.KEYS&2?1:0)-(p.KEYS&1?1:0))*0x140;
      if(--c.time===0){p.CES=null;h.idle(p);}
      return true;
    }
  };
})();
