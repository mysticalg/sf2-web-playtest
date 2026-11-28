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
