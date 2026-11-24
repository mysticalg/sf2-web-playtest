/* MMPX Style-Preserving Pixel Art Magnification.
 * Copyright 2020 Morgan McGuire & Mara Gagiu.
 * JavaScript presentation adapter and port of the authors' algorithm via
 * https://github.com/ITotalJustice/mmpx/blob/master/mmpx.c
 * https://casual-effects.com/research/McGuire2021PixelArt/
 * Border sampling saturates both bounds, correcting the C99 transcription's
 * upper-clamp typo. Two unchanged 2x MMPX passes produce the optional 4x mode.
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';
(()=>{
  const littleEndian=new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4;
  const luma=c=>littleEndian?(((c>>>16)&255)+((c>>>8)&255)+(c&255)+1)*(256-(c>>>24)):
    ((c>>>24)+((c>>>16)&255)+((c>>>8)&255)+1)*(256-(c&255));
  const eq2=(b,a,c)=>b===a&&b===c,eq3=(b,a,c,d)=>b===a&&b===c&&b===d,
    eq4=(b,a,c,d,e)=>b===a&&b===c&&b===d&&b===e,
    any3=(b,a,c,d)=>b===a||b===c||b===d,
    none2=(b,a,c)=>b!==a&&b!==c,none4=(b,a,c,d,e)=>b!==a&&b!==c&&b!==d&&b!==e;
  function scale2x(src,width,height,dst=new Uint32Array(width*height*4)){
    if(!(src instanceof Uint32Array)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||src.length<width*height||!(dst instanceof Uint32Array)||dst.length<width*height*4)throw new TypeError('Invalid MMPX pixel buffer');
    const maxX=width-1,maxY=height-1,stride=width*2;
    const at=(x,y)=>src[(y<0?0:y>maxY?maxY:y)*width+(x<0?0:x>maxX?maxX:x)];
    for(let y=0;y<height;y++){
      let A=at(-1,y-1),B=at(0,y-1),C=at(1,y-1),D=at(-1,y),E=at(0,y),F=at(1,y),G=at(-1,y+1),H=at(0,y+1),I=at(1,y+1),Q=at(-2,y),R=at(2,y);
      for(let x=0;x<width;x++){
        let J=E,K=E,L=E,M=E;
        if(A!==E||B!==E||C!==E||D!==E||F!==E||G!==E||H!==E||I!==E){
          const P=at(x,y-2),S=at(x,y+2),Bl=luma(B),Dl=luma(D),El=luma(E),Fl=luma(F),Hl=luma(H);
          // 1:1 slopes, in reference order.
          if(D===B&&D!==H&&D!==F&&(El>=Dl||E===A)&&any3(E,A,C,G)&&(El<Dl||A!==D||E!==P||E!==Q))J=D;
          if(B===F&&B!==D&&B!==H&&(El>=Bl||E===C)&&any3(E,A,C,I)&&(El<Bl||C!==B||E!==P||E!==R))K=B;
          if(H===D&&H!==F&&H!==B&&(El>=Hl||E===G)&&any3(E,A,G,I)&&(El<Hl||G!==H||E!==S||E!==Q))L=H;
          if(F===H&&F!==B&&F!==D&&(El>=Fl||E===I)&&any3(E,C,G,I)&&(El<Fl||I!==H||E!==R||E!==S))M=F;
          // Intersections and single-pixel features.
          if(E!==F&&eq4(E,C,I,D,Q)&&eq2(F,B,H)&&F!==at(x+3,y))K=M=F;
          if(E!==D&&eq4(E,A,G,F,R)&&eq2(D,B,H)&&D!==at(x-3,y))J=L=D;
          if(E!==H&&eq4(E,G,I,B,P)&&eq2(H,D,F)&&H!==at(x,y+3))L=M=H;
          if(E!==B&&eq4(E,A,C,H,S)&&eq2(B,D,F)&&B!==at(x,y-3))J=K=B;
          if(Bl<El&&eq4(E,G,H,I,S)&&none4(E,A,D,C,F))J=K=B;
          if(Hl<El&&eq4(E,A,B,C,P)&&none4(E,D,G,I,F))L=M=H;
          if(Fl<El&&eq4(E,A,D,G,Q)&&none4(E,B,C,I,H))K=M=F;
          if(Dl<El&&eq4(E,C,F,I,R)&&none4(E,B,A,G,H))J=L=D;
          // 2:1 slopes. Assignments deliberately use the preceding results.
          if(H!==B){
            if(H!==A&&H!==E&&H!==C){
              if(eq3(H,G,F,R)&&none2(H,D,at(x+2,y-1)))L=M;
              if(eq3(H,I,D,Q)&&none2(H,F,at(x-2,y-1)))M=L;
            }
            if(B!==I&&B!==G&&B!==E){
              if(eq3(B,A,F,R)&&none2(B,D,at(x+2,y+1)))J=K;
              if(eq3(B,C,D,Q)&&none2(B,F,at(x-2,y+1)))K=J;
            }
          }
          if(F!==D){
            if(D!==I&&D!==E&&D!==C){
              if(eq3(D,A,H,S)&&none2(D,B,at(x+1,y+2)))J=L;
              if(eq3(D,G,B,P)&&none2(D,H,at(x+1,y-2)))L=J;
            }
            if(F!==E&&F!==A&&F!==G){
              if(eq3(F,C,H,S)&&none2(F,B,at(x-1,y+2)))K=M;
              if(eq3(F,I,B,P)&&none2(F,H,at(x-1,y-2)))M=K;
            }
          }
        }
        const di=(y*2)*stride+x*2;dst[di]=J;dst[di+1]=K;dst[di+stride]=L;dst[di+stride+1]=M;
        A=B;B=C;C=at(x+2,y-1);Q=D;D=E;E=F;F=R;R=at(x+3,y);G=H;H=I;I=at(x+2,y+1);
      }
    }
    return dst;
  }
  // BEGIN INLINE MMPX WASM (tools/graphics_mmpx.c, corrected border clamp)
  const wasmBase64='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IQUAAFYFAAB7BQAAnAUAAKUFAADmBQAA8gUAABoGAAAhBgAAVwYAAF8GAADRBgAA2QYAAE4HAABWBwAAhAgAAIkIAACiDAAAAAAAAAAAAAAnBAAANwQAAEMEAABZBAAAAAAAAAAAAADXDAAA3AwAAOsMAAD7DAAACA0AADcNAAAAAAAAAAAAANwMAADrDAAA+wwAAAgNAAAAAAAAAAAAAJABAACbAQAAowEAAKgBAADPAQAA1AEAAOQBAADvAQAA8QEAAP0BAAAnAwAANwMAAAAAAAAAAAAAAMcDCi5kZWJ1Z19zdHJ5AGRzdEluZGV4AG1tcHhfc2NhbGUyeABkc3QAdW5zaWduZWQgaW50AHNyY0hlaWdodAB1aW50MzJfdABDOi9Vc2Vycy9kcmhvby9Eb2N1bWVudHMvQ29kZXgvMjAyNi0xMS0xNC9zZjItd2ViLWNvbXBsZXRpb24vd29yay9zZjItYXJjaGltZWRlcwBjb2xvcgBzcmNCdWZmZXIAX0Jvb2wASGwARmwARWwARGwAQmwAc3JjV2lkdGgAZHN0UGFja2VkAHNyYwBDOlxVc2Vyc1xkcmhvb1xEb2N1bWVudHNcQ29kZXhcMjAyNi0xMS0xNFxzZjItd2ViLWNvbXBsZXRpb25cd29ya1xzZjItYXJjaGltZWRlc1x0b29scy9ncmFwaGljc19tbXB4LmMAbWV0YQBNZXRhAGx1bWEAYWxwaGEAc3JjTWF4WQBzcmNZAHNyY01heFgAc3JjWABTAFIAUQBQAE0ATABLAEoASQBIAEcARgBFAEQAQwBCAEEAbm9uZV9lcTQAYWxsX2VxMwBBMwBub25lX2VxMgBBMgBBMQBBMABjbGFuZyB2ZXJzaW9uIDIxLjEuMAAAnBMLLmRlYnVnX2xpbmWMCQAABADtAAAAAQEB+w4NAAEBAQEAAAABAAABQzpcVXNlcnNcZHJob29cRG9jdW1lbnRzXENvZGV4XDIwMjYtMTAtMjNcYXJjaGltZWRlcy1zcGFjZS1zaG9vdGVyXHdvcmtccHlkZXBzXHppZ2xhbmdcbGliXGluY2x1ZGUAQzpcVXNlcnNcZHJob29cRG9jdW1lbnRzXENvZGV4XDIwMjYtMTEtMTRcc2YyLXdlYi1jb21wbGV0aW9uXHdvcmtcc2YyLWFyY2hpbWVkZXNcdG9v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';
  // END INLINE MMPX WASM
  let accelerated=null,wasmFailure=null;
  try{if(littleEndian&&typeof WebAssembly!=='undefined')accelerated=new WebAssembly.Instance(new WebAssembly.Module(Uint8Array.from(atob(wasmBase64),c=>c.charCodeAt(0)))).exports;}catch(e){wasmFailure=String(e);}
  function acceleratedScale2x(src,w,h,dst=new Uint32Array(w*h*4)){
    if(!accelerated)return scale2x(src,w,h,dst);
    if(!(src instanceof Uint32Array)||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||src.length<w*h||!(dst instanceof Uint32Array)||dst.length<w*h*4)throw new TypeError('Invalid MMPX pixel buffer');
    const base=Number(accelerated.__heap_base.value),bytes=w*h*4,needed=base+bytes*5;
    if(needed>accelerated.memory.buffer.byteLength)accelerated.memory.grow(Math.ceil((needed-accelerated.memory.buffer.byteLength)/65536));
    new Uint32Array(accelerated.memory.buffer,base,w*h).set(src.subarray(0,w*h));accelerated.mmpx_scale2x(base,base+bytes,w,h);
    dst.set(new Uint32Array(accelerated.memory.buffer,base+bytes,w*h*4));return dst;
  }
  const preferenceKey='sf2:graphics:v1',modes=['original','smooth2x','smooth4x'];
  function savedMode(){try{const value=localStorage.getItem(preferenceKey),mode=value==='smooth'?'smooth4x':value;if(modes.includes(mode))return mode;}catch{}return 'smooth2x';}
  let display=null,native=null,nativeContext=null,displayContext=null,width=384,height=224,mode=savedMode(),select=null;
  const scale=()=>mode==='smooth4x'?4:mode==='smooth2x'?2:1;
  let two=null,four=null,outputImage=null,previous=null,validPrevious=false;
  const durations=[];let frames=0,filtered=0,cached=0,lastMs=0;
  function sizeDisplay(){
    if(!display)return;const factor=scale();
    if(display.width!==width*factor)display.width=width*factor;
    if(display.height!==height*factor)display.height=height*factor;
    displayContext=display.getContext('2d');displayContext.imageSmoothingEnabled=false;
    display.style.imageRendering=mode==='original'?'pixelated':'auto';validPrevious=false;outputImage=null;
    if(select)select.value=mode;
  }
  // AI world is magnified before camera projection, then composited directly
  // into the display buffer. HUD remains an independent logical pixel layer.
  let worldFrame=null,overlay=null,overlayContext=null;
  const magnifyCaches=new Map();
  function magnify(canvas,factor,key){
    if(factor===1)return canvas;
    let c=magnifyCaches.get(key);if(!c){c={canvas:document.createElement('canvas')};magnifyCaches.set(key,c);}
    const w=canvas.width,h=canvas.height,rgba=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);
    let pixels=new Uint32Array(rgba.data.buffer),pw=w,ph=h;
    for(let f=1;f<factor;f*=2){pixels=acceleratedScale2x(pixels,pw,ph);pw*=2;ph*=2;}
    if(c.canvas.width!==pw||c.canvas.height!==ph){c.canvas.width=pw;c.canvas.height=ph;}
    c.canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer),pw,ph),0,0);return c.canvas;
  }
  function beginWorld(surface,top,matrix){
    if(!overlay){overlay=document.createElement('canvas');overlay.width=width;overlay.height=height;overlayContext=overlay.getContext('2d');}
    overlayContext.setTransform(1,0,0,1,0,0);overlayContext.clearRect(0,0,width,height);overlayContext.imageSmoothingEnabled=false;
    worldFrame={surface,top,matrix};return overlayContext;
  }
  function finishWorld(){if(worldFrame)nativeContext.drawImage(overlay,0,0);}
  function presentWorld(){
    const factor=4,f=worldFrame,m=f.matrix;
    if(display.width!==width*factor||display.height!==height*factor){display.width=width*factor;display.height=height*factor;displayContext=display.getContext('2d');validPrevious=false;outputImage=null;}
    display.style.imageRendering=mode==='original'?'pixelated':'auto';
    displayContext.setTransform(1,0,0,1,0,0);displayContext.clearRect(0,0,display.width,display.height);displayContext.imageSmoothingEnabled=false;
    const source=magnify(f.surface,mode==='original'?1:2,'world');
    displayContext.setTransform(factor*m.a,factor*m.b,factor*m.c,factor*m.d,factor*m.e,factor*m.f);
    displayContext.drawImage(source,0,0,source.width,source.height,0,f.top,f.surface.width,f.surface.height);
    displayContext.setTransform(1,0,0,1,0,0);const hud=magnify(overlay,scale(),'hud');displayContext.drawImage(hud,0,0,width*factor,height*factor);
  }
  function present(){
    if(!display)return;const start=performance.now();if(worldFrame){presentWorld();lastMs=performance.now()-start;durations.push(lastMs);if(durations.length>240)durations.shift();frames++;filtered++;return;}if(display.width!==width*scale()||display.height!==height*scale())sizeDisplay();
    if(mode==='original'){
      displayContext.globalCompositeOperation='copy';displayContext.drawImage(native,0,0);displayContext.globalCompositeOperation='source-over';
    }else{
      const rgba=nativeContext.getImageData(0,0,width,height),src=new Uint32Array(rgba.data.buffer,rgba.data.byteOffset,rgba.data.byteLength/4);
      if(!outputImage||outputImage.data.byteLength===0){
        const factor=scale();previous||=new Uint32Array(width*height);
        if(accelerated){const base=Number(accelerated.__heap_base.value),bytes=width*height*4,needed=base+bytes*(factor===4?21:5);if(needed>accelerated.memory.buffer.byteLength)accelerated.memory.grow(Math.ceil((needed-accelerated.memory.buffer.byteLength)/65536));outputImage=new ImageData(new Uint8ClampedArray(accelerated.memory.buffer,base+bytes*(factor===4?5:1),bytes*factor*factor),width*factor,height*factor);}
        else{two||=new Uint32Array(width*height*4);four||=new Uint32Array(width*height*16);outputImage=new ImageData(new Uint8ClampedArray((factor===4?four:two).buffer),width*factor,height*factor);}
      }
      let changed=!validPrevious;if(!changed)for(let i=0;i<src.length;i++)if(src[i]!==previous[i]){changed=true;break;}
      if(changed){
        if(accelerated){const base=Number(accelerated.__heap_base.value),bytes=width*height*4;new Uint32Array(accelerated.memory.buffer,base,width*height).set(src);accelerated.mmpx_scale2x(base,base+bytes,width,height);if(scale()===4)accelerated.mmpx_scale2x(base+bytes,base+bytes*5,width*2,height*2);}
        else{scale2x(src,width,height,two);if(scale()===4)scale2x(two,width*2,height*2,four);}
        displayContext.putImageData(outputImage,0,0);previous.set(src);validPrevious=true;filtered++;
      }
      else cached++;
    }
    lastMs=performance.now()-start;durations.push(lastMs);if(durations.length>240)durations.shift();frames++;
  }
  function setMode(value){
    if(value==='smooth')value='smooth4x';if(!modes.includes(value))throw new Error('Unknown graphics mode');
    mode=value;try{localStorage.setItem(preferenceKey,mode);}catch{}sizeDisplay();present();return mode;
  }
  function attach(canvas,w=384,h=224){
    if(display){if(display!==canvas)throw new Error('Graphics display already attached');return native;}
    if(!(canvas instanceof HTMLCanvasElement)||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw new TypeError('Invalid graphics display');
    display=canvas;width=w;height=h;native=document.createElement('canvas');native.width=w;native.height=h;nativeContext=native.getContext('2d',{willReadFrequently:true});
    display.dataset.logicalWidth=String(w);display.dataset.logicalHeight=String(h);if(!display.hasAttribute('tabindex'))display.tabIndex=0;
    const row=document.createElement('div');row.id='sf2-graphics-controls';row.style.cssText='font:12px sans-serif;color:#bbb;padding:4px;display:flex;align-items:center;gap:8px;justify-content:center';
    const label=document.createElement('label');label.textContent='Graphics ';select=document.createElement('select');select.id='sf2-graphics-mode';select.setAttribute('aria-label','Graphics');
    select.style.cssText='font:inherit;min-height:30px;background:#111;color:#ddd;border:1px solid #777;border-radius:3px';
    for(const [value,text] of [['original','Original pixels'],['smooth2x','Smooth 2x (MMPX)'],['smooth4x','Smooth 4x (slower)']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
    label.append(select);row.append(label);const hint=document.createElement('span');hint.textContent='G cycles · 2x is faster';row.append(hint);display.after(row);
    for(const type of ['keydown','keyup'])select.addEventListener(type,e=>e.stopPropagation());
    select.addEventListener('change',()=>{setMode(select.value);display.focus({preventScroll:true});});sizeDisplay();return native;
  }
  function stats(){const sorted=durations.slice().sort((a,b)=>a-b);return {mode,scale:scale(),frames,filtered,cached,lastMs,samples:sorted.length,avgMs:durations.reduce((a,b)=>a+b,0)/(durations.length||1),p95Ms:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]||0,maxMs:sorted[sorted.length-1]||0};}
  addEventListener('keydown',e=>{
    if(!display||e.code!=='KeyG'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target instanceof Element&&e.target.closest('select,input,textarea,[contenteditable=true]'))return;
    e.preventDefault();e.stopImmediatePropagation();setMode(modes[(modes.indexOf(mode)+1)%modes.length]);display.focus({preventScroll:true});
  });
  window.SF2Graphics={beginWorld,finishWorld,clearWorld(){worldFrame=null;},get worldProjection(){return worldFrame?{displayScale:4,sourceWidth:worldFrame.surface.width,sourceHeight:worldFrame.surface.height}:null;},attach,present,setMode,scale2x,acceleratedScale2x,get backend(){return accelerated?'wasm':'javascript';},get wasmFailure(){return wasmFailure;},get mode(){return mode;},get width(){return width;},get height(){return height;},get sourceCanvas(){return native;},get displayCanvas(){return display;},stats,resetStats(){durations.length=0;frames=filtered=cached=lastMs=0;},algorithm:'MMPX 2x cascaded twice',license:'MIT'};
})();
