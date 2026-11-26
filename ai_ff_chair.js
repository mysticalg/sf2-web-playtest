/* Belger: original FF 0x50644/0x5078e dismount, 0x55196 chair and 0x56388 debris.
   SF2 health ratio, input and contact adaptations are recorded in FF-BOSSES.md. */
'use strict';
window.SF2AIFFChair=(()=>{
 const pack=SF2AIFFData.belger,native=pack.nativeRecovery,data=native.chair,frames=pack.frames,image=new Image();
 image.src=pack.image+'?v='+(window.SF2BUILD?.commit||'belger-native-1');const ready=image.decode(),guest=p=>p.aiProfile==='belger';
 const word=n=>n<<16>>16,flash=[1,0,0,1,0,0,1,0,1,0,1,1,1,1,1,1];
 function clear(p){delete p.AIFFChair;delete p.AIFFDismounted;}
 function reset(p){clear(p);if(guest(p))p.AIFFChair={phase:'mounted',x:p.X/256,face:p.FACE,hp:p.HP,maxHP:p.maxHP||320,age:0,breaks:0,pieces:[],tick:null,contactSerial:[]};window.SF2AIFF?.belgerSync?.(p);}
 function ensure(p){if(!guest(p))return null;if(!p.AIFFChair)reset(p);return p.AIFFChair;}
 function dismounted(p){return guest(p)&&!!p.AIFFDismounted;}
 function dismount(p,reason='health'){const s=ensure(p);if(!s||dismounted(p))return false;s.phase='intact';s.x=p.X/256;s.face=p.FACE;s.dismountAt=s.age;s.reason=reason;s.contactSerial[p.i]=p.AIAttackSerial??0;if(p.opp)s.contactSerial[p.opp.i]=p.opp.AIAttackSerial??0;p.AIFFDismounted=true;window.SF2AIFF?.belgerSync?.(p);return true;}
 function grabbed(p){return !!(p.AIFFHeld||p.CETHV||p.CEHHV||p.CEBV||p.opp?.THV&&p.opp.ST===11&&p.ST===5);}
 function sync(p){const s=ensure(p);if(!s)return;
  if(!dismounted(p)){
   s.x=p.X/256;s.face=p.FACE;
   if(grabbed(p))dismount(p,'grab');
   else if(p.HP<s.hp&&p.ST!==6&&p.HP<=s.maxHP/2&&!p.AIFinishProtected)dismount(p,'health');
   else if(p.ST===2&&p.Y>0)dismount(p,'jump');
   else if(p.HP<=0&&!p.AIFinishProtected)dismount(p,'ko');
  }s.hp=p.HP;
 }
 function breakChair(p,direction=1){const s=ensure(p);if(!s||s.phase!=='intact')return false;
  const dir=direction<0?-1:1;s.phase='broken';s.breaks++;s.brokenAt=s.age;s.body={x:s.x,y:32,vx:dir*512,vy:512,gravity:72,phase:2,timer:50,face:s.face,bounces:0};
  s.pieces=data.fragments.map((q,index)=>({...q,index,phase:0,delay:index&1,x:s.x,y:0,dir,visible:false,animation:0,animationTick:0,age:0}));return true;
 }
 function bodyStep(b,room){
  if(!b||b.removed)return;if(--b.timer<0){b.removed=true;return;}if(!b.started){b.started=true;return;}
  if(b.phase===6){const before=b.vx;b.vx=before>0?Math.max(0,before-16):Math.min(0,before+16);b.x+=b.vx/256;if(!b.vx)b.removed=true;}
  else{b.vy=word(b.vy-b.gravity);b.x+=b.vx/256;b.y+=b.vy/256;
   if(Math.floor(b.y)<=0){b.y=0;b.bounces++;if(b.phase===2){b.phase=4;b.vx=Math.sign(b.vx||1)*256;b.vy=384;}else{b.phase=6;b.vx=Math.sign(b.vx||1)*256;}}
  }
  if(room&&(b.x<room.left-48||b.x>room.right+48))b.removed=true;
 }
 function pieceStep(q){
  if(q.removed)return;q.age++;
  if(!q.phase){if(q.delay-->0)return;q.phase=1;q.vx*=q.dir;q.drag*=q.dir;return;}
  if(q.phase===1){q.phase=2;const offset=data.offsets[q.index+(q.vx<0?10:0)];q.x=Math.floor(q.x)+offset[0];q.y=offset[1];q.animationIndex=0;q.remaining=data.fragmentActions[q.action][0][1];return;}
  if(--q.timer<0){q.removed=true;q.visible=false;return;}
  q.vy=word(q.vy-q.gravity);q.vx=word(q.vx-q.drag);q.x+=q.vx/256;q.y+=q.vy/256;
  const seq=data.fragmentActions[q.action];if(--q.remaining===0){q.animationIndex=(q.animationIndex+(q.facing?-1:1)+seq.length)%seq.length;q.remaining=seq[q.animationIndex][1];}q.visible=q.timer>=16||!!flash[q.timer];
 }
 function step(p,room,tick,options={}){const s=ensure(p);if(!s)return;sync(p);if(tick!==undefined&&s.tick===tick)return;s.tick=tick;
  if(options.advance===false)return;s.age++;
  if(s.phase==='broken'){bodyStep(s.body,room);s.pieces.forEach(pieceStep);if(s.body?.removed&&s.pieces.every(q=>q.removed))s.phase='gone';}
 }
 function overlap(a,b){return !!a&&Math.abs(a[0]-b[0])<=a[2]+b[2]&&Math.abs(a[1]-b[1])<=a[3]+b[3];}
 function contacts(players,box,projectiles,impact){
  for(const owner of players){const s=owner.AIFFChair;if(s?.phase!=='intact')continue;const hurt=[s.x,35,21,37];
   for(const p of players){
    const serial=p.AIAttackSerial??0,normal=[1,11].includes(p.ST)||p.ST===2&&p.JA;
    if(normal&&!(p.MV?.kind==='throw')&&s.contactSerial[p.i]!==serial&&overlap(box(p),hurt)){
     s.contactSerial[p.i]=serial;if(breakChair(owner,p.FACE?1:-1))impact?.(s.x,37,p);break;
    }
    for(const q of projectiles(p)||[]){if(q.hit||!overlap(q.box,hurt))continue;if(breakChair(owner,q.dir||1)){q.consume();impact?.(s.x,37,p);}break;}
    if(s.phase!=='intact')break;
   }
  }
 }
 function frameAt(seq,t){const duration=seq.reduce((n,e)=>n+e[1],0);let n=((t%duration)+duration)%duration;for(const[f,d]of seq){if(n<d)return f;n-=d;}return seq[0][0];}
 function paint(ctx,frame,x,y,face,camera,ground){const r=frames[frame];ctx.save();ctx.translate(Math.round(x-camera),Math.round(ground-y));if(face)ctx.scale(-1,1);ctx.drawImage(image,...r.slice(0,4),r[4],r[5],r[2],r[3]);ctx.restore();}
 function draw(ctx,p,camera,ground){const s=p.AIFFChair;if(!guest(p)||!s)return;ctx.save();ctx.imageSmoothingEnabled=false;
  if(s.phase==='intact')paint(ctx,frameAt(data.intact,s.age-s.dismountAt),s.x,0,s.face,camera,ground);
  if(s.phase==='broken'){if(s.body&&!s.body.removed&&(s.body.timer>=16||flash[s.body.timer]))paint(ctx,data.body,s.body.x,s.body.y,s.body.face,camera,ground);for(const q of s.pieces)if(q.visible&&!q.removed)paint(ctx,data.fragmentActions[q.action][q.animationIndex][0],q.x,q.y,q.facing?0:1,camera,ground);}
  ctx.restore();
 }
 return{data,ready,clear,reset,sync,step,dismount,dismounted,breakChair,contacts,frameAt,bodyStep,pieceStep,draw};
})();
