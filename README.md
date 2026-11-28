# Street Fighter II playtest

Work in progress. ROM fidelity repairs are underway; this is not a completed arcade-accuracy claim.

[Play the preview](https://mysticalg.github.io/sf2-web-playtest/). Choose WORLD WARRIOR, CHAMPION EDITION, AI EDITION or SUPER STREET FIGHTER II TURBO in the main title VERSION row. All modes share the recovered engine and native menus. Keyboard, standard gamepads and touch controls are supported. Enter or punch starts; Esc backs through screens; M toggles sound. AI keeps the original twelve portraits and offers regular Ryu / Evil Ryu Prototype at Ryu, and Ken / Evil Ken at Ken. Damnd, the first Final Fight boss, has his own portrait and third-row slot in AI Edition; either punch or kick selects him. His recovered sprites are sourced from mysticalg/final-fight-web-port and final-fight-web-playtest. Other unfinished additions are excluded. At Ryu or Ken, punch selects the original fighter and kick selects the Evil variant (keyboard A/Z; standard gamepad X/A). Touch players tap the labelled choice. Graphics defaults to MMPX Smooth 2x when no choice has been saved; the selector offers Original pixels, MMPX Smooth 2x and Smooth 4x (slower), with G to cycle. The explicit [Evil Ryu development matchup](https://mysticalg.github.io/sf2-web-playtest/?edition=ai&prototype=evil-ryu) uses original Ryu graphics and prototype rules. AI online play is disabled.

AI Edition camera zoom follows horizontal fighter separation: close combat uses a 1.5x view, while wider spacing pulls back. Jump height and animation poses do not affect zoom or horizontal framing. Guile sky, Honda bath animation and Ken harbour extensions have AI-specific rendering fixes for the expanded view.

AI Edition presentation adds mouth blood on facial hits, landed heavy blows and KOs, intermittent bleeding below 20% health, floor stains that last for the round, and progressive crimson spots, speckles and thin streaks on the injured fighter’s clothing and skin from their own splashes and droplets. Special KOs add fading afterimages on the winning fighter and four slower, fading echo taps of the finishing special. Heavy punches and kicks spray blood on successful head, body or leg hits; blocked heavy strikes do not. Skin and clothing stains belong to the injured fighter, including when player two attacks. These effects do not change damage, movement or round timing. Special KOs ease into a 2.2x close-up on the winner.

AI Edition also uses the original Champion Edition teeth, blood and orange/grey vomit sprite animations recovered from action 0x23 (animation table 0x298ae). Heavy body hits show vomit, changing to the original blood animation below 35% remaining health; heavy facial hits show the original teeth effect. These are native sprite frames over the recovered recoil poses, replacing the custom mouth stream. Residual droplets retain floor splashes. Hit/block contact flashes use the short strength-sized scripts and animate through hitstop. Recovery provenance, image addresses, palette indices, the verified CPS1 graphics ROM lane order and original frame durations are included in ai_reels_data.js.

AI Edition defeated fighters cough blood three times after settling into their lying pose, leaving persistent floor stains. Below 20% health, small bruises around one eye and the mouth deepen in ten stages as health falls, with localised lip/cheek swelling. Round reset clears these effects. Legacy AI dizzy indicators use recovered star/bird sprites instead of square markers.

The AI Edition CPU uses committed movement, guard and attack plans with difficulty-specific reaction delays and attack intervals. Hardest applies from the start of the arcade ladder, with stronger anti-air choices, pressure, throws and recovery punishes. WW/CE retain their original CPU logic.

This repository contains the browser preview only. Every push to main automatically redeploys GitHub Pages.

## Final Fight guest: Damnd

[Play as Damnd](https://mysticalg.github.io/sf2-web-playtest/?edition=ai&fighter=damnd) or [fight the Damnd CPU](https://mysticalg.github.io/sf2-web-playtest/?edition=ai&opponent=damnd). In normal AI character select, move down to Damnd’s own third-row portrait, press punch or kick, then confirm colours. Damnd keeps his original Final Fight colours by default and uses the shared projected SF2 shadow. His roster and versus portraits use the original arcade intro TV close-up, cropped from the [ScrollBoss sprite rip](https://scrollboss.illmosis.net/sprites.php?g=finalfight1), with its original colours. His victory pose plays the recovered Final Fight laugh (sound command 40 / 0x28).

This is a one-on-one adaptation: 42 recovered Final Fight poses plus 36 imagegen-assisted kick, crouching punch, guard, dizzy and burn poses, registered to the same floor and fifteen-colour palette. Primary attacks are punches and a close grab/throw; the CPU favours these over kicks. Six normal buttons, crouching attacks, aerial attacks, guard, hurt, knockdown, victory, mirror matches and CPU control are integrated. He has 180 health; light/medium/heavy normals deal 12/19/27 damage and his throw deals 34. His crouching punches and guard use lowered hurtboxes, and his own dizzy and burning artwork follows the existing reaction timers. His SF2 move timings and collision setup are authored adaptations, not a claim that Final Fight contained SF2 controls.

- Street Rush: LP+LK, or quarter-circle forward + punch. A long dash with three separate punches (14+14+22 damage), ending in knockdown.
- Somersault Kick: MP+MK, or quarter-circle forward + kick. Two spin contacts plus the extended kick deal 8+8+16 damage; the final kick knocks down.
- Rising Smash: HP+HK, or forward/down/down-forward + punch (30 damage).
- Barrel Call: MP+HK, or quarter-circle back + punch. Uses the original whistle pose and sound command 39 (0x27), then the [original eight-frame rolling barrel animation](https://spritedatabase.net/file/21522), ripped by jin315. One barrel at a time, 24/27/30 damage by strength, low guard gives 4 chip, and jumping clears it. Hit/block breaks it; round reset and travel beyond the stage remove it.
- Grab/throw: toward/back + medium/heavy punch at close range.

Asset source commit and SHA-256 provenance are embedded in ai_damnd_data.js. Runtime integration is in ai_damnd.js; WW/CE retain their original roster and mechanics.

Damnd uses Dhalsim’s CE jump height, horizontal speed and gravity, including backward jumps in either direction. When Damnd is the opponent, his stage is the recovered Slum boss courtyard: Metro City skyline, wrecked cars and the boss doorway. Native Final Fight layers are adapted to the SF2 floor, with a rigid world-space fighting plane and quarter-speed distant skyline.

## AI Edition six-button chains

On a confirmed grounded normal hit, tap any attack button not yet used in the current six-button cycle to cancel directly into that normal. Order and strength are unrestricted: HK → HP → MK → MP → LK → LP, or any other order. After all six buttons connect, all six become available again. Down is retained for buffered crouching attacks. Inputs during hit pause are buffered; simultaneous special chords and deliberate motion commands keep their existing priority. Confirmed normals can also cancel into specials using the usual motion or two-button shortcut. Specials keep their own controls; throws remain separate.

CPU opponents use longer confirmed chains at higher difficulties; Damnd prefers short punch chains to preserve his punch-and-throw style. Used buttons dim under the hit counter. Misses and blocks do not grant a cancel. Defender recovery, taking damage and round reset clear the chain. Small follow-up steps, reduced normal-hit pushback, a stable combo hurtbox and startup-length hitstun keep short attacks connected after heavy hits. A normal knockdown can be caught by the next confirmed follow-up. WW and CE retain their original combat.

Run `node tests/ai-chain.test.cjs` for all 720 six-button permutations across two cycles and the rejection/reset/input-priority checks.

## Timed special breakers and bonus chains

After the second connected hit and each later hit, the grounded defender has an eight-frame window to enter a valid special. Both normal special motions and the AI Edition two-button shortcuts work. A successful breaker ends the attacking chain, launches the chosen special and grants twelve frames of startup protection. A COMBO BREAK notice confirms success. Late presses, buttons held before the hit, ordinary attack taps and unavailable specials do not break a combo. Harder CPU opponents can attempt timed breakers too.

The six-button and special-cancel rules also apply to confirmed bonus-object contacts on the car, barrel and drum stages. Car clanks do not count as hits. The bonus chain clears after eighty frames without an object contact or on reset. Damnd retains his own body artwork and name during bonus stages. AI drum spacing allows short follow-up strikes to reach the objects; faithful WW/CE spacing stays unchanged.
