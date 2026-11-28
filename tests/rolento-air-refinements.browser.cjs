const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const barrages=[],kicks=[],walls=[];
  async function setup(side,possessed=false){await SF2AI.configure({p1:side?'ryu':possessed?'evil-rolento':'rolento',p2:side?possessed?'evil-rolento':'rolento':'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;const w=P[side],d=w.opp;w.WINS=d.WINS=0;w.X=(side?550:250)*256;d.X=(side?300:500)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.HP=d.HP=10000;return{w,d,step:(key=0,enemy=0)=>{const pair=[0,0];pair[side]=key;pair[1-side]=enemy;SF2.step(pair);}};}
  for(const side of[0,1])for(const possessed of[false,true])for(const delay of[8,16,25]){
   const {w,d,step}=await setup(side,possessed);step(4);for(let n=0;n<delay;n++)step();const startY=w.Y/256;step(272);let admitted=false,recoil=false,recoilX=null,minBack=0,maxY=0,shots=new Set(),stale=false;
   for(let n=0;n<260;n++){step();admitted||=w.MV?.style==='grenade-barrage'&&w.ST===11;for(const g of w.AIFFGrenades||[])shots.add(g.index);if(w.AIFFMove?.recoiled){recoil=true;recoilX??=w.X/256;minBack=Math.max(minBack,(recoilX-w.X/256)*(side?-1:1));}maxY=Math.max(maxY,w.Y/256);}
   const state={st:w.ST,y:w.Y,move:!!w.AIFFMove,grenades:w.AIFFGrenades?.length||0};w.X=340*256;d.X=390*256;w.FACE=1;d.FACE=0;toidle(d);const hp=d.HP;step(16);for(let n=0;n<60;n++)step();
   barrages.push({side,possessed,delay,startY,admitted,recoil,shots:[...shots],minBack,maxY,state,normalDamage:hp-d.HP});
  }
  for(const side of[0,1])for(const down of[false,true])for(const button of[128,256,512]){
   const {w,d,step}=await setup(side);d.X=w.X+(side?-70:70)*256;step(4);for(let n=0;n<13;n++)step();step(button|(down?8:0));let committed=false,downward=false,lowestBox=Infinity,contacts=0,hp=d.HP,maxContacts=0,shown=[];
   for(let n=0;n<110;n++){step(down?8:0);committed||=w.AIFFSlide?.kind==='air-kick'&&w.AIFFSlide.launched;downward||=!!w.AIFFSlide?.launched&&w.VY<0;const box=boxw(w,4);if(box&&w.ST===2){lowestBox=Math.min(lowestBox,box[1]-w.Y/256);shown.push(ent(w)[0]);}if(d.HP!==hp){contacts++;hp=d.HP;}}
   kicks.push({side,down,button,committed,downward,lowestBox:Number.isFinite(lowestBox)?lowestBox:null,contacts,shown:[...new Set(shown)],state:w.ST,y:w.Y,stale:!!w.AIFFSlide});
  }
  for(const side of[0,1])for(const index of[2,6]){
   const {w,d,step}=await setup(side);d.X=(side?220:580)*256;const mask=SF2AIRULES.mapping(w).find(m=>m.index===index).mask;step(mask);let ticks=0,previous=null,maxStep=0,phases=new Set(),frames=new Set(),changed=[],hp=d.HP,hits=0;
   for(;ticks<440&&(ticks<10||w.ST===11);ticks++){const x=w.X/256;step();maxStep=Math.max(maxStep,Math.abs(w.X/256-x));if(w.AIFFMove?.phase!==undefined)phases.add(w.AIFFMove.phase);if(w.cur===117){frames.add(ent(w)[0]);if(previous!==ent(w)[0])changed.push(G.tick);previous=ent(w)[0];}if(d.HP!==hp){hits++;hp=d.HP;}}
   walls.push({side,index,ticks,maxStep,phases:[...phases],frames:[...frames],cadence:changed.slice(1).map((v,i)=>v-changed[i]),hits,state:w.ST,y:w.Y});
  }
  return{barrages,kicks,walls};
 });
 fs.writeFileSync(artifacts('rolento-air-refinements.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({result,errors},null,2));assert.deepEqual(errors,[]);
 for(const r of result.barrages){assert.ok(r.startY>0);assert.ok(r.admitted);assert.ok(r.recoil);assert.deepEqual(r.shots,[0,1,2]);assert.ok(r.minBack>30);assert.equal(r.state.st,0);assert.equal(r.state.y,0);assert.equal(r.state.move,false);assert.equal(r.state.grenades,0);assert.ok(r.normalDamage>0);}
 for(const r of result.kicks){assert.equal(r.committed,r.down);if(r.down){assert.ok(r.downward);assert.ok(r.lowestBox<10);}assert.ok(r.contacts<=1);assert.equal(r.y,0);assert.ok([0,3].includes(r.state));assert.equal(r.stale,false);}
 for(const r of result.walls){for(const p of['approach','wall','dive','recover'])assert.ok(r.phases.includes(p));assert.ok(r.frames.length>=3);assert.ok(r.cadence.some(n=>n===5));assert.ok(r.maxStep<=12);assert.equal(r.hits,1);assert.equal(r.state,0);assert.equal(r.y,0);}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
