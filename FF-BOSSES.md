# Final Fight guests (AI Edition)

The original SF2 roster is joined by Damnd, Sodom, Andore, Edi. E, Rolento, Abigail and Belger. The seven gold-bordered tiles form the third selection row. Both players may select any guest, including mirror matches. Faithful WW/CE editions retain their original rosters and rules.

Arcade has the original twelve matches and bonus rounds followed by the Metro City route: Slum courtyard, Subway ring, West Side cage, West Side streets, Industrial elevator, Bay Area and Uptown penthouse. Each district has its own map marker, arena and CPU opponent; Belger finishes the route. Guest champions have their own result/ending card.

| Fighter | Specials in shortcut order | District |
|---|---|---|
| Damnd | Street Rush, Somersault Kick, Rising Smash, Barrel Call | Slum |
| Sodom | Katana Rush, Twin Blade Chops, Heavy Sword Chop, Gut Buster | Subway |
| Andore | Bull Rush, Chest Bump, Headbutt, Piledriver, Choke Hold, Flying Seat Drop | West Side cage |
| Edi. E | Police Pistol, Baton Rush, Baton Smash, Arrest and Batter, Pistol Burst | West Side |
| Rolento | Patriot Circle, Grenade Throw, Wall Kick, Shoulder Toss, Grenade Barrage, Grenade Retreat | Industrial Area |
| Abigail | Rage Charge, Giant Throw, Hammer Punch, Crushing Toss, Power Punch | Bay Area |
| Belger | Crossbow Volley, Escape Leap, Sky Bolt Rain, Escape Hop, Crossbow Butt | Uptown |

Shortcuts: LP+LK, MP+MK, HP+HK, MP+HK, LP+MK, HP+LK, respectively. Motions for the new guests: quarter-circle forward + punch, quarter-circle forward + kick, dragon-punch + punch, quarter-circle back + punch, quarter-circle back + kick, half-circle forward + punch (sixth move where available). Forward/back + medium/heavy at close range throws. Six attack buttons, crouching attacks, high/low guard, directional jumps, hit-confirm chains, special cancels, timed combo breakers, dizzy/fire/KO reactions and bonus-stage attacks are connected.

These are authored SF2 adaptations of the Final Fight bosses, not a claim of frame-exact Final Fight AI. Their native signature actions inform the extensions: swords/charge and gut punches; police baton/pistol/grab; staff/acrobatic kicks/grenades/shoulder throw; rage charge punch and wrestling; chair and crossbow volleys/escape jumps. Normal buttons are adapted to each boss's native fighting style, including weapon strikes and punches on kick-button inputs.

## Original art and additional art

Sodom animation ordering/origins come from mysticalg/final-fight-web-port, preview 5ec2d8c0c6e1465c2281d390a32e022126ff0ec9. Its palette is restored by comparison with an identical original arcade pose. Other guest bodies and district scenery use original Capcom arcade rips by shunninghuang from https://spritedatabase.net/game/608 (boss files15216/15217/15220/15221/15230/15232). Original art remains Capcom's property, for this non-commercial playtest. Arenas are cropped/composited/tiled into a flat SF2 fighting plane; camera, floor blood and actors share world coordinates.

Original portraits were16px HUD heads. The six new96px portraits were generated with the built-in imagegen tool using the original arcade sheets as identity references (Sodom/Andore/Edi. E, Rolento/Abigail/Belger). Damnd retains his recovered close-up. The sole new battle frame is Belger's missing horizontal KO pose, generated against his original sheet and normalized to its palette. Earlier generated body sheets were rejected for design drift and are not shipped. Native HUD heads remain alongside generated profiles for provenance.

## AI balance and rendering

Original fighters288HP, Evil variants272, Damnd360; guests300–420HP according to size/role. Combo damage scales100%,85%,72%,60%,50%,42%,35%,30%,25% from the first through ninth+ consecutive hit. Blocked specials inflict20% of their old chip, clamped1–2 per contact. Chip can still finish a fighter with very little health.

Normal zoom caps at1.2x, based only on horizontal spacing. The existing special-KO close-up remains. AI scenery and actors are composed into a1536x896 display buffer with a separate HUD; smooth modes magnify native art before camera projection. This avoids zooming into a384x224 intermediate frame. Original pixels and both MMPX modes remain selectable. No high-resolution detail is invented in battle sprites. WW/CE keep the existing renderer.

## Validation

202 mirrored normal/special contact-and-recovery cases; all six guests' standing/low block, wrong block, dizzy and Yoga Fire recovery; mirrored throws;1800-tick CPU runs; twelve-hit cycles in both slots; bonus-stage chains; map-to-versus-to-fight identity/arena transitions; graphics modes/headroom/jump-independent zoom; explicit health, combo scaling and chip checks. Existing timed-breaker, special-cancel and all-native-roster bonus checks pass. WW/CE240-frame combat traces remain identical to the previous implementation. Browser screenshots and the develop-web-game action client were inspected.

## Polish pass 2

Andore now uses18 recovered native animation frames, original sprite origins, native jab/strike/rush/slam sequences and frame-specific attack records. Idle holds a neutral pose; neutral jumping no longer substitutes a knocked-down sprite. Other guests also hold their idle/air poses rather than cycling walking/falling frames. These fixes do not claim the broader move-fidelity audit is finished.

Original FF audio command captures00,0d,26,29,2c,2f are included as decoded browser media. Specials, hit impacts, whiffs and KOs have an explicit FF audio path. Low-health bleeding includes exactly20% health: two small drops every8–12ticks, with clothing absorption disabled for those drops. Heavy/special hits produce larger mouth bursts; most spill particles reach the floor. The cosmetic particle/stain pools remain bounded.

The AI renderer reuses magnification buffers and filters the HUD only when its pixels change. Offscreen world rows are skipped with a3-pixel neighbourhood retained for identical MMPX output. Smooth2x now uses a2x display buffer and Smooth4x a4x buffer. A simulation tick schedules one AI render; high-refresh displays no longer trigger duplicate full renders. Faithful editions keep their previous frame scheduling.

In a local headless Chromium150-frame scenario, mean render costs changed from5.18 to3.21ms(close2x),10.46 to7.76ms(wide2x),9.46 to3.39ms(close4x),14.01 to7.79ms(wide4x). This is local render timing, not a guarantee of real-device FPS. Close/wide4x pixel hashes match the previous renderer. A simulated240Hz second yielded59 simulation steps and59 renders. Gameplay, FF audio/blood and WW/CE trace regressions pass.

## Native move and floor alignment update

Andore uses a planted wind-up followed by his running charge, with one contact and recovery. His piledriver lifts and inverts the victim, launches at16 native pixels/tick with0.6875 pixels/tick squared gravity, and deals damage only on landing. Grip lasts6ticks; apex is about178px, versus72px previously. His standing choke repeatedly deals damage until the victim breaks free or is knocked out. Press new attack buttons and change direction to escape; holding one button does not count repeatedly. Close toward+medium/heavy initiates the choke. Piledriver is a dedicated special: quarter-circle back+punch or MP+HK. Flying Seat Drop is half-circle forward+punch or HP+LK. Flying Seat Drop uses an original seated airborne pose and an overhead hit during descent, with landing recovery. The same special can be started in the air.

Rolento has one-grenade and three-grenade throws, a retreating three-grenade leap, fast movement (faster at low health), and a rebounding wall-kick special. Normal jumps into a wall also rebound, up to twice per airtime. Grenades use eight recovered original rotations and independent fuses/bounces; their blast artwork is an authored pixel effect. Round reset clears grenades and all carried/held-victim state.

All seven guests use Ryu's visible sole baseline (+2 native pixels relative to the common floor anchor) for grounded idle, walk, crouch and normal attacks. This fixes Andore sitting below the opponent and removes frame-to-frame foot dips. Airborne poses retain a consistent air pivot. Belger's shared airborne/grounded attack pose receives its ground correction only when grounded. Edi's clipped walking/fallen cells and Abigail's clipped charge cells were re-extracted from the original sheets.

Validation for this update: all seven guests in both slots through idle/walk/crouch/six normal attacks, mirrored Andore charge/piledriver/choke/seat-drop lifecycles and escape/interruption/KO, Rolento single/triple grenades and wall rebounds, standing/crouching seat-drop guard, blocked-special chip, airborne seat drop, grenade cleanup/reset, 206 mirrored combat cases, twelve-hit chains, CPU/throws and unchanged WW/CE traces. Screenshots were inspected in the action client. Further original-move fidelity work on the other guests remains in progress.

## Attack speed, size and wide-zoom update

Guest LP/LK normals use 3 startup, 3 active and 6 recovery ticks; MP/MK use 6/5/10; HP/HK use 10/7/16. Native active poses are retained; Sodom uses his original sword slash sequence for fast, medium and slow chops on both punch/kick buttons. Normal hit-confirm chains remain connected.

Andore is explicitly enlarged from112 to119 visible standing pixels, matching CE Sagat's119. Rolento is enlarged10percent. Original atlases are retained; separate sized atlases use nearest-neighbour pixels, scaled body/contact geometry and the same sole baseline. Other guest scales are unchanged. The preceding floor-alignment release changed origins, not sprite scale.

Edi now has grounded baton rush/smash and an attached three-blow arrest grab. His pistol fires one or three independent original bullet sprites, removed from body frames so bullets no longer stick to his pose. CPU Edi retreats and favours gunfire at27percent HP. Abigail uses a planted red charge wind-up followed by one powered contact, plus a grounded lift-and-toss rather than an invented rising attack.

Wide Smooth2x frames now retain native world pixels directly when their output magnification is below1.5x, avoiding enlarge/filter/shrink work; the HUD remains filtered. Close-up filtering is unchanged. In a local80-frame Guile scenario at600px separation, mean render cost changed16.53 to3.42ms; close Smooth2x4.53 to4.44ms. Smooth4x retains smoothing and its wide-stage cost remains about17ms on this test machine. This is local browser timing, not proof of physical-device FPS.

Verified mirrored grounded soles,206 normal/special lifecycles, allguest normal startup ordering,12-hit chains, CPU/throws, Andore charge/pile/choke and Rolento grenades/rebounds. WW/CE240-frame traces unchanged; size comparison and action-client screenshots inspected. Broader move fidelity for Sodom/Belger remains in progress.

## Belger crossbow and escape pass

Original detached crossbow bolts are removed from body frames and emitted as independent projectiles. Volley releases three horizontal bolts; Sky Bolt Rain fires three bolts upward with gravity so they descend across the opponent's position. Escape Leap is a backward leap; Escape Hop retreats while firing three bolts. Standing shooting poses are registered by their visible soles rather than detached projectile bounds.

Belger starts mounted and stays dismounted after attacking, jumping, taking damage or guarding. He no longer instantly returns to the chair between standing attack/hurt poses. A new round resets the mounted state. The body sprites retain native pixel dimensions.

Mirrored volley/rain/hop lifecycles verify three independent shots, rise/fall trajectories, actual volley/rain damage, backward movement, full recovery and projectile cleanup. Chair damage/attack persistence and reset, all206 normal/special lifecycles, seven-guest floor baselines and twelve-hit chains pass; guard/dizzy/fire recovery and original WW/CE combat traces pass. Action-client and projectile screenshots were inspected. Andore's previous high-piledriver release also passed live actual-shortcut verification after using DOM-ready navigation. Further Sodom move-controller and global audio-fidelity work remains.

## Sodom native charge and sword-contact pass

Sodom uses recovered per-frame attack records for active poses, reach and original impact commands. Katana Rush has a planted wind-up, a grounded running charge, one knockdown contact and committed recovery. Twin Blade Chops has two separate contact windows; its first contact has reduced pushback and a small visible forward step between chops. Heavy Sword Chop stays grounded instead of using a generic rising jump. Fast/medium/heavy normal sword timings remain3/6/10startup ticks.

Original sound command captures06 and10 are included alongside the previous FF clips. Sodom contacts select the command recorded in the active native attack entry. Guest body/projectile hits no longer layer an inherited SF2 hit sound over the FF impact; the shared guard cue remains. Mirrored tests verify one charge hit,198px miss travel with stationary wind-up, two chop contacts, grounded heavy chop, one original sword sound per light hit and full recovery. All206 normal/special lifecycles, normal chains, floor alignment, CPU/throws, Belger projectiles and WW/CE trace checks pass. Screenshots from the action client were inspected. These are SF2 adaptations of recovered Final Fight actions; full boss timing/audio parity remains under audit.

## Andore crouching punch: selected original torso

The normal crouch remains the original frame11. Crouched attacks use the exact original straight-punch upper body (frame8) selected by the user, joined to the original crouched legs at the waist. The torso and legs retain their pixel dimensions; horizontal and vertical registration align the waist rather than moving the head or stretching an arm. Startup/recovery use the unchanged original crouch. Three attack strengths retain3/6/10tick startup. The crouched punch contact follows the extended fist. Other guest artwork is unchanged in this pass. Earlier torso/arm experiments were rejected and not published. A parallel imagegen preview is not used in this build.

Mirrored normal/special combat, original sole baseline, twelve-hit chains and high-piledriver/seat-drop shortcut checks pass. Gameplay screenshots inspected. Remaining crouched-attack additions for other guests are still pending.

The user-requested waist adjustment lowers the selected torso and waist join by3 native pixels (torso Y+22, join Y-32). Original lower-leg pixels below that join and the idle crouch remain byte-identical; sprite dimensions/scale are unchanged.

Andore chain alignment preserves the original crouched waist chain across the punching-torso join. Conflicting upper-chain pixels in the waist band are replaced with the matching original crouched pixels; belt height, torso registration, lower legs and normal crouch remain unchanged. Verified2520 lower-region pixels against the source and reran206 combat lifecycles.
