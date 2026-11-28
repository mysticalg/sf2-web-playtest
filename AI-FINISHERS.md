# AI Edition finishers

Current contact pauses: every real finisher hit holds both contact poses for six physical scene ticks (100 ms at 60 Hz). This hold no longer shrinks as the combo accelerates, and accelerated animation steps cannot consume it. The rare 200-hit ending retains a shorter two-tick hold. Existing contact caps remain six ordinary hits per second and twenty in the rare fast ending; actual move startup can make the combo slower. Final impact audio and finishing effects still trigger immediately; move cleanup/victory waits until the contact hold ends.

After an unblocked final-round KO, the winner gets a short **FINISH THEM** window. This is available when that winner already has one round win. The first-round KO, double KO, timeout and lethal guard chip keep their ordinary round handling. Practice mode disables finishers.

Use the winner's normal special motion, charge input, or punch-plus-kick shortcut. Release a held shortcut before pressing it again. The CPU can also start a finisher. After the final-round blow, the victim follows native knockdown physics, stays on the floor for at least one second, then plays the original get-up at half speed into dizzy. The attacker can position freely throughout this protected get-up; attacks cannot connect until the victim is ready. The **FINISH THEM** input opportunity lasts four seconds; walking, crouching and jumping remain available. The background darkens and the original CE boss-ending march plays (Bison's `SF2ENDCE[8].mus`, command `0x8c`; the native capture's boss-ending cue, distinct from his stage theme). Timeout drops the victim and awards the ordinary result once.

The automatic combo has five ground punches/kicks, a heavy crouching sweep to launch on genuine contact, then native jump punches/kicks while both actors rise into an authored air juggle. The actors descend smoothly before the selected special, which retains its original animation, projectile and grab timing. Native collision boxes determine attack spacing and air height. Other fighters use their own existing normal, jump and special animations; an unavailable launcher/air descriptor falls back to that fighter's reachable normal. This is cinematic choreography, not a claim that the original game supported these juggles.

Ordinary deterministic totals remain **16-80 confirmed contacts**, including the finishing special. Counted contacts and admitted damage callbacks are separated by at least ten game ticks (at most six per second at 60 Hz). A separate deterministic hash selects a **1-in-1,024 exceptional 200-hit plan**; only its final quarter accelerates, with at least three ticks per contact (at most twenty per second). Shuffled six-button bags remain intact, with the first bag's heavy kick placed sixth for the launcher. The on-screen counter increments only through actual damage/contact callbacks. Planning consumes no gameplay RNG.

Use down to enter crouching, up to return to standing, then a separate up press to jump into an airborne juggle. Down from air returns to standing, then a separate down press crouches. Directions take effect between real attacks; holding one direction never skips a posture. Air juggles rise and descend naturally over roughly three seconds. Without directional input the existing automatic choreography remains available.

Each hit adds blood. Only the selected final special's actual damaging contact detaches all six body pieces. Every visible piece is an unscaled crop/mask of the victim's current native sprite pixels and palette. Pieces fall, bounce and remain on the floor. The victim death scream, native flame art and one heavy impact begin at that same final contact. Five quieter impact repeats follow at 500 ms intervals; character-specific special audio continues normally. Reset and scene exits stop pending repeats. The camera captures the current zoom at triggering, keeps that zoom unless the fighters need more room, and moves only as necessary to keep them visible. Winner afterimages begin only with the first confirmed finisher contact. Each source-palette pose drifts horizontally behind its recorded facing in world coordinates and darkens into an opaque black silhouette; its transparent background stays transparent. Samples are emitted at most once every ten ticks (six per second at 60 Hz), including contact-triggered samples. They expire after 90 ticks, with at most 24 retained. The final special contact immediately clears the trail and stops emission; no afterimages linger into the result. Its fading impact audio echoes continue independently. The existing winner portrait presentation is retained.

Evasive specials have no invented damage: Vega's backflip and Belger's escape hops complete their actual movement, then chain into that fighter's own damaging attack. Possessed Ken's later heat attacks execute their required real preceding heat chain; the selected final attack supplies the finishing contact. Guy's finishing wall dive aims its launch velocity toward the stunned target during its original active window; normal gameplay movement is unchanged.

The input window lasts four seconds. With no special input, the ordinary KO and result continue. Pause works normally; character select, title, restart and edition changes clear the cinematic and attached actors. `SF2AI.skipFinisher()` explicitly skips an active sequence into the ordinary result and awards the round once. Held buttons, another player's input and unavailable specials cannot start it.

This is an authored AI Edition extension, not a recovered Capcom finishing system. Faithful WW and CE do not run it.

## Integration

`ai_finishers.js` owns only deterministic cinematic state, source-pixel masks, detached pieces and trails. `ai_finishers_sf2.js` binds the existing actor, throw, projectile, blood, voice, camera and portrait paths. Both scripts load before `game.js`.

The generic controller accepts a host with `context`, `art`, `prepare`, `pose`, `specials`, `begin`, `animate`, `position`, `complete` and `fallback` callbacks. Optional callbacks supply anatomy, actual input parsing, blood, impacts, flames, echoes, framing and cleanup. Positions are world pixels with Y upwards. The controller exposes `offer`, `request`, `input`, `step`, `notify`, `art`, `draw`, `clear`, `blocksRound`, and read-only diagnostics.

`offer(victim,{unblocked:true})` accepts an eligible lethal hit. The game adapter briefly protects the already-defeated victim's actor during the cinematic so the real grab and hit controllers can run. The round controller is gated, actual damage calls notify the finisher, the HUD continues to display zero health, and completion/cancellation restores the victim to zero HP. Every planned normal attack and the selected special must produce a genuine damage/contact callback. Only the first confirmed contact advances a planned stage; special setup hits cannot replace the selected finishing contact. Match-seeded planning never consumes gameplay RNG. Missing contacts or unsupported moves return safely to the ordinary KO; there is no timed fake-hit fallback in the game adapter. A timeout preserves the original killing special's KO effects and saved voice.

`begin` returns a bounded move descriptor; `animate` advances real actor/projectile logic and reports completion. `notify(winner,victim,contactId,{final})` consumes genuine contacts once. Immediate-damage grabs are admitted before their native startup call. Pure `art`/`draw` queries, including queries on latched actor copies, cannot mutate the cinematic.

Blood reuses the shared pools, capped at 384 live particles and 1,536 floor stains. The finisher caps native fragments at six, emitters at ten and winner trail samples at 24. Native pixel hulls determine fragment floor contact. A move watchdog and total sequence watchdog prevent unfinished controllers from holding the round indefinitely. Source masks and portrait cutouts are created once per finisher, not every render.

## Regression checks

Run a local HTTP server for the repository, then run these from the repository root. Set `SF2_TEST_URL` for another server and `SF2_ARTIFACTS` for another output folder. The scripts use local Playwright or the installed Codex web-game skill's Playwright; no application routes are replaced.

```
node tests/ai-finishers-specials.browser.cjs
node tests/ai-finishers-pixels.browser.cjs
node tests/ai-finishers-lifecycle.browser.cjs
node tests/ai-finishers-heroes.browser.cjs
node tests/ai-finishers-faithful.browser.cjs
```

Verified with the integrated Final Fight heroes:

- 180 mirrored special-choice cases: all 12 original CE fighters, the Final Fight bosses, Damnd, Evil Ken, Evil Ryu, Guy, Cody and Haggar. Every automatic button and final special contacts through the real controllers.
- 48 mirrored victim cases: all six native fragments are nonempty; 672,520 opaque RGBA channels reconstruct exactly; 192 upright/inverted native-facing compositions match; every settled fragment's rotated pixel hull meets the floor. Hidden portions of a limb remain hidden in its original pose; the masks add no invented pixels.
- 75 lifecycle cases: original quarter-circle and charge inputs, fresh shortcuts, CPU activation, first-round/chip/double KO handling, timeout with original SKO echo, pause, render purity, select/reset/skip across all phases, native-error fallback, watchdog, saturated blood pools, real piledriver interruption, retained winner effects, automatic configured-match return, actual roster/palette reselection into a new fight and edition cleanup.
- 22 hero/weapon cases: Cody's held knife, an old knife already in flight, replacement-knife ownership, empty-knife rejection and CPU choices; Haggar's real hold-to-manual-piledriver conversion; Andore's long backward recoil and released victim states in both slots.
- Baseline comparison against `096d257`: 60 deterministic frame hashes and four rendered pixel hashes match for faithful WW/CE across four scenarios.

JSON traces and source-part contact sheets are written under `work/finisher-tests/`. The broader user goal, asset authoring and original Final Fight controller parity have separate coverage.

A keyboard-driven action/screenshot run also covered the prompt, real quarter-circle trigger, automatic combo, winner portrait/death quote and automatic return to character select. That run reused the web-game skill's action loop with a deterministic final-round fixture and locally resolved Playwright; forced SwiftShader launch flags were removed because they stalled this Windows browser before game readiness.


2026-11-26 update: 2,000 plan seeds cover every inclusive hit count16..40 with distinct shuffled orders, exact repeatability and zero gameplay RNG reads.334 actual special choices complete with exactly their planned contact counts;75 lifecycle,88 partition/fragment and22 hero/weapon/grab cases pass. Twelve both-slot prompt-movement cases verify the native get-up, free walking in both directions, jump, crouch and successful finish after repositioning. WW/CE retain60 matching state hashes and four final pixel hashes.


## Previous accelerating death combo (superseded by the juggle update above)

The random total now spans 16 through 80 confirmed contacts, including the chosen special as the final contact. Each shuffled bag still cycles all six attack buttons before repeating. Opening normals advance at 0.55 animation/combat steps per game tick and rise quadratically to eight. Early contact pauses and hitstop diminish toward zero. Every intermediate step executes the original animation and real collision checks; no synthetic hit count replaces contact. The final special runs at its original cinematic speed, including projectiles and grabs. Native winner poses are sampled into the existing bounded afterimage pool during the late flurry. Normal gameplay controls, attacks and timing are unchanged.

Validation: 2,000 deterministic seeds cover all 65 inclusive totals without gameplay RNG reads. Forty-four maximum-length cases cover all 22 base fighters in both slots against varied native victim sizes, each reaching exactly 80 contacts and the final special. The first contact intervals average roughly 28ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ39 game ticks; the late flurry averages roughly one tick per hit. All 334 selected-special cases complete with their exact plans, alongside 75 lifecycle, 22 hero/weapon, 12 free-movement and 88 source-pixel/fragment cases. Faithful WW/CE retain 60 identical state hashes and four identical final pixel hashes.

Run `node tests/finisher-acceleration.browser.cjs` for the maximum-length cadence regression. Existing broad special tests now validate move/contact events rather than assuming each accelerated move is visible at a distinct rendered tick. The particle, trail and fragment bounds remain in place.

## Belger chair transition

Belger participants dismount before finisher poses/plans are prepared. Previously a mounted winner could keep substituting the rolling-chair image for every normal attack and afterimage. His native foot animations now remain visible and the abandoned chair stays an independent prop. Actual damage already detached a defeated Belger before the finish prompt; that path is retained. Ordinary round wins do not force dismounting. Tests seed the low-health edge state and trigger the KO with an ordinary LP, then cover all five selected finishers for base/Possessed Belger in both slots, Belger victims and mirrors:24maximum80-contact cases, plus2ordinary victories and round resets. The334selected-special and75lifecycle regressions stillpass.


## Juggle camera and integration

The adapter reserves room for the launch before takeoff, eases outward to fit both fighters, and holds the expanded width through landing. Position follows actor origins smoothly; animation-frame bounds can expand the view but cannot repeatedly zoom it back in. Normal stage camera behavior is unchanged. `game.js` has only two rendering hooks: background dimming after background scenery, and the contact counter in screen space. The existing cinematic-camera interface is retained for concurrent Turbo-selector integration.

`node tests/death-move-juggles.browser.cjs` checks ground/launch/air contacts, both facings, ordinary and exceptional timestamps, camera projection bounds, four-second timeout, slow recovery, music cue/restoration, trail direction, darkening and reset. The deterministic plan test also checks rare-plan frequency over 65,536 seeds. Older maximum-length and lifecycle suites use the new timing bounds; the previous fixed-camera test is replaced by containment/stability checks because airborne framing now moves deliberately.


## 28 November juggle validation

The complete pre-rebase matrix passed: 334 selected-special cases with exact planned contacts and cadence checks; 44 maximum 80-hit combos across the base roster in both slots; 75 lifecycle cases; 22 hero/weapon/grab cases; 88 source-pixel/fragment cases (1,250,704 reconstructed opaque RGBA channels); 12 prompt-movement cases; and 24 maximum-length Belger chair cases plus two ordinary victories. WW/CE matched 60 state hashes and four rendered pixel hashes. The plan test checks 2,000 repeatable shuffled plans plus rare-plan frequency over 65,536 seeds.

The branch was rebased onto Turbo release `6ff07c9`. The 20-case juggle matrix and 75 lifecycle cases passed again after rebase. Its rare Ryu and Dhalsim cases complete all 200 contacts in both slots. The matrix includes 1,526 rendered fighter-bound samples, exact four-second timeout, half-speed native get-up after a 60-tick floor hold, keyboard activation, world/camera-relative trail drift, opaque black silhouette pixels, lifetime cleanup and one-time result awards. Desktop (1100Ã—800) and phone-width (390Ã—844) rendering passed; the final browser health capture had no page exceptions, console warnings/errors or failed requests, and confirmed a live audio node receiving native command `0x8c`.

Run `node tests/finisher-turbo-handoff.browser.cjs` to check that switching away from an active juggle cleans its camera/protection/effects, the title selector still opens the bundled native Turbo game, Back removes the native frame, and AI Edition can then complete a fresh finisher. Browser tests should run sequentially while the PC is streaming. Physical gamepads and independent audio listening remain outside this finisher verification.

The Turbo handoff regression passed against `6ff07c9`: the native game loaded its bundled assets with zero CPU/sound fallbacks, Back removed the iframe, and the subsequent AI finisher completed exactly 24 contacts and awarded once. A direct WW/CE comparison against `6ff07c9` again matched all 60 state hashes and four pixel hashes. The Turbo asset test also verified all packaged regions, original boot/fight execution, and missing/corrupt data rejection.
