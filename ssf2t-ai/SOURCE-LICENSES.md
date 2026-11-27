# Source, licences and provenance

The native reconstruction/runtime uses GPL-3.0-only code from [tmcleroy/cps2recomp](https://github.com/tmcleroy/cps2recomp), pinned at `e266571432b12552a986fb66e702810df32947b3`. All corresponding compiled C++ functions, support, required library files, web loader, licence notices and a standalone Emscripten build are in [corresponding-source.zip?v=52b35c2cca8a51c2](corresponding-source.zip?v=52b35c2cca8a51c2).

The MAME-derived CPS2 cipher is BSD-3-Clause (Paul Leaman, Andreas Naive, Nicola Salmoria and Charles MacDonald). YMFM and audio-file helpers retain their original notices. The source archive preserves every included file's notices and the full reconstruction GPL text. The original game and artwork remain Capcom material; this package does not claim original ROM assets are GPL-licensed.

Static functions were recovered from the user's verified European SSF2T 940223 program, using independent opcode/data views. Japanese entry names seed discovery only; actual function bodies come from the European program. The original version 1.04 sound program drives the QSound reference mixer. The European master key comes from official historical MAME hardware records, not an invented byte-identical key file.

No raw ROM archive, DATA/OPS dump, graphics/sample region or private preload pack is distributed. The player supplies matching original files locally. The browser verifies all 23 original files and all five assembled regions; no archive or extracted ROM is sent to a server.

See [SCOPE.md?v=a60643a560d6f271](SCOPE.md?v=a60643a560d6f271) and [source-proof.json?v=a60643a560d6f271](source-proof.json?v=a60643a560d6f271) for verified evidence and limits. Complete Ryu, Ken and Cammy arcade clears through the original ending, staff roll and title are verified. Other fighter endings and mechanics remain under test; the full-game goal is not complete. The reference mixer omits Q1 spatial DSP/ADPCM features, and internal byte comparisons do not establish hardware parity.

The native AI presentation adapter is GPL-3.0-only. Original head-box and camera semantics are adapted from the pinned reference games/ssf2t/src/{ssf2t.h,training.cpp,widescreen.cpp}, with credit to Tommy McLeroy. It only reads original state and paints an optional canvas layer.
