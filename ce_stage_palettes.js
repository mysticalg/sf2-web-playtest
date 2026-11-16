/* Original CE Las Vegas palette actors and complete integer-camera scroll schedules. */
'use strict';
(()=>{
 const D=window.SF2CESTAGEPALETTEDATA;if(!D)throw Error('Native stage palette data missing');
 let origin=null;const layers=D.layers.map(d=>({...d,ready:false,key:null,canvas:null}));
 const ready=Promise.all(layers.map(async layer=>{const image=new Image();image.src=layer.image;await image.decode();const c=document.createElement('canvas');c.width=layer.width;c.height=layer.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);const bytes=x.getImageData(0,0,c.width,c.height).data;layer.indices=new Uint16Array(c.width*c.height);for(let i=0;i<layer.indices.length;i++)layer.indices[i]=bytes[4*i]*16+bytes[4*i+1];layer.ready=true;}));
 function phaseAt(a,elapsed){const t=Math.max(0,Math.floor(elapsed));return t<a.timer?-1:(a.next+Math.floor((t-a.timer)/a.period))%a.colors.length;}
 function paletteAt(a,elapsed){const phase=phaseAt(a,elapsed);return phase<0?a.current:a.colors[phase];}
 function reset(){origin=null;for(const layer of layers)layer.key=null;}
 function image(layer,elapsed){
  const actors=D.controllers.filter(a=>a.bank===layer.nativeLayer),key=actors.map(a=>phaseAt(a,elapsed)).join(',');if(layer.key===key)return layer.canvas;
  const palette=layer.palette.slice();for(const a of actors)palette[a.palette]=paletteAt(a,elapsed);
  const lut=new Uint32Array(512);for(let p=0;p<32;p++)for(let n=0;n<15;n++){const c=palette[p][n];lut[p*16+n]=(255<<24)|(c[2]<<16)|(c[1]<<8)|c[0];}
  const pixels=new ImageData(layer.width,layer.height),rgba=new Uint32Array(pixels.data.buffer);for(let i=0;i<rgba.length;i++)rgba[i]=lut[layer.indices[i]];
  const canvas=document.createElement('canvas');canvas.width=layer.width;canvas.height=layer.height;canvas.getContext('2d').putImageData(pixels,0,0);layer.key=key;layer.canvas=canvas;return canvas;
 }
 function draw(ctx,stage,index,cam,tick){
  if(stage!==D.stage)return false;const layer=layers.find(a=>a.index===index);if(!layer?.ready)return false;if(origin===null)origin=tick;
  const im=image(layer,tick-origin),camera=layer.cameras[Math.max(0,Math.min(384,cam|0))];
  for(const[row0,y1,shift]of camera.rows){const y0=row0===0?-(layer.top||0):row0;let sx=((camera.x+64+shift)%layer.width+layer.width)%layer.width,dx=0;while(dx<384){const width=Math.min(layer.width-sx,384-dx);ctx.drawImage(im,sx,y0+(layer.top||0),width,y1-y0,dx,y0,width,y1-y0);dx+=width;sx=0;}}
  return true;
 }
 window.SF2CESTAGEPALETTES={ready,phaseAt,paletteAt,lampPhase:elapsed=>phaseAt(D.spainLamp,elapsed),reset,draw,data:D,scope:'Las Vegas14 native palette loops; captured neutral-cycle phase; original integer-camera domain0..384.'};
})();
