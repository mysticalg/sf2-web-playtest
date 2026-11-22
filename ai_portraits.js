/* AI portrait material binding. Original geometry, alpha, hair and details stay. */
'use strict';
window.SF2AIPORTRAITS=(()=>{
 const rows=window.SF2AIPORTRAITDATA?.rows||[],sources=new WeakMap(),decoded=new Map(),recent=[];
 const checksum=s=>{let v=2166136261;for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619)>>>0;return v;};
 function mask(row){
  if(decoded.has(row))return decoded.get(row);
  const bytes=atob(row.rle),out=new Uint8Array(row.width*row.height);let at=0;
  for(let i=0;i<bytes.length;i+=2){const n=bytes.charCodeAt(i),code=bytes.charCodeAt(i+1);out.fill(code,at,at+n);at+=n;}
  if(at!==out.length)throw Error('Invalid source-bound AI portrait mask');decoded.set(row,out);return out;
 }
 function image(im,fid,kind,p){
  if(!im?.complete||!im.naturalWidth||!p?.AIPalette)return im;
  let entry=sources.get(im);
  if(!entry){const hash=checksum(im.src);entry={row:rows.find(r=>r.fid===fid&&r.kind===kind&&r.source===hash&&r.width===im.naturalWidth&&r.height===im.naturalHeight),variants:new Map()};sources.set(im,entry);if(!entry.row)console.error('AI portrait source/mask mismatch',fid,kind);}
  if(!entry.row)return im;
  const choice=p.AIColorChoice||{},original=p.sourcePalette||p.F.pal;
  const palette=p.AIPalette.map((rgb,i)=>({skin:choice.skin===-2?original[i]:rgb,clothing:choice.clothing===-2?original[i]:rgb}));
  const key=palette.map(c=>c.skin.join(',')+'/'+c.clothing.join(',')).join(';');
  if(entry.variants.has(key)){const i=recent.findIndex(q=>q.entry===entry&&q.key===key);if(i>=0)recent.push(...recent.splice(i,1));return entry.variants.get(key);}
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const pixels=x.getImageData(0,0,c.width,c.height),a=pixels.data,codes=mask(entry.row);
  for(let i=0;i<codes.length;i++){const code=codes[i];if(!code)continue;const value=palette[code&15][code>>4===1?'skin':'clothing'],at=i*4;a[at]=value[0];a[at+1]=value[1];a[at+2]=value[2];}
  x.putImageData(pixels,0,0);entry.variants.set(key,c);recent.push({entry,key});if(recent.length>32){const old=recent.shift();old.entry.variants.delete(old.key);}return c;
 }
 return{image,scope:'Chosen body skin/clothing palette indices only; protected original portrait detail/alpha retained; AI only',get cacheSize(){return recent.length;}};
})();
