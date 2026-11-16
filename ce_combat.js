/* Original CE scalar combat,0x9540a..0x955a4. Reaction/motion is a separate FSM. */
'use strict';
(()=>{
 const D=window.SF2CECOMBATDATA;if(!D)throw new Error('Original CE combat data missing');
 const nativeAddress=p=>Number.isInteger(p.anim?.source)?p.anim.source+24*p.aidx:null;
 const level=(value,fallback=16)=>Math.max(0,Math.min(31,Number.isInteger(value)?value:fallback));
 function record(p){
  const f=D.fighters[p.fid];if(!f)return null;const idx=f.frames[nativeAddress(p)];if(!idx)return null;
  return p.fid===11&&window.SF2CEVEGACLAW?.unequipped(p)?D.vegaUnarmed[idx]:f.records[idx];
 }
 const projectileAddress=p=>Number.isInteger(p.FBAN?.source)?p.FBAN.source+24*p.FBI:null;
 function projectileRecord(p){return D.projectileRecords[projectileAddress(p)]||null;}
 function criticalBox(p){return D.fighters[p.fid]?.criticalBoxes[nativeAddress(p)]||null;}
 function criticalOverlap(box,d){const q=criticalBox(d);if(!box||!q)return false;const x=(d.X>>8)+(d.FACE?-q[0]:q[0]),y=(d.Y>>8)+q[1];return Math.abs(box[0]-x)<=box[2]+q[2]&&Math.abs(box[1]-y)<=box[3]+q[3];}
 function posture(p){return p.CE_DEFENSE_POSTURE??D.fighters[p.fid]?.postures[nativeAddress(p)]??0;}
 function profile(p,d,region=0,{projectile=false,rawRecord=projectile?projectileRecord(p):record(p),attackLevel,defenseLevel,weakness,attackWorldBox}={}){
  if(!rawRecord)return null;const f=D.fighters[d.fid];if(!f)return null;
  return {record:rawRecord,source:projectile?projectileAddress(p):nativeAddress(p),projectile,attackerHP:projectile?256:p.HP,criticalOverlap:criticalOverlap(attackWorldBox,d),defenderHP:d.HP,defenderFid:d.fid,region,defenderPosture:posture(d),
   attackLevel:level(attackLevel??(projectile?p.CE_PROJECTILE_HANDICAP:p.CE_ATTACK_LEVEL??p.CE_HANDICAP),projectile?0:16),defenseLevel:level(defenseLevel??d.CE_DEFENSE_LEVEL??d.CE_HANDICAP),
   weakness:weakness??d.CE_WEAKNESS?.[region]??f.weakness[region]??0};
 }
 function calculate(p,random,{blocked=false,chipEligible}={}){
  if(!p)return null;const a=p.record,code=a[4]&63;
  const chip=blocked&&(chipEligible??a[7]===3),applied=!blocked||chip;
  const meta={record:a,source:p.source,strength:a[8],reaction:a[7],hitGroup:a[5],sound:a[6],damageCode:code,
   attackLevel:p.attackLevel,defenseLevel:p.defenseLevel,weakness:p.weakness,criticalOverlap:p.criticalOverlap,randomIndex:null,randomConsumed:false};
  let damage,score,koScore;
  if(code<32){if(!D.damage[code])return null;damage=D.damage[code][p.attackLevel];score=D.score[code];koScore=a[4]&128?D.koScore[code]:score;}
  else{const q=D.dynamicDamage[code-32];if(!q)return null;damage=p.attackerHP<=q[1]?q[2]:p.attackerHP>=q[3]?q[4]:p.defenderHP-(p.defenderHP>>q[0]);score=D.dynamicScore[code-32];koScore=a[4]&128?D.dynamicKOScore[code-32]:score;}
  Object.assign(meta,{scoreCommand:score,koScoreCommand:koScore});
  //0x9500c/0x955c6: ordinary blocks skip variation RNG and HP calculation.
  if(!applied)return {...meta,damage:0,chip:0,appliedDamage:0};
  if(p.weakness===2)damage+=damage>>1;else if(p.weakness===4)damage*=2;else if(p.weakness===6)damage*=3;else if(p.weakness===8)damage+=damage>>2;
  const row=a[p.attackerHP>=60?9:10],index=random()&31;meta.randomIndex=index;meta.randomConsumed=true;
  damage=Math.max(1,damage+D.variation[row][index]);
  damage=Math.max(1,damage-((damage*D.fighters[p.defenderFid].defense[p.defenseLevel])>>>5));
  if(p.defenderHP<31&&p.defenderHP>=0)damage=Math.max(1,damage-((damage*D.lowHP[p.defenderHP])>>>5));
  const chipDamage=chip?Math.max(1,damage>>>2):0;
  return {...meta,damage,chip:chipDamage,appliedDamage:blocked?chipDamage:damage};
 }
 function resolve(p,d,region,random,options={}){return calculate(profile(p,d,region,options),random,options);}
 // Original throw0x3626..0x3728 has no normal-hit variation/defense RNG.
 function throwDamage(p,d,code=13){let damage=D.damage[code]?.[level(p.CE_ATTACK_LEVEL??p.CE_HANDICAP)];if(!Number.isInteger(damage))return null;if(d.HP>=0&&d.HP<31)damage=Math.max(1,damage-((damage*D.lowHP[d.HP])>>>5));return {damage,scoreCommand:D.score[code]};}
 function matchLevels(p1,p2,{wins=[0,0],random}={}){
  const offset=(p1<<4)+(p2<<1),values=D.twoPlayerHandicap.slice(offset,offset+2);
  if(wins[0]!==wins[1]){if(typeof random!=='function')throw new Error('Native unequal-win handicap needs RNG');const i=wins[0]?1:0;values[i]=Math.min(31,values[i]+D.handicapDelta[random()&31]);}
  return values;
 }
 function cpuLevel(difficulty,progressIndex,adaptiveCounter){
  if(!Number.isInteger(difficulty)||difficulty<0||difficulty>7)throw new RangeError('Native DIP difficulty0..7 required');
  const bounds=D.cpuBounds[difficulty][progressIndex&15],counter=Math.min(bounds[1],Math.max(bounds[0],Math.min(255,(adaptiveCounter|0)&65535)));
  return {counter,level:D.cpuCurve[counter],bounds};
 }
 // 0x2ce4: P1-human uses CPUfid*8; P2-human retains zero D0 from inactive P1 flags.
 // Preserve that asymmetry and overlapping rows, distinct from two-human stride16.
 function humanLevel(humanFid,cpuFid,{humanSide=0}={}){return D.humanHandicap[(humanSide===0?cpuFid<<3:0)+humanFid];}
 // 0x548c/0x549a command0x20, offset table0x541e, original four-byte BCD amounts.
 const scoreAmount=command=>D.scoreAmounts[String(command)]??null;
 window.SF2CECOMBAT={record,projectileRecord,criticalBox,criticalOverlap,posture,profile,calculate,resolve,throwDamage,matchLevels,humanLevel,cpuLevel,scoreAmount,data:D};
})();
