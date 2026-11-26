const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('node:path'),repo=path.resolve(__dirname,'..'),dir=path.join(repo,'work','victory-quotes');fs.mkdirSync(dir,{recursive:true});const source=fs.readFileSync(path.join(repo,'ai_victory_quotes.js'),'utf8');
const math=Object.create(Math);math.random=()=>{throw Error('Gameplay RNG was read');};const context={window:{},Math:math,Date:class{constructor(){throw Error('Clock was read');}static now(){throw Error('Clock was read');}}};vm.createContext(context);vm.runInContext(source,context);const Q=context.window.SF2AIVictoryQuotes;
const ids=Q.ids(),expected=['ryu','honda','blanka','guile','ken','chun-li','zangief','dhalsim','bison','sagat','balrog','vega','damnd','sodom','andore','edi','rolento','abigail','belger','guy','cody','haggar','evil-ryu','evil-ken','cammy','thawk','feilong','deejay','akuma'];assert.deepStrictEqual([...ids].sort(),expected.sort());assert(Object.isFrozen(Q));let quotes=0,lines=0,maxLines=0,maxWidth=0;const states=new Set(),failures=[];
for(const winner of ids)for(const loser of ids)for(const death of[false,true]){
 let pool;try{pool=Q.variants(winner,loser,{death});}catch(e){failures.push({winner,loser,death,error:e.message});continue;}
 assert.strictEqual(pool.length,3);assert.strictEqual(new Set(pool.map(q=>q.text)).size,3);assert(Object.isFrozen(pool));
 for(const record of pool){assert(record.source!=='fallback');assert(record.winner===winner&&record.loser===loser);assert(Object.isFrozen(record));assert(Object.isFrozen(record.lines));assert(/^[\x20-\x7e]+$/.test(record.text));assert(!/[{}<>]/.test(record.text));assert(record.lines.length>0&&record.lines.length<=3);assert(record.lines.join(' ')===record.text.toUpperCase());maxLines=Math.max(maxLines,record.lines.length);
  for(const line of record.lines){assert(line.length>0&&line.length<=38);assert(!/^\s|\s$/.test(line));assert((384-line.length*8)/2>=40);maxWidth=Math.max(maxWidth,line.length);lines++;}quotes++;
 }
 const actors=[Object.freeze({aiProfile:winner,fid:0}),Object.freeze({fighterKey:'ai:'+loser,fid:10})],options=Object.freeze({death,seed:123456789,matchSerial:45});const before=JSON.stringify({actors,options});
 const a=Q.choose(...actors,options);for(let i=0;i<6;i++)assert.deepStrictEqual(Q.choose(...actors,options),a);assert.strictEqual(JSON.stringify({actors,options}),before);
 assert.deepStrictEqual(a,Q.choose('ai:'+winner,'ce:'+loser,options));assert(a.index>=0&&a.index<3);states.add(a.source);
}
assert.deepStrictEqual(failures,[],'All quote identities/pairs must fit before integration');
for(const [alias,id]of Object.entries({'E. Honda':'honda','M.Bison':'bison','ChunLi':'chun-li','Edi. E':'edi','ai:evilken':'evil-ken','SSF2T:T. Hawk':'thawk','Fei Long':'feilong','Dee Jay':'deejay','Gouki':'akuma'}))assert.strictEqual(Q.identity(alias).id,id);
for(let n=0;n<12;n++)assert.strictEqual(Q.identity(n).id,['ryu','honda','blanka','guile','ken','chun-li','zangief','dhalsim','bison','sagat','balrog','vega'][n]);
for(const evil of['evil-ryu','evil-ken']){const base=Q.identity(evil).base;assert(base!==evil);for(const loser of ids)for(const death of[false,true]){const a=Q.variants(evil,loser,{death}),b=new Set(Q.variants(base,loser,{death}).map(x=>x.text));for(const line of a)assert(!b.has(line.text),'Evil winners must retain their own voice');}}
assert.strictEqual(Q.variants('sagat','evil-ryu')[0].source,'matchup-base');assert(Q.variants('sagat','evil-ryu')[0].text.includes('Evil Ryu'));
assert(Q.variants('ken','chun-li')[0].text.includes('spinning bird kick is no match for my dragon punch'));
assert(Q.variants('evil-ryu','ken',{death:true}).every(q=>q.lines.length));
assert.strictEqual(new Set(Array.from({length:100},(_,matchSerial)=>Q.choose('ken','chun-li',{seed:7,matchSerial}).index)).size,3);
assert.strictEqual(new Set(Array.from({length:100},(_,seed)=>Q.choose('ken','chun-li',{seed,matchSerial:7}).index)).size,3);
for(const x of[undefined,null,'','unknown-profile',-1,100,{aiProfile:'new-unadmitted-guest',fid:10}]){const p=Q.variants(x,'ken');assert(p.length===3&&p.every(q=>q.source==='fallback'));}
assert.throws(()=>Q.wrap('SUPERCALIFRAGILISTICEXPIALIDOCIOUSPLUSANOTHERWORD'));assert.throws(()=>Q.wrap('A '.repeat(70)));assert.throws(()=>Q.wrap('HELLO',39));
assert(Q.layout.baselines.every(y=>y-7>Q.layout.portraitBottom&&y+1<Q.layout.textBottom));
const fixtures=[['ken','chun-li',false],['chun-li','bison',true],['evil-ryu','ken',true],['haggar','belger',true]].map(([w,l,death])=>Q.choose(w,l,{death,seed:42,matchSerial:7}));
const proof={allPassed:true,identities:ids.length,orderedPairs:ids.length**2,modes:2,distinctVariants:3,quotes,lines,maxLines,maxCharacters:maxWidth,curatedPairs:Object.keys(Q.matchups).length,sources:[...states],purity:'Repeated render queries leave all inputs and catalogs unchanged; Math.random/Date throw if touched',fixtures};fs.writeFileSync(dir+'/unit-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify({...proof,fixtures:fixtures.map(r=>({winner:r.winner,loser:r.loser,death:r.death,index:r.index,lines:r.lines}))},null,2));
