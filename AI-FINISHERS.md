# AI Edition finishers

After an unblocked final-round KO, the winner gets a short **FINISH HIM** window. This is available when that winner already has one round win. The first-round KO, double KO, timeout and lethal guard chip keep their ordinary round handling. Practice mode disables finishers.

Use the winner's normal special motion, charge input, or punch-plus-kick shortcut. Release a held shortcut before pressing it again. The CPU can also start a finisher. After the trigger, the winner automatically cycles **LP, MP, HP, LK, MK, HK**, then performs the selected special. The automatic sequence uses original standing, close or crouching attacks chosen to reach the victim's actual native collision boxes.

Each hit adds blood. The final medium/heavy kick contacts detach the victim's arms and legs; the special's actual damaging contact detaches the head and remaining torso. Every visible piece is an unscaled crop/mask of the victim's current native sprite pixels and palette. Pieces fall, bounce and remain on the floor. Native flame art, the actual special voice echo and close camera framing accompany the final strike. Winner afterimages continue through the victory pose and winner portrait screen.

Evasive specials have no invented damage: Vega's backflip and Belger's escape hops complete their actual movement, then chain into that fighter's own damaging attack. Evil Ken's later heat attacks execute their required real preceding heat chain; the selected final attack supplies the finishing contact.

The input window lasts five seconds. With no special input, the ordinary KO and result continue. Pause works normally; character select, title, restart and edition changes clear the cinematic and attached actors. `SF2AI.skipFinisher()` explicitly skips an active sequence into the ordinary result and awards the round once. Held buttons, another player's input and unavailable specials cannot start it.

This is an authored AI Edition extension, not a recovered Capcom finishing system. Faithful WW and CE do not run it.

## Integration

`ai_finishers.js` owns only deterministic cinematic state, source-pixel masks, detached pieces and trails. `ai_finishers_sf2.js` binds the existing actor, throw, projectile, blood, voice, camera and portrait paths. Both scripts load before `game.js`.

The generic controller accepts a host with `context`, `art`, `prepare`, `pose`, `specials`, `begin`, `animate`, `position`, `complete` and `fallback` callbacks. Optional callbacks supply anatomy, actual input parsing, blood, impacts, flames, echoes, framing and cleanup. Positions are world pixels with Y upwards. The controller exposes `offer`, `request`, `input`, `step`, `notify`, `art`, `draw`, `clear`, `blocksRound`, and read-only diagnostics.

`offer(victim,{unblocked:true})` accepts an eligible lethal hit. The game adapter briefly protects the already-defeated victim's actor during the cinematic so the real grab and hit controllers can run. That protection never changes normal combat: the round controller is gated, actual damage calls notify the finisher, and completion/cancellation restores the victim to zero HP. The six normal attacks and selected special must produce genuine damage/contact callbacks. Missing contacts or unsupported moves return safely to the ordinary KO; there is no timed fake-hit fallback in the game adapter.

`begin` returns a bounded move descriptor; `animate` advances real actor/projectile logic and reports completion. `notify(winner,victim,contactId,{final})` consumes genuine contacts once. Immediate-damage grabs are admitted before their native startup call. Pure `art`/`draw` queries, including queries on latched actor copies, cannot mutate the cinematic.

Blood reuses the shared pools, capped at 384 live particles and 1,536 floor stains. The finisher caps native fragments at six, emitters at ten and winner trail samples at 24. Native pixel hulls determine fragment floor contact. A move watchdog and total sequence watchdog prevent unfinished controllers from holding the round indefinitely. Source masks and portrait cutouts are created once per finisher, not every render.

## Regression checks

Run a local HTTP server for the repository, then run these from the repository root. Set `SF2_TEST_URL` for another server and `SF2_ARTIFACTS` for another output folder. The scripts use local Playwright or the installed Codex web-game skill's Playwright; no application routes are replaced.

```
node tests/ai-finishers-specials.browser.cjs
node tests/ai-finishers-pixels.browser.cjs
node tests/ai-finishers-lifecycle.browser.cjs
```

Verified before the pending Final Fight hero integration:

- 154 mirrored special-choice cases: all 12 original CE fighters, the Final Fight bosses, Damnd, Evil Ken and Evil Ryu. Every automatic button and final special contacts through the real controllers.
- 42 mirrored victim cases: all six native fragments are nonempty; 610,448 opaque RGBA channels reconstruct exactly; every settled fragment's rotated pixel hull meets the floor.
- 66 lifecycle cases: original quarter-circle and charge inputs, fresh shortcuts, CPU activation, first-round/chip/double KO handling, timeout, pause, render purity, select/reset/skip across all phases, real piledriver interruption, retained winner effects and edition cleanup.
- Baseline comparison against `096d257`: 60 deterministic frame hashes and four rendered pixel hashes match for faithful WW/CE across four scenarios.

JSON traces and source-part contact sheets are written under `work/finisher-tests/`. The broader user goal, new hero assets and original Final Fight controller parity have separate coverage and are not established by these checks.
