const assert=require('node:assert/strict'),core=require('../ai_juggles.js');
const hit={accepted:true,damage:20,direction:1,heavyKick:true,serial:1,y:0};
for(const patch of[{accepted:false},{blocked:true},{damage:0},{held:true},{dead:true},{finisher:true},{heavyKick:false}])assert.equal(core.contact(null,{...hit,...patch}),null);
let count=0;for(const start of[0,20,80,160,191.99,192,240])for(const direction of[-1,1]){
 let state=core.contact(null,{...hit,y:start,direction,airborne:start>0}),position={x:400,y:start},peak=start;
 const paused=core.step(state,position,{paused:true});assert.equal(paused.y,start);assert.equal(state.age,0);assert.equal(core.contact(state,{...hit,serial:state.serial,y:start}),state);
 let floor=false;for(let n=0;n<200;n++){const next=core.step(state,position,{left:0,right:720});position=next;peak=Math.max(peak,next.y);assert.ok(next.x>=0&&next.x<=720);assert.ok(next.y>=0);if(next.landed){floor=true;break;}}
 assert.equal(floor,true);assert.ok(peak<=Math.max(start,192)+.00001);count++;
}
let state=core.contact(null,hit),point={x:300,y:0};for(let n=0;n<100;n++){if(n%9===0)state=core.contact(state,{...hit,y:point.y,airborne:true,serial:n+2});point=core.step(state,point);assert.ok(point.y<=192.00001);assert.ok(Math.abs(state.vx)<=core.defaults.maxBack);assert.ok(state.vy<=core.defaults.maxUp);}let returned=false;for(let n=0;n<150;n++){point=core.step(state,point);if(point.landed){returned=true;break;}}assert.equal(returned,true);console.log(JSON.stringify({flightCases:count,repeatedRealContacts:12,floorReturned:returned}));
