/* CE Dhalsim42d86 slide phases and original descriptor durations.
   Existing Bison43c44..43cc8/3200 behavior is retained below.
   Collision, stop admission and37faa shared air transition remain port-owned. */
'use strict';
// Original status46 slide descriptors; no generated frames or hit data.
const DHSLIDE={"500844":[4,4,3,4,4],"500968":[4,4,3,20,4],"500620":[1,1,3,4,4]};
const DHDRILL=(()=>{/* Original42b76 down-heavy initializer and42e42/42e84 body updates.
   Input3288, ground454, animation and neutral37ddc are explicit source paths.
   External physical collision/stop/admission is supplied by the caller. */

const tick=(a,D)=>{a.timer=(a.timer-1)&65535;if(!a.timer){a.source=D.frames[a.source].next;const f=D.frames[a.source];a.timer=f.duration;a.flags=f.flags;}};
return {init(a,D,mask){
 const bits=[0x10,0x20,0x40,0x100,0x200,0x400];const button=bits.findIndex(b=>mask&b);if(button<0)throw Error('No native attack edge');a.family=button<3?0:2;a.strength=(button%3)*2;
 if(a.strength!==4||(a.y>>>16)<0x48||!(a.keys&4))return false;
 a.landed=0;a.attackFamily=4;a.selector=a.strength;a.moveTable=0x10fc74;a.angle=a.family?(a.face?11:21):(a.face?10:22);a.source=D.sources[a.family>>1];a.timer=D.frames[a.source].duration;a.flags=D.frames[a.source].flags;a.state=10;a.phase=0;a.subphase=0;return true;
},step(a,D,h){
 if(a.landed){a.recovery=(a.recovery-1)&255;if(!a.recovery)h.idle(a);return;}
 const v=D.vectors[a.angle];a.x=(a.x+v[0]*256)>>>0;a.y=(a.y+v[1]*256)>>>0;
 let landed=false;if(a.field4d){a.field4e=1;landed=true;}else if((a.y>>>16)<h.ground){a.y=((h.ground<<16)|(a.y&65535))>>>0;landed=true;}
 if(landed){a.landed=(a.landed+2)&255;a.airborne=a.field18b=a.field1b2=0;a.recovery=7;h.sound(0x2f);h.land(a);return;}
 tick(a,D);
},tick};
})();
const drillPose=(p,c)=>{
 if(c.landed){p.cur=5;p.anim=p.F.anims[5];p.aidx=0;p.acc=p.anim.ents[0][1]-c.timer;p.adone=0;p.JA=0;return;}
 const slot=SF2CEDHALSIM.register(p).poses[c.source];if(!slot)throw Error('Original drill pose missing '+c.source);p.cur=slot[0];p.anim=p.F.anims[p.cur];p.aidx=slot[1];p.acc=SF2CEDHALSIM.data.frames[c.source].duration-c.timer;p.adone=0;
};
window.SF2CENORMALS={
 air(p,atk,keys,h){
  if(p.fid!==7||SF2.G.scene!=='fight')return false;
  const D=SF2CEDHALSIM.data;let c=p.NSL;
  const position=()=>({x:(p.X*256+256*65536)>>>0,y:(p.Y*256+40*65536)>>>0});
  if(c?.kind==='drill'){
   Object.assign(c,position(),{source:p.anim.source+24*p.aidx,timer:p.anim.ents[p.aidx][1]-p.acc,flags:p.anim.flags[p.aidx]});c.field4d=0;DHDRILL.step(c,{frames:D.frames,vectors:D.drillVectors},{ground:40,sound:h.sound,land:a=>{a.source=0x7b940;a.timer=2;a.flags=1;},idle:()=>{p.NSL=null;p.JA=0;h.idle(p);h.tick(p);}});
   p.X=((c.x-256*65536)|0)>>8;p.Y=((c.y-40*65536)|0)>>8;if(p.NSL)drillPose(p,c);p.CEDNClock=1;return true;
  }
  if(atk<0||p.JA||atk%3!==2||!(keys&8)||(p.Y>>8)<32)return false;
  c={kind:'drill',...position(),keys:4,face:p.FACE,starting:true,field4d:0,field4e:0};const mask=atk===2?0x40:0x400;
  if(!DHDRILL.init(c,{sources:D.drills.map(a=>a.source),frames:D.frames},mask))throw Error('Original drill admission');p.NSL=c;p.JA=1;drillPose(p,c);return false;
 },

  step(p,h){
    if(p.CEDNClock){delete p.CEDNClock;return true;}
    if(p.NSL?.kind==='drill'&&p.ST===2){if(p.NSL.starting){p.NSL.starting=false;return;}return true;}

    if(p.fid===7&&p.ST===1&&[17,18,19].includes(p.cur)){
      let c=p.NSL;
      if(!c||c.anim!==p.anim){
        const durations=DHSLIDE[p.anim.source];if(!durations){p.NSL=null;return;}
        const original=p.anim;p.anim={...original,ents:original.ents.map((e,i)=>{const q=e.slice();q[1]=durations[i];return q;})};
        c=p.NSL={phase:2,vx:(10+2*(p.cur-17))*65536,ax:-65536,anim:p.anim};p.acc=0;return true;
      }
      const flag=p.anim.flags[p.aidx];
      if(c.phase===2){if(flag&255)c.phase=4;h.tick(p);return true;}
      if(c.phase===4){p.X+=(p.FACE?1:-1)*(c.vx>>8);c.vx+=c.ax;if(c.vx<0)c.phase=6;return true;}
      if(c.phase===6){if(flag&0x8000){p.NSL=null;h.slideFinish(p);}else h.tick(p);return true;}
      throw Error('Dhalsim slide phase '+c.phase);
    }

    if(p.fid!==8||p.ST!==1||p.cur!==19){p.NSL=null;return;}
    let c=p.NSL;
    if(!c||c.anim!==p.anim){
      const original=p.anim,durations=[6,8,16,3];p.acc=-1;
      p.anim={...original,ents:original.ents.map((e,i)=>{const q=e.slice();q[1]=durations[i];return q;})};
      c=p.NSL={phase:0,vx:(p.FACE?1:-1)*0xe00,ax:(p.FACE?1:-1)*0x80,anim:p.anim};
    }
    const flag=p.anim.flags[p.aidx];
    if(c.phase===0){if(flag&255)c.phase=1;return;}
    if(c.phase===1){
      const before=c.vx;c.vx-=c.ax;if((before>=0)!==(c.vx>=0)||!c.vx)c.vx=0;
      p.X+=c.vx;
      if(c.vx===0){c.phase=2;p.aidx++;p.acc=-1;p.hitdone=0;}else p.acc--;
      return;
    }
    if(flag&0x8000){p.NSL=null;h.finish(p);}
  }
};
