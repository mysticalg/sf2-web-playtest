/* Authored AI Edition victory text. These are new lines, not native Capcom quotes.
   Pure identity/selection/wrapping API; see AI-VICTORY-QUOTES.md. */
'use strict';
window.SF2AIVictoryQuotes=(()=>{
 const CE=['ryu','honda','blanka','guile','ken','chun-li','zangief','dhalsim','bison','sagat','balrog','vega'];
 const FUTURE=['cammy','thawk','feilong','deejay','akuma'];
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const voices={
  ryu:{name:'Ryu',move:'Hadoken',normal:[
   'Your {move} showed me where I must improve.',
   '{name}, strength means nothing without control.',
   'A true fighter learns from every battle.'
  ],death:[
   'I won, but this was not the answer.',
   'Your {move} is silent. I must carry the cost.',
   '{name}, I will remember this battle.'
  ]},
  honda:{name:'E. Honda',move:'Hundred Hand Slap',normal:[
   'Your {move} cannot move a mountain!',
   '{name}, a sumo champion never gives ground!',
   'A strong stance beats a flashy entrance!'
  ],death:[
   'A victory should never cost this much.',
   '{name}, the ring has fallen silent.',
   'Your {move} is over. I bow to the fallen.'
  ]},
  blanka:{name:'Blanka',move:'Electric Thunder',normal:[
   'Your {move} has no bite!',
   '{name}, you cannot outrun the jungle!',
   'Next time, mind the sparks!'
  ],death:[
   'The jungle is quiet again.',
   'No more sparks. No more fight, {name}.',
   'Your {move} will not hurt my family.'
  ]},
  guile:{name:'Guile',move:'Sonic Boom',normal:[
   'Your {move} needs more discipline.',
   '{name}, you broke formation. I broke your guard.',
   'Mission complete. Back to training.'
  ],death:[
   'Another casualty. This settles nothing.',
   '{name}, this will not bring my friend back.',
   'Your {move} is down. The mission is over.'
  ]},
  ken:{name:'Ken',move:'Dragon Punch',normal:[
   'Your {move} needs more fire behind it!',
   '{name}, come back when you can keep up!',
   "That's how you finish a fight in style!"
  ],death:[
   'The flames have gone out. This went too far.',
   "{name}, I didn't want it to end like this.",
   'No comeback this time. I wish there was.'
  ]},
  'chun-li':{name:'Chun-Li',move:'Spinning Bird Kick',normal:[
   'Your {move} is too slow to catch me!',
   '{name}, skill wins where brute force fails.',
   'Every victory brings me closer to justice.'
  ],death:[
   'Justice should not have ended this way.',
   '{name}, the fight is over. Rest now.',
   'Your {move} could not stop me. I wish you had stopped fighting.'
  ]},
  zangief:{name:'Zangief',move:'Spinning Piledriver',normal:[
   'Your {move} cannot break this iron body!',
   '{name}, the ring belongs to the Red Cyclone!',
   'Power needs no hiding place!'
  ],death:[
   'The Red Cyclone leaves a terrible silence.',
   '{name}, even iron must bear the weight of this.',
   'Your {move} is finished. No champion celebrates this end.'
  ]},
  dhalsim:{name:'Dhalsim',move:'Yoga Flame',normal:[
   'Your {move} cannot reach a calm spirit.',
   '{name}, let this defeat loosen the grip of pride.',
   'Strength without wisdom becomes a burden.'
  ],death:[
   'May your spirit find the peace this fight could not.',
   '{name}, I shall carry this sorrow in prayer.',
   'Your {move} has ceased. The suffering must end here.'
  ]},
  bison:{name:'M. Bison',move:'Psycho Crusher',normal:[
   'Your {move} is a trick. My power is absolute.',
   '{name}, kneel before the ruler of Shadaloo!',
   'A world of warriors, and none worthy of me.'
  ],death:[
   'Your life was a small price for defiance.',
   '{name}, even your final breath belongs to me.',
   'Your {move} dies with you. Shadaloo endures.'
  ]},
  sagat:{name:'Sagat',move:'Tiger Uppercut',normal:[
   'Your {move} cannot dethrone the king.',
   '{name}, a tiger waits for one perfect opening.',
   'My scars taught me more than your defeat will teach you.'
  ],death:[
   'The tiger stands alone. There is no pride in this.',
   '{name}, vengeance has taken enough.',
   'Your {move} is ended. This scar will stay with me.'
  ]},
  balrog:{name:'Balrog',move:'Dash Straight',normal:[
   'Your {move} just lost you the purse!',
   "{name}, that's what a heavyweight payday looks like!",
   'Count the money. Then count the teeth!'
  ],death:[
   'No rematch. Pay me what you owe.',
   '{name}, you gambled more than you could afford.',
   'Your {move} came up short. The house wins.'
  ]},
  vega:{name:'Vega',move:'Flying Barcelona',normal:[
   'Your {move} has no grace at all.',
   '{name}, victory belongs to beauty and precision.',
   'Not even a scratch. How disappointing.'
  ],death:[
   'An ugly end to an elegant performance.',
   '{name}, the final cut was my masterpiece.',
   'Your {move} fades. My perfection remains.'
  ]},
  damnd:{name:'Damnd',move:'Barrel Call',normal:[
   'Your {move} just rolled into my neighborhood!',
   '{name}, hear that whistle? This street is mine!',
   'Ha! Next time, bring a whole gang!'
  ],death:[
   'One last whistle. Nobody is coming for you.',
   '{name}, you picked the wrong street to die on.',
   'Your {move} is done. The gang heard you fall.'
  ]},
  sodom:{name:'Sodom',move:'Twin Blade Chops',normal:[
   'Your {move} has met its match in my twin blades.',
   '{name}, stand ready before you challenge a warrior.',
   'Two swords. One opening. That was enough.'
  ],death:[
   'My blades are still. Your battle is ended.',
   '{name}, there will be no second duel.',
   'Your {move} could not turn the final blade.'
  ]},
  andore:{name:'Andore',move:'Piledriver',normal:[
   'Your {move} only brought you closer to my grip!',
   '{name}, the cage is too small to hide in!',
   'Once I lift you, the fight is mine!'
  ],death:[
   'The floor shook. Now nothing moves.',
   '{name}, you should have stayed outside my reach.',
   'Your {move} could not break the last hold.'
  ]},
  edi:{name:'Edi. E',move:'Police Pistol',normal:[
   'Your {move} is no excuse for resisting arrest.',
   '{name}, this badge says I win.',
   'The fine just doubled. Cash only.'
  ],death:[
   'The report will say you resisted.',
   '{name}, this case is closed. Permanently.',
   'Your {move} will not be entering evidence.'
  ]},
  rolento:{name:'Rolento',move:'Grenade Barrage',normal:[
   'Your {move} failed the combat evaluation.',
   '{name}, speed without tactics is a wasted asset.',
   'Objective secured. You were the weak point.'
  ],death:[
   'Target eliminated. Advance to the next objective.',
   '{name}, the operation will not pause for the fallen.',
   'Your {move} is neutralized. Record the result.'
  ]},
  abigail:{name:'Abigail',move:'Rage Charge',normal:[
   'Your {move} barely left a dent!',
   '{name}, nobody stops me when I get moving!',
   'That was a fight? I call it a warm-up!'
  ],death:[
   'You should have cleared the road.',
   '{name}, nothing stands after that much force.',
   'Your {move} could not stop the impact.'
  ]},
  belger:{name:'Belger',move:'Crossbow Volley',normal:[
   'Your {move} cannot buy you a victory.',
   '{name}, everyone has a price. Yours was surprisingly low.',
   'I do not need to stand to look down on you.'
  ],death:[
   'One less obstacle. That is good business.',
   '{name}, your last mistake was refusing my terms.',
   'Your {move} is gone. My accounts are settled.'
  ]},
  guy:{name:'Guy',move:'Spinning Kick',normal:[
   'Your {move} is loud. Your opening was quiet.',
   '{name}, Bushinryu needs no wasted movement.',
   'The city sleeps safely when I stand guard.'
  ],death:[
   'This path should not have ended in death.',
   '{name}, may the city know peace after this.',
   'Your {move} is still. I will not forget the cost.'
  ]},
  cody:{name:'Cody',move:'Final Uppercut',normal:[
   'Your {move} needs work. I can wait.',
   "{name}, I've had tougher walks across Metro City.",
   'Same streets. Same fists. Same result.'
  ],death:[
   'This city has seen enough endings like this.',
   "{name}, I didn't come here to bury anyone.",
   'Your {move} is over. This victory tastes bitter.'
  ]},
  haggar:{name:'Haggar',move:'Double Lariat',normal:[
   'Your {move} cannot push this city around!',
   '{name}, the mayor handles trouble personally!',
   'Strong arms. Stronger duty. Metro City comes first.'
  ],death:[
   'I wanted my city safe. Not another grave.',
   '{name}, no mayor should have to count victories like this.',
   'Your {move} is finished. I must answer for the cost.'
  ]},
  'evil-ryu':{name:'Possessed Ryu',base:'ryu',move:'Rift Step',normal:[
   'Your {move} cannot touch the killing intent.',
   '{name}, hesitation is the weakness I have discarded.',
   'The darkness gives me what restraint never could.'
  ],death:[
   'You are not worthy of your life.',
   '{name}, this is the answer the darkness promised.',
   'Your {move} ends here. My hunger does not.'
  ]},
  'evil-ken':{name:'Possessed Ken',base:'ken',move:'Cinder Break',normal:[
   'Your {move} cannot keep pace with these flames.',
   '{name}, you mistook my fury for a loss of control.',
   'No restraint. No mercy. No one left standing.'
  ],death:[
   'The last ember is yours. The fire is mine.',
   '{name}, the flames will remember what I will not.',
   'Your {move} burns out. I burn brighter.'
  ]},
  cammy:{name:'Cammy',move:'Spiral Arrow',normal:[
   'Your {move} left your flank exposed.',
   '{name}, precision beats the attack you never finish.',
   'Target assessed. Weakness confirmed.'
  ],death:[
   'I am free to choose. I must live with this choice.',
   '{name}, there should have been another way.',
   'Your {move} is down. No order made this right.'
  ]},
  thawk:{name:'T. Hawk',move:'Mexican Typhoon',normal:[
   'Your {move} cannot shake my roots.',
   '{name}, I fight with the strength of my people.',
   'The wind is patient. So am I.'
  ],death:[
   'The land has heard enough cries of battle.',
   '{name}, may your spirit travel in peace.',
   'Your {move} is silent. I will not let hatred lead me.'
  ]},
  feilong:{name:'Fei Long',move:'Rekkaken',normal:[
   'Your {move} needs less posing and more practice!',
   '{name}, real speed never waits for a second take!',
   'One clean strike tells the whole story.'
  ],death:[
   'There is no second take for a life.',
   '{name}, this was never the ending I wanted.',
   'Your {move} is over. The silence is real.'
  ]},
  deejay:{name:'Dee Jay',move:'Machinegun Upper',normal:[
   'Your {move} missed the beat!',
   '{name}, you need rhythm before you can follow my lead!',
   'Keep smiling. The next round is another song!'
  ],death:[
   'The rhythm stopped. There is no joy in that.',
   '{name}, I wanted a dance, not this silence.',
   'Your {move} fades. This song has no encore.'
  ]},
  akuma:{name:'Akuma',move:'Zanku Hadoken',normal:[
   'Your {move} cannot pierce the killing intent.',
   '{name}, cast aside weakness or leave my path.',
   'A warrior is measured when all restraint is gone.'
  ],death:[
   'Your strength was not enough to survive.',
   '{name}, seek your next battle beyond this life.',
   'Your {move} is dust. The fist remains.'
  ]}
 };
 // Curated relationships take priority. Templates elsewhere retain each winner's
 // own voice and refer to the loser's actual signature, never a random move.
 const matchups={
  'ken|chun-li':{normal:[
   'Your spinning bird kick is no match for my dragon punch!',
   'Fast kicks, Chun-Li. My footwork found the opening!',
   'Lightning Legs? You still have to catch me first!'
  ],death:[
   'Chun-Li, this was supposed to be a match.',
   'My dragon punch won. The victory means nothing now.',
   'No more Lightning Legs. I wish I could take that back.'
  ]},
  'chun-li|ken':{normal:[
   'Your dragon punch is fast. My feet are faster!',
   'Ken, a little less fire and a little more focus!',
   'That flashy uppercut left your guard wide open!'
  ],death:[
   'Ken, your family should never have to hear this.',
   'The flames are gone. There is no victory in that.',
   'Your dragon punch ends here. I wish we had stopped sooner.'
  ]},
  'ryu|ken':{normal:[
   '{name}, our next battle will make us both stronger.',
   'Your dragon punch pushes me to keep training.',
   'Old friend, there is still more for us to learn.'
  ],death:[
   '{name}, this is a victory I can never accept.',
   'I have lost the rival who kept me on my path.',
   'Our next battle was supposed to be tomorrow.'
  ]},
  'ken|ryu':{normal:[
   '{name}, you cannot train your way past every surprise!',
   'Your Hadoken is sharp. My timing was sharper!',
   "We're still rivals, {name}. Don't make me wait for the rematch!"
  ],death:[
   '{name}, get up. We always get another round.',
   'I wanted to beat my oldest rival. Not lose him.',
   'There is no rematch that can fix this.'
  ]},
  'ryu|evil-ken':{normal:[
   'Ken, that fire is consuming more than your opponent.',
   'Your strength is still yours. So is the choice to stop.',
   'Old friend, fury cannot replace your true spirit.'
  ],death:[
   'Ken, I could not bring you back from the flames.',
   'The fire has ended. I have lost my friend with it.',
   'This was never the answer, Ken.'
  ]},
  'ken|evil-ryu':{normal:[
   'Ryu, that darkness still cannot read my footwork!',
   'The killing intent lost. My friend is still in there.',
   'You need a rematch with yourself before you face me again.'
  ],death:[
   'Ryu, I thought I could bring you back.',
   'I beat the darkness and lost my oldest friend.',
   'This is not how our rivalry was meant to end.'
  ]},
  'chun-li|bison':{normal:[
   'Bison, your empire cannot outrun justice!',
   'That is for my father. Your power cannot silence the truth.',
   'Shadaloo ends when people stop fearing you.'
  ],death:[
   'That is for my father. Your reign is over.',
   'No more victims for Shadaloo, Bison.',
   'My father can rest. I still have to live with this.'
  ]},
  'guile|bison':{normal:[
   'Bison, this mission is personal.',
   'Psycho Power will not erase what you did to Charlie.',
   'Your empire just lost its commanding officer.'
  ],death:[
   'Charlie, the mission is over.',
   'Bison, your victims deserved more than revenge.',
   'You are gone. The people you took are still gone, too.'
  ]},
  'sagat|ryu':{normal:[
   '{name}, I have learned to fight beyond my scar.',
   'Your dragon punch taught me. My tiger answered.',
   'This victory belongs to the fighter I became.'
  ],death:[
   '{name}, vengeance has cost me my greatest rival.',
   'The scar remains. The chance to settle it honorably is gone.',
   'A tiger should have known when to stop hunting.'
  ]},
  'haggar|cody':{normal:[
   'Cody, save some of that punch for the real trouble!',
   'You hit hard, kid. Experience still counts!',
   'A friendly match beats another night chasing Mad Gear.'
  ],death:[
   'Cody, Jessica will never forgive this. Neither will I.',
   'We saved this city together. What have I done?',
   'I was supposed to bring you home, Cody.'
  ]},
  'cody|haggar':{normal:[
   'Sorry, Mr. Mayor. City hall needs a younger sparring partner!',
   'That lariat is still scary. Good thing I know the timing.',
   "Haggar, let's leave the next fight to the gangs."
  ],death:[
   'Haggar, the city needed you. So did we.',
   'Jessica, I can never make this right.',
   'We fought to save Metro City. This was not the plan.'
  ]},
  'haggar|belger':{normal:[
   'Belger, you cannot buy your way out of this!',
   'Metro City is not for sale. Neither is my family.',
   'You picked the wrong mayor to threaten.'
  ],death:[
   'Your grip on this city ends here, Belger.',
   'Jessica is safe. Metro City can finally breathe.',
   'No more families for you to threaten.'
  ]},
  'cody|belger':{normal:[
   'Belger, keep your money. I came for Jessica.',
   'All those goons, and you still had to face me yourself.',
   'Your crossbow could not buy you another escape.'
  ],death:[
   'Jessica is coming home. You are not stopping us.',
   'No more Mad Gear. No more hostages, Belger.',
   'That is the last time you use someone I love.'
  ]},
  'belger|haggar':{normal:[
   'A mayor should know when to negotiate, Haggar.',
   'You cannot wrestle a city out of my pocket.',
   'Your office has power. Mine has better leverage.'
  ],death:[
   'A vacancy at city hall. How convenient.',
   'Haggar, Metro City just lost its most expensive obstacle.',
   'Your family will remember the cost of refusing me.'
  ]},
  'guy|sodom':{normal:[
   'Sodom, two blades cannot hide an opening in your stance.',
   'A warrior is more than the weapons he carries.',
   'Your twin blades were loud. Bushinryu was faster.'
  ],death:[
   'Sodom, lay your blades to rest.',
   'This duel should have ended before the final strike.',
   'Steel could not save you. I take no pride in that.'
  ]},
  'sodom|guy':{normal:[
   'Guy, even Bushinryu can meet an unbroken blade.',
   'Your speed brought you within reach of both swords.',
   'A silent step still leaves an opening.'
  ],death:[
   'Bushinryu falls silent here, Guy.',
   'Your last step crossed my final cut.',
   'A warrior has fallen. The blades will remember.'
  ]},
  'haggar|andore':{normal:[
   'Andore, size is no substitute for a proper piledriver!',
   'You know the hold. I know how to break it.',
   'The cage never made you king of the ring.'
  ],death:[
   'The cage is quiet, Andore. It should not have come to this.',
   'We both knew the danger of that hold.',
   'Strength without restraint has cost too much today.'
  ]},
  'andore|haggar':{normal:[
   'Mayor, that lariat cannot break this grip!',
   'Haggar, the bigger wrestler wins this round!',
   'You brought a piledriver. I brought the whole cage!'
  ],death:[
   'City hall cannot pull you out of this hold, Haggar.',
   'The ring has room for only one giant.',
   'Your piledriver will not shake this cage again.'
  ]},
  'guy|cody':{normal:[
   'Cody, impatience shows before your fist moves.',
   'Your uppercut is strong. Your balance still needs work.',
   'Our training is safer than the streets we protect.'
  ],death:[
   'Cody, I failed the friend I meant to protect.',
   'The city will remember your courage. I will remember this.',
   'There should have been another walk home together.'
  ]},
  'cammy|bison':{normal:[
   'Bison, I choose my own orders now.',
   'I am a person. Your Psycho Power will never change that.',
   'You made a weapon. I chose who it would protect.'
  ],death:[
   'You no longer command my life, Bison.',
   'Shadaloo made me a weapon. This ending was my choice.',
   'Your control is broken. I will decide what comes next.'
  ]},
  'thawk|bison':{normal:[
   'Bison, my people cannot be driven from their roots.',
   'Your empire has no claim on our land.',
   'The storm you made has finally found you.'
  ],death:[
   'The land you stole will outlast you, Bison.',
   'My people can return. Their fallen cannot.',
   'Your reign ends. Our roots remain.'
  ]},
  'evil-ken|chun-li':{normal:[
   'Your spinning bird kick cannot rise above my flames.',
   'Chun-Li, even lightning leaves a shadow in this fire.',
   'My dragon punch burns through every step you take.'
  ],death:[
   'The last spark of your lightning belongs to the flames.',
   'Chun-Li, justice cannot climb out of these ashes.',
   'Your spinning bird kick has made its final turn.'
  ]},
  'evil-ryu|ken':{normal:[
   '{name}, our rivalry was the last chain holding me back.',
   'Your dragon punch still fears the power I accepted.',
   'I have outgrown the fighter you remember.'
  ],death:[
   'Our rivalry ends. The killing intent does not.',
   '{name}, friendship was the weakness I struck down.',
   'No rematch. No restraint. Only the fist remains.'
  ]},
  'ryu|akuma':{normal:[
   'Power is not the only truth, Akuma.',
   'I can surpass you without surrendering myself.',
   'The killing intent has limits. My path continues.'
  ],death:[
   'Akuma, this cannot be the answer you wanted me to find.',
   'I defeated your power. I must not become its prisoner.',
   'The battle is over. My struggle with the darkness remains.'
  ]}
 };
 const fallback={name:'Challenger',move:'technique',normal:[
  'A new challenger always brings a new lesson.',
  'This round is mine. Return stronger.',
  'The next battle begins with better training.'
 ],death:[
  'The fight is over. There is no joy in this end.',
  'This victory carries a cost that will remain.',
  'May the fallen find the peace the battle could not.'
 ]};
 const aliases={ehonda:'honda','e-honda':'honda',chunli:'chun-li',mbison:'bison','m-bison':'bison',dictator:'bison',boxer:'balrog',claw:'vega',edie:'edi','edi-e':'edi',thrasher:'damnd',evilryu:'evil-ryu',evilken:'evil-ken','t-hawk':'thawk','fei-long':'feilong','dee-jay':'deejay',gouki:'akuma'};
 function normalize(value){
  if(value&&typeof value==='object'){
   for(const key of['AIIdentity','aiProfile','fighterKey','key','id','profileName','name'])if(value[key]!==undefined&&value[key]!==null&&value[key]!=='')return normalize(value[key]);
   return normalize(value.fid);
  }
  if(Number.isInteger(value))return CE.concat(FUTURE)[value]||'challenger';
  const clean=String(value??'challenger').toLowerCase().trim().replace(/^(?:ai|ce|ww|ssf2t|st):/,'').replace(/[._\s]+/g,'-').replace(/-+/g,'-');
  return aliases[clean]||clean||'challenger';
 }
 function identity(value){const id=normalize(value),evil=window.SF2AIEVIL?.get(id),v=voices[id]||voices[evil?.base];return freeze({id,known:!!v,name:evil?.name||v?.name||fallback.name,base:evil?.base||v?.base||id,move:v?.move||fallback.move});}
 function wrap(text,width=38){
  if(!Number.isInteger(width)||width<8||width>38)throw new RangeError('Quote width must be 8..38 native characters');
  const words=String(text??'').trim().toUpperCase().replace(/\s+/g,' ').split(' ').filter(Boolean),greedy=[];let line='';
  for(const word of words){if(word.length>width)throw new RangeError('Quote word exceeds line width');if(line&&line.length+1+word.length>width){greedy.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)greedy.push(line);if(greedy.length>3)throw new RangeError('Quote exceeds the three-line result area');if(greedy.length<2)return Object.freeze(greedy);
  // Balance the minimum number of lines, avoiding a lone word below a full line.
  // Keep punctuation and short connecting words with their natural phrases.
  const count=greedy.length,target=(words.join(' ').length-count+1)/count,memo=new Map();
  function solve(at,left){
   if(!left)return at===words.length?{cost:0,lines:[]}:null;
   const key=at+':'+left;if(memo.has(key))return memo.get(key);let best=null,current='';
   for(let end=at;end<words.length;end++){
    current+=(current?' ':'')+words[end];if(current.length>width)break;
    const tail=solve(end+1,left-1);if(!tail)continue;
    const link=/^(A|AN|THE|MY|YOUR|TO|FOR|OF|IN|IS|AND|BUT)$/.test(words[end]),punct=/[.!?]$/.test(current),cost=tail.cost+(current.length-target)**2+(current.length<8?100:0)+(link?16:0)-(punct?12:0);
    if(!best||cost<best.cost)best={cost,lines:[current,...tail.lines]};
   }
   memo.set(key,best);return best;
  }
  return Object.freeze(solve(0,count)?.lines||greedy);
 }
 function variants(winnerID,loserID,options={}){
  const winner=identity(winnerID),loser=identity(loserID),death=options.death===true,kind=death?'death':'normal',v=voices[winner.id]||(window.SF2AIEVIL?.get(winner.id)?SF2AIEVIL.quotes:fallback);
  const exact=matchups[winner.id+'|'+loser.id],inherited=!exact&&loser.base!==loser.id?matchups[winner.id+'|'+loser.base]:null,pool=(exact||inherited)?.[kind]||v[kind],source=exact?'matchup':inherited?'matchup-base':winner.known?'character':'fallback';
  return Object.freeze(pool.map((template,index)=>{const text=template.replace(/\{name\}/g,loser.name).replace(/\{move\}/g,loser.move);return freeze({winner:winner.id,loser:loser.id,death,index,source,text,lines:wrap(text)});}));
 }
 function hash(text){let h=2166136261;for(let n=0;n<text.length;n++){h^=text.charCodeAt(n);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return(h^(h>>>16))>>>0;}
 function stablePart(value){return typeof value==='number'&&Number.isFinite(value)?String(value):typeof value==='string'?value:'0';}
 function choose(winnerID,loserID,options={}){
  const pool=variants(winnerID,loserID,options),record=pool[0],key=[record.winner,record.loser,record.death?'death':'normal',stablePart(options.seed),stablePart(options.matchSerial)].join('\u0000');return pool[hash(key)%3];
 }
 for(const v of window.SF2AIEVIL?.all()||[])if(!voices[v.id])voices[v.id]={name:v.name,base:v.base,move:voices[v.base]?.move||fallback.move,normal:SF2AIEVIL.quotes.normal,death:SF2AIEVIL.quotes.death};
 freeze(voices);freeze(matchups);freeze(fallback);freeze(aliases);freeze(CE);freeze(FUTURE);
 return Object.freeze({version:1,choose,variants,identity,wrap,ids:()=>Object.freeze(Object.keys(voices)),layout:freeze({width:384,maxCharacters:38,maxLines:3,glyphWidth:8,lineHeight:13,baselines:[176,189,202],portraitBottom:160,textBottom:205}),catalog:voices,matchups});
})();
