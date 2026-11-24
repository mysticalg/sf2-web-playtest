/* AI Edition six-button hit-confirm chains. No original WW/CE hooks. */
'use strict';
window.SF2AICHAIN=(()=>{
 const ALL=63,ATTACK=1008;
 function state(p){return p.AIChain??={used:0,cycles:0,confirmed:-1,marked:-1,raw:0,queued:null,cancels:0};}
 function reset(p){const s=state(p);s.used=0;s.cycles=0;s.confirmed=s.marked=-1;s.queued=null;}
 function button(p){for(const base of[8,14,47,53,59])if(p.cur>=base&&p.cur<base+6)return p.cur-base;const m=p.anim?.name?.match(/([LMH])([PK])$/);return m?'LMH'.indexOf(m[1])+(m[2]==='K'?3:0):-1;}
 function contact(p,blocked){const s=state(p),b=button(p);if(blocked){s.confirmed=-1;s.queued=null;return;}if(b<0||s.marked===p.AIAttackSerial)return;s.marked=s.confirmed=p.AIAttackSerial;s.used|=1<<b;if(s.used===ALL){s.used=0;s.cycles++;}}
 function sample(p,keys,tick){const s=state(p),raw=keys&ATTACK,pressed=raw&~s.raw;s.raw=raw;if(s.queued&&tick-s.queued.tick>40)s.queued=null;if(p.ST!==1||p.Y!==0||s.confirmed!==p.AIAttackSerial){s.queued=null;return;}if(raw&&(raw&(raw-1))){s.queued=null;return;}if(!pressed)return;const b=Math.log2(pressed)-4;if(!Number.isInteger(b)||b<0||b>5||s.used&(1<<b))return;s.queued={button:b,crouch:!!(keys&8),tick,serial:p.AIAttackSerial};}
 function take(p,tick,special){const s=state(p),q=s.queued;if(special){s.queued=null;return -1;}if(!q||q.serial!==p.AIAttackSerial||s.confirmed!==p.AIAttackSerial||s.used&(1<<q.button)||p.ST!==1||p.Y!==0)return -1;s.cancelCrouch=q.crouch;s.queued=null;s.confirmed=-1;s.cancels++;return q.button;}
 return{state,reset,contact,sample,take,button};
})();
