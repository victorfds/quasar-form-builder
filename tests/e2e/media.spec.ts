import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { expect } from '@playwright/test'
import { test } from './fixtures'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ2kAAAAASUVORK5CYII=',
  'base64',
)
const photo = { name: 'photo.png', mimeType: 'image/png', buffer: png }
const text = { name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('durable contents') }
async function values(page: Page) {
  return JSON.parse((await page.getByTestId('media-values').textContent()) || '{}')
}
async function recordingAvailable(page: Page): Promise<boolean> {
  const available = await page.evaluate(() => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && isSecureContext)
  if (!available) {
    await page.getByRole('button', { name: 'Gravar', exact: true }).click()
    await expect(page.getByRole('alert').first()).toContainText('Gravação não disponível')
    await expect(page.getByLabel('Selecionar áudio')).toBeEnabled()
    expect((await values(page)).voice).toBeNull()
    test.info().annotations.push({ type: 'capture-unavailable', description: 'Verified selection fallback; MediaRecorder unavailable in this browser build' })
  }
  return available
}
async function open(page: Page, mode = 'offline') {
  const responseId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/media?response=${responseId}&mode=${mode}`)
  await expect(page.getByRole('heading', { name: 'Mídia', exact: true })).toBeVisible()
  await expect(page.getByLabel('Arquivos', { exact: true }).first()).toBeEnabled({ timeout: 30_000 })
  return { responseId, errors }
}

test('stages durable references and restores real image previews after reload', { tag: '@smoke' }, async ({ page }) => {
  const { errors } = await open(page)
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(photo)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  const original = (await values(page)).attachments[0]
  expect(original).toMatchObject({ version: 1, name: photo.name, mimeType: photo.mimeType, size: png.length })
  expect(original.documentId).toBeUndefined()
  await expect(page.locator('img[alt="photo.png"]')).toBeVisible()
  await expect
    .poll(() => page.locator('img[alt="photo.png"]').evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Rascunho salvo')
  await page.reload()
  await expect.poll(async () => (await values(page)).attachments?.[0]?.clientId).toBe(original.clientId)
  await expect(page.locator('img[alt="photo.png"]')).toBeVisible()
  await expect
    .poll(() => page.locator('img[alt="photo.png"]').evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0)
  expect((await values(page)).attachments[0]).toEqual(original)
  expect(errors).toEqual([])
})

test('uploads and reopens in another browser context using remote sources', async ({ page, browser }) => {
  const { responseId, errors } = await open(page)
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(photo)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  const saved = (await values(page)).attachments[0]
  expect(saved.documentId).toBeTruthy()
  const other = await browser.newContext()
  const reader = await other.newPage()
  await reader.goto(`/media?response=${responseId}&mode=readonly`)
  await expect(reader.locator('img[alt="photo.png"]')).toBeVisible()
  await expect
    .poll(() => reader.locator('img[alt="photo.png"]').evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0)
  await expect(reader.locator('img[alt="photo.png"]')).toHaveAttribute('src', /\/api\/media-demo\/documents\//)
  await expect(reader.getByRole('button', { name: 'Remover photo.png' })).toHaveCount(0)
  await other.close()
  expect(errors).toEqual([])
})

test('preserves conditional and nested media without visual path segments', { tag: '@smoke' }, async ({ page }) => {
  const { errors } = await open(page)
  await page.getByLabel('Arquivo condicional', { exact: true }).setInputFiles(text)
  await page.getByLabel('Arquivo no grupo', { exact: true }).setInputFiles(photo)
  await expect.poll(async () => (await values(page)).conditional?.clientId).toBeTruthy()
  await expect.poll(async () => (await values(page)).group?.nested?.clientId).toBeTruthy()
  const original = await values(page)
  await page.getByLabel('Controle', { exact: true }).fill('hidden')
  await expect(page.getByLabel('Arquivo condicional', { exact: true })).toHaveCount(0)
  expect((await values(page)).conditional).toEqual(original.conditional)
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Rascunho salvo')
  await page.getByLabel('Controle', { exact: true }).fill('show')
  await expect(page.getByRole('button', { name: 'Baixar note.txt' })).toBeVisible()
  expect(errors).toEqual([])
})

test('enforces readonly at root and inside structures', { tag: '@smoke' }, async ({ page }) => {
  await open(page)
  await page.getByRole('switch', { name: 'Somente leitura' }).click()
  await expect(page.getByLabel('Pergunta original', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Arquivo no grupo', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Arquivos', { exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Gravar', exact: true })).toBeDisabled()
})

test('keeps simultaneous viewers isolated', async ({ page }) => {
  const { errors } = await open(page, 'simultaneous')
  await page.getByLabel('Arquivos', { exact: true }).first().setInputFiles(text)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  expect(JSON.parse((await page.getByTestId('second-values').textContent()) || '{}').attachments || []).toEqual([])
  await expect(page.getByTestId('second-viewer').getByRole('button', { name: 'Baixar note.txt' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('uses a custom native URI transport', async ({ page }) => {
  const { errors } = await open(page, 'native')
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(text)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  expect((await values(page)).attachments[0].documentId).toBeTruthy()
  expect(errors).toEqual([])
})

test('rejects failed staging without putting a reference into the FormKit node', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, 'open', { configurable: true, value: () => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    } })
  })
  await open(page)
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(text)
  await expect(page.getByRole('alert').filter({ hasText: 'Storage quota exceeded' }).first()).toBeVisible()
  expect((await values(page)).attachments).toEqual([])
})

test('blocks new online capture when disconnected without deleting local files', async ({ page }) => {
  await open(page, 'online')
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(text)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  const original = (await values(page)).attachments[0]
  await page.getByRole('switch', { name: 'Conectado' }).click()
  await expect(page.getByLabel('Arquivos', { exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Gravar', exact: true })).toBeDisabled()
  expect((await values(page)).attachments[0]).toEqual(original)
  await page.getByRole('switch', { name: 'Conectado' }).click()
  await expect(page.getByLabel('Arquivos', { exact: true })).toBeEnabled()
})

test('records, pauses, flushes and confirms a real MediaRecorder result', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['microphone'])
  const { errors } = await open(page)
  if (!await recordingAvailable(page)) return
  await page.getByRole('button', { name: 'Gravar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pausar gravação' })).toBeVisible()
  await page.getByRole('button', { name: 'Pausar gravação' }).click()
  await expect(page.getByRole('button', { name: 'Continuar gravação' })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar gravação' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Parar gravação' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar', exact: true })).toBeVisible()
  expect((await values(page)).voice).toBeNull()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect.poll(async () => (await values(page)).voice?.size).toBeGreaterThan(0)
  expect((await values(page)).voice.mimeType).toContain('audio/')
  expect((await values(page)).voice.durationMs).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('explains microphone denial and allows selecting an existing audio', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.set(window, '__qfbMicrophoneDenied', true)
  })
  await open(page)
  if (await recordingAvailable(page)) {
    await page.getByRole('button', { name: 'Gravar', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Permissão' }).first()).toBeVisible()
  }
  await page
    .getByLabel('Selecionar áudio', { exact: true })
    .setInputFiles({ name: 'recording.webm', mimeType: 'audio/webm', buffer: Buffer.from('audio fixture') })
  await expect.poll(async () => (await values(page)).voice?.clientId).toBeTruthy()
})

test('preserves blocked recordings durably and requires explicit recovery confirmation', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['microphone'])
  await open(page, 'online')
  if (!await recordingAvailable(page)) return
  await page.getByRole('button', { name: 'Gravar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pausar gravação' })).toBeVisible()
  await page.waitForTimeout(300)
  await page.getByRole('switch', { name: 'Conectado' }).click()
  await expect(page.getByRole('button', { name: /^Confirmar .+\.(?:webm|ogg|m4a)$/ })).toBeVisible()
  expect((await values(page)).voice).toBeNull()
  await page.getByRole('switch', { name: 'Conectado' }).click()
  expect((await values(page)).voice).toBeNull()
  await page.getByRole('button', { name: /^Confirmar .+\.(?:webm|ogg|m4a)$/ }).click()
  await expect.poll(async () => (await values(page)).voice?.clientId).toBeTruthy()
})

test('cancels edits without remote deletion and deletes only after JSON confirmation', async ({ page, request }) => {
  const { responseId } = await open(page)
  await page.getByLabel('Arquivos', { exact: true }).setInputFiles(text)
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  await page.getByRole('button', { name: 'Remover note.txt' }).click()
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(0)
  expect(await (await request.get(`/api/media-demo/responses/${responseId}/documents`)).json()).toHaveLength(1)
  await page.getByRole('button', { name: 'Cancelar edição' }).click()
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(1)
  await page.getByRole('button', { name: 'Remover note.txt' }).click()
  await expect.poll(async () => (await values(page)).attachments?.length).toBe(0)
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  expect(await (await request.get(`/api/media-demo/responses/${responseId}/documents`)).json()).toEqual([])
})

test('reads an original schema without transferring answers into later renamed questions', async ({ page }) => {
  const { responseId } = await open(page)
  await page.getByLabel('Pergunta original', { exact: true }).fill('Resposta da versão original')
  await expect.poll(async () => (await values(page)).title).toBe('Resposta da versão original')
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByTestId('media-result')).toHaveText('Resposta salva')
  await page.goto(`/media?response=${responseId}&mode=historical`)
  await expect(page.getByLabel('Pergunta original', { exact: true })).toHaveValue('Resposta da versão original')
  await expect(page.getByLabel('Pergunta revisada', { exact: true })).toHaveValue('')
})
