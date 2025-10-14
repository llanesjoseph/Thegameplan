import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Public routes to scan without authentication
const routesToScan = ['/', '/coaches', '/lessons', '/gear']

async function injectAxe(page: import('@playwright/test').Page) {
  // Load axe-core from CDN to avoid adding runtime deps
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js' })
}

async function runAxeOnPage(page: import('@playwright/test').Page) {
  // Evaluate axe in the browser context
  // We intentionally avoid strict typing here to keep the test self-contained
  const results = await page.evaluate(async () => {
    const axe: any = (window as any).axe
    if (!axe) {
      return { error: 'axe not available on window' }
    }
    const options = {
      resultTypes: ['violations', 'incomplete'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    }
    const runResults = await axe.run(document, options)
    return {
      violations: runResults.violations,
      incomplete: runResults.incomplete,
      passes: runResults.passes?.length ?? 0,
      inapplicable: runResults.inapplicable?.length ?? 0,
      timestamp: new Date().toISOString(),
      url: location.href,
    }
  })
  return results as any
}

for (const route of routesToScan) {
  test(`axe scan: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await injectAxe(page)
    const results = await runAxeOnPage(page)

    // Attach JSON results to the test report for triage
    await testInfo.attach(`axe-${route.replace(/\W+/g, '_')}.json`, {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    })

    // Persist results to a11y-reports/latest for offline review
    try {
      const latestDir = path.join(process.cwd(), 'a11y-reports', 'latest')
      fs.mkdirSync(latestDir, { recursive: true })
      const fileName = `axe-${route.replace(/\W+/g, '_')}.json`
      fs.writeFileSync(path.join(latestDir, fileName), JSON.stringify(results, null, 2), 'utf8')
    } catch {}

    // Soft assertion strategy: do not fail CI yet. Surface counts via annotations.
    const violations = Array.isArray(results?.violations) ? results.violations : []
    const seriousOrCritical = violations.filter((v: any) => v.impact === 'serious' || v.impact === 'critical')
    testInfo.annotations.push({
      type: 'a11y',
      description: `${violations.length} violations (${seriousOrCritical.length} serious/critical) on ${route}`,
    })

    // Emit concise summary to console for quick visibility
    // eslint-disable-next-line no-console
    console.log(`[a11y] ${route}: ${violations.length} violations, ${seriousOrCritical.length} serious/critical`)
  })
}


