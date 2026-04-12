Fix ZAI landing page layout — fit hero on one screen, responsive across all devices, Playwright E2E tests.

## Problem

The hero section ("Zero Ambiguity Intelligence" + tagline + CTAs) does not fit
on a single viewport. Users must scroll to see the full hero. The RGB demo
section is partially visible at the bottom, drawing the eye away.

## Target layouts

### Desktop (1280px+)
- Full hero visible above the fold: headline + tagline + by HTU + two CTAs
- RGB demo section visible on scroll
- Nav: Home / App / Pricing / htu.io ↗

### Tablet (768px–1279px)
- Hero fits in viewport
- Slightly smaller headline

### Mobile (375px–767px)
- Hero fits in viewport
- Headline wraps to 2 lines max
- CTAs stack vertically
- Nav collapses to hamburger

## Tasks

### Step 1 — Audit current layout issues

```bash
grep -r 'fontSize\|font-size\|h1\|hero\|vh\|vw\|padding\|margin' \
  ~/dev/zai/src --include='*.tsx' --include='*.css' | head -30
```

### Step 2 — Fix hero to fit viewport

Key changes:
- `min-height: 100dvh` on hero container (dynamic viewport height for mobile)
- Headline: `clamp(2.5rem, 6vw, 5rem)` — scales with viewport
- Tagline: `clamp(1rem, 2.5vw, 1.5rem)`
- Vertical padding: reduce to ensure everything fits
- CTAs: flex-wrap on mobile

### Step 3 — Fix nav

```tsx
// Mobile: hamburger menu
// Desktop: inline links
// Always show: ZAI logo + htu.io link
```

### Step 4 — Playwright E2E tests

Create `e2e/responsive.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop HD', width: 1280, height: 800 },
  { name: 'Desktop 4K', width: 1920, height: 1080 },
]

for (const device of devices) {
  test(`Hero fits viewport on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.goto('/')

    // Hero headline visible without scrolling
    const headline = page.getByRole('heading', { name: /Zero Ambiguity/i })
    await expect(headline).toBeVisible()
    const box = await headline.boundingBox()
    expect(box!.y + box!.height).toBeLessThan(device.height)

    // CTAs visible without scrolling
    const tryZAI = page.getByRole('button', { name: /Try ZAI/i })
    await expect(tryZAI).toBeVisible()
    const ctaBox = await tryZAI.boundingBox()
    expect(ctaBox!.y + ctaBox!.height).toBeLessThan(device.height)
  })

  test(`No horizontal scroll on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(device.width + 2)
  })

  test(`Nav visible on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })
    await page.goto('/')
    await expect(page.getByText('ZAI')).toBeVisible()
    await expect(page.getByText(/htu\.io/i)).toBeVisible()
  })
}
```

### Step 5 — Playwright config

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

Install Playwright:
```bash
cd ~/dev/zai
npm install -D @playwright/test
npx playwright install chromium
```

### Step 6 — Run tests locally

```bash
npm run dev &
npx playwright test e2e/responsive.spec.ts --reporter=list
```

All 15 tests (5 devices × 3 tests) must pass.

### Step 7 — Deploy dev

```bash
npm run deploy:dev
```

### Step 8 — Commit and PR

```bash
git add src/ e2e/ playwright.config.ts
git commit -m "fix: Responsive layout — hero fits viewport on all devices + Playwright E2E tests"
```

PR title: `fix: ZAI responsive layout + Playwright device tests`
Reviewer: daniel-silvers

## Acceptance Criteria

- [ ] Hero (headline + tagline + CTAs) fits above the fold on all 5 device sizes
- [ ] No horizontal scroll on any device
- [ ] Nav visible on all devices
- [ ] Mobile: CTAs stack vertically
- [ ] Mobile: headline ≤ 2 lines
- [ ] All 15 Playwright tests pass
- [ ] deploy:dev succeeds
- [ ] PR opened for daniel-silvers

## Run Instruction

```bash
cp /mnt/c/Users/zilin/Downloads/2026-04-12__fix__zai-responsive-layout.md \
   ~/dev/zai/issues/

gh issue create \
  --title "fix: ZAI responsive layout + Playwright device tests" \
  --body-file ~/dev/zai/issues/2026-04-12__fix__zai-responsive-layout.md \
  --repo zi007lin/zai

cd ~/dev/streettt && claude
# implw zi007lin/zai#<number>
```
