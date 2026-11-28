// SPDX-License-Identifier: GPL-3.0-only
/* Verified browser runtime assets, prepared once from the original local set. */
'use strict';
window.SSF2TLoadBundledAssets=async function(mod,notify=()=>{}){
 const meta=window.SSF2TBundledAssets;
 if(!meta)throw Error('The Turbo game assets are unavailable.');
 const sha=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(b=>b.toString(16).padStart(2,'0')).join('');
 notify('Loading Super Street Fighter II Turbo...');
 const response=await fetch(meta.file+'?v='+meta.sha256.slice(0,16));
 if(!response.ok)throw Error('Turbo game assets could not load. Please retry.');
 const packed=new Uint8Array(await response.arrayBuffer());
 if(packed.length!==meta.bytes||await sha(packed)!==meta.sha256)throw Error('Turbo game assets did not pass verification. Please reload.');
 const bytes=new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
 if(bytes.length!==meta.decodedBytes||new TextDecoder().decode(bytes.subarray(0,8))!=='SF2TPK01')throw Error('The Turbo game package is incomplete.');
 const regions={},verified={};let offset=8;
 for(const [name,length]of [['program',0x400000],['graphics',0x1000000],['sound',0x40000],['samples',0x400000]]){
  const data=bytes.subarray(offset,offset+length);offset+=length;
  verified[name]=await sha(data);
  if(verified[name]!==SSF2TROMManifest.regions[name])throw Error('Turbo '+name+' assets did not pass verification.');
  regions[name]=data;
 }
 notify('Starting Super Street Fighter II Turbo...');
 const pointers=[];
 try{
  for(const data of Object.values(regions)){const ptr=mod._malloc(data.length);if(!ptr)throw Error('There is not enough memory to start Turbo.');mod.HEAPU8.set(data,ptr);pointers.push(ptr);}
  if(!mod._ssf_load(...pointers))throw Error('Turbo could not initialise.');
  const ptr=mod._ssf_rom_ptr(1);verified.opcodes=await sha(mod.HEAPU8.slice(ptr,ptr+0x400000));
  if(verified.opcodes!==SSF2TROMManifest.regions.opcodes)throw Error('The Turbo program did not pass verification.');
 }finally{pointers.forEach(ptr=>mod._free(ptr));}
 return Object.freeze({set:SSF2TROMManifest.set,edition:SSF2TROMManifest.edition,verifiedFiles:SSF2TROMManifest.files.length,regions:verified,source:'bundled'});
};
