/* AI Edition Final Fight guests. Original arcade pixels; authored SF2 controls.
   Sprite/arena provenance and adaptation notes: FF-BOSSES.md. */
'use strict';
window.SF2AIFF=(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),packs={},pending=[];
 const specs={
  sodom:{name:'Sodom',district:'Subway Ring',hp:340,speed:0x240,jump:0x650,point:[171,115],idle:'neutral',walk:'walk',hurt:'hurt',crouch:'down',fall:'fall',lie:'down',recover:'recover',throw:'jab',win:'entry',normal:['slash','slash','slash','slash','slash','slash'],specials:[['Katana Rush','sodom-charge','charge'],['Twin Blade Chops','sodom-double','slash'],['Heavy Sword Chop','sodom-chop','slash'],['Gut Buster','grab','jab']]},
  edi:{name:'Edi. E',district:'West Side',hp:330,speed:0x200,jump:0x5a0,point:[173,85],idle:[0,1,2,3],walk:[4,5,7,8],hurt:[17,18],crouch:[21],fall:[17,20,26],lie:[26],recover:[21,19,0],throw:[12,14,15],win:[9,4],normal:[[9,10,11],[9,10,11],[9,10,11],[11,12,13],[11,13,14],[9,10,11]],specials:[['Police Pistol','pistol',[24,25,28,29]],['Baton Rush','baton-rush',[9,10,11]],['Baton Smash','baton',[9,10,11]],['Arrest and Batter','grab-batter',[12,14,15]],['Pistol Burst','pistol-burst',[24,25,28,29]]]},
  rolento:{name:'Rolento',district:'Industrial Area',hp:300,speed:0x500,jump:0x740,point:[221,118],idle:[10,11],walk:[10,11,12,13],hurt:[8,25],crouch:[9],fall:[25,26,21],lie:[22],recover:[17,8,10],throw:[14,15],win:[0,1,2,3],normal:[[13,14,13],[13,15,13],[13,14,15,13],[17,18,19,17],[17,19,18,17],[17,18,19,17]],specials:[['Patriot Circle','spin',[13,14,15,14]],['Grenade Throw','grenade',[20]],['Wall Kick','wallkick',[9,5,6,7,18]],['Shoulder Toss','grab',[14,15]],['Grenade Barrage','grenade-barrage',[20]],['Grenade Retreat','retreat',[20,5,6,7]]]},
  abigail:{name:'Abigail',district:'Bay Area',hp:420,speed:0x1e0,jump:0x590,point:[260,130],idle:[4,5,6,7],walk:[0,1,2,3],hurt:[25],crouch:[20],fall:[22,24,23],lie:[23],recover:[25,26,4],throw:[19,21],win:[17,18],normal:[[17,18,17],[17,18,17],[15,16,17],[19,20,19],[19,21,19],[17,18,17]],specials:[['Rage Charge','rage',[10,11,12,13,14,15,16]],['Giant Throw','grab',[19,21]],['Hammer Punch','power',[19,21,18]],['Crushing Toss','grab',[19,21]],['Power Punch','power',[15,16,18]]]},
  belger:{name:'Belger',district:'Uptown Penthouse',hp:320,speed:0x240,jump:0x630,point:[220,99],idle:[0,1,2,3],walk:[0,1,2,3,4,5],hurt:[9,10],crouch:[10],fall:[9,13,18],lie:[18],recover:[10,9,7],throw:[7,12],win:[7,8],normal:[[7,14,7],[7,15,7],[7,12,7],[10,8,10],[10,8,10],[7,8,7]],specials:[['Crossbow Volley','bolts',[7,14,15,16]],['Escape Leap','belger-hop',[9,8,7]],['Sky Bolt Rain','bolt-rain',[7,12]],['Escape Hop','belger-retreat',[9,8,7]],['Crossbow Butt','power',[7,12]]]},
  andore:{name:'Andore',district:'West Side Cage',hp:400,speed:0x200,jump:0x5f0,point:[161,96],idle:[0],walk:'neutral',hurt:'hurt',crouch:[11],fall:'fall',lie:'down',recover:'recover',throw:'strike',win:[6],normal:['jab','strike','strike','jab','strike','slam'],specials:[['Bull Rush','dash','rush'],['Chest Bump','power','strike'],['Headbutt','power','jab'],['Piledriver','grab','strike'],['Choke Hold','hold','strike'],['Flying Seat Drop','seatdrop',[18]]]},
 };
 for(const[id,s]of Object.entries(specs)){
  const d=SF2AIFFData[id],image=new Image(),stage=new Image(),portraitImage=new Image();image.src=d.image+'?v=ff-andore-carry-21';stage.src='ai-ff/'+id+'-stage.png';portraitImage.src='ai-ff/'+id+'-profile.png';
  const pack={id,...s,data:d,image,stage,portraitImage,loaded:false,template:null,portraits:new Map()};packs[id]=pack;
  pending.push(Promise.all([image.decode(),stage.decode(),portraitImage.decode()]).then(()=>pack.loaded=true));
 }
 const grenadeImage=new Image();grenadeImage.src=SF2AIFFData.rolento.grenades.image;pending.push(grenadeImage.decode());
 const boltImage=new Image();boltImage.src=SF2AIFFData.belger.bolt.image;pending.push(boltImage.decode());
 const bulletImage=new Image();bulletImage.src=SF2AIFFData.edi.bullet.image;pending.push(bulletImage.decode());
 const metro=new Image();metro.src='ai-ff/metro-map.png';pending.push(metro.decode());
 let audioContext=null,audioReady=null;const soundBuffers=new Map(),soundCounts={played:0,byCommand:{}};
 function prepareSound(ac){if(audioContext===ac&&audioReady)return audioReady;audioContext=ac;soundBuffers.clear();audioReady=Promise.all([0,6,13,16,38,41,44,47].map(async code=>{const response=await fetch('ai-ff/audio/'+code.toString(16).padStart(2,'0')+'.mp3');if(!response.ok)throw Error('Final Fight sound '+code+' unavailable');soundBuffers.set(code,await ac.decodeAudioData(await response.arrayBuffer()));}));return audioReady;}
 function playSound(code,ac,dest){if(!ac||!dest)return false;const play=()=>{const buffer=soundBuffers.get(code);if(!buffer)return;const voice=ac.createBufferSource();voice.buffer=buffer;const gain=ac.createGain();gain.gain.value=.7;voice.connect(gain);gain.connect(dest);voice.start();soundCounts.played++;soundCounts.byCommand[code]=(soundCounts.byCommand[code]||0)+1;};if(audioContext!==ac||!soundBuffers.has(code)){prepareSound(ac).then(play).catch(()=>{});return true;}play();return true;}
 const ready=Promise.all(pending),get=id=>packs[id],ids=()=>['damnd','sodom','andore','edi','rolento','abigail','belger'];
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
 function andoreCrouchPunch(pack,f){
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
 function build(p,native){if(p.template)return p.template;const f=clone(native);f.name=p.name;f.img=p.data.image;f.frames=clone(p.data.frames);f.pal=clone(p.data.palette);f.pal2=clone(f.pal);
  f.anims=native.anims.map(a=>anim(p,a.name,/^(thpose|throwfall|vegaizunafall)/.test(a.name)?a.ents.map((e,i)=>[sequence(p,p.fall)[i%sequence(p,p.fall).length][0],e[1]]):/hit|hurt/.test(a.name)?p.hurt:p.idle,{loop:a.mode===0}));
  while(f.anims.length<112)f.anims.push(anim(p,'ffExtra'+f.anims.length,p.idle));
  const put=(i,n,seq,o)=>f.anims[i]=anim(p,n,seq,o),one=(s,t=7)=>[sequence(p,s)[0]].map(([f])=>[f,t]);
  put(0,'idle',one(p.idle,12),{loop:true});put(1,'walkf',p.walk,{loop:true});put(2,'walkb',sequence(p,p.walk).reverse(),{loop:true});
  put(3,'crouch',[...one(p.idle,2),...one(p.crouch,3),...one(p.crouch,8)],{loop:true,crouch:true});f.anims[3].loop=2;put(4,'standup',[...one(p.crouch,3),...one(p.idle,3)]);
  const jumpFrame={sodom:0,edi:17,rolento:18,abigail:20,belger:9,andore:11}[p.id];for(let i=5;i<=7;i++)put(i,['jumpn','jumpf','jumpb'][i-5],[[jumpFrame,12]],{loop:true});
  for(let b=0;b<6;b++)for(const base of[8,14,47,53,59]){let seq=sequence(p,p.normal[b]);if(seq.length<3)seq=[...one(p.idle,4),...seq,...one(p.idle,8)];else seq=[...one(base===14?p.crouch:p.idle,b%3===2?7:4),...seq,...one(base===14?p.crouch:p.idle,8)];put(base+b,'ff'+base+'_'+b,seq,{attack:true,strength:b%3,low:base===14,crouch:base===14,kd:base===14&&b===5});}
  for(let i=20;i<=25;i++)put(i,'ffHit'+i,p.hurt);put(26,'blockS',one(p.idle),{loop:true});put(27,'blockC',one(p.crouch),{loop:true,crouch:true});put(28,'fall',p.fall);put(29,'lie',p.lie);put(30,'getup',p.recover);put(31,'win',p.win,{loop:true});put(46,'throw',p.throw);put(103,'ffDizzy',p.hurt,{loop:true});put(104,'ffBurn',p.hurt);
  f.moves=p.specials.map(([name,style,pose],i)=>{const a=p.id==='andore'&&i===5?112:[100,101,102,105,106,107][i],source=sequence(p,pose),seq=[...one(p.idle,6),...source,...one(p.idle,12)];if(['spin','dash'].includes(style))seq.splice(1,0,...source,...source);put(a,name,seq,{attack:!['bullet','burst','grenade','rain','retreat','grenade-barrage','hold','pistol','pistol-burst','grab-batter','bolts','bolt-rain','belger-hop','belger-retreat'].includes(style),strength:2,kd:!['dash','spin'].includes(style)});if(style==='dash'&&p.id==='andore')f.anims[a].ents.forEach((e,j)=>{if(j>0&&j<f.anims[a].ents.length-1){e[6]=[-40,48,28,28];e[7]=24;}});return{name,kind:'ff',style,a,inp:['qcf','qcf','dp','qcb','qcb','hcf'][i],btn:['P','K','P','P','K','P'][i],role:['grab','grab-batter','hold','power','baton','sodom-chop','sodom-double'].includes(style)?'near':style==='rise'?'rise':['dash','sodom-charge','rage','baton-rush','bullet','burst','pistol','pistol-burst','bolts','bolt-rain','grenade','grenade-barrage','rain'].includes(style)?'far':'mid'};});
  if(p.id==='andore'){
   Object.assign(f.moves[0],{inp:'cbf',btn:'P'});Object.assign(f.moves[3],{inp:'grab',btn:'P'});Object.assign(f.moves[4],{inp:'grab',btn:'K'});Object.assign(f.moves[5],{inp:'cdu',btn:'K'});
   const charge=[[11,18],...sequence(p,'run'),...sequence(p,'run'),[6,18]];
   put(100,'Andore Bull Rush',charge,{attack:false,strength:2,kd:true});f.anims[100].ents.forEach((e,i)=>{if(i>0&&i<charge.length-1){e[6]=[-36,48,32,28];e[7]=28;e[8]=2;e[9]=1;}});
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(112,'Andore Flying Seat Drop',[[p.data.airborneFrame,10]],{loop:true});f.anims[112].ents[0][6]=[0,18,34,30];f.anims[112].ents[0][7]=28;f.anims[112].ents[0][8]=2;f.anims[112].ents[0][9]=1;f.anims[112].ents[0][10]=-1;put(113,'Andore Seat Drop Landing',[[11,14],[0,10]]);
   put(111,'Andore Choke Hold',sequence(p,'choke'),{loop:true});put(114,'Andore Carry Straight',sequence(p,'carryStraight'),{loop:true});put(115,'Andore Carry Shake',sequence(p,'carryBent'),{loop:true});
   put(107,'Andore Piledriver Lift',[[p.data.liftFrame,10]],{loop:true});put(108,'Andore Piledriver Air',[[p.data.airborneFrame,8]],{loop:true});put(109,'Andore Piledriver Land',[[12,14],[0,12]]);
  }
  if(p.id==='rolento'){
   put(101,'Rolento Grenade Throw',[[10,6],[20,12],[10,16]]);
   put(106,'Rolento Grenade Barrage',[[10,6],[20,7],[10,3],[20,7],[10,3],[20,7],[10,18]]);
   put(110,'Rolento Wall Air',[[18,12]],{loop:true});Object.assign(f.anims[110].ents[0],{6:[-45,20,35,32],7:24,8:2,9:1,10:-1});
   put(102,'Rolento Wall Kick',[[9,5],[5,4],[6,4],[7,4],[18,12],[10,8]],{attack:false});
  }
  if(p.id==='edi'){
   put(100,'Edi Police Pistol',[[0,4],[24,4],[25,6],[28,6],[29,3],[28,8],[25,5],[4,10]]);
   put(106,'Edi Pistol Burst',[[0,4],[24,4],[25,6],[28,6],[29,3],[28,8],[29,3],[28,8],[29,3],[28,8],[25,5],[4,10]]);
   put(101,'Edi Baton Rush',[[4,8],[5,4],[6,4],[7,4],[8,4],[9,5],[10,5],[11,6],[4,12]],{attack:false});
   put(102,'Edi Baton Smash',[[9,12],[10,5],[11,8],[4,14]],{attack:false});
   for(const [slot,index]of[[101,6],[102,1]]){const e=f.anims[slot].ents[index];e[6]=[-62,68,37,24];e[7]=30;e[8]=2;e[9]=1;e[10]=slot===102?-1:0;}
   f.anims[105].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(111,'Edi Arrest and Batter',[[12,12],[14,5],[15,4],[14,6],[15,4],[14,6],[15,4],[12,12]]);
  }
  if(p.id==='abigail'){
   put(100,'Abigail Rage Charge',[[10,18],...[11,12,13,14,11,12,13,14].map(i=>[i,4]),[15,4],[16,5],[17,20]],{attack:false});
   for(let i=1;i<=10;i++){const e=f.anims[100].ents[i];e[6]=[-35,57,32,30];e[7]=40;e[8]=2;e[9]=1;}
   for(const slot of[101,105])f.anims[slot].ents.forEach(e=>{e[6]=[0,0,0,0];e[7]=0;});
   put(107,'Abigail Throw Grip',[[19,9]],{loop:true});put(108,'Abigail Throw Lift',[[21,12]],{loop:true});put(109,'Abigail Throw Recovery',[[17,20],[4,8]]);
  }
  if(p.id==='sodom'){
   put(100,'Sodom Katana Rush',[[3,10],[18,4],...[19,20,19,18,19,20,19,18].map(i=>[i,4]),[3,16]],{attack:false});
   for(let i=1;i<=8;i++){const e=f.anims[100].ents[i];e[6]=[-46,48,40,28];e[7]=30;e[8]=2;e[9]=1;}
   put(101,'Sodom Twin Blade Chops',[[3,5],...[14,15,16,17].map(i=>[i,3]),[3,7],...[14,15,16,17].map(i=>[i,4]),[3,15]],{attack:true,strength:2});
   put(102,'Sodom Heavy Sword Chop',[[3,7],[14,5],[15,5],[16,4],[17,4],[3,18]],{attack:true,strength:2,kd:true});
  }
  if(p.id==='belger'){
   put(100,'Belger Crossbow Volley',[[7,8],[14,5],[15,4],[16,7],[15,4],[16,7],[15,4],[7,15]]);
   put(101,'Belger Escape Leap',[[9,5],[8,10],[7,8]],{loop:true});
   put(102,'Belger Sky Bolt Rain',[[7,8],[12,33],[7,16]]);
   put(105,'Belger Escape Hop',[[9,5],[8,10],[7,8]],{loop:true});
  }
  const scale=p.data.sizeAdjustment?.factor||1;if(scale!==1)for(const a of f.anims)for(const e of a.ents)for(let k=2;k<=6;k++)if(Array.isArray(e[k]))e[k]=e[k].map(n=>Math.round(n*scale));
  retimeNormals(f);andoreCrouchPunch(p,f);delete f._ai;return p.template=f;
 }
 function bind(player,native,id){const p=get(id);player.F=clone(build(p,native));player.AIAtlas=player.AIAtlasAlt=p.image;player.ft=[p.speed,p.speed*.72|0,[0,0,p.jump,0x40],[-0x240,0,p.jump,0x40],[0x280,0,p.jump,0x40]];}
 function art(player){const p=get(player.aiProfile),f=player.F;let frame;
  if(player.DIZZY===2)frame=sequence(p,p.hurt)[Math.floor((player.STUN||0)/10)%sequence(p,p.hurt).length][0];
  else if(player.CESpecial&&player.anim?.name?.startsWith('ceSpecialBurn'))frame=sequence(p,p.hurt)[0][0];
  else if(player.anim?.guest)frame=player.anim.ents[Math.min(player.aidx,player.anim.ents.length-1)][0];
  else frame=f.anims[[7,8].includes(player.ST)?player.Y>8*256?28:29:player.ST===10?30:player.ST===5?22:0].ents[0][0];
  if(p.id==='belger'){if(player.HP<player.maxHP||[1,2,5,6,7,8,10,11].includes(player.ST))player.AIFFDismounted=true;if(player.AIFFDismounted&&frame<=6)frame=player.Y>0?8:7;}
  // Shared airborne poses retain their air pivot; grounded reuse meets the same sole line.
  let rect=f.frames[frame];const groundShift=p.data.floorAlignment?.groundFrameOffsets?.[frame];if(player.Y===0&&player.ST<=4&&groundShift)rect=[...rect.slice(0,5),rect[5]+groundShift];
  return{image:p.image,rect,alternate:false,burning:!!player.CESpecial&&player.anim?.name?.startsWith('ceSpecialBurn')};
 }
 function portrait(id,original,kind){const p=get(id),w=original.naturalWidth||original.width,h=original.naturalHeight||original.height,key=w+':'+h+kind;if(p.portraits.has(key))return p.portraits.get(key);const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(!kind.endsWith('R')){g.translate(w,0);g.scale(-1,1);}const top=kind.startsWith('sel')?32:0,scale=Math.max(w/76,(h-top)/72),dw=76*scale,dh=72*scale;g.save();g.beginPath();g.rect(0,top,w,h-top);g.clip();g.drawImage(p.portraitImage,8,0,76,72,(w-dw)/2,top+(h-top-dh)/2,dw,dh);g.restore();p.portraits.set(key,c);return c;}
 function bodyScale(player){return get(player.aiProfile)?.data.sizeAdjustment?.factor||1;}
 function mouth(player){const scale=bodyScale(player),r=art(player).rect,lying=player.cur===29,x=lying?r[4]+r[2]*.72:-12*scale;return{x:player.X/256+(player.FACE?-x:x),y:player.Y/256+(lying?12*scale:Math.min(98*scale,Math.max(35*scale,-r[5]-17*scale)))};}
 function start(player,m,str,h){if(['bullet','burst','grenade','rain','retreat','grenade-barrage','pistol','pistol-burst','bolts','bolt-rain'].includes(m.style)&&player.FBON)return false;Object.assign(player,{ST:11,MV:m,SPSTR:str,SPK:1,SPKD:['dash','spin'].includes(m.style)?0:1,RETCR:0,KB:0,hitdone:0,AIFFMove:{age:0,phase:-1,launched:false,shots:0,dir:player.FACE?1:-1,fromAir:player.Y>0}});h.anim(player,m.a,0);h.sound(0x25);return true;}
 function spawn(player,type,age){const dir=player.FACE?1:-1;player.AIFFProjectile={type,age:0,dir,strength:player.SPSTR};player.FBON=1;player.FBK='ff-'+type;player.FBDEF=null;player.FBAN=null;player.FBIMPACT=0;player.FBX=type==='rain'?player.opp.X-dir*30*256:player.X+dir*40*256;player.FBY=(type==='grenade'?84:type==='rain'?150:68)*256;player.FBVX=dir*(type==='grenade'?0x300:type==='rain'?0x60:0x580);player.AIFFProjectile.vy=type==='grenade'?0x280:type==='rain'?-0x480:0;}
 function step(player,h){const p=get(player.aiProfile),m=player.MV,s=player.AIFFMove;
  if(m?.kind==='throw'&&player.AIFFHold){if(player.AIFFHold.kind==='batter')batterStep(player,h);else holdStep(player,h);return;}
  if(m?.kind==='throw'&&player.AIFFThrow){if(player.AIFFThrow.kind==='toss')tossStep(player,h);else pileStep(player,h);return;}
  if(m?.kind==='throw'){if(player.THV){player.opp.X=player.X-player.THV.d*28*256;player.opp.Y=0;player.opp.STUN=999;if(--player.THV.t<=0)h.release(player);}if(--player.SCNT<=0)h.idle(player);return;}
  if(!s||m?.kind!=='ff')return;s.age++;
  if(p.id==='sodom'&&m.style.startsWith('sodom-')){sodomStep(player,h);return;}
  if(p.id==='belger'){belgerStep(player,h);return;}
  if(p.id==='edi'){ediStep(player,h);return;}
  if(p.id==='abigail'&&m.style==='rage'){rageStep(player,h);return;}
  if(p.id==='abigail'&&m.style==='grab'){if(s.age===8&&Math.abs(player.X-player.opp.X)<=64*256&&[0,3,4,5,6].includes(player.opp.ST)&&player.opp.Y===0&&player.opp.HP>0)h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(p.id==='rolento'&&['grenade','grenade-barrage','retreat','wallkick'].includes(m.style)){rolentoStep(player,h);return;}
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
 function throwStart(player,atk,h){const p=get(player.aiProfile);if(p.id==='edi')return batterStart(player,h);if(p.id==='abigail')return tossStart(player,h);if(p.id==='andore'&&!h.special)return holdStart(player,h);
  if(p.id==='andore'){
   const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:107,THV:{t:999,dmg:40,d:player.FACE?1:-1},hitdone:1,AIFFThrow:{age:0,phase:'grip',dir:player.FACE?1:-1}});
   Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,107,0);h.anim(o,22,0);h.sound(0x2b);return true;
  }Object.assign(player,{MV:h.move,SPK:0,SPKD:0,SPSTR:atk%3,RETCR:0,KB:0,SCNT:34,ST:11,THAN:46,THV:{t:14,dmg:['andore','abigail'].includes(p.id)?40:32,d:player.FACE?-1:1},hitdone:1});h.anim(player,46,0);Object.assign(player.opp,{ST:5,STUN:999,KB:0,RETCR:0,Y:0});h.anim(player.opp,22,0);h.sound(0x2b);return true;}
 function sodomStep(player,h){const s=player.AIFFMove,m=player.MV;
  if(m.style==='sodom-charge'){
   if(player.hitdone&&!s.contact){s.contact=true;s.stop=s.age+16;h.anim(player,100,player.F.anims[100].ents.length-1);}
   if(!s.contact&&s.age>=11&&s.age<=46)player.X+=s.dir*(0x500+player.SPSTR*0x40);
   player.SPKD=1;if(s.age>=(s.stop||63)){delete player.AIFFMove;h.idle(player);}return;
  }
  if(m.style==='sodom-double'){
   if(player.hitdone&&s.phase===0&&!s.firstContact){s.firstContact=true;player.opp.KB=Math.trunc(player.opp.KB*.35);}
   if(player.aidx===5){const gap=Math.abs(player.X-player.opp.X)/256;if(gap>55)player.X+=s.dir*Math.min(4,gap-55)*256;}
   const strike=player.aidx>=6?1:0;if(s.phase!==strike){s.phase=strike;player.hitdone=0;player.AIAttackSerial=(player.AIAttackSerial||0)+1;}
   player.SPKD=strike;
  }else player.SPKD=1;
  if(player.adone||s.age>75){delete player.AIFFMove;h.idle(player);}
 }
 function belgerStep(player,h){const s=player.AIFFMove,m=player.MV;player.AIFFDismounted=true;
  if(m.style==='bolts'||m.style==='bolt-rain'){
   const release=m.style==='bolts'?[13,24,35]:[12,23,34];
   if(release.includes(s.age)){spawnBolt(player,m.style==='bolt-rain',s.shots++);h.sound(0x25);}
   if(s.age>=57){delete player.AIFFMove;h.idle(player);}return;
  }
  if(m.style==='belger-hop'||m.style==='belger-retreat'){
   if(!s.launched&&s.age>=5){s.launched=true;player.VX=-s.dir*(m.style==='belger-hop'?0x480:0x300);player.VY=0x620;player.AY=0x48;player.AX=0;}
   if(s.launched){if(m.style==='belger-retreat'&&[12,23,34].includes(s.age)){spawnBolt(player,false,s.shots++);h.sound(0x25);}if(!h.gravity(player)){player.VX=0;delete player.AIFFMove;h.idle(player);h.sound(0x2f);}}return;
  }
  if(m.style==='power'){player.SPKD=1;if(player.adone||s.age>=55){delete player.AIFFMove;h.idle(player);}}
 }
 function spawnBolt(player,rain,index){const dir=player.FACE?1:-1,pool=player.AIFFBullets||(player.AIFFBullets=[]);if(pool.length>=8)return;
  const target=player.opp.X/256+(index-1)*30,x=player.X/256+dir*(rain?0:65),y=player.Y/256+(rain?104:62);
  pool.push({type:'bolt',x,y,vx:rain?Math.max(-5,Math.min(5,(target-x)/55)):dir*6,vy:rain?7:0,ay:rain?.28:0,dir,age:0,strength:player.SPSTR,hit:false,rain});player.FBON=1;player.FBK='ff-bullets';}
 function ediStep(player,h){const s=player.AIFFMove,m=player.MV;
  if(m.style==='pistol'||m.style==='pistol-burst'){
   if((m.style==='pistol'?[20]:[20,31,42]).includes(s.age)){spawnBullet(player);h.sound(0x25);}
   if(s.age>=(m.style==='pistol'?46:68)){delete player.AIFFMove;h.idle(player);}return;
  }
  if(m.style==='grab-batter'){if(s.age===8&&Math.abs(player.X-player.opp.X)<=60*256&&player.opp.Y===0&&player.opp.HP>0&&[0,3,4,5,6].includes(player.opp.ST))h.grab(player);else if(s.age>=28){delete player.AIFFMove;h.idle(player);}return;}
  if(m.style==='baton-rush'&&s.age>=9&&s.age<=24)player.X+=s.dir*0x240;
  player.SPKD=1;if(player.adone||s.age>=65){delete player.AIFFMove;h.idle(player);}
 }
 function rageStep(player,h){chargeStep(player,h,20,0x500+player.SPSTR*0x40);}
 function chargeStep(player,h,recovery,speed){const s=player.AIFFMove,animation=player.F.anims[100],last=animation.ents.length-1;
  const stop=()=>{s.contact=true;s.stop=s.age+recovery;s.skid=5;h.anim(player,100,last);};
  if(s.age===19)h.sound(0x2b);
  if(!s.contact&&player.hitdone)stop();
  if(!s.contact&&s.age>=19){
   const room=h.room(),edge=(s.dir>0?room.right-40:room.left+40)*256;
   player.X+=s.dir*speed;
   if(s.dir>0?player.X>=edge:player.X<=edge){player.X=edge;stop();}
   else{const frame=1+Math.floor((s.age-19)/3)%(last-1);if(player.aidx!==frame)h.anim(player,100,frame);}
  }
  if(s.contact){player.X+=s.dir*s.skid*256;s.skid*=.75;}
  player.SPKD=1;if(s.stop&&s.age>=s.stop){delete player.AIFFMove;h.idle(player);}
 }
 function batterStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:111,THV:{t:999,dmg:0,d:player.FACE?1:-1},hitdone:1,AIFFHold:{kind:'batter',age:0,pulses:0,dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,Y:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,111,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function batterStep(player,h){const s=player.AIFFHold,o=player.opp;s.age++;
  if(!player.THV||o.HP<=0){holdRelease(player,h,true);return;}
  o.X=player.X+s.dir*47*256;o.Y=0;o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;
  if([17,27,37].includes(s.age)){s.pulses++;h.chokeDamage(player,s.pulses===3?16:8);h.sound(0x2b);h.anim(o,22,0);if(o.HP<=0){holdRelease(player,h,true);return;}}
  if(s.age>=49){delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;h.drop(o);h.idle(player);}
 }
 function tossStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:107,THV:{t:999,dmg:40,d:player.FACE?1:-1},hitdone:1,AIFFThrow:{kind:'toss',age:0,phase:'grip',dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,AIFFHeld:{owner:player.i,inverted:false}});h.anim(player,107,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function tossStep(player,h){const s=player.AIFFThrow,o=player.opp;s.age++;
  if(s.phase!=='recover'&&(!player.THV||o.HP<=0)){cancelThrow(player,h);return;}
  if(s.age===9){s.phase='lift';h.anim(player,108,0);}
  if(s.age===21){delete o.AIFFHeld;h.release(player);s.phase='recover';h.anim(player,109,0);h.sound(0x2f);}
  if(s.phase!=='recover'){o.X=player.X+s.dir*40*256;o.Y=s.phase==='lift'?(s.age-8)*5*256:0;o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
  if(s.age>=49){delete player.AIFFThrow;h.idle(player);}
 }
 function spawnBullet(player){const dir=player.FACE?1:-1,pool=player.AIFFBullets||(player.AIFFBullets=[]);if(pool.length>=6)return;pool.push({x:player.X/256+dir*60,y:player.Y/256+74,vx:dir*10,dir,age:0,strength:player.SPSTR,hit:false});player.FBON=1;player.FBK='ff-bullets';}
 function bulletStep(player,room){for(const b of player.AIFFBullets||[]){b.x+=b.vx;if(b.ay){b.y+=b.vy;b.vy-=b.ay;}b.age++;}player.AIFFBullets=player.AIFFBullets.filter(b=>!b.hit&&b.y>=0&&b.age<=120&&b.x>=room.left-32&&b.x<=room.right+32);const b=player.AIFFBullets[0];player.FBON=b?1:0;if(b){player.FBX=Math.round(b.x*256);player.FBY=b.y*256;player.FBVX=b.vx*256;}else delete player.AIFFBullets;}
 function bulletContacts(player){return(player.AIFFBullets||[]).filter(b=>!b.hit).map(b=>({bullet:b,box:[b.x,b.y,b.type==='bolt'?8:6,3]}));}
 function bulletDraw(ctx,player,camera,ground){ctx.save();ctx.imageSmoothingEnabled=false;for(const b of player.AIFFBullets||[]){if(b.hit)continue;ctx.save();ctx.translate(Math.round(b.x-camera),Math.round(ground-b.y));if(b.type==='bolt'){ctx.rotate(Math.atan2(-(b.vy||0),b.vx));ctx.scale(-1,1);ctx.drawImage(boltImage,-7,-1);}else{if(b.dir>0)ctx.scale(-1,1);ctx.drawImage(bulletImage,-5,-1);}ctx.restore();}ctx.restore();}
 function holdStart(player,h){const o=player.opp;delete player.AIFFMove;Object.assign(player,{MV:h.move,ST:11,SPK:0,SPKD:0,RETCR:0,KB:0,Y:0,VX:0,VY:0,THAN:111,THV:{t:999,dmg:0,d:player.FACE?1:-1},hitdone:1,AIFFHold:{age:0,pulses:0,escape:0,walk:0,ownerPrevious:player.AIButtons?.raw||0,previous:((o.AIButtons?.raw||0)|(o.KEYS&15)),dir:player.FACE?1:-1}});Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,VX:0,VY:0,Y:0,AIFFHeld:{owner:player.i,inverted:false,choke:true}});h.anim(player,111,0);h.anim(o,22,0);h.sound(0x2b);return true;}
 function holdStep(player,h){const s=player.AIFFHold,o=player.opp;s.age++;
  const attack=player.AIButtons?.raw||0,punch=(attack&~s.ownerPrevious)&112;s.ownerPrevious=attack;if((attack&544)===544||(s.age>5&&punch)){delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;throwStart(player,2,{...h,move:h.throwMove,special:true});return;}if((attack&192)===192){holdRelease(player,h,false);start(player,player.F.moves[5],2,h);return;}
  if(!player.THV||o.HP<=0){holdRelease(player,h,true);return;}
  const raw=(o.AIButtons?.raw||0)|(o.KEYS&15),fresh=(raw&~s.previous)&1008,direction=raw&15;let points=0;if(fresh)points+=2;if(direction&&direction!==(s.previous&15))points++;s.previous=raw;
  if(h.cpu?.(o)&&s.age>18&&s.age%6===0)points+=2;s.escape=Math.min(14,s.escape+Math.min(3,points));
  if(s.escape>=14){s.escaped=true;holdRelease(player,h,false);return;}
  const phase=s.age>=20?(s.age-20)%24:24,shaking=phase<10,shake=shaking?((phase>>1)%2?2:-2):0;const move=((player.KEYS&2)?1:0)-((player.KEYS&1)?1:0);if(move){const room=h.room(),margin=96;player.X=Math.max((room.left+margin)*256,Math.min((room.right-margin)*256,player.X+move*0x180));s.walk++;}const chokeAnim=move?(shaking?115:114):111,chokeIndex=move?Math.floor(s.walk/4)%6:shaking?((phase>>1)%2):0;if(player.cur!==chokeAnim||player.aidx!==chokeIndex)h.anim(player,chokeAnim,chokeIndex);
  const grip=art(player).rect,head=h.head?.(o),gx=player.X/256+s.dir*(-grip[4]-4),gy=-grip[5]-10;if(head){o.X=Math.round((gx-(head.x-o.X/256))*256);o.Y=Math.round((gy-(head.y-o.Y/256))*256);}else{o.X=player.X+s.dir*24*bodyScale(player)*256;o.Y=38*bodyScale(player)*256;}o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;
  if(s.age>=20&&(s.age-20)%24===0){s.pulses++;h.chokeDamage(player,4);h.sound(0x2b);if(o.HP<=0){holdRelease(player,h,true);return;}h.anim(o,22,0);}
 }
 function holdRelease(player,h,fatal=false){const o=player.opp;delete o.AIFFHeld;delete player.AIFFHold;player.THV=null;if(fatal){h.drop?.(o);}else{o.ST=5;o.STUN=12;o.KB=0;o.Y=0;}h.idle(player);}
 function pileStep(player,h){
  const s=player.AIFFThrow,o=player.opp;s.age++;
  if((!player.THV||o.HP<=0)&&s.phase!=='recover'){cancelThrow(player,h);return;}
  if(s.phase==='grip'&&s.age>=6){s.phase='jump';player.VY=0x1000;player.AY=0xb0;player.VX=s.dir*0x80;player.AX=0;h.anim(player,108,0);o.AIFFHeld.inverted=true;h.sound(0x2b);}
  if(s.phase==='jump'){
   if(!h.gravity(player)){s.phase='recover';s.landed=s.age;delete o.AIFFHeld;h.slam(player);h.anim(player,109,0);h.sound(0x2f);}
  }
  if(s.phase!=='recover'){o.X=player.X+s.dir*7*bodyScale(player)*256;o.Y=player.Y+(s.phase==='grip'?48:66)*bodyScale(player)*256;o.ST=5;o.STUN=999;o.KB=o.VX=o.VY=0;}
  else if(s.age-s.landed>=26){delete player.AIFFThrow;h.idle(player);}
 }
 function cancelThrow(player,h){const o=player.opp;delete o.AIFFHeld;delete player.AIFFThrow;delete player.AIFFHold;player.THV=null;if(o.ST===5&&o.STUN>500){o.STUN=12;o.KB=0;if(o.Y>0)h.drop?.(o);} }
 const heldImages=new WeakMap();
 function heldArt(player,art){if(!player.AIFFHeld?.inverted)return art;let cache=heldImages.get(art.image);if(!cache){cache=new Map();heldImages.set(art.image,cache);}const r=art.rect,key=r.slice(0,4).join(',');let c=cache.get(key);if(!c){c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.translate(c.width,c.height);g.rotate(Math.PI);g.drawImage(art.image,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);cache.set(key,c);}return{...art,image:c,rect:[0,0,c.width,c.height,-Math.floor(c.width/2),-Math.floor(c.height/2)]};}
 function spawnGrenade(player,index=0){
  const dir=player.FACE?1:-1,pool=player.AIFFGrenades||(player.AIFFGrenades=[]);if(pool.length>=8)return;
  const gap=Math.abs(player.X-player.opp.X)/256,velocity=Math.max(1.3,Math.min(5.4,gap/46))+(index-1)*1.1;
  pool.push({x:player.X/256+dir*28*bodyScale(player),y:player.Y/256+67*bodyScale(player),vx:dir*velocity,vy:2.6+index*.3,age:0,fuse:58+index*6,dir,blast:0,hit:false,strength:player.SPSTR});player.FBON=1;player.FBK='ff-grenades';
 }
 function grenadeStep(player,room,onBlast){
  const pool=player.AIFFGrenades;if(!pool)return;
  for(const g of pool){g.age++;if(g.blast){g.blast++;continue;}g.x+=g.vx;g.y+=g.vy;g.vy-=.23;if(g.y<6){g.y=6;if(!g.bounced){g.vy=Math.abs(g.vy)*.28;g.bounced=true;}else g.vy=0;g.vx*=.78;}if(g.age>=g.fuse){g.blast=1;onBlast?.();g.y=Math.max(15,g.y);g.vx=g.vy=0;}if(g.x<room.left-80||g.x>room.right+80)g.blast=16;}
  player.AIFFGrenades=pool.filter(g=>g.blast<=14);const first=player.AIFFGrenades[0];player.FBON=first?1:0;if(first){player.FBX=Math.round(first.x*256);player.FBY=Math.round(first.y*256);player.FBVX=Math.round(first.vx*256);}else delete player.AIFFGrenades;
 }
 function grenadeContacts(player){return(player.AIFFGrenades||[]).filter(g=>g.blast>0&&g.blast<=8&&!g.hit).map(g=>({grenade:g,box:[g.x,g.y,29,29]}));}
 function grenadeDraw(ctx,player,camera,ground){const D=SF2AIFFData.rolento.grenades;ctx.save();ctx.imageSmoothingEnabled=false;for(const g of player.AIFFGrenades||[]){const x=Math.floor(g.x-camera),y=Math.floor(ground-g.y);if(g.blast){const t=g.blast,r=Math.max(4,26-Math.abs(t-4)*2);for(let i=0;i<8;i++){const a=i*Math.PI/4,px=Math.round(x+Math.cos(a)*r*.65),py=Math.round(y+Math.sin(a)*r*.65);ctx.fillStyle=t<7?'#ff7420':'#8b3b35';ctx.fillRect(px-5,py-5,10,10);ctx.fillStyle=t<5?'#fff5a0':'#ebac43';ctx.fillRect(px-2,py-2,4,4);}}else{const f=D.frames[Math.floor(g.age/3)%8];ctx.drawImage(grenadeImage,f[0],f[1],f[2],f[3],x-Math.floor(f[2]/2),y-Math.floor(f[3]/2),f[2],f[3]);}}ctx.restore();}
 function rolentoStep(player,h){const s=player.AIFFMove,m=player.MV,a=s.age;
  if(['grenade','grenade-barrage'].includes(m.style)){
   const release=m.style==='grenade'?[9]:[9,19,29];if(release.includes(a)){spawnGrenade(player,s.shots++);h.sound(0x25);}if(player.Y>0)h.gravity(player);if(a>=(m.style==='grenade'?35:52)&&player.Y<=0){delete player.AIFFMove;h.idle(player);}return;
  }
  if(!s.launched&&a>=5){s.launched=true;s.wallDir=m.style==='wallkick'?(player.X/256<(h.room().left+h.room().right)/2?-1:1):-s.dir;player.VX=s.wallDir*(m.style==='wallkick'?0x780:0x540);player.VY=0x640;player.AY=0x44;player.AX=0;}
  const room=h.room(),x=player.X/256;
  if(s.launched){
   if(!s.bounced&&m.style==='wallkick'&&(x<=room.left+44||x>=room.right-44)){s.bounced=true;player.FACE=x<=room.left+44?1:0;player.VX=(player.FACE?1:-1)*0x880;player.VY=0x180;player.AY=0x18;h.anim(player,110,0);player.hitdone=0;player.SPKD=1;h.sound(0x25);}
   if(m.style==='retreat'&&[10,17,24].includes(a)){spawnGrenade(player,s.shots++);h.sound(0x25);}
   if(!h.gravity(player)){delete player.AIFFMove;h.idle(player);h.sound(0x2f);return;}
  }
  if(a>120){player.Y=player.VY=player.VX=0;delete player.AIFFMove;h.idle(player);}
 }
 function wallJump(player,h){if(player.aiProfile!=='rolento')return;const ratio=player.HP/player.maxHP;player.ft[0]=ratio<=.33?0x680:0x500;player.ft[1]=ratio<=.33?0x540:0x400;if(player.Y<=0||player.ST!==2){delete player.AIFFWall;return;}const w=player.AIFFWall||(player.AIFFWall={cool:0,count:0});if(w.cool>0){w.cool--;return;}const room=h.room(),x=player.X/256,left=x<=room.left+44&&player.VX<0,right=x>=room.right-44&&player.VX>0;if((left||right)&&player.Y>18*256&&w.count<2){w.cool=12;w.count++;player.FACE=left?1:0;player.VX=(left?1:-1)*0x640;player.VY=0x5c0;player.AY=0x44;player.JA=1;player.hitdone=0;h.anim(player,110,0);h.sound?.(0x25);}}
 function projectileStep(player,room){const s=player.AIFFProjectile;if(!s||!player.FBON){delete player.AIFFProjectile;return;}s.age++;player.FBX+=player.FBVX;player.FBY+=s.vy;if(s.type==='grenade'){s.vy-=0x26;if(player.FBY<12*256){player.FBY=12*256;s.vy=Math.abs(s.vy)*.45|0;if(s.age>65)s.exploding=1;}}if(s.type==='rain'&&player.FBY<12*256)player.FBON=0;if(s.age>120||player.FBX/256<room.left-40||player.FBX/256>room.right+40)player.FBON=0;}
 function projectileDraw(ctx,player,camera,ground){const s=player.AIFFProjectile;if(!s||!player.FBON)return;const x=(player.FBX>>8)-camera,y=ground-(player.FBY>>8);ctx.save();if(s.type==='grenade'){ctx.fillStyle='#172b17';ctx.fillRect(x-4,y-5,8,10);ctx.fillStyle='#bbc060';ctx.fillRect(x-3,y-4,2,8);ctx.fillStyle='#eebd50';ctx.fillRect(x-1,y-8,3,3);}else{ctx.strokeStyle='#e9d89a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-s.dir*10,y);ctx.lineTo(x+s.dir*8,y);ctx.stroke();ctx.fillStyle='#faffed';ctx.fillRect(x+s.dir*7-1,y-2,3,4);}ctx.restore();}
 function damage(player,strength){if(player.ST!==11)return[10,17,25][Math.min(2,strength)]*(get(player.aiProfile).hp>=400?1.1:1)|0;return player.MV?.style==='sodom-charge'?30:player.MV?.style==='sodom-chop'?34:player.MV?.style==='sodom-double'?18:player.MV?.style==='rage'?40:player.MV?.style==='baton'||player.MV?.style==='baton-rush'?30:player.MV?.style==='dash'||player.MV?.style==='spin'?player.AIFFMove?.phase===2?17:11:player.MV?.style==='seatdrop'?34:player.MV?.style==='power'?36:27;}
 function stageDraw(ctx,id,camera,width,top,height,ground){const p=get(id),y=ground-220;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#151b2b';ctx.fillRect(0,top,width,height);for(let xx=-camera;xx<width;xx+=720)ctx.drawImage(p.stage,xx,y);for(let yy=y;yy>top;yy-=16)ctx.drawImage(p.stage,0,0,720,16,-camera,yy-16,720,16);for(let yy=y+256;yy<top+height;yy+=16)ctx.drawImage(p.stage,0,236,720,16,-camera,yy,720,16);ctx.restore();}
 function mapDraw(ctx,s,defeated){ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#070c16';ctx.fillRect(0,0,384,224);ctx.drawImage(metro,0,20,384,180);for(const id of ids()){const point=id==='damnd'?[135,103]:get(id).point;ctx.fillStyle=id===s.id?(s.tick%20<10?'#fff':'#ff3030'):defeated.includes(id)?'#777':'#ffe050';ctx.fillRect(point[0]-3,point[1]-3,6,6);if(id===s.id){ctx.strokeStyle='#fff';ctx.strokeRect(point[0]-7,point[1]-7,14,14);}}ctx.restore();}
 return{soundCode(player,kind){if(kind!=='hit')return null;const pack=get(player.aiProfile);if(!pack?.data.nativeFrames||!pack.data.combat)return null;const frame=player.anim?.ents[player.aidx]?.[0],attack=pack.data.nativeFrames[frame]?.attack;return pack.data.combat.attacks[attack]?.sound??null;},retimeNormals,canProbe(player){return !(player.ST===11&&player.MV?.kind==='ff'&&player.MV.style==='seatdrop'&&player.AIFFMove?.phase!=='drop');},holdStart,bulletStep,bulletContacts,bulletDraw,grenadeStep,grenadeContacts,grenadeDraw,wallJump,heldArt,cancelThrow,prepareSound,playSound,soundCounts,ready,get,ids,specs,bind,art,portrait,mouth,start,step,throwStart,projectileStep,projectileDraw,damage,stageDraw,mapDraw};
})();
