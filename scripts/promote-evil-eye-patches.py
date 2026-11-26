"""Extend reviewed native movement eye patches to identical active-pose pixels.
This does no head-box placement and no matching against recoloured/injured art.
"""
from pathlib import Path
from PIL import Image
import json,numpy as np
rows=json.loads(Path('work/eye-source-atlases.json').read_text());reviewed=json.loads(Path('scripts/evil-eye-reviewed-movement.json').read_text());path=Path('ai_evil_eyes_data.js');data=json.loads(path.read_text().split('window.SF2AIEVILEYES=')[1].rstrip().rstrip(';'))
actions=json.loads(Path('scripts/evil-eye-reviewed-actions.json').read_text())
for k,v in actions.items():reviewed.setdefault(k,{}).update(v)
packed=lambda a:a[:,:,0].astype(np.uint32)|(a[:,:,1].astype(np.uint32)<<8)|(a[:,:,2].astype(np.uint32)<<16)|(a[:,:,3].astype(np.uint32)<<24)
for row in rows:
 ident=row['id'];atlas=np.asarray(Image.open('work/'+ident+'-eye-source.png').convert('RGBA'));original=data['frames'][ident];proposals={}
 for seed,eyes in reviewed.get(ident,{}).items():
  sx,sy,sw,sh,*_=row['frames'][int(seed)];left=max(0,min(x for x,y,w,h in eyes)-5);top=max(0,min(y for x,y,w,h in eyes)-4);right=min(sw,max(x+w for x,y,w,h in eyes)+5);bottom=min(sh,max(y+h for x,y,w,h in eyes)+4);patch=atlas[sy+top:sy+bottom,sx+left:sx+right];ph,pw=patch.shape[:2];mask=patch[:,:,3]>240;pattern=packed(patch);ax=eyes[0][0]-left;ay=eyes[0][1]-top
  for fi,r in enumerate(row['frames']):
   if str(fi)in original or str(fi)in data['excluded'].get(ident,{}):continue
   x,y,w,h,*_=r
   if w<pw or h<ph:continue
   body=packed(atlas[y:y+h,x:x+w]);found=np.argwhere(body[ay:h-ph+ay+1,ax:w-pw+ax+1]==pattern[ay,ax])
   for yy,xx in found:
    if np.array_equal(body[yy:yy+ph,xx:xx+pw][mask],pattern[mask]):proposals.setdefault(str(fi),set()).add(tuple((ex-left+int(xx),ey-top+int(yy),ew,eh)for ex,ey,ew,eh in eyes))
 added=0
 for fi,choices in proposals.items():
  if len(choices)==1:original[fi]=[list(p)for p in next(iter(choices))];added+=1
 data['sources'][ident]['annotatedFrames']=len(original);data['sources'][ident]['reviewedPatchAdds']=added;print(ident,'added',added,'total',len(original))
data['methods']=['Reviewed original idle/walk eye pixels, including pose-specific turns/bends','Identical original RGBA face neighbourhoods (11x9 or larger); ambiguous/unseen poses excluded']
path.write_text('/* Original source-bound eye coordinates; no runtime head-box or damaged-RGB guessing. */\nwindow.SF2AIEVILEYES='+json.dumps(data,separators=(',',':'))+';\n',encoding='utf-8')
