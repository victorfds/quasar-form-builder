import { Buffer } from 'node:buffer'
import { expect } from '@playwright/test'
import { test } from './fixtures'

test('multiple button choices retain rapid selections and remove only the clicked choice', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('form-fields', JSON.stringify([
    { $formkit: 'q-btn-toggle', name: 'choices', label: 'Escolhas', multiple: true, options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
    { $formkit: 'q-input', name: 'both', label: 'Ambos', if: '$contains($choices, "a") && $contains($choices, "b")' },
  ])))
  await page.reload()
  await expect(page.locator('[data-field-name="choices"]')).toBeVisible()
  await page.locator('.q-page-sticky').first().locator('.q-tab').nth(1).click()
  await expect(page.locator('.preview-form-container .overlay-preview-element').first()).toBeHidden()
  const preview = page.locator('.preview-form-container')
  await preview.getByRole('button', { name: 'A', exact: true }).click()
  await preview.getByRole('button', { name: 'B', exact: true }).click()
  await expect(preview.getByLabel('Ambos', { exact: true })).toBeVisible()
  await expect(preview.getByRole('button', { name: 'A', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await preview.getByRole('button', { name: 'A', exact: true }).click()
  await expect(preview.getByLabel('Ambos', { exact: true })).toHaveCount(0)
  await expect(preview.getByRole('button', { name: 'B', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('reads previous IndexedDB Blob rows without changing media references', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'This Linux WebKit cannot create Blob rows; ArrayBuffer persistence is covered by media round trips')
  const response = `old-blob-${Date.now()}`
  await page.goto(`/media?response=${response}`)
  await expect(page.getByLabel('Arquivos', { exact: true })).toBeEnabled()
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles({ name: 'previous.txt', mimeType: 'text/plain', buffer: Buffer.from('previous durable bytes') })
  await expect.poll(async () => JSON.parse((await page.getByTestId('media-values').textContent())!).attachments?.length).toBe(1)
  const original = JSON.parse((await page.getByTestId('media-values').textContent())!).attachments[0]
  await page.evaluate(async ({ response, original }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('qfb-playground', 1)
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const tx = db.transaction('media', 'readwrite')
    tx.objectStore('media').put({ value: original, blob: new Blob(['previous durable bytes'], { type: 'text/plain' }) }, ['qfb-media', 'playground-user', 'media-demo', response, original.clientId])
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  }, { response, original })
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Rascunho salvo')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Baixar previous.txt' })).toBeVisible()
  expect(JSON.parse((await page.getByTestId('media-values').textContent())!).attachments[0]).toEqual(original)
})
