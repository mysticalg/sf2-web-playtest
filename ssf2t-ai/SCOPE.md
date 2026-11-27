# Native preview scope

Playable: original European title, character select, CPU arcade opponents, local two-player input, seventeen standard/hidden fighters and all sixteen old forms. Original controllers, collisions, sprites, stage code and 1.04 sound program run as static native functions. No Champion Edition game implementation is substituted. No CPU opcode decoder is linked in the browser; uncovered addresses stop instead of falling back.

This update recovers missing native Balrog and Vega round-victory controllers and Honda defeat/Continue portrait branches. Genuine ordinary-input recordings now verify both fighters winning a round and returning to combat, and Honda losing two rounds, displaying Continue/Game Over, then returning to the title. These recordings have no health, result, stage, ladder, RNG or timer injection. Only the original easiest operator difficulty is selected.

One complete Ryu arcade run genuinely wins 24 rounds and twelve matches, defeats the native CPU Akuma intrusion, plays the original Ryu ending, gallery, staff roll and CAPCOM group, then returns to the native title. Its input tape was generated with offline tool-assisted planning. Independent replay contains no planning or state restoration. Ending begins at native frame 51,188; title returns at 59,903. This proves one Ryu clear, not seventeen complete fighter playthroughs.

The new Ryu 60,200-frame replay and three common-outcome tapes use a full **Mode::Blocks oracle for both the 68000 and Z80**: every original CPU instruction is interpreted offline at the same block boundaries. Strict static execution matches all 2,845 observed states, 934 RGB pictures and 137,692,732 PCM bytes across those four cases. The production browser follows the same ordinary inputs and compares the saved states/pictures with zero fallback or browser errors. After Ryu's ending, actual Enter spends the remaining credit to reopen selection; Reset restarts the original boot.

Reference modes are distinct. The earlier 98-scenario/560,877-frame normal/old/Akuma/stage matrix uses a **Native-mode reference**: translated functions plus original-instruction fallback only at untranslated sites. The current static build regresses against those RAM, video-RAM, audio hashes and 196 pictures. Earlier Ryu loss/Continue cases likewise retain explicitly labelled Native-mode reference evidence. Those checks must not be described as independently interpreting every covered instruction. Stage diagnostics set only the original stage index before native build; Ryu's real arcade progression is separate.

All sixteen standard fighters in both slots and sixteen old forms plus Akuma have passed original-menu browser selection/battle checks. Original Ryu super charge, activation, blocked contact and gauge consumption, palette selectors, operator difficulty/Turbo, keyboard, pause, local ZIP validation and real audio playback are tested. The source archive includes reusable ordinary-input QA for Ryu's clear, Balrog/Vega victories, Honda's defeat and previous Ryu Continue/Game Over cases. It contains authored inputs, observed values and image hashes, not ROM assets.

Remaining: other full fighter playthroughs, every mechanic/exceptional branch, and hardware graphics/DSP parity. Additional ending discovery uses explicitly logged diagnostic health/ladder fixtures and is not counted as actual arcade completion. Existing AI Edition blood, finishers and Final Fight additions remain separate. The original 1.04 sound program drives a reference mixer still lacking Q1 spatial DSP and three ADPCM voices. Internal equality does not establish hardware parity.

Controls: P1 arrows; A/S/D punches, Z/X/C kicks, 5 coin, Enter start. P2 I/J/K/L; numpad 7/8/9 punches, 4/5/6 kicks, with U/O/P and N/M/comma aliases; 6 coin, 2 start. F fullscreen, Esc exits. The player supplies the original Europe 940223 ZIP locally; it is never uploaded. No ROM is included.


## Special-input branch recovery

Three ordinary-input stops are repaired at original European dispatch entries 08BCD4 (Dhalsim), 092CCC (Cammy) and 0947C8 (T.Hawk). All 16 fighters in both slots complete the tested motion/charge input-family sweeps without a native stop. These are input sequences, not proof that every attempted command was admitted as a special; some sequences naturally reach KO and next-round states.

Six dual-input replays for the repaired fighters match a full independent Mode::Blocks 68000 + Z80 oracle across 34,015 native frames, 1,136 state samples, 570 complete RGB pictures and 54,840,792 PCM bytes. Whole sampled RAM/video RAM bytes also match. The browser independently matches every saved state and picture. Fixtures and reusable `qa/test-mechanics.cjs` are included in the source ZIP; no health/stage/ladder/timer/RNG/result writes or state loads occur. Ryu's full 60,200-frame arcade clear and the Balrog/Vega/Honda common outcomes still match their earlier oracle fixtures on this updated WASM.


## Ken ordinary-input recovery and complete arcade replay

Original entries0A943C and0A945A are restored after a genuine Ken/Ryu input replay stopped in native combat. The repaired5500-frame replay matches183state samples,78RGB pictures and8,867,388PCM bytes against a full68000/Z80 instruction oracle. A genuine Ken arcade tape wins24rounds and12matches without losses, plays his ending and credits, and returns to title. Its68,425frames match2,280state samples,630completeRGBpictures and110,319,900PCMbytes against the full instruction oracle. Candidate browser replays independently match every saved state and picture. Only the original easiest operator difficulty is set; replay uses no state loads or health/ladder/stage/timer/RNG writes. Tool-assisted planning is offline only; the browser follows ordinary recorded controller inputs. This is a second verified full fighter clear, not all-character parity.


## Cammy genuine arcade clear

An additional Cammy tape genuinely wins24rounds and12matches without a loss, defeats CPUAkuma, plays her original ending and credits, and returns to title. Its68,473frames match2,282state samples,693capturedRGB pictures and110,397,288PCMbytes against full Mode::Blocks original-instruction execution for both68000andZ80. The browser independently matches every saved state and picture and counts the actual wins and final opponent. Only original operator difficulty1 is selected; replay contains no health/stage/ladder/RNG/timer/results writes or state loads. This uses the same unchanged a5b6da94 native binary. The previous Ken metadata erroneously said CPUAkumaFinal=false; original final-fight state confirms CPUAkuma and this report corrects that field. Other complete fighter clears, every exceptional mechanic and main AI Edition integration remain incomplete.


## Native AI presentation - 2026-11-27

Optional AI blood effects use original head colliders, confirmed health loss and original camera coordinates. Stronger hits and specials spray more blood; living fighters at 20% health or less drip from the face. Floor stains persist for the round and follow the native camera. Blocked chip emits no hit blood. The switch disables and clears the presentation effects without changing native game state. Final Fight fighters, possessed variants and death combos are not yet integrated into this native route.

A 68,473-frame Cammy input replay with effects enabled preserves 2,282 native state samples and 693 raw-render hashes. Enhanced canvas output intentionally adds effects. Separate native-input tests cover hit spray, low-health drips, floor persistence, scrolling, guarded chip and reset/toggle cleanup; disabled canvas equals raw native output. Native C++ sources, WASM and JS glue are unchanged. The face anchor is an approximation inside the original head box, not a source-sprite anatomical mask.


## Native display buffer reuse

Native paint reuses its RGBA ImageData buffer instead of allocating a complete screen on every repaint. A 4,800-frame ordinary-input replay matches all 30 sampled enhanced-canvas hashes, final game state and effect state against the previous bridge; submitted screen-buffer identities fall from 4,803 to 1. This reduces allocation pressure, not a verified diagnosis of the reported periodic pause.


## Guile reversal recovery and genuine arcade clear

Two original Guile reversal dispatch entries,083EC4 and084068, are restored after genuine back-charge/forward+punch and down-charge/up+kick inputs stopped the prior native build. Both old-build stops reproduce at frame13208. The two repaired14000-frame ordinary-input tapes match932state samples,321completeRGBpictures and45143484PCMbytes against a full68000/Z80 instruction oracle. The browser independently matches every saved state and picture. No health, stage, ladder, timer, RNG or result writes or state loads occur; only original operator difficulty1 is selected.

A new Guile tape genuinely wins24rounds and12matches without losses, defeats CPUAkuma, plays his original ending and credits, and returns to title. Its69000frames match2300state samples,683completeRGBpictures and111246956PCMbytes against full instruction execution for both CPUs; the browser independently matches all states/pictures and counts the wins, final opponent and ending/title. Offline planning generated the controller tape, but independent replay has no planner or state restoration. All98existing native/reference cases and196pictures remain identical, and Ryu/Ken/Cammy browser arcade tapes still pass. Other mechanics and native AI/Final Fight integration remain incomplete.


Optional two-button special shortcuts send ordinary original controller motions. All 300 listed new/old-style activations across both slots pass. Charge, meter and grab eligibility remain native; 720 supers use jump buffering, and Vega flying grabs require a second airborne chord. Seven newly exposed native dispatch paths are recovered. Ten diagnostic tapes match independent instruction execution in state, RGB and PCM; documented setup writes are confined to tests. All 98 compatibility cases and four full browser arcade clears pass on this build. Native Final Fight/possessed/death-combo integration remains unfinished.


## Native audio streaming - 2026-11-27

Where AudioWorklet supports the original 24038Hz context, one persistent node plays the unchanged interleaved native PCM through a fixed8192-frame stereo ring. Browser output resampling remains in place; the adapter does not synthesize new game audio. The queue starts with512frames available and discards stale backlog above7211frames. Mute, pause, reset and title boot clear queued audio. Unsupported worklets or sample rates retain the previous AudioBuffer playback path.

A local8-second real-time comparison replaced483AudioBuffers and483single-use source nodes with one worklet node, no AudioBuffers/source nodes, and483small transferred PCM chunks. It retained the per-frame PCM copy. The worklet reported zero underruns/drops, and a real WebAudio analyser measured nonzero output. Native state, raw rendered pixels and original mixer PCM match at21samples across4200ordinary-input frames.48076sample-level unit checks preserve stereo order, signed amplitude and original0.35gain exactly; startup, underflow, overflow and reset are covered. The no-worklet fallback and mute/re-enable flow pass. These are bounded playback/allocation measurements, not proof that the reported4-5second pause is fixed or that hardware QSound DSP parity has been achieved. Full AI roster/rules integration remains unfinished.
