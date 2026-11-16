'use strict';
(()=>{
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),profileId=params.get('profile');const seen=new Set();let cursor=null,endpoint,ws;
 try{endpoint=params.get('server')||localStorage.getItem('sf2-online-server');}catch{}
 endpoint=endpoint||'wss://www.id-recordings.com/sf2-ws';
 $('lobby-link').href='lobby.html?server='+encodeURIComponent(endpoint);
 try{const url=new URL(endpoint);if(!['ws:','wss:'].includes(url.protocol)||location.protocol==='https:'&&url.protocol!=='wss:')throw Error('A secure records connection is required');ws=new WebSocket(url.href);}catch(e){$('history-status').textContent=e.message;return;}
 const request=()=>ws.send(JSON.stringify({type:'history',profileId,cursor}));
 ws.addEventListener('open',()=>{ws.send(JSON.stringify({type:'observe'}));request();});
 ws.addEventListener('message',event=>{
  let message;try{message=JSON.parse(event.data);}catch{return;}if(message.type!=='history')return;
  if(message.profile){$('heading').textContent=message.profile.name+' — match history';$('record').textContent=message.profile.wins+' wins · '+message.profile.losses+' losses · '+message.profile.draws+' draws';}
  for(const game of message.games){if(seen.has(game.id))continue;seen.add(game.id);const row=document.createElement('article');row.className='history-row';row.dataset.matchId=game.id;const names=document.createElement('p');
   game.participants.forEach((person,i)=>{if(i)names.append(' vs ');const a=document.createElement('a');a.textContent=person.name;a.href='history.html?profile='+encodeURIComponent(person.id)+'&server='+encodeURIComponent(endpoint);names.append(a);});
   const result=document.createElement('p');result.textContent=game.status==='complete'?(game.winner===-1?'Draw':game.participants[game.winner].name+' won'):'No result recorded';if(['left','disconnected','connection-timeout'].includes(game.reason)&&game.status==='complete')result.append(' · Forfeit');
   const meta=document.createElement('p');meta.className='history-meta';meta.textContent=new Date(game.endedAt||game.createdAt).toLocaleString()+' · '+game.settings.version+' · '+({complete:'Completed',cancelled:'Cancelled',abandoned:'Interrupted'}[game.status]||game.status)+' · Build '+game.build.slice(0,12);const fighters=document.createElement('p');fighters.className='history-fighters';fighters.textContent=game.fighters?.length===2?game.fighters.map(f=>f.name).join(' vs '):'Fighters not recorded';row.append(names,fighters,result,meta);$('history-list').append(row);
  }
  const last=message.games.at(-1);if(last)cursor={time:last.createdAt,id:last.id};$('more-history').hidden=message.games.length<50;$('more-history').disabled=false;$('history-status').textContent=$('history-list').children.length?'Shared match records':'No matches recorded yet.';
 });
 ws.addEventListener('error',()=>{$('history-status').textContent='The records server could not be reached.';});ws.addEventListener('close',()=>{if(!$('history-list').children.length)$('history-status').textContent='Records connection closed. Reload to try again.';});
 $('more-history').addEventListener('click',()=>{if(ws.readyState===WebSocket.OPEN){$('more-history').disabled=true;request();}});
 window.addEventListener('pagehide',()=>ws.close());
})();
