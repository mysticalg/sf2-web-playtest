/* Small-player-count online versus: real WSS presence and frame-paired lockstep.
   Human matches pair inputs; shared opponents run the existing CPU locally under a server lease. */
'use strict';
(()=>{
  const $=id=>document.getElementById(id), FRAME_MS=1000/59.637;
  const ui={form:$('connect-form'),name:$('player-name'),server:$('server-url'),join:$('connect-button'),leave:$('disconnect-button'),status:$('connection-status'),players:$('players'),count:$('online-count'),challenge:$('challenge-panel'),challengeTitle:$('challenge-title'),challengeText:$('challenge-description'),accept:$('accept-challenge'),decline:$('decline-challenge'),cancel:$('cancel-challenge'),lobby:$('lobby-panel'),match:$('match-panel'),frame:$('game-frame'),matchStatus:$('match-status'),back:$('leave-match'),version:$('game-version')};
  let reconnectTimer=0,retry=0,explicitLeave=false,loadSerial=0;
  let socket=null,self=null,players=[],challenge=null,match=null,build=null,raf=0,heartbeat=0;
  const saved=key=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
  const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  const tabSaved=key=>{try{return sessionStorage.getItem(key)||'';}catch{return '';}};
  const tabSave=(key,value)=>{try{sessionStorage.setItem(key,value);}catch{}};
  const params=new URLSearchParams(location.search);
  ui.name.value=saved('sf2-online-name');
  ui.server.value=params.get('server')||window.SF2NET_ENDPOINT||saved('sf2-online-server')||'wss://www.id-recordings.com/sf2-ws';
  const send=message=>{if(socket&&socket.readyState===WebSocket.OPEN){socket.send(JSON.stringify(message));return true;}return false;};
  function status(text,error=false){ui.status.textContent=text;ui.status.className='status'+(error?' error':self?' connected':'');}
  function renderPlayers(){
    ui.count.textContent=self?String(players.length):'—';ui.players.replaceChildren();
    if(!self){const p=document.createElement('p');p.className='empty';p.textContent='Join the lobby to see who is online.';ui.players.append(p);return;}
    if(players.length===1){const p=document.createElement('p');p.className='empty';p.textContent='You are the first player here. Share this lobby link with a friend.';ui.players.append(p);}
    for(const player of players){
      const row=document.createElement('div');row.className='player';const info=document.createElement('div'),name=document.createElement('a'),state=document.createElement('span');
      name.className='player-name';name.href='history.html?profile='+encodeURIComponent(player.profileId)+'&server='+encodeURIComponent(ui.server.value);name.textContent=player.name+(player.id===self?' (you)':'');state.className='player-state';
      const compatible=!player.build||player.build===build.commit;state.textContent=player.connected===false?'Reconnecting…':!compatible?'Different preview build — refresh to play':player.status==='in-match'?'In a match':player.status==='challenged'?'Considering a challenge':'Available';
      const stats=document.createElement('span');stats.className='player-state';stats.textContent=player.wins+' wins · '+player.losses+' losses · '+player.draws+' draws';info.append(name,state,stats);row.append(info);
      if(player.id!==self){const button=document.createElement('button');button.type='button';button.textContent='Challenge';button.disabled=!compatible||player.status!=='available'||!!challenge||!!match||players.find(p=>p.id===self)?.status!=='available';
        button.addEventListener('click',()=>send({type:'challenge',target:player.id,settings:{version:ui.version.value,time:99,delayFrames:4}}));row.append(button);}
      ui.players.append(row);
    }
  }
  function renderActive(games){const root=$('active-games');root.replaceChildren();if(!games.length){const p=document.createElement('p');p.className='empty';p.textContent='No games in progress.';root.append(p);}for(const game of games){const row=document.createElement('div');row.className='player';const p=document.createElement('span');p.textContent=game.participants.map(p=>p.name).join(' vs ');const status=document.createElement('span');status.className='player-state';status.textContent=game.version+' · '+game.phase;row.append(p,status);root.append(row);}}
  function showChallenge(message){
    challenge=message.challenge;const incoming=challenge.to===self;
    ui.challenge.hidden=false;ui.challengeTitle.textContent=incoming?message.from.name+' challenges you':'Invitation sent';
    ui.challengeText.textContent=(incoming?'Play against '+message.from.name:'Waiting for '+message.to.name)+' · '+(challenge.settings.version==='CE'?'Champion Edition':'World Warrior')+'. Invitations expire after 30 seconds.';
    ui.accept.hidden=ui.decline.hidden=!incoming;ui.cancel.hidden=incoming;renderPlayers();
  }
  function clearChallenge(){challenge=null;ui.challenge.hidden=true;renderPlayers();}
  function cleanupMatch(text){
    if(raf)cancelAnimationFrame(raf);raf=0;match=null;ui.frame.src='about:blank';ui.match.hidden=true;ui.lobby.hidden=false;
    if(text)status(text);renderPlayers();
  }
  function exitMatch(reason='left'){
    if(!match)return;const id=match.matchId;send({type:'exit',matchId:id,reason});cleanupMatch(reason==='desync'?'The match stopped because the game states differed. Both players can return to the lobby.':'Returned to lobby.');
  }
  function waitFor(test,timeout=40000){return new Promise((resolve,reject)=>{const start=performance.now();const check=()=>{try{const value=test();if(value){resolve(value);return;}}catch{}if(performance.now()-start>timeout){reject(new Error('Game loading timed out'));return;}setTimeout(check,50);};check();});}
  async function prepareMatch(message){
    if(raf)cancelAnimationFrame(raf);raf=0;
    clearChallenge();if(message.build!==build.commit){status('Your existing match uses an earlier build and is paused. Return to its original tab, or leave the match before starting a new one.',true);ui.match.hidden=false;ui.matchStatus.textContent='Earlier-build match preserved · cannot restore in this build';match={...message,paused:true};return;}
    match={...message,frames:new Map(),hashes:new Map(),frame:0,started:false,delay:4,last:0,accum:0,lastAdvance:performance.now()};const current=match;
    ui.lobby.hidden=true;ui.match.hidden=false;ui.matchStatus.textContent='Loading the same game build for both players…';
    const loadKey=String(++loadSerial);
    ui.frame.src='index.html?online='+encodeURIComponent(message.matchId)+'&v='+encodeURIComponent(build.commit)+'&restore='+loadKey;
    try{
      const S=await waitFor(()=>new URLSearchParams(ui.frame.contentWindow.location.search).get('restore')===loadKey&&ui.frame.contentWindow.SF2?.net&&ui.frame.contentWindow.SF2.VER.loading===2&&ui.frame.contentWindow.SF2,90000);
      if(match!==current)return;
      const loaded=ui.frame.contentWindow.SF2BUILD?.commit||'local-development';
      if(loaded!==build.commit)throw new Error('Loaded game build differs; refresh the lobby');
      S.G.wantce=message.settings.version==='CE'?1:0;S.setver(message.settings.version);
      await Promise.all(S.FI.map(image=>image.decode()));
      if(match!==current)return;
      S.net.begin({seed:message.seed,version:message.settings.version,time:message.settings.time,bot:message.bot});
      const doc=ui.frame.contentDocument,lines=doc.querySelectorAll('body > div'),label=doc.getElementById('build-version')?.textContent||'Local development';
      if(lines[0])lines[0].textContent='Online controls: arrows + A S D (punch) Z X C (kick) · Enter confirms · F fullscreen · M mute';
      if(lines[1])lines[1].textContent=label+' · Esc returns to the lobby';
      current.game=S;if(message.started)S.net.replaying=true;
      ui.frame.contentWindow.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();exitMatch();}});
      ui.matchStatus.textContent='You are Player '+(message.slot+1)+' · Waiting for '+message.peer.name+'…';
      if(message.started){current.paused=true;current.target=message.target;requestReplay(current);}else send({type:'ready',matchId:message.matchId});
    }catch(error){if(match===current){current.paused=true;status(error.message+' · Your match is preserved; reconnect to retry or leave it explicitly.',true);}}
  }
  function startMatch(message){
    if(!match||match.matchId!==message.matchId||!match.game)return;
    if(raf)cancelAnimationFrame(raf);match.game.net.replaying=false;match.epoch=message.epoch??0;match.paused=false;match.started=true;match.frame=message.startFrame||0;match.accum=0;match.submitted=false;match.delay=Math.max(2,Math.min(12,message.delayFrames||message.inputDelay||4));match.last=performance.now();match.lastAdvance=match.last;
    if(!match.bot)for(let frame=match.frame;frame<match.frame+match.delay;frame++)send({type:'input',matchId:match.matchId,epoch:match.epoch,frame,keys:0});
    ui.frame.focus();ui.frame.contentWindow.focus();raf=requestAnimationFrame(tick);
  }
  function tick(now){
    const m=match;if(!m?.started||m.paused||m.submitted)return;
    m.accum=Math.min(4*FRAME_MS,m.accum+Math.min(100,now-m.last));m.last=now;
    while(m.accum>=FRAME_MS&&(m.bot||m.frames.has(m.frame))){
      const keys=m.game.net.readInput(),inputs=m.bot?[keys,0]:m.frames.get(m.frame);m.frames.delete(m.frame);m.game.net.advance(inputs);
      send({type:'input',matchId:m.matchId,epoch:m.epoch,frame:m.bot?m.frame:m.frame+m.delay,keys});
      m.frame++;m.accum-=FRAME_MS;m.lastAdvance=now;
      if(m.frame%120===0){const hash=m.game.net.hash();m.hashes.set(m.frame,hash);for(const frame of m.hashes.keys())if(frame<m.frame-600)m.hashes.delete(frame);send({type:'hash',matchId:m.matchId,epoch:m.epoch,frame:m.frame,hash});}
      const G=m.game.G;if(G.scene==='fight'&&G.gph===1)m.fought=true;const phase=G.scene==='win'?'Finishing':G.scene==='fight'&&(G.gph===1||m.fought)?'Fighting':'Choosing fighters';
      if(m.phase!==phase){m.phase=phase;send({type:'phase',matchId:m.matchId,epoch:m.epoch,phase});}
      if(G.scene==='win'&&G.st>=180){m.submitted=true;send({type:'result',matchId:m.matchId,epoch:m.epoch,winner:G.mw});m.game.render();ui.matchStatus.textContent='Recording the result…';return;}
    }
    if(!m.bot&&!m.frames.has(m.frame))m.accum=Math.min(m.accum,FRAME_MS);
    m.game.render();
    if(now-m.lastAdvance>30000){exitMatch('timeout');status('Match connection timed out. You are back in the lobby.',true);return;}
    const G=m.game.G;
    ui.matchStatus.textContent=now-m.lastAdvance>2000?'Waiting for the other connection…':G.scene==='select'?'You are Player '+(m.slot+1)+' · Player '+(G.selstep+1)+' chooses a fighter':G.scene==='win'?'Match complete · Returning to the lobby shortly':'You are Player '+(m.slot+1)+' · Versus '+m.peer.name;
    raf=requestAnimationFrame(tick);
  }
  function requestReplay(m){
    if(match!==m||!m.game)return;
    ui.matchStatus.textContent='Restoring your existing match · '+m.frame+' / '+m.target+' frames…';
    send({type:'resume-inputs',matchId:m.matchId,epoch:m.epoch,cursor:m.frame});
  }
  async function replayChunk(message){
    const m=match;if(!m?.game||!m.paused||m.matchId!==message.matchId||m.epoch!==message.epoch||message.cursor!==m.frame)return;
    const bytes=Uint8Array.from(atob(message.data),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
    if(bytes.length%4||m.frame+bytes.length/4>m.target)return;
    for(let i=0;i<bytes.length;i+=4){
      m.game.net.advance([view.getUint16(i,true),view.getUint16(i+2,true)]);m.frame++;
      if(m.checkpoint?.frame===m.frame&&m.game.net.hash()!==m.checkpoint.hash){status('Recovery check failed. Match remains paused; leave it to return safely.',true);return;}
    }
    if(m.frame===m.target){m.game.render();ui.matchStatus.textContent='Match restored · waiting for the other connection…';send({type:'resume-ready',matchId:m.matchId,epoch:m.epoch,frame:m.frame,hash:m.game.net.hash()});}
    else setTimeout(()=>requestReplay(m),0);
  }
  async function receive(event){
    let message;try{message=JSON.parse(event.data);}catch{return;}
    switch(message.type){
      case 'welcome':{
        retry=0;if(message.identity)save('sf2-identity:'+ui.server.value,JSON.stringify(message.identity));
        tabSave('sf2-resume:'+ui.server.value,message.resumeToken);save('sf2-online-remember','yes');
        renderActive(message.activeGames||[]);self=message.id;players=message.players;ui.join.hidden=true;ui.join.disabled=false;ui.leave.hidden=false;ui.name.disabled=ui.server.disabled=true;
        status('Connected as '+message.profile.name+'. Your identity and record are remembered on this browser.');renderPlayers();
        if(message.match){if(!match||match.matchId!==message.match.matchId||message.match.started)await prepareMatch(message.match);}
        else if(match)cleanupMatch(message.lastEnded?'Your previous match has ended. Your record is up to date.':'Lobby restored.');
        if(message.challenge)showChallenge(message.challenge);else clearChallenge();break;
      }
      case 'resync':if(self&&match?.matchId===message.matchId)await prepareMatch(message);break;
      case 'resume-inputs':await replayChunk(message);break;
      case 'resume-start':if(match?.epoch===message.epoch)startMatch(message);break;
      case 'presence':renderActive(message.activeGames||[]);players=message.players;renderPlayers();break;
      case 'challenge':showChallenge(message);break;
      case 'challenge-ended':if(challenge?.id===message.id){clearChallenge();status('Invitation '+message.reason+'.');}break;
      case 'match':await prepareMatch(message);break;
      case 'start':startMatch(message);break;
      case 'frame':if(match?.matchId===message.matchId&&Number.isInteger(message.frame)&&message.frame>=match.frame&&message.frame<match.frame+120&&Array.isArray(message.inputs))match.frames.set(message.frame,message.inputs);break;
      case 'hash':if(match?.matchId===message.matchId&&message.slot!==match.slot){const own=match.hashes.get(message.frame);if(own&&own!==message.hash)exitMatch('desync');}break;
      case 'ended':if(match?.matchId===message.matchId){const reason=message.reason;cleanupMatch(reason==='complete'?'Match recorded. Your record and match history are updated.':reason==='desync'?'Game state mismatch detected. The match stopped safely.':reason==='disconnected'?'The other player disconnected. You are back in the lobby.':'Match ended. You are back in the lobby.');}break;
      case 'error':if(['identity','identity-active','capacity','protocol'].includes(message.code)){ui.join.disabled=false;ui.join.hidden=false;ui.leave.hidden=false;ui.name.disabled=ui.server.disabled=false;}if(message.code==='match'&&!match)break;status(message.message||'The server could not complete that request.',true);break;
    }
  }
  async function loadBuild(){
    if(window.SF2BUILD)return window.SF2BUILD;
    try{const response=await fetch('build.json',{cache:'no-store'});if(response.ok)return await response.json();}catch{}
    return {version:'local',commit:'local-development'};
  }
  function connect(){
    if(!build)return;
    let endpoint;try{endpoint=new URL(ui.server.value.trim());if(!['wss:','ws:'].includes(endpoint.protocol))throw Error();if(location.protocol==='https:'&&endpoint.protocol!=='wss:')throw Error();}catch{status('A secure online server address is needed.',true);$('connection-settings').open=true;return;}
    const name=ui.name.value.trim().slice(0,20);if(!name)return;
    ui.server.value=endpoint.href;$('history-link').href='history.html?server='+encodeURIComponent(endpoint.href);save('sf2-online-name',name);save('sf2-online-server',endpoint.href);
    explicitLeave=false;clearTimeout(reconnectTimer);const old=socket,ws=new WebSocket(endpoint.href);socket=ws;if(old)old.close();status('Connecting to the online lobby…');ui.join.disabled=true;
    ws.addEventListener('open',()=>{if(socket!==ws)return;let identity;try{identity=JSON.parse(saved('sf2-identity:'+endpoint.href)||'null');}catch{}send({type:'hello',protocol:3,name,build:build.commit,identity,resumeToken:tabSaved('sf2-resume:'+endpoint.href)});clearInterval(heartbeat);heartbeat=setInterval(()=>send({type:'ping'}),15000);});
    ws.addEventListener('message',event=>{if(socket===ws)receive(event);});
    ws.addEventListener('close',event=>{
      if(socket!==ws)return;clearInterval(heartbeat);socket=null;
      if(match){match.paused=true;if(raf)cancelAnimationFrame(raf);raf=0;ui.matchStatus.textContent='Connection lost · match paused while reconnecting…';}
      if(!explicitLeave&&event.code!==4001){status('Reconnecting your player and existing match…');reconnectTimer=setTimeout(connect,Math.min(10000,500*2**retry++));return;}
      self=null;players=[];clearChallenge();ui.join.hidden=false;ui.join.disabled=false;ui.leave.hidden=true;ui.name.disabled=ui.server.disabled=false;
      if(match)cleanupMatch();status(event.code===4001?'This connection was replaced by your refreshed tab.':'You left the lobby. Your saved identity and record are retained.');renderPlayers();
    });
    ws.addEventListener('error',()=>{if(socket===ws)status('The server could not be reached. Retrying your saved player…',true);});
  }
  ui.form.addEventListener('submit',event=>{event.preventDefault();connect();});
  ui.leave.addEventListener('click',()=>{explicitLeave=true;save('sf2-online-remember','');clearTimeout(reconnectTimer);send({type:'bye'});socket?.close();});ui.back.addEventListener('click',()=>exitMatch());
  ui.accept.addEventListener('click',()=>challenge&&send({type:'accept',id:challenge.id}));ui.decline.addEventListener('click',()=>challenge&&send({type:'decline',id:challenge.id}));ui.cancel.addEventListener('click',()=>challenge&&send({type:'cancel',id:challenge.id}));
  loadBuild().then(value=>{$('history-link').href='history.html?server='+encodeURIComponent(ui.server.value);build=value;$('build-version').textContent=value.version==='local'?'Local development':'Version '+value.version+' ('+value.commit.slice(0,8)+')';if(saved('sf2-online-remember')==='yes'&&ui.name.value)connect();else status('Enter your name to join. Your player identity and record are saved on this browser.');});
})();
