# Ordinary AI battle air combos

An actual unblocked normal heavy-kick contact launches a living grounded
opponent. An accepted damaging hit on an airborne opponent relaunches them up
and away from the attacker. Existing source special burning/held reactions keep
their own controller and clear the ordinary-juggle owner. Damage, guards, attack
eligibility, hitstop and combo counts still come from the existing contact path.
Whiffs, blocks and zero-damage contacts cannot create launches.

`ai_juggles.js` exposes the host-neutral `SF2AIJuggles` API. Positions and speeds
are pixels per admitted physical tick, with positive Y upward:

* `contact(previous,event,settings)` returns a serializable new motion state,
  or null when the contact cannot juggle. Event fields are `accepted`, `blocked`,
  `damage`, `heavyKick`, `airborne`, `y`, `direction`, `serial`, `held`, `dead`
  and `finisher`. A duplicate contact serial returns the existing object.
* `step(state,{x,y},{paused,left,right})` advances gravity and returns position,
  velocity and `landed`. Pausing advances neither position nor the state clock.

Ground launch is8 up/3 back; airborne bounce6.5 up/3.5 back; gravity.375. Upward
speed is capped at8 and horizontal speed at4.5. The next apex is limited to192
by reducing velocity rather than moving the fighter to a different position.
No real contacts means an inevitable floor return. Hosts own floor recovery,
source animation and original effects; the core does not damage fighters.

The CE AI adapter uses the actual hit pose for five physical ticks and then the
existing source fall sequence. This also gives Andore's original single-frame
fall a real hurt-to-fall progression. Native hurt boxes are retained when
present. Stock falling frames deliberately have no hurt boxes; during this AI
juggle only, a central body box follows the displayed source frame rectangle,
including horizontal falls. This is an authored AI collision adaptation, not a
claim that stock SF2 permits hitting these frames.

A fresh Up after a confirmed launcher can cancel that normal into the original
jump/prejump controller. Up can be buffered through hitstop for20 game ticks.
Guarded and whiffed normals receive no permission. A fresh air attack can replace
the previous air normal only after that normal actually connected, once per
attacker contact serial. Held buttons cannot repeatedly reset the attack, and
an air whiff receives no new permission. Guest/hero source air poses and special
admission remain with their existing controllers.

Validation:14 unit flight cases plus repeated accepted relaunches/paused ticks,
52 actual-input launcher cases (13 native/guest owners, both slots, Ryu/Andore
victims), guard/whiff/medium/reset checks and actual jump-follow-up contacts.
Both-slot controls checks establish a launcher plus two real air contacts, one
air contact when holding a button, no repeat after an air whiff, no jump cancel
after a block/whiff, special interruption and floor recovery. Browser keyboard
KeyC and production external-controller key-mask input both launch and recover;
these are not physical-controller hardware tests. Original WW/CE comparisons
against5905382 pass four cases,60 state hashes and four pixel hashes.

The coordinator must load `ai_juggles.js` before `game.js` in release assets.
Super Turbo can reuse the same core on its accepted native-contact boundary;
this source adapter does not by itself install the native ST host.
