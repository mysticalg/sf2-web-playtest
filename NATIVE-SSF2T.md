# Native Super Street Fighter II Turbo preview

The AI Edition now links to an independent native preview of the European 940223 game. Open `ssf2t-ai/` and select your own `ssf2t.zip`; its 23 files and five assembled regions are checked locally. The game does not upload the archive. The published package contains no ROM archive, raw program/graphics/audio regions or preload pack.

Original controllers, collisions, stages, sprites and the 1.04 sound program execute as statically translated native functions. No Champion Edition implementation replaces the game, and no CPU opcode decoder or interpreter fallback is linked. Uncovered native dispatch aborts so missing branches remain observable.

The packaged browser build passes all 32 standard fighter/slot scenarios, sixteen original old-character codes and Akuma. A complete Ryu arcade tape genuinely wins 24 rounds and twelve matches, including CPU Akuma, then plays the original ending, staff roll and title. That tape uses tool-assisted ordinary stick/button inputs; replay does not load states or inject health, results, stages, RNG or timers. Separate ordinary-input replays cover Continue credit spending, resumed fighting and Game Over.

The common-outcome update recovers Balrog and Vega's original victory controllers and Honda's defeat/Continue portrait paths. Six ordinary-input checks against the main site's staged package matched 4,111 state samples and 1,324 complete RGB pictures across 123,403 native frames. Actual local file selection, post-ending keyboard Start and the Reset button passed; all requests were GET and no CPU/Z80 fallback or browser errors occurred.

For the full Ryu clear and the three repaired outcomes, an offline Mode::Blocks oracle interprets every original 68000 and Z80 instruction. Its 85,403 frames, 2,845 state samples, 934 RGB pictures and all 137,692,732 PCM bytes match static execution. Earlier Native-reference matrices execute translated functions with original-instruction fallback only at uncovered sites; those checks do not independently interpret every covered instruction. Neither reference establishes hardware GPU/DSP parity.

The corresponding-source archive contains all 178 source/support files and 89 compilation units, licenses, portable build instructions and six reusable input-only QA fixtures. An independent extraction and build reproduced the published WASM, JavaScript and source ZIP byte for byte:

| Artifact | SHA-256 |
| --- | --- |
| `ssf2t-native.wasm` (15,017,816 bytes) | `4f74bd991fcb2448c57b5b8a6632d5715c46390ec2713b94710cf149dabd617c` |
| `corresponding-source.zip` (2,310,770 bytes) | `79cddb7714f43b71e1fdbc7e53df7019806a6ee101917c71b4e09d4a8a1a855f` |

Only the twelve files in `ssf2t-ai/deployment-allowlist.json` are published. The source links, current scope and original licenses are available from the preview's About page.

Remaining work includes other fighter endings and exceptional mechanics, Q1 spatial DSP and three ADPCM voices, and integrating the main AI Edition's Final Fight roster, blood and finishers into this native game. A full Ryu clear is one verified playthrough, not proof of all character paths or full-game parity.
