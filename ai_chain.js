/* AI Edition six-button hit-confirm chains. No original WW/CE hooks. */
'use strict';
window.SF2AICHAIN=(()=>{
 const ALL=63,ATTACK=1008;
 function state(p){return p.AIChain??={used:0,cycles:0,confirmed:-1,marked:-1,raw:0,queued:null,cancels:0};}
 function reset(p){const s=state(p);s.used=0;s.cycles=0;s.confirmed=s.marked=-1;s.queued=null;s.special=null;}
 function button(p){for(const base of[8,14,47,53,59])if(p.cur>=base&&p.cur<base+6)return p.cur-base;const m=p.anim?.name?.match(/([LMH])([PK])$/);return m?'LMH'.indexOf(m[1])+(m[2]==='K'?3:0):-1;}
 function contact(p,blocked,tick=0){const s=state(p),b=button(p);if(blocked){s.confirmed=-1;s.queued=null;return;}if(b<0||s.marked===p.AIAttackSerial)return;s.marked=s.confirmed=p.AIAttackSerial;s.confirmedAt=tick;s.used|=1<<b;if(s.used===ALL){s.used=0;s.cycles++;}}
 function sample(p,keys,tick){const s=state(p),raw=keys&ATTACK,pressed=raw&~s.raw;s.raw=raw;if(s.queued&&tick-s.queued.tick>40)s.queued=null;if(p.ST!==1||p.Y!==0||s.confirmed!==p.AIAttackSerial){s.queued=null;return;}if(raw&&(raw&(raw-1))){s.queued=null;return;}if(!pressed)return;const b=Math.log2(pressed)-4;if(!Number.isInteger(b)||b<0||b>5||s.used&(1<<b))return;s.queued={button:b,crouch:!!(keys&8),tick,serial:p.AIAttackSerial};}
 function take(p,tick,special){const s=state(p),q=s.queued;if(special){s.queued=null;return -1;}if(!q||q.serial!==p.AIAttackSerial||s.confirmed!==p.AIAttackSerial||s.used&(1<<q.button)||p.ST!==1||p.Y!==0)return -1;s.cancelCrouch=q.crouch;s.queued=null;s.confirmed=-1;s.cancels++;return q.button;}
 const BREAK_WINDOW=8;
 function armBreaker(p,tick){p.AIComboBreaker={opened:tick,request:null};}
 function breakerWindow(p,tick){return !!(p.AIComboBreaker&&tick-p.AIComboBreaker.opened>0&&tick-p.AIComboBreaker.opened<=BREAK_WINDOW&&p.HP>0&&[5,7].includes(p.ST));}
 function sampleBreaker(p,keys,tick,mapping){
  const h=p.AIBreakInput??={raw:0,dir:0,directions:[],times:{},back:0,down:0,backReady:-999,downReady:-999,presses:[]},raw=keys&ATTACK,pressed=raw&~h.raw;h.raw=raw;
  const dir=(keys&12)|((keys&3)===(p.FACE?2:1)?1:(keys&3)===(p.FACE?1:2)?2:0);
  if(dir!==h.dir){h.directions.push({dir,tick});h.dir=dir;}h.directions=h.directions.filter(d=>tick-d.tick<=30).slice(-12);
  h.back=dir&2?h.back+1:0;h.down=dir&8?h.down+1:0;if(h.back>=40)h.backReady=tick;if(h.down>=40)h.downReady=tick;
  for(let bit=16;bit<=512;bit<<=1)if(pressed&bit){h.times[bit]=tick;h.presses.push({bit,tick});}h.presses=h.presses.filter(b=>tick-b.tick<=30);
  const breaking=breakerWindow(p,tick),chaining=p.ST===1&&p.Y===0&&p.AIChain?.confirmed===p.AIAttackSerial,target=breaking?p.AIComboBreaker:chaining?p.AIChain:null,key=breaking?'request':'special',opened=breaking?p.AIComboBreaker.opened:p.AIChain?.confirmedAt;if(!target||!pressed||target[key])return;
  const chord=mapping.find(m=>!m.command&&raw===m.mask&&[...Array(6).keys()].filter(b=>m.mask&(16<<b)).every(b=>tick-(h.times[16<<b]??-999)<=2&&h.times[16<<b]>opened));
  if(chord){target[key]={index:chord.index,strength:chord.strength};return;}
  if(raw&(raw-1))return;const b=Math.log2(pressed)-4;if(!Number.isInteger(b)||b<0||b>5)return;const family=b<3?'P':'K',strength=b%3;
  const matches=seq=>{const tail=h.directions.filter(d=>d.dir!==0).slice(-seq.length);return tail.length===seq.length&&tail.every((d,i)=>d.dir===seq[i])&&tick-tail[0].tick<=24&&tick-tail[tail.length-1].tick<=12;};
  const sequences={qcf:[8,9,1],qcb:[8,10,2],dp:[1,8,9],hcf:[2,10,8,9,1]};
  const index=p.F.moves.findIndex(m=>m.btn===family&&(sequences[m.inp]?matches(sequences[m.inp]):m.inp==='cbf'?!!(dir&1)&&tick-h.backReady<=12:m.inp==='cdu'?!!(dir&4)&&tick-h.downReady<=12:m.inp==='mash'?(breaking||!chaining||!!(p.AIChain.used&(1<<b)))&&h.presses.filter(x=>(x.bit<128?'P':'K')===family).length>=3:false));
  if(index>=0)target[key]={index,strength};
 }
 return{state,reset,contact,sample,take,button,BREAK_WINDOW,armBreaker,breakerWindow,sampleBreaker};
})();
