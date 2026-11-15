/* Main arcade input adapter. All screen selection stays in the shared engine. */
'use strict';
(()=>{
  const input=window.SF2Input||(window.SF2Input={keys:[0,0],commands:[]});
  const canvas=document.getElementById('c');if(!canvas)return;
  const held=new Map(),released=new Map(),taps=new Map();
  const host=document.createElement('div');host.id='sf2-touch-controls';
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{display:block;width:min(100%,720px);box-sizing:border-box;padding:6px max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));color:#eee;background:#080808;font:12px sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}
    :host([hidden]){display:none}
    button{appearance:none;border:1px solid #777;border-radius:5px;color:#eee;background:#202020;min-width:42px;min-height:42px;font:inherit;font-weight:bold;touch-action:none;padding:6px}
    button:focus-visible{outline:2px solid #ffe000;outline-offset:1px}
    button[aria-pressed=true]{background:#666;color:#fff;border-color:#ffe000}
    .commands{display:flex;justify-content:center;gap:8px;margin-bottom:6px}.commands button{min-height:32px;min-width:78px}
    .play{display:flex;justify-content:space-between;align-items:center;gap:12px}.dpad{display:grid;grid-template-columns:repeat(3,42px);gap:3px}.neutral{display:grid;place-items:center;color:#777}
    .attacks{display:grid;grid-template-columns:repeat(3,minmax(42px,1fr));gap:5px;max-width:270px;flex:1}.attacks button{min-height:52px}
    @media(max-width:360px){:host{padding-left:4px;padding-right:4px}.play{gap:7px}.dpad{grid-template-columns:repeat(3,38px);gap:2px}button{min-width:38px;min-height:38px}.attacks{gap:3px}.attacks button{min-height:48px}}
  </style>
  <div class="commands" role="group" aria-label="Arcade menu controls">
    <button type="button" data-command="confirm" aria-label="Start or confirm">START</button>
    <button type="button" data-command="back" aria-label="Back">BACK</button>
    <button type="button" data-command="pause" aria-label="Pause or resume">PAUSE</button>
  </div>
  <div class="play">
    <div class="dpad" role="group" aria-label="Player 1 directions">
      <button type="button" data-key="5" aria-label="Up left">↖</button><button type="button" data-key="4" aria-label="Up">↑</button><button type="button" data-key="6" aria-label="Up right">↗</button>
      <button type="button" data-key="1" aria-label="Left">←</button><span class="neutral" aria-hidden="true">•</span><button type="button" data-key="2" aria-label="Right">→</button>
      <button type="button" data-key="9" aria-label="Down left">↙</button><button type="button" data-key="8" aria-label="Down">↓</button><button type="button" data-key="10" aria-label="Down right">↘</button>
    </div>
    <div class="attacks" role="group" aria-label="Player 1 attacks">
      <button type="button" data-key="16" aria-label="Light punch">LP</button><button type="button" data-key="32" aria-label="Medium punch">MP</button><button type="button" data-key="64" aria-label="Heavy punch">HP</button>
      <button type="button" data-key="128" aria-label="Light kick">LK</button><button type="button" data-key="256" aria-label="Medium kick">MK</button><button type="button" data-key="512" aria-label="Heavy kick">HK</button>
    </div>
  </div>`;
  canvas.after(host);
  const buttons=[...root.querySelectorAll('[data-key]')],dpad=root.querySelector('.dpad');
  function update(){
    let mask=0;for(const p of [...held.values(),...released.values()])mask|=p.mask;input.keys[0]=mask;
    for(const b of buttons){const key=+b.dataset.key;b.setAttribute('aria-pressed',String((mask&key)===key));}
  }
  function clear(){held.clear();released.clear();taps.clear();update();}
  input.clearHeld=clear;
  function command(value){clear();if(input.commands.length<64)input.commands.push(value);}
  function wake(){window.SF2?.audioInit?.();}
  function directionAt(x,y){const e=root.elementFromPoint(x,y);return e&&dpad.contains(e)?+(e.closest('[data-key]')?.dataset.key||0):0;}
  dpad.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();wake();
    released.delete(e.pointerId);held.set(e.pointerId,{kind:'direction',mask:+(e.target.closest('[data-key]')?.dataset.key||0)});dpad.setPointerCapture(e.pointerId);update();
  });
  dpad.addEventListener('pointermove',e=>{const p=held.get(e.pointerId);if(p?.kind==='direction'){p.mask=directionAt(e.clientX,e.clientY);update();}});
  for(const b of root.querySelectorAll('.attacks button'))b.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();wake();released.delete(e.pointerId);held.set(e.pointerId,{kind:'attack',mask:+b.dataset.key});b.setPointerCapture(e.pointerId);update();
  });
  root.addEventListener('pointerup',e=>{
    const p=held.get(e.pointerId);if(!p)return;held.delete(e.pointerId);released.set(e.pointerId,p);update();
    // A tap shorter than one simulation frame still reaches the shared input.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(released.get(e.pointerId)===p){released.delete(e.pointerId);update();}}));
  });
  for(const event of ['pointercancel','lostpointercapture'])root.addEventListener(event,e=>{if(held.delete(e.pointerId))update();});
  for(const b of root.querySelectorAll('[data-command]')){
    b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();wake();command(b.dataset.command);});
    b.addEventListener('click',e=>{if(e.detail===0){wake();command(b.dataset.command);}});
  }
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{if(e.button===0)taps.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  canvas.addEventListener('pointercancel',e=>taps.delete(e.pointerId));
  canvas.addEventListener('pointerup',e=>{
    const start=taps.get(e.pointerId);taps.delete(e.pointerId);
    if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>14)return;
    const width=window.SF2Graphics?.width||384,height=window.SF2Graphics?.height||224;
    const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/width,r.height/height);
    const x=(e.clientX-r.left-(r.width-width*scale)/2)/scale,y=(e.clientY-r.top-(r.height-height*scale)/2)/scale;
    if(x>=0&&x<width&&y>=0&&y<height){wake();command({type:'point',x,y});}
  });
  addEventListener('blur',clear);addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  const coarse=matchMedia('(pointer: coarse)');
  function visibility(){host.hidden=!(coarse.matches||navigator.maxTouchPoints>0);if(host.hidden)clear();}
  coarse.addEventListener?.('change',visibility);visibility();update();
})();
