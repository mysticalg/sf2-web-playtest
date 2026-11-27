# AI rendering performance

The AI stage renderer used the same Canvas colour filter for each native row-scroll strip. Guile's shaded wide view could repeat that operation roughly 200 times per frame. A blood-covered floor also looked up the same row projection 3,072 times for 1,536 stains, although stains occupy only seven depths.

Filtered source images now use the existing shade cache, limited to 16 entries, on integer, unscaled stage draws. Fractional coordinates or scaling retain the original Canvas path: testing found real coverage/rounding differences when those draws were prefiltered. Native stage animation producers explicitly identify their completed copy-on-update canvases as immutable snapshots, so they can reuse a shade until the source image actually changes. Other canvas sources carry a tick revision. The cache replaces revised entries instead of retaining every revision.

Blood floor projection is shared only within the current draw, once per occupied depth. Each stain keeps the original expression and rounding order. There is no persistent camera/row cache. Native sprite images, projection scale, floor coordinates, gameplay, inputs, particle counts, blood persistence and afterimage limits are unchanged.

## Measurements

Local Chromium software 2D CPU render-call timings, alternating baseline/candidate/candidate/baseline after warm-up. These are not monitor refresh rates or universal hardware FPS. Simulation stepping is outside each timed render. Original pixels and 2x MMPX were both measured at close 320 px and wide 768 px views, with healthy fighters, both fighters below 20% health plus 1,536 floor stains, and a frozen peak of 18 winner afterimages. Weather/seed/round were fixed; no compiler/native-reference process ran during the final batch. Heavy Guile/Chun cases have four timed calls per variant; Dhalsim cases have 80.

| Round 2 case | Baseline render | Candidate render |
| --- | ---: | ---: |
| Guile wide, original/MMPX, all three effects |649–701 ms |18–35 ms |
| Guile close, original/MMPX, all three effects |33–60 ms |3–10 ms |
| Chun-Li close, original/MMPX, all three effects |26–36 ms |4–10 ms |
| Chun-Li wide fractional panorama |308–342 ms |302–327 ms |
| Dhalsim original pixels, all views/effects |2.1–6.3 ms |2.0–5.4 ms |
| Dhalsim MMPX, all views/effects |3.5–6.5 ms |3.5–6.4 ms |

Dhalsim MMPX varies within a few milliseconds; no uniform speedup is claimed. Chun-Li's wide fractional panorama remains a substantial hotspot because its original pixel coverage must be retained. Fractional moving/zooming draws also retain their original filtering cost.

At the blood cap, Guile floor draw now uses 14 map queries instead of 3,072; full warm-frame map calls fall from 3,073 to 15. Chun's floor lookup/view calls fall from 3,130/1,594 to 72/65, including its unchanged scenery work. The number and placement of visible stains remain identical.

## Validation

- 300 sampled animated/moving AI frames across all 12 stages, round 2/round 3, original/MMPX: exact world-surface, native-canvas and display-canvas RGBA hashes, with matching complete simulation hashes. Includes Guile crowds, bath water/fan, Ken's boat, Chun cyclists/panorama, elephants and Vegas palette actors.
- 21,168 exact numeric floor-projection comparisons over fractional and extended cameras, widths, all seven depths and all stages.
- WW and CE: 394 synchronized full-state frames each plus identical final native pixels against the baseline.
- Final solid-red evil-overlay integration, applied only in a private test route over the worker's actual sources: three animated world/native/display frames and full states identical; 20 warm renders create zero canvases, with the same 20 existing HUD readbacks and an 8/64 eye cache.
- `tests/ai-render-cache.test.cjs`: integer/unscaled sampling gate, mutable-source revision refresh, bounded eviction, published native snapshot identity and immutability. Existing 720 chain-order and preview-stamp checks pass.
- Actual keyboard browser-client movement/jump/attack screenshots inspected. The skill client's forced SwiftShader backend failed image decoding on this machine; its unchanged action/capture loop passed with only those backend flags removed.

Private measurements and reproducible baseline/candidate scripts are preserved in this worktree's `work/performance/`, including `abba-final.json`, `pixel-check.json`, `pixel-moving.json`, `projection-and-revision-proof.json`, `faithful-proof.json` and `evil-cache-compatibility.json`. Baseline commit: `cd3dab1657179734dbb6968991de6b235fd7f1aa`. No deployment is implied by these local checks.

## Facial injury texture stability - 2026-11-27

Native head collision centres use integer world pixels, but the injury region previously subtracted fractional player coordinates. Moving at subpixel positions therefore moved the wound within the sprite and created a different canvas/cache key almost every frame. A fixed-pose512sample sweep created514canvases for Ryu and1026for Possessed Ryu, including the dependent eye textures.

The local region now subtracts the same integer origin used by the head box. Fractional movement reuses one wound image per pose; severity, original pose and source-image changes retain their existing invalidation. Guest mouth landmarks already use consistent fractional coordinates and are unchanged. Integer-position injury geometry is identical to48d9b70; movement no longer makes bruises drift across the face. No gameplay, hitboxes or faithful-edition rendering changes.

Validation: tests/injury-cache.browser.cjs checks528pose/identity/slot/facing combinations across44identities and135168fractional positions, with zero warm canvas allocations and stable image identity. All528integer reference regions match48d9b70. Existing220injury/eye cases,648hero weapon cases andWWCE60state/4pixel checks pass; officialskill low-health jumping capture inspected. This confirms removal of allocation churn, not reproduction or resolution of the reported recurring4-5second pause.
