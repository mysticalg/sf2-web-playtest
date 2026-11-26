/* Original Final Fight chair artwork; authored AI Edition prop adaptation.
   Chair state advances only from simulation, never from sprite queries. */
'use strict';
window.SF2AIFFChair=(()=>{
 const data={"image":"ai-ff/belger-chair.png","frames":[[1,1,84,79,-42,-77],[87,1,77,49,-38,-46],[166,1,46,31,-23,-28],[214,1,41,31,-20,-28]],"source":"https://spritedatabase.net/file/21522","sourceImage":"https://spritedatabase.net/files/arcade/608/Sprite/final_fight_obj.png","credit":"Original Capcom Final Fight arcade art; Objects sheet ripped by jin315","sourceSHA256":"1d0491e2d6fd17e42173ca00a9d349ac0b967bfb78662fc49dbbce20d7847714","proof":[{"name":"intact","sourceRect":[16,303,100,382],"rgbaSHA256":"2d63ab92baaf43191f000257ecef3d1ca0f47d733903b82a13d02f2f05905b7e","opaquePixels":3955},{"name":"body","sourceRect":[115,333,192,382],"rgbaSHA256":"cd3b34c386e80086f39d9bb67c986f16ffd4bd3284a01f84e5988d7b9d995681","opaquePixels":2031},{"name":"wheel-flat","sourceRect":[207,351,253,382],"rgbaSHA256":"e60963df7e65353e1876cfa603ed2a1abeabed37963078b091817329cdef9478","opaquePixels":1088},{"name":"wheel-tilt","sourceRect":[267,351,308,382],"rgbaSHA256":"2893f9668618d3258556f7108ece941e5430423a89722324391dbde9b301846c","opaquePixels":694}]},image=new Image();image.src=data.image+'?v='+(window.SF2BUILD?.commit||'ff-chair-1');const ready=image.decode();
 const guest=p=>p.aiProfile==='belger';
 function clear(p){delete p.AIFFChair;delete p.AIFFDismounted;}
 function reset(p){clear(p);if(guest(p))p.AIFFChair={phase:'mounted',x:p.X/256,face:p.FACE,hp:p.HP,age:0,breaks:0,pieces:[],tick:null};}
 function ensure(p){if(!guest(p))return null;if(!p.AIFFChair)reset(p);return p.AIFFChair;}
 function breakChair(p,direction){const s=ensure(p);if(!s||s.phase==='broken')return false;const dir=direction||((p.opp?.X??p.X)>p.X?-1:1);s.phase='broken';s.breaks++;s.brokenAt=s.age;p.AIFFDismounted=true;
  s.pieces=[{frame:1,x:s.x,y:28,vx:dir*1.2,vy:3.8,bounces:0,rest:false},{frame:2,x:s.x+8,y:4,vx:dir*2.4,vy:4.8,bounces:0,rest:false},{frame:3,x:s.x-12,y:2,vx:-dir*1.6,vy:3.5,bounces:0,rest:false}];return true;
 }
 function step(p,room,tick){const s=ensure(p);if(!s)return;
  if(s.phase!=='broken'){
   const seated=bodyFrame(p)<=6;
   if(s.phase==='mounted'){
    if(p.Y>0||!seated)s.phase='parked';
    else if(p.Y===0){s.x=p.X/256;s.face=p.FACE;}
   }else if(p.Y===0&&p.ST===0&&seated){
    const dx=p.X/256-s.x;if(Math.abs(dx)<=12){s.x+=Math.max(-2,Math.min(2,dx));if(Math.abs(dx)<=2){s.x=p.X/256;s.face=p.FACE;s.phase='mounted';}}
   }
   if(p.HP<s.hp&&p.ST!==6||[7,8].includes(p.ST))breakChair(p);s.hp=p.HP;
  }
  if(tick!==undefined&&s.tick===tick)return;s.tick=tick;s.age++;
  if(s.phase!=='broken')return;
  for(const q of s.pieces){if(q.rest)continue;q.x+=q.vx;q.y+=q.vy;q.vy-=.23;q.vx*=.985;
   if(room){const low=room.left+24,high=room.right-24;if(q.x<low||q.x>high){q.x=Math.max(low,Math.min(high,q.x));q.vx=-q.vx*.5;}}
   if(q.y<=0){q.y=0;if(q.bounces++===0&&Math.abs(q.vy)>.8){q.vy=Math.abs(q.vy)*.28;q.vx*=.55;}else{q.rest=true;q.vx=q.vy=0;}}
  }
 }
 function dismounted(p){return guest(p)&&(p.AIFFChair&&p.AIFFChair.phase!=='mounted'||!!p.AIFFDismounted);}
 function frame(p,index){return dismounted(p)&&index<=6?(p.Y>0?8:7):index;}
 function bodyFrame(p){return p.anim?.guest?p.anim.ents[Math.min(p.aidx,p.anim.ents.length-1)]?.[0]:0;}
 function paint(ctx,index,x,y,face,camera,ground){const r=data.frames[index];ctx.save();ctx.translate(Math.round(x-camera),Math.round(ground-y));if(face)ctx.scale(-1,1);ctx.drawImage(image,...r.slice(0,4),r[4],r[5],r[2],r[3]);ctx.restore();}
 function draw(ctx,p,camera,ground){const s=p.AIFFChair;if(!guest(p)||!s)return;ctx.save();ctx.imageSmoothingEnabled=false;
  if(s.phase!=='broken'){if(s.phase==='parked'||bodyFrame(p)>=7)paint(ctx,0,s.x,0,s.face,camera,ground);}else for(const q of s.pieces)paint(ctx,q.rest?q.frame:q.frame>1?2+Math.floor(s.age/3)%2:q.frame,q.x,q.y,s.face,camera,ground);
  ctx.restore();
 }
 return{data,ready,clear,reset,step,breakChair,dismounted,frame,draw};
})();
