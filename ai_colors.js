/* AI Edition selection only. Choices are palette parameters, never sprite edits. */
'use strict';
window.SF2AICOLORS=(()=>{
 const clothes=['RANDOM','ORIGINAL','RED','ORANGE','YELLOW','LIME','GREEN','MINT','CYAN','BLUE','INDIGO','PURPLE','MAGENTA','PINK'];
 const skinNames=['RANDOM','ORIGINAL','NEAR BLACK','DARK BROWN','BROWN','WARM BROWN','TAN','OLIVE','GOLDEN TAN','LIGHT TAN','PALE','NEAR WHITE','SPECIAL GREY','SPECIAL GREEN','SPECIAL RED'];
 function create(slot,choice){return{slot,row:0,clothing:choice?.clothing??-1,skin:choice?.skin??-1};}
 function cycle(s,row,d){const key=row?'skin':'clothing',n=row?13:12,values=[-1,-2,...Array.from({length:n},(_,i)=>i)];s[key]=values[(values.indexOf(s[key])+d+values.length)%values.length];}
 function label(value,names){return names[value===-1?0:value===-2?1:value+2];}
 // Cycle Random, Original, then material presets.
 function step(s,keys){if(keys&4)s.row=(s.row+2)%3;if(keys&8)s.row=(s.row+1)%3;if(s.row<2&&keys&3)cycle(s,s.row,keys&2?1:-1);return !!(keys&1008);}
 function point(s,x,y){if(x<148||x>366)return null;if(y>=185&&y<208)return'back';if(y>=157&&y<183)return'confirm';const row=y>=51&&y<100?0:y>=101&&y<151?1:-1;if(row<0)return null;s.row=row;
  if(y>=(row?132:84)){const count=row?13:12,index=Math.floor((x-153)/(row?15:17));if(index>=0&&index<count)s[row?'skin':'clothing']=index;}
  else if(x<181)cycle(s,row,-1);else if(x>=337)cycle(s,row,1);else s[row?'skin':'clothing']=-1;return null;}
 function draw(ctx,s,p,image,sourcePalette,seed,text){
  ctx.fillStyle='#101824';ctx.fillRect(12,6,360,212);ctx.strokeStyle='#e5bd62';ctx.strokeRect(12.5,6.5,359,211);
  text((s.slot?'2P ':'1P ')+p.profileName.toUpperCase(),192,23,10,'#fff','#000');text('CHOOSE COLOURS',192,39,9,'#ffe000','#000');
  const choice={clothing:s.clothing,skin:s.skin},old=p.AIPalette,oldKey=p.AIPaletteKey,oldChoice=p.AIColorChoice;p.AIColorChoice=choice;p.AIPalette=SF2AIRULES.colors(p.F.pal,seed,p.fighterKey,p.i,choice);p.AIPaletteKey='select:'+seed+':'+p.fighterKey+':'+p.i+':'+s.clothing+':'+s.skin;
  const art=SF2AIRULES.sprite(p,image,sourcePalette),r=p.F.frames[p.F.anims[0].ents[0][0]],z=Math.min(1.5,118/r[2],144/r[3]);ctx.imageSmoothingEnabled=false;ctx.drawImage(art,r[0],r[1],r[2],r[3],78-r[2]*z/2,188-r[3]*z,r[2]*z,r[3]*z);p.AIPalette=old;p.AIPaletteKey=oldKey;p.AIColorChoice=oldChoice;
  for(let row=0;row<2;row++){const y=row?114:64;ctx.fillStyle=s.row===row?'#334760':'#202b3b';ctx.fillRect(148,y-14,216,46);text(row?'SKIN TONE':'CLOTHING',256,y-3,7,'#aaa','#000');text('<',164,y+11,10,'#ffe000','#000');text(label(s[row?'skin':'clothing'],row?skinNames:clothes),256,y+11,8,'#fff','#000');text('>',348,y+11,10,'#ffe000','#000');
   for(let i=0;i<(row?13:12);i++){const x=153+i*(row?15:17);ctx.fillStyle=row?'rgb('+SF2AIRULES.TONES[i].join(',')+')':'hsl('+i*30+' 75% 55%)';ctx.fillRect(x,y+20,(row?12:14),10);if(s[row?'skin':'clothing']===i){ctx.strokeStyle='#fff';ctx.strokeRect(x-.5,y+19.5,(row?13:15),11);}}
  }
  ctx.fillStyle=s.row===2?'#516039':'#273e30';ctx.fillRect(148,157,216,25);text('READY / CONFIRM',256,173,9,'#ffe000','#000');text('BACK TO FIGHTER',256,201,8,'#ccc','#000');text('UP/DOWN ROW  LEFT/RIGHT COLOUR',192,214,6,'#aaa','#000');
 }
 return{create,cycle,step,point,draw,clothes,skinNames};
})();
