/* Custom AI presentation. No combat RNG, native audio requests or actor state. */
'use strict';
window.SF2AIWEATHER=(()=>{
 const outdoors=new Set([0,2,3,4,5,8,9,10]);
 const names=['CLEAR','RAIN','THUNDERSTORM','SNOW'];
 const cold=new Set([3]);
 const lightCache=new Map();
 const images={};
 const ready=typeof Image==='undefined'?Promise.resolve(true):Promise.all(['particles-lights','ryu-skies'].map(name=>new Promise(resolve=>{
  const im=new Image();images[name]=im;im.onload=()=>{lightCache.clear();resolve(true);};im.onerror=()=>{console.error('AI weather artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'124');
 }))).then(values=>values.every(Boolean));
 function sprite(ctx,cell,x,y,w,h,alpha=1){
  const im=images['particles-lights'];if(!im?.complete||!im.naturalWidth)return;
  // Verified source rectangles, normalized to 1280: avoid neighboring wisps in generated gutters.
  const rects={0:[125,110,220,290],1:[125,110,220,290],2:[925,860,160,275],4:[535,195,180,165],5:[950,230,100,100],6:[125,895,245,225],7:[500,865,255,255],8:[65,505,385,275],9:[465,450,320,345],10:[930,555,165,160],11:[930,555,165,160],13:[465,450,320,345],14:[65,505,385,275]};
  const r=rects[cell];if(!r)return;ctx.save();ctx.globalAlpha*=alpha;if(cell===1)ctx.filter='brightness(0.55) saturate(0.5)';ctx.drawImage(im,r[0]*im.naturalWidth/1280,r[1]*im.naturalHeight/1280,r[2]*im.naturalWidth/1280,r[3]*im.naturalHeight/1280,x,y,w,h);ctx.restore();
 }
 let last=null,active=null;
 const buffers=new WeakMap();
 function sample(stage,round,seed,tick){
  const level=Math.max(0,Math.min(2,(round||1)-1)),kind=outdoors.has(stage)?(cold.has(stage)&&level===2?3:level):0;
  const offset=SF2AIRULES.hash(seed||0,'weather:'+stage)%90,clock=Math.max(0,tick|0),phase=(clock+offset)%600;
  const flash=kind===2?(phase>=180&&phase<184?0.22:phase>=190&&phase<196?0.12:0):0;
  return{stage,kind,name:names[kind],level,clock,phase,flash,wind:Math.sin(clock/180+offset)*0.7+0.9,strike:Math.floor((clock+offset)/600),thunder:kind===2&&phase===212};
 }
 function rain(ctx,s,seed,cam,width,ground=200,top=0,height=224){
  if(!s.kind)return;
  if(s.kind===3){snow(ctx,s,seed,cam,width,ground,top,height);return;}
  ctx.save();ctx.beginPath();ctx.rect(0,top,width,height);ctx.clip();ctx.globalAlpha=s.kind===2?0.65:0.5;ctx.fillStyle='#b7dcf0';
  const count=s.kind===2?224:128,stroke=Math.max(1,Math.ceil(width/384));
  for(let i=0;i<count;i++){
   const h=SF2AIRULES.hash(seed||0,'rain:'+i),speed=s.kind===2?9:7,phase=((h>>>12)+s.clock*speed)%256,y=phase-16,floor=ground+(h>>>25)%23;
   const world=((h&65535)-s.clock*(s.kind===2?3:2))%768;
   for(let tile=Math.floor(cam/768)*768;tile<cam+width;tile+=768){const x=(world+768)%768+tile-Math.floor(cam);
   for(let band=Math.floor((top-256)/256);band<=0;band++)for(let d=0;d<(s.kind===2?9:6)&&y+band*256+d<floor;d++)ctx.fillRect(Math.floor(x-d/3),y+band*256+d,stroke,1);
   const age=(phase-floor-16)/speed;
   if(age>=0&&age<6){
    const impact=((h&65535)-(s.clock-age)*(s.kind===2?3:2))%768,sx=(impact+768)%768+tile-Math.floor(cam);
    sprite(ctx,6,sx-5-age*0.6,floor-4+age*0.3,10+age*1.2,6,1-age/6);
   }}
  }
  ctx.restore();
 }
 function snow(ctx,s,seed,cam,width,ground=200,top=0,height=224){
  ctx.save();ctx.beginPath();ctx.rect(0,top,width,height);ctx.clip();ctx.fillStyle='#eaf7ff';
  for(let i=0;i<100;i++){
   const h=SF2AIRULES.hash(seed||0,'snow:'+i),floor=ground+(h>>>25)%23,phase=((h>>>12)+s.clock*(0.45+(h%3)*0.16))%256;
   const wx=((h&65535)+s.clock*0.22+Math.sin(s.clock/29+i)*7)%768,y=phase-24,size=width>500?2:(h&1)+1;
   ctx.globalAlpha=0.55+(h%4)*0.1;
   for(let tile=Math.floor(cam/768)*768;tile<cam+width;tile+=768){const x=wx+tile-Math.floor(cam);
    for(let band=Math.floor((top-256)/256);band<=0;band++)if(y+band*256<floor)sprite(ctx,7,Math.floor(x)-2,Math.floor(y+band*256)-2,size+4,size+4);
    if(y>=floor&&y<floor+12){const age=(y-floor)/(0.45+(h%3)*0.16),t=s.clock-age,impact=((h&65535)+t*0.22+Math.sin(t/29+i)*7)%768;ctx.fillRect(Math.floor(impact+tile-cam),floor,size+1,1);}
   }
  }ctx.restore();
 }
 function sky(ctx,s,cam,width,top=-32,_dy=0,inset=0){
  const im=images['ryu-skies'];if(!im?.complete||!im.naturalWidth)return;
  ctx.save();ctx.filter='none';ctx.beginPath();ctx.rect(0,top,width,224-top);ctx.clip();
  // One continuous distant sky. Uniform scale preserves sun/moon proportions
  // and avoids exposing a stretched-row/native-sky box as the camera pulls back.
  const sourceWidth=im.naturalWidth,sourceHeight=im.naturalHeight/3,height=224-top,panorama=height*sourceWidth/sourceHeight,sy=s.level*sourceHeight;
  const target=138-Math.round(cam*0.2)+inset,left=Math.max(width-panorama,Math.min(0,target-panorama*.308));
  ctx.drawImage(im,0,sy,sourceWidth,sourceHeight,left,top,panorama,height);
  if(s.flash){ctx.fillStyle='rgba(220,235,255,'+s.flash+')';ctx.fillRect(0,top,width,224-top);}ctx.restore();
 }
 function lightLayers(stage,index,image,round){
  const level=Math.max(0,Math.min(2,(round||1)-1)),w=image.width,h=image.height,pad=(h===256||h===288)&&!(stage===7&&w===1024)?32:0;
  let lamps=[],props=false;
  if(stage===0&&index===2&&w===813){lamps=[[280,165,48],[680,164,48]];props=true;}
  if(stage===0&&index===1&&w===566){lamps=[[380,139,48]];props=true;}
  if(stage===1&&index===6&&w===81)lamps=[[40,70,62]];
  if(stage===11&&index===0&&w===855)lamps=[[230,40,48],[624,40,48]];
  if(stage===7&&index===0&&w===1024)lamps=[[487,70,48],[793,70,48]];
  if(stage===6&&index===0&&w===524){lamps=[[135,22,46],[365,22,46]];props=true;}
  if(stage===6&&index===1&&w===855)lamps=[[385,193,90,0.25]];
  if(!lamps.length||(!level&&!props))return null;
  const key=[stage,index,w,h,level].join(':');if(lightCache.has(key))return lightCache.get(key);
  const margin=48,canvas=()=>{const c=document.createElement('canvas');c.width=w+margin*2;c.height=h+margin*2;return c;},glow=level?canvas():null,fixture=props?canvas():null;
  for(const [u,v,r,flat=1]of lamps){const x=u+margin,y=v+pad+margin;
   if(glow){const c=glow.getContext('2d');c.save();c.translate(x,y);c.scale(1,flat);const g=c.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,'rgba(255,214,119,0.65)');g.addColorStop(0.35,'rgba(255,169,61,0.22)');g.addColorStop(1,'rgba(255,140,30,0)');c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();}
   if(fixture){const c=fixture.getContext('2d');sprite(c,stage===0?(level?0:1):2,x-8,y-21,16,24);}
  }
  const result={glow,props:fixture,margin,lamps,pad,level};lightCache.set(key,result);if(lightCache.size>16)lightCache.delete(lightCache.keys().next().value);return result;
 }
 function paintLights(ctx,layers,args,tick){
  if(!layers)return;const m=layers.margin;
  const draw=im=>{if(args.length===2)ctx.drawImage(im,args[0]-m,args[1]-m);else if(args.length===8)ctx.drawImage(im,args[0]+m,args[1]+m,...args.slice(2));};
  ctx.save();ctx.filter='none';if(layers.props)draw(layers.props);if(layers.glow){ctx.globalCompositeOperation='screen';ctx.globalAlpha=0.9+Math.sin(tick/19)*0.06;draw(layers.glow);}ctx.restore();
  if(!layers.level)return;
  ctx.save();ctx.filter='none';
  if(args.length===2)ctx.translate(args[0],args[1]);
  else if(args.length===8){ctx.beginPath();ctx.rect(args[4],args[5],args[6],args[7]);ctx.clip();ctx.translate(args[4],args[5]);ctx.scale(args[6]/args[2],args[7]/args[3]);ctx.translate(-args[0],-args[1]);}else{ctx.restore();return;}
  // Emit in source-layer coordinates so dust/embers follow the actual lamp, not the screen.
  for(const [u,v,r,flat=1]of layers.lamps){for(let i=0;i<9;i++){
   const age=((tick+i*17)%100)/100,x=u+Math.sin(i*2.3+tick/47)*Math.min(18,r/3),y=v+layers.pad-age*(flat<1?8:34);
   sprite(ctx,i%3===0?5:4,x-2,y-2,4,5,Math.sin(age*Math.PI)*0.72);
  }}ctx.restore();
 }
 function atmosphere(ctx,s,seed,cam,width,ground=200){
  const outdoor=outdoors.has(s.stage);if(!outdoor&&s.stage!==6)return;
  ctx.save();ctx.filter='none';ctx.beginPath();ctx.rect(0,40,width,184);ctx.clip();
  if(outdoor){
   for(let i=0;i<8;i++){
    const h=SF2AIRULES.hash(seed||0,'wind:'+i),base=((h%1024+s.clock*(0.55+s.wind*0.4))%1024)-128,y=75+(h>>>12)%110+Math.sin(s.clock/33+i)*9;
    for(let tile=Math.floor(cam/1024)*1024-1024;tile<cam+width+1024;tile+=1024){ctx.save();ctx.translate(base+tile-cam,y);ctx.rotate(Math.sin(s.clock/27+i)*0.5);sprite(ctx,i&1?10:11,-4,-3,8,6,0.7);ctx.restore();}
   }
   if(s.level)for(let i=0;i<5;i++){
    const h=SF2AIRULES.hash(seed||0,'fog:'+i),base=((h%1100+s.clock*(0.13+s.wind*0.1))%1100)-170;
    for(let tile=Math.floor(cam/1100)*1100-1100;tile<cam+width+1100;tile+=1100)sprite(ctx,i&1?8:14,base+tile-cam,ground-28+(i%3)*9,190,40,s.level===2?0.16:0.09);
   }
  }else for(let i=0;i<6;i++){
   const age=((s.clock+i*31)%180)/180,x=(i&1?580:220)-cam+Math.sin(age*3+i)*14,y=ground-20-age*90;
   sprite(ctx,i&1?9:13,x-18,y-30,36+age*25,48+age*20,Math.sin(age*Math.PI)*0.2);
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
  source.buffer=buffer;filter.type='lowpass';filter.frequency.value=900;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(0.26,t+0.04);gain.gain.exponentialRampToValueAtTime(0.001,t+2.3);
  source.connect(filter);filter.connect(gain);gain.connect(master);active=source;
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();if(active===source)active=null;};source.start();return true;
 }
 return{outdoors,cold,ready,sample,rain,snow,sky,lightLayers,paintLights,atmosphere,sound,stop};
})();
