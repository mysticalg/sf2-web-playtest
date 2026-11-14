/* CE Blanka bite, 0x3f200..0x3f34a. Anchor rows are original 0xab03c.
   Hold counter130; animation marker1 inflicts a bite with12 ticks hitstop. */
'use strict';
window.SF2CEBITE=(()=>{
  const A=[[[-49,0,4],[-49,0,4],[-49,0,4],[-49,0,5],[-49,0,4]],[[-67,0,0],[-54,-10,0],[-56,-8,0],[-23,3,1],[-23,3,2]],[[-87,0,0],[-67,0,1],[-83,0,4],[-55,10,6],[-60,0,8]],[[-64,0,0],[-64,0,0],[-64,0,0],[-64,0,5],[-64,0,4]],[[-49,0,4],[-49,0,4],[-49,0,4],[-49,0,5],[-49,0,4]],[[-59,0,0],[-59,0,0],[-59,0,0],[-44,3,5],[-44,3,4]],[[-70,0,4],[-70,0,4],[-70,0,4],[-72,-15,6],[-72,-18,5]],[[-59,0,0],[-65,-11,0],[-67,-7,0],[-51,-17,0],[-51,-17,1]],[[-67,0,0],[-68,-10,0],[-74,-7,5],[-56,-11,6],[-56,-11,5]],[[-57,0,0],[-54,-33,0],[-54,-32,0],[-36,-29,1],[-36,-29,2]],[[-55,0,0],[-62,-25,0],[-63,-19,0],[-39,-27,1],[-39,-27,2]],[[-56,0,3],[-65,-13,3],[-65,-13,3],[-40,-12,4],[-43,-12,3]]];
  function pose(p,c,h,initial=false){
    const o=p.opp,q=A[o.fid][[0,1,2,3,3,4][p.aidx]],dir=c.dir;
    p.X=((o.X>>8)+dir*q[0])*256+(p.X&255);p.Y=((o.Y>>8)-q[1])*256+(p.Y&255);
    if(!initial){const n=h.find(o,'bitepose'+q[2]);if(o.cur!==n)h.anim(o,n,0);}
  }
  function init(p,atk,h){
    if(p.fid!==2||atk>=3||h.find(p,'bitefinish')<0||h.find(p.opp,'bitetoss')<0)return false;
    const o=p.opp,c={phase:0,time:130,dir:p.FACE?1:-1,hits:0};
    Object.assign(p,{MV:h.move,SPK:0,SPKD:0,SPSTR:atk%3,RETCR:0,KB:0,hitdone:1,ST:11,THAN:46,CEB:c,THV:null});
    h.anim(p,46,0);p.anim={...p.anim,mode:0,loop:3};p.acc=-1;
    Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,CEBV:{owner:p,phase:0}});
    pose(p,c,h,true);h.voice(p);return true;
  }
  function step(p,h){
    const c=p.CEB;if(!c)return false;
    if(p.MV.kind!=='throw'){p.CEB=null;return false;}
    const o=p.opp;
    if(c.phase===0){
      if(--c.time===0||o.HP===0){
        c.phase=1;c.vy=0x600;c.vx=-c.dir*0x180;
        h.anim(p,h.find(p,'bitefinish'),0);p.acc=-1;
        h.anim(o,h.find(o,'bitetoss'),0);
        o.CEBV={owner:p,phase:1,wait:p.i===0?1:0,dir:c.dir};return true;
      }
      if(p.anim.flags[p.aidx]&1){o.HP=Math.max(0,o.HP-(c.hits++?4:20));h.freeze(12);h.hit(p);}
      h.tick(p);pose(p,c,h);p.acc--;return true;
    }
    if(c.phase===1){
      c.vy-=0xa0;p.X+=c.vx;p.Y+=c.vy;
      if(c.vy<0&&p.Y<0){p.Y&=255;c.phase=2;c.time=6;h.anim(p,h.find(p,'biteland'),0);p.acc=-1;h.land(p);}
      return true;
    }
    if(--c.time===0){p.CEB=null;h.idle(p);}else p.acc--;return true;
  }
  function victim(o,h){
    const c=o.CEBV;if(!c)return false;
    if(o.ST!==5){o.CEBV=null;return false;}
    if(c.phase===0){
      if(!c.owner.CEB||c.owner.ST!==11){o.CEBV=null;h.fall(o,c.owner.FACE?1:-1);return false;}
      o.acc--;return true;
    }
    if(c.phase===1){if(c.wait--){o.acc--;return true;}o.Y+=16<<8;c.vx=c.dir*0x200;c.vy=0x5c0;c.phase=2;o.acc--;return true;}
    if(c.phase===2){
      c.vy-=0x48;o.X+=c.vx;o.Y+=c.vy;
      if(c.vy<0&&o.Y<0){o.Y&=255;c.phase=3;c.time=6;h.anim(o,h.find(o,'biteland'),0);o.acc--;h.land(o);}return true;
    }
    o.acc--;if(--c.time===0){o.CEBV=null;h.idle(o);}return true;
  }
  return {init,step,victim};
})();
