/* Deterministic AI Edition adapters. No device reads or gameplay RNG draws. */
'use strict';
window.SF2AIRULES=(()=>{
 const WINDOW=2,ATTACK=1008,PAIRS=[144,288,576,544,272,192],LABELS=['LP + LK','MP + MK','HP + HK','MP + HK','LP + MK','HP + LK'];
 const NAMES={ryu:['Hadoken','Shoryuken','Tatsumaki'],honda:['Hundred Hand Slap','Sumo Headbutt'],blanka:['Electric Thunder','Rolling Attack'],guile:['Sonic Boom','Flash Kick'],ken:['Hadoken','Shoryuken','Tatsumaki'],'chun-li':['Lightning Legs','Spinning Bird Kick'],zangief:['Spinning Piledriver','Double Lariat'],dhalsim:['Yoga Flame','Yoga Fire'],bison:['Psycho Crusher','Double Knee Press','Head Press'],sagat:['High Tiger Shot','Low Tiger Shot','Tiger Uppercut','Tiger Knee'],balrog:['Dash Straight','Dash Upper','Turn Punch (punch)','Turn Punch (kick)'],vega:['Rolling Crystal Flash','Flying Barcelona','Backflip']};
 function mapping(p){
  const id=p.aiProfile||'ryu',base=id==='evil-ryu'?'ryu':id==='evil-ken'?'ken':id,moves=p.F.moves,names=NAMES[base]||[];
  const out=PAIRS.slice(0,Math.max(3,moves.length)).map((mask,i)=>({mask,label:LABELS[i],index:i<moves.length?i:0,strength:Math.min(i,2),name:names[i<moves.length?i:0]||moves[i<moves.length?i:0]?.inp}));
  if(id==='evil-ryu')out.push({mask:544,label:LABELS[3],command:'rift',name:'Rift Step'});
  if(id==='evil-ken')for(const [i,command]of ['ember-kick','furnace-kick','cinder-break'].entries())out.push({mask:PAIRS[i+3],label:LABELS[i+3],command,name:['Ember Kick','Furnace Kick (chain)','Cinder Break (chain + heat)'][i]});
  return out;
 }
 function sample(p,keys,tick,frozen=false){
  const s=p.AIButtons||(p.AIButtons={raw:0,previous:0,times:{},pending:0,locked:0,pulse:0,keys:0,queue:null,motion:null});
  const attack=keys&ATTACK,pressed=attack&~s.raw;
  if(!(attack&s.locked))s.locked=0;
  for(let bit=16;bit<=512;bit<<=1)if(pressed&bit&&!(s.locked&bit)){if(s.pending&bit&&tick-s.times[bit]>=WINDOW){s.pending&=~bit;s.pulse|=bit;}s.times[bit]=tick;s.pending|=bit;}
  for(const m of mapping(p))if(attack===m.mask&&!(s.locked&m.mask)&&(s.pending&m.mask)===m.mask){
   const times=[];for(let bit=16;bit<=512;bit<<=1)if(m.mask&bit)times.push(s.times[bit]);
   if(Math.max(...times)-Math.min(...times)<=WINDOW&&tick-Math.min(...times)<=WINDOW){const eligible=[0,2,3,4].includes(p.ST)&&!(p.ST===2&&p.PJ)||m.command&&m.command!=='rift'&&p.MV?.kind==='evil-ken-heat'||m.command==='rift'&&p.ST===1&&p.AICombo?.active&&p.AIConfirm===p.AIAttackSerial;if(eligible)s.queue={...m,tick};s.pending&=~m.mask;s.pulse&=~m.mask;s.locked|=m.mask;break;}
  }
  for(let bit=16;bit<=512;bit<<=1)if(s.pending&bit&&tick-s.times[bit]>=WINDOW){s.pending&=~bit;s.pulse|=bit;}
  s.raw=attack;s.keys=(keys&15)|(attack&~s.pending&~s.locked)|s.pulse;
  if(frozen&&s.queue)s.queue.tick++;
  if(s.queue&&tick-s.queue.tick>12)s.queue=null;
 }
 function block(p,keys){p.AIButtons={raw:keys&ATTACK,previous:keys&15,times:{},pending:0,locked:keys&ATTACK,pulse:0,keys:keys&15,queue:null,motion:null};}
 function controls(p){const s=p.AIButtons;if(!s)return null;const out={keys:s.keys,nw:s.keys&~s.previous,rel:s.previous&~s.keys};s.previous=s.keys;s.pulse=0;return out;}
 function defer(p,events,tick){const s=p.AIButtons;if(!s)return events;if(s.queue){s.motion=null;return [];}if(events.some(e=>e[0]==='bb'||e[0]==='ppp'))return events;
  if(events.length&&s.pending){const bits=[];for(let bit=16;bit<=512;bit<<=1)if(s.pending&bit)bits.push(bit);if(bits.length===1){if(!s.motion)s.motion={events:events.map(e=>e.slice()),ready:s.times[bits[0]]+WINDOW};events=[];}}
  if(s.motion&&tick>=s.motion.ready){const q=s.motion.events;s.motion=null;return q;}return events;}
 function claim(p){const s=p.AIButtons;if(!s?.queue)return null;const q=s.queue;s.queue=null;s.motion=null;return q;}
 function hash(seed,text){let v=(seed>>>0)||2166136261;for(const c of String(text))v=Math.imul(v^c.charCodeAt(0),16777619)>>>0;return v||1;}
 function colors(original,seed,identity,slot){
  let state=hash(seed,identity+':'+slot);const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
  const hue=next()*360,saturation=.65+next()*.7,tint=[next(),next(),next()];
  return original.map(rgb=>{const [r,g,b]=rgb.map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=delta===0?0:max===r?60*((g-b)/delta%6):max===g?60*((b-r)/delta+2):60*((r-g)/delta+4);h=(h+hue+360)%360;const sat=Math.min(1,(max?delta/max:0)*saturation+.15),c=max*sat,x=c*(1-Math.abs(h/60%2-1)),m=max-c,q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return q.map((v,i)=>Math.min(255,Math.max(0,17*Math.round(((v+m)*.92+max*tint[i]*.08)*15))));});
 }
 const images=new WeakMap(),recent=[];
 function sprite(p,image,sourcePalette){
  if(!p.AIPalette||!image?.width)return image;let cache=images.get(image);if(!cache)images.set(image,cache=new Map());const key=p.AIPaletteKey+':'+JSON.stringify(sourcePalette);if(cache.has(key)){const index=recent.findIndex(e=>e.cache===cache&&e.key===key);if(index>=0)recent.push(...recent.splice(index,1));return cache.get(key);}
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height),map=new Map();sourcePalette.forEach((rgb,i)=>map.set((rgb[0]<<16)|(rgb[1]<<8)|rgb[2],p.AIPalette[i]));
  for(let i=0;i<data.data.length;i+=4){if(!data.data[i+3])continue;const q=map.get((data.data[i]<<16)|(data.data[i+1]<<8)|data.data[i+2]);if(q)for(let c=0;c<3;c++)data.data[i+c]=q[c];}ctx.putImageData(data,0,0);cache.set(key,canvas);recent.push({cache,key});if(recent.length>8){const old=recent.shift();old.cache.delete(old.key);}return canvas;
 }
 let helpKey='';
 function help(players,enabled){const host=document.getElementById('ai-rule-help');if(!host)return;host.hidden=!enabled;if(!enabled)return;const rows=players.map(p=>p.profileName+'\n'+mapping(p).map(m=>'  '+m.label+' = '+m.name).join('\n')).join('\n\n');if(rows===helpKey)return;helpKey=rows;host.querySelector('pre').textContent='Press each punch + kick pair once together (within two frames). Release both before repeating. Original motions and charges still work. Specials can start during a jump after takeoff. Palettes stay fixed for the match.\n\n'+rows;}
 return{WINDOW,mapping,sample,block,defer,controls,claim,hash,colors,sprite,help};
})();
