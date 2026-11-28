/* CE charged specials: 0x3e872 Headbutt, 0x3f41e Rolling Attack,
   and original 0x4143c..0x415c2 Spinning Bird Kick.
   The spinning frames are selected by a fixed-point rotation counter, not
   the animation player. Motion uses the original 0x2346 8.8 integrator. */
'use strict';
(()=>{
  const prior=window.SF2CESPECIALS,hold=p=>{p.acc--;};
  const flags=p=>p.anim.flags[p.aidx];
  const set=(p,n,h)=>{h.anim(p,n,0);p.acc=-1;};
  function move(p,c){c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;}
  function rotate(p,c,h,delta){
    c.selector=(c.selector+1)&7;
    c.speed+=delta;
    if(c.speed<0x100){c.speed=0x100;c.phase=3;}
    if(c.speed>c.maximum)c.speed=c.maximum;
    c.counter=c.speed>>8;set(p,c.frames[c.selector],h);
  }
  window.SF2CESPECIALS={
    init(p,m,h){
      if((p.fid===1||p.fid===2)&&m.inp==='cbf'&&m.btn==='P'){
        const a=h.find(p,'charge'+p.SPSTR),land=h.find(p,'chargeland');
        if(a<0||p.fid===2&&land<0)return prior.init(p,m,h);
        const c=p.CES={kind:p.fid===1?'headbutt':'rolling',move:m,phase:0,
          vx:(p.FACE?1:-1)*[0x600,0x800,0xa00][p.SPSTR],vy:0,ay:0,
          time:p.fid===1?10:[25,25,60][p.SPSTR],land};
        h.anim(p,a,0);
        if(c.kind==='rolling'){
          // CE 0x3f446..0x3f452: only heavy Rolling Attack requests roar 0x6d.
          if(window.SF2?.edition==='ai'&&p.SPSTR===2)h.sound(0x6d);
          // The three original status-0x50 lists loop to their first entry.
          p.anim.mode=0;p.anim.loop=0;p.X+=c.vx; // Init falls through 0x235e.
        }
        return true;
      }
      if(p.fid!==5||m.inp!=='cdu'||m.btn!=='K')return prior.init(p,m,h);
      const s=p.SPSTR,start=h.find(p,'birdstart'),land=h.find(p,'birdland');
      const frames=Array.from({length:8},(_,i)=>h.find(p,'bird'+s+'_'+i));
      if(start<0||land<0||frames.some(i=>i<0))return prior.init(p,m,h);
      p.CES={kind:'bird',move:m,phase:0,frames,land,selector:0,
        speed:[0x400,0x480,0x500][s],maximum:[0x400,0x480,0x500][s],
        delta:[0x46,0x50,0x5c][s],time:[8,16,40][s],vx:(p.FACE?1:-1)*0x380,vy:0x400,ay:0x60};
      h.anim(p,start,0);return true;
    },
    step(p,h){
      const c=p.CES;if(!c||!['bird','headbutt','rolling'].includes(c.kind))return prior.step(p,h);
      if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
      if(c.kind==='headbutt'){
        if(c.phase===0){if((flags(p)&255)===1)c.phase=1;return true;}
        if(c.phase===1){if(--c.time===0){c.phase=2;c.time=40;}p.X+=c.vx;hold(p);return true;}
        if(c.phase===2){
          if(p.hitdone){c.phase=3;c.vx=(p.FACE?-1:1)*0x400;c.ax=(p.FACE?-1:1)*0x20;hold(p);return true;}
          if(h.wall(p)||--c.time===0)c.phase=4;
          p.X+=c.vx;hold(p);return true;
        }
        if(c.phase===3){c.vx-=c.ax;p.X+=c.vx;if((flags(p)&255)===2){c.phase=4;h.land(p);}return true;}
        if(flags(p)&0x8000){p.CES=null;h.idle(p);}return true;
      }
      if(c.kind==='rolling'){
        if(c.phase===0){
          if(p.hitdone){c.phase=1;c.vx=(p.FACE?-1:1)*0x200;c.vy=0xa00;c.ay=0x80;hold(p);return true;}
          if(h.wall(p)||--c.time===0){c.phase=2;c.time=6;set(p,c.land,h);h.land(p);return true;}
          p.X+=c.vx;return true;
        }
        if(c.phase===1){move(p,c);if(p.Y<0){p.Y&=255;c.phase=2;c.time=6;set(p,c.land,h);h.land(p);}return true;}
        if(--c.time===0){p.CES=null;h.idle(p);}else hold(p);return true;
      }
      if(c.phase===0){if(flags(p)&0x8000)c.phase=1;return true;}
      if(c.phase===1){c.phase=2;c.counter=c.speed>>8;set(p,c.frames[0],h);move(p,c);return true;}
      if(c.phase===2){
        if(c.vy<0)c.vy=c.ay=0;
        if(--c.counter===0)rotate(p,c,h,-c.delta);else hold(p);
        move(p,c);return true;
      }
      if(c.phase===3){
        if(--c.time===0){c.phase=4;c.falltime=12;hold(p);}
        else if(--c.counter===0){rotate(p,c,h,-c.delta);c.phase=3;}else hold(p);
        move(p,c);return true;
      }
      if(c.phase===4){
        if(--c.falltime<0){
          if(p.Y<0){p.Y&=255;c.phase=5;h.anim(p,c.land,0);return true;}
          c.vy=-0x400;c.ay=-0x60;
        }
        if(--c.counter===0)rotate(p,c,h,c.delta);else hold(p);
        move(p,c);return true;
      }
      if(flags(p)&0x8000){p.CES=null;h.land(p);h.idle(p);}
      return true;
    }
  };
})();
