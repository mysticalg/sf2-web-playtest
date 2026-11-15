/* Literal original-CE plane object0x2e,0x23f7c..0x24110. */
'use strict';
(()=>{
 const D=window.SF2CEWORLDDATA;if(!D)throw new Error('Original CE world-map data missing');
 const cache=new Map(),pending=[];
 function image(url){if(cache.has(url))return cache.get(url);const i=new Image();i.src=url;cache.set(url,i);pending.push(i.decode());return i;}
 for(const v of [D.background,D.backgroundObjects,D.selectBackground,D.selectObjects,...D.planes,D.marker,D.cursor,D.corners].filter(Boolean))image(v.img);
 const ready=Promise.all(pending);
 function angle(dx,dy){
  if(dy===0)return dx<0?192:64;
  if(dx===0)return dy<0?128:0;
  const x=Math.abs(dx),y=Math.abs(dy),sign=(dx<0?2:0)+(dy<0?1:0);
  if(x===y)return D.diagonals[sign];
  const ratio=Math.floor(Math.min(x,y)*32/Math.max(x,y))&31,base=D.quadrants[sign+(y<x?4:0)];
  return ((base&254)+(base&1?-ratio:ratio))&255;
 }
 const direction=(dx,dy)=>((angle(dx,dy)+2)&255)>>>2;
 function init(from,to,{playerFid=from}={}){
  if(![from,to,playerFid].every(i=>Number.isInteger(i)&&i>=0&&i<12))throw new RangeError('CE map fighters must be0..11');
  const [x,y]=D.positions[from],[tx,ty]=D.positions[to],dir=direction(tx-x,ty-y);
  return {from,to,playerFid,X:x<<8,Y:y<<8,targetX:tx,targetY:ty,direction:dir,orientation:(dir+1)>>>3,
   phase:from===to?'arrived':'wait',timer:50,tick:0,arrivalTick:from===to?0:null,visible:false,done:false};
 }
 function step(s){
  const out={sound:[],arrived:false,done:s.done};if(s.done)return out;s.tick++;
  if(s.phase==='wait'){
   if(--s.timer===0){s.phase='flight';out.sound.push(0x3d);}return out;
  }
  if(s.phase==='flight'){
   const dx=s.targetX-(s.X>>8),dy=s.targetY-(s.Y>>8);s.direction=direction(dx,dy);s.visible=true;
   if(Math.abs(dx)<=3&&Math.abs(dy)<=3){s.phase='arrived';s.timer=50;s.arrivalTick=s.tick;out.arrived=true;}
   else{const v=D.velocity[s.direction];s.X+=v[0];s.Y+=v[1];}return out;
  }
  if(s.phase==='arrived'){
   if(s.from!==s.to){s.timer=(s.timer-1)&255;if(s.timer===0)out.sound.push(D.countrySound[s.to]);}
   //0x89c6 observes arrival on the next frame, then counts60 further ticks.
   if(s.tick-s.arrivalTick>=61){s.done=true;out.done=true;}
  }
  return out;
 }
 function part(ctx,v,x=0,y=0,kind='object',filter=i=>i){if(!v)return;const i=image(v.img);if(i.complete&&i.naturalWidth){const painted=filter(i,kind);if(painted)ctx.drawImage(painted,x+(v.x||0),y+(v.y||0));}}
 const GRID=[0,1,2,3,10,11,4,5,6,7,9,8];
 function draw(ctx,s,{selection=true,image:filter=i=>i}={}){
  part(ctx,D.background,0,0,'scroll',filter);
  part(ctx,D.backgroundObjects,0,0,'object',filter);
  if(selection){const f=window.SF2SCRCE?.f?.[s.playerFid];if(f){part(ctx,f.selL,0,0,'scroll',filter);part(ctx,f.name,0,0,'object',filter);part(ctx,f.flag,0,0,'object',filter);}
   part(ctx,D.corners,0,0,'object',filter);const pos=GRID.indexOf(s.playerFid);part(ctx,D.cursor,96+(pos%6)*32,128+Math.floor(pos/6)*32,'object',filter);
   const [x,y]=D.positions[s.playerFid];part(ctx,D.marker,x,240-y,'object',filter);
  }
  if(s.visible&&s.from!==s.to)part(ctx,D.planes[s.orientation],s.X>>8,240-(s.Y>>8),'object',filter);
 }
 function drawSelectBackground(ctx,{image:filter=i=>i}={}){if(!D.selectBackground||!D.selectObjects)return false;part(ctx,D.selectBackground,0,0,'scroll',filter);part(ctx,D.selectObjects,0,0,'object',filter);return true;}
 window.SF2CEWORLDMAP={init,step,draw,drawSelectBackground,ready,angle,direction,data:D,source:D.source};
})();
