/* AI Edition authored finishers. Native sprite pixels; host-owned combat/audio/blood.
 * This does not replace or claim parity with a Capcom native death controller.
 * Controls, adapter contract and verified coverage: AI-FINISHERS.md.
 */
'use strict';
window.SF2AIFINISHERS=(()=>{
 const VERSION=6,ATTACK=1008,BUTTONS=Object.freeze([0,1,2,3,4,5]);
 const LIMITS=Object.freeze({hitstop:6,exceptionalHitstop:2,prompt:240,ready:20,cpu:48,move:600,sequence:4200,settle:100,trails:24,trailLife:90,trailDrift:420,pieces:6,emitters:10,bloodPacket:48});
 const PARTS=Object.freeze(['head','arm-left','arm-right','leg-left','leg-right','torso']);
 const COLORS=Object.freeze(['#b20b22','#d3132b','#ed263c']);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function hash(seed,id){let h=(seed^Math.imul(id+1,0x9e3779b1))>>>0;h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return(h^(h>>>16))>>>0;}
 function comboPlan(seed,id){
  const exceptional=hash(seed^0x200c0b0,id)%1024===0,hits=exceptional?200:16+hash(seed,id)%65,buttons=[];let serial=0;
  while(buttons.length<hits-1){const bag=[...BUTTONS];for(let i=bag.length-1;i>0;i--){const j=hash(seed^0xa511e9b3,id+serial++)%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}buttons.push(...bag.slice(0,hits-1-buttons.length));}
  // The sixth contact is a heavy sweep, while retaining every button in bag one.
  const sweep=buttons.indexOf(5);[buttons[sweep],buttons[5]]=[buttons[5],buttons[sweep]];
  return{hits,buttons,exceptional};
 }
 function comboPace(progress){const t=clamp(progress,0,1);return .8+1.2*t*t;}
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function hull(points){const a=points.sort((p,q)=>p[0]-q[0]||p[1]-q[1]),cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]),lo=[],hi=[];for(const p of a){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(let i=a.length-1;i>=0;i--){const p=a[i];while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}lo.pop();hi.pop();return lo.concat(hi);}
 function copyArt(art){if(!art?.image||!art.rect)return null;const r=art.rect,c=canvas(r[2],r[3]);c.getContext('2d').drawImage(art.image,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);return{...art,image:c,rect:[0,0,r[2],r[3],r[4],r[5]]};}
 function paintPart(context2,part,x,y,face,alpha=1,angle=0){
  if(!part.image)return;const w=part.image.width,h=part.image.height;context2.save();context2.globalAlpha*=alpha;context2.translate(Math.round(x-w/2)+w/2,Math.round(y-h/2)+h/2);if(angle===Math.PI||angle===-Math.PI)context2.scale(-1,-1);else if(angle)context2.rotate(angle);context2.scale(face?-1:1,1);context2.drawImage(part.image,-w/2,-h/2);context2.restore();
 }
 /** Anatomical cuts use source-pixel coordinates, never scaled/repainted pixels.
  * @param {{image:CanvasImageSource,rect:number[]}} art unmirrored native pose
  * @param {{head?:{x:number,y:number,rx:number,ry:number},neck?:number,hip?:number,cx?:number,halfTorso?:number}} anatomy
  * @returns {{art:object,parts:object[],pixelCount:number,labels:Uint8Array}}
  */
 function partition(art,anatomy={}){
  const fixed=copyArt(art);if(!fixed)throw new Error('Finisher requires a native sprite pose');
  const r=fixed.rect,w=r[2],h=r[3],g=fixed.image.getContext('2d',{willReadFrequently:true}),data=g.getImageData(0,0,w,h),labels=new Uint8Array(w*h);labels.fill(255);
  const head=anatomy.head||{x:w*.52,y:h*.12,rx:w*.17,ry:h*.13},neck=anatomy.neck??head.y+head.ry*.8,hip=anatomy.hip??h*.58,cx=anatomy.cx??w*.5,half=anatomy.halfTorso??Math.max(8,w*.19),bounds=PARTS.map(()=>[w,h,-1,-1]),counts=PARTS.map(()=>0);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data.data[(y*w+x)*4+3]){
   let id=5;const hd=((x-head.x)/(head.rx||1))**2+((y-head.y)/(head.ry||1))**2;
   if(hd<=1.25&&y<neck+head.ry*.45)id=0;
   else if(y>=hip)id=x<cx?3:4;
   else if(y>=neck-head.ry*.2&&(x<cx-half||x>cx+half))id=x<cx?1:2;
   labels[y*w+x]=id;counts[id]++;const b=bounds[id];b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);
  }
  const parts=PARTS.map((name,id)=>{
   const b=bounds[id];if(!counts[id])return{id,name,image:null,pixels:0,source:[0,0,0,0],pivot:[0,0]};
   const pw=b[2]-b[0]+1,ph=b[3]-b[1]+1,c=canvas(pw,ph),q=c.getContext('2d'),pixels=q.createImageData(pw,ph);
   for(let y=b[1];y<=b[3];y++)for(let x=b[0];x<=b[2];x++)if(labels[y*w+x]===id){const a=(y*w+x)*4,z=((y-b[1])*pw+x-b[0])*4;pixels.data.set(data.data.subarray(a,a+4),z);}
   const outline=[];for(let y=0;y<ph;y++){let left=pw,right=-1;for(let x=0;x<pw;x++)if(pixels.data[(y*pw+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}if(right>=left)for(const x of[left,right+1])for(const yy of[y,y+1])outline.push([x-pw/2,yy-ph/2]);}
   q.putImageData(pixels,0,0);return{id,name,image:c,pixels:counts[id],source:[b[0],b[1],pw,ph],pivot:[r[4]+b[0]+pw/2,r[5]+b[1]+ph/2],hull:hull(outline)};
  });
  return{art:fixed,parts,pixelCount:counts.reduce((a,b)=>a+b,0),labels};
 }
 /** @typedef {{enabled:boolean,scene:string,tick:number,phase:number,players:object[],room:{left:number,right:number},training?:boolean,keys?:number[],finalRound?:boolean}} Context */
 /**
  * Required host: context(), art(actor), prepare(winner,victim), pose(actor,name),
  * specials(actor), begin(actor,action,victim), animate(actor,move,age,victim),
  * position(actor,{x,y,face}), complete(winner,victim), fallback(winner,victim).
  * All positions passed to callbacks are world pixels, Y positive upwards.
  * begin returns {duration,contacts:number[],...nativeState}; animate may return
  * {done,contacts:number[],advance:false}. Contacts are move-local unique IDs;
  * normal descriptor contacts are original active-window start ticks.
  * Optional callbacks blood(array,victim), stain(victim,amount), impact(event),
  * anatomy(actor,art), fire(event), echo(winner,request), camera(winner,active),
  * banner(text), cleanup(reason,winner,victim), finishMove(actor,move),
  * recovered(victim):boolean, airOffset(winner,victim,action):number,
  * valid(actor,request), isCPU(actor), aborted(reason). Never simulate RNG here.
  */
 function create(host,options={}){
  if(typeof host?.context!=='function')throw new TypeError('Finisher host.context is required');
  const config={...LIMITS,...options};let state=null,lastTick=-1,serial=0;
  const context=()=>host.context();
  function active(){return !!state&&['ready','prompt','approach','combo','special','settle'].includes(state.phase);}
  function actors(){const c=context();return state?[c.players[state.winner],c.players[state.victim]]:[null,null];}
  function event(type,detail={}){if(!state)return;state.events.push({tick:context().tick,type,...detail});if(state.events.length>768)state.events.shift();}
  function clear(reason='reset',fallback=false){
   if(!state){lastTick=-1;return false;}const s=state,[w,d]=actors();state=null;lastTick=-1;
   try{host.camera?.(w,false);host.banner?.('');host.cleanup?.(reason,w,d,{fallback});}finally{if(fallback&&!s.completed)host.fallback(w,d,{...s.source,alreadyFinished:!!s.finalStrike});}
   return true;
  }
  function offer(victim,source={}){
   const c=context(),winner=c.players.find(p=>p.i!==victim.i);
   if(state||!c.enabled||c.scene!=='fight'||c.phase!==1||c.training||source.unblocked!==true||!winner||winner.HP<=0||victim.HP>0||!(c.finalRound??winner.WINS>=1))return false;
   const moves=host.specials(winner)||[];if(!moves.length)return false;
   state={id:++serial,phase:'ready',winner:winner.i,victim:victim.i,started:c.tick,phaseStart:c.tick,lastKeys:(c.keys?.[winner.i]??winner.KEYS??0)&ATTACK,inputBlocked:(c.keys?.[winner.i]??winner.KEYS??0)&ATTACK,lastInput:-1,moves:moves.map(m=>({...m})),request:null,move:null,stage:0,seen:new Set(),parts:null,remaining:null,removed:new Set(),pieces:[],emitters:[],trails:[],lastTrail:-1,bloodSerial:0,contacts:0,completed:false,victimPose:null,events:[],source:host.captureSource?.(winner,victim,source)||{...source},prepared:false,recoil:0};
   state.plan=comboPlan((c.seed??c.tick)>>>0,state.id);state.lastContact=-Infinity;event('offered',{targetHits:state.plan.hits,exceptional:state.plan.exceptional});return true;
  }
  function prepare(){
   const s=state,[w,d]=actors();host.prepare(w,d,s.source);host.pose(w,'idle');host.pose(d,'dizzy');
   s.victimPose=copyArt(host.art(d));s.parts=partition(s.victimPose,host.anatomy?.(d,s.victimPose));s.remaining=copyArt(s.victimPose);s.prepared=true;s.readyDuration=Math.max(config.ready,Math.min(300,host.recover?.(d)||0));
   const c=context();s.anchor={x:d.X/256,y:0,face:d.FACE};host.position(d,s.anchor);host.camera?.(w,true);event('prepared',{pixels:s.parts.pixelCount});
  }
  function request(slot,move,meta={}){
   const s=state,c=context();if(!s||s.phase!=='prompt'||slot!==s.winner||meta.fresh!==true||meta.serial===s.lastInput)return false;
   const own=s.moves.find(m=>m.index===move?.index&&(m.command||null)===(move?.command||null));if(!own||host.valid?.(c.players[slot],own)===false)return false;
   s.lastInput=meta.serial??c.tick;s.request={...own,strength:clamp(move.strength??own.strength??2,0,2)};s.phase='approach';s.phaseStart=c.tick;s.directionPrevious=(c.keys?.[slot]??c.players[slot].KEYS??0)&12;s.posture=s.requestedPosture='standing';host.start?.(c.players[slot]);host.banner?.('');event('triggered',{index:own.index,command:own.command||null});return true;
  }
  function input(slot,keys){
   const s=state;if(!s||slot!==s.winner)return false;const now=keys&ATTACK,prev=s.lastKeys;s.inputBlocked&=now;s.lastKeys=now;
   if(s.phase!=='prompt')return false;
   const move=s.moves.find(m=>m.mask&&(now===m.mask)&&((prev&m.mask)!==m.mask)&&!(s.inputBlocked&m.mask));
   return move?request(slot,move,{fresh:true,serial:context().tick}):false;
  }
  function selectCPU(){const s=state,[w]=actors();if(!host.isCPU?.(w))return;const own=s.moves.filter(m=>host.valid?.(w,m)!==false);if(own.length)request(w.i,own[hash(s.id,w.i)%own.length],{fresh:true,serial:context().tick});}
  function blood(point,count,power=1,vertical=1){
   const s=state,c=context(),[w,d]=actors();if(!host.blood)return;const dir=w.X<d.X?1:-1,packet=[];
   for(let i=0;i<Math.min(config.bloodPacket,count);i++){const h=hash(s.id*8191+s.bloodSerial++,i),u=(h&65535)/65535,v=(h>>>16)/65535;packet.push({x:point.x,y:Math.max(1,point.y),vx:dir*(.6+u*2.8)*power+(v-.5)*1.6,vy:(1.1+v*3.4)*power*vertical,size:i%5===0?2:1,tick:c.tick,color:COLORS[i%3],clothEligible:false,life:140});}
   host.blood(packet,d);
  }
  function cutPoint(part){const s=state,[,d]=actors(),custom=host.partPoint?.(d,part,s.parts);if(custom)return custom;const a=s.phase==='special'?{x:d.X/256,y:d.Y/256,face:d.FACE}:s.anchor,face=a.face?-1:1;return{x:a.x+face*part.pivot[0],y:a.y-part.pivot[1],face:a.face,angle:0};}
  function rebuild(){
   const s=state,r=s.victimPose.rect,w=r[2],h=r[3],g=s.remaining.image.getContext('2d'),src=s.victimPose.image.getContext('2d').getImageData(0,0,w,h);
   for(let k=0;k<s.parts.labels.length;k++)if(s.removed.has(s.parts.labels[k]))src.data[k*4+3]=0;
   g.putImageData(src,0,0);
  }
  function detach(names){
   const s=state,c=context(),[w]=actors(),dir=w.X/256<s.anchor.x?1:-1;
   for(const name of names){const part=s.parts.parts.find(p=>p.name===name);if(!part||s.removed.has(part.id))continue;s.removed.add(part.id);if(!part.image)continue;
    const p=cutPoint(part),h=hash(s.id,part.id),extent=Math.hypot(part.image.width,part.image.height)/2;
    if(s.pieces.length<config.pieces)s.pieces.push({part,x:p.x,y:p.y,face:p.face??s.anchor.face,vx:dir*(1.1+(h%15)/10)*(part.id%2?-1:1),vy:3.5+(h%20)/10,angle:p.angle||0,spin:((h%19)-9)/140,extent,bounces:0,rest:false,spawn:c.tick});
    if(s.emitters.length<config.emitters)s.emitters.push({x:p.x,y:p.y,start:c.tick,end:c.tick+66,last:-1,part:part.id});
    blood(p,20+part.id*2,1.35);event('detached',{part:name,pixels:part.pixels});
   }rebuild();
  }
  function contact(id,canFinish=true){
   const s=state,c=context(),special=s.stage===s.plan.buttons.length,key=s.stage+':'+id;if(s.seen.has(key)||s.stageContacts>0||special&&!canFinish||c.tick-s.lastContact<contactInterval())return;s.seen.add(key);s.contacts++;s.lastContact=c.tick;
   const [w,d]=actors(),a=s.parts.parts[0],p=host.mouth?.(d)||cutPoint(a);s.recoil=5;s.stageContacts++;
   const progress=s.stage/s.plan.buttons.length*6;blood(p,10+s.stage,1+progress*.11);host.stain?.(d,1+progress*.2);host.impact?.({winner:w,victim:d,button:s.plan.buttons[s.stage]??null,special,contact:id,sequence:s.contacts,progress:s.stage/s.plan.buttons.length});event('contact',{stage:s.stage,id,section:section(),winnerY:w.Y/256,victimY:d.Y/256});sampleTrail();const frames=s.plan.exceptional&&s.stage/s.plan.buttons.length>=.75?config.exceptionalHitstop:config.hitstop;s.hitstopUntil=c.tick+frames;s.normalBudget=0;event('hitstop',{frames,until:s.hitstopUntil});
   if(s.stage===5&&!s.controlled){s.launched=c.tick;event('launch');}
   if(s.stage===s.plan.buttons.length&&canFinish&&!s.finalStrike){s.finalStrike=true;s.trails.length=0;event('trails-stopped');host.finalImpact?.({winner:w,victim:d,request:s.request});detach(['arm-left','arm-right','leg-left','leg-right','head','torso']);host.fire?.({winner:w,victim:d,point:p,request:s.request});event('final-strike');}
  }
  function section(){if(state.controlled&&state.stage<state.plan.buttons.length)return state.posture==='airborne'?'air':state.posture;return state.stage<5?'ground':state.stage===5?'launch':state.stage<state.plan.buttons.length?'air':'special';}
  function contactInterval(){return state.plan.exceptional&&state.stage/state.plan.buttons.length>=.75?3:10;}
  function action(){const s=state;return s.stage<s.plan.buttons.length?{kind:'normal',button:s.plan.buttons[s.stage],section:section()}:{kind:'special',...s.request};}
  // Direction edges are sampled once per scene tick, before native moves consume KEYS.
  function steer(keys){
   const s=state,[w]=actors(),now=keys&12,pressed=now&~(s.directionPrevious??now);s.directionPrevious=now;
   if(!['approach','combo'].includes(s.phase)||host.isCPU?.(w)||pressed===12||!pressed)return;
   const current=s.controlled?s.requestedPosture:(section()==='air'?'airborne':'standing');
   s.controlled=true;s.requestedPosture=pressed&8?(current==='airborne'?'standing':'crouching'):(current==='crouching'?'standing':current==='standing'?'airborne':'airborne');
   event('posture-input',{posture:s.requestedPosture});
  }
  function applyPosture(){
   const s=state;if(!s.controlled||s.posture===s.requestedPosture)return;
   s.posture=s.requestedPosture;s.manualFlight={tick:context().tick,winner:actors()[0].Y/256,victim:actors()[1].Y/256};event('posture',{posture:s.posture});
  }
  function flight(){
   const s=state;
   if(s.controlled){
    const now=context().tick,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},f=s.manualFlight??{tick:now,winner:0,victim:0},age=now-f.tick;let winner,victim;
    if(s.posture==='airborne'){
     winner=age<28?f.winner+(96-f.winner)*ease(age/28):Math.max(0,96-.42*(age-28)-.0015*(age-28)**2);
     const offset=host.airOffset?.(...actors(),{kind:'normal',button:s.plan.buttons[s.stage]??0,section:'air'})??16;victim=winner+offset*ease(age/20);
     if(winner===0&&age>=28){s.requestedPosture='standing';if(s.phase==='approach')applyPosture();}
    }else{const t=1-ease(age/12);winner=f.winner*t;victim=f.victim*t;}
    if(s.stage===s.plan.buttons.length){s.landing??={tick:now,winner,victim};const t=1-ease((now-s.landing.tick)/32);return{winner:s.landing.winner*t,victim:s.landing.victim*t,aligned:true};}
    return{winner,victim,aligned:s.posture==='airborne'?age>=28:winner===0&&victim===0};
   }
   if(s.launched===undefined)return{winner:0,victim:0};const age=context().tick-s.launched,rise=clamp(age/28,0,1),ease=t=>t*t*(3-2*t);
   const victim=104*ease(rise)+8*Math.sin(Math.max(0,age-28)/20)*ease(rise),winner=88*ease(clamp((age-9)/24,0,1))+6*Math.sin(Math.max(0,age-33)/20)*ease(clamp((age-9)/24,0,1));
   if(s.stage===s.plan.buttons.length){s.landing??={tick:context().tick,winner,victim};const t=1-ease(clamp((context().tick-s.landing.tick)/32,0,1));return{winner:s.landing.winner*t,victim:s.landing.victim*t};}
   const offset=s.stage>5&&s.stage<s.plan.buttons.length?host.airOffset?.(...actors(),action())??16:16;
   if(s.flightTick!==context().tick){s.airOffset=(s.airOffset??16)+clamp(offset-(s.airOffset??16),-3,3);s.flightTick=context().tick;}
   return{winner:age>=38?victim-s.airOffset:winner,victim,aligned:Math.abs(s.airOffset-offset)<1};
  }
  function startMove(){
   const s=state,c=context(),[w,d]=actors(),next=action();s.stageContacts=0;s.phase=s.stage===s.plan.buttons.length?'special':'combo';
   const move=host.begin(w,next,d);if(!move||!Number.isFinite(move.duration)||move.duration<1){event('unsupported-move',{stage:s.stage});host.aborted?.('unsupported-move');clear('unsupported-move',true);return;}
   s.move={...move,duration:clamp(Math.ceil(move.duration),1,config.move),contacts:[...new Set(move.contacts||[])].filter(n=>Number.isInteger(n)&&n>=0&&n<=config.move).sort((a,b)=>a-b),started:c.tick,action:next};s.moveAge=0;s.phase=s.stage===s.plan.buttons.length?'special':'combo';event('move',{stage:s.stage,action:next.kind,section:next.section||'special',button:next.button??null,index:next.index??null});
  }
  function advanceMove(){
   const s=state,c=context(),[w,d]=actors();
   const move=s.move,age=s.moveAge,result=move.finishPending?{done:true,advance:false}:host.animate(w,move,age,d)||{};
   for(const id of result.contacts||[])contact('native:'+id);
   for(const t of move.contacts)if(t===age)contact('window:'+t);
   if(!state)return;
   if(result.advance!==false)s.moveAge++;
   if(result.done||s.moveAge>=move.duration){
    if(c.tick<(s.hitstopUntil||0)){move.finishPending=true;return;}
    host.finishMove?.(w,move);if(!s.stageContacts||s.stage===s.plan.buttons.length&&!s.finalStrike){const reason=s.stage===s.plan.buttons.length?'missing-special-contact':'missing-normal-contact';event(reason);host.aborted?.(reason);clear(reason,true);return;}
    if(s.stage<s.plan.buttons.length){s.stage++;s.phase='approach';s.phaseStart=c.tick;}else{s.phase='settle';s.phaseStart=c.tick;host.pose(w,'win');event('settle');}
   }
  }
  function sampleTrail(){
   const s=state,c=context(),[w]=actors();s.trails=s.trails.filter(t=>c.tick-t.tick<config.trailLife);
   if(s.finalStrike||!s.contacts||s.lastTrail>=0&&c.tick-s.lastTrail<10)return;s.lastTrail=c.tick;const art=host.art(w);if(!art?.image)return;
   const fixed=copyArt(art),black=canvas(fixed.image.width,fixed.image.height),g=black.getContext('2d');g.drawImage(fixed.image,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,black.width,black.height);
   s.trails.push({image:fixed.image,black,rect:fixed.rect,x:w.X/256,y:w.Y/256,face:w.FACE,tick:c.tick});if(s.trails.length>config.trails)s.trails.shift();
  }
  function effects(){
   const s=state,c=context(),room=c.room;
   for(const p of s.pieces)if(!p.rest){p.x+=p.vx;p.y+=p.vy;p.vy-=.24;p.angle+=p.spin;const sin=Math.sin(p.angle),cos=Math.cos(p.angle),sign=p.face?-1:1,extent=Math.max(...p.part.hull.map(q=>sin*q[0]*sign+cos*q[1]));
    if(p.y<=extent){p.y=extent;if(p.bounces<2&&Math.abs(p.vy)>1.2){p.vy=-p.vy*.28;p.vx*=.65;p.spin*=.55;p.bounces++;blood({x:p.x,y:2},4,.4);}else{p.vx=p.vy=p.spin=0;p.rest=true;}}
    if(room){const inset=Math.min(p.extent,(room.right-room.left)/4);if(p.x<room.left+inset||p.x>room.right-inset){p.x=clamp(p.x,room.left+inset,room.right-inset);p.vx*=-.35;}}
   }
   for(const e of s.emitters)if(c.tick<e.end&&c.tick-e.last>=5){e.last=c.tick;const part=s.pieces.find(p=>p.part.id===e.part);blood(part?{x:part.x,y:Math.max(2,part.y)}:e,4,.75,1.3);}
   s.emitters=s.emitters.filter(e=>c.tick<e.end);sampleTrail();
  }
  function step0(){
   if(!state)return false;const c=context();if(lastTick===c.tick)return active();lastTick=c.tick;
   if(!c.enabled||!['fight','win'].includes(c.scene)){clear(!c.enabled?'edition':'scene');return false;}
   const s=state,[w,d]=actors();if(!w||!d){clear('actors');return false;}
   if(!s.completed&&w.HP<=0){clear('winner-ko');return false;}
   if(!s.prepared)prepare();
   if(!state)return false;
   if(s.completed){effects();return false;}
   if(c.scene!=='fight'){clear('unexpected-scene');return false;}
   if(c.tick-s.started>config.sequence){host.aborted?.('watchdog');clear('watchdog',true);return false;}
   if(s.phase==='ready')host.recoverStep?.(d);
   if(s.phase==='ready'&&c.tick-s.phaseStart>=s.readyDuration&&host.recovered?.(d)!==false){s.anchor.x=d.X/256;host.stun?.(d);s.phase='prompt';s.phaseStart=c.tick;host.banner?.('FINISH THEM');event('prompt');}
   if(s.phase==='ready'){host.input?.(w,s.phase);host.promptMove?.(w,d,{ready:true});}
   if(s.phase==='prompt'){
    if(c.keys)input(w.i,c.keys[w.i]||0);
    if(state?.phase==='prompt')host.input?.(w,s.phase);
    if(state?.phase==='prompt')host.promptMove?.(w,d);
    if(state?.phase==='prompt'&&c.tick-s.phaseStart>=config.cpu)selectCPU();
    if(state?.phase==='prompt'&&c.tick-s.phaseStart>=config.prompt){event('timeout');clear('timeout',true);return false;}
   }
   steer(c.keys?.[w.i]??w.KEYS??0);
   // Contact holds use the physical scene clock, never the accelerated move budget.
   if(c.tick<(s.hitstopUntil||0)){
    host.hitstop?.(w,d,{remaining:s.hitstopUntil-c.tick,finalStrike:!!s.finalStrike});
    if(s.launched!==undefined)s.launched++;if(s.manualFlight)s.manualFlight.tick++;if(s.landing)s.landing.tick++;
    host.camera?.(w,!s.completed,{victim:d,phase:s.phase,section:section(),launched:s.launched!==undefined});effects();return active();
   }
   // Retain the scene clock. Real normal substeps can accelerate, but admission
   // of the next contact remains gated by the 10/3-tick cadence. The selected
   // special advances once per tick, including its native projectiles/grabs.
   if(state&&['approach','combo'].includes(state.phase)){
    const progress=s.stage/Math.max(1,s.plan.buttons.length-1),speed=s.plan.exceptional&&progress>=.75?8:comboPace(progress);s.normalSpeed=speed;s.normalBudget=(s.normalBudget||0)+speed;
    let steps=Math.min(8,Math.floor(s.normalBudget));s.normalBudget-=steps;
    while(state&&steps-->0&&['approach','combo'].includes(state.phase)){
     if(s.phase==='approach'){
      applyPosture();const next=action(),f=flight(),dir=w.X/256<s.anchor.x?1:-1,target=s.anchor.x-dir*(host.gap?.(w,d,next)??44),x=w.X/256,delta=target-x,travel=4+6*progress*progress;
      host.position(w,{x:x+clamp(delta,-travel,travel),y:f.winner,face:dir>0?1:0});host.pose(w,f.winner>0?'jump':s.controlled&&s.posture==='crouching'?'crouch':Math.abs(delta)>travel?'walk':'idle');
      host.position(d,{...s.anchor,y:f.victim});
      const flightReady=s.controlled?(s.stage===s.plan.buttons.length?f.winner===0:f.aligned):s.stage<=5||(s.stage<s.plan.buttons.length?c.tick-s.launched>=38&&f.aligned:f.winner===0);
      if(Math.abs(delta)<=travel&&c.tick-s.lastContact>=contactInterval()&&flightReady){s.anchor.face=dir>0?0:1;startMove();}
     }else advanceMove();
     if(state&&c.tick<(s.hitstopUntil||0))break;
    }
   }else if(state?.phase==='special')advanceMove();
   if(state?.phase==='settle'&&c.tick-s.phaseStart>=config.settle){s.completed=true;s.completedAt=c.tick;s.phase='result';host.banner?.('');host.camera?.(w,false);event('complete');host.complete(w,d);}
   if(state){if(s.recoil>0)s.recoil--;const dir=w.X/256<s.anchor.x?1:-1,f=flight();if(['combo','approach'].includes(s.phase)&&(s.controlled||s.stage>5))host.position(w,{x:w.X/256,y:f.winner,face:w.FACE});if(host.lockVictim?.(w,d,s.phase)!==false&&s.phase!=='ready')host.position(d,{...s.anchor,y:f.victim,x:s.anchor.x+dir*s.recoil});host.camera?.(w,!s.completed,{victim:d,phase:s.phase,section:section(),launched:s.launched!==undefined});effects();}
   return active();
  }
  function step(){try{return step0();}catch(error){const reason='host-error:'+String(error?.message||error);try{host.aborted?.(reason);}finally{if(state)clear(reason,true);}return false;}}
  function art(actor,base){
   const s=state;if(!s?.prepared||actor.i!==s.victim||['ready','prompt'].includes(s.phase))return base;
   return host.remainingArt?.(actor,s.remaining||base)||s.remaining||base;
  }
  function draw(ctx,camera,ground,layer='back'){
   const s=state;if(!s?.prepared)return;const c=context();ctx.save();ctx.imageSmoothingEnabled=false;
   if(layer==='back'){
    for(const t of s.trails){const age=clamp((c.tick-t.tick)/config.trailLife,0,1),r=t.rect,drift=(t.face?-1:1)*age*config.trailDrift,x=t.x+drift;
     ctx.save();ctx.translate(Math.round(x-camera),Math.round(ground-t.y));ctx.scale(t.face?-1:1,1);ctx.drawImage(t.image,r[0],r[1],r[2],r[3],r[4],r[5],r[2],r[3]);ctx.globalAlpha*=Math.min(1,age*2.5);ctx.drawImage(t.black,r[4],r[5]);ctx.restore();}
   }
   else for(const p of s.pieces)paintPart(ctx,p.part,p.x-camera,ground-p.y,p.face,1,p.angle);
   ctx.restore();
  }
  function info(){if(!state)return{active:false,phase:'idle'};const s=state,c=context();return{active:active(),id:s.id,phase:s.phase,section:section(),posture:s.controlled?s.posture:(section()==='air'?'airborne':'standing'),requestedPosture:s.requestedPosture,controlled:!!s.controlled,exceptional:s.plan.exceptional,contactInterval:contactInterval(),winner:s.winner,victim:s.victim,age:c.tick-s.started,stage:s.stage,moveAge:s.moveAge??0,hitstop:Math.max(0,(s.hitstopUntil||0)-c.tick),contacts:s.contacts,targetHits:s.plan.hits,normalSpeed:s.normalSpeed??.8,normalOrder:s.plan.buttons.slice(),request:s.request?{...s.request}:null,parts:s.pieces.map(p=>({name:p.part.name,pixels:p.part.pixels,x:p.x,y:p.y,rest:p.rest})),removed:[...s.removed].map(id=>PARTS[id]),trails:s.trails.length,emitters:s.emitters.length,completed:s.completed,sourcePixels:s.parts?.pixelCount||0,events:s.events.map(e=>({...e}))};}
  function notify(winner,victim,id,meta={}){if(!active()||!state||!['combo','special'].includes(state.phase)||winner.i!==state.winner||victim.i!==state.victim)return false;contact('actual:'+id,meta.final!==false);return true;}
  function fragmentBounds(){return state?.pieces.map(p=>{const sin=Math.sin(p.angle),cos=Math.cos(p.angle),sign=p.face?-1:1,points=p.part.hull.map(q=>[p.x+cos*q[0]*sign-sin*q[1],p.y-sin*q[0]*sign-cos*q[1]]);return{left:Math.min(...points.map(q=>q[0])),right:Math.max(...points.map(q=>q[0])),bottom:Math.min(...points.map(q=>q[1])),top:Math.max(...points.map(q=>q[1]))};})||[];}
  function blocksRound(){if(!active())return false;const[w]=actors();if(w?.HP<=0){clear('winner-ko');return false;}return true;}
  function trailState(){return state?.trails.map(t=>{const age=clamp((context().tick-t.tick)/config.trailLife,0,1);return{tick:t.tick,origin:t.x,x:t.x+(t.face?-1:1)*age*config.trailDrift,y:t.y,face:t.face,age,darkness:Math.min(1,age*2.5)};})||[];}
  function view(){return state?{winner:state.winner,victim:state.victim,phase:state.phase,age:context().tick-state.started,completed:state.completed,completedAt:state.completedAt??null}:null;}
  return{offer,request,input,notify,step,art,draw,clear,info,view,active,blocksRound,fragmentBounds,trailState,sourceArt:actor=>state?.prepared&&actor.i===state.victim&&!['ready','prompt'].includes(state.phase)?state.victimPose:null,hidden:actor=>!!state?.finalStrike&&actor.i===state.victim,owns:actor=>active()&&!!state&&[state.winner,state.victim].includes(actor.i),isVictim:actor=>active()&&!!state&&state.victim===actor.i,retained:()=>!!state?.completed};
 }
 return{VERSION,LIMITS,PARTS,BUTTONS,comboPlan,comboPace,create,partition,paintPart};
})();
