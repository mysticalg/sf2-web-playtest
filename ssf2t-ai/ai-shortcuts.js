/* Native AI control adaptation: emits ordinary controller inputs only.
 * Original special controllers, eligibility, collisions and damage remain native.
 * Command provenance and verified activation cases: NATIVE-SSF2T-SHORTCUTS.md. */
'use strict';
((root)=>{
 const P=[16,32,64],K=[128,256,512],PPP=112,KKK=896,DIR=15,ATK=1008;
 const pairs=[[0,0],[1,1],[2,2],[0,1],[1,2],[2,0],[0,2],[1,0],[2,1]].map(([p,k])=>({p,k,mask:P[p]|K[k],label:['LP','MP','HP'][p]+'+'+['LK','MK','HK'][k]}));
 const move=(pair,name,motion,button,extra={})=>({pair,name,motion,button,...extra});
 const shoto=(ken=false)=>[move(0,'Hadouken','qcf','P'),move(1,'Shoryuken','dp','P'),move(2,'Tatsumaki','qcb','K'),...(ken?[move(5,'Light Command Kick','qcf','K',{newOnly:true}),move(3,'Medium Command Kick','qcf','K',{newOnly:true}),move(6,'Heavy Command Kick','qcf','K',{newOnly:true})]:[move(3,'Shakunetsu Hadouken','hcf','P',{newOnly:true})]),move(4,ken?'Shoryu Reppa':'Shinku Hadouken','qcf2','P',{super:true})];
 const book=[shoto(),[move(0,'Sumo Headbutt','cbf','P'),move(1,'Sumo Smash','cdu','K'),move(2,'Hundred Hand Slap','rapid','P'),move(3,'Oicho Throw','hcb','P',{newOnly:true,grab:true}),move(4,'Oni Muso','charge2','P',{super:true})],[move(0,'Rolling Attack','cbf','P'),move(1,'Vertical Rolling Attack','cdu','K'),move(2,'Electric Thunder','rapid','P'),move(3,'Backstep Rolling','cbf','K',{newOnly:true}),move(4,'Ground Shave Rolling','charge2','P',{super:true}),move(5,'Forward Hop','forward',KKK,{newOnly:true}),move(6,'Backward Hop','back',KKK,{newOnly:true})],[move(0,'Sonic Boom','cbf','P'),move(1,'Flash Kick','cdu','K'),move(4,'Double Somersault','diagonalCharge','K',{super:true})],shoto(true),[move(0,'Kikoken','cbf','P'),move(1,'Spinning Bird Kick','cbf','K',{oldMotion:'cdu'}),move(2,'Lightning Legs','rapid','K'),move(3,'Up Kicks','cdu','K',{newOnly:true}),move(4,'Senretsukyaku','charge2','K',{super:true})],[move(0,'Spinning Piledriver','circle','P',{grab:true}),move(1,'Double Lariat','tap',PPP),move(2,'Quick Lariat','tap',KKK),move(3,'Siberian Suplex / Bear Grab','circle','K',{grab:true}),move(4,'Final Atomic Buster','circle2','P',{super:true,grab:true,jumpBuffer:true}),move(5,'Banishing Flat','greenhand','P',{newOnly:true})],[move(0,'Yoga Fire','qcf','P'),move(1,'Yoga Flame','hcf','P'),move(2,'Yoga Blast','hcf','K',{newOnly:true}),move(3,'Forward Teleport','dp',PPP),move(4,'Yoga Inferno','hcf2','P',{super:true}),move(5,'Backward Teleport','rdp',PPP),move(6,'Short Forward Teleport','dp',KKK),move(7,'Short Backward Teleport','rdp',KKK)],[move(0,'Psycho Crusher','cbf','P'),move(1,'Double Knee Press','cbf','K'),move(2,'Head Press','cdu','K'),move(3,'Devil Reverse','cdu','P'),move(4,'Knee Press Nightmare','charge2','K',{super:true})],[move(0,'Tiger Shot','qcf','P'),move(1,'Ground Tiger Shot','qcf','K'),move(2,'Tiger Uppercut','dp','P'),move(3,'Tiger Knee','tiger','K'),move(4,'Tiger Genocide','qcf2','P',{super:true})],[move(0,'Dash Straight','cbf','P'),move(1,'Dash Upper','cbf','K'),move(2,'Buffalo Headbutt','cdu','P',{newOnly:true}),move(3,'Turn Punch','holdRelease',PPP),move(4,'Crazy Buffalo','charge2','P',{super:true}),move(5,'Low Dash Straight','cbdf','P',{newOnly:true}),move(6,'Low Dash Upper','cbdf','K',{newOnly:true})],[move(0,'Rolling Crystal Flash','cbf','P'),move(1,'Flying Barcelona / Izuna','cdu','K',{airFollow:true}),move(2,'Sky High Claw','cdu','P'),move(3,'Scarlet Terror','cbf','K',{newOnly:true}),move(4,'Rolling Izuna Drop','diagonalCharge','K',{super:true,airFollow:true}),move(5,'Backflip','tap',PPP),move(6,'Short Backflip','tap',KKK)],[move(0,'Spiral Arrow','qcf','K'),move(1,'Cannon Spike','dp','K'),move(2,'Spin Knuckle','knuckle','P'),move(3,'Hooligan Combination','hooligan','P',{newOnly:true}),move(4,'Spin Drive Smasher','qcf2','K',{super:true})],[move(0,'Mexican Typhoon','circle','P',{grab:true}),move(1,'Tomahawk Buster','dp','P'),move(2,'Condor Dive','dive',PPP),move(4,'Double Typhoon','circle2','P',{super:true,grab:true,jumpBuffer:true})],[move(0,'Rekkaken','qcf','P'),move(1,'Shienkyaku','rdp','K'),move(2,'Rekkukyaku','wing','K',{newOnly:true}),move(4,'Rekka Shinken','qcf2','P',{super:true})],[move(0,'Air Slasher','cbf','P'),move(1,'Double Rolling Sobat','cbf','K'),move(2,'Jackknife Maximum','cdu','K',{newOnly:true}),move(3,'Machine Gun Upper','cdu','P',{repeat:true}),move(4,'Sobat Carnival','charge2','K',{super:true})]];
 const akuma=[move(0,'Gou Hadouken / Air Hadouken','qcf','P'),move(1,'Gou Shoryuken','dp','P'),move(2,'Tatsumaki','qcb','K'),move(3,'Shakunetsu Hadouken','hcf','P'),move(4,'Forward Teleport','dp',PPP),move(5,'Backward Teleport','rdp',PPP),move(6,'Short Forward Teleport','dp',KKK),move(7,'Short Backward Teleport','rdp',KKK)];
 function moves(p){return(p?.akuma?akuma:book[p?.id]||[]).filter(m=>!p.old||!m.newOnly&&!m.super).map(m=>({...m,motion:p.old&&m.oldMotion||m.motion,chord:pairs[m.pair].mask,label:pairs[m.pair].label}));}
 function recipe(m,p,charge){
  const out=[],add=(n,d='',b=0)=>{if(n>0)out.push({n,d,b});},button=typeof m.button==='number'?m.button:m.button==='K'?K[pairs[m.pair].k]:P[pairs[m.pair].p],step=(d,b=0,n=2)=>add(n,d,b),spin=()=>{for(const d of['F','D','B','U'])step(d,0,1);};
  if(m.airFollow&&p.y>40){step('F',16);add(2,'');return out;}
  if(m.motion==='tap')step('',button);
  else if(m.motion==='forward'||m.motion==='back')step(m.motion==='forward'?'F':'B',button);
  else if(m.motion==='rapid'){for(let i=0;i<10;i++){step('',button,2);step('',0,2);}}
  else if(m.motion==='holdRelease'){add(120,'',button);add(3,'');}
  else if(m.motion==='dive'){if(p.y<=40){step('U',0,3);step('',0,6);}step('',button);}
  else if(m.motion==='circle'||m.motion==='circle2'){if(m.jumpBuffer){if(p.y<=40)step('U',0,1);out.push({n:120,d:'',b:0,wait:'falling'});}spin();if(m.motion==='circle2')spin();out.at(-1).b=button;out.at(-1).n=2;}
  else if(['cbf','cbdf','cdu','charge2','diagonalCharge'].includes(m.motion)){
   const down=m.motion==='cdu',both=m.motion==='diagonalCharge',stored=both?Math.min(charge.back,charge.down):down?charge.down:charge.back;add(Math.max(0,90-stored),'DB');
   if(m.motion==='diagonalCharge'){step('DF');step('DB');step('UF',button);}else if(m.motion==='charge2'){step('F');step('B');step('F',button);}else{const end=down?'U':m.motion==='cbdf'?'DF':'F';step(end,0,1);step(end,button);}
  }else{
   const paths={knuckle:['B','DB','F'],greenhand:['F','DF','D'],qcf:['D','DF','F'],qcb:['D','DB','B'],dp:['F','D','DF'],rdp:['B','D','DB'],hcf:['B','DB','D','DF','F'],hcb:['F','DF','D','DB','B'],tiger:['D','DF','F','UF'],hooligan:['DB','D','DF','F','UF'],wing:['B','DB','D','DF','F','UF']};
   const base=m.motion.endsWith('2')?m.motion.slice(0,-1):m.motion,path=paths[base];if(!path)return[];const seq=m.motion.endsWith('2')?[...path,...path]:path;seq.forEach((d,i)=>{if(m.motion==='wing'&&i===seq.length-1){step(d,0,1);step(d,button,3);}else step(d,i===seq.length-1?button:0);});
  }
  if(m.repeat)for(let i=0;i<10;i++){step('',0,1);step('',button,1);}
  add(2,'');return out;
 }
 function create({enabled=false}={}){
  let on=!!enabled,lastFrame=-1,primed=false,slots=[];const reset=()=>{slots=[0,1].map(()=>({previous:0,back:0,down:0,queue:[],suppressed:0,last:null,output:0,key:null,y:40}));primed=false;lastFrame=-1;};reset();
  const bits=(d,face)=>{const f=face?1:2,b=face?2:1;return(d.includes('D')?4:0)|(d.includes('U')?8:0)|(d.includes('F')?f:0)|(d.includes('B')?b:0);};
  function process(api,input){
   const state=api.state();if(!state?.ready)return input;if(state.frame<lastFrame)reset();lastFrame=state.frame;
   if(!on){slots.forEach((s,i)=>{s.previous=input[i];s.queue=[];s.suppressed=0;});return input;}
   const output=input.slice();for(let i=0;i<2;i++){
    const s=slots[i],p=state.players[i],raw=input[i]||0,base=0xff844e+i*0x400,face=!!api.read(base+0x12,1),active=state.gameStep===4&&state.matchStep===10&&(state.playersIn&(1<<i))&&p.hp>=0,key=p.id+':'+!!p.akuma+':'+!!p.old;
    if(!active||s.key!==key){Object.assign(s,{back:0,down:0,queue:[],suppressed:0,key});s.previous=raw;output[i]=raw;continue;}
    if(s.suppressed&&!(raw&s.suppressed))s.suppressed=0;
    if(primed&&!s.queue.length){const a=raw&ATK,chord=pairs.find(q=>q.mask===a);if(chord&&(s.previous&chord.mask)!==chord.mask){const m=moves(p).find(m=>m.chord===chord.mask);if(m){s.suppressed=chord.mask;if(m.super&&api.read(base+0x2b4,1)<48)s.last={name:m.name,at:state.frame,status:'meter-needed'};else{s.queue=recipe(m,p,s);s.last={name:m.name,at:state.frame,status:'queued'};}}}}
    let effective=raw&~s.suppressed;
    if(s.queue.length&&[14,20].includes(p.state)){s.queue=[];if(s.last)s.last.status='interrupted';}
    if(s.queue[0]?.wait){const wait=s.queue[0];if(p.y>40)wait.airborne=true;if(p.y>40&&p.y<=90&&p.y<s.y)s.queue.shift();else if(wait.airborne&&p.y<=40){s.queue=[];if(s.last)s.last.status='missed-buffer';}}
    if(s.queue.length){const q=s.queue[0];effective=(raw&~(DIR|ATK))|bits(q.d,face)|q.b;if(!api.read(base+0x47,1)&&!--q.n){if(q.wait){s.queue=[];if(s.last)s.last.status='missed-buffer';}else s.queue.shift();}if(!s.queue.length&&s.last&&s.last.status==='queued')s.last.status='sent';}
    const forward=face?1:2,back=face?2:1;s.back=(effective&back)&&!(effective&forward)?Math.min(90,s.back+1):0;s.down=(effective&4)&&!(effective&8)?Math.min(90,s.down+1):0;s.previous=raw;s.y=p.y;s.output=effective;output[i]=effective;
   }primed=true;return output;
  }
  return{process,reset,setEnabled(value){on=!!value;reset();},info(){return{enabled:on,players:slots.map(s=>({pending:s.queue.reduce((n,q)=>n+q.n,0),last:s.last?{...s.last}:null,output:s.output}))};}};
 }
 root.SSF2TAIShortcuts=Object.freeze({create,moves,pairs:()=>pairs.map(q=>({...q})),version:1});
})(typeof window==='undefined'?globalThis:window);
