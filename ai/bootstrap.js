const $=id=>document.getElementById(id);
const state={mode:'practice',ready:false,busy:false,sound:false};
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
  try{await SF2AI.configure(options());save();$('loading').hidden=true;}
  catch(e){showError(e);}
  finally{state.busy=false;$('start').disabled=!state.ready;}
}
function showError(error){$('loading').hidden=false;$('loading').textContent='The prototype could not start. '+error.message;console.error(error);}
modeButtons.forEach(button=>button.addEventListener('click',()=>{setMode(button.dataset.mode);start();}));
$('start').addEventListener('click',start);
$('reset').addEventListener('click',()=>{if(state.ready)SF2AI.resetRound();});
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
    $('match-status').textContent=won?(info.winnerName||('Player '+(info.winner+1)))+' wins · Start match to play again':modeName()+' · Round '+(info?.round||1);
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
init().catch(showError);
