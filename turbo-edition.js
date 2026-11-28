// SPDX-License-Identifier: GPL-3.0-only
/* Lazy native Turbo host. The existing editions stop while Turbo owns input/audio. */
'use strict';
window.SF2Turbo=(()=>{
 let frame=null,returnFocus=null;
 const host=document.createElement('section');host.id='sf2-turbo';host.hidden=true;
 const back=document.createElement('button');back.type='button';back.textContent='Back to version menu';
 const status=document.createElement('span');status.textContent='Loading Super Street Fighter II Turbo...';status.setAttribute('role','status');
 host.append(back,status);document.body.append(host);
 const style=document.createElement('style');style.textContent='#sf2-turbo[hidden]{display:none}#sf2-turbo{width:100vw;height:100dvh;display:flex;flex-direction:column;background:#000}#sf2-turbo button{align-self:center;margin:5px;padding:7px 14px;background:#222;color:#ddd;border:1px solid #666;cursor:pointer}#sf2-turbo span{align-self:center}#sf2-turbo iframe{border:0;width:100%;flex:1;min-height:0}body.sf2-turbo-active>*:not(#sf2-turbo){display:none!important}';document.head.append(style);
 function close(){if(!frame)return;frame.remove();frame=null;host.hidden=true;document.body.classList.remove('sf2-turbo-active');window.SF2?.resumeFromTurbo?.();returnFocus?.focus();}
 function open(mode=0){
  if(frame)return;
  returnFocus=document.activeElement;window.SF2?.suspendForTurbo?.();host.hidden=false;status.hidden=false;document.body.classList.add('sf2-turbo-active');
  frame=document.createElement('iframe');frame.title='Super Street Fighter II Turbo';frame.allow='autoplay; fullscreen; gamepad';
  frame.src='ssf2t-ai/?boot=1&embedded=1&start='+(mode?2:1);host.append(frame);
  frame.onload=()=>{status.hidden=true;frame?.focus();};
 }
 back.onclick=close;
 window.addEventListener('message',e=>{if(frame&&e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='ssf2t-back')close();});
 return Object.freeze({open,close,get active(){return !!frame;}});
})();
