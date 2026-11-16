/* Original native tile maps and CPS-A row-scroll schedules, with no fitted patch coordinates. */
'use strict';
(()=>{
 const D=window.SF2CESTAGESCROLLDATA,decode=src=>{const im=new Image();im.src=src;return im;},stages=new Map(D.stages.map(s=>[s.stage,{...s,layers:s.layers.map(l=>({...l,im:decode(l.image)})),shiftImage:decode(s.rowShifts),tail:s.tail?{...s.tail,im:decode(s.tail.image)}:null}]));
 const ready=Promise.all([...stages.values()].flatMap(s=>[s.shiftImage.decode(),...s.layers.map(l=>l.im.decode()),...(s.tail?[s.tail.im.decode()]:[])])).then(()=>{
  for(const s of stages.values()){
   const c=document.createElement('canvas');c.width=256;c.height=385;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(s.shiftImage,0,0);const pixels=x.getImageData(0,0,256,385).data;s.rows=[];
   for(let cam=0;cam<=384;cam++){const rows=[];for(let y=-32;y<224;y++){const i=(cam*256+y+32)*4,w=(pixels[i]<<8)|pixels[i+1],v=w>=32768?w-65536:w;if(rows.length&&rows[rows.length-1][2]===v)rows[rows.length-1][1]=y+1;else rows.push([y,y+1,v]);}s.rows.push(rows);}
  }
 });
 let origin=null,lastStage=-1;
 function reset(){origin=null;lastStage=-1;}
 function advance(stage,tick){if(lastStage!==stage||origin===null||tick<origin){lastStage=stage;origin=tick;}}
 const camera=cam=>Math.max(0,Math.min(384,Math.floor(cam)));
 function draw(ctx,stage,index,cam,tick){
  const s=stages.get(stage);if(!s?.rows)return false;const c=camera(cam);advance(stage,tick);const age=Math.max(0,Math.floor(tick-origin));
  if(s.tail?.index===index){const t=s.tail;ctx.drawImage(t.im,t.x-t.cameras[c]+t.left,240-t.y+t.top);return true;}
  const l=s.layers.find(l=>l.index===index);if(!l)return false;
  const im=SF2CESTAGEANIMATIONS.nativeLayer(stage,index,l.im,tick,cam),rows=l.nativeLayer===2?s.rows[c]:[[-32,224,0]];
  for(const[y0,y1,shift]of rows){let sx=((s.cameras[c][l.nativeLayer]+(s.wind?.layer===l.nativeLayer?s.wind.offsets[age%s.wind.period]-s.wind.offsets[s.wind.atCameraSample]:0)+64+shift)%l.width+l.width)%l.width,dx=0;while(dx<384){const w=Math.min(l.width-sx,384-dx);ctx.drawImage(im,sx,y0+32,w,y1-y0,dx,y0,w,y1-y0);dx+=w;sx=0;}}
  return true;
 }
 window.SF2CESTAGESCROLL={ready,reset,advance,draw,data:D};
})();
