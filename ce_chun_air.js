/* CE Chun-Li down+MK (0x40f6a/0x41366): original status 0x4a
   and contact bounce through the original 8.8 gravity integrator. */
'use strict';
window.SF2CHUNAIR={
  start(p,atk,down,h){
    if(p.fid!==5||atk!==4||!down)return false;
    const a=h.find(p,p.VX?'stompd':'stompn');if(a<0)return false;
    p.CEST={pending:false};p.JA=1;h.anim(p,a,0);return true;
  },
  step(p,cam){
    const c=p.CEST;if(!c||!c.pending)return;
    c.pending=false;
    const old=p.VX;let d=old?Math.sign(old):p.FACE?1:-1;
    const edge=(p.X>>8)<cam+0x60||(p.X>>8)>cam+0x120;
    if((p.X>>8)<cam+0x60)d=1;else if((p.X>>8)>cam+0x120)d=-1;
    p.VX=d*0x400;p.VY=0x600;p.AX=old||edge?d*5:5;p.AY=0x48;
    // Source returns to ordinary jump state without changing the stomp pose.
    p.JA=0;p.CEST=null;p.acc--;return true;
  },
  contact(p){if(p.CEST)p.CEST.pending=true;}
};
