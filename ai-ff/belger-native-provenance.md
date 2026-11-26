# Belger native recovery

The assets and measured behavior come from the user's complete `E:/Downloads/ffightub.zip`, SHA256 `85633860b62b60ed8871228f7449986570cefd4ade46497c980829c621eb8caa`. The archive contains both the World parent and US clone program files, plus their shared graphics. Every relevant file's CRC32 and SHA1 matches the official [MAME CPS1 definitions](https://github.com/mamedev/mame/blob/master/src/mame/capcom/cps1.cpp). No ROM files, keys, emulator or executable ROM instructions are added to the web runtime.

The address descriptions below identify the **World parent set `ffight`**, not an assumed US relocation. Its reconstructed main CPU SHA256 is `bbe8d2262af4e09d9606c7c0e7fef8bcb91369fc10233ceb924e4a5f9ce2db1b`; the shared graphics SHA256 is `4b33ebdb093a9f7ce987f9be2e1f6d8629f36c955cc4545eece494223ba9eff5`. The US program was independently reconstructed and verified as `c5e6b8eeb328d6b3272f29d4588cf775ee2569ec12f456236b7e3ffc5d7c781a`; World code addresses are not silently applied to it.

| Native source | Verified role |
|---|---|
| `0x005a04`, table entry `0x005a28` | Boss subtype5 dispatch to Belger `0x04e9f4` |
| `0x04ea0a` | Entry, health600/900, original seated animation, attached Jessica actors |
| `0x0506b8` | Mounted damage response; keep chair above300/450, dismount at or below it |
| `0x050732`, `0x05078e` | Successful grab also dismounts; spawn intact type10/subtype18 chair |
| `0x055196` | Independent chair target, then two hops, skid and bounded removal |
| `0x0045d2` | Chair's separate destruction emits10 debris actors of variant7 |
| `0x056560`, `0x0566e2`, `0x056876` | Debris velocities/gravity/drag/lifetimes, materials and offsets |
| `0x050bf4` | Genuine on-foot two-image action: one tick at `0x050c00`, four at `0x050c60` |
| `0x04fd72`, `0x04f8b8`, `0x04f93a` | Native leap/hop speed, gravity and12-tick apex offsets |
| `0x04fdb4`, `0x04fe06`, `0x04fe52` | Horizontal/upward/diagonal projectile origins and modes |
| `0x059ada` | Projectile controller: horizontal8px/tick, upward VY0x740/gravity0x48, diagonal 0x5a700 per axis |
| `0x05a074`, `0x05a0a0`, `0x05a1c4` | Original complete arrow image scripts and rotations |
| `0x0c17e0` | Original16-entry Belger palette; all15 opaque colors match the previous source sprite |
| `0x003ae2`, `0x003b02`, `0x0168cc`, `0x0646a2` | Original animation initializer/advance, object command assembly and shape deltas |

`belger-native.png` SHA256 is `44fcb62477f6dc4dbc97249b52afffb7ef575c3e33653c797a9a64aa3f6e26d3`. The first19 legacy cells retain all1,310,720 RGBA channels, frame rectangles and palette exactly. The appended46 cells use complete original object assemblies; no body image is enlarged, rescaled, generated, stretched or joined. Each cell's original source address, trim, grounded sole adjustment, opaque-pixel count and RGBA SHA256 is recorded in `SF2AIFFData.belger.nativeRecovery.proof`. Canonical artwork faces left; the existing fighter renderer mirrors it. Body frames19â€“34 include the two authentic on-foot walking poses. Equipment frames35â€“64 have no facial pixels.

The original shader palette capture was checked rather than assumed: the transient stage palette31 initially held another ramp. Aligning the original seated image gave5276/5276 exact color-index matches and found the complete correct palette at0x0c17e0. Body and chair use that verified palette. Wood/wheel debris keep their original equipment palette from the controlled stage capture.

Research execution uses a private [Musashi](https://github.com/kstenerud/Musashi) CPU runner and the original program solely to measure fixtures. It is not linked or shipped with the web game. All paused Final Fight reconstruction files were read-only. Preparation, reference runner, bounded disassembly, source extraction, CRC/SHA1 verification and raw measurements remain in the separate local `work/belger-native-recovery` packet.

## Native behavior and SF2 adaptations

The half-health threshold, successful-grab dismount, separately hittable intact chair, body bounce/skid, ten debris scripts, two-image foot walk, arrow pixels, projectile speed/gravity/poses, and escape-hop apex pause are recovered from the original. Nonlethal blocked chip does not detach the chair; ordinary damage above half retains a seated reaction. A fresh later contact destroys the independent chair once. No parking/re-seat state remains.

SF2 inputs, five shortcut choices and traditional motions, six normal attack families, throw controls, health/damage/chip balance, hitstun, guard, arbitrary-button chains, timed breakers, arena bounds and arcade progression remain fighting-game adaptations. Normal buttons use native crossbow-contact poses; they do not invent a native unarmed punch or kick. Jump/escape input voluntarily dismounts permanently so those SF2 controls work before half health. Successful grabs do not force remaining health down to half. The original belt-depth axis is collapsed to the SF2 combat lane: upward scatter targets three nearby horizontal lanes, while source gravity and descending-only attack admission remain. Simultaneous player attacks/projectiles can hit the chair using an adapted host contact hook. Chair debris uses deterministic cosmetic staggering, without spending fighting-game RNG. The earlier authored horizontal KO18 remains for SF2 defeat/getup; original window/ending sequences and Jessica are not implemented by this change.

The native original's full decision-state AI, every stage/cutscene controller, three-dimensional lane collisions and item economy are outside this isolated Belger lifecycle translation. The implementation does not present a CE clone or authored move as a complete Final Fight reconstruction.

## Evidence

- Native program:110 exact object command assemblies (55 images, both facings),12 original body animation timelines,10 threshold/grab fixtures, three original projectile-mode traces.
- Translation:48 chair-body ticks and374 debris records match source fixed-point X/Y, velocity, lifetime and exact native image IDs. The fixture asserts both hops and skid, so offscreen cleanup cannot masquerade as a physics replay.
- Assets:46 native cells with complete bounds and exact RGBA hashes; all legacy cells/palette and every non-Belger data key unchanged.
- Actual browser:32 lifecycle/contact cases;144 normal hit/block/miss cases;18 hardware-keyboard, airborne interruption/getup, bonus/edition checks;10 selected-special finisher cases after native bolt integration. Source-scale and actual gameplay captures were visually inspected.
- Hard CPU:four4000-tick runs from close range and opposite room ends in both slots deal1246â€“1359 cumulative damage, make69â€“90 normal attacks and use all native-role special families.
- WW/CE:394 state frames and final rendered pixels each are identical to clean6c0d892. Shared arbitrary-chain and preview-build checks pass.

Tests found and fixed two real integration failures before handoff: native shared slot names must retain the host's `getup`/`fall`/`jump` aliases, and the KO/down hold must terminate so an interrupted hop can get up. The standard game skill client failed all image decodes under its forced SwiftShader flags on this machine; a local copy with only those flags removed rendered the same actual game and inputs successfully. The ordinary Chromium tests do not alter application routes or game files.

The final host merge preserves Abigail's spinning piledriver and source art, all heroes, the creator-selected portraits and victory quotes. Merged checks pass180 actual finisher choices,48 native-fragment victim cases (675,200 opaque RGBA channels),75 lifecycle cases,22 hero/weapon/hold cases, and six extra guarded-chip/half-health/lethal-chip checks in both slots. Nonlethal guarded chip crossing half health keeps the mounted state even after recovery; an unblocked hit at that threshold dismounts, and a lethal guarded hit cleans up normally. The four faithful WW/CE comparison scenarios retain60 frame hashes and four rendered pixel hashes.

The retained horizontal KO is intentional: native down31 is a hunched kneeling pose, and native death32 is the window fall. Replacing the shared lying state with either would conflict with the requested horizontal floor defeat/cough behavior. The native down pose remains in its original fall/down timeline; the explicit SF2-only horizontal extension remains a finite20-tick hold.
