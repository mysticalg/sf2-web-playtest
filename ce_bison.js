/* Bison Psycho Crusher: literal state transitions from CE 0x43cf2..0x43e10.
   Physics is 0x2346 (8.8 acceleration first). The flight counter reads use
   the program's original four-byte stride at 0x43d98: 32, 36, 62 frames. */
'use strict';
(()=>{
  const prior=window.SF2CESPECIALS,hold=p=>{p.acc--;};
  function anim(p,c,key,h){h.anim(p,c[key],0);p.acc=-1;}
  function move(p,c){c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;}
  // Head Stomp / Somersault Skull Diver, original0x43ef6..0x442ee.
  const DUCK_SOURCES=new Set(/*HEAD_DUCK*/[313572,313596,313620,313644,313672,313696,313720,313744,313768,313792,313820,313844,313868,313892,313916,313940,313968,313992,314016,314040,314068,314092,314116,314140,314164,314188,314216,314240,314264,314288,314312,314336,319628,319652,319680,319704,320312,320340,320364,320392,320416,320440,321464,321488,335094,335118,335142,335166,335190,335218,335242,335266,335290,335314,335338,335362,335390,335414,335438,335462,335486,335510,335534,335558,335582,335610,335634,335658,335682,335706,335730,335754,335782,335806,335830,335854,335878,335902,335926,335954,335978,336002,336026,336050,336074,336098,341278,341302,341502,341578,341602,342086,342110,342266,342290,363226,363250,363274,363298,363322,363346,363370,363398,363422,363446,363470,363494,363518,363542,363566,363594,363618,363642,363666,363690,363714,363742,363766,363790,363814,363838,363862,363890,363914,363938,363962,363986,364010,367430,367454,367478,367502,367526,367550,367574,367598,367622,367646,367670,367694,368550,368574,368602,368626,370122,370146,370298,370710,370954,391160,391184,391848,391872,391896,391920,391948,391972,391996,392020,392044,392072,392220,392244,392268,392292,392316,392340,392368,392392,392416,392440,392464,392488,392516,392540,392564,392588,392612,392636,392660,392684,392708,392732,392756,392780,392804,392828,398736,398760,398788,398812,399012,399036,399060,399624,399648,399676,399700,399724,399752,399776,399800,399824,400288,400312,400336,418872,418896,418920,418944,418972,418996,419020,419044,419068,419092,419120,419144,419168,419192,419216,419240,419268,419292,419316,419340,419368,419392,419416,419440,419464,419488,419516,419540,419564,419588,419612,419636,425268,425292,425320,425344,425952,425980,426004,426032,426056,426080,427104,427128,441466,441490,441514,441538,441562,441590,441614,441638,441662,441686,441714,441738,441762,441786,441810,441834,441862,441886,441910,441934,441958,441986,442010,442034,442058,442086,442110,442158,442182,442206,447902,447926,447954,447978,449898,449922,451066,451090,451118,451142,451166,451194,451218,451242,451266,470248,470272,470296,470324,470348,470372,470396,470420,470444,470472,470496,470520,470544,470568,470592,470620,470644,470668,470692,470720,470744,470768,470792,470820,470844,470868,470892,475860,475884,475912,475936,476036,476060,476084,476280,476304,476328,476828,478396,478424,478448,499804,499828,499852,499876,499904,499928,499952,499976,500000,500024,500048,500076,500100,500124,500148,500176,500200,500224,500248,500272,500296,500320,500348,500372,500396,500420,500444,500468,500492,500620,500644,500668,500692,500716,500768,500792,500816,500844,500868,500892,500916,500940,500968,500992,501016,501040,501064,505924,505948,505976,506000,506748,506772,507708,507736,507760,507788,507812,524370,524394,524418,524442,524466,524490,524514,524538,524562,524586,524610,524638,524662,524686,524710,524734,524758,524782,524806,524830,524854,524878,524902,524926,524950,524978,525002,525026,525050,525074,525098,525122,525146,525170,525194,525218,525242,525266,525290,525314,525338,525362,525386,525410,525434,525458,525482,525506,525530,525554,525578,525602,525626,525650,525674,525698,525722,525746,525770,525798,525822,525846,525870,525898,525922,525946,525970,525998,526022,526046,526070,531934,531958,531986,532010,532482,532506,532530,532554,532962,532986,533794,533822,533846,549980,550004,550028,550052,550080,550104,550128,550152,550180,550204,550228,550252,550280,550304,550328,550352,550376,550400,550428,550452,550476,550500,550524,550548,550576,550600,550624,550648,550672,550696,553452,553480,553808,553832,554012,554036,554060,555260,555284,565688,565712,565736,565760,565784,565808,565836,565860,565884,565908,565932,565956,565984,566008,566032,566056,566080,566104,566132,566156,566180,566204,566228,566252,569948,569972,569996,570024,570048,570072,570096,570124,570148,570868,570896,570920,570948,570972,570996,582652,582676,582700,582724,582748,582772,582796,582820,582848,582872,582896,582920,582944,582968,582992,583016,583044,583068,583092,583116,583140,583164,583188,583212,583240,583264,583288,583312,583336,583360,583384,583412,583436,583460,583484,583508,583532,583556,583584,583608,583632,583656,583680,583704,589096,589120,589144,589168,589192,589268,589292,589320,589344,589768,589792,590512,590540,590564,590616,590640]),HEAD_SHADOW=/*HEAD_SHADOW*/{"528258":34,"528282":34,"528306":34,"528330":34,"528354":34,"528378":34,"528402":34,"528426":34,"528454":34,"528478":34,"528502":34,"528526":34,"528550":34,"528574":34,"528598":34,"528622":34,"528650":34,"528674":34,"528698":34,"528722":34,"528746":34,"528770":34,"528794":34,"528818":34,"528846":34,"528870":34,"528894":34,"528918":34,"528942":34,"529070":34,"529094":34,"529118":34,"529142":34,"529166":34,"529294":34,"529318":34,"529342":34,"529366":34,"529390":34,"528970":34,"528994":34,"529018":34,"529042":34,"529194":34,"529218":34,"529242":34,"529266":34,"529418":34,"529442":34,"529466":34,"529490":34,"529518":34,"529542":34,"529566":34,"529590":34,"529614":34,"529638":34,"529662":34,"529686":34,"529714":34,"529738":34,"529762":34,"529786":34,"529810":34,"529834":34,"529858":34,"529882":34,"529910":34,"529934":34,"529958":34,"529982":34,"530006":34,"530030":34,"530054":34,"530078":34,"532258":34,"532282":34,"532306":34,"532330":34,"532354":34,"530106":36,"530130":34,"530154":34,"530178":34,"530202":36,"530226":36,"530250":36,"530278":36,"530302":34,"530326":34,"530350":34,"530374":36,"530398":36,"530422":36,"530450":36,"530474":34,"530498":34,"530522":34,"530546":36,"530570":36,"530594":36};
  if(window.SF2CESHADOWDATA)Object.assign(SF2CESHADOWDATA.selectors,HEAD_SHADOW);
  const SCISSOR_ANIMS=/*SCISSOR_ANIMS*/[{"name":"scissor0","source":530106,"flags":[1,0,0,0,1,1,32768],"mode":1,"loop":0,"ents":[[9,3,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[64,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[65,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[66,8,[-9,91,15,11],[6,68,56,17],[-5,56,24,7],[0,70,23,20],[-27,65,44,15],7,2,3,0],[67,8,[31,75,26,14],[16,46,35,20],[-11,16,24,14],[0,35,23,36],[-23,25,29,22],10,2,3,0],[9,5,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[9,8,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0]],"groups":[0,0,0,1,23,0,0]},{"name":"scissor1","source":530278,"flags":[1,0,0,0,1,0,32768],"mode":1,"loop":0,"ents":[[9,3,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[64,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[65,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[66,8,[-9,91,15,11],[6,68,56,17],[-5,56,24,7],[0,70,23,20],[-27,65,44,15],8,2,3,0],[67,8,[31,75,26,14],[16,46,35,20],[-11,16,24,14],[0,35,23,36],[-23,25,29,22],10,2,3,0],[9,6,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[9,8,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0]],"groups":[0,0,0,1,23,0,0]},{"name":"scissor2","source":530450,"flags":[1,0,0,0,1,1,32768],"mode":1,"loop":0,"ents":[[9,3,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[64,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[65,3,[-9,91,15,11],[-5,74,21,10],[-5,56,24,7],[0,70,23,20],[0,0,0,0],0,0,0,0],[66,8,[-9,91,15,11],[6,68,56,17],[-5,56,24,7],[0,70,23,20],[-27,65,44,15],9,2,3,0],[67,8,[31,75,26,14],[16,46,35,20],[-11,16,24,14],[0,35,23,36],[-23,25,29,22],10,2,3,0],[9,7,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0],[9,8,[6,79,18,10],[7,49,24,23],[1,13,30,13],[0,35,23,36],[0,0,0,0],0,0,0,0]],"groups":[0,0,0,1,23,0,0]}];
  const BISON_RECORDS=/*BISON_RECORDS*/{"528354":[248,1,18,21,132,1,45,4,2,1,2,36],"528550":[248,16,18,21,133,1,45,4,2,1,2,36],"528746":[248,16,18,21,134,1,45,4,2,1,2,36],"528994":[223,57,21,19,136,2,42,2,2,3,5,0],"529218":[218,57,26,19,137,2,42,2,2,3,5,0],"529442":[211,57,33,19,139,2,42,2,2,3,5,0],"529638":[223,57,21,19,136,2,42,2,2,3,5,0],"529834":[218,57,26,19,137,2,42,2,2,3,5,0],"530030":[211,57,33,19,139,2,42,2,2,3,5,0],"530178":[229,65,44,15,135,1,45,3,2,1,2,20],"530202":[233,25,29,22,138,23,45,3,2,1,2,20],"530350":[229,65,44,15,136,1,45,3,2,1,2,20],"530374":[233,25,29,22,138,23,45,3,2,1,2,20],"530522":[229,65,44,15,137,1,45,3,2,1,2,20],"530546":[233,25,29,22,138,23,45,3,2,1,2,20]};
  const TARGET_HEIGHT=[[81,76,71,82,81,74,97,85,78,105,94,97],[60,54,48,53,60,57,58,56,48,53,62,10],[53,64,65,66,53,73,87,70,91,109,69,104]];
  const flags=p=>p.anim.flags[p.aidx];
  function setHead(p,c,selector,h){h.anim(p,c.frames[selector],0);p.acc=-1;}
  function headInit(p,m,h){
    const frames=Array.from({length:13},(_,i)=>h.find(p,'stomp'+i)),land=h.find(p,'biteland');
    if(frames.some(n=>n<0)||land<0)return false;
    p.CES={kind:'headstomp',move:m,phase:0,time:0,strength:p.SPSTR,frames,land,contact:0};
    p.SPPH=0;p.SPKD=0;p.SPK=0;
    h.anim(p,3,p.F.anims[3].ents.length-1);p.acc=-1;return true;
  }
  function headCurve(p,c){
    p.X+=c.vx;p.Y+=c.vy;
    if(!c.descending){p.Y+=c.arc;c.arc-=0x40;if(c.arc<0){c.arc=0;c.descending=1;}}
    else{p.Y-=c.arc;c.arc+=0x40;}
  }
  function headLand(p,c,h){if(!h.floor)p.Y&=255;c.phase=8;c.time=6;h.anim(p,c.land,0);p.acc=-1;h.land(p);}
  function reboundMove(p,c,h,descendingOnly=false){c.vx-=c.ax;c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;if(p.CEWALL)c.vx=0;return h.floor?(!descendingOnly||c.vy<0)&&h.floor(p):p.Y<0;}
  function rebound(p,c,h){
    const keys=p.KEYS&3,cam=h.cam,normal=c.contact&&(p.Y>>8)>=24;
    let face;
    if(normal){
      if(keys)face=keys&1?1:0;
      else if((p.X>>8)<cam+96)face=0;
      else if((p.X>>8)>cam+288)face=1;
      else face=((h.random?h.random():0)&1)?0:1;
      c.phase=5;c.rebound=1;
      const same=face===c.oppFace;c.vx=same?0x900:0x680;c.ax=same?0x50:0x4e;c.vy=0x800;c.ay=0x80;
      p.FACE=face;if(face){c.vx=-c.vx;c.ax=-c.ax;}setHead(p,c,c.strength+3,h);
    }else{
      face=keys?(keys&1?0:1):(((h.random?h.random():0)&1)?0:1);
      p.FACE=face;c.phase=9;c.vx=face?-0x380:0x380;c.ax=face?-5:5;c.vy=0x500;c.ay=0x48;setHead(p,c,12,h);
    }
  }
  function headStep(p,c,h){
    if(c.phase===0){
      if(c.time===0){h.anim(p,11+c.strength,0);c.time=1;return true;}
      if(c.time++<3)return true;
      const o=p.opp,at=o.anim.source+24*o.aidx,kind=(o.Y>>8)>0?2:DUCK_SOURCES.has(at)?1:0;
      c.vx=((o.X>>8)-(p.X>>8))*8;
      let height=(o.Y>>8)+TARGET_HEIGHT[kind][o.fid]-(p.Y>>8);if(height<0||height>144)height=144;
      c.vy=height*8;c.arc=0x400;c.descending=0;c.phase=1;setHead(p,c,c.strength,h);return true;
    }
    if(c.phase===1){if(!(flags(p)&255))c.phase=2;return true;}
    if(c.phase===2||c.phase===3){
      headCurve(p,c);if(h.floor?h.floor(p):p.Y<0){headLand(p,c,h);return true;}
      if(c.phase===2){if((p.CEWALL||0)&(p.FACE+1))c.vx=0;if(flags(p)&255){c.phase=3;p.SPK=1;hold(p);}return true;}
      if(p.CEWALL)c.vx=0;
      if(!c.contact){hold(p);return true;}
      c.oppFace=p.opp.FACE;c.phase=4;p.SPK=0;p.acc=p.anim.ents[p.aidx][1]-1;h.tick(p);hold(p);return true;
    }
    if(c.phase===4){if(flags(p)&0x8000)rebound(p,c,h);return true;}
    if(c.phase===5){if(!(flags(p)&255))c.phase=6;return true;}
    if(c.phase===6){
      if(p.KEYS&1)p.X-=0x500;else if(p.KEYS&2)p.X+=0x500;
      h.tick(p);hold(p);
      const buttons=p.KEYS&0x70;
      if(buttons){const button=buttons&16?0:buttons&32?1:2;c.phase=7;p.SPK=1;setHead(p,c,6+button,h);}
      if(reboundMove(p,c,h))headLand(p,c,h);return true;
    }
    if(c.phase===7){h.tick(p);hold(p);if(reboundMove(p,c,h))headLand(p,c,h);return true;}
    if(c.phase===9){if(reboundMove(p,c,h,true))headLand(p,c,h);return true;}
    if(--c.time===0){const y=p.Y;p.CES=null;h.idle(p);p.Y=y;}else hold(p);return true;
  }
  function scissorInit(p,m,h){
    const a=SCISSOR_ANIMS[p.SPSTR];let n=p.F.anims.findIndex(x=>x.name===a.name);
    if(n<0){n=p.F.anims.length;p.F.anims.push(a);}
    p.CES={kind:'scissor',move:m,phase:0,time:0,strength:p.SPSTR,frame:n};
    p.SPPH=0;p.SPKD=0;p.SPK=1;if(h.previousPose){Object.assign(p,h.previousPose);p.anim=p.F.anims[p.cur];hold(p);}else{h.anim(p,2,0);p.acc=-1;}return true;
  }
  function scissorMove(p,c){c.vx-=c.ax;c.vy-=c.ay;p.X+=c.vx;p.Y+=c.vy;}
  function scissorStep(p,c,h){
    if(c.pause){if(--c.pause>0){hold(p);return true;}}
    if(c.phase===0){
      if(c.time===0){h.anim(p,11+c.strength,0);c.time=1;return true;}
      if(c.time++<3)return true;
      c.phase=1;h.anim(p,c.frame,0);return true;
    }
    if(c.phase===1){
      if(flags(p)&255)return true;
      c.phase=2;c.vx=[0x600,0x800,0xa00][c.strength];c.ax=-0x10;c.vy=0x200;c.ay=0x30;
      if(!p.FACE){c.vx=-c.vx;c.ax=-c.ax;return true;}scissorMove(p,c);return true;
    }
    if(c.phase===2){
      if(c.vy<0&&(h.floor?h.floor(p):p.Y<0)){if(!h.floor)p.Y&=255;c.phase=3;p.acc=p.anim.ents[p.aidx][1]-1;return true;}
      scissorMove(p,c);if(flags(p)&255)hold(p);return true;
    }
    if(c.phase===3){
      if(!(flags(p)&0x8000))return true;
      p.SPK=0;if(p.KEYS&8){const y=p.Y;p.CES=null;p.ST=3;h.anim(p,3,p.F.anims[3].ents.length-1);p.Y=y;return true;}
      c.phase=4;h.anim(p,4,0);return true;
    }
    h.tick(p);hold(p);if(flags(p)&0x8000){const y=p.Y;p.CES=null;h.idle(p);p.Y=y;}return true;
  }
  function bisonState(p){const c=p.CES;return p.fid===8&&p.ST===11&&p.MV===c?.move&&['headstomp','scissor'].includes(c.kind)?c:null;}
  function collisionSnapshot(p,c){
    const source=p.anim.source+24*p.aidx,r=BISON_RECORDS[source];
    c.collision={source,x:p.X>>8,y:p.Y>>8,face:p.FACE};
    const group=r?r[5]:0;if(group!==c.hitGroup){p.hitdone=0;c.hitGroup=group;}
  }
  window.SF2BISONHEAD={
    localStop:p=>!!bisonState(p)&&(p.CES.kind==='scissor'||p.CES.kind==='headstomp'&&(p.CES.phase===2||p.CES.phase===3)),
    contact(p){const c=p.CES;if(c?.kind==='headstomp')c.contact=1;else if(c?.kind==='scissor'&&c.before){const q=c.before;Object.assign(p,q.p);p.anim=p.F.anims[p.cur];Object.assign(c,q.c);c.pause=13;}},
    attackBox(p){const c=bisonState(p);if(!c)return undefined;const q=c.collision,r=q&&BISON_RECORDS[q.source];if(!r||!p.SPK)return null;const x=r[0]>127?r[0]-256:r[0];return [q.x+(q.face?-x:x),q.y+r[1],r[2],r[3]];},
    combat(p,d,region,random){
      const c=bisonState(p),r=c?.collision&&BISON_RECORDS[c.collision.source];if(!r||!window.SF2CEVEGA?.combatRecord)return null;
      const crouching=DUCK_SOURCES.has(d.anim.source+24*d.aidx),airborne=(d.Y>>8)>0||d.ST===2;
      const scissor=r[7]===3,result=SF2CEVEGA.combatRecord(p,d,region,random,r);
      return {...result,kd:airborne?1:0,strength:scissor?2:crouching?r[8]:0,region:scissor?0:1,crouching,
        reactionName:scissor?'hitH':crouching?'chit'+['L','M','H'][r[8]]:'bodyhitL'};
    }
  };
  window.SF2CESPECIALS={
    init(p,m,h){
      if(p.fid===8&&m.inp==='cbfl'&&m.btn==='K')return scissorInit(p,m,h);
      if(p.fid===8&&m.inp==='cdu'&&m.btn==='K')return headInit(p,m,h);
      if(p.fid!==8||m.inp!=='cbf'||m.btn!=='P')return prior.init(p,m,h);
      const s=p.SPSTR,start=h.find(p,'crush'+s+'s'),rise=h.find(p,'crush'+s+'r'),flight=h.find(p,'crush'+s+'f');
      if(start<0||rise<0||flight<0||!p.F.anims[start].flags)return prior.init(p,m,h);
      if(window.SF2BISONINPUT)SF2BISONINPUT.consume(p);
      const c=p.CES={kind:'crusher',move:m,phase:0,start,rise,flight,vx:(p.FACE?1:-1)*[0x500,0x700,0x900][s],vy:0,ay:0,time:[32,36,62][s]};
      anim(p,c,'start',h);return true;
    },
    step(p,h){
      const c=p.CES;
      if(c?.kind==='scissor'){collisionSnapshot(p,c);c.before={p:{X:p.X,Y:p.Y,cur:p.cur,aidx:p.aidx,acc:p.acc,adone:p.adone},c:{phase:c.phase,time:c.time,vx:c.vx,vy:c.vy,ax:c.ax,ay:c.ay}};return scissorStep(p,c,h);}
      if(c?.kind==='headstomp'){collisionSnapshot(p,c);return headStep(p,c,h);}
      if(!c||c.kind!=='crusher')return prior.step(p,h);
      if(p.MV!==c.move){p.CES=null;return prior.step(p,h);}
      const flags=p.anim.flags[p.aidx];
      if(c.phase===0){c.phase=1;hold(p);return true;} // original sound-only state
      if(c.phase===1){
        if(flags&0x8000){c.phase=2;c.vy=0x400;c.ay=0xc0;anim(p,c,'rise',h);}
        return true;
      }
      if(c.phase===2){
        if(c.vy<0){c.phase=3;c.vy=c.ay=0;anim(p,c,'flight',h);}
        else{move(p,c);hold(p);}return true;
      }
      if(c.phase===3){
        if(--c.time===0||h.wall&&h.wall(p)){c.phase=4;c.ay=0xc0;anim(p,c,'rise',h);}
        move(p,c);return true;
      }
      if(c.phase===4){
        if(p.Y<0){p.Y&=255;c.phase=5;}else{move(p,c);hold(p);}return true;
      }
      if(c.phase===5){
        if(flags&0x8000){p.CES=null;h.idle(p);}return true;
      }
      return false;
    }
  };
})();
