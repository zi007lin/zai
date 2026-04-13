# 2026-04-13__chore__zai-readme-demo-gif

**Repo:** `zi007lin/zai`
**Label:** `chore`
**Branch:** `zai/readme-demo-gif`
**Reviewer:** daniel-silvers

## Intent

Convert the screen recording `Recording 2026-04-13 113437.mp4` to an animated GIF and embed it in README.md under a "How to use ZAI" section. Shows the upload → score → download workflow inline on the GitHub repo page without requiring any external video host.

---

## Files

```
docs/assets/zai-demo.gif   ← generated from the MP4
README.md                  ← add "How to use ZAI" section with embedded GIF
```

---

## Steps

### Step 1 — Locate the source video

```bash
ls /mnt/c/Users/zilin/Recording\ 2026-04-13\ 113437.mp4
# or
find /mnt/c/Users/zilin/ -name "*.mp4" -newer /mnt/c/Users/zilin/Downloads 2>/dev/null | head -5
```

### Step 2 — Install ffmpeg if not present

```bash
which ffmpeg || sudo apt-get install -y ffmpeg
```

### Step 3 — Generate optimised GIF

```bash
mkdir -p ~/dev/zai/docs/assets

# Step A: extract palette for best colour quality
ffmpeg -i "/mnt/c/Users/zilin/Recording 2026-04-13 113437.mp4" \
  -vf "fps=12,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff" \
  /tmp/zai-demo-palette.png -y

# Step B: render GIF using palette
ffmpeg -i "/mnt/c/Users/zilin/Recording 2026-04-13 113437.mp4" \
  -i /tmp/zai-demo-palette.png \
  -lavfi "fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  ~/dev/zai/docs/assets/zai-demo.gif -y

# Check file size — target under 10MB for GitHub inline rendering
ls -lh ~/dev/zai/docs/assets/zai-demo.gif
```

If the GIF exceeds 10MB, reduce quality:
```bash
# Reduce fps to 8 and scale to 720px wide
ffmpeg -i "/mnt/c/Users/zilin/Recording 2026-04-13 113437.mp4" \
  -vf "fps=8,scale=720:-1:flags=lanczos,palettegen=stats_mode=diff" \
  /tmp/zai-demo-palette.png -y

ffmpeg -i "/mnt/c/Users/zilin/Recording 2026-04-13 113437.mp4" \
  -i /tmp/zai-demo-palette.png \
  -lavfi "fps=8,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  ~/dev/zai/docs/assets/zai-demo.gif -y

ls -lh ~/dev/zai/docs/assets/zai-demo.gif
```

### Step 4 — Add "How to use ZAI" section to README.md

Find the existing README.md section order:
```bash
grep "^## " ~/dev/zai/README.md
```

Insert the following section **after the intro/tagline and before any architecture section** (confirm exact insertion point from grep output above):

```markdown
## How to use ZAI

![Score your spec before it ships](docs/assets/zai-demo.gif)

1. Write your spec using the [ZiLin Command format](https://demo.zai.htu.io/app)
   or download the template from the scorer page
2. Upload the `.md` file to [demo.zai.htu.io/app](https://demo.zai.htu.io/app)
3. Get a deterministic score — no LLM judgment, pure structural analysis
4. Download the `.scored.md`
5. Run `impl i <your-spec.scored.md>` via Claude Code
```

### Step 5 — Commit and open PR

```bash
cd ~/dev/zai
git add docs/assets/zai-demo.gif README.md
git commit -m "chore: Add demo GIF and How to use ZAI section to README"
```

---

## Acceptance Criteria

- [ ] `docs/assets/zai-demo.gif` exists and is under 10MB
- [ ] GIF renders inline on `github.com/zi007lin/zai` README
- [ ] "How to use ZAI" section present in README with embedded GIF
- [ ] 5-step workflow listed below the GIF
- [ ] GIF shows the upload → score → download flow clearly
- [ ] PR opened for daniel-silvers review

---

## Subject Migration Summary

| | |
|---|---|
| What | Demo GIF + "How to use ZAI" section in README |
| State | Spec complete; needs scoring before impl |
| Open questions | (1) Does the MP4 show the full flow (upload → 6/6 RESEARCH score → download)? If it only shows the old 4/7 FAIL, re-record first. (2) Trim the video to the essential flow before converting — shorter = smaller GIF. |
| Next action | Score → impl |
| Repo | `zi007lin/zai` |

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T16:39:27.583Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__zai-readme-demo-gif.md_
