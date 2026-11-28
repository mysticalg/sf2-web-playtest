# AI Edition native grab restoration

This restores available existing fighters' grabs in **AI Edition**. WW and CE keep their existing controllers, animation indices and assets. The new animation and held-pose aliases are appended only to AI fighters' cloned data.

- **Zangief:** 360+P and the existing LP+LK shortcut now start the actual Spinning Piledriver list at `0x73d6c`, instead of immediately damaging the opponent while playing the normal MP-grab list. Original spin sprites, attachment selectors, takeoff, apex, dive, impact pose and recoil are used. The original controller at `0x4256e..0x4268c` supplies the 7-pixel launch, gravity `0x28`, apex transition to gravity `0x90`, impact and rebound. Damage is applied once, when the attacker reaches the floor. The normal MP/HP/MK/HK throws use their separate original lists; MP has the source jump/slam motion. Crouching MP/HP use their available native grab poses and real release markers.
- **Dhalsim:** toward+MP starts Yoga Noogie (`0x7b19c`), including its three previously absent native sprites, voiced wind-up and repeated contact poses. Toward+HP retains the distinct overhead toss (`0x7b230`). Noogie damages only on its native contact marker.
- **Sagat:** toward+MP/HP follows `0x86e74`, with the victim attached to the original animation-selected rows. The throw releases on its native marker, behind Sagat, and he turns as the throw completes. Estimated early release and free-running victim slide are removed.
- **Honda:** MP uses his distinct original throw (`0x529ce`). HP and HK use the existing source-backed headbutt/bear-hug and knee-hold controller, which was previously enabled only for CE. Its original poses, squeeze/escape input, hit markers and release now operate in AI Edition. The AI stage bounds and giant-victim extent are used for clipping.
- **Boxer Balrog:** the existing MP/HP headbutt hold now animates through its native list (`0x8a780`) and contact markers. This is the boxer called **M. Bison in Japanese naming**, matching the reported “Bison headbutt” grab. Dictator M. Bison's Head Press/Skull Diver is separate and unchanged.

Repeated holds permit fresh directional/button presses to escape. Holding one input does not count as repeated escape attempts. Noogie and the boxer hold retain their source 180/300 physical-tick limits; hitstop extends elapsed wall time. Honda uses its existing original squeeze/escape calculation. Defeating/interruption of the holder, round reset and finisher cleanup release attachments. The selected finisher piledriver uses the same real floor impact to notify the finisher, then completes its physical recovery.

`ai_native_grabs_data.js` contains original animation metadata, palette-specific sprite crops, attachment rows from `0xaaff4` and shared held poses from status `0x3e`. It contains no raw program ROM. Extraction is pinned to CE program SHA-256 `aca6c7212ffbcd1894add413e1276e647e5ccbe1a8ee36327aceabd0e0f8fcf9`; the extraction receipt records the exact animation addresses and output hash.

The native frame lists, attachment records, marker timing and listed motion constants are source-backed. The JavaScript lifecycle integration, bounded stage placement, missing guest-body pose fallback and Noogie/boxer escape threshold are authored AI adapters. Complete original scheduler, RNG, every throw variation and hardware parity are not claimed. Guests retain their own sprites; unavailable native held poses use their own hurt/inverted art and head anchor, with grounded bodies kept above the floor.

The 153 follow-up fixes the actual render path: extracted grab sprites were
previously used for bounds but omitted from `fighterArtBase0`, causing the four
Spinning Piledriver rotation entries to display atlas frame 0. They now render
their original extracted art. Camera framing uses the captured pre-grab offset
while a victim is attached, freezes native vertical throw scrolling, and limits
attach/release pan corrections to 6 pixels per tick. A rotating attachment pose
cannot move the scenery independently of the holder's physical movement.

The MP jump samples absolute RIGHT at takeoff (041DF8..041E1A); neutral uses the
leftward branch, independently of facing. Post-slam victim motion uses the source
descriptor 2 values (0391B6: VX200/VY600/gravity58), while SPD uses descriptor14
(0394CA: VX280/VY880/gravity58). Damage still occurs once at the holder's real
floor impact; the released victim's remaining fall/bounce carries zero damage.
Guests start the released upright motion at floor height rather than inheriting
the inverted head attachment's unrelated sprite-origin height.
