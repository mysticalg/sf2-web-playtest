# Generated Final Fight hero profiles

The built-in image_gen.imagegen tool created these three close-up profiles using the original Final Fight idle sprite and HUD face as identity references, with the existing Edi. E roster profile as the SF2 framing/style reference. Each selected output was normalized to96x96 with nearest-neighbor dimension conversion. Native battle atlases and HUD heads were preserved.

- Guy: `ai-heroes/guy-profile.png`
- Cody: `ai-heroes/cody-profile.png`
- Haggar: `ai-heroes/haggar-profile.png`

These are generated profiles, not recovered Capcom portrait pixels. Canonical faces look image-left and the roster renderer mirrors the left slot inward. The original sprite source is `mysticalg/final-fight-web-playtest` at commit `5ec2d8c0c6e1465c2281d390a32e022126ff0ec9`.

## Final prompts

### Guy

```text
Use case: style-transfer.
Asset type: one game-ready Street Fighter II CPS1 character-select close-up portrait, square.
Primary request: transform the original Final Fight GUY reference into a matching SF2 portrait. Image 1 is the exact character identity/costume reference, image 2 is only the existing roster portrait style and framing reference.
Subject: Guy from ORIGINAL Final Fight: Japanese young adult man, short dark brown almost black hair with a modest tousled flat fringe, strong straight dark eyebrows, clean-shaven, athletic lean jaw, original orange sleeveless martial-arts gi with narrow warm yellow edge. Preserve the original native sprite identity; no red modern outfit, no headband, no scarf, no ponytail, no facial hair, no invented accessories.
Composition: canonical head faces image LEFT in a three-quarter view, eyes toward image-left. Very tight head portrait like the style reference: hair begins at top edge, chin around y=75 of a 96-high frame, only neck and a small amount of orange gi at bottom; face dominates 75% of image height. Do not draw a bust or chest. Keep complete forehead and chin within image. One character only.
Style: authentic early 1990s Capcom Street Fighter II CPS1 select portrait pixel art, hard pixel edges, deliberate chunky pixel clusters, crisp navy outlines, warm peach skin shading, bold arcade contrast. Exactly match the reference's artwork density, proportions and face scale. Plain very dark navy-black background. No gradients/blur, no modern anime painting, no vector smoothness.
Output: a single 96x96 pixel square portrait, no layout sheet, no inset, no reference characters, no text, no border, no watermark.
```

### Cody

```text
Use case: style-transfer.
Asset type: one game-ready Street Fighter II CPS1 character-select close-up portrait, square.
Primary request: transform the original Final Fight CODY reference into a matching SF2 portrait. Image 1 is the exact original character identity/costume reference. Image 2 is ONLY the existing roster portrait style and framing reference; do not use its policeman face, cap or costume.
Subject: original Final Fight Cody Travers, young adult white man with short sandy blond hair, a compact swept flat-top/quiff, dark strong eyebrows, clean-shaven square athletic face, original plain WHITE crew-neck T-shirt. He is not a prisoner or mayor: no striped clothes, no cuffs, no beard, no suit, no hat, no bandana, no added jewelry. Preserve the simple blond original native sprite identity.
Composition: canonical head faces image LEFT in a three-quarter view, eyes look image-left, confident fighter expression. Very tight head portrait matching reference: hair at top edge, chin near y=75 of a 96-high frame, only neck and the very top of the white T-shirt at bottom; face occupies roughly 75% of height. Minimal chest, no arms/hands, complete face.
Style: authentic early 1990s Capcom Street Fighter II CPS1 selection portrait pixel art. Strong deliberate low-resolution pixel clusters, crisp dark navy outlines, peach skin shading, warm sandy blond ochre hair, bold arcade contrast. Match the reference face size and art density. Plain very dark navy-black background, no pattern. Do not paint smooth gradients or modern anime linework.
Output: one single 96x96 pixel square portrait. No sheet, inset, other characters, text, border or watermark.
```

### Haggar

```text
Use case: style-transfer.
Asset type: one game-ready Street Fighter II CPS1 character-select close-up portrait, square.
Primary request: transform ORIGINAL Final Fight HAGGAR identity reference (image 1) into an SF2 CPS1 portrait matching the existing roster portrait's scale/style (image 2). Use image 2 ONLY as pixel-art/close-up framing reference, never as identity or police costume.
Subject: Mike Haggar from original Final Fight: a rugged older white American wrestler with very broad square jaw, thick brown handlebar/chevron moustache with clearly separated upward cheek edges, no beard, short combed dark brown hair with a tidy flat top and squared short sideburns, strong heavy eyebrows, mature brow and confident stern expression. Original shirtless wrestler costume: tiny glimpse of dark olive GREEN single shoulder suspender over bare skin at the bottom edge. Do NOT add a shirt, hat, armor, gloves, jewelry, long hair, beard or changed costume. Match the supplied original sprite face and hair.
Composition: canonical head faces image LEFT in three-quarter view, eyes toward image-left. Head nearly fills frame: hair at top edge, chin near y=77 of a 96-high image, only neck/top shoulder and a hint of the olive suspender at the very bottom. Very little chest. Full face and moustache clearly visible, not cropped. One character only.
Style: authentic early 1990s Capcom Street Fighter II CPS1 character-select pixel portrait. Strong low-resolution square pixel clusters and dark navy outlines, warm peach/tan skin shadows, brown hair, dense readable arcade face shading, match reference density/proportions. Plain very dark navy-black background, no vignette or pattern, no modern smooth illustration, no blur.
Output: one single 96x96 pixel square head portrait. No sheet, inset, extra characters, text, border, watermark.
```
