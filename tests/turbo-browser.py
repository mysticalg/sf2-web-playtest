"""Exercise the public Turbo launch with real browser input and bundled assets."""
import argparse
import functools
import json
from pathlib import Path
import threading
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', help='Published site root; omit to serve this checkout locally.')
parser.add_argument('--artifacts', required=True, type=Path)
parser.add_argument('--baseline-ref', help='Compare WW/CE state and pixels with this game.js revision.')
parser.add_argument('--gamepads', action='store_true', help='Exercise simulated standard gamepads through native browser polling.')
args = parser.parse_args()
args.artifacts.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class Server(ThreadingHTTPServer):
    request_queue_size = 512
    daemon_threads = True

server = None
if not args.base:
    server = Server(('127.0.0.1', 0), functools.partial(Handler, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
base = (args.base or f'http://127.0.0.1:{server.server_port}').rstrip('/')
errors, failures, checks = [], [], []

def record(name, data=True):
    checks.append(dict(check=name, result=data))
    print(name, json.dumps(data), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width':1280, 'height':800})
    if args.gamepads:
        context.add_init_script("window.__testPads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__testPads});")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('requestfailed', lambda r: failures.append(dict(url=r.url, error=r.failure)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

    def press(key):
        page.keyboard.press(key, delay=80)
        page.wait_for_timeout(45)

    def native_frame():
        return next(f for f in page.frames if '/ssf2t-ai/' in f.url)

    def native_ready(slots):
        page.wait_for_function("slots=>{const s=document.querySelector('#sf2-turbo iframe')?.contentWindow?.SSF2TNative?.state();return s?.ready&&(s.playersIn&slots)===slots}", arg=slots, timeout=90000)
        frame = native_frame()
        assert not frame.locator('.rom').is_visible()
        assert not frame.locator('#rom').is_visible()
        assert frame.evaluate("SSF2TNative.assets().source==='bundled'")
        s = frame.evaluate('SSF2TNative.state()')
        assert s['error'] is None and s['cpuFallback'] == s['soundFallback'] == 0
        return frame

    def connect_pads(frame):
        frame.locator('canvas').click()
        frame.evaluate("""()=>{const pad=index=>({index,connected:true,mapping:'standard',id:'Simulated standard controller',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});window.__makePad=pad;window.__testPads=[pad(0),null,pad(2)];}""")
        frame.wait_for_function('JSON.stringify(SSF2TNative.controllers().connected)==="[0,2]"')

    def pad_button(frame,slot,button,pressed):
        frame.evaluate('([slot,button,on])=>{const b=__testPads[slot?2:0].buttons[button];b.pressed=on;b.value=on?1:0}',[slot,button,pressed])

    def pad_pulse(frame,slot,button,mask):
        pad_button(frame,slot,button,True)
        frame.wait_for_function('([slot,mask])=>(SSF2TNative.state().players[slot].input&mask)===mask',arg=[slot,mask])
        page.wait_for_timeout(100)
        pad_button(frame,slot,button,False)
        frame.wait_for_function('([slot,mask])=>!(SSF2TNative.state().players[slot].input&mask)',arg=[slot,mask])

    try:
        page.goto(base+'/?edition=ce', wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function("window.SF2&&SF2.VER.loading===2&&SF2.G.tick>20", timeout=90000)
        for _ in range(4): press('ArrowDown')
        assert page.evaluate('SF2.G.menu') == 4
        press('ArrowRight')
        page.wait_for_function("SF2.edition==='ai'", timeout=90000)
        press('ArrowRight')
        page.wait_for_function("SF2.edition==='st'", timeout=10000)
        record('Keyboard version selection', page.evaluate('({edition:SF2.edition,scene:SF2.G.scene})'))
        page.screenshot(path=str(args.artifacts/'turbo-version-menu.png'))
        for _ in range(4): press('ArrowUp')
        assert page.evaluate('SF2.G.menu') == 0
        press('Enter')
        frame = native_ready(1)
        record('One-player automatic character select', frame.evaluate('SSF2TNative.state()'))
        page.screenshot(path=str(args.artifacts/'turbo-character-select.png'))
        assert page.evaluate('SF2.freeze') == 1
        frozen_tick = page.evaluate('SF2.G.tick')
        frame.locator('canvas').click()
        page.keyboard.down('a')
        page.wait_for_timeout(250)
        record('Held selection input',frame.evaluate('({input:SSF2TNative.state().players[0].input,focus:document.activeElement.tagName,state:SSF2TNative.state()})'))
        page.keyboard.up('a')
        page.wait_for_timeout(500)
        press('a')
        frame.wait_for_function("SSF2TNative.state().gameStep===4&&SSF2TNative.state().matchStep===10&&SSF2TNative.state().players[0].hp>0", timeout=30000)
        record('Native arcade fight', frame.evaluate('SSF2TNative.state()'))
        frame.locator('#sound').click()
        frame.wait_for_function('SSF2TNative.state().soundEnabled', timeout=5000)
        frame.wait_for_function('SSF2TNative.audioPlayback().submitted>0||SSF2TNative.audioPlayback().backend==="buffers"', timeout=5000)
        record('Sound enabled', frame.evaluate('SSF2TNative.audioPlayback()'))
        frame.locator('canvas').click()
        x0 = frame.evaluate('SSF2TNative.state().players[0].x')
        page.keyboard.down('ArrowRight')
        page.wait_for_timeout(200)
        assert frame.evaluate('SSF2TNative.state().players[0].input&1')
        page.keyboard.up('ArrowRight')
        x1 = frame.evaluate('SSF2TNative.state().players[0].x')
        press('d')
        assert frame.evaluate('SSF2TNative.state().error') is None
        assert page.evaluate('SF2.G.tick') == frozen_tick
        record('Keyboard input, attack and suspended main engine', dict(x0=x0,x1=x1))
        page.screenshot(path=str(args.artifacts/'turbo-fight.png'))
        frame.locator('#pause').click()
        assert frame.evaluate('SSF2TNative.state().paused')
        paused_frame = frame.evaluate('SSF2TNative.state().frame')
        page.wait_for_timeout(120)
        assert frame.evaluate('SSF2TNative.state().frame') == paused_frame
        frame.locator('#pause').click()
        frame.wait_for_function('n=>SSF2TNative.state().frame>n',arg=paused_frame)
        record('Pause and resume')
        frame.locator('#reset').click()
        assert frame.evaluate('SSF2TNative.state().error') is None
        record('Native reset')
        frame.locator('canvas').click()
        press('Escape')
        page.wait_for_function('!SF2Turbo.active&&SF2.freeze===0')
        assert page.evaluate('SF2.G.menu') == 4
        record('Escape returns to version menu')
        page.goto(base+'/',wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function("window.SF2&&SF2.edition==='st'&&SF2.G.tick>20",timeout=90000)
        record('Turbo selection survives reload')
        # Choose 2P Versus through the same title menu.
        press('ArrowDown')
        assert page.evaluate('SF2.G.menu') == 1
        press('Enter')
        frame = native_ready(3)
        record('Two-player automatic character select', frame.evaluate('SSF2TNative.state()'))
        frame.locator('canvas').click()
        if args.gamepads:
            connect_pads(frame)
            pad_pulse(frame,0,2,16);pad_pulse(frame,1,2,16)
            record('Gamepads select both fighters')
        else:
            press('a'); press('u')
            page.wait_for_timeout(500)
            press('a'); press('u')
        frame.wait_for_function('SSF2TNative.state().gameStep===4&&SSF2TNative.state().matchStep===10&&SSF2TNative.state().players.every(p=>p.hp>0)',timeout=30000)
        record('Native two-player fight', frame.evaluate('SSF2TNative.state()'))
        frame.locator('canvas').click()
        x0=frame.evaluate('SSF2TNative.state().players[0].x')
        page.keyboard.down('ArrowRight');page.wait_for_timeout(200);page.keyboard.up('ArrowRight')
        x1=frame.evaluate('SSF2TNative.state().players[0].x')
        assert x0!=x1
        record('Player movement in versus',dict(x0=x0,x1=x1))
        if args.gamepads:
            for slot in [0,1]:
                for button,mask in [(2,16),(3,32),(5,64),(0,128),(1,256),(7,512)]:
                    pad_pulse(frame,slot,button,mask)
            record('All six attacks in both controller slots')
            x0=frame.evaluate('SSF2TNative.state().players[0].x')
            frame.evaluate('__testPads[0].axes=[-.9,0]')
            frame.wait_for_function('SSF2TNative.state().players[0].input&2')
            page.wait_for_timeout(200)
            x1=frame.evaluate('SSF2TNative.state().players[0].x')
            assert x0!=x1
            frame.evaluate('__testPads[0].axes=[0,0]')
            frame.wait_for_function('!(SSF2TNative.state().players[0].input&3)')
            record('Analog controller movement',dict(x0=x0,x1=x1))
            pad_pulse(frame,1,12,8)
            record('Controller two D-pad jump')
            credits=frame.evaluate('SSF2TNative.state().credits')
            pad_pulse(frame,0,8,2048)
            frame.wait_for_function('n=>SSF2TNative.state().credits>n',arg=credits)
            record('View button adds an original coin')
            frame.evaluate('__testPads[0].axes=[.9,0]')
            frame.wait_for_function('SSF2TNative.state().players[0].input&1')
            frame.evaluate('__testPads[0]=null')
            frame.wait_for_function('SSF2TNative.controllers().connected[0]===null&&SSF2TNative.state().players[0].input===0')
            assert frame.evaluate('SSF2TNative.controllers().connected[1]')==2
            record('Disconnect releases input without moving player two')
            frame.evaluate('__testPads[0]=__makePad(0);__testPads[0].buttons[2]={pressed:true,value:1}')
            frame.wait_for_function('SSF2TNative.controllers().connected[0]===0')
            assert frame.evaluate('SSF2TNative.state().players[0].input')==0
            pad_button(frame,0,2,False);page.wait_for_timeout(60)
            pad_pulse(frame,0,2,16)
            record('Held reconnect is gated until release')
            frame.evaluate('__testPads[0].axes=[-.9,0]')
            frame.wait_for_function('SSF2TNative.state().players[0].input&2')
            page.get_by_role('button',name='Back to version menu',exact=True).focus()
            frame.wait_for_function('SSF2TNative.state().players[0].input===0')
            frame.locator('canvas').click()
            assert frame.evaluate('SSF2TNative.state().players[0].input')==0
            frame.evaluate('__testPads[0].axes=[0,0]');page.wait_for_timeout(60)
            record('Focus loss releases held controls')
            pad_button(frame,0,9,True)
            frame.wait_for_function('SSF2TNative.state().paused')
            paused_frame=frame.evaluate('SSF2TNative.state().frame')
            page.wait_for_timeout(150)
            assert frame.evaluate('SSF2TNative.state().frame')==paused_frame
            pad_button(frame,0,9,False);page.wait_for_timeout(60)
            pad_button(frame,0,9,True)
            frame.wait_for_function('!SSF2TNative.state().paused')
            pad_button(frame,0,9,False);page.wait_for_timeout(60)
            record('Menu button pauses and resumes once per press')
            pad_button(frame,0,9,True)
            frame.wait_for_function('SSF2TNative.state().paused')
            pad_button(frame,0,9,False);page.wait_for_timeout(60)
            pad_button(frame,0,8,True)
            page.wait_for_function('!SF2Turbo.active&&SF2.freeze===0')
            record('Paused View returns to version menu')
        else:
            page.get_by_role('button', name='Back to version menu', exact=True).click()
        page.wait_for_function('!SF2Turbo.active&&SF2.freeze===0')
        for edition in ['ww','ce','ai','st']:
            press('ArrowRight')
            page.wait_for_function('id=>SF2.edition===id',arg=edition,timeout=90000)
        record('All four editions remain selectable')
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=str(args.artifacts/'turbo-menu-mobile.png'))
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        # Main-menu tap interaction launches Turbo on a phone-sized surface too.
        canvas=page.locator('#c'); box=canvas.bounding_box()
        canvas.click(position={'x':box['width']/2,'y':box['height']*166/224})
        frame=native_ready(1)
        page.screenshot(path=str(args.artifacts/'turbo-select-mobile.png'))
        assert frame.evaluate('document.documentElement.scrollWidth<=innerWidth')
        record('Mobile menu tap and native layout')
        if args.baseline_ref:
            baseline=subprocess.check_output(['git','show',args.baseline_ref+':game.js'],cwd=root).decode('utf-8')
            comparisons=[]
            page.close()
            for old in [True,False]:
                page=context.new_page()
                page.on('pageerror',lambda e:errors.append(str(e)))
                if old:
                    page.route('**/game.js?*',lambda route:route.fulfill(content_type='application/javascript',body=baseline))
                page.goto(base+'/?edition=ce',wait_until='domcontentloaded',timeout=90000)
                page.wait_for_function('window.SF2&&SF2.VER.loading===2',timeout=90000)
                comparisons.append(page.evaluate("""async()=>{const out=[];for(const edition of ['ww','ce']){netActive=false;await SF2.setEdition(edition);SF2.freeze=1;for(const seed of [42,9451]){SF2.net.begin({version:edition.toUpperCase(),seed,time:99});SF2.startfight(0,4);G.gph=1;P[0].X=340*256;P[1].X=395*256;P[0].FACE=1;P[1].FACE=0;const hashes=[];for(let i=0;i<300;i++){const stage=i%90,pair=stage<4?[16,1]:stage<12?[0,1]:stage<16?[8,0]:stage<20?[10,0]:stage<24?[2|16,0]:stage<30?[0,128]:stage<40?[4|2,0]:[0,0];SF2.net.advance(pair);if(i%20===0)hashes.push(SF2.net.hash());}SF2.render();const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data,sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).map(n=>n.toString(16).padStart(2,'0')).join('');out.push({edition,seed,hashes,sha,players:P.map(p=>({HP:p.HP,ST:p.ST,cur:p.cur,X:p.X,Y:p.Y})),scene:G.scene});}}return out;}"""))
                page.close()
            assert comparisons[0]==comparisons[1],comparisons
            record('WW/CE regression against baseline',dict(cases=4,stateHashes=60,pixelHashes=4,baseline=args.baseline_ref))
        assert errors == [], errors
        assert failures == [], failures
        record('No browser exceptions or failed requests')
    except Exception:
        page.screenshot(path=str(args.artifacts/'failure.png'))
        if any('/ssf2t-ai/' in f.url for f in page.frames):
            record('Native failure state', native_frame().evaluate('SSF2TNative.state()'))
        raise
    finally:
        (args.artifacts/'turbo-browser-proof.json').write_text(json.dumps(dict(base=base,checks=checks,errors=errors,failures=failures),indent=2),encoding='utf-8')
        if errors or failures: print('ERRORS',json.dumps(dict(errors=errors,failures=failures)),flush=True)
        browser.close()
        if server: server.shutdown()
