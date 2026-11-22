/* AI scenery outside the native camera: selected imagegen extensions, no gameplay. */
'use strict';
window.SF2AISCENE=(()=>{
 const image=new Image(),roof=new Image(),crest=new Image();
 const ready=Promise.all([[image,'room-extensions'],[roof,'ryu-roof'],[crest,'ryu-crest']].map(([im,name])=>new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI scenery artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'125');}))).then(a=>a.every(Boolean));
 const indiaTiles=new Map();
 function indiaTile(sx,sy,sw,sh,filter){
  if(indiaTiles.has(filter))return indiaTiles.get(filter);
  const c=document.createElement('canvas');c.width=sw-2;c.height=sh-2;
  const x=c.getContext('2d');x.filter=filter;x.drawImage(image,sx+1,sy+1,sw-2,sh-2,0,0,c.width,c.height);
  if(indiaTiles.size>=8)indiaTiles.delete(indiaTiles.keys().next().value);indiaTiles.set(filter,c);return c;
 }
 function india(ctx,source,cam,width,top,height,room,registration){
  // The atlas is artwork at roughly native pixel density, not a room-wide mural.
  // Its twelve-pixel column shafts match the native twelve/fourteen-pixel shafts.
  const w=source.width,h=source.height,origin=-152+(registration?.y||0),ceiling=114;
  const camera=(registration?.x??cam),anchor=168;
  for(let n=Math.floor((camera-anchor)/w);anchor+n*w<camera+width;n++){
   const x=anchor+n*w-camera;
   ctx.save();ctx.translate(x+(n&1?w:0),0);if(n&1)ctx.scale(-1,1);
   ctx.drawImage(source,0,0,w,h,0,origin,w,h);
   // Repeat complete vault bays at the same pixel density above the captured
   // room. Mirroring at their boundaries avoids stretching a single edge row.
   for(let row=1;origin-row*ceiling+ceiling>top;row++){
    ctx.save();ctx.translate(0,origin-row*ceiling+(row&1?ceiling:0));if(row&1)ctx.scale(1,-1);
    ctx.drawImage(source,0,0,w,ceiling,0,0,w,ceiling);ctx.restore();
   }
   if(top+height>origin+h)ctx.drawImage(source,0,h-1,w,1,0,origin+h,w,top+height-origin-h);
   ctx.restore();
  }
  // The perspective floor is one room-wide carpet, rather than a new carpet
  // under every architectural bay. Keep its vanishing point at room centre.
  const span=room.right-room.left,floorY=224+(registration?.y||0),fullHeight=span*1.5,fullTop=200+(registration?.y||0)-fullHeight*2/3;
  ctx.save();ctx.beginPath();ctx.rect(0,floorY,width,Math.max(0,top+height-floorY));ctx.clip();
  for(let x=room.left+Math.floor((cam-room.left)/span)*span;x<cam+width;x+=span)ctx.drawImage(source,0,0,w,h,x-cam,fullTop,span,fullHeight);
  ctx.restore();
 }
 function draw(ctx,stage,cam,width,top,height,room,filter,registration){
  if(!image.complete||!image.naturalWidth)return;
  const sw=image.naturalWidth/3,sh=image.naturalHeight/4,sx=(stage%3)*sw,sy=Math.floor(stage/3)*sh,span=room.right-room.left;
  ctx.save();ctx.filter=filter;
  if(stage===7){ctx.filter='none';india(ctx,indiaTile(sx,sy,sw,sh,filter),cam,width,top,height,room,registration);ctx.restore();return;}
  // Fixed world-space panel: the native scene remains on top at its original coordinates.
  const panelWidth=span,worldHeight=span*1.5,origin=200-worldHeight*2/3,bottom=origin+worldHeight;
  for(let x=room.left+Math.floor((cam-room.left)/panelWidth)*panelWidth;x<cam+width;x+=panelWidth){
   const dx=x-cam;ctx.drawImage(image,sx+1,sy+1,sw-2,sh-2,dx,origin,panelWidth,worldHeight);
   if(top<origin)ctx.drawImage(image,sx+1,sy+1,sw-2,1,dx,top,panelWidth,origin-top);
   if(top+height>bottom)ctx.drawImage(image,sx+1,sy+sh-2,sw-2,1,dx,bottom,panelWidth,top+height-bottom);
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
 return{ready,draw,ryuFloor,ryuRoof,ryuCrest,get loaded(){return[image,roof,crest].every(im=>im.complete&&im.naturalWidth>0);}};
})();
