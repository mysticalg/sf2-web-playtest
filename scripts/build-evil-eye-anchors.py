"""Locate reviewed original eye patches by exact native RGBA template matches.
No source sprites are modified; ambiguous/unmatched frames deliberately omit FX.
"""
from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
rows=json.loads(Path('work/eye-source-atlases.json').read_text())
reviewedMovement=json.loads(Path('scripts/evil-eye-reviewed-movement.json').read_text())if Path('scripts/evil-eye-reviewed-movement.json').exists()else{}
# Coordinates in the original, unmirrored native frame, not head-box estimates.
eyes={'ryu':[(19,9,1)],'honda':[(43,14,1)],'blanka':[(32,18,1)],'guile':[(22,10,1)],'ken':[(19,9,1)],'chun-li':[(40,11,1)],'zangief':[(30,10,1)],'dhalsim':[(24,13,1)],'bison':[(57,9,1)],'sagat':[(28,11,1)],'balrog':[(21,11,1)],'vega':[(27,10,1)],'damnd':[(30,7,1),(35,8,1)],'sodom':[(34,24,1),(41,25,1)],'edi':[(22,9,1)],'rolento':[(34,8,1)],'abigail':[(39,8,1)],'belger':[(62,6,1)],'andore':[(39,12,1)],'guy':[(29,7,1)],'cody':[(26,6,1)],'haggar':[(35,6,1)]}
result={};proof={};excluded=json.loads(Path('scripts/evil-eye-exclusions.json').read_text())
for d in rows:
 ident=d['id'];image=Image.open('work/'+ident+'-eye-source.png').convert('RGBA');atlas=np.asarray(image);frame=d['poses'][0]['frame'];sx,sy,sw,sh,*_=d['frames'][frame];points=eyes[ident];left=max(0,min(e[0]for e in points)-3);top=max(0,min(e[1]for e in points)-2);right=min(sw,max(e[0]+e[2]for e in points)+3);bottom=min(sh,max(e[1]for e in points)+3)
 patch=atlas[sy+top:sy+bottom,sx+left:sx+right];ph,pw=patch.shape[:2];mask=patch[:,:,3]>=240;coords=np.argwhere(mask);anchor=(points[0][1]-top,points[0][0]-left);packed=lambda a:a[:,:,0].astype(np.uint32)|(a[:,:,1].astype(np.uint32)<<8)|(a[:,:,2].astype(np.uint32)<<16)|(a[:,:,3].astype(np.uint32)<<24)
 pattern=packed(patch);found={};heads={}
 for anim in d['anims']:
  for index,head in anim['ents']:
   if head[2]>0 and head[3]>0:
    r=d['frames'][index];heads.setdefault(index,[]).append((head[0]-r[4],-head[1]-r[5],head[2],head[3]))
 for index,r in enumerate(d['frames']):
  x,y,w,h,*_=r
  if w<pw or h<ph:continue
  body=packed(atlas[y:y+h,x:x+w]);ay,ax=anchor;candidates=np.argwhere(body[ay:h-ph+ay+1,ax:w-pw+ax+1]==pattern[ay,ax]);matches=[]
  for yy,xx in candidates:
   sub=body[yy:yy+ph,xx:xx+pw]
   core=all(body[ey-top+yy,ex-left+xx]==pattern[ey-top,ex-left]for ex,ey,ew in points)
   if not core:continue
   score=float(np.count_nonzero(sub[mask]==pattern[mask])/np.count_nonzero(mask));ex,ey,_=points[0];px=ex-left+xx;py=ey-top+yy
   inhead=any(abs(px-hx)<=rx and abs(py-hy)<=ry for hx,hy,rx,ry in heads.get(index,[]))
   if score>=.999:matches.append((score,int(xx),int(yy)))
  matches.sort(reverse=True)
  if matches and(len(matches)==1 or matches[0][0]>matches[1][0]+.035):
   _,xx,yy=matches[0];found[index]=[[ex-left+xx,ey-top+yy,ew,1]for ex,ey,ew in points]
 found.update({int(k):v for k,v in reviewedMovement.get(ident,{}).items()})
 actions=json.loads(Path('scripts/evil-eye-reviewed-actions.json').read_text())if Path('scripts/evil-eye-reviewed-actions.json').exists()else{}
 found.update({int(k):v for k,v in actions.get(ident,{}).items()})
 for hidden in excluded.get(ident,{}):found.pop(int(hidden),None)
 if ident=='sodom':
  for fi,pp in list(found.items()):
   if len(pp)==2:
    x,y=pp[0][:2];found[fi]=[[x+1,y-1,1,1],[x,y,1,1],[x+8,y,1,1],[x+6,y+1,2,1]]
 result[ident]=found;proof[ident]={'sourceSHA256':hashlib.sha256(Path('work/'+ident+'-eye-source.png').read_bytes()).hexdigest(),'reviewedFrame':frame,'templateRect':[left,top,pw,ph],'eyes':points,'matchedFrames':len(found),'totalFrames':len(d['frames'])}
 print(ident,len(found),'/',len(d['frames']))
Path('ai_evil_eyes_data.js').write_text('/* Original source-bound eye coordinates. Reviewed idle/walk registration and visible face-patch matches. */\nwindow.SF2AIEVILEYES='+json.dumps({'schema':1,'frames':result,'sources':proof,'excluded':excluded},separators=(',',':'))+';\n',encoding='utf-8')
Path('work/eye-anchor-proof.json').write_text(json.dumps(proof,indent=2))
