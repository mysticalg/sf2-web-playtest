/* CE Chun-Li Lightning Legs: input 0x40b46, runtime 0x415dc.
   Each kick has its own five-press counter; animation status 0x58 supplies
   startup, the original loop, strength changes, and recovery. */
'use strict';
(()=>{
  const prior=window.SF2CESPECIALS,period=[15,12,9],threshold=[0,3,6];
  window.SF2CHUNLEGS={
    input(p,edges){
      const c=p.CELI||(p.CELI={timer:period.slice(),count:[0,0,0]});
      p.CELK=edges;
      for(let i=0;i<3;i++){
        if(edges&(1<<i)){c.count[i]=(c.count[i]+1)&255;c.timer[i]=period[i];}
        else if(--c.timer[i]<=0){c.count[i]=0;c.timer[i]=period[i];}
      }
      for(let i=0;i<3;i++)if((edges&(1<<i))&&c.count[i]>=5)return ['mash','K',i];
      return null;
    }
  };
  window.SF2CESPECIALS={
    init(p,m,h){
      if(p.fid!==5||m.inp!=='mash'||m.btn!=='K')return prior.init(p,m,h);
      const a=[0,1,2].map(s=>h.find(p,'legs'+s)),r=[0,1,2].map(s=>h.find(p,'legsland'+s));
      if(a.concat(r).some(i=>i<0))return prior.init(p,m,h);
      p.CES={kind:'legs',move:m,phase:0,strength:p.SPSTR,time:15,active:a,recovery:r};
      p.VQ=null;h.anim(p,a[p.SPSTR],0);p.acc=-1;return true;
    },
    step(p,h){
      const c=p.CES;if(!c||c.kind!=='legs')return prior.step(p,h);
      if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
      // Active ROM entries alternate hit ids0x32..0x35 (LK),0x36..0x39
      // (MK),0x3a..0x3d (HK), allowing later contacts during the loop.
      if(c.entry!==p.aidx){if(p.anim.ents[p.aidx][6][2])p.hitdone=0;c.entry=p.aidx;}
      const f=p.anim.flags[p.aidx];
      if(c.phase===2){if(f&0xff00){p.CES=null;h.idle(p);}return true;}
      if(c.phase===0){if(!(f&0xff00))return true;c.phase=1;}
      if(f&0x8000)h.sound(0x48);
      let s=-1;for(let i=0;i<3;i++)if((p.CELK||0)&(1<<i)){s=i;break;}
      if(s>=0&&threshold[s]<c.time){
        c.time=15;
        if(s!==c.strength){
          c.strength=p.SPSTR=s;
          h.anim(p,c.active[s],Math.min((f&0x1ff)/24|0,p.F.anims[c.active[s]].ents.length-1));
          p.acc=-1;
        }
      }else if(--c.time<=0){c.phase=2;h.anim(p,c.recovery[c.strength],0);p.acc=-1;}
      return true;
    }
  };
})();
