const $=id=>document.getElementById(id);
const state={mode:'practice',ready:false,busy:false,sound:false};
let controller=null;
const settingsKey='sf2:ai:rift-v1:settings';
const modeButtons=[...document.querySelectorAll('[data-mode]')];
const build=window.SF2AIBUILD||{version:'ai-development',commit:'local',editionId:'ai'};
window.SF2BUILD=build;
window.SF2AI_ASSET_BASE='vendor/';
$('build-version').textContent=build.version+' · '+build.commit.slice(0,8);

function script(path){return new Promise((resolve,reject)=>{
  const e=document.createElement('script');e.src=path+'?v='+encodeURIComponent(build.commit);
  e.onload=resolve;e.onerror=()=>reject(new Error('Could not load '+path));document.head.appendChild(e);
});}
function options(){return {p1:$('player-one').value,p2:$('player-two').value,training:state.mode==='practice',mode:state.mode==='versus'?'versus':'cpu',dummy:state.mode==='cpu'?'cpu':$('dummy').value};}
function setMode(mode){
  state.mode=mode;modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('dummy-control').hidden=mode!=='practice';$('start').textContent=mode==='practice'?'Start practice':'Start match';
}
function save(){try{localStorage.setItem(settingsKey,JSON.stringify({mode:state.mode,p1:$('player-one').value,p2:$('player-two').value,dummy:$('dummy').value}));}catch{}}
async function start(){
  if(!state.ready||state.busy)return;state.busy=true;$('start').disabled=true;
  try{await SF2AI.configure(options());controller?.afterConfigure();save();$('loading').hidden=true;}
  catch(e){showError(e);}
  finally{state.busy=false;$('start').disabled=!state.ready;}
}
function showError(error){$('loading').hidden=false;$('loading').textContent='The prototype could not start. '+error.message;console.error(error);}
modeButtons.forEach(button=>button.addEventListener('click',()=>{setMode(button.dataset.mode);start();}));
$('start').addEventListener('click',()=>{controller?.resume();start();});
$('reset').addEventListener('click',()=>{if(state.ready){controller?.resume();SF2AI.resetRound();controller?.afterConfigure();}});
$('dummy').addEventListener('change',()=>{if(state.ready)SF2AI.setDummy($('dummy').value);save();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game').requestFullscreen();}catch{}});
function toggleSound(){
  if(!state.ready)return;const active=SF2AI.setSound?SF2AI.setSound(!state.sound):null;
  if(active!==null)state.sound=!!active;else{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM'}));dispatchEvent(new KeyboardEvent('keyup',{code:'KeyM'}));state.sound=!state.sound;}
  $('sound').textContent='Sound: '+(state.sound?'on':'off');
}
$('sound').addEventListener('click',toggleSound);
window.addEventListener('keydown',e=>{if(state.ready&&e.code==='KeyM')setTimeout(()=>{if(SF2AI.info?.sound!==undefined){state.sound=SF2AI.info.sound;$('sound').textContent='Sound: '+(state.sound?'on':'off');}},0);});

try{
  const saved=JSON.parse(localStorage.getItem(settingsKey)||'null');
  if(saved&&['practice','cpu','versus'].includes(saved.mode)&&['ryu','evil-ryu'].includes(saved.p1)&&['ryu','evil-ryu'].includes(saved.p2)){
    setMode(saved.mode);$('player-one').value=saved.p1;$('player-two').value=saved.p2;
    if(['stand','block','cpu'].includes(saved.dummy))$('dummy').value=saved.dummy;
  }
}catch{}
const modeName=()=>state.mode==='practice'?'Practice':state.mode==='versus'?'Local versus':'CPU match';
function status(){
  if(state.ready&&window.SF2AI){const info=SF2AI.info;
    const won=info?.winner!==undefined&&info.winner!==null&&info.winner>=0;
    $('match-status').textContent=controller?.paused?'Paused · Choose a setting or resume':won?(info.winnerName||('Player '+(info.winner+1)))+' wins · Start match to play again':modeName()+' · Round '+(info?.round||1);
    const p=SF2.P.find(p=>p.aiProfile==='evil-ryu'||p.fighterKey==='ai:evil-ryu');
    $('rift-status').textContent=!p?'Ryu mirror · No Rift Step':p.AIRift?'Rift Step: committed':p.HP<5?'Rift Step: needs 5 life':'Rift Step: ready';
  }requestAnimationFrame(status);
}
async function init(){
  const response=await fetch('edition.json?v='+encodeURIComponent(build.commit));if(!response.ok)throw new Error('Edition manifest unavailable');
  const edition=await response.json();
  if(edition.editionId!=='ai'||edition.onlineEnabled||edition.roster.join(',')!=='ce:ryu,ai:evil-ryu')throw new Error('Incompatible edition manifest');
  if(build.contentHash&&edition.contentHash!==build.contentHash)throw new Error('Edition content mismatch; reload the page');
  for(const file of edition.dependencies)await script('vendor/'+file);
  await script('game.js');if(!window.SF2AI)throw new Error('AI rules did not register');
  state.ready=true;await start();state.sound=!!SF2AI.info.sound;$('sound').textContent='Sound: '+(state.sound?'on':'off');$('start').disabled=false;$('reset').disabled=false;$('sound').disabled=false;
  requestAnimationFrame(status);
}
// Controller menus are isolated from fighting input.
controller=(()=>{
  let paused=false,releaseGate=false,previous=new Map(),lastDirection='',repeatAt=0,padCount=0;
  const controls=document.querySelector('.controls'),canvas=$('c');
  const pauseButton=document.createElement('button');pauseButton.id='pause';pauseButton.type='button';pauseButton.textContent='Pause / setup';pauseButton.disabled=true;
  $('reset').after(pauseButton);
  const hint=document.createElement('p');hint.id='controller-help';hint.textContent='Controller: D-pad / left stick moves. X / Y / RB punch; A / B / RT kick. Start pauses; View opens setup. In setup: up/down focus, left/right choose, A confirm, B resume. On results: A or Start rematches.';
  controls.after(hint);
  const indicator=document.createElement('p');indicator.id='controller-status';indicator.setAttribute('role','status');indicator.setAttribute('aria-live','polite');hint.after(indicator);
  canvas.tabIndex=0;
  function clear(){if(window.SF2AI?.clearInput)SF2AI.clearInput();else window.SF2?.down?.clear();}
  function items(){return [...controls.querySelectorAll('button,select')].filter(e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
  function focus(e){e?.focus({preventScroll:false});}
  function update(){

  pauseButton.disabled=!state.ready;pauseButton.textContent=paused?'Resume match':'Pause / setup';pauseButton.setAttribute('aria-pressed',String(paused));

  const message=(padCount?padCount+' controller'+(padCount===1?'':'s')+' connected':'No controller detected')+' - '+(paused?'Paused: setup controls active':'Start: pause / View: setup');

  if(indicator.textContent!==message)indicator.textContent=message;
  }
  function pause(){

  if(!state.ready)return;paused=true;releaseGate=true;SF2.freeze=1;clear();

  if(!controls.contains(document.activeElement))focus(controls.querySelector('[data-mode][aria-pressed="true"]')||$('start'));

  update();
  }
  function resume(){

  if(!state.ready)return;paused=false;releaseGate=true;clear();SF2.freeze=0;canvas.focus({preventScroll:true});update();
  }
  function afterConfigure(){clear();releaseGate=true;if(paused)SF2.freeze=1;update();}
  function cycleSelect(e,delta){

  const options=[...e.options].filter(o=>!o.disabled);if(!options.length)return;

  const i=options.findIndex(o=>o.value===e.value);e.value=options[(i+delta+options.length)%options.length].value;e.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function navigate(direction){

  const list=items();if(!list.length)return;let i=list.indexOf(document.activeElement);if(i<0)i=0;

  if((direction==='left'||direction==='right')&&list[i] instanceof HTMLSelectElement){cycleSelect(list[i],direction==='left'?-1:1);return;}

  focus(list[(i+(direction==='up'||direction==='left'?-1:1)+list.length)%list.length]);
  }
  function activate(e=document.activeElement){

  if(!e||e.disabled)return;

  if(e instanceof HTMLSelectElement){cycleSelect(e,1);return;}

  if(e instanceof HTMLButtonElement)e.click();
  }
  pauseButton.addEventListener('click',()=>paused?resume():pause());
  // Capture paused keyboard navigation before the engine sees those keys.
  addEventListener('keydown',e=>{

  if(!state.ready)return;

  if(e.code==='Escape'){


  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)paused?resume():pause();return;

  }

  if(!paused)return;

  const directions={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};

  if(directions[e.code]){e.preventDefault();e.stopImmediatePropagation();navigate(directions[e.code]);}

  else if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)activate();}
  },true);
  function poll(now){

  const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),next=new Map();let accept=false,cancel=false,start=false,back=false,up=false,down=false,left=false,right=false,anyHeld=false;

  for(const p of pads){


  const pressed=n=>!!p.buttons[n]&&(p.buttons[n].pressed||p.buttons[n].value>0.5),old=previous.get(p.index)||[];


  const buttons=p.buttons.map((_,i)=>pressed(i));next.set(p.index,buttons);


  const edge=n=>buttons[n]&&!old[n];accept||=edge(0);cancel||=edge(1);back||=edge(8);start||=edge(9);


  const x=p.axes[0]||0,y=p.axes[1]||0;


  up||=pressed(12)||y<-.4;down||=pressed(13)||y>.4;left||=pressed(14)||x<-.4;right||=pressed(15)||x>.4;


  anyHeld||=buttons.some(Boolean)||Math.abs(x)>.4||Math.abs(y)>.4;

  }

  previous=next;if(padCount!==pads.length){padCount=pads.length;update();}

  if(!anyHeld)releaseGate=false;

  if(state.ready&&!state.busy){


  const result=SF2AI.info.phase==='result';


  if(result&&(accept||start)){resume();activate($('start'));}


  else if(start){paused?resume():pause();}


  else if(back){pause();}


  else if(paused){



  if(cancel)resume();else if(accept)activate();



  const direction=up&&!down?'up':down&&!up?'down':left&&!right?'left':right&&!left?'right':'';



  if(direction&&(direction!==lastDirection||now>=repeatAt)){navigate(direction);repeatAt=now+(direction!==lastDirection?380:110);}



  lastDirection=direction;


  }else lastDirection='';

  }

  requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);update();
  const api={pause,resume,afterConfigure,get paused(){return paused;},get suppressGameplay(){return paused||releaseGate;},get connectedPads(){return padCount;}};
  window.SF2AIController=api;return api;})();
init().catch(showError);
