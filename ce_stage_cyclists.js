/* CE Chun-Li bicycles: original0x150da..0x152c6. Independent cosmetic pool/RNG. */
'use strict';
(()=>{
 const D=window.SF2CESTAGECYCLISTDATA,images=D.images.map(src=>{const im=new Image();im.src=src;return im;}),ready=Promise.all(images.map(im=>im.decode()));
 let state,origin,age,seed;
 function reset(){state={clock:D.clock,manager:{...D.manager},actors:D.initial.map(a=>({...a,draw:a.visible})),free:D.freeSlots.slice(),memory:new Map(D.slotMemory.map(a=>[a.address,{...a}]))};origin=null;age=0;seed=0x4359434c;}
 function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
 function select(a,src){const f=D.frames[src];a.source=src;a.timer=f.duration;a.flags=f.flags;}
 function tick(a){a.timer=(a.timer-1)&65535;if(!a.timer)select(a,D.frames[a.source].next);}
 const word=(fixed,integer)=>(((integer&65535)<<16)|(fixed&65535))>>>0;
 function actor(a,s,cam,choose){
  a.draw=false;
  if(a.main===6){if(a.subtype===1){s.manager.count--;const head=s.actors.find(q=>q.address===a.head);if(head)head.main=6;}s.free.unshift(a.address);s.memory.set(a.address,{...a});return false;}
  if(a.main===0){a.main=2;a.depth=64;a.face=a.dir;a.x=word(a.x,cam+256+(a.dir?-80:464));a.y=word(a.y,64);select(a,a.subtype===1?D.bodyStart:choose('head',a));return true;}
  if(a.subtype===1){
  if(((s.clock+a.counter)&7)===0){const x=((a.x>>>16)-(cam+256)+96)&65535,y=((a.y>>>16)+96)&65535;if(x>576||y>448)a.main=6;}
  a.x=(a.x+(a.dir?512:-512)*256)>>>0;
  if(a.subtype===1){const head=s.actors.find(q=>q.address===a.head);if(head){head.x=word(head.x,(a.x>>>16)-8+(a.dir?16:0));head.y=word(head.y,(a.y>>>16)+64);}}
  tick(a);
  }
  const x=((a.x>>>16)-D.cameras[Math.max(0,Math.min(384,cam|0))]+64)&65535,y=((a.y>>>16)+64)&65535;a.visible=x<=512&&y<=384;a.draw=a.visible;return true;
 }
 function manager(s,choose){const m=s.manager;if(!m.phase){m.phase=2;m.delay=choose('delay');return;}m.delay=(m.delay-1)&65535;if(m.delay)return;
  if(m.count<3&&s.free.length>=2){const head=s.free.shift(),body=s.free.shift(),dir=choose('direction'),palette=choose('palette');m.count++;
   for(const [address,subtype]of[[body,1],[head,255]]){const old=s.memory.get(address)||{x:0,y:0};s.actors.push({...old,address,main:0,subtype,dir,face:0,palette,depth:0,parent:D.managerAddress,head:subtype===1?head:0,counter:59-(address-0xa576)/0xc0,visible:false,draw:false});}
  }m.phase=0;
 }
 function advanceOne(s,cam,choose){for(let address=0xa576;address<0xd237;address+=0xc0){if(address===D.managerAddress){manager(s,choose);continue;}const a=s.actors.find(a=>a.address===address);if(a&&!actor(a,s,cam,choose))s.actors.splice(s.actors.indexOf(a),1);}s.clock=(s.clock+1)&255;s.manager.available=s.free.length;return s;}
 function choice(kind){return kind==='delay'?D.delays[(random()&14)>>1]:kind==='palette'?D.palettes[(random()&14)>>1]:kind==='head'?D.headStarts[random()&7]:random()&1;}
 function advance(now,cam,choose=choice){if(origin===null)origin=now;let elapsed=Math.max(0,Math.floor(now-origin));if(elapsed<age){reset();origin=now;elapsed=0;}while(age<elapsed){advanceOne(state,cam,(kind,a)=>choose(kind,a,age));age++;}}
 function drawAt(ctx,cam,actors=state.actors){for(const a of actors.slice().sort((a,b)=>a.address-b.address)){if(!a.draw)continue;const f=D.frames[a.source]?.views[a.palette+':'+a.face];if(!f)continue;const im=images[f.image];if(im.complete)ctx.drawImage(im,(a.x>>>16)-D.cameras[Math.max(0,Math.min(384,cam|0))]+f.left,240-(a.y>>>16)+f.top);}}
 function draw(ctx,stage,index,cam,now){if(stage!==5||index!==3)return false;advance(now,cam);drawAt(ctx,cam);return true;}
 reset();window.SF2CESTAGECYCLISTS={ready,reset,actor,manager,advanceOne,advance,drawAt,draw,get state(){return {age,clock:state.clock,manager:{...state.manager},actors:state.actors.map(a=>({...a})),free:state.free.slice()};},data:D};
})();
