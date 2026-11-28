# AI Edition impact audio

AI Edition's CE-derived contacts now select their impact sound from the actual recovered attack frame, rather than inferring it from the button or special's index. This covers normal melee, native projectile and Yoga projectile contacts. Blocking selects `0x72`; an explicit zero cue stays silent, and unavailable/custom records retain the existing fallback. Audio is still emitted only after an accepted contact.

Examples corrected by this routing include Vega's kicks versus claw strikes, Blanka's light/medium standing kicks, Sagat's air punches, Guile's Flash Kick, Honda's headbutt, and different contact phases of Vega's rolling attack. Character voices, swing sounds, launches, projectile spawning, special startup audio, and Blanka's heavy Rolling Attack roar retain their existing paths.

Blanka's bite now uses its original `0x27` impact cue on each actual bite damage marker. It previously reused the generic heavy-punch impact. The controller, damage, hitstop and marker cadence are unchanged.

## Original program evidence

The private CE program was inspected locally; no program bytes or new extracted sound assets are added here.

| Path | Source evidence |
| --- | --- |
| Standard fighter melee | `0x9504A` calls `0x957EA` after damage/reaction admission. |
| Projectile against fighter | `0x951F0` calls the same sound routine; `0x95204` consumes the projectile. |
| Shared impact sound | `0x957EA` reads attack-record byte 6. Guard flag `0x49` overrides it with `0x72`; the final command is sent to `0x6388` at `0x95806`. |
| Blanka bite | `0x3F270` sets D6 to `0x27`, then calls `0x3496`. That helper reaches `0x356A`, which moves D6 into the command argument and jumps to `0x6388`. |
| Honda holds, retained | `0x3E7A4` and `0x3E7BA` set D6 to `0x47`, then `0x3E7C4` calls the same hold helper. |
| Yoga Noogie, retained | `0x42F12` sets D6 to `0x29`, followed by `0x42F1C -> 0x3496`. |
| Balrog headbutt hold, retained | `0x4AD12` sets D6 to `0x2C`, followed by `0x4AD1E -> 0x3496`. |
| Zangief MP / spinning piledriver, retained | The floor-contact paths `0x41E72..0x41E94` and `0x42622..0x4263C` select `0x2E` through `0x3798`. Startup voice commands `0x46` / `0x47` are separate. |

The existing recovered `ce_combat` record API supplies these bytes, including Vega's unarmed record selection. FF guest attacks keep their own source/controller audio; they must not inherit their hidden Balrog proxy's contact records. Possessed Ken's authored heat attacks also keep their explicit audio path. Standard World Warrior and Championship Edition routing is gated out of the change. Native Super Turbo uses its original native sound engine and is outside this CE-adapter patch.

## Validation

- `tests/impact-audio.browser.cjs`: real normal/special inputs for all 12 native fighters, both slots, standing/crouching/air attacks, normal guards, native/Yoga projectile guards and whiffs, actual bite markers, and guest duplicate-cue protection. The test checks each accepted source contact against its own recovered cue and checks all available source records through the routing helper. It also verifies non-silent PCM for the bite and standard impact/guard commands.
- `tests/grab-impact-audio.browser.cjs`: 14 real-input cases covering both slots of Honda's two holds, Blanka bite, Zangief MP/SPD, Yoga Noogie and Balrog headbutt hold. Each damaging marker/floor contact must produce exactly one appropriate command; the holds must release. Slams must deal damage on the actual floor contact.
- `tests/impact-audio-faithful.browser.cjs`: compares World Warrior/Championship Edition audio commands and resulting player/hash state against `9ed0fd2`, including Blanka bite.
- `tests/ai-finishers-faithful.browser.cjs`, with `SF2_BASELINE_REVISION=9ed0fd2`: existing stock state/pixel regression comparison.

These checks verify command routing, contact timing, duplicate prevention and sample output. They do not establish listening quality on physical speakers/controllers or exhaustive original-program audio parity. FF weapons and custom moves retain their existing audio; this audit does not claim to have revalidated every separate FF sound asset or the original program's bonus-object/clash-only sound paths.
