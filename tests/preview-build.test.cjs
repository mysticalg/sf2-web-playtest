'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {stamp}=require('../scripts/stamp-preview-build.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'sf2-preview-build-'));
try{
  fs.mkdirSync(path.join(root,'ai'));
  fs.mkdirSync(path.join(root,'ai-ff','audio'),{recursive:true});
  fs.mkdirSync(path.join(root,'ai-heroes','audio'),{recursive:true});
  for(const file of ['ai-ff/sodom.png','ai-ff/sodom-front-blades.png','ai-ff/audio/12.mp3','ai-heroes/guy.png','ai-heroes/audio/00.mp3'])fs.writeFileSync(path.join(root,file),'original '+file);
  fs.writeFileSync(path.join(root,'build.json'),JSON.stringify({status:'work-in-progress',version:'0.1.146',commit:'old',files:[{file:'obsolete.js'}]}));
  fs.writeFileSync(path.join(root,'game.js'),'first game');fs.writeFileSync(path.join(root,'ai_ff_data.js'),'same data');
  for(const file of ['assets_ce.js','screens_ce.js','endings_ce.js'])fs.writeFileSync(path.join(root,file),'unchanged '+file);
  fs.writeFileSync(path.join(root,'index.html'),'<script>window.SF2BUILD={"commit":"old"};</script><script src="game.js?v=old"></script><script src="ai_ff_data.js?v=old"></script><script src="https://example.org/external.js?v=keep"></script>');
  fs.writeFileSync(path.join(root,'ai','test.html'),'<script src="../game.js?mode=ai&v=old#anchor"></script>');
  const a='a'.repeat(40),b='b'.repeat(40),when='2026-11-26T00:00:00.000Z';
  assert.throws(()=>stamp(root,'not-a-commit'),/full Git commit/);
  stamp(root,a,when);const first=fs.readFileSync(path.join(root,'index.html'),'utf8'),oldScript=first.match(/src="(game.js[^"]*)/)[1],oldData=first.match(/src="(ai_ff_data.js[^"]*)/)[1];
  const revisions=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8')).assetRevisions;
  assert(first.includes(`"commit":"${a}"`));assert(first.includes('https://example.org/external.js?v=keep'));
  assert(fs.readFileSync(path.join(root,'ai','test.html'),'utf8').includes('../game.js?mode=ai&v='));
  assert(fs.readFileSync(path.join(root,'ai','test.html'),'utf8').includes('#anchor'));
  fs.writeFileSync(path.join(root,'game.js'),'fixed game');stamp(root,b,when);
  const second=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(!second.includes(oldScript));assert(second.includes(oldData));assert(second.includes(`"commit":"${b}"`));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8'));assert(!manifest.files.some(f=>f.file==='obsolete.js'));assert(!manifest.files.some(f=>f.file==='build.json'));
  assert.deepEqual(manifest.assetRevisions,revisions,'An unrelated commit must retain lazy asset cache keys');
  for(const file of ['ai-ff/sodom.png','ai-ff/sodom-front-blades.png','ai-ff/audio/12.mp3','ai-heroes/guy.png','ai-heroes/audio/00.mp3'])assert.equal(revisions[file],crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,16));
  for(const [file,name]of [['ai_ff.js','assetURL'],['ai_heroes.js','url']]){
    const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8'),expression=source.match(new RegExp(name+"=file=>[^;\\r\\n]+"))[0];
    const ctx=vm.createContext({window:{SF2BUILD:manifest}});vm.runInContext('var '+expression,ctx);
    for(const file of Object.keys(revisions))assert.equal(ctx[name](file),file+'?v='+revisions[file]);
    ctx.window.SF2BUILD={commit:a};assert.equal(ctx[name]('ai-ff/new.png'),'ai-ff/new.png?v='+a);
  }
  const asseturl=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8').match(/function asseturl\(file\)\{[^\r\n]+/)[0];
  const context=vm.createContext({window:{SF2BUILD:manifest}});vm.runInContext(asseturl,context);
  for(const file of Object.keys(revisions))assert.equal(context.asseturl(file),file+'?v='+revisions[file]);
  context.window.SF2BUILD={commit:a};assert.equal(context.asseturl('assets_ce.js'),'assets_ce.js?v='+a);
  delete context.window.SF2BUILD;assert.equal(context.asseturl('assets_ce.js'),'assets_ce.js');
  for(const item of manifest.files){const content=fs.readFileSync(path.join(root,item.file));assert.equal(item.bytes,content.length);assert.equal(item.sha256,crypto.createHash('sha256').update(content).digest('hex'));}
  fs.writeFileSync(path.join(root,'screens_ce.js'),'changed screens');stamp(root,b,when);
  const changed=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8')).assetRevisions;
  assert.notEqual(changed['screens_ce.js'],revisions['screens_ce.js']);
  for(const file of ['assets_ce.js','endings_ce.js'])assert.equal(changed[file],revisions[file]);
  fs.writeFileSync(path.join(root,'ai-ff/sodom.png'),'corrected sprite');stamp(root,b,when);
  const mediaChanged=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8')).assetRevisions;
  assert.notEqual(mediaChanged['ai-ff/sodom.png'],changed['ai-ff/sodom.png']);
  for(const file of Object.keys(changed).filter(f=>f!=='ai-ff/sodom.png'))assert.equal(mediaChanged[file],changed[file],'Only the edited media must be invalidated');
  const inline=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/window\.SF2BUILD=(\{[^;\r\n]*\});/)[1];
  assert.deepEqual(JSON.parse(inline).assetRevisions,mediaChanged);
  console.log('Changed code and lazy assets get fresh URLs; unchanged assets stay cached across commits; metadata and manifest match the staged build');
}finally{if(!path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'sf2-preview-build-'))throw Error('Unexpected test directory');fs.rmSync(root,{recursive:true,force:true});}
