/* Small-player-count online versus: real WSS presence and frame-paired lockstep.
   Human matches pair inputs; shared opponents run the existing CPU locally under a server lease. */
'use strict';
(()=>{
  const $=id=>document.getElementById(id), FRAME_MS=1000/59.637;
  const ui={form:$('connect-form'),name:$('player-name'),server:$('server-url'),join:$('connect-button'),leave:$('disconnect-button'),status:$('connection-status'),players:$('players'),count:$('online-count'),challenge:$('challenge-panel'),challengeTitle:$('challenge-title'),challengeText:$('challenge-description'),accept:$('accept-challenge'),decline:$('decline-challenge'),cancel:$('cancel-challenge'),lobby:$('lobby-panel'),match:$('match-panel'),frame:$('game-frame'),matchStatus:$('match-status'),back:$('leave-match'),version:$('game-version')};
  let reconnectTimer=0,retry=0,explicitLeave=false,loadSerial=0;
  let recentTimer=0;
  let socket=null,self=null,players=[],challenge=null,match=null,build=null,raf=0,heartbeat=0;
  const saved=key=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
  const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  const tabSaved=key=>{try{return sessionStorage.getItem(key)||'';}catch{return '';}};
  const tabSave=(key,value)=>{try{sessionStorage.setItem(key,value);}catch{}};
  const params=new URLSearchParams(location.search);
  ui.name.value=saved('sf2-online-name');
  ui.server.value=params.get('server')||window.SF2NET_ENDPOINT||saved('sf2-online-server')||'wss://www.id-recordings.com/sf2-ws';
  const send=message=>{if(socket&&socket.readyState===WebSocket.OPEN){socket.send(JSON.stringify(message));return true;}return false;};
  function status(text,error=false){ui.status.textContent=text;ui.status.className='status'+(error?' error':self?' connected':socket?.readyState===WebSocket.OPEN?' viewing':'');}
  function renderPlayers(){
    ui.count.textContent=players.filter(p=>p.kind==='human'&&p.connected!==false).length+' online · '+players.filter(p=>p.kind==='cpu').length+' CPU';ui.players.replaceChildren();
    $('roster-help').textContent=self?'Choose an available opponent to send an invitation.':'Join to challenge. You can browse the room without joining.';
    if(!players.length){const p=document.createElement('p');p.className='empty';p.textContent='Waiting for the live player list…';ui.players.append(p);return;}
    for(const player of players){
      const row=document.createElement('div');row.className='player';row.setAttribute('role','listitem');const info=document.createElement('div'),name=document.createElement('a'),state=document.createElement('span');info.className='player-info';
      name.className='player-name';name.href='history.html?profile='+encodeURIComponent(player.profileId)+'&server='+encodeURIComponent(ui.server.value);name.textContent=player.name+(player.id===self?' (you)':'');
      if(player.kind==='cpu'){const cpu=document.createElement('small');cpu.textContent='CPU';name.append(cpu);}
      const compatible=!player.build||player.build===build.commit;state.className='player-state'+(player.connected===false?' offline':player.status!=='available'?' busy':'');state.textContent=player.connected===false?'Reconnecting…':!compatible?'Refresh to play':player.status==='in-match'?'In a match':player.status==='challenged'?'Invited':'Available';
      const stats=document.createElement('span');stats.className='player-record';stats.textContent=player.wins+'W '+player.losses+'L '+player.draws+'D';stats.setAttribute('aria-label',player.wins+' wins, '+player.losses+' losses, '+player.draws+' draws');info.append(name,stats,state);row.append(info);
      if(player.id!==self){const button=document.createElement('button');button.type='button';button.textContent='Challenge';button.disabled=!self||!compatible||player.status!=='available'||!!challenge||!!match||players.find(p=>p.id===self)?.status!=='available';
        button.addEventListener('click',()=>self&&send({type:'challenge',target:player.id,settings:{version:ui.version.value,time:99,delayFrames:4}}));row.append(button);}
      else{const label=document.createElement('span');label.className='player-action';label.textContent='You';row.append(label);}
      ui.players.append(row);
    }
  }
  function requestRecent(){clearTimeout(recentTimer);recentTimer=setTimeout(()=>send({type:'history'}),300);}
  function updateHistoryLinks(){for(const id of ['history-link','recent-history-link'])$(id).href='history.html?server='+encodeURIComponent(ui.server.value);}
  function renderRecent(games){
    const root=$('recent-results');root.replaceChildren();const rows=[...new Map(games.map(g=>[g.id,g])).values()].slice(0,6);
    if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='No recorded matches yet.';root.append(p);return;}
    for(const game of rows){
      const row=document.createElement('article');row.className='result-row';row.dataset.matchId=game.id;const title=document.createElement('div');title.className='result-title';
      if(game.status==='complete'&&game.winner>=0){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 20 20');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('fill','currentColor');path.setAttribute('d','M2 5 6 9 10 3 14 9 18 5 16 16H4Z');svg.append(path);title.append(svg);}
      const people=document.createElement('span');game.participants.forEach((person,i)=>{if(i)people.append(' vs ');const a=document.createElement('a');a.textContent=person.name;a.href='history.html?profile='+encodeURIComponent(person.id)+'&server='+encodeURIComponent(ui.server.value);people.append(a);});title.append(people);
      const fighters=document.createElement('span');fighters.className='result-meta result-fighters';fighters.textContent=game.fighters?.length===2?game.fighters.map(f=>f.name).join(' vs '):'Fighters not recorded';
      const meta=document.createElement('span');meta.className='result-meta';const minutes=Math.max(0,Math.floor((Date.now()-(game.endedAt||game.createdAt))/60000)),ago=minutes<1?'just now':minutes<60?minutes+'m ago':minutes<1440?Math.floor(minutes/60)+'h ago':Math.floor(minutes/1440)+'d ago';
      const result=game.status==='complete'?(game.winner===-1?'Draw':game.participants[game.winner]?.name+' won'):game.status==='cancelled'?'Cancelled':'No result';meta.textContent=result+' · '+game.settings.version+' · '+ago;row.append(title,fighters,meta);root.append(row);
    }
  }
  function renderActive(games){const root=$('active-games');root.replaceChildren();if(!games.length){const p=document.createElement('p');p.className='empty';p.textContent='No games in progress.';root.append(p);}for(const game of games){const row=document.createElement('div');row.className='player';const p=document.createElement('span');p.textContent=game.participants.map(p=>p.name).join(' vs ');const status=document.createElement('span');status.className='player-state';status.textContent=(game.fighters?game.fighters.map(f=>f.name).join(' vs ')+' · ':'')+game.version+' · '+game.phase;row.append(p,status);root.append(row);}}
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
    ui.frame.style.visibility='hidden';ui.frame.setAttribute('aria-busy','true');
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
      current.game=S;if(message.started)S.net.replaying=true;else{ui.frame.style.visibility='visible';ui.frame.setAttribute('aria-busy','false');}
      ui.frame.contentWindow.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();exitMatch();}});
      ui.matchStatus.textContent='You are Player '+(message.slot+1)+' · Waiting for '+message.peer.name+'…';
      if(message.started){current.paused=true;current.target=message.target;requestReplay(current);}else send({type:'ready',matchId:message.matchId});
    }catch(error){if(match===current){current.paused=true;status(error.message+' · Your match is preserved; reconnect to retry or leave it explicitly.',true);}}
  }
  function startMatch(message){
    if(!match||match.matchId!==message.matchId||!match.game)return;
    ui.frame.style.visibility='visible';ui.frame.setAttribute('aria-busy','false');
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
      if(!m.lineupSent&&G.scene==='fight'&&G.gph===1)m.lineupSent=send({type:'lineup',matchId:m.matchId,epoch:m.epoch,frame:m.frame,fighters:m.game.P.map(p=>p.fid)});
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
        $('player-identity-label').textContent='Playing as '+message.profile.name;status('Connected as '+message.profile.name+' · Your player and progress are remembered.');renderPlayers();requestRecent();
        if(message.match){if(!match||match.matchId!==message.match.matchId||message.match.started)await prepareMatch(message.match);}
        else if(match)cleanupMatch(message.lastEnded?'Your previous match has ended. Your record is up to date.':'Lobby restored.');
        if(message.challenge)showChallenge(message.challenge);else clearChallenge();break;
      }
      case 'resync':if(self&&match?.matchId===message.matchId)await prepareMatch(message);break;
      case 'resume-inputs':await replayChunk(message);break;
      case 'resume-start':if(match?.epoch===message.epoch)startMatch(message);break;
      case 'presence':renderActive(message.activeGames||[]);players=message.players;renderPlayers();requestRecent();if(!self)status('Viewing live lobby · Join to play. No account needed.');break;
      case 'history':renderRecent(message.games||[]);break;
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
  function connect(viewOnly=false){
    if(!build)return;
    let endpoint;try{endpoint=new URL(ui.server.value.trim());if(!['wss:','ws:'].includes(endpoint.protocol))throw Error();if(location.protocol==='https:'&&endpoint.protocol!=='wss:')throw Error();}catch{status('A secure online server address is needed.',true);$('connection-settings').open=true;return;}
    const name=ui.name.value.trim().slice(0,20);if(!viewOnly&&!name)return;
    ui.server.value=endpoint.href;updateHistoryLinks();if(!viewOnly)save('sf2-online-name',name);save('sf2-online-server',endpoint.href);
    explicitLeave=false;clearTimeout(reconnectTimer);const old=socket,ws=new WebSocket(endpoint.href);socket=ws;if(old)old.close();status(viewOnly?'Opening the live room…':'Joining the online room…');ui.join.disabled=!viewOnly;
    ws.addEventListener('open',()=>{if(socket!==ws)return;let identity;try{identity=JSON.parse(saved('sf2-identity:'+endpoint.href)||'null');}catch{}if(viewOnly){send({type:'observe'});requestRecent();}else send({type:'hello',protocol:3,name,build:build.commit,identity,resumeToken:tabSaved('sf2-resume:'+endpoint.href)});clearInterval(heartbeat);heartbeat=setInterval(()=>send({type:'ping'}),15000);});
    ws.addEventListener('message',event=>{if(socket===ws)receive(event);});
    ws.addEventListener('close',event=>{
      if(socket!==ws)return;clearInterval(heartbeat);socket=null;
      if(match){match.paused=true;if(raf)cancelAnimationFrame(raf);raf=0;ui.matchStatus.textContent='Connection lost · match paused while reconnecting…';}
      if(!explicitLeave&&event.code!==4001){status(viewOnly?'Reconnecting to the live room…':'Reconnecting your player and existing match…');reconnectTimer=setTimeout(()=>connect(viewOnly),Math.min(10000,500*2**retry++));return;}
      self=null;players=[];$('player-identity-label').textContent='Guest play available';clearChallenge();ui.join.hidden=false;ui.join.disabled=false;ui.leave.hidden=true;ui.name.disabled=ui.server.disabled=false;
      if(match)cleanupMatch();status(event.code===4001?'This connection was replaced by your refreshed tab.':'You left the lobby. Your saved identity and record are retained.');renderPlayers();if(event.code!==4001)setTimeout(()=>connect(true),0);
    });
    ws.addEventListener('error',()=>{if(socket===ws)status('The server could not be reached. Retrying your saved player…',true);});
  }
  ui.form.addEventListener('submit',event=>{event.preventDefault();connect();});
  ui.leave.addEventListener('click',()=>{explicitLeave=true;save('sf2-online-remember','');clearTimeout(reconnectTimer);send({type:'bye'});socket?.close();});ui.back.addEventListener('click',()=>exitMatch());
  ui.accept.addEventListener('click',()=>challenge&&send({type:'accept',id:challenge.id}));ui.decline.addEventListener('click',()=>challenge&&send({type:'decline',id:challenge.id}));ui.cancel.addEventListener('click',()=>challenge&&send({type:'cancel',id:challenge.id}));
  loadBuild().then(value=>{updateHistoryLinks();build=value;$('build-version').textContent=value.version==='local'?'Local development':'Version '+value.version+' ('+value.commit.slice(0,8)+')';if(saved('sf2-online-remember')==='yes'&&ui.name.value)connect();else connect(true);});
})();
