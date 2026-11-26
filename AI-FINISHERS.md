# AI Edition finishers

After an unblocked final-round KO, the winner gets a short **FINISH HIM** window. This is available when that winner already has one round win. The first-round KO, double KO, timeout and lethal guard chip keep their ordinary round handling. Practice mode disables finishers.

Use the winner's normal special motion, charge input, or punch-plus-kick shortcut. Release a held shortcut before pressing it again. The CPU can also start a finisher. After the trigger, the winner automatically cycles **LP, MP, HP, LK, MK, HK**, then performs the selected special. The automatic sequence uses original standing, close or crouching attacks chosen to reach the victim's actual native collision boxes.

Each hit adds blood. The final medium/heavy kick contacts detach the victim's arms and legs; the special's actual damaging contact detaches the head and remaining torso. Every visible piece is an unscaled crop/mask of the victim's current native sprite pixels and palette. Pieces fall, bounce and remain on the floor. Native flame art, the actual special voice echo and close camera framing accompany the final strike. Winner afterimages continue through the victory pose and winner portrait screen.

Evasive specials have no invented damage: Vega's backflip and Belger's escape hops complete their actual movement, then chain into that fighter's own damaging attack. Evil Ken's later heat attacks execute their required real preceding heat chain; the selected final attack supplies the finishing contact. Guy's finishing wall dive aims its launch velocity toward the stunned target during its original active window; normal gameplay movement is unchanged.

The input window lasts five seconds. With no special input, the ordinary KO and result continue. Pause works normally; character select, title, restart and edition changes clear the cinematic and attached actors. `SF2AI.skipFinisher()` explicitly skips an active sequence into the ordinary result and awards the round once. Held buttons, another player's input and unavailable specials cannot start it.

This is an authored AI Edition extension, not a recovered Capcom finishing system. Faithful WW and CE do not run it.

## Integration

`ai_finishers.js` owns only deterministic cinematic state, source-pixel masks, detached pieces and trails. `ai_finishers_sf2.js` binds the existing actor, throw, projectile, blood, voice, camera and portrait paths. Both scripts load before `game.js`.

The generic controller accepts a host with `context`, `art`, `prepare`, `pose`, `specials`, `begin`, `animate`, `position`, `complete` and `fallback` callbacks. Optional callbacks supply anatomy, actual input parsing, blood, impacts, flames, echoes, framing and cleanup. Positions are world pixels with Y upwards. The controller exposes `offer`, `request`, `input`, `step`, `notify`, `art`, `draw`, `clear`, `blocksRound`, and read-only diagnostics.

`offer(victim,{unblocked:true})` accepts an eligible lethal hit. The game adapter briefly protects the already-defeated victim's actor during the cinematic so the real grab and hit controllers can run. The round controller is gated, actual damage calls notify the finisher, the HUD continues to display zero health, and completion/cancellation restores the victim to zero HP. The six normal attacks and selected special must produce genuine damage/contact callbacks. Missing contacts or unsupported moves return safely to the ordinary KO; there is no timed fake-hit fallback in the game adapter. A timeout preserves the original killing special's KO effects and saved voice.

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
