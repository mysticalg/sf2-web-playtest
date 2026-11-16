/* CE common grounded reaction primitives, literal0x38670..0x38962/0x95600.
   Pure source rules only; main-engine lifecycle hooks are intentionally separate. */
'use strict';
(()=>{
 const PUSH=[[4,4,4,4,3,3,3,2,1,1,1],[6,6,6,5,5,5,4,4,3,3,2,1,1,1,1,1],[8,8,8,7,7,7,6,5,5,4,3,2,1,1,1,1,1,1,1,1]],SHAKE=[2,-2,2,-2,2,-2,1,-1,1,-1,1,-1,1,-1];
 const BLOCK=[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,1,1,1,0,-1,-1,0,0],[1,1,1,0,1,1,1,0,0,0,0,0,-1,-1,-1,0]];
 function resolveBlock(d,raw,region,options={}){
  const posture=options.posture??window.SF2CEREACTION.posture(d);if(!raw||raw.length<12||!Number.isInteger(posture)||posture<0||posture>2||!Number.isInteger(region)||region<0||region>3)return null;
  let kind=raw[7],entry;
  if(kind===3&&raw[11]===0x26)entry=posture===1?-1:0;
  else{if(kind===4&&raw[11]===0x24)kind=2;entry=BLOCK[posture][(kind&3)*4+region];}
  return {blocked:entry!==0,chipEligible:entry<0,skipDamageRng:entry>0,posture,tableEntry:entry,source:0x95600};
 }
 function push(strength,index,dir,wall=0,side=0,projectile=false,suppressRecoil=false){
  const list=PUSH[strength];if(!list||index<0||index>=list.length)return {victim:0,attacker:0,done:!!list&&index>=list.length};
  const n=list[index]*(dir<0?-1:1),edge=dir<0?1:2;
  if(!projectile&&(wall===edge||side===edge))return {victim:0,attacker:suppressRecoil?0:-n,done:false};
  return {victim:n,attacker:0,done:false};
 }
 function shake(elapsed){let value=0;for(let i=0;i<Math.min(Math.max(0,elapsed-1),SHAKE.length);i++)value+=SHAKE[i];return value;}
 const STATUS=[0x1a,0x1c,0x1c,0x1e,0x20,0x22,0x1c,0x1c,0x1c,0x1c,0x1a,0x1c,0x1a,0x1a,0x1a,0x1a,0x1a,0x1a,0x1a,0x1c];
 const COMMON=new Set([0,2,4,6,8,10,12,20,22,32,36,38]);
 function reactionCode(d,raw,region,block){
  if(!raw||!Number.isInteger(region)||region<0||region>2)return null;
  const crouch=!!(poseMetadata(d)?.[1]??block?.crouching);
  if(block?.blocked)return crouch?8:6;
  if(d.Y>0)return null; // native airborne byte181 dispatches another family
  if(raw[7]===0)return crouch?10:2*region;
  if(raw[7]===1)return 14;
  if(raw[7]===2)return crouch?10:12;
  if(raw[7]>=3)return raw[11]===0x26?(crouch?10:12):raw[11];
  return null;
 }
 function row(p,status,strength=0){return window.SF2CEREACTIONDATA?.fighters[p.fid]?.[status+':'+strength];}
 const REGISTERED=new WeakMap();
 function preregister(fighter,fid=fighter?.fid){
  if(fighter?.F){fid=fighter.fid;fighter=fighter.F;}
  if(!fighter?.anims||!Number.isInteger(fid))throw Error('CE reaction registration requires fighter and native fid');
  const cached=REGISTERED.get(fighter);if(cached){if(cached.fid!==fid)throw Error('CE reaction fighter identity changed');return cached;}
  const rows=window.SF2CEREACTIONDATA?.fighters[fid];if(!rows)throw Error('CE reaction data not loaded for '+fid);
  const keys=Object.keys(rows).sort((a,b)=>{const x=a.split(':').map(Number),y=b.split(':').map(Number);return x[0]-y[0]||x[1]-y[1];});
  const aliases=keys.map(k=>rows[k]),existing=fighter.anims.filter(a=>a.name?.startsWith('ceReaction'));
  const oldBase=fighter.anims.findIndex(a=>a.name?.startsWith('ceReaction'));
  if(existing.length&&(existing.length!==aliases.length||aliases.some((a,i)=>fighter.anims[oldBase+i]?.name!==a.name||fighter.anims[oldBase+i]?.source!==a.source)))throw Error('CE reaction aliases are not in canonical order; register before play');
  for(const a of aliases)for(const e of a.ents)if(!Number.isInteger(e[0])||e[0]<0||e[0]>=fighter.frames.length)throw Error('CE reaction atlas frame out of bounds: '+fid+'/'+a.name+'/'+e[0]);
  const base=existing.length?oldBase:fighter.anims.length,slots={};
  for(let i=0;i<aliases.length;i++){
   const a=aliases[i];slots[keys[i]]=base+i;
   if(!existing.length)fighter.anims.push({...a,flags:a.flags.slice(),ents:a.ents.map(e=>e.map(v=>Array.isArray(v)?v.slice():v)),postures:a.postures.map(v=>v.slice()),shakeFlip:a.shakeFlip.slice(),clawShakeFlip:a.clawShakeFlip.slice()});
  }
  Object.assign(window.SF2CESHADOWDATA?.selectors||{},window.SF2CEREACTIONDATA.shadows);
  if(fid===11&&window.SF2VEGACLAWDATA)for(const [target,source]of Object.entries(window.SF2CEREACTIONDATA.clawAliases||{})){const pose=SF2VEGACLAWDATA.poses[source];if(!pose)throw Error('CE reaction claw source missing '+source);SF2VEGACLAWDATA.poses[target]=pose;}
  const registered={fid,base,count:aliases.length,slots};REGISTERED.set(fighter,registered);return registered;
 }
 function select(p,status,strength=0,preserveTimer=false){
  const a=row(p,status,strength);if(!a)return false;
  const registration=preregister(p);
  const oldTimer=p.anim?.ents[p.aidx]?.[1]-p.acc;
  const n=registration.slots[status+':'+strength];
  p.cur=n;p.anim=p.F.anims[n];p.aidx=0;p.acc=preserveTimer&&Number.isFinite(oldTimer)?a.ents[0][1]-oldTimer:0;p.adone=0;
  Object.assign(window.SF2CESHADOWDATA?.selectors||{},window.SF2CEREACTIONDATA.shadows);
  return true;
 }
 function poseMetadata(p){return p.anim?.postures?.[p.aidx]??window.SF2CEREACTIONDATA?.postures[p.anim?.source+24*p.aidx];}
 function posture(p){return poseMetadata(p)?.[0]??window.SF2CECOMBAT?.posture(p)??0;}
 // Inputs use the browser's L=1/R=2/D=8. The caller supplies native attack
 // admission, rather than inferring it from animation names or a generic ST.
 function guardAdmission(p,options={}){
  const o=p.opp;if(!o)return false;
  let threat=false,q=options.projectile;
  if(q){const dx=(q.X-p.X)>>8,near=dx<0?!q.FACE:!!q.FACE;threat=Math.abs(dx)<=(near?112:224);}
  if(!threat)threat=!!options.attacking&&Math.abs((o.X-p.X)>>8)<=224;
  if(!threat)return false;
  let back=p.FACE?1:2;
  if(o.fid===8&&options.opponentFlagsLow===0x71){
   const dx=(o.X-p.X)>>8;
   if((o.FACE&&dx>=0)||(!o.FACE&&dx<0)){if(Math.abs(dx)>=104)return false;back=o.FACE?1:2;}
  }
  return !!(p.KEYS&back);
 }
 // Guard state is separate from hit/block stun. Call before ordinary grounded
 // FREE/CR control. True owns this animation tick; h.controls may still admit
 // attacks/jumps after the pose transition, matching 0x38508/0x3851e.
 function guard(p,h,options={}){
  const down=!!(p.KEYS&8),admit=guardAdmission(p,options);let c=p.CEGUARD;
  if(!c){if(!admit)return false;c=p.CEGUARD={phase:down?4:0};select(p,down?0x16:0x12);h.controls?.(p,{crouching:down});return true;}
  h.tick(p);
  if(c.phase===2||c.phase===6){if(p.anim.flags[p.aidx]&0x8000){p.CEGUARD=null;h.release(p,{crouching:c.phase===6,guard:false});return true;}}
  const phase=admit?(down?4:0):(down?6:2);
  if(phase!==c.phase){const selector=p.anim.flags[p.aidx]&255;c.phase=phase;select(p,[0x12,0x14,0x16,0x18][phase/2],selector,true);}
  h.controls?.(p,{crouching:down});return true;
 }
 // Called at collision, before this tick's actor dispatch. `reaction` is the
 // native resolved actor byte55, not raw attack reaction byte7 or a KD flag.
 function begin(p,owner,options={}){
  const reaction=options.reaction,strength=options.strength;
  if(!COMMON.has(reaction)||!PUSH[strength])return false;
  p.CER={age:-1,reaction,strength,owner,dir:options.direction<0?-1:1,projectile:!!options.projectile,suppressRecoil:!!options.suppressRecoil};
  p.CEGUARD=null;p.KB=0;p.STUN=0;p.CESHAKE=0;p.CERSTOP=0;
  if(owner&&!options.projectile&&!owner.CER)owner.CERSTOP=14;
  return true;
 }
 function ownerStep(p){if(!p.CERSTOP)return false;p.CERSTOP--;return true;}
 function step(p,h){
  const c=p.CER;if(!c)return false;const age=++c.age;
  if(age===0)return true;
  if(age===1){
   c.strength=c.reaction===12||c.reaction===22?0:c.reaction===20?2:c.strength;
   p.FACE=c.dir>0?0:1;select(p,STATUS[c.reaction>>1],c.strength);
  }
  p.CESHAKE=shake(age);
  if(age<16)return true;
  const move=push(c.strength,age-16,c.dir,p.CEWALL||0,p.CESIDE||0,c.projectile,c.suppressRecoil);
  if(move.done){
   const meta=p.anim.postures?.[p.aidx]||[posture(p),0];p.CER=null;p.CESHAKE=0;
   h.release(p,{guard:!!meta[0],crouching:!!meta[1],reaction:c.reaction});return true;
  }
  p.X+=move.victim*256;if(c.owner)c.owner.X+=move.attacker*256;
  if(c.reaction===6||c.reaction===8)select(p,c.reaction===6?0x1e:0x20,c.strength);
  h.tick(p);return true;
 }
 function renderOffset(p,claw=false){const s=p.CESHAKE||0,flip=(claw?p.anim.clawShakeFlip:p.anim.shakeFlip)?.[p.aidx];return s&&flip!=null?((flip^(p.FACE||0))?-s:s):0;}
 window.SF2CEREACTION={resolveBlock,reactionCode,push,shake,row,preregister,select,poseMetadata,posture,guardAdmission,guard,begin,ownerStep,step,renderOffset,data:{push:PUSH,shake:SHAKE,block:BLOCK,common:[...COMMON],firstPushElapsed:16,releaseElapsed:PUSH.map(a=>16+a.length),victimInitElapsed:1,victimStopTicks:14,ownerResumeElapsed:14},
  source:{reaction:0x38670,pushDispatch:0x38928,pushStep:0x38780,corner:0x3879e,block:0x95600},
  limits:'Host integration pending: grounded normal reaction admission only; caller resolves native reaction byte55 and supplies attack/projectile threat. Airborne fall/shock/throws and accepted special-local stops remain separate.'};
})();
