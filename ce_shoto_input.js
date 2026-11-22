/* Original CE human shoto recognizers: 0x3da40, 0x3dac6..0x3dcbe.
   This corrects command phases/admission; shared RNG lifecycle remains separate. */
'use strict';
window.SF2CESHOTOINPUT=(()=>{
 const channels=[{slot:2,name:'qcb',button:'K',shift:7,sequence:[8,10,2]},
  {slot:0,name:'dp',button:'P',shift:4,sequence:[1,8,9]},
  {slot:1,name:'qcf',button:'P',shift:4,sequence:[8,9,1]}];
 function step(p,dir,pressed,released,randomWindow,admit){
  const edges=pressed|released;let pending=null;
  for(const c of channels){
   let [phase,timer]=p.MSEQ[c.slot],event=null;
   const buttons=(edges>>c.shift)&7;
   if(!phase){if(dir===c.sequence[0]){phase=1;timer=randomWindow();}}
   else if(!--timer)phase=0;
   else if(phase===1){if(dir===c.sequence[1]){phase=2;timer=randomWindow();}}
   else if(phase===3||phase===2&&dir===c.sequence[2]){
    if(buttons){
     let strength=0;while(!(buttons&(1<<strength)))strength++;
     // State4 tests the existing random window. State6 already owns its12 timer.
     if(timer<=2*strength)phase=0;
     else event=[c.name,c.button,strength];
    }else if(phase===2){phase=3;timer=12;}
   }
   p.MSEQ[c.slot]=[phase,timer];
   // Native3dcbe clears the accepted flag, not the recognizer phase/timer.
   // Its branch also skips all subsequent channels on this actor update.
   if(event){if(admit(c.name))return[event];pending??=event;}
  }
  // Keep the existing controller's recovery-event route alive. Its one-frame
  // EVB bridge is still a port approximation, not the full native169/16d latch.
  return pending?[pending]:[];
 }
 return{step,source:0x3da40};
})();
