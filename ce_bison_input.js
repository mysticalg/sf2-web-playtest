/* CE Psycho Crusher input state machine, translated from 68000 0x434b2..0x435da.
   Original counters: actor+0x80 state, +0x81 charge, +0x82 release window,
   +0x83 button timer, +0x84 strength gate. The standard ROM configuration
   uses charge-table index0 (60 frames). This does not alter Scissor Kick. */
'use strict';
window.SF2BISONINPUT=(()=>{
  const charge=[60,35,12,1];
  const release=[8,9,8,10,8,11,8,9,8,10,8,11,8,12,8,13,8,14,8,15,8,9,8,10,8,11,8,12,8,9,8,10];
  const consume=p=>{if(p.CEBC)p.CEBC.state=0;};
  function edgeEvent(s,edges){
    if(!edges)return null;
    let strength=0;while(!(edges&(1<<strength)))strength++;
    return 2+2*strength<=s.gate?['cbf','P',strength]:null;
  }
  function step(p,dir,edges,randomIndex){
    const s=p.CEBC||(p.CEBC={state:0,charge:0,release:0,timer:0,gate:0});
    switch(s.state){
      case 0:s.state=2;s.charge=charge[0];return null;
      case 2:
        if(!(dir&2))s.charge=charge[0];
        else if(--s.charge===0)s.state=4;
        return null;
      case 4:
        if(!(dir&2)){s.state=6;s.release=release[randomIndex()&31];}
        return null;
      case 6:
        if(--s.release===0){s.state=0;return null;}
        // The ROM requires pure forward here, not down/up-forward.
        if(dir===1){s.state=8;s.timer=8;s.gate=6;return edgeEvent(s,edges);}
        return null;
      case 8:{
        const event=edgeEvent(s,edges);
        if(--s.timer===0){s.gate-=2;if(!s.gate)s.state=0;else s.timer=2;}
        return event;
      }
    }
    s.state=0;return null;
  }
  return {step,consume,source:0x434b2};
})();
