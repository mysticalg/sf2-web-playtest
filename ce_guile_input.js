/* CE Guile charge recognition: 68000 0x3f846..0x3fb50.
   Intro actors run recognition; move admission remains in the fighter controller. */
'use strict';
window.SF2CEGUILEINPUT=(()=>{
 const release=[8,9,8,10,8,11,8,9,8,10,8,11,8,12,8,13,8,14,8,15,8,9,8,10,8,11,8,12,8,9,8,10];
 function channel(s,held,finish,edges,random){
  const event=()=>{if(!edges)return null;let strength=0;while(!(edges&(1<<strength)))strength++;return 2+2*strength<=s.gate?strength:null;};
  switch(s.state){
   case 0:Object.assign(s,{state:2,charge:60,release:0,timer:0,gate:0});return null;
   case 2:if(!held)s.charge=60;else if(!--s.charge)s.state=4;return null;
   case 4:if(!held){s.state=6;s.release=release[random()&31];}return null;
   case 6:if(!--s.release){s.state=0;return null;}if(finish){s.state=8;s.timer=8;s.gate=6;return event();}return null;
   case 8:{const e=event();if(!--s.timer){s.gate-=2;if(!s.gate)s.state=0;else s.timer=2;}return e;}
  }
  s.state=0;return null;
 }
 function step(p,dir,edges,random){
  const c=p.CEGI||(p.CEGI={back:{state:0},down:{state:0}}),out=[];
  const a=channel(c.back,!!(dir&2),dir===1,(edges>>4)&7,random);
  const b=channel(c.down,!!(dir&8),!!(dir&4),(edges>>7)&7,random);
  if(a!==null)out.push(['cbf','P',a]);if(b!==null)out.push(['cdu','K',b]);return out;
 }
 function consume(p,move){if(p.CEGI)p.CEGI[move.inp==='cbf'?'back':'down'].state=0;}
 return{step,consume,source:0x3f846};
})();
