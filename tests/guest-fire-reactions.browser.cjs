const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[],shots={};
  for(const target of['damnd','andore','abigail','sodom','rolento','edi','belger'])for(const side of[0,1])for(const move of['psycho','flame'])for(const air of[false,true])for(const fatal of[false,true]){
   FIN.clear('fire-test');await SF2AI.configure({p1:side?target:'ryu',p2:side?'ryu':target,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.hfz=G.slow=0;const w=P[side],d=w.opp;AICFG.selectedProfiles[side]=null;setfighter(w,move==='psycho'?8:7);resetround();G.gph=1;
   w.WINS=d.WINS=0;w.X=360*256;d.X=w.X+(side?-90:90)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;d.HP=fatal?1:aiMax(d);d.STP=d.DIZZY=0;if(air){d.Y=42*256;d.ST=2;d.VY=d.VX=d.AX=d.AY=0;setanim(d,5,0);}
   const starts=[],original=SF2CESPECIAL.start;SF2CESPECIAL.start=function(p,reaction,dir,h,dead){if(p===d)starts.push({tick:G.tick,code:reaction.reactionCode,fatal:!!dead,hp:p.HP,height:p.Y/256});return original(p,reaction,dir,h,dead);};
   const accepted=startspec(w,[],(2<<4)|1);let seen=false,blue=0,warm=0,same=true,identity=true,names=[],phase=null;
   for(let n=0;n<500;n++){
    SF2.step([0,0]);if(d.CESpecial&&d.anim.name.startsWith('ceDizzy')){const visible=fighterArtBase0(d),own=ffArt(d);identity&&=visible.image===own.image&&JSON.stringify(visible.rect)===JSON.stringify(own.rect);}const native=SF2CESPECIAL.art(d,false);if(native&&d.anim.name.startsWith('ceSpecialBurn')){
     const render=fighterArtBase0(d);same&&=render.image===native.image&&JSON.stringify(render.rect)===JSON.stringify(native.rect);names.push(d.anim.name);
     if(!seen){seen=true;const r=native.rect,c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.drawImage(native.image,...r.slice(0,4),0,0,c.width,c.height);const pixels=g.getImageData(0,0,c.width,c.height).data;for(let k=0;k<pixels.length;k+=4)if(pixels[k+3]){if(pixels[k+2]>pixels[k]+40&&pixels[k+2]>100)blue++;if(pixels[k]>150&&pixels[k]>pixels[k+2]+50)warm++;}
      if(target==='andore'&&side===0&&!fatal){SF2CECAMERA.latch(P);SF2.render();shots[move+(air?'-air':'-ground')]=window.c.toDataURL();}
     }
    }
    if(seen&&!d.CESpecial&&!fatal){phase=d.ST;break;}
    if(fatal&&seen&&d.CEKO?.ready){phase=d.ST;break;}
   }
   SF2CESPECIAL.start=original;rows.push({target,side,move,air,fatal,accepted,seen,same,identity,blue,warm,starts,names:[...new Set(names)],victimHP:d.HP,endState:d.ST,recovered:!d.CESpecial||!!d.CEKO?.ready,phase});
  }
  return{rows,shots};
 });
 for(const [name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('guest-fire-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('guest-fire-reactions.json'),JSON.stringify({result,errors},null,2));const bad=result.rows.filter(r=>!r.accepted||!r.seen||!r.same||!r.identity||r.starts.length!==1||r.starts[0].code!==(r.move==='psycho'?34:24)||(r.move==='psycho'?!r.blue:r.warm===0));console.log(JSON.stringify({cases:result.rows.length,bad,errors},null,2));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);for(const r of result.rows){if(r.fatal)assert.equal(r.starts[0].hp,0);else assert.ok(r.recovered,JSON.stringify(r));}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
