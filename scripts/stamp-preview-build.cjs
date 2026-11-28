'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function stamp(directory,commit,builtAt=new Date().toISOString()){
  if(!/^[a-f0-9]{40}$/i.test(commit||''))throw new Error('A full Git commit is required');
  const root=path.resolve(directory),manifest=path.join(root,'build.json');
  const previous=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const assetRevisions={};
  for(const file of ['assets_ce.js','screens_ce.js','endings_ce.js']){
    const target=path.join(root,file);
    if(fs.existsSync(target))assetRevisions[file]=hash(target).slice(0,16);
  }
  // Guest media is requested dynamically, outside the HTML reference rewrite.
  // Keep unchanged art/audio cached while invalidating an edited file itself.
  const media=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?media(path.join(dir,e.name)):e.isFile()&&/\.(png|mp3)$/i.test(e.name)?[path.join(dir,e.name)]:[]);
  for(const name of ['ai-ff','ai-heroes','ai-effects']){
    const directory=path.join(root,name);
    if(fs.existsSync(directory))for(const file of media(directory))assetRevisions[path.relative(root,file).split(path.sep).join('/')]=hash(file).slice(0,16);
  }
  const meta={status:previous.status,version:previous.version,commit,builtAt,assetRevisions};
  const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]);
  const files=walk(root).sort();let stamped=0;
  for(const file of files.filter(f=>f.endsWith('.html'))){
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/window\.SF2BUILD=\{[^;\r\n]*\};/,()=>`window.SF2BUILD=${JSON.stringify(meta)};`);
    html=html.replace(/\b(src|href)=(['"])([^'"<>]+)\2/g,(whole,attribute,quote,value)=>{
      if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value))return whole;
      const [withoutFragment,fragment]=value.split('#'),[name,query]=withoutFragment.split('?');
      if(!/\.(js|css)$/i.test(name))return whole;
      const target=name.startsWith('/')?path.resolve(root,name.slice(1)):path.resolve(path.dirname(file),name);
      if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return whole;
      const params=new URLSearchParams(query||'');params.set('v',hash(target).slice(0,16));stamped++;
      return `${attribute}=${quote}${name}?${params}${fragment===undefined?'':'#'+fragment}${quote}`;
    });
    fs.writeFileSync(file,html);
  }
  const records=files.filter(f=>f!==manifest).map(file=>({file:path.relative(root,file).split(path.sep).join('/'),bytes:fs.statSync(file).size,sha256:hash(file)}));
  fs.writeFileSync(manifest,JSON.stringify({...meta,files:records},null,2)+'\n');
  return{commit,references:stamped,files:records.length};
}
if(require.main===module)console.log(stamp(process.argv[2],process.argv[3]));
module.exports={stamp};
