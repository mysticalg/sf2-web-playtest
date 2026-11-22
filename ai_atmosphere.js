/* AI-only imagegen atmosphere. All positions are pure functions of match seed/time. */
'use strict';
window.SF2AIATMOSPHERE=(()=>{
 const sheets={};
 const rects={
  'cherry-petals':[[236,240,206,210],[835,243,200,200],[286,840,114,191],[826,859,186,162]],
  'rose-petals':[[117,140,402,372],[724,168,429,324],[241,720,132,423],[737,777,394,298]],
  'cloud-bank':[[0,0,2172,724]],
  'mist-bank':[[0,300,2172,410]]
 };
 const ready=Promise.all(Object.keys(rects).map(name=>new Promise(resolve=>{const im=sheets[name]=new Image();im.onload=()=>resolve(true);im.onerror=()=>{console.error('AI atmosphere artwork failed to load',im.src);resolve(false);};im.src='ai-effects/'+name+'.png?v='+(window.SF2BUILD?.commit||'126');}))).then(a=>a.every(Boolean));
 const depths={farCloud:.12,nearCloud:.35,backMist:.62,frontMist:1.08,petals:1};
 const wrap=(x,n)=>(x%n+n)%n;
 function windTravel(f){const phase=SF2AIRULES.hash(f.seed||0,'weather:'+f.s.stage)%90,t=f.s.clock;return(.45*t+44.1*(Math.cos(phase)-Math.cos(t/180+phase)))*(f.s.kind===6?2.1:1);}
 function sprite(ctx,sheet,index,x,y,w,h,alpha=1){const im=sheets[sheet],r=rects[sheet]?.[index];if(!r||!im?.complete||!im.naturalWidth)return;const shade=ctx.filter&&ctx.filter!=='none'&&window.SF2AISCENE?SF2AISCENE.nativeShade(im,ctx.filter):null;ctx.save();ctx.globalAlpha*=alpha;if(shade)ctx.filter='none';ctx.drawImage(shade||im,...r,x,y,w,h);ctx.restore();}
 function clouds(ctx,f,pass){
  const strength=[0,.30,.48,.25,.17,.42,.20][f.s.kind]||0;if(!strength)return;
  const far=pass==='far',depth=far?depths.farCloud:depths.nearCloud,effective=f.cam*depth-f.inset,period=far?1700:2100,travel=windTravel(f)*(far?.35:.65);
  const h=SF2AIRULES.hash(f.seed||0,'cloud-bank:'+pass),width=far?1200:1500,height=width/3,base=wrap(h%period+travel,period),y=(far?-340:-430)+(h>>>12)%32;
  ctx.save();ctx.filter=f.s.kind===2?(f.filter==='none'?'':f.filter+' ')+'brightness(0.65)':f.filter;ctx.beginPath();ctx.rect(0,f.top,f.width,Math.max(0,Math.min(114-f.top,f.height)));ctx.clip();
  for(let tile=Math.floor(effective/period)*period-period;tile<effective+f.width+period;tile+=period){const x=base+tile-effective;if(x+width<0||x>f.width)continue;sprite(ctx,'cloud-bank',0,x,y,width,height,strength*(far?.65:.8)*(f.s.level===2?.7:1));}
  ctx.restore();
 }
 function mist(ctx,f,pass){
  const alpha=[0,.045,.06,.04,.14,.03,0][f.s.kind]||0;if(!alpha)return;
  const front=pass==='front',depth=front?depths.frontMist:depths.backMist,effective=f.cam*depth-f.inset,period=front?1450:1250,travel=windTravel(f)*(front?.45:.25),width=front?1800:1500,height=width*410/2172;
  const phase=SF2AIRULES.hash(f.seed||0,'mist-bank:'+pass),base=wrap(phase%period+travel,period),y=f.ground-(front?78:135)+Math.sin(f.s.clock/180+(phase%40))*4;
  ctx.save();ctx.filter=f.filter;ctx.beginPath();ctx.rect(0,f.top,f.width,f.height);ctx.clip();
  for(let tile=Math.floor(effective/period)*period-period;tile<effective+f.width+period;tile+=period){const x=base+tile-effective;if(x+width<0||x>f.width)continue;sprite(ctx,'mist-bank',0,x,y,width,height,alpha*(front?.55:.8));}
  ctx.restore();
 }
 function petals(ctx,f){
  const sheet=f.s.stage===0?'cherry-petals':f.s.stage===11?'rose-petals':null;if(!sheet)return;
  const effective=f.cam-f.inset,period=1024,travel=windTravel(f),clock=f.s.clock;
  ctx.save();ctx.filter='none';ctx.beginPath();ctx.rect(0,f.top,f.width,f.height);ctx.clip();
  for(let i=0;i<48;i++){
   const h=SF2AIRULES.hash(f.seed||0,sheet+':'+i),x0=wrap(h%period+travel*.9+Math.sin(clock/(21+h%11)+i)*7,period),speed=.23+(h%5)*.055,y0=wrap((h>>>10)+clock*speed,512)-300;
   const frame=Math.floor((clock+h%60)/13)%4,r=rects[sheet][frame],height=5+(h%3),width=height*r[2]/r[3],angle=Math.sin(clock/(27+h%9)+i)*.65;
   for(let band=Math.floor((f.top-y0-height)/512);y0+band*512<f.ground+13;band++){
    const y=y0+band*512,fade=y>f.ground-5?Math.max(0,(f.ground+13-y)/18):1;if(y+height<f.top)continue;
    for(let tile=Math.floor(effective/period)*period-period;tile<effective+f.width+period;tile+=period){const x=x0+tile-effective;if(x+width<0||x-width>f.width)continue;ctx.save();ctx.translate(x,y);ctx.rotate(angle);sprite(ctx,sheet,frame,-width/2,-height/2,width,height,fade*(f.s.kind===2?.62:.84));ctx.restore();}
   }
  }
  ctx.restore();
 }
 return{ready,depths,clouds,mist,petals,get loaded(){return Object.values(sheets).every(im=>im.complete&&im.naturalWidth>0);}};
})();
