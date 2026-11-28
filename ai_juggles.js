/* Shared AI battle air-combo physics. Positions/velocities are pixels/tick;
 * callers retain damage, animation, hitstop, collision and recovery ownership. */
'use strict';
((root)=>{
 const defaults=Object.freeze({launchUp:8,launchBack:3,bounceUp:6.5,bounceBack:3.5,gravity:.375,maxUp:8,maxBack:4.5,ceiling:192});
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function contact(previous,event={},settings={}){
  const c={...defaults,...settings};
  if(!event.accepted||event.blocked||!(event.damage>0)||event.held||event.dead||event.finisher)return null;
  const airborne=!!previous||event.airborne||event.y>0;
  if(!airborne&&!event.heavyKick)return null;
  if(previous&&event.serial!==undefined&&event.serial===previous.serial)return previous;
  const y=Math.max(0,event.y||0),direction=event.direction<0?-1:1,up=airborne?c.bounceUp:c.launchUp;
  // Bound the next apex with velocity, leaving the physical position untouched.
  const room=Math.max(0,c.ceiling-y),ceilingVelocity=Math.sqrt(2*c.gravity*room);
  return{vx:direction*clamp(airborne?c.bounceBack:c.launchBack,0,c.maxBack),vy:clamp(Math.min(up,ceilingVelocity),c.gravity,c.maxUp),gravity:c.gravity,age:previous?.age||0,contactAge:0,hits:(previous?.hits||0)+1,serial:event.serial,direction,launched:!airborne};
 }
 function step(state,position={},options={}){
  if(!state)return null;const x=Number(position.x)||0,y=Math.max(0,Number(position.y)||0);
  if(options.paused)return{x,y,vx:state.vx,vy:state.vy,landed:false,paused:true};
  state.age++;state.contactAge++;state.vy-=state.gravity;let nextX=x+state.vx,nextY=y+state.vy;
  if(Number.isFinite(options.left)&&nextX<options.left){nextX=options.left;state.vx=0;}
  if(Number.isFinite(options.right)&&nextX>options.right){nextX=options.right;state.vx=0;}
  const landed=nextY<=0&&state.vy<=0;if(landed){nextY=0;state.vx=state.vy=0;}
  return{x:nextX,y:Math.max(0,nextY),vx:state.vx,vy:state.vy,landed,paused:false};
 }
 const api=Object.freeze({defaults,contact,step});root.SF2AIJuggles=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
