import { Buffer } from 'node:buffer'
import { expect } from '@playwright/test'
import fixtures from '../fixtures/gmf-media-structures.json' with { type: 'json' }
import { test } from './fixtures'

for (const fixture of fixtures) {
  test(`real FormKit address and extraction agree for ${fixture.name}`, { tag: '@smoke' }, async ({ page }) => {
    await page.goto(`/media-structures?fixture=${fixture.name}&key=${crypto.randomUUID()}`)
    await page.locator('input[type=file]').first().setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR9sAAAAASUVORK5CYII=', 'base64') })
    await expect(page.getByText('fixture.png', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Preparar', exact: true }).click()
    await expect(page.getByTestId('snapshot')).not.toBeEmpty()
    const result = JSON.parse((await page.getByTestId('snapshot').textContent())!)
    const expected = fixture.expectedPath.map(segment => segment === '*' ? '0' : segment)
    expect(result.actualField.fieldPath).toEqual(expected)
    expect(result.uploads[0].field.fieldPath).toEqual(expected)
    expect(result.answers).toContainEqual(expect.objectContaining({ fieldPath: expected, value: expect.objectContaining({ name: 'fixture.png' }) }))
  })
}

test('reordering occurrences preserves media identity and updates the actual address', { tag: '@smoke' }, async ({ page }) => {
  await page.goto(`/media-structures?fixture=list-repeated-group&key=${crypto.randomUUID()}`)
  await page.locator('input[type=file]').first().setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR9sAAAAASUVORK5CYII=', 'base64') })
  await expect(page.getByText('first.png', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Preparar', exact: true }).click()
  await expect(page.getByTestId('snapshot')).not.toBeEmpty()
  const original = JSON.parse((await page.getByTestId('snapshot').textContent())!).uploads[0]
  await page.getByRole('button', { name: 'Reordenar', exact: true }).click()
  await page.getByRole('button', { name: 'Preparar', exact: true }).click()
  await expect.poll(async () => JSON.parse((await page.getByTestId('snapshot').textContent())!).uploads[0].field.fieldPath).toEqual(['itens', '1', 'foto'])
  const updated = JSON.parse((await page.getByTestId('snapshot').textContent())!).uploads[0]
  expect(updated.value.clientId).toBe(original.value.clientId)
})

test('flush captures a pending edit without submitting, and external errors can be replaced', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/viewer-events')
  await expect(page.getByTestId('ready-count')).toHaveText('1')
  await page.getByLabel('Nome', { exact: true }).fill('Nome em debounce')
  await page.getByRole('button', { name: 'Consolidar', exact: true }).click()
  await expect(page.getByTestId('flushed')).toContainText('Nome em debounce')
  await expect(page.getByTestId('submit-count')).toHaveText('0')
  await page.getByRole('button', { name: 'Erro externo', exact: true }).click()
  await expect(page.getByText('Corrija o nome', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Limpar erro externo', exact: true }).click()
  await expect(page.getByText('Corrija o nome', { exact: true })).toBeHidden()
})

test('readonly changes unlock existing inputs without losing their values', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/viewer-events')
  await expect(page.getByTestId('ready-count')).toHaveText('1')
  const input = page.getByLabel('Nome', { exact: true })
  // Change the input and lock it in one browser task, before FormKit's debounce.
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Nome"]')!
    input.value = 'Preservado'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.includes('Alternar bloqueio'))!.click()
  })
  await expect(input).toBeDisabled()
  await expect(input).toHaveValue('Preservado')
  await page.getByRole('button', { name: 'Alternar bloqueio', exact: true }).click()
  await expect(input).toBeEnabled()
  await expect(input).toHaveValue('Preservado')
  await input.fill('Editado novamente')
  await page.getByRole('button', { name: 'Consolidar', exact: true }).click()
  await expect(page.getByTestId('flushed')).toContainText('Editado novamente')
})
