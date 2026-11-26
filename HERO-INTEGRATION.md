# Final Fight heroes in SF2 AI Edition

Guy, Cody and Haggar have independent selectable roster slots for either player, battle profiles, colour choices, native HUD heads, generated large portraits, and arcade opponents. The roster contains 22 fighters. Their home encounter reuses the original Final Fight Slum Courtyard stage and music already present in this project; it is not a newly reconstructed individual stage for each hero.

The original Final Fight actions drive Guy's combo/escape/wall rebound and airborne attacks, Cody's combo/uppercut/double kick/knife actions, and Haggar's lariat, carry, knee, throw and jump-to-piledriver sequences. Ordinary attacks participate in the shared six-button chain, special-cancel and timed-breaker system. Six-button bindings, strength timing, health, damage, SF2 hit/block admission, shortcut motions, and the roster/arcade adaptation are authored SF2 behavior.

## Controls and weapon behavior

- The in-game AI help lists each hero's simultaneous punch + kick shortcuts. Original motions remain available.
- Guy can hold Up + away at a wall during an ordinary jump to brace and rebound. Air attack buttons dispatch original airborne action families.
- Haggar can grab, carry the victim, jump, and tap a fresh punch in the air to invert the victim and piledrive. A held punch does not accidentally trigger the transition.
- Hold Down and tap punch beside a dropped knife, katana or pipe to pick it up. Any grounded attack button uses the held weapon with light, medium or heavy timing. Guy/Haggar throw knives; Cody stabs nearby and throws at range. Cody's knife special shortcuts require a held knife, which the help explicitly states.
- **Down + armed attack performs the complete original standing weapon action, then returns to crouch.** The action uses standing body/push boxes and ordinary mid/high guard admission. It is not a low weapon strike. Unarmed crouched attacks retain their separate low action/boxes.
- Original armed pickup/kneeling art is used for armed crouch/guard. Jump and airborne body poses remain their original actions; a weapon is visible only when the original frame has a matching attachment row.
- Knockdowns, grabs and escape actions drop the held weapon. Shared items can be picked up by another hero without cloning the item or deleting an unrelated currently held weapon. An already flying knife continues to collide after its owner picks up a replacement weapon.

Each hero round supplies a floor knife, katana and pipe; Cody also begins holding a knife. Floor supplies, persistent pickup opportunities, arena-edge settling, and bonus-platform positioning are deliberate SF2 equipment adaptations. This does not recreate Final Fight campaign breakable-object drops, original weapon expiry/limited-use economy, or stage progression.

## Original assets and provenance

Source: `mysticalg/final-fight-web-playtest`, native export at commit `5ec2d8c0c6e1465c2281d390a32e022126ff0ec9`. The independent source extraction handoff is `work/hero-assets/HERO-ASSETS.md` in the authoring workspace.

The battle bodies contain Guy 70, Cody 67 and Haggar 78 original poses. The six original body atlas PNGs are unchanged by this integration. Runtime left-facing normalization is a literal mirror of exported RGBA pixels, with the corresponding origin transformation; Haggar retains the existing one-pixel foot alignment correction. The large 96x96 profiles are generated assets, with prompts and original references recorded in `ai-heroes/PROFILE-GENERATION.md`; the roster tiles use original HUD heads.

The initial weapon export omitted held-weapon attachment images. This integration appends 37 missing original weapon poses, preserving earlier frame indices, native image origins and attachment offsets. The three weapon atlases now contain 29 knife, 23 katana and 29 pipe poses per facing. The source export's pipe/katana names were swapped; the verified visual identities are weapon 1 = katana and weapon 2 = pipe. Extraction and RGBA hashes are recorded by `work/hero-integration/recover-held-weapons.py` and `weapon-attachment-proof.json`.

Original source `web/game/weapon.js` uses `attachments[weaponPose & 127]` to decide held-art presence. `weaponPose` bit 7 signals a projectile launch, not an extra orientation transform. None of the 215 exported hero body image records sets that bit; the hero action flags drive the adapted throw launch. `player-weapons.js` and `knife.js` provide the hand attachment and per-character knife speeds (Guy 7, Cody 8, Haggar 6 pixels/tick). Knife throw animations have no simultaneous melee damage box in this host, so the emitted knife provides the single contact.

All 22 exported original hero sound clips decode through the hero audio adapter. Hero finishing-move echo recording retains its hero sound code and audio buffer identity.

## Runtime boundaries

`game.js` dispatches guest behavior through `isFFHero`, `ffAdapter` and `ffPack`. Heroes use `SF2AIHeroes`, bosses use `SF2AIFF`, and Damnd retains his existing adapter. Hero states are `AIHeroMove`, `AIHeroGrab`, `AIHeroWall`, and `AIHeroAir`. Held victims share `AIFFHeld` and `AIFFThrow`, so the existing generic held-art transform and anatomical anchors remain usable.

`ai_hero_weapons.js` owns a single world item pool and wraps the hero module's weapon hooks. Contacts enumerate owned flying items rather than relying on a held-item reference. Each item has one UID, owner and phase. The pool advances once per game tick, clears on edition change, and resets on new rounds/bonus encounters. Public finisher hooks are:

```js
SF2AIHeroWeapons.hasKnife(player)
SF2AIHeroWeapons.validMove(player, move)
SF2AIHeroWeapons.cancelFlights(owner = null, room = {left: 0, right: 720})
SF2AIHeroWeapons.settleOwned // alias of cancelFlights
```

`owner` accepts a player or slot; null settles every flight/toss item. Settling clears projectile admission while preserving held weapon references. Finisher attachment predicates must include `AIHeroGrab`. The merged production finisher adapter checks these weapon hooks, preserves the winner's held item, settles earlier flying knives and rejects unavailable Cody knife requests. Hero grabs and piledrivers use their actual controllers and anatomical anchors during the cinematic.

## Verified locally

Browser tests ran against `http://127.0.0.1:8766` in the isolated integration checkout. Real keyboard tests cover fresh title/menu selection, colour confirmation and battle admission for each hero in both slots. Collision/controller tests advance actual game inputs in controlled fixtures. Evidence/scripts are preserved under `work/hero-integration/`:

| Evidence | Result |
| --- | --- |
| `menu-results.json` | Six fresh menu-to-fight paths; P1 arcade and P2 versus; no select softlocks |
| `core-results.json` | 36 standing normals deal damage; 26 shortcut start/recovery cases; original throws; palette groups; 22 audio buffers; 22-opponent ladders |
| `special-contact-results.json` | 78 shortcut hit/block/miss cases; real damage, bounded chip, miss recovery and attachment cleanup |
| `weapon-results.json` | 18 hero/type/slot pickup, attack, drop and UID cases |
| `ownership-regressions.json` | Drop A/equip B/other player picks A; flying A/replacement B; six single-contact normal knife throws |
| `edge-results.json` | Transfers, interrupted pickups/holds, both-slot manual Haggar carry/pile and edition cleanup; zero measured upright carry-head anchor error |
| `cleanup-results.json` | 14 owner/all flight cancellation, held-reference preservation, fatal-drop and round-reset checks |
| `air-weapon-results.json` | 18 original airborne pose/weapon visibility/landing cases |
| `weapon-pose-proof.json` | 36 native attachment poses across heroes, weapon types, both facings and standing/Down input; rendered contact sheets inspected |
| `chain-results.json` | Both-slot six-button chains and special cancels; each hero's timed breaker |
| `bonus-results.json`, `bonus-knife-results.json` | All heroes contact car/barrels/drums; native knife projectile contacts and cleanup; chain continuation fixtures |
| `hard-cpu-results.json` | Nine hard-CPU runs, 2,100 ticks each from both room ends/close; 364–690 cumulative damage, own normals/specials/grabs and weapon pickup |
| `browser-pixel-proof.json` | All 592 source-facing crops decode with matching original RGBA hashes |
| `canonical-runtime-proof.json` | All 296 canonical runtime crops match the literal source mirror |
| `faithful-regression.json` | WW and CE each match the baseline state-for-state for 394 controlled frames |

`node --test tests/ai-chain.test.cjs tests/preview-build.test.cjs` also passes, including 720 arbitrary button orders. The skill's official web-game client was attempted; its forced SwiftShader flags caused embedded PNG decoding failures on this machine. A preserved local copy removes those flags and adds a test-only step/readiness bridge. Its final rendered smoke is `guy-final-smoke/shot-0.png`; no product rendering workaround was added.

These are local integration checks, not a live deployment or proof of complete Final Fight parity. Genuine crouched weapon strike artwork remains an explicit missing SF2 pose family. Original native movement/action and held-weapon pixels are preserved; the six-button combat adaptation does not claim identical Final Fight collision, campaign item lifetime, or stage economy.

## Merge boundary

The isolated branch is `codex/hero-roster-integration`, based at `5e77056838e51685d67e0b3464018bef383b0415`. Apply only the diff after that snapshot. Its baseline contains copied unpublished root boss work and the initial hero body/audio/profile assets; do not transplant baseline boss files over newer production fixes. Main's first hero commit must also admit the initial `ai-heroes` assets and `ai_heroes.js`/`ai_heroes_data.js` which were previously untracked there. This branch has not been pushed.


## Merged AI host verification

The final package was merged with the native-contact finisher adapter, Sodom's restored blades/waist registration and Andore's strong post-piledriver recoil. Fresh merged checks pass36normal contacts,26shortcut admissions,78special hit/block/miss cases, six real menu paths, all ten guest map/VS/fight admissions, and the original edition hash comparisons. The finisher matrix now covers180special choices and48native body/fragment cases including the heroes;75lifecycle cases and22specific hero/weapon/grab checks cover configured-result return, new guest selection, unavailable knives and existing projectile cleanup. Victory text has separate normal/death coverage. True crouched weapon strike artwork and original campaign equipment economy remain the explicit boundaries above; this release supplies coherent original standing weapon actions from Down input.
