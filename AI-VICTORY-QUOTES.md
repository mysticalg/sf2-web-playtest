# AI Edition victory and death-move quotes

`ai_victory_quotes.js` supplies newly authored result-screen text. These are **AI Edition additions**, not recovered or attributed Capcom quotations. No character assets, combat, audio, native WW/CE text, or gameplay RNG are changed by this module.

## Coverage and voice

Every supported winner has three normal-win variants and three death-move variants:

- All twelve CE identities: Ryu, E. Honda, Blanka, Guile, Ken, Chun-Li, Zangief, Dhalsim, M. Bison, Sagat, Balrog and Vega.
- All seven Final Fight bosses: Damnd, Sodom, Andore, Edi. E, Rolento, Abigail and Belger.
- Guy, Cody and Haggar.
- Evil Ryu and Evil Ken, with their own ruthless voices rather than ordinary Ryu/Ken fallback lines.
- Future SSF2T identities Cammy, T. Hawk, Fei Long, Dee Jay and Akuma. Quote coverage does not make those fighters playable or establish SSF2T integration.

Heroes generally regret a lethal outcome, while villains respond according to their own power, money, gang, military or weapon themes. Twenty-four curated relationship pairs take priority over the regular character pools, including Ken/Chun-Li, Ryu/Ken, Chun-Li/Bison, Guile/Bison, Sagat/Ryu, Haggar/Cody/Belger, Guy/Sodom, Haggar/Andore, Cammy/Bison and T. Hawk/Bison. Other pairs retain the winner's individual voice and can refer to the loser's signature technique.

Ken versus Chun-Li includes the requested line: "Your spinning bird kick is no match for my dragon punch!" Evil Ryu's ordinary death pool includes "You are not worthy of your life." A curated relationship pool can replace that ordinary pool, so no line is incorrectly forced into every matchup.

Opponent move labels describe known signatures, not the attack that actually ended the match. Akuma uses Zanku Hadoken rather than suggesting SSF2T has a native Raging Demon move. New dialogue must not be presented as source-extracted text.

## Pure API

Load the classic script before `game.js`. It has no dependencies on game globals beyond assigning `window.SF2AIVictoryQuotes`.

```javascript
const Q = window.SF2AIVictoryQuotes;
const quote = Q.choose(winner.aiProfile, loser.aiProfile, {
  death: completedDeathMove,
  seed: G.AIMatchSeed,
  matchSerial: G.AIMatchSerial
});
// { winner, loser, death, index, source, text, lines }
```

`choose` is deterministic for the same identity, mode, seed and match serial. It reads no clock, DOM, audio state or gameplay randomness, and writes no cache or actor state. Calls from a render query cannot reroll a quote when the inputs stay fixed. Different seeds/serials can select each of the three variants; they do not promise a strict repeating cycle.

`variants(winner,loser,{death})` returns the three frozen quote records for review. `identity(value)` resolves a frozen `{id,known,name,base,move}` record. `ids()` returns all 29 canonical identities. `catalog` and `matchups` expose recursively frozen authored tables. `wrap(text)` exposes the same native-font fitting logic. API objects and returned quote/line arrays are immutable.

Supported identities:

- Canonical strings, including current `chun-li`, `evil-ryu`, `evil-ken`, and future `cammy`, `thawk`, `feilong`, `deejay`, `akuma`.
- `ce:`, `ai:`, `ww:`, `ssf2t:` and `st:` keys, plus common display-name aliases such as E. Honda, M.Bison, ChunLi, Edi. E, T. Hawk, Fei Long and Dee Jay.
- CE numeric fighter IDs 0..11, then future SSF2T IDs 12..16. **UI roster-cell numbers are not fighter identities**; pass explicit strings for the Final Fight guests, whose base `fid` is often 10.
- Actor identity objects, choosing the first explicit `aiProfile`, `fighterKey`, `key`, `id`, `profileName` or `name`, then numeric `fid` only when no explicit identity exists. An unknown explicit guest never silently acquires Balrog/Ryu's voice because of its inherited base `fid`.

Evil winner pools always remain distinct. When a curated opponent relation exists for Ryu/Ken, an evil **loser** may inherit that relationship through its base identity; specific evil-matchup overrides take priority. Unknown identities receive three safe neutral fallback lines with `source:'fallback'`. Exhaustive known-roster testing requires no fallback.

The `source` field is one of `character`, `matchup`, `matchup-base`, `fallback`. Text retains sentence case for diagnostics; `lines` are uppercase printable ASCII for the game's original font. Wrapping uses the minimum number of lines, balances their length and avoids isolated final words. Invalid overly long words/text throw during review instead of silently truncating a line.

## Result-screen integration

The pure module loads before `game.js`. The host now draws AI result text at baselines176/189/202, replaces the old guest placeholder and native quote-image branch, and handles missing native quote/portrait artwork. `SF2AI.info.resultQuote` exposes the stable selected record for inspection.

In AI Edition, replace both the original CE quote-image branch and the guest `NEXT CHALLENGER!` placeholder with this text. Apply it to both normal and completed death-move result paths, including a missing-native-art fallback. Keep faithful WW and CE on their existing original quote art. A draw has no winning character and should keep its draw heading rather than choosing an invented winner.

Use the real completed finisher outcome for `death`; an ordinary special-move KO is not automatically a death move. The current finisher exposes retained completion and winning slot through `retained()`/`info()`. Ensure it corresponds to the current result winner. Latch the chosen record at match-end, or call this pure API with the unchanged match seed/serial; do not use the gameplay `rand()` or `G.st` as a selection input. Clear any host-side latch when starting/resetting/selecting another match.

Draw after the portrait transforms have been restored. The exported `layout` reserves:

| Constraint | Native pixels |
| --- | --- |
| Canvas | 384 x 224 |
| Maximum line | 38 glyphs x 8px = 304px |
| Horizontal centered margins | At least 40px |
| Maximum lines | 3 |
| Baselines | 176, 189, 202 |
| Actual glyph rows | 169..203 |
| Portrait protected region | Y16..159 |
| Text area's lower boundary | Y205 |

For the current native `tx` function:

```javascript
quote.lines.forEach((line,i) =>
  tx(line,192,Q.layout.baselines[i],8,'#fff','#000')
);
```

Do not draw an 8px-font line at double scale. The retained finisher winner portrait currently clips itself to Y16..160; the quoted layout preserves a clear gap below it. Any separate arcade-next-stage caption should stay below the quote area without drawing over the third baseline.

## Validation

Scratch evidence: `E:/codex/2026-11-24/dmnd-need-croutching-attacks-and-blocks/work/victory-quotes/`.

- `test.cjs` / `unit-proof.json`: all 29 identities, 841 ordered pairs, both result modes and three distinct variants: 5,046 quote records, 9,114 wrapped lines. Every line fits 38 glyphs and every quote fits three lines. Aliases, CE IDs, evil-base behavior, fallback safety, immutable inputs/catalogs, stable selections and all three variant choices are checked. Math.random/Date throw if touched by the module.
- `browser.cjs` / `browser-proof.json`: all 5,046 records drawn with the game's original 8px glyph data. No missing native glyphs, no text outside X40..343/Y169..203, and zero changed channels in the protected portrait region. All 1,682 deterministic pair/mode choices match Node and Chromium exactly.
- The official develop-web-game action client captured native-font fixtures in `skill/` and `skill-native/`; no console/page error files were emitted. `native-font-review.png` was visually inspected and includes the requested Ken/Chun-Li line and a full three-line quote. The fit fixture uses the matching original CE winner/loser portrait art.

Reproduce from the SF2 checkout:

```powershell
node --check ai_victory_quotes.js
node E:/codex/2026-11-24/dmnd-need-croutching-attacks-and-blocks/work/victory-quotes/test.cjs
node E:/codex/2026-11-24/dmnd-need-croutching-attacks-and-blocks/work/victory-quotes/browser.cjs
```

The browser fit fixture loads private local copies of the module, original font and original CE portraits using a file URL; it creates no server. When updating the module, refresh that scratch copy before rerunning browser evidence. These checks establish module behavior and native-font placement. They are not a claim that the root-owned result-screen integration or a public deployment has already been tested.


## Integrated verification

`node tests/ai-victory-quotes.test.cjs` checks all5,046known identity/mode/variant records, three distinct choices, aliases, layout limits and selection without gameplay randomness or clock access. `node tests/ai-victory-quotes.browser.cjs` covers62host cases: every current fighter in both winner slots, missing native quote/portrait fallbacks, portrait-pixel preservation, stable repeated rendering, actual visible native/display text, and faithful-edition isolation. Real lethal attacks produce an ordinary timeout result and completed Ken/Haggar finishers; only the completed finishers select death text. Native winner-one and winner-two result captures were inspected. These are authored dialogue additions; future SSF2T quote entries do not claim a playable SSF2T release.
