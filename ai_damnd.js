/* Final Fight guest adapter. ROM-derived Damnd poses from mysticalg/final-fight-web-port.
   SF2 movement, six-button attacks, guard and special timings are authored adaptations. */
'use strict';
window.SF2AIDamnd=(()=>{
 const D=window.SF2AIDamndData,image=new Image();image.src=D.img;let loaded=false,template=null;
 const ready=image.decode().then(()=>{loaded=true;});
 const clone=x=>JSON.parse(JSON.stringify(x)),pose=name=>D.actions[name],one=(name,n=0,ticks=8)=>[{...pose(name)[n],ticks}];
 function boxes(frame){const f=D.frames[frame],r=f.rect,low=r[3]<85,headY=Math.max(24,Math.min(94,-r[5]-12));
  return{head:[-9,headY,13,11],body:[0,Math.max(22,headY-28),23,22],feet:[0,14,23,13],push:[0,43,19,40],native:f};
 }
 function animation(name,seq,{loop=false,strength=1,attack=false,low=false,kd=false}={}){
  return{name,guest:true,source:0,mode:loop?0:1,loop:0,flags:seq.map((e,i)=>i===seq.length-1?(loop?32768:32769):0),ents:seq.map(e=>{
   const b=boxes(e.frame),hit=attack&&D.combat.attacks[b.native.attack],a=hit?[-hit.x,hit.y,Math.min(34,hit.rx),Math.min(23,hit.ry)]:[0,0,0,0];
   return[e.frame,Math.max(1,e.ticks),b.head,b.body,b.feet,b.push,a,attack?8+strength*4:0,strength,kd?1:0,low?1:0];
  })};
 }
 function build(native){
  if(template)return template;const f=clone(native),normal=['jab','strike','uppercut','kick2','strike','uppercut'];
  f.name='Damnd';f.img=D.img;f.frames=D.frames.map(f=>f.rect.slice());f.pal=D.palette.map(p=>p.slice());while(f.pal.length<16)f.pal.push([0,0,0]);f.pal2=clone(f.pal);
  f.anims=native.anims.map(a=>animation(a.name,/^(thpose|throwfall|vegaizunafall)/.test(a.name)?a.ents.map((e,i)=>({...pose('grabFall')[Math.min(pose('grabFall').length-1,(parseInt(a.name.match(/\d+/)?.[0]||0)+i)%pose('grabFall').length)],ticks:e[1]})):pose(/bodyhit|chit/.test(a.name)?'hurt1':/hit/i.test(a.name)?'hurt':/win/.test(a.name)?'laugh':'idle'),{loop:a.mode===0}));
  while(f.anims.length<103)f.anims.push(animation('damndExtra'+f.anims.length,pose('idle')));
  const put=(i,name,seq,options)=>f.anims[i]=animation(name,seq,options);
  put(0,'idle',pose('idle'),{loop:true});put(1,'walkf',pose('walk'),{loop:true});put(2,'walkb',pose('walk').slice().reverse(),{loop:true});
  put(3,'crouch',[...one('idle',0,2),...one('leap',0,3),...one('leap',0,8)],{loop:true});f.anims[3].loop=2;put(4,'standup',[...one('leap',0,3),...one('idle',0,3)]);
  const jump=[...one('leap',0,4),...one('leap',1,5),...one('leap',2,5),...one('leap',3,5),...one('leap',0,9)];
  for(let i=5;i<=7;i++)put(i,['jumpn','jumpf','jumpb'][i-5],jump);
  for(let i=0;i<6;i++)for(const base of[8,14,47,53,59]){
   const key=(base===14?'c':base>=53?'j':'s')+['LP','MP','HP','LK','MK','HK'][i],seq=clone(pose(i>=3&&base<53?(base===14?'lowKick':'frontKick'):normal[i]));
   if(i===2||i===5){seq[0].ticks=5;seq[1].ticks=4;}
   put(base+i,key,seq,{attack:true,strength:i%3,low:base===14,kd:base===14&&i===5});
  }
  for(let i=20;i<26;i++)put(i,['hitL','hitM','hitH','chitL','chitM','chitH'][i-20],pose(i>=23?'hurt1':'hurt'));
  put(26,'blockS',one('jab',1,6),{loop:true});put(27,'blockC',one('leap',0,6),{loop:true});
  put(28,'fall',[...one('hurt',1,5),...one('hurtFall',0,6),...one('recover',0,8)]);put(29,'lie',one('corpse',pose('corpse').length-1,10));
  put(30,'getup',[...one('recover',0,6),...one('rise',0,5),...one('idle',0,4)]);put(31,'win',pose('laugh'),{loop:true});
  put(46,'throw',[...one('motion2',1,10),...one('uppercut',2,8),...one('idle',0,12)]);
  const rush=clone(pose('strike'));rush[0].ticks=6;rush[1].ticks=4;rush[3].ticks=8;
  put(100,'damndRush',rush,{attack:true,strength:2,kd:true});
  const leap=clone(pose('leap'));[5,4,4,4,12,4].forEach((n,i)=>leap[i].ticks=n);
  put(101,'damndSomersault',leap,{attack:true,strength:2,kd:true});
  const rise=clone(pose('uppercut'));rise[0].ticks=5;rise[1].ticks=3;rise[2].ticks=7;
  put(102,'damndRisingSmash',rise,{attack:true,strength:2,kd:true});
  // Air kicks use the recovered extended-leg leap frame.
  for(let i=3;i<6;i++)for(const base of[53,59]){const a=f.anims[base+i];a.ents=clone(f.anims[101].ents.slice(4,5));a.ents[0][1]=12;a.flags=[32768];}
  f.moves=[{inp:'qcf',btn:'P',kind:'damnd',role:'far',a:100,name:'Street Rush'},{inp:'qcf',btn:'K',kind:'damnd',role:'mid',a:101,name:'Somersault Kick'},{inp:'dp',btn:'P',kind:'damnd',role:'rise',a:102,name:'Rising Smash'}];
  delete f._ai;return template=f;
 }
 function bind(p,native){p.F=clone(build(native));p.AIAtlas=image;p.AIAtlasAlt=image;p.ft=[0x210,0x180,[0,0,0x620,0x48],[0x240,0,0x620,0x48],[-0x240,0,0x620,0x48]];}
 function art(p){const a=p.anim?.guest?p.anim:null,index=a?a.ents[Math.min(p.aidx,a.ents.length-1)][0]:(p.ST===8?template.anims[29].ents[0][0]:p.ST===5?template.anims[22].ents[0][0]:template.anims[0].ents[0][0]);return{image,rect:D.frames[index].rect,alternate:false};}
 function start(p,m,str,h){Object.assign(p,{ST:11,MV:m,SPSTR:str,SPK:1,SPKD:1,RETCR:0,KB:0,hitdone:0,AIDamndMove:{tick:0,launched:false}});h.anim(p,m.a,0);h.sound(0x25);return true;}
 function step(p,h){const m=p.MV;if(m?.kind==='throw'){if(p.THV){const v=p.THV;p.opp.X=p.X-v.d*28*256;p.opp.Y=0;p.opp.STUN=999;if(--v.t<=0)h.release(p);}if(--p.SCNT<=0)h.idle(p);return true;}const s=p.AIDamndMove;if(!s||m?.kind!=='damnd')return false;s.tick++;
  if(m.a===100){if(s.tick>=5&&s.tick<20)p.X+=(p.FACE?1:-1)*(0x220+p.SPSTR*0x40);if(p.adone||s.tick>42){delete p.AIDamndMove;h.idle(p);}}
  else{if(!s.launched&&s.tick>=5){s.launched=true;p.VX=(p.FACE?1:-1)*(m.a===101?0x230:0x80);p.VY=m.a===101?0x690:0x480;p.AX=0;p.AY=m.a===101?0x58:0x50;}
   if(s.launched&&!h.gravity(p)){delete p.AIDamndMove;h.idle(p);h.sound(0x2f);}
   else if(s.tick>75){p.Y=p.VY=p.VX=0;delete p.AIDamndMove;h.idle(p);}
  }return true;
 }
 function throwStart(p,atk,h){const o=p.opp,dir=p.FACE?-1:1;Object.assign(p,{MV:h.move,SPK:0,SPKD:0,SPSTR:atk%3,SPPH:0,RETCR:0,KB:0,SCNT:34,ST:11,THAN:46,THV:{t:14,dmg:30, d:dir},hitdone:1});h.anim(p,46,0);Object.assign(o,{ST:5,STUN:999,KB:0,RETCR:0,X:p.X-dir*28*256,Y:0});h.anim(o,22,0);h.sound(0x2b);return true;}
 const portraits=new Map();
 function portrait(original,kind,p){const w=original.naturalWidth||original.width,h=original.naturalHeight||original.height,key=w+':'+h+':'+kind+':'+(p?.AIPalette?.flat().join(',')||'original')+':'+JSON.stringify(p?.AIColorChoice||{});if(portraits.has(key))return portraits.get(key);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const f=D.frames[pose('idle')[0].frame].rect;const sw=Math.min(68,f[2]),sh=Math.min(82,f[3]),sx=f[0]+Math.max(0,(f[2]-sw)/2),sy=f[1];if(kind.endsWith('R')){x.translate(w,0);x.scale(-1,1);}const top=kind.startsWith('sel')?32:0;x.drawImage(image,sx,sy,sw,sh,0,top,w,h-top);if(p?.AIPalette){const pixels=x.getImageData(0,0,w,h),map=new Map(),choice=p.AIColorChoice||{},indices=[...(choice.clothing===-2?[]:SF2AIRULES.clothing('ai:damnd')),...(choice.skin===-2?[]:SF2AIRULES.skin('ai:damnd'))];for(const i of indices){const rgb=D.palette[i];if(rgb)map.set(rgb.join(),p.AIPalette[i]);}for(let i=0;i<pixels.data.length;i+=4){const rgb=map.get([...pixels.data.slice(i,i+3)].join());if(rgb)for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c];}x.putImageData(pixels,0,0);}portraits.set(key,c);return c;}
 function mouth(p){const a=art(p),r=a.rect,lie=p.cur===29,x=lie?r[4]+r[2]*.72:-15,y=lie?Math.max(7,-r[5]-r[3]*.65):Math.max(36,Math.min(87,-r[5]-20));return{x:p.X/256+(p.FACE?-x:x),y:p.Y/256+y};}
 return{ready,get loaded(){return loaded;},bind,art,start,step,throwStart,portrait,mouth,get fighter(){return template;},data:D};
})();
