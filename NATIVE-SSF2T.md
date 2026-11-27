# Native Super Street Fighter II Turbo preview

The AI Edition now links to an independent native preview of the European 940223 game. Open `ssf2t-ai/` and select your own `ssf2t.zip`; its 23 files and five assembled regions are checked locally. The game does not upload the archive. The published package contains no ROM archive, raw program/graphics/audio regions or preload pack.

Original controllers, collisions, stages, sprites and the 1.04 sound program execute as statically translated native functions. No Champion Edition implementation replaces the game, and no CPU opcode decoder or interpreter fallback is linked. Uncovered native dispatch aborts so missing branches remain observable.

The packaged browser build passes all 32 standard fighter/slot scenarios, sixteen original old-character codes and Akuma. A complete Ryu arcade tape genuinely wins 24 rounds and twelve matches, including CPU Akuma, then plays the original ending, staff roll and title. That tape uses tool-assisted ordinary stick/button inputs; replay does not load states or inject health, results, stages, RNG or timers. Separate ordinary-input replays cover Continue credit spending, resumed fighting and Game Over.

The common-outcome update recovers Balrog and Vega's original victory controllers and Honda's defeat/Continue portrait paths. Six ordinary-input checks against the main site's staged package matched 4,111 state samples and 1,324 complete RGB pictures across 123,403 native frames. Actual local file selection, post-ending keyboard Start and the Reset button passed; all requests were GET and no CPU/Z80 fallback or browser errors occurred.

For the full Ryu clear and the three repaired outcomes, an offline Mode::Blocks oracle interprets every original 68000 and Z80 instruction. Its 85,403 frames, 2,845 state samples, 934 RGB pictures and all 137,692,732 PCM bytes match static execution. Earlier Native-reference matrices execute translated functions with original-instruction fallback only at uncovered sites; those checks do not independently interpret every covered instruction. Neither reference establishes hardware GPU/DSP parity.

The corresponding-source archive contains all 186 source/support files and 90 compilation units, licenses, portable build instructions and fifteen reusable input-only QA fixtures. An independent extraction and build reproduced the published WASM, JavaScript and source ZIP byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `ssf2t-native.wasm` (15,264,690 bytes) | `a5b6da94b142f15f93e8cfa47b160192bf3b5e880a83efa8ff6063f6b37aed41` |
| `corresponding-source.zip` (2,469,961 bytes) | `9fa94a9b4e83f1839affbe758dae3f6c548a74158f519f21d6a6b5c869ad2b5f` |

Only the thirteen files in `ssf2t-ai/deployment-allowlist.json` are published. The source links, current scope and original licenses are available from the preview's About page.

Remaining work includes other fighter endings and exceptional mechanics, Q1 spatial DSP and three ADPCM voices, and integrating the main AI Edition's Final Fight roster, blood and finishers into this native game. A full Ryu clear is one verified playthrough, not proof of all character paths or full-game parity.


The special-input follow-up recovers original dispatch branches `08BCD4` (Dhalsim), `092CCC` (Cammy) and `0947C8` (T. Hawk), which previously stopped in both player slots. Six ordinary dual-stick tapes match a full independent 68000/Z80 instruction oracle for 34,015 frames, 1,136 state samples, 570 complete RGB pictures, sampled full RAM/video RAM and 54,840,792 PCM bytes. The browser independently matches all 1,136 states and 570 pictures. The source includes `qa/test-mechanics.cjs` and the six authored input/hash fixtures.

All 32 standard fighter/slot input-family sweeps complete without an uncovered branch; these sweeps include naturally occurring KO/round transitions and do not establish activation of every attempted command. All 17 old/Akuma browser cases pass again. The updated build also matches the existing 98-case/560,877-frame native-reference matrix and 196 RGB pictures, and repeats Ryu's full arcade clear and the Balrog/Vega/Honda common-outcome fixtures. Reference-mode and hardware-parity limits above remain applicable. A clean source extraction reproduces the updated WASM, JavaScript and source ZIP exactly.


A separate forced-ending diagnostic now covers all17 standard/hidden fighters on the earlier published `6ca7d174` native build. Static execution and offline full Mode::Blocks 68000/Z80 instruction execution match1,088event samples,2,386complete captured RGB pictures and387,556,744PCM bytes across240,380frames. Every case reaches its native ending and returns to title with zero strict fallback. Inputs and explicit final-ladder/health fixture writes match between both runs. The saved [diagnostic evidence](SSF2T-ENDING-DIAGNOSTICS.json) records these writes and hashes. These are forced ending diagnostics, not additional genuine arcade clears; the comparison does not cover every RAM byte, a browser replay or hardware DSP/graphics parity.


Ken original-input recovery restores European entries `0A943C` and `0A945A`. The previous browser build aborts on the authored input-only regression; the new5500-frame replay matches183state samples,78RGB pictures and8,867,388PCM bytes against a full68000/Z80 instruction oracle. The original functions are recovered as static native C++; no decoder or fallback is added.

A second genuine arcade clear now wins24rounds and12matches as Ken with no round losses, then plays his original ending, staff roll and return to title. The independently replayed68,425frames match2,280state samples,630completeRGB pictures and110,319,900PCM bytes against full original-instruction execution for both CPUs. The candidate browser independently matches every saved state and picture. Ken reaches the ending at52,428and returns to title at59,324. Only the original easiest operator difficulty is set; replay injects no health, stage, ladder, RNG, timers or results and loads no game state. The inputs were planned offline, not generated by a replacement browser AI. The source includes `qa/test-ken.cjs`, the short regression fixture and the complete Ken input/hash fixture.

The updated candidate also matches the previous98-case/560,877-frame native-reference matrix, all196pictures, six mechanics browser fixtures, seventeen old/Akuma cases, and Ryu's complete60,200-frame/642-picture arcade tape. Its186source/support files compile without a ROM, and clean extraction reproduces the WASM, JavaScript and source ZIP byte for byte. Full main-AI Edition integration, other genuine fighter clears and hardware DSP/graphics parity remain incomplete.


Cammy now has a genuine complete arcade replay on the unchanged `a5b6da94` native binary. It wins 24 rounds and 12 matches without losses, defeats CPU Akuma, plays her original ending and staff roll, and returns to title. All 68,473 frames match 2,282 state samples, 693 complete captured RGB pictures and 110,397,288 PCM bytes against full original-instruction execution for both CPUs. The browser independently matches every saved state and picture. The ending begins at frame 45,851 and title returns at 56,920. Only original operator difficulty 1 is selected; replay loads no state and injects no health, stage, ladder, results, timers or RNG.

`tests/ssf2t-arcade.browser.cjs` and its authored Cammy input/hash fixture are tracked in this repository; the source ZIP also includes `qa/test-cammy.cjs`. In addition to reference matching, this test counts actual round wins/losses, confirms the selected fighter and CPU Akuma final opponent, observes the ending/title cycle, and requires GET-only ROM-loader traffic. The prior Ken proof incorrectly reported `cpuAkumaFinal: false`; original final-fight state and an explicit public-browser replay establish that he also defeated CPU Akuma. This release corrects that reporting field. These are three genuine verified fighter clears, not full AI Edition integration or all-character/hardware parity.


## Native AI blood layer - 2026-11-27

The optional AI blood effects follow the original European head colliders and camera. Confirmed unblocked damage emits a spray, with additional particles for heavy damage and specials; living fighters at or below 20% health drip every eight native frames. Droplets settle at the original world floor and persist for the round. Blocked chip does not create a hit spray. Pool limits are 480 airborne particles and 320 floor stains. The mouth location is approximate within the native head box.

The observer has no game-memory writer, independent cosmetic noise and no calls to the combat RNG. Switching effects off clears the layer and restores the raw native picture. A complete Cammy input replay with the layer enabled preserves 2,282 state samples and 693 raw native picture hashes over 68,473 frames. Separate actual-input checks cover hit/low-health/scroll/block/reset/toggle behavior; the official skill capture reaches the original super finish. The native C++ implementation, WASM and JS glue are unchanged.

This is the first native AI presentation feature. Native integration of Final Fight guests, possessed variants, combos and finishers remains unfinished. Bundled startup assets requested on 2026-11-27 are also not yet integrated or published.
