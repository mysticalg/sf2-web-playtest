/* CE Chun-Li ground punch throw, 0x410fa..0x4116e.
   Victim offsets are the ROM's 0xab084 per-opponent tables. */
'use strict';
(()=>{
 const prior=window.SF2CETHROWS,rows=[[[35,15,32,2],[19,12,32,3],[-40,10,32,8],[-78,-1,32,9]],[[48,8,32,2],[24,4,32,6],[-8,20,32,7],[-52,0,32,7]],[[27,8,32,2],[8,0,32,2],[-30,0,32,10],[-60,-20,32,10]],[[28,0,32,1],[18,-2,32,1],[-50,3,32,9],[-65,-6,32,9]],[[35,15,32,2],[19,12,32,3],[-40,10,32,8],[-78,-1,32,9]],[[27,10,32,1],[22,0,32,2],[-39,6,32,8],[-67,-6,32,9]],[[32,-6,32,1],[10,10,32,10],[-28,-14,32,10],[-68,-27,32,10]],[[0,4,32,1],[4,-4,32,2],[17,0,32,8],[-22,2,32,9]],[[26,1,32,2],[8,10,32,10],[-29,-6,32,10],[-64,-19,32,10]],[[7,-6,32,6],[-3,2,32,7],[-44,-22,32,7],[-67,-25,32,7]],[[13,-3,32,2],[5,0,32,6],[-10,32,32,7],[-61,2,32,7]],[[16,2,32,0],[14,0,32,2],[-36,-28,32,8],[-53,1,32,11]]],indices=[0,1,2,3,0,0,0];
 window.SF2CETHROWS={...prior,
  init(p,atk,h){
   if(p.fid!==5||atk>=3)return prior.init(p,atk,h);
   p.CETH={kind:'chun',phase:0,time:10,rows:rows[p.opp.fid],indices,fresh:1};p.THV=null;p.MV={kind:'cechunthrow'};
   p.ST=11;p.hitdone=1;p.KB=0;p.RETCR=0;
   const o=p.opp;o.CETHV={kind:'held'};o.ST=5;o.STUN=999;o.KB=0;o.RETCR=0;
   // Original input and motion dispatcher initialize on successive ticks.
   p.acc--;return true;
  },
  step(p,h){
   const c=p.CETH;if(!c||c.kind!=='chun')return prior.step(p,h);
   if(c.phase===0){
    h.anim(p,h.find(p,'throw'),0);c.phase=1;p.FACE=(p.KEYS&2)?1:0;h.sound(0x48);
    return true;
   }
   if(c.phase===1){
    h.tick(p);p.acc--;
    if(p.anim.flags[p.aidx]&0x80){c.phase=2;c.time=10;prior.release(p.opp,12,h,p.FACE?1:-1);}

   }else if(c.phase===2){
    if(--c.time===0)c.phase=3;
    p.acc--;
   }else{
    h.tick(p);p.acc--;
    if(p.anim.flags[p.aidx]&0x8000){p.CETH=null;h.idle(p);}
   }
   return true;
  }
 };
})();
