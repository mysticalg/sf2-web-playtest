/* Original shared actor factories and ascending task traversal,27b0/29f0/2a0c/145fc. */
'use strict';
window.SF2CEOBJECTS=(()=>{
 const factories={4:[0x9376,8,192],6:[0x9976,16,192],8:[0xa576,60,192],12:[0xd2f2,20,128]};
 function create(){const pools={};for(const [type,[base,count,stride]]of Object.entries(factories)){const slots=Array.from({length:count},(_,i)=>({address:base+stride*i,poolType:+type,used:0,main:0,phase:0,kind:0,child:0,delay:0,source:0,timer:0,x:0,y:0,vx:0,vy:0,centreX:0,centreY:0,parentX:0,parentY:0,offset:0,parent:0,variant:0,face:0,priority:0,camera:0,flags:0,palette:0,draw:false}));pools[type]={slots,free:slots.map(a=>a.address).reverse()};}return{pools,birdCount:0,task:0};}
 const actor=(s,type,address)=>s.pools[type].slots[(address-factories[type][0])/factories[type][2]];
 function allocate(s,type=8){const p=s.pools[type],address=p.free.shift();return address===undefined?null:actor(s,type,address);}
 function release(s,a){if(!a.used)throw Error('CE object double release');Object.assign(a,{used:0,main:0,phase:0,kind:0,child:0,camera:0,subtype:0,face:0,priority:0,z:0,draw:false});if(a.poolType!==12){a.variant=0;a.group=0;}s.pools[a.poolType].free.unshift(a.address);}
 function stage(s,rows){for(const e of rows){const a=allocate(s,e.pool);if(!a)continue;const x=((e.x<<16)|(a.x&65535))>>>0,y=((e.y<<16)|(a.y&65535))>>>0;Object.assign(a,e,{used:1,x,y,draw:false});}}
 function traverse(s,type,invoke){s.task++;for(const a of s.pools[type].slots)if(a.used)invoke(a,s);}
 function spawnDizzy(s,p,remaining){for(const offset of[0,8,16]){const a=allocate(s,8);if(a)Object.assign(a,{used:1,kind:0x23,child:4,offset,parent:p.i?0x86be:0x83be,variant:remaining>=140?1:0,x:0,y:0,draw:false});}}
 return{create,allocate,release,actor,stage,traverse,spawnDizzy,factories};
})();
