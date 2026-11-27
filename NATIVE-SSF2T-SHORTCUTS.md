# Native special shortcuts

This optional feature is part of the native preview, which remains an incomplete part of the full AI Edition integration.

The optional checkbox enables mixed punch/kick chords. The per-player guide lists the available moves for the selected fighter and original/old style. Manual motions remain available. Shortcuts emit original controller inputs; they do not write move, damage, position, health or meter state. Supers require the original full meter. Throws still require native range and eligibility. Charge moves accumulate their normal charge time. Vega's flying grabs require a second chord in the air, near the opponent.

The two 720 supers use a neutral jump to buffer the native rotation. The adapter observes descent before sending the motion; it does not force a jump, grab or super state. Hit reactions interrupt pending input sequences, and a missed landing buffer expires instead of holding control indefinitely. Motion endings keep direction and button timing distinct where required by the original input parser.

Command provenance: the original [Capcom SSF2T manual](https://www.digitpress.com/library/manuals/3do/super_street_fighter_2_turbo.pdf), inspected as rendered pages, and activation in the native game. In particular, Spin Knuckle uses back/down-back/forward and Banishing Flat uses forward/down-forward/down. These motions were checked through native activation, rather than inferred from a successful ordinary attack.

Validation and remaining integration work:

- The catalog contains 96 new-style/Akuma and 54 old-style entries. All 300 entries across both player slots activate in native fights, covering both facing directions. These tests check activation; follow-up strikes, repeated hits and every gameplay context still require further testing.
- Separate contact tests verify meter consumption and actual grabs for Final Atomic Buster, Double Typhoon and Rolling Izuna Drop. A wall launch alone does not prove Vega's super completed.
- Native recovery adds original dispatch paths at 0747D0, 09CF72, 09E5C4, 09F9C0, 0A1806, 0A385C and 0A4AC2. These were actual native stops exposed by shortcut tests, not replacement move implementations.
- Seven recovery replays cover 30,629 frames and 513 sampled pictures. Strict native output matches the independent 68000/Z80 instruction reference in sampled state, RAM/video hashes and complete RGB/PCM streams. The browser also matches sampled state, RGB pictures and complete PCM. Five cases use ordinary inputs only; the Yoga Inferno case logs a full-meter write and the old Zangief grab case logs position writes in the diagnostic harness. The product has no generic RAM-write API.
- Input admission diagnostics restore a test checkpoint and log any gauge/position setup writes. They demonstrate activation, not genuine arcade playthroughs. Effective controller tapes are preserved separately for independent reference replay.
- The 98 existing native compatibility cases pass, totaling 560,877 frames and 196 pictures with identical state/RAM/video/audio hashes to the published baseline. A separate 4,132-check controller test covers all 4,096 disabled masks, menu pass-through, held-chord suppression, hit interruption, meter eligibility and missed-buffer release.
- Full Ryu, Ken, Cammy and Guile browser arcade replays pass on this build. The 206-file source archive cleanly rebuilds all 91 compilation units and reproduces eight checked artifacts byte for byte. Packaged activation and diagnostic QA also pass. Additional gameplay contexts and the full native AI/Final Fight integration remain unfinished.

The recurring user-reported 4–5-second pause remains unresolved. A 60-second local trace caught later Canvas stalls but no regular 4–5-second pattern. An empty lamp-crop optimization had exact pictures but no consistent speedup and was discarded.
