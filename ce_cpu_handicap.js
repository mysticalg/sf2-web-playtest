/* Pure original CE adaptive handicap events,0x452e..0x493e.
   Event IDs are native entry addresses; this module owns no game loop or actors. */
'use strict';
(()=>{
 const D=window.SF2CECOMBATDATA,A=D.adaptive,word=n=>n&65535;
 const EVENT=Object.freeze({FORCE_MAX:0x452e,PERIODIC_REFRESH:0x4542,REFRESH:0x456c,TICK:0x45ce,
  ROUND_PRESS_RATE:0x4626,CONTINUE_PENALTY:0x4696,HALF_CONTINUE:0x46ca,ROUND_TIME:0x46d8,
  ROUND_HEALTH:0x4732,EVENT47EA:0x47ea,SPECIAL_START:0x47f2,ROUND_CRITICALS:0x480c,
  CONTINUE_RANDOM:0x4844,POST_ROUND_ADD8:0x48b2,ROUND_ACCURACY:0x48c2,BLOCK:0x4928});
 function refresh(s){
  if(s.attract)return s;
  if(s.forceMax){s.lower=105;s.upper=255;s.level=31;return s;}
  const bounds=D.cpuBounds[s.difficulty][s.progressIndex&15];s.lower=bounds[0];s.upper=bounds[1];
  let c=word(s.counter);if(c>=256)c=255;s.counter=Math.min(s.upper,Math.max(s.lower,c));s.level=D.cpuCurve[s.counter];return s;
 }
 function create(options={}){
  const s=Object.assign({difficulty:3,progressIndex:0,counter:0,level:16,lower:0,upper:255,humanMask:1,
   bonusStage:false,attract:false,forceMax:false,humanSide:0,tickCounter:0,buttonPresses:0,
   bodyAttacks:0,cpuBodyContacts:0,criticalContacts:0,continueCount:0,halfContinueCount:0,
   drawCount:0,periodicCounter:0,defeated:Array(12).fill(false),bisonDefeated:false,lastDeltas:{}},options);
  if(!Number.isInteger(s.difficulty)||s.difficulty<0||s.difficulty>7)throw new RangeError('Original CE difficulty0..7 required');
  s.lastDeltas={...s.lastDeltas};s.defeated=[...s.defeated];return refresh(s);
 }
 const allowed=s=>s.humanMask!==3&&!s.bonusStage;
 function add(s,delta){s.counter=word(s.counter+delta);return refresh(s);}
 function note(s,{bodyAttacks=0,cpuBodyContacts=0,criticalContacts=0}={}){
  s.bodyAttacks=word(s.bodyAttacks+bodyAttacks);s.cpuBodyContacts=word(s.cpuBodyContacts+cpuBodyContacts);s.criticalContacts=word(s.criticalContacts+criticalContacts);return s;
 }
 function apply(s,event,context={},random){
  switch(event){
   case EVENT.FORCE_MAX:s.lower=105;s.upper=255;s.level=31;break;
   case EVENT.PERIODIC_REFRESH:
    s.periodicCounter=(s.periodicCounter+1)&15;
    if(!s.periodicCounter){if(typeof random!=='function')throw new Error('Native periodic event requires RNG');if(!((0x802000>>>(random()&31))&1)){s.lower=0;s.counter=0;}}
    refresh(s);break;
   case EVENT.REFRESH:refresh(s);break;
   case EVENT.TICK:
    if(!allowed(s))break;s.tickCounter=word(s.tickCounter+1);
    if(s.tickCounter>=240){s.tickCounter=0;add(s,3);}
    if((context.pressedNative||0)&0x770)s.buttonPresses=Math.min(65535,s.buttonPresses+1);break;
   case EVENT.ROUND_PRESS_RATE:
    if(!allowed(s))break;{const d=s.buttonPresses<61?A.pressRate[s.buttonPresses]:4;s.lastDeltas.pressRate=d;add(s,d);}break;
   case EVENT.CONTINUE_PENALTY:
    {const d=s.continueCount<16?A.continuePenalty[s.continueCount]:84;let c=word(s.counter-d);if(c&32768)c=0;s.counter=c;refresh(s);s.continueCount=word(s.continueCount+1);}break;
   case EVENT.HALF_CONTINUE:
    s.halfContinueCount=(s.halfContinueCount+1)&255;if(!(s.halfContinueCount&1))apply(s,EVENT.CONTINUE_PENALTY,context,random);break;
   case EVENT.ROUND_TIME:
    if(!allowed(s))break;{const table=context.humanLost?A.timeLose:A.timeWin,n=context.timeBCD??0,d=table[n];if(d==null||d<0)throw new RangeError('Native invalid BCD-time trap');const delta=context.humanLost?-d:d;s.lastDeltas.time=delta;add(s,delta);}break;
   case EVENT.ROUND_HEALTH:
    if(!allowed(s))break;
    if(context.draw){const delta=s.drawCount<9?A.drawBonus[s.drawCount]:48;if(s.drawCount<9)s.drawCount++;add(s,delta);break;}
    {const hp=context.winnerHP??144,plus=hp>=113?4:hp>=81?3:hp>=17?1:3,minus=hp>=113?12:hp>=81?9:hp>=17?3:6;
     const delta=(context.winnerSide??0)===s.humanSide?plus:-minus;s.lastDeltas.health=delta;add(s,delta);}break;
   case EVENT.EVENT47EA:add(s,2);break;
   case EVENT.SPECIAL_START:if(allowed(s))add(s,1);break;
   case EVENT.ROUND_CRITICALS:
    if(!allowed(s))break;{const d=s.criticalContacts<9?A.criticalBonus[s.criticalContacts]:32;s.lastDeltas.criticals=d;add(s,d);}break;
   case EVENT.CONTINUE_RANDOM:
    if(!allowed(s))break;if(typeof random!=='function')throw new Error('Native continue event requires RNG');
    {const delta=-A.continueRandom[(random()&62)>>>1];s.lastDeltas.continue=delta;add(s,delta);}break;
   case EVENT.POST_ROUND_ADD8:if(s.humanMask!==3)s.counter=word(s.counter+8);break;
   case EVENT.ROUND_ACCURACY:
    if(!allowed(s))break;
    {let numerator=word(s.cpuBodyContacts*100),ratio=0,guard=0;
     if(numerator&&s.bodyAttacks)while(guard++<65536){numerator=word(numerator-s.bodyAttacks);if(numerator&32768)break;ratio=(ratio+1)&255;}
     const d=ratio<=60?0:ratio<=80?1:ratio<=90?2:3;s.lastDeltas.accuracy=d;add(s,d);}break;
   case EVENT.BLOCK:if(allowed(s))add(s,1);break;
   default:throw new RangeError('Unknown native adaptive event');
  }
  return s;
 }
 function roundEnd(s,context={}){
  for(const event of [EVENT.ROUND_PRESS_RATE,EVENT.ROUND_CRITICALS,EVENT.ROUND_ACCURACY,EVENT.ROUND_TIME,EVENT.ROUND_HEALTH])apply(s,event,context);return s;
 }
 // Original clear ranges: new game 2ad6 clears9be..b3d; match2b30 clearsa3e..abd;
 // round2c3e clearsabe..b3d. Counter9fe therefore survives rounds and matches.
 function startGame(s,context={},random){
  for(const k of ['progressIndex','counter','level','lower','upper','humanSide','tickCounter','buttonPresses','bodyAttacks','cpuBodyContacts','criticalContacts','continueCount','halfContinueCount','drawCount'])s[k]=0;
  s.bonusStage=false;s.forceMax=false;s.bisonDefeated=false;s.defeated=Array(12).fill(false);
  Object.assign(s,context);
  // 4528 branches around the periodic event in attract mode.
  return s.attract?apply(s,EVENT.FORCE_MAX):apply(s,EVENT.PERIODIC_REFRESH,{},random);
 }
 function startMatch(s,context={}){s.drawCount=0;Object.assign(s,context);return s;}
 function startRound(s,context={}){
  s.buttonPresses=s.bodyAttacks=s.cpuBodyContacts=s.criticalContacts=0;
  Object.assign(s,context);return refresh(s);
 }
 function recordDefeat(s,{fighterId,otherHuman=false,otherContinuing=false}={}){
  if(!Number.isInteger(fighterId)||fighterId<0||fighterId>=12)throw new RangeError('Native defeated fighter0..11 required');
  if(s.humanMask===3){
   if(s.defeated[fighterId]||(fighterId===8&&s.bisonDefeated))return false;
   if(fighterId===8)s.bisonDefeated=true;
  }else if(!otherHuman&&!otherContinuing)return false;
  s.progressIndex=(s.progressIndex+1)&15;
  // 91f8 leaves Bison's ordinary defeated bitmap unset in a two-human match.
  if(s.humanMask!==3||fighterId!==8)s.defeated[fighterId]=true;
  return true;
 }
 function nativeRandom(seed){const high=((word(seed)*3)&65535)>>>8,low=((seed&255)+high)&255;return {seed:(high<<8)|low,value:low};}
 window.SF2CECPUHANDICAP={EVENT,create,refresh,note,apply,roundEnd,startGame,startMatch,startRound,recordDefeat,nativeRandom,actorLevel:s=>s.level,
  source:{tick:0x7ada,roundEnd:0x7b56,cpuActorCopy:0x37c44,cpuActorCall:0x37a1a,curve:0x4a82,bounds:0xc6002}};
})();
