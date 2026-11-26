/* AI scenery outside the native camera: selected imagegen extensions, no gameplay. */
'use strict';
window.SF2AISCENE=(()=>{
 const image=new Image(),roof=new Image(),crest=new Image(),indiaWall=new Image(),indiaTop=new Image(),chinaFront=new Image(),chinaFar=new Image();
 const materials=[];for(const d of window.SF2AISTAGEMATERIALDATA||[])materials[d.stage]={...d,images:{}};
 const ready=Promise.all([...[[image,'room-extensions'],[roof,'ryu-roof'],[crest,'ryu-crest'],[indiaWall,'india-wall'],[indiaTop,'india-native-top'],[chinaFront,'china-foreground'],[chinaFar,'china-far']].map(([im,name])=>new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI scenery artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'130');})),...materials.flatMap(d=>['floor','ceiling','wall','top'].filter(k=>d[k]).map(k=>new Promise(resolve=>{const im=d.images[k]=new Image();im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI native material failed to load',d.stage,k);resolve(false);};im.src=d[k];}))) ]).then(a=>a.every(Boolean));
 const indiaFloors=new Map();
 const shadedImages=new WeakMap(),shadedRecent=[];
 function nativeShade(im,filter,revision=null){
  let cache=shadedImages.get(im);if(!cache){cache=new Map();shadedImages.set(im,cache);}
  const cached=cache.get(filter),index=shadedRecent.findIndex(e=>e.cache===cache&&e.key===filter);
  if(cached?.revision===revision){if(index>=0)shadedRecent.push(...shadedRecent.splice(index,1));return cached.image;}
  const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;if(!c.width||!c.height)return null;
  const x=c.getContext('2d');x.filter=filter;x.drawImage(im,0,0);cache.set(filter,{image:c,revision});if(index>=0)shadedRecent.splice(index,1);shadedRecent.push({cache,key:filter});if(shadedRecent.length>16){const old=shadedRecent.shift();old.cache.delete(old.key);}return c;
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
 function materialFill(ctx,im,x,y,left,top,width,height){
  if(!im?.complete||!im.naturalWidth||height<=0)return;
  ctx.save();ctx.translate(x,y);ctx.fillStyle=ctx.createPattern(im,'repeat');ctx.fillRect(left-x,top-y,width,height);ctx.restore();
 }
 function chinaFloor(ctx,cam,inset,width,top,height,dy,coverageInset=inset,panorama=false){
  const map=SF2CESTAGESCROLL,source=map.layerImage(5,2),filter=ctx.filter;
  if(!source?.complete)return;
  const im=filter==='none'?source:nativeShade(source,filter),rate=(map.mapX(5,2,cam,223)-map.mapX(5,2,cam,215))/8;
  ctx.save();ctx.filter='none';
  // Native scroll2 paving is completely opaque from160 through223. Only
  // exposed zoom padding and rows below that original crop need an underlay.
  const start=Math.max(top,160+dy),end=Math.min(top+height,224+dy),nativeRight=coverageInset+Math.min(width,768);
  ctx.beginPath();ctx.rect(0,Math.max(top,224+dy),width,Math.max(0,top+height-Math.max(top,224+dy)));
  if(end>start){if(coverageInset>0)ctx.rect(0,start,coverageInset,end-start);if(nativeRight<width)ctx.rect(Math.max(0,nativeRight),start,width-Math.max(0,nativeRight),end-start);}ctx.clip();
  for(let y=Math.max(top,Math.ceil(160+dy));y<top+height;y++){
   if(y<224+dy&&coverageInset<=0&&nativeRight>=width)continue;
   const depth=y-dy,sourceDepth=206+((Math.floor(depth)-224)%16+16)%16,scale=(depth-128)/(sourceDepth-128);
   const sx=depth<=223?map.mapX(5,2,cam,Math.floor(depth)):map.mapX(5,2,cam,223)+rate*(depth-223);
   const viewScale=panorama?map.view(5,2,cam,width,Math.min(223,Math.floor(depth))).scale:1,left=(512-sx-512*scale)*viewScale+inset,right=left+1024*scale*viewScale,tile=64*scale*viewScale;
   ctx.drawImage(im,0,sourceDepth+32,1024,1,left,y,1024*scale*viewScale,1);
   for(let x=left-tile;x+tile>0;x-=tile)ctx.drawImage(im,0,sourceDepth+32,64,1,x,y,tile,1);
   for(let x=right;x<width;x+=tile)ctx.drawImage(im,960,sourceDepth+32,64,1,x,y,tile,1);
  }
  ctx.restore();
 }
 function nativeMaterials(ctx,stage,cam,width,top,height,registration){
  const d=materials[stage];if(!d)return;
  const logical=registration?.camera??cam,inset=registration?.inset||0,dy=stage===5?SF2CECAMERA.offset(5,2):(registration?.y||0);
  ctx.fillStyle='rgb('+d.sky.join(',')+')';ctx.fillRect(0,top,width,height);
  // Texture samples retain original pixel density. They contain only material,
  // never a second room, carpet, temple, storefront or enlarged landmark.
  materialFill(ctx,d.images.wall,-cam,dy,0,top,width,Math.min(top+height,d.floorY+dy)-top);
  materialFill(ctx,d.images.ceiling,-cam,dy+(d.source.ceiling?.y||0),0,top,width,Math.min(top+height,-32+dy)-top);
  if(stage===5)chinaFloor(ctx,logical,inset+(registration?.viewOffset||0),width,top,height,dy,inset,registration?.panorama);
  else materialFill(ctx,d.images.floor,-cam,dy+d.floorY,0,Math.max(top,d.floorY+dy),width,top+height-Math.max(top,d.floorY+dy));
  if(stage===5){
   const map=window.SF2CESTAGESCROLL,farY=SF2CECAMERA.offset(5,1),frontY=SF2CECAMERA.offset(5,2);
   // The receding lane follows native layer3, not the foreground's row scroll.
   const sampleInset=inset+(registration?.viewOffset||0),farView=registration?.panorama?map.view(5,1,logical,width,-32):null,frontView=registration?.panorama?map.view(5,2,logical,width,-32):null,farScale=farView?.scale||1,frontScale=frontView?.scale||1,far=(256-(farView?.source??map.mapX(5,1,logical,-32)))*farScale+sampleInset,front=-(frontView?.source??map.mapX(5,2,logical,-32))*frontScale+sampleInset;
   const filter=ctx.filter,farFrame=filter==='none'?chinaFar:nativeShade(chinaFar,filter),frontFrame=filter==='none'?chinaFront:nativeShade(chinaFront,filter);
   ctx.save();ctx.filter='none';ctx.beginPath();ctx.rect(0,top,width,Math.max(0,d.floorY+frontY-top));ctx.clip();ctx.drawImage(farFrame,far,-768+farY,1024*farScale,1024);ctx.restore();
   // Admit only new roof caps above the source cut. Existing people, signs,
   // pole, original facades and paving always come from the native planes.
   ctx.save();ctx.filter='none';ctx.beginPath();ctx.rect(0,top,width,Math.max(0,-48+frontY-top));ctx.clip();ctx.drawImage(frontFrame,front,-768+frontY,1024*frontScale,1024);ctx.restore();ctx.drawImage(d.images.top,front,-48+frontY,1024*frontScale,16);
  }
 }
 const kenSkyCaps=new WeakMap();
 function kenHarbour(ctx,cam,width,top,registration){
  const base=window.SF2?.VER.ce?.sti[4][1];if(!base?.complete)return;
  const im=SF2CECAMERA.image(4,1,base,0),dy=SF2CECAMERA.offset(4,1),edge=-16+dy;
  const logical=Math.max(0,Math.min(384,registration?.camera??cam));
  // The recovered sky/sea plane spans source X132..695. Frame that complete
  // harbour as one panorama at wide zoom, including its single distant boat.
  // Dock paving retains its original row scroll in stageLayer.
  const sourceWidth=Math.min(width,564),source=Math.min(696-sourceWidth,Math.round(132+logical/384*(564-sourceWidth)));
  ctx.drawImage(im,source,16,sourceWidth,176,0,edge,width,176);
  if(top<edge){
   // Reflect the matching sky edge, removing the distant flag from the cap
   // so the added headroom never contains an upside-down second boat/flag.
   let sky=kenSkyCaps.get(im);if(!sky){sky=document.createElement('canvas');sky.width=564;sky.height=48;const g=sky.getContext('2d');g.drawImage(im,132,16,564,48,0,0,564,48);g.clearRect(456,0,44,48);g.drawImage(im,460,16,44,48,456,0,44,48);kenSkyCaps.set(im,sky);}
   ctx.save();ctx.translate(0,edge);ctx.scale(1,-1);
   ctx.drawImage(sky,source-132,0,sourceWidth,48,0,0,width,edge-top);ctx.restore();
  }
 }
 function guileSky(ctx,cam,width,top,registration){
  const map=window.SF2CESTAGESCROLL,im=map?.layerImage(3,0);
  if(!im?.complete||!im.naturalWidth)return;
  const edge=-32+(registration?.y||0),height=edge-top;
  if(height<=0)return;
  // Continue the native sky's upper edge at its own parallax coordinates.
  // The generic painted extension has a different sunset and makes a seam.
  const source=map.mapX(3,0,registration?.camera??cam,-32)-(registration?.inset||0);
  let sx=((source%im.naturalWidth)+im.naturalWidth)%im.naturalWidth,dx=0;
  while(dx<width){const w=Math.min(im.naturalWidth-sx,width-dx);ctx.drawImage(im,sx,0,w,1,dx,top,w,height);dx+=w;sx=0;}
 }
 function draw(ctx,stage,cam,width,top,height,room,filter,registration){
  if(!image.complete||!image.naturalWidth)return;
  const sw=image.naturalWidth/3,sh=image.naturalHeight/4,sx=(stage%3)*sw,sy=Math.floor(stage/3)*sh,span=room.right-room.left;
  ctx.save();ctx.filter=filter;
  if(stage===7){india(ctx,cam,width,top,height,registration,filter);ctx.restore();return;}
  if(stage===5){nativeMaterials(ctx,stage,cam,width,top,height,registration);ctx.restore();return;}
  // Fixed world-space panel: the native scene remains on top at its original coordinates.
  const worldHeight=span*1.5,origin=200-worldHeight*2/3,bottom=origin+worldHeight;
  for(let x=room.left+Math.floor((cam-room.left)/span)*span;x<cam+width;x+=span){
   const dx=x-cam;ctx.drawImage(image,sx+1,sy+1,sw-2,sh-2,dx,origin,span,worldHeight);
   if(top<origin)ctx.drawImage(image,sx+1,sy+1,sw-2,1,dx,top,span,origin-top);
   if(top+height>bottom)ctx.drawImage(image,sx+1,sy+sh-2,sw-2,1,dx,bottom,span,top+height-bottom);
  }
  if(stage===4)kenHarbour(ctx,cam,width,top,registration);
  if(stage===3)guileSky(ctx,cam,width,top,registration);
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
 return{ready,draw,ryuFloor,ryuRoof,ryuCrest,nativeShade,get loaded(){return !!materials[5]&&[image,roof,crest,indiaWall,indiaTop,chinaFront,chinaFar,...materials.flatMap(d=>Object.values(d.images))].every(im=>im.complete&&im.naturalWidth>0);}};
})();
