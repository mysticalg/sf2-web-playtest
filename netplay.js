/* Small-player-count online versus: real WSS presence and frame-paired lockstep.
   Human matches pair inputs; shared opponents run the existing CPU locally under a server lease. */
'use strict';
(()=>{
  const $=id=>document.getElementById(id), FRAME_MS=1000/59.637;
  const ui={form:$('connect-form'),name:$('player-name'),server:$('server-url'),join:$('connect-button'),leave:$('disconnect-button'),status:$('connection-status'),players:$('players'),count:$('online-count'),challenge:$('challenge-panel'),challengeTitle:$('challenge-title'),challengeText:$('challenge-description'),accept:$('accept-challenge'),decline:$('decline-challenge'),cancel:$('cancel-challenge'),lobby:$('lobby-panel'),match:$('match-panel'),frame:$('game-frame'),matchStatus:$('match-status'),back:$('leave-match'),version:$('game-version')};
  let socket=null,self=null,players=[],challenge=null,match=null,build=null,raf=0,heartbeat=0;
  const saved=key=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
  const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
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
      const compatible=!player.build||player.build===build.commit;state.textContent=!compatible?'Different preview build — refresh to play':player.status==='in-match'?'In a match':player.status==='challenged'?'Considering a challenge':'Available';
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
    clearChallenge();if(message.build!==build.commit){send({type:'exit',matchId:message.matchId,reason:'build-mismatch'});status('Both players must refresh to the same preview build.',true);return;}
    match={...message,frames:new Map(),hashes:new Map(),frame:0,started:false,delay:4,last:0,accum:0,lastAdvance:performance.now()};const current=match;
    ui.lobby.hidden=true;ui.match.hidden=false;ui.matchStatus.textContent='Loading the same game build for both players…';
    ui.frame.src='index.html?online='+encodeURIComponent(message.matchId)+'&v='+encodeURIComponent(build.commit);
    try{
      const S=await waitFor(()=>ui.frame.contentWindow.SF2?.net&&ui.frame.contentWindow.SF2.VER.loading===2&&ui.frame.contentWindow.SF2,90000);
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
      current.game=S;
      ui.frame.contentWindow.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();exitMatch();}});
      ui.matchStatus.textContent='You are Player '+(message.slot+1)+' · Waiting for '+message.peer.name+'…';
      send({type:'ready',matchId:message.matchId});
    }catch(error){if(match===current){send({type:'exit',matchId:message.matchId,reason:'load-failed'});cleanupMatch();status(error.message,true);}}
  }
  function startMatch(message){
    if(!match||match.matchId!==message.matchId||!match.game)return;
    match.started=true;match.delay=Math.max(2,Math.min(12,message.delayFrames||message.inputDelay||4));match.last=performance.now();match.lastAdvance=match.last;
    if(!match.bot)for(let frame=0;frame<match.delay;frame++)send({type:'input',matchId:match.matchId,frame,keys:0});
    ui.frame.focus();ui.frame.contentWindow.focus();raf=requestAnimationFrame(tick);
  }
  function tick(now){
    const m=match;if(!m?.started||m.submitted)return;
    m.accum=Math.min(4*FRAME_MS,m.accum+Math.min(100,now-m.last));m.last=now;
    while(m.accum>=FRAME_MS&&(m.bot||m.frames.has(m.frame))){
      const keys=m.game.net.readInput(),inputs=m.bot?[keys,0]:m.frames.get(m.frame);m.frames.delete(m.frame);m.game.net.advance(inputs);
      send({type:'input',matchId:m.matchId,frame:m.bot?m.frame:m.frame+m.delay,keys});
      m.frame++;m.accum-=FRAME_MS;m.lastAdvance=now;
      if(!m.bot&&m.frame%120===0){const hash=m.game.net.hash();m.hashes.set(m.frame,hash);for(const frame of m.hashes.keys())if(frame<m.frame-600)m.hashes.delete(frame);send({type:'hash',matchId:m.matchId,frame:m.frame,hash});}
      const G=m.game.G;if(G.scene==='fight'&&G.gph===1)m.fought=true;const phase=G.scene==='win'?'Finishing':G.scene==='fight'&&(G.gph===1||m.fought)?'Fighting':'Choosing fighters';
      if(m.phase!==phase){m.phase=phase;send({type:'phase',matchId:m.matchId,phase});}
      if(G.scene==='win'&&G.st>=180){m.submitted=true;send({type:'result',matchId:m.matchId,winner:G.mw});m.game.render();ui.matchStatus.textContent='Recording the result…';return;}
    }
    if(!m.bot&&!m.frames.has(m.frame))m.accum=Math.min(m.accum,FRAME_MS);
    m.game.render();
    if(now-m.lastAdvance>30000){exitMatch('timeout');status('Match connection timed out. You are back in the lobby.',true);return;}
    const G=m.game.G;
    ui.matchStatus.textContent=now-m.lastAdvance>2000?'Waiting for the other connection…':G.scene==='select'?'You are Player '+(m.slot+1)+' · Player '+(G.selstep+1)+' chooses a fighter':G.scene==='win'?'Match complete · Returning to the lobby shortly':'You are Player '+(m.slot+1)+' · Versus '+m.peer.name;
    raf=requestAnimationFrame(tick);
  }
  async function receive(event){
    let message;try{message=JSON.parse(event.data);}catch{return;}
    switch(message.type){
      case 'welcome':if(message.identity)save('sf2-identity:'+ui.server.value,JSON.stringify(message.identity));renderActive(message.activeGames||[]);self=message.id;players=message.players;ui.join.hidden=true;ui.leave.hidden=false;ui.name.disabled=ui.server.disabled=true;status('Connected. Challenge an available player.');renderPlayers();break;
      case 'presence':renderActive(message.activeGames||[]);players=message.players;renderPlayers();break;
      case 'challenge':showChallenge(message);break;
      case 'challenge-ended':if(challenge?.id===message.id){clearChallenge();status('Invitation '+message.reason+'.');}break;
      case 'match':await prepareMatch(message);break;
      case 'start':startMatch(message);break;
      case 'frame':if(match?.matchId===message.matchId&&Number.isInteger(message.frame)&&message.frame>=match.frame&&message.frame<match.frame+120&&Array.isArray(message.inputs))match.frames.set(message.frame,message.inputs);break;
      case 'hash':if(match?.matchId===message.matchId&&message.slot!==match.slot){const own=match.hashes.get(message.frame);if(own&&own!==message.hash)exitMatch('desync');}break;
      case 'ended':if(match?.matchId===message.matchId){const reason=message.reason;cleanupMatch(reason==='complete'?'Match recorded. Your record and match history are updated.':reason==='desync'?'Game state mismatch detected. The match stopped safely.':reason==='disconnected'?'The other player disconnected. You are back in the lobby.':'Match ended. You are back in the lobby.');}break;
      case 'error':status(message.message||'The server could not complete that request.',true);break;
    }
  }
  async function loadBuild(){
    if(window.SF2BUILD)return window.SF2BUILD;
    try{const response=await fetch('build.json',{cache:'no-store'});if(response.ok)return await response.json();}catch{}
    return {version:'local',commit:'local-development'};
  }
  ui.form.addEventListener('submit',event=>{
    event.preventDefault();if(!build)return;
    let endpoint;try{endpoint=new URL(ui.server.value.trim());if(!['wss:','ws:'].includes(endpoint.protocol))throw Error();if(location.protocol==='https:'&&endpoint.protocol!=='wss:')throw Error();}catch{status('A secure online server address is needed before you can join.',true);$('connection-settings').open=true;return;}
    const name=ui.name.value.trim().slice(0,20);if(!name)return;
    ui.server.value=endpoint.href;save('sf2-online-name',name);save('sf2-online-server',endpoint.href);
    if(socket)socket.close();status('Connecting to the online lobby…');ui.join.disabled=true;
    socket=new WebSocket(endpoint.href);
    socket.addEventListener('open',()=>{let identity;try{identity=JSON.parse(saved('sf2-identity:'+ui.server.value)||'null');}catch{}send({type:'hello',name,build:build.commit,identity});clearInterval(heartbeat);heartbeat=setInterval(()=>send({type:'ping'}),15000);});
    socket.addEventListener('message',receive);
    socket.addEventListener('close',()=>{clearInterval(heartbeat);self=null;players=[];challenge=null;ui.challenge.hidden=true;ui.join.hidden=false;ui.join.disabled=false;ui.leave.hidden=true;ui.name.disabled=ui.server.disabled=false;if(match)cleanupMatch();status('Disconnected from the online lobby.');renderPlayers();});
    socket.addEventListener('error',()=>status('The online server could not be reached. Check the connection settings and try again.',true));
  });
  ui.leave.addEventListener('click',()=>socket?.close());ui.back.addEventListener('click',()=>exitMatch());
  ui.accept.addEventListener('click',()=>challenge&&send({type:'accept',id:challenge.id}));ui.decline.addEventListener('click',()=>challenge&&send({type:'decline',id:challenge.id}));ui.cancel.addEventListener('click',()=>challenge&&send({type:'cancel',id:challenge.id}));
  loadBuild().then(value=>{$('history-link').href='history.html?server='+encodeURIComponent(ui.server.value);build=value;$('build-version').textContent=value.version==='local'?'Local development':'Version '+value.version+' ('+value.commit.slice(0,8)+')';status(ui.server.value?'Enter your name to join the online lobby.':'The online server is not configured yet. Single-player remains available.');});
})();
