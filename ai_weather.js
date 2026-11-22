/* Custom AI presentation. No combat RNG, native audio requests or actor state. */
'use strict';
window.SF2AIWEATHER=(()=>{
 const outdoors=new Set([0,2,3,4,5,8,9,10]);
 const names=['CLEAR','RAIN','THUNDERSTORM'];
 let last=null,active=null;
 const buffers=new WeakMap();
 function sample(stage,round,seed,tick){
  const level=Math.max(0,Math.min(2,(round||1)-1)),kind=outdoors.has(stage)?level:0;
  const offset=SF2AIRULES.hash(seed||0,'weather:'+stage)%90,clock=Math.max(0,tick|0),phase=(clock+offset)%600;
  const flash=kind===2?(phase>=180&&phase<184?0.22:phase>=190&&phase<196?0.12:0):0;
  return{kind,name:names[kind],level,clock,phase,flash,strike:Math.floor((clock+offset)/600),thunder:kind===2&&phase===212};
 }
 function rain(ctx,s,seed,cam,width){
  if(!s.kind)return;
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,224);ctx.clip();ctx.globalAlpha=s.kind===2?0.65:0.5;ctx.fillStyle='#b7dcf0';
  const count=s.kind===2?224:128,stroke=Math.max(1,Math.ceil(width/384));
  for(let i=0;i<count;i++){
   const h=SF2AIRULES.hash(seed||0,'rain:'+i),y=((h>>>12)+s.clock*(s.kind===2?9:7))%256-16;
   const world=((h&65535)-s.clock*(s.kind===2?3:2))%768,x=(world+768)%768-Math.floor(cam);
   for(let d=0;d<(s.kind===2?9:6);d++)ctx.fillRect(Math.floor(x-d/3),y+d,stroke,1);
  }
  ctx.restore();
 }
 function stop(){if(active){try{active.stop();}catch{}active=null;}last=null;}
 function sound(s,seed,round,stage,ac,master,muted){
  if(!s.thunder||!ac||!master||muted||ac.state!=='running')return false;
  const key=[seed,round,stage,s.strike].join(':');if(last===key)return false;last=key;
  let buffer=buffers.get(ac);
  if(!buffer){
   buffer=ac.createBuffer(1,Math.floor(ac.sampleRate*2.4),ac.sampleRate);const data=buffer.getChannelData(0);let n=0x534632;
   for(let i=0;i<data.length;i++){n^=n<<13;n^=n>>>17;n^=n<<5;data[i]=(n>>>0)/2147483648-1;}buffers.set(ac,buffer);
  }
  if(active){try{active.stop();}catch{}}
  const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain(),t=ac.currentTime;
  source.buffer=buffer;filter.type='lowpass';filter.frequency.value=420;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(0.16,t+0.08);gain.gain.exponentialRampToValueAtTime(0.001,t+2.3);
  source.connect(filter);filter.connect(gain);gain.connect(master);active=source;
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();if(active===source)active=null;};source.start();return true;
 }
 return{outdoors,sample,rain,sound,stop};
})();
