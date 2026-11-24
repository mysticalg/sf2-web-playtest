const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'..','ai_chain.js'),'utf8'),ctx);const C=ctx.window.SF2AICHAIN;let count=0;function perm(a,rest){if(!rest.length){const p={ST:1,Y:0,AIAttackSerial:0,cur:8,anim:{name:'sLP'}};C.reset(p);let tick=0;for(const b of [...a,...a]){p.cur=8+b;p.AIAttackSerial++;C.contact(p,false);C.sample(p,0,++tick);const next=a[(a.indexOf(b)+1)%6];C.sample(p,16<<next,++tick);assert.equal(C.take(p,tick,false),next);}assert.equal(p.AIChain.cycles,2);assert.equal(p.AIChain.used,0);count++;return;}for(let i=0;i<rest.length;i++)perm([...a,rest[i]],[...rest.slice(0,i),...rest.slice(i+1)]);}perm([],[0,1,2,3,4,5]);console.log(count+' arbitrary button orders passed, two cycles each');

const make=()=>({ST:1,Y:0,AIAttackSerial:1,cur:10,anim:{name:'sHP'}});
let p=make();C.contact(p,false);C.sample(p,64,1);assert.equal(C.take(p,1,false),-1,'a used HP cannot cancel itself');
p=make();C.contact(p,true);C.sample(p,32,2);assert.equal(C.take(p,2,false),-1,'a block cannot confirm a chain');
p=make();C.sample(p,32,2);assert.equal(C.take(p,2,false),-1,'a miss cannot confirm a chain');
p=make();C.contact(p,false);C.sample(p,40,2);assert.equal(C.take(p,2,false),1);assert(p.AIChain.cancelCrouch,'buffered crouch is retained');
p=make();C.contact(p,false);C.sample(p,32,2);assert.equal(C.take(p,2,true),-1,'special inputs keep priority');
p=make();C.contact(p,false);C.sample(p,288,2);assert.equal(C.take(p,2,false),-1,'two-button chords are not normal chains');
p=make();C.contact(p,false);C.sample(p,32,2);p.ST=5;C.sample(p,0,3);assert.equal(C.take(p,3,false),-1,'taking damage clears a pending cancel');
p=make();C.contact(p,false);C.reset(p);assert.equal(p.AIChain.used,0);assert.equal(p.AIChain.cycles,0);
console.log('Miss, block, reuse, stance, chord, special and interruption checks passed');
