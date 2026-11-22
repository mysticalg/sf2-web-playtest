/* AI-only floor projection of the exact visible fighter frame's alpha. */
'use strict';
window.SF2AISHADOW=(()=>{
 const atlases=new WeakMap(),composites=new WeakMap();let count=0;
 function mask(image,rect){
  if(!image||!(image.naturalWidth||image.width))return null;
  const [sx,sy,w,h]=rect;if(!(w>0&&h>0))return null;
  let cache=atlases.get(image);if(!cache){cache=new Map();atlases.set(image,cache);}
  const key=[sx,sy,w,h].join(':');if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(image,sx,sy,w,h,0,0,w,h);x.globalCompositeOperation='source-in';x.fillStyle='#080b12';x.fillRect(0,0,w,h);cache.set(key,c);count++;
  // Atlas keys are weak; cap frame masks within each atlas as well.
  if(cache.size>256){cache.delete(cache.keys().next().value);count--;}
  return c;
 }
 function draw(ctx,image,rect,p,x,ground,round=1,extra=null){
  let im=mask(image,rect),flip=!!p.FACE;if(!im)return false;
  if(extra){
   let cache=composites.get(image);if(!cache){cache=new Map();composites.set(image,cache);}const key=[...rect,p.FACE,p.anim.source,p.aidx].join(':');let pose=cache.get(key);
   if(!pose){const b=extra.bounds,c=document.createElement('canvas');c.width=Math.ceil(b.right-b.left);c.height=Math.ceil(b.bottom-b.top);const g=c.getContext('2d');g.translate(-b.left,-b.top);g.save();if(flip)g.scale(-1,1);g.drawImage(im,rect[4],rect[5]);g.restore();extra.paint(g);g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#080b12';g.fillRect(0,0,c.width,c.height);pose={im:c,rect:[0,0,c.width,c.height,b.left,b.top]};cache.set(key,pose);if(cache.size>256)cache.delete(cache.keys().next().value);}
   im=pose.im;rect=pose.rect;flip=false;
  }
  const height=Math.max(0,p.Y/256),shrink=Math.max(0.62,1-height/1100),level=Math.max(0,Math.min(2,round-1));
  const opacity=[0.38,0.44,0.25][level]*Math.max(0.35,1-height/700),depth=[0.30,0.43,0.27][level],shear=[-0.5,-0.72,0.4][level];
  const [,,w,h,l,t]=rect;
  ctx.save();ctx.filter=height>30?'blur('+Math.min(1.4,height/180)+'px)':'none';ctx.globalAlpha*=opacity;
  ctx.translate(x,ground+2);ctx.transform(shrink,0,shear*shrink,depth*shrink,0,0);
  if(flip){ctx.scale(-1,1);ctx.drawImage(im,l,t,w,h);}else ctx.drawImage(im,l,t,w,h);
  ctx.restore();return true;
 }
 return{draw,mask,get cachedFrames(){return count;}};
})();
