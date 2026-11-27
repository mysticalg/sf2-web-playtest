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

## Chun-Li wide floor shading - 2026-11-27

The previously documented fractional-panorama hotspot is now narrowed: only scroll2 paving source rows192..255, drawn one pixel high to one pixel high, reuse the existing native shade before horizontal projection. The original draw arguments, row positions, width, alpha, camera and source pixels stay the same. Other fractional/scaled scenery still uses the original Canvas filter path, and weather light overlays retain their original identity and placement. The bounded nativeShade cache already owns these source images; no new per-row canvases or cache family are added.

On the local software Canvas benchmark,36close/wide,3camera,3round,original/2x comparisons pass. The final correctly positioned camera sweep has exact world/display RGBA matches; an earlier sweep saw two RGB channels differ by1/255, so regression tolerance is capped at2/255 with zero alpha changes. Mean filtered wide render calls improve from422.2ms to33.0ms in the final sweep (an earlier sweep299.8ms to29.4ms). These are renderer-call timings, not universal FPS. Original WWCE60state/4pixel and native cache/snapshot tests pass; actual wide-rain skill screenshot inspected. This addresses a measured stage stall without claiming the user-reported recurring pause is fully resolved.


## Persistent blood floor patterns - 2026-11-27

Each new floor stain now retains its deterministic shape at landing. Previously all visible and offscreen stains rebuilt the same floor key and hash every repaint. At the1536-stain limit this removes1536hash calls and temporary shape-key strings per frame. Size growth at saturation keeps the original pattern, and older stain objects retain the original fallback calculation. No stain count, placement, colour, projection or combat logic changes.

Validation:96complete world/display comparisons across12stages,2camera positions,close/wide views andoriginal/2x modes are exact. All1536landed patterns match the prior calculation; saturated merging does zero new pattern hashes; legacy fallback and reset pass. WWCE60state/4picture checks pass. Officialskill movement and a real LP hit over a saturated Dhalsim floor were inspected. This removes demonstrated repeated work; it does not prove the reported4-5secondpause is resolved.

A separate cloud-filter-state experiment preserved168pictures but did not reduce a60secondgameplay trace; it was discarded, with no atmosphere code changes published.


## Native audio streaming - 2026-11-27

Where AudioWorklet supports the original 24038Hz context, one persistent node plays the unchanged interleaved native PCM through a fixed8192-frame stereo ring. Browser output resampling remains in place; the adapter does not synthesize new game audio. The queue starts with512frames available and discards stale backlog above7211frames. Mute, pause, reset and title boot clear queued audio. Unsupported worklets or sample rates retain the previous AudioBuffer playback path.

A local8-second real-time comparison replaced483AudioBuffers and483single-use source nodes with one worklet node, no AudioBuffers/source nodes, and483small transferred PCM chunks. It retained the per-frame PCM copy. The worklet reported zero underruns/drops, and a real WebAudio analyser measured nonzero output. Native state, raw rendered pixels and original mixer PCM match at21samples across4200ordinary-input frames.48076sample-level unit checks preserve stereo order, signed amplitude and original0.35gain exactly; startup, underflow, overflow and reset are covered. The no-worklet fallback and mute/re-enable flow pass. These are bounded playback/allocation measurements, not proof that the reported4-5second pause is fixed or that hardware QSound DSP parity has been achieved. Full AI roster/rules integration remains unfinished.


2026-11-27 AI world MMPX GPU path: supported hardware WebGL2 filters the AI world directly from its canvas texture, avoiding the previous per-frame world getImageData readback. It retains the exact MMPX decision order, saturated crop borders and source pixels. HUD filtering, original pixels, faithful WW/CE and software WebGL and contexts without renderer information retain the existing CPU path. Two small opaque/transparent CPU-reference preflight pictures must match before use; context loss switches back to CPU. Backing canvas and source texture grow at capacity boundaries and are reused. Producer work is explicitly flushed before Canvas2D consumes it. Where the AI page provides idle time, the preflight runs while the initial assets load.

Validation:144actual stage/camera/gap/mode comparisons and24primitive comparisons (including a sheet of all512binary3x3patterns) have zero changed RGBA channels. Active GPU draws make zero JS world-canvas getImageData calls. Context-loss, unavailable-WebGL and software-renderer fallbacks pass. Existing120CPU buffer-reuse pictures and faithful WW/CE60state/4picture checks pass. An actual skill walk/jump/attack screenshot was inspected; the software test browser correctly uses CPU fallback.

On the local NVIDIA RTX4060Ti in-app browser,12matched simulation states rendered in CPU/GPU/GPU/CPU order retain identical picture hashes. Mean complete render-plus-display-readback timings improve from10.31ms to7.62ms; these are renderer-call timings, not universal FPS. A separate20.67second Guile-stage fight with audio records1237RAFupdates, one33msgap and one50msgap; the last240filter calls average3.27ms with5.5msp95. Earlier stale-cache/private-page measurements are excluded; the accepted run verifies the versioned renderer URL, ready GPU backend and hardware identity. An earlier67second CPU run identified a217ms task dominated by canvas readback, but the reported recurring4-5second pause has not been reproduced or proven fixed. Source dimensions, zoom/projection, physics, combat and native assets are unchanged. Full AI/native/guest integration goal remains active.
