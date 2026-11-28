# AI Edition victory sound cues

The AI round controller now dispatches the existing character victory animation's sound markers. This repairs Honda's celebration (0x6c), Guile's two arm-motion cues (0x26), Zangief's celebration (0x4a), and Vega's laugh (0x75). Other existing variants retain their own markers, including Honda 0x4a, Vega 0x4d and Sagat's alternate 0x4a. A marker plays once per animation entry per round, including when the finisher and the round controller select the same victory animation again. Resetting a round clears the deduplication state.

The AI round's existing perfect-health banner now also queues the original `Perfect` command 0x55 after the winner announcement. Character cues are not invented for victory animations that are silent in the source. Guest celebration handling remains with its character adapter. Stock World Warrior and Championship Edition keep their existing paths.

Source evidence: CE Honda 0x3eb4c, Blanka 0x3f6fc, Guile 0x407aa, Zangief 0x42738, and Vega 0x4bdd8 pass the animation's low byte at actor+0x15 to the original sound entry 0x6388. Chun-Li 0x41728 uses a signed positive test; its 0xff handshake is not a sound. Sagat's alternate selection sound is already translated in `ce_winner.js`. Bison's shirt-fragment and Dhalsim's turn flags are not sound commands and are excluded.

`tests/victory-audio.browser.cjs` checks all twelve stock-base AI fighters in both slots through round end, eight actual completed finishers, repeat/reset behavior, the Perfect command, and non-silent PCM rendered by the original CE sound board for the restored cues. This establishes event routing and audio generation; it is not a human listening assessment or an assertion of full winner-controller parity.
