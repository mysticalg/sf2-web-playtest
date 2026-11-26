# Native Super Street Fighter II Turbo preview

The AI Edition now links to an independent native preview of the European 940223 game. Open `ssf2t-ai/` and select your own `ssf2t.zip`; its 23 files and five assembled regions are checked locally. The game does not upload the archive. The published package contains no ROM archive, raw program/graphics/audio regions or preload pack.

Original controllers, collisions, stages, sprites and the 1.04 sound program execute as statically translated native functions. No Champion Edition implementation replaces the game, and no CPU opcode decoder or interpreter fallback is linked. Uncovered native dispatch aborts so missing branches remain observable.

The packaged browser build passes all 32 standard fighter/slot scenarios, sixteen original old-character codes and Akuma. A complete Ryu arcade tape genuinely wins 24 rounds and twelve matches, including CPU Akuma, then plays the original ending, staff roll and title. That tape uses tool-assisted ordinary stick/button inputs; replay does not load states or inject health, results, stages, RNG or timers. Separate ordinary-input replays cover Continue credit spending, resumed fighting and Game Over.

Independent checks against the main site's staged package matched 3,272 state samples and 1,032 complete RGB pictures across 98,200 native frames. Actual local file selection, post-ending keyboard Start and the Reset button passed; all requests were GET and no CPU/Z80 fallback or browser errors occurred. Original-instruction reference equality does not prove hardware GPU/DSP parity.

The corresponding-source archive contains all 175 source/support files and 86 compilation units, licenses, portable build instructions and reusable input-only QA. An independent extraction and build reproduced the published WASM, JavaScript and source ZIP byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `ssf2t-native.wasm` (14,277,561 bytes) | `262fe757b0c91db4b954aa05a8166143c40a21e13cbe645d4756b73af662cef9` |
| `corresponding-source.zip` (2,228,166 bytes) | `39223a7c7e4f93bc8c7208b3ddace5f9ba5161bdbbb116ea3887156a99d5e8ab` |

Only the twelve files in `ssf2t-ai/deployment-allowlist.json` are published. The source links, current scope and original licenses are available from the preview's About page.

Remaining work includes other fighter endings and exceptional mechanics, Q1 spatial DSP and three ADPCM voices, and integrating the main AI Edition's Final Fight roster, blood and finishers into this native game. A full Ryu clear is one verified playthrough, not proof of all character paths or full-game parity.
