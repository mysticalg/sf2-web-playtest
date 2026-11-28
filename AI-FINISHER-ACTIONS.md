# AI finisher source-action adapter

Normal stages run their original animation/controller through recovery. Native
specials can occupy intermediate stages and the chosen special remains last.
Each accepted original damage event adds its own contact; a multihit stage grows
the total target by its additional real contacts. No planned hit count supplies
an impact in place of collision.

`normalLead(winner, victim, action)` reports source ticks to the first forward
active window, using native ground-normal durations and original air entries.
The shared motion controller owns ballistic forecasts, bounded full-recovery
retries, normal juggle impulses and stage travel. The adapter's `travel` hook
delegates world translation to the coordinator's `aiFinisherTravel` implementation.

Sagat's launch stage chooses standing heavy kick rather than crouching sweep.
Its knee and extended leg retain separate original collision windows, followed
by their native recovery animation.

Protected finisher victims remain visibly in a reviewed original hurt pose and
hittable during specials. Launch, gravity and knockback advance once per physical
special tick. Native grabs, throws and special burning reactions retain their
own actor controllers. These changes apply only to the active protected finisher
victim, never ordinary combat or stock WW/CE.

Tatsumaki is one complete multihit action. Its first real source impact launches
the victim. Later accepted spin contacts preserve that continuous trajectory
rather than restarting the launch on every pulse, while cycling visible hurt
poses. The attacker follows through velocity bounded by the selected source
TATVX; spacing derives from the actual forward attack and victim hurt boxes,
within 20–56 pixels. Neither actor is teleported into a later contact. Admission
also accounts for the original eleven ticks of startup travel.

The final Tatsumaki effect requires a real front-facing contact in the last
available native front window before the spin timer ends. For heavy Ken, source
windows begin at ticks 11, 18, …, 81, with spin ending at 84. The source landing
animation and recovery still complete after the last contact. The final scream,
echo trigger, trail stop and finishing effect originate from that contact.

Validation uses the coordinator's current generic motion/travel runtime. The
mixed regression covers both slots for Ryu, Ken and Sagat, original attack/hurt
box overlap, source recovery/landing frames, separate knee/leg contacts, all
eleven final heavy-Ken spin contacts, updated totals, and final audio-event tick
alignment. Audio listening and physical hardware are outside that automated
coverage. Numerical native-action traces are diagnostic data, not ROM parity
claims; protected rehit/trajectory handling is an authored AI customization.

Special admission accepts an optional fourth argument containing `victimMotion`
in world pixels per physical tick. It retains that incoming velocity through
target restoration and restores ordinary gravity for an airborne target. With
no explicit motion packet it preserves the actor's existing motion fields.

The Guy regression selects real finisher IDs 20 and 42, whose stage-12 rotation
contains WallJumpKick, and also selects that wall kick for the finale. Both slots
complete approach, cling, active source frame 111:1 and source recovery, with one
real contact per wall move. Collision verification uses CE's inclusive edge
contact rule. Shared floor readiness and translation of stored wall anchors are
provided by the coordinator's runtime; no extra target repositioning is added.

The final selected action now distinguishes its real contact phases. Earlier
contacts remain protected. This includes Abigail's sixth actual choke squeeze
(ages20,50,80,110,140,170), Edi's third batter, Andore's real converted slam,
Damnd's last reachable rush/spin window, Sodom's second blade phase, Rolento's
last reachable spin and third grenade, and the source order of projectile
volleys. Abigail's choke controller has no final slam; none is invented here.

Honda hands, Chun-Li legs/Bird and hero escapes use a read-only source-window
preview when a final-action impact occurs. It advances cloned controller and
animation fields, the incoming fallback reaction trajectory, and real collision
boxes. It performs no simulated damage or contact notification. A later nominal
phase is not treated as reachable merely because it exists: an airborne victim
can be above a later low kick, for example. Bird horizontal steering uses the
original maximum speed3.5 pixels/tick; neither fighter is repositioned to create
a contact. Intermediate actions skip these final-only previews.

The scoped `withImpact` bridge retains each actual projectile object and attack
box through damage interception and restores nested contexts with `finally`.
Belger's rain and diagonal retreat can legitimately miss after earlier knockback.
Their final classification checks every existing pending bolt and the original
scheduled age40 retreat release, including recoil and the source apex hold.
Unknown pending paths retain protection. Forecasts never retarget a projectile,
create a contact or increase damage/hit counts.

Cody's chosen knife finale reserves its actual held weapon through intermediate
rotation; earlier rotations use source specials that preserve that knife. Empty
weapon admission remains rejected. Native Honda/Noogie/boxer holds are ordinary
throws and are not silently added as new selectable finisher specials.

Preview purity checks fingerprint both actors, shared fighter/animation data,
the world and object pools, gameplay RNG, sound/voice logs and finisher state
before and after the complete preview. Audio checks establish event routing and
tick alignment; listening quality and physical devices remain untested here.

The preview uses the exact next reviewed hurt pose selected by the accepted
contact. Its local pair translation/rebase and integer `boxw` projection match
the runtime, including pixel-edge collisions; neither the live camera nor world
is advanced. Yoga Flame admission separately derives spacing from its native
flame frame records and owner offsets. Its mature attack centre is127 pixels
forward, so the old generic38-pixel gap can place the victim inside its reach.

Final verdicts are independently checked with a test-only golden mode that
suppresses finishing notifications while keeping protection, true source
contacts, whole animations and continued world travel. Across338 selected
special/variant/slot cases, the first adapter final verdict must equal the last
actual damage callback in that complete source action. This prevents a removed
victim from hiding an early verdict. Fixed-family counts remain separate checks.

At the first real damage pose event the victim's dizzy flag and native dizzy
manager are cleared, allowing the actual sprite pose to render. FF guests add
their authentic non-lying fall frames to the existing hurt-frame catalogue,
excluding floor/corpse art and entries without source hurt boxes. Preview and
rendering share the same next-pose helper; held native/grab poses retain their
own controller. The Ryu→Abigail rendered regression now displays three distinct
reaction poses instead of a constant dizzy override.

`readyForMove(winner,victim,action)` handles grounded source recovery after an
actual impact. A low/fallen victim plays the original get-up animation30 through
upright idle0 before an unreachable high punch/Tatsumaki starts. The shared
controller calls admission once per physical tick. The victim remains grounded
and invulnerable during this real recovery, with no premature contacts; planning
and collision boxes stay unchanged. Pending ordinary dizzy points are cleared
after real contact so they cannot restore the discarded dizzy overlay. Cleanup
clears both the hurt/recovery markers. The20-case guest-victim regression covers
both slots, real rendered pose diversity, source get-up progression, collision
gating and completion.
