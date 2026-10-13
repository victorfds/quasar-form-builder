import { expect, test } from '@playwright/test'

test('concurrent SSR requests keep FormKit IDs stable through hydration', { tag: '@smoke' }, async ({ page, request }) => {
  const runtimeErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydration/i.test(message.text())) runtimeErrors.push(message.text())
  })
  page.on('pageerror', error => runtimeErrors.push(error.message))

  const htmls = await Promise.all(Array.from({ length: 8 }, async () => {
    const response = await request.get('/viewer-events')
    expect(response.ok()).toBe(true)
    return response.text()
  }))
  const snapshots = await page.evaluate(htmls => htmls.map((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return {
      forms: Array.from(doc.querySelectorAll('form'), form => form.id),
      names: Array.from(doc.querySelectorAll('form'), form => form.name),
      labels: Array.from(doc.querySelectorAll<HTMLLabelElement>('label.formkit-label'), label => label.htmlFor),
    }
  }), htmls)
  const baseline = snapshots[0]!
  expect(baseline.forms).toHaveLength(1)
  expect(baseline.labels).toHaveLength(1)
  expect(baseline.labels[0]).toMatch(/^qfb-/)
  for (const snapshot of snapshots) expect(snapshot).toEqual(baseline)

  await page.goto('/viewer-events')
  await expect(page.getByTestId('ready-count')).toHaveText('1')
  const hydrated = await page.evaluate(() => ({
    forms: Array.from(document.querySelectorAll('form'), form => form.id),
    names: Array.from(document.querySelectorAll('form'), form => form.name),
    labels: Array.from(document.querySelectorAll<HTMLLabelElement>('label.formkit-label'), label => label.htmlFor),
  }))
  expect(hydrated).toEqual(baseline)
  await page.getByLabel('Nome').fill('SSR')
  await expect(page.getByTestId('latest-field-change')).toHaveText('name:SSR')
  expect(runtimeErrors).toEqual([])
})
