// SF2 browser port of the M5 ARM2 build (Ryu vs Ken). Logic mirrors m5/m5.s, run at 60Hz (1 ROM tick per step).

// Things M5 did once per 25fps frame (AI, knockback decay, push, round-phase frame counter) run on the same

// 12-ticks-per-5-frames cadence so the gameplay matches. Capcom assets, personal local use only.

'use strict';

const D=window.SF2DATA, W=384, H=224, GROUND=200, OFS=224, SW=D.stage_w;

/* M13 normals frame data, measured in the box emulator (P1 anim pointer ff83e0, 8 selectable fighters x 12 far normals):

   startup and active entries run their ROM durations from the press frame, but the last (recovery-end) entry hands back

   to neutral after 1 frame (Chun-Li 2) instead of its ROM count; Chun far sHP holds its active pose 19f. 42/46 within 1f. */

D.fighters.forEach((f,fi)=>{for(const j of [8,9,10,11,12,13,14,15,16,17,18,19,47,48,49,50,51,52]){const e=f.anims[j]&&f.anims[j].ents;if(e&&e.length>1)e[e.length-1][1]=fi===5?2:1;}

 if(fi===5&&f.anims[10].ents.length>2)f.anims[10].ents[2][1]=19; /* M13f: Dhalsim close LK/MK recovery entry 3f like the arcade (active 8f + hit freeze matched) */ if(fi===7)[50,51].forEach(i=>{const e=f.anims[i]&&f.anims[i].ents;if(e&&e.length>3)e[2][1]=3;});});

const K_L=1,K_R=2,K_U=4,K_D=8,K_ATK=16;

const S_FREE=0,S_ATK=1,S_AIR=2,S_CR=3,S_UP=4,S_HIT=5,S_BLK=6,S_DOWN=7,S_KO=8,S_WIN=9,S_GETUP=10,S_SPEC=11;

const AN_IDLE=0,AN_WALKF=1,AN_WALKB=2,AN_CROUCH=3,AN_STANDUP=4,AN_JUMPN=5,AN_JUMPF=6,AN_JUMPB=7,AN_SLP=8,AN_CLP=14,

 AN_HITL=20,AN_CHITL=23,AN_BLOCKS=26,AN_BLOCKC=27,AN_FALL=28,AN_GETUP=30,AN_WIN=31,AN_HADO=32,AN_SHO=35,AN_TATS=38,AN_TAT=39,AN_TATLAND=42,AN_THROW=46;

const MAXHP=144;

// Native CE health is signed: zero remains alive, underflow marks the KO.

function hpAlive(p){return VER.edition==='ce'?p.HP>=0:p.HP>0;}

function hpDamage(p,amount,effect=null){const alive=hpAlive(p);p.HP=Math.max(VER.edition==='ce'?-1:0,p.HP-amount);if(alive&&!hpAlive(p)){ffSound(p,'ko');aiDeathBegin(p,effect);}return p.HP;}

// Explicit per-player identity; base fid remains 0 for inherited CE tables.

const AICFG={configured:false,prototype:false,selectedProfiles:[null,null],colors:[null,null],profiles:['ryu','ryu'],training:true,mode:'versus',dummy:'stand'};

// Presentation-only KO effects: separate state and cosmetic hashes, no combat RNG.
const AI_DEATH_FX=[];
const AI_KO_TRAIL={life:40,opacity:.76,max:18,duration:200};
let AI_SKO_VIEW=null;
function aiSKOView(){
  if(!aiEnabled()||G.scene!=='fight'||!AI_SKO_VIEW||!hpAlive(P[AI_SKO_VIEW.slot]))return null;
  const age=G.tick-AI_SKO_VIEW.start,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const weight=smooth(age/18)*(1-smooth((age-160)/60));
  return weight>0?{slot:AI_SKO_VIEW.slot,weight}:null;
}
const AI_BLOOD={particles:[],stains:[],lastTick:-1,drips:[0,0],clothes:[0,0],serial:0};
const AI_RETCH=[null,null],AI_TEETH=[null,null],AI_FLOOR_COUGHS=[null,null];
const AI_SPECIAL_VOICES=[null,null];
function aiBloodReset(){AI_RETCH.fill(null);AI_TEETH.fill(null);AI_FLOOR_COUGHS.fill(null);AI_BLOOD.particles.length=AI_BLOOD.stains.length=0;AI_BLOOD.lastTick=-1;AI_BLOOD.drips=[0,0];AI_BLOOD.clothes=[0,0];AI_BLOOD.serial=0;AI_SPECIAL_VOICES.fill(null);aiEchoStop();}
function aiFXHash(seed,id){let h=SF2AIRULES.hash(seed,id);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return(h^(h>>>16))>>>0;}
function aiBloodAdd(particles,owner){
  for(const p of particles){const id=AI_BLOOD.serial++;p.depth=SF2AIRULES.hash(id,'blood-floor')%7;p.life=140;p.landed=false;p.owner=owner;p.clothEligible=p.clothEligible??(aiFXHash(id,'cloth')%3===0);AI_BLOOD.particles.push(p);}
  if(AI_BLOOD.particles.length>384)AI_BLOOD.particles.splice(0,AI_BLOOD.particles.length-384);
}
function aiBloodBurst(p,strength=1,drip=false,special=false){
  if(!aiEnabled()||G.scene!=='fight')return;const mouth=aiMouth(p);if(!mouth)return;
  const seed=SF2AIRULES.hash(G.tick,'face-blood:'+p.i+':'+AI_BLOOD.serial),dir=p.FACE?1:-1;
  const particles=Array.from({length:drip?2:special?30+strength*4:strength===2?26:6+strength*3},(_,i)=>{const h=aiFXHash(seed,i),r=(h&65535)/65535,q=(h>>>16)/65535;return{x:mouth.x,y:mouth.y,vx:drip?dir*.12:dir*(1+r*2.8),vy:drip?-.2:1+q*2.8,size:drip?1:1+(h%2),tick:G.tick,clothEligible:!drip&&i%4===0,color:['#b20b22','#d3132b','#ed263c'][i%3]};});
  aiBloodAdd(particles,p.i);if(!drip)aiClothesStain(p,1);
}
// A short mouth stream accompanies the existing body-hit/knockdown recoil.
// Cosmetic only: it never holds a fighter in hitstun or changes combat RNG.
function aiRetchBegin(p,strength,region,damage){
  if(!aiEnabled()||G.scene!=='fight'||damage<=0||strength<2)return;
  if(region===0)AI_TEETH[p.i]={start:G.tick,selector:0,anchor:0};
  if(region!==1&&p.HP>aiMax(p)*.2)return;
  const bloody=p.HP<aiMax(p)*.35,selector=bloody?1:2+(aiFXHash(G.tick,p.i+':vomit-colour')&1);
  AI_RETCH[p.i]={start:G.tick,bloody,selector,anchor:region===0?0:1,last:-1};
}
function aiRetchFrame(r){
  let age=G.tick-r.start;if(r.selector===0){if(age>=30)return null;age%=10;}
  for(const e of SF2AIREELDATA.animations[r.selector].entries){
    if(e.terminal)return null;
    if(age<e.ticks)return SF2AIREELDATA.frames[e.frame];age-=e.ticks;
  }
  return null;
}
function aiRetchStep(){
  for(const p of P){const r=AI_TEETH[p.i];if(r&&(!aiRetchFrame(r)||G.tick-r.start>2&&![S_HIT,S_DOWN,S_KO].includes(p.ST)))AI_TEETH[p.i]=null;}
  for(const p of P){const r=AI_RETCH[p.i];if(!r)continue;const age=G.tick-r.start;
    if(!aiRetchFrame(r)||age>2&&![S_HIT,S_DOWN,S_KO].includes(p.ST)){
      // A few residual drops retain the requested persistent floor splashes;
      // the visible mouth animation is entirely the recovered ROM sprite art.
      const mouth=aiMouth(p);if(mouth){const dir=p.FACE?1:-1;
        aiBloodAdd(Array.from({length:5},(_,i)=>({x:mouth.x,y:mouth.y,vx:dir*(.3+i*.22),vy:-.5,size:1,tick:G.tick,nativeRetch:true,clothEligible:false,color:r.bloody?'#d3132b':['#e4b35a','#aea38c'][r.selector-2]})),p.i);
      }
      AI_RETCH[p.i]=null;
    }
  }
}
function aiRetchDraw(camera,ground,view){
  if(!aiEnabled())return;
  for(const p of view)for(const r of [AI_RETCH[p.i],AI_TEETH[p.i]]){const f=r&&aiRetchFrame(r);if(!f||r.selector===0&&(G.tick-r.start)%3===2)continue;
    const index=SF2AIREELDATA.frames.indexOf(f),im=AI_REEL_IMAGES[index],offset=SF2AIREELDATA.anchors[p.fid],n=r.anchor*2;
    const x=p.X/256+(p.FACE?-offset[n]:offset[n]),y=p.Y/256+offset[n+1];
    spr(im,[0,0,f.width,f.height,f.x,f.y],Math.floor(x)-camera,ground-Math.floor(y),p.FACE);
  }
}
function aiBloodStep(){
  if(!aiEnabled()||G.scene!=='fight'){AI_BLOOD.particles.length=AI_BLOOD.stains.length=0;aiEchoStop();return;}
  if(AI_BLOOD.lastTick===G.tick)return;AI_BLOOD.lastTick=G.tick;aiRetchStep();aiFloorCoughStep();
  SF2CEPROJECTILES.stepContactEffects(G.tick);
  if(G.gph===1)for(const p of P){
    if(hpAlive(p)&&p.HP<=aiMax(p)*.2){if(G.tick>=AI_BLOOD.drips[p.i]){aiBloodBurst(p,0,true);AI_BLOOD.drips[p.i]=G.tick+8+SF2AIRULES.hash(G.tick,'drip:'+p.i)%5;}}
    else AI_BLOOD.drips[p.i]=G.tick+12;
  }
  for(const p of AI_BLOOD.particles){const t=G.tick-p.tick;if(p.landed||t>=p.life)continue;
    if(t>2&&p.clothEligible){const wearer=aiClothesHit(p.x+p.vx*t,p.y+p.vy*t-.13*t*t,p.owner);if(wearer){aiClothesStain(wearer,1);p.landed=true;continue;}}
    if(p.y+p.vy*t-.13*t*t<=-p.depth){
      p.landed=true;const camera=Math.floor(G.cam),landX=p.x+p.vx*t,zero=aiBloodFloorX({x:camera,depth:p.depth},camera),scale=aiBloodFloorX({x:camera+1,depth:p.depth},camera)-zero;
      const stain={x:camera+(landX-camera-zero)/(scale||1),depth:p.depth,size:p.size+1,color:p.color};
      if(AI_BLOOD.stains.length<1536)AI_BLOOD.stains.push(stain);
      else{const closest=AI_BLOOD.stains.reduce((a,b)=>Math.abs(b.x-stain.x)<Math.abs(a.x-stain.x)?b:a);closest.size=Math.min(6,closest.size+.2);}
    }
  }
  AI_BLOOD.particles=AI_BLOOD.particles.filter(p=>!p.landed&&G.tick-p.tick<p.life);
}
function aiBloodFloorX(stain,camera){if(aiFFStage())return stain.x-camera;
  const y=GROUND+stain.depth,map=window.SF2CESTAGESCROLL,stage=map?.data.stages.find(s=>s.stage===G.stage),floor=stage?.layers.find(l=>l.nativeLayer===2);
  if(floor){const ground=map.mapX(G.stage,floor.index,camera,GROUND),row=map.mapX(G.stage,floor.index,camera,y),delta=((row-ground+floor.width/2)%floor.width+floor.width)%floor.width-floor.width/2,scale=G.stage===5&&aiViewWidth()>W?map.view(G.stage,floor.index,camera,aiViewWidth(),y).scale:1;return(stain.x-camera-delta)*scale;}
  const layer=D.stages[G.stage].find(l=>l.rows?.some(r=>r[0]<=GROUND&&r[1]>GROUND)),at=depth=>layer?.rows.find(r=>r[0]<=depth&&r[1]>depth);
  const row=at(y),ground=at(GROUND),delta=row&&ground?Math.round(row[2]*camera+row[3])-Math.round(ground[2]*camera+ground[3]):0;
  return stain.x-camera-delta;
}
function aiBloodDraw(camera,ground,stains=false){
  if(!aiEnabled())return;cx.save();
  if(stains){cx.globalAlpha=.94;for(const s of AI_BLOOD.stains){const x=Math.round(aiBloodFloorX(s,camera)),y=ground+s.depth,h=aiFXHash(Math.floor(s.x*256),'floor:'+s.depth);cx.fillStyle=s.color;
    if(h%3===0){cx.fillRect(x,y,1,1);cx.fillRect(x+2,y+1,1,1);if(s.size>2)cx.fillRect(x-2,y,1,1);}
    else if(h%3===1)cx.fillRect(x-1,y,Math.min(4,Math.ceil(s.size)),1);
    else{cx.fillRect(x,y,1,2);if(s.size>2)cx.fillRect(x-1,y+1,2,1);}
  }}else for(const p of AI_BLOOD.particles){const t=G.tick-p.tick;if(p.landed||t>=p.life)continue;const x=Math.floor(p.x+p.vx*t)-camera,y=ground-Math.floor(p.y+p.vy*t-.13*t*t),vy=p.vy-.26*t,speed=Math.hypot(p.vx,vy);cx.fillStyle=p.color;
    if(speed>2){const length=Math.min(p.retch?5:3,Math.floor(speed/1.5));cx.globalAlpha=p.retch?.9:.55;for(let n=1;n<=length;n++)cx.fillRect(x-Math.round(p.vx/speed*n),y+Math.round(vy/speed*n),1,1);}
    cx.globalAlpha=.98;cx.fillRect(x,y,Math.min(2,p.size),1+(p.size>1?1:0));
  }
  cx.restore();
}
const AI_CLOTH_SOURCES=new WeakMap(),AI_CLOTH_FRAMES=new WeakMap();
function aiClothesStain(p,amount=1){if(aiEnabled())AI_BLOOD.clothes[p.i]=Math.min(16,AI_BLOOD.clothes[p.i]+amount);}
function aiClothFrame(p,art){
  const source=AI_CLOTH_SOURCES.get(art.image);if(!source)return null;
  let frames=AI_CLOTH_FRAMES.get(art.image);if(!frames){frames=new Map();AI_CLOTH_FRAMES.set(art.image,frames);}
  const key=p.fighterKey+':'+art.rect.slice(0,4).join(',');if(frames.has(key))return frames.get(key);
  const [sx,sy,w,h]=art.rect,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(art.image,sx,sy,w,h,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h);
  ctx.clearRect(0,0,w,h);ctx.drawImage(source.image,sx,sy,w,h,0,0,w,h);const original=ctx.getImageData(0,0,w,h).data;
  const clothing=new Set(SF2AIRULES.clothing(p.fighterKey)),skin=new Set(SF2AIRULES.skin(p.fighterKey)),indices=new Set([...clothing,...skin]),rgb=q=>(q[0]<<16)|(q[1]<<8)|q[2];
  // Skin and clothing accept blood; ambiguous colours shared with hair or
  // equipment remain untouched. Transparent pixels always remain transparent.
  const allowed=(set)=>new Set(source.palette.flatMap((q,i)=>set.has(i)&&!source.palette.some((other,j)=>!indices.has(j)&&rgb(q)===rgb(other))?[rgb(q)]:[]));
  const colors=allowed(indices),skinColors=allowed(skin),clothingColors=allowed(clothing),mask=new Uint8Array(w*h),cloth=[],skinPixels=[],clothingPixels=[];
  for(let i=0;i<mask.length;i++){const color=(original[i*4]<<16)|(original[i*4+1]<<8)|original[i*4+2];if(original[i*4+3]&&colors.has(color)){mask[i]=1;cloth.push(i);if(skinColors.has(color))skinPixels.push(i);if(clothingColors.has(color))clothingPixels.push(i);}}
  const frame={w,h,pixels,mask,cloth,skinPixels,clothingPixels,variants:new Map()};frames.set(key,frame);if(frames.size>128)frames.delete(frames.keys().next().value);return frame;
}
function aiClothesArt(p,art){
  const amount=AI_BLOOD.clothes[p.i];if(!amount)return art;const frame=aiClothFrame(p,art);if(!frame?.cloth.length)return art;
  let image=frame.variants.get(amount);if(!image){
    image=document.createElement('canvas');image.width=frame.w;image.height=frame.h;const ctx=image.getContext('2d'),data=new ImageData(new Uint8ClampedArray(frame.pixels.data),frame.w,frame.h),seed=SF2AIRULES.hash(p.i+37,p.fighterKey+':'+art.rect.slice(0,4));
    // Small discrete marks replace the former large ellipses. Use a crimson
    // palette shaded by luminance, never mixed with the costume/skin hue.
    const paint=(x,y,hash,edge=false)=>{
      if(x<0||y<0||x>=frame.w||y>=frame.h)return;const i=y*frame.w+x;if(!frame.mask[i])return;
      const shade=(frame.pixels.data[i*4]*.2126+frame.pixels.data[i*4+1]*.7152+frame.pixels.data[i*4+2]*.0722)/255;
      const red=(edge?158:184)+Math.round(shade*38)+(hash%13),green=edge?7:11,blue=edge?22:29;
      data.data[i*4]=red;data.data[i*4+1]=green;data.data[i*4+2]=blue;
    };
    for(let spot=0;spot<amount;spot++){
      const h=aiFXHash(seed,spot),pool=spot%3===1&&frame.skinPixels.length?frame.skinPixels:frame.clothingPixels.length?frame.clothingPixels:frame.cloth,centre=pool[h%pool.length],x=centre%frame.w,y=Math.floor(centre/frame.w),style=(h>>>28)%4;
      if(style===0){ // fine scattered speckles
        paint(x,y,h);for(let n=0;n<3+(h%3);n++){const q=aiFXHash(h,n);paint(x+(q%7)-3,y+((q>>>8)%7)-3,q,true);}
      }else if(style===1){ // a tiny irregular spot, one to three pixels across
        const radius=1+(h%2);for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(dx*dx+dy*dy<=radius*radius&&((dx===0&&dy===0)||aiFXHash(h,dx+dy*7)%4!==0))paint(x+dx,y+dy,h,dx*dx+dy*dy>1);
      }else if(style===2){ // narrow gravity streak with a rounded end
        const length=3+(h%5),lean=(h>>>8)%3-1;for(let n=0;n<length;n++)paint(x+Math.round(lean*n/4),y+n,h,n<length-2);paint(x+Math.round(lean*(length-1)/4)+1,y+length-1,h);
      }else{ // short fine splash line
        const length=2+(h%4),direction=h&1?1:-1;for(let n=0;n<length;n++)paint(x+n*direction,y+Math.floor(n/3),h,n>0);
      }
    }
    ctx.putImageData(data,0,0);frame.variants.set(amount,image);if(frame.variants.size>3)frame.variants.delete(frame.variants.keys().next().value);
  }
  return{...art,image,rect:[0,0,frame.w,frame.h,art.rect[4],art.rect[5]]};
}
const AI_FACE_IMAGES=new WeakMap();
function aiFaceInjuryLevel(p){const ratio=p.HP/aiMax(p);return !aiEnabled()||ratio>=.2?0:Math.min(10,1+Math.floor((.2-Math.max(0,ratio))/.02));}
function aiFaceRegion(p,art){
  const r=art.rect,head=boxw(p,0);
  if(isFFGuest(p)){const mouth=ffMouth(p);return{x:(mouth.x-p.X/256)*(p.FACE?-1:1)-r[4]+2,y:p.Y/256-mouth.y-r[5]-4,rx:7,ry:6};}
  if(head)return{x:(head[0]-p.X/256)*(p.FACE?-1:1)-r[4]-head[2]*.22,y:p.Y/256-head[1]-r[5]+head[3]*.22,rx:Math.max(4,head[2]*.7),ry:Math.max(4,head[3]*.65)};
  const point=p.cur===AN_FALL+1?AI_LIE_MOUTHS[p.fid]:p.cur===AN_FALL?AI_KO_MOUTHS[p.fid]?.[p.aidx]:null;
  if(!point)return null;return{x:point[0]-1,y:point[1]-3,rx:5,ry:4};
}
function aiFaceInjuryArt(p,art,base){
  const level=aiFaceInjuryLevel(p);if(!level)return art;const region=aiFaceRegion(p,base),severity=(level-1)/9,face=region?{...region,rx:region.rx*(.9+.3*severity),ry:region.ry*(.9+.25*severity)}:null,frame=face&&aiClothFrame(p,base);if(!frame?.skinPixels.length)return art;
  let cache=AI_FACE_IMAGES.get(art.image);if(!cache){cache=new Map();AI_FACE_IMAGES.set(art.image,cache);}
  const key=[...art.rect,level,face.x,face.y,face.rx,face.ry].join(':');let image=cache.get(key);
  if(!image){image=document.createElement('canvas');image.width=frame.w;image.height=frame.h;const ctx=image.getContext('2d');ctx.drawImage(art.image,...art.rect.slice(0,4),0,0,frame.w,frame.h);
    const data=ctx.getImageData(0,0,frame.w,frame.h),original=new Uint8ClampedArray(data.data);
    for(const i of frame.skinPixels){const x=i%frame.w,y=Math.floor(i/frame.w),dx=(x-face.x)/face.rx,dy=(y-face.y)/face.ry,eye=(dx+.08)**2/.42**2+(dy+.25)**2/.34**2,mouth=(dx+.28)**2/.3**2+(dy-.44)**2/.22**2,d=Math.min(eye,mouth);if(d>1)continue;
      const at=i*4;if(original[at]>130&&original[at+1]<45&&original[at+2]<70)continue;
      const mottling=((x*3+y*5)%7)/35,weight=Math.min(.95,(.6+.32*(1-d)+mottling)*(.75+.25*severity)),light=(original[at]+original[at+1]+original[at+2])/765;
      const bruise=[70+light*25-35*severity,18+light*12-8*severity,93+light*28-22*severity];for(let c=0;c<3;c++)data.data[at+c]=Math.round(original[at+c]*(1-weight)+bruise[c]*weight);
      // Keep damage in two small patches: around one eye and at the mouth.
      // Swelling grows at the lip/cheek edge. Eyes, hair and clothes
      // keep their original pixels, and no combat boxes are altered.
      if(mouth<=1&&dx<-.15)for(let n=1;n<=1+Math.floor((level-1)/4);n++){const nx=x-n;if(nx<0)continue;const q=(y*frame.w+nx)*4;if(original[q+3])continue;data.data[q]=data.data[at];data.data[q+1]=data.data[at+1];data.data[q+2]=data.data[at+2];data.data[q+3]=255;}
    }
    ctx.putImageData(data,0,0);cache.set(key,image);if(cache.size>64)cache.delete(cache.keys().next().value);
  }
  return{...art,image,rect:[0,0,frame.w,frame.h,art.rect[4],art.rect[5]]};
}
function aiClothesHit(x,y,owner){
  // Blood can only stain clothing/skin on the fighter who was injured.
  for(const p of P){if(p.i!==owner)continue;const art=fighterArtBase(p),r=art.rect,px=Math.floor((p.FACE?-(x-p.X/256):x-p.X/256)-r[4]),py=Math.floor(p.Y/256-y-r[5]);if(px<0||py<0||px>=r[2]||py>=r[3])continue;const frame=aiClothFrame(p,art);if(frame?.mask[py*frame.w+px])return p;}
  return null;
}
// Mouth landmarks in the three recovered falling sprites (unflipped atlas
// pixels). Hidden faces emit no extra droplets; the impact uses the head box.
const AI_KO_MOUTHS=[
 [[41,25],[96,31],[70,63]],[[59,21],[76,44],null],
 [[48,40],[62,31],[80,39]],[[56,19],[78,27],[94,39]],
 [[41,19],[96,31],[70,63]],[[44,19],[54,19],[67,45]],
 [[67,15],[108,26],[120,54]],[[57,20],[50,33],[90,43]],
 [[72,17],[70,25],null],[[69,15],null,null],
 [[78,39],[84,44],[98,43]],[[67,15],[90,18],null]
];
function aiMouth(p){if(p.AIFFSlamImpact)return{x:p.X/256,y:12};if(p.AIFFHeld?.inverted){const r=fighterArtBase0(p).rect;return{x:p.X/256,y:p.Y/256-r[3]*.35};}
  if(isFFGuest(p))return ffMouth(p);
  const head=boxw(p,0),facing=p.FACE?1:-1;
  if(head)return{x:head[0]+facing*head[2]*.55,y:head[1]-head[3]*.4};
  if(p.cur!==AN_FALL||p.CESpecial)return null;
  const point=AI_KO_MOUTHS[p.fid]?.[p.aidx];if(!point)return null;
  const rect=fighterArt(p).rect,base=p.F.frames[ent(p)[0]],x=rect[4]+point[0]*rect[2]/base[2],y=rect[5]+point[1]*rect[3]/base[3];
  return{x:p.X/256+(p.FACE?-x:x),y:p.Y/256-y};
}
// Mouth pixels in the original lying sprites (unflipped cropped atlas frame).
const AI_LIE_MOUTHS=[[109,41],[91,32],[137,23],[123,24],[106,38],[119,27],[129,27],[87,23],[112,24],[92,43],[117,36],[126,26]];
function aiFloorMouth(p){
  if(isFFGuest(p)&&p.cur===AN_FALL+1)return ffMouth(p);
  if(p.cur!==AN_FALL+1)return null;const point=AI_LIE_MOUTHS[p.fid],base=p.F.frames[ent(p)[0]],r=fighterArtBase(p).rect;
  const x=r[4]+point[0]*r[2]/base[2],y=r[5]+point[1]*r[3]/base[3];
  return{x:p.X/256+(p.FACE?-x:x),y:p.Y/256-y};
}
function aiFloorCoughStep(){
  for(const p of P){
    if(hpAlive(p)||p.ST!==S_KO||p.cur!==AN_FALL+1||p.Y>0||p.VY!==0)continue;
    const state=AI_FLOOR_COUGHS[p.i]||(AI_FLOOR_COUGHS[p.i]={landed:G.tick,next:G.tick+12,count:0,lastBurst:-999});
    if(state.count>=3||G.tick<state.next)continue;const mouth=aiFloorMouth(p);if(!mouth)continue;
    const dir=p.FACE?-1:1,seed=aiFXHash(G.tick,'floor-cough:'+p.i);
    const drops=Array.from({length:9},(_,i)=>{const h=aiFXHash(seed,i),q=(h&65535)/65535;return{x:mouth.x,y:mouth.y,vx:dir*(.25+q*1.15),vy:1.1+((h>>>16)/65535)*1.5,size:1+(i%3===0),tick:G.tick,floorCough:true,clothEligible:false,color:['#d3132b','#a90b21','#ed263c'][i%3]};});
    aiBloodAdd(drops,p.i);state.lastBurst=G.tick;state.count++;state.next=G.tick+36;
  }
}
function aiFloorCoughDraw(camera,ground,view){
  if(!aiEnabled())return;
  for(const p of view){const state=AI_FLOOR_COUGHS[p.i];if(!state||hpAlive(P[p.i]))continue;
    const age=G.tick-state.lastBurst,r={start:state.lastBurst,selector:1},f=age>=0&&age<20&&aiRetchFrame(r),mouth=f&&aiFloorMouth(p);if(!mouth)continue;
    const im=AI_REEL_IMAGES[SF2AIREELDATA.frames.indexOf(f)];cx.save();cx.translate(mouth.x-camera,ground-mouth.y);cx.scale(p.FACE?-.65:.65,.65);cx.rotate(-.6);cx.drawImage(im,f.x,f.y);cx.restore();
  }
}
function aiDeathBegin(p,effect){
  if(!aiEnabled()||G.scene!=='fight')return;
  const special=effect?.special??(p.opp.ST===S_SPEC&&!['throw','athrow','ai-rift'].includes(p.opp.MV?.kind));
  const mouth=aiMouth(p),dir=p.FACE?1:-1,seed=SF2AIRULES.hash(G.tick,'ko:'+p.i);
  const particles=Array.from({length:mouth?(special?28:18):0},(_,i)=>{
    const h=aiFXHash(seed,'blood:'+i),r=(h&65535)/65535,q=(h>>>16)/65535;
    return {x:mouth.x,y:mouth.y,vx:dir*(.6+r*3.2)+(q-.5)*1.8,vy:1.2+q*3.8,size:1+(h%3),life:30+(h%25),tick:G.tick,color:['#b20b22','#d3132b','#ed263c'][i%3]};
  });
  aiBloodAdd(particles,p.i);aiClothesStain(p,special?3:2);
  if(special){aiSpecialKOEcho(p.opp,effect);AI_SKO_VIEW={slot:p.opp.i,start:G.tick};}
  AI_DEATH_FX.push({slot:p.i,trailSlot:p.opp.i,special,start:G.tick,lastTick:-1,lastSample:-99,airborne:false,emitting:special,mouth,trails:[],particles});
}
function aiDeathStep(){
  aiBloodStep();
  if(!aiEnabled()||G.scene!=='fight'){AI_DEATH_FX.length=0;return;}
  for(let i=AI_DEATH_FX.length-1;i>=0;i--){
    const fx=AI_DEATH_FX[i],p=P[fx.slot],age=G.tick-fx.start;
    if(age>AI_KO_TRAIL.duration+AI_KO_TRAIL.life+20||hpAlive(p)){AI_DEATH_FX.splice(i,1);continue;}
    if(fx.lastTick===G.tick)continue;fx.lastTick=G.tick;
    fx.trails=fx.trails.filter(t=>G.tick-t.tick<AI_KO_TRAIL.life);fx.particles=fx.particles.filter(p=>!p.landed&&G.tick-p.tick<p.life);
    if(p.Y>0)fx.airborne=true;
    if(fx.airborne&&p.Y<=0||p.CEKO?.ready)fx.bloodStopped=true;
    const winner=P[fx.trailSlot];
    fx.emitting=fx.special&&hpAlive(winner)&&age<AI_KO_TRAIL.duration;
    const pose=winner.cur+':'+winner.aidx,moved=fx.x===undefined||Math.abs(winner.X-fx.x)+Math.abs(winner.Y-fx.y)>=256||pose!==fx.pose;
    if(fx.emitting&&moved&&G.tick-fx.lastSample>=2){
      const art=fighterArt(winner);fx.trails.push({slot:winner.i,image:art.image,rect:art.rect.slice(),face:winner.FACE,x:winner.X/256,y:winner.Y/256,tick:G.tick});
      if(fx.trails.length>AI_KO_TRAIL.max)fx.trails.shift();fx.x=winner.X;fx.y=winner.Y;fx.pose=pose;fx.lastSample=G.tick;
    }
    const mouth=aiMouth(p);fx.mouth=mouth;
    const bloodMoved=fx.bloodX===undefined||Math.abs(p.X-fx.bloodX)+Math.abs(p.Y-fx.bloodY)>=256;
    if(fx.special&&!fx.bloodStopped&&mouth&&fx.airborne&&age<200&&bloodMoved&&G.tick-(fx.lastBlood??fx.start)>=6){
      const drops=[];for(let j=0;j<2;j++)drops.push({x:mouth.x,y:mouth.y,vx:(p.VX||0)/640+(p.FACE?1:-1)*(.4+j*.3),vy:1+j*.5,size:1+j,life:28+j*6,tick:G.tick,color:j?'#d3132b':'#b20b22'});
      aiBloodAdd(drops,p.i);fx.particles.push(...drops);fx.lastBlood=G.tick;fx.bloodX=p.X;fx.bloodY=p.Y;
    }
    if(age>60&&!fx.emitting&&!fx.trails.length&&!fx.particles.length&&(fx.bloodStopped||age>=200||!fx.special))AI_DEATH_FX.splice(i,1);
  }
}
function aiDeathDraw(camera,ground){
  if(!aiEnabled())return;cx.save();
  for(const fx of AI_DEATH_FX)for(const t of fx.trails){const age=G.tick-t.tick;cx.globalAlpha=AI_KO_TRAIL.opacity*Math.pow(Math.max(0,1-age/AI_KO_TRAIL.life),.9);spr(t.image,t.rect,Math.floor(t.x)-camera,ground-Math.floor(t.y),t.face);}
  cx.restore();
}
const AI_PROFILES={...Object.fromEntries(Object.entries(SF2AIFF.specs).map(([id,p])=>[id,{key:'ai:'+id,name:p.name,maxHP:p.hp,baseFighterId:10}])),damnd:{key:'ai:damnd',name:'Damnd',maxHP:360,baseFighterId:10},ken:{key:'ce:ken',name:'Ken',maxHP:288,baseFighterId:4},'evil-ken':{key:'ai:evil-ken',name:'Evil Ken',maxHP:272,baseFighterId:4},ryu:{key:'ce:ryu',name:'Ryu',maxHP:288},'evil-ryu':{key:'ai:evil-ryu',name:'Evil Ryu',maxHP:272}};

const EDITION_SETTING_KEYS={faithful:'sf2:faithful:v1:settings',ai:'sf2:ai:ce-v1:settings',ce:'sf2:ce:v2:settings'};

function readEditionSettings(key){try{const value=JSON.parse(localStorage.getItem(key));if(value&&Number.isInteger(value.diff)&&value.diff>=0&&value.diff<4&&[0,30,60,99].includes(value.rtime))return {diff:value.diff,rtime:value.rtime};}catch{}return null;}

const EDITION_SETTINGS={faithful:readEditionSettings(EDITION_SETTING_KEYS.faithful),ai:readEditionSettings(EDITION_SETTING_KEYS.ai)};

// Migration preserves preset order, not equivalence to the former approximate CPU.

try{const s=JSON.parse(localStorage.getItem(EDITION_SETTING_KEYS.ce));if(s&&Number.isInteger(s.difficulty)&&s.difficulty>=0&&s.difficulty<8&&[0,30,60,99].includes(s.rtime))EDITION_SETTINGS.ce={difficulty:s.difficulty,rtime:s.rtime};}catch{}

if(!EDITION_SETTINGS.ce){const old=EDITION_SETTINGS.faithful;EDITION_SETTINGS.ce={difficulty:old?[0,3,4,7][old.diff]:3,rtime:old?.rtime??99};try{localStorage.setItem(EDITION_SETTING_KEYS.ce,JSON.stringify(EDITION_SETTINGS.ce));}catch{}}

function settingsKey(){return aiEnabled()?'ai':VER.edition==='ce'?'ce':'faithful';}

function captureEditionSettings(){if(AICFG.prototype)return;const key=settingsKey();EDITION_SETTINGS[key]=key==='ce'?{difficulty:G.ceDifficulty,rtime:G.rtime}:{diff:G.diff,rtime:G.rtime};}

function restoreEditionSettings(id){const s=EDITION_SETTINGS[id==='ww'?'faithful':id]||EDITION_SETTINGS.faithful||{diff:1,rtime:99};G.diff=s.diff??1;G.rtime=s.rtime;if(id==='ce')G.ceDifficulty=s.difficulty;}

function saveEditionSettings(){if(AICFG.prototype)return;captureEditionSettings();const key=settingsKey(),s=EDITION_SETTINGS[key],n=key==='ce'?s.difficulty:s.diff;if(!Number.isInteger(n)||n<0||n>=(key==='ce'?8:4)||![0,30,60,99].includes(s.rtime))return;try{localStorage.setItem(EDITION_SETTING_KEYS[key],JSON.stringify(s));}catch{}}

function changeDifficulty(delta){if(VER.edition==='ce')G.ceDifficulty=(G.ceDifficulty+delta+8)%8;else G.diff=(G.diff+delta+4)%4;}

const RIFT=Object.freeze({distance:72,startup:6,travel:6,recovery:12,cost:4,minHP:5});

function aiMax(p){return p.maxHP||MAXHP;}

function aiName(p){return p.profileName||p.F.name;}

function aiEnabled(){return VER.edition==='ai';}

function isEvilKen(p){return aiEnabled()&&p.aiProfile==='evil-ken'&&window.SF2AIEvilKen?.ready;}

function isDamnd(p){return aiEnabled()&&p.aiProfile==='damnd';}
function isFFGuest(p){return aiEnabled()&&SF2AIFF.ids().includes(p.aiProfile);}
function ffGuestIds(){return window.SF2AIFF?SF2AIFF.ids():['damnd'];}
function guestSelected(slot,fid){if(!aiEnabled()||fid!==10)return null;const id=G.scene==='select'&&!G.AIColor&&!AICFG.prototype?ffGuestIds()[G.cep?.[slot]-12]:(AICFG.prototype?AICFG.profiles[slot]:AICFG.selectedProfiles[slot]);return ffGuestIds().includes(id)?id:null;}
function ffName(id){return id==='damnd'?'Damnd':SF2AIFF.get(id)?.name;}
function ffPortrait(id,im,kind,packet){return id==='damnd'?SF2AIDamnd.portrait(im,kind,packet):SF2AIFF.portrait(id,im,kind);}
function ffSound(p,kind){if(!aiEnabled()||!isFFGuest(p)||muted||netReplaying||!AC||!MG)return;const code=SF2AIFF.soundCode(p,kind)??(kind==='hit'?0:kind==='land'?13:kind==='ko'?44:kind==='throw'?38:kind==='special'&&['andore','abigail'].includes(p.aiProfile)?41:47);SF2AIFF.playSound(code,AC,MG);}
function ffMouth(p){return isDamnd(p)?SF2AIDamnd.mouth(p):SF2AIFF.mouth(p);}
function ffArt(p){const art=isDamnd(p)?SF2AIDamnd.art(p):SF2AIFF.art(p);return SF2AIDamnd.fireArt(p,{...art,image:aiSprite(p,art.image,false)},G.tick);}

function damndSelected(slot,fid){return aiEnabled()&&fid===10&&(G.scene==='select'&&!G.AIColor?G.cep?.[slot]===12:(AICFG.prototype?AICFG.profiles[slot]:AICFG.selectedProfiles[slot])==='damnd');}
function damndSelectable(){return !!window.SF2AIDamnd?.loaded;}
function evilRyuSelectable(){return window.SF2AI_ROSTER?.developmentProfiles?.some(p=>p.key==='ai:evil-ryu'&&p.baseFighterId===0&&p.selectablePrototype===true);}

function evilRyuSelected(slot,fid){return aiEnabled()&&fid===0&&(AICFG.prototype?AICFG.profiles[slot]:AICFG.selectedProfiles[slot])==='evil-ryu';}

function evilKenSelectable(){return !!window.SF2AIEvilKen?.ready&&window.SF2AI_ROSTER?.additions?.some(p=>p.key==='ai:evil-ken'&&p.baseFighterId===4&&p.ready===true&&p.selectable===true);}

function evilKenSelected(slot,fid){return aiEnabled()&&fid===4&&(AICFG.prototype?AICFG.profiles[slot]:AICFG.selectedProfiles[slot])==='evil-ken';}

function selectedProfileLabel(slot,fid){return guestSelected(slot,fid)?ffName(guestSelected(slot,fid)).toUpperCase():evilRyuSelected(slot,fid)?'EVIL RYU PROTOTYPE':evilKenSelected(slot,fid)?'EVIL KEN':D.fighters[fid].name.toUpperCase();}

function ryuVariantStrip(){return aiEnabled()&&!AICFG.prototype&&G.scene==='select'&&!G.AIColor&&(G.sel[G.selstep]===0&&evilRyuSelectable()||G.sel[G.selstep]===4&&evilKenSelectable());}

function aiAllowedFids(){const roster=window.SF2AI_ROSTER?.baseRoster;return Array.isArray(roster)?roster.filter(f=>f.ready===true&&Number.isInteger(f.fighterId)&&f.fighterId>=0&&f.fighterId<12&&typeof f.key==='string'&&f.key.startsWith('ce:')).map(f=>f.fighterId):[];}

const CE_KEYS=['ryu','honda','blanka','guile','ken','chun-li','zangief','dhalsim','bison','sagat','balrog','vega'];

function aiClearProfile(p){

  for(const key of Object.keys(p))if(key.startsWith('AI')&&key!=='AIPC'||key==='_AI_SOURCE'||['aiProfile','fighterKey','profileName','maxHP'].includes(key))delete p[key];

}

function aiSetProfile(p,fid){

  if(!aiAllowedFids().includes(fid))throw new Error('Fighter is not ready for AI Edition');

  const guest=guestSelected(p.i,fid),evil=evilRyuSelected(p.i,fid),ken=fid===4&&(AICFG.prototype?AICFG.profiles[p.i]:AICFG.selectedProfiles[p.i])==='evil-ken';

  if(ken&&!window.SF2AIEvilKen?.ready)throw new Error('Evil Ken pack is not loaded');

  const id=guest|| (ken?'evil-ken':evil?'evil-ryu':CE_KEYS[fid]),key=guest||evil||ken?'ai:'+id:'ce:'+id,source=D.fighters[fid];

  if(p._AI_SOURCE!==source||p.fighterKey!==key){if(guest){if(guest==='damnd')SF2AIDamnd.bind(p,source);else SF2AIFF.bind(p,source,guest);}else if(ken)SF2AIEvilKen.bind(p);else p.F=JSON.parse(JSON.stringify(source));delete p.F._ai;p._AI_SOURCE=source;}

  p.fid=fid;if(!guest)p.ft=FTX[fid];p.aiProfile=id;p.fighterKey=key;p.profileName=guest?ffName(guest):ken?'Evil Ken':evil?'Evil Ryu':source.name;

  p.F.name=p.profileName;p.maxHP=guest?(guest==='damnd'?360:SF2AIFF.get(guest).hp):evil||ken?272:288;if(!guest&&!ken){p.AIAtlas=evil?FIA[0]:null;delete p.AIAtlasAlt;delete p.AIEvilKen;}

}

function aiResetPlayer(p){if(!aiEnabled()){aiClearProfile(p);return;}

  delete p.AIComboBreaker;delete p.AIBreakInput;delete p.AIComboBreakInvuln;delete p.AIComboBreakNotice;delete p.AIBreakAttempt;delete p.AIDamndMove;delete p.AIDamndBarrel;delete p.AIFFMove;delete p.AIFFProjectile;delete p.AIFFThrow;delete p.AIFFHold;delete p.AIFFHeld;delete p.AIFFGrenades;delete p.AIFFBullets;delete p.AIFFWall;delete p.AIFFDismounted;delete p.AICPU;delete p.AIButtons;delete p.AIAir;p.AIColorChoice=AICFG.colors[p.i]?{...AICFG.colors[p.i]}:isFFGuest(p)?{clothing:p.i===1&&P[0].aiProfile===p.aiProfile?0:-2,skin:-2}:null;p.AIPaletteKey=G.AIMatchSeed+':'+p.fighterKey+':'+p.i+':'+(p.AIColorChoice?.clothing??-1)+':'+(p.AIColorChoice?.skin??-1);p.AIPalette=SF2AIRULES.colors(p.F.pal,G.AIMatchSeed,p.fighterKey,p.i,p.AIColorChoice);p.AIRift=null;p.AIRiftInput={stage:0,time:0,prev:0};p.AIRiftRequest=0;p.AIIdleTick=0;p.AIAttackSerial=0;p.AIConfirm=-1;
  SF2AICHAIN.reset(p);p.AICombo={active:false,id:0,hits:0,damage:0,riftUsed:false};

  p.AIMetrics={riftStarts:0,riftCancels:0,riftCost:0,riftRejected:0,groundHits:0,blockedNormals:0,maxCombo:0,lastRift:null};

  p.CES=null;p.MV=null;p.SPEND=0;p.PST=0;p.EVB=null;p.WAKET=p.LANDT=0;if(isEvilKen(p))SF2AIEvilKen.reset(p);

}

function aiBreakCombo(p){

  if(!p.AICombo)return;

  SF2AICHAIN.reset(p);p.AICombo.active=false;p.AICombo.hits=0;p.AICombo.damage=0;p.AICombo.riftUsed=false;p.AIConfirm=-1;

}

function aiTryComboBreaker(p){
 const q=p.AIComboBreaker?.request;if(q&&G.tick-p.AIComboBreaker.opened>SF2AICHAIN.BREAK_WINDOW){delete p.AIComboBreaker;return false;}if(!q||!hpAlive(p)||![S_HIT,S_DOWN].includes(p.ST)||p.Y>0)return false;const m=p.F.moves[q.index];if(!m){delete p.AIComboBreaker;return false;}
 const saved={ST:p.ST,STUN:p.STUN,KB:p.KB,FACE:p.FACE,Y:p.Y,VX:p.VX,VY:p.VY,AX:p.AX,AY:p.AY};p.ST=S_FREE;p.FACE=p.opp.X>p.X?1:0;p.VX=p.VY=p.AX=p.AY=0;
 if(!startspec(p,[],(q.strength<<4)|(q.index+1))){Object.assign(p,saved);delete p.AIComboBreaker;return false;}
 SF2CESPECIAL.interrupt(p);SF2CEDIZZY.interrupt(p);delete p.CEPF;delete p.CEVNSTART;p.CER=p.CERSTOP=p.CEGUARD=null;p.STUN=p.KB=p.DIZZY=p.STP=0;p.Y=0;delete p.AIComboBreaker;aiBreakCombo(p);aiBreakCombo(p.opp);SF2AIRULES.block(p,p.KEYS);p.PREV=p.HZK=p.KEYS;p.MQP=[];p.MQK=[];G.hfz=0;p.AIComboBreakInvuln=G.tick+12;p.AIComboBreakNotice=G.tick+60;G.comboBreaks=(G.comboBreaks||0)+1;return true;
}

function aiTrySpecialChain(p){
 const s=p.AIChain,q=s?.special;if(!q||p.ST!==S_ATK||s.confirmed!==p.AIAttackSerial||p.Y!==0)return false;s.special=null;
 const saved={ST:p.ST,VX:p.VX,VY:p.VY,AX:p.AX,AY:p.AY};p.ST=S_FREE;p.VX=p.VY=p.AX=p.AY=0;
 if(!startspec(p,[],(q.strength<<4)|(q.index+1))){Object.assign(p,saved);return false;}
 if(G.scene==='fight'&&hpAlive(p.opp)){const d=p.opp;if([S_DOWN,S_GETUP].includes(d.ST)){setanim(d,AN_HITL,0);d.ST=S_HIT;d.Y=d.VX=d.VY=d.AX=d.AY=0;d.DIZZY=0;}d.STUN=Math.max(d.STUN||0,24);d.KB=0;}delete p.CEVNSTART;delete p.CENORMALINIT;delete p.CESLREC;p.NSL=p.CEST=null;s.confirmed=-1;s.queued=null;s.specialCancels=(s.specialCancels||0)+1;SF2AIRULES.block(p,p.KEYS);p.PREV=p.HZK=p.KEYS;
 if(G.scene==='bonus'&&G.bon){if(G.bon.car)G.bon.car.heroStop=0;if(G.bon.barrels?.player)G.bon.barrels.player.bodyStop=0;}
 return true;
}
function aiBonusContact(p,normal,blocked=false){
 if(!aiEnabled()||G.scene!=='bonus'||G.bon.end)return;if(blocked){aiBreakCombo(p);return;}const c=p.AICombo;if(!c.active){c.active=true;c.id++;c.hits=0;c.damage=0;}c.hits++;c.damage++;p.AIMetrics.maxCombo=Math.max(p.AIMetrics.maxCombo,c.hits);p.AIChain.bonusLast=G.tick;
 if(normal&&p.ST===S_ATK&&p.Y===0){SF2AICHAIN.contact(p,false,G.tick);p.AIConfirm=p.AIAttackSerial;}
}

function aiInput(p){

  if(p.aiProfile!=='evil-ryu')return;

  const q=p.AIRiftInput,k=p.AIButtons?.keys??p.KEYS,forward=p.FACE?K_R:K_L,back=p.FACE?K_L:K_R;
  const dir=(k&K_D?8:0)|(k&forward?1:0)|(k&back?2:0)|(k&K_U?4:0),kick=(k>>7)&7,pressed=kick&~q.prev;q.prev=kick;

  if(q.stage&&--q.time<=0)q.stage=0;

  if(dir===8){q.stage=1;q.time=12;}

  else if(q.stage===1&&dir===9){q.stage=2;q.time=12;}

  else if(q.stage===2&&dir===1){q.stage=3;q.time=12+SF2AIRULES.WINDOW;}
  if(q.stage===3&&pressed){p.AIRiftRequest=G.tick;q.stage=0;}

}

function aiTryRift(p){

  if(!p.AIRiftRequest)return false;

  const requested=p.AIRiftRequest;p.AIRiftRequest=0;

  if(p.aiProfile!=='evil-ryu'||G.tick-requested>18||G.gph!==1)return false;

  const air=p.ST===S_AIR&&!p.PJ,neutral=air||p.ST===S_FREE||p.ST===S_CR||p.ST===S_UP&&!p.CESLREC;
  const cancelled=p.ST===S_ATK&&p.AIConfirm===p.AIAttackSerial&&p.AICombo.active;

  if(!air&&p.Y!==0||p.HP<RIFT.minHP||(!neutral&&!cancelled)||p.AICombo.active&&p.AICombo.riftUsed){p.AIMetrics.riftRejected++;return false;}
  const combo=p.AICombo;if(combo.active)combo.riftUsed=true;

  p.HP-=RIFT.cost;p.AIMetrics.riftStarts++;p.AIMetrics.riftCost+=RIFT.cost;if(cancelled)p.AIMetrics.riftCancels++;

  p.AIMetrics.lastRift={cancelled,frame:G.tick,startX:p.X/256,distance:0,comboId:combo.id};

  p.AIRift={tick:0,phase:'startup',cancelled,direction:p.FACE?1:-1,startX:p.X,distance:0};

  if(air)p.AIAir={base:p.Y,vx:p.VX,vy:p.VY,ay:p.AY,jan:p.JAN};p.ST=S_SPEC;p.MV={kind:'ai-rift'};p.CES=null;p.CETH=null;p.THV=null;p.KB=0;p.VX=p.VY=p.AX=p.AY=0;
  p.SPK=p.SPKD=0;p.VQ=null;p.AIConfirm=-1;setanim(p,AN_CROUCH,0);return true;

}

function aiRiftStep(p){

  const q=p.AIRift;if(!q)return false;

  if(p.ST!==S_SPEC||p.MV?.kind!=='ai-rift'){p.AIRift=null;return false;}

  q.tick++;

  if(q.tick===RIFT.startup)setanim(p,AN_WALKF,0);

  if(q.tick===RIFT.startup+RIFT.travel)setanim(p,AN_STANDUP,0);

  if(q.tick>=RIFT.startup&&q.tick<RIFT.startup+RIFT.travel){q.phase='travel';p.X+=q.direction*((RIFT.distance<<8)/RIFT.travel);}

  else q.phase=q.tick<RIFT.startup?'startup':'recovery';

  q.distance=(p.X-q.startX)/256;p.AIMetrics.lastRift.distance=q.distance;

  if(q.tick>=RIFT.startup+RIFT.travel+RIFT.recovery){p.AIRift=null;toidle(p);}

  return true;

}

function aiContact(p,d,before,blocked,damage,normal){

  if(!aiEnabled())return;

  if(blocked){if(normal){aiBreakCombo(p);SF2AICHAIN.contact(p,true);p.AIConfirm=-1;p.AIMetrics.blockedNormals++;}return;}

  if(![S_HIT,S_DOWN,S_GETUP,S_KO].includes(before))aiBreakCombo(p);

  const c=p.AICombo;if(!c.active){c.active=true;c.id++;c.hits=0;c.damage=0;c.riftUsed=false;}

  c.hits++;c.damage+=Math.max(0,damage);p.AIMetrics.maxCombo=Math.max(p.AIMetrics.maxCombo,c.hits);

  if(c.hits>=2&&hpAlive(d))SF2AICHAIN.armBreaker(d,G.tick);
  if(normal){SF2AICHAIN.contact(p,false,G.tick);d.KB=Math.trunc((d.KB||0)*.28);p.AIConfirm=p.AIAttackSerial;p.AIMetrics.groundHits++;}

}





// M13b: close-normal ranges (px, centre to centre) found by bisecting P2 distance in the box emulator; 198 = same anim at any range

let NTHR=null;const NTHR_WW=[[64, 70, 80, 40, 40, 80], [198, 198, 198, 93, 106, 106], [80, 80, 80, 82, 85, 90], [54, 75, 96, 198, 72, 75], [64, 70, 80, 40, 40, 80], [59, 75, 80, 75, 80, 80], [80, 198, 198, 72, 96, 96], [87, 84, 96, 87, 91, 102], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 73, 63, 0, 63, 73], [0, 0, 0, 0, 0, 0]],NTHR_CE=[[72,78,88,47,47,87],[198,198,198,97,110,110],[80,80,80,83,86,90],[54,84,105,198,82,84],[66,72,82,41,41,81],[61,76,81,76,81,81],[81,198,198,73,97,97],[108,105,117,108,113,123],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,81,71,0,71,81],[0,0,0,0,0,0]]/* CE ROM: max gap that still starts the close anim +1 (tools/nthr.py) */,AN_NEAR=47,AN_JD=53,AN_JU=59;

NTHR=NTHR_WW;

// walk fwd, back; jump neutral/back/forward {vx,ax,vy,ay} (ROM sf2e 0x2d1f6 / 0x2d0d6)

const FT=[[0x300,0x200,[0,0,0x6e0,0x48],[-0x380,-5,0x700,0x48],[0x400,5,0x740,0x48]],

          [0x300,0x200,[0,0,0x600,0x30],[-0x480,-5,0x900,0x60],[0x500,5,0x960,0x60]]];

// per-fighter jump rows (ROM sf2e 0x2d066 + 32*fid: back/fwd {vx,ax,vy,ay}, then neutral) and

// walk speeds (ROM sf2e 0x2d1e6 + 16*fid: -fwd, back) -- all 12 fighters incl. bosses, read from ROM by tools

const JT=[[0x720,0x48,-0x380,-0x5,0x700,0x48,0x400,0x5,0x740,0x48],[0x6a0,0x4c,-0x340,-0x5,0x680,0x4c,0x360,0x5,0x6a0,0x4c],[0xb20,0x90,-0x380,-0x5,0xb00,0x90,0x398,0x5,0xb40,0x90],[0x6e0,0x48,-0x380,-0x5,0x6c0,0x48,0x400,0x5,0x700,0x48],[0x720,0x48,-0x380,-0x5,0x700,0x48,0x400,0x5,0x740,0x48],[0xa30,0x70,-0x420,-0x5,0xa00,0x70,0x440,0x5,0xa50,0x70],[0x740,0x58,-0x2a0,-0x5,0x700,0x58,0x2c0,0x5,0x780,0x58],[0x600,0x30,-0x240,-0x5,0x600,0x30,0x260,0x5,0x620,0x30],[0x930,0x60,-0x480,-0x5,0x900,0x60,0x500,0x5,0x960,0x60],[0x740,0x58,-0x2a0,-0x5,0x700,0x58,0x2c0,0x5,0x780,0x58],[0x720,0x50,-0x300,-0x5,0x700,0x50,0x380,0x5,0x740,0x50],[0xc20,0xb0,-0x500,-0x10,0xc00,0xb0,0x580,0x10,0xc40,0xb0]];

const WK=[[0x300,0x200],[0x260,0x1a0],[0x240,0x1e0],[0x360,0x280],[0x300,0x200],[0x400,0x300],[0x280,0x180],[0x200,0x160],[0x400,0x300],[0x280,0x200],[0x380,0x300],[0x480,0x380]];

/* CE ROM copies of the same tables (prog_ce 0x3a2f6 jump rows, 0x3a476 walk): only Ryu/Ken gravity (0x50) and Ken's walk differ */

const JT_CE=[[0x720,0x50,-0x380,-0x5,0x700,0x50,0x400,0x5,0x740,0x50],[0x6a0,0x4c,-0x340,-0x5,0x680,0x4c,0x360,0x5,0x6a0,0x4c],[0xb20,0x90,-0x380,-0x5,0xb00,0x90,0x398,0x5,0xb40,0x90],[0x6e0,0x48,-0x380,-0x5,0x6c0,0x48,0x400,0x5,0x700,0x48],[0x720,0x50,-0x380,-0x5,0x700,0x50,0x400,0x5,0x740,0x50],[0xa30,0x70,-0x420,-0x5,0xa00,0x70,0x440,0x5,0xa50,0x70],[0x740,0x58,-0x2a0,-0x5,0x700,0x58,0x2c0,0x5,0x780,0x58],[0x600,0x30,-0x240,-0x5,0x600,0x30,0x260,0x5,0x620,0x30],[0x930,0x60,-0x480,-0x5,0x900,0x60,0x500,0x5,0x960,0x60],[0x740,0x58,-0x2a0,-0x5,0x700,0x58,0x2c0,0x5,0x780,0x58],[0x720,0x50,-0x300,-0x5,0x700,0x50,0x380,0x5,0x740,0x50],[0xc20,0xb0,-0x500,-0x10,0xc00,0xb0,0x580,0x10,0xc40,0xb0]];

const WK_CE=WK.map((k,f)=>f===4?[0x330,0x220]:k);

const mkftx=(JT,WK)=>WK.map((k,f)=>{const j=JT[f];return [k[0],k[1],[0,0,j[0],j[1]],[j[2],j[3],j[4],j[5]],[j[6],j[7],j[8],j[9]]];});

const FTX_WW=mkftx(JT,WK),FTX_CE=mkftx(JT_CE,WK_CE);let FTX=FTX_WW;

const SEQ=[[1,8,9,0,2],[8,9,1,0,1],[8,10,2,1,3]]; // Shoryuken F,D,DF / Hadouken D,DF,F / Tatsumaki D,DB,B (relative dirs F1 B2 U4 D8)

const WINTAB=[10,8,8,11,8,8,9,8,9,8,8,10,8,8,11,13,8,15,9,8,10,12,8,8,11,8,9,8,14,12,8,10];

const TATVX=[0x28000,0x30000,0x38000],SHOVX=[0x40000,0x60000,0x80000],SHOVY=[0x50000,0x70000,0x90000];

let rng=0x2545F491;

function rand(){rng^=rng<<13;rng>>>=0;rng^=rng>>>17;rng^=rng<<5;rng>>>=0;return rng;}

const G={scene:'title',arc:0,ladder:[],li:0,st:0,menu:0,cont:9,slow:0,bann:'',ko:0,mw:0,sel:[0,4],selstep:0,stage:4,mode2p:0,gph:0,gt:0,timer:99,rtime:99,diff:1,tick60:0,round:1,winmask:0,aicool:20,aidelay:0,aipend:0,stepacc:0,cam:OFS,fr:false,tick:0};

if(EDITION_SETTINGS.faithful)Object.assign(G,EDITION_SETTINGS.faithful);

G.ceDifficulty=EDITION_SETTINGS.ce.difficulty;

function mkp(i){return {i,X:0,Y:0,VX:0,VY:0,AX:0,AY:0,FACE:0,ST:0,RETCR:0,cur:0,anim:null,aidx:0,acc:0,adone:0,hitdone:0,

 HP:MAXHP,KEYS:0,PREV:0,KB:0,WINS:0,SPK:0,SPPH:0,SPSTR:0,SVX:0,SVY:0,SCNT:0,LOOPED:0,MSEQ:[[0,0],[0,0],[0,0]],CB:0,CD:0,CBW:0,CDW:0,MQP:[],MQK:[],R3:[-99,-99,-99,-99],PT:[-99,-99,-99],FBK:'hado',

 FBON:0,FBX:0,FBY:0,FBVX:0,FBT:0,FORCE:0,fid:i?4:0,F:D.fighters[i?4:0],ft:FTX[i?4:0]};}

function setfighter(p,fid){if(aiEnabled()){aiSetProfile(p,fid);return;}p.fid=fid;p.F=D.fighters[fid];p.ft=FTX[fid];aiClearProfile(p);}

const P=[mkp(0),mkp(1)]; P[0].opp=P[1]; P[1].opp=P[0];

const ent=p=>p.anim.ents[p.aidx];

// Native human normal controllers: shotos0x3d6b6, Vega LP; other normals retain their existing owners.

function ceNativeNormal(p,n=p.cur){return VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)&&(([0,1,4].includes(p.fid)&&n>=8&&n<=19)||(p.fid===1&&n>=47&&n<=52)||(p.fid===11&&[8,14].includes(n)));}
function setanim(p,n,idx){if(aiEnabled())p.AIAttackSerial=(p.AIAttackSerial||0)+1;p.cur=n;p.aidx=idx;p.anim=p.F.anims[n];if(ceNativeNormal(p,n)&&p.anim.nativeDurations){const a=p.anim;p.anim={...a,ents:a.ents.map((e,i)=>{const q=e.slice();q[1]=a.nativeDurations[i];return q;})};}p.acc=0;p.adone=0;p.hitdone=0;p.MH2=0;}

function wantanim(p,n){if(p.cur!==n)setanim(p,n,0);}

function animstep(p){ // one 60Hz tick

  p.LOOPED=0; const a=p.anim; let i=p.aidx, acc=p.acc+1;

  for(;;){ if(acc<a.ents[i][1])break; acc-=a.ents[i][1]; i++;

    if(i<a.ents.length)continue;

    if(VER.cur==='CE'&&p.ST===S_AIR&&p.JAN&&(JRET_CE[p.fid]||[]).includes(p.cur)){const n=p.F.anims[p.JAN].ents.length-1;p.cur=p.JAN;p.anim=p.F.anims[p.JAN];p.aidx=n;p.acc=0;return;} /* CE: a finished jump attack drops back to the jump's last pose (ROM trace: Chun j.MP/j.HP, Zangief j.MP) */

    if(VER.cur==='CE'&&p.fid===11&&p.ST===S_ATK&&p.cur===AN_CLP+5&&!window.SF2CEVEGA){const n=AI(p,'slrec');if(n>=0){setanim(p,n,0);return;}} /* CE Vega slide: 12f recovery anim 0x8fd28 back into the crouch (ROM trace ce/fd/bz.py) */

    if(a.mode===0){i=a.loop;p.LOOPED=1;continue;}

    i=a.ents.length-1;acc=0;p.adone=1;break;}

  if(i!==p.aidx&&VER.cur==='CE'){const m=MHIT_CE[p.fid];if(m&&m[p.cur]===i){p.MH2=p.hitdone;p.hitdone=0;}}

  p.aidx=i;p.acc=acc;}

/* CE Guile close fwd+HK: its own kick (ROM 0x5f8d8, 20 dmg), max centre gap per victim (emu_ce/thrtrace.py) */

const GFHK_CE=[110,126,123,110,110,106,116,110,110,114,110,110];

const JRET_CE={5:[54,55,60,61],6:[54,60]};

/* CE two-hit normals (ROM-measured: a 2nd hitstop starts on this entry, where the attack box changes id): fid->{anim slot:entry} */

/* near LK/MK damage (ROM close traces; these slots were unused before NTHR_CE) */

function dmgfix(){if(typeof DMG_CE!=='object'||!DMG_CE[0])return;Object.assign(DMG_CE[0],{50:7,51:14});Object.assign(DMG_CE[4],{50:8,51:16});}

/* CE close crouch normals (Dhalsim cLP/cMP/cMK; Zangief down+MP/HP at throw range is a throw in the ROM, see crouch branch): ROM max gap that starts them (ce/fd/cthr.py) */

const CNTHR_CE={6:{1:80,2:80},7:{0:102,1:102,4:116}};

function crn(p,atk){if(isFFGuest(p))return AN_CLP+atk;const t=VER.cur==='CE'&&CNTHR_CE[p.fid]&&CNTHR_CE[p.fid][atk];if(t&&(Math.abs(p.opp.X-p.X)>>8)<=t){const n=AI(p,'cn'+['LP','MP','HP','LK','MK','HK'][atk]);if(n>=0)return n;}return AN_CLP+atk;}

const MHIT_CE={0:{52:3},4:{52:3},1:{18:3,52:4},2:{51:5},6:{52:5},7:{49:3},9:{11:3,12:3}};

function resetp(p,x,face){delete p.CEPriorFace;if(VER.edition==='ce'&&[0,4,9].includes(p.fid))p.CEPriorFace=face;window.SF2CEDIZZY?.reset(p);window.SF2CESPECIAL?.reset(p);delete p.CEDizzyPrev;delete p.CEHHPush;delete p.CEHHPushSide;delete p.CEHHDesired;delete p.CEHH;delete p.CEHHV;delete p.CEHHRecovery;delete p.CEHHVLAND;delete p.CEHHPrevKeys;delete p.CEHHSInput;delete p.CEHHSEdges;delete p.CEHHSCancel;Object.assign(p,{CARSUPPORT:0,CARLATCH:0,CARY0:0,CARSIDE:0,CES:null,MV:null,SPEND:0,PST:0,EVB:null,WAKET:0,LANDT:0,VQ:null,VT:0,X:x,FACE:face,Y:0,VX:0,VY:0,AX:0,AY:0,ST:0,KB:0,FBON:0,FORCE:0,HP:aiMax(p),HPD:aiMax(p),PENDT:0,MASHF:null,STUN:0,STP:0,STPE:0,DIZZY:0,DOWNT:0,MSEQ:[[0,0],[0,0],[0,0]],HCF:[0,0],CEGI:null,CB:0,CBLW:0,CD:0,CBW:0,CDW:0,CETH:null,CETHV:null,CEB:null,CEBV:null,NSL:null,CESLREC:0,CEBC:null,CELI:null,CELK:0,CEST:null,MQP:[],MQK:[],PREV:0,KEYS:0});
  if(VER.cur==='CE'){p.CEWALL=0;p.CEVSL=null;}else{delete p.CEWALL;delete p.CEVSL;}

  delete p.CEPF;delete p.FBIMPACT;delete p.FBDEFER;delete p.FBSLOT;delete p.FBCLASH;delete p.CER;delete p.CERSTOP;delete p.CEGUARD;delete p.CESHAKE;delete p.CERHOSTTICK;delete p.CERRESUME;delete p.CE_DAMAGE_TRACE;delete p.CEVLAND;delete p.CEVBB;delete p.CEVNSTART;delete p.CENORMALINIT;delete p.CECameraIgnore;delete p.CEKO_THROW;delete p.CEKO;delete p.CEWin;delete p.CEKOOwnerStop;delete p.CEKO_GROUND;delete p.CEKO_DIR;

  if(window.SF2CEVEGACLAW)SF2CEVEGACLAW.reset(p,VER.cur==='CE');

  aiResetPlayer(p);if(VER.cur==='CE'&&!isFFGuest(p)&&window.SF2CEREACTION)SF2CEREACTION.preregister(p);p.MSEQ=[[0,0],[0,0],[0,0]];p.THV=null;p.hitdone=0;setanim(p,AN_IDLE,0);}

// CE 0x38b2/0x38ca: native X 552/728, camera 448; browser world origin is native X 256.

const CE_CAM_EXTENT=[40,56,53,40,40,36,46,40,40,44,40,40]; // ROM 0x394c, actor+0x1c2

function resetround(){AI_SKO_VIEW=null;AI_DEATH_FX.length=0;aiBloodReset();if(VER.edition==='ce'&&P.some(p=>p.fid===1))G.CEHHContactDelay=0;else delete G.CEHHContactDelay;if(VER.cur==='CE'){window.SF2CECAMERA?.reset();window.SF2CEPROJECTILES?.reset(P);}G.ann=null;if(G.scene==='fight'){MUS=-1;music(STM[G.stage]);}const r=CAMR[G.stage],ce=VER.cur==='CE',c=aiFFStage()?208:Math.max(r[0],Math.min(r[1],ce?192:OFS));resetp(P[0],((ce?104:110)+c)<<8,1);resetp(P[1],((ce?280:210)+c)<<8,0);for(const q of P)delete q.CE_HANDICAP;if(VER.edition==='ce'&&G.mode2p&&window.SF2CECOMBAT){const levels=SF2CECOMBAT.matchLevels(P[0].fid,P[1].fid,{wins:P.map(q=>q.WINS),random:rand});P.forEach((q,i)=>q.CE_HANDICAP=levels[i]);}if(aiEnabled()){G.AIViewWidth=W;delete G.AICamera;G.AIWeatherStart??=G.tick;SF2AIWEATHER.stop();}else{delete G.AIViewWidth;delete G.AICamera;delete G.AIWeatherStart;window.SF2AIWEATHER?.stop();}if(VER.edition==='ce'&&window.SF2CEDIZZY)SF2CEDIZZY.beginWorld(G);else{delete G.CEObjects;delete G.CEObjectSerial;}delete G.CESpecialObjects;delete G.CESpecialSerial;delete G.CESpecialSlow;if(VER.cur==='CE')window.SF2CEDHALSIM?.reset(G,P);G.CERound=null;G.timer=G.rtime||99;G.tick60=0;G.hfz=0;G.CECameraShake=0;G.gph=0;G.gt=0;G.cam=c;G.bann='';G.ko=0;G.slow=0;if(ce&&G.scene==='fight'){window.SF2CESTAGESCROLL?.advance(G.stage,ceStageClock());window.SF2CESTAGEANIMATIONS?.advanceNative(G.stage,aiSceneryProjection().camera,ceStageClock(),{main:0,far:0});}}
function resetmatch(){if(aiEnabled()){G.AIMatchSerial=(G.AIMatchSerial||0)+1;G.AIMatchSeed=G.AINextMatchSeed??SF2AIRULES.hash(rng,G.AIMatchSerial+':'+P.map(p=>p.fighterKey).join(':'));delete G.AINextMatchSeed;G.AIWeatherStart=G.tick;}G.CEStageTick=0;if(VER.cur==='CE'){window.SF2CESTAGECYCLISTS?.reset();window.SF2CESTAGEBOAT?.reset();window.SF2CESTAGEBIRDS?.reset();window.SF2CESTAGEWATER?.reset();window.SF2CESTAGEDANCERS?.reset();window.SF2CESTAGEANIMATIONS?.reset();window.SF2CESTAGESCROLL?.reset();window.SF2CESTAGEPALETTES?.reset();}P[0].WINS=P[1].WINS=0;G.round=1;resetround();}
// ---- motion input buffer (sf2ua 0x2d58e) ----

function mwin(){return WINTAB[rand()&31];}

function motion(p,keys,nw,rel){

  let r=(keys&K_U?4:0)|(keys&K_D?8:0), lr=keys&3;

  if(p.FACE) lr=((lr>>1)&1)|((lr&1)<<1);

  const dir=r|lr, btn=nw|rel, ev=[], low=b=>{let st=0;while(!(b&1)){b>>=1;st++;}return st;};

  const pb=(nw>>4)&7, kb=(nw>>7)&7, T=G.tick;

  const nativeHuman=VER.edition==='ce'&&(p.i===0||(G.mode2p&&!G.netBot));
  if(nativeHuman&&[0,4].includes(p.fid))return SF2CESHOTOINPUT.step(p,dir,nw,rel,mwin,(name)=>(G.scene==='fight'?G.gph===1:G.scene==='bonus'&&G.st>=100)&&[S_FREE,S_CR,S_UP].includes(p.ST)&&!(name==='qcf'&&p.FBON));

  if(VER.cur==='CE'&&window.SF2CEVEGA){const e=SF2CEVEGA.input(p,dir);if(e)ev.push(e);}

  if(!(nativeHuman&&p.fid===3))for(let m=0;m<3;m++){const s=SEQ[m]; const bp=(btn>>4)&7, bk=(btn>>7)&7; let [idx,t]=p.MSEQ[m];

    if(idx===0){ if(dir===s[0]){idx=1;t=mwin();} }

    else{ t-=1; if(t<=0) idx=0;

      else if(idx===1){ if(dir===s[1]){idx=2;t=mwin();} else if(dir===s[0])t=mwin(); } /* M13c: arcade keeps the first direction alive while held (down can be held any time before down-forward) */

      else { let go=idx===3; if(idx===2&&dir===s[2]){idx=3;go=true;t=12;} /* M13c: arcade button window after final direction is a fixed 11 frames */

        if(go&&(bp||bk)){const nm=['dp','qcf','qcb'][m]; if(bp)ev.push([nm,'P',low(bp)]); if(bk)ev.push([nm,'K',low(bk)]); idx=0;} } }

    p.MSEQ[m]=[idx,t];}

  {const s=[2,10,8,9,1],h=p.HCF||(p.HCF=[0,0]); /* CE Yoga Flame: half circle B,DB,D,DF,F + P */

    if(h[0]<5){if(dir===s[h[0]]){h[0]++;h[1]=h[0]===5?12:14;}else if(h[0]&&--h[1]<=0)h[0]=0;} else if(--h[1]<=0)h[0]=0;

    if(h[0]===5&&pb){ev.unshift(['hcf','P',low(pb)]);h[0]=0;}}

  // charge (back->forward, down->up): hold >=40 ticks, then 12-tick window after leaving the charge direction

  if(dir&2){p.CB++;p.CBW=p.CB>=40?12:0;p.CBLW=p.CB>=94?12:0;}else{p.CB=0;if(p.CBW)p.CBW--;if(p.CBLW)p.CBLW--;} /* CE Scissor Kick: ~94-frame back charge (CE ROM trace) */

  if(dir&8){p.CD++;p.CDW=p.CD>=40?12:0;}else{p.CD=0;if(p.CDW)p.CDW--;}

  // AI air commands keep an already-earned down charge through takeoff.
  if(aiEnabled()&&p.ST===S_AIR&&p.PJ>0&&p.CDW)p.CDW=12;
  const cbf=(p.CBW||p.CB>=40)&&(dir&1), cdu=(p.CDW||p.CD>=40)&&(dir&4);

  if(p.CBLW&&(dir&1)&&!(dir&2)&&kb)ev.push(['cbfl','K',low(kb)]);

  const guileInput=VER.edition==='ce'&&p.fid===3&&window.SF2CEGUILEINPUT;
  const bisonInput=VER.cur==='CE'&&p.fid===8&&window.SF2BISONINPUT;

  if(cbf&&!guileInput){if(pb&&!bisonInput)ev.push(['cbf','P',low(pb)]);if(kb)ev.push(['cbf','K',low(kb)]);}

  if(bisonInput){const event=bisonInput.step(p,dir,((nw|rel)>>4)&7,()=>rand());if(event)ev.push(event);}

  if(cdu&&!guileInput){if(pb)ev.push(['cdu','P',low(pb)]);if(kb)ev.push(['cdu','K',low(kb)]);}

  if(guileInput)ev.push(...guileInput.step(p,dir,nw|rel,()=>rand()));
  // mash: 3 presses of punch (or kick) buttons inside 30 ticks

  const hondaHands=VER.cur==='CE'&&p.fid===1&&window.SF2CEHONDAHANDS;if(hondaHands){const e=hondaHands.input(p,pb);if(e)ev.push(e);}
  const chunLegs=VER.cur==='CE'&&p.fid===5&&window.SF2CHUNLEGS;

  if(chunLegs){const e=chunLegs.input(p,kb);if(e)ev.push(e);}

  for(const [b,k] of [[pb,'P'],[kb,'K']]){if(chunLegs&&k==='K'||hondaHands&&k==='P')continue;const q=p['MQ'+k]; if(b){q.push(T); while(q.length&&T-q[0]>30)q.shift(); if(q.length>=3){ev.push(['mash',k,low(b)]);q.length=0;}}}
  // 360 (approx.): forward, back and down all seen within 40 ticks, then punch

  if(dir&1)p.R3[0]=T; if(dir&2)p.R3[1]=T; if(dir&8)p.R3[2]=T; if(dir&4)p.R3[3]=T;

  if(pb&&p.R3.slice(0,3).every(t=>T-t<=40)){ev.push(['360','P',low(pb)]);p.R3=[-99,-99,-99,-99];}

  // PPP: two or more punch buttons within 3 ticks

  for(let i=0;i<3;i++)if(pb&(1<<i))p.PT[i]=T;const ceGief=VER.cur==='CE'&&p.fid===6;

  if(ceGief?pb===7:pb&&p.PT.filter(t=>T-t<=3).length>=2){ev.push(['ppp','P',2]);p.PT=[-99,-99,-99];}

  // KKK (CE Zangief quick lariat)

  if(!p.KT)p.KT=[-99,-99,-99]; for(let i=0;i<3;i++)if(kb&(1<<i))p.KT[i]=T; if(!ceGief&&kb&&p.KT.filter(t=>T-t<=3).length>=2){ev.push(['kkk','K',2]);p.KT=[-99,-99,-99];}

  // CE Balrog Turn Punch: hold all three punches (or kicks) >= 60 ticks, then release

  {const hp=((keys>>4)&7)===7,hk=((keys>>7)&7)===7; if(hp||hk){p.TPH=(p.TPH||0)+1;p.TPF=hp?'P':'K';} else {if(p.TPH>=60)ev.push(['tp',p.TPF,2]);p.TPH=0;}}

  return ev;}

// ---- per-player update (one tick) ----

function carMode(p){return VER.cur==='CE'&&G.scene==='bonus'&&G.bon?.kind===0&&p===P[0]&&!!window.SF2CECAR;}

function ceBarrelMode(){return VER.cur==='CE'&&G.scene==='bonus'&&G.bon?.kind===1&&!!window.SF2CEBARRELS&&!!window.SF2CEBARRELPLAYER;}

function ceBonusScore(command,side=0){const amount=window.SF2CECOMBAT?.scoreAmount(command);if(amount!==null&&amount!==undefined)P[side].SCORE=Math.min(9999999,(P[side].SCORE||0)+amount);}

function ceBarrelHooks(B,p,attack=null,projectile=null){return {

  ready:G.st>=100,tick:G.tick,rand,image:bim,attack,projectile,

  record:isFFGuest(p)?[0,0,0,0,0,p.AIAttackSerial%120+1,0x2a,0,ent(p)[8]||0,0,0,0]:window.SF2CECOMBAT?.record(p),projectileRecord:isDamnd(p)&&p.AIDamndBarrel?[0,0,0,0,0,60,0x2a,0,2,0,0,0]:window.SF2CECOMBAT?.projectileRecord(p),

  playerHurt:[0,1,2].map(k=>boxw(p,k)).filter(Boolean),

  onPlayerHit:(q,hit)=>{const region=hit.attackBox?hurtregion(hit.attackBox,q):-1,hurt=region>=0?boxw(q,region):null;if(SF2CEBARRELPLAYER.begin(B,q,{...hit,airborne:q.ST===S_AIR,sound:sfxc})&&hurt)SF2CEBARRELS.impactEffect(B,{selector:2,x:(hit.attackBox[0]+hurt[0])>>1,y:(hit.attackBox[1]+hurt[1])>>1,face:hit.direction>0?1:0});},

  hitStop:(q,ticks,barrel,isProjectile)=>{aiBonusContact(q,!isProjectile);if(!isProjectile)SF2CEBARRELPLAYER.stop(B,q,ticks);},

  projectileConsumed:q=>{q.FBON=0;},

  scoreCommand:ceBonusScore,sound:sfxc,finish:result=>bonusend(result)

};}

function carLanding(p){if(p.CARSUPPORT){p.CARLATCH=1;return true;}if((p.Y>>8)<0){p.Y&=255;return true;}return false;}

const CAR_FALL=[[5,7],[5,9],[5,10],[5,7],[5,7],[5,1],[5,5],[7,4],[5,5],[5,5],[5,5],[5,6]];

function carWalkoff(p){const [slot,entry]=CAR_FALL[p.fid],base=p.F.anims[slot];setanim(p,slot,entry);p.anim={...base,mode:0,loop:base.ents.length-1};p.acc=-1;Object.assign(p,{ST:S_AIR,VX:0,VY:0,AX:0,AY:0x48,PJ:0,JA:0,JN:true,JAN:slot,CARLATCH:0});}

function carResolve(p){if(!carMode(p))return;const c=SF2CECAR.platform(G.bon,p);p.CARSUPPORT=c.supported?1:0;p.CARSIDE=c.pushX>0?1:c.pushX<0?2:0;if(c.supported)p.Y=(c.floorY<<8)|(p.Y&255);else if(c.pushX)p.X+=c.pushX<<8;if(aiEnabled()&&p.AIAir&&c.supported){p.CES=p.MV=null;toidle(p);const a=AI(p,'biteland');if(a>=0){setanim(p,a,0);p.CEVLAND=7;}sfxc(XS(p)&&0x2f);}}
function cePrejumpTicks(a){let i=0,t=a.ents[0][1],elapsed=0;do{elapsed++;if(--t===0){i++;if(i>=a.ents.length)i=a.loop||0;t=a.ents[i][1];}}while((a.flags[i]&255)!==0&&elapsed<120);return elapsed;}

function gravity(p){p.VX-=p.AX;p.VY-=p.AY;p.X+=p.VX;p.Y+=p.VY;

  if(p.VY<0){if(carMode(p)){if(carLanding(p)){p.VX=p.VY=0;return false;}}else if(VER.cur==='CE'&&p.ST===S_AIR&&!isEvilKen(p)&&!isFFGuest(p)){if((p.Y>>8)<0){p.Y&=255;return false;}}else if(p.Y<=0){p.Y=0;p.VX=0;p.VY=0;return false;}}return true;}

/* CE sound: the CE 68000's own sound commands (latch 0x800181, traced per fighter/move in the box emulator, tools/ce_snd.json)

   go to the CE Z80 program on the worklet; WW (or before audio starts) keeps the direct OKI phrase ids */

function sfxc(code,old,vol){ if(VER.cur!=='CE'||!code){if(old!=null)snd(old,vol);return;}

  (G.cmdlog||(G.cmdlog=[])).push(code);if(G.cmdlog.length>512)G.cmdlog.shift();if(netReplaying)return; if(SN)SN.port.postMessage({c:code});else if(AC)SNQ.push({c:code});}

const XS=p=>VER.cur==='CE'&&p.F.sfx||null;

function AI(p,n){const c=p.F._ai||(p.F._ai={});if(!(n in c)){c[n]=p.F.anims.findIndex(a=>a.name===n);if(c[n]<0&&isEvilKen(p))c[n]=SF2AIEvilKen.animation(p,n);}return c[n];}

function btnof(n){for(const b of [AN_SLP,AN_CLP,AN_NEAR,AN_JD,AN_JU])if(n>=b&&n<b+6)return n-b;return -1;}

const THK={throw:1,athrow:1};

function toidle(p){if(aiEnabled()&&p.AIAir){if(!aiOnFloor(p)){aiResumeAir(p);return;}delete p.AIAir;p.CES=p.MV=null;}if(aiEnabled()&&(p.Y>>8)===0)p.Y=0;if(aiEnabled()&&[S_HIT,S_DOWN,S_GETUP].includes(p.ST))aiBreakCombo(p.opp);setanim(p,AN_IDLE,0);if(!carMode(p)&&!(VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)&&(p.Y>>8)===0))p.Y=0;p.ST=S_FREE;}
function relth(p){const o=p.opp,v=p.THV;p.THV=null;hpDamage(o,v.dmg);o.X=p.X+v.d*(40<<8);fallst(o,hpAlive(o)?S_DOWN:S_KO,v.d);const X=XS(p);sfxc(X&&X.fall,SN_HIT[2]);}

const cethooks=()=>({find:AI,anim:setanim,idle:toidle,fall:fallst,sound:sfxc,tick:animstep});

function endCeVictim(p){if(isEvilKen(p))SF2AIEvilKen.passive(p);return end(p);}

function ceReactionRelease(p,result){

  p.KB=p.STUN=0;p.CERRESUME=!result.guard&&!result.crouching;

  if(result.guard){p.CEGUARD={phase:result.crouching?4:0};p.ST=result.crouching?S_CR:S_FREE;return;}

  p.CEGUARD=null;if(result.crouching){p.ST=S_CR;setanim(p,AN_CROUCH,Math.min(2,p.F.anims[AN_CROUCH].ents.length-1));}else toidle(p);

}

function ceCommonReaction(d,owner,options){

  const R=window.SF2CEREACTION;if(VER.edition!=='ce'||!R||!hpAlive(d)||d.ST===S_DOWN||d.ST===S_KO||!R.data.common.includes(options.reaction))return false;

  if(options.previousPose){Object.assign(d,options.previousPose);d.anim=d.F.anims[d.cur];}

  delete d.CEPF;d.CES=null;d.MV=null;d.CERRESUME=false;

  if(!R.begin(d,owner,options))return false;

  // 0x7b2e/0x8228 updates actors before 0x7b32/0x94f1c hits. The late

  // collision sets stop14; next actor dispatch is old-pose c0, then c1 init.

  d.ST=options.blocked?S_BLK:S_HIT;

  return true;

}

// Public hook permits the collision owner to integrate after applyhit without

// moving collision or scene ordering. No global hitstop is created here.

window.SF2CECOMMONREACTION=ceCommonReaction;

function ceGuardOptions(p){

  const o=p.opp,source=o.anim?.source+24*o.aidx;

  return {attacking:[S_ATK,S_SPEC].includes(o.ST)&&!!window.SF2CEREACTIONDATA?.postures[source],projectile:o.FBON?{X:o.FBX,FACE:o.FBVX>0?1:0}:null,opponentFlagsLow:o.anim?.flags[o.aidx]&255};

}

const hondaHooks=()=>({find:AI,anim:setanim,tick:animstep,idle:toidle,sound:sfxc,rand,human:q=>q.i===0||!!G.mode2p&&!G.netBot,roundOver:()=>G.gph!==1,contactDelay:n=>{G.CEHHContactDelay=n;},dead:(victim,owner,dir)=>{G.hfz=0;owner.CEKOOwnerStop=12;SF2CEROUND.beginKO(victim,dir,0);},facing:q=>SF2CEHONDAHOLD.desired(q,P),camera:()=>G.cam,extent:q=>CE_CAM_EXTENT[q.fid],freeze:n=>{G.hfz=n;},release:q=>{q.ST=S_FREE;q.KB=q.STUN=0;q.CEVLAND=6;q.CEHHVLAND=true;q.CEHHDesired=SF2CEHONDAHOLD.desired(q,P);setanim(q,AI(q,'biteland'),0);q.acc=-1;if(q.CEHHDesired!==q.FACE){q.FACE=q.CEHHDesired;q.CEVLAND=0;delete q.CEHHVLAND;q.CEHHRecovery='turn';setanim(q,SF2CEVEGA.registerTurn(q),0);q.acc=-1;}sfxc(0x2f);}});
const ceDizzyHooks=()=>({world:G,clock:G.tick,random:()=>rand()&255,visible:ceObjectVisible,sound:sfxc,alive:hpAlive,human:p=>p.i===0||!!G.mode2p&&!G.netBot,countDizzy:()=>{G.dizzies=(G.dizzies||0)+1;},release:toidle,tick:animstep,land:p=>SF2CEDIZZY.land(G,p,ceDizzyHooks())});
function update(p){const source=VER.edition==='ce'&&G.scene==='fight';if(source)SF2CEDIZZY.decay(p,ceDizzyHooks());const result=update0(p);if(source)SF2CEDIZZY.admit(p,ceDizzyHooks());return result;}
function update0(p){if(aiEnabled()&&p.AIAir&&p.ST!==S_SPEC){delete p.AIAir;p.CES=p.MV=p.AIRift=null;}p.X0=p.X;if(VER.edition==='ce'&&G.CERound){const h=ceRoundHooks();if(p.CEKO?.nativeSpecial&&SF2CESPECIAL.body(p,G,ceDizzyHooks()))return;if(p.CEKO&&SF2CEROUND.koStep(p,h))return;if(p.CEWin&&SF2CEROUND.winStep(p,SF2CEROUND.blocked(G.CERound),h))return;if(p.CEKOOwnerStop>0){p.CEKOOwnerStop--;return;}}if(p.CEVNSTART){const n=p.CEVNSTART;delete p.CEVNSTART;if(p.ST===S_ATK){setanim(p,n.slot,n.entry);if(p.fid===1)p.CEHHSCancel=5;if(n.whiff)sfxc(...n.whiff);p.CENORMALINIT=ceNativeNormal(p)&&[1,11].includes(p.fid);}}if(p.CEVLAND&&p.ST!==S_FREE)delete p.CEVLAND;if(p.CES?.kind==='vegaflip'&&p.ST!==S_SPEC){p.CES=null;p.MV=null;}if(VER.cur==='CE'&&window.SF2CETHROWS&&SF2CETHROWS.actor&&SF2CETHROWS.actor(p,cethooks()))return endCeVictim(p);if(VER.cur==='CE'&&window.SF2CEBITE&&SF2CEBITE.victim(p,{fall:(q,d)=>fallst(q,hpAlive(q)?S_DOWN:S_KO,d),find:AI,anim:setanim,idle:q=>{if(hpAlive(q))toidle(q);else{q.ST=S_KO;setanim(q,AN_FALL+1,0);}},land:q=>sfxc(XS(q)&&0x2e)}))return endCeVictim(p);if(p.THV&&(p.ST!==S_SPEC||p.MV&&!THK[p.MV.kind]&&p.cur!==p.THAN)){if(p.AIFFThrow||p.AIFFHold)SF2AIFF.cancelThrow(p,{drop:q=>fallst(q,hpAlive(q)?S_DOWN:S_KO,q.FACE?-1:1)});else relth(p);}
  if(p.VQ){if(p.ST!==S_SPEC)p.VQ=null;else{p.VT++;while(p.VQ.length&&p.VQ[0][0]<=p.VT)sfxc(p.VQ.shift()[1]);}}

  if(p.WAKET>0)p.WAKET--; if(p.LANDT>0)p.LANDT--;

  if(p.ST===S_FREE&&p.PST===S_GETUP)p.WAKET=6; if((p.ST===S_FREE||p.ST===S_CR)&&p.PST===S_AIR)p.LANDT=4; p.PST=p.ST;

  if(VER.edition==='ce'&&window.SF2CEHONDAHOLD?.recovery(p,hondaHooks()))return end(p);
  if(VER.edition==='ce'&&window.SF2CEHONDAHOLD?.victim(p,hondaHooks()))return end(p);
  const keys=p.KEYS, nw=keys&~p.PREV, rel=p.PREV&~keys; p.PREV=keys;p.HZK=keys;

  let ev=motion(p,keys,nw,rel); const force=p.FORCE; p.FORCE=0;
  if(aiEnabled())ev=SF2AIRULES.defer(p,ev,G.tick);
  const aiFrame=aiEnabled()?SF2AIRULES.controls(p):null;
  if(aiEnabled()&&p.AIFFHeld?.choke)return;
  // Native intro actors recognize charge/input, but cannot walk, jump or attack.
  if(G.scene==='fight'&&G.gph===0)return controls(p,{keys:0,nw:0,ev:[],force:0,rel:0});
  if(VER.cur==='CE'&&G.scene==='bonus'&&G.bon.kind<2&&window.SF2CEBARRELPLAYER)SF2CEBARRELPLAYER.facing(G.bon,p,{ready:G.st>=100,airborne:p.ST===S_AIR||G.bon.barrels?.player?.phase==='air'});

  if(ceBarrelMode()&&SF2CEBARRELPLAYER.actor(G.bon,p,{tick:animstep,idle:toidle,frame:G.tick,pressed:nw,random:rand,sound:sfxc,intro:G.st<100,airborne:p.ST===S_AIR}))return;

  if(VER.edition==='ce'&&![S_FREE,S_CR].includes(p.ST))p.CEGUARD=null;

  // CE projectile stop is local: input/charge recognition above continues;

  // reaction initialization and14timer ticks hold victim physics/animation.

  if(VER.cur==='CE'&&G.scene==='fight'&&SF2CESPECIAL.body(p,G,ceDizzyHooks()))return;
  if(VER.edition==='ce'&&G.scene==='fight'&&SF2CEDIZZY.body(p,G,ceDizzyHooks()))return;
  if(VER.cur==='CE'&&p.CEPF){const c=p.CEPF;if(c.init){Object.assign(p,c.pose);p.anim=p.F.anims[p.cur];c.init=0;return;}if(c.ticks>0){c.ticks--;return;}p.CEPF=null;}

  let ceCommonReleased=false,ceSkipAnimation=!!p.CENORMALINIT;delete p.CENORMALINIT;

  if(VER.edition==='ce'&&window.SF2CEREACTION){

    if(p.CER){p.CERRESUME=false;SF2CEREACTION.step(p,{tick:animstep,release:ceReactionRelease});if(!p.CERRESUME)return;ceCommonReleased=true;p.CERRESUME=false;}

    if(SF2CEREACTION.ownerStep(p))return;

  }

  const heatCommands=[];if(isEvilKen(p)&&p.AIButtons?.queue?.command&&p.AIButtons.queue.command!=='rift'&&[S_FREE,S_CR,S_UP,S_AIR,S_SPEC].includes(p.ST)){heatCommands.push(SF2AIRULES.claim(p).command);}
  if(isEvilKen(p)&&SF2AIEvilKen.update(p,{keys,pressed:p.AIEvilKen?.adapter.heat.move?(nw|(aiFrame?.nw??0)):(aiFrame?.nw??nw),commands:heatCommands},{anim:setanim,idle:toidle,tick:animstep,sound:sfxc}))return end(p);
  if(aiEnabled()){if(p.aiProfile==='evil-ryu'&&p.AIButtons?.queue?.command==='rift'){SF2AIRULES.claim(p);p.AIRiftRequest=G.tick;}if(aiTryRift(p))return end(p);if(aiRiftStep(p))return end(p);if(p.AIRift)p.AIRift=null;if(p.ST===S_FREE||p.ST===S_CR)p.AIIdleTick++;}
  if(carMode(p)&&[S_FREE,S_CR,S_UP].includes(p.ST)){if(!p.CARSUPPORT)p.CARLATCH=0;if(!p.CARSUPPORT&&(p.Y>>8)>0){carWalkoff(p);return end(p);}}

  return controls(p,{keys:aiFrame?.keys??keys,nw:aiFrame?.nw??nw,ev,force,rel:aiFrame?.rel??rel},ceCommonReleased,ceSkipAnimation);}
// Reuse the ordinary controls after a native special-to-ground landing without

// reading inputs, charge counters or the global game clock a second time.

function controls(p,input,ceCommonReleased=false,ceSkipAnimation=false){

  let {keys,nw,ev,force,rel=0}=input;
  if(aiEnabled()&&['fight','bonus'].includes(G.scene)&&G.gph===1){const button=SF2AICHAIN.take(p,G.tick,!!force||ev.some(e=>e[0]!=='mash')||!!p.AIButtons?.queue);
   if(button>=0&&(G.scene==='bonus'||hpAlive(p.opp)&&p.opp.ST!==S_KO)){const crouch=!!p.AIChain.cancelCrouch,gap=Math.abs(p.opp.X-p.X)/256,n=crouch?crn(p,button):gap<NTHR[p.fid][button]&&p.F.anims[AN_NEAR+button]?AN_NEAR+button:AN_SLP+button;
    if(G.scene==='fight')p.X+=(p.opp.X>p.X?1:-1)*Math.min(16,Math.max(0,gap-32))*256;delete p.CEVNSTART;delete p.CENORMALINIT;delete p.CESLREC;p.NSL=p.CEST=null;p.FACE=p.opp.X>p.X?1:0;setanim(p,n,0);p.ST=S_ATK;p.RETCR=crouch?1:0;
    // Hold the confirmed victim through the next move's startup. A cancelled
    // normal knockdown is caught before it becomes an unchainable floor fall.
    if(G.scene==='fight'){const d=p.opp;if([S_DOWN,S_GETUP].includes(d.ST)){setanim(d,AN_HITL+Math.min(2,button%3),0);d.ST=S_HIT;d.Y=d.VX=d.VY=d.AX=d.AY=0;d.DIZZY=0;}let startup=0;for(const e of p.anim.ents){if(e[6]?.[2])break;startup+=e[1];}d.STUN=Math.max(d.STUN||0,startup+6);d.KB=Math.trunc((d.KB||0)*.25);}p.AIConfirm=-1;return end(p,true);
   }
  }
  if(aiEnabled()&&p.AIButtons?.motion?.events.some(e=>e[0]==='cdu'))keys&=~K_U;

  let landingPose=null;

  if(VER.cur==='CE'&&p.CEVLAND){

    if(p.ST!==S_FREE){p.CEVLAND=0;delete p.CEHHVLAND;}
    else if(!(keys&12)&&!(nw&0x3f0)&&!ev.length&&!force&&!(VER.edition==='ce'&&window.SF2CEREACTION?.guardAdmission(p,ceGuardOptions(p)))&&(p.CEHHVLAND?(p.CEHHDesired??p.FACE)===p.FACE:(p.opp.X===p.X||(p.opp.X>p.X?1:0)===p.FACE))&&--p.CEVLAND>0)return end(p,true);
    else{if(p.CEHHVLAND&&(p.CEHHDesired??p.FACE)!==p.FACE&&!(keys&1023)&&!ev.length&&!force){p.FACE=p.CEHHDesired;p.CEHHRecovery='turn';setanim(p,SF2CEVEGA.registerTurn(p),0);p.acc=-1;p.CEVLAND=0;delete p.CEHHVLAND;return end(p);}delete p.CEHHVLAND;landingPose={cur:p.cur,anim:p.anim,aidx:p.aidx,acc:p.acc,adone:p.adone};p.CEVLAND=0;const y=p.Y;toidle(p);p.Y=y;if(keys&K_D)ceSkipAnimation=true;}
  }

  const st=p.ST,normalPose={cur:p.cur,anim:p.anim,aidx:p.aidx,acc:p.acc,adone:p.adone};

  /* M13d: arcade reversal - a special completed 1 frame before the fighter is free (wakeup, block/hitstun end) still comes out */

  if(ev.length&&st!==S_FREE&&st!==S_CR&&st!==S_ATK&&st!==S_SPEC)p.EVB=[ev,G.tick];

  else if(!ev.length&&(st===S_FREE||st===S_CR)&&p.EVB&&G.tick-p.EVB[1]<=1)ev=p.EVB[0];

  if(st===S_FREE||st===S_CR)p.EVB=null;

  if((st===S_FREE||st===S_CR)&&!isEvilKen(p)){if(VER.cur==='CE'&&G.scene==='bonus'&&G.bon.kind<2&&window.SF2CEBARRELPLAYER)p.FACE=G.bon.nativeDesiredFacing??1;else{const ox=p.opp.X; if(ox>p.X)p.FACE=1; else if(ox<p.X)p.FACE=0;}}

  let dx=(keys&K_R?1:0)-(keys&K_L?1:0); if(!p.FACE)dx=-dx;

  if(aiEnabled()&&[S_FREE,S_CR,S_UP,S_AIR].includes(st)&&!(st===S_AIR&&p.PJ)){const chord=SF2AIRULES.claim(p);if(chord){if(chord.command==='rift'){p.AIRiftRequest=G.tick;if(aiTryRift(p))return end(p);}else if(!chord.command&&startspec(p,[],(chord.strength<<4)|(chord.index+1)))return end(p);}}
  if(aiEnabled()&&(ev.length||force)&&([S_FREE,S_CR,S_UP,S_AIR].includes(st)||st===S_ATK&&ev.some(e=>e[0]==='mash'))&&!(st===S_AIR&&p.PJ)&&startspec(p,ev,force))return end(p);
  let atk=-1; {let b=(nw>>4)&63; if(b){atk=0;while(!(b&1)){b>>=1;atk++;}}}

  // mash-capable button family (Honda/Blanka punches, Chun-Li kicks): a lone tap still gives the normal, but it is

  // no longer deferred (CE ROM starts it next frame); further taps (or mashing) are swallowed, so the mash special starts clean

  if(st===S_FREE||st===S_CR||st===S_ATK){ const fam=atk<0?null:atk<3?'P':'K';

    if(fam&&!(VER.cur==='CE'&&p.fid===5&&fam==='K'&&window.SF2CHUNLEGS)&&!(st===S_FREE&&dx!==0&&atk%3&&canthrow(p,atk>=3))&&p.F.moves.some(m=>m.inp==='mash'&&m.btn===fam)){

      /* ROM-measured (fdtrace2 lag): the first tap's normal starts at once; only follow-up taps are swallowed so the mash special can take over */

      if(p['MQ'+fam].length>=2||st===S_ATK&&p.MASHF===fam){p.MASHF=fam;atk=-1;} else p.MASHF=null; } }

  if(st!==S_FREE&&st!==S_CR&&st!==S_ATK)p.PENDT=0;

  let ceWhiff=null;

  if(atk>=0&&!(VER.cur==='CE'&&p.fid===7&&st===S_AIR)&&(st===S_FREE||st===S_CR||st===S_AIR&&!p.JA&&!p.PJ)){const X=XS(p),args=[X&&(st===S_CR||keys&K_D?X.whc:X.wh)[atk],SN_WHIFF,0.35];if(VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)&&[S_FREE,S_CR].includes(st)&&([0,4,7].includes(p.fid)||p.fid===11&&atk===0))ceWhiff=args;else if(!isFFGuest(p)||isDamnd(p))sfxc(...args);if(isFFGuest(p))ffSound(p,'swing');}

  if(VER.cur==='CE'&&st===S_SPEC&&atk>=0&&atk<3&&p.MV&&p.MV.inp==='cdu'&&p.MV.kind==='rise'&&p.Y>(24<<8)&&bossair(p,dx))return end(p);

  if((ev.length||force)&&((aiEnabled()&&st===S_AIR&&!p.PJ)||st===S_FREE||st===S_CR||st===S_UP||(VER.cur==='CE'&&window.SF2CEVEGA&&p.fid===11&&st===S_AIR&&(p.Y>>8)===0&&ev.some(e=>e[0]==='cdu'&&e[1]==='K'))||(st===S_ATK&&VER.edition==='ce'&&p.fid===3&&ev.some(e=>e[0]==='cbf'||e[0]==='cdu'))||(st===S_ATK&&ev.some(e=>e[0]==='mash'&&!(VER.cur==='CE'&&p.fid===5&&window.SF2CHUNLEGS)||e[0]==='ppp'))||(st===S_SPEC&&p.MV&&p.MV.inp==='mash'&&!(VER.cur==='CE'&&p.fid===5&&window.SF2CHUNLEGS)))&&startspec(p,ev,force))return end(p);
  if(VER.edition==='ce'&&window.SF2CEREACTION&&[S_FREE,S_CR].includes(st)){

    if(atk<0&&!(keys&K_U)){if(SF2CEREACTION.guard(p,{tick:animstep,release:ceReactionRelease},ceGuardOptions(p))){if(p.CEGUARD)p.ST=p.CEGUARD.phase>=4?S_CR:S_FREE;return;}}

    else p.CEGUARD=null;

  }

  const ad=p.adone;

  switch(st){

  case S_FREE:

    if(keys&K_U){let n=AN_JUMPN,j=2;if(dx>0){n=AN_JUMPF;j=4;}else if(dx<0){n=AN_JUMPB;j=3;}

      setanim(p,n,0);const nativeJump=VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p);if(nativeJump&&dx)j=dx>0?3:4;let [vx,ax,vy,ay]=p.ft[j];if(nativeJump?p.FACE:!p.FACE){vx=-vx;ax=-ax;}Object.assign(p,{VX:vx,AX:ax,VY:vy,AY:ay,PJ:nativeJump?cePrejumpTicks(p.anim):isFFGuest(p)?PJCE[7]-1:VER.cur==='CE'?PJCE[p.fid]-1:3,JA:0,JN:dx===0,JAN:n});p.ST=S_AIR;ceSkipAnimation=ceCommonReleased||VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p);break;}

    if(keys&K_D){if(atk>=0){if(zgrab(p,atk))break;setanim(p,crn(p,atk),0);p.RETCR=1;p.ST=S_ATK;break;}setanim(p,AN_CROUCH,0);p.ST=S_CR;if(VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p))ceSkipAnimation=true;break;}

    if(atk>=0&&dx!==0&&atk%3&&trythrow(p,atk))break;

    if(VER.cur==='CE'&&p.fid===3&&atk===5&&dx>0&&(Math.abs(p.opp.X-p.X)>>8)<=GFHK_CE[p.opp.fid]&&AI(p,'fHK')>0){setanim(p,AI(p,'fHK'),0);p.RETCR=0;p.ST=S_ATK;break;}

    if(atk>=0){const cd=Math.abs(p.opp.X-p.X)>>8,nativeClose=VER.cur==='CE'&&carMode(p)?SF2CECAR.closeNormal(G.bon,p,atk):ceBarrelMode()?SF2CEBARRELS.closeNormal(G.bon,p,atk):null;setanim(p,((nativeClose??(cd<NTHR[p.fid][atk]))&&p.F.anims[AN_NEAR+atk]?AN_NEAR:AN_SLP)+atk,0);p.RETCR=0;p.ST=S_ATK;break;}

    if(!(VER.edition==='ce'&&window.SF2CEREACTION)&&dx<0&&proxblk(p)){wantanim(p,AN_BLOCKS);break;}

    {let n=dx===0?AN_IDLE:dx>0?AN_WALKF:AN_WALKB, v=dx>0?p.ft[0]:dx<0?p.ft[1]:0; if(dx<0)v=-v; if(!p.FACE)v=-v; p.X+=v; wantanim(p,n);} break;

  case S_CR:

    if(atk>=0){if(zgrab(p,atk))break;setanim(p,crn(p,atk),0);p.RETCR=1;p.ST=S_ATK;break;}

    if(!(keys&K_D)){if(VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)){animstep(p);const timer=p.anim.ents[p.aidx][1]-p.acc;setanim(p,AN_STANDUP,0);p.acc=p.anim.ents[0][1]-timer;ceSkipAnimation=true;}else setanim(p,AN_STANDUP,0);p.ST=S_UP;} break;

  case S_HIT: case S_BLK: if(p.STUN>0&&--p.STUN>0)break; if(p.DIZZY){p.DIZZY=0;}

    if(p.RETCR&&(keys&K_D)){setanim(p,AN_CROUCH,2);p.ST=S_CR;} else toidle(p); break;

  case S_ATK:

    // These controllers test the terminal flag before ticking. Shotos also

    // retain their outer animation tick after the common standing/crouch return.

    if(ceNativeNormal(p)){if(!(p.anim.flags[p.aidx]&0x8000))break;if(p.RETCR&&(keys&K_D)){setanim(p,AN_CROUCH,2);p.ST=S_CR;}else toidle(p);if(p.fid!==11)animstep(p);if(p.fid===1&&atk>=0){p.CEVNSTART={slot:AN_SLP+atk,entry:0};}break;}
    if(!ad)break; if(p.RETCR&&(keys&K_D)){setanim(p,AN_CROUCH,2);p.ST=S_CR;} else toidle(p); break;

  case S_UP: if(VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)&&p.cur===AN_STANDUP){animstep(p);ceSkipAnimation=true;if(p.anim.flags[p.aidx]&0x8000){toidle(p);ceSkipAnimation=false;}break;}if(ad||p.CESLREC&&(p.anim.flags[p.aidx]&0x8000)){if(p.CESLREC){p.CESLREC=0;if(keys&K_D){setanim(p,AN_CROUCH,2);p.ST=S_CR;}else toidle(p);}else toidle(p);} break;

  case S_GETUP: if(ad){ if(p.DIZZY===1){p.DIZZY=2;setanim(p,isFFGuest(p)?103:AN_HITL+1,0);p.ST=S_HIT;p.STUN=DIZT;p.RETCR=0;} else toidle(p);} break;

  case S_AIR: if(p.PJ>0){p.PJ--;break;}
    if(VER.cur==='CE'&&SF2CENORMALS.air(p,atk,keys,{tick:animstep,idle:toidle,sound:code=>sfxc(code)}))break;

    if(VER.cur==='CE'&&window.SF2CHUNAIR&&SF2CHUNAIR.step(p,G.cam))break;

    if(atk>=0&&!p.JA&&VER.cur==='CE'&&window.SF2CHUNAIR&&SF2CHUNAIR.start(p,atk,keys&K_D,{find:AI,anim:setanim}))atk=-1;

    if(atk>=0&&!p.JA&&atk%3&&dx>0&&airthrow(p,atk))break;

    if(atk>=0&&!p.JA&&p.F.anims[AN_JD+atk]){p.JA=1;setanim(p,(p.JN?AN_JU:AN_JD)+atk,0);} // M13b: jump normals (were missing)

    if(!gravity(p)){p.JA=0;p.CEST=null;const landing=VER.cur==='CE'&&!isEvilKen(p)&&!isFFGuest(p)?AI(p,'biteland'):-1;if(landing>=0){p.CEVLAND=7;p.ST=S_FREE;setanim(p,landing,0);sfxc(XS(p)&&0x2f);return end(p,true);}toidle(p);sfxc(XS(p)&&0x2f);} break;

  case S_DOWN: if(p.FALLW>0){p.FALLW--;break;} p.DOWNT=(p.DOWNT||0)+1; if(!gravity(p)&&p.cur===AN_FALL&&p.Y===0&&p.DOWNT>4){setanim(p,AN_FALL+1,0);sfxc(XS(p)&&0x2e);} else if(p.Y===0&&p.VY===0&&p.adone&&p.DOWNT>=KDT){setanim(p,AN_GETUP,0);p.ST=S_GETUP;} break;

  case S_KO: p.DOWNT=(p.DOWNT||0)+1; if(!gravity(p)&&p.cur===AN_FALL&&p.DOWNT>4){if(p.Y===0&&p.cur===AN_FALL)sfxc(XS(p)&&0x2e);setanim(p,AN_FALL+1,0);} break;

  case S_SPEC: if(spec(p,input))return;break;

  }

  if(p.ST===S_ATK&&[S_FREE,S_CR].includes(st)&&ceNativeNormal(p)){const slot=p.cur;Object.assign(p,landingPose||normalPose);p.CEVNSTART={slot,entry:0,whiff:ceWhiff};ceSkipAnimation=st!==S_CR;}

  else if(landingPose&&p.ST===S_ATK){const slot=p.cur;Object.assign(p,landingPose);p.CEVNSTART={slot,entry:0};ceSkipAnimation=true;}

  if(ceWhiff&&!p.CEVNSTART&&p.ST===S_ATK)sfxc(...ceWhiff);

  return end(p,ceSkipAnimation);}

// knockback now applied every 60Hz frame (was the 25fps cadence): same total distance, decay 0.75^(5/12) per frame

function end(p,skipAnimation=false){if(aiEnabled()&&p.aiProfile==='rolento')SF2AIFF.wallJump(p,{anim:setanim,room:aiRoom,sound:()=>ffSound(p,'swing')});if(p.fid===1&&p.CEHHSCancel>0)p.CEHHSCancel--;if(aiEnabled()&&[S_FREE,S_CR,S_UP].includes(p.ST)&&(p.Y>>8)===0)p.Y=0;if(VER.cur==='CE'&&window.SF2CEVEGACLAW)SF2CEVEGACLAW.actor(p,{rand});if(VER.cur==='CE'&&window.SF2CEVEGA)SF2CEVEGA.normal(p,{find:AI,anim:setanim,idle:toidle});const ceNormalOwns=VER.cur==='CE'&&window.SF2CENORMALS&&SF2CENORMALS.step(p,{tick:animstep,slideFinish:q=>{setanim(q,AN_CROUCH,2);q.ST=S_CR;animstep(q);if(!(q.KEYS&K_D)){const timer=q.anim.ents[q.aidx][1]-q.acc;setanim(q,AN_STANDUP,0);q.acc=q.anim.ents[0][1]-timer;q.ST=S_UP;}},finish:q=>{const face=q.opp.X>q.X?1:0,a=AI(q,'slidecrouch');if(face!==q.FACE&&a>=0){q.FACE=face;setanim(q,a,0);q.acc=-1;q.ST=S_UP;q.CESLREC=1;}else if(q.KEYS&K_D){setanim(q,AN_CROUCH,2);q.ST=S_CR;}else toidle(q);}});
  if(p.KB){p.X+=(p.KB*29)>>6;let k=p.KB-((p.KB*29)>>8);if(k+63>>>0<127)k=0;p.KB=k;}if(!skipAnimation&&!ceNormalOwns)animstep(p);if(p.CESLREC&&(p.anim.flags[p.aidx]&0x8000)){p.CESLREC=0;if(p.KEYS&K_D){setanim(p,AN_CROUCH,2);p.ST=S_CR;}else toidle(p);}}

const DASHV=[0x300,0x400,0x500];

function startspec(p,ev,force){const air=aiEnabled()&&p.ST===S_AIR&&!p.PJ;const mv=p.F.moves; let m=null,str=0;
  if(force){const k=(force&15)-1; if(mv[k]){m=mv[k];str=force>>4;}}

  else for(const x of mv){const e=ev.find(e=>e[0]===x.inp&&e[1]===x.btn); if(e){m=x;str=e[2];break;}}

  if(!m)return false; if(str>2)str=2;
  if(isFFGuest(p)&&!isDamnd(p)&&m.kind==='ff'){if(air&&!(p.aiProfile==='rolento'&&['grenade','grenade-barrage'].includes(m.style))&&!(p.aiProfile==='andore'&&m.style==='seatdrop'))return false;AI_SPECIAL_VOICES[p.i]={last:{commands:[[0,0x25]],sample:null,kind:'ff',tick:G.tick}};return SF2AIFF.start(p,m,str,{anim:setanim,sound:()=>ffSound(p,'special')});}if(isDamnd(p)&&m.kind==='damnd'){if(air)return false;AI_SPECIAL_VOICES[p.i]={last:{commands:[[0,0x25]],sample:null,kind:'damnd',tick:G.tick}};return SF2AIDamnd.start(p,m,str,{anim:setanim,sound:sfxc});}if(VER.edition==='ce'&&p.fid===1&&m.inp==='mash'&&p.ST===S_ATK&&!p.CEHHSCancel)return false;if(p.CES?.kind==='hundredhands'&&p.MV===m)return false;
  if(aiEnabled()&&p.AIButtons)p.AIButtons.motion=null;
  if(m.kind==='fb'&&p.FBON)return false;if(VER.cur==='CE'&&p.fid===7&&(p.CEYogaLink||m.inp==='hcf'&&p.FBON))return false;

  const o=p.opp;

  if(m.kind==='grab'){if(!(Math.abs(o.X-p.X)<(64<<8)&&hurtable(o)&&(air?Math.abs(o.Y-p.Y)<(96<<8):(VER.cur==='CE'?(o.Y>>8)===0:o.Y===0)&&o.ST!==S_AIR)))return false;}
  if(p.ST===S_SPEC&&p.MV===m&&p.CES?.kind!=='hundredhands'){p.SCNT=Math.max(p.SCNT,24);const X=XS(p),q=X&&X.sp[mv.indexOf(m)];if(q&&q.length)sfxc(q[0][1]);return true;}   // mash extends the move
  if(VER.edition==='ce'&&p.fid===3)window.SF2CEGUILEINPUT?.consume(p,m);
  Object.assign(p,{FBTK:0,SPEND:spend(p,mv.indexOf(m),str),MV:m,SPK:m.kind==='fb'?0:1,SPKD:m.kind==='rise'||m.kind==='dash'||m.kind==='tat',SPSTR:str,SPPH:0,RETCR:0,KB:0,SCNT:0,BSL:0});

  let n=m.a+(m.a<45&&m.kind!=='tat'?str:0);

  if(m.kind==='tat'){p.SVX=p.FACE?TATVX[str]:-TATVX[str];p.SVY=0x40000;p.SCNT=str+2;n=AN_TATS;}

  else if(m.kind==='dash'){const v=m.inp==='ppp'||m.inp==='kkk'?0x140:DASHV[str];p.SVX=p.FACE?v:-v;p.SCNT=(m.inp==='ppp'||m.inp==='kkk'?60:22)+8*str;}

  else if(m.kind==='stand')p.SCNT=m.inp==='mash'?36:90;

  else if(m.kind==='grab'){p.SCNT=40;hpDamage(o,30+4*str);p.X=o.X+(p.FACE?-(28<<8):(28<<8));

    fallst(o,hpAlive(o)?S_DOWN:S_KO,p.FACE?1:-1);const X=XS(p);sfxc(X&&X.fall,SN_HIT[2]);}

  const v=VOICE[p.fid],k=mv.indexOf(m),X=XS(p);
  if(aiEnabled()){const voice={commands:(X?.sp[k]||[]).map(e=>e.slice()),sample:v?.[k]??null,kind:m.kind,tick:G.tick};AI_SPECIAL_VOICES[p.i]={last:voice,projectile:m.kind==='fb'?voice:AI_SPECIAL_VOICES[p.i]?.projectile};}

  if(VER.cur==='CE'&&(p.fid===7&&(m.inp==='hcf'||m.inp==='qcf'&&G.scene==='fight')&&window.SF2CEDHALSIM||p.fid===1&&m.inp==='mash'&&window.SF2CEHONDAHANDS||p.fid===11&&window.SF2CEVEGA&&(m.inp==='cbf'&&m.btn==='P'||m.inp==='cdu'&&m.btn==='K'||m.inp==='bb'))){p.VQ=[];p.VT=0;}else if(X){p.VQ=(X.sp[k]||[]).map(e=>e.slice());p.VT=0;while(p.VQ.length&&p.VQ[0][0]<=0)sfxc(p.VQ.shift()[1],v&&v[k]);} else if(v&&v[k])snd(v[k]);
  const previousPose={cur:p.cur,aidx:p.aidx,acc:p.acc,adone:p.adone};setanim(p,n,0);p.ST=S_SPEC;if(isEvilKen(p)&&m.kind==='fb'){p.acc-=6;p.AIEvilKen.metrics.projectileStarts=(p.AIEvilKen.metrics.projectileStarts||0)+1;}if(VER.cur==='CE'&&(p.fid===0||p.fid===4)&&m.kind==='fb')p.acc--;if(air)p.AIAir={base:p.Y,vx:p.VX,vy:p.VY,ay:p.AY,jan:p.JAN};if(VER.cur==='CE'&&window.SF2CESPECIALS)SF2CESPECIALS.init(p,m,{find:AI,anim:setanim,cam:G.cam,stage:G.stage,rand,sound:sfxc,previousPose});return true;}
// generic throw for every fighter: fwd/back + MP/HP/MK/HK at close range on a grounded, free opponent. The thrower

// plays its strong/fierce normal as the throw pose (approximation -- ROM throw anims not exported per fighter), the

// victim is tossed over to the far side and knocked down.

const THROW={kind:'throw'};

/* M13e: throw reach per fighter, measured on the arcade (forward+HP, 2P mode) */

const THRR_WW=[76,92,92,76,76,72,80,92,76,76,76,76];

const THRR_CE=[76,94,94,76,76,73,79,94,79,75,68,75]; // CE: measured in the box emulator on the CE ROM (fwd+HP, 2px scan; Honda/Blanka/Dhalsim beyond scan, kept)

let THRR=THRR_WW;

/* CE ROM throw range matrix THRM_CE[thrower][victim]=[fwd+HP,fwd+HK] max centre gap at the press (tools/emu_ce/thrtrace.py, 1px scan); 0 = no throw */

/* CE ROM takeoff frame after pressing up, per fighter (fdtrace2 jump) */

const PJCE=[4,7,6,4,4,4,6,3,3,3,4,5];

const THRM_CE=[[[77,77],[76,76],[78,78],[78,78],[77,77],[73,73],[93,93],[83,83],[76,76],[80,80],[75,75],[76,76]],[[93,93],[92,92],[94,94],[94,94],[93,93],[89,89],[109,109],[99,99],[92,92],[96,96],[91,91],[92,92]],[[93,0],[92,0],[94,0],[94,0],[93,0],[89,0],[109,0],[99,0],[92,0],[96,0],[91,0],[92,0]],[[77,110],[76,126],[78,123],[78,110],[77,110],[73,106],[93,116],[83,110],[76,110],[80,114],[75,110],[76,110]],[[77,77],[76,76],[78,78],[78,78],[77,77],[73,73],[93,93],[83,83],[76,76],[80,80],[75,75],[76,76]],[[74,80],[90,96],[87,93],[74,80],[74,80],[70,76],[80,86],[74,80],[74,80],[78,84],[74,80],[74,80]],[[80,88],[96,102],[93,101],[80,88],[80,88],[76,84],[86,94],[80,88],[80,88],[84,92],[80,88],[80,88]],[[93,0],[92,0],[94,0],[94,0],[93,0],[89,0],[109,0],[99,0],[92,0],[96,0],[91,0],[92,0]],[[81,0],[80,0],[82,0],[82,0],[81,0],[77,0],[97,0],[87,0],[80,0],[84,0],[79,0],[80,0]],[[77,0],[76,0],[78,0],[78,0],[77,0],[73,0],[93,0],[83,0],[76,0],[80,0],[75,0],[76,0]],[[70,0],[86,0],[83,0],[70,0],[70,0],[66,0],[76,0],[70,0],[70,0],[74,0],[70,0],[70,0]],[[77,0],[76,0],[78,0],[78,0],[77,0],[73,0],[93,0],[83,0],[76,0],[80,0],[75,0],[76,0]]];

function thrr(p,k){return VER.cur==='CE'?(THRM_CE[p.fid][p.opp.fid][k?1:0]||THRM_CE[p.fid][p.opp.fid][0]):THRR[p.fid];}

function canthrow(p,k){const o=p.opp;return Math.abs(o.X-p.X)<=(thrr(p,k)<<8)&&(VER.cur==='CE'?(o.Y>>8)===0&&(p.Y>>8)===0:o.Y===0&&p.Y===0)&&hurtable(o)&&(o.ST===S_FREE||o.ST===S_CR||o.ST===S_ATK||o.ST===S_UP||VER.edition==='ce'&&o.CEDizzy?.activeDizzy&&o.CEDizzy?.fall?.phase===8||VER.cur==='CE'&&o.ST===S_SPEC&&o.CES?.kind==='vegaflip'&&o.aidx>=7||aiEnabled()&&!!o.AIRift||isEvilKen(o)&&o.MV?.kind==='evil-ken-heat');}

// arcade proximity block: holding back while the opponent's attack/fireball is close holds the guard pose instead of walking

function proxblk(p){const o=p.opp,d=Math.abs(o.X-p.X)>>8;if((o.ST===S_ATK||o.ST===S_SPEC)&&d<140)return true;

  return !!(o.FBON&&Math.abs(o.FBX-p.X)>>8<110&&(o.FBVX>0)===(o.FBX<p.X));}

/* M13h: throw damage / holds measured in the WW ROM (victim at full health, HP throw) */

const TDMG_WW={0:38,3:38,4:38,5:21,6:27,7:34},TDMG_CE={0:32,1:46,2:44,3:32,4:32,5:32,6:32,7:28,8:32,9:32,10:42,11:36}; let TDMG=TDMG_WW; const THOLD={1:[16,28,4,28,8],2:[25,26,4,28,7]};

/* CE Zangief crouch MP/HP within 80px: a grab (ROM 0x73b34/0x73bcc, 28 dmg, no hitstun, 54/59f; ce/fd/zc.py) */

function zgrab(p,atk){const o=p.opp,n=AI(p,'cn'+['LP','MP','HP'][atk]);if(!(VER.cur==='CE'&&p.fid===6&&(atk===1||atk===2)&&n>=0&&hurtable(o)&&(o.Y>>8)===0&&(Math.abs(o.X-p.X)>>8)<=80))return false;

  if(!trythrow(p,atk,1))return false;setanim(p,n,0);p.THAN=n;p.SCNT=atk===1?50:55;p.THV.dmg=28;p.THV.t=p.SCNT-6;p.ZG=1;return true;}

function trythrow(p,atk,force){const result=trythrow0(p,atk,force);if(result&&VER.cur==='CE')SF2CESPECIAL.interrupt(p.opp);if(result&&VER.edition==='ce')SF2CEDIZZY.interrupt(p.opp);return result;}
function trythrow0(p,atk,force){if(VER.cur==='CE'&&p.fid===5&&atk>=3)return false;const o=p.opp; if(!force&&!canthrow(p,atk>=3))return false; if(isFFGuest(p)){G.throws=(G.throws||0)+1;return (isDamnd(p)?SF2AIDamnd:SF2AIFF).throwStart(p,atk,{special:force===2||(p.aiProfile==='andore'&&!force&&atk<3),move:THROW,anim:setanim,sound:code=>isDamnd(p)?sfxc(code):ffSound(p,code===0x2f?'land':'throw')});}if(XS(p)&&atk>=3&&AI(p,'throwk')<0)return false; /* CE: only Ryu/Ken/Honda/Chun-Li/Zangief have a kick throw */

  if(aiEnabled()&&o.AIRift)o.AIRift=null;

  if(VER.edition==='ce'&&window.SF2CEHONDAHOLD?.init(p,atk,hondaHooks())){G.throws=(G.throws||0)+1;return true;}
  if(VER.cur==='CE'&&window.SF2CEBITE&&SF2CEBITE.init(p,atk,{find:AI,anim:setanim,move:THROW,voice:q=>sfxc(XS(q)&&XS(q).thr)})){G.throws=(G.throws||0)+1;return true;}

  if(VER.cur==='CE'&&!isFFGuest(p)&&window.SF2CETHROWS&&SF2CETHROWS.init(p,atk,cethooks())){G.throws=(G.throws||0)+1;return true;}

  Object.assign(p,{MV:THROW,SPK:0,SPKD:0,SPSTR:atk%3,SPPH:0,RETCR:0,KB:0,SCNT:30});

  const dmg=24+4*(atk%3); const d=p.FACE?-1:1;

  const fi=p.fid,X=XS(p),tk=X&&atk>=3?AI(p,'throwk'):-1,TI=tk>=0?tk:AN_THROW,ta=D.fighters[fi]&&D.fighters[fi].anims[TI],own=ta&&(ta.name==='throw'||ta.name==='throwk');

  setanim(p,own?TI:AN_SLP+atk,0); if(X)sfxc(tk>=0?X.thrk:X.thr);if(own)p.SCNT=ta.ents.reduce((s,e)=>s+e[1],0)+4;

  /* M13g: the victim is held in front of the thrower for the first part of the throw, then tossed behind (was instant) */

  const tot=own?p.SCNT-4:12, ht=Math.max(1,Math.min(tot-2,40,Math.round(tot*0.45)));

  o.ST=S_HIT;o.STUN=999;o.KB=0;o.RETCR=0;setanim(o,AN_HITL+2,0);o.X=p.X-d*(28<<8);o.Y=0;const hd=THOLD[p.fid];p.THV=hd?{t:1e9,dmg:0,d,m:0,h:hd}:{t:ht,dmg:TDMG[p.fid]||dmg,d};p.hitdone=1;p.THAN=own?TI:AN_SLP+atk;p.ST=S_SPEC;G.throws=(G.throws||0)+1;return true;}

/* CE air throw (Guile, Chun-Li; traced: toward + MP/HP/MK/HK next to an airborne opponent), Vega's Izuna Drop shares it */

function airthrow(p,atk){const o=p.opp,ai=AI(p,'athrow'); if(!XS(p)||ai<0)return false;

  if(!(hurtable(o)&&(o.ST===S_AIR||aiEnabled()&&o.ST===S_SPEC&&o.AIAir)&&Math.abs(o.X-p.X)<(56<<8)&&Math.abs(o.Y-p.Y)<(40<<8)))return false;
  return grabair(p,ai,p.fid===3?40:36,XS(p).thr);}

function grabair(p,ai,dmg,voice){const o=p.opp,d=p.FACE?-1:1;

  Object.assign(p,{MV:{kind:'athrow'},SPK:0,SPKD:0,SPPH:0,RETCR:0,KB:0,SCNT:0,THAN:ai,hitdone:1,JA:0});

  setanim(p,ai,0);p.ST=S_SPEC;o.ST=S_HIT;o.STUN=999;o.KB=0;o.RETCR=0;setanim(o,AN_HITL+2,0);p.THV={t:0,dmg,d};sfxc(voice);G.throws=(G.throws||0)+1;return true;}

/* CE bosses, P during the dive: Vega Barcelona -> Izuna Drop (toward, close) or the claw slash; Bison Head Stomp -> Somersault Skull Diver */

function bossair(p,dx){if(VER.cur==='CE'&&p.fid===11&&p.CES?.kind==='vegawall')return false;const o=p.opp;

  if(p.fid===11){ if(p.BSL)return false; p.BSL=1;

    if(dx>0&&hurtable(o)&&Math.abs(o.X-p.X)<(64<<8)&&AI(p,'izuna')>=0)return grabair(p,AI(p,'izuna'),36,0);

    const b=AI(p,'bslash'); if(b<0)return false; setanim(p,b,0);p.hitdone=0;return true;}

  if(p.fid===8&&p.SPPH>=2&&AI(p,'dive')>=0){ const v=0x300; p.MV={kind:'dive'};p.SVX=o.X>p.X?v:-v;p.FACE=o.X>p.X?1:0;setanim(p,AI(p,'dive'),0);p.hitdone=0;return true;}

  return false;}

// Native0x4654a returns through0x37ddc into ordinary controls on this tick.

function ceVegaControlRelease(p,input){

  const y=p.Y;toidle(p);p.Y=y;

  // Crouch/prejump initialization retains its complete first animation timer.

  const poseGate=!(input.nw&0x3f0)&&!!(input.keys&12);

  controls(p,{...input,ev:[],force:0},poseGate,poseGate);

  if(p.ST===S_ATK&&!p.CEVNSTART&&!(input.keys&12)&&!p.CEVSL){

    const slot=p.cur;setanim(p,AN_IDLE,0);p.CEVNSTART={slot,entry:0};

  }

}

function aiResumeAir(p){const a=p.AIAir;delete p.AIAir;p.CES=null;p.MV=null;p.ST=S_AIR;p.PJ=p.JA=0;p.VX=a.vx||0;p.VY=Math.min(a.vy||0,-0x100);p.AY=a.ay||0x48;setanim(p,a.jan||AN_JUMPN,0);}
function aiOnFloor(p){return(p.Y>>8)===0||carMode(p)&&!!p.CARSUPPORT;}
function spec(p,input){const result=spec0(p,input);if(aiEnabled()&&p.AIAir&&p.ST!==S_SPEC){if([S_FREE,S_CR,S_UP].includes(p.ST)&&!aiOnFloor(p))aiResumeAir(p);else{delete p.AIAir;p.CES=p.MV=null;}}return result;}
function spec0(p,input){const m=p.MV;if(isFFGuest(p)&&!isDamnd(p)&&['ff','throw'].includes(m?.kind)){SF2AIFF.step(p,{idle:toidle,gravity,room:aiRoom,sound:code=>ffSound(p,code===0x2f?'land':code===0x2b?'throw':'special'),release:relth,anim:setanim,throwMove:THROW,grab:q=>trythrow(q,2,2),hold:q=>trythrow(q,1,1),cpu:q=>q.i===1&&!G.mode2p,releaseHeld:q=>{Object.assign(q,{ST:S_AIR,STUN:0,KB:0,VX:0,VY:0,AY:0x48,AX:0,JA:1,JN:1,PJ:0});setanim(q,AN_JUMPN,0);},head:q=>{const b=boxw(q,0);return b?{x:b[0]+b[2]/2,y:b[1]-b[3]/2}:aiMouth(q);},chokeDamage:(q,n)=>{hpDamage(q.opp,n,{special:true});aiBloodBurst(q.opp,0);},slam:q=>{const o=q.opp,v=q.THV;q.THV=null;o.X=q.X+v.d*18*256;o.Y=0;o.AIFFSlamImpact=true;hpDamage(o,v.dmg,{special:true});aiBloodBurst(o,2,false,true);delete o.AIFFSlamImpact;fallst(o,hpAlive(o)?S_DOWN:S_KO,v.d);o.VX=0;o.VY=0x240;},drop:q=>fallst(q,hpAlive(q)?S_DOWN:S_KO,q.FACE?-1:1)});return;}if(isDamnd(p)&&['damnd','throw'].includes(m?.kind)){SF2AIDamnd.step(p,{idle:toidle,gravity,sound:sfxc,release:relth,whistle:()=>{const voice={commands:[],sample:null,buffer:SF2AIDamnd.whistleBuffer,kind:'barrel-call',tick:G.tick};AI_SPECIAL_VOICES[p.i]={last:voice,projectile:voice};if(!muted&&!netReplaying&&AC&&MG)SF2AIDamnd.whistle(AC,MG);}});return;}if(VER.edition==='ce'&&window.SF2CEHONDAHOLD?.step(p,hondaHooks()))return;p.FBTK=(p.FBTK||0)+1;
  if(VER.cur==='CE'&&window.SF2CETHROWS&&SF2CETHROWS.step(p,cethooks()))return;

  if(VER.cur==='CE'&&window.SF2CEBITE&&SF2CEBITE.step(p,{find:AI,anim:setanim,tick:animstep,idle:toidle,freeze:n=>{G.hfz=n;},hit:q=>sfxc(XS(q)&&XS(q).hit[2]),land:q=>sfxc(XS(q)&&0x2f)}))return;

  let landed=false;

  if(VER.cur==='CE'&&window.SF2CESPECIALS&&SF2CESPECIALS.step(p,{cam:G.cam,stage:G.stage,rand,random:()=>rand()>>>20,floor:carMode(p)?carLanding:undefined,idle:toidle,anim:setanim,tick:animstep,sound:sfxc,land:q=>{if(!aiEnabled()||aiOnFloor(q))sfxc(XS(q)&&0x2f);},controlRelease:q=>{landed=true;ceVegaControlRelease(q,input);},approachLand:(q,slot)=>{landed=true;q.CEVLAND=7;q.ST=S_FREE;q.KB=q.STUN=0;setanim(q,slot,0);sfxc(0x2f);controls(q,input);},wall:q=>!!(((q.CEWALL||0)|(carMode(q)?q.CARSIDE||0:0))&(q.FACE+1))}))return landed;
  if(m.kind==='athrow'){const o=p.opp,v=p.THV; p.Y=Math.max(0,p.Y-0x300); if(v){o.X=p.X-v.d*(24<<8);o.Y=p.Y;o.STUN=999;}

    if(p.Y===0&&(p.adone||++p.SCNT>40)){if(p.THV)relth(p);toidle(p);sfxc(XS(p)&&0x2f);} return;}

  if(m.kind==='dive'){p.X+=p.SVX;p.Y=Math.max(0,p.Y-0x400); if(p.Y===0){toidle(p);sfxc(XS(p)&&0x2f);} return;}

  if(m.kind==='fb'&&VER.cur==='CE'&&FBCE[p.fid]){const c=FBCE[p.fid],ken=isEvilKen(p);if(p.SPPH===0&&p.FBTK>=c[0]+FBOFF+((p.fid===0||p.fid===4)?1:0)+(ken?6:0)){p.FBK=m.fx||'hado';fbspawn(p);p.SPPH=1;}if(p.FBTK>=c[1][Math.min(2,p.SPSTR)]+FBOFF2+(ken?14:0))toidle(p);return;}

  if(m.kind==='fb'){ const ft=FBTAB[p.fid]; if(ft&&p.SPPH===0){ if(++p.SCNT>=ft[0]){p.FBK=m.fx||'hado';fbspawn(p);p.FBX=p.X+(p.FACE?ft[2]<<8:-(ft[2]<<8));p.SCNT=ft[1]-ft[0];p.SPPH=1;} return;} if(p.SPPH===0){ const n=p.anim.ents.length; if(p.adone||p.aidx>=n-1){p.FBK=m.fx||'hado';fbspawn(p);p.SCNT=p.anim.ents[n-1][1]+22;p.SPPH=1;} } /* ROM: projectile appears as the release pose starts; Ryu 12f startup, 54f total */ else if(--p.SCNT<=0)toidle(p); return;}

  if(m.kind==='throw'&&p.THV&&p.THV.m!==undefined){const o=p.opp,v=p.THV;v.m++;o.X=p.X-v.d*((p.fid===2?49:3)<<8);o.STUN=999;p.SCNT=99;if(!p.adone&&p.aidx<p.anim.ents.length-1){}else p.aidx=Math.max(0,p.anim.ents.length-1);

    /* M13h: WW Honda's and Blanka's grabs are holds (ROM: first hit, then 4 every 28f) */

    const h=v.h,q=v.m-h[0];if(q>=0&&q%h[3]===0&&q/h[3]<h[4]){hpDamage(o,q?h[2]:h[1]);const X=XS(p);sfxc(X&&(X.thr||X.hit[2]),SN_HIT[q?0:2]);}

    if(!hpAlive(o)||q>=h[3]*(h[4]-1)){v.dmg=0;relth(p);toidle(p);} return;}

  if(m.kind==='throw'&&p.THV){const o=p.opp,v=p.THV; if(--v.t>0){o.X=p.X-v.d*(28<<8);o.STUN=999;} else {p.THV=null;hpDamage(o,v.dmg);o.X=p.X+v.d*(40<<8);fallst(o,hpAlive(o)?S_DOWN:S_KO,v.d);const X=XS(p);sfxc(X&&X.fall,SN_HIT[2]);}}

  if(m.kind==='stand'&&p.SPEND){ if(p.FBTK>=p.SPEND)toidle(p); return;}

  if(m.kind==='stand'||m.kind==='grab'||m.kind==='throw'){ if(p.ZG?--p.SCNT<=0:(p.adone||--p.SCNT<=0)){p.ZG=0;toidle(p);} return;}

  if(m.kind==='dash'){p.X+=p.SVX; if(--p.SCNT<=0){if(p.SPEND&&p.FBTK<p.SPEND){p.SVX=0;p.SCNT=1;}else toidle(p);} return;}

  if(m.kind==='rise'){

    if(p.SPPH===0){ if(p.aidx<1)return; p.SVX=SHOVX[p.SPSTR];p.SVY=SHOVY[p.SPSTR];p.SPPH=1;}

    if(p.SPPH===3){ if(p.SPEND?p.FBTK>=p.SPEND:p.adone)toidle(p); return;}

    p.Y+=p.SVY>>8; p.SVY-=0x6000;

    if(p.SPPH===1){p.X+=p.FACE?(p.SVX>>8):-(p.SVX>>8);p.SVX-=0x8000;if(p.SVX<0)p.SPPH=2;}

    else if(p.SVY<0&&p.Y<=0){p.Y=0;p.SPPH=3; if(p.fid!==0&&p.fid!==4&&!p.SPEND)toidle(p);}

    return;}

  // tatsumaki

  if(p.SPPH===1){p.X+=p.SVX>>8; if(p.adone){setanim(p,p.cur,0);p.LOOPED=1;} /* CE tat anims are one-shot: replay them; spin length from the ROM when known */

    if(p.SPEND?p.FBTK>=p.SPEND-(TATLANDF[p.fid]||12):(p.LOOPED&&--p.SCNT<0)){p.SPPH=2;setanim(p,AN_TATLAND,0);} return;}

  p.X+=p.SVX>>8;p.Y+=p.SVY>>8;p.SVY-=0x6000;

  if(p.SVY<0){ if(p.SPPH===0){p.SPPH=1;setanim(p,AN_TAT+p.SPSTR,0);return;} if(p.Y<=0){p.Y=0;p.SPPH=3;toidle(p);} } }

// ---- boxes / hits ----

function boxw(p,k){if(isEvilKen(p)&&p.cur>=92&&p.cur<=94&&k===4&&!p.AIEvilKen.attack)return null;if(aiEnabled()&&k===4&&p.AIRift)return null;if(VER.cur==='CE'&&k===4&&window.SF2BISONHEAD?.attackBox){const b=SF2BISONHEAD.attackBox(p);if(b!==undefined)return b;}const raw=VER.cur==='CE'&&window.SF2CEVEGACLAW?SF2CEVEGACLAW.box(p,k):undefined,b=aiEnabled()&&k<3&&p.ST===S_HIT&&p.opp.AIChain?.cancels>0&&p.opp.AICombo?.active?p.F.anims[0].ents[0][2+k]:raw!==undefined?raw:ent(p)[2+k];if(!b||!b[2])return null;const attack=VER.cur==='CE'&&k===4?window.SF2CECOMBAT?.record(p):null,dx=attack&&(attack[5]&128)?-attack[5]:b[0];return [(p.FACE?-dx:dx)+(p.X>>8),b[1]+(p.Y>>8),b[2],b[3]];}

function push(){if(aiEnabled()&&P.some(p=>p.AIFFHeld)){P.forEach(clampx);return;}if(VER.edition==='ce'&&G.CEHHContactDelay>0){if(G.CEHHContactDelay<29)for(const q of P)q.CEHHPush=false;G.CEHHContactDelay--;return;}if(VER.edition==='ce'&&P.some(p=>p.CEKO))return;if(VER.cur==='CE'&&P.some(p=>p.CETH||p.CETHV||p.CEBV||p.CEB&&p.CEB.phase===0))return;if(VER.edition==='ce'&&P.some(p=>p.fid===1)&&!P.some(p=>p.CEHH||p.CEHHV&&p.CEHHV.phase<2)){P.forEach(clampx);SF2CEHONDAHOLD.push(P,q=>boxw(q,3));for(const q of P)q.CEHHPostPush=true;return;}if(VER.cur==='CE'&&P.some(p=>p.CEHH||p.CEHHV&&p.CEHHV.phase<2||p.CETH||p.CETHV||p.CEBV||p.CEB&&p.CEB.phase===0))return;const a=boxw(P[0],3),b=boxw(P[1],3); if(!a||!b)return;
  if(Math.abs(a[1]-b[1])>=a[3]+b[3])return; const ov=a[2]+b[2]-Math.abs(a[0]-b[0]); if(ov<=0)return;

  let lt=P[0].X<P[1].X||(P[0].X===P[1].X&&P[0].FACE!==0); const L=lt?P[0]:P[1],R=lt?P[1]:P[0];

  /* M13d: arcade push - a walker shoves the other 1px/frame (walker slows to match); otherwise split the overlap */

  const toL=(R.X0||R.X)-R.X, toR=L.X-(L.X0||L.X); let dl,dr;

  if(toR>0&&toL<=0&&L.Y===0){dr=Math.min(ov<<8,256);dl=(ov<<8)-dr;}

  else if(toL>0&&toR<=0&&R.Y===0){dl=Math.min(ov<<8,256);dr=(ov<<8)-dl;}

  else {dl=ov<<7;dr=(ov<<8)-dl;}

  L.X-=dl;R.X+=dr;

  /* corner: whoever hits the screen/stage edge stays, the other takes the rest */

  const room=aiEnabled()&&G.scene==='fight'?aiRoom():null,lo=(room?room.left+CE_CAM_EXTENT[L.fid]:Math.max(40,G.cam+40))<<8,hi=(room?room.right-CE_CAM_EXTENT[R.fid]:Math.min(SW-40,G.cam+W-40))<<8;
  if(L.X<lo){R.X+=lo-L.X;L.X=lo;} if(R.X>hi){L.X-=R.X-hi;R.X=hi;}}

function hurtable(d){if(aiEnabled()&&d.AIFFHeld)return false;return !(aiEnabled()&&G.tick<(d.AIComboBreakInvuln||0))&&G.gph===1&&d.ST!==S_DOWN&&d.ST!==S_KO&&d.ST!==S_GETUP&&!(VER.cur==='CE'&&window.SF2CEVEGA&&SF2CEVEGA.invulnerable(d));}

function hurtregion(bx,d){const depths=[-1,-1,-1];let mask=0,best=-1;

  for(let k=0;k<3;k++){const h=boxw(d,k);if(!h)continue;const depth=bx[3]+h[3]-Math.abs(bx[1]-h[1]),dx=Math.abs(bx[0]-h[0]),touch=VER.cur==='CE';

    if((touch?dx<=bx[2]+h[2]:dx<bx[2]+h[2])&&(touch?depth>=0:depth>0)){depths[k]=depth;mask|=1<<k;if(best<0||depth>depths[best])best=k;}}

  /* CE 0x95f8e/0x96026 chooses the deepest vertical penetration. With all

     three overlaps, a head/body tie selects body; foot must be strictly deeper. */

  if(mask===7){best=depths[1]>=depths[0]?1:0;if(depths[2]>depths[best])best=2;}

  return best;}

function ovlhurt(bx,d){return hurtregion(bx,d)>=0;}

// Native scalar admission is separate from custom AI attacks and special-local reactions.

function ceNativeCombat(p,d,region,projectile=false){

  if(VER.edition!=='ce'||!window.SF2CECOMBAT||!window.SF2CEREACTION)return null;

  const profile=SF2CECOMBAT.profile(p,d,region,{projectile,attackWorldBox:projectile?fbbox(p):boxw(p,4)});

  if(!profile)return null;

  const block=SF2CEREACTION.resolveBlock(d,profile.record,region);if(!block)return null;

  const result=SF2CECOMBAT.calculate(profile,rand,block);if(!result)return null;

  const code=SF2CEREACTION.reactionCode(d,profile.record,region,block);

  p.CE_DAMAGE_TRACE={tick:G.tick,source:result.source,region,blocked:block.blocked,chipEligible:block.chipEligible,damage:result.damage,chip:result.chip,randomIndex:result.randomIndex,randomConsumed:result.randomConsumed,attackLevel:result.attackLevel,defenseLevel:result.defenseLevel,reactionCode:code,scoreCommand:result.scoreCommand,koScoreCommand:result.koScoreCommand};

  return {...result,...block,reactionCode:code,profile,nativeBlocked:block.blocked};

}

/* M13d: hits are probed for both fighters first, then applied, so simultaneous hits trade like the arcade */

function hitprobe(p){if(isFFGuest(p)&&!isDamnd(p)&&!SF2AIFF.canProbe(p))return false;if(isDamnd(p))SF2AIDamnd.contactWindow(p);if(p.CES?.kind==='yoga')return false;if(VER.cur==='CE')window.SF2CEHONDAHANDS?.probe(p);if(aiEnabled()&&p.AIRift)return false; if(p.MV===THROW&&p.ST===S_SPEC||p.ST!==S_ATK&&p.ST!==S_SPEC&&!(p.ST===S_AIR&&p.JA)||(p.hitdone&&!(VER.cur==='CE'&&window.SF2CEVEGA&&SF2CEVEGA.reprobe(p))))return false; const d=p.opp; if(!hurtable(d))return false;
  const bx=boxw(p,4);if(!bx)return 0;const region=hurtregion(bx,d);return region>=0?region+1:p.MH2&&d.Y===0?(p.HREG||0)+1:0;} /* MH2: ROM two-hit normals land their 2nd hit on a victim still in hit/blockstun from the 1st */

function hitcheck(p,pr){if(!pr)return;

  if(isEvilKen(p)&&p.AIEvilKen.attack){

    const attack=p.AIEvilKen.attack,d=p.opp;if(!SF2AIEvilKen.claim(p,d.i))return;p.hitdone=1;p.HREG=pr-1;

    const e=ent(p),before=d.ST,hp=d.HP,blocked=applyhit(d,attack.damage,e[8],attack.knockdown?1:0,e[10],d.X>=p.X?1:-1,0,p.HREG)==='blk';

    SF2AIEvilKen.contact(p,blocked);aiContact(p,d,before,blocked,hp-d.HP,false);sfxc(blocked?XS(p).blk:XS(p).hit[3+Math.min(2,e[8])]);return;

  }

  const d=p.opp; p.hitdone=1; const e=ent(p);

  const bisonStop=VER.cur==='CE'&&window.SF2BISONHEAD?.localStop(p),bisonOldPose=bisonStop?ceProjectilePose(d):null;

  if(VER.cur==='CE'&&window.SF2CHUNAIR)SF2CHUNAIR.contact(p);

  p.HREG=pr-1;let kd=p.CEST?0:e[9]; if(p.ST===S_SPEC&&p.SPKD)kd=1;if(bisonStop)kd=0;

  const vc=VER.cur==='CE'?(window.SF2BISONHEAD?.combat?.(p,d,pr-1,rand)||window.SF2CEVEGA?.combat(p,d,rand,pr-1)):null;if(vc){kd=vc.kd;if(Number.isInteger(vc.region))p.HREG=vc.region;}

  const specialAI=aiEnabled()&&!vc?SF2CESPECIAL.describe(p,d,p.HREG):null,native=vc?null:ceNativeCombat(p,d,p.HREG),previousPose=native?ceProjectilePose(d):null;

  if(native?.reactionCode===14)kd=1;

  const common=native&&SF2CEREACTION.data.common.includes(native.reactionCode)&&(d.Y>>8)===0;

  if(common)kd=0;

  const sp=p.ST===S_SPEC,dc=VER.cur==='CE'&&!isFFGuest(p)&&!sp&&DMG_CE[p.fid]&&DMG_CE[p.fid][p.cur],mh=dc&&MHIT_CE[p.fid]&&MHIT_CE[p.fid][p.cur],dm=isFFGuest(p)&&!isDamnd(p)?SF2AIFF.damage(p,e[8]):isDamnd(p)?(sp?(p.MV?.a===100?(p.AIDamndMove?.punch===2?22:14):p.MV?.a===101?(p.AIDamndMove?.spinHit===2?16:8):30):[12,19,27][Math.min(2,e[8])]):native?native.damage:vc?vc.damage:dc?Math.max(1,(mh?(p.aidx>=mh?dc-(dc>>1):dc>>1):dc)+((rand()>>>20)%3)-1):dmgof(e[7]); /* unsupported/custom entries retain the recovered path */

  const before=d.ST,hp=d.HP,normal=p.ST===S_ATK&&p.Y===0,dir=d.X>=p.X?1:-1;

  const bl=applyhit(d,dm,native?native.strength:vc?vc.strength:e[8],kd,p.ST===S_AIR?-1:e[10],dir,native?native.chip:vc?vc.chip:bisonStop?0:sp?dm>>2:0,p.HREG,bisonStop||common,native||vc||specialAI);

  if(common){if(d.ST===S_HIT||d.ST===S_BLK)ceCommonReaction(d,p,{reaction:native.reactionCode,strength:native.strength,direction:dir,blocked:bl==='blk',previousPose});else G.hfz=bl==='blk'?BFRZ:HFRZ;}

  if(bisonStop){d.CEPF={init:1,ticks:14,pose:ceProjectilePose(d)};Object.assign(d,bisonOldPose);d.anim=d.F.anims[d.cur];SF2BISONHEAD.contact(p);}if(aiEnabled())aiContact(p,d,before,bl==='blk',hp-d.HP,normal);

  // Guest impact audio was emitted by applyhit; retain the shared guard cue.
  if(isFFGuest(p)&&!isDamnd(p)&&!bl)return;
  const X=XS(p),old=bl?SN_BLOCK:p.ST===S_SPEC?SN_HIT[2]:SN_HIT[Math.min(2,e[8])];

  if(!X)snd(old); else {const k=sp?p.F.moves.indexOf(p.MV):-1,b=btnof(p.cur); sfxc(bl?X.blk:sp?(k>=0?X.sph[k]:p.fid===11?0x36:0x2a):X.hit[b>=0?b:Math.min(2,e[8])],old);}}

// ---- M9 feel model, measured on the arcade program in the emulator (60Hz ticks; see README) ----

// damage = 12 + 1.8 x ROM damage index (+-1), hit freeze 14 / block freeze 8, hitstun after freeze 11/17/21,

// blockstun 9/15/19, total pushback 30/54/78px (KB decays 1/4 per 25fps step -> KB = total/4), knockdown 94,

// stun: >=80 points inside 100 ticks dizzies (knockdown, then ~170 ticks of stars)

/* CE: defender first-actionable frame measured in the CE ROM (tools/emu_ce/stuntrace.py): blocked = hit + 1 */

const HSTUN_WW=[11,17,21],BSTUN_WW=[26,31,42],HSTUN_CE=[14,19,23],BSTUN_CE=[14,19,23];let HSTUN=HSTUN_WW,BSTUN=BSTUN_WW;const PUSHKB=[0x780,0xd80,0x1380],HFRZ=14,BFRZ=15,KDT=42,DIZT=170,DIZP=31,STPT_=[40,60,80],STPR=[[1,6],[5,11],[12,16]],STPRK=[[1,7],[5,10],[11,17]]; /* CE kicks + 2nd hit of two-hit normals: ROM-measured (ce/fd/dzk.py, Ryu vs Honda) */

/* CE ROM normal damage per fighter/anim (median of 4 hits on an idle full-HP P2, per hit; /workspace/ce/fd dmg.py+wdmg.py) */

const DMG_CE={"0":{"47":4,"14":5,"48":14,"15":13,"49":19,"16":18,"11":7,"17":5,"12":14,"18":13,"52":24,"19":18,"8":4,"9":12,"10":18,"13":18},"1":{"47":15,"14":13,"48":19,"15":17,"49":22,"16":22,"50":14,"17":13,"51":17,"18":34,"52":48,"19":22},"2":{"47":13,"14":11,"48":17,"15":16,"49":18,"16":19,"50":13,"17":11,"51":35,"18":15,"52":21,"19":19,"8":11,"9":15,"10":18,"11":11,"12":16,"13":21},"3":{"47":5,"14":5,"48":15,"15":15,"49":22,"16":21,"50":7,"17":7,"51":15,"18":14,"52":21,"19":22,"8":5,"9":15,"12":14,"13":21},"4":{"47":4,"14":5,"48":17,"15":15,"49":22,"16":21,"11":8,"17":5,"12":16,"18":15,"52":26,"19":21,"9":15,"10":21,"13":23},"5":{"47":12,"14":5,"48":16,"15":11,"49":17,"16":17,"50":14,"17":7,"51":14,"18":11,"52":17,"19":14,"9":11,"10":15,"11":7,"12":11,"13":18},"6":{"47":12,"14":5,"48":17,"49":22,"50":12,"17":11,"51":17,"18":17,"52":31,"19":22,"8":12,"11":13},"7":{"47":7,"14":8,"48":11,"15":11,"49":29,"16":13,"50":7,"17":7,"51":10,"18":13,"52":14,"19":12,"8":7,"9":11,"11":7},"8":{"8":5,"14":5,"9":16,"15":16,"10":22,"16":22,"11":8,"17":8,"12":15,"18":15,"13":21,"19":21},"9":{"8":9,"14":9,"9":15,"15":15,"10":22,"16":22,"11":16,"17":9,"12":23,"18":15,"13":19,"19":22},"10":{"8":6,"14":6,"48":24,"15":15,"49":22,"11":11,"17":6,"51":24,"18":15,"52":22,"19":21,"9":15,"10":22,"16":21,"12":15,"13":22},"11":{"8":6,"14":6,"9":11,"15":11,"10":16,"16":16,"11":6,"17":8,"12":11,"18":11,"13":16,"19":14}};

function dmgof(i){return Math.round(12+1.8*(i&0x7f))+((rand()>>>20)%3)-1;}

function aiImpactPoint(d,region,projectile){
  if(!aiEnabled())return null;
  const p=d.opp,a=projectile?fbbox(p):boxw(p,4),b=boxw(d,region);
  return a&&b?{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,face:p.FACE}:null;
}
function aiImpact(point,strength,blocked){
  if(point)SF2CEPROJECTILES.contactImpact({...point,strength,blocked,tick:G.tick});
}
function applyhit(d,dmg,str,kd,low,dir,chip,region=0,localStop=false,reaction=null,specialAttack=null){if(aiEnabled()){const hits=[S_HIT,S_DOWN,S_GETUP].includes(d.ST)&&d.opp.AICombo?.active?d.opp.AICombo.hits:0;const scale=[1,.85,.72,.60,.50,.42,.35,.30,.25][Math.min(8,hits)];dmg=Math.max(1,Math.floor(dmg*scale));chip=chip?Math.max(1,Math.min(2,Math.floor(chip*.2))):0;}const specialKO=specialAttack??(!!reaction?.profile?.projectile||reaction?.reactionCode>=24&&reaction.reactionCode!==32||d.opp.ST===S_SPEC&&!['throw','athrow','ai-rift'].includes(d.opp.MV?.kind));if(aiEnabled()&&d.AIRift)d.AIRift=null; if(str>2)str=2;
  const impact=aiImpactPoint(d,region,specialAttack===true||!!reaction?.profile?.projectile);

  if(d.ST===S_FREE||d.ST===S_CR||d.ST===S_BLK){const back=dir>0?K_R:K_L; /* M13d: block away from the attacker's actual side (crossups) */

    if(reaction?.nativeBlocked??(!!(d.KEYS&back)&&(!low||(low>0)===!!(d.KEYS&K_D)))){ /* native posture admission is resolved before damage RNG */aiImpact(impact,str,true);const c=d.KEYS&K_D?1:0;d.RETCR=c;setanim(d,c?AN_BLOCKC:AN_BLOCKS,0);d.ST=S_BLK;

      d.KB=PUSHKB[str]*dir;d.STUN=BSTUN[str]-(VER.cur==="CE"&&d.opp.MH2?2:0);if(!localStop)G.hfz=BFRZ; /* CE: 2nd blocked hit of a two-hit normal frees 2f sooner (ROM stun trace) */

      let lethalProjectileChip=false;

      if(chip){hpDamage(d,chip,{special:specialKO,projectile:specialAttack===true||!!reaction?.profile?.projectile});if(!hpAlive(d)){d.CE_FatalHitPending={special:reaction?.reactionCode>=24&&reaction.reactionCode!==32};fallst(d,S_KO,dir);

        // CE0x951d8..0x95236 clears the block flags on underflow, then awards the KO command.

        if(VER.edition==='ce'&&reaction?.profile?.projectile){lethalProjectileChip=true;if(G.mode2p||d.opp.i===0)ceBonusScore(reaction.koScoreCommand,d.opp.i);}

      }}if(VER.cur==='CE'&&window.SF2CEVEGACLAW)SF2CEVEGACLAW.hurt(d,{rand});return lethalProjectileChip?undefined:'blk';}}

  aiImpact(impact,str,false);if(isFFGuest(d.opp))ffSound(d.opp,'hit');
  const specialReaction=VER.cur==='CE'&&G.scene==='fight'&&SF2CESPECIAL.accepts(d,reaction);if(!localStop&&!specialReaction)G.hfz=HFRZ;

  const nativeScore=VER.edition==='ce'&&reaction?.scoreCommand!==undefined?SF2CECOMBAT.scoreAmount((VER.edition==='ce'?dmg>d.HP:dmg>=d.HP)?reaction.koScoreCommand:reaction.scoreCommand):null;

  if(VER.edition!=='ce'||G.mode2p||d.opp.i===0)d.opp.SCORE=nativeScore===null?(d.opp.SCORE||0)+dmg*100:Math.min(9999999,(d.opp.SCORE||0)+nativeScore);

  SF2CESPECIAL.interrupt(d);if(aiEnabled()){aiBreakCombo(d);delete d.AIComboBreaker;}hpDamage(d,dmg,{special:specialKO,projectile:specialAttack===true||!!reaction?.profile?.projectile});aiRetchBegin(d,str,region,dmg);if(aiEnabled()&&(specialKO||region===0||str===2||!specialAttack&&[S_ATK,S_AIR].includes(d.opp.ST)&&btnof(d.opp.cur)%3===2))aiBloodBurst(d,str,false,specialKO);if(VER.cur==='CE'&&window.SF2CEVEGACLAW)SF2CEVEGACLAW.hurt(d,{rand});if(!hpAlive(d)){if(VER.edition==='ce'&&d.CEDizzy){d.CEDizzy.activeDizzy=d.CEDizzy.dizzy=0;d.CEDizzy.fall=d.CEDizzy.pending=null;d.DIZZY=0;}if(specialReaction&&!localStop)G.hfz=HFRZ;if(specialReaction){G.hfz=0;SF2CESPECIAL.start(d,reaction,dir,ceDizzyHooks(),true);return;}d.CE_FatalHitPending={special:reaction?.reactionCode>=24&&reaction.reactionCode!==32};return fallst(d,S_KO,dir);}

  /* ROM-measured (CE emu, P2 struct +0x5d timer/+0x5f points): timer += 40/60/80 per L/M/H hit, ticks down 1/frame,

     points reset to 0 when it expires; points per hit L 1-6, M 5-11, H 12-16 (punches); CE kicks L 1-7, M 5-10, H 11-17, 2nd hit of a two-hit normal 4-9; dizzy when points >= 31 */

  if(specialReaction){SF2CESPECIAL.start(d,reaction,dir,ceDizzyHooks());return;}
  if(!(VER.edition==='ce'&&G.scene==='fight'&&SF2CEDIZZY.queue(d,d.opp,reaction,dir))){const rem=Math.max(0,(d.STPE||0)-G.tick); if(!rem)d.STP=0; d.STPE=G.tick+rem+STPT_[str];

   const kb=VER.cur==='CE'&&btnof(d.opp.cur)>=3,r=VER.cur==='CE'&&d.opp.MH2?[4,9]:kb?STPRK[str]:STPR[str]; d.STP=(d.STP||0)+r[0]+((rand()>>>20)%(r[1]-r[0]+1));}

  if(!(VER.edition==='ce'&&d.CEDizzy?.pending)&&d.STP>=DIZP&&!d.DIZZY){d.STP=0;d.DIZZY=1;G.dizzies=(G.dizzies||0)+1;return fallst(d,S_DOWN,dir);}

  if((VER.cur==='CE'?(d.Y>>8)!==0:d.Y!==0)||kd){fallst(d,S_DOWN,dir);if(VER.cur==='CE'&&(d.Y>>8)===0&&d.opp.cur===AN_CLP+5)d.FALLW=4;return;} /* CE sweeps: victim leaves the ground 4f later than WW (ROM freeat trace, all 12 fighters 3-5f) */

  const c=reaction&&typeof reaction.crouching==='boolean'?(reaction.crouching?1:0):d.ST===S_CR?1:0;d.RETCR=c;const body=VER.cur==='CE'&&!c&&region>0?AI(d,'bodyhit'+['L','M','H'][str]):-1,named=reaction?.reactionName?AI(d,reaction.reactionName):-1;

  setanim(d,named>=0?named:body>=0?body:(c?AN_CHITL:AN_HITL)+str,0);d.ST=S_HIT;d.KB=dir*PUSHKB[str];d.STUN=HSTUN[str];}

function fallst(d,s,dir){const previous=VER.edition==='ce'&&d.CE_FatalHitPending&&!d.CE_FatalHitPending.special&&(d.Y>>8)===0&&!d.CETHV&&!d.CEBV?ceProjectilePose(d):null;delete d.CE_FatalHitPending;if(VER.cur==='CE'){if(d.CES?.kind==='vegawall'||d.CES?.kind==='vegaflip'){d.CES=null;d.MV=null;}delete d.CEVLAND;delete d.CER;delete d.CERSTOP;delete d.CEGUARD;delete d.CESHAKE;delete d.CERHOSTTICK;delete d.CERRESUME;}d.DOWNT=0;d.FALLW=0;d.STUN=0;d.ST=s;setanim(d,AN_FALL,0);Object.assign(d,{VY:0x500,AY:0x48,VX:0x200*dir,AX:0,KB:0});if(previous){Object.assign(d,previous);d.anim=d.F.anims[d.cur];d.CEKO_GROUND=true;d.CEKO_DIR=dir;}}

// ---- projectile ----

/* M13e: Guile sonic boom / Dhalsim yoga fire spawn tick, total recovery and spawn offset, measured on the arcade */

/* CE ROM (tools fb3.meas): [spawn frame, back-to-neutral frame per LP/MP/HP] counted from the press, Ryu/Ken/Sagat */

/* CE ROM back-to-neutral frame for ground specials (fb3.meas on the CE ROM, MP/MK unless noted): [fid][move index] */

const TATLANDF={0:18,4:12};

function spend(p,i,str){const t=VER.cur==='CE'&&SPT_CE[p.fid];let v=t&&t[i];if(Array.isArray(v))v=v[Math.min(2,str)];return v?v-1:0;}

const SPT_CE={0:{1:[46,57,68],2:[65,91,103]},4:{1:[59,70,81],2:[69,76,97]},1:{0:45},2:{0:63},5:{0:63},6:{1:76,2:76},7:{0:66},8:{0:102,1:41},9:{2:[60,71,82],3:[40,42,44]},10:{0:[53,61,82],1:57},11:{0:54}};

const FBCE={0:[10,[50,50,50]],4:[14,[54,54,54]],9:[11,[49,49,55]],3:[14,[46,46,46]],7:[13,[105,105,105]]};const FBOFF=-1,FBOFF2=-1;

const FBTAB={3:[7,27,18],7:[11,77,56]};

const CEFX=window.SF2CEFX;

function fbspawn(p){const key=p.fid===9&&p.MV.btn==='K'?'tigerlow':p.FBK;

  const def=VER.cur==='CE'&&CEFX&&CEFX.projectiles[key];p.FBDEF=def||null;p.FBSTR=p.SPSTR;

  if(def){/* 0x317de/0x3233a: ROM spawn offsets, strength-indexed velocity and animation. */

    p.FBAN=def.anims[p.SPSTR];p.FBI=0;p.FBC=p.FBAN.entries[0][1];p.FBINIT=1;

    p.FBX=p.X+(p.FACE?def.spawn[0]<<8:-(def.spawn[0]<<8));p.FBY=p.Y+(def.spawn[1]<<8);

    p.FBVX=p.FACE?def.speed[p.SPSTR]:-def.speed[p.SPSTR];

  }else{const v=(p.SPSTR+3)<<8;p.FBX=p.X+(p.FACE?0x5000:-0x5000);p.FBVX=p.FACE?v:-v;p.FBY=p.Y+0x3800;}

  if(VER.cur==='CE'){p.FBIMPACT=0;p.FBDEFER=0;delete p.FBCLASH;p.FBSLOT=p.opp.FBON?((p.opp.FBSLOT||0)^1):0;}p.FBT=0;p.FBA=0;p.FBON=1;}

const ceShotoProjectile=p=>VER.cur==='CE'&&(p.fid===0||p.fid===4);

const ceYogaProjectile=p=>VER.cur==='CE'&&G.scene==='fight'&&!!SF2CEDHALSIM.projectile(p,G);
const ceBoundProjectile=p=>VER.cur==='CE'&&G.scene==='fight'&&!!window.SF2CEPROJECTILES?.record(p);

function fbmove(p){if(!p.FBON||ceYogaProjectile(p))return;if((ceShotoProjectile(p)||ceBoundProjectile(p))&&G.scene==='fight'){p.FBDEFER=1;return;}fbadvance(p);}

function fbafter(p){if(p.FBDEFER){p.FBDEFER=0;fbadvance(p);}}

function fbadvance(p){if(aiEnabled()&&p.AIFFBullets){SF2AIFF.bulletStep(p,G.scene==='bonus'?{left:0,right:W}:aiRoom());return;}if(aiEnabled()&&p.AIFFGrenades){SF2AIFF.grenadeStep(p,G.scene==='bonus'?{left:0,right:W}:aiRoom(),()=>ffSound(p,'hit'));return;}if(aiEnabled()&&p.AIFFProjectile){SF2AIFF.projectileStep(p,G.scene==='bonus'?{left:0,right:W}:aiRoom());return;}if(isDamnd(p)&&p.FBK==='ff-barrel'){SF2AIDamnd.barrelStep(p,G.scene==='bonus'?{left:0,right:W}:aiRoom());return;}if(!p.FBON||ceYogaProjectile(p))return;if((ceShotoProjectile(p)||ceBoundProjectile(p))&&p.FBIMPACT){if(--p.FBIMPACT===0)p.FBON=0;return;}

  if(p.FBDEF&&p.FBINIT){p.FBINIT=0;return;} // initialization does not also execute the movement state

  if(ceBoundProjectile(p)&&SF2CEPROJECTILES.beforeAdvance(p,{tick:G.tick,rand,body:q=>fbhit(q,true)}))return;

  p.FBX+=p.FBVX;p.FBA=(p.FBA||0)+1;

  if(p.FBDEF){/* 0x2302 / 0x22d8: move, then decrement the ROM animation timer. */

    if(--p.FBC===0){p.FBI++;if(p.FBI===p.FBAN.entries.length)p.FBI=p.FBAN.loop;p.FBC=p.FBAN.entries[p.FBI][1];}

  }else if(G.fr)p.FBT++;

  const edge=p.FBDEF?64:48;if(aiEnabled()&&G.scene==='fight'){const room=aiRoom(),x=p.FBX>>8;if(x<room.left-edge||x>room.right+edge)p.FBON=0;}else{const x=(p.FBX>>8)-G.cam;if(x<-edge||x>aiViewWidth()+edge)p.FBON=0;}}
function fbbox(p){if(aiEnabled()&&p.AIFFBullets){const b=p.AIFFBullets[0];return[b.x,b.y,6,3];}if(aiEnabled()&&p.AIFFGrenades){const g=p.AIFFGrenades[0];return[g.x,g.y,g.blast?29:7,g.blast?29:7];}if(aiEnabled()&&p.AIFFProjectile)return[p.FBX>>8,p.FBY>>8,p.AIFFProjectile.type==='grenade'?9:13,p.AIFFProjectile.type==='grenade'?10:6];if(isDamnd(p)&&p.AIDamndBarrel)return[p.FBX>>8,20,18,18];if(!p.FBDEF)return [p.FBX>>8,p.FBY>>8,14,12];const b=p.FBAN.entries[p.FBI][2];

  return b&&[(p.FBX>>8)+(p.FBVX>0?-b[0]:b[0]),(p.FBY>>8)+b[1],b[2],b[3]];}

function drawfb(p,ground,camera){if(aiEnabled()&&p.AIFFBullets){SF2AIFF.bulletDraw(cx,p,camera,ground);return;}if(aiEnabled()&&p.AIFFGrenades){SF2AIFF.grenadeDraw(cx,p,camera,ground);return;}if(aiEnabled()&&p.AIFFProjectile){SF2AIFF.projectileDraw(cx,p,camera,ground);return;}if(isDamnd(p)&&p.FBK==='ff-barrel'){SF2AIDamnd.barrelDraw(cx,p,camera,ground);return;}if(ceYogaProjectile(p))return;const sx=(p.FBX>>8)-camera,sy=ground-(p.FBY>>8);

  if(p.FBDEF){const i=p.FBAN.entries[p.FBI][0],f=CEFX.frames[i],im=CEFXI[i];if(!f||!im.complete||!im.naturalWidth)return;

    cx.save();if(p.FBVX>0){cx.translate(sx,sy);cx.scale(-1,1);fimgKind('object',im,f.x,f.y);}else fimgKind('object',im,sx+f.x,sy+f.y);cx.restore();return;}

  if(p.FBK==='sonic'){if((p.FBA||0)<7)return;const f=((p.FBA+2)>>1)&1,im=SBI[f];if(!im.width)return;cx.save();if(p.FBVX<0){cx.translate(2*sx,0);cx.scale(-1,1);}fimgKind('object',im,sx+SBX[f],sy-18);cx.restore();}

  else fx(D.pfx[p.FBK][(p.FBT>>1)&1],sx,sy,p.FBVX>=0);}

function fbclash(){const a=P[0],b=P[1];if(ceYogaProjectile(a)||ceYogaProjectile(b))return;if(ceBoundProjectile(a)&&ceBoundProjectile(b))return;if(!(a.FBON&&b.FBON)||ceShotoProjectile(a)&&a.FBIMPACT||ceShotoProjectile(b)&&b.FBIMPACT)return;

  if(Math.abs(a.FBX-b.FBX)<24<<8&&Math.abs(a.FBY-b.FBY)<20<<8)for(const p of[a,b]){if(aiEnabled()&&p.AIFFBullets)p.AIFFBullets[0].hit=true;else if(aiEnabled()&&p.AIFFGrenades){const g=p.AIFFGrenades[0];if(!g.blast){g.blast=1;g.fuse=0;ffSound(p,'hit');}}else p.FBON=0;}}

const ceProjectilePose=p=>({cur:p.cur,aidx:p.aidx,acc:p.acc,adone:p.adone,hitdone:p.hitdone,MH2:p.MH2});

function ceObjectVisible(a){const x=a.x>>>16,y=a.y>>>16;if(aiEnabled()){const r=aiRoom(),world=x-256;return world>=r.left-64&&world<=r.right+64;}return((x-G.cam-256+64)&65535)<=512&&((y-SF2CECAMERA.state.main+64)&65535)<=384;}
function ceYogaCollision(a,p){if(a.health!==256)return;if(p.FBCLASH){delete p.FBCLASH;a.health=65535;return;}if(!((G.tick+(p.FBSLOT||0))&1)){ceYogaHit(a,p);return;}const d=p.opp;if(!d.FBON||d.FBINIT||d.FBIMPACT||d.FBCLASH||!SF2CEPROJECTILES.record(d))return;if(!SF2CEPROJECTILES.overlap(SF2CEPROJECTILES.box(p),SF2CEPROJECTILES.box(d)))return;a.health=65535;const other=SF2CEDHALSIM.projectile(d,G);if(other)other.health=65535;else d.FBCLASH=1;}
function ceYogaHit(a,p){
 const d=p.opp,record=SF2CEDHALSIM.record(a);if(!record||!hurtable(d)||a.health!==256)return;
 const box=[(a.x>>>16)-256+(a.face?-record[0]:record[0]),(a.y>>>16)-40+record[1],record[2],record[3]],region=hurtregion(box,d);if(region<0)return;
 const profile=SF2CECOMBAT.profile(p,d,region,{projectile:true,rawRecord:record,attackWorldBox:box});if(!profile)return;profile.source=a.source;
 const block=SF2CEREACTION.resolveBlock(d,record,region);if(!block)return;const result=SF2CECOMBAT.calculate(profile,rand,block);if(!result)return;
 const native={...result,...block,profile,reactionCode:SF2CEREACTION.reactionCode(d,record,region,block),nativeBlocked:block.blocked},before=d.ST,hp=d.HP;
 const bl=applyhit(d,result.damage,result.strength,0,0,a.face?1:-1,result.chip,region,false,native,true),X=XS(p);a.health=a.kind===1?65534:65535;if(a.kind===1){const hurt=boxw(d,region);if(hurt)SF2CEPROJECTILES.bodyImpact(p,[(box[0]+hurt[0])>>1,(box[1]+hurt[1])>>1],{tick:G.tick,rand});}p.CEYogaMetrics.hits=(p.CEYogaMetrics.hits||0)+1;
 if(aiEnabled())aiContact(p,d,before,bl==='blk',hp-d.HP,false);sfxc(X&&(bl==='blk'?X.blk:X.fbhit),bl==='blk'?SN_BLOCK:SN_HIT[2]);
}

function fbhit(p,nativeStep=false){if(aiEnabled()&&p.AIFFBullets){const d=p.opp;if(!hurtable(d))return;for(const contact of SF2AIFF.bulletContacts(p)){const region=hurtregion(contact.box,d);if(region<0)continue;const b=contact.bullet,hp=d.HP,before=d.ST;const blocked=applyhit(d,18+2*b.strength,2,0,0,b.dir,4,region,false,null,true);b.hit=true;aiContact(p,d,before,blocked==='blk',hp-d.HP,false);if(blocked==='blk')sfxc(0x2b,SN_BLOCK);}return;}if(aiEnabled()&&p.AIFFGrenades){const d=p.opp;if(!hurtable(d))return;for(const contact of SF2AIFF.grenadeContacts(p)){const region=hurtregion(contact.box,d);if(region<0)continue;const g=contact.grenade,hp=d.HP,before=d.ST;const blocked=applyhit(d,24+2*g.strength,2,1,0,g.dir,4,region,false,null,true);g.hit=true;aiContact(p,d,before,blocked==='blk',hp-d.HP,false);if(blocked==='blk')sfxc(0x2b,SN_BLOCK);}return;}if(aiEnabled()&&p.AIFFProjectile){const b=p.AIFFProjectile,d=p.opp;if(!p.FBON||!hurtable(d))return;const region=hurtregion(fbbox(p),d);if(region<0)return;const hp=d.HP,before=d.ST,blocked=applyhit(d,b.type==='grenade'?26:b.type==='rain'?24:18+2*b.strength,2,b.type==='grenade'?1:0,0,b.dir,4,region,false,null,true);aiContact(p,d,before,blocked==='blk',hp-d.HP,false);p.FBON=0;delete p.AIFFProjectile;sfxc(blocked?0x2b:0x2a,SN_HIT[2]);return;}if(isDamnd(p)&&p.AIDamndBarrel){const b=p.AIDamndBarrel,d=p.opp;if(!p.FBON||b.broken||!hurtable(d))return;const region=hurtregion(fbbox(p),d);if(region<0)return;const hp=d.HP,before=d.ST,blocked=applyhit(d,24+3*b.strength,2,1,1,b.direction,4,region,false,null,true);aiContact(p,d,before,blocked==='blk',hp-d.HP,false);b.broken=12;sfxc(blocked?0x2b:0x2a,SN_HIT[2]);return;}if(ceYogaProjectile(p))return;if(ceBoundProjectile(p)&&!nativeStep)return;if(!p.FBON||ceShotoProjectile(p)&&(p.FBINIT||p.FBIMPACT||((G.tick+(p.FBSLOT||0))&1)))return;const d=p.opp;if(!hurtable(d))return;

  const box=fbbox(p);if(!box)return;const region=hurtregion(box,d);if(region<0)return;

  const nativeImpact=ceBoundProjectile(p),hurt=nativeImpact?boxw(d,region):null,impactPoint=hurt?[(box[0]+hurt[0])>>1,(box[1]+hurt[1])>>1]:null;

  if(ceShotoProjectile(p)||ceBoundProjectile(p)){p.FBIMPACT=2;p.FBDEFER=0;}else p.FBON=0;const s=p.FBDEF?p.FBSTR:(Math.abs(p.FBVX)>>8)-3;

  const localStop=VER.cur==='CE'&&(p.fid===0||p.fid===4),oldPose=localStop?ceProjectilePose(d):null;

  const native=ceNativeCombat(p,d,region,true),damage=native?native.damage:20+((rand()>>>20)%3)-1;

  const bl=applyhit(d,isEvilKen(p)?Math.floor(damage*192/256):damage,native?native.strength:s,0,0,p.FBVX>=0?1:-1,native?native.chip:s<2?5:8,region,localStop,native,true),X=XS(p);

  if(nativeImpact&&!aiEnabled())SF2CEPROJECTILES.bodyImpact(p,impactPoint,{tick:G.tick,rand});

  if(localStop){d.CEPF={init:1,ticks:14,pose:ceProjectilePose(d)};Object.assign(d,oldPose);d.anim=d.F.anims[d.cur];}

  sfxc(X&&(bl?X.blk:X.fbhit),bl?SN_BLOCK:SN_HIT[2]);}

// ---- camera / clamp (M5 clamps to a fixed 320 view; here the 864px stage scrolls) ----

// usable camera range per stage: every non-wrapping back layer must cover the whole view (fixes black edge bands)

const CAMR=D.camr; // usable camera range per stage (tools/camrange.py): the captured layers don't cover the far edges

function aiFFStage(){return aiEnabled()&&G.scene==='fight'&&isFFGuest(P[1]);}
function aiRoom(){if(aiFFStage())return{left:0,right:SF2AIDamndStage.width};const r=CAMR[G.stage];return{left:Math.max(0,r[0]),right:Math.min(SW,r[1]+W)};}
function aiSceneryProjection(){return{camera:G.cam,offset:0,panorama:aiEnabled()&&G.scene==='fight'&&G.stage===5};}
function aiViewWidth(){return aiEnabled()&&G.scene==='fight'?(G.AIViewWidth||W):W;}
function camera(){

  const r=CAMR[G.stage];

  if(aiEnabled()&&G.scene==='fight'){
    window.SF2CECAMERA?.step(G.stage,P,{throw:P.some(p=>p.THV),shake:!!G.CECameraShake});
    const room=aiRoom(),xs=P.map(p=>p.X/256);
    // Zoom follows only horizontal fighter separation, never jump height or
    // animation bounds. A 320px close view caps normal zoom at 1.2x, leaving HUD headroom.
    const span=room.right-room.left,minWidth=Math.min(320,span);
    const needed=Math.min(span,Math.max(minWidth,Math.abs(xs[1]-xs[0])+128));
    const follow=G.AICamera||(G.AICamera={velocity:0,target:W,hold:0});
    const target=needed;
    follow.target=Math.max(minWidth,Math.min(span,follow.target));
    if(target>follow.target+4){follow.target=target;follow.hold=20;}
    else if(follow.hold>0)follow.hold--;
    else if(target<follow.target-14)follow.target=target;
    else follow.target+=(target-follow.target)*.025;
    const spring=(value,velocity,target,rate)=>{const d=value-target,c=velocity+rate*d,e=Math.exp(-rate);return[target+(d+c)*e,(velocity-rate*c)*e];};
    let [width,velocity]=spring(G.AIViewWidth||W,follow.velocity,follow.target,follow.target>(G.AIViewWidth||W)?.13:.075);
    if(width<needed){width=needed;velocity=Math.max(0,velocity);}
    if(width>span){width=span;velocity=Math.min(0,velocity);}
    if(Math.abs(width-follow.target)<.05&&Math.abs(velocity)<.05){width=follow.target;velocity=0;}
    G.AIViewWidth=width;follow.velocity=velocity;
    // Anchor horizontal framing to actual positions. Jump poses and retained
    // airborne VX must not pan the scenery or keep it drifting after landing.
    // Follow position directly so a fighter and the floor stop together.
    follow.centre=(xs[0]+xs[1])/2;
    G.cam=Math.max(room.left,Math.min(room.right-width,follow.centre-width/2));
    follow.inset=0;
    return;
  }
  if(VER.cur!=='CE'){const m=(P[0].X+P[1].X)>>9;G.cam=Math.max(r[0],Math.min(r[1],m-W/2|0));return;}

  window.SF2CECAMERA?.step(G.stage,P,{throw:P.some(p=>p.THV||p.CETHV?.kind==='held'||p.CEBV?.phase===0),shake:!!G.CECameraShake});

  // CE 0x9c77c..0x9c86c. A close pair stays inside the 64/320

  // camera margins; a wider pair follows its centre, at most 6 px/tick.

  const x0=P[0].X>>8,x1=P[1].X>>8,l=x0<=x1?P[0]:P[1],rgt=l===P[0]?P[1]:P[0],left=Math.min(x0,x1)-CE_CAM_EXTENT[l.fid],right=Math.max(x0,x1)+CE_CAM_EXTENT[rgt.fid],span=right-left;

  let delta=0;

  if(span<256){if(right-G.cam>320)delta=right-G.cam-320;else if(left-G.cam<64)delta=left-G.cam-64;}

  else if(span<384)delta=((left+right)>>1)-G.cam-192;

  G.cam=Math.max(r[0],Math.min(r[1],G.cam+Math.max(-6,Math.min(6,delta))));

}

function clampx(p){if(p.CEHHPostPush){delete p.CEHHPostPush;return;}
  if(aiEnabled()&&G.scene==='fight'){const room=aiRoom(),extent=CE_CAM_EXTENT[p.fid],lo=room.left+extent,hi=room.right-extent,x=p.X/256;p.CEWALL=x<=lo?1:x>=hi?2:0;p.X=Math.max(lo*256,Math.min(hi*256,p.X));return;}
  if(VER.cur==='CE'){

    // 0x3224..0x3282: clamp the integer position word, retaining its fraction.

    const extent=carMode(p)?(window.SF2CECARDATA?.playerExtents?.[p.fid]??CE_CAM_EXTENT[p.fid]):CE_CAM_EXTENT[p.fid],lo=Math.max(extent,G.cam+extent)|0,hi=Math.min(SW-extent,G.cam+W-extent)|0,x=p.X>>8;

    p.CEWALL=x<=lo?1:x>=hi?2:0;

    const beforeClamp=p.X;if(x<lo)p.X=(lo<<8)|(p.X&255);else if(x>hi)p.X=(hi<<8)|(p.X&255);if(VER.edition==='ce'&&p.CEHH)p.opp.X+=p.X-beforeClamp;
    return;

  }

const lo=Math.max(40,G.cam+40)<<8,hi=Math.min(SW-40,G.cam+W-40)<<8;/* M13d: arcade keeps fighters 40px inside the screen (max gap 304) */if(p.X<lo)p.X=lo;if(p.X>hi)p.X=hi;}

// ---- rounds (frame counts in M5 25fps frames, timer in 60Hz ticks) ----

// Original CE0x9470..0x94ea:40 video clocks per BCD count, including displayed00.

// This clock runs before actor hitstop; the native timer does not freeze with a hit.

function ceRoundClock(){

  if(!G.rtime||G.gph!==1)return false;

  if(++G.tick60<40)return false;G.tick60=0;

  if(G.timer>0){G.timer--;return false;}

  const a=P[0].HP,b=P[1].HP;endround((a>=b?1:0)|(a<=b?2:0),true);return true;

}

// Original Dhalsim 0x42fc4..0x42fd4 holds60 actor updates before pose admission.

function ceVictoryHold(p){return VER.edition==='ce'&&p.fid===7?60:0;}

function phase(){

  if(VER.edition==='ce'&&G.gph===2&&G.CERound)return ceRoundPhase();

  if(G.gph===1){const a=P[0].HP,b=P[1].HP;let m=0;

    if(!hpAlive(P[0])||!hpAlive(P[1])){if(hpAlive(P[0]))m|=1;if(hpAlive(P[1]))m|=2;if(!m)m=3;return endround(m);}

    if(VER.cur==='CE')return;

    if(G.rtime&&++G.tick60>=30){G.tick60-=30;G.timer--;}

    if(G.timer>0)return; if(a>=b)m=1; if(a<=b)m|=2; return endround(m);}

  if(aiEnabled()&&G.gph===2&&P.some(p=>p.CESpecial?.fatal&&!p.CEKO?.ready))return;
  if(aiEnabled()&&G.gph===2&&G.gt===59&&P.some((p,i)=>(G.winmask&(1<<i))&&hpAlive(p)&&(p.AIAir||p.ST===S_AIR||(p.Y>>8)>0)))return;
  G.gt++;

  if(G.gph===0){if(G.gt===(VER.edition==='ce'?11:5))sfxc(0x5f,SN_ROUND);if(G.gt===(VER.edition==='ce'?51:34))sfxc(0x60+Math.min(G.round,4)-1,SN_NUM+Math.min(G.round,9)-1);if(G.gt===(VER.edition==='ce'?106:70))sfxc(0x56,SN_FIGHT);if(G.gt>=(VER.edition==='ce'?159:120)){G.gph=1;}return;}

  const victoryHold=Math.max(0,...P.filter((p,i)=>(G.winmask&(1<<i))&&hpAlive(p)).map(ceVictoryHold));

  for(let i=0;i<2;i++)if((VER.edition!=='ce'||G.winmask!==3)&&G.winmask&(1<<i)&&hpAlive(P[i])&&G.gt===60+ceVictoryHold(P[i])){const p=P[i];let n=AN_WIN;

    /* CE Ryu/Ken, 0x3d932: normal round-win selection uses these ROM bit masks.

       Other fighters currently use their first observed genuine victory sequence. */

    if(VER.cur==='CE'&&(p.fid===0||p.fid===4)&&([0x1082,0xef7d][Math.min(1,p.WINS-1)]&(1<<(rand()&15)))){const a=AI(p,'win2');if(a>=0)n=a;}

    setanim(p,n,0);p.Y=p.VX=p.VY=0;p.ST=S_WIN;if(isDamnd(p)&&!muted&&!netReplaying&&AC&&MG)SF2AIDamnd.laugh(AC,MG);if(VER.edition==='ce'&&p.fid===7)p.CECameraIgnore=true;}

    if(G.gt===96+victoryHold&&G.winmask!==3){const w=G.winmask&1?0:1;G.bann=(VER.cur==='CE'||G.mode2p||!G.arc?aiName(P[w]).toUpperCase()+' WIN':w?'YOU LOSE':'YOU WIN')+(P[w].HP===aiMax(P[w])?'  PERFECT':'');if(VER.cur==='CE'&&window.SF2CEANNOUNCER){G.ann=SF2CEANNOUNCER.init(isFFGuest(P[w])?(G.mode2p||w===0?12:13):G.mode2p?P[w].fid:w?13:12);for(const code of SF2CEANNOUNCER.step(G.ann))sfxc(code);}}

  if(G.gt===96+victoryHold&&G.winmask===3)G.bann=G.ko?'DOUBLE K.O.':'DRAW GAME';

  if(G.gt>=264+victoryHold){if(P[0].WINS>=2||P[1].WINS>=2||G.round>=5)matchend();else{G.round++;resetround();}}}

function endround(m,preActors=false){if(VER.edition==='ce'&&window.SF2CEROUND)return ceEndRound(m,preActors);G.ko=!hpAlive(P[0])||!hpAlive(P[1]);if(G.ko){const k=P.find(q=>!hpAlive(q)),X=k&&XS(k);if(!(aiEnabled()&&SF2CESPECIAL.aiKO(G,P))){sfxc(X&&X.ko,SN_KO);G.slow=72;}}else G.bann='TIME OVER';G.winmask=m;if(VER.edition!=='ce'||m!==3){if(m&1)P[0].WINS++;if(m&2)P[1].WINS++;}G.gph=2;G.gt=0;}

function ceStageClock(){return VER.edition==='ce'?(G.CEStageTick??G.tick):G.tick;}

function ceVictorySelect(p){let n=AN_WIN;if([0,4].includes(p.fid)&&([0x1082,0xef7d][Math.min(1,p.WINS-1)]&(1<<(rand()&15)))){const q=AI(p,'win2');if(q>=0)n=q;}setanim(p,n,0);const a=p.anim;if(a.nativeDurations)p.anim={...a,ents:a.ents.map((e,i)=>{const q=e.slice();q[1]=a.nativeDurations[i];return q;})};p.Y&=255;p.VX=p.VY=0;p.ST=S_WIN;if([0,4,7,8,9].includes(p.fid))p.FACE=p.opp.X>p.X?1:0;if(p.fid===7){p.CECameraIgnore=true;p.CEWin.variant=SF2CEROUND.data.dhalsimSources.indexOf(p.anim.source);p.CEWin.floatIndex=0;}if([0,4,7,9,10].includes(p.fid))animstep(p);}

function cePriorFacing(){const dx=(P[1].X>>8)-(P[0].X>>8);if(Math.abs(dx)>24)for(const p of P)if([0,4,9].includes(p.fid))p.CEPriorFace=p.i===0?(dx>=0?1:0):(dx>=0?0:1); }
const ceRoundHooks=()=>({find:AI,anim:setanim,tick:animstep,sound:sfxc,victory:ceVictorySelect,random:()=>rand()&255,winnerState:()=>G.CERound,winnerObjects:()=>G.CEObjects,winnerPlayers:()=>P,winnerContext:()=>({finalArcade:!!G.arc&&G.li===G.ladder.length-1})});

function ceEndRound(m,preActors){

 G.ko=P.some(p=>!hpAlive(p));G.winmask=m;G.gph=2;G.gt=0;G.ann=null;G.slow=0;

 if(m!==3){if(m&1)P[0].WINS++;if(m&2)P[1].WINS++;}else if(!G.ko)G.bann='TIME OVER';

 const dead=P.filter(p=>!hpAlive(p)),ground=dead.filter(p=>p.CEKO_GROUND&&!p.CETHV&&!p.CEBV),globalStop=G.hfz;

 for(const p of ground)SF2CEROUND.beginKO(p,p.CEKO_DIR||1,dead.length===2?13:14);

 if(ground.length&&globalStop){G.hfz=0;for(const p of P)if(hpAlive(p))p.CEKOOwnerStop=13;}

 if(G.ko&&!ground.length&&!dead.some(p=>p.CEKO)){const p=dead[0],x=XS(p);sfxc(x&&x.ko,SN_KO);}if(!G.ko)G.bann='TIME OVER';

 const winner=m===1?0:m===2?1:-1,w=winner>=0?P[winner]:null,human=!!w&&(!(G.netBot&&winner===1)&&(!!G.mode2p||winner===0)),op=w?.opp,perfect=w&&w.HP===144,vitality=w?(perfect?(human&&(!G.mode2p||G.netBot)&&op.i===1?[300,300,300,300,300,300,300,300,800,500,500,500][op.fid]:300):Math.max(0,w.HP)):0;

 G.CERound=SF2CEROUND.create({ko:G.ko,draw:m===3,time:G.timer,winner,human,vitality,round:G.round});

 for(const p of P)if(hpAlive(p)&&p.ST===S_FREE)SF2CEROUND.admit(p,m===3||p.i!==winner,true,ceRoundHooks());

}

function ceRoundPhase(){const s=G.CERound;G.gt++;

 if(s.done){ceFinishRound();return;}

 const allReady=P.every(p=>p.CEWin?.ready||p.CEKO?.ready||(!hpAlive(p)&&!p.CETHV&&p.ST===S_KO&&p.cur===AN_FALL+1&&p.adone));

 const h={clock:G.tick-1,sound:sfxc,banner:()=>{G.bann=s.draw?(s.ko?'DOUBLE K.O.':'DRAW GAME'):aiName(P[s.winner]).toUpperCase()+' WIN';},announce:()=>{G.ann=SF2CEANNOUNCER.init(G.mode2p?P[s.winner].fid:s.winner?13:12);},perfect:()=>{G.bann+='  PERFECT';sfxc(0x55);},score:(_,amount)=>{const p=P[s.winner];p.SCORE=Math.min(9999999,(p.SCORE||0)+amount);}};

 SF2CEROUND.bonusStep(s,h);SF2CEROUND.uiStep(s,allReady,h);

}

function ceFinishRound(){

 if(P.some(p=>p.WINS>=2)||G.round>=4){matchend();return;}

 if(G.round===3)P.forEach(p=>p.WINS=1);

 const state=SF2CEFADE.begin('fight>round');if(!state)throw Error('Native repeat-round fade unavailable');state.target='fight';state.roundNext=true;state.entered=false;G.fade=state;

}

// ---- CPU: decided every 60Hz frame; random choices keep the old per-25fps-tick odds (q60), counters in frames ----

const q60=q=>1-Math.pow(1-q,5/12);

/* per-fighter CPU move picks from the move list kinds: far (fireball/dash), anti-air (rising), mid (other); CE bosses (8-11) use theirs more often */

function aipick(p){const mv=p.F.moves||[],c=p.AIPC;if(c&&c.mv===mv)return c;const ix=f=>mv.findIndex(f);

  const fbs=mv.map((m,i)=>m.kind==='fb'?i:-1).filter(i=>i>=0);let far=fbs.length?fbs:mv.map((m,i)=>m.kind==='dash'||m.role==='far'?i:-1).filter(i=>i>=0);

  const aa=ix(m=>m.kind==='rise'||m.role==='rise'),mid=mv.map((m,i)=>i).filter(i=>i!==aa&&far.indexOf(i)<0);if(!mid.length&&far.length>1)mid.push(far[far.length-1]);

  return p.AIPC={mv,far,aa,mid,boss:VER.cur==='CE'&&p.fid>=8?1:0};}

/* CE CPU move choice, measured: tools/emu_ce/ai2.py plays the CE 1P ladder in the box emulator and logs every move the CPU starts

   vs scripted P1 behaviours; per distance bin (<50,50-90,90-150,150-220,220+, P1 airborne): [starts per frame, [[move,count]...]] */

const CEAI={"1":{"b0":[0.0149,[["T",8],["M0",5],["J",2],["jLK",1],["jHP",1]]],"b1":[0.0199,[["T",10],["M0",9],["TK",9],["M1",2],["J",1],["jHP",1]]],"b2":[0.0119,[["M0",64],["M1",45],["J",8],["T",5],["sHK",2],["jLK",1],["jHP",1],["jHK",1]]],"b3":[0.0016,[["J",6],["M0",4],["M1",1]]],"b4":[0.0027,[["M0",9],["J",1]]],"air":[0.0048,[["M0",34],["J",9],["M1",8],["jHP",5],["sHK",2]]]},"2":{"b0":[0.007,[["cLP",8],["sMP",7],["J",5],["jMP",4],["sHK",4],["sMK",3],["T",2],["sLP",2]]],"b1":[0.0229,[["T",24],["cLP",5],["jMK",2],["jMP",2],["sMP",2],["sMK",2],["J",1],["jHP",1]]],"b2":[0.0127,[["cLP",39],["sLK",22],["sHK",19],["sMK",17],["M1",17],["M0",15],["cHK",6],["cHP",6]]],"b3":[0.0017,[["J",9],["cHP",1]]],"b4":[0.0025,[["J",6],["cLK",1]]],"air":[0.0086,[["cLP",18],["M0",11],["sLP",9],["sHK",6],["J",6],["sLK",4],["jHK",4],["M1",3]]]},"3":{"b0":[0.0078,[["T",4],["sLP",2],["cHK",1]]],"b1":[0.0236,[["T",18],["sLP",9],["jHK",4],["J",1],["jHP",1]]],"b2":[0.0086,[["sLP",25],["cHK",14],["J",12],["sHP",10],["cLP",5],["jHK",3],["sHK",2]]],"b3":[0.0024,[["J",19],["cHK",1],["jHK",1],["sHP",1]]],"b4":[0.0021,[["J",19]]],"air":[0.0048,[["J",14],["jHK",13],["cHP",2],["sLP",2],["sHP",1],["jHP",1]]]},"5":{"b0":[0.0129,[["J",39],["jHK",16],["jMK",7],["sLP",6],["sMK",2],["sHK",2],["sMP",2],["sLK",2]]],"b1":[0.0214,[["J",19],["sLP",18],["jMK",14],["jHP",10],["sMP",10],["jHK",10],["M0",9],["T",9]]],"b2":[0.0136,[["J",72],["M1",8],["jHK",8],["cHK",7],["sHP",5],["jMK",4],["sLP",4],["cHP",1]]],"b3":[0.0132,[["J",79]]],"b4":[0.0054,[["J",15],["M1",4]]],"air":[0.0168,[["J",36],["sLP",20],["jHK",17],["sLK",14],["sHK",13],["jMK",4],["M0",2],["sMK",1]]]},"6":{"b0":[0.0089,[["sMK",11],["sLP",9],["TK",2],["sMP",2],["jHK",1],["cHK",1]]],"b1":[0.0177,[["sLK",5],["sLP",4],["sMK",3],["cHK",3],["cLK",2],["sHK",2],["jHK",1],["cMK",1]]],"b2":[0.0154,[["sMK",67],["sMP",28],["cHK",24],["sLP",23],["sHK",12],["M1",9],["cHP",4],["cLP",2]]],"b3":[0.0034,[["M1",5],["jHK",5],["J",5],["cHP",4],["cHK",3]]],"b4":[0.0008,[["J",2]]],"air":[0.0053,[["sLP",31],["sHK",10],["sMK",7],["sMP",5],["jHK",3],["cHK",1],["M1",1],["cMP",1]]]},"7":{"b0":[0.0184,[["J",47],["cHK",18],["sHK",2],["jLP",1],["cMP",1],["sMK",1]]],"b1":[0.0227,[["sMP",38],["J",35],["cHK",12],["sHK",4],["sMK",1]]],"b2":[0.0146,[["J",59],["sHP",20],["cHK",12],["sHK",5],["sMK",1]]],"b3":[0.0058,[["J",16],["sHP",11],["cHK",8],["sHK",2],["sMK",1],["cMP",1]]],"b4":[0.0075,[["J",36],["sHP",14],["sHK",8],["cHK",6],["sMK",2]]],"air":[0.0162,[["J",53],["cHK",14],["jHP",12],["sHK",6],["sHP",6],["jHK",4],["sMK",2],["cMP",1]]]},"8":{"b0":[0.0105,[["J",29],["sHK",15],["jHK",9],["T",2]]],"b1":[0.0231,[["T",58],["J",18],["sHK",12],["jHK",3],["cHP",2]]],"b2":[0.0156,[["sHK",79],["J",21],["jHK",13],["cHP",7]]],"b3":[0.0039,[["sHK",15],["J",8],["cHP",1]]],"b4":[0.0193,[["J",40],["sHK",25]]],"air":[0.0114,[["J",54],["sHK",31],["jHK",24]]]},"9":{"b0":[0.0247,[["sHK",25],["J",23],["jHK",10]]],"b1":[0.0095,[["sHK",10],["jHK",8],["J",8]]],"b2":[0.017,[["sHK",128],["M0",23],["J",19],["cHP",17],["jHK",9]]],"b3":[0.0117,[["M0",72],["sHK",29],["J",15],["cHP",4]]],"b4":[0.008,[["M0",14],["J",9]]],"air":[0.0096,[["sHK",33],["J",13],["M0",11],["jHK",3]]]},"10":{"b0":[0.0071,[["sHP",18],["cHP",6],["J",1],["sHK",1],["jHK",1]]],"b1":[0.0147,[["sMP",43],["cHP",22],["J",8],["sHP",4]]],"b2":[0.0117,[["sMP",69],["J",29],["cHP",15],["sHK",5],["jHK",4]]],"b3":[0.0011,[["sMP",5],["J",2],["cHP",2]]],"b4":[0.0007,[["J",2]]],"air":[0.0094,[["sHP",29],["sMP",21],["jHK",3],["J",3]]]},"11":{"b0":[0.0192,[["J",43],["jHK",17],["cHK",8]]],"b1":[0.0144,[["J",27],["jHK",21],["cHK",2],["T",1]]],"b2":[0.0214,[["J",86],["jHK",50],["cHK",43]]],"b3":[0.0131,[["J",97],["cHK",2]]],"b4":[0.0087,[["J",58]]],"air":[0.0162,[["J",52],["jHK",46],["cHK",4],["M0",1]]]},"4":{"b0":[0.0193,[["J",69],["jHK",35],["TK",21],["M2",8],["sLK",1],["sHK",1]]],"b1":[0.0274,[["J",59],["TK",24],["jHK",9],["M2",8],["sHK",6],["sLK",5],["cLK",2],["cHK",1]]],"b2":[0.0106,[["J",31],["jHK",10],["sHK",5],["M2",5],["M1",1],["cHK",1]]],"b3":[0.01,[["J",52],["cHK",2],["M2",1]]],"b4":[0.0143,[["J",74],["M2",16],["sLP",1]]],"air":[0.0101,[["J",52],["jHK",18],["M2",5],["sHK",4],["cHP",1],["M1",1]]]}};

function ceai(p,o,d,r,tw){const t=CEAI[p.fid];if(!t||VER.cur!=='CE'||p.ST!==S_FREE)return -1;

  const e=o.Y>(4<<8)?t.air:t['b'+(d<50?0:d<90?1:d<150?2:d<220?3:4)];if(!e||!e[1].length||((r>>>4)&0xffff)>=e[0]*65536)return -1;

  let n=e[1].reduce((a,x)=>a+x[1],0),q=(r>>>20)%n,a=e[1][0][0];for(const x of e[1]){if(q<x[1]){a=x[0];break;}q-=x[1];}

  const B={LP:0,MP:1,HP:2,LK:3,MK:4,HK:5};G.aicool=20;

  if(a==='J')return tw|K_U; if(a==='T')return tw|K_ATK<<2; if(a==='TK')return tw|K_ATK<<5;

  if(a[0]==='M'){p.FORCE=(1<<4)|(+a.slice(1)+1);return 0;}

  const b=K_ATK<<B[a.slice(1)];if(a[0]==='c')return K_D|b;if(a[0]==='j'){p.AIJB=b;p.AIJT=14;return tw|K_U;}return b;}

// AI Edition commits to short action plans instead of rerolling posture every
// frame. Original WW/CE CPU scheduling remains in aiLegacy below.
function aiEditionCPU(p){
  const o=p.opp,d=Math.abs(o.X-p.X)/256,forward=o.X>=p.X?K_R:K_L,back=forward===K_R?K_L:K_R,diff=Math.max(0,Math.min(3,G.diff|0));
  const s=p.AICPU||(p.AICPU={keys:0,until:0,kind:'idle',decisions:0,specialReady:0,attackReady:0,threat:null,threatAt:0,jumpAt:0,jumpButton:0}),reaction=[18,12,8,5][diff];
  const commit=(keys,kind,ticks)=>{s.keys=keys;s.kind=kind;s.until=G.tick+ticks;s.decisions++;if(['normal','punish','throw','special','anti-air'].includes(kind))s.attackReady=G.tick+[100,70,42,18][diff];return p.KEYS=keys;};
  if(SF2AICHAIN.breakerWindow(p,G.tick)&&G.tick-p.AIComboBreaker.opened>=[99,7,6,5][diff]&&p.AIBreakAttempt!==p.AIComboBreaker.opened){p.AIBreakAttempt=p.AIComboBreaker.opened;const chance=SF2AIRULES.hash(G.AIMatchSeed,'breaker:'+p.i+':'+p.AIBreakAttempt)%100;if(chance<[0,15,35,55][diff]){const choices=SF2AIRULES.mapping(p).filter(m=>!m.command&&p.F.moves[m.index]&&!(p.F.moves[m.index].kind==='fb'&&p.FBON));const choice=choices.find(m=>m.index===1)||choices[0];if(choice){s.keys=choice.mask;s.kind='combo-break';return p.KEYS=s.keys;}}}
  if(p.ST===S_ATK&&p.AIChain?.confirmed===p.AIAttackSerial&&hpAlive(o)&&p.AICombo.hits<(isDamnd(p)?[1,2,3,3][diff]:[1,2,4,6][diff])&&s.chainSerial!==p.AIAttackSerial){const available=[0,1,2,3,4,5].filter(b=>!(p.AIChain.used&(1<<b)));if(available.length){const preferred=isDamnd(p)&&available.some(b=>b<3)?available.filter(b=>b<3):available,b=preferred[(p.AIAttackSerial+p.i)%preferred.length];s.chainSerial=p.AIAttackSerial;s.keys=(p.RETCR?K_D:0)|(K_ATK<<b);s.kind='chain';return p.KEYS=s.keys;}}
  if(G.hfz>0){p.FORCE=0;return p.KEYS=s.keys&~CONF;}
  if(p.ST===S_AIR){if(s.jumpButton&&G.tick>=s.jumpAt&&p.Y>4*256){const button=s.jumpButton;s.jumpButton=0;return p.KEYS=button;}return p.KEYS=0;}
  if(![S_FREE,S_CR,S_UP].includes(p.ST)){s.keys&=~CONF;return p.KEYS=s.keys;}
  const projectile=o.FBON&&Math.abs(o.FBX-p.X)<170*256,air=o.ST===S_AIR&&o.Y>12*256&&d<140,attack=[S_ATK,S_SPEC].includes(o.ST)&&d<125;
  const threat=projectile?'projectile':air?'air':attack?'attack':null;
  if(threat!==s.threat){s.threat=threat;s.threatAt=G.tick;}
  const ready=threat&&G.tick-s.threatAt>=reaction,AP=aipick(p);
  if(ready&&s.kind!=='guard'&&s.kind!=='anti-air'){
    const r=rand()>>>0;
    if(air&&AP.aa>=0&&G.tick>=s.specialReady&&(r&255)<[75,140,205,242][diff]){
      p.FORCE=(diff>=2?32:16)|(AP.aa+1);s.specialReady=G.tick+45;return commit(0,'anti-air',14);
    }
    const crouch=attack&&o.Y===0&&ent(o)[10]>=0;
    return commit(back|(crouch?K_D:0),'guard',18);
  }
  if(G.tick<s.until){
    // Approach can end early on reaching attack range; every other plan keeps
    // its posture for the commitment window, including after a threat clears.
    if(s.kind!=='approach'||d>55)return p.KEYS=s.keys&~(G.tick>=s.until-6?CONF:0);
  }
  if(ready&&s.kind==='guard')return commit(back|(attack&&o.Y===0&&ent(o)[10]>=0?K_D:0),'guard',18);
  const r=rand()>>>0,chance=(r&65535)/65536,strength=diff>=2?2:(r>>>16)%3,attackDelay=[26,18,12,8][diff];
  if(p.aiProfile==='rolento'&&p.HP<=aiMax(p)*.33&&d>100&&!p.FBON&&G.tick>=s.specialReady&&chance<.65){p.FORCE=(strength<<4)|5;s.specialReady=G.tick+70;return commit(0,'grenade-barrage',12);}
  const special=slot=>{p.FORCE=(strength<<4)|(slot+1);s.specialReady=G.tick+(isDamnd(p)?65:[80,65,52,44][diff]);return commit(0,'special',12);};
  // Edi changes from a baton/grab pursuer to a retreating gunman near one-quarter health.
  if(p.aiProfile==='edi'&&p.HP<=aiMax(p)*.27){
    if(d<145&&p.X/256>aiRoom().left+48&&p.X/256<aiRoom().right-48)return commit(back,'gun-spacing',12);
    if(!p.FBON&&G.tick>=s.specialReady)return special(chance<.6?4:0);
    if(d>185)return commit(0,'gun-wait',10);
  }
  const reach=isFFGuest(p)?isDamnd(p)?92:['sodom','rolento'].includes(p.aiProfile)?76:56:[78,98,88,92,78,108,90,150,100,125,105,122][p.fid];
  if(d<thrr(p,0)-3&&o.Y===0&&[S_FREE,S_CR,S_UP].includes(o.ST)&&chance<[.1,.2,.35,.5][diff])return commit(forward|(K_ATK<<(p.aiProfile==='andore'?((r>>>18)&1?1:2):((r>>>18)&1?2:5))),'throw',attackDelay);
  if(d>105&&AP.far.length&&!p.FBON&&G.tick>=s.specialReady&&chance<[.16,.26,.38,.5][diff]*(isDamnd(p)?.65:1))return special(AP.far[(r>>>16)%AP.far.length]);
  if(d<=reach){
    if(G.tick<s.attackReady)return commit(0,'recover-spacing',Math.min(8,s.attackReady-G.tick));
    if(d>45&&d<100&&AP.mid.length&&G.tick>=s.specialReady&&chance<[.08,.14,.2,.28][diff]*(isDamnd(p)?.3:1))return special(AP.mid[(r>>>16)%AP.mid.length]);
    const punish=[S_HIT,S_GETUP].includes(o.ST)||o.ST===S_ATK&&o.aidx>0,low=((r>>>20)&3)===0;
    const button=isDamnd(p)?(punish?2:(r>>>17)%3):d<52?(punish&&diff>=2?2:(r>>>17)%3):(r>>>18)&1?4:5;
    return commit((low?K_D:0)|(K_ATK<<button),punish?'punish':'normal',attackDelay);
  }
  if(d>135&&d<260&&chance<[.04,.065,.08,.1][diff]){s.jumpAt=G.tick+13;s.jumpButton=K_ATK<<((r>>>18)&1?2:5);return commit(forward|K_U,'jump-in',18);}
  return commit(forward,'approach',16+(r>>>20)%9);
}
function ai(p){return aiEnabled()?aiEditionCPU(p):aiLegacy(p);}
function aiLegacy(p){if(p.AIJB&&p.ST===S_AIR&&--p.AIJT<=0){const b=p.AIJB;p.AIJB=0;return p.KEYS=b;}if(p.ST!==S_AIR&&p.AIJT<=0)p.AIJB=0; const r=rand(), o=p.opp, L=ailvl(), pr=x=>((r>>>4)&255)<q60(x)*256; let d=o.X-p.X, tw,aw; if(d>=0){tw=K_R;aw=K_L;}else{tw=K_L;aw=K_R;d=-d;} d>>=8; let k=0;

  const str=()=>{let s=(r>>>24)&3;if(s===3)s=1;return s<<4;};

  const gate=((r>>>12)&4095)<1706; if(G.aidelay){G.aidelay--;k=K_D;if(!G.aidelay)k|=G.aipend;return p.KEYS=k;}

  const AP=aipick(p),pk=a=>a[(r>>>16)%a.length]+1;

  if(o.ST===S_AIR&&d<100&&p.ST===S_FREE&&AP.aa>=0&&pr(0.5)){let s=(r&0x300)>>8;if(s===3)s=2;p.FORCE=(s<<4)|(AP.aa+1);return p.KEYS=0;}

  if(o.FBON&&Math.abs(o.FBX-p.X)<100<<8){k=aw;if(!(r&0xe0)&&gate)k=tw|K_U;return p.KEYS=k;}

  if((o.ST===S_ATK||o.ST===S_SPEC)&&d<110&&pr(0.25+0.6*L)){k=aw;if(o.RETCR||(r&0x1000))k|=K_D;return p.KEYS=k;}

  {const c=G.aicool?-1:ceai(p,o,d,r,tw);if(c>=0)return p.KEYS=c;}

  if(G.aicool){G.aicool--;if(!gate)return p.KEYS=p.KEYS&(K_L|K_R);if(d>80)k=tw;if(!(r&0x70000))k=aw;return p.KEYS=k;}

  if(!gate)return p.KEYS=p.KEYS&(K_L|K_R|K_D);

  if(d>=96&&!p.FBON&&AP.far.length&&(r&0x1f)<1+Math.round(3*L)+2*AP.boss){p.FORCE=str()|pk(AP.far);G.aicool=48;return p.KEYS=0;}

  if(d<=95&&d>=60&&AP.mid.length&&(r&0x3f)<=1+2*AP.boss&&(r&0x3f)>=1){p.FORCE=str()|pk(AP.mid);G.aicool=38;return p.KEYS=0;}

  /* M13f arcade CPU habits: throws a fighter who has just stood up / landed next to it, and punishes a whiffed normal in reach */

  if(p.ST===S_FREE&&o.Y===0&&d<=thrr(p,0)&&(o.WAKET>0||o.LANDT>0)&&pr(0.3+0.5*L)&&!(p.PREV&K_ATK<<2)){return p.KEYS=tw|K_ATK<<((r>>>9)&1?2:5);}

  if(p.ST===S_FREE&&o.ST===S_ATK&&o.hitdone===0&&o.adone===0&&d<90&&o.aidx>=1&&pr(0.2+0.5*L)){return p.KEYS=K_ATK<<(2+((r>>>9)&1)*3);}

  if(d<thrr(p,0)-4&&p.ST===S_FREE&&o.Y===0&&(o.ST===S_FREE||o.ST===S_CR)&&(r&0x1f)<1+Math.round(3*L)&&!(p.PREV&K_ATK<<2)){G.aicool=48;return p.KEYS=tw|K_ATK<<((r>>>9)&1?2:5);}

  if(d>75){k=tw;if((r&0x3f)===1)k|=K_U;return p.KEYS=k;}

  let b=(r>>>8)&7;if(b>=6)b-=3;const btn=K_ATK<<b;G.aicool=Math.round((((r&0xf00000)>>>20)+8)*(1.7-L)*2.4);

  if(!(r&0x8000000))return p.KEYS=btn; G.aipend=btn;G.aidelay=5;return p.KEYS=K_D;}

// ---- input ----

const IQ=[]; let IDEL=(()=>{try{const m=/[?&]delay=(\d)/.exec(location.search);return m?+m[1]:1;}catch(e){return 1;}})();

let netActive=false,netReplaying=false;

const NET_BASE_G=JSON.parse(JSON.stringify(G));

const CONTROL={paused:false,item:0,padPrev:[0,0],keyPrev:0,inputPrev:0,resumeGate:false};

const down=new Set(); let gprev=0;

const P1K=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyS','KeyD','KeyZ','KeyX','KeyC'];

const P2K=['KeyJ','KeyL','KeyI','KeyK','Numpad7','Numpad8','Numpad9','Numpad4','Numpad5','Numpad6'];

const tapped=new Set();

addEventListener('keydown',e=>{if(e.target instanceof Element&&e.target.closest('select,input,textarea'))return;down.add(e.code);tapped.add(e.code);if(e.code==='KeyF'&&!e.repeat){const c=document.getElementById('c');if(document.fullscreenElement)document.exitFullscreen();else if(c.requestFullscreen)c.requestFullscreen().catch(()=>{});}if(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();audioInit();});

addEventListener('keydown',e=>{if(e.code==='KeyM'&&!e.repeat){muted=!muted;if(MG)MG.gain.value=muted?0:1;}});

addEventListener('keyup',e=>down.delete(e.code));

addEventListener('pointerdown',()=>audioInit());

function clearinput(){down.clear();tapped.clear();window.SF2Input?.clearHeld?.();if(window.SF2Input?.keys){SF2Input.keys[0]=SF2Input.keys[1]=0;}if(netActive)return;IQ.length=0;gprev=0;selprev=[0,0];for(const p of P){const heldKeys=p.KEYS;p.KEYS=p.PREV=p.HZK=0;if(aiEnabled())SF2AIRULES.block(p,heldKeys);}}
addEventListener('blur',clearinput);

addEventListener('visibilitychange',()=>{if(document.hidden)clearinput();});

const held=c=>down.has(c)||tapped.has(c);

const rk=t=>t.reduce((m,c,i)=>down.has(c)||tapped.has(c)?m|(1<<i):m,0);

// ---- gamepads (standard mapping): d-pad/left stick dirs; X/Y/RB = LP/MP/HP, A/B/RT = LK/MK/HK; Start pause/confirm, View Back ----

const PADB=[2,3,5,0,1,7]; let padN=[false,false],padMsg='',padMsgT=0;

function padRead(i){const ps=(navigator.getGamepads?navigator.getGamepads():[])||[];const g=[...ps].filter(p=>p&&p.connected!==false)[i];

  if(!g)return {k:0,g:0,on:false};const b=n=>{const x=g.buttons[n];return !!x&&(x.pressed||x.value>0.5);};

  const ax=g.axes[0]||0,ay=g.axes[1]||0,DZ=0.4;let k=0;

  if(b(14)||ax<-DZ)k|=K_L;if(b(15)||ax>DZ)k|=K_R;if(b(12)||ay<-DZ)k|=K_U;if(b(13)||ay>DZ)k|=K_D;

  PADB.forEach((n,j)=>{if(b(n))k|=K_ATK<<j;});return {k,g:(b(8)?2:0)|(b(9)?4:0),menu:(b(0)?1:0)|(b(1)?2:0)|(b(8)?4:0)|(b(9)?8:0),on:true};}

function pads(){const r=[padRead(0),padRead(1)];

  r.forEach((p,i)=>{if(p.on!==padN[i]){padN[i]=p.on;padMsg='Pad '+(i+1)+(p.on?' connected':' disconnected');padMsgT=180;

    if(p.on)audioInit();}});return r;}



// UI contributes only input bits and commands; all scenes remain in this engine.

function externalKey(i){const k=window.SF2Input?.keys?.[i];return Number.isInteger(k)?k&1023:0;}

function pauseGame(item=0){if(netActive||G.scene!=='fight')return;CONTROL.paused=true;CONTROL.item=item;clearinput();}

function resumeGame(){CONTROL.paused=false;CONTROL.resumeGate=true;clearinput();}

function nativeSelect(){

  CONTROL.paused=false;CONTROL.resumeGate=true;AICFG.prototype=AICFG.configured=false;

  if(aiEnabled())for(const p of P)setfighter(p,p.fid);

  G.arc=0;G.selstep=0;G.sel=[P[0].fid,P[1].fid];G.cep=G.sel.map((fid,i)=>isFFGuest(P[i])?12+ffGuestIds().indexOf(P[i].aiProfile):Math.max(0,CEGRID.indexOf(fid)));go('select');clearinput();

}

function nativeBack(){if(aiEnabled()&&G.scene==='select'&&G.AIColor){delete G.AIColor;clearinput();return;}

  if(G.scene==='fight'){if(CONTROL.paused)resumeGame();else pauseGame(1);}

  else if(G.scene==='select'||G.scene==='title'){CONTROL.paused=false;AICFG.prototype=AICFG.configured=false;go('title');clearinput();}

  else nativeSelect();

}

function pauseConfirm(){

  if(CONTROL.item===0)resumeGame();

  else if(CONTROL.item===1)nativeSelect();

  else if(CONTROL.item===2){CONTROL.paused=false;CONTROL.resumeGate=true;AICFG.prototype=AICFG.configured=false;go('title');clearinput();}

  else{resumeGame();resetmatch();}

}

function pointCommand(x,y){

  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>=W||y<0||y>=H)return 0;

  if(CONTROL.paused){const row=Math.floor((y-86)/20);if(x>=80&&x<304&&row>=0&&row<4){CONTROL.item=row;pauseConfirm();}return 0;}

  if(G.scene==='title'){

    const rows=[[158,172],[172,184],[184,197],[197,208],[208,224]],row=rows.findIndex(([a,b])=>y>=a&&y<b);

    if(row<0)return 0;G.menu=row;

    if(row<2){G.st=Math.max(G.st,21);return 1;}

    if(row===4)cycleEdition(x<W/2?-1:1);

    else if(row===2)changeDifficulty(x<W/2?-1:1);

    else{const q=RTIMES.indexOf(G.rtime);G.rtime=RTIMES[(q+(x<W/2?RTIMES.length-1:1))%RTIMES.length];}

    if(row===2||row===3)saveEditionSettings();

    return 0;

  }

  if(G.scene==='select'){

    if(aiEnabled()&&G.AIColor){const action=SF2AICOLORS.point(G.AIColor,x,y);if(action==='back'){delete G.AIColor;clearinput();}return action==='confirm'?G.selstep+1:0;}

    const who=G.selstep;

    if(ryuVariantStrip()&&y>=64&&y<124&&x>=96&&x<288)return {slot:who,keys:x<192?K_ATK:K_ATK<<3};

    if(VER.cur==='CE'){

      for(let q=0;q<ceSelectGrid().length;q++){const [a,b]=cecell(q);if(x>=a&&x<a+32&&y>=b&&y<b+32){if(aiEnabled()&&!aiAllowedFids().includes(ceSelectGrid()[q]))return 0;G.cep[who]=q;G.sel[who]=ceSelectGrid()[q];if(aiEnabled())AICFG.selectedProfiles[who]=q>=12?ffGuestIds()[q-12]:null;if(aiEnabled()&&(CEGRID[q]===0&&evilRyuSelectable()||CEGRID[q]===4&&evilKenSelectable()))return 0;return who+1;}}

    }else for(let fid=0;fid<(G.mode2p?12:8);fid++){const [a,b]=cell(fid);if(x>=a&&x<a+32&&y>=b&&y<b+40){G.sel[who]=fid;return who+1;}}

  }

  if(G.scene==='win'||G.scene==='vs'||G.scene==='cont')return 1;

  return 0;

}

function localCommands(pd,k1,k2){

  const wasPaused=CONTROL.paused;

  const commands=Array.isArray(window.SF2Input?.commands)?SF2Input.commands.splice(0,64):[];

  const esc=held('Escape')?1:0;if(esc&&!CONTROL.keyPrev)commands.push('back');CONTROL.keyPrev=esc;

  for(let i=0;i<2;i++){

    const bits=pd[i].menu||0,edge=bits&~CONTROL.padPrev[i],variantKick=ryuVariantStrip()&&i===G.selstep,allowKick=!(aiEnabled()&&G.AIColor)&&(variantKick||!CONTROL.paused&&(G.scene!=='title'&&(G.scene!=='select'||G.arc)));CONTROL.padPrev[i]=bits;

    if(edge&8)commands.push(G.scene==='fight'?'pause':'confirm');

    else if(edge&4)commands.push('back');

    if(CONTROL.paused&&(edge&1))commands.push('confirm');

    else if(!allowKick&&(edge&2))commands.push('back');

    if(!allowKick){pd[i].k&=~256;if(i===0)k1=(k1&~256)|(rk(P1K)&256)|(externalKey(0)&256);else k2=(k2&~256)|(rk(P2K)&256)|(externalKey(1)&256);}

  }

  let confirm=0;

  for(const command of commands){

    const type=typeof command==='string'?command:command?.type;

    if(type==='pause'){if(CONTROL.paused)resumeGame();else pauseGame();}

    else if(type==='back')nativeBack();

    else if(type==='confirm'){if(CONTROL.paused)pauseConfirm();else if(G.scene!=='fight')confirm=1;}

    else if(type==='point')confirm=pointCommand(command.x,command.y)||confirm;

  }

  if(wasPaused&&!CONTROL.paused)return {stop:true,k1:0,k2:0};

  const keys=k1|k2,nw=keys&~CONTROL.inputPrev;CONTROL.inputPrev=keys;

  if(CONTROL.paused){

    if(nw&K_U)CONTROL.item=(CONTROL.item+3)%4;if(nw&K_D)CONTROL.item=(CONTROL.item+1)%4;

    if(nw&K_ATK)pauseConfirm();return {stop:true,k1:0,k2:0};

  }

  if(confirm){selprev=[0,0];if(typeof confirm==='object'){if(confirm.slot===1)k2|=confirm.keys;else k1|=confirm.keys;}else if(confirm===2)k2|=K_ATK;else if(G.scene==='select'&&G.mode2p&&G.selstep===1)k2|=K_ATK;else k1|=K_ATK;}

  return {stop:false,k1,k2};

}

function pauseRender(){

  cx.fillStyle='rgba(0,0,0,.75)';cx.fillRect(64,52,256,128);cx.strokeStyle='#ffe000';cx.strokeRect(64.5,52.5,255,127);

  tx('PAUSED',W/2,75,12,'#ffe000','#000');

  ['RESUME','CHARACTER SELECT','TITLE','RESTART MATCH'].forEach((label,i)=>tx((CONTROL.item===i?'> ':'  ')+label,W/2,98+20*i,8,CONTROL.item===i?'#ffe000':'#fff','#000'));

}



// ---- one 60Hz step ----

function step(net){

  const result=VER.edition==='ce'&&G.scene==='fight'&&G.gph===2&&G.CERound?.ui&&!G.fade&&!CONTROL.paused;

  const keys=result?(net?net[0]|net[1]:rk(P1K)|rk(P2K)|pads().reduce((k,p)=>k|p.k,0)|externalKey(0)|externalKey(1)):0;

  const count=result&&(keys&K_ATK)?3:1;

  for(let i=0;i<count;i++){stepOnce(net);aiDeathStep();if(count>1&&(G.scene!=='fight'||G.gph!==2||G.fade))break;}

}

function stepOnce(net){G.CEWorldAdmitted=false;step0(net);if(VER.edition==='ce'&&G.scene==='fight'&&G.CEWorldAdmitted)SF2CEDIZZY.objects(G,P,ceDizzyHooks());const worldAdmitted=G.CEWorldAdmitted;delete G.CEWorldAdmitted;if(VER.edition==='ai'&&G.scene==='fight'&&worldAdmitted)SF2CESPECIAL.aiObjects(G,P,ceDizzyHooks());if(VER.edition==='ai'&&G.scene==='fight'&&(!G.CESpecialSlow?.gate||worldAdmitted))SF2CEDHALSIM.effects(G,ceDizzyHooks());if(VER.cur==='CE'&&G.scene==='fight'){window.SF2CESTAGESCROLL?.advance(G.stage,ceStageClock());window.SF2CESTAGEANIMATIONS?.advanceNative(G.stage,aiSceneryProjection().camera,ceStageClock(),{main:SF2CECAMERA.state.main,far:SF2CECAMERA.state.far>>16});}if(VER.cur==='CE'&&G.scene==='fight'&&G.stage===5)window.SF2CESTAGECYCLISTS?.advance(ceStageClock(),aiSceneryProjection().camera);if(aiEnabled()){for(const p of P)if(p.AICombo?.active&&![S_HIT,S_DOWN,S_GETUP,S_KO].includes(p.opp.ST)&&G.hfz===0)aiBreakCombo(p);}if(!net)tapped.clear();}

function step0(net){

  const pd=net?[{k:net[0],g:0},{k:net[1],g:0}]:pads();

  if(!net&&CONTROL.resumeGate){const blocked=pd.some(p=>p.menu);for(const p of pd)p.k=0;if(!blocked)CONTROL.resumeGate=false;}

  const touchSelectP2=!net&&G.scene==='select'&&G.mode2p&&G.selstep===1;

  let k1=net?net[0]:rk(P1K)|pd[0].k|(touchSelectP2?0:externalKey(0))|(held('Enter')?K_ATK:0),k2=net?net[1]:rk(P2K)|pd[1].k|externalKey(1)|(touchSelectP2?externalKey(0):0);

  if(!net){if(G.fade&&!G.fade.entered){CONTROL.padPrev=pd.map(p=>p.menu||0);CONTROL.keyPrev=held('Escape')?1:0;if(Array.isArray(window.SF2Input?.commands))SF2Input.commands.length=0;k1=k2=0;}else{const menu=localCommands(pd,k1,k2);if(menu.stop)return;k1=menu.k1;k2=menu.k2;}}

  G.stepacc+=5; G.fr=G.stepacc>=12; if(G.fr)G.stepacc-=12; G.tick++;if(aiEnabled()&&G.scene==='fight'&&G.gph===1)SF2AIWEATHER.sound(aiWeather(),G.AIMatchSeed,G.round,G.stage,AC,MG,muted);if(VER.edition==='ce')G.CEStageTick=(G.CEStageTick??0)+1;

  if(VER.cur==='CE'&&G.scene==='fight')window.SF2CECAMERA?.latch(P);

  if(VER.cur==='CE'&&G.ann&&window.SF2CEANNOUNCER)for(const code of SF2CEANNOUNCER.step(G.ann))sfxc(code);

  if(G.fade){const state=G.fade,event=SF2CEFADE.step(state);if(event.swap){if(state.roundNext){G.round++;resetround();}goNow(state.target,false);}if(event.enter){state.entered=true;sceneMusic(state.target);}if(event.done)G.fade=null;if(event.enter&&state.roundNext)return;if(!state.entered){if(state.target==='win'&&G.scene==='win'&&!event.swap)G.st++;return;}}

  // Start/Back are scene commands, while keyboard Space retains its reset behavior.

  const g=net?0:(held('Tab')?2:0)|(held('Space')?4:0),ng=g&~gprev;gprev=g;

  if(ng&2){if(G.scene==='fight'&&G.arc&&!G.mode2p){G.mode2p=1;G.arc=0;music(MUSC.stop);sfxc(VER.cur==='CE'&&0x20,SN_BLOCK,0.5);go('chal');return;}G.mode2p^=1;}

  if(VER.cur==='CE'&&window.SF2CEVEGACLAW&&(G.scene==='fight'||G.scene==='bonus'))SF2CEVEGACLAW.world(P,{rand});

  if(G.scene==='bonus'){if(!netActive&&held('Escape')){go('title');return;}bonusstep(k1);return;}

  if(G.scene!=='fight'){scenestep(k1,k2,ng);return;}if(VER.cur==='CE')G.CEWorldAdmitted=true;

  if(ng&4){if(aiEnabled()&&AICFG.prototype)SF2AI.resetRound();else resetmatch();}

  const ceTimedOut=VER.cur==='CE'&&ceRoundClock();

  for(const p of P){if(p.HPD>p.HP){if(G.tick%2)p.HPD--;}else p.HPD=p.HP;}

  let ceRoundCamera=false;
  if(VER.cur==='CE'&&!G.CERound&&!SF2CESPECIAL.physical(G,P)){G.CEStageTick--;G.CEWorldAdmitted=false;G.fr=false;return;}
  if(VER.edition==='ce'&&G.CERound){const s=G.CERound,queued=s.pendingGate||s.gate>0;
    // Native task4 camera executes on the video frame after task0 actors were
    // admitted. KO slowdown gates actor admission, not an already queued camera.
    if(queued){ceRoundCamera=true;if(s.cameraPending!==false){if(window.SF2CETHROWS?.preCamera)P.forEach(p=>SF2CETHROWS.preCamera(p,cethooks()));camera();}s.cameraPending=false;}
    if(s.pendingGate)for(const p of P)if(p.CEKO?.phase===0&&p.CEKO.stop===0)SF2CEROUND.koStep(p,ceRoundHooks());
    const stopped=G.hfz>0||P.some(p=>!hpAlive(p)&&(p.CEKO?(p.CEKO.stop>0):p.CEPF&&(p.CEPF.init||p.CEPF.ticks>0)));
    if(!SF2CEROUND.physical(s,stopped)){G.slow=s.gate;G.CEStageTick--;G.CEWorldAdmitted=false;G.fr=false;return;}G.slow=s.gate;if(queued)s.cameraPending=true;
  }else if(G.slow>0){G.slow--;if(G.slow%3){G.fr=false;return;}}
  /* M13f: arcade input latency - the game acts on the joystick/buttons read one frame earlier (IDEL frames, default 1; ?delay=0 for none) */

  const ka=net?net[0]:rk(P1K)|pd[0].k|externalKey(0),kb=net?net[1]:rk(P2K)|pd[1].k|externalKey(1); IQ.push([ka,kb]); while(IQ.length>IDEL+1)IQ.shift(); const dq=IQ[0];

  P[0].KEYS=dq[0];

  if(G.mode2p&&!G.netBot)P[1].KEYS=dq[1];else if(G.gph===1){if(isEvilKen(P[1])&&G.hfz>0){P[1].KEYS=P[1].FORCE=0;}else{const k=isEvilKen(P[1])?SF2AIEvilKen.cpu(P[1],false):null;if(k===null)ai(P[1]);else{P[1].KEYS=k;P[1].FORCE=0;}}}

  if(aiEnabled()&&AICFG.prototype&&AICFG.training&&AICFG.dummy!=='cpu'){P[1].FORCE=0;P[1].KEYS=AICFG.dummy==='block'&&(P[0].ST===S_ATK||P[0].ST===S_SPEC||P[0].FBON)?(P[0].X<P[1].X?K_R:K_L):0;}

  if(aiEnabled()&&G.gph===1){for(const p of P){SF2AIRULES.sample(p,p.KEYS,G.tick,G.hfz>0);SF2AICHAIN.sample(p,p.KEYS,G.tick);SF2AICHAIN.sampleBreaker(p,p.KEYS,G.tick,SF2AIRULES.mapping(p));}P.forEach(aiInput);P.forEach(aiTryComboBreaker);P.forEach(aiTrySpecialChain);}
  if(G.gph!==1){if(G.gph!==0)P[0].KEYS=P[1].KEYS=0;P[1].FORCE=0;}
  if(aiEnabled()&&G.gph!==1)for(const p of P)SF2AIRULES.block(p,p.KEYS);
  if(G.hfz>0){if(VER.cur==='CE')SF2CEDHALSIM.objects(G,P,{hit:ceYogaHit,fire:ceYogaCollision,visible:ceObjectVisible});G.hfz--;for(const q of P){if(VER.cur==='CE')window.SF2CEVEGA?.inputFrozen(q,q.KEYS);const n=q.KEYS&~(q.HZK||0);q.HZK=q.KEYS;if(n&0x70)q.MQP.push(G.tick);if(n&0x380)q.MQK.push(G.tick);} /* mash taps made during hitstop still count (ROM keeps counting presses) */P[0].PREV=P[0].KEYS&P[0].PREV;P[1].PREV=P[1].KEYS&P[1].PREV;G.fr=false;camera();if(VER.edition==='ce')window.SF2CEHONDAHOLD?.physical(P);return;}
  if(VER.cur==='CE'&&!ceRoundCamera){if(window.SF2CETHROWS?.preCamera)P.forEach(p=>SF2CETHROWS.preCamera(p,cethooks()));camera();}

  if(VER.cur==='CE')window.SF2CEPROJECTILES?.stepEffects({tick:G.tick});

  // Pool4 source3172a precedes fighter special tasks in observed original passes.
  if(VER.cur==='CE')SF2CEDHALSIM.objects(G,P,{hit:ceYogaHit,fire:ceYogaCollision,visible:ceObjectVisible});
  update(P[0]);update(P[1]);if(VER.edition==='ce'&&G.CERound)for(const p of P)if(hpAlive(p)&&p.ST===S_FREE&&!p.CEWin&&!p.CEKO)SF2CEROUND.admit(p,G.CERound.draw||p.i!==G.CERound.winner,false,ceRoundHooks());if(VER.cur==='CE'&&window.SF2CETHROWS&&SF2CETHROWS.sync)P.forEach(p=>SF2CETHROWS.sync(p,cethooks()));if(VER.edition==='ce'&&!G.CEHHContactDelay)cePriorFacing();;fbmove(P[0]);fbmove(P[1]);fbclash();if(VER.edition==='ce'&&!G.CEHHContactDelay)window.SF2CEHONDAHOLD?.facing(P);push();
  {const h0=hitprobe(P[0]),h1=hitprobe(P[1]);hitcheck(P[0],h0);hitcheck(P[1],h1);}fbhit(P[0]);fbhit(P[1]);const fbOrder=VER.cur==='CE'&&window.SF2CEPROJECTILES?P.slice().sort((a,b)=>(b.FBSLOT||0)-(a.FBSLOT||0)):P;fbOrder.forEach(fbafter);if(VER.cur!=='CE')camera();clampx(P[0]);clampx(P[1]);if(!ceTimedOut)phase();if(VER.edition==='ce')window.SF2CEHONDAHOLD?.physical(P);}
/* ---- bonus stages (CE arcade ladder: car after fight 3, barrels after 6, drums after 9).

   CE car composition, counters, contact stop and suspension use SF2CECAR's native data.

   The legacy car path remains available for WW. Barrels/drums retain recovered behavior. ---- */

const BG0=200,BIM={};function bim(u){return BIM[u]||(BIM[u]=img(u));}

function preloadBonusArt(){const images=new Set();for(const data of [window.SF2BONUS,window.SF2CECARDATA,window.SF2CECLASHDATA,window.SF2CEBARRELDATA,window.SF2CEBARRELPLAYERDATA])if(data)JSON.stringify(data).replace(/data:image[^"]+/g,u=>{images.add(bim(u));return u;});if(window.SF2)SF2.bonusReady=Promise.all([...images].map(i=>i.decode()));}

function bonusinit(kind){if(VER.cur==='CE')window.SF2CEPROJECTILES?.reset(P);const p=P[0],d=P[1],B=G.bon={kind,tk:0,time:kind===0?40:kind===1?20:30,end:0,cool:0,pts:0,hits:0,ob:[],fx:[]};

  setfighter(p,G.sel[0]);setfighter(d,G.sel[0]);resetp(p,(kind===0?60:kind===1?192:104)<<8,1);resetp(d,300<<8,0);d.ST=S_KO;d.HP=0;G.cam=0;G.gph=1;G.slow=0;IQ.length=0;

  if(kind===1&&VER.cur==='CE'&&window.SF2CEBARRELS&&window.SF2CEBARRELPLAYER){SF2CEBARRELS.init(B,p,rand,bim);SF2CEBARRELPLAYER.init(B,p);d.X=280<<8;}

  if(kind===0){B.dmg=0;B.fr=0;B.rr=0;if(VER.cur==='CE'&&window.SF2CECAR)SF2CECAR.init(B,p,rand,bim);}

  /* ROM object table (0xffa036.., stride 0xc0; bonus/cap3): 3 drums, two on the floor at centres 160/224, one on top at 192 (+72) */

  if(kind===2){for(const c of [160,224])B.ob.push({x:c-31,y:0,hp:3,top:0});B.ob.push({x:192-31,y:72,hp:3,top:1,vy:0});}

  {const S=window.SF2BONUS,K=S&&[S.car,S.barrel,S.drum][kind];if(K)JSON.stringify(K).replace(/data:image[^"]+/g,u=>{bim(u);return u;});}

  go('bonus');music(0x0d);}

function bonusend(result){const B=G.bon;if(B.end)return;B.end=1;if(ceBarrelMode()){B.nativeResult=result||null;B.perfect=B.barrels.destroyed===20;B.bonus=0;P[0].KEYS=0;return;}const all=B.kind===0?B.dmg>=9:B.kind===2?!B.ob.length:B.hits>=B.need;

  B.perfect=all;B.bonus=all?(B.kind===0?10000:B.kind===2?20000:B.hits*1000):0;if(all)sfxc(0x55);P[0].KEYS=0;}

function bhit(bx,r){return bx&&Math.abs(bx[0]-r[0])<bx[2]+r[2]&&Math.abs(bx[1]-r[1])<bx[3]+r[3];}

function bonusActorStep(p,frozen){

  if(aiEnabled()&&G.bon.end)SF2AIRULES.block(p,0);
  p.CARY0=p.Y;

  if(!frozen){update(p);return;}

  // Native input/charge recognition continues while car contact stops motion.

  const keys=p.KEYS,nw=keys&~p.PREV,rel=p.PREV&~keys;p.PREV=keys;p.HZK=keys;motion(p,keys,nw,rel);

}

function bonusstep(k){const B=G.bon,p=P[0],d=P[1];G.st++;if(G.slow>0)G.slow--;

  if(B.end&&ceBarrelMode()){

    p.KEYS=0;bonusActorStep(p,false);clampx(p);SF2CEBARRELS.step(B,p,ceBarrelHooks(B,p));B.end++;

    if(B.end>=64){

      if(!B.nativeVictory&&B.nativeResult?.winner===0&&!B.barrels.player.phase&&!B.barrels.player.bodyStop){B.nativeVictory=true;p.ST=S_WIN;setanim(p,AN_WIN,0);}

      if(!B.paid&&SF2CEBARRELS.payout(B,{tick:G.tick,scoreCommand:ceBonusScore,sound:sfxc}).done){B.paid=1;B.pt=B.end;}

    }

    if(B.paid&&B.end-B.pt>150)arcadeVs();return;

  }

  if(B.end){if(carMode(p)){for(const f of B.fx)f.t++;B.fx=B.fx.filter(f=>f.t<30);}p.KEYS=0;bonusActorStep(p,carMode(p)?SF2CECAR.before(B,p,rand,G.tick):false);carResolve(p);if(++B.end>=60&&B.end%4===0&&B.time>0){B.time--;p.SCORE=(p.SCORE||0)+100;sfxc(0x24);}

    if(B.end>=60&&B.time<=0&&!B.paid){B.paid=1;p.SCORE=(p.SCORE||0)+B.bonus;B.end=Math.max(B.end,60);B.pt=B.end;}

    if(B.paid&&B.end-B.pt>150)arcadeVs();return;}

  p.KEYS=G.st<60?0:k;

  if(aiEnabled()){if(G.st<60)SF2AIRULES.block(p,p.KEYS);else{SF2AIRULES.sample(p,p.KEYS,G.tick,G.hfz>0||G.bon.car?.heroStop>0);SF2AICHAIN.sample(p,p.KEYS,G.tick);SF2AICHAIN.sampleBreaker(p,p.KEYS,G.tick,SF2AIRULES.mapping(p));aiTrySpecialChain(p);if(p.AICombo.active&&G.tick-(p.AIChain.bonusLast??G.tick)>80)aiBreakCombo(p);}aiInput(p);}
  if(VER.cur==='CE'&&carMode(p)){if(G.st>=100&&++B.tk>=40){B.tk=0;if(B.time>0)B.time--;else bonusend();}}

  else if(!ceBarrelMode()&&G.st>=60&&++B.tk>=52){B.tk=0;if(--B.time<=0)bonusend();}

  const tgt=ceBarrelMode()?280:B.kind===0?192:B.kind===2?(B.ob.length?B.ob.reduce((a,o)=>a+o.x+31,0)/B.ob.length:300):(B.ob.length?B.ob[0].x:300);d.X=tgt<<8;

  const frozen=carMode(p)?SF2CECAR.before(B,p,rand,G.tick):false;bonusActorStep(p,frozen);carResolve(p);fbmove(p);clampx(p);if(B.cool>0)B.cool--;

  const atk=(p.ST===S_ATK||p.ST===S_SPEC||(p.ST===S_AIR&&p.JA))&&!p.hitdone?boxw(p,4):null,

    fb=p.FBON?(VER.edition==='ce'&&carMode(p)?fbbox(p):[(p.FBX>>8),(p.FBY>>8)+40,16,16]):null,score=n=>{p.SCORE=(p.SCORE||0)+n;B.pts+=n;};

  if(B.kind===0){ /* car: solid on the ground between x 96..288, roof at 54 */

    if(!carMode(p)&&p.Y<(54<<8)&&p.X>(96<<8)&&p.X<(288<<8)){if(p.ST!==S_AIR||p.VY<=0&&p.Y<(30<<8))p.X=p.X<(192<<8)?96<<8:288<<8;}

    if(carMode(p))SF2CECAR.check(B,p,atk,fb,{strength:window.SF2CEVEGACLAW?.record(p)?.[8]??ent(p)[8],projectileStrength:(VER.edition==='ce'?window.SF2CECOMBAT?.projectileRecord(p)?.[8]:null)??p.FBSTR??p.SPSTR,rand,score,sound:sfxc,finish:bonusend,contact:(normal,blocked)=>aiBonusContact(p,normal,blocked)});else{

    const zone=[[144,40,52,40],[240,40,52,40]];

    for(const s of [atk,fb])if(s)for(let z=0;z<2;z++)if(bhit(s,zone[z])){if(s===atk)p.hitdone=1;else p.FBON=0;

      if(B.cool>0){break;} B.cool=55; const lv=z?'rr':'fr';

      if(B[lv]<4||B.dmg>=8){B[lv]++;B.dmg=Math.min(9,B.dmg+1);aiBonusContact(p,s===atk);sfxc(0x33,SN_HIT[2],0.6);score(B.dmg>=9?2000:300);G.slow=6;B.fx.push({x:z?240:144,y:BG0-60,t:0});if(B.dmg>=9)bonusend();}

      else sfxc(0x72,SN_BLOCK,0.5);break;}}

  }

  else if(B.kind===1&&ceBarrelMode()){SF2CEBARRELS.step(B,p,ceBarrelHooks(B,p,atk,p.FBON?fbbox(p):null));}

  else if(B.kind===1){ /* legacy WW/AI barrel path */

    /* ROM path (emulator trace, bonus/bartrack.json): barrels ride the top conveyor (h 159) at 2px/f, from the right (x 368->208)

       or left (16->176) alternately, tip over the ledge for ~40f drifting toward x~110..150, drop to the floor, then roll 2px/f */

    B.need=B.need||10;if(G.st>=60&&(B.spawned||0)<B.need&&B.ob.length<3&&G.st>=(B.next||90)){const sd=(B.spawned||0)&1;B.spawned=(B.spawned||0)+1;B.next=G.st+90+((rand()>>>20)%60);

      B.ob.push({x:sd?16:368,y:159,vy:0,vx:sd?2:-2,ph:0,k:0,sd,b:0,f:0});}

    for(const o of B.ob){o.k++;

      if(o.ph===0){if(o.sd?o.x>=176:o.x<=208){o.ph=1;o.k=0;o.tx=o.sd?150:110;}}

      else if(o.ph===1){o.vx=(o.tx-o.x)/Math.max(1,40-o.k);o.y=159-Math.min(19,o.k);if(o.k>=40){o.ph=2;o.vx=0;o.vy=0;}}

      else if(o.ph===2){o.vy-=0.7;o.y+=o.vy;if(o.y<=0){o.y=0;o.ph=3;sfxc(0x32);o.vx=(rand()>>>31)?2:-2;}}

      o.x+=o.vx;o.f+=Math.abs(o.vx)>0?0.25:0.1;

      const r=[o.x,o.y+26,34,26];for(const s of [atk,fb])if(s&&!o.dead&&bhit(s,r)){if(s===atk)p.hitdone=1;else p.FBON=0;aiBonusContact(p,s===atk);o.dead=1;B.hits++;sfxc(B.hits&1?0x2c:0x2e,SN_HIT[1],0.6);score(500);

        B.fx.push({x:o.x,y:BG0-o.y-26,t:0,deb:1});}

      if(!o.dead&&o.y<40&&p.ST!==S_HIT&&p.ST!==S_AIR&&Math.abs((p.X>>8)-o.x)<30){o.dead=1;sfxc(0x2e,SN_HIT[0],0.6);} /* rolled into you: it smashes, no points */

      if(o.x<-60||o.x>W+60)o.dead=1;}

    B.ob=B.ob.filter(o=>!o.dead);if(B.spawned>=B.need&&!B.ob.length&&G.st>(B.next||0))bonusend();}

  else { /* drums: 3 on the floor, 2 stacked on top; 3 hits each, top drums drop when the support goes */

    /* top drum (ROM trace): when one support breaks it slides onto the other (centre +20 past it), when none is left it drops ~30px further out */

    for(const o of B.ob){if(o.top){const sp=B.ob.filter(q=>!q.top&&q.hp>0&&Math.abs(q.x-o.x)<50);

      if(sp.length===1){const t=sp[0].x+(sp[0].x>=o.x?20:-20);o.x+=Math.sign(t-o.x)*Math.min(2,Math.abs(t-o.x));}

      else if(!sp.length){if(o.dx===undefined)o.dx=o.x+28;o.x+=Math.sign(o.dx-o.x)*Math.min(1,Math.abs(o.dx-o.x));o.vy=(o.vy||0)-0.5;o.y=Math.max(0,o.y+o.vy);if(o.y===0){o.top=0;o.vy=0;}}}

      const r=[o.x+31,o.y+40,30,40];for(const s of [atk,fb])if(s&&o.hp>0&&bhit(s,r)&&!(s===atk&&p.hitdone)){if(s===atk)p.hitdone=1;else p.FBON=0;aiBonusContact(p,s===atk);o.hp--;

        sfxc(0x2a,SN_HIT[1],0.6);sfxc(0x3b);score(o.hp?200:1000);if(!o.hp)B.fx.push({x:o.x+31,y:BG0-o.y-30,t:0,deb:2});}}

    B.ob=B.ob.filter(o=>o.hp>0);for(const o of B.ob)if(o.y<20&&p.Y<(70<<8)){const c=o.x+31,dx=(p.X>>8)-c;const radius=aiEnabled()?50:85;if(Math.abs(dx)<radius)p.X=(c+(dx<0?-radius:radius))<<8;} /* ROM: Ryu held 85px from a floor drum's centre (stopped at x 75 vs drum 160) */

    if(!B.ob.length)bonusend();}

  for(const f of B.fx)f.t++;B.fx=B.fx.filter(f=>f.t<30);}

function bonusrender(){const B=G.bon,S=window.SF2BONUS,p=P[0];cx.fillStyle='#000';cx.fillRect(0,0,W,H);if(!S)return;

  const nativeCar=carMode(p);if(nativeCar){cx.save();cx.translate(0,SF2CECAR.sceneOffset(B));}

  const nativeBarrels=ceBarrelMode(),K=[S.car,S.barrel,S.drum][B.kind],im=bim(K.bg);if(nativeBarrels)SF2CEBARRELS.drawBackground(cx,B,bim);else if(!(nativeCar&&SF2CECAR.drawBackground(cx,B,bim))&&im.width)fimg(im,0,0);

  if(aiEnabled()&&!nativeBarrels){const art=fighterArt(p);SF2AISHADOW.draw(cx,art.image,art.rect,p,p.X>>8,BG0,G.round,p.fid===11&&p.CECLAW?.equipped!==false?{bounds:fighterBounds(p),paint:g=>SF2CEVEGACLAW.draw(g,p,0,0,false)}:null);}else if(!nativeBarrels&&VER.cur==='CE'&&window.SF2CESHADOW){const f=SF2CESHADOW.frame(p,12+B.kind);if(f)fimgKind('object',f.image,(p.X>>8)+f.x,BG0+f.y);}

  const shake=G.slow>0?((G.tick&2)?2:-2):0;

  if(B.kind===0){if(carMode(p))SF2CECAR.draw(cx,K,B,bim,shake);else{const s=K.st[B.dmg],ci=bim(s.img);if(ci.width)fimg(ci,s.x+shake,s.y);}}

  if(B.kind===2)for(const o of B.ob){const di=bim(K.drum);if(di.width)fimg(di,o.x+(o.hp<3?shake:0),BG0+1-79-o.y);

    if(o.hp===1){const fi=bim(K.fire);if(fi.width&&(G.tick>>3)&1)fimg(fi,o.x+16,BG0-79-o.y-40);}}

  if(nativeBarrels){SF2CEBARRELS.draw(cx,B,bim,'back');if(p.FBON)drawfb(p,BG0,0);SF2CEBARRELS.draw(cx,B,bim,'middle');if(window.SF2CESHADOW){const f=SF2CESHADOW.frame(p,13);if(f)fimgKind('object',f.image,(p.X>>8)+f.x,BG0+f.y);}}

  const supplement=nativeBarrels&&!isFFGuest(p)?SF2CEBARRELPLAYER.draw(cx,B,p,p.X>>8,BG0,bim,im=>aiEnabled()?SF2AIRULES.sprite(p,im,VER.ce.f[p.fid].pal,true):im):null;

  const handsArt=VER.cur==='CE'?window.SF2CEHONDAHANDS?.art(p,false):null;if(isFFGuest(p)){const art=fighterArtBase(p);spr(art.image,art.rect,p.X>>8,BG0-(p.Y>>8),p.FACE);}else if(!supplement?.body)spr(aiSprite(p,handsArt?.image||(isEvilKen(p)?p.AIAtlas:aiEnabled()&&p.AIAtlas?p.AIAtlas:FI[p.fid]),false),handsArt?.rect||p.F.frames[ent(p)[0]],(p.X>>8),BG0-(p.Y>>8),p.FACE);
  if(VER.cur==='CE'&&window.SF2CEVEGACLAW){if(!supplement?.claw)SF2CEVEGACLAW.draw(CE_OBJECT_CONTEXT,p,p.X>>8,BG0-(p.Y>>8),false);SF2CEVEGACLAW.drawDrops(cx,[p],0,BG0);}

  if(!nativeBarrels&&p.FBON)drawfb(p,BG0,0);

  if(nativeBarrels){SF2CEBARRELS.draw(cx,B,bim,'front');SF2CEBARRELS.drawEffects(cx,B,bim);}

  else if(B.kind===1)for(const o of B.ob){const r=K.roll[(o.f|0)%K.roll.length],ri=bim(r);if(ri.width)fimg(ri,o.x-37,BG0-o.y-53);}

  if(nativeCar)SF2CECAR.drawEffects(cx,B,bim);

  for(const f of nativeCar?[]:B.fx){if(f.deb){const di=bim(B.kind===2?K.crush:K.roll[0]);if(di.width){cx.globalAlpha=1-f.t/30;fimg(di,f.x-di.width/2,f.y-f.t*2);cx.globalAlpha=1;}}

    else fx(0,f.x,f.y);}

  if(nativeCar)cx.restore();

  {const R='#ee6644',Bl='#0044aa';txw('1P',6,9,R,Bl,'left');txw(p.SCORE||0,113,9,R,Bl);txw(G.hisc=Math.max(G.hisc||RK[0].s,p.SCORE||0),247,9,R,Bl);}

  if(aiEnabled()&&p.AICombo?.active)tx(p.AICombo.hits+' HIT',32,53,8,'#ffe000','#000','left');
  const t=Math.max(0,B.time);if(nativeBarrels)SF2CEBARRELS.drawHUD(cx,B,bim,{tick:G.tick,resultReady:B.end>=64,skipName:isFFGuest(p)});else{fx(8+((t/10)|0),176,34);fx(8+t%10,192,34);}

  if(nativeBarrels&&isFFGuest(p))tx(aiName(p).toUpperCase(),32,40,8,'#ffaa66','#0044aa','left');
  if(G.st<60)tx('BONUS STAGE',W/2,90,16,'#ffe000','#a01000');else if(G.st<100)tx('START!',W/2,90,16,'#ffffff','#0044aa');

  if(B.end&&!nativeBarrels){tx(B.perfect?'PERFECT':'TIME OVER',W/2,80,16,'#ffe000','#a01000');tx('BONUS '+B.pts,W/2,104,8,'#ffffff','#0044aa');}}

// ---- render ----

const cv=document.getElementById('c'),nativeSurface=window.SF2Graphics?SF2Graphics.attach(cv,W,H):cv;let cx=nativeSurface.getContext('2d');cx.imageSmoothingEnabled=false;

const img=s=>{const i=new Image();i.src=s;return i;};

const CEFXI=CEFX?CEFX.frames.map(f=>f?img(f.img):null):[];
const AI_REEL_IMAGES=SF2AIREELDATA.frames.map(f=>img(f.img)),AI_IMPACT_IMAGES=SF2AIREELDATA.impactFrames.map(f=>img(f.img));

const CEWIN=window.SF2CEWIN,CWIN=CEWIN?Object.fromEntries(Object.entries(CEWIN.fighters).map(([f,v])=>[f,{win:img(v.win),lose:img(v.lose),quote:img(v.quote)}])):null;

function asseturl(file){return window.SF2BUILD?file+'?v='+SF2BUILD.commit:file;}

let STI=D.stages.map(ls=>ls.map(l=>img(l.img))),FXI=img(D.fx_img);let FI=D.fighters.map(f=>img(f.img)),FIA=FI;

/* CE (Champion Edition) data lives in assets_ce.js, loaded on demand. Same fighter order as WW; the atlases are drawn in P1

   colours and the mirror-match alt atlas is made here by swapping each P1 pen colour for the P2 pen colour. */

const VER={edition:'ce',cur:'WW',ce:null,ww:{f:D.fighters,fi:FI,fia:FI,st:D.stages,sti:STI,z80:null},loading:0};

function altatlas(f,im){const c=document.createElement('canvas');const go=()=>{c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);

  const d=g.getImageData(0,0,c.width,c.height),a=d.data,m=new Map();f.pal.forEach((p,i)=>m.set((p[0]<<16)|(p[1]<<8)|p[2],f.pal2[i]));

  for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const q=m.get((a[i]<<16)|(a[i+1]<<8)|a[i+2]);if(q){a[i]=q[0];a[i+1]=q[1];a[i+2]=q[2];}}g.putImageData(d,0,0);c.ready=1;};

  if(im.complete&&im.width)go();else im.addEventListener('load',go);return c;}

function setver(v,keepEdition=false){const leavingAI=!keepEdition&&aiEnabled();if(!keepEdition){captureEditionSettings();restoreEditionSettings(v==='WW'?'ww':'ce');VER.edition=v==='WW'?'ww':'ce';AICFG.prototype=AICFG.configured=false;AICFG.selectedProfiles=[null,null];for(const p of P)aiClearProfile(p);}if(v==='CE'&&!VER.ce){loadce();return;}VER.cur=v;const S=v==='CE'?VER.ce:VER.ww;D.fighters=S.f;D.stages=S.st;STI=S.sti;musver();THRR=v==='CE'?THRR_CE:THRR_WW;NTHR=v==='CE'?NTHR_CE:NTHR_WW;RKD=rkd(v);try{if(!localStorage.getItem(rankStorageKey()))RK=RKD.map(o=>({...o}));}catch(e){}FTX=v==='CE'?FTX_CE:FTX_WW;for(const q of P)if(q.F)q.ft=FTX[q.fid];HSTUN=v==='CE'?HSTUN_CE:HSTUN_WW;BSTUN=v==='CE'?BSTUN_CE:BSTUN_WW;TDMG=v==='CE'?TDMG_CE:TDMG_WW;FI=S.fi;FIA=S.fia;

  S.f.forEach((f,i)=>NAMES[i]=f.name);for(const p of P)setfighter(p,p.fid);if(leavingAI){try{const saved=JSON.parse(localStorage.getItem('sf2rank'));RK=validrank(saved)?saved:RKD.map(o=>({...o}));}catch{RK=RKD.map(o=>({...o}));}G.hisc=RK[0].s;for(const p of P)p.SCORE=0;}}

/* CE normals timing from the CE ROM (tools/emu_ce/fdtrace.py -> tools/fd_compare.py): entry durations per fighter/anim so every

   stand/crouch normal hits its ROM entry boundaries and returns to neutral on the ROM frame (last entry hands back after 1f) */

const NTIME_CE={"0":{"8":[3,4,4,0],"9":[2,2,4,3,3,0],"10":[4,2,6,10,12,0],"11":[4,3,8,4,0],"12":[6,6,12,6,0],"13":[3,4,8,10,6,0],"14":[3,4,4,0],"15":[2,2,4,3,3,0],"16":[4,3,8,10,12,0],"17":[3,4,4,0],"18":[2,2,6,4,4,0],"19":[4,6,6,8,10,0]},"1":{"8":[3,2,4,2,0],"9":[3,2,2,4,2,2,0],"10":[4,3,3,4,7,5,3,2,0],"11":[4,3,3,4,3,3,0],"12":[4,3,3,4,5,6,0],"13":[4,3,3,6,8,10,0],"14":[3,2,8,2,0],"15":[3,2,2,8,6,4,0],"16":[3,3,4,6,8,6,4,3,0],"17":[4,3,3,3,3,3,0],"18":[4,3,3,6,5,4,0],"19":[4,4,6,4,8,6,0]},"2":{"8":[3,2,3,4,3,3,0],"9":[4,2,2,3,3,0],"10":[3,3,4,6,10,7,0],"11":[3,2,2,4,3,3,0],"12":[3,2,2,4,3,3,0],"13":[4,3,6,5,5,5,5,5,0],"14":[3,2,4,3,3,3,0],"15":[4,3,3,7,3,3,3,0],"16":[4,4,6,10,7,0],"17":[3,2,4,3,3,0],"18":[3,2,4,3,3,0],"19":[2,2,3,4,10,12,0]},"3":{"8":[4,4,2,2,0],"9":[3,2,4,3,3,2,0],"10":[3,3,4,5,10,7,0],"11":[3,2,4,3,2,0],"12":[3,3,3,4,5,4,3,2,2,1,0],"13":[3,3,5,6,8,9,0],"14":[4,4,4,0],"15":[4,4,4,3,0],"16":[3,3,4,12,9,0],"17":[4,3,4,3,2,0],"18":[4,4,5,4,2,0],"19":[3,1,4,5,4,6,8,1,5,4,5,4,5,0]},"4":{"8":[3,4,4,0],"9":[2,2,4,3,3,0],"10":[4,2,6,10,12,0],"11":[4,3,8,4,0],"12":[6,6,12,6,0],"13":[3,4,8,10,6,0],"14":[3,4,4,0],"15":[2,2,4,3,3,0],"16":[4,3,8,10,12,0],"17":[3,4,4,0],"18":[2,2,6,4,4,0],"19":[4,6,6,8,10,0]},"5":{"8":[3,2,4,3,0],"9":[3,2,4,3,0],"10":[3,3,6,10,7,0],"11":[4,3,5,4,0],"12":[4,3,5,4,3,0],"13":[4,3,4,8,7,6,0],"14":[3,2,4,4,0],"15":[3,2,4,4,0],"16":[4,3,6,8,10,0],"17":[4,3,4,4,0],"18":[5,5,3,0],"19":[4,3,6,8,10,0]},"6":{"8":[3,4,4,0],"9":[3,2,3,4,0],"10":[4,3,6,10,8,6,4,0],"11":[3,2,4,0],"12":[4,3,4,4,4,0],"13":[5,8,10,0],"14":[4,4,0],"15":[4,3,8,4,4,0],"16":[4,3,8,10,12,0],"17":[4,4,6,0],"18":[4,6,8,0],"19":[4,10,12,0]},"7":{"8":[3,3,6,4,0],"9":[4,4,4,6,4,4,0],"10":[4,4,4,20,10,8,0],"11":[3,3,8,4,4,0],"12":[3,3,8,4,4,0],"13":[2,2,3,4,6,10,8,0],"14":[3,3,3,6,4,4,0],"15":[3,3,3,6,4,4,0],"16":[4,4,4,6,10,8,0],"17":[2,1,14,4,0],"18":[5,4,16,4,0],"19":[5,4,18,20,0]},"8":{"8":[2,1,1,1,1,1,1,1,1,1,1,0],"9":[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],"10":[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],"11":[3,2,4,4,0],"12":[3,2,4,7,0],"13":[3,3,6,20,0],"14":[3,1,1,1,1,1,1,1,1,1,0],"15":[3,1,1,1,1,1,1,1,1,1,1,1,1,0],"16":[3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],"17":[6,4,4,0],"18":[6,8,4,0],"19":[8,43,16,0]},"9":{"8":[4,4,4,0],"9":[3,2,4,3,3,0],"10":[5,2,6,10,12,0],"11":[3,1,2,2,2,2,2,0],"12":[3,2,2,2,2,3,4,0],"13":[5,2,3,3,5,6,9,0],"14":[4,4,4,0],"15":[5,4,6,0],"16":[7,6,20,0],"17":[2,2,4,2,2,0],"18":[3,2,4,3,3,0],"19":[5,2,6,10,10,0]},"10":{"8":[4,4,4,0],"9":[3,2,4,3,3,0],"10":[5,2,6,9,5,0],"11":[4,4,4,0],"12":[5,4,6,0],"13":[5,2,6,9,5,0],"14":[2,2,4,2,1,0],"15":[3,2,4,3,3,0],"16":[5,2,6,9,5,0],"17":[2,2,4,2,1,0],"18":[3,2,4,3,3,0],"19":[3,4,6,9,5,0]},"11":{"8":[2,2,4,4,0],"9":[3,2,4,6,0],"10":[5,2,6,18,0],"11":[2,2,4,4,0],"12":[3,2,4,6,0],"13":[5,2,6,18,0],"14":[2,1,1,4,1,1,1,0],"15":[2,1,2,4,2,2,2,0],"16":[2,2,3,6,7,6,5,0],"17":[2,1,1,1,4,4,0],"18":[2,1,1,1,4,6,0],"19":[3,2,2,21,13,0]}};

function cetimes(F){for(const f of F)for(const a of f.anims)if(a.name==='win'||a.name==='win2')a.nativeDurations??=a.ents.map(e=>e[1]);for(const f of [0,1,4,11])for(const n of (f===11?[8,14]:[...Array.from({length:12},(_,i)=>i+8),...(f===1?[47,48,49,50,51,52]:[])])){const a=F[f].anims[n];a.nativeDurations??=a.ents.map(e=>e[1]);}dmgfix();{const v=F[11]&&F[11].anims,r=v&&v.find(a=>a.name==='slrec'),h=v&&v[AN_CLP+5];if(r&&h&&!r._fx){r._fx=1;r.ents=r.ents.slice(0,4).map(e=>{e=e.slice();e[1]=3;return e;});r.mode=1;const l=h.ents[h.ents.length-1];if(l[1]===0)l[1]=1;}} /* Vega slide end: 1f last pose + 4x3f recovery (ROM) */F[7].anims.forEach((a,i)=>{const v={cnLP:8,cnMP:11,cnMK:11}[a.name];if(v&&DMG_CE[7])DMG_CE[7][i]=v;});F[6].anims.forEach((a,i)=>{const v={cnMP:28,cnHP:28}[a.name];if(v&&DMG_CE[6])DMG_CE[6][i]=v;});F[3].anims.forEach((a,i)=>{if(a.name==='fHK'&&DMG_CE[3])DMG_CE[3][i]=20;}); /* Dhalsim close crouch damage (ROM close traces) */for(let f=0;f<12;f++)for(let i=47;i<F[f].anims.length;i++){if(i>52&&!/^cn/.test(F[f].anims[i].name))continue;const a=F[f].anims[i];if(!a||(NTIME_CE[f]&&NTIME_CE[f][i]))continue;const e=a.ents;if(f!==0&&f!==4&&f!==7)e[0][1]+=1;e[e.length-1][1]=0;} /* CE ROM close normals (fd_compare2 close.timing): first entry shows its full duration (Ryu/Ken/Bison one less), last entry ends the move */
  for(const f in NTIME_CE)for(const i in NTIME_CE[f]){const a=F[f].anims[i];if(a)NTIME_CE[f][i].forEach((d,n)=>{if(a.ents[n])a.ents[n][1]=d;});}

  /* fid 8 cHK: NTIME e1 already contained the hitstop */

  {const a=F[8].anims;if(a[19]&&a[19].ents[1])a[19].ents[1][1]=29;}}

function loadce(){if(VER.loading)return;VER.loading=1;const sc=document.createElement('script');sc.src=asseturl('assets_ce.js');

  sc.onload=()=>{const F=window.SF2CE.fighters;cetimes(F);if(window.SF2CEREACTION)F.forEach((f,fid)=>SF2CEREACTION.preregister(f,fid));if(window.SF2CEVEGA)F.forEach((F,fid)=>SF2CEVEGA.registerTurn({F,fid}));F.forEach((F,fid)=>{const p={F,fid};SF2CEDIZZY.register(p);SF2CEROUND.register(p);if(fid===1){SF2CEHONDAHOLD.register(p);SF2CEHONDAHANDS.register(p);}if([0,1,4,9,10,11].includes(fid))SF2CEWINNER.register(p);if(fid===7)SF2CEDHALSIM.register(p);SF2CESPECIAL.register(p);});const fi=F.map(f=>img(f.img));const st=SF2CE.stages||D.stages;VER.ce={f:F,fi,fia:F.map((f,i)=>altatlas(f,fi[i])),st,sti:SF2CE.stages?st.map(ls=>ls.map(l=>img(l.img))):STI,z80:SF2CE.z80||null};Promise.all([window.SF2AIDamndStage?.ready,window.SF2AIDamnd?.ready,window.SF2AIFF?.ready,window.SF2CESPECIAL?.ready,window.SF2CEDIZZY?.ready,window.SF2CEWINNER?.ready]).then(()=>{VER.loading=2;if(G.wantce)setver('CE',true);},()=>{VER.loading=3;});};

  sc.onerror=()=>{VER.loading=3;};document.head.appendChild(sc);

  const s2=document.createElement('script');s2.src=asseturl('screens_ce.js');s2.onload=()=>{const R=window.SF2SCRCE,m=e=>e&&Object.assign({},e,{im:img(e.img)});

    SCE={bg:img(R.selbg),cur:{1:m(R.cur['1']),2:m(R.cur['2'])},vsb:'rgb('+R.vsblue.join(',')+')',logo:m(R.vslogo),f:Object.keys(R.f).map(k=>{const o={};for(const n in R.f[k])o[n]=m(R.f[k][n]);return o;})};if(window.SF2BONUS)JSON.stringify(SF2BONUS).replace(/data:image[^"]+/g,u=>{bim(u);return u;});preloadBonusArt();};document.head.appendChild(s2);}

let SCE=null; // CE select/VS art from the CE program's VRAM (screens_ce.js)

function ceFadeState(){return VER.cur==='CE'&&window.SF2CEFADE?G.fade:null;}

let aiSceneryLayer=-1;
function fimgKind(kind,im,...args){const state=ceFadeState(),out=state?SF2CEFADE.image(im,state,kind):im;if(out){const shade=aiEnabled()&&G.stage===7&&aiSceneryLayer>=0&&cx.filter!=='none'?SF2AISCENE.nativeShade(out,cx.filter):null;if(shade){cx.save();cx.filter='none';cx.drawImage(shade,...args);cx.restore();}else cx.drawImage(out,...args);if(aiEnabled()&&aiSceneryLayer>=0)SF2AIWEATHER.paintLights(cx,SF2AIWEATHER.lightLayers(G.stage,aiSceneryLayer,im,G.round),args,G.tick);}}

function fimg(im,...args){fimgKind('scroll',im,...args);}

function ceFill(color,x,y,w,h,kind='scroll'){const state=ceFadeState();if(state){if(/^#[0-9a-f]{3}$/i.test(color))color=color.replace(/./g,(c,i)=>i?c+c:c);color=SF2CEFADE.color(color,state,kind);}if(color!==null){cx.fillStyle=color;cx.fillRect(x,y,w,h);}}

const CE_SCROLL_CONTEXT={drawImage:(...args)=>fimgKind('scroll',...args)};

const CE_OBJECT_CONTEXT={drawImage:(...args)=>fimgKind('object',...args)};



function dimg(e,dx=0,flip=false,kind='scroll'){if(!e||!e.im.complete)return;if(!flip){fimgKind(kind,e.im,e.x+dx,e.y);return;}

  cx.save();cx.translate(W-e.x+dx,e.y);cx.scale(-1,1);fimgKind(kind,e.im,0,0);cx.restore();}

function aiPortraitIdentity(slot,fid){const id=guestSelected(slot,fid)|| (evilRyuSelected(slot,fid)?'evil-ryu':evilKenSelected(slot,fid)?'evil-ken':CE_KEYS[fid]);return{id,key:(ffGuestIds().includes(id)||id.startsWith('evil-')?'ai:':'ce:')+id};}
function aiPortraitPacket(slot,fid,choiceOverride){
  const live=['win','fight'].includes(G.scene)&&P[slot].fid===fid,p=P[slot],identity=live?{id:p.aiProfile,key:p.fighterKey}:aiPortraitIdentity(slot,fid),otherSlot=1-slot;
  const otherFid=live?P[otherSlot].fid:otherSlot===1&&G.arc&&G.scene!=='select'&&G.ladder?.[G.li]!==undefined?G.ladder[G.li]:G.sel[otherSlot],other=live?{id:P[otherSlot].aiProfile,key:P[otherSlot].fighterKey}:aiPortraitIdentity(otherSlot,otherFid);
  const F=p.fid===fid&&p.fighterKey===identity.key?p.F:identity.id==='damnd'?SF2AIDamnd.fighter||D.fighters[fid]:(SF2AIFF.get(identity.id)?SF2AIFF.get(identity.id).template||{...D.fighters[fid],pal:SF2AIFF.get(identity.id).data.palette,pal2:SF2AIFF.get(identity.id).data.palette}:null)|| (identity.id==='evil-ken'?SF2AIEvilKen.fighter:D.fighters[fid]),choice=choiceOverride||(live?p.AIColorChoice:AICFG.colors[slot])||(ffGuestIds().includes(identity.id)?{clothing:-2,skin:-2}:{clothing:-1,skin:-1}),seed=live?G.AIMatchSeed:G.AINextMatchSeed??G.AIMatchSeed??SF2AIRULES.hash(rng,'portrait-preview');
  const mirror=slot===1&&fid===otherFid,shoto=['ryu','ken'].includes(identity.id)&&(AICFG.prototype||other.id==='evil-'+identity.id);
  const alternate=identity.id==='evil-ryu'||identity.id==='evil-ken'&&slot===1&&identity.key===other.key||!identity.id.startsWith('evil-')&&mirror&&!shoto;
  return{i:slot,fid,F,fighterKey:identity.key,aiProfile:identity.id,AIColorChoice:choice,AIPalette:live&&!choiceOverride&&p.AIPalette?p.AIPalette:SF2AIRULES.colors(F.pal,seed,identity.key,slot,choice),sourcePalette:alternate?F.pal2:F.pal};
}
function aiPortraitImage(im,slot,fid,kind,choice){const guest=aiEnabled()&&(['fight','win'].includes(G.scene)&&P[slot].fid===fid&&isFFGuest(P[slot])?P[slot].aiProfile:guestSelected(slot,fid));if(guest)return ffPortrait(guest,im,kind,aiPortraitPacket(slot,fid,choice));return aiEnabled()?SF2AIPORTRAITS.image(im,fid,kind,aiPortraitPacket(slot,fid,choice)):im;}
function aiPortraitEntry(e,slot,fid,kind,dx=0,flip=false){
  if(!aiEnabled()){dimg(e,dx,flip);return;}if(!e?.im.complete)return;
  const im=aiPortraitImage(e.im,slot,fid,kind);if(!flip){fimgKind('scroll',im,e.x+dx,e.y);return;}
  cx.save();cx.translate(W-e.x+dx,e.y);cx.scale(-1,1);fimgKind('scroll',im,0,0);cx.restore();
}

const CEGRID=[0,1,2,3,10,11,4,5,6,7,9,8]; // arcade CE select: Ryu Honda Blanka Guile Balrog Vega / Ken Chun Zangief Dhalsim Sagat Bison

function spr(im,r,x,y,flip){const [sx,sy,w,h,l,t]=r; if(!flip)fimgKind('object',im,sx,sy,w,h,x+l,y+t,w,h);

  else{cx.save();cx.translate(x-l,y+t);cx.scale(-1,1);fimgKind('object',im,sx,sy,w,h,0,0,w,h);cx.restore();}}

const fx=(i,x,y,f)=>spr(FXI,D.fx[i],x,y,f);

function bar(x,hp,right,hpd,max=144){const scale=v=>max===144?v:Math.round(v/max*144),n=Math.max(0,Math.min(144,scale(hp))),nd=Math.max(0,Math.min(144,scale(hpd===undefined?hp:hpd)));ceFill('#fff',x-1,20,146,11,'object');

  for(let i=0;i<144;i++){const v=right?i:143-i;ceFill(v<n?'rgb(255,255,0)':v<nd?'rgb(255,255,255)':'rgb(255,0,0)',x+i,21,1,9,'object');}}

/* M13h: Sonic Boom frames rendered from the WW object list (tiles 0x2fd0-0x2ff4, pal 4); the two alternate every 2f */

const SBI=[img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAARCAYAAABq+XSZAAABNklEQVR4nOWW67GCMBCFD7cDLIFbAi1gCbQgJcQSsITQAiWEFijBlJCUsP7AqBEJKMkQxzPDkMcAe75NyCZYIcFKyrPs1k+z1JrXUgMA2r5H1XTJmm+F0OKAjFHLoGlnB/fDsoHuJHbVKToAk1KckeKMSOF+fSoF4oeCtvY0K8FK27QPiZoUZ3GaH2XZp0Qdb9atTPvUmf+ocaL497lgZRjjRERnHq9xAH8AoFsG6ACnUFqBRB01gOBL/7sA+IZwBRDbUTda64KVVBT50MmPwz31FLPZWpoj+a82r/YmA7DKWQMB8AdCNnYgG8D4rLZ/hAGsA/IEYRjTt2ayPwaDsurFTiDA+1BmQOiH9rN6KUdj+1Pr9BeE6iwUo6VwXkFZoK7pnPOb/nSsImgiq65sA68zbjSX+QurRykIg51JZAAAAABJRU5ErkJggg=='),img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAARCAYAAABq+XSZAAABSElEQVR4nNWY4ZGDIBCFn9eBLXgl2AIpwRZICVwJXgl7LaQE04IlSAlQwt6PqCF3Rpi4juT74wjK+N7DBS0QoTMNP+urq2r13rIqlzuC9uLzXMSeYS+KNXEAoLR6beRKp13nV7T3Lbz16K3F6fsiblJ0wCVz1hJ/SHsp+VRTJpbMETJl1ynHXXs3TsKIkL+mvGDIIe8bD/Q4m7aYEBIakmDGYcUmhAdilOfbSblagtKZjOhbAMD12u9SN8RwZJi7ltmBRXFgdmBHhmMF/nB2MWA0ITQg22nAXcuov+RegwlfwF8Memtlx5WGB5JPf5wBnWn442iBzyCt7kVQkjH5bCGtboVPOvnci94sXFj0JNyRyVP4vNQJC8426RDSatsSNwpOTTm7pc6R4VJV8S2v/RmPfm56i719DNKKm7oG8P+fgA/Ebv2q+wUtguGu7H6eIgAAAABJRU5ErkJggg==')],SBX=[-37,-24];

const KOI=img('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAMCAYAAAADFL+5AAAAz0lEQVR4nL2U7Q2DIBCG3yMucCvgCK7QWVwBR7ArdCdGkBUY4frDQKjyYSztk5gA9/VCzgMzC2BEtlVKAOaWrRYDGGFmGbyf0RuiJa5lY0CbD7vICqIF3s9Qou0eNPo90D2zydKkYX88C+eibfxo9KecUYi2UGERhJQQWU9F4g2/QF1xKhXvQVNAWjzsyU3/E/BrLgk4NlvPV2gKyHV6TxQAkJuqNxJts68AJL/vTWifSvmBEZ1oOTVjzd4aRKnPMGuHl9P35BeoiU2LP9jRG8PAwGX2mSzZAAAAAElFTkSuQmCC');

const FATL={};function hexrgb(c){c=c.replace('#','');if(c.length==3)c=c.replace(/./g,'$&$&');return[0,2,4].map(i=>parseInt(c.substr(i,2),16));}

function fatlas(fill,stroke){const k=fill+'|'+stroke;if(FATL[k])return FATL[k];const c=document.createElement('canvas');c.width=96*8;c.height=8;

  const g=c.getContext('2d'),d=g.createImageData(768,8),F=hexrgb(fill),S=stroke?hexrgb(stroke):F.map(v=>v*0.25),SH={9:1.08,10:1,11:0.9,12:0.8,13:0.7};

  for(let ch=0;ch<96;ch++)for(let i=0;i<64;i++){const v=parseInt(SF2FONT[ch*64+i],16);if(v==15)continue;const o=((i>>3)*768+ch*8+(i&7))*4;

    const col=v==8?S:F.map(q=>Math.min(255,q*(SH[v]||1)));d.data[o]=col[0];d.data[o+1]=col[1];d.data[o+2]=col[2];d.data[o+3]=255;}

  g.putImageData(d,0,0);return FATL[k]=c;}

// text in the game's own 8x8 font (scroll1 glyphs), integer-scaled; y is the baseline as with fillText

function tx(s,x,y,sz,fill,stroke,al){s=String(s);const k=Math.max(1,Math.round(sz/9)),w=8*k*s.length,A=fatlas(fill,stroke);al=al||'center';

  let x0=Math.round(al=='center'?x-w/2:al=='right'?x-w:x);const y0=Math.round(y-7*k);cx.imageSmoothingEnabled=false;

  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i)-32;if(c>0&&c<96)fimgKind('object',A,c*8,0,8,8,x0+i*8*k,y0,8*k,8*k);}}

function txw(s,xr,y,fill,stroke,al){s=String(s);const A=fatlas(fill,stroke),aw=11.5;let x0=al==='left'?xr:xr-aw*s.length;cx.imageSmoothingEnabled=false;

  for(let i=0;i<s.length;i++){const c=s.charCodeAt(i)-32;if(c>0&&c<96)fimgKind('object',A,c*8,0,8,8,Math.round(x0+i*aw),y-8,11,9);}}

const AI_STAGE_LIGHTS=[{name:'DAYLIGHT',filter:'none'},{name:'SUNSET',filter:'sepia(0.35) saturate(1.15) hue-rotate(335deg) brightness(0.85)'},{name:'NIGHT',filter:'sepia(0.4) saturate(0.8) hue-rotate(155deg) brightness(0.6)'}];
function aiStageLight(){return AI_STAGE_LIGHTS[Math.max(0,Math.min(2,(G.round||1)-1))];}
function aiWeather(){return SF2AIWEATHER.sample(G.stage,G.round,G.AIMatchSeed,G.tick-(G.AIWeatherStart??G.tick));}
function aiStageFilter(){if(aiFFStage())return 'none';const filter=aiStageLight().filter,flash=aiWeather().flash;return flash?(filter==='none'?'':filter+' ')+'brightness('+(1+flash)+')':filter;}
function aiAtmosphereFrame(ground){return{s:aiWeather(),seed:G.AIMatchSeed,cam:G.cam,width:aiWorldSurface.width,top:aiWorldTop,height:aiWorldSurface.height,inset:aiHorizontalInset,ground,filter:aiStageFilter()};}
function stagedraw(front){if(aiFFStage())return;cx.save();if(aiEnabled())cx.filter=aiStageFilter();try{for(const [layerIndex,l] of D.stages[G.stage].entries()){if(l.front!==front)continue;const dy=VER.cur==='CE'&&window.SF2CECAMERA?SF2CECAMERA.offset(G.stage,layerIndex):0;cx.save();cx.translate(0,dy);const previousSceneryLayer=aiSceneryLayer;aiSceneryLayer=layerIndex;try{stageLayer(layerIndex,l,aiEnabled()?Math.min(aiViewWidth(),aiRoom().right-aiRoom().left):W);if(VER.cur==='CE'&&G.stage===4&&layerIndex===4)window.SF2CESTAGEBOAT?.drawAt(CE_OBJECT_CONTEXT,G.cam);}finally{aiSceneryLayer=previousSceneryLayer;cx.restore();}}}finally{cx.restore();}}
function stageLayer(layerIndex,l,viewWidth=aiViewWidth()){const projection=aiSceneryProjection();if(aiEnabled()&&G.stage===0&&layerIndex===0)return;if(VER.cur==='CE'&&window.SF2CESTAGECYCLISTS?.draw(CE_OBJECT_CONTEXT,G.stage,layerIndex,projection.camera,ceStageClock(),projection.offset,projection.panorama?viewWidth:384))return;if(VER.cur==='CE'&&window.SF2CESTAGEWATER?.draw(CE_OBJECT_CONTEXT,G.stage,layerIndex,G.cam,ceStageClock()))return;if(VER.cur==='CE'&&window.SF2CESTAGEDANCERS?.draw(CE_OBJECT_CONTEXT,G.stage,layerIndex,G.cam,ceStageClock()))return;if(VER.cur==='CE'&&window.SF2CESTAGEPALETTES?.draw(CE_SCROLL_CONTEXT,G.stage,layerIndex,G.cam,ceStageClock(),viewWidth))return;if(VER.cur==='CE'&&G.stage===0&&window.SF2CERYUSTAGE?.draw(CE_OBJECT_CONTEXT,layerIndex,G.cam,ceStageClock())){if(layerIndex===4){cx.save();cx.translate(0,window.SF2CECAMERA?SF2CECAMERA.state.main-SF2CECAMERA.offset(G.stage,layerIndex):0);if(!aiEnabled()||G.round>=3){if(VER.edition==='ce')SF2CEDIZZY.drawBirds(CE_OBJECT_CONTEXT,G,G.cam);else window.SF2CESTAGEBIRDS?.draw(CE_OBJECT_CONTEXT,G.cam,ceStageClock());}cx.restore();}return;}
  if(VER.cur==='CE'&&window.SF2CESTAGESCROLL?.draw(layerIndex>=3?CE_OBJECT_CONTEXT:CE_SCROLL_CONTEXT,G.stage,layerIndex,projection.camera,ceStageClock(),viewWidth,projection.offset,projection.panorama))return;
  const width=viewWidth,kind=layerIndex>=3?'object':'scroll',base=VER.cur==='CE'&&window.SF2CESTAGEWATER?SF2CESTAGEWATER.layer(G.stage,layerIndex,STI[G.stage][layerIndex],ceStageClock()):STI[G.stage][layerIndex],raw=VER.cur==='CE'&&window.SF2CESTAGEANIMATIONS?SF2CESTAGEANIMATIONS.layer(G.stage,layerIndex,base,ceStageClock()):base,pad=VER.cur==='CE'&&window.SF2CECAMERA?32:0,im=pad?SF2CECAMERA.image(G.stage,layerIndex,raw,ceStageClock()):raw;
  if(aiEnabled()&&G.stage===0&&layerIndex===2)SF2AISCENE.ryuCrest(cx,97-Math.round(l.a*G.cam+l.b+l.drift*ceStageClock()));
  if(l.rows){for(const [row0,y1,A,B] of l.rows){if(aiEnabled()&&G.stage===4&&layerIndex===1&&row0<160)continue;const y0=row0===0?-pad:row0;fimgKind(kind,im,Math.round(A*G.cam+B),y0+pad,width,y1-y0,0,y0,width,y1-y0);}return;}
  let x0=Math.round(l.a*G.cam+l.b+l.drift*ceStageClock());if(aiEnabled()&&G.stage===0&&layerIndex===1)SF2AISCENE.ryuRoof(cx,x0);

  if(l.wrap){x0=((x0%l.w)+l.w)%l.w;for(let x=-x0;x<width;x+=l.w)fimgKind(kind,im,x,-pad);}else{fimgKind(kind,im,-x0,-pad);if(l.w>=500&&(VER.cur!=='CE'||kind==='scroll')){const h=im.height;if(x0<0)fimgKind(kind,im,0,0,1,h,0,-pad,-x0,h);const r=l.w-x0;if(r<width)fimgKind(kind,im,l.w-1,0,1,h,r,-pad,width-r,h);}}
}

function aiSpriteReference(p,image,palette){return image===FIA[p.fid]&&palette.some((rgb,i)=>palette.slice(0,i).some(q=>q.every((v,c)=>v===rgb[c])))?{image:FI[p.fid],palette:p.F.pal}:null;}
function aiSprite(p,image,alternate){if(!aiEnabled())return image;const alt=alternate||image===FIA[p.fid]||image===p.AIAtlasAlt||p.aiProfile==='evil-ryu'&&image===p.AIAtlas,palette=alt?p.F.pal2:p.F.pal;const colored=SF2AIRULES.sprite(p,image,palette,false,aiSpriteReference(p,image,palette));AI_CLOTH_SOURCES.set(colored,{image,palette});return colored;}
function fighterBounds(p){
  const alternate=p.i===1&&P[0].fid===p.fid&&!!FIA[p.fid].ready,extra=window.SF2CESPECIAL?.art(p,alternate)||window.SF2CEDHALSIM?.art(p,alternate)||window.SF2CEHONDAHANDS?.art(p,alternate)||window.SF2CEVEGA?.art(p,alternate),rect=extra?.rect||p.F.frames[ent(p)[0]],w=rect[2],h=rect[3],l=rect[4],t=rect[5];
  const b={left:p.FACE?-l-w:l,right:p.FACE?-l:l+w,top:t,bottom:t+h};
  if(p.fid===11&&p.CECLAW?.equipped!==false){const data=window.SF2VEGACLAWDATA,ref=data?.poses[p.anim.source+24*p.aidx]?.[(alternate?2:0)+(p.FACE?1:0)],frame=ref&&data.frames[ref[0]];if(frame){b.left=Math.min(b.left,ref[1]);b.right=Math.max(b.right,ref[1]+frame.w);b.top=Math.min(b.top,ref[2]);b.bottom=Math.max(b.bottom,ref[2]+frame.h);}}
  return b;
}
function fighterArtBase(p){return SF2AIFF.heldArt(p,fighterArtBase0(p));}
function fighterArtBase0(p){if(isFFGuest(p))return ffArt(p);const alternate=p.i===1&&P[0].fid===p.fid&&!!FIA[p.fid].ready,extra=VER.cur==='CE'?(window.SF2CESPECIAL?.art(p,alternate)||( VER.edition==='ce'?(window.SF2CEWINNER?.art(p,alternate)||window.SF2CEDIZZY?.art(p,alternate)):null)||window.SF2CEDHALSIM?.art(p,alternate)||window.SF2CEHONDAHANDS?.art(p,alternate)||window.SF2CEVEGA?.art(p,alternate)||(VER.edition==='ce'?window.SF2CEROUND?.art(p,alternate):null)):null;return{image:extra?.fixedPalette?extra.image:aiSprite(p,extra?.image||(isEvilKen(p)?(p.i===1&&P[0].fighterKey===P[1].fighterKey?p.AIAtlasAlt:p.AIAtlas):aiEnabled()&&p.AIAtlas?p.AIAtlas:aiEnabled()&&['ryu','ken'].includes(p.aiProfile)&&(AICFG.prototype||P.some(q=>q.fid===p.fid&&q.aiProfile==='evil-'+p.aiProfile))?FI[p.fid]:p.i===1&&P[0].fid===P[1].fid&&FIA[p.fid].ready?FIA[p.fid]:FI[p.fid]),alternate&&!!extra),rect:extra?.rect||p.F.frames[ent(p)[0]],alternate};}
function fighterArt(p){const art=fighterArtBase(p);return aiEnabled()?aiFaceInjuryArt(p,aiClothesArt(p,art),art):art;}
const aiWorldSurface=document.createElement('canvas');
let aiWorldTop=-32,aiHorizontalInset=0;
// Special KO framing is a final scene transform: physics, stage scrolling and HUD
// retain their normal coordinates. Focus on the same latched pose we render.
function aiSKOFocus(){
  const shot=aiSKOView();if(!shot)return null;
  const p=SF2CECAMERA.poses?.[shot.slot]||P[shot.slot],a=fighterArt(p),r=a.rect;
  if(!r)return null;
  return {...shot,x:p.X/256+(p.FACE?-(r[4]+r[2]/2):r[4]+r[2]/2),y:GROUND+SF2CECAMERA.state.main-p.Y/256+r[5]+r[3]/2,top:GROUND+SF2CECAMERA.state.main-p.Y/256+r[5]};
}
function aiWorldBegin(width){
  const destination=cx,w=Math.ceil(width),zoom=W/width,room=aiRoom(),focus=aiSKOFocus();
  aiHorizontalInset=G.AICamera?.inset??Math.max(0,(width-(room.right-room.left))/2);
  const top=Math.floor(GROUND-GROUND/zoom)-32;
  aiWorldTop=focus?Math.min(top,Math.floor(focus.top)-48):top;
  const h=Math.ceil(H/zoom)+64+top-aiWorldTop;
  if(aiWorldSurface.width!==w||aiWorldSurface.height!==h){aiWorldSurface.width=w;aiWorldSurface.height=h;}
  cx=aiWorldSurface.getContext('2d',{willReadFrequently:true});cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,w,h);cx.imageSmoothingEnabled=false;cx.translate(0,-aiWorldTop);
  if(aiFFStage()){if(isDamnd(P[1]))SF2AIDamndStage.draw(cx,Math.floor(G.cam)-aiHorizontalInset,w,aiWorldTop,h,GROUND+SF2CECAMERA.state.main);else SF2AIFF.stageDraw(cx,P[1].aiProfile,Math.floor(G.cam)-aiHorizontalInset,w,aiWorldTop,h,GROUND+SF2CECAMERA.state.main);}else SF2AISCENE.draw(cx,G.stage,G.cam-aiHorizontalInset,w,aiWorldTop,h,room,aiStageFilter(),{camera:aiSceneryProjection().camera,inset:aiHorizontalInset,viewOffset:aiSceneryProjection().offset,panorama:aiSceneryProjection().panorama,y:SF2CECAMERA.offset(G.stage,0)});
  if(G.stage===0){SF2AIWEATHER.sky(cx,aiWeather(),G.cam,w,aiWorldTop,SF2CECAMERA.offset(0,0),aiHorizontalInset);cx.save();cx.translate(0,SF2CECAMERA.state.main);cx.filter=aiStageFilter();SF2AISCENE.ryuFloor(cx,G.cam-aiHorizontalInset,w);cx.restore();}
  cx.translate(aiHorizontalInset,0);return destination;
}
function aiWorldEnd(destination,zoom){
  cx=destination;cx.save();const focus=aiSKOFocus();
  if(focus){
    const scale=1+(Math.max(1,2.2/zoom)-1)*focus.weight;
    const x=(focus.x-Math.floor(G.cam)+aiHorizontalInset)*zoom,y=GROUND*(1-zoom)+focus.y*zoom;
    // Clamp the crop to the composed scenery, including at either stage wall.
    const tx=Math.max(W*(1-scale),Math.min(0,(1-scale)*x+(W/2-x)*focus.weight));
    const top=GROUND*(1-zoom)+aiWorldTop*zoom,bottom=top+aiWorldSurface.height*zoom;
    const ty=Math.max(H-bottom*scale,Math.min(-top*scale,(1-scale)*y+(H*.55-y)*focus.weight));
    cx.translate(tx,ty);cx.scale(scale,scale);
  }
  cx.translate(0,GROUND*(1-zoom));cx.scale(zoom,zoom);const projection=cx.getTransform();cx.drawImage(aiWorldSurface,0,aiWorldTop);cx.restore();if(window.SF2Graphics)cx=SF2Graphics.beginWorld(aiWorldSurface,aiWorldTop,projection);
}
function renderGame(){if(G.scene==='bonus')return bonusrender();if(G.scene!=='fight')return scenerender();if(VER.cur==='CE'&&G.stage===4)window.SF2CESTAGEBOAT?.advance(ceStageClock());const c=aiEnabled()?Math.floor(G.cam):G.cam,ground=GROUND+(VER.cur==='CE'&&window.SF2CECAMERA?SF2CECAMERA.state.main:0),view=VER.cur==='CE'&&window.SF2CECAMERA?.poses||P;cx.fillStyle='#000';cx.fillRect(0,0,W,H);const aiZoom=W/aiViewWidth(),aiDestination=aiEnabled()?aiWorldBegin(aiViewWidth()):null;try{stagedraw(false);if(aiEnabled()){cx.save();cx.translate(-aiHorizontalInset,0);const f=aiAtmosphereFrame(ground);SF2AIATMOSPHERE.clouds(cx,f,'far');SF2AIATMOSPHERE.clouds(cx,f,'near');SF2AIATMOSPHERE.mist(cx,f,'back');cx.restore();}
  aiBloodDraw(c,ground,true);
  if(aiEnabled()){for(const p of view){const art=fighterArt(p);SF2AISHADOW.draw(cx,art.image,art.rect,p,(p.X>>8)-c,ground,G.round,p.fid===11&&p.CECLAW?.equipped!==false?{bounds:fighterBounds(p),paint:g=>SF2CEVEGACLAW.draw(g,p,0,0,art.alternate)}:null);}}else if(VER.cur==='CE'&&window.SF2CESHADOW)for(const p of view){const f=isEvilKen(p)?SF2AIEvilKen.shadow(p,G.stage):SF2CESHADOW.frame(p,G.stage);if(f)fimgKind('object',f.image,(p.X>>8)-c+f.x,ground+f.y);}

  aiDeathDraw(c,ground);
  const drawp=p=>{const art=fighterArt(p),alternate=art.alternate;spr(art.image,art.rect,(p.X>>8)-c+(VER.edition==='ce'&&window.SF2CEREACTION?SF2CEREACTION.renderOffset(p):0),ground-(p.Y>>8),p.FACE);
    if(VER.cur==='CE'&&window.SF2CEVEGACLAW)SF2CEVEGACLAW.draw(CE_OBJECT_CONTEXT,p,(p.X>>8)-c+(VER.edition==='ce'&&window.SF2CEREACTION?SF2CEREACTION.renderOffset(p,true):0),ground-(p.Y>>8),p.i===1&&P[0].fid===p.fid&&!!FIA[p.fid].ready);if(VER.edition==='ce'){if(p.anim?.name?.startsWith('ceWinner'))SF2CEWINNER.claw(CE_OBJECT_CONTEXT,p,(p.X>>8)-c,ground-(p.Y>>8),alternate);else if(p.anim?.name?.startsWith('ceDizzy'))SF2CEDIZZY.claw(CE_OBJECT_CONTEXT,p,(p.X>>8)-c,ground-(p.Y>>8),alternate);else window.SF2CEROUND?.claw(CE_OBJECT_CONTEXT,p,(p.X>>8)-c,ground-(p.Y>>8),alternate);}

    if((VER.edition!=='ce'||p.CEDizzy?.legacy)&&p.DIZZY===2){if(aiEnabled())SF2CEDIZZY.drawFallbackStars(cx,p,c,ground,G.tick,G);else{cx.fillStyle='#ffe000';for(let i=0;i<3;i++){const a=G.tick/12+i*2.09;cx.fillRect((p.X>>8)-c+Math.cos(a)*14-2,ground-(p.Y>>8)-100+Math.sin(a)*4,4,4);}}}};

  if(VER.edition==='ce')SF2CEDIZZY.drawStars(CE_OBJECT_CONTEXT,G,c,ground);else if(G.CESpecialObjects)SF2CEDIZZY.drawStars(CE_OBJECT_CONTEXT,{CEObjects:G.CESpecialObjects},c,ground);
  const top=(view[0].ST===S_ATK||view[0].ST===S_SPEC)?0:1; drawp(view[1-top]);drawp(view[top]);if(VER.edition==='ce'){SF2CEWINNER.drawObjects(CE_OBJECT_CONTEXT,G,c,ground);SF2CEDIZZY.drawStars(CE_OBJECT_CONTEXT,G,c,ground,true);}else if(G.CESpecialObjects)SF2CEDIZZY.drawStars(CE_OBJECT_CONTEXT,{CEObjects:G.CESpecialObjects},c,ground,true);

  aiRetchDraw(c,ground,view);aiFloorCoughDraw(c,ground,view);
  if(VER.cur==='CE'&&window.SF2CEVEGACLAW)SF2CEVEGACLAW.drawDrops(CE_OBJECT_CONTEXT,P,c,ground);

  if(VER.cur==='CE')SF2CEDHALSIM.draw(CE_OBJECT_CONTEXT,G,c,ground);for(const p of P)if(p.FBON)drawfb(p,ground,c);

  if(VER.cur==='CE')window.SF2CEPROJECTILES?.drawEffects(cx,ground,c,{contactImage:index=>AI_IMPACT_IMAGES[index],image:(im,kind)=>ceFadeState()?SF2CEFADE.image(im,G.fade,kind):im});

  aiBloodDraw(c,ground);stagedraw(true);if(aiEnabled()){cx.save();cx.translate(-aiHorizontalInset,0);SF2AIWEATHER.rain(cx,aiWeather(),G.AIMatchSeed,G.cam-aiHorizontalInset,aiViewWidth(),ground,aiWorldTop,aiWorldSurface.height);const f=aiAtmosphereFrame(ground);SF2AIATMOSPHERE.mist(cx,f,'front');SF2AIATMOSPHERE.petals(cx,f);if(G.stage!==0&&G.stage!==11)SF2AIWEATHER.atmosphere(cx,{...f.s,level:0},G.AIMatchSeed,G.cam-aiHorizontalInset,aiViewWidth(),ground);cx.restore();}}finally{if(aiDestination)aiWorldEnd(aiDestination,aiZoom);}bar(32,P[0].HP,0,P[0].HPD,aiMax(P[0]));bar(208,P[1].HP,1,P[1].HPD,aiMax(P[1]));
  {const R='#ee6644',B='#0044aa';txw('1P',6,9,R,B,'left');txw(P[0].SCORE||0,113,9,R,B);txw(G.hisc=Math.max(G.hisc||RK[0].s,P[0].SCORE||0,P[1].SCORE||0),247,9,R,B);txw('2P',268,9,R,B,'left');if(G.mode2p||P[1].SCORE)txw(P[1].SCORE||0,377,9,R,B);}

  if(!(G.gph===2&&G.ko&&(G.tick>>3)&1))fimg(KOI,176,19);const t=Math.max(0,G.timer);

  if(!(G.gph===1&&t<=10&&(G.tick>>4)&1)){fx(8+((t/10)|0),176,34);fx(8+t%10,192,34);}

  tx(aiName(P[0]).toUpperCase(),32,40,8,'#ffaa66','#0044aa','left');tx(aiName(P[1]).toUpperCase(),352,40,8,'#ffaa66','#0044aa','right');

  for(let i=0;i<P[0].WINS;i++)fx(7,2+12*i,14); for(let i=0;i<P[1].WINS;i++)fx(7,372-12*i,14);

  if(aiEnabled())for(const p of P)if(p.AIFFHeld?.choke){const hold=P[p.AIFFHeld.owner].AIFFHold;if(hold){const x=p.i?296:32;tx('BREAK FREE',x,74,6,'#ffe000','#000','left');cx.fillStyle='#222';cx.fillRect(x,78,56,3);cx.fillStyle='#ffe000';cx.fillRect(x,78,56*hold.escape/14,3);}}
  if(aiEnabled())for(const p of P)if(G.tick<(p.AIComboBreakNotice||0))tx('COMBO BREAK',p.i?352:32,74,8,'#ffe000','#000',p.i?'right':'left');
  if(aiEnabled())for(const p of P){const s=p.AIChain;if(!p.AICombo?.active||!s||!p.AICombo.hits)continue;const left=p.i?250:32;tx(p.AICombo.hits+' HIT',left,53,8,'#ffe000','#000','left');['LP','MP','HP','LK','MK','HK'].forEach((label,i)=>tx(label,left+i*16,63,6,s.used&(1<<i)?'#777':'#fff','#000','left'));}

  if(padMsgT>0){padMsgT--;tx(padMsg,4,218,8,'#fff','#000','left');}

  if(aiEnabled())for(const p of P)if(p.aiProfile==='evil-ryu')tx('PROTOTYPE: RIFT STEP',p.i?376:8,218,6,'#fff','#000',p.i?'right':'left');

  if(aiEnabled())for(const p of P)if(isEvilKen(p)){const heat=p.AIEvilKen.adapter.heat,x=p.i?376:8,align=p.i?'right':'left';tx('HEAT '+String(heat.heat).padStart(3,'0'),x,207,8,heat.overheated?'#ff6040':'#ffe000','#000',align);tx((heat.overheated?'OVERHEAT ':'')+(heat.lock?'LOCK '+heat.lock:''),x,218,6,'#ffb060','#000',align);}

  if(G.gph===0){const fin=P[0].WINS===1&&P[1].WINS===1||G.round>=4; if(G.gt<70){if(fin)tx('FINAL ROUND',W/2,110,24,'#ffe000','#a01000');else fx(1+Math.min(3,G.round),152,96);}else fx(5,160,96);}

  if(G.gph===2&&G.bann&&G.gt>=(G.ko?96:0)){const b=G.bann.split('  ');tx(b[0],W/2,70,8,'#ffffff','#0044aa');if(b[1])tx(b[1],W/2,84,8,'#ffffff','#0044aa');}

}

function render(){window.SF2Graphics?.clearWorld();SF2AIRULES.help?.(P,aiEnabled());renderGame();if(CONTROL.paused)pauseRender();if(window.SF2Graphics){SF2Graphics.finishWorld();cx=nativeSurface.getContext('2d');SF2Graphics.present();}}
// ---- sound: OKI MSM6295 ADPCM samples decoded from the local ROM (sound.js), played via WebAudio ----

// Phrase ids identified by speech recognition + envelope heuristics (hit/block/whiff picks are approximate).

const SN_HIT=[16,18,11],SN_BLOCK=29,SN_WHIFF=4,SN_KO=77,SN_ROUND=53,SN_NUM=54,SN_FIGHT=44;

const VOICE={0:[72,73,74],4:[72,73,74],3:[71,0,0],7:[69,70,0]};

let AC=null,MG=null,muted=false;const SB={};

const soundStats={voices:0,pending:0,delivered:0};
// Render only the finishing move through a separate, silent sound-board instance.
// Its echo taps never feed the stage music back through a delay.
const AI_ECHO={buffers:new Map(),module:null,nodes:[]};
function aiEchoStop(){for(const n of AI_ECHO.nodes){try{n.source.stop();}catch{}n.source.disconnect();n.gain.disconnect();}AI_ECHO.nodes.length=0;}
function aiEchoBuffer(voice){
  if(voice.buffer)return voice.buffer;
  const key=JSON.stringify([voice.commands,voice.sample]);if(AI_ECHO.buffers.has(key))return AI_ECHO.buffers.get(key);
  AI_ECHO.module??=new WebAssembly.Module(b64(SF2MUS.wasm));const noop=()=>0;
  const instance=new WebAssembly.Instance(AI_ECHO.module,{wasi_snapshot_preview1:{fd_close:noop,fd_seek:noop,fd_write:noop}}),x=instance.exports;
  x._initialize?.();new Uint8Array(x.memory.buffer,x.snd_rom(),0x10000).set(b64(curz80()));new Uint8Array(x.memory.buffer,x.snd_oki(),0x40000).set(b64(SF2SND.oki));x.snd_reset();
  const rate=22050,pcm=new Float32Array(rate*2),commands=voice.commands||[];let next=0;
  if(!commands.length&&voice.sample!==null)x.snd_oki_play(voice.sample,0);
  for(let offset=0;offset<pcm.length;offset+=256){while(next<commands.length&&commands[next][0]/60<=offset/rate)x.snd_cmd(commands[next++][1]);const count=Math.min(256,pcm.length-offset);x.snd_render(count,rate);pcm.set(new Float32Array(x.memory.buffer,x.snd_buf(),count),offset);}
  let first=0,last=pcm.length-1,peak=0;while(first<last&&Math.abs(pcm[first])<.0008)first++;while(last>first&&Math.abs(pcm[last])<.0008)last--;
  const audio=pcm.slice(first,Math.min(pcm.length,last+1103));for(const sample of audio)peak=Math.max(peak,Math.abs(sample));if(peak<.0008)return null;
  if(peak>.85)for(let i=0;i<audio.length;i++)audio[i]*=.85/peak;
  const buffer=AC.createBuffer(1,audio.length,rate);buffer.copyToChannel(audio,0);AI_ECHO.buffers.set(key,buffer);if(AI_ECHO.buffers.size>24)AI_ECHO.buffers.delete(AI_ECHO.buffers.keys().next().value);return buffer;
}
function aiSpecialKOEcho(owner,effect){
  if(!aiEnabled())return;const saved=AI_SPECIAL_VOICES[owner.i],move=effect?.projectile?saved?.projectile:saved?.last;
  const voice=move||{commands:[[0,XS(owner)?.sph?.[Math.max(0,owner.F.moves.indexOf(owner.MV))]||0x2a]],sample:null,kind:owner.MV?.kind||'special'};
  soundStats.koEchoRequests=(soundStats.koEchoRequests||0)+1;soundStats.lastKOEcho={slot:owner.i,kind:voice.kind,taps:4,played:false};
  if(!AC||muted||netReplaying)return;
  try{const buffer=aiEchoBuffer(voice);if(!buffer)return;const now=AC.currentTime;
    for(const [delay,volume] of [[.03,.65],[.35,.34],[.67,.21],[.99,.12],[1.31,.065]]){const source=AC.createBufferSource(),gain=AC.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);gain.connect(MG);const node={source,gain};AI_ECHO.nodes.push(node);source.onended=()=>{source.disconnect();gain.disconnect();const index=AI_ECHO.nodes.indexOf(node);if(index>=0)AI_ECHO.nodes.splice(index,1);};source.start(now+delay);}
    soundStats.koEchoes=(soundStats.koEchoes||0)+1;soundStats.lastKOEcho.played=true;soundStats.lastKOEcho.duration=buffer.duration;
  }catch(error){console.warn('Special KO echo unavailable:',error.message);}
}
function audioInit(){if(AC){if(AC.state==='suspended')AC.resume().catch(()=>{});return;}if(!window.SF2SND)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}

  MG=AC.createGain();MG.gain.value=muted?0:1;MG.connect(AC.destination);window.SF2AIDamnd?.prepareSound(AC);window.SF2AIFF?.prepareSound(AC).catch(()=>{});

  musInit();if(MUS===-1)music(G.scene==='title'?MUSC.title:G.scene==='fight'?STM[G.stage]:MUSC[G.scene]);}

// ---- sound board: the game's own Z80 sound program + YM2151 (ymfm) + OKI in an AudioWorklet, driven by sound commands

let SN=null,SNQ=[],MUS=-1,MUSINIT=0;const LVL=[];

const b64=s=>{const b=atob(s),r=new Uint8Array(b.length);for(let i=0;i<b.length;i++)r[i]=b.charCodeAt(i);return r;};

function curz80(){return (VER.cur==='CE'&&VER.ce&&VER.ce.z80)||SF2SND.z80;}

let MUSZ=null; // which Z80 program the worklet runs; switching version restarts it with that version's sound program

function musver(){if(!SN||MUSZ===curz80())return;try{SN.disconnect();}catch(e){}SN=null;const m=MUS;MUS=-1;SNQ=m>=0?[{c:m}]:[];musInit();}

function musOpts(oki,init){MUSZ=curz80();return {wasm:b64(SF2MUS.wasm),z80:b64(MUSZ),oki:oki||b64(SF2SND.oki),init:init||[]};}

function musInit(oki){if(!window.SF2MUS||!SF2SND.z80||!AC.audioWorklet)return;

  const generation=++MUSINIT;AC.audioWorklet.addModule('data:text/javascript,'+encodeURIComponent(SF2MUS.proc)).then(()=>{

    if(generation!==MUSINIT)return;const n=new AudioWorkletNode(AC,'sf2snd',{numberOfInputs:0,outputChannelCount:[1],processorOptions:musOpts(oki,SNQ.slice())});

    n.port.onmessage=e=>{if(e.data.rms!==undefined){soundStats.voices=e.data.voices||0;soundStats.pending=e.data.pending||0;soundStats.delivered=e.data.delivered||0;LVL.push([MUS,e.data.rms]);if(LVL.length>400)LVL.shift();}};

    n.connect(MG);SN=n;SNQ=[];}).catch(e=>console.log('music off: '+e));}

// stage themes indexed by fid (= stage); scene jingles. Codes logged from the 68000's writes to the sound latch (0x800181).

const STM=[0x01,0x02,0x03,0x05,0x04,0x06,0x07,0x08,0x0c,0x0b,0x09,0x0a];

const MUSC={title:0x16,select:0x0e,vs:0x0f,win:0x14,lose:0x10,cont:0x11,over:0x13,end:0x0d,stop:0xf0};

function music(c){if(c===MUS)return;MUS=c;(G.muslog||(G.muslog=[])).push(c);if(netReplaying)return;if(SN)SN.port.postMessage({c});else SNQ.push({c});}

function snd(id,vol=0.6){(G.sndlog||(G.sndlog=[])).push(id);if(G.sndlog.length>64)G.sndlog.shift();if(netReplaying)return;

  if(!AC)return;const message={o:[id,Math.max(0,Math.min(8,Math.round(-20*Math.log10(Math.max(vol,0.01))/3)))]};
  if(SN)SN.port.postMessage(message);else SNQ.push(message);}
// ---- title / select / VS / win / continue / ending (art from the game's own attract-mode VRAM, tools/screens.py) ----

const SCR=window.SF2SCR||{ports:[]},SCRI=SCR.title?[SCR.title,SCR.selbg,...SCR.ports].map(img):[];

const TITLEI=SCRI[0],SELI=SCRI[1],PORTI=SCRI.slice(2);

const NAMES=D.fighters.map(f=>f.name),BOSSES=[10,11,9,8]; // Balrog, Vega, Sagat, then Bison last

const RTIMES=[30,60,99,0],DIFFN=['EASY','NORMAL','HARD','HARDEST'],DIFFM=[0.55,0.8,1.0,1.25];

// Existing decision policy remains approximate; these anchors preserve old migrated presets.

const CE_DIFFM=[0.55,0.55+0.25/3,0.55+0.5/3,0.8,1,1+0.25/3,1+0.5/3,1.25];

function difficultyLabel(){return VER.edition==='ce'?String(G.ceDifficulty)+(G.ceDifficulty===0?' EASIEST':G.ceDifficulty===3?' NORMAL':G.ceDifficulty===7?' HARDEST':''):DIFFN[G.diff];}

// CPU level along the arcade ladder: the measured damage the arcade CPU dealt per stage rises ~3x from stage 1 to Sagat/Bison

function ailvl(){const n=G.ladder.length||1;const base=G.arc?0.3+0.7*Math.min(1,G.li/Math.max(1,n-2)):0.65;return Math.min(1.3,base*(VER.edition==='ce'?CE_DIFFM[G.ceDifficulty]:DIFFM[G.diff]));}

const HOME=['JAPAN','JAPAN','BRAZIL','USA','USA','CHINA','USSR','INDIA','THAILAND','THAILAND','USA','SPAIN'];

let selprev=[0,0];

const CONF=K_ATK*63;

function loadendce(){if(window.SF2ENDCE||loadendce.s)return;loadendce.s=1;const e=document.createElement('script');e.src=asseturl('endings_ce.js');e.onerror=()=>{loadendce.s=0;};document.head.appendChild(e);}  // CE endings, lazy (32 MB)

function endinfo(){const E=VER.cur==='CE'?window.SF2ENDCE:window.SF2END;return E&&E[G.sel[0]]||null;}

const ENDIMG={};function endimg(u){return ENDIMG[u]||(ENDIMG[u]=Object.assign(new Image(),{src:u}));}

/* default ranking = the ROM's own table (6 x {BCD score, 3 initials}; WW prog 0xdcc, CE prog 0xb24, copied to RAM 0xffd276 at boot,

   read in the box emulator). The ROM table has no character, so none is shown; the web screen lists the first 5. */

const RKDV={WW:[[50000,'NIN'],[45000,'SIN'],[40000,'HAC'],[35000,'MTI'],[30000,'ESH']],CE:[[50000,'NIN'],[45000,'SIN'],[40000,'HAC'],[35000,'MTI'],[30000,'HRK']]};

function rankStorageKey(){return aiEnabled()?'sf2:ai:ce-v1:rank:v1':'sf2rank';}

const rkd=v=>RKDV[v].map(([s,n])=>({n,s,f:-1}));let RKD=rkd('WW');

function validrank(r){return Array.isArray(r)&&r.length===5&&r.every((e,i)=>e&&Number.isSafeInteger(e.s)&&e.s>=0&&typeof e.n==='string'&&e.n.length===3&&/^[A-Z.! ]{3}$/.test(e.n)&&Number.isInteger(e.f)&&e.f>=-1&&e.f<12&&(!i||r[i-1].s>=e.s));}

let RK;try{RK=JSON.parse(localStorage.getItem(rankStorageKey()))}catch(e){}if(!validrank(RK))RK=RKD.map(o=>({...o}));

function rankgo(nx){const sc=(P&&P[0]&&P[0].SCORE)||0;if(!G.mode2p&&sc>RK[4].s){let i=0;while(RK[i].s>=sc)i++;RK.splice(i,0,{n:'A  ',s:sc,f:G.sel[0]});RK.length=5;G.rk={i,c:0,ch:0,nx,done:0};go('rank');}else go(nx);}

const RKC='ABCDEFGHIJKLMNOPQRSTUVWXYZ.! ';

function sceneMusic(sc){const m=sc==='fight'?STM[G.stage]:sc==='win'?(VER.cur==='CE'?0x10:G.mw===1&&!G.mode2p?MUSC.lose:MUSC.win):sc==='end'&&endinfo()?endinfo().mus:MUSC[sc];if(m!==undefined)music(m);}

function goNow(sc,withMusic=true){G.scene=sc;G.st=0;if(withMusic)sceneMusic(sc);}

function go(sc){if(aiEnabled()&&G.AINextMatchSeed===undefined){if(sc==='select')G.AINextMatchSeed=SF2AIRULES.hash(rng,'selection:'+G.tick);else if(sc==='vs'){const fids=[G.sel[0],G.arc?G.ladder[G.li]:G.sel[1]],keys=fids.map((fid,i)=>aiPortraitIdentity(i,fid).key);G.AINextMatchSeed=SF2AIRULES.hash(rng,((G.AIMatchSerial||0)+1)+':'+keys.join(':'));}}G.fade=null;if(VER.cur==='CE'&&window.SF2CEFADE){const route=G.scene==='map'&&sc==='vs'&&G.map?.initial?'select>vs':G.scene+'>'+sc,state=SF2CEFADE.begin(route);if(state){state.target=sc;state.entered=false;G.fade=state;return;}}goNow(sc);}

function startarcade(){if(VER.cur==='CE')loadendce();return startarcade0.apply(this,arguments);}

function startarcade0(f){P[0].SCORE=P[1].SCORE=0;G.arc=1;G.mode2p=0;G.sel[0]=f;const o=VER.cur==='CE'?[...Array(8).keys()]:[...Array(8).keys()].filter(x=>x!==f); /* CE: the 8 world warriors incl. your mirror, then the 4 bosses */

  for(let i=o.length-1;i>0;i--){const j=rand()%(i+1);[o[i],o[j]]=[o[j],o[i]];}

  G.ladder=o.concat(VER.cur==='CE'?BOSSES.filter(x=>x!==f||true):BOSSES);G.AIFFLadder=aiEnabled()?[...G.ladder.map(()=>null),...ffGuestIds()]:null;if(aiEnabled())G.ladder.push(...ffGuestIds().map(()=>10));G.li=0;G.mapFrom=f;arcadeVs();}

function arcadeVs(){if(aiEnabled()){AICFG.selectedProfiles[1]=G.AIFFLadder?.[G.li]||null;const id=AICFG.selectedProfiles[1];if(id){G.map={FF:true,id,tick:0};G.mapWait=30;G.mapSetup=true;go('map');return;}}if(VER.cur==='CE'&&G.arc&&!G.mode2p&&window.SF2CEWORLDMAP){G.map=SF2CEWORLDMAP.init(G.mapFrom??G.sel[0],G.ladder[G.li],{playerFid:G.sel[0]});G.map.initial=G.scene==='select';G.mapWait=G.map.initial?47:60;G.mapSetup=G.map.initial;go('map');}else go('vs');}

function fightnext(){setfighter(P[0],G.sel[0]);setfighter(P[1],G.arc?G.ladder[G.li]:G.sel[1]);G.stage=P[1].fid;go('fight');resetmatch();}

function matchend(){const w=P[0].WINS>=2&&P[0].WINS>P[1].WINS?0:P[1].WINS>=2&&P[1].WINS>P[0].WINS?1:-1;G.mw=w;

  if(!G.arc){go('win');return;}

  if(G.mode2p&&w===1){go('win');return;}

  if(w===0||VER.cur==='CE'&&w===1){go('win');return;} G.cont=9;go('cont');}

function startfight(a,b){G.arc=0;setfighter(P[0],a);setfighter(P[1],b);G.sel=[a,b];G.stage=b;G.scene='fight';G.selstep=0;resetmatch();}

function aiColorDone(){const c=G.AIColor;AICFG.colors[c.slot]={clothing:c.clothing,skin:c.skin};delete G.AIColor;sfxc(0x22,SN_BLOCK,0.4);if(!G.mode2p&&G.arc){startarcade(G.sel[0]);return;}if(++G.selstep>=2){G.selstep=0;go('vs');}}
function aiColorDraw(){const c=G.AIColor,p=P[c.slot],mirror=p.i===1&&P[0].fighterKey===p.fighterKey,image=isEvilKen(p)?(mirror?p.AIAtlasAlt:p.AIAtlas):p.AIAtlas||(['ryu','ken'].includes(p.aiProfile)&&(AICFG.prototype||P.some(q=>q.fid===p.fid&&q.aiProfile==='evil-'+p.aiProfile))?FI[p.fid]:p.i===1&&P[0].fid===p.fid&&FIA[p.fid].ready?FIA[p.fid]:FI[p.fid]),alternate=image===FIA[p.fid]||image===p.AIAtlasAlt||p.aiProfile==='evil-ryu',palette=alternate?p.F.pal2:p.F.pal;SF2AICOLORS.draw(cx,c,p,image,palette,G.AINextMatchSeed,tx,aiPortraitImage(SCE.f[p.fid].vsL.im,c.slot,p.fid,'vsL',{clothing:c.clothing,skin:c.skin}),aiSpriteReference(p,image,palette));}
function scenestep(k1,k2,ng){const n1=k1&~selprev[0],n2=k2&~selprev[1];selprev=[k1,k2];G.st++;

  const ok=(n1&CONF)||(ng&4), any=ok||(n2&CONF);

  switch(G.scene){

  case 'title': if(n1&(K_U|K_D))sfxc(VER.cur==='CE'&&0x21); if(n1&K_D)G.menu=(G.menu+1)%5; if(n1&K_U)G.menu=(G.menu+4)%5;

    if(G.menu===4&&n1&(K_L|K_R)){cycleEdition(n1&K_L?-1:1);sfxc(0x21,SN_BLOCK,0.3);}

    if(G.menu>=2&&G.menu<4&&n1&(K_L|K_R)){const d=n1&K_R?1:-1; if(G.menu===2)changeDifficulty(d); else {const i=RTIMES.indexOf(G.rtime);G.rtime=RTIMES[(i+d+4)%4];} saveEditionSettings();sfxc(0x21,SN_BLOCK,0.3);}

    if(ok&&G.st>20&&G.menu<2&&!(G.wantce&&VER.cur!=='CE')){sfxc(0x20,SN_BLOCK,0.4);G.mode2p=G.menu;G.arc=G.menu?0:1;if(aiEnabled()){AICFG.selectedProfiles=[null,null];AICFG.colors=[null,null];delete G.AIColor;delete G.AINextMatchSeed;}G.selstep=0;G.sel=[0,4];if(VER.cur==='CE'){G.cep=[0,6];}go('select');} break;

  case 'select': {if(!G.cep)G.cep=[0,6];const i=G.selstep, who=i===1&&G.mode2p?n2:n1, n=G.mode2p?12:8; let c=G.sel[i];if(aiEnabled()&&G.AIColor){if(SF2AICOLORS.step(G.AIColor,who))aiColorDone();break;}

    if(VER.cur==='CE'){let q=G.cep[i];if(aiEnabled()&&damndSelectable()&&(who&(K_L|K_R|K_U|K_D))){const total=12+ffGuestIds().length;if(q>=12){if(who&K_L)q=q===12?total-1:q-1;else if(who&K_R)q=q===total-1?12:q+1;else q=who&K_U?6+Math.min(5,q-12):Math.min(5,q-12);}else if(who&K_U)q=q<6?12+Math.min(ffGuestIds().length-1,q):q-6;else if(who&K_D)q=q>=6?12+Math.min(ffGuestIds().length-1,q-6):q+6;else if(who&K_L)q=q%6?q-1:q+5;else if(who&K_R)q=q%6===5?q-5:q+1;}else{if(who&K_L)q=q%6?q-1:q+5;if(who&K_R)q=q%6===5?q-5:q+1;if(who&(K_U|K_D))q=(q+6)%12;}if(aiEnabled()&&!aiAllowedFids().includes(ceSelectGrid()[q]))q=G.cep[i];G.cep[i]=q;c=ceSelectGrid()[q];if(aiEnabled())AICFG.selectedProfiles[i]=q>=12?ffGuestIds()[q-12]:c===10?'balrog':null;}

    else{if(who&K_L)c=c%4?c-1:c+3; if(who&K_R)c=c%4===3?c-3:c+1;

    if(who&K_U)c=(c+n-4)%n; if(who&K_D)c=(c+4)%n;} G.sel[i]=c;

    if(who&(K_L|K_R|K_U|K_D))sfxc(VER.cur==='CE'&&0x21);

    if(aiEnabled()&&!aiAllowedFids().includes(G.sel[i]))break;

    if((who&CONF)||(i===0&&(ng&4))){if(aiEnabled()){AICFG.selectedProfiles[i]=G.sel[i]===0&&evilRyuSelectable()?(who&0x380?'evil-ryu':'ryu'):G.sel[i]===4&&evilKenSelectable()?(who&0x380?'evil-ken':'ken'):G.cep[i]>=12?ffGuestIds()[G.cep[i]-12]:null;}sfxc(0x22,SN_BLOCK,0.4);if(aiEnabled()){setfighter(P[i],G.sel[i]);G.AINextMatchSeed??=SF2AIRULES.hash(rng,'selection:'+G.tick);G.AIColor=SF2AICOLORS.create(i,AICFG.colors[i]||(guestSelected(i,G.sel[i])?{clothing:-2,skin:-2}:null));break;}

      if(!G.mode2p&&G.arc){startarcade(G.sel[0]);break;}

      if(++G.selstep>=2){G.selstep=0;go('vs');}}

    break;}

  case 'map': {if(G.map.FF){if(++G.map.tick>=150||G.map.tick>45&&any)go('vs');break;}if(!G.mapSetup){G.mapSetup=true;break;}if(G.mapWait>0){G.mapWait--;break;}const m=SF2CEWORLDMAP.step(G.map);for(const code of m.sound)sfxc(code);if(m.done)go('vs');break;}

  case 'vs': if(G.st>=200||(G.st>40&&any))fightnext(); break;

  case 'win': if(netActive)break;if(G.st>=240||(G.st>Math.max(60,VER.cur==='CE'&&G.mw>=0&&window.SF2CEFADE?SF2CEFADE.quotes[P[G.mw].fid].first+2*(SF2CEFADE.quotes[P[G.mw].fid].characters-1):0)&&any)){

      if(!G.arc){if(any&&G.st>60){const mode=G.mode2p;startfight(P[0].fid,P[1].fid);G.mode2p=mode;}else{go('select');G.selstep=0;}break;}

      if(G.mw===1){G.cont=9;go('cont');break;}

      G.mapFrom=G.stage;if(++G.li>=G.ladder.length)go('end'); else if(VER.cur==='CE'&&window.SF2BONUS&&!G.mode2p&&G.mw===0&&(G.li===3||G.li===6||G.li===9))bonusinit(G.li/3-1); else arcadeVs();} break;

  case 'cont': if(ok&&G.st>20){sfxc(0x20,SN_BLOCK,0.4);go('vs');break;} if(n1&CONF)G.st+=20;

    if(G.st>=60){G.st=0;if(--G.cont<0)go('over');} break;

  case 'chal': if(G.st>=150){G.selstep=0;go('select');} break;   /* arcade: 'HERE COMES A NEW CHALLENGER' then 2P select */

  case 'over': if(G.st>=200||(G.st>60&&any))rankgo('title'); break;

  case 'rank': {const r=G.rk,e=RK[r.i];if(!r.done){if(n1&(K_U|K_D)){r.ch=(r.ch+(n1&K_U?1:RKC.length-1))%RKC.length;sfxc(VER.cur==='CE'&&0x21);}

    const a=e.n.split('');a[r.c]=RKC[r.ch];e.n=a.join('');if(ok||G.st>1800){sfxc(0x20,SN_BLOCK,0.4);if(++r.c>=3||G.st>1800){r.done=G.st;try{localStorage.setItem(rankStorageKey(),JSON.stringify(RK))}catch(x){}}else r.ch=0;}}

    else if(G.st-r.done>150)go(r.nx);} break;

  case 'end': {const e=endinfo();if(G.st>=(e?e.len+60:900)||(G.st>120&&any))rankgo('title');} break;

  }}

const BLUE='#000060';

function port(f,x,y,flip,dim,sc,alt){sc=sc||1;const FIM=alt&&FIA[f]&&FIA[f]!==FI[f]?FIA[f]:FI[f];cx.save();if(dim)cx.filter='brightness(40%) grayscale(60%)';

  if(f<8&&PORTI[f]){const im=PORTI[f],w=112*sc,h=96*sc;if(flip){cx.translate(x+w,y);cx.scale(-1,1);fimg(im,0,0,w,h);}else fimg(im,x,y,w,h);}

  else{const F=D.fighters[f],r=F.frames[F.anims[0].ents[0][0]],s=Math.min(1.25*sc,96*sc/r[3]);const w=r[2]*s,h=r[3]*s,X=x+56*sc-w/2,Y=y+96*sc-h;

    if(!flip){cx.translate(X+w,Y);cx.scale(-1,1);fimg(FIM,r[0],r[1],r[2],r[3],0,0,w,h);}else fimg(FIM,r[0],r[1],r[2],r[3],X,Y,w,h);}

  cx.restore();}

function ceSelectGrid(){return aiEnabled()&&damndSelectable()?[...CEGRID,...ffGuestIds().map(()=>10)]:CEGRID;}
function cecell(q){if(aiEnabled()&&damndSelectable())return q>=12?[80+32*((q-12)%7),192]:[96+32*(q%6),128+32*((q/6)|0)];return SCE?[96+32*(q%6),144+32*((q/6)|0)]:[96+32*(q%6),132+42*((q/6)|0)];}



function drawRyuVariantStrip(){

  if(!ryuVariantStrip())return;const state=ceFadeState();if(state&&!SF2CEFADE.view(state).objectsVisible)return;

  ceFill(BLUE,96,44,192,84,'object');cx.strokeStyle=state?SF2CEFADE.color('#ffe000',state,'object'):'#ffe000';cx.strokeRect(96.5,44.5,191,83);cx.beginPath();cx.moveTo(192,66);cx.lineTo(192,124);cx.stroke();

  const guest=G.sel[G.selstep]===10,ken=G.sel[G.selstep]===4,name=guest?'BALROG':ken?'KEN':'RYU';

  tx(name+' VARIANT',192,59,8,'#ffe000','#000');

  tx('PUNCH',144,79,8,'#fff','#000');tx(name,144,96,8,'#ffe000','#000');

  tx('KICK',240,79,8,'#fff','#000');tx(guest?'DAMND':'EVIL '+name,240,96,8,'#ffe000','#000');tx(guest?'FINAL FIGHT':ken?'HEAT STYLE':'PROTOTYPE',240,113,8,'#fff','#000');

}

function drawSelectionProfiles(){

  if(!aiEnabled()||!G.sel.some((fid,i)=>evilRyuSelected(i,fid)||evilKenSelected(i,fid)||guestSelected(i,fid)))return;

  for(const i of G.mode2p?[0,1]:[0])tx((i?'2P ':'1P ')+selectedProfileLabel(i,G.sel[i]),i?380:4,222,7,i?'#ff6060':'#80b0ff','#000',i?'right':'left');

}

function drawVsProfiles(a,b){

  if(!aiEnabled()||!evilRyuSelected(0,a)&&!evilRyuSelected(1,b)&&!evilKenSelected(0,a)&&!evilKenSelected(1,b)&&!guestSelected(0,a)&&!guestSelected(1,b))return;

  tx(selectedProfileLabel(0,a),96,204,8,'#fff','#000');tx(selectedProfileLabel(1,b),288,204,8,'#fff','#000');

}

function drawResultProfiles(w,l){

  if(!aiEnabled()||!P.some(p=>p.aiProfile==='evil-ryu'||isEvilKen(p)||isFFGuest(p)))return;

  const label=p=>p.aiProfile==='evil-ryu'?'EVIL RYU PROTOTYPE':aiName(p).toUpperCase();

  tx(label(P[0]),96,10,8,'#fff','#000');tx(label(P[1]),288,10,8,'#fff','#000');

}



function arcadeDefeated(){return G.arc&&!G.mode2p?[...new Set(G.ladder.slice(0,G.li))]:[];}
function aiSelectionName(e,slot,fid){if(!guestSelected(slot,fid)){dimg(e,0,false,'object');return;}tx(selectedProfileLabel(slot,fid),e.x+e.im.naturalWidth/2,e.y+e.im.naturalHeight-2,16,'#ffb060','#0044aa');}
function selce(){const bl=(G.tick>>4)&1;

  if(SCE&&SCE.bg.complete){if(!window.SF2CEWORLDMAP?.drawSelectBackground(cx,{defeated:arcadeDefeated(),activeFids:[G.sel[0]],image:(im,kind)=>ceFadeState()?SF2CEFADE.image(im,G.fade,kind):im}))fimg(SCE.bg,0,0);const a=SCE.f[G.sel[0]],two=G.mode2p,b=SCE.f[G.sel[1]];

    dimg(a.flag,0,false,'object');aiPortraitEntry(a.selL,0,G.sel[0],'selL');aiSelectionName(a.name,0,G.sel[0]);if(two){dimg(b.flag,0,false,'object');if(G.sel[0]===G.sel[1])aiPortraitEntry(b.selR,1,G.sel[1],'selR');else aiPortraitEntry(b.selL,1,G.sel[1],'selL',0,true);aiSelectionName(b.name2,1,G.sel[1]);}

    if(aiEnabled()&&damndSelectable()){
      ceFill(BLUE,96,128,192,96,'object');
      CEGRID.forEach((fid,q)=>{const [x,y]=cecell(q);fimgKind('object',SCE.bg,96+32*(q%6),144+32*((q/6)|0),32,32,x,y,32,32);});
      ffGuestIds().forEach((id,i)=>{const[x,y]=cecell(12+i),tile=ffPortrait(id,{width:32,height:32},'tile');ceFill('#17264c',x,y,32,32,'object');fimgKind('object',tile,x,y,32,32);cx.strokeStyle='#ffe000';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,31,31);});
    }

    for(const i of (two?[0,1]:[0])){if(i>G.selstep)continue;const [x,y]=cecell(G.cep[i]),c=SCE.cur[i?'2':'1'];if(i===G.selstep&&bl)continue;

      if(c&&c.im.complete)fimgKind('object',c.im,x+c.x,y+c.y);}   // the ROM's own 1P/2P cursor sprites

    drawRyuVariantStrip();drawSelectionProfiles();if(aiEnabled())tx('AI EDITION',W-54,8,8,'#ffe000','#000');

    return;}cx.fillStyle=BLUE;cx.fillRect(0,0,W,H);tx(aiEnabled()?'AI EDITION':'CHAMPION EDITION',W/2,18,12,'#ffb000','#600');tx('PLAYER SELECT',W/2,98,9,'#fff','#000');

  CEGRID.forEach((f,q)=>{const [x,y]=cecell(q),F=D.fighters[f],r=F.frames[F.anims[0].ents[0][0]],s=Math.min(38/r[3],30/r[2]);

    cx.fillStyle='#000';cx.fillRect(x+1,y+1,30,40);cx.strokeStyle='#ffb000';cx.lineWidth=1;cx.strokeRect(x+0.5,y+0.5,31,41);

    fimg(FI[f],r[0],r[1],r[2],r[3],x+16-r[2]*s/2,y+41-r[3]*s,r[2]*s,r[3]*s);});

  const show=G.mode2p?[0,1]:[0];

  for(const i of show){if(i>G.selstep)continue;const [x,y]=cecell(G.cep[i]);if(i===G.selstep&&bl)continue;

    cx.strokeStyle=i?'#f22':'#48f';cx.lineWidth=2;cx.strokeRect(x+1+i*2,y+1+i*2,30-i*4,40-i*4);tx(i?'2P':'1P',x+16,y+(i?38:10),8,i?'#f22':'#48f','#000');}

  port(G.sel[0],0,128-8,false);tx('1P',56,32,12,'#48f','#000');tx(NAMES[G.sel[0]].toUpperCase(),56,46,12,'#ffb000','#600');

  if(G.mode2p){port(G.sel[1],272,128-8,true,false,1,G.sel[0]===G.sel[1]);tx('2P',328,32,12,'#f22','#000');tx(NAMES[G.sel[1]].toUpperCase(),328,46,12,'#ffb000','#600');}

  drawRyuVariantStrip();drawSelectionProfiles();tx('Esc: title   Tab: '+(G.mode2p?'2P':'1P'),W/2,222,7,'#aaa');}

function cell(c){return c<8?[128+32*(c%4),144+40*((c/4)|0)]:[128+32*(c%4),102];}

function scenerender(){cx.fillStyle='#000';cx.fillRect(0,0,W,H);ceFill(BLUE,0,0,W,H);const t=G.st,bl=(G.tick>>4)&1;

  switch(G.scene){

  case 'title': if(TITLEI){fimg(TITLEI,0,0);cx.fillStyle='#000';cx.fillRect(0,158,W,H-158);}

    {const c=i=>G.menu===i?'#ffe000':'#888';tx('1P  ARCADE',W/2,166,10,c(0),'#000');tx('2P  VERSUS',W/2,178,10,c(1),'#000');

    tx('DIFFICULTY  < '+difficultyLabel()+' >',W/2,192,8,c(2),'#000');tx('TIME  < '+(G.rtime||'INF')+' >',W/2,203,8,c(3),'#000');

    tx('VERSION  < '+(G.wantce&&VER.cur!=='CE'?(VER.loading===3?'CE LOAD FAILED':'LOADING CE'):VER.edition==='ai'?'AI EDITION':VER.cur==='CE'?'CHAMPION EDITION':'WORLD WARRIOR')+' >',W/2,214,8,c(4),'#000');}

    break;

  case 'select': {if(aiEnabled()&&G.AIColor){aiColorDraw();break;}if(VER.cur==='CE'){selce();break;} if(SELI)fimg(SELI,0,0);

    if(G.mode2p){cx.fillStyle=BLUE;cx.fillRect(126,100,132,42);for(let j=8;j<12;j++){const [x,y]=cell(j),F=D.fighters[j],r=F.frames[F.anims[0].ents[0][0]],s=Math.min(36/r[3],30/r[2]);

      cx.fillStyle='#000';cx.fillRect(x+1,y+1,30,38);fimg(FI[j],r[0],r[1],r[2],r[3],x+16-r[2]*s/2,y+39-r[3]*s,r[2]*s,r[3]*s);}}

    for(let i=0;i<=Math.min(1,G.selstep+(G.mode2p?0:-1));i++){}

    const show=G.mode2p?[0,1]:[0];

    for(const i of show){if(i>G.selstep)continue;const c=G.sel[i],[x,y]=cell(c);if(i===G.selstep&&bl)continue;

      cx.strokeStyle=i?'#f22':'#48f';cx.lineWidth=2;cx.strokeRect(x+1+i*2,y+1+i*2,30-i*4,38-i*4);tx(i?'2P':'1P',x+16,y+(i?36:10),8,i?'#f22':'#48f','#000');}

    port(G.sel[0],0,128,false);tx('1P',56,112,12,'#48f','#000');tx(NAMES[G.sel[0]].toUpperCase(),56,126,12,'#ffb000','#600');

    if(G.mode2p&&G.selstep>=1||G.mode2p){port(G.sel[1],272,128,true);tx('2P',328,112,12,'#f22','#000');tx(NAMES[G.sel[1]].toUpperCase(),328,126,12,'#ffb000','#600');}

    tx(G.mode2p?(G.selstep?'PLAYER 2 SELECT':'PLAYER 1 SELECT'):'',W/2,98,8,'#fff','#000');

    tx('Esc: title   Tab: '+(G.mode2p?'2P':'1P'),W/2,222,7,'#aaa');break;}

  case 'map': if(G.map.FF){SF2AIFF.mapDraw(cx,G.map,G.AIFFLadder?.slice(0,G.li)||[]);tx('METRO CITY',192,20,12,'#ffe000','#000');tx(ffName(G.map.id).toUpperCase(),192,202,13,'#fff','#000');tx(G.map.id==='damnd'?'SLUM COURTYARD':SF2AIFF.get(G.map.id).district.toUpperCase(),192,218,8,'#ffb060','#000');break;}SF2CEWORLDMAP.draw(cx,G.map,{defeated:arcadeDefeated(),activeFids:[G.sel[0]],image:(im,kind)=>{const guest=aiEnabled()&&guestSelected(0,G.sel[0]),native=SCE.f[G.sel[0]];if(guest&&im.src===native.selL.im.src)return aiPortraitImage(im,0,G.sel[0],'selL');if(guest&&(im.src===native.name.im.src||im.src===native.flag.im.src))return null;return ceFadeState()?SF2CEFADE.image(im,G.fade,kind):im;}});if(aiEnabled()&&guestSelected(0,G.sel[0]))tx(ffName(guestSelected(0,G.sel[0])).toUpperCase(),48,108,9,'#fff','#000');drawSelectionProfiles();break;

  case 'vs': {const a=G.sel[0],b=G.arc?G.ladder[G.li]:G.sel[1],s=Math.min(1,t/20);

    if(VER.cur==='CE'&&SCE){ceFill(SCE.vsb,0,0,W,H);const A=SCE.f[a],B=SCE.f[b],o=Math.round((1-s)*200);

      aiPortraitEntry(A.vsL,0,a,'vsL',-o);if(a===b)aiPortraitEntry(B.vsR,1,b,'vsR',o);else aiPortraitEntry(B.vsL,1,b,'vsL',o,true);if(!guestSelected(0,a))dimg(A.vsname,0,false,'object');if(!guestSelected(1,b))dimg(B.vsname2,0,false,'object');if(t>20)dimg(SCE.logo);

      tx(guestSelected(0,a)?'METRO CITY':HOME[a],A.vsname?A.vsname.x+A.vsname.im.width/2:96,184,8,'#fff','#000');tx(guestSelected(1,b)?'METRO CITY':HOME[b],B.vsname2?B.vsname2.x+B.vsname2.im.width/2:288,184,8,'#fff','#000');

      if(G.arc){tx('STAGE '+(G.li+1)+' / '+G.ladder.length,W/2,20,9,'#fff','#000');}drawVsProfiles(a,b);break;}

    cx.fillStyle='#200000';cx.fillRect(0,0,W/2,H);cx.fillStyle='#000030';cx.fillRect(W/2,0,W/2,H);

    port(a,-168+176*s,48,false,false,1.5);port(b,W+8-176*s,48,true,false,1.5);

    tx(NAMES[a].toUpperCase(),90,40,16,'#ffb000','#600');tx(NAMES[b].toUpperCase(),294,40,16,'#ffb000','#600');

    if(t>20)tx('VS',W/2,124,40,'#ffe000','#c01000');

    tx(HOME[b],W/2,206,9,'#fff','#000');drawVsProfiles(a,b);

    if(G.arc){tx('STAGE '+(G.li+1)+' / '+G.ladder.length,W/2,20,9,'#fff','#000');for(let i=0;i<G.ladder.length;i++){cx.fillStyle=i<G.li?'#555':i===G.li?'#ffe000':'#fff';cx.fillRect(W/2-6*G.ladder.length+12*i+2,186,8,8);}}

    break;}

  case 'win': {const w=G.mw<0?0:G.mw,l=1-w,wf=P[w].fid,lf=P[l].fid;

    if(VER.cur==='CE'&&G.mw>=0&&CWIN&&CWIN[wf]&&CWIN[lf]){const a=CWIN[wf],b=CWIN[lf];

      if(a.win.complete&&a.win.naturalWidth&&b.lose.complete&&b.lose.naturalWidth&&a.quote.complete&&a.quote.naturalWidth){cx.fillStyle='#000';cx.fillRect(0,0,W,H);if(w===1){cx.save();cx.translate(W,0);cx.scale(-1,1);}if(window.SF2CEFADE){SF2CEFADE.drawPortrait(cx,aiPortraitImage(SF2CEFADE.mirrorWinner?.(w,wf,lf)||a.win,w,wf,'win'),ceFadeState(),0,0,16,wf);SF2CEFADE.drawPortrait(cx,aiPortraitImage(SF2CEFADE.mirrorLoser(w,wf,lf)||b.lose,l,lf,'lose'),ceFadeState(),1,192,16,lf);}else{fimg(aiPortraitImage(a.win,w,wf,'win'),0,16);fimg(aiPortraitImage(b.lose,l,lf,'lose'),192,16);}if(w===1)cx.restore();{const quote=isFFGuest(P[w])?null:ceFadeState()?SF2CEFADE.image(a.quote,G.fade,'object'):a.quote;if(isFFGuest(P[w])){tx(aiName(P[w]).toUpperCase()+' WINS',192,180,12,'#ffe000','#000');tx('NEXT CHALLENGER!',192,207,8,'#fff','#000');}if(quote){if(!window.SF2CEFADE?.drawQuote(cx,quote,wf,G.st))fimgKind('object',a.quote,0,160);}}drawResultProfiles(w,l);break;}}

    port(wf,24,40,false,false,1.5);port(lf,W-192,40,true,true,1.5);drawResultProfiles(w,l);

    tx(G.mw<0?'DRAW':(G.arc&&!G.mode2p?(w?'YOU LOSE':'YOU WIN'):NAMES[wf].toUpperCase()+' WINS'),W/2,32,20,'#ffe000','#a01000');

    if(G.arc&&w===0)tx(G.li+1>=G.ladder.length?'THE TOURNAMENT IS YOURS':'NEXT: '+(aiEnabled()&&G.AIFFLadder?.[G.li+1]?ffName(G.AIFFLadder[G.li+1]):NAMES[G.ladder[G.li+1]]).toUpperCase(),W/2,206,10,'#fff','#000');break;}

  case 'cont': port(G.sel[0],136,40,false,true,1);tx('CONTINUE?',W/2,40,22,'#ffe000','#a01000');tx(String(Math.max(0,G.cont)),W/2,182,40,'#fff','#c01000');

    tx('Start / punch to continue',W/2,214,8,'#aaa');break;

  case 'chal': cx.fillStyle='#000';cx.fillRect(0,0,W,H);if((G.st>>3)&1||G.st>48){tx('HERE COMES',W/2,90,22,'#ffe000','#a01000');tx('A NEW CHALLENGER!',W/2,124,22,'#ffe000','#a01000');}break;

  case 'rank': {cx.fillStyle='#000';cx.fillRect(0,0,W,H);tx('RANKING',W/2,30,22,'#ffe000','#a01000');const O=['1ST','2ND','3RD','4TH','5TH'];

    for(let i=0;i<5;i++){const y=64+i*28,hl=G.rk&&i===G.rk.i&&((t>>3)&1||G.rk.done),c=hl?'#fff':'#ff8020';txw(O[i],40,y,c,'#600','left');txw(String(RK[i].s),196,y,c,'#600');txw(RK[i].n,212,y,c,'#600','left');txw((NAMES[RK[i].f]||'').toUpperCase(),262,y,c,'#600','left');}break;}

  case 'over': cx.fillStyle='#000';cx.fillRect(0,0,W,H);tx('GAME OVER',W/2,118,30,'#ff2010','#600');break;

  case 'end': {if(aiEnabled()&&isFFGuest(P[0])){ceFill('#07122b',0,0,W,H);const art=ffPortrait(P[0].aiProfile,{width:128,height:128},'win');cx.drawImage(art,128,40);tx(aiName(P[0]).toUpperCase(),192,28,16,'#ffe000','#000');tx('WORLD TOUR CHAMPION',192,184,12,'#fff','#000');tx('METRO CITY AND THE WORLD CONQUERED',192,210,8,'#ffb060','#000');break;}cx.fillStyle='#000';cx.fillRect(0,0,W,H);const e=endinfo();if(e){let a=0,k=0;for(;k<e.frames.length-1;k++){a+=e.frames[k][1];if(a>t)break;}const im=endimg(e.frames[k][0]);G.endk=k;if(im.complete&&im.naturalWidth){fimg(im,0,0);break;}}

    const F=D.fighters[G.sel[0]],an=F.anims[AN_WIN],tk=t%(an.ents.reduce((s,e)=>s+e[1],0)||1);

    let i=0,acc=0;for(;i<an.ents.length-1;i++){acc+=an.ents[i][1];if(acc>tk)break;}

    spr(FI[G.sel[0]],F.frames[an.ents[i][0]],W/2,200,1);

    tx('CONGRATULATIONS!',W/2,40,22,'#ffe000','#a01000');tx(NAMES[G.sel[0]].toUpperCase()+' IS THE WORLD WARRIOR',W/2,64,11,'#fff','#000');

    if(t>120&&bl)tx('PRESS START',W/2,218,9,'#fff','#000');break;}

  }}

// ---- loop ----

let last=performance.now(),accum=0;

const FRMS=1000/59.637;  /* CPS1 vertical refresh (59.637Hz), the arcade game speed */

function loop(now){if(window.SF2.freeze){last=now;requestAnimationFrame(loop);return;}accum+=Math.min(250,now-last);last=now;let advanced=false;while(accum>=FRMS){step();accum-=FRMS;advanced=true;}if(!aiEnabled()||advanced)render();requestAnimationFrame(loop);}

window.SF2={health:{alive:hpAlive,damage:hpDamage},VER,setEdition,get edition(){return VER.edition;},aiRoom,aiViewWidth,get paused(){return CONTROL.paused;},clearInput:clearinput,boxw,setver,get FIA(){return FIA},get FI(){return FI},get IDEL(){return IDEL},set IDEL(v){IDEL=v;IQ.length=0},music,LVL,musOpts,MUSC,STM,get SN(){return SN},D,G,P,startfight,step,render,resetmatch,down,pads,snd,audioInit,SB,startarcade,matchend,bonusinit,get RK(){return RK},get cmdlog(){return G.cmdlog},soundStats};
window.SF2CESTAGEANIMATIONS?.setSound(sfxc);

// Online versus uses frame-numbered inputs supplied by the lobby's paired relay.

// Audio/rendering remain local; focus loss releases physical input without rewriting simulation state.

SF2.net={

  begin(options={}){

    if(aiEnabled())throw new Error('AI Edition online play is not enabled');

    if(!['WW','CE'].includes(options.version)||VER.cur!==options.version)throw new Error('Requested game version is not loaded');

    CONTROL.paused=false;SF2.freeze=1;netActive=true;rng=(options.seed>>>0)||0x2545F491;

    for(const key of Object.keys(G))delete G[key];Object.assign(G,JSON.parse(JSON.stringify(NET_BASE_G)));

    if(VER.edition==='ce')for(const p of P){const slot=p.i,opponent=p.opp;for(const key of Object.keys(p))delete p[key];Object.assign(p,mkp(slot),{opp:opponent});}

    Object.assign(G,{mode2p:1,arc:0,diff:1,ceDifficulty:3,rtime:[0,30,60,99].includes(options.time)?options.time:99,sel:[0,4],cep:[0,6],selstep:0});

    if(options.bot){const d=Math.max(0,Math.min(2,options.bot.difficulty|0));G.netBot={difficulty:d,fighter:Number.isInteger(options.bot.fighter)&&options.bot.fighter>=0&&options.bot.fighter<(options.version==='WW'?8:12)?options.bot.fighter:0};G.diff=[0,1,3][d];G.ceDifficulty=[0,3,7][d];}

    down.clear();tapped.clear();IQ.length=0;IDEL=0;gprev=0;selprev=[0,0];

    setfighter(P[0],0);setfighter(P[1],4);P[0].SCORE=P[1].SCORE=0;resetmatch();G.fade=null;goNow('select');render();

  },

  readInput(){const k=rk(P1K)|padRead(0).k|externalKey(0)|(held('Enter')||padRead(0).g&4?K_ATK:0);tapped.clear();return k&1023;},

  advance(pair){if(!netActive||!Array.isArray(pair)||pair.length!==2)throw new Error('No active synchronized match');let inputs=pair.map(k=>k&1023);if(G.netBot){let key=0;if(G.scene==='select'&&G.selstep===1&&G.tick%2===0){const goal=G.netBot.fighter,c=G.sel[1];if(c===goal)key=K_ATK;else if(VER.cur==='CE'){const q=G.cep[1],target=CEGRID.indexOf(goal);key=(q/6|0)!==(target/6|0)?K_U:q%6!==target%6?K_R:K_ATK;}else key=(c/4|0)!==(goal/4|0)?K_U:c%4!==goal%4?K_R:K_ATK;}inputs=[inputs[0],key];}step(inputs);},

  hash(){const omit=new Set(['F','opp','anim','ft','AIPC','_AI_SOURCE']);const players=P.map(p=>Object.fromEntries(Object.entries(p).filter(([k])=>!omit.has(k))));
    const gs=Object.fromEntries(Object.entries(G).filter(([k])=>!['hisc','sndlog','muslog','cmdlog','endk'].includes(k)));

    const text=JSON.stringify([gs,players,rng,IQ,selprev],(key,value)=>{if(value===P[0]||value===P[1])return {player:value.i};if(key==='anim'||key==='F'||key==='ft')return undefined;return value;});let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16).padStart(8,'0');},

  set replaying(value){netReplaying=!!value;if(!netReplaying&&MUS>=0){if(SN)SN.port.postMessage({c:MUS});else SNQ=[{c:MUS}];}},

  get active(){return netActive;}

};



async function setEdition(id,options={}){

  if(!['ww','ce','ai'].includes(id))throw new Error('Unknown edition');

  if(id==='ai'){const artwork=await Promise.all([SF2AIWEATHER.ready,SF2AISCENE.ready,SF2AIATMOSPHERE.ready]);if(artwork.some(ok=>!ok))throw new Error('AI scenery artwork could not load');}
  if(id==='ai'&&!aiAllowedFids().length)throw new Error('AI roster registry is unavailable');

  if(netActive)throw new Error('Leave the online match before changing edition');

  const oldAI=aiEnabled(),wasPrototype=AICFG.prototype;if(!options.prototype)AICFG.seed=null;if(id!=='ai'){delete G.AIMatchSeed;delete G.AIMatchSerial;delete G.AIViewWidth;delete G.AICamera;}
  captureEditionSettings();

  restoreEditionSettings(id);

  if(!options.prototype){try{localStorage.setItem('sf2:edition:v1',id);}catch{}}

  window.SF2AIWEATHER?.stop();VER.edition=id;G.wantce=id!=='ww';AICFG.selectedProfiles=[null,null];AICFG.colors=[null,null];delete G.AIColor;delete G.AINextMatchSeed;AICFG.prototype=!!options.prototype&&id==='ai';AICFG.configured=AICFG.prototype;

  for(const p of P)aiClearProfile(p);

  if(G.scene!=='title'){go('title');}CONTROL.paused=false;if(!options.keepMenuInput)clearinput();

  if(id==='ww')setver('WW',true);

  else{

    if(!VER.ce)loadce();

    const deadline=performance.now()+90000;

    while(VER.loading!==2){if(VER.loading===3||performance.now()>deadline)throw new Error('CE assets could not load');await new Promise(r=>setTimeout(r,25));}

    if(VER.edition!==id)return VER.edition;

    setver('CE',true);

    if(id==='ai'&&window.SF2AIEvilKenData&&window.SF2AIEvilKen&&!SF2AIEvilKen.ready)await SF2AIEvilKen.register(SF2AIEvilKenData,{native:VER.ce.f[4],makeAlt:altatlas});

  }

  try{const saved=JSON.parse(localStorage.getItem(rankStorageKey()));RK=validrank(saved)?saved:RKD.map(o=>({...o}));}catch{RK=RKD.map(o=>({...o}));}

  if(oldAI&&id!=='ai'){AI_DEATH_FX.length=0;aiBloodReset();}
  if(oldAI||id==='ai'){G.hisc=RK[0].s;for(const p of P)p.SCORE=0;}

  for(const p of P){setfighter(p,p.fid);setanim(p,AN_IDLE,0);}return VER.edition;

}

function cycleEdition(direction){const ids=['ww','ce','ai'];setEdition(ids[(ids.indexOf(VER.edition)+direction+3)%3],{keepMenuInput:true}).catch(e=>{console.error(e);});}



// Prototype controller API: explicit entry only; no arcade or faithful lobby.

function aiInfo(){return {

  cpu:P.map(p=>p.AICPU?{plan:p.AICPU.kind,decisions:p.AICPU.decisions}:null),
  facialInjury:P.map(aiFaceInjuryLevel),
  floorCoughs:AI_FLOOR_COUGHS.map(s=>s?{count:s.count,age:G.tick-s.landed}:null),
  teeth:AI_TEETH.map(r=>r?{age:G.tick-r.start}:null),
  retching:AI_RETCH.map(r=>r?{bloody:r.bloody,animation:SF2AIREELDATA.animations[r.selector].name,age:G.tick-r.start}:null),
  cinematic:aiSKOView(),
  blood:{clothes:AI_BLOOD.clothes.slice(),particles:AI_BLOOD.particles.length,stains:AI_BLOOD.stains.length,marks:AI_BLOOD.stains.map(s=>({...s}))},
  deathEffects:AI_DEATH_FX.map(f=>({slot:f.slot,trailSlot:f.trailSlot,special:f.special,emitter:'mouth',mouth:f.mouth?{...f.mouth}:null,age:G.tick-f.start,trails:f.trails.length,particles:f.particles.filter(p=>!p.landed&&G.tick-p.tick<p.life).length})),
  edition:VER.edition,prototype:AICFG.prototype||P.some(p=>p.aiProfile==='evil-ryu'),onlineEnabled:false,upstream:'f14f766',runtimeBaseline:'b3285',ready:VER.cur==='CE'&&VER.loading===2,

  configured:aiEnabled(),training:AICFG.training,mode:AICFG.mode,dummy:AICFG.dummy,sound:!muted,

  scene:G.scene,phase:G.scene==='win'?'result':G.gph===0?'intro':G.gph===1?'fight':'round-over',

  arena:aiFFStage()?(isDamnd(P[1])?SF2AIDamndStage.name:SF2AIFF.get(P[1].aiProfile).district):null,selection:G.sel.map((fid,i)=>({fid,profile:guestSelected(i,fid)|| (evilRyuSelected(i,fid)?'evil-ryu':CE_KEYS[fid]),label:selectedProfileLabel(i,fid)})),

  round:G.round,winner:G.scene==='win'?G.mw:null,winnerName:G.scene==='win'&&G.mw>=0?aiName(P[G.mw]):null,tick:G.tick,hitstop:G.hfz||0,

  rift:{...RIFT,total:RIFT.startup+RIFT.travel+RIFT.recovery},

  players:P.map(p=>({slot:p.i,profile:p.aiProfile||CE_KEYS[p.fid],fighterKey:p.fighterKey||'ce:'+CE_KEYS[p.fid],name:aiName(p),

    hp:p.HP,maxHP:aiMax(p),healthRatio:p.HP/aiMax(p),perfect:p.HP===aiMax(p),wins:p.WINS,

    breaker:{window:aiEnabled()&&SF2AICHAIN.breakerWindow(p,G.tick),remaining:Math.max(0,SF2AICHAIN.BREAK_WINDOW-(G.tick-(p.AIComboBreaker?.opened??-999))),invulnerable:Math.max(0,(p.AIComboBreakInvuln||0)-G.tick)},chain:p.AIChain?{usedMask:p.AIChain.used,cycles:p.AIChain.cycles,cancels:p.AIChain.cancels,queued:p.AIChain.queued?.button??null}:null,state:p.ST,x:p.X/256,y:p.Y/256,attackSerial:p.AIAttackSerial,confirmed:p.AIConfirm===p.AIAttackSerial,

    rift:p.AIRift?{...p.AIRift,startX:p.AIRift.startX/256}:null,

    combo:p.AICombo?{...p.AICombo}:null,evilKen:isEvilKen(p)?{heat:{...p.AIEvilKen.adapter.heat},attack:p.AIEvilKen.attack,pose:p.AIEvilKen.pose,metrics:{...p.AIEvilKen.metrics}}:null,metrics:p.AIMetrics?JSON.parse(JSON.stringify(p.AIMetrics)):null}))

};}

function aiStart(){

  if(!aiEnabled()||!AICFG.prototype||VER.cur!=='CE')throw new Error('Configure AI Edition before starting');

  if(AICFG.seed!==null&&AICFG.seed!==undefined){rng=(AICFG.seed>>>0)||0x2545F491;for(const key of Object.keys(G))delete G[key];Object.assign(G,JSON.parse(JSON.stringify(NET_BASE_G)));G.st=G.tick=0;G.fade=null;G.AIMatchSerial=0;for(const p of P){const slot=p.i,opponent=p.opp;for(const key of Object.keys(p))delete p[key];Object.assign(p,mkp(slot),{opp:opponent});}}
  clearinput();G.arc=0;G.mode2p=AICFG.training?AICFG.dummy!=='cpu'?1:0:AICFG.mode==='versus'?1:0;

  G.rtime=AICFG.training?0:99;G.mw=-1;G.aicool=20;G.aidelay=G.aipend=0;G.stage=0;

  startfight(AI_PROFILES[AICFG.profiles[0]].baseFighterId||0,AI_PROFILES[AICFG.profiles[1]].baseFighterId||0);P.forEach(p=>{p.SCORE=0;if(p.aiProfile==='evil-ryu')p.AIAtlas=FIA[0];});

  window.SF2.freeze=0;render();return aiInfo();

}

window.SF2AI={

  async registerDevelopmentProfile(id,data){if(id!=='evil-ken'||!window.SF2AIEvilKen)throw new Error('Evil Ken adapter is not loaded');const deadline=performance.now()+90000;while(VER.loading!==2){if(VER.loading===3||performance.now()>deadline)throw new Error('CE dependency load failed');await new Promise(r=>setTimeout(r,25));}return SF2AIEvilKen.register(data,{native:VER.ce.f[4],makeAlt:altatlas});},

  async configure(options={}){

    if(options.seed!==undefined&&(!Number.isInteger(options.seed)||options.seed<0||options.seed>0xffffffff))throw new Error('Invalid AI match seed');
    for(const key of ['p1','p2'])if(options[key]!==undefined&&!Object.hasOwn(AI_PROFILES,options[key]))throw new Error('Unknown AI fighter '+options[key]);

    if(options.mode!==undefined&&!['cpu','versus'].includes(options.mode))throw new Error('Unknown prototype mode');

    if(options.dummy!==undefined&&!['stand','block','cpu'].includes(options.dummy))throw new Error('Unknown training dummy');

    await setEdition('ai',{prototype:true});

    if([options.p1,options.p2].includes('evil-ken')&&!window.SF2AIEvilKen?.ready)throw new Error('Register the reviewed Evil Ken pack before configuring it');

    const deadline=performance.now()+90000;

    while(VER.loading!==2){if(VER.loading===3||performance.now()>deadline)throw new Error('CE dependency load failed');await new Promise(r=>setTimeout(r,25));}

    setver('CE',true);await Promise.all([...FI.map(im=>im.decode()),SF2AIDamnd.ready,SF2AIFF.ready]);

    AICFG.seed=options.seed??null;AICFG.profiles=[options.p1||'evil-ryu',options.p2||'ryu'];AICFG.training=options.training!==false;
    AICFG.mode=options.mode||'versus';AICFG.dummy=options.dummy||'stand';AICFG.configured=true;AICFG.prototype=true;

    return aiStart();

  },

  setSound(on){muted=!on;audioInit();if(MG)MG.gain.value=muted?0:1;return !muted;},

  clearInput(){clearinput();},

  start:aiStart,
  async startArcade(profile='ryu'){await this.configure({p1:profile,p2:'ryu',training:false,mode:'cpu',dummy:'cpu'});AICFG.selectedProfiles=[profile,null];AICFG.prototype=false;startarcade(P[0].fid);return aiInfo();},

  resetRound(){

    if(!aiEnabled())throw new Error('AI Edition is not selected');

    clearinput();if(G.scene!=='fight'){return aiStart();}

    resetround();P.forEach(p=>{p.SCORE=0;});window.SF2.freeze=0;render();return aiInfo();

  },

  setDummy(value){if(!['stand','block','cpu'].includes(value))throw new Error('Unknown training dummy');

    AICFG.dummy=value;if(AICFG.prototype&&AICFG.training)G.mode2p=value==='cpu'?0:1;P[1].KEYS=P[1].PREV=P[1].FORCE=0;G.aicool=20;G.aidelay=G.aipend=0;return aiInfo();},

  get info(){return aiInfo();},getInfo:aiInfo,

  debug:{stepInputs(pair,frames=1){if(!aiEnabled())throw new Error('Select AI Edition first');

    if(!Array.isArray(pair)||pair.length!==2||pair.some(n=>!Number.isInteger(n)||n<0||n>1023)||!Number.isInteger(frames)||frames<1||frames>600)throw new Error('Invalid frame input');

    for(let i=0;i<frames;i++)step(pair);return aiInfo();}}

};

resetmatch();

Promise.all([...STI.flat(),FXI,...FI,...SCRI,...CEFXI.filter(Boolean),...AI_REEL_IMAGES,...AI_IMPACT_IMAGES,...Object.values(CWIN||{}).flatMap(f=>Object.values(f))].map(i=>i.decode()).concat([window.SF2CESPECIAL?.ready,window.SF2CEDHALSIM?.ready,window.SF2CEHONDAHANDS?.ready,window.SF2CEVEGA?.ready,window.SF2CEROUND?.ready,window.SF2CEDIZZY?.ready,window.SF2CEWINNER?.ready,window.SF2CEWORLDMAP?.ready,window.SF2CEFADE?.ready,window.SF2CEPROJECTILES?.ready,window.SF2CEBARRELPLAYER?.ready,window.SF2CECAMERA?.ready,window.SF2CESTAGECYCLISTS?.ready,window.SF2CESTAGEBOAT?.ready,window.SF2CESTAGEBIRDS?.ready,window.SF2CESTAGEWATER?.ready,window.SF2CESTAGEDANCERS?.ready,window.SF2CESTAGEANIMATIONS?.ready,window.SF2CESTAGESCROLL?.ready,window.SF2CESTAGEPALETTES?.ready].filter(Boolean))).then(()=>{render();requestAnimationFrame(loop);});

/* CE is the default version: start loading it at once (WW stays selectable on the title) */

restoreEditionSettings('ce');G.wantce=1;loadce();

try{const query=new URLSearchParams(location.search),explicit=query.get('edition');let saved=null;try{saved=localStorage.getItem('sf2:edition:v1');}catch{}const edition=['ww','ce','ai'].includes(explicit)?explicit:query.has('online')?null:saved;if(['ww','ce','ai'].includes(edition)){if(explicit==='ai'&&query.get('mode')==='arcade')SF2AI.startArcade(Object.hasOwn(AI_PROFILES,query.get('fighter'))?query.get('fighter'):'ryu').catch(console.error);else if(explicit==='ai'&&(ffGuestIds().includes(query.get('fighter'))||ffGuestIds().includes(query.get('opponent'))))SF2AI.configure({p1:Object.hasOwn(AI_PROFILES,query.get('fighter'))?query.get('fighter'):'ryu',p2:Object.hasOwn(AI_PROFILES,query.get('opponent'))?query.get('opponent'):'ken',training:false,mode:'cpu',dummy:'cpu'}).catch(console.error);else if(explicit==='ai'&&query.get('prototype')==='evil-ryu')SF2AI.configure({p1:'evil-ryu',p2:'ryu',training:query.get('mode')==='practice',mode:query.get('mode')==='versus'?'versus':'cpu',dummy:['stand','block','cpu'].includes(query.get('dummy'))?query.get('dummy'):'stand'}).catch(console.error);else setEdition(edition).catch(console.error);}}catch(e){console.error(e);}

