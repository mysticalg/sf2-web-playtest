"""Offline original-driver capture. Requires a local Final Fight ROM set and MAME.

No ROM bytes or emulator are included in the browser game. Output is a standalone
sound recording plus capture evidence. Existing output files are not overwritten.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import wave
from array import array


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mame', required=True)
    parser.add_argument('--rompath', required=True)
    parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
    parser.add_argument('--out', required=True)
    parser.add_argument('--command', type=lambda x: int(x, 0), default=0x15)

    args = parser.parse_args()
    if not 0 <= args.command <= 0x7f:
        parser.error('command must be in 0..0x7f')
    stem = f'{args.command:02x}'
    if not args.ffmpeg:
        parser.error('ffmpeg is required')
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=False)
    lua = r"""local cpu=manager.machine.devices[':maincpu']
local space=cpu.spaces['program']
space:write_u16(0xff0080,0x60fe)
cpu.state['SR'].value=0x2700
cpu.state['PC'].value=0xff0080
local frame=0
capture_notifier=emu.add_machine_frame_notifier(function()
 frame=frame+1
 if frame==2 then space:write_u16(0x800180,0xf0) end
 if frame==3 then space:write_u16(0x800180,0xff) end
 if frame==60 then
  local f=io.open([[ONSET]],'w');f:write(tostring(manager.machine.time:as_double()));f:close()
  space:write_u16(0x800180,COMMAND)
 end
 if frame==61 then space:write_u16(0x800180,0xff) end
end)
""".replace('ONSET', (out / 'command-time.txt').as_posix()).replace('COMMAND', hex(args.command))
    (out / 'capture.lua').write_text(lua, encoding='utf8')
    command = [str(Path(args.mame).resolve()), 'ffight', '-rompath', str(Path(args.rompath).resolve()),
               '-video', 'none', '-sound', 'none', '-nothrottle', '-skip_gameinfo',
               '-autoboot_delay', '2', '-autoboot_script', str(out / 'capture.lua'),
               '-seconds_to_run', '9', '-wavwrite', str(out / 'reference.wav'),
               '-cfg_directory', str(out / 'cfg'), '-nvram_directory', str(out / 'nvram'),
               '-inipath', str(out / 'ini'), '-noreadconfig']
    options = {}
    if os.name == 'nt':
        startup = subprocess.STARTUPINFO()
        startup.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startup.wShowWindow = 0
        options.update(startupinfo=startup, creationflags=subprocess.CREATE_NO_WINDOW)
    run = subprocess.run(command, cwd=out, capture_output=True, timeout=60, **options)
    (out / 'capture.log').write_bytes(run.stdout + b'\n' + run.stderr)
    run.check_returncode()
    onset = float((out / 'command-time.txt').read_text())
    with wave.open(str(out / 'reference.wav'), 'rb') as wav:
        if wav.getnchannels() != 1 or wav.getsampwidth() != 2:
            raise ValueError('Expected mono signed 16-bit original-driver output')
        rate = wav.getframerate()
        samples = array('h', wav.readframes(wav.getnframes()))
    start = round(onset * rate)
    pre_peak = max(map(abs, samples[start - rate // 2:start]))
    if pre_peak:
        raise ValueError('Background audio contaminated the capture')
    tail = samples[start:]
    active = [i for i, sample in enumerate(tail) if abs(sample) > 4]
    if not active:
        raise ValueError('Original sound command was silent')
    pcm = tail[:active[-1] + rate // 20].tobytes()
    with wave.open(str(out / (stem + '.wav')), 'wb') as wav:
        wav.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        wav.writeframes(pcm)
    subprocess.run([args.ffmpeg, '-v', 'error', '-i', str(out / (stem + '.wav')), '-map_metadata', '-1',
                    '-codec:a', 'libmp3lame', '-b:a', '96k', str(out / (stem + '.mp3'))], check=True, **options)
    proof = dict(command=args.command, commandHex=stem, commandTime=onset, rate=rate,
                 samples=len(pcm) // 2, duration=len(pcm) / 2 / rate,
                 activeSamples=len(active), peak=max(map(abs, tail)), preCommandPeak=pre_peak,
                 pcmSHA256=hashlib.sha256(pcm).hexdigest(),
                 mp3Bytes=(out / (stem + '.mp3')).stat().st_size,
                 mp3SHA256=hashlib.sha256((out / (stem + '.mp3')).read_bytes()).hexdigest())
    (out / 'capture-proof.json').write_text(json.dumps(proof, indent=2), encoding='utf8')
    print(json.dumps(proof))


if __name__ == '__main__':
    main()
