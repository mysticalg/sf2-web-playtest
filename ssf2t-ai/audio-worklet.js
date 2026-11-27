/* SPDX-License-Identifier: GPL-3.0-only
 * Bounded playback of the unchanged native 24038 Hz stereo PCM stream. */
'use strict';
class NativeAudioRing {
 constructor(){this.capacity=8192;this.left=new Float32Array(this.capacity);this.right=new Float32Array(this.capacity);this.reset();this.received=0;this.dropped=0;this.underruns=0;}
 reset(){this.head=0;this.count=0;this.playing=false;}
 push(pcm){
  const frames=pcm.length>>1;if(!frames)return;
  // A resumed/stalled tab must not replay an ever-growing backlog.
  if(this.count+frames>7211){this.dropped+=this.count;this.reset();}
  const offset=Math.max(0,frames-this.capacity);this.dropped+=offset;
  for(let i=offset;i<frames;i++){const at=(this.head+this.count)%this.capacity;this.left[at]=pcm[i*2]/32768*.35;this.right[at]=pcm[i*2+1]/32768*.35;this.count++;}
  this.received+=frames;
 }
 render(left,right){
  left.fill(0);right?.fill(0);
  if(!this.playing){if(this.count<512)return;this.playing=true;}
  const count=Math.min(left.length,this.count);
  for(let i=0;i<count;i++){left[i]=this.left[this.head];if(right)right[i]=this.right[this.head];this.head=(this.head+1)%this.capacity;}
  this.count-=count;
  if(count<left.length){this.playing=false;this.underruns++;}
 }
 info(){return{queued:this.count,received:this.received,dropped:this.dropped,underruns:this.underruns,capacity:this.capacity};}
}
if(typeof registerProcessor==='function'){
 class NativePCMProcessor extends AudioWorkletProcessor {
  constructor(){super();this.ring=new NativeAudioRing();this.port.onmessage=({data})=>{if(data.pcm)this.ring.push(data.pcm);else if(data.reset)this.ring.reset();else if(data.stats)this.port.postMessage(this.ring.info());};}
  process(inputs,outputs){const channels=outputs[0];if(channels?.[0])this.ring.render(channels[0],channels[1]);return true;}
 }
 registerProcessor('ssf2t-native-pcm',NativePCMProcessor);
}
if(typeof module!=='undefined')module.exports={NativeAudioRing};
