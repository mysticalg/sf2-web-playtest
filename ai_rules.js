/* Deterministic AI Edition adapters. No device reads or gameplay RNG draws. */
'use strict';
window.SF2AIRULES=(()=>{
 const WINDOW=2,ATTACK=1008,PAIRS=[144,288,576,544,272,192,528],LABELS=['LP + LK','MP + MK','HP + HK','MP + HK','LP + MK','HP + LK','LP + HK'];
 const NAMES={...Object.fromEntries(Object.entries(SF2AIHeroes.specs).map(([id,p])=>[id,p.specials.map(m=>m[0])])),...Object.fromEntries(Object.entries(window.SF2AIFF.specs).map(([id,p])=>[id,p.specials.map(m=>m[0])])),damnd:['Street Rush','Somersault Kick','Rising Smash','Barrel Call'],ryu:['Hadoken','Shoryuken','Tatsumaki'],honda:['Hundred Hand Slap','Sumo Headbutt'],blanka:['Electric Thunder','Rolling Attack'],guile:['Sonic Boom','Flash Kick'],ken:['Hadoken','Shoryuken','Tatsumaki'],'chun-li':['Lightning Legs','Spinning Bird Kick'],zangief:['Spinning Piledriver','Double Lariat'],dhalsim:['Yoga Flame','Yoga Fire'],bison:['Psycho Crusher','Double Knee Press','Head Press'],sagat:['High Tiger Shot','Low Tiger Shot','Tiger Uppercut','Tiger Knee'],balrog:['Dash Straight','Dash Upper','Turn Punch (punch)','Turn Punch (kick)'],vega:['Rolling Crystal Flash','Flying Barcelona','Backflip']};
 function mapping(p){
  const id=p.aiProfile||'ryu',base=id==='evil-ryu'?'ryu':id==='evil-ken'?'ken':id,moves=p.F.moves,names=NAMES[base]||[];
  const order=id==='andore'?[0,3,4,1,2,5]:null,out=PAIRS.slice(0,Math.max(3,moves.length)).map((mask,i)=>{const index=order?.[i]??(i<moves.length?i:0);return{mask,label:LABELS[i],index,strength:Math.min(i,2),name:(names[index]||moves[index]?.inp)+(id==='cody'&&['hero-knife','hero-knife-throw'].includes(moves[index]?.style)&&SF2AIHeroWeapons.held(p)?.type!==0?' (pick up a knife)':'')};});
  if(id==='evil-ryu')out.push({mask:544,label:LABELS[3],command:'rift',name:'Rift Step'});
  if(id==='evil-ken')for(const [i,command]of ['ember-kick','furnace-kick','cinder-break'].entries())out.push({mask:PAIRS[i+3],label:LABELS[i+3],command,name:['Ember Kick','Furnace Kick (chain)','Cinder Break (chain + heat)'][i]});
  return out;
 }
 function sample(p,keys,tick,frozen=false){
  const pairFrames=(window.SF2AIFF?.ids().includes(p.aiProfile)||window.SF2AIHeroes?.get(p.aiProfile))?3:WINDOW;
  const s=p.AIButtons||(p.AIButtons={raw:0,previous:0,times:{},pending:0,locked:0,pulse:0,keys:0,queue:null,motion:null});
  const attack=keys&ATTACK,pressed=attack&~s.raw;
  if(!(attack&s.locked))s.locked=0;
  for(let bit=16;bit<=512;bit<<=1)if(pressed&bit&&!(s.locked&bit)){if(s.pending&bit&&tick-s.times[bit]>=pairFrames){s.pending&=~bit;s.pulse|=bit;}s.times[bit]=tick;s.pending|=bit;}
  for(const m of mapping(p))if(attack===m.mask&&!(s.locked&m.mask)&&(s.pending&m.mask)===m.mask){
   const times=[];for(let bit=16;bit<=512;bit<<=1)if(m.mask&bit)times.push(s.times[bit]);
   if(Math.max(...times)-Math.min(...times)<=pairFrames&&tick-Math.min(...times)<=pairFrames){const eligible=[0,2,3,4].includes(p.ST)&&!(p.ST===2&&p.PJ)||m.command&&m.command!=='rift'&&p.MV?.kind==='evil-ken-heat'||m.command==='rift'&&p.ST===1&&p.AICombo?.active&&p.AIConfirm===p.AIAttackSerial;if(eligible)s.queue={...m,tick};s.pending&=~m.mask;s.pulse&=~m.mask;s.locked|=m.mask;break;}
  }
  for(let bit=16;bit<=512;bit<<=1)if(s.pending&bit&&tick-s.times[bit]>=pairFrames){s.pending&=~bit;s.pulse|=bit;}
  s.raw=attack;s.keys=(keys&15)|(attack&~s.pending&~s.locked)|s.pulse;
  if(frozen&&s.queue)s.queue.tick++;
  if(s.queue&&tick-s.queue.tick>12)s.queue=null;
 }
 function block(p,keys){p.AIButtons={raw:keys&ATTACK,previous:keys&15,times:{},pending:0,locked:keys&ATTACK,pulse:0,keys:keys&15,queue:null,motion:null};}
 function controls(p){const s=p.AIButtons;if(!s)return null;const out={keys:s.keys,nw:s.keys&~s.previous,rel:s.previous&~s.keys};s.previous=s.keys;s.pulse=0;return out;}
 function defer(p,events,tick){const s=p.AIButtons;if(!s)return events;if(s.queue){s.motion=null;return [];}if(events.some(e=>e[0]==='bb'||e[0]==='ppp'))return events;
  if(events.length&&s.pending){const bits=[];for(let bit=16;bit<=512;bit<<=1)if(s.pending&bit)bits.push(bit);if(bits.length===1){if(!s.motion)s.motion={events:events.map(e=>e.slice()),ready:s.times[bits[0]]+((window.SF2AIFF?.ids().includes(p.aiProfile)||window.SF2AIHeroes?.get(p.aiProfile))?3:WINDOW)};events=[];}}
  if(s.motion&&tick>=s.motion.ready){const q=s.motion.events;s.motion=null;return q;}return events;}
 function claim(p){const s=p.AIButtons;if(!s?.queue)return null;const q=s.queue;s.queue=null;s.motion=null;return q;}
 function hash(seed,text){let v=(seed>>>0)||2166136261;for(const c of String(text))v=Math.imul(v^c.charCodeAt(0),16777619)>>>0;return v||1;}
 const CLOTHING={...Object.fromEntries(Object.entries(SF2AIHeroesData.heroes).map(([id,p])=>[id,p.paletteGroups.clothing])),andore:[3,5,6,8,9,11],abigail:[15,17,20,22,25,27],edi:[4,9,13,17,21,24,27],rolento:[1,3,4,5,10,12],belger:[1,3,6,9,11,13,14],sodom:[2,8,9,10,13,14,15,18,19,21],damnd:[1,2,3,6,8,10,12,14],ryu:[7,8,9,10,11,12,13,14],honda:[8,9,10,11,12,13],blanka:[13,14],guile:[6,7,8,9,14],ken:[8,9,10,11,12,13],'chun-li':[9,10,11,12,13],zangief:[7,8,9,10,11,12],dhalsim:[10,11,12,13,14],bison:[1,2,3,4,5],sagat:[11,12,13,14],balrog:[9,10,11,12,13],vega:[9,10,11,12,14]};
 function clothing(identity){return CLOTHING[String(identity).split(':').pop().replace(/^evil-/,'')]||[];}
 const SKIN={...Object.fromEntries(Object.entries(SF2AIHeroesData.heroes).map(([id,p])=>[id,p.paletteGroups.skin])),andore:[7,10,12,13,14],abigail:[2,4,6,12,13,16,18],edi:[15,19,23],rolento:[7,8,11,13,14],belger:[4,7,8,10,12],sodom:[1,3,4,5,6,7,11,12,16,17,20],damnd:[4,7,11,13],ryu:[1,2,3,4,5,6],honda:[1,2,3,4,5,6,7],blanka:[1,2,3,4,5,6,7],guile:[2,3,4,5,13],ken:[1,2,3,4,5,6],'chun-li':[1,2,3,4,5],zangief:[2,3,4,5,6,13,14],dhalsim:[1,2,3,4,5,6],bison:[11,12,13,14],sagat:[2,3,4,5,6,7],balrog:[1,2,3,4,5,6],vega:[2,3,4,5,6]};
 const TONES=[[17,17,17],[99,63,45],[128,85,58],[156,106,75],[181,130,91],[185,147,103],[209,163,120],[225,182,145],[235,199,177],[238,238,238],[128,128,128],[51,153,68],[170,51,51]];
 function skin(identity){return SKIN[String(identity).split(':').pop().replace(/^evil-/,'')]||[];}
 function skinColors(original,seed,identity,slot,choice){const indices=skin(identity).filter(i=>original[i]),n=hash(seed,'skin:'+identity+':'+slot),position=choice?.skin>=0?Math.min(TONES.length-1,choice.skin):(n/4294967296)*9,i=Math.floor(position),fraction=position-i,base=TONES[i].map((v,c)=>v+(TONES[Math.min(i+1,TONES.length-1)][c]-v)*fraction),luma=q=>q[0]*.2126+q[1]*.7152+q[2]*.0722,levels=indices.map(i=>luma(original[i])),lo=Math.min(...levels),hi=Math.max(...levels);return original.map((rgb,i)=>{if(!indices.includes(i)||choice?.skin===-2)return rgb.slice();const t=(luma(rgb)-lo)/(hi-lo||1);return base.map(v=>{const dark=v*.38,light=v+(255-v)*.45,value=t<.65?dark+(v-dark)*t/.65:v+(light-v)*(t-.65)/.35;return Math.max(17,Math.min(238,17*Math.round(value/17)));});});}
 function colors(original,seed,identity,slot,choice){
  let state=hash(choice?.clothing>=0?118:seed,identity+':'+slot);const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
  const hue=choice?.clothing>=0?(choice.clothing%12)*30:next()*360,saturation=.65+next()*.7,tint=[next(),next(),next()];
  const indices=clothing(identity);const flesh=skinColors(original,seed,identity,slot,choice);return original.map((rgb,index)=>{if(!indices.includes(index))return flesh[index];if(choice?.clothing===-2)return rgb.slice();const [r,g,b]=rgb.map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=delta===0?0:max===r?60*((g-b)/delta%6):max===g?60*((b-r)/delta+2):60*((r-g)/delta+4);h=choice?.clothing>=0?hue:(h+hue+360)%360;const sat=Math.min(1,(max?delta/max:0)*saturation+.15),c=max*sat,x=c*(1-Math.abs(h/60%2-1)),m=max-c,q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return q.map((v,i)=>Math.min(255,Math.max(0,17*Math.round(((v+m)*.92+max*tint[i]*.08)*15))));});
 }
 const images=new WeakMap(),recent=[],indexReferences=new WeakMap();
 function referenceIndices(reference){
  let saved=indexReferences.get(reference.image);if(saved)return saved;
  const c=document.createElement('canvas');c.width=reference.image.width;c.height=reference.image.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(reference.image,0,0);const pixels=x.getImageData(0,0,c.width,c.height).data,map=new Map(reference.palette.map((rgb,i)=>[(rgb[0]<<16)|(rgb[1]<<8)|rgb[2],i])),out=new Uint8Array(c.width*c.height);out.fill(255);
  for(let i=0;i<out.length;i++)if(pixels[i*4+3])out[i]=map.get((pixels[i*4]<<16)|(pixels[i*4+1]<<8)|pixels[i*4+2])??255;indexReferences.set(reference.image,out);return out;
 }
 function sprite(p,image,sourcePalette,nativeBase=false,reference=null){
  if(!p.AIPalette||!image?.width)return image;let cache=images.get(image);if(!cache)images.set(image,cache=new Map());const key=p.AIPaletteKey+':'+(nativeBase?'native:':'')+(reference?'indexed:':'rgb:')+JSON.stringify(sourcePalette);if(cache.has(key)){const index=recent.findIndex(e=>e.cache===cache&&e.key===key);if(index>=0)recent.push(...recent.splice(index,1));return cache.get(key);}
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height),map=new Map();const indices=[...(p.AIColorChoice?.clothing===-2?[]:clothing(p.fighterKey)),...(p.AIColorChoice?.skin===-2?[]:skin(p.fighterKey))];sourcePalette.forEach((rgb,i)=>{if(indices.includes(i)||nativeBase){const base=p.aiProfile==='evil-ryu'?p.F.pal2:p.F.pal;map.set((rgb[0]<<16)|(rgb[1]<<8)|rgb[2],indices.includes(i)?p.AIPalette[i]:base[i]);}});
  const indexed=reference?referenceIndices(reference):null;if(indexed&&indexed.length!==canvas.width*canvas.height)throw Error('AI palette index reference dimensions differ');
  for(let i=0;i<data.data.length;i+=4){if(!data.data[i+3])continue;let q;if(indexed){const index=indexed[i/4];if(indices.includes(index))q=p.AIPalette[index];else if(nativeBase&&index<15)q=(p.aiProfile==='evil-ryu'?p.F.pal2:p.F.pal)[index];}else q=map.get((data.data[i]<<16)|(data.data[i+1]<<8)|data.data[i+2]);if(q)for(let c=0;c<3;c++)data.data[i+c]=q[c];}ctx.putImageData(data,0,0);cache.set(key,canvas);recent.push({cache,key});if(recent.length>8){const old=recent.shift();old.cache.delete(old.key);}return canvas;
 }
 let helpKey='';
 function help(players,enabled){const host=document.getElementById('ai-rule-help');if(!host)return;host.hidden=!enabled;if(!enabled)return;const rows=players.map(p=>p.profileName+'\n'+mapping(p).map(m=>'  '+m.label+' = '+m.name).join('\n')).join('\n\n');if(rows===helpKey)return;helpKey=rows;host.querySelector('pre').textContent=(players.some(p=>SF2AIHeroes.get(p.aiProfile))?'Final Fight weapons: hold Down and tap punch beside a dropped knife, katana or pipe. Attack buttons use the held weapon; Down + attack swings from standing and returns to crouch. Guy and Haggar throw knives; Cody stabs nearby and throws at range. His knife shortcuts require a held knife. Knockdowns and grab/escape moves drop held weapons.\nGuy: hold Up + away at a wall to brace and rebound.\nHaggar: grab, walk with the victim, then jump and tap a fresh punch in the air to piledrive.\n\n':'')+(players.some(p=>p.aiProfile==='sodom')?'Sodom: beside a dropped katana, hold Down and press punch to pick it up.\n\n':'')+'Press each punch + kick pair once together. Release both before repeating. Original motions and charges still work. Specials can start during a jump after takeoff. Clothing colours and skin tones stay fixed for the match; hair keeps its original colour.\n\n'+rows;}
 return{WINDOW,mapping,sample,block,defer,controls,claim,hash,clothing,skin,skinColors,TONES,colors,sprite,help};
})();
