# Native Super Street Fighter II Turbo preview

The AI Edition now links to an independent native preview of the European 940223 game. Open `ssf2t-ai/` and select your own `ssf2t.zip`; its 23 files and five assembled regions are checked locally. The game does not upload the archive. The published package contains no ROM archive, raw program/graphics/audio regions or preload pack.

Original controllers, collisions, stages, sprites and the 1.04 sound program execute as statically translated native functions. No Champion Edition implementation replaces the game, and no CPU opcode decoder or interpreter fallback is linked. Uncovered native dispatch aborts so missing branches remain observable.

The packaged browser build passes all 32 standard fighter/slot scenarios, sixteen original old-character codes and Akuma. A complete Ryu arcade tape genuinely wins 24 rounds and twelve matches, including CPU Akuma, then plays the original ending, staff roll and title. That tape uses tool-assisted ordinary stick/button inputs; replay does not load states or inject health, results, stages, RNG or timers. Separate ordinary-input replays cover Continue credit spending, resumed fighting and Game Over.

The common-outcome update recovers Balrog and Vega's original victory controllers and Honda's defeat/Continue portrait paths. Six ordinary-input checks against the main site's staged package matched 4,111 state samples and 1,324 complete RGB pictures across 123,403 native frames. Actual local file selection, post-ending keyboard Start and the Reset button passed; all requests were GET and no CPU/Z80 fallback or browser errors occurred.

For the full Ryu clear and the three repaired outcomes, an offline Mode::Blocks oracle interprets every original 68000 and Z80 instruction. Its 85,403 frames, 2,845 state samples, 934 RGB pictures and all 137,692,732 PCM bytes match static execution. Earlier Native-reference matrices execute translated functions with original-instruction fallback only at uncovered sites; those checks do not independently interpret every covered instruction. Neither reference establishes hardware GPU/DSP parity.

The corresponding-source archive contains all 181 source/support files and 90 compilation units, licenses, portable build instructions and twelve reusable input-only QA fixtures. An independent extraction and build reproduced the published WASM, JavaScript and source ZIP byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `ssf2t-native.wasm` (15,262,415 bytes) | `6ca7d1741e0bba5c616b32121f7c955f10fa655c8b7453a1275d1b4adb79ab4b` |
| `corresponding-source.zip` (2,353,231 bytes) | `f0f0bfc64c915c4bebc838156afadc67836d1bcb3fa208fcf54566f12a9b4fde` |

Only the twelve files in `ssf2t-ai/deployment-allowlist.json` are published. The source links, current scope and original licenses are available from the preview's About page.

Remaining work includes other fighter endings and exceptional mechanics, Q1 spatial DSP and three ADPCM voices, and integrating the main AI Edition's Final Fight roster, blood and finishers into this native game. A full Ryu clear is one verified playthrough, not proof of all character paths or full-game parity.


The special-input follow-up recovers original dispatch branches `08BCD4` (Dhalsim), `092CCC` (Cammy) and `0947C8` (T. Hawk), which previously stopped in both player slots. Six ordinary dual-stick tapes match a full independent 68000/Z80 instruction oracle for 34,015 frames, 1,136 state samples, 570 complete RGB pictures, sampled full RAM/video RAM and 54,840,792 PCM bytes. The browser independently matches all 1,136 states and 570 pictures. The source includes `qa/test-mechanics.cjs` and the six authored input/hash fixtures.

All 32 standard fighter/slot input-family sweeps complete without an uncovered branch; these sweeps include naturally occurring KO/round transitions and do not establish activation of every attempted command. All 17 old/Akuma browser cases pass again. The updated build also matches the existing 98-case/560,877-frame native-reference matrix and 196 RGB pictures, and repeats Ryu's full arcade clear and the Balrog/Vega/Honda common-outcome fixtures. Reference-mode and hardware-parity limits above remain applicable. A clean source extraction reproduces the updated WASM, JavaScript and source ZIP exactly.


A separate forced-ending diagnostic now covers all17 standard/hidden fighters on the published native code. Static execution and offline full Mode::Blocks 68000/Z80 instruction execution match1,088event samples,2,386complete captured RGB pictures and387,556,744PCM bytes across240,380frames. Every case reaches its native ending and returns to title with zero strict fallback. Inputs and explicit final-ladder/health fixture writes match between both runs. The saved [diagnostic evidence](SSF2T-ENDING-DIAGNOSTICS.json) records these writes and hashes. These are forced ending diagnostics, not additional genuine arcade clears; the comparison does not cover every RAM byte, a browser replay or hardware DSP/graphics parity.
