/* Original Sodom front weapon objects. Mode-20 emitter 016C56/016CCE
   writes the weapon tiles before the body. CPS object priority puts those
   earlier objects in front; the preview raster covered the second katana.
   See FF-BOSSES.md for native-image and palette provenance. */
'use strict';
window.SF2AISodomBlades=(()=>{
 const layers={"2":[1,1,76,77,-52,-112],"3":[79,1,76,77,-52,-112],"4":[157,1,76,77,-52,-113],"5":[235,1,76,77,-52,-114],"6":[313,1,76,77,-52,-112],"7":[391,1,76,77,-52,-113],"8":[469,1,76,77,-52,-114],"10":[547,1,20,23,21,-71],"11":[569,1,20,23,21,-73],"12":[591,1,20,23,21,-75],"13":[613,1,20,23,21,-73],"14":[635,1,20,23,21,-71],"15":[657,1,20,23,21,-73],"16":[679,1,20,23,21,-75],"17":[701,1,20,23,21,-73],"18":[723,1,84,92,-64,-127],"19":[809,1,109,51,-89,-86],"20":[920,1,100,38,-80,-66]},image=new Image();image.src='ai-ff/sodom-front-blades.png?v='+(window.SF2BUILD?.commit||'sodom-native-two-blades-1');const ready=image.decode();
 function apply(pack,f){
  if(pack.id!=='sodom'||pack.sodomBladeBase)return;
  const source=pack.image;
  const placements=Object.keys(layers).map(i=>({frame:+i,source:+i,shiftX:0,shiftY:0}));
  // Generated low slashes retain their approved waist registration. Draw the native
  // weapon objects after joining the body so neither katana is cut at the waist.
  for(let b=3;b<6;b++){const a=f.sodomArmed[14+b];for(const e of a.ents)if(e[6]?.[2]>0&&e[0]!==f.sodomDoubleLow.frame&&!placements.some(p=>p.frame===e[0]))placements.push({frame:e[0],source:19,shiftX:f.sodomCrouchJoin.shiftX,shiftY:f.sodomCrouchJoin.shiftY});}
  placements.push({frame:f.sodomDoubleLow.frame,source:20,shiftX:f.sodomDoubleLow.shiftX,shiftY:f.sodomDoubleLow.shiftY});
  // Extend only a crop whose original weapon pixels exceed its old bounds.
  // Copy its body at the same actor coordinates; the physical pivot stays fixed.
  const bounds=[];let nextY=source.height+1;
  for(const p of placements){const r=f.frames[p.frame],l=layers[p.source],left=Math.min(r[4],l[4]+p.shiftX),top=Math.min(r[5],l[5]+p.shiftY),right=Math.max(r[4]+r[2],l[4]+p.shiftX+l[2]),bottom=Math.max(r[5]+r[3],l[5]+p.shiftY+l[3]);if(left!==r[4]||top!==r[5]||right!==r[4]+r[2]||bottom!==r[5]+r[3]){const to=[1,nextY,right-left,bottom-top,left,top];bounds.push({frame:p.frame,from:[...r],to});f.frames[p.frame]=to;nextY+=to[3]+2;}}
  const base=document.createElement('canvas');base.width=source.width;base.height=nextY;const bg=base.getContext('2d');bg.drawImage(source,0,0);for(const p of bounds){const a=p.from,b=p.to;bg.drawImage(source,...a.slice(0,4),b[0]+a[4]-b[4],b[1]+a[5]-b[5],a[2],a[3]);}
  const atlas=document.createElement('canvas');atlas.width=base.width;atlas.height=base.height;const g=atlas.getContext('2d');g.drawImage(base,0,0);
  for(const p of placements){const r=f.frames[p.frame],l=layers[p.source];g.save();g.beginPath();g.rect(r[0],r[1],r[2],r[3]);g.clip();g.drawImage(image,...l.slice(0,4),r[0]-r[4]+l[4]+p.shiftX,r[1]-r[5]+l[5]+p.shiftY,l[2],l[3]);g.restore();}
  pack.sodomBladeBase=base;pack.image=atlas;f.sodomBladeLayers=placements;f.sodomBladeBounds=bounds;
 }
 function artImage(pack,player){return(player.AIFFSword?pack.sodomBladeBase:pack.image)||pack.image;}
 function sync(pack,player){player.AIAtlas=player.AIAtlasAlt=artImage(pack,player);}
 return{ready,apply,artImage,sync,layers};
})();
