/* AI scenery outside the native camera: selected imagegen extensions, no gameplay. */
'use strict';
window.SF2AISCENE=(()=>{
 const image=new Image(),roof=new Image(),crest=new Image(),indiaWall=new Image(),indiaTop=new Image();
 const ready=Promise.all([[image,'room-extensions'],[roof,'ryu-roof'],[crest,'ryu-crest'],[indiaWall,'india-wall'],[indiaTop,'india-native-top']].map(([im,name])=>new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI scenery artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'128');}))).then(a=>a.every(Boolean));
 const indiaFloors=new Map();
 const shadedImages=new WeakMap(),shadedRecent=[];
 function nativeShade(im,filter){
  let cache=shadedImages.get(im);if(!cache){cache=new Map();shadedImages.set(im,cache);}
  if(cache.has(filter)){const index=shadedRecent.findIndex(e=>e.cache===cache&&e.key===filter);if(index>=0)shadedRecent.push(...shadedRecent.splice(index,1));return cache.get(filter);}
  const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;if(!c.width||!c.height)return null;
  const x=c.getContext('2d');x.filter=filter;x.drawImage(im,0,0);cache.set(filter,c);shadedRecent.push({cache,key:filter});if(shadedRecent.length>16){const old=shadedRecent.shift();old.cache.delete(old.key);}return c;
 }
 const indiaWalls=new Map();
 function wallFrame(filter){
  if(indiaWalls.has(filter))return indiaWalls.get(filter);
  const filtered=source=>{if(filter==='none')return source;const c=document.createElement('canvas');c.width=source.naturalWidth;c.height=source.naturalHeight;const x=c.getContext('2d');x.filter=filter;x.drawImage(source,0,0);return c;};
  const wall=filtered(indiaWall),top=filtered(indiaTop),cap=document.createElement('canvas');cap.width=cap.height=128;cap.getContext('2d').drawImage(wall,64,64,128,128,0,0,128,128);
  const out={wall,top,cap};if(indiaWalls.size>=8)indiaWalls.delete(indiaWalls.keys().next().value);indiaWalls.set(filter,out);return out;
   }
 function floorImage(filter){
  if(indiaFloors.has(filter))return indiaFloors.get(filter);
  const source=SF2CESTAGESCROLL.layerImage(7,0);if(!source?.complete)return null;
  const c=document.createElement('canvas');c.width=source.naturalWidth;c.height=source.naturalHeight;const x=c.getContext('2d');x.filter=filter;x.drawImage(source,0,0);
  if(indiaFloors.size>=8)indiaFloors.delete(indiaFloors.keys().next().value);indiaFloors.set(filter,c);return c;
 }
 function india(ctx,cam,width,top,height,registration,filter){
  if(!indiaWall.complete||!indiaWall.naturalWidth||!indiaTop.complete||!indiaTop.naturalWidth)return;
  const logical=registration?.camera??cam,inset=registration?.inset||0,source=window.SF2CESTAGESCROLL.mapX(7,0,logical,-32)-inset;
  const dy=registration?.y||0,origin=-768+dy,bottom=256+dy;
  const frame=wallFrame(filter);ctx.filter='none';
  // One source-registered wall, using the native 1024-pixel map coordinates.
  // Original small drapes/columns remain on top; no room-sized atlas scaling.
  ctx.save();ctx.beginPath();ctx.rect(0,top,width,Math.max(0,224+dy-top));ctx.clip();
  const core=-source,ratio=indiaWall.naturalWidth/1024;
  ctx.drawImage(frame.wall,core,origin,1024,1024);ctx.drawImage(frame.top,core,-48+dy,1024,16);
  // Beyond the source room, extend its plain sidewall material. Repeating the
  // whole map would introduce another shrine and more elephants at high zoom.
  for(let x=core-160;x+160>0;x-=160)ctx.drawImage(frame.wall,32*ratio,0,160*ratio,indiaWall.naturalHeight,x,origin,160,1024);
  for(let x=core+1024;x<width;x+=160)ctx.drawImage(frame.wall,32*ratio,0,160*ratio,indiaWall.naturalHeight,x,origin,160,1024);
  if(top<origin){
   const s=1024/indiaWall.naturalWidth;ctx.save();ctx.translate(-source,origin);ctx.scale(s,s);ctx.fillStyle=ctx.createPattern(frame.cap,'repeat');ctx.fillRect(source/s,(top-origin)/s,width/s,(origin-top)/s);ctx.restore();
  }
   ctx.restore();
  const floorSource=window.SF2CESTAGESCROLL.mapX(7,0,logical,223)-inset;
  const rowRate=(window.SF2CESTAGESCROLL.mapX(7,0,logical,223)-window.SF2CESTAGESCROLL.mapX(7,0,logical,215))/8;
  const floor=floorImage(filter);ctx.save();ctx.filter='none';
  if(floor)for(let y=Math.max(top,224+dy);y<top+height;y++){
   const depth=y-dy,sourceDepth=206+((Math.floor(depth)-224)%16),scale=(depth-144)/(sourceDepth-144),vanish=640-floorSource-rowRate*(depth-223),left=vanish-640*scale,right=left+1024*scale,sy=32+sourceDepth;
   // Reuse native stone rows, projecting their single carpet from the native
   // vanishing point. Outside the map, extend stone only, never another carpet.
   ctx.drawImage(floor,0,sy,1024,1,left,y,1024*scale,1);
   const stone=64*scale;
   for(let x=left-stone;x+stone>0;x-=stone)ctx.drawImage(floor,64,sy,64,1,x,y,stone,1);
   for(let x=right;x<width;x+=stone)ctx.drawImage(floor,896,sy,64,1,x,y,stone,1);
  }
  ctx.restore();
 }
 function draw(ctx,stage,cam,width,top,height,room,filter,registration){
  if(!image.complete||!image.naturalWidth)return;
  const sw=image.naturalWidth/3,sh=image.naturalHeight/4,sx=(stage%3)*sw,sy=Math.floor(stage/3)*sh,span=room.right-room.left;
  ctx.save();ctx.filter=filter;
  if(stage===7){india(ctx,cam,width,top,height,registration,filter);ctx.restore();return;}
  // Fixed world-space panel: the native scene remains on top at its original coordinates.
  const worldHeight=span*1.5,origin=200-worldHeight*2/3,bottom=origin+worldHeight;
  for(let x=room.left+Math.floor((cam-room.left)/span)*span;x<cam+width;x+=span){
   const dx=x-cam;ctx.drawImage(image,sx+1,sy+1,sw-2,sh-2,dx,origin,span,worldHeight);
   if(top<origin)ctx.drawImage(image,sx+1,sy+1,sw-2,1,dx,top,span,origin-top);
   if(top+height>bottom)ctx.drawImage(image,sx+1,sy+sh-2,sw-2,1,dx,bottom,span,top+height-bottom);
  }
  ctx.restore();
 }
 function ryuFloor(ctx,cam,width){
  if(!image.complete||!image.naturalWidth)return;const sw=image.naturalWidth/3,sh=image.naturalHeight/4;
  for(let x=Math.floor(cam/768)*768;x<cam+width;x+=768)ctx.drawImage(image,1,sh*.75,sw-2,sh*.25-1,x-cam,width>384?160:176,768,width>384?160:144);
 }
 function ryuRoof(ctx,x0){
  if(!roof.complete||!roof.naturalWidth)return;
  // Source landmark alignment: native cut column563 spans Y11..158;
  // generated column1600 spans Y65..516 in the2172x724 selected output.
  ctx.save();ctx.beginPath();ctx.rect(558-x0,-32,400,256);ctx.clip();ctx.drawImage(roof,89.2-x0,-10.3,645.084,237.472);ctx.restore();
 }
 function ryuCrest(ctx,x){if(crest.complete&&crest.naturalWidth)ctx.drawImage(crest,x-80,-327,1024*2/9,1536*2/9);}
 return{ready,draw,ryuFloor,ryuRoof,ryuCrest,nativeShade,get loaded(){return[image,roof,crest,indiaWall,indiaTop].every(im=>im.complete&&im.naturalWidth>0);}};
})();
