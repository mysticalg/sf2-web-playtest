/* CE Vega: original 0x45bd8 crouching HK and 0x45cee Crystal Flash.
   8.8 motion uses 0x2346: subtract acceleration, then add velocity.
   Original animation flags, rather than guessed timers, release each phase. */
'use strict';
(()=>{
 const prior=window.SF2CESPECIALS;
 // BEGIN ORIGINAL VEGA COMBAT DATA
 const COMBAT={"records":{"582328":[186,70,42,16,74,1,54,0,0,1,1,0],"582452":[182,70,47,16,67,1,54,0,1,4,4,0],"582576":[177,52,52,7,70,1,54,0,2,4,4,0],"582724":[159,54,56,7,74,1,54,0,0,1,1,0],"582920":[156,54,58,7,67,1,54,0,1,4,4,0],"583116":[152,54,62,7,70,1,54,0,2,4,4,0],"583336":[215,8,34,8,0,1,43,0,0,1,2,0],"583508":[211,8,38,8,2,1,44,0,1,1,2,0],"583656":[204,8,44,8,4,1,45,1,2,1,2,0],"585304":[241,32,17,18,138,20,42,3,2,1,1,20],"585376":[241,32,17,18,138,20,42,3,2,1,1,20],"585448":[158,63,58,20,205,1,54,3,2,3,5,20],"584664":[208,41,24,17,4,1,45,2,2,1,2,0],"584320":[227,57,15,13,0,1,43,2,0,1,2,0],"584492":[220,50,18,15,2,1,44,2,1,1,2,0],"583804":[230,67,32,11,1,1,43,2,0,1,2,0],"583976":[222,67,39,11,3,1,44,2,1,1,2,0],"584148":[218,61,44,16,5,1,45,2,2,1,2,0],"587200":[13,40,86,18,201,1,54,3,2,3,3,38],"585036":[241,32,17,18,138,20,42,3,2,1,1,20],"585108":[241,32,17,18,138,20,42,3,2,1,1,20],"585180":[158,63,58,20,205,1,54,3,2,9,7,20],"585572":[241,32,17,18,138,20,42,3,2,1,1,20],"585644":[241,32,17,18,138,20,42,3,2,1,1,20],"585716":[158,63,58,20,206,1,54,3,2,3,5,20],"586704":[13,40,86,18,200,1,54,3,2,3,3,38],"586828":[13,40,86,18,201,1,54,3,2,3,3,38],"586952":[13,40,86,18,203,1,54,3,2,3,3,38],"587076":[13,40,86,18,200,1,54,3,2,3,3,38],"587324":[13,40,86,18,203,1,54,3,2,3,3,38]},"cageChoices":[0,1,2,3,4,5,6,7,8,9,10,11,0,1,2,3,4,5,6,7,8,9,10,11,0,1,2,3,4,5,6,7],"cageOffsets":[[-80,112],[-80,88],[-80,64],[-80,40],[80,112],[80,88],[80,64],[80,40],[0,112],[0,88],[0,64],[0,40]],"grabTargets":[[29,53],[28,53],[30,53],[30,53],[29,53],[25,53],[45,53],[35,53],[28,53],[32,53],[27,53],[28,53]],"izunaRows":[[[52,16,32,0],[-40,80,32,9],[-114,-21,0,19],[51,7,32,0],[-12,63,32,8],[-61,-20,0,19],[-50,-26,0,19]],[[56,10,32,0],[-15,72,32,9],[-56,-8,32,8],[56,10,32,0],[-5,68,32,9],[-18,-8,32,8],[-6,-12,32,8]],[[44,5,32,0],[-32,48,32,10],[-110,-29,0,19],[44,5,32,0],[-9,49,32,10],[-64,-36,0,19],[-51,-38,0,19]],[[42,4,32,0],[-27,75,32,10],[-99,-25,0,18],[42,4,32,0],[-19,71,32,10],[-59,-28,0,18],[-45,-34,0,18]],[[52,16,32,0],[-40,80,32,9],[-114,-21,0,19],[51,7,32,0],[-12,63,32,8],[-61,-20,0,19],[-50,-26,0,19]],[[51,4,32,0],[-17,87,32,11],[-116,-22,0,18],[51,4,32,0],[-5,81,32,11],[-76,-26,0,18],[-61,-31,0,18]],[[51,-2,32,0],[-22,45,32,10],[-87,-20,0,22],[51,-2,32,0],[-16,44,32,10],[-49,-19,0,22],[-37,-22,0,22]],[[45,3,32,0],[18,44,32,8],[-105,-12,0,16],[45,3,32,0],[24,40,32,8],[-60,-17,0,16],[-42,-23,0,16]],[[51,4,32,0],[-9,45,32,10],[-115,-15,0,22],[50,4,32,0],[-3,40,32,10],[-9,-20,32,22],[-35,-19,0,21]],[[46,3,32,3],[-24,41,32,7],[-68,-8,32,8],[43,0,32,3],[-17,31,32,7],[-26,-11,32,8],[-24,-26,0,14]],[[54,5,32,0],[-17,76,32,7],[-100,-27,0,15],[51,0,32,0],[-5,69,32,7],[-59,-30,0,15],[-43,-29,0,14]],[[53,13,32,3],[-10,84,32,10],[-114,-20,0,18],[50,3,32,3],[3,79,32,10],[-71,-26,0,18],[-34,-7,0,15]]],"izunaIndices":[3,4,5,6,0,0,0,0],"damage":[[4,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,8,8,9,9,9,9,9,10,10,10,12],[5,6,6,6,6,7,7,7,7,7,7,8,8,8,8,8,8,9,9,9,9,9,9,10,10,10,11,11,11,12,12,14],[5,6,6,7,7,7,8,8,8,8,9,9,9,9,10,10,10,11,11,11,12,12,12,13,13,13,14,14,15,15,16,18],[7,8,8,9,9,9,10,10,10,11,11,11,11,12,12,12,12,13,13,13,14,14,14,15,15,16,16,17,17,18,18,20],[8,9,10,10,11,11,12,12,12,13,13,13,13,14,14,14,14,15,15,15,16,16,16,17,17,18,18,19,19,20,20,23],[10,11,12,12,13,13,14,14,14,15,15,15,15,16,16,16,16,17,17,17,18,18,18,19,19,20,20,21,21,22,22,24],[10,13,14,14,15,15,16,16,16,17,17,17,17,18,18,18,18,19,19,19,20,20,20,21,21,22,22,23,23,24,24,26],[12,15,16,16,17,17,18,18,18,19,19,19,19,20,20,20,20,21,21,21,22,22,22,23,23,24,24,25,25,26,26,28],[12,13,14,15,16,16,17,17,18,18,19,19,20,20,22,22,22,23,23,24,24,25,25,26,26,27,28,29,30,31,32,34],[15,16,17,18,19,19,20,20,21,21,22,22,23,23,24,24,24,25,25,26,26,27,27,28,28,29,30,31,32,33,34,36],[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],[17,18,19,20,21,21,22,22,23,23,24,24,25,25,26,26,26,27,27,28,28,29,29,30,30,31,32,33,34,35,36,38],[18,19,20,21,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,30,30,31,31,32,32,33,34,35,36,37,38,40],[22,23,24,25,26,27,27,28,28,29,29,30,30,31,31,32,32,33,33,34,34,35,35,36,36,37,38,39,40,41,42,44],[26,27,28,29,30,31,31,32,32,33,33,34,34,35,35,36,36,37,37,38,38,39,39,40,40,41,42,43,44,45,46,48],[30,31,32,33,34,35,35,36,36,37,37,38,38,39,39,40,40,41,41,42,42,43,43,44,44,45,46,47,48,49,50,52],[34,35,36,37,38,39,39,40,40,41,41,42,42,43,43,44,44,45,45,46,46,47,47,48,48,49,50,51,52,53,54,56],[32,2,32,2,32,2,32,4,32,4,32,28,32,30,32,30,32,6,32,6,32,2,32,6,32,6,32,8,32,8,32,32],[32,10,32,28,32,28,32,28,32,42,32,42,32,44,32,46,32,46,32,32,32,32,32,28,32,32,32,32,32,34,32,34],[32,48,32,14,0,1,0,20,0,10,0,60,0,30,0,0,0,0,0,0,0,1,0,26,0,13,0,80,0,40,0,0],[0,0,0,0,0,1,0,30,0,15,0,100,0,50,0,0,0,0,0,0,0,2,0,40,0,30,0,100,0,75,0,0],[0,0,0,0,32,10,32,10,32,34,32,34,32,14,32,14,32,50,32,50,0,64,0,120,0,56,0,120,0,80,0,120],[0,56,0,120,0,64,0,120,0,80,0,120,0,64,0,120,0,80,0,104,0,64,0,120,0,80,0,120,0,48,0,120],[0,80,0,120,0,12,250,202,0,13,12,60,0,13,29,112,0,13,47,72,0,13,63,218,0,13,79,96,0,13,96,44],[0,13,112,226,0,13,129,18,0,13,145,202,0,13,162,22,0,13,178,126,0,12,251,138,0,13,12,220,0,13,30,48],[0,13,48,8,0,13,64,154,0,13,80,32,0,13,96,236,0,13,113,162,0,13,129,210,0,13,146,138,0,13,162,214],[0,13,179,62,0,14,45,92,0,14,46,200,0,14,47,206,0,14,48,180,0,14,49,150,0,14,50,136,0,14,51,106],[0,14,52,112,0,14,53,82,0,14,54,52,0,14,55,22,0,14,55,248,0,12,103,136,0,12,111,6,0,12,123,238],[0,12,137,44,0,12,150,28,0,12,159,222,0,12,169,210,0,12,181,124,0,12,198,180,0,12,213,96,0,12,227,54],[0,12,237,184,4,94,4,110,98,142,0,190,0,1,190,1,1,190,2,1,190,4,1,4,67,0,156,0,0,7,0,0],[0,7,0,156,4,68,0,0,0,5,0,0,0,5,0,156,128,255,98,190,0,1,190,1,1,190,2,1,190,4,1,4],[67,0,156,0,0,7,0,0,0,7,0,156,4,68,0,0,0,5,0,0,0,5,0,156,128,255,98,190,0,1,190,1]],"variation":[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,2,3,1,2,1,2,1,1,1,1,2,1,1,1,1,2,1,3,1,3,1,2,3,1,1,2,1,1,2,1,1],[2,1,1,1,1,1,1,1,1,3,1,4,2,2,4,2,2,1,2,1,6,1,5,1,1,1,1,3,1,1,1,1],[0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0],[0,-10,0,0,0,0,0,0,0,0,10,0,0,0,10,0,0,0,0,0,-15,0,0,0,0,15,0,0,0,0,0,-10],[0,10,-15,-10,10,0,-15,15,15,15,0,-15,15,-15,10,15,-15,0,-15,10,-10,15,15,-10,-10,15,-15,15,-15,15,-15,-15],[-17,8,-2,-17,8,-17,-12,-17,13,-17,13,13,13,13,13,-2,-17,-2,-17,8,-12,13,-17,13,-12,-17,13,13,-17,-2,8,-12],[-4,-14,-19,11,-4,-19,6,-19,11,-19,6,-19,6,11,-19,-14,-14,11,11,11,-19,11,11,11,-19,6,-4,-19,11,-14,-4,-19],[-3,-3,-1,-3,-3,-1,-3,-3,-3,-2,1,-3,-3,2,-2,-3,-3,0,-3,-3,-3,-3,0,-3,-2,-3,-3,-2,-2,-3,-3,-2],[-4,-4,-4,-4,-4,-4,6,-4,11,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,6,-4,-4,-4,-4,-4,-4]],"defense":[[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10],[0,1,1,1,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10,10,10,11,12],[0,1,1,1,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10,10,10,11,12],[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10],[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10],[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10],[3,4,4,4,5,5,6,6,7,7,8,8,8,9,9,9,10,10,10,10,11,11,11,11,12,12,12,13,13,13,14,14],[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10],[0,1,1,1,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10,10,10,11,12],[0,1,1,1,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10,10,10,11,12],[0,1,1,1,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,7,8,8,8,8,9,9,9,10,10,10,11,12],[0,0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10]],"lowHealth":[24,24,24,24,24,24,20,20,20,20,20,16,16,16,16,16,12,12,12,12,12,8,8,8,8,8,4,4,4,4,4,17]};
 // END ORIGINAL VEGA COMBAT DATA
 function attackRecord(p){return COMBAT.records[p.anim.source+24*p.aidx];}
 function combatState(p){return p.fid===11&&(p.CES?.kind==='vegaroll'||p.CES?.kind==='vegawall')?p.CES:p.fid===11&&p.cur===19?p.CEVSL:null;}
 function reprobe(p){const c=combatState(p),a=attackRecord(p);return !!c&&!!a&&a[5]!==c.hitGroup;}
 function combat(p,d,random,region){
  const c=combatState(p),a=attackRecord(p);if(!c||!a)return null;c.hitGroup=a[5];
  // 0x9540a/0x95542: CE's default player handicap is16; preserve explicit overrides.
  const level=p.CE_ATTACK_LEVEL??16,defense=d.CE_DEFENSE_LEVEL??16;
  let damage=COMBAT.damage[a[4]&63][level],weak=d.CE_WEAKNESS?.[region]||0;
  if(weak===2)damage+=damage>>1;else if(weak===4)damage*=2;else if(weak===6)damage*=3;else if(weak===8)damage+=damage>>2;
  damage=Math.max(1,damage+COMBAT.variation[a[p.HP>=60?9:10]][random()&31]);
  damage-=damage*COMBAT.defense[d.fid][defense]>>5;damage=Math.max(1,damage);
  if(d.HP<31)damage=Math.max(1,damage-(damage*COMBAT.lowHealth[Math.max(0,d.HP)]>>5));
  return {damage,chip:a[7]===3?Math.max(1,damage>>2):0,kd:p.cur===19?1:0,strength:a[8]};
 }
 function invulnerable(p){return p.CETH?.kind==='vegaizuna'||p.CETHV?.kind==='held'&&p.opp.CETH?.kind==='vegaizuna'||p.fid===11&&p.CES?.kind==='vegawall'&&p.CES.invulnerable===true;}
 function normal(p,h){
  if(p.fid!==11)return;
  let c=p.CEVSL;
  if(c?.phase===2&&p.ST===4){
   const a=p.anim,next=p.aidx+1;
   if(a.flags[p.aidx]&0x8000||next<a.ents.length&&p.acc+1>=a.ents[p.aidx][1]&&a.flags[next]&0x8000){p.CEVSL=null;h.idle(p);}
   return;
  }
  if(p.ST!==1||p.cur!==19&&!(c?.phase===-1&&p.cur===3)){p.CEVSL=null;return;}
  if(!c){
   // Native attack state first retains the final crouch entry for one tick.
   p.CEVSL={phase:-1,vx:(p.FACE?1:-1)*0xa00,ax:(p.FACE?1:-1)*0x80};
   h.anim(p,3,2);p.acc=-1;return;
  }
  if(c.phase===-1){
   h.anim(p,19,0);const a=p.anim,d=[2,2,2,1,13,1];
   p.anim={...a,ents:a.ents.map((e,i)=>{const q=e.slice();q[1]=d[i];return q;})};
   p.acc=-1;c.phase=0;return;
  }
  const flags=p.anim.flags[p.aidx];
  if(flags&255&&c.vx){c.vx-=c.ax;p.X+=c.vx;p.acc--;return;}
  if(flags&0x8000){
   if(p.KEYS&8){p.CEVSL=null;h.anim(p,3,2);p.acc=-1;p.ST=3;}
   else{c.phase=2;h.anim(p,4,0);p.anim={...p.anim,ents:p.anim.ents.map((e,i)=>{const q=e.slice();if(i===0)q[1]=1;return q;})};p.acc=-1;p.ST=4;}
  }
 }
 function grab(p,c){
  const o=p.opp,[width,center]=COMBAT.grabTargets[o.fid];
  if(!(p.KEYS&15)||o.HP<=0||![0,1,2,3,4].includes(o.ST)||invulnerable(o))return false;
  if(Math.abs((p.X>>8)-(o.X>>8))>53+width||Math.abs((p.Y>>8)+49-(o.Y>>8)-center)>48)return false;
  c.phase=10;c.invulnerable=false;p.hitdone=1;
  p.CETH={kind:'vegaizuna',rows:COMBAT.izunaRows[o.fid],indices:COMBAT.izunaIndices,fresh:1};
  o.CETHV={kind:'held'};o.ST=5;o.STUN=999;o.KB=o.RETCR=0;return true;
 }
 function izuna(p,c,h,set,flags){
  if(c.phase===10){
   p.FACE=p.KEYS&1?0:1;p.hitdone=1;
   if((p.Y>>8)<24){p.Y&=255;c.phase=11;c.time=8;c.vx=-0x10;c.vy=0x600;c.ay=0x80;}else c.phase=13;
   set('vegawall5');return true;
  }
  if(c.phase===11){if(--c.time===0)c.phase=12;p.acc--;return true;}
  if(c.phase===12){c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;if(c.vy<0)c.phase=13;return true;}
  if(c.phase===13){c.vx=c.vy=0;c.ay=0x80;if(flags&255){c.phase=14;p.acc--;}return true;}
  if(c.phase===14){
   if(p.Y<0){
    p.Y&=255;c.phase=15;const o=p.opp,dir=p.FACE?1:-1;
    let damage=COMBAT.damage[14][p.CE_ATTACK_LEVEL??16];
    if(o.HP<31)damage=Math.max(1,damage-(damage*COMBAT.lowHealth[Math.max(0,o.HP)]>>5));
    o.HP=Math.max(0,o.HP-damage);o.CETHV={kind:'fall',shoto:true,vegaIzuna:true,phase:0,dir,dmg:0,vx:dir*0x200,vy:0x600,ay:0x58,bounce:[0x280,0x280,0x48],slide:0x100};
    o.ST=o.HP?7:8;o.STUN=o.KB=o.DOWNT=o.VX=o.VY=0;p.CETH=null;h.sound?.(0x2e);p.acc--;return true;
   }
   c.vy-=c.ay;p.Y+=c.vy;p.acc--;return true;
  }
  if(c.phase===15){if(flags&0x8000){p.CETH=null;p.CES=null;h.idle(p);}return true;}
  return true;
 }
 function cage(p,c,h,set,flags){
  if(c.phase===20){if(flags&255){c.phase=21;c.vx=(p.FACE?1:-1)*0x380;c.ax=(p.FACE?1:-1)*5;c.vy=0x800;c.ay=0x58;}return true;}
  if(c.phase===21){if(!(flags&255))c.phase=22;c.vx-=c.ax;c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;return true;}
  if(c.phase===22){if(flags&0xff00)c.phase=23;return true;}
  if(c.phase===23){if(flags&0xff00){c.phase=24;set('vegawall1');p.anim={...p.anim,mode:0,loop:0};}return true;}
  if(c.phase===24){
   const pair=COMBAT.cageOffsets[COMBAT.cageChoices[h.rand()&31]],dx=(p.opp.X>>8)+pair[0]-(p.X>>8),dy=pair[1]-(p.Y>>8),distance=Math.abs(dx),shift=distance>=128?1:distance>=64?2:3;
   c.time=distance>=128?128:distance>=64?64:32;c.vx=dx<<shift;c.vy=dy<<shift;c.phase=25;p.acc--;return true;
  }
  if(c.phase===25){if(--c.time===0){c.phase=26;set('vegawall2');}else{p.X+=c.vx;p.Y+=c.vy;}return true;}
  if(c.phase===26){if(flags&0xff00){c.phase=3;c.invulnerable=true;}return true;}
  return true;
 }
 function wall(p,c,h){
  if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
  const flags=p.anim.flags[p.aidx],set=name=>{h.anim(p,c.slots[name],0);p.acc=-1;};
  if(c.phase>=20)return cage(p,c,h,set,flags);
  if(c.phase>=10)return izuna(p,c,h,set,flags);
  if(c.phase===0){
   if(!(flags&255)){
    const cam=h.cam,rel=(p.X>>8)-cam,keys=p.KEYS&3,target=keys?(keys&1?cam:cam+384):cam+(rel<192?0:384);
    c.vx=(target-(p.X>>8))*8;c.vy=(104-(p.Y>>8))*8;c.ay=0x400;c.descend=false;c.phase=1;c.airTime=0;
    p.FACE=c.vx>=0?1:0;
   }return true;
  }
  if(c.phase===1){
   if(++c.airTime>=30)c.invulnerable=true;
   p.X+=c.vx;p.Y+=c.vy+(c.descend?-c.ay:c.ay);
   if(c.descend)c.ay+=0x40;else{c.ay-=0x40;if(c.ay<0){c.ay=0;c.descend=true;}}
   if(p.Y>=24*256&&p.CEWALL){c.phase=2;c.time=4;set('vegawallcontact');}
   return true;
  }
  if(c.phase===2){if(--c.time===0)c.phase=3;p.acc--;return true;}
  if(c.phase===3){
   c.vx=Math.trunc(((p.opp.X>>8)-(p.X>>8))*256/40);
   c.vy=Math.trunc(((p.opp.Y>>8)-(p.Y>>8))*256/40)+0x8c0;c.ay=0x70;c.phase=4;c.invulnerable=true;
   p.FACE=c.vx>=0?1:0;h.sound?.(0x75);set('vegawall4');return true;
  }
  if(c.phase===4||c.phase===5){
   if(c.phase===4&&c.vy<0){
    c.invulnerable=false;
    const pressed=p.KEYS&~(c.prevKeys||0)&0x70;
    if(pressed){if(grab(p,c))return izuna(p,c,h,set,flags);const strength=pressed&16?0:pressed&32?1:2;c.phase=5;p.FACE=c.vx<0?1:0;set('vegawall'+(9+strength));return true;}
   }
   c.prevKeys=p.KEYS;
   if(p.KEYS&1)p.X-=4*256;else if(p.KEYS&2)p.X+=4*256;
   c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;
   if(p.Y<0){
    p.Y&=255;c.phase=6;c.time=1;p.FACE=p.opp.X>=p.X?1:0;
    c.vx=p.FACE?-0x300:0x300;c.vy=0x800;c.ay=0x200;set('biteland');
   }return true;
  }
  if(c.phase===6){if(--c.time===0){c.phase=7;set('jumpb');}return true;}
  if(c.phase===7){if(!(flags&255))c.phase=8;return true;}
  if(c.phase===8){
   c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;
   if(c.vy<0&&p.Y<0){p.Y&=255;c.phase=9;c.time=6;set('biteland');}return true;
  }
  if(c.phase===9){if(--c.time===0){p.CES=null;h.idle(p);}else p.acc--;return true;}
  return true;
 }
 const priorThrows=window.SF2CETHROWS;
 if(priorThrows)window.SF2CETHROWS={...priorThrows,
  actor(p,h){
   if(!p.CETHV?.vegaIzuna)return priorThrows.actor(p,h);
   return priorThrows.actor(p,{...h,find:(q,n)=>h.find(q,/^throwfall[0-3]$/.test(n)?'vegaizunafall'+n.slice(-1):n)});
  },
  sync(p,h){
   const c=p.CETH;if(c?.kind!=='vegaizuna')return priorThrows.sync(p,h);
   const o=p.opp;if(o.CETHV?.kind!=='held')return;
   const row=c.rows[c.indices[p.aidx]];if(!row)return;
   o.X=(p.X&~255)+((p.FACE?-row[0]:row[0])<<8)+(o.X&255);o.Y=(p.Y&~255)+(row[1]<<8)+(o.Y&255);
   o.FACE=p.FACE^((row[2]>>5)&1);o.ST=5;o.STUN=999;o.KB=0;
   const margin=[40,56,53,40,40,36,46,40,40,44,40,40][o.fid],cam=window.SF2.G.cam,x=o.X>>8,clipped=Math.max(cam+margin,Math.min(cam+384-margin,x)),correction=(clipped-x)<<8;
   o.X+=correction;p.X+=correction;if(c.fresh){c.fresh=0;return;}const name=h.find(o,'thpose'+row[3]);h.anim(o,name>=0?name:h.find(o,'thpose0'),name>=0?0:row[3]);
  }
 };
 window.SF2CEVEGA={normal,reprobe,combat,invulnerable};
 window.SF2CESPECIALS={
  init(p,m,h){
   if(p.fid===11&&m.inp==='cdu'&&m.btn==='K'){
    const slot=h.find(p,h.stage===11?'vegawall0':'vegawall12');if(slot<0)return prior.init(p,m,h);
    const names=[...Array.from({length:13},(_,i)=>'vegawall'+i),'vegawallcontact','biteland','jumpb'];
    const slots=Object.fromEntries(names.map(n=>[n,h.find(p,n)]));
    p.SPKD=0;p.CES={kind:'vegawall',move:m,phase:h.stage===11?20:0,slots};h.anim(p,slot,0);return true;
   }
   if(p.fid!==11||m.inp!=='cbf'||m.btn!=='P')return prior.init(p,m,h);
   const slot=h.find(p,'vegaroll'+p.SPSTR);if(slot<0)return prior.init(p,m,h);
   p.SPKD=0;p.CES={kind:'vegaroll',move:m,phase:0,vx:(p.FACE?1:-1)*0x500,vy:0x800,ay:0x100};
   h.anim(p,slot,0);return true;
  },
  step(p,h){
   const c=p.CES;if(c?.kind==='vegawall')return wall(p,c,h);
   if(!c||c.kind!=='vegaroll')return prior.step(p,h);
   if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
   const flags=p.anim.flags[p.aidx];
   if(c.phase===0){if(!(flags&255)){c.phase=1;h.sound?.(0x27);}return true;}
   if(c.phase===1){
    if(flags&255){c.phase=2;p.Y=0;}
    c.vy-=c.ay;p.X+=c.vx;p.Y=Math.max(0,p.Y+c.vy);return true;
   }
   if(flags&0x8000){p.CES=null;h.idle(p);}return true;
  }
 };
})();
