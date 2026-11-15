/* Original CE result-announcer object0x48,0x2d8c2..0x2d912.
   Delay is actor logic time, not the queued68000->Z80 latch spacing. */
'use strict';
(()=>{
 function init(selector,{special9d4=false}={}){
  if(!Number.isInteger(selector)||selector<0||selector>13)throw new RangeError('Native result selector must be0..13');
  return {selector,phase:0,timer:special9d4?22:10};
 }
 function step(state){
  if(!state||state.phase===2)return [];
  if(state.phase===0){state.phase=1;return [0x52];}
  if(--state.timer>0)return [];
  state.phase=2;return [state.selector===13?0x54:0x53];
 }
 window.SF2CEANNOUNCER={init,step,source:{object:0x48,fsm:0x2d8c2,create:0x8c68,normalDelay:10,specialDelay:22}};
})();
