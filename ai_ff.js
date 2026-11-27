/* AI Edition Final Fight guests. Original arcade pixels; authored SF2 controls.
   Sprite/arena provenance and adaptation notes: FF-BOSSES.md. */
'use strict';
window.SF2AIFF=(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),packs={},pending=[],assetURL=file=>file+'?v='+(window.SF2BUILD?.assetRevisions?.[file]||window.SF2BUILD?.commit||'ff-rolento-roll-26');
 const specs={
  sodom:{name:'Sodom',district:'Subway Ring',hp:340,speed:0x240,jump:0x650,point:[171,115],idle:'neutral',walk:'walk',hurt:'hurt',crouch:[42],fall:'fall',lie:'down',recover:'recover',throw:'jab',win:'entry',normal:[[25,24,25],[25,24,25],[25,24,25],[18,19],[18,19,20],[18,19,20]],specials:[['Katana Rush','sodom-charge','charge'],['Twin Blade Chops','sodom-double','slash'],['Heavy Sword Chop','sodom-chop','slash'],['Gut Buster','grab','jab']]},
  edi:{name:'Edi. E',district:'West Side',hp:330,speed:0x200,jump:0x5a0,point:[173,85],idle:[0,1,2,3],walk:[5,6,7,8],hurt:[17,18],crouch:[21],fall:[17,20,26],lie:[26],recover:[21,19,0],throw:[12,14,15],win:[9,4],normal:[[9,10,11],[9,10,11],[9,10,11],[11,12,13],[11,13,14],[9,10,11]],specials:[['Police Pistol','pistol',[24,25,28,29]],['Baton Rush','baton-rush',[9,10,11]],['Baton Smash','baton',[9,10,11]],['Arrest and Batter','grab-batter',[12,14,15]],['Pistol Burst','pistol-burst',[24,25,28,29]],['Left Holster Fire','pistol',[12,13,14]]]},
  rolento:{name:'Rolento',district:'Industrial Area',hp:300,speed:0x500,jump:0x740,point:[221,118],idle:[10,11],walk:[10,11,12,13],hurt:[8,25],crouch:[9],fall:[25,26,21],lie:[22],recover:[17,8,10],throw:[14,15],win:[0,1,2,3],normal:[[13,14,13],[13,15,13],[13,14,15,13],[17,18,19,17],[17,19,18,17],[17,18,19,17]],specials:[['Patriot Circle','spin',[13,14,15,14]],['Grenade Throw','grenade',[20]],['Wall Kick','wallkick',[9,5,6,7,18]],['Shoulder Toss','grab',[14,15]],['Grenade Barrage','grenade-barrage',[20]],['Grenade Retreat','retreat',[20,5,6,7]],['Wall Punch','wallpunch',[16]]]},
  abigail:{name:'Abigail',district:'Bay Area',hp:420,speed:0x1e0,jump:0x590,point:[260,130],idle:[4,5,6,7],walk:[4,5,6,7,8,9],hurt:[25],crouch:[20],fall:[22,24,23],lie:[23],recover:[25,26,4],throw:[19,21],win:[17,18],normal:[[17,18,17],[17,18,17],[15,16,17],[19,20,19],[19,21,19],[17,18,17]],specials:[['Rage Charge','rage',[10,11,12,13,14,15,16]],['Giant Throw','grab',[19,21]],['Hammer Punch','power',[19,21,18]],['Spinning Piledriver','abigail-spd',[19,20,21]],['Power Punch','power',[15,16,18]]]},
  belger:{name:'Belger',district:'Uptown Penthouse',hp:320,speed:0x240,jump:0x630,point:[220,99],idle:[0,1,2,3],walk:[0,1,2,3,4,5],hurt:[9,10],crouch:[10],fall:[9,13,18],lie:[18],recover:[10,9,7],throw:[7,12],win:[7,8],normal:[[7,14,7],[7,15,7],[7,12,7],[10,8,10],[10,8,10],[7,8,7]],specials:[['Crossbow Volley','bolts',[7,14,15,16]],['Escape Leap','belger-hop',[9,8,7]],['Sky Bolt Rain','bolt-rain',[7,12]],['Escape Hop','belger-retreat',[9,8,7]],['Crossbow Butt','power',[7,12]]]},
  andore:{name:'Andore',district:'West Side Cage',hp:400,speed:0x200,jump:0x5f0,point:[161,96],idle:[0],walk:'neutral',hurt:'hurt',crouch:[11],fall:'fall',lie:'down',recover:'recover',throw:'strike',win:[6],normal:['jab','strike','strike','jab','strike','slam'],specials:[['Bull Rush','dash','rush'],['Chest Bump','power','strike'],['Headbutt','power','jab'],['Piledriver','grab','strike'],['Choke Hold','hold','strike'],['Flying Seat Drop','seatdrop',[18]]]},
 };
 for(const[id,s]of Object.entries(specs)){
  const d=SF2AIFFData[id],image=new Image(),stage=new Image(),portraitImage=new Image();image.src=assetURL(d.image);stage.src=assetURL('ai-ff/'+id+'-stage.png');portraitImage.src=assetURL('ai-ff/'+id+'-profile.png');
  const pack={id,...s,data:d,image,stage,portraitImage,loaded:false,template:null,portraits:new Map()};packs[id]=pack;
  pending.push(Promise.all([image.decode(),stage.decode(),portraitImage.decode()]).then(()=>pack.loaded=true));
 }
 const swordImage=new Image();swordImage.src=assetURL(SF2AIFFData.sodom.katana.image);pending.push(swordImage.decode());
 const explosionImage=new Image();explosionImage.src=assetURL(SF2AIFFData.rolento.explosion.image);pending.push(explosionImage.decode());const explosionTicks=SF2AIFFData.rolento.explosion.ticks.reduce((a,b)=>a+b,0);
 const grenadeImage=new Image();grenadeImage.src=assetURL(SF2AIFFData.rolento.grenades.image);pending.push(grenadeImage.decode());
 const boltImage=new Image();boltImage.src=assetURL(SF2AIFFData.belger.bolt.image);pending.push(boltImage.decode());
 const gumImage=new Image();gumImage.src=assetURL(SF2AIFFData.edi.victory.gum.image);pending.push(gumImage.decode());
 const bulletImage=new Image();bulletImage.src=assetURL(SF2AIFFData.edi.bullet.image);pending.push(bulletImage.decode());
 const ediLegs=new Image();ediLegs.src=assetURL('ai-ff/edi-crouch-legs.png');pending.push(ediLegs.decode());
 const metro=new Image();metro.src=assetURL('ai-ff/metro-map.png');pending.push(metro.decode());
 let audioContext=null,audioReady=null;const soundBuffers=new Map(),soundCounts={played:0,byCommand:{}};
 function prepareSound(ac){if(audioContext===ac&&audioReady)return audioReady;audioContext=ac;soundBuffers.clear();audioReady=Promise.all([0,6,13,16,18,21,30,38,41,44,47].map(async code=>{const response=await fetch(assetURL('ai-ff/audio/'+code.toString(16).padStart(2,'0')+'.mp3'));if(!response.ok)throw Error('Final Fight sound '+code+' unavailable');soundBuffers.set(code,await ac.decodeAudioData(await response.arrayBuffer()));}));return audioReady;}
 function playSound(code,ac,dest,options={}){if(!ac||!dest)return false;const play=()=>{const buffer=soundBuffers.get(code);if(!buffer)return;const voice=ac.createBufferSource();voice.buffer=buffer;const gain=ac.createGain();gain.gain.value=options.volume??.7;voice.playbackRate.value=options.rate??1;voice.connect(gain);gain.connect(dest);voice.start(ac.currentTime+(options.delay||0));soundCounts.played++;soundCounts.byCommand[code]=(soundCounts.byCommand[code]||0)+1;};if(audioContext!==ac||!soundBuffers.has(code)){prepareSound(ac).then(play).catch(()=>{});return true;}play();return true;}
 // Original music is decoded lazily; the two most recent themes stay cached.
 let musicKey=null,musicAC=null,musicDest=null,musicVoice=null,musicState='off',musicError=null,musicRequest=0,musicStarts=0;const musicBuffers=new Map();
 function musicInfo(){const r=SF2AIFFData.music.tracks[musicKey];return{key:musicKey,state:musicState,playing:!!musicVoice,starts:musicStarts,error:musicError,loopStart:r?.loopStart,loopEnd:r?.loopEnd,cached:musicBuffers.size};}
 async function setMusic(key,ac,dest){
  if(key===musicKey&&ac===musicAC&&dest===musicDest&&(musicVoice||musicState==='loading'||!key||!ac))return;
  const request=++musicRequest;if(musicVoice){musicVoice.source.stop();musicVoice.source.disconnect();musicVoice.gain.disconnect();musicVoice=null;}
  if(ac!==musicAC)musicBuffers.clear();musicKey=key;musicAC=ac;musicDest=dest;musicError=null;musicState=key?(ac&&dest?'loading':'waiting'):'off';if(!key||!ac||!dest)return;
  try{
   const record=SF2AIFFData.music.tracks[key];if(!record)throw Error('Unknown Final Fight music '+key);
   let decoded=musicBuffers.get(key);if(!decoded){decoded=(async()=>{const response=await fetch(assetURL(record.file));if(!response.ok)throw Error('Final Fight music '+key+' unavailable');return ac.decodeAudioData(await response.arrayBuffer());})();musicBuffers.set(key,decoded);while(musicBuffers.size>2)musicBuffers.delete(musicBuffers.keys().next().value);}
   musicBuffers.delete(key);musicBuffers.set(key,decoded);const buffer=await decoded;if(request!==musicRequest)return;
   const source=ac.createBufferSource(),gain=ac.createGain();source.buffer=buffer;source.loop=true;source.loopStart=record.loopStart;source.loopEnd=Math.min(record.loopEnd,buffer.duration);gain.gain.value=.65;source.connect(gain);gain.connect(dest);musicVoice={source,gain};musicState='playing';musicStarts++;source.start();
  }catch(error){if(request!==musicRequest)return;musicBuffers.delete(key);musicError=error.message;musicState='error';console.warn(error.message);}
 }
 const ready=Promise.all([...pending,SF2AIFFChair.ready,window.SF2AISodomBlades?.ready]),get=id=>packs[id],ids=()=>['damnd','sodom','andore','edi','rolento','abigail','belger'];
 function sequence(p,which,ticks=5){const list=typeof which==='string'?p.data.nativeActions[which]:which;return list.map(e=>Array.isArray(e)?[e[0],Math.max(1,Math.min(120,e[1]))]:[e,ticks]);}
 function anim(p,name,list,{loop=false,attack=false,strength=1,low=false,crouch=false,kd=false}={}){
  const seq=sequence(p,list);return{name,guest:true,crouch,mode:loop?0:1,loop:0,source:0,flags:seq.map((_,i)=>i===seq.length-1?(loop?32768:32769):0),ents:seq.map(([f,t],i)=>{
   const r=(p.data.sizeAdjustment?.sourceFrames||p.data.frames)[f],hy=crouch?55:Math.min(101,Math.max(40,r[3]-15)),active=attack&&(p.data.nativeFrames?!!p.data.nativeFrames[f].attack:i>0&&i<seq.length-1),reach=p.id==='sodom'||p.id==='rolento'?62:43;
   return[f,t,[-8,hy,13,11],[0,crouch?32:hy-29,22,crouch?21:26],[0,13,21,13],[0,crouch?30:43,19,crouch?28:40],active?(p.id==='sodom'&&p.data.combat.attacks[p.data.nativeFrames[f].attack]?(()=>{const box=p.data.combat.attacks[p.data.nativeFrames[f].attack];return[-box.x,low?23:box.y,Math.min(45,box.rx),Math.min(25,box.ry)];})():[-reach,low?23:hy-22,25,low?18:23]):[0,0,0,0],active?12+strength*6:0,strength,kd?1:0,low?1:0];
  })};
 }
 function retimeNormals(f){
  for(const base of[8,14,47,53,59])for(let button=0;button<6;button++){
   const a=f.anims[base+button],strength=button%3,entries=a.ents,first=entries.findIndex(e=>e[6]?.[2]>0);if(first<0)continue;
   let last=first;for(let i=first;i<entries.length;i++)if(entries[i][6]?.[2]>0)last=i;
   const before=entries.slice(0,first),active=entries.slice(first,last+1),after=entries.slice(last+1),out=[];
   const append=(list,total,max)=>{if(!list.length)return;const count=Math.min(list.length,max,total);for(let j=0;j<count;j++){const index=count===1?0:Math.round(j*(list.length-1)/(count-1)),e=clone(list[index]);e[1]=Math.floor(total/count)+(j<total%count?1:0);out.push(e);}};
   append(before,[3,6,10][strength],2);append(active,[3,5,7][strength],strength+1);append(after,[6,10,16][strength],2);
   a.ents=out;a.flags=out.map((_,i)=>i===out.length-1?32769:0);a.normalTiming={strength,startup:out.slice(0,out.findIndex(e=>e[6]?.[2]>0)).reduce((n,e)=>n+e[1],0),total:out.reduce((n,e)=>n+e[1],0)};
  }return f;
 }
 function sodomFrontKnee(ctx,source,lower,left,top){
  // The raised front knee crosses the waist seam; retain the native lower pixels.
  ctx.save();ctx.beginPath();ctx.rect(-48-left,-45-top,37,18);ctx.clip();ctx.drawImage(source,...lower.slice(0,4),lower[4]-left,lower[5]-top,lower[2],lower[3]);ctx.restore();
 }
 function sodomCrouchAttacks(pack,f){const lower=f.frames[pack.data.crouchFrames[1]],source=pack.image,atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+170;const g=atlas.getContext('2d');g.drawImage(source,0,0);let x=1;
  for(let b=0;b<6;b++){const upper=f.frames[b<3?24:19],shiftX=8,shiftY=27,seam=-27,left=Math.min(lower[4],upper[4]),top=Math.min(lower[5],upper[5]+shiftY),right=Math.max(lower[4]+lower[2],upper[4]+upper[2]+shiftX),pose=document.createElement('canvas');pose.width=right-left;pose.height=3-top;const c=pose.getContext('2d');c.save();c.beginPath();c.rect(0,seam-top,pose.width,pose.height);c.clip();c.drawImage(source,...lower.slice(0,4),lower[4]-left,lower[5]-top,lower[2],lower[3]);c.restore();c.save();c.beginPath();c.rect(0,0,pose.width,seam-top);c.clip();c.drawImage(source,...upper.slice(0,4),upper[4]+shiftX-left,upper[5]+shiftY-top,upper[2],upper[3]);c.restore();sodomFrontKnee(c,source,lower,left,top);if(x+pose.width>=atlas.width)x=1;const index=f.frames.length;g.drawImage(pose,x,source.height+1);f.frames.push([x,source.height+1,pose.width,pose.height,left,top]);x+=pose.width+2;const a=f.anims[14+b];for(const e of a.ents){if(e[6][2]>0){e[0]=index;for(const k of[2,3,6]){e[k][0]+=shiftX;e[k][1]+=2;}}else e[0]=pack.data.crouchFrames[1];}}
  // Keep frame origins and native kneeling legs fixed; register only the upper body.
  f.sodomCrouchJoin={lower:42,shiftX:8,shiftY:27,seam:-27};
  pack.originalImage=source;pack.image=atlas;
 }
 function andoreCrouchPunch(pack,f){
  if(pack.id==='sodom'){sodomCrouchAttacks(pack,f);return;}
  if(!['andore','abigail'].includes(pack.id))return;
  const isAndore=pack.id==='andore',lowerIndex=isAndore?11:20,upperIndex=isAndore?8:18;
  const lower=f.frames[lowerIndex],upper=f.frames[upperIndex],source=pack.image,shiftX=isAndore?23:-4,shiftY=isAndore?22:13,seam=-32,left=Math.min(lower[4],upper[4]+shiftX),top=Math.min(lower[5],upper[5]+shiftY),right=Math.max(lower[4]+lower[2],upper[4]+upper[2]+shiftX),pose=document.createElement('canvas');pose.width=right-left;pose.height=3-top;const g=pose.getContext('2d');g.imageSmoothingEnabled=false;
  g.save();g.beginPath();g.rect(0,seam-top,pose.width,pose.height);g.clip();g.drawImage(source,...lower.slice(0,4),lower[4]-left,lower[5]-top,lower[2],lower[3]);g.restore();
  g.save();g.beginPath();g.rect(0,0,pose.width,seam-top);g.clip();g.drawImage(source,...upper.slice(0,4),upper[4]+shiftX-left,upper[5]+shiftY-top,upper[2],upper[3]);g.restore();
  // Preserve one continuous original crouched waist chain across the join.
  const nativeWaist=document.createElement('canvas');nativeWaist.width=lower[2];nativeWaist.height=lower[3];const ng=nativeWaist.getContext('2d');ng.drawImage(source,...lower.slice(0,4),0,0,lower[2],lower[3]);const original=ng.getImageData(0,0,lower[2],lower[3]).data,pixels=g.getImageData(0,0,pose.width,pose.height),gold=new Set([1,2,4,7,10,12,13,14].map(i=>pack.data.palette[i].join(','))),isGold=(a,i)=>a[i+3]&&gold.has(a[i]+','+a[i+1]+','+a[i+2]);
  if(isAndore)for(let y=-48;y<-25;y++)for(let x=lower[4];x<lower[4]+lower[2];x++){const from=((y-lower[5])*lower[2]+x-lower[4])*4,to=((y-top)*pose.width+x-left)*4;if(isGold(original,from)||isGold(pixels.data,to))for(let c=0;c<4;c++)pixels.data[to+c]=original[from+c];}
  if(!isAndore)for(let y=-38;y<-25;y++)for(let x=lower[4];x<lower[4]+lower[2];x++){const from=((y-lower[5])*lower[2]+x-lower[4])*4,to=((y-top)*pose.width+x-left)*4;for(let c=0;c<4;c++)pixels.data[to+c]=original[from+c];}
  g.putImageData(pixels,0,0);
  const atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+pose.height+2;const ctx=atlas.getContext('2d');ctx.drawImage(source,0,0);ctx.drawImage(pose,0,source.height+1);const index=f.frames.length;f.frames.push([0,source.height+1,pose.width,pose.height,left,top]);pack.originalImage=source;pack.image=atlas;
  for(let b=0;b<6;b++){const strength=b%3,a=anim(pack,pack.id+'CrouchPunch'+b,[[lowerIndex,[3,6,10][strength]],[lowerIndex,[3,5,7][strength]],[lowerIndex,[6,10,16][strength]]],{crouch:true,low:true});a.ents[1][0]=index;Object.assign(a.ents[1],{6:[-65,56,25,16],7:12+strength*6,8:strength,9:b===5?1:0});f.anims[14+b]=a;}
  f.crouchPunch={lower:lowerIndex,upper:upperIndex,frame:index,shiftX,shiftY,seam};
 }
 function ediPoses(pack,f){
  // Sheet crop coordinates are not actor origins. Register the unchanged native heads.
  for(const [frame,x] of [[5,-44],[6,-40],[7,-27],[8,-31]])f.frames[frame][4]=x;
  const source=pack.image,atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+120;const g=atlas.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0);const poses=new Map();let cursor=0;
  const crouch=frame=>{if(poses.has(frame))return poses.get(frame);const r=f.frames[frame],left=Math.min(-37,r[4]+2),top=r[5]+21,right=Math.max(25,r[4]+r[2]+2),w=right-left,h=4-top,x=cursor,y=source.height+1;cursor+=w+2;
   g.drawImage(ediLegs,x-37-left,y-34-top);g.save();g.beginPath();g.rect(x,y,w,-28-top);g.clip();g.drawImage(source,...r.slice(0,4),x+r[4]+2-left,y,r[2],r[3]);g.restore();const index=f.frames.length;f.frames.push([x,y,w,h,left,top]);poses.set(frame,index);return index;};
  const idle=crouch(0);for(const slot of[3,4,27])for(const e of f.anims[slot].ents)if(slot!==4||e===f.anims[slot].ents[0]){e[0]=idle;e[2][1]=78;e[3][1]=52;}
  for(let b=0;b<6;b++)for(const e of f.anims[14+b].ents){e[0]=crouch(e[0]===21?0:e[0]);e[2][1]=78;e[3][1]=52;if(e[6][2])e[6][1]=57;}
  pack.originalImage=source;pack.image=atlas;f.ediCrouch={idle,frames:Object.fromEntries(poses),torsoShiftX:2,torsoShiftY:21,seam:-28};
  for(const base of[8,14,47,53,59]){const a=f.anims[base+2],first=a.ents.findIndex(e=>e[6]?.[2]>0);if(first<0)continue;let last=first;for(let i=first;i<a.ents.length;i++)if(a.ents[i][6]?.[2]>0)last=i;
   const hit=clone(a.ents[first]),second=clone(a.ents[first]),gap=clone(hit);hit[1]=4;second[1]=3;second[0]=base===14?poses.get(10):10;second[6]=[-67,base===14?57:72,30,25];hit[9]=second[9]=0;gap[0]=base===14?idle:9;gap[1]=3;gap[6]=[0,0,0,0];gap[7]=gap[9]=0;
   a.ents=[...a.ents.slice(0,first),hit,gap,second,...a.ents.slice(last+1)];a.flags=a.ents.map((_,i)=>i===a.ents.length-1?32769:0);a.normalDouble={button:2,first,second:first+2,damages:[12,12],gap:3};a.normalTiming={...a.normalTiming,total:a.ents.reduce((n,e)=>n+e[1],0)};
  }
 }
 function build(p,native){if(p.template)return p.template;const f=clone(native);f.name=p.name;f.img=p.data.image;f.frames=clone(p.data.frames);f.pal=clone(p.data.palette);f.pal2=clone(f.pal);
  f.anims=native.anims.map(a=>anim(p,a.name,/^(thpose|throwfall|vegaizunafall)/.test(a.name)?a.ents.map((e,i)=>[sequence(p,p.fall)[i%sequence(p,p.fall).length][0],e[1]]):/hit|hurt/.test(a.name)?p.hurt:p.idle,{loop:a.mode===0}));
  while(f.anims.length<112)f.anims.push(anim(p,'ffExtra'+f.anims.length,p.idle));
  const put=(i,n,seq,o)=>f.anims[i]=anim(p,n,seq,o),one=(s,t=7)=>[sequence(p,s)[0]].map(([f])=>[f,t]);
  put(0,'idle',one(p.idle,12),{loop:true});put(1,'walkf',p.walk,{loop:true});put(2,'walkb',sequence(p,p.walk).reverse(),{loop:true});
  put(3,'crouch',[...one(p.idle,2),...one(p.crouch,3),...one(p.crouch,8)],{loop:true,crouch:true});f.anims[3].loop=2;put(4,'standup',[...one(p.crouch,3),...one(p.idle,3)]);
  const jumpFrame={sodom:0,edi:17,rolento:18,abigail:20,belger:9,andore:11}[p.id];for(let i=5;i<=7;i++)put(i,['jumpn','jumpf','jumpb'][i-5],[[jumpFrame,12]],{loop:true});
  for(let b=0;b<6;b++)for(const base of[8,14,47,53,59]){let seq=sequence(p,p.normal[b]);if(seq.length<3)seq=[...one(p.idle,4),...seq,...one(p.idle,8)];else seq=[...one(base===14?p.crouch:p.idle,b%3===2?7:4),...seq,...one(base===14?p.crouch:p.idle,8)];put(base+b,'ff'+base+'_'+b,seq,{attack:true,strength:b%3,low:base===14,crouch:base===14,kd:base===14&&b===5});}
  for(let i=20;i<=25;i++)put(i,'ffHit'+i,p.hurt);put(26,'blockS',one(p.idle),{loop:true});put(27,'blockC',one(p.crouch),{loop:true,crouch:true});put(28,'fall',p.fall);put(29,'lie',p.lie);put(30,'getup',p.recover);put(31,'win',p.win,{loop:true});put(46,'throw',p.throw);put(103,'ffDizzy',p.hurt,{loop:true});put(104,'ffBurn',p.hurt);
  f.moves=p.specials.map(([name,style,pose],i)=>{const a=p.id==='andore'&&i===5?112:[100,101,102,105,106,107,126][i],source=sequence(p,pose),seq=[...one(p.idle,6),...source,...one(p.idle,12)];if(['spin','dash'].includes(style))seq.splice(1,0,...source,...source);put(a,name,seq,{attack:!['bullet','burst','grenade','rain','retreat','grenade-barrage','hold','pistol','pistol-burst','grab-batter','bolts','bolt-rain','belger-hop','belger-retreat','abigail-spd'].includes(style),strength:2,kd:!['dash','spin'].includes(style)});if(style==='dash'&&p.id==='andore')f.anims[a].ents.forEach((e,j)=>{if(j>0&&j<f.anims[a].ents.length-1){e[6]=[-40,48,28,28];e[7]=24;}});return{name,kind:'ff',style,a,inp:['qcf','qcf','dp','qcb','qcb','hcf','dp'][i],btn:['P','K','P','P','K','P','P'][i],role:['grab','grab-batter','hold','power','baton','sodom-chop','sodom-double','abigail-spd'].includes(style)?'near':style==='rise'?'rise':['dash','sodom-charge','rage','baton-rush','bullet','burst','pistol','pistol-burst','bolts','bolt-rain','grenade','grenade-barrage','rain'].includes(style)?'far':'mid'};});
  if(p.id==='andore'){
   Object.assign(f.moves[0],{inp:'cbf',btn:'P'});Object.assign(f.moves[3],{inp:'grab',btn:'P'});Object.assign(f.moves[4],{inp:'grab',btn:'K'});Object.assign(f.moves[5],{inp:'cdu',btn:'K'});
   const charge=[[11,18],...sequence(p,'run'),...sequence(p,'run'),[6,18]];
   put(100,'Andore Bull Rush',charge,{attack:false,strength:2,kd:true});f.anims[100].ents.forEach((e,i)=>{if(i>0&&i<charge.length-1){e[6]=[-36,48,32,28];e[7]=28;e[8]=2;e[9]=1;}});
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(112,'Andore Flying Seat Drop',[[p.data.airborneFrame,10]],{loop:true});f.anims[112].ents[0][6]=[0,18,34,30];f.anims[112].ents[0][7]=28;f.anims[112].ents[0][8]=2;f.anims[112].ents[0][9]=1;f.anims[112].ents[0][10]=-1;put(113,'Andore Seat Drop Landing',[[11,14],[0,10]]);
   put(111,'Andore Choke Hold',sequence(p,'choke'),{loop:true});put(114,'Andore Carry Straight',sequence(p,'carryStraight'),{loop:true});put(115,'Andore Carry Shake',sequence(p,'carryBent'),{loop:true});
   put(121,'Andore Piledriver Choke',sequence(p,'choke'),{loop:true});put(132,'Andore Carry Jump',[[20,12]],{loop:true});put(133,'Andore Piledriver Rebound',[[p.data.airborneFrame,6]],{loop:true});
   put(116,'Andore Piledriver Squat',[[11,10]],{loop:true});
   put(107,'Andore Piledriver Lift',[[p.data.liftFrame,10]],{loop:true});put(108,'Andore Piledriver Air',[[p.data.airborneFrame,8]],{loop:true});put(109,'Andore Piledriver Land',[[12,14],[0,12]]);
  }
  if(p.id==='rolento'){
   Object.assign(f.moves[2],{inp:'cdu',btn:'K'});Object.assign(f.moves[6],{inp:'cdu',btn:'P'});
   for(let strength=0;strength<3;strength++){const a=put(17+strength,'Rolento Low Slide '+strength,[[9,[3,6,10][strength]],[18,[3,5,7][strength]],[9,[6,10,16][strength]]],{crouch:true});Object.assign(a.ents[1],{6:[-46,14,37,15],7:[10,17,25][strength],8:strength,9:strength===2?1:0,10:1});}
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(118,'Rolento Shoulder Grip',[[16,8]],{loop:true});put(119,'Rolento Shoulder Lift',[[16,8]],{loop:true});put(120,'Rolento Shoulder Release',[[17,8],[10,12]]);
   put(101,'Rolento Grenade Throw',[[10,6],[20,12],[10,16]]);
   put(106,'Rolento Grenade Barrage',[[10,6],[20,7],[10,3],[20,7],[10,3],[20,7],[10,18]]);
   put(110,'Rolento Wall Kick Dive',[[18,5],[19,5]],{loop:true});for(const e of f.anims[110].ents)Object.assign(e,{6:[-45,20,35,32],7:30,8:2,9:1,10:-1});
   put(123,'Rolento Wall Brace',[[17,5]],{loop:true});put(124,'Rolento Wall Punch Dive',[[16,12]],{loop:true});Object.assign(f.anims[124].ents[0],{6:[-38,52,34,28],7:32,8:2,9:1,10:-1});put(125,'Rolento Wall Dive Landing',[[9,5],[10,7]]);
   f.anims[126].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(102,'Rolento Wall Kick',[[9,5],...p.data.acrobaticFrames.map(i=>[i,3]),[18,12],[10,8]],{attack:false});put(117,'Rolento Acrobatic Roll',p.data.acrobaticFrames.map(i=>[i,3]),{loop:true});
   for(let i=5;i<=7;i++)put(i,['jumpn','jumpf','jumpb'][i-5],p.data.acrobaticFrames.map(frame=>[frame,3]),{loop:true});
   for(const base of[53,59])for(let strength=0;strength<3;strength++){const a=put(base+3+strength,'Rolento Flying Kick '+strength,[[17,[3,6,10][strength]],[18,[3,5,7][strength]],[17,[6,10,16][strength]]]);Object.assign(a.ents[1],{6:[-45,20,35,28],7:[10,17,25][strength],8:strength,10:-1});}
   // Compact rolling bodies do not retain the empty standing push-box space.
   for(const slot of[5,6,7,117])for(const e of f.anims[slot].ents){e[2]=[0,64,20,12];e[3]=[0,48,23,14];e[4]=[0,32,21,10];e[5]=[0,48,23,22];}
  }
  if(p.id==='edi'){
   put(31,'Edi Chew and Spit',p.data.victory.sequence,{loop:true});f.anims[31].loop=f.anims[31].ents.length-1;
   put(100,'Edi Police Pistol',[[0,4],[24,4],[25,6],[28,6],[29,3],[28,8],[25,5],[4,10]]);
   Object.assign(f.moves[0],{hand:'right',name:'Right Holster Fire'});Object.assign(f.moves[5],{hand:'left',name:'Left Holster Fire'});
   put(107,'Edi Left Holster Fire',[[0,4],[12,8],[13,8],[14,5],[13,5],[0,10]]);
   put(106,'Edi Pistol Burst',[[0,4],[24,4],[25,6],[28,6],[29,3],[28,8],[29,3],[28,8],[29,3],[28,8],[25,5],[4,10]]);
   put(101,'Edi Baton Rush',[[4,8],[5,4],[6,4],[7,4],[8,4],[9,5],[10,5],[11,6],[4,12]],{attack:false});
   put(102,'Edi Baton Smash',[[9,12],[10,5],[11,8],[4,14]],{attack:false});
   for(const [slot,index]of[[101,6],[102,1]]){const e=f.anims[slot].ents[index];e[6]=[-62,68,37,24];e[7]=30;e[8]=2;e[9]=1;e[10]=slot===102?-1:0;}
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(111,'Edi Arrest and Batter',[[12,12],[14,5],[15,4],[14,6],[15,4],[14,6],[15,4],[12,12]]);
  }
  if(p.id==='abigail'){
   put(100,'Abigail Rage Charge',[[10,18],...[11,12,13,14,11,12,13,14].map(i=>[i,3]),[16,20]],{attack:false});
   for(let i=1;i<=8;i++){const e=f.anims[100].ents[i];e[6]=[-35,57,32,30];e[7]=40;e[8]=2;e[9]=1;}
   Object.assign(f.moves[3],{inp:'360',btn:'P'});
   for(const slot of[101,105])f.anims[slot].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(111,'Abigail Piledriver Grip',[[19,10]],{loop:true});put(112,'Abigail Piledriver Squat',[[20,12]],{loop:true});put(113,'Abigail Piledriver Spin',p.data.spinningPile.frames.map(i=>[i,4]),{loop:true});put(114,'Abigail Piledriver Landing',[[p.data.spinningPile.frames[0],12],[26,8],[4,8]]);put(115,'Abigail Piledriver Lift',[[21,12]],{loop:true});
   put(107,'Abigail Throw Grip',[[19,9]],{loop:true});put(108,'Abigail Throw Lift',[[21,12]],{loop:true});put(109,'Abigail Throw Recovery',[[17,20],[4,8]]);
  }
  if(p.id==='sodom'){
   const cr=p.data.crouchFrames;for(let i=5;i<=7;i++)put(i,'Sodom Air Sword Guard',[[cr[0],12]],{loop:true});put(31,'Sodom Sword Victory',[[18,12]],{loop:true});put(3,'Sodom Crouch',[[cr[0],3],[cr[1],3],[cr[1],8]],{loop:true,crouch:true});f.anims[3].loop=2;put(4,'Sodom Stand Up',[[cr[0],3],[3,3]]);
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});put(111,'Sodom Gut Buster',sequence(p,'gutPunch'));
   for(const base of[8,14,47,53,59])for(let b=0;b<6;b++){const a=f.anims[base+b];for(const e of a.ents){const active=e[0]===(b<3?24:19);e[6]=active?[-(b<3?48:66),base===14?30:63,b<3?26:40,20]:[0,0,0,0];e[7]=active?12+(b%3)*6:0;e[8]=b%3;}}
   put(100,'Sodom Katana Rush',[[3,18],...[14,15,16,17,14,15,16,17].map(i=>[i,3]),[3,16]],{attack:false});
   for(let i=1;i<=8;i++){const e=f.anims[100].ents[i];e[6]=[-46,48,40,28];e[7]=30;e[8]=2;e[9]=1;}
   put(101,'Sodom Twin Blade Chops',[[3,5],...sequence(p,'swordSlash',3),[3,7],...sequence(p,'swordSlash',4),[3,15]],{attack:true,strength:2});
   put(102,'Sodom Heavy Sword Chop',[[3,7],...sequence(p,'swordSlash'),[3,18]],{attack:true,strength:2,kd:true});
  }
  if(p.id==='belger'){
   put(100,'Belger Crossbow Volley',[[7,8],[14,5],[15,4],[16,7],[15,4],[16,7],[15,4],[7,15]]);
   put(101,'Belger Escape Leap',[[9,5],[8,10],[7,8]],{loop:true});
   put(102,'Belger Sky Bolt Rain',[[7,8],[12,33],[7,16]]);
   put(105,'Belger Escape Hop',[[9,5],[8,10],[7,8]],{loop:true});
  }
  const scale=p.data.sizeAdjustment?.factor||1;if(scale!==1)for(const a of f.anims)for(const e of a.ents)for(let k=2;k<=6;k++)if(Array.isArray(e[k]))e[k]=e[k].map(n=>Math.round(n*scale));
  retimeNormals(f);if(p.id==='edi')ediPoses(p,f);andoreCrouchPunch(p,f);andorePalmNormals(p,f);abigailNormals(p,f);if(p.id==='belger')belgerAnims(p,f);if(p.id==='sodom'){sodomUnarmed(p,f);sodomDoubleNormals(p,f);window.SF2AISodomBlades?.apply(p,f);}delete f._ai;return p.template=f;
 }
 function belgerAnims(pack,f){
  const n=pack.data.nativeRecovery,src=a=>n.frameBySource[a],mk=(name,seq,o)=>anim(pack,'Belger '+name,seq,o),idle=n.actions.seatedIdle[0][0],stand=n.actions.footWalk[0][0],walk=n.actions.footWalk,low=src('0x50dfe'),crouch=src('0x50cd0'),rise=src('0x50d20');
  const seated={0:mk('Seated Ready',[[idle,10]],{loop:true}),1:mk('Wheel Forward',n.actions.wheel,{loop:true}),2:mk('Wheel Backward',n.actions.wheel,{loop:true}),3:mk('Seated Low Brace',[[idle,3],[idle,3],[idle,8]],{loop:true,crouch:true}),4:mk('Seated Release',[[idle,3]]),26:mk('Seated Guard',[[idle,8]],{loop:true}),27:mk('Seated Low Guard',[[idle,8]],{loop:true,crouch:true}),30:mk('Seated Recover',[[idle,10]]),31:mk('Seated Victory',n.actions.wheel,{loop:true})};seated[3].loop=2;
  const foot={0:mk('Foot Ready',[[stand,10]],{loop:true}),1:mk('Foot Walk Forward',walk,{loop:true}),2:mk('Foot Walk Backward',walk,{loop:true}),3:mk('Crouch',[[stand,3],[low,3],[low,8]],{loop:true,crouch:true}),4:mk('Rise',[[low,3],[stand,3]]),26:mk('Foot Guard',[[stand,8]],{loop:true}),27:mk('Low Guard',[[low,8]],{loop:true,crouch:true}),30:mk('Native Recover',n.actions.recovery),31:mk('Foot Victory',[[src('0x50dac'),12]],{loop:true})};foot[3].loop=2;
  for(let i=20;i<=25;i++){seated[i]=mk('Seated Hit '+i,n.actions.wheel);foot[i]=mk('Native Hit '+i,n.actions.hurt);}
  f.belgerSeated=seated;f.belgerFoot=foot;Object.assign(f.anims,seated);
  for(let slot=5;slot<=7;slot++)f.anims[slot]=mk('Native Jump',[[rise,10],[crouch,120]],{loop:true});
  f.anims[28]=mk('Native Fall',[...n.actions.fall,...n.actions.down]);f.anims[29]=mk('Defeated',[[18,20]]);f.anims[46]=mk('Crossbow Throw',[[stand,8],[src('0x50dac'),12],[stand,8]]);
  for(const base of[8,14,47,53,59])for(let b=0;b<6;b++){
   const strength=b%3,isLow=base===14,prep=isLow?low:stand,active=isLow?crouch:walk[1][0],a=mk('Crossbow Contact '+base+' '+b,[[prep,[3,6,10][strength]],[active,[3,5,7][strength]],[prep,[6,10,16][strength]]],{crouch:isLow,low:isLow});
   Object.assign(a.ents[1],{6:[-53,isLow?25:62,29,isLow?18:21],7:[10,17,25][strength],8:strength,9:isLow&&b===5?1:0,10:isLow?1:base>=53?-1:0});a.normalTiming={strength,startup:[3,6,10][strength],total:[12,21,33][strength]};f.anims[base+b]=a;
  }
  f.anims[100]=mk('Crossbow Volley',[[stand,8],...Array.from({length:3},()=>[[walk[1][0],4],[stand,7]]).flat(),[stand,16]]);
  f.anims[101]=mk('Native Escape Leap',[[rise,10],[crouch,120]],{loop:true});f.anims[105]=mk('Native Escape Hop',[[rise,10],[crouch,120]],{loop:true});
  f.anims[102]=mk('Upward Bolt Rain',[[stand,2],[src('0x50dac'),44],[stand,11]]);
  f.anims[106]=mk('Crossbow Butt',[[stand,10],[walk[1][0],7],[stand,16]],{attack:true,strength:2,kd:true});
  f.anims[103]=mk('Dizzy',n.actions.hurt,{loop:true});f.anims[104]=mk('Burn',n.actions.fall);
  // The shared throw/reaction host looks these slots up by their existing names.
  for(const[slot,name]of Object.entries({0:'idle',1:'walkf',2:'walkb',3:'crouch',4:'standup',5:'jumpn',6:'jumpf',7:'jumpb',26:'blockS',27:'blockC',28:'fall',29:'lie',30:'getup',31:'win',46:'throw'}))for(const a of[f.anims[slot],seated[slot],foot[slot]])if(a){a.nativeActionName=a.name;a.name=name;}
 }
 function belgerSync(p){if(p.aiProfile!=='belger'||!p.F?.belgerFoot)return;const foot=SF2AIFFChair.dismounted(p),map=foot?p.F.belgerFoot:p.F.belgerSeated;if(p.F.belgerIsFoot===foot)return;p.F.belgerIsFoot=foot;Object.assign(p.F.anims,map);if(map[p.cur]){p.anim=p.F.anims[p.cur];p.aidx=Math.min(p.aidx||0,p.anim.ents.length-1);p.acc=Math.min(p.acc||0,p.anim.ents[p.aidx][1]-1);}}
 function sodomUnarmed(pack,f){
  const source=pack.image,lower=f.frames[42],atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+130;const g=atlas.getContext('2d');g.drawImage(source,0,0);const low=[];
  for(const [j,index]of[25,24].entries()){
   const upper=f.frames[index],shiftX=8,shiftY=27,seam=-27,left=Math.min(lower[4],upper[4]),top=Math.min(lower[5],upper[5]+shiftY),right=Math.max(lower[4]+lower[2],upper[4]+upper[2]+shiftX),pose=document.createElement('canvas');pose.width=right-left;pose.height=3-top;const c=pose.getContext('2d');
   c.save();c.beginPath();c.rect(0,seam-top,pose.width,pose.height);c.clip();c.drawImage(source,...lower.slice(0,4),lower[4]-left,lower[5]-top,lower[2],lower[3]);c.restore();c.save();c.beginPath();c.rect(0,0,pose.width,seam-top);c.clip();c.drawImage(source,...upper.slice(0,4),upper[4]+shiftX-left,upper[5]+shiftY-top,upper[2],upper[3]);c.restore();sodomFrontKnee(c,source,lower,left,top);
   const x=1+j*150;g.drawImage(pose,x,source.height+1);low.push(f.frames.length);f.frames.push([x,source.height+1,pose.width,pose.height,left,top]);
  }
  pack.image=atlas;const air=f.frames.length,r=f.frames[0];f.frames.push([...r.slice(0,4),-Math.floor(r[2]/2),r[5]]);
  const adapted={...pack,data:{...pack.data,frames:f.frames}},unarmed={},put=(i,name,list,options)=>unarmed[i]=anim(adapted,'Sodom Unarmed '+name,list,options);
  put(0,'Ready',[[25,12]],{loop:true});put(1,'Walk',[14,15,16,17],{loop:true});put(2,'Back',[17,16,15,14],{loop:true});put(3,'Crouch',[[25,3],[low[0],3],[low[0],8]],{loop:true,crouch:true});unarmed[3].loop=2;put(4,'Stand',[[low[0],3],[25,3]]);
  for(let i=5;i<=7;i++)put(i,'Jump',[[air,12]],{loop:true});put(26,'Guard',[[25,8]],{loop:true});put(27,'Low Guard',[[low[0],8]],{loop:true,crouch:true});put(31,'Victory',[[30,12]],{loop:true});
  for(const base of[8,14,47,53,59])for(let b=0;b<6;b++){
   const strength=b%3,crouch=base===14,poses=crouch?low:[25,24],a=put(base+b,'Punch '+base+' '+b,[[poses[0],[3,6,10][strength]],[poses[1],[3,5,7][strength]],[poses[0],[6,10,16][strength]]],{crouch,low:crouch});Object.assign(a.ents[1],{6:[-39,crouch?32:63,24,18],7:[8,14,21][strength],8:strength,9:crouch&&b===5?1:0,10:crouch?1:0});a.normalTiming={strength,startup:[3,6,10][strength],total:[12,21,33][strength]};
  }
  f.anims[128]=anim(pack,'Sodom Unarmed Double Punch',[[25,5],[24,4],[25,7],[24,4],[25,14]]);for(const i of[1,3])Object.assign(f.anims[128].ents[i],{6:[-39,63,24,18],7:14,8:2,9:0,10:0});
  f.anims[129]=anim(pack,'Sodom Unarmed Heavy Punch',[[25,10],[24,7],[25,16]]);Object.assign(f.anims[129].ents[1],{6:[-39,63,24,18],7:26,8:2,9:1,10:0});
  f.anims[130]=anim(pack,'Sodom Recover Katana',[[26,3],[32,9]]);f.anims[131]=anim(pack,'Sodom Lift Recovered Katana',[[41,3],[42,3]]);for(const a of Object.values(unarmed))for(const e of a.ents)if(low.includes(e[0]))for(const k of[2,3,...(e[6][2]>0?[6]:[])]){e[k][0]+=8;e[k][1]+=2;}f.sodomUnarmed=unarmed;f.sodomArmed=Object.fromEntries(Object.keys(unarmed).map(i=>[i,f.anims[i]]));f.sodomUnarmedLow=low;
 }
 function sodomDoubleNormals(pack,f){
  // Retain the approved kneeling legs; only the second blade torso is new.
  const source=pack.image,lower=f.frames[42],upper=f.frames[20],shiftX=8,shiftY=27,seam=-27,left=Math.min(lower[4],upper[4]),top=Math.min(lower[5],upper[5]+shiftY),right=Math.max(lower[4]+lower[2],upper[4]+upper[2]+shiftX),pose=document.createElement('canvas');pose.width=right-left;pose.height=3-top;const c=pose.getContext('2d');
  c.save();c.beginPath();c.rect(0,seam-top,pose.width,pose.height);c.clip();c.drawImage(source,...lower.slice(0,4),lower[4]-left,lower[5]-top,lower[2],lower[3]);c.restore();c.save();c.beginPath();c.rect(0,0,pose.width,seam-top);c.clip();c.drawImage(source,...upper.slice(0,4),upper[4]+shiftX-left,upper[5]+shiftY-top,upper[2],upper[3]);c.restore();sodomFrontKnee(c,source,lower,left,top);
  const atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+pose.height+2;const g=atlas.getContext('2d');g.drawImage(source,0,0);g.drawImage(pose,1,source.height+1);const lowBlade=f.frames.length;f.frames.push([1,source.height+1,pose.width,pose.height,left,top]);pack.image=atlas;f.sodomDoubleLow={frame:lowBlade,lower:42,upper:20,shiftX,shiftY,seam};
  for(const armed of[true,false])for(const base of[8,14,47,53,59])for(const button of[2,4,5]){
   const list=armed?f.anims:f.sodomUnarmed,a=list[base+button],strength=button%3,first=a.ents.findIndex(e=>e[6]?.[2]>0);let last=first;for(let i=first;i<a.ents.length;i++)if(a.ents[i][6]?.[2]>0)last=i;
   const before=clone(a.ents.slice(0,first)),after=clone(a.ents.slice(last+1)),active=a.ents.slice(first,last+1).reduce((n,e)=>n+e[1],0),firstHit=clone(a.ents[first]),secondHit=clone(firstHit),gap=clone(firstHit),punch=button===2||!armed,crouch=base===14,wait=strength===1?2:3;
   firstHit[1]=Math.ceil(active/2);firstHit[9]=0;secondHit[1]=Math.floor(active/2);secondHit[0]=punch?firstHit[0]:crouch?lowBlade:20;if(!punch&&!crouch)secondHit[6][1]=45;
   gap[0]=punch?(crouch?f.sodomUnarmedLow[0]:25):firstHit[0];gap[1]=wait;gap[6]=[0,0,0,0];gap[7]=gap[9]=0;
   a.ents=[...before,firstHit,gap,secondHit,...after];a.flags=a.ents.map((_,i)=>i===a.ents.length-1?32769:0);a.normalTiming={...a.normalTiming,total:a.ents.reduce((n,e)=>n+e[1],0)};a.normalDouble={button,first:before.length,second:before.length+2,damages:armed?[strength===1?10:14,strength===1?10:14]:[strength===1?8:12,strength===1?8:12],gap:wait};
   if(armed)f.sodomArmed[base+button]=a;
  }
 }
 function normalContact(player,blocked){
  const m=player.anim?.normalDouble;if(!m||!['sodom','edi'].includes(player.aiProfile)||![1,2].includes(player.ST)||player.aidx>=m.second)return;
  let s=player.AIFFNormal;if(!s||s.serial!==player.AIAttackSerial||s.slot!==player.cur)s=player.AIFFNormal={serial:player.AIAttackSerial,slot:player.cur,window:1,firstContact:false};
  if(s.firstContact)return;s.firstContact=true;s.blocked=blocked;player.opp.KB=player.aiProfile==='edi'?0:Math.trunc((player.opp.KB||0)*.1);if([5,6].includes(player.opp.ST))player.opp.STUN=Math.max(player.opp.STUN,m.gap+6);
 }
 function sodomNormalStep(player){
  const a=player.anim,m=a?.normalDouble;if(!m||!([1,2].includes(player.ST))){delete player.AIFFNormal;return;}
  let s=player.AIFFNormal;if(!s||s.serial!==player.AIAttackSerial||s.slot!==player.cur)s=player.AIFFNormal={serial:player.AIAttackSerial,slot:player.cur,window:0,firstContact:false};
  if(player.aidx<m.second&&player.hitdone&&!s.firstContact)normalContact(player,player.opp.ST===6);
  const current=a.ents[player.aidx],index=player.acc+1>=current[1]?player.aidx+1:player.aidx,window=index>=m.second?2:index>=m.first?1:0;
  if(window===2&&s.window!==2)player.hitdone=0;s.window=window;
 }
 function swordEquipped(player){return player.aiProfile!=='sodom'||!player.AIFFSword;}
 function swordAnims(player,armed){const list=armed?player.F?.sodomArmed:player.F?.sodomUnarmed;if(!list)return;for(const [i,a]of Object.entries(list))player.F.anims[i]=a;if(player.anim?.guest){player.anim=player.F.anims[player.cur];player.aidx=Math.min(player.aidx,player.anim.ents.length-1);player.acc=Math.min(player.acc,player.anim.ents[player.aidx][1]-1);}}
 function resetSword(player){swordAnims(player,true);delete player.AIFFSword;delete player.AIFFNormal;if(player.aiProfile==='sodom')window.SF2AISodomBlades?.sync(get('sodom'),player);}
 function disarm(player,dir){if(player.aiProfile!=='sodom'||player.AIFFSword)return false;player.AIFFSword={x:player.X/256,y:player.Y/256+78,vx:dir*1.5,vy:3.5,age:0,bounce:0,phase:'toss'};swordAnims(player,false);window.SF2AISodomBlades?.sync(get('sodom'),player);return true;}
 function swordStep(player,room,sound){const w=player.AIFFSword;if(!w)return;w.age++;if(w.phase==='floor')return;w.vy-=.34375;w.vx-=Math.sign(w.vx)*Math.min(Math.abs(w.vx),2/256);w.x+=w.vx;w.y+=w.vy;w.x=Math.max(room.left+44,Math.min(room.right-44,w.x));
  if(w.y<=0){w.y=0;sound?.();if(!w.bounce){w.bounce=1;w.vx=Math.sign(w.vx||1);w.vy=3;}else{w.phase='floor';w.vx=w.vy=0;}}
 }
 function swordDraw(ctx,player,camera,ground){const w=player.AIFFSword;if(!w)return;const data=SF2AIFFData.sodom.katana,frame=data.frames[w.phase==='floor'?data.frames.length-1:w.age%(data.frames.length-1)];ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(swordImage,...frame.slice(0,4),Math.round(w.x-camera)+frame[4],Math.round(ground-2-w.y)+frame[5],frame[2],frame[3]);ctx.restore();}
 function swordPickup(player,h){const w=player.AIFFSword;if(player.aiProfile!=='sodom'||!w||w.phase!=='floor'||player.HP<=0||player.Y!==0||![0,3,4].includes(player.ST)||Math.abs(player.X/256-w.x)>22||!(h.keys&8)||!(h.nw&0x70))return false;
  Object.assign(player,{ST:11,MV:{kind:'ff',style:'sodom-pickup',name:'Recover Katana'},AIFFMove:{age:0},VX:0,VY:0,KB:0,SPK:0,SPKD:0,RETCR:0,hitdone:1});h.anim(player,130,0);return true;
 }
 function swordCPU(player,danger){const w=player.AIFFSword;if(player.aiProfile!=='sodom'||!w||w.phase!=='floor'||danger||player.HP<=0||player.opp.HP<=0)return null;const dx=w.x-player.X/256;return Math.abs(dx)<=22?8|16:dx>0?2:1;}
 function bind(player,native,id){const p=get(id);player.F=clone(build(p,native));player.AIAtlas=player.AIAtlasAlt=p.image;player.ft=[p.speed,p.speed*.72|0,[0,0,p.jump,0x40],[-0x240,0,p.jump,0x40],[0x280,0,p.jump,0x40]];}
 function art(player){const p=get(player.aiProfile),f=player.F;let frame;
  if(player.DIZZY===2)frame=sequence(p,p.hurt)[Math.floor((player.STUN||0)/10)%sequence(p,p.hurt).length][0];
  else if(player.CESpecial&&player.anim?.name?.startsWith('ceSpecialBurn'))frame=sequence(p,p.hurt)[0][0];
  else if(player.anim?.guest)frame=player.anim.ents[Math.min(player.aidx,player.anim.ents.length-1)][0];
  else frame=f.anims[[7,8].includes(player.ST)?player.Y>8*256?28:29:player.ST===10?30:player.ST===5?22:0].ents[0][0];
  if(p.id==='belger'&&!SF2AIFFChair.dismounted(player)&&([1,11].includes(player.ST)||player.ST===3))frame=SF2AIFFChair.frameAt(p.data.nativeRecovery.actions.wheel,player.AIFFChair?.age||0);
  // Shared airborne poses retain their air pivot; grounded reuse meets the same sole line.
  let rect=f.frames[frame];const groundShift=p.data.floorAlignment?.groundFrameOffsets?.[frame];if(player.Y===0&&player.ST<=4&&groundShift)rect=[...rect.slice(0,5),rect[5]+groundShift];
  return{image:p.id==='sodom'&&window.SF2AISodomBlades?SF2AISodomBlades.artImage(p,player):p.image,rect,alternate:false,nativeSourceFrame:frame,nativeEyeFrame:p.id==='belger'&&frame>34?null:frame,burning:!!player.CESpecial&&player.anim?.name?.startsWith('ceSpecialBurn')};
 }
 function portrait(id,original,kind){const p=get(id),w=original.naturalWidth||original.width,h=original.naturalHeight||original.height,key=w+':'+h+kind;if(p.portraits.has(key))return p.portraits.get(key);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(!kind.endsWith('R')){g.translate(w,0);g.scale(-1,1);}const top=kind.startsWith('sel')?32:0,revised=['abigail','belger'].includes(id),crop=revised?[0,0,96,96]:[8,0,76,72],scale=(revised?Math.min:Math.max)(w/crop[2],(h-top)/crop[3]),dw=crop[2]*scale,dh=crop[3]*scale;g.save();g.beginPath();g.rect(0,top,w,h-top);g.clip();g.drawImage(p.portraitImage,...crop,(w-dw)/2,top+(h-top-dh)/2,dw,dh);g.restore();p.portraits.set(key,c);return c;}
 function victoryStep(player){
  if(player.aiProfile!=='edi'||player.ST!==9||player.cur!==31||player.HP<=0){delete player.AIFFVictory;return;}
  const s=player.AIFFVictory||(player.AIFFVictory={age:0,spits:0});s.age++;
  if(s.age===SF2AIFFData.edi.victory.spitAt){const point=mouth(player),dir=player.FACE?1:-1;s.gum={x:point.x,y:point.y,vx:dir*2.1,vy:1.2,age:0,floor:false};s.spits++;}
  const g=s.gum;if(g&&!g.floor){g.age++;g.x+=g.vx;g.y+=g.vy;g.vy-=.22;if(g.y<=0){g.y=0;g.vx=g.vy=0;g.floor=true;}}
 }
 function victoryDraw(ctx,player,camera,ground){const g=player.AIFFVictory?.gum;if(!g)return;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(gumImage,Math.round(g.x-camera)-4,Math.round(ground-g.y)-3);ctx.restore();}
 function andorePalmNormals(pack,f){
  if(pack.id!=='andore'||!pack.data.openPalm)return;
  const poses=pack.data.openPalm.frames,prep=pack.data.openPalm.prep??7;
  for(const base of[8,47,53,59])for(let strength=0;strength<3;strength++){
   const frame=poses[strength?1:0],a=anim(pack,'Andore Open Palm '+base+' '+strength,[[prep,[3,6,10][strength]],[frame,[3,5,7][strength]],[prep,[6,10,16][strength]]]);
   for(const e of a.ents)for(let k=2;k<=5;k++)e[k]=e[k].map(n=>Math.round(n*(pack.data.sizeAdjustment?.factor||1)));
   Object.assign(a.ents[1],{6:[-84,83,30,16],7:[10,17,25][strength],8:strength,10:base>=53?-1:0});
   a.normalTiming={strength,startup:[3,6,10][strength],total:[12,21,33][strength]};f.anims[base+3+strength]=a;
  }
  // Only the hand changes in the approved crouching punch composite.
  const source=pack.image,old=f.frames[f.crouchPunch.frame],upper=f.frames[8],idle=f.frames[0],left=old[4]-6,top=old[5],pose=document.createElement('canvas');pose.width=old[2]+6;pose.height=old[3];const c=pose.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(source,...old.slice(0,4),6,0,old[2],old[3]);
  const dx=upper[4]+f.crouchPunch.shiftX-left,dy=upper[5]+f.crouchPunch.shiftY-top;c.clearRect(dx,dy+31,13,16);c.drawImage(source,idle[0],idle[1]+26,22,15,dx-6,dy+26,22,15);
  const atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+pose.height+2;const g=atlas.getContext('2d');g.drawImage(source,0,0);g.drawImage(pose,0,source.height+1);const index=f.frames.length;f.frames.push([0,source.height+1,pose.width,pose.height,left,top]);pack.image=atlas;
  for(let button=3;button<6;button++)for(const e of f.anims[14+button].ents)if(e[6]?.[2])e[0]=index;
  f.crouchPalm={frame:index,original:f.crouchPunch.frame,sourceUpper:poses[0],shiftX:f.crouchPunch.shiftX,shiftY:f.crouchPunch.shiftY};
 }
 function abigailNormals(pack,f){
  if(pack.id!=='abigail')return;
  const source=pack.image,hand=f.frames[19],proof=[],append=(bodyIndex,name)=>{const body=f.frames[bodyIndex],c=document.createElement('canvas');c.width=body[2]+4;c.height=body[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,...body.slice(0,4),4,0,body[2],body[3]);g.clearRect(4,26,16,15);g.drawImage(source,hand[0],hand[1]+11,22,16,0,20,22,16);proof.push({name,body:bodyIndex,bodyShift:[4,0],erase:[4,26,16,15],hand:19,handSource:[0,11,22,16],handDestination:[0,20],canvas:c,origin:[body[4]-4,body[5]]});return c;};
  append(17,'prep');append(18,'palm');append(f.crouchPunch.frame,'low');
  const atlas=document.createElement('canvas');atlas.width=source.width;atlas.height=source.height+Math.max(...proof.map(q=>q.canvas.height))+2;const g=atlas.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(source,0,0);let x=0;for(const q of proof){g.drawImage(q.canvas,x,source.height+1);q.frame=f.frames.length;f.frames.push([x,source.height+1,q.canvas.width,q.canvas.height,...q.origin]);x+=q.canvas.width+2;delete q.canvas;}pack.image=atlas;f.abigailPalm={prep:proof[0].frame,frame:proof[1].frame,low:proof[2].frame,proof};
  for(const base of[8,47,53,59])for(let button=0;button<6;button++){const strength=button%3,palm=button>=3,prep=palm?proof[0].frame:17,frame=palm?proof[1].frame:18,a=anim(pack,'Abigail '+(palm?'Open Palm':'Fist')+' '+base+' '+strength,[[17,[3,6,10][strength]],[18,[3,5,7][strength]],[17,[6,10,16][strength]]]);a.ents[0][0]=a.ents[2][0]=prep;a.ents[1][0]=frame;Object.assign(a.ents[1],{6:palm?[-64,74,24,16]:[-61,70,22,13],7:[10,17,25][strength],8:strength,10:base>=53?-1:0});a.normalTiming={strength,startup:[3,6,10][strength],total:[12,21,33][strength]};f.anims[base+button]=a;}
  for(let button=0;button<6;button++){const strength=button%3;f.anims[14+button].normalTiming={strength,startup:[3,6,10][strength],total:[12,21,33][strength]};if(button>=3)for(const e of f.anims[14+button].ents)if(e[6]?.[2]){e[0]=proof[2].frame;e[6]=[-68,60,26,15];}}
 }
 function bodyScale(player){return get(player.aiProfile)?.data.sizeAdjustment?.factor||1;}
 function mouth(player){const scale=bodyScale(player),r=art(player).rect,lying=player.cur===29,x=lying?r[4]+r[2]*.72:-12*scale;return{x:player.X/256+(player.FACE?-x:x),y:player.Y/256+(lying?12*scale:Math.min(98*scale,Math.max(35*scale,-r[5]-17*scale)))};}
 function start(player,m,str,h){if(['bullet','burst','grenade','rain','retreat','grenade-barrage','pistol','pistol-burst','bolts','bolt-rain'].includes(m.style)&&player.FBON&&!(player.aiProfile==='edi'&&m.style==='pistol'))return false;Object.assign(player,{ST:11,MV:m,SPSTR:str,SPK:1,SPKD:['dash','spin'].includes(m.style)?0:1,RETCR:0,KB:0,hitdone:0,AIFFMove:{age:0,phase:-1,launched:false,shots:0,dir:player.FACE?1:-1,fromAir:player.Y>0}});h.anim(player,!swordEquipped(player)&&m.style==='sodom-double'?128:!swordEquipped(player)&&m.style==='sodom-chop'?129:m.a,0);h.sound(0x25);return true;}
 function spawn(player,type,age){const dir=player.FACE?1:-1;player.AIFFProjectile={type,age:0,dir,strength:player.SPSTR};player.FBON=1;player.FBK='ff-'+type;player.FBDEF=null;player.FBAN=null;player.FBIMPACT=0;player.FBX=type==='rain'?player.opp.X-dir*30*256:player.X+dir*40*256;player.FBY=(type==='grenade'?84:type==='rain'?150:68)*256;player.FBVX=dir*(type==='grenade'?0x300:type==='rain'?0x60:0x580);player.AIFFProjectile.vy=type==='grenade'?0x280:type==='rain'?-0x480:0;}
 function step(player,h){const p=get(player.aiProfile),m=player.MV,s=player.AIFFMove;
  if(m?.kind==='throw'&&player.AIFFHold){if(player.AIFFHold.kind==='batter')batterStep(player,h);else holdStep(player,h);return;}
  if(m?.kind==='throw'&&player.AIFFThrow){if(player.AIFFThrow.kind==='abigail-spd')abigailPileStep(player,h);else if(player.AIFFThrow.kind==='shoulder')shoulderStep(player,h);else if(player.AIFFThrow.kind==='toss')tossStep(player,h);else pileStep(player,h);return;}
  if(m?.kind==='throw'){if(player.THV){player.opp.X=player.X-player.THV.d*28*256;player.opp.Y=0;player.opp.STUN=999;if(--player.THV.t<=0)h.release(player);}if(--player.SCNT<=0)h.idle(player);return;}
  if(!s||m?.kind!=='ff')return;s.age++;
  if(m.style==='sodom-pickup'){if(s.age===12&&player.AIFFSword?.phase==='floor'&&Math.abs(player.X/256-player.AIFFSword.x)<=22){resetSword(player);h.anim(player,131,0);h.sound(0x10);}if(s.age>=18){delete player.AIFFMove;h.idle(player);}return;}
  if(p.id==='sodom'&&m.style==='grab'){if(s.age===8&&Math.abs(player.X-player.opp.X)<=64*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(p.id==='sodom'&&m.style.startsWith('sodom-')){sodomStep(player,h);return;}
  if(p.id==='belger'){belgerStep(player,h);return;}
  if(p.id==='edi'){ediStep(player,h);return;}
  if(p.id==='abigail'&&m.style==='rage'){rageStep(player,h);return;}
  if(p.id==='abigail'&&['grab','abigail-spd'].includes(m.style)){if(s.age===8&&Math.abs(player.X-player.opp.X)<=64*256&&(m.style==='abigail-spd'?[0,1,3,4,5,6]:[0,3,4,5,6]).includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(p.id==='rolento'&&m.style==='grab'){if(s.age===8&&Math.abs(player.X-player.opp.X)<=64*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(p.id==='rolento'&&['grenade','grenade-barrage','retreat','wallkick','wallpunch'].includes(m.style)){rolentoStep(player,h);return;}
  if(p.id==='andore'&&m.style==='seatdrop'){
   if(!s.launched){s.launched=true;s.phase='rise';player.VX=s.dir*0x2c0;player.AX=0;player.VY=s.fromAir?Math.min(player.VY,0):0x780;player.AY=0x40;}
   if(s.phase==='recover'){if(s.age-s.landed>=24){delete player.AIFFMove;h.idle(player);}return;}
   if(player.VY<=0){s.phase='drop';player.VY=Math.min(player.VY,-0x500);player.AY=0x60;}
   if(!h.gravity(player)){s.phase='recover';s.landed=s.age;player.VX=0;h.anim(player,113,0);h.sound(0x2f);}return;
  }
  if(p.id==='andore'&&m.style==='dash'){
   chargeStep(player,h,18,0x480+player.SPSTR*0x60);return;
  }
  if(p.id==='andore'&&m.style==='hold'){
   if(s.age===8&&Math.abs(player.X-player.opp.X)<=58*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.hold(player);
   else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;
  }
  if(p.id==='andore'&&m.style==='grab'){
   if(s.age===8&&Math.abs(player.X-player.opp.X)<=64*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.grab(player);
   else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;
  }
  if(['dash','spin','power'].includes(m.style)){const phase=Math.min(m.style==='power'?0:2,Math.floor((s.age-6)/9));if(phase>=0&&phase!==s.phase){s.phase=phase;player.hitdone=0;player.AIAttackSerial=(player.AIAttackSerial||0)+1;}if(m.style==='dash'&&s.age>=6&&s.age<=32)player.X+=(player.FACE?1:-1)*(0x400+player.SPSTR*0x60);player.SPKD=phase===2?1:0;}
  if(['rise','vault','retreat'].includes(m.style)){if(!s.launched&&s.age>=5){s.launched=true;player.VX=(player.FACE?1:-1)*(m.style==='retreat'?-0x300:m.style==='vault'?0x300:0xc0);player.VY=m.style==='rise'?0x650:0x520;player.AX=0;player.AY=0x48;}if(s.launched&&!h.gravity(player)){delete player.AIFFMove;h.idle(player);return;}}
  if(['bullet','burst','grenade','rain','retreat'].includes(m.style)&&s.age===10){spawn(player,m.style==='retreat'?(p.id==='rolento'?'grenade':'bolt'):m.style==='burst'?'bolt':m.style,s.age);s.shots++;h.sound(0x25);}
  if(m.style==='burst'&&[24,38].includes(s.age)&&!player.FBON){spawn(player,'bolt');s.shots++;h.sound(0x25);}
  if(m.style==='grab'&&s.age===8&&Math.abs(player.X-player.opp.X)<76*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0){player.THV={t:12,dmg:p.id==='andore'?40:34,d:player.FACE?-1:1};player.MV=h.throwMove;player.SCNT=32;player.hitdone=1;Object.assign(player.opp,{ST:5,STUN:999,KB:0,RETCR:0});h.anim(player.opp,22,0);return;}
  const end=m.style==='burst'?s.age>=55:player.adone||s.age>85;if(end&&!['rise','vault','retreat'].includes(m.style)){delete player.AIFFMove;h.idle(player);}
 }
 function throwStart(player,atk,h){const p=get(player.aiProfile);if(p.id==='rolento')return shoulderStart(player,h);if(p.id==='edi'||p.id==='sodom')return batterStart(player,h);if(p.id==='abigail')return player.MV?.style==='abigail-spd'?abigailPileStart(player,h):tossStart(player,h);if(p.id==='andore'&&!h.special)return holdStart(player,h);
  if(p.id==='andore'){
   const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:121,THV:{t:999,dmg:40,d:player.FACE?1:-1},hitdone:1,AIFFThrow:{age:0,phase:'grip',dir:player.FACE?1:-1}});
   Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,121,0);h.anim(o,22,0);headGrip(player,h,player.AIFFThrow.dir);h.sound(0x2b);return true;
  }Object.assign(player,{MV:h.move,SPK:0,SPKD:0,SPSTR:atk%3,RETCR:0,KB:0,SCNT:34,ST:11,THAN:46,THV:{t:14,dmg:['andore','abigail'].includes(p.id)?40:32,d:player.FACE?-1:1},hitdone:1});h.anim(player,46,0);Object.assign(player.opp,{ST:5,STUN:999,KB:0,RETCR:0,Y:0});h.anim(player.opp,22,0);h.sound(0x2b);return true;}
 function sodomStep(player,h){const s=player.AIFFMove,m=player.MV;
  if(m.style==='sodom-charge'){
   chargeStep(player,h,16,0x500+player.SPSTR*0x40);return;
  }
  if(m.style==='sodom-double'){
   if(player.hitdone&&s.phase===0&&!s.firstContact){s.firstContact=true;player.opp.KB=Math.trunc(player.opp.KB*.35);}
   const second=swordEquipped(player)?6:3;if(player.aidx===(swordEquipped(player)?5:2)){const gap=Math.abs(player.X-player.opp.X)/256;if(gap>55)player.X+=s.dir*Math.min(4,gap-55)*256;}
   const strike=player.aidx>=second?1:0;if(s.phase!==strike){s.phase=strike;player.hitdone=0;player.AIAttackSerial=(player.AIAttackSerial||0)+1;}
   player.SPKD=strike;
  }else player.SPKD=1;
  if(player.adone||s.age>75){delete player.AIFFMove;h.idle(player);}
 }
 function belgerStep(player,h){const s=player.AIFFMove,m=player.MV;
  if(m.style==='bolts'||m.style==='bolt-rain'){
   const release=m.style==='bolts'?[13,24,35]:[12,23,34];
   if(release.includes(s.age)){spawnBolt(player,m.style==='bolt-rain',s.shots++);h.sound(0x1e);}
   if(s.age>=57){delete player.AIFFMove;h.idle(player);}return;
  }
  if(m.style==='belger-hop'||m.style==='belger-retreat'){
   SF2AIFFChair.dismount(player,'escape-input');
   if(!s.launched&&s.age>=5){s.launched=true;player.VX=-s.dir*(m.style==='belger-hop'?0x3c0:0x200);player.VY=m.style==='belger-hop'?0x600:0x700;player.AY=m.style==='belger-hop'?0x58:0x40;player.AX=0;}
   if(s.launched){if(m.style==='belger-retreat'&&[20,30,40].includes(s.age)){spawnBolt(player,false,s.shots++,true);h.sound(0x1e);}const desired=s.age<15?0:1;if(player.aidx!==desired){h.anim(player,m.a,desired);player.acc=-1;}
    if(m.style==='belger-retreat'&&!s.hovered&&(player.VY>>8)===1){s.hovered=true;s.hover=0;}
    if(s.hover!==undefined&&s.hover<12){player.X+=player.VX;player.Y+=[1,1,0,0,0,0,0,0,0,0,-1,-1][s.hover++]*256;if(s.hover===12)player.VY=-0x1c0;return;}
    if(!h.gravity(player)){player.VX=0;delete player.AIFFMove;h.idle(player);h.sound(0x2f);}}return;
  }
  if(m.style==='power'){player.SPKD=1;if(player.adone||s.age>=55){delete player.AIFFMove;h.idle(player);}}
 }
 function spawnBolt(player,rain,index,diagonal=false){const dir=player.FACE?1:-1,pool=player.AIFFBullets||(player.AIFFBullets=[]);if(pool.length>=8)return;
  const target=player.opp.X/256+(index-1)*30,x=player.X/256+dir*(rain?0:36),y=player.Y/256+(rain?89:diagonal?32:60);
  pool.push({type:'bolt',x,y,vx:rain?Math.max(-5,Math.min(5,(target-x)/55)):dir*(diagonal?0x5a700/65536:8),vy:rain?0x740/256:diagonal?-0x5a700/65536:0,ay:rain?0x48/256:0,dir,age:0,strength:player.SPSTR,hit:false,rain,diagonal,fresh:true});player.FBON=1;player.FBK='ff-bullets';}
 function ediStep(player,h){const s=player.AIFFMove,m=player.MV;
  if(m.style==='pistol'||m.style==='pistol-burst'){
   if((m.style==='pistol'?[20]:[20,31,42]).includes(s.age)){spawnBullet(player);h.sound(0x12);}
   if(s.age>=(m.style==='pistol'?46:68)){delete player.AIFFMove;h.idle(player);}return;
  }
  if(m.style==='grab-batter'){if(s.age===8&&Math.abs(player.X-player.opp.X)<=60*256&&player.opp.Y===0&&player.opp.HP>0&&[0,3,4,5,6].includes(player.opp.ST))h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(m.style==='baton-rush'&&s.age>=9&&s.age<=24)player.X+=s.dir*0x240;
  player.SPKD=1;if(player.adone||s.age>=65){delete player.AIFFMove;h.idle(player);}
 }
 function rageStep(player,h){chargeStep(player,h,20,0x500+player.SPSTR*0x40);}
 function chargeStep(player,h,recovery,speed){const s=player.AIFFMove,animation=player.F.anims[100],last=animation.ents.length-1;
  const stop=()=>{s.contact=true;s.stop=s.age+recovery;s.skid=5;h.anim(player,100,last);};
  if(!s.contact&&s.age<19){if(player.aidx!==0)h.anim(player,100,0);player.acc=-1;}
  if(s.age===19)h.sound(0x2b);
  if(!s.contact&&player.hitdone)stop();
  if(!s.contact&&s.age>=19){
   const room=h.room(),edge=(s.dir>0?room.right-40:room.left+40)*256;
   player.X+=s.dir*speed;
   if(s.dir>0?player.X>=edge:player.X<=edge){player.X=edge;stop();}
   else{const frame=1+Math.floor((s.age-19)/(player.aiProfile==='sodom'?3:6))%(last-1);if(player.aidx!==frame)h.anim(player,100,frame);player.acc=-1;}
  }
  if(s.contact){player.X+=s.dir*s.skid*256;s.skid*=.75;}
  player.SPKD=1;if(s.stop&&s.age>=s.stop){delete player.AIFFMove;h.idle(player);}
 }
 function batterStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:111,THV:{t:999,dmg:0,d:player.FACE?1:-1},hitdone:1,AIFFHold:{kind:'batter',age:0,pulses:0,dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,Y:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,111,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function batterStep(player,h){const s=player.AIFFHold,o=player.opp;s.age++;
  if(!player.THV||o.HP<=0){holdRelease(player,h,true);return;}
  o.X=player.X+s.dir*47*256;o.Y=0;o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;
  const gut=player.aiProfile==='sodom';
  if((gut?[17]:[17,27,37]).includes(s.age)){s.pulses++;h.chokeDamage(player,gut?32:s.pulses===3?16:8);h.sound(0x2b);h.anim(o,22,0);if(o.HP<=0){holdRelease(player,h,true);return;}}
  if(s.age>=(gut?29:49)){delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;h.drop(o);h.idle(player);}
 }
 function shoulderStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,KB:0,RETCR:0,Y:0,VX:0,VY:0,THAN:118,THV:{t:999,dmg:34,d:player.FACE?-1:1},hitdone:1,AIFFThrow:{kind:'shoulder',age:0,phase:'grip',dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,118,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function shoulderStep(player,h){const s=player.AIFFThrow,o=player.opp;s.age++;
  if(s.phase!=='recover'&&(!player.THV||o.HP<=0)){cancelThrow(player,h);return;}
  if(s.age===8){s.phase='lift';h.anim(player,119,0);}
  if(s.age===20){delete o.AIFFHeld;h.release(player);s.phase='recover';h.anim(player,120,0);h.sound(0x2b);}
  if(s.phase!=='recover'){const t=s.phase==='lift'?(s.age-8)/12:0,scale=bodyScale(player);o.X=player.X+s.dir*(34-46*t)*scale*256;o.Y=(18+68*t)*scale*256;o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;o.AIFFHeld.inverted=t>.4;}
  else if(s.age>=42){delete player.AIFFThrow;h.idle(player);}
 }
 function tossStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:107,THV:{t:999,dmg:40,d:player.FACE?1:-1},hitdone:1,AIFFThrow:{kind:'toss',age:0,phase:'grip',dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,107,0);h.anim(o,22,0);if(h.head?.(o)?.y-o.Y/256>88)h.anim(o,27,0);abigailHeadGrip(player,h);h.sound(0x2b);return true;}
 function tossStep(player,h){const s=player.AIFFThrow,o=player.opp;s.age++;
  if(s.phase!=='recover'&&(!player.THV||o.HP<=0)){cancelThrow(player,h);h.idle(player);return;}
  if(s.age===9){s.phase='lift';h.anim(player,108,0);}
  if(s.age===21){delete o.AIFFHeld;h.release(player);s.phase='recover';h.anim(player,109,0);h.sound(0x2f);}
  if(s.phase!=='recover')abigailHeadGrip(player,h);
  if(s.age>=49){delete player.AIFFThrow;h.idle(player);}
 }
 function abigailHeadGrip(player,h){const o=player.opp,dir=player.AIFFThrow?.dir??(player.FACE?1:-1),frame=player.anim?.ents[player.aidx]?.[0],local=get('abigail').data.handAnchors?.[frame]||[63,88],head=h.head?.(o),x=player.X/256+dir*local[0],y=player.Y/256+local[1];if(head){o.X=Math.round((x-(head.x-(o.X>>8)))*256);o.Y=Math.round((y-(head.y-(o.Y>>8)))*256);}else{o.X=player.X+dir*40*256;o.Y=20*256;}o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
 function abigailPileStart(player,h){const o=player.opp,dir=player.FACE?1:-1;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:111,THV:{t:999,dmg:46,d:dir},hitdone:1,AIFFThrow:{kind:'abigail-spd',age:0,phase:'grip',dir}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,111,0);h.anim(o,22,0);if(h.head?.(o)?.y-o.Y/256>88)h.anim(o,27,0);abigailHeadGrip(player,h);h.sound(0x2b);return true;}
 function abigailPileGrip(player,h,impact=false){const o=player.opp,head=h.invertedHead?.(o),x=player.X/256,y=player.Y/256+12;if(head){o.X+=Math.round((x-head.x)*256);o.Y=impact?Math.round(head.minimumY*256):o.Y+Math.round((y-head.y)*256);}else{o.X=player.X;o.Y=player.Y+60*256;}o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
 function abigailPileStep(player,h){const s=player.AIFFThrow,o=player.opp;s.age++;
  if(!['impact','recover'].includes(s.phase)&&(!player.THV||o.HP<=0)){cancelThrow(player,h);if(player.Y>0)h.releaseHeld?.(player,true);else h.idle(player);return;}
  if(s.phase==='grip'){if(s.age===12)h.anim(player,115,0);abigailHeadGrip(player,h);if(s.age>=24){s.phase='squat';s.at=s.age;o.AIFFHeld.inverted=true;h.anim(player,112,0);abigailPileGrip(player,h);}return;}
  if(s.phase==='squat'){abigailPileGrip(player,h);if(s.age-s.at>=12){s.phase='jump';s.launched=s.age;Object.assign(player,{VX:0,VY:0xe80,AY:0x80,AX:0,THAN:113});h.anim(player,113,0);h.sound(0x2b);}return;}
  if(s.phase==='jump'){const tick=s.age-s.launched,frame=Math.floor(tick/4)%8,cycle=get('abigail').data.spinningPile.fullRotation.cycle,index=cycle[frame];s.spinAngle=tick*Math.PI/16;player.FACE=frame>=4&&frame<=6?(s.dir>0?0:1):(s.dir>0?1:0);o.FACE=player.FACE^1;const victimPose=frame===7?20:22;if(o.cur!==victimPose)h.anim(o,victimPose,0);if(player.aidx!==index)h.anim(player,113,index);player.acc=-1;
   if(!h.gravity(player)){s.phase='impact';s.at=s.age;player.FACE=s.dir>0?1:0;o.FACE=player.FACE^1;if(o.cur!==22)h.anim(o,22,0);h.anim(player,114,0);abigailPileGrip(player,h,true);h.slam(player);h.groundImpact?.(player);h.sound(0x2f);}else abigailPileGrip(player,h);return;}
  if(s.phase==='impact'){abigailPileGrip(player,h,true);if(s.age-s.at>=6){h.releaseSlam(player);s.phase='recover';s.at=s.age;}return;}
  if(s.phase==='recover'&&s.age-s.at>=26){delete player.AIFFThrow;h.idle(player);}
 }
 function spawnBullet(player){const dir=player.FACE?1:-1,hand=player.MV?.hand||'right',pool=player.AIFFBullets||(player.AIFFBullets=[]);if(pool.length>=6)return;pool.push({x:player.X/256+dir*(hand==='left'?84:60),y:player.Y/256+(hand==='left'?78:74),vx:dir*10,dir,hand,age:0,strength:player.SPSTR,hit:false});player.FBON=1;player.FBK='ff-bullets';}
 function bulletStep(player,room){for(const b of player.AIFFBullets||[]){if(b.fresh){delete b.fresh;continue;}if(b.type==='bolt'){b.age++;if(b.rain&&b.age===1)continue;b.x+=b.vx;b.vy-=b.ay;b.y+=b.vy;}else{b.x+=b.vx;if(b.ay){b.y+=b.vy;b.vy-=b.ay;}b.age++;}}player.AIFFBullets=player.AIFFBullets.filter(b=>!b.hit&&b.y>=0&&b.age<=120&&b.x>=room.left-32&&b.x<=room.right+32);const b=player.AIFFBullets[0];player.FBON=b?1:0;if(b){player.FBX=Math.round(b.x*256);player.FBY=b.y*256;player.FBVX=b.vx*256;}else delete player.AIFFBullets;}
 function bulletContacts(player){return(player.AIFFBullets||[]).filter(b=>!b.hit&&(b.type!=='bolt'||b.age>0&&(!b.rain||b.age>=33))).map(b=>({bullet:b,box:b.type==='bolt'?[b.x+(!b.rain&&!b.diagonal&&b.age<3?-27*b.dir:0),b.y,!b.rain&&!b.diagonal&&b.age<3?44:16,16]:[b.x,b.y,6,3]}));}
 function boltFrame(b){const n=SF2AIFFData.belger.nativeRecovery.projectiles,seq=b.rain?n.upward:b.diagonal?n.diagonal:n.horizontal;let age=Math.max(0,b.age-(b.rain?1:0));for(const[f,t]of seq){if(age<t)return f;age-=t;}return seq[seq.length-1][0];}
 function bulletDraw(ctx,player,camera,ground){ctx.save();ctx.imageSmoothingEnabled=false;for(const b of player.AIFFBullets||[]){if(b.hit)continue;ctx.save();ctx.translate(Math.round(b.x-camera),Math.round(ground-b.y));if(b.type==='bolt'){if(b.dir>0)ctx.scale(-1,1);const pack=get('belger'),r=pack.data.frames[boltFrame(b)];ctx.drawImage(pack.image,...r.slice(0,4),r[4],r[5],r[2],r[3]);}else{if(b.dir>0)ctx.scale(-1,1);ctx.drawImage(bulletImage,-5,-1);}ctx.restore();}ctx.restore();}
 function holdStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:111,THV:{t:999,dmg:0,d:player.FACE?1:-1},hitdone:1,AIFFHold:{age:0,pulses:0,escape:0,walk:0,ownerPrevious:player.AIButtons?.raw||0,ownerDirections:player.KEYS&15,previous:((o.AIButtons?.raw||0)|(o.KEYS&15)),dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,Y:0,AIFFHeld:{owner:player.i,inverted:false,choke:true}});h.anim(player,111,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function holdStep(player,h){const s=player.AIFFHold,o=player.opp;s.age++;
  const attack=player.AIButtons?.raw||0,punch=(attack&~s.ownerPrevious)&112,jump=!!(player.KEYS&4)&&!(s.ownerDirections&4);s.ownerPrevious=attack;s.ownerDirections=player.KEYS&15;
  if(!s.airborne&&(attack&288)===288){delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;throwStart(player,2,{...h,move:h.throwMove,special:true});return;}
  if(!s.airborne&&(attack&192)===192){holdRelease(player,h,false);start(player,player.F.moves[5],2,h);return;}
  if(!player.THV||o.HP<=0){holdRelease(player,h,true);return;}
  const raw=(o.AIButtons?.raw||0)|(o.KEYS&15),fresh=(raw&~s.previous)&1008,direction=raw&15;let points=0;if(fresh)points+=2;if(direction&&direction!==(s.previous&15))points++;s.previous=raw;
  if(h.cpu?.(o)&&s.age>18&&s.age%6===0)points+=2;s.escape=Math.min(14,s.escape+Math.min(3,points));
  if(s.escape>=14){s.escaped=true;holdRelease(player,h,false);return;}
  if(!s.airborne&&(jump||h.cpu?.(player)&&s.pulses>=2)){
   s.airborne=true;s.airAge=0;player.VX=(((player.KEYS&2)?1:0)-((player.KEYS&1)?1:0))*0x180;player.VY=0x780;player.AY=0x60;player.AX=0;player.THAN=132;h.anim(player,132,0);h.sound(0x2b);
  }
  if(s.airborne){
   s.airAge++;
   if(player.Y>12*256&&(punch||h.cpu?.(player)&&s.airAge>=12)){
    delete player.AIFFHold;player.MV=h.throwMove;player.THV={t:999,dmg:40,d:s.dir};player.AIFFThrow={age:0,phase:'jump',dir:s.dir,manual:true};o.AIFFHeld={owner:player.i,inverted:true};player.THAN=108;player.VY=Math.min(player.VY,-0x300);player.AY=0x90;h.anim(player,108,0);invertedGrip(player,h,s.dir);h.sound(0x2b);return;
   }
   if(h.gravity(player)){const room=h.room();player.X=Math.max((room.left+96)*256,Math.min((room.right-96)*256,player.X));headGrip(player,h,s.dir);return;}
   s.airborne=false;player.THAN=111;h.anim(player,111,0);h.sound(0x2f);
  }
  const phase=s.age>=20?(s.age-20)%24:24,shaking=phase<10;const move=((player.KEYS&2)?1:0)-((player.KEYS&1)?1:0);if(move){const room=h.room(),margin=96;player.X=Math.max((room.left+margin)*256,Math.min((room.right-margin)*256,player.X+move*0x180));s.walk++;}const chokeAnim=move?(shaking?115:114):111,chokeIndex=move?Math.floor(s.walk/4)%6:shaking?((phase>>1)%2):0;if(player.cur!==chokeAnim||player.aidx!==chokeIndex)h.anim(player,chokeAnim,chokeIndex);player.acc=-1;
  headGrip(player,h,s.dir);
  if(s.age>=20&&(s.age-20)%24===0){s.pulses++;h.chokeDamage(player,4);h.sound(0x2b);if(o.HP<=0){holdRelease(player,h,true);return;}h.anim(o,22,0);}
 }
 function headGrip(player,h,dir){const o=player.opp,grip=art(player).rect,head=h.head?.(o),gx=player.X/256+dir*(-grip[4]-4),gy=player.Y/256-grip[5]-10;if(head){o.X=Math.round((gx-(head.x-o.X/256))*256);o.Y=Math.round((gy-(head.y-o.Y/256))*256);}else{o.X=player.X+dir*24*bodyScale(player)*256;o.Y=38*bodyScale(player)*256;}o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
 function invertedGrip(player,h,dir,impact=false){const o=player.opp,scale=bodyScale(player),squat=player.cur===116||impact,head=h.invertedHead?.(o),x=player.X/256-dir*(squat?2:12)*scale,y=player.Y/256+(squat?14:8)*scale;if(head){o.X+=Math.round((x-head.x)*256);o.Y=Math.max(Math.round(head.minimumY*256),o.Y+Math.round((y-head.y)*256));}else{o.X=player.X+dir*7*scale*256;o.Y=player.Y+66*scale*256;}if(impact&&head)o.Y=Math.round(head.minimumY*256);o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
 function holdRelease(player,h,fatal=false){const o=player.opp;delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;if(fatal){h.drop?.(o);}else if(o.Y>0&&h.releaseHeld){h.releaseHeld(o);}else{o.ST=5;o.STUN=12;o.KB=0;o.Y=0;}if(player.Y>0&&h.releaseHeld){player.MV=null;h.releaseHeld(player,true);}else h.idle(player);}
 function pileStep(player,h){
  const s=player.AIFFThrow,o=player.opp;s.age++;
  if((!player.THV||o.HP<=0)&&!['recover','rebound','settle'].includes(s.phase)){cancelThrow(player,h);return;}
  if(s.phase==='grip'&&s.age>=60){s.phase='squat';s.squatAt=s.age;o.AIFFHeld.inverted=true;h.anim(player,116,0);}
  if(s.phase==='squat'&&s.age-s.squatAt>=24){s.phase='jump';player.VY=0x1000;player.AY=0x90;player.VX=s.dir*0x80;player.AX=0;h.anim(player,108,0);o.AIFFHeld.inverted=true;h.sound(0x2b);}
  if(s.phase==='jump'){
   if(!h.gravity(player)){s.phase='recover';s.landed=s.age;s.impactHeld=true;h.slam(player);h.anim(player,109,0);invertedGrip(player,h,s.dir,true);h.groundImpact?.(player);h.sound(0x2f);}
  }
  if(s.phase==='grip'){const pose=Math.floor(s.age/10)%2;if(player.aidx!==pose)h.anim(player,121,pose);player.acc=-1;headGrip(player,h,s.dir);if(s.age===20||s.age===40)h.sound(0x2b);}
  else if(s.phase==='jump'||s.phase==='squat')invertedGrip(player,h,s.dir);
  else if(s.phase==='recover'){
   if(s.impactHeld){invertedGrip(player,h,s.dir,true);if(s.age-s.landed>=8){s.impactHeld=false;h.releaseSlam(player);Object.assign(o,{VX:s.dir*0x280,VY:0x500,AY:0x50,AX:0,KB:0});s.released=s.age;}}
   if(s.age-s.landed>=8){s.phase='rebound';s.reboundAt=s.age;Object.assign(player,{VX:-s.dir*0x600,VY:0x900,AY:0x70,AX:0,KB:0,THAN:133});h.anim(player,133,0);}
  }else if(s.phase==='rebound'){
   if(!h.gravity(player)){s.phase='settle';s.settled=s.age;h.anim(player,109,0);h.sound(0x2f);}
  }else if(s.phase==='settle'&&s.age-s.settled>=8){delete player.AIFFThrow;h.idle(player);}
 }
 function cancelThrow(player,h){const o=player.opp;delete o.AIFFHeld;delete player.AIFFThrow;delete player.AIFFHold;player.THV=null;if(o.ST===5&&o.STUN>500){o.STUN=12;o.KB=0;if(o.Y>0)h.drop?.(o);} }
 const heldImages=new WeakMap();
 function heldArt(player,art){if(!player.AIFFHeld?.inverted)return art;let cache=heldImages.get(art.image);if(!cache){cache=new Map();heldImages.set(art.image,cache);}const r=art.rect,key=r.slice(0,4).join(',');let c=cache.get(key);if(!c){c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(c.width,c.height);g.rotate(Math.PI);g.drawImage(art.image,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);cache.set(key,c);}return{...art,image:c,rect:[0,0,c.width,c.height,-Math.floor(c.width/2),-Math.floor(c.height/2)]};}
 function grenadeTravel(y,vy,fuse){let range=0,speed=1,bounced=false;for(let age=0;age<fuse;age++){range+=speed;y+=vy;vy-=.23;if(y<6){y=6;if(!bounced){vy=Math.abs(vy)*.28;bounced=true;}else vy=0;speed*=.78;}}return range;}
 function spawnGrenade(player,index=0){
  const dir=player.FACE?1:-1,pool=player.AIFFGrenades||(player.AIFFGrenades=[]);if(pool.length>=8)return;
  const combo=['grenade-barrage','retreat'].includes(player.MV?.style),x=player.X/256+dir*28*bodyScale(player),y=player.Y/256+67*bodyScale(player),vy=2.6+index*.3,fuse=58+index*6,target=player.opp.X/256+dir*(combo?(index-1)*8:0),velocity=dir*Math.max(.5,Math.min(6.5,dir*(target-x)/grenadeTravel(y,vy,fuse)));
  pool.push({x,y,vx:velocity,vy,age:0,fuse,dir,blast:0,hit:false,strength:player.SPSTR,combo,index});player.FBON=1;player.FBK='ff-grenades';
 }
 function grenadeStep(player,room,onBlast){
  const pool=player.AIFFGrenades;if(!pool)return;
  for(const g of pool){g.age++;if(g.blast){g.blast=Math.max(g.blast+1,(window.SF2?.G.tick??0)-(g.blastAt??window.SF2?.G.tick??0)+1);continue;}g.x+=g.vx;g.y+=g.vy;g.vy-=.23;if(g.y<6){g.y=6;if(!g.bounced){g.vy=Math.abs(g.vy)*.28;g.bounced=true;}else g.vy=0;g.vx*=.78;}if(g.age>=g.fuse){g.blast=1;g.blastAt=window.SF2?.G.tick;onBlast?.();g.y=Math.max(15,g.y);g.vx=g.vy=0;}if(g.x<room.left-80||g.x>room.right+80)g.blast=explosionTicks+1;}
  player.AIFFGrenades=pool.filter(g=>g.blast<=explosionTicks);const first=player.AIFFGrenades[0];player.FBON=first?1:0;if(first){player.FBX=Math.round(first.x*256);player.FBY=Math.round(first.y*256);player.FBVX=Math.round(first.vx*256);}else delete player.AIFFGrenades;
 }
 function grenadeContacts(player){return(player.AIFFGrenades||[]).filter(g=>g.blast>0&&g.blast<=8&&!g.hit).map(g=>({grenade:g,box:[g.x,g.y,29,29]}));}
 function grenadeDraw(ctx,player,camera,ground){const D=SF2AIFFData.rolento.grenades,E=SF2AIFFData.rolento.explosion;ctx.save();ctx.imageSmoothingEnabled=false;for(const g of player.AIFFGrenades||[]){const x=Math.floor(g.x-camera),y=Math.floor(ground-g.y);if(g.blast){let elapsed=g.blastAt===undefined?g.blast-1:(window.SF2?.G.tick??g.blastAt)-g.blastAt,index=0;if(elapsed>=explosionTicks)continue;while(index<E.frames.length-1&&elapsed>=E.ticks[index])elapsed-=E.ticks[index++];const f=E.frames[index];ctx.drawImage(explosionImage,...f.slice(0,4),x+f[4],y+f[5],f[2],f[3]);}else{const f=D.frames[Math.floor(g.age/3)%8];ctx.drawImage(grenadeImage,f[0],f[1],f[2],f[3],x-Math.floor(f[2]/2),y-Math.floor(f[3]/2),f[2],f[3]);}}ctx.restore();}
 function rolentoStep(player,h){const s=player.AIFFMove,m=player.MV,a=s.age;
  if(m.style==='wallkick'||m.style==='wallpunch'){wallDiveStep(player,h);return;}
  if(['grenade','grenade-barrage'].includes(m.style)){
   const release=m.style==='grenade'?[9]:[9,19,29];if(release.includes(a)){spawnGrenade(player,s.shots++);h.sound(0x25);}if(player.Y>0)h.gravity(player);if(a>=(m.style==='grenade'?35:52)&&player.Y<=0){delete player.AIFFMove;h.idle(player);}return;
  }
  if(!s.launched&&a>=5){s.launched=true;player.VX=-s.dir*0x540;player.VY=0x640;player.AY=0x44;player.AX=0;h.anim(player,117,0);}
  if(s.launched){
   if([10,17,24].includes(a)){spawnGrenade(player,s.shots++);h.sound(0x25);}
   if(!h.gravity(player)){delete player.AIFFMove;h.idle(player);h.sound(0x2f);return;}
  }
  if(a>120){player.Y=player.VY=player.VX=0;delete player.AIFFMove;h.idle(player);}
 }
 function wallDiveStep(player,h){
  const s=player.AIFFMove,room=h.room();
  if(s.phase===-1){
   if(s.age<5)return;const keys=player.KEYS&3,dir=keys?(keys&1?-1:1):(player.X/256<(room.left+room.right)/2?-1:1);
   s.phase='approach';s.launched=true;s.from={x:player.X,y:player.Y};s.wallX=(dir<0?room.left+40:room.right-40)*256;s.wallY=(96+player.SPSTR*8)*256;s.approachAt=s.age;s.travel=Math.max(8,Math.ceil(Math.abs(s.wallX-player.X)/(9*256)));player.VX=player.VY=player.AX=player.AY=0;player.FACE=dir>0?1:0;h.anim(player,117,0);
  }
  if(s.phase==='approach'){
   const elapsed=s.age-s.approachAt+1,t=Math.min(1,elapsed/s.travel),rise=Math.min(1,elapsed/Math.min(16,s.travel)),lift=rise*rise*(3-2*rise);player.X=Math.round(s.from.x+(s.wallX-s.from.x)*t);player.Y=Math.round(s.from.y+(s.wallY-s.from.y)*lift+Math.sin(Math.PI*t)*64*256);
   if(t===1){s.phase='wall';s.wallAt=s.age;s.bounced=true;h.anim(player,123,0);h.sound(0x2f);}return;
  }
  if(s.phase==='wall'){
   player.acc=-1;if(s.age-s.wallAt<5)return;s.phase='dive';s.diveAt=s.age;const dir=player.X<player.opp.X?1:-1,target=Math.max(room.left+40,Math.min(room.right-40,player.opp.X/256+dir*24)),ticks=Math.max(18,Math.ceil(Math.abs(target-player.X/256)/11));
   player.FACE=dir>0?1:0;player.VX=Math.round((target*256-player.X)/ticks);player.AY=0x18;player.VY=Math.round(player.AY*(ticks+1)/2-player.Y/ticks);player.hitdone=0;player.SPKD=1;h.anim(player,player.MV.style==='wallpunch'?124:110,0);h.sound(0x25);return;
  }
  if(s.phase==='dive'){
   // Small steering corrections retain the committed leap and leave room to evade.
   const steer=((player.KEYS&2)?1:0)-((player.KEYS&1)?1:0);player.VX=Math.max(-0xb00,Math.min(0xb00,player.VX+steer*8));
   if(!h.gravity(player)){s.phase='recover';s.landed=s.age;h.anim(player,125,0);h.sound(0x2f);}return;
  }
  if(s.phase==='recover'&&s.age-s.landed>=12){delete player.AIFFMove;h.idle(player);}
 }
 function normalStep(player){
  if(['sodom','edi'].includes(player.aiProfile)){sodomNormalStep(player);return;}
  if(player.aiProfile!=='rolento'||player.ST!==1||!player.RETCR||player.cur<17||player.cur>19||player.Y!==0){delete player.AIFFSlide;return;}
  let s=player.AIFFSlide;if(!s||s.slot!==player.cur||s.serial!==player.AIAttackSerial)s=player.AIFFSlide={slot:player.cur,serial:player.AIAttackSerial,dir:player.FACE?1:-1,speed:0,contact:false};
  if(player.hitdone)s.contact=true;const current=player.anim.ents[player.aidx],next=player.acc+1>=current[1]?player.anim.ents[player.aidx+1]:current,active=!!next?.[6]?.[2];
  if(active&&!s.contact)s.speed=[3,5,7][player.cur-17];else s.speed*=.78;
  if(s.speed>.1)player.X+=Math.round(s.dir*s.speed*256);
 }
 function wallJump(player,h){
  if(player.aiProfile!=='rolento')return;const ratio=player.HP/player.maxHP;player.ft[0]=ratio<=.33?0x680:0x500;player.ft[1]=ratio<=.33?0x540:0x400;
  if(player.Y<=0||player.ST!==2){delete player.AIFFWall;return;}const w=player.AIFFWall||(player.AIFFWall={cool:0,count:0});if(w.cool>0){w.cool--;return;}
  const room=h.room(),x=player.X/256,left=x<=room.left+44,right=x>=room.right-44,away=left?2:1,wants=!!(player.KEYS&4)&&!!(player.KEYS&away);
  if((left||right)&&player.Y>18*256&&w.count<2&&(wants||h.cpu?.(player))){w.cool=12;w.count++;player.FACE=left?1:0;player.VX=(left?1:-1)*0x640;player.VY=0x5c0;player.AY=0x44;player.AX=0;player.JA=0;player.JN=0;player.PJ=0;player.hitdone=0;h.anim(player,117,0);h.sound?.(0x25);}
 }
 function projectileStep(player,room){const s=player.AIFFProjectile;if(!s||!player.FBON){delete player.AIFFProjectile;return;}s.age++;player.FBX+=player.FBVX;player.FBY+=s.vy;if(s.type==='grenade'){s.vy-=0x26;if(player.FBY<12*256){player.FBY=12*256;s.vy=Math.abs(s.vy)*.45|0;if(s.age>65)s.exploding=1;}}if(s.type==='rain'&&player.FBY<12*256)player.FBON=0;if(s.age>120||player.FBX/256<room.left-40||player.FBX/256>room.right+40)player.FBON=0;}
 function projectileDraw(ctx,player,camera,ground){const s=player.AIFFProjectile;if(!s||!player.FBON)return;const x=(player.FBX>>8)-camera,y=ground-(player.FBY>>8);ctx.save();if(s.type==='grenade'){ctx.fillStyle='#172b17';ctx.fillRect(x-4,y-5,8,10);ctx.fillStyle='#bbc060';ctx.fillRect(x-3,y-4,2,8);ctx.fillStyle='#eebd50';ctx.fillRect(x-1,y-8,3,3);}else{ctx.strokeStyle='#e9d89a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-s.dir*10,y);ctx.lineTo(x+s.dir*8,y);ctx.stroke();ctx.fillStyle='#faffed';ctx.fillRect(x+s.dir*7-1,y-2,3,4);}ctx.restore();}
 function damage(player,strength){if(player.ST!==11&&player.anim?.normalDouble){const m=player.anim.normalDouble;return m.damages[player.aidx>=m.second?1:0];}if(player.ST!==11)return(swordEquipped(player)?[10,17,25]:[8,14,21])[Math.min(2,strength)]*(get(player.aiProfile).hp>=400?1.1:1)|0;return player.MV?.style==='wallkick'?30:player.MV?.style==='wallpunch'?32:player.MV?.style==='sodom-charge'?30:player.MV?.style==='sodom-chop'?(swordEquipped(player)?34:26):player.MV?.style==='sodom-double'?(swordEquipped(player)?18:14):player.MV?.style==='rage'?40:player.MV?.style==='baton'||player.MV?.style==='baton-rush'?30:player.MV?.style==='dash'||player.MV?.style==='spin'?player.AIFFMove?.phase===2?17:11:player.MV?.style==='seatdrop'?34:player.MV?.style==='power'?36:27;}
 function stageDraw(ctx,id,camera,width,top,height,ground){const p=get(id),y=ground-220;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#151b2b';ctx.fillRect(0,top,width,height);for(let xx=-camera;xx<width;xx+=720)ctx.drawImage(p.stage,xx,y);for(let yy=y;yy>top;yy-=16)ctx.drawImage(p.stage,0,0,720,16,-camera,yy-16,720,16);for(let yy=y+256;yy<top+height;yy+=16)ctx.drawImage(p.stage,0,236,720,16,-camera,yy,720,16);ctx.restore();}
 function mapDraw(ctx,s,defeated){ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#070c16';ctx.fillRect(0,0,384,224);ctx.drawImage(metro,0,20,384,180);for(const id of ids()){const point=id==='damnd'?[135,103]:get(id).point;ctx.fillStyle=id===s.id?(s.tick%20<10?'#fff':'#ff3030'):defeated.includes(id)?'#777':'#ffe050';ctx.fillRect(point[0]-3,point[1]-3,6,6);if(id===s.id){ctx.strokeStyle='#fff';ctx.strokeRect(point[0]-7,point[1]-7,14,14);}}ctx.restore();}
 return{belgerSync,postPileRebound:player=>player.aiProfile==='andore'&&player.AIFFThrow?.released!==undefined,normalContact,victoryStep,victoryDraw,setMusic,musicInfo,normalStep,resetSword,disarm,swordStep,swordDraw,swordPickup,swordCPU,swordEquipped,soundCode(player,kind){if(kind==='explosion')return 21;if(kind==='shot'&&player.aiProfile==='edi')return 18;if(kind==='shot'&&player.aiProfile==='belger')return 30;if(kind==='weapon')return 16;if(kind!=='hit')return null;const pack=get(player.aiProfile);if(!pack?.data.nativeFrames||!pack.data.combat)return null;const frame=player.anim?.ents[player.aidx]?.[0],attack=pack.data.nativeFrames[frame]?.attack;return pack.data.combat.attacks[attack]?.sound??null;},retimeNormals,canProbe(player){if(player.MV?.kind==='ff'&&((player.aiProfile==='sodom'&&player.MV.style==='sodom-charge')||(player.aiProfile==='andore'&&player.MV.style==='dash')||(player.aiProfile==='abigail'&&player.MV.style==='rage')))return player.AIFFMove?.age>=19&&!player.AIFFMove?.contact;if(player.aiProfile==='rolento'&&['wallkick','wallpunch'].includes(player.MV?.style))return player.AIFFMove?.phase==='dive';return !(player.ST===11&&player.MV?.kind==='ff'&&player.MV.style==='seatdrop'&&player.AIFFMove?.phase!=='drop');},soundBuffer:code=>soundBuffers.get(code)||null,holdStart,bulletStep,bulletContacts,bulletDraw,grenadeStep,grenadeContacts,grenadeDraw,wallJump,heldArt,cancelThrow,prepareSound,playSound,soundCounts,ready,get,ids,specs,bind,art,portrait,mouth,start,step,throwStart,projectileStep,projectileDraw,damage,stageDraw,mapDraw};
})();
