# 2026-04-12__feat__zai-ambiguity-viz-ui-polish

## Intent

Polish the ZAI "From ambiguity to spec — in color" interactive widget:
1. Increase font sizes across heading, body, and labels for readability.
2. Remove the static teal color square; instead use the computed color as a full-screen dynamic background behind the entire widget.

---

## Decision Tree

| Option | Tradeoff | Decision |
|---|---|---|
| Color square → full-screen background | Immersive; color signal becomes ambient rather than isolated | ✅ Chosen |
| Keep square, also tint background | Redundant visual; cluttered | ❌ Rejected |
| Remove color entirely | Loses the core ZAI metaphor | ❌ Rejected |
| Bump font sizes globally | Improves hierarchy and legibility, no layout cost | ✅ Chosen |

---

## Final Spec

### 1. Typography

| Element | Current (est.) | Target |
|---|---|---|
| `h1` / heading | ~28px | **40px**, `font-weight: 700` |
| Body paragraph | ~14px | **18px**, `line-height: 1.7` |
| Slider labels (`Ambiguity: X%`, `Spec coverage: X%`) | ~13px | **16px** |

Use the existing font stack (Space Grotesk preferred; system-ui fallback).

### 2. Color square → dynamic background

- **Remove** the `<div>` / element rendering the standalone teal square.
- The computed `hsl` / hex color (currently driving the square fill) must instead be applied as:
  ```css
  background-color: <computed-color>;
  transition: background-color 0.3s ease;
  ```
  on the **root container** of the widget (full viewport if fullscreen, or the outermost wrapper div if embedded).
- Text and slider elements must remain legible over the colored background:
  - Apply a **semi-transparent dark overlay** (`rgba(0,0,0,0.45)`) between the background color and the content layer, OR
  - Switch heading/body text to `color: #fff` with `text-shadow: 0 1px 4px rgba(0,0,0,0.6)` when background luminance is above a threshold (L > 0.5 in HSL).
- Slider track and thumb styling should remain unchanged.
- The `transition` ensures smooth color sweeps as sliders move.

### 3. Color mapping (unchanged logic)

No changes to how ambiguity + spec coverage map to a color value. Only the _render target_ changes (background instead of square).

---

## Acceptance Criteria

- [ ] Teal color square is gone from the DOM
- [ ] Root container background animates as sliders move
- [ ] Heading renders at ≥ 40px
- [ ] Body copy renders at ≥ 18px
- [ ] Slider labels render at ≥ 16px
- [ ] Text remains readable (contrast ≥ 4.5:1) at both low and high ambiguity settings
- [ ] No layout shift when square is removed

---

## Files to modify

```
apps/htu-io/src/components/ZaiAmbiguityViz.tsx   (or equivalent component path)
apps/htu-io/src/components/ZaiAmbiguityViz.css   (if separate)
```

Confirm exact path before starting — run:
```bash
find . -type f -name "*.tsx" | xargs grep -l "ambiguity\|spec.*color\|color.*square" 2>/dev/null
```

---

## Subject Migration Summary

| Field | Value |
|---|---|
| What | UI polish: font scale-up + color square → full-screen background |
| State | Spec written; not yet implemented |
| Open questions | Exact component file path; luminance-threshold logic for text contrast |
| Next action | `impl i 2026-04-12__feat__zai-ambiguity-viz-ui-polish.md` |
| Files touched | This spec only |
