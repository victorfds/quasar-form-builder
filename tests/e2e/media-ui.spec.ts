import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { expect } from '@playwright/test'
import { test } from './fixtures'

const first = { name: 'first.png', mimeType: 'image/png', buffer: Buffer.from('first image') }
const second = { name: 'second.png', mimeType: 'image/png', buffer: Buffer.from('second image') }
const audio = { name: 'first.webm', mimeType: 'audio/webm', buffer: Buffer.from('first audio') }
const nextAudio = { ...audio, name: 'second.webm', buffer: Buffer.from('second audio') }

async function builder(page: Page, fields: unknown[]) {
  await page.goto('/')
  await page.evaluate((schema) => {
    localStorage.clear()
    localStorage.setItem('form-fields', JSON.stringify(schema))
  }, fields)
  await page.reload()
  await expect(page.locator('.my-form-wrapper')).toBeVisible()
  await expect(page.locator('[data-field-name]').first()).toBeVisible()
}

async function preview(page: Page) {
  await page.locator('.q-page-sticky').first().locator('.q-tab').nth(1).click()
  await expect(page.locator('.preview-form-container .preview-form-remove-action')).toHaveCount(0)
  await expect(page.locator('.preview-form-container input[type="file"]').first()).toBeEnabled()
}

async function storedFields(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('form-fields') || '[]'
    return JSON.parse(raw.startsWith('__q_strn|') ? raw.slice('__q_strn|'.length) : raw)
  })
}

async function mediaValues(page: Page) {
  return JSON.parse((await page.getByTestId('media-values').textContent()) || '{}')
}

for (const name of ['files', 'images', 'gallery']) {
  test(`legacy ${name} appends later selections and keeps removal and clear working`, async ({ page }) => {
    await builder(page, [{
      $formkit: 'q-file',
      name,
      label: 'Seleção',
      multiple: true,
      useChips: true,
      clearable: true,
      accept: name === 'files' ? undefined : 'image/*',
      gallery: name === 'gallery',
    }])
    await preview(page)
    const field = page.locator('.preview-form-container .q-file')
    const input = page.getByLabel('Seleção', { exact: true })
    await input.setInputFiles(first)
    await expect(field.locator('.q-chip')).toHaveCount(1)
    await input.setInputFiles(second)
    await expect(field.locator('.q-chip')).toHaveCount(2)
    await expect(field).toContainText(first.name)
    await expect(field).toContainText(second.name)
    if (name === 'gallery') await expect(page.locator('.file-gallery .qfb-media-item')).toHaveCount(2)
    await field.locator('.q-chip').first().locator('.q-chip__icon--remove').click()
    await expect(field.locator('.q-chip')).toHaveCount(1)
    await expect(field).not.toContainText(first.name)
    await expect(field).toContainText(second.name)
    await field.locator('.q-field__focusable-action').click()
    await expect(field.locator('.q-chip')).toHaveCount(0)
    if (name === 'gallery') await expect(page.locator('.file-gallery .qfb-media-item')).toHaveCount(0)
  })
}

for (const limit of [{ maxFiles: 1 }, { maxTotalSize: first.buffer.length + second.buffer.length - 1 }, { maxFileSize: first.buffer.length }]) {
  test(`legacy file ${Object.keys(limit)[0]} rejects the new item without losing the first`, async ({ page }) => {
    await builder(page, [{ $formkit: 'q-file', name: 'files', label: 'Seleção', multiple: true, useChips: true, ...limit }])
    await preview(page)
    const input = page.getByLabel('Seleção', { exact: true })
    await input.setInputFiles(first)
    await expect(page.locator('.q-file .q-chip')).toHaveCount(1)
    await input.setInputFiles(second)
    await expect(page.getByRole('alert').first()).toContainText(second.name)
    await expect(page.locator('.q-file .q-chip')).toHaveCount(1)
    await expect(page.locator('.q-file .q-chip')).toContainText(first.name)
    await expect(page.locator('.q-file .q-chip')).not.toContainText(second.name)
  })
}

test('single file selection still replaces the previous value', async ({ page }) => {
  await builder(page, [{ $formkit: 'q-file', name: 'file', label: 'Seleção', useChips: true }])
  await preview(page)
  const input = page.getByLabel('Seleção', { exact: true })
  await input.setInputFiles(first)
  await expect(page.locator('.q-file')).toContainText(first.name)
  await input.setInputFiles(second)
  await expect(page.locator('.q-file')).toContainText(second.name)
  await expect(page.locator('.q-file')).not.toContainText(first.name)
})

test('legacy rejection can be cleared without losing new batch errors or required validation', async ({ page }) => {
  await builder(page, [{ $formkit: 'q-file', name: 'files', label: 'Seleção', multiple: true, maxFiles: 1, useChips: true, clearable: true, validation: 'required' }])
  await preview(page)
  const input = page.getByLabel('Seleção', { exact: true })
  const field = page.locator('.preview-form-container .q-file')
  await input.setInputFiles(first)
  await input.setInputFiles(second)
  await expect(page.getByRole('alert').first()).toContainText(second.name)
  await field.locator('.q-field__focusable-action').click()
  await input.setInputFiles({ ...first, name: 'valid-again.png' })
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(field).not.toHaveClass(/q-field--error/)
  await field.locator('.q-field__focusable-action').click()
  await input.setInputFiles([first, second])
  await expect(field.locator('.q-chip')).toHaveCount(1)
  await expect(page.getByRole('alert').first()).toContainText(second.name)
})

test('integrated selections append to local and confirmed remote values without duplicates', async ({ page }) => {
  await page.goto(`/media?response=append-${Date.now()}`)
  const input = page.getByLabel('Arquivos', { exact: true })
  await expect(input).toBeEnabled()
  await input.setInputFiles(first)
  await expect.poll(async () => (await mediaValues(page)).attachments?.length).toBe(1)
  await input.setInputFiles(second)
  await expect.poll(async () => (await mediaValues(page)).attachments?.length).toBe(2)
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  const original = (await mediaValues(page)).attachments
  await page.reload()
  await expect(input).toBeEnabled()
  const third = { ...first, name: 'third.png' }
  await input.setInputFiles(third)
  await expect.poll(async () => (await mediaValues(page)).attachments?.length).toBe(3)
  expect((await mediaValues(page)).attachments.slice(0, 2)).toEqual(original)
  await input.setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(1024 * 1024 + 1) })
  await expect(page.getByRole('alert').first()).toContainText('oversized.png')
  expect((await mediaValues(page)).attachments).toHaveLength(3)
  await input.setInputFiles([{ ...first, name: 'fourth.png' }, { ...first, name: 'fifth.png' }])
  await expect.poll(async () => (await mediaValues(page)).attachments?.length).toBe(5)
  await input.setInputFiles({ ...first, name: 'sixth.png' })
  await expect(page.getByRole('alert').first()).toContainText('sixth.png')
  expect((await mediaValues(page)).attachments).toHaveLength(5)
  await page.getByRole('button', { name: 'Remover second.png' }).click()
  await expect.poll(async () => (await mediaValues(page)).attachments?.length).toBe(4)
  await page.getByRole('switch', { name: 'Somente leitura' }).click()
  await expect(input).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Remover / })).toHaveCount(0)
})

for (const mode of ['legacy', 'offline']) {
  test(`${mode} audio appends selected files and respects the combined count and readonly`, async ({ page }) => {
    await page.goto(`/media?response=audio-append-${mode}-${Date.now()}&mode=${mode}&multiple=true`)
    const input = page.getByLabel('Selecionar áudio', { exact: true })
    await expect(input).toBeEnabled()
    await input.setInputFiles(audio)
    await expect.poll(async () => (await mediaValues(page)).voice?.length).toBe(1)
    await input.setInputFiles(nextAudio)
    await expect.poll(async () => (await mediaValues(page)).voice?.length).toBe(2)
    await expect(page.getByRole('button', { name: `Baixar ${audio.name}` })).toBeVisible()
    await expect(page.getByRole('button', { name: `Baixar ${nextAudio.name}` })).toBeVisible()
    await input.setInputFiles({ ...audio, name: 'third.webm' })
    await expect(page.getByRole('alert').first()).toContainText('third.webm')
    expect((await mediaValues(page)).voice).toHaveLength(2)
    await page.getByRole('button', { name: `Remover ${audio.name}` }).click()
    await expect.poll(async () => (await mediaValues(page)).voice?.length).toBe(1)
    await expect(page.getByRole('button', { name: `Baixar ${nextAudio.name}` })).toBeVisible()
    await page.getByRole('switch', { name: 'Somente leitura' }).click()
    await expect(input).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Gravar', exact: true })).toBeDisabled()
  })
}

test('recorder and capture controls follow the configured Quasar primary color', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['microphone'])
  await page.goto(`/media?response=primary-${Date.now()}`)
  await expect(page.getByLabel('Selecionar áudio')).toBeEnabled()
  await page.evaluate(() => document.body.style.setProperty('--q-primary', '#d6336c'))
  const record = page.getByRole('button', { name: 'Gravar', exact: true })
  expect(await record.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(214, 51, 108)')
  if (!await page.evaluate(() => typeof MediaRecorder !== 'undefined')) {
    await record.click()
    await expect(page.getByRole('alert').first()).toContainText('Gravação não disponível')
    await expect(page.getByLabel('Selecionar áudio')).toBeEnabled()
    return
  }
  await record.click()
  const pause = page.getByRole('button', { name: 'Pausar gravação' })
  await expect(pause).toBeVisible()
  expect(await pause.evaluate(element => getComputedStyle(element).color)).toBe('rgb(214, 51, 108)')
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Parar gravação' }).click()
  const confirm = page.getByRole('button', { name: 'Confirmar', exact: true })
  await expect(confirm).toBeVisible()
  expect(await confirm.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(214, 51, 108)')
  await confirm.click()
  const picker = page.locator('.qfb-audio-recorder .q-file')
  await expect(page.getByLabel('Selecionar áudio')).toBeEnabled()
  await picker.locator('.q-field__native[tabindex="0"]').focus()
  await expect(picker).toHaveClass(/q-field--focused/)
  expect(await picker.locator('.q-field__control').evaluate(element => getComputedStyle(element).color)).toBe('rgb(214, 51, 108)')
})

test('field identities are kept internally but hidden in settings including nested debug previews', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await builder(page, [{ $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-input', name: 'answer', label: 'Pergunta' }] }])
  const original = await storedFields(page)
  const ids = [original[0].fieldId, original[0].children[0].fieldId]
  expect(ids.every(Boolean)).toBe(true)
  await page.locator('[data-field-name="group"] > .overlay-preview-element').click({ position: { x: 8, y: 8 } })
  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText('group')
  for (const id of ids) await expect(drawer).not.toContainText(id)
  await expect(drawer).not.toContainText('fieldId')
  await drawer.locator('input').first().fill('renamed_group')
  await drawer.locator('input').first().press('Tab')
  await expect.poll(async () => (await storedFields(page))[0].name).toBe('renamed_group')
  expect((await storedFields(page))[0].fieldId).toBe(ids[0])
  expect((await storedFields(page))[0].children[0].fieldId).toBe(ids[1])
})

const settings = [
  { $formkit: 'q-file', name: 'files', label: 'Arquivos', multiple: true },
  { $formkit: 'q-audio-recorder', name: 'recorder', label: 'Gravação' },
  { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  { $formkit: 'q-select', name: 'select', label: 'Seleção', options: [] },
  { $formkit: 'q-date', name: 'date', label: 'Data' },
  { $formkit: 'q-time', name: 'time', label: 'Hora' },
  { $formkit: 'q-slider', name: 'slider', label: 'Slider' },
  { $formkit: 'q-matrix', name: 'matrix', label: 'Matriz', table: true },
  { $formkit: 'q-checkbox', name: 'checkbox', label: 'Marcação' },
  { $formkit: 'q-btn', name: 'button', buttonLabel: 'Concluir', ignore: true },
  { $formkit: 'q-grid', name: 'grid', rowsCount: 1, columnsCount: 2 },
]

for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`simple configuration rows stay side by side at ${width}px in ${theme} mode`, async ({ page, context }) => {
      test.setTimeout(90_000)
      await context.addCookies([{ name: 'theme', value: theme, url: 'http://127.0.0.1:3010' }])
      await page.setViewportSize({ width: 1440, height: 900 })
      for (const field of settings) {
        await builder(page, [field])
        await page.locator(`[data-field-name="${field.name}"] > .overlay-preview-element`).click()
        const drawer = page.locator('[data-drawer="right"]')
        await expect(drawer.locator('.qfb-settings-row').first()).toBeVisible()
        await page.setViewportSize({ width, height: 900 })
        if (!(await drawer.isVisible())) {
          await page.locator('.q-page-sticky .q-tab').filter({ hasText: 'arrow_back' }).last().click()
          await expect(drawer).toBeVisible()
        }
        const result = await drawer.locator('.qfb-settings-row').evaluateAll((rows) => {
          const failures: string[] = []
          for (const row of rows) {
            const label = row.firstElementChild!
            const control = row.lastElementChild!
            const l = label.getBoundingClientRect()
            const c = control.getBoundingClientRect()
            const r = row.getBoundingClientRect()
            if (!r.width || !r.height) continue
            const title = label.textContent?.trim() || ''
            if (l.right > c.left + 1 || Math.abs(l.top + l.height / 2 - c.top - c.height / 2) > 2)
              failures.push(`${title}: label and control are not aligned`)
            if (c.right > r.right + 1 || c.left < r.left - 1)
              failures.push(`${title}: control overflows its row`)
            for (const button of control.querySelectorAll('.q-btn')) {
              const rect = button.getBoundingClientRect()
              if (rect.right > c.right + 1 || rect.left < c.left - 1)
                failures.push(`${title}: button overflows its group`)
            }
          }
          return failures
        })
        expect(result, `${field.$formkit} at ${width}px`).toEqual([])
        await page.setViewportSize({ width: 1440, height: 900 })
      }
    })
  }
}
