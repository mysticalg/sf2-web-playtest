/* CE ground throw and shared thrown-victim state machine.
   0x43b04..43b5a; attachment rows 0xaaff4 / 0x3a0e;
   fall descriptors 0x390ee,0x39442 and motion 0x39b08..39cec. */
'use strict';
(()=>{
  const prior=window.SF2CETHROWS;
  const ROWS=[[[-48,0,32,0],[-48,0,32,4],[-100,20,0,2],[-42,38,0,8],[56,47,0,8],[-45,0,32,0],[-62,11,32,3],[-103,12,1,1],[-70,26,1,6],[52,47,1,7],[-53,0,32,0],[-57,18,32,5],[-94,12,1,1],[-67,24,1,10],[56,32,0,10],[-53,0,32,0]],[[-45,0,32,0],[-62,11,32,3],[-103,12,1,1],[-70,26,1,6],[52,47,1,7],[-53,0,32,0],[-57,18,32,5],[-94,12,1,1],[-67,24,1,10],[56,32,0,10],[-53,0,32,0],[-62,7,32,4],[-88,9,1,1],[-39,21,1,8],[64,48,0,9],[-48,0,32,0]],[[-53,0,32,0],[-57,18,32,5],[-94,12,1,1],[-67,24,1,10],[56,32,0,10],[-53,0,32,0],[-62,7,32,4],[-88,9,1,1],[-39,21,1,8],[64,48,0,9],[-48,0,32,0],[-48,10,32,4],[-84,17,1,1],[-32,43,0,8],[54,55,0,9],[-53,0,32,0]],[[-53,0,32,0],[-62,7,32,4],[-88,9,1,1],[-39,21,1,8],[64,48,0,9],[-48,0,32,0],[-48,10,32,4],[-84,17,1,1],[-32,43,0,8],[54,55,0,9],[-53,0,32,0],[-48,0,32,5],[-80,-2,1,0],[-65,17,1,10],[59,32,0,11],[-53,0,32,0]],[[-48,0,32,0],[-48,0,32,4],[-100,20,0,2],[-42,38,0,8],[56,47,0,8],[-45,0,32,0],[-62,11,32,3],[-103,12,1,1],[-70,26,1,6],[52,47,1,7],[-53,0,32,0],[-57,18,32,5],[-94,12,1,1],[-67,24,1,10],[56,32,0,10],[-53,0,32,0]],[[-48,0,32,0],[-48,10,32,4],[-84,17,1,1],[-32,43,0,8],[54,55,0,9],[-53,0,32,0],[-48,0,32,5],[-80,-2,1,0],[-65,17,1,10],[59,32,0,11],[-53,0,32,0],[-49,0,32,5],[-91,0,1,3],[-77,32,1,8],[24,32,0,8],[-53,0,32,0]],[[-53,0,32,0],[-48,0,32,5],[-80,-2,1,0],[-65,17,1,10],[59,32,0,11],[-53,0,32,0],[-49,0,32,5],[-91,0,1,3],[-77,32,1,8],[24,32,0,8],[-53,0,32,0],[-48,0,32,1],[-90,21,0,9],[-50,20,0,10],[78,21,0,11],[-59,0,32,3]],[[-53,0,32,0],[-49,0,32,5],[-91,0,1,3],[-77,32,1,8],[24,32,0,8],[-53,0,32,0],[-48,0,32,1],[-90,21,0,9],[-50,20,0,10],[78,21,0,11],[-59,0,32,3],[-54,0,32,4],[-61,20,0,5],[-37,18,0,7],[75,0,0,7],[-54,0,32,0]],[[-53,0,32,0],[-48,0,32,1],[-90,21,0,9],[-50,20,0,10],[78,21,0,11],[-59,0,32,3],[-54,0,32,4],[-61,20,0,5],[-37,18,0,7],[75,0,0,7],[-54,0,32,0],[-52,0,32,1],[-75,0,0,2],[-46,60,0,7],[68,31,0,7],[-50,0,32,3]],[[-59,0,32,3],[-54,0,32,4],[-61,20,0,5],[-37,18,0,7],[75,0,0,7],[-54,0,32,0],[-52,0,32,1],[-75,0,0,2],[-46,60,0,7],[68,31,0,7],[-50,0,32,3],[-50,0,32,0],[-76,16,0,4],[-40,21,0,11],[71,16,0,11],[-56,2,32,0]],[[-54,0,32,0],[-52,0,32,1],[-75,0,0,2],[-46,60,0,7],[68,31,0,7],[-50,0,32,3],[-50,0,32,0],[-76,16,0,4],[-40,21,0,11],[71,16,0,11],[-56,2,32,0],[-34,55,32,5],[12,89,0,18],[125,107,32,9],[127,107,32,9],[-48,3,32,0]],[[-50,0,32,3],[-50,0,32,0],[-76,16,0,4],[-40,21,0,11],[71,16,0,11],[-56,2,32,0],[-34,55,32,5],[12,89,0,18],[125,107,32,9],[127,107,32,9],[-48,3,32,0],[-31,65,32,3],[20,80,0,14],[125,93,32,7],[127,93,32,7],[-64,0,32,0]]];
  const INDEX=[0,1,2,3,4,0,0,0],hold=p=>{p.acc--;};
  const flag=p=>p.anim.flags[p.aidx];
  const set=(p,n,h)=>{h.anim(p,n,0);p.acc=-1;};
  function attach(p,row,h){
    const o=p.opp;if(!row)return;
    o.X=p.X+((p.FACE?-row[0]:row[0])<<8);o.Y=p.Y+(row[1]<<8);
    o.FACE=p.FACE^((row[2]>>5)&1);o.ST=5;o.STUN=999;o.KB=0;
    h.anim(o,h.find(o,'thpose'+row[3]),0);
  }
  function release(p,descriptor,h,dir,dmg=32){
    const t=descriptor===12?[0x700,0x100,0x58,0x580,0x180,0x48,0x180]:[0x380,0x380,0x48,0x280,0x280,0x48,0x100];
    p.CETHV={kind:'fall',phase:0,dir,dmg,vx:dir*t[0],vy:t[1],ay:t[2],bounce:t.slice(3,6),slide:t[6]};
    p.ST=window.SF2.health.alive(p)?7:8;p.STUN=0;p.KB=0;p.DOWNT=0;p.VX=p.VY=0;
  }
  function sync(p,h){
    const c=p.CETH;
    if(c&&c.rows&&p.opp.CETHV&&p.opp.CETHV.kind==='held'){
      if(c.fresh){c.fresh=0;return;}
      attach(p,c.rows[c.indices[p.aidx]],h);
    }
  }
  function actor(p,h){
    const c=p.CETHV;if(!c)return prior&&prior.actor?prior.actor(p,h):false;
    if(c.kind==='held'){hold(p);return true;}
    if(c.kind!=='fall')return false;
    if(c.phase===0){set(p,h.find(p,'throwfall0'),h);c.phase=1;return true;}
    if(c.phase===1){c.phase=2;hold(p);return true;}
    if(c.phase===2||c.phase===4){
      c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;
      if(c.vy<0&&p.Y<0){
        p.Y&=255;
        if(c.phase===2){
          window.SF2.health.damage(p,c.dmg);c.dmg=0;c.phase=3;c.time=4;
          set(p,h.find(p,'throwfall1'),h);h.sound(0x2e);
        }else{c.phase=5;c.vx=c.dir*c.slide;set(p,h.find(p,'throwfall3'),h);}
      }return true;
    }
    if(c.phase===3){
      if(--c.time===0){c.phase=4;c.vx=c.dir*c.bounce[0];c.vy=c.bounce[1];c.ay=c.bounce[2];set(p,h.find(p,'throwfall2'),h);}
      return true;
    }
    if(c.phase===5){
      const v=c.vx-c.dir*0x14;c.vx=v*c.dir<0?0:v;p.X+=c.vx;
      if(!c.vx){c.phase=6;c.time=10;}return true;
    }
    if(c.phase===6){
      if(--c.time===0){
        if(!window.SF2.health.alive(p)){p.CETHV=null;p.ST=8;p.VX=p.VY=0;h.anim(p,29,0);}
        else{c.phase=7;p.ST=10;set(p,30,h);}
      }return true;
    }
    // 0x38ade advances first, then tests the low-byte wakeup marker.
    h.tick(p);hold(p);
    if(flag(p)&255){const y=p.Y;p.CETHV=null;h.idle(p);p.Y=y;}return true;
  }
  window.SF2CETHROWS={...prior,attach,release,actor,sync,
    init(p,atk,h){
      if(p.fid!==8||atk>=3)return prior&&prior.init?prior.init(p,atk,h):false;
      const n=h.find(p,'throw');if(n<0)return false;
      p.MV={kind:'throw'};p.CETH={kind:'bison',phase:0,rows:ROWS[p.opp.fid],indices:INDEX,fresh:1};p.THV=null;p.SPK=0;p.SPKD=0;p.KB=0;p.hitdone=1;p.ST=11;
      const o=p.opp;o.CETHV={kind:'held'};o.ST=5;o.STUN=999;o.KB=0;o.RETCR=0;
      set(p,n,h);if(p.F.sfx.thr)h.sound(p.F.sfx.thr);return true;
    },
    step(p,h){
      const c=p.CETH;if(!c||c.kind!=='bison')return prior&&prior.step?prior.step(p,h):false;
      if(c.phase===0){
        if(flag(p)&255){c.phase=1;release(p.opp,0,h,p.FACE?-1:1);hold(p);}
        return true;
      }
      if(c.phase===1){
        h.tick(p);hold(p);if((flag(p)&255)===2){c.phase=2;p.FACE^=1;}return true;
      }
      if(flag(p)&0x8000){p.CETH=null;h.idle(p);}return true;
    }
  };
})();
