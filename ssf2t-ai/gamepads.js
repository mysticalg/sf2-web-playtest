// SPDX-License-Identifier: GPL-3.0-only
/* Standard browser pads, matching the main game's six-button layout. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SSF2TGamepads=api;})(typeof window==='undefined'?null:window,()=>{
 'use strict';
 const attacks=[2,3,5,0,1,7],pressed=(pad,n)=>!!pad.buttons?.[n]&&(pad.buttons[n].pressed||pad.buttons[n].value>0.5);
 function raw(pad){
  const x=Number(pad.axes?.[0])||0,y=Number(pad.axes?.[1])||0;let mask=0;
  if(pressed(pad,15)||x>0.4)mask|=1;if(pressed(pad,14)||x<-.4)mask|=2;
  if(pressed(pad,13)||y>0.4)mask|=4;if(pressed(pad,12)||y<-.4)mask|=8;
  attacks.forEach((button,i)=>{if(pressed(pad,button))mask|=16<<i;});
  if(pressed(pad,9))mask|=1024;if(pressed(pad,8))mask|=2048;return mask;
 }
 function create(){
  const slots=[null,null];let masks=[0,0];
  function reset(){slots.fill(null);masks=[0,0];}
  function read(pads,{paused=false,playing=false,playersIn=0,embedded=false}={}){
   const connected=new Map(Array.from(pads||[]).flatMap((p,i)=>p&&p.connected!==false?[[p.index??i,p]]:[]));
   for(let i=0;i<2;i++)if(slots[i]&&!connected.has(slots[i].index))slots[i]=null;
   for(const [index,pad]of connected)if(!slots.some(s=>s?.index===index)){
    const i=slots.indexOf(null);if(i<0)break;
    slots[i]={index,blocked:raw(pad),previous:0};
   }
   masks=[0,0];let togglePause=false,back=false;
   slots.forEach((slot,i)=>{
    if(!slot)return;const held=raw(connected.get(slot.index));slot.blocked&=held;
    const mask=held&~slot.blocked,edge=mask&~slot.previous;slot.previous=mask;
    if(edge&1024&&(paused||playing&&(playersIn&(1<<i))))togglePause=true;
    if(paused&&embedded&&edge&2048)back=true;
    masks[i]=paused?0:mask&~(playing&&(playersIn&(1<<i))?1024:0);
   });
   return{masks:masks.slice(),togglePause,back,connected:slots.map(s=>s?.index??null)};
  }
  return{read,reset,info:()=>({masks:masks.slice(),connected:slots.map(s=>s?.index??null)})};
 }
 return{create,raw};
});
