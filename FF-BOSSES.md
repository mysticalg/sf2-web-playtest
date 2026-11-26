# Final Fight guests (AI Edition)

The original SF2 roster is joined by Damnd, Sodom, Andore, Edi. E, Rolento, Abigail and Belger. The seven gold-bordered tiles form the third selection row. Both players may select any guest, including mirror matches. Faithful WW/CE editions retain their original rosters and rules.

Arcade has the original twelve matches and bonus rounds followed by the Metro City route: Slum courtyard, Subway ring, West Side cage, West Side streets, Industrial elevator, Bay Area and Uptown penthouse. Each district has its own map marker, arena and CPU opponent; Belger finishes the route. Guest champions have their own result/ending card.

| Fighter | Specials in shortcut order | District |
|---|---|---|
| Damnd | Street Rush, Somersault Kick, Rising Smash, Barrel Call | Slum |
| Sodom | Katana Rush, Twin Blade Chops, Heavy Sword Chop, Gut Buster | Subway |
| Andore | Bull Rush, Piledriver, Choke Hold, Chest Bump, Headbutt, Flying Seat Drop | West Side cage |
| Edi. E | Police Pistol, Baton Rush, Baton Smash, Arrest and Batter, Pistol Burst | West Side |
| Rolento | Patriot Circle, Grenade Throw, Wall Kick, Shoulder Toss, Grenade Barrage, Grenade Retreat, Wall Punch | Industrial Area |
| Abigail | Rage Charge, Giant Throw, Hammer Punch, Crushing Toss, Power Punch | Bay Area |
| Belger | Crossbow Volley, Escape Leap, Sky Bolt Rain, Escape Hop, Crossbow Butt | Uptown |

Shortcuts: LP+LK, MP+MK, HP+HK, MP+HK, LP+MK, HP+LK, LP+HK, respectively. Default motions for the new guests: quarter-circle forward + punch, quarter-circle forward + kick, dragon-punch + punch, quarter-circle back + punch, quarter-circle back + kick, half-circle forward + punch (sixth move where available). Andore instead charges back then forward + punch for Bull Rush, and down then up + kick for Flying Seat Drop. Rolento uses down-charge then up+punch for Wall Punch, or up+kick for Wall Kick. Close directional punch grabs initiate Piledriver; kick grabs initiate Choke Hold. A held victim can be carried and jumped with; pressing punch in the air flips the victim into the inverted slam. Forward/back + medium/heavy at close range throws for other guests. Six attack buttons, crouching attacks, high/low guard, directional jumps, hit-confirm chains, special cancels, timed combo breakers, dizzy/fire/KO reactions and bonus-stage attacks are connected.

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

Andore uses a planted wind-up followed by his running charge, with one contact and recovery. His direct piledriver holds the victim by the head for60ticks, squats for24ticks, then launches at16 native pixels/tick with0.5625 pixels/tick squared gravity. Its apex is about220px; the complete grab, leap, landing freeze and recovery take about3.3seconds at60Hz. Damage is applied once on landing. His separate standing choke repeatedly deals damage until the victim breaks free or is knocked out. Press new attack buttons and change direction to escape; holding one button does not count repeatedly. Close directional punch grabs initiate Piledriver; kick grabs initiate Choke Hold. Piledriver also has quarter-circle back+punch or MP+HK shortcuts. Flying Seat Drop uses down-charge then up+kick or HP+LK, an original seated airborne pose and an overhead hit during descent, with landing recovery. The same special can be started in the air.

Rolento has one-grenade and three-grenade throws, a retreating three-grenade leap, fast movement (faster at low health), and a rebounding wall-kick special. Normal jumps into a wall also rebound, up to twice per airtime. Grenades use eight recovered original rotations and independent fuses/bounces; their blasts use the eight recovered original Final Fight explosion frames. Round reset clears grenades and all carried/held-victim state.

All seven guests use Ryu's visible sole baseline (+2 native pixels relative to the common floor anchor) for grounded idle, walk, crouch and normal attacks. This fixes Andore sitting below the opponent and removes frame-to-frame foot dips. Airborne poses retain a consistent air pivot. Belger's shared airborne/grounded attack pose receives its ground correction only when grounded. Edi's clipped walking/fallen cells and Abigail's clipped charge cells were re-extracted from the original sheets.

Validation for this update: all seven guests in both slots through idle/walk/crouch/six normal attacks, mirrored Andore charge/piledriver/choke/seat-drop lifecycles and escape/interruption/KO, Rolento single/triple grenades and wall rebounds, standing/crouching seat-drop guard, blocked-special chip, airborne seat drop, grenade cleanup/reset, 206 mirrored combat cases, twelve-hit chains, CPU/throws and unchanged WW/CE traces. Screenshots were inspected in the action client. Further original-move fidelity work on the other guests remains in progress.

## Attack speed, size and wide-zoom update

Guest LP/LK normals use 3 startup, 3 active and 6 recovery ticks; MP/MK use 6/5/10; HP/HK use 10/7/16. Native active poses are retained; Sodom uses his selected original punch poses on punch buttons and sword chops on kick buttons. Normal hit-confirm chains remain connected.

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

## Abigail crouching punch

Abigail now uses his original forward-punch upper body (frame18) with his existing crouched lower body (frame20), registered at the waist without rescaling. Startup/recovery retain the original crouch. Three strengths keep the established3/6/10 startup timing. His3255 lower-region pixels and idle crouch are unchanged; Andore retains his approved23/22 waist registration and all93 chain pixels. Mirrored combat, normal chains, floor alignment, guard/dizzy/fire recovery and unchanged WW/CE traces pass. Gameplay screenshots inspected.

## Hold controls and charge skid

Andore can transition from an active choke into Piledriver (MP+MK; P1 S+X) or Flying Seat Drop (HP+LK; P1 D+Z). Previously the hold's special state rejected the normal shortcut queue. A keyboard-driven test now establishes the choke and executes both transitions, checking high launch/landing damage, held-victim cleanup and full recovery.

Andore charge contact holds native frame6, matching the supplied chest-forward reference, and moves into an18tick skid with decaying horizontal velocity. Abigail receives a20tick skid; his exact original chest-impact pose remains under comparison. Abigail's requested torso registration moves3px right in the right-facing pose, and his original crouched waist band reconnects the chain on that side. His lower3255pixels and approved Andore chain remain unchanged. These updates pass combat lifecycles and actual keyboard hold-to-special tests.

## Double-button shortcut admission

Every guest special is available through its assigned two-button pair, including Andore fifth/sixth specials. Final Fight guests buffer an initial single button for3ticks so a second button arriving2ticks later still forms the chord instead of leaking a normal. Existing non-guest timing is unchanged. Verified210 cases: all35 guest specials, both player slots, simultaneous/1tick/2tick-separated presses. Actual P1 keyboard choke-to-Piledriver S+X and choke-to-SeatDrop D+Z pass, as do normal chain regressions.

## Guest portrait and palette correction

Six guest profiles now use a face crop(76x72 from8,0), filling the portrait window instead of fitting a chest-up square. Left/default portraits face inward to the right; right-side portraits mirror left. Damnd facing follows the same convention. Native world travel images are matched by source URL (the map owns separate Image objects), replaced with the selected guest portrait, and inherited name/flag art is suppressed.

Added missing clothing and skin palette-index groups for all six newer guests; previously empty groups made their colour selectors ineffective. Native colour choices remain available. Verified palette changes for every new guest, rendered select/travel screenshots, seven guest arcade transitions,206 combat cases and unchanged WW/CE traces. Generated portrait artwork keeps its original colours; battle costume/skin palette choices apply to sprites.

## Fresh guest selection palette safety

Before a guest adapter is built, portrait palette packets now use that guest original palette instead of the shorter inherited SF2 palette. Skin index lookup also ignores absent entries. This prevents invalid colour reads on fresh guest selection. Confirm-input tests cover all seven guest tiles through colour-screen drawing, colour selection and confirmation; both-slot portrait packets use the correct guest identity and palette.

## Wide zoom source-crop correction

The fast unfiltered wide Smooth2x path now copies the matching source rectangle instead of squeezing the entire padded world surface into the visible crop. Camera projection remains uniform on both axes. A deterministic row-pattern raster test matches direct uniform projection; original WW/CE traces are unchanged. This retains the earlier wide-scene performance optimisation.

## Full-area charge and guarding grab admission

Andore and Abigail charges continue beyond their previous fixed travel window until contact or the far stage boundary, cycling original running frames. Contact/boundary triggers decaying skid and recovery. Mirrored no-contact tests traverse640/688native pixels to the exact boundary and return idle. Command grabs now admit a guarding grounded victim, so CPU defensive startup no longer invalidates choke/piledriver/toss. Keyboard choke-to-special and combat regressions pass. Abigail exact chest-forward impact artwork remains under audit.

Sodom corrected action registration: previous recovered slash rows were shoulder-running poses and charge rows were standing sword poses. Regular attacks and blade specials now use four original sheet sword-swing frames; charge cycles original shoulder-running frames using the full-area charge controller. Charge cannot contact during wind-up. Mirrored sword/contact/miss cases,206 combat lifecycles,12-hit chains and original WW/CE traces pass.

Andore and Abigail now share Sodom's moving-only charge contact gate. Close-range regression previously recorded damage at tick17 with zero travel; all three now contact from tick19 after moving. Six mirrored close-range checks, full-room travel,206 combat cases and original edition traces pass.

Giant running registration correction: Andore and Abigail charge frames align by matching the upper body rather than each frame's full-image centre and bottom. This removes horizontal/vertical torso staggering between strides; detached neighbouring pixels are removed from the running cells. No scale changes or approved crouch changes. Close-contact, full-area movement,206 combat and original-edition regressions pass.

Andore piledriver uses original choke poses during a60tick head hold, then a separate original crouch pose for a24tick grounded squat before the high jump. The victim enters the inverted piledriver grip during the squat. Both-side phase traces assert grip/squat/jump/recovery, about220px apex and3.3second total duration. Carry-to-pile and206 combat cases pass. This timing is an authored adaptation requested for SF2, not a verified ROM timing trace.

Rolento Shoulder Toss uses original reaching/bent poses with a dedicated grip/lift/release controller. Its special startup no longer has a strike box that knocked the victim out of grab range. Held victim crosses the shoulder, turns over and releases behind Rolento; interruption removes attachment. Eight mirrored normal/special/miss/interruption cases,206 combat lifecycles,210 shortcuts and WW/CE traces pass. This is an authored SF2 adaptation using native poses, not a verified original timing trace.

Final Fight special KO echoes now select the decoded recovered move clip rather than synthesising inherited SF2 command25. Projectile voice records persist for bullet/bolt/grenade finishes. Existing five-source slow delay schedule and separate music path are unchanged. Twelve actual finishing-KO cases verify both slots, decoded-buffer identity for every tap and projectile voice persistence. Original WW/CE traces, all guest special audio triggers and206 combat checks pass.

Sodom Gut Buster no longer strikes before its grab window. Both normal grab and command grab attach the victim for one32damage body blow, then release; misses and interrupted holds recover without attachment leaks. Two original unarmed poses were recovered with neighbouring sprite fragments removed. Eight mirrored grab cases,206 combat cases,210 shortcuts,CPU/throws and original WW/CE traces pass. This is an authored SF2 grab adaptation using original poses; original FF grab timing has not been established.

AI wide-stage visual cleanup: Balrog's recovered neon-sign layer contains corrupt tiles in its32pixel camera padding above the normal scene. AI rendering clips that layer to its native picture beginning atY0; normal sign artwork and backdrop remain. Isolated layer assertion verifies zero padded pixels and32853 native opaque pixels; wide gameplay capture inspected, uniform zoom and original WW/CE traces pass.

Sodom user-selected normals: punch wind-up25/contact24 on LP/MP/HP; light kick-button half chop18/19 and medium/heavy full chop18/19/20, with3/6/10 startup strengths. LP reaches contact at the same input tick5 and total12attack ticks as Ryu/Ken LP; LK uses the same fast Sodom light timing. Original kneeling sword frames recovered for crouch; low attacks join selected original upper torso to unchanged kneeling legs,68400 channel comparisons below seam identical.24mirrored standing/crouch attacks dealdamage and recover;206combat,210shortcuts,chains and WW/CE traces pass. Jump now reuses compact original kneeling sword guard, victory raised-sword18; these are adaptations and not verified native FF jump/win sequences.

Rolento acrobatics: recovered the complete first compact roll from the original sheet and removed its pixels from the neighbouring raised-arm frame. All four rolls now use a shared body-centre pivot instead of a different foot-derived origin; measured horizontal centre spread falls from15.51pixels to0.89pixels at the existing1.1scale. Wall-kick approach and grenade retreat use the full looping roll until rebound/landing. Shoulder grip/lift/release moved to118/119/120 so they no longer overwrite Grenade Retreat's107slot. Five recovered source crops match native opaque pixels after existing nearest scaling;23other atlas frames are identical. Both-side roll cycles, grenade counts/wall rebounds, shoulder grabs,206combat,210shortcuts and WW/CE traces pass; gameplay screenshots inspected. Original FF controller timing parity remains unverified.

Abigail Rage Charge now separates red wind-up, four-frame running loop and red full-punch impact. The run loop no longer contains punch/wind-up poses, and contact no longer selects the unpowered punch preparation. Shared charge animation is owned by the charge controller so automatic animation ticks cannot advance into the next phase before movement/contact. Twelve mirrored charge hit/block traces across Sodom/Andore/Abigail verify only the intended poses per phase, one contact and unchanged damage/chip. Full-room travel,206 combat,210 shortcuts and original WW/CE traces pass; running and impact captures inspected.

Preview build consistency: Pages now stamps the deployed commit/date into its build label and manifest, versions local JS/CSS references by file contents, and includes the actual staged file hashes. Final Fight artwork, projectile sprites and recovered audio use the deployed build revision. A changed script therefore receives a new cache URL, while unchanged scripts keep theirs. The release fixture test runs before upload; a browser check of stamped HTML loads revised assets and executes Abigail's impact. This prevents stale code/art combinations between rapid preview updates; it does not alter game physics.

## Complete sprite crops and dramatic piledriver

Abigail's red running frame13 now contains the complete84pixel-wide original body; the old crop lost16pixels at the right edge. Charge crops retain their existing upper-body registration and scale. Complete original-sheet components also restore Andore's clipped carry/choke extremities and Edi's baton, fingertips and pistol. Detached neighbouring fragments and Edi's baked ground-shadow rows are excluded. Every recovered opaque pixel matches its source after the existing nearest-neighbour scaling; other frame artwork/origins and both approved crouching punch joins are unchanged. Runtime atlas rectangles and animation references were checked for all seven guests, with actual charge/hold screenshots inspected.

Andore's Piledriver now holds the victim by the head for one second, pauses in the squat for0.4seconds, then leaps high enough to briefly leave the top of the close camera view. The full sequence lasts about3.3seconds. Its landing adds a10tick impact freeze, a decaying36tick shake of the composed world and a lower-pitched layer of the recovered Final Fight thud. Floor, fighters and blood share that shake; HUD coordinates remain fixed. Existing landing damage is applied once. Held victims cannot run independent physics, and interruption clears the attachment in every pre-landing phase.

Validation: twelve both-slot Piledriver cases covering normal grab, double-button shortcut and carry transition against standard/giant victims; six interruption cases;210 guest shortcuts;206 normal/special combat lifecycles; charge animation, carry release, choke escape, CPU throws, crop/source pixel comparisons, floor baselines and approved chain joins. WW/CE240frame traces remain identical. These checks cover the revised behaviour; the broader Final Fight fidelity audit remains ongoing.


## Rolento wall attacks and controlled rebound

Wall Kick (HP+HK) and Wall Punch (LP+HK) use separate original kick/fist poses. Hold down for at least40ticks, then press up+kick or up+punch, respectively; the shared charge buffer lasts12ticks after leaving down. Both can start on the ground or in the air. The approach rolls through all four recovered compact poses along an arc to the selected wall; holding left/right during startup selects that wall, otherwise the nearer wall is used. A five-tick original tucked pose marks wall contact. The dive aims toward the opponent's launch-time position with small steering corrections, and finishes in twelve-tick landing recovery. Only the dive has a strike box. Kick/punch deal30/32 damage once, with1/2 blocked chip under the existing AI rules. This is an authored SF2 wall-move adaptation, informed by the native Vega controller and Rolento's original poses, not an established Final Fight timing trace.

Normal Rolento wall jumps now require up+away at the wall (CPU may choose the rebound). They spring upward and away with no automatic attack box, keep the full four-frame roll and allow an ordinary aerial attack afterwards. The existing two-rebound airtime limit remains. Interrupted guest specials discard their move state rather than leaving an abandoned phase attached to the actor.

Validation:22 both-wall/both-slot wall-dive and manual-rebound cases,22 interruption/air-shortcut/motion-input/full-width crossing cases,216 guest two-button shortcut cases,208 normal/special combat lifecycles, all-guest atlas references, four-frame roll registration and Andore interruption regression. WW/CE240frame traces are unchanged. Wall, kick, punch and action-client gameplay screenshots were inspected.

The rolling pose uses compact hurt/push boxes. Long wall approaches rise smoothly toward wall-contact height early in the flight, clearing grounded bodies before crossing them; full-room traces stay within the intended12pixel movement bound per tick. This removes a collision correction that previously displaced the roll sideways.


## Sodom katana disarm and recovery

A knockdown in a match disarms Sodom. The curved katana spins through eight original rotation frames, bounces once, and remains on the floor in world coordinates until he recovers it or the round resets. Light hits and blocked hits do not drop it. Beside the katana (within22pixels), hold down and press punch to start an18tick pickup. Before tick12, interruption leaves the blade on the floor. At tick12 it is recovered; an interruption after that can disarm him again. Mirror matches keep separate weapon objects and ownership. CPU Sodom approaches and recovers his own katana when there is no immediate attack/projectile threat.

Disarmed Sodom uses his selected original punch frames25/24 for all normal buttons, with light/medium/heavy damage8/14/21 and3/6/10startup timing. The unarmed low punch has the same pixels as the existing low fist composite; low guard uses the corresponding guarded torso with unchanged kneeling legs. Sword specials become weaker fist strikes until recovery; charge and Gut Buster remain usable. Pickup uses complete original frames26/32 to bend down, then41/42 to lift the recovered blade. The rejected pickup torso/leg composite is excluded.

Weapon provenance: the Final Fight preview exporter swaps the Pipe and Katana names. Visual inspection confirms images938..945 (entries2336..2343) are the curved sword with gold hilt; image946 (entry2345) is its resting pose. The strip labelled Katana (images947..963) is visibly a pipe and is excluded. Every admitted katana crop has an RGBA hash and original atlas rectangle in ai_ff_data.js, and matches the recovered source atlas exactly. No generated or redrawn weapon frames are used. The recovery controller and reduced unarmed damage are SF2 adaptations; full native Sodom weapon timing has not been established.

Validation for this release:34 disarm/normal cases and13 special/sweep/mirror/CPU/pixel cases pass, including both slots, eight blade rotations, persistent resting state, interrupted pickup, owner-only recovery and round reset. CPU recovered the blade at tick114 in the deterministic case. All216 guest shortcuts,208 combat lifecycles and unchanged original WW/CE traces pass. Pickup/bend/lift/rearmed action-client images were inspected after replacing the rejected composite with complete original poses.


## Andore hold-to-jump slam and giant running cadence

Andore shortcuts now place Piledriver on MP+MK (P1 S+X), Choke Hold on HP+HK (D+C), Chest Bump on MP+HK and Headbutt on LP+MK. Other shortcuts remain mapped. Ordinary motion entries are retained. During a choke, up jumps while carrying the victim by the head; a new punch press while airborne flips the victim into a downward piledriver. Grounded punch alone no longer triggers that transition. Landing without punching resumes the choke. Both actors descend normally if the victim escapes in the air. CPU Andore can also use this sequence. The separate direct Piledriver retains its one-second grip, squat, high leap and roughly3.3second duration.

The inverted grip computes the victim's rendered head from the original head box and sprite crop, then locks it below Andore's groin. The head cannot pass below the stage's original sole line. Landing applies40damage once and holds the inverted contact pose through the ten-tick freeze and eight physical impact ticks before releasing into knockdown/KO. Floor, fighters and blood share the existing decaying shake. An interrupted holder now releases the victim immediately, including during hitstop.

Andore and Abigail charge-running strides now hold for six ticks instead of three; their movement velocities, wind-up, contact and damage are unchanged. Sodom retains three-tick running strides. Deterministic traces measure5.25pixels/tick for Andore and5.5 for Abigail, with every giant stride changing at six-tick intervals.

Validation:20 direct/manual/jump-without-slam/air-escape/air-interruption cases against standard and giant victims in both slots; twelve inverted-head/floor-contact cases across Ryu, Blanka, Chun-Li, Dhalsim, Sagat and Abigail; eight preserved direct-Piledriver timing cases; giant cadence/CPU conversion;216 shortcuts;208 combat lifecycles. Pickup, original katana, other holds and original edition regressions remain covered separately. Screenshots of the manual carry, inversion and head-first impact were inspected. Exact Final Fight ROM grab timing parity remains unverified.

Six additional lethal-direct/lethal-manual/impact-interruption cases verify that fatal slams and cancellation release both attachments without soft locks. The held sprite uses a centred pivot; release restores the grounded knockdown origin.


## Rolento charge controls, low slides and three-hit grenades

Both wall attacks now use down-charge then up+button as requested. Wall Punch takes punch; Wall Kick takes kick. HP+HK and LP+HK remain their charge-free double-button shortcuts. Undercharged and expired-charge inputs do not start these moves; a valid buffered charge does. Their approach, wall brace, aimed dive, steering and landing sequence remain unchanged.

Crouching LK/MK/HK now slide using the original low extended-leg pose. They retain3/6/10startup,3/5/7active and6/10/16recovery timing, and10/17/25damage. Travel increases with strength, followed by a decaying skid; heavy slide knocks down. Low guard blocks the slide, standing guard does not. Movement is timed with the active pose and ends with the attack, with no leftover floor drift. Standing normals retain their existing poses. Ordinary neutral/forward/back jumps now loop the four original compact somersault frames with the same shared body pivot used by wall approaches. Airborne kick buttons use the original extended-leg frame18 during their active window, with3/6/10startup and10/17/25damage; that attack pose is no longer the ordinary jump. Jump velocity, gravity and landing timing are unchanged.

Grenade Barrage and Grenade Retreat now permit three separate hits. The first two explosions stagger with reduced pushback; the third knocks down. Base damage14/14/24 becomes42total with the existing fresh-combo scaling; a fully blocked sequence inflicts three total chip. Each grenade snapshots its aim when thrown and follows its own physical arc/bounce/fuse; jumping away can evade the blasts. The arc calculation compensates for the different release heights and ground friction, keeping the three blasts close enough to connect without post-release homing. Single Grenade Throw remains one knockdown hit.

Validation:52 charge-window/strength/slide/guard cases,48 three-grenade open/standing-block/crouching-block/jump-away cases, and84 fresh-grounded-target grenade cases across all21 currently selectable profiles in both slots. Both slide chains complete twelve attacks across two button cycles. The216 shortcut,208 combat lifecycle, other wall-move, floor, atlas, bonus-chain, roll registration and original WW/CE trace regressions pass. Actual keyboard charge, slide and three-hit grenade action-client screenshots/state were inspected. The move controllers are authored SF2 adaptations using original Rolento frames; original Final Fight timing parity is not claimed.


## Original grenade explosions and light sword arc

Rolento grenade blasts now use all eight original arcade explosion poses, including detached sparks and dissipating smoke, from the Final Fight Objects sheet ripped by jin315: https://spritedatabase.net/file/21522 . Only its exact background colour is made transparent; RGBA crop hashes, source rectangles and original baseline anchors are recorded in ai_ff_data.js. Two ticks per pose is authored SF2 timing, not a recovered ROM timing trace. The16tick visual continues through contact hitstop; collision lifetime catches up on resume so expired effects cannot hit invisibly. No generated or rectangle-drawn blast artwork is used.

Sodom LK now uses only sword frames18/19 for the requested half chop. MK/HK retain18/19/20 for the full chop. Existing light timing, punch poses and crouching joins are preserved.

Additional validation: exact source-pixel comparisons for all eight explosion crops; renderer visits each pose twice and uses zero filled rectangles, including while contact is frozen;24both-slot neutral/forward/back jump and flying-kick cases;52charge/slide cases;48grenade hit/guard/evasion cases;84grenade cases across all21profiles;208combat lifecycles. Actual keyboard somersault, flying-kick and native-explosion captures were inspected. The original-edition regression, shortcuts, wall jumps, chains, floor and atlas checks also pass. Remaining broader goal work includes Edi/Belger fidelity, the additional heroes, evil variants, finishers and native SSF2T reconstruction.


## Original Final Fight arena music

AI arenas now select original Final Fight music rather than the inherited SF2 stage theme. Damnd uses command40; Sodom43; Andore and Edi44; Rolento49; Abigail and Belger47 (hexadecimal). These come from the original stage/section music event table at0x0091ea and dispatcher0x0090d6/0x00919e: Slum rooftop0:2, Subway platform1:3, West Side cage2:1, West Side boss2:2, Industrial boss3:1, Bay Area late-section4:0 and Uptown penthouse5:2. Shared themes follow the original table.

The five themes were rendered offline from the original ff_09.12b Z80 program and ff_18.11c/ff_19.12c samples in the supplied ffightub.zip, using isolated MAME0.289.5 audio hardware. The main CPU is parked after sound boot; no game CPU, emulator or raw ROM is added to the web runtime. PCM hashes are checked before128kbps MP3 conversion. Melody-register recurrences across multiple channels determine loop periods; each clip preserves its16second introduction and uses a10ms rendered seam blend. Source archive, PCM, encoded hashes, original stage/section commands and recurrence counts are recorded in ai_ff_data.js. Hardware mapping reference: https://github.com/mamedev/mame/blob/master/src/mame/capcom/cps1.cpp . This is converted original music with authored media loop boundaries, not cycle-exact runtime sound synthesis.

Themes decode lazily, with at most two decoded themes retained. Only one music voice plays; asynchronous loads cannot restart an arena theme after leaving the fight. The native SF2 music worklet receives its stop command while Final Fight music plays, and normal scene music resumes on menus, win screens, bonus stages or original arenas. Music uses the existing master mute control and stays separate from Special KO echoes.

Validation: all seven arenas start the intended decoded track with one looping source and nonzero measured browser output; native music output is silent underneath. Late audio unlock, round reset without duplicate music, master mute/unmute, scene changes, guest P1 on an original arena, and a deliberately delayed music fetch cancelled by returning to title all pass. All five MP3s decode fully; their PCM provenance and native arena command membership pass. Actual keyboard gameplay in Edi's arena was captured and inspected. WW/CE240frame traces and release-stamping/chain regressions remain unchanged. Physical speaker output is not established by the browser analyser check.


## Edi original gunshot

Each Police Pistol and Pistol Burst bullet now plays original Final Fight sound command12(hex), selected by the native bullet spawn at0x0467ce calling0x000ad2. The clip is captured offline from the original driver, PCM-hash checked and converted to96kbps MP3; capture and encoded hashes are recorded in ai_ff_data.js. Pistol Special KO echoes use that same decoded gunshot instead of the generic guest special clip. Other move sounds and music are unchanged.

Sixteen both-slot single/three-shot cases at130/240pixel gaps verify1/3released bullets,1/3original gunshot triggers,1/3hits and blocked chip, projectile cleanup and normal recovery. Twelve finishing-KO cases retain five echoes sourced from the correct decoded move clip; all guest special audio triggers pass. An actual keyboard LP+MK burst produced3HIT and three original shot triggers; its screenshot/state were inspected. Edi's gum-spit victory remains outstanding.
