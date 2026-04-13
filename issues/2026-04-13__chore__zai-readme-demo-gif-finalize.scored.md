# 2026-04-13__chore__zai-readme-demo-gif-finalize

**Repo:** `zi007lin/zai`
**Label:** `chore`
**Branch:** `zai/readme-demo-gif-finalize`
**Reviewer:** daniel-silvers
**Depends on:** PR #25 merged

---

## Intent

Two deferred items from PR #25: (1) unify the two README scorer URLs to `demo.zai.htu.io/app`, and (2) verify `howto-use-SDD.mp4`, convert it to a GIF, and embed it in the README. Ships together as one PR — the URL fix is trivial, the GIF is the main work.

---

## Files

```
README.md                    ← URL fix + GIF embed (replace placeholder)
docs/assets/zai-demo.gif     ← new binary asset
```

---

## Steps

### Step 1 — Fix the URL inconsistency

In `README.md`, find the "Try the scorer" section (from PR #18) and replace `dev.zai.htu.io/app` with `demo.zai.htu.io/app`:

```bash
grep -n "dev.zai.htu.io\|demo.zai.htu.io" ~/dev/zai/README.md
```

Replace every occurrence of `dev.zai.htu.io/app` with `demo.zai.htu.io/app`. Do not touch any other URLs.

Verify:
```bash
grep "dev.zai.htu.io" ~/dev/zai/README.md
# Must return zero matches
grep "demo.zai.htu.io" ~/dev/zai/README.md
# Must return all scorer URL references
```

---

### Step 2 — Verify the source MP4

```bash
ffprobe /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 2>&1 | grep -E "Duration|creation_time|filename"
```

**Gate check:** The file must have been created or modified AFTER `2026-04-13T05:00:00Z` — that is after PR #16 merged (rubric v1.1.0, which introduced the 6/6 RESEARCH badge and correct type detection).

```bash
stat /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 | grep -E "Modify|Change"
```

**If the file predates PR #16** → STOP. Emit:
```
needs_input: howto-use-SDD.mp4 predates rubric v1.1.0 — re-record the demo at demo.zai.htu.io/app
showing a research spec scoring 6/6 RESEARCH, then place the file at
/mnt/c/Users/zilin/dev/howto-use-SDD.mp4 and re-run this impl
```

**If the file passes the date check** → extract a frame to visually confirm content:
```bash
ffmpeg -i /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 \
  -ss 00:00:03 -vframes 1 /tmp/demo-frame-check.png -y
# Open the frame to confirm it shows the ZAI /app scorer
wslview /tmp/demo-frame-check.png 2>/dev/null || \
  cp /tmp/demo-frame-check.png /mnt/c/Users/zilin/Downloads/demo-frame-check.png
```

The frame must show `demo.zai.htu.io/app` or `dev.zai.htu.io/app` with the spec scorer UI visible. If it shows unrelated content → STOP with needs_input.

---

### Step 3 — Convert MP4 to GIF

```bash
mkdir -p ~/dev/zai/docs/assets

# Pass 1: generate colour palette
ffmpeg -i /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 \
  -vf "fps=10,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff" \
  /tmp/zai-demo-palette.png -y

# Pass 2: render GIF
ffmpeg -i /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 \
  -i /tmp/zai-demo-palette.png \
  -lavfi "fps=10,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  ~/dev/zai/docs/assets/zai-demo.gif -y

# Check size
ls -lh ~/dev/zai/docs/assets/zai-demo.gif
```

**If GIF exceeds 10MB**, reduce and retry:
```bash
# Fallback: lower fps + narrower scale
ffmpeg -i /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 \
  -vf "fps=8,scale=720:-1:flags=lanczos,palettegen=stats_mode=diff" \
  /tmp/zai-demo-palette.png -y

ffmpeg -i /mnt/c/Users/zilin/dev/howto-use-SDD.mp4 \
  -i /tmp/zai-demo-palette.png \
  -lavfi "fps=8,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" \
  ~/dev/zai/docs/assets/zai-demo.gif -y

ls -lh ~/dev/zai/docs/assets/zai-demo.gif
```

If still over 10MB after fallback → STOP:
```
needs_input: GIF is still over 10MB after fallback settings.
Options: (a) trim the source video to under 60s and re-run, or
(b) use Option 2 (linked thumbnail) instead of embedded GIF.
```

---

### Step 4 — Embed GIF in README

Find the placeholder line added by PR #25:
```bash
grep -n "TODO\|demo-gif\|GIF\|gif" ~/dev/zai/README.md | head -10
```

Replace the placeholder comment with:
```markdown
![Score your spec before it ships](docs/assets/zai-demo.gif)
```

Verify the line exists and the path is correct:
```bash
grep "zai-demo.gif" ~/dev/zai/README.md
```

---

### Step 5 — Commit and PR

```bash
cd ~/dev/zai
git add docs/assets/zai-demo.gif README.md
git commit -m "chore: Embed demo GIF + unify scorer URLs to demo.zai.htu.io/app"
```

---

## Acceptance Criteria

- [ ] `grep "dev.zai.htu.io" README.md` returns zero matches
- [ ] All scorer links in README point to `demo.zai.htu.io/app`
- [ ] `docs/assets/zai-demo.gif` exists and is under 10MB
- [ ] GIF renders inline on `github.com/zi007lin/zai` README page
- [ ] GIF shows the ZAI `/app` scorer UI (not unrelated content)
- [ ] GIF was recorded after PR #16 merge (rubric v1.1.0)
- [ ] README placeholder replaced with `![...](docs/assets/zai-demo.gif)`
- [ ] PR opened for daniel-silvers review

---

## Subject Migration Summary

| | |
|---|---|
| What | README URL unification + demo GIF embed |
| State | Spec complete; needs scoring before impl |
| Open questions | (1) Does `howto-use-SDD.mp4` show rubric v1.1.0 behavior? Gate check in Step 2 answers this. (2) Is the video trimmed to the essential flow? Shorter = smaller GIF. |
| Next action | Score → impl — Step 2 gate check will auto-stop if recording is stale |
| Repo | `zi007lin/zai` |

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T16:56:37.878Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__zai-readme-demo-gif-finalize.md_
