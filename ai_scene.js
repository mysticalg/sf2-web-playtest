/* AI scenery outside the native camera: selected imagegen extensions, no gameplay. */
'use strict';
window.SF2AISCENE=(()=>{
 const image=new Image(),roof=new Image(),crest=new Image();
 const ready=Promise.all([[image,'room-extensions'],[roof,'ryu-roof'],[crest,'ryu-crest']].map(([im,name])=>new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI scenery artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'125');}))).then(a=>a.every(Boolean));
 function draw(ctx,stage,cam,width,top,height,room,filter){
  if(!image.complete||!image.naturalWidth)return;
  const sw=image.naturalWidth/3,sh=image.naturalHeight/4,sx=(stage%3)*sw,sy=Math.floor(stage/3)*sh,span=room.right-room.left;
  ctx.save();ctx.filter=filter;
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
 return{ready,draw,ryuFloor,ryuRoof,ryuCrest,get loaded(){return[image,roof,crest].every(im=>im.complete&&im.naturalWidth>0);}};
})();
