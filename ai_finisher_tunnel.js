/* Imagegen side-on energy corridor. Fixed draw/particle bounds; no gameplay RNG. */
'use strict';
window.SF2AIFinisherTunnel=(()=>{
 const image=new Image(),base=document.currentScript?.src||location.href;image.src=new URL('ai-effects/finisher-side-portal.png?v=side-portal-1',base).href;
 const ready=image.decode().then(()=>true,()=>false),LIMITS=Object.freeze({layers:3,streaks:48,portalPoints:48,maxTiles:12,maxImageDraws:16,renderHz:30});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},wrap=(v,p)=>((v%p)+p)%p;
 let last={draws:0,streaks:0,alpha:0};
 function strip(ctx,camera,clock,top,height,width,depth,speed,alpha,sourceY=0,sourceH=image.height){
  const tile=768,pan=camera*depth+clock*speed,first=Math.floor(pan/tile),start=-wrap(pan,tile);ctx.globalAlpha=alpha;
  for(let n=0,x=start;x<width&&n<LIMITS.maxTiles&&last.draws<LIMITS.maxImageDraws;n++,x+=tile){ctx.save();ctx.translate(x+((first+n)%2?tile:0),0);if((first+n)%2)ctx.scale(-1,1);ctx.drawImage(image,0,sourceY,image.width,sourceH,0,top,tile,height);ctx.restore();last.draws++;}
 }
 function paint(ctx,{camera=0,ground=0,top=-224,width=384,height=224,tick=0,started=tick,phase='combo',phaseAge=0,direction=1,seed=0}={}){
  if(!['approach','combo','special','settle'].includes(phase))return;const age=Math.max(0,tick-started),alpha=ease(age/30)*(phase==='settle'?1-ease(phaseAge/65):1);last={draws:0,streaks:0,alpha};if(alpha<=0)return;
  ctx.save();ctx.beginPath();ctx.rect(0,top,width,height);ctx.clip();ctx.fillStyle='rgba(0,0,18,'+(alpha*.94)+')';ctx.fillRect(0,top,width,height);
  const clock=tick*direction,wall=Math.min(70,height*.28),upper=top,lower=top+height-wall;
  if(image.complete&&image.naturalWidth){
   strip(ctx,camera,clock,top,height,width,.22,.35,alpha*.74);
   ctx.globalCompositeOperation='screen';strip(ctx,camera,clock,upper,wall,width,.55,1.4,alpha*.6,0,image.height*.3);strip(ctx,camera,clock,lower,wall,width,.55,1.4,alpha*.6,image.height*.7,image.height*.3);
   strip(ctx,camera,clock,upper,wall*.48,width,1.1,3.2,alpha*.34,0,image.height*.16);strip(ctx,camera,clock,lower+wall*.52,wall*.48,width,1.1,3.2,alpha*.34,image.height*.84,image.height*.16);
  }
  ctx.globalCompositeOperation='lighter';
  for(let n=0;n<LIMITS.streaks;n++){const h=Math.imul(n+1,(seed|0)^0x45d9f3b)>>>0,depth=.25+(h%75)/100,x=wrap((h%2048)-camera*depth-clock*(2+depth*6),width+70)-35,y=top+((h>>>11)%Math.max(1,Math.floor(height))),centre=Math.abs(y-(ground-58));if(centre<38)continue;ctx.globalAlpha=alpha*(.16+depth*.26);ctx.fillStyle=n%3?'#22caff':'#b476ff';ctx.fillRect(x,y,8+depth*24,depth>.8?2:1);last.streaks++;}
  // A side-on vertical portal opens behind the travelling fighters, then passes out of view.
  if(age<75){const x=width*.22-direction*age*2.1,cy=ground-60,rx=14+ease(age/24)*12,ry=height*.44;ctx.globalAlpha=alpha*(1-ease((age-34)/40));for(let band=0;band<3;band++){ctx.strokeStyle=['#8e4cff','#19c8ff','#d7ffff'][band];ctx.lineWidth=3-band*.6;ctx.beginPath();for(let n=0;n<=LIMITS.portalPoints;n++){const a=n/LIMITS.portalPoints*Math.PI*2,pulse=1+.035*Math.sin(a*9+tick*.2),px=x+Math.cos(a)*(rx+band*3)*pulse,py=cy+Math.sin(a)*(ry+band*4)*pulse;if(!n)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();}}
  ctx.restore();
 }
 const cached=document.createElement('canvas');cached.width=384;cached.height=224;const cacheContext=cached.getContext('2d');let cacheKey='';
 function draw(ctx,args={}){const phase=args.phase||'combo';if(!['approach','combo','special','settle'].includes(phase))return;const width=args.width||384,height=args.height||224,top=args.top??-224,tick=Math.floor((args.tick||0)/2)*2,key=[tick,args.started,phase,Math.floor((args.phaseAge||0)/2),args.seed,args.direction].join(':');if(key!==cacheKey){cacheKey=key;cacheContext.setTransform(1,0,0,1,0,0);cacheContext.clearRect(0,0,384,224);paint(cacheContext,{...args,tick,camera:(args.camera||0)*384/width,width:384,height:224,top:0,ground:((args.ground||0)-top)*224/height});last.rebuilt=true;}else last.rebuilt=false;ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(cached,0,0,384,224,0,top,width,height);ctx.restore();}
 return Object.freeze({ready,draw,LIMITS,info:()=>({...last,ready:image.complete&&image.naturalWidth>0})});
})();
