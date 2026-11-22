/* Original native tile maps and CPS-A row-scroll schedules, with no fitted patch coordinates. */
'use strict';
(()=>{
 const D=window.SF2CESTAGESCROLLDATA,decode=src=>{const im=new Image();im.src=src;return im;},stages=new Map(D.stages.map(s=>[s.stage,{...s,layers:s.layers.map(l=>({...l,im:decode(l.image)})),shiftImage:decode(s.rowShifts),tail:s.tail?{...s.tail,im:decode(s.tail.image)}:null,props:(s.props||[]).map(p=>({...p,im:decode(p.image)}))}]));
 const ready=Promise.all([...stages.values()].flatMap(s=>[s.shiftImage.decode(),...s.layers.map(l=>l.im.decode()),...(s.tail?[s.tail.im.decode()]:[]),...s.props.map(p=>p.im.decode())])).then(()=>{
  for(const s of stages.values()){
   const c=document.createElement('canvas');c.width=256;c.height=385;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(s.shiftImage,0,0);const pixels=x.getImageData(0,0,256,385).data;s.rows=[];
   for(let cam=0;cam<=384;cam++){const rows=[];for(let y=-32;y<224;y++){const i=(cam*256+y+32)*4,w=(pixels[i]<<8)|pixels[i+1],v=w>=32768?w-65536:w;if(rows.length&&rows[rows.length-1][2]===v)rows[rows.length-1][1]=y+1;else rows.push([y,y+1,v]);}s.rows.push(rows);}
  }
 });
 let origin=null,lastStage=-1;
 function reset(){origin=null;lastStage=-1;}
 function advance(stage,tick){if(lastStage!==stage||origin===null||tick<origin){lastStage=stage;origin=tick;}}
 const camera=cam=>Math.max(0,Math.min(384,Math.floor(cam)));
 function mapX(stage,index,cam,y=-32){
  const s=stages.get(stage),l=s?.layers.find(l=>l.index===index);if(!s?.rows||!l)return null;
  const c=camera(cam),row=l.nativeLayer===2?s.rows[c].find(r=>y>=r[0]&&y<r[1]):null;
  return((s.cameras[c][l.nativeLayer]+64+(row?.[2]||0))%l.width+l.width)%l.width;
 }
 function view(stage,index,cam,width,y=-32){
  const s=stages.get(stage),l=s?.layers.find(l=>l.index===index);if(!s?.rows||!l)return null;
  const left=camera(cam),right=camera(cam+Math.max(0,width-384));
  const raw=c=>s.cameras[c][l.nativeLayer]+64+(l.nativeLayer===2?(s.rows[c].find(r=>y>=r[0]&&y<r[1])?.[2]||0):0);
  const source=raw(left),sourceWidth=width+raw(right)-source-(right-left);
  return{source,sourceWidth,scale:width/sourceWidth,leftCamera:left,rightCamera:right};
 }
 function draw(ctx,stage,index,cam,tick,width=384,viewOffset=0,panorama=false){
  const s=stages.get(stage);if(!s?.rows)return false;const c=camera(cam);advance(stage,tick);const age=Math.max(0,Math.floor(tick-origin));
  if(stage===2&&index>=3&&s.props.length){if(index===3){const view=window.SF2CECAMERA?.state,outer=window.SF2CECAMERA?.offset(stage,index)||0,wide=window.SF2?.edition==='ai';for(const p of s.props){if(!wide&&!p.visible[c])continue;const dy=(p.mode===4?(view?.far||0)>>16:p.mode===2?(view?.near||0)>>16:view?.main||0)-outer;ctx.drawImage(p.im,p.x-p.cameras[c]+p.left+viewOffset,240-p.y+p.top+dy);}}return true;}

  if(s.tail?.index===index){const t=s.tail;ctx.drawImage(t.im,t.x-t.cameras[c]+t.left+viewOffset,240-t.y+t.top);return true;}
  const l=s.layers.find(l=>l.index===index);if(!l)return false;
  const im=SF2CESTAGEANIMATIONS.nativeLayer(stage,index,l.im,tick,cam);let rows=l.nativeLayer===2?s.rows[c]:[[-32,224,0]];
  if(panorama&&width>384&&l.nativeLayer===2){
   // Either endpoint can change its row scroll at a band boundary. The source
   // union must therefore split on both schedules, even if the left is flat.
   const right=camera(cam+width-384),edges=[...new Set([...rows,...s.rows[right]].flatMap(r=>[r[0],r[1]]))].sort((a,b)=>a-b);
   rows=edges.slice(0,-1).map((y,i)=>[y,edges[i+1],0]);
  }
  for(const[y0,y1,shift]of rows){if(panorama&&width>384){const v=view(stage,index,cam,width,y0);let sx=((v.source-viewOffset)%l.width+l.width)%l.width,dx=0,remaining=v.sourceWidth;while(remaining>0){const sw=Math.min(l.width-sx,remaining),dw=sw*v.scale;ctx.drawImage(im,sx,y0+32,sw,y1-y0,dx,y0,dw,y1-y0);dx+=dw;remaining-=sw;sx=0;}continue;}let sx=((s.cameras[c][l.nativeLayer]+(s.wind?.layer===l.nativeLayer?s.wind.offsets[age%s.wind.period]-s.wind.offsets[s.wind.atCameraSample]:0)+64+shift-viewOffset)%l.width+l.width)%l.width,dx=0;while(dx<width){const w=Math.min(l.width-sx,width-dx);ctx.drawImage(im,sx,y0+32,w,y1-y0,dx,y0,w,y1-y0);dx+=w;sx=0;}}
  return true;
 }
 const layerImage=(stage,index)=>stages.get(stage)?.layers.find(l=>l.index===index)?.im;
 window.SF2CESTAGESCROLL={ready,reset,advance,draw,mapX,view,layerImage,data:D};
})();
