/* Original Final Fight weapon bodies, object poses and attachments.
   Shared pickups and six-button bindings are explicit SF2 AI adaptations. */
'use strict';
window.SF2AIHeroWeapons=(()=>{
 const H=SF2AIHeroes,clone=x=>JSON.parse(JSON.stringify(x)),slots=[8,9,10,11,12,13,14,15,16,17,18,19,47,48,49,50,51,52];
 let items=[],players=[],serial=0,lastTick=-1;
 const original={bind:H.bind,reset:H.reset,step:H.step,normalStep:H.normalStep,damage:H.damage,soundCode:H.soundCode};
 const hero=p=>!!H.get(p.aiProfile),held=p=>p.AIHeroWeapon?.phase==='held'?p.AIHeroWeapon:null;
 function bare(p){if(!p.AIHeroBareAnims){p.AIHeroBareAnims=slots.map(slot=>clone(p.F.anims[slot]));p.AIHeroBareGuards=[clone(p.F.anims[3]),clone(p.F.anims[27])];}}
 function equip(p,item){
  if(item.owner!==null&&item.owner!==undefined){const old=players[item.owner];if(old&&old!==p){if(old.AIHeroWeapon===item){delete old.AIHeroWeapon;prepare(old);}if(old.AIHeroKnife===item)delete old.AIHeroKnife;}}
  p.AIHeroWeapon=item;item.owner=p.i;item.phase='held';item.age=0;item.hit=false;delete item.reserved;
  if(item.type===0)p.AIHeroKnife=item;else if(p.AIHeroKnife?.phase!=='flight')delete p.AIHeroKnife;
  prepare(p);
 }
 function resetWorld(roster,room,supply=true){
  items=[];players=roster;serial=0;lastTick=-1;
  for(const p of roster){if(!hero(p))continue;bare(p);delete p.AIHeroWeapon;delete p.AIHeroKnife;delete p.AIHeroPickup;delete p.AIHeroWeaponNormal;
   if(p.aiProfile==='cody'){const item={uid:serial++,type:0,owner:p.i,phase:'held',age:0,hit:false};items.push(item);equip(p,item);}else prepare(p);
  }
  if(supply&&roster.some(hero)){const width=room.right-room.left;for(let type=0;type<3;type++)items.push({uid:serial++,type,owner:null,phase:'floor',x:room.left+width*(type+1)/4,y:0,age:0,hit:false});}
 }
 function prepare(p){
  if(!hero(p))return;bare(p);const item=held(p),close=Math.abs((p.opp?.X??p.X)-p.X)<=80*256;
  const action=item?(item.type===0?(p.aiProfile==='cody'&&close?'weapon0':'weaponThrow'):'weapon'+item.type):null;
  const key=action||'bare';if(p.AIHeroWeaponAnimKey===key)return;p.AIHeroWeaponAnimKey=key;
  for(let i=0;i<slots.length;i++){
   const strength=i%3,animation=action?H.weaponNormal(p,action,strength):clone(p.AIHeroBareAnims[i]);
   if(action){if(action==='weaponThrow')for(const entry of animation.ents){entry[6]=[0,0,0,0];entry[7]=0;}animation.heroWeapon=item.type;animation.heroKnifeThrow=action==='weaponThrow';animation.name=action==='weaponThrow'?'Hero Knife Throw':'Hero '+['Knife','Katana','Pipe'][item.type]+' '+strength;}
   p.F.anims[slots[i]]=animation;
  }
  for(let i=0;i<2;i++){const animation=clone(p.AIHeroBareGuards[i]);if(item){const pickup=H.get(p.aiProfile).data.nativeActions.pickup[0][0];for(const e of animation.ents)e[0]=pickup;}p.F.anims[i?27:3]=animation;}
 }
 function loose(p){return items.filter(item=>item.phase==='floor'&&!item.reserved).sort((a,b)=>Math.abs(a.x-p.X/256)-Math.abs(b.x-p.X/256))[0];}
 function pickup(p,h){
  if(!hero(p)||![0,3,4].includes(p.ST)||!(h.keys&8)||!(h.nw&112))return false;
  const item=loose(p);if(!item||Math.abs(p.X/256-item.x)>22||Math.abs(p.Y/256-item.y)>18)return false;
  item.reserved=p.i+1;p.AIHeroPickup={uid:item.uid,age:0};p.ST=11;p.MV={kind:'ff',hero:true,style:'hero-weapon-pickup',a:121};p.AIHeroMove={style:'weapon-pickup',age:0};h.anim(p,121,0);return true;
 }
 function disarm(p,dir){const item=held(p);if(!item)return false;Object.assign(item,{phase:'toss',x:p.X/256,y:p.Y/256+65,vx:dir*3,vy:4.5,age:0,hit:false});delete p.AIHeroWeaponNormal;prepare(p);return true;}
 function stepWorld(room,tick){
  if(lastTick===tick)return;lastTick=tick;
  for(const item of items){if(item.phase==='held')continue;item.age++;if(item.phase==='floor')item.y=room.floor?.(item.x)||0;
   if(item.phase==='flight'){item.x+=item.vx;if(item.hit||item.x<room.left+15||item.x>room.right-15){item.phase='toss';item.vx=-Math.sign(item.vx)*1.5;item.vy=2.8;item.hit=false;}}
   else if(item.phase==='toss'){item.x=Math.max(room.left+12,Math.min(room.right-12,item.x+item.vx));item.y+=item.vy;item.vy-=.28;const floor=room.floor?.(item.x)||0;if(item.y<=floor){item.y=floor;item.x=Math.max(room.left+76,Math.min(room.right-76,item.x));item.phase='floor';item.vx=item.vy=0;}}

  }
  for(const owner of players){if(!hero(owner))continue;const flight=items.find(item=>item.owner===owner.i&&item.type===0&&item.phase==='flight'&&!item.hit);owner.FBON=flight?1:0;if(flight){owner.FBK='hero-knife';owner.FBX=Math.round(flight.x*256);owner.FBY=Math.round(flight.y*256);owner.FBVX=Math.round(flight.vx*256);}}
 }
 function normalStep(p,h={}){
  original.normalStep(p);if(!hero(p))return;
  const pickupState=p.AIHeroPickup;if(pickupState&&(p.ST!==11||p.MV?.style!=='hero-weapon-pickup')){const item=items.find(q=>q.uid===pickupState.uid);if(item)delete item.reserved;delete p.AIHeroPickup;}
  if(p.ST===1&&p.anim.heroKnifeThrow){
   const key=p.cur+':'+p.AIAttackSerial;
   if(p.aidx>=1&&p.AIHeroWeaponNormal!==key&&held(p)?.type===0){p.AIHeroWeaponNormal=key;H.launchKnife(p);}
  }else if(p.ST!==1)delete p.AIHeroWeaponNormal;
  if([0,3,4].includes(p.ST))prepare(p);
 }
 function step(p,h){
  if(p.MV?.style!=='hero-weapon-pickup'){original.step(p,h);return;}
  const state=p.AIHeroPickup;if(!state){delete p.AIHeroMove;h.idle(p);return;}state.age++;
  if(state.age===12){const item=items.find(q=>q.uid===state.uid);if(item?.phase==='floor'&&item.reserved===p.i+1&&Math.abs(p.X/256-item.x)<=24&&Math.abs(p.Y/256-item.y)<=18){
    const old=held(p);if(old){Object.assign(old,{phase:'floor',owner:null,x:p.X/256+(p.FACE?-12:12),y:0,age:0});delete p.AIHeroWeapon;delete p.AIHeroKnife;}
    equip(p,item);h.sound?.(14);
   }else if(item)delete item.reserved;
  }
  if(state.age>=20){delete p.AIHeroPickup;delete p.AIHeroMove;h.idle(p);}
 }
 function drawItem(ctx,item,camera,ground,frame,x,y,face){
  const art=H.weaponArt(item.type),r=art.frames[frame];if(!r)return;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x-camera),Math.round(ground-y));if(face)ctx.scale(-1,1);ctx.drawImage(art.image,...r.slice(0,4),r[4],r[5],r[2],r[3]);ctx.restore();
 }
 function extraDraw(ctx,p,camera,ground){
  const item=held(p);if(!item)return;const who=H.ids().indexOf(p.aiProfile),frameIndex=p.anim?.ents[p.aidx]?.[0],low=p.F.heroCrouch?.find(q=>q.frame===frameIndex),pose=H.get(p.aiProfile).data.nativeFrames[low?.upper??frameIndex]?.weaponPose;
  const row=SF2AIHeroesData.weapons.sourceDefinitions[item.type].attachments[who]?.[pose&127];if(!row)return;
  const art=H.weaponArt(item.type),frame=art.data.entryToFrame[row[2]];if(frame===undefined)return;
  drawItem(ctx,item,camera,ground,frame,p.X/256+(p.FACE?1:-1)*row[0],p.Y/256+row[1]-(low?.shiftY||0),p.FACE);
 }
 function worldDraw(ctx,camera,ground){for(const item of items){if(item.phase==='held')continue;const art=H.weaponArt(item.type),action=item.phase==='floor'?art.data.actionData.idle:item.phase==='flight'&&art.data.actionData.flight?art.data.actionData.flight:art.data.actionData.drop;
   const entry=action.entries[item.phase==='toss'?Math.floor(item.age/3)%action.entries.length:0];drawItem(ctx,item,camera,ground,entry.frame,item.x,item.y,item.vx>0?1:0);
  }}
 function cpu(p,danger){if(!hero(p)||held(p)||danger||p.HP<=0)return null;const item=loose(p);if(!item)return null;const dx=item.x-p.X/256;return Math.abs(dx)<=22?8|16:dx>0?2:1;}
 H.bind=(p,native,id)=>{original.bind(p,native,id);delete p.AIHeroBareAnims;delete p.AIHeroWeaponAnimKey;bare(p);};
 H.reset=p=>{original.reset(p);delete p.AIHeroWeapon;delete p.AIHeroPickup;delete p.AIHeroWeaponAnimKey;delete p.AIHeroWeaponNormal;};
 H.knifeContacts=p=>items.filter(item=>item.owner===p.i&&item.type===0&&item.phase==='flight'&&!item.hit).map(item=>({knife:item,box:[item.x,item.y,8,4],damage:24,direction:item.vx>0?1:-1}));
 H.projectileClash=p=>{const item=items.find(item=>item.owner===p.i&&item.type===0&&item.phase==='flight'&&!item.hit);if(!item)return false;item.phase='toss';item.vx=-Math.sign(item.vx)*1.5;item.vy=2.8;item.hit=false;p.FBON=0;return true;};
 H.step=step;H.normalStep=normalStep;H.disarm=disarm;H.knifePickup=pickup;H.knifeCPU=cpu;H.extraDraw=extraDraw;
 H.damage=(p,strength)=>p.anim?.heroWeapon!==undefined&&p.ST===1?H.get(p.aiProfile).normalDamage[Math.min(2,strength)]+[5,7,8][p.anim.heroWeapon]:original.damage(p,strength);
 H.soundCode=(p,kind)=>kind==='hit'&&p.anim?.heroWeapon!==undefined?16:original.soundCode(p,kind);
 function cancelFlights(owner=null,room={left:0,right:720}){const id=typeof owner==='number'?owner:owner?.i;let count=0;for(const item of items){if(id!==undefined&&id!==null&&item.owner!==id||!['flight','toss'].includes(item.phase))continue;Object.assign(item,{phase:'floor',x:Math.max(room.left+76,Math.min(room.right-76,item.x)),y:room.floor?.(item.x)||0,vx:0,vy:0,hit:false});count++;}for(const p of players)if(id===undefined||id===null||p.i===id)p.FBON=0;return count;}
 return{resetWorld,stepWorld,worldDraw,pickup,prepare,disarm,held,cancelFlights,settleOwned:cancelFlights,hasKnife:p=>held(p)?.type===0,validMove:(p,m)=>!['hero-knife','hero-knife-throw'].includes(m?.style)||held(p)?.type===0,clear(){items=[];players=[];lastTick=-1;},info:()=>items.map(item=>({...item}))};
})();
