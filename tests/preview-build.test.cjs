'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {stamp}=require('../scripts/stamp-preview-build.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'sf2-preview-build-'));
try{
  fs.mkdirSync(path.join(root,'ai'));
  fs.writeFileSync(path.join(root,'build.json'),JSON.stringify({status:'work-in-progress',version:'0.1.146',commit:'old',files:[{file:'obsolete.js'}]}));
  fs.writeFileSync(path.join(root,'game.js'),'first game');fs.writeFileSync(path.join(root,'ai_ff_data.js'),'same data');
  fs.writeFileSync(path.join(root,'index.html'),'<script>window.SF2BUILD={"commit":"old"};</script><script src="game.js?v=old"></script><script src="ai_ff_data.js?v=old"></script><script src="https://example.org/external.js?v=keep"></script>');
  fs.writeFileSync(path.join(root,'ai','test.html'),'<script src="../game.js?mode=ai&v=old#anchor"></script>');
  const a='a'.repeat(40),b='b'.repeat(40),when='2026-11-26T00:00:00.000Z';
  assert.throws(()=>stamp(root,'not-a-commit'),/full Git commit/);
  stamp(root,a,when);const first=fs.readFileSync(path.join(root,'index.html'),'utf8'),oldScript=first.match(/src="(game.js[^"]*)/)[1],oldData=first.match(/src="(ai_ff_data.js[^"]*)/)[1];
  assert(first.includes(`"commit":"${a}"`));assert(first.includes('https://example.org/external.js?v=keep'));
  assert(fs.readFileSync(path.join(root,'ai','test.html'),'utf8').includes('../game.js?mode=ai&v='));
  assert(fs.readFileSync(path.join(root,'ai','test.html'),'utf8').includes('#anchor'));
  fs.writeFileSync(path.join(root,'game.js'),'fixed game');stamp(root,b,when);
  const second=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!second.includes(oldScript));assert(second.includes(oldData));assert(second.includes(`"commit":"${b}"`));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8'));assert(!manifest.files.some(f=>f.file==='obsolete.js'));assert(!manifest.files.some(f=>f.file==='build.json'));
  for(const item of manifest.files){const content=fs.readFileSync(path.join(root,item.file));assert.equal(item.bytes,content.length);assert.equal(item.sha256,crypto.createHash('sha256').update(content).digest('hex'));}
  console.log('Changed code gets a fresh URL; unchanged code stays cached; metadata and manifest match the staged build');
}finally{if(!path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'sf2-preview-build-'))throw Error('Unexpected test directory');fs.rmSync(root,{recursive:true,force:true});}
