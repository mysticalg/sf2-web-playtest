# Final Fight guests (AI Edition)

The original SF2 roster is joined by Damnd, Sodom, Andore, Edi. E, Rolento, Abigail and Belger. The seven gold-bordered tiles form the third selection row. Both players may select any guest, including mirror matches. Faithful WW/CE editions retain their original rosters and rules.

Arcade has the original twelve matches and bonus rounds followed by the Metro City route: Slum courtyard, Subway ring, West Side cage, West Side streets, Industrial elevator, Bay Area and Uptown penthouse. Each district has its own map marker, arena and CPU opponent; Belger finishes the route. Guest champions have their own result/ending card.

| Fighter | Specials in shortcut order | District |
|---|---|---|
| Damnd | Street Rush, Somersault Kick, Rising Smash, Barrel Call | Slum |
| Sodom | Katana Rush, Twin Blade Cyclone, Rising Katana, Gut Buster | Subway |
| Andore | Giant Rush, Flying Body Press, Hammer Lift, Cage Piledriver, Shoulder Breaker | West Side cage |
| Edi. E | Police Pistol, Baton Rush, Baton Upper, Arrest and Batter, Pistol Burst | West Side |
| Rolento | Patriot Circle, Stinger Grenade, Staff Vault, Shoulder Toss, Grenade Retreat | Industrial Area |
| Abigail | Rage Charge, Giant Body Splash, Bay Uppercut, Crushing Toss, Power Punch | Bay Area |
| Belger | Crossbow Volley, Chair Rush, Sky Bolt Rain, Escape Hop, Crossbow Butt | Uptown |

Shortcuts: LP+LK, MP+MK, HP+HK, MP+HK, LP+MK, respectively. Motions for the new guests: quarter-circle forward + punch, quarter-circle forward + kick, dragon-punch + punch, quarter-circle back + punch, quarter-circle back + kick. Forward/back + medium/heavy at close range throws. Six attack buttons, crouching attacks, high/low guard, directional jumps, hit-confirm chains, special cancels, timed combo breakers, dizzy/fire/KO reactions and bonus-stage attacks are connected.

These are authored SF2 adaptations of the Final Fight bosses, not a claim of frame-exact Final Fight AI. Their native signature actions inform the extensions: swords/charge and gut punches; police baton/pistol/grab; staff/acrobatic kicks/grenades/shoulder throw; rage charge punch and wrestling; chair and crossbow volleys/escape jumps. Normal buttons are adapted to each boss's native fighting style, including weapon strikes and punches on kick-button inputs.

## Original art and additional art

Sodom animation ordering/origins come from mysticalg/final-fight-web-port, preview 5ec2d8c0c6e1465c2281d390a32e022126ff0ec9. Its palette is restored by comparison with an identical original arcade pose. Other guest bodies and district scenery use original Capcom arcade rips by shunninghuang from https://spritedatabase.net/game/608 (boss files15216/15217/15220/15221/15230/15232). Original art remains Capcom's property, for this non-commercial playtest. Arenas are cropped/composited/tiled into a flat SF2 fighting plane; camera, floor blood and actors share world coordinates.

Original portraits were16px HUD heads. The six new96px portraits were generated with the built-in imagegen tool using the original arcade sheets as identity references (Sodom/Andore/Edi. E, Rolento/Abigail/Belger). Damnd retains his recovered close-up. The sole new battle frame is Belger's missing horizontal KO pose, generated against his original sheet and normalized to its palette. Earlier generated body sheets were rejected for design drift and are not shipped. Native HUD heads remain alongside generated profiles for provenance.

## AI balance and rendering

Original fighters288HP, Evil variants272, Damnd360; guests300–420HP according to size/role. Combo damage scales100%,85%,72%,60%,50%,42%,35%,30%,25% from the first through ninth+ consecutive hit. Blocked specials inflict20% of their old chip, clamped1–2 per contact. Chip can still finish a fighter with very little health.

Normal zoom caps at1.2x, based only on horizontal spacing. The existing special-KO close-up remains. AI scenery and actors are composed into a1536x896 display buffer with a separate HUD; smooth modes magnify native art before camera projection. This avoids zooming into a384x224 intermediate frame. Original pixels and both MMPX modes remain selectable. No high-resolution detail is invented in battle sprites. WW/CE keep the existing renderer.

## Validation

202 mirrored normal/special contact-and-recovery cases; all six guests' standing/low block, wrong block, dizzy and Yoga Fire recovery; mirrored throws;1800-tick CPU runs; twelve-hit cycles in both slots; bonus-stage chains; map-to-versus-to-fight identity/arena transitions; graphics modes/headroom/jump-independent zoom; explicit health, combo scaling and chip checks. Existing timed-breaker, special-cancel and all-native-roster bonus checks pass. WW/CE240-frame combat traces remain identical to the previous implementation. Browser screenshots and the develop-web-game action client were inspected.
