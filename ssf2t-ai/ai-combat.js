/* SPDX-License-Identifier: GPL-3.0-only
 * Native box/projection semantics Copyright (C) 2026 Tommy McLeroy.
 * Native AI presentation adapter. Read-only player/box/projection facts adapted
 * from tmcleroy/cps2recomp e266571, games/ssf2t/src/{ssf2t.h,training,widescreen}.
 * Original CPU controllers and game memory are never changed by this module. */
'use strict';
((root)=>{
 const BASE=0xff844e,STRIDE=0x400,GROUND=40;
 const kinds={head:[8,0,4],body:[9,2,4],legs:[10,4,4],attack:[12,6,16],push:[13,8,4]};
 const s8=n=>(n&255)<<24>>24,s16=n=>(n&65535)<<16>>16;
 const rom=(n,bytes=2)=>Number.isInteger(n)&&n>=0x100&&n+bytes<=0x400000;
 const read32=(api,address)=>(api.read(address,2)*65536+api.read(address+2,2))>>>0;
 function box(api,base,kind,frame=read32(api,base+0x1a),tables=read32(api,base+0x34)){
  const [index,table,size]=kinds[kind];
  if(!rom(frame,24)||!rom(tables,10)||(frame&1)||(tables&1))return null;
  const which=api.read(frame+index,1);if(!which)return null;
  const address=tables+s16(api.read(tables+table,2))+which*size;if(!rom(address,size))return null;
  let across=s8(api.read(address,1));const up=s8(api.read(address+1,1)),rx=s8(api.read(address+2,1)),ry=s8(api.read(address+3,1));
  if(rx<=0||ry<=0)return null;
  if(kind==='attack'&&(api.read(address+5,1)&128))across=-api.read(address+5,1);
  return{x:s16(api.read(base+6,2))+(api.read(base+0x12,1)?-across:across),y:s16(api.read(base+10,2))+up,rx,ry,address};
 }
 function project(point,camera){return{x:point.x-camera.x,y:239-(point.y-camera.y)};}
 function snapshot(api){
  const state=api.state();if(!state?.ready)return null;
  const camera={x:s16(api.read(0xff8ed4,2)),y:s16(api.read(0xff8ed8,2))};
  const players=state.players.map((p,i)=>{
   const base=BASE+i*STRIDE,fighting=api.read(base+2,1)===2,boxes={},frame=read32(api,base+0x1a),tables=read32(api,base+0x34);
   if(fighting)for(const kind of Object.keys(kinds))boxes[kind]=box(api,base,kind,frame,tables);
   const face=!!api.read(base+0x12,1),head=boxes.head;
   // Inside the native head collider: front/lower face, never a guessed stage position.
   const mouth=head?{x:head.x+(face?1:-1)*head.rx*.6,y:head.y-head.ry*.35}:null;
   return{...p,slot:i,base,fighting,face,x:s16(api.read(base+6,2)),y:s16(api.read(base+10,2)),guarded:!!api.read(base+0x49,1),hitStop:api.read(base+0x47,1),frame,boxes,mouth};
  });
  return{frame:state.frame,game:state.gameStep,phase:state.matchStep,stage:state.stage,playersIn:state.playersIn,camera,players,active:state.gameStep===4&&state.matchStep===10&&state.playersIn>0};
 }
 function createObserver(){
  let previous=null;
  return{reset(){previous=null;},step(api){
   const current=snapshot(api);if(!current)return{snapshot:null,events:[],reset:true};
   if(previous&&current.frame===previous.frame)return{snapshot:current,events:[],duplicate:true};
   const reset=!previous||current.frame<previous.frame||current.stage!==previous.stage||current.players.some((p,i)=>p.id!==previous.players[i].id||p.hp>previous.players[i].hp);
   const events=[];
   if(!reset&&(current.active||previous.active)&&current.game===4)for(const p of current.players){
    const old=previous.players[p.slot],damage=old.hp>=0&&p.hp<old.hp?old.hp-Math.max(-1,p.hp):0;
    if(damage>0){const attacker=current.players[1-p.slot],blocked=p.guarded&&p.state===8;events.push({type:'damage',slot:p.slot,damage,blocked,special:attacker.state===12||previous.players[attacker.slot].state===12,origin:p.mouth||old.mouth,frame:current.frame});}
   }
   previous=current;return{snapshot:current,events,reset};
  }};
 }
 function createEffects(options={}){
  const limits={particles:480,stains:320},observer=createObserver();let enabled=options.enabled!==false,particles=[],stains=[],scene=null,serial=0,lastDrip=[-999,-999],lastFrame=-1;
  const stats={hits:0,blocked:0,drips:0,spawned:0,landed:0};
  const random=()=>{let h=Math.imul(++serial,0x45d9f3b)>>>0;h^=h>>>16;return(h>>>0)/4294967296;};
  function reset(){observer.reset();particles=[];stains=[];scene=null;serial=0;lastDrip=[-999,-999];lastFrame=-1;for(const k of Object.keys(stats))stats[k]=0;}
  function emit(point,count,dir,power,drip=false){
   if(!point)return;
   for(let i=0;i<count;i++){const u=random(),v=random();particles.push({x:point.x,y:point.y,vx:drip?(u-.5)*.35:dir*(.7+u*2.5)*power,vy:drip?-.2-v*.5:(.8+v*2.8)*power,life:130,size:drip||i%5?1:2,color:['#c20b23','#e11832','#f32c43'][serial%3]});stats.spawned++;}
   if(particles.length>limits.particles)particles.splice(0,particles.length-limits.particles);
  }
  function step(api){
   if(!enabled)return;
   const observed=observer.step(api),s=observed.snapshot;if(!s||observed.duplicate)return;
   if(observed.reset){particles=[];stains=[];lastDrip=[-999,-999];}
   if(s.game!==4||!s.playersIn){particles=[];stains=[];scene=s;return;}
   scene=s;lastFrame=s.frame;
   for(const e of observed.events){
    if(e.blocked){stats.blocked++;continue;}stats.hits++;
    const actor=s.players[e.slot];emit(e.origin,Math.min(36,5+Math.ceil(e.damage*.65)+(e.special?8:0)),actor.face?-1:1,e.special||e.damage>=14?1.4:1);
   }
   if(s.active)for(const actor of s.players)if(actor.hp>=0&&actor.hp<=144*.2&&actor.mouth&&s.frame-lastDrip[actor.slot]>=8){lastDrip[actor.slot]=s.frame;emit(actor.mouth,1,0,1,true);stats.drips++;}
   for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy-=.19;p.life--;if(p.y<=GROUND){stains.push({x:p.x,size:p.size,color:p.color});stats.landed++;p.life=0;}}
   particles=particles.filter(p=>p.life>0);if(stains.length>limits.stains)stains.splice(0,stains.length-limits.stains);
  }
  function draw(ctx){
   if(!enabled||!scene||scene.game!==4||!scene.playersIn)return;
   ctx.save();ctx.imageSmoothingEnabled=false;
   for(const p of stains){const q=project({x:p.x,y:GROUND},scene.camera);ctx.fillStyle=p.color;ctx.fillRect(Math.round(q.x),Math.round(q.y),p.size+1,1);}
   for(const p of particles){const q=project(p,scene.camera);ctx.globalAlpha=Math.min(1,p.life/20);ctx.fillStyle=p.color;ctx.fillRect(Math.round(q.x),Math.round(q.y),p.size,p.size);}
   ctx.restore();
  }
  return{step,draw,reset,setEnabled(value){enabled=!!value;reset();},info:()=>({enabled,frame:lastFrame,particles:particles.length,stains:stains.length,limits:{...limits},...stats}),snapshot:()=>scene};
 }
 root.SSF2TAICombat=Object.freeze({BASE,STRIDE,GROUND,snapshot,box,project,createObserver,createEffects});
})(typeof window==='undefined'?globalThis:window);
