/* Original CE Vega equipment:0x37a2e/0x97a12, loss0x39dc2,
   dropped object0x27c50..27d86. The fighter's existing atlas is unchanged. */
'use strict';
(()=>{
 const data=window.SF2VEGACLAWDATA;
 if(!data)throw new Error('Native Vega claw data is unavailable');
 const images=data.frames.map(f=>{const i=new Image();i.src=f.img;return i;});
 const ready=Promise.all(images.map(i=>i.decode()));
 const address=p=>Number.isInteger(p.anim?.source)?p.anim.source+24*p.aidx:null;
 const create=()=>({equipped:true,injuries:0,pending:false,drop:null,hitGroup:null});
 function state(p){return p.CECLAW||(p.CECLAW=create());}
 function reset(p,enabled=true){if(!enabled||p.fid!==11){delete p.CECLAW;return;}p.CECLAW=create();}
 function unequipped(p){return p.fid===11&&p.CECLAW?.equipped===false;}
 function record(p){return unequipped(p)?data.unarmedRecords[address(p)]:undefined;}
 function box(p,k){
  if(!unequipped(p)||k!==4)return undefined;
  const a=record(p);if(!a||!a[2])return null;
  return [a[0]>127?a[0]-256:a[0],a[1]>127?a[1]-256:a[1],a[2],a[3]];
 }
 function hurt(p,h){if(p.fid===11&&window.SF2.health.alive(p)){const c=state(p);if(c.equipped){c.pending=true;actor(p,h);}}}
 function actor(p,h){
  if(p.fid!==11)return;const c=state(p);if(!c.pending)return;c.pending=false;
  if(!c.equipped||!window.SF2.health.alive(p))return;
  if(c.injuries<8){c.injuries++;return;}
  if((0xdfdf>>>(h.rand()&15))&1)return;
  c.equipped=false;c.hitGroup=null;
  const players=window.SF2?.P;
  c.drop={X:(p.X>>8)<<8,Y:((p.Y>>8)+80)<<8,vx:p.FACE?-0x380:0x380,vy:0x400,ay:0x40,
   face:p.FACE,alternate:p.i===1&&players?.[0].fid===11,age:0,index:0,elapsed:0,initialized:false,visible:false};
 }
 function world(players,h){
  for(const p of players){const d=p.CECLAW?.drop;if(!d)continue;
   if(!d.initialized){d.initialized=true;h.rand();continue;}
   d.visible=true;
   if(++d.age>=256){p.CECLAW.drop=null;continue;}
   d.vy-=d.ay;d.X+=d.vx;d.Y+=d.vy;
   if(d.Y<0){d.vy=(-d.vy)>>1;d.Y=256+(d.Y&255);}
   d.elapsed++;
   while(d.elapsed>=data.drop.entries[d.index].duration){
    d.elapsed-=data.drop.entries[d.index].duration;
    if(++d.index===data.drop.entries.length)d.index=data.drop.loop;
   }
  }
 }
 function part(ctx,ref,x,y){if(!ref)return false;const im=images[ref[0]];if(!im.complete||!im.naturalWidth)return false;ctx.drawImage(im,x+ref[1],y+ref[2]);return true;}
 function draw(ctx,p,x,ground,alternate=false){
  if(p.fid!==11||unequipped(p))return false;
  const pose=data.poses[address(p)];return !!pose&&part(ctx,pose[(alternate?2:0)+(p.FACE?1:0)],x,ground);
 }
 function drawDrops(ctx,players,cam,ground){
  for(const p of players){const d=p.CECLAW?.drop;if(!d)continue;
   if(!d.visible)continue;
   part(ctx,data.drop.entries[d.index].views[(d.alternate?2:0)+(d.face?1:0)],(d.X>>8)-cam,ground-(d.Y>>8));
  }
 }
 window.SF2CEVEGACLAW={reset,world,actor,hurt,draw,drawDrops,box,record,unequipped,ready};
})();
