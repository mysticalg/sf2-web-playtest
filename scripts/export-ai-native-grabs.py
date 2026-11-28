"""Private original-ROM extraction; publishes only admitted sprite crops and metadata."""
from pathlib import Path
import sys,os,json,hashlib,base64,io,argparse
import numpy as np
from PIL import Image
repository=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--rom',type=Path,required=True)
parser.add_argument('--tiles',type=Path,required=True)
parser.add_argument('--tools',type=Path,required=True,help='Existing CE ce_sprite/sf2anim/sf2box tool directory')
parser.add_argument('--assets',type=Path,default=repository/'assets_ce.js')
parser.add_argument('--out',type=Path,default=repository/'ai_native_grabs_data.js')
parser.add_argument('--proof',type=Path,default=repository/'scripts/native-grab-export-proof.json')
args=parser.parse_args()
sys.path.insert(0,str(args.tools));os.environ['CPSCE']='1'
import ce_sprite,sf2anim,sf2box
rom=args.rom.read_bytes();assert hashlib.sha256(rom).hexdigest()=='aca6c7212ffbcd1894add413e1276e647e5ccbe1a8ee36327aceabd0e0f8fcf9','Wrong CE source program';words=np.frombuffer(rom,dtype='>u2');tiles=np.load(args.tiles)
BOXT=[int.from_bytes(rom[0xa19e8+16*i:0xa19ec+16*i],'big')for i in range(12)]
assets=json.JSONDecoder().raw_decode(args.assets.read_text(encoding='utf-8').split('=',1)[1].lstrip())[0];u16=lambda a:int.from_bytes(rom[a:a+2],'big');u32=lambda a:int.from_bytes(rom[a:a+4],'big');s16=lambda a:int.from_bytes(rom[a:a+2],'big',signed=True)
key=lambda a:(u32(a+4),rom[a+19]&3,rom[a+20])
images=[];poses={};rows={};victims={};shadows={}
definitions={1:{'hondaMP':0x529ce},6:{'giefMP':0x73624,'giefHP':0x7374c,'giefMK':0x73904,'giefHK':0x73a28,'giefCMP':0x73b34,'giefCHP':0x73bcc,'giefSPD':0x73d6c,'giefSPDImpact':0x7369c},7:{'noogie':0x7b19c,'yogaThrow':0x7b230},9:{'sagatThrow':0x86e74},10:{'headbuttHold':0x8a780}}
def extract(fid,name,source,looping=False):
    f=assets['fighters'][fid];known={key(a['source']+24*i):e[0]for a in f['anims']for i,e in enumerate(a['ents'])}
    seq,loop=sf2anim.anim(words,source);addrs=[e['at']for e in seq];entries=[];flags=[];extra=[]
    for e in seq:
        a=e['at'];k=key(a);boxes=sf2box.boxes(rom,e['extra'],BOXT[fid]);entries.append([known.get(k,0),e['dur']]+[list(boxes.get(n,(0,0,0,0)))[:4]for n in ['head','body','foot','push','hit']]+[0,0,0,False]);flags.append(u16(a+2));shadows[a]=rom[a+14]
        if k in known:extra.append(None);continue
        pens,left,top=ce_sprite.render(rom,k[0],tiles,k[1],k[2]);views=[]
        for pal in [f['pal'],f['pal2']]:
            rgba=np.zeros(pens.shape+(4,),np.uint8);mask=pens!=15;rgba[mask,:3]=np.array(pal,np.uint8)[pens[mask]];rgba[mask,3]=255;buf=io.BytesIO();Image.fromarray(rgba).save(buf,format='PNG');views.append(len(images));images.append('data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode())
        extra.append({'images':views,'rect':[0,0,pens.shape[1],pens.shape[0],left,top]})
    return {'name':'aiGrab_'+name,'source':source,'ents':entries,'flags':flags,'mode':0 if looping else 1,'loop':addrs.index(loop) if loop in addrs else len(addrs)-1,'extraArt':extra,'attachIndices':[rom[e['at']+16]for e in seq]}
for fid,defs in definitions.items():
    poses[fid]={n:extract(fid,n,p,n in ['noogie','headbuttHold','giefSPD'])for n,p in defs.items()}
    table=0xaaff4+s16(0xaaff4+fid*2);count=max(max(p['attachIndices'])for p in poses[fid].values())+1
    rows[fid]=[[[int.from_bytes(rom[a+k:a+k+1],'big',signed=k<2)for k in range(4)]for a in range(table+s16(table+v*2),table+s16(table+v*2)+4*count,4)]for v in range(12)]
# Original shared held-pose selector 0x3a0e uses status0x3e, indexed by each row's fourth byte.
outer=[0x4c0e4,0x514ca,0x57ed6,0x5f046,0x65c34,0x6b2ca,0x72570,0x797f2,0x7f75c,0x85f22,0x89b8e,0x8e116]
for fid,b in enumerate(outer):
    count=max(row[3]for matrix in rows.values()for row in matrix[fid])+1
    table=b+s16(b+0x3e);victims[fid]={str(i):extract(fid,'victim'+str(i),table+s16(table+2*i))for i in range(count)}
data={'schema':1,'programSHA256':hashlib.sha256(rom).hexdigest(),'images':images,'poses':poses,'rows':rows,'victims':victims,'shadows':shadows,'scope':'Original CE animation lists, sprite commands, palettes and0x3a0e attachment rows. AI-only lifecycle binding; full scheduler parity is not claimed.'}
target=args.out;target.write_text('/* Original source-backed AI grab poses; raw ROM remains private. */\nwindow.SF2AINATIVEGRABDATA='+json.dumps(data,separators=(',',':'))+';\n')
args.proof.write_text(json.dumps({'programSHA256':data['programSHA256'],'poses':{str(f):{n:p['source']for n,p in q.items()}for f,q in poses.items()},'images':len(images),'victimPoseCounts':{f:len(q)for f,q in victims.items()},'outputSHA256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2))
print('Exported',len(images),'sprite views;',target.stat().st_size,'bytes')
