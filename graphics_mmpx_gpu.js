/* MMPX Style-Preserving Pixel Art Magnification.
 * WebGL2 port for the AI world layer; HUD and compatibility paths stay on CPU.
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
"use strict";
window.SF2GPUMMPX=(()=>{
 function create({allowSoftware=false}={}){
 let gl=null,canvas=null,program=null,texture=null,failed=null,ready=false,attempted=false,draws=0,allocations=0,max=0,textureWidth=0,textureHeight=0,textureAllocations=0,renderer='';const uniforms={};
 const fragment=`#version 300 es
 precision highp float;precision highp int;
 uniform sampler2D image;uniform ivec2 cropOrigin;uniform ivec2 cropSize;uniform ivec2 targetOrigin;
 out vec4 color;ivec2 cell;
 uint at(int x,int y){uvec4 c=uvec4(floor(texelFetch(image,cropOrigin+clamp(cell+ivec2(x,y),ivec2(0),cropSize-1),0)*255.0+0.5));return c.r|(c.g<<8)|(c.b<<16)|(c.a<<24);}
 int luma(uint c){return int(((c&255u)+((c>>8)&255u)+((c>>16)&255u)+1u)*(256u-(c>>24)));}
 bool eq2(uint b,uint a,uint c){return b==a&&b==c;}bool eq3(uint b,uint a,uint c,uint d){return b==a&&b==c&&b==d;}bool eq4(uint b,uint a,uint c,uint d,uint e){return b==a&&b==c&&b==d&&b==e;}
 bool any3(uint b,uint a,uint c,uint d){return b==a||b==c||b==d;}bool none2(uint b,uint a,uint c){return b!=a&&b!=c;}bool none4(uint b,uint a,uint c,uint d,uint e){return b!=a&&b!=c&&b!=d&&b!=e;}
 void main(){ivec2 pixel=ivec2(gl_FragCoord.xy)-targetOrigin;pixel.y=cropSize.y*2-1-pixel.y;cell=pixel/2;
 uint A=at(-1,-1),B=at(0,-1),C=at(1,-1),D=at(-1,0),E=at(0,0),F=at(1,0),G=at(-1,1),H=at(0,1),I=at(1,1),Q=at(-2,0),R=at(2,0),J=E,K=E,L=E,M=E;
 if(A!=E||B!=E||C!=E||D!=E||F!=E||G!=E||H!=E||I!=E){uint P=at(0,-2),S=at(0,2);int Bl=luma(B),Dl=luma(D),El=luma(E),Fl=luma(F),Hl=luma(H);
 if(D==B&&D!=H&&D!=F&&(El>=Dl||E==A)&&any3(E,A,C,G)&&(El<Dl||A!=D||E!=P||E!=Q))J=D;
 if(B==F&&B!=D&&B!=H&&(El>=Bl||E==C)&&any3(E,A,C,I)&&(El<Bl||C!=B||E!=P||E!=R))K=B;
 if(H==D&&H!=F&&H!=B&&(El>=Hl||E==G)&&any3(E,A,G,I)&&(El<Hl||G!=H||E!=S||E!=Q))L=H;
 if(F==H&&F!=B&&F!=D&&(El>=Fl||E==I)&&any3(E,C,G,I)&&(El<Fl||I!=H||E!=R||E!=S))M=F;
 if(E!=F&&eq4(E,C,I,D,Q)&&eq2(F,B,H)&&F!=at(3,0)){K=F;M=F;}
 if(E!=D&&eq4(E,A,G,F,R)&&eq2(D,B,H)&&D!=at(-3,0)){J=D;L=D;}
 if(E!=H&&eq4(E,G,I,B,P)&&eq2(H,D,F)&&H!=at(0,3)){L=H;M=H;}
 if(E!=B&&eq4(E,A,C,H,S)&&eq2(B,D,F)&&B!=at(0,-3)){J=B;K=B;}
 if(Bl<El&&eq4(E,G,H,I,S)&&none4(E,A,D,C,F)){J=B;K=B;}
 if(Hl<El&&eq4(E,A,B,C,P)&&none4(E,D,G,I,F)){L=H;M=H;}
 if(Fl<El&&eq4(E,A,D,G,Q)&&none4(E,B,C,I,H)){K=F;M=F;}
 if(Dl<El&&eq4(E,C,F,I,R)&&none4(E,B,A,G,H)){J=D;L=D;}
 if(H!=B){if(H!=A&&H!=E&&H!=C){if(eq3(H,G,F,R)&&none2(H,D,at(2,-1)))L=M;if(eq3(H,I,D,Q)&&none2(H,F,at(-2,-1)))M=L;}if(B!=I&&B!=G&&B!=E){if(eq3(B,A,F,R)&&none2(B,D,at(2,1)))J=K;if(eq3(B,C,D,Q)&&none2(B,F,at(-2,1)))K=J;}}
 if(F!=D){if(D!=I&&D!=E&&D!=C){if(eq3(D,A,H,S)&&none2(D,B,at(1,2)))J=L;if(eq3(D,G,B,P)&&none2(D,H,at(1,-2)))L=J;}if(F!=E&&F!=A&&F!=G){if(eq3(F,C,H,S)&&none2(F,B,at(-1,2)))K=M;if(eq3(F,I,B,P)&&none2(F,H,at(-1,-2)))M=K;}}
 }
 uint c=(pixel.y%2==0)?(pixel.x%2==0?J:K):(pixel.x%2==0?L:M);color=vec4(float(c&255u),float((c>>8)&255u),float((c>>16)&255u),float(c>>24))/255.0;
 }`;
 function init(){
  canvas=document.createElement('canvas');gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL2 unavailable');const debug=gl.getExtension('WEBGL_debug_renderer_info');renderer=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER));if(!allowSoftware&&(!debug||/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer))){gl.getExtension('WEBGL_lose_context')?.loseContext();throw Error('Unsupported WebGL renderer');}max=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),...gl.getParameter(gl.MAX_VIEWPORT_DIMS));
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  for(const name of ['image','cropOrigin','cropSize','targetOrigin'])uniforms[name]=gl.getUniformLocation(program,name);texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.disable(gl.BLEND);gl.disable(gl.DITHER);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=failed||'context lost';ready=false;});
 }
 function draw(source,rect=null){
  const r=rect||{x:0,y:0,w:source.width,h:source.height},w=r.w*2,h=r.h*2;
  if(![r.x,r.y,r.w,r.h].every(Number.isInteger)||r.x<0||r.y<0||r.w<1||r.h<1||r.x+r.w>source.width||r.y+r.h>source.height||Math.max(source.width,source.height,w,h)>max)return null;
  if(canvas.width<w||canvas.height<h){canvas.width=Math.min(max,Math.max(w,Math.ceil(canvas.width*1.25)));canvas.height=Math.min(max,Math.max(h,Math.ceil(canvas.height*1.25)));allocations++;}
  gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);
  if(textureWidth<source.width||textureHeight<source.height){textureWidth=Math.min(max,Math.max(source.width,Math.ceil(textureWidth*1.25)));textureHeight=Math.min(max,Math.max(source.height,Math.ceil(textureHeight*1.25)));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,textureWidth,textureHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null);textureAllocations++;}
  gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.viewport(0,canvas.height-h,w,h);gl.uniform1i(uniforms.image,0);gl.uniform2i(uniforms.cropOrigin,r.x,r.y);gl.uniform2i(uniforms.cropSize,r.w,r.h);gl.uniform2i(uniforms.targetOrigin,0,canvas.height-h);gl.drawArrays(gl.TRIANGLES,0,3);
  // Submit the producer before Canvas2D consumes the shared buffer.
  gl.flush();draws++;return canvas;
 }
 function verify(reference){
  if(typeof reference!=='function')throw Error('MMPX reference unavailable');
  for(const transparent of[false,true]){
   const source=document.createElement('canvas');source.width=17;source.height=13;const sx=source.getContext('2d',{willReadFrequently:true}),rgba=sx.createImageData(17,13);let seed=42;
   const palette=Array.from({length:6},(_,i)=>[i*47%256,i*71%256,i*93%256,transparent?[0,1,64,128,192,255][i]:255]);for(let i=0;i<rgba.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;rgba.data.set(palette[seed%6],i);}sx.putImageData(rgba,0,0);
   const r={x:1,y:1,w:13,h:9},input=sx.getImageData(r.x,r.y,r.w,r.h),expected=new Uint8ClampedArray(reference(new Uint32Array(input.data.buffer),r.w,r.h).buffer),cpu=document.createElement('canvas'),gpu=document.createElement('canvas');cpu.width=gpu.width=r.w*2;cpu.height=gpu.height=r.h*2;
   const cx=cpu.getContext('2d',{willReadFrequently:true}),gx=gpu.getContext('2d',{willReadFrequently:true});cx.putImageData(new ImageData(expected,r.w*2,r.h*2),0,0);gx.drawImage(draw(source,r),0,0,r.w*2,r.h*2,0,0,r.w*2,r.h*2);const a=cx.getImageData(0,0,cpu.width,cpu.height).data,b=gx.getImageData(0,0,gpu.width,gpu.height).data;if(a.some((v,i)=>v!==b[i]))throw Error('GPU MMPX pixel check failed');
  }
 }
 function warmup(reference){if(attempted)return ready;attempted=true;try{init();verify(reference);ready=true;}catch(e){failed=String(e);ready=false;}return ready;}
 function render(source,rect=null,reference=window.SF2Graphics?.scale2x){if(!warmup(reference)||failed)return null;try{return draw(source,rect);}catch(e){failed=String(e);ready=false;return null;}}
 return{render,warmup,stats:()=>({ready,failed,renderer,draws,allocations,textureAllocations,width:canvas?.width,height:canvas?.height})};
 }
 const main=create();return{...main,create};
})();
