'use strict';
const assert=require('node:assert/strict'),{create,raw}=require('../ssf2t-ai/gamepads.js');
const pad=index=>({index,connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
const p=pad(0),q=pad(3),reader=create();let checks=0;
function equal(a,b){assert.deepEqual(a,b);checks++;}
equal(reader.read([p]).masks,[0,0]);
for(const [button,mask]of [[2,16],[3,32],[5,64],[0,128],[1,256],[7,512],[15,1],[14,2],[13,4],[12,8],[9,1024],[8,2048]]){
 p.buttons[button].pressed=true;equal(raw(p),mask);equal(reader.read([p]).masks,[mask,0]);p.buttons[button].pressed=false;reader.read([p]);
}
for(const [axes,mask]of [[[.4,-.4],0],[[.5,-.5],9],[[-.5,.5],6]]){p.axes=axes;equal(reader.read([p]).masks,[mask,0]);}p.axes=[0,0];reader.read([p]);
reader.read([p,null,null,q]);q.buttons[2].pressed=true;equal(reader.read([p,null,null,q]).masks,[0,16]);
equal(reader.read([null,null,null,q]).masks,[0,16]);
equal(reader.read([null,null,null,q]).connected,[null,3]);
reader.read([p,null,null,q]);q.buttons[2].pressed=false;reader.read([p,q]);
p.buttons[9].pressed=true;
equal(reader.read([p,q],{playing:true,playersIn:3}).togglePause,true);
equal(reader.read([p,q],{paused:true,playing:true,playersIn:3}).togglePause,false);
p.buttons[9].pressed=false;reader.read([p,q],{paused:true,playing:true,playersIn:3});p.buttons[9].pressed=true;
equal(reader.read([p,q],{paused:true,playing:true,playersIn:3}).togglePause,true);
reader.reset();equal(reader.read([p]).togglePause,false);equal(reader.read([p]).masks,[0,0]);
p.buttons[9].pressed=false;reader.read([p]);p.buttons[9].pressed=true;equal(reader.read([p]).masks,[1024,0]);
p.buttons[9].pressed=false;reader.read([p]);p.buttons[8].pressed=true;
equal(reader.read([p],{paused:true,embedded:true}).back,true);equal(reader.read([p],{paused:true,embedded:true}).back,false);
equal(reader.read([]).masks,[0,0]);equal(reader.read([]).connected,[null,null]);
console.log(JSON.stringify({checks,standardSixButtonMapping:true,twoSlots:true,disconnectRelease:true,heldEntryGate:true,pauseResume:true}));
