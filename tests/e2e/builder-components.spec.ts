import type { Page } from '@playwright/test'
import { compile } from '@formkit/core'
import { empty } from '@formkit/utils'
import { expect, test } from '@playwright/test'
import { getAllConditionOperators } from '../../src/runtime/app/utils/conditionOperators'
import { evaluateLogicString, generateHumanReadableText, parseLogic, saveLogic } from '../../src/runtime/app/utils/formUtils'

const defaultOptions = [
  { label: 'Opção 1', value: 'option_1' },
  { label: 'Opção 2', value: 'option_2' },
]

const rows = [
  { label: 'Linha 1', value: 'row_1' },
  { label: 'Linha 2', value: 'row_2' },
]

const columnsConfig = [
  { label: 'Coluna 1', value: 'column_1' },
  { label: 'Coluna 2', value: 'column_2' },
]

const componentSchemas = [
  { group: 'fields', schema: { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number', validation: 'number' } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'email', label: 'Email', inputType: 'email', validation: 'email' } },
  { group: 'fields', schema: { '$formkit': 'q-input', 'name': 'phone', 'label': 'Telefone', 'inputType': 'tel', 'mask': '(##) #####-####', 'unmasked-value': true } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'password', label: 'Senha', inputType: 'password' } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'url', label: 'URL', inputType: 'url', validation: 'url' } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'textarea', label: 'Área de texto', inputType: 'textarea' } },
  { group: 'fields', schema: { $formkit: 'q-editor', name: 'editor', label: 'Editor' } },
  { group: 'fields', schema: { $formkit: 'q-signature', name: 'signature', label: 'Assinatura' } },
  { group: 'fields', schema: { $formkit: 'q-checkbox', name: 'checkbox', label: 'Caixa de seleção' } },
  { group: 'fields', schema: { $formkit: 'q-option-group', name: 'checkboxGroup', label: 'Opções', groupType: 'checkbox', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-option-group', name: 'checkboxBlocks', label: 'Blocos', groupType: 'checkbox', optionStyle: 'blocks', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-btn-toggle', name: 'checkboxTabs', label: 'Abas', multiple: true, options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-option-group', name: 'radio', label: 'Radio', groupType: 'radio', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-option-group', name: 'radioGroup', label: 'Opções', groupType: 'radio', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-option-group', name: 'radioBlocks', label: 'Blocos', groupType: 'radio', optionStyle: 'blocks', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-btn-toggle', name: 'radioTabs', label: 'Abas', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-matrix', name: 'matrix', label: 'Matriz', rows, columnsConfig } },
  { group: 'fields', schema: { $formkit: 'q-matrix', name: 'matrixTable', label: 'Tabela matriz', table: true, rows, columnsConfig } },
  { group: 'fields', schema: { $formkit: 'q-toggle', name: 'toggle', label: 'Toggle' } },
  { group: 'fields', schema: { $formkit: 'q-select', name: 'select', label: 'Selecione', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-select', name: 'multiselect', label: 'Selecione', multiple: true, useChips: true, options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-select', name: 'tags', label: 'Tags', multiple: true, useChips: true, useInput: true, newValueMode: 'add-unique', options: defaultOptions } },
  { group: 'fields', schema: { $formkit: 'q-date', name: 'date', label: 'Data' } },
  { group: 'fields', schema: { $formkit: 'q-datetime', name: 'datetime', label: 'Data e hora' } },
  { group: 'fields', schema: { $formkit: 'q-time', name: 'time', label: 'Hora' } },
  { group: 'fields', schema: { $formkit: 'q-date-multiple', name: 'multipleDates', label: 'Datas' } },
  { group: 'fields', schema: { $formkit: 'q-date-range', name: 'dateRange', label: 'Intervalo de datas' } },
  { group: 'fields', schema: { $formkit: 'q-slider', name: 'slider', label: 'Slider', min: 0, max: 100, step: 1 } },
  { group: 'fields', schema: { $formkit: 'q-range', name: 'rangeSlider', label: 'Intervalo', min: 0, max: 100, step: 1 } },
  { group: 'fields', schema: { $formkit: 'q-slider', name: 'verticalSlider', label: 'Slider vertical', vertical: true, min: 0, max: 100, step: 1 } },
  { group: 'fields', schema: { $formkit: 'q-file', name: 'file', label: 'Arquivo', clearable: true } },
  { group: 'fields', schema: { $formkit: 'q-file', name: 'multifile', label: 'Arquivos', multiple: true, useChips: true, clearable: true } },
  { group: 'fields', schema: { $formkit: 'q-file', name: 'image', label: 'Imagem', inputType: 'image', accept: 'image/*', clearable: true } },
  { group: 'fields', schema: { $formkit: 'q-file', name: 'images', label: 'Imagens', inputType: 'image', accept: 'image/*', multiple: true, useChips: true, clearable: true } },
  { group: 'fields', schema: { $formkit: 'q-file', name: 'gallery', label: 'Galeria', inputType: 'gallery', accept: 'image/*', multiple: true, useChips: true, gallery: true, clearable: true } },
  { group: 'fields', schema: { $formkit: 'q-input', name: 'hidden', label: 'Oculto', inputType: 'hidden' } },
  { group: 'statics', schema: { $formkit: 'q-btn', name: 'submit', buttonLabel: 'Finalizar', ignore: true, type: 'submit' } },
  { group: 'statics', schema: { $el: 'h1', name: 'h1', children: 'Lorem ipsum dolor', attrs: { class: 'no-margin' } } },
  { group: 'statics', schema: { $el: 'p', name: 'p', children: 'Lorem ipsum dolor', attrs: { class: 'no-margin' } } },
  { group: 'statics', schema: { $el: 'img', name: 'image', attrs: { src: 'https://placehold.co/640x360', alt: 'Imagem', class: 'full-width rounded-borders' } } },
  { group: 'statics', schema: { $el: 'a', name: 'link', children: 'Link', attrs: { href: '#', target: '_blank', rel: 'noopener' } } },
  { group: 'statics', schema: { $formkit: 'q-separator', name: 'separator', color: 'grey-5', spaced: true } },
  { group: 'structures', schema: { $formkit: 'q-tabs', name: 'tabs', tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }, { name: 'tab_2', label: 'Aba 2', children: [] }] } },
  { group: 'structures', schema: { $formkit: 'q-stepper', name: 'stepper', steps: [{ name: 'step_1', label: 'Passo 1', children: [] }] } },
  { group: 'structures', schema: { $formkit: 'q-container', name: 'container', label: 'Container', children: [] } },
  { group: 'structures', schema: { $formkit: 'q-grid', name: 'grid', rowsCount: 2, columnsCount: 2, cells: [] } },
  { group: 'structures', schema: { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] } },
  { group: 'structures', schema: { $formkit: 'q-grid', name: 'threeColumns', rowsCount: 1, columnsCount: 3, cells: [] } },
  { group: 'structures', schema: { $formkit: 'q-grid', name: 'fourColumns', rowsCount: 1, columnsCount: 4, cells: [] } },
  { group: 'structures', schema: { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig } },
  { group: 'structures', schema: { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] } },
  { group: 'structures', schema: { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] } },
] as const

async function loadBuilder(page: Page, fields: unknown[]) {
  await page.goto('/')
  await page.evaluate((schema: unknown[]) => {
    localStorage.clear()
    localStorage.setItem('form-fields', JSON.stringify(schema))
  }, fields)
  await page.reload()
  await page.waitForFunction(() => document.body.textContent?.includes('Construtor de Formulários'))
  await expect(page.locator('.my-form-wrapper')).toBeVisible({ timeout: 10000 })
  const firstField = fields[0] as { $formkit?: string, name?: string } | undefined
  if (firstField?.$formkit === 'q-stepper') {
    await expect(page.locator('.q-stepper')).toBeVisible()
  }
  else if (firstField?.name) {
    await expect(page.locator(`[data-field-name="${firstField.name}"]`)).toHaveCount(1)
  }
  await expect(page.locator('body')).not.toContainText('Unknown input type')
  await expect(page.locator('body')).not.toContainText('500')
}

async function readFields(page: Page) {
  const raw = await page.evaluate(() => localStorage.getItem('form-fields') || '[]')
  const normalized = raw.startsWith('__q_strn|') ? raw.slice('__q_strn|'.length) : raw
  return JSON.parse(normalized)
}

async function readStructureFieldOrder(page: Page, listKey: string) {
  return page.evaluate((key) => {
    const canvas = Array.from(document.querySelectorAll('[data-structure-list-key]'))
      .find(element => element.getAttribute('data-structure-list-key') === key)
    if (!canvas) return []

    return Array.from(canvas.children)
      .map((element) => {
        if (!(element instanceof HTMLElement)) return null
        if (!element.classList.contains('form-field')) return null
        return element.getAttribute('data-field-name')
      })
      .filter(Boolean)
  }, listKey)
}

async function dragExistingField(page: Page, sourceSelector: string, targetSelector: string) {
  await page.evaluate(({ sourceSelector, targetSelector }) => {
    const source = document.querySelector(sourceSelector)
    const target = document.querySelector(targetSelector)
    if (!source || !target) throw new Error(`drag target not found: ${sourceSelector} -> ${targetSelector}`)
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
  }, { sourceSelector, targetSelector })
}

async function dropCatalogField(page: Page, schema: unknown, targetSelector: string) {
  await page.evaluate(({ schema, targetSelector }) => {
    const target = document.querySelector(targetSelector)
    if (!target) throw new Error(`catalog drop target not found: ${targetSelector}`)
    const data = new DataTransfer()
    data.setData('text', JSON.stringify(schema))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
  }, { schema, targetSelector })
}

async function dropCatalogItem(page: Page, catalogName: string, targetSelector: string) {
  await dragCatalogItemFromDrawer(page, catalogName, targetSelector)
}

async function dropCatalogItemOnReachableSlot(page: Page, catalogName: string, targetSelector: string) {
  const source = page.locator(`[data-catalog-name="${catalogName}"]`).first()
  const target = page.locator(targetSelector).first()
  await expect(source).toBeVisible()
  await expect(target).toBeVisible()
  await target.scrollIntoViewIfNeeded()
  await expect(source).toBeVisible()
  await expect(target).toBeVisible()

  await page.evaluate(() => document.body.classList.add('qfb-builder-dragging'))
  await expect.poll(async () => {
    return target.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hitTarget = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      return element === hitTarget || element.contains(hitTarget)
    })
  }).toBe(true)
  await page.evaluate(() => document.body.classList.remove('qfb-builder-dragging'))

  await dragCatalogItemFromDrawer(page, catalogName, targetSelector)
}

async function dragCatalogItemFromDrawer(page: Page, catalogName: string, targetSelector: string, options: { expectHighlight?: boolean } = {}) {
  const source = page.locator(`[data-catalog-name="${catalogName}"]`).first()
  const target = page.locator(targetSelector).first()
  const expectHighlight = options.expectHighlight ?? true

  await source.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()
  await expect(source).toBeVisible()
  await expect(target).toBeVisible()
  await expect(source).toBeVisible()
  const sourceTitle = await source.locator('.tool-title').textContent()
  const sourceDescription = await source.locator('.tool-description').textContent()

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error(`catalog item drag target not visible: ${catalogName} -> ${targetSelector}`)

  const startX = sourceBox.x + sourceBox.width / 2
  const startY = sourceBox.y + sourceBox.height / 2
  const viewport = page.viewportSize() || { width: 1280, height: 720 }
  const targetLeft = Math.max(targetBox.x, 1)
  const targetRight = Math.min(targetBox.x + targetBox.width, viewport.width - 1)
  const targetTop = Math.max(targetBox.y, 1)
  const targetBottom = Math.min(targetBox.y + targetBox.height, viewport.height - 1)
  const targetX = (targetLeft + targetRight) / 2
  const targetY = (targetTop + targetBottom) / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 10, startY + 8, { steps: 4 })
  await expect(page.locator('body')).toHaveClass(/qfb-builder-dragging/)
  const ghost = page.locator('.tool-item-drag-ghost')
  await expect(ghost).toBeVisible()
  await expect(ghost).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(ghost).toHaveCSS('border-top-style', 'solid')
  await expect.poll(async () => ghost.evaluate((element) => {
    const borderColor = window.getComputedStyle(element).borderTopColor
    const alpha = borderColor.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([.\d]+)\s*\)/)?.[1]
    return alpha ? Number(alpha) : 1
  })).toBeLessThanOrEqual(0.1)
  await expect(ghost).toContainText(sourceTitle || '')
  await expect(ghost).toContainText(sourceDescription || '')
  await expect(ghost.locator('.q-avatar')).toBeVisible()
  await page.mouse.move(targetX, targetY, { steps: 16 })
  if (expectHighlight) {
    await expect(target).toHaveClass(/overlay-drop-here--highlighted/)
  }
  await page.mouse.up()
  await expect(page.locator('body')).not.toHaveClass(/qfb-builder-dragging/)
}

async function switchToPreviewMode(page: Page) {
  await page.locator('.q-page-sticky').first().locator('.q-tab').nth(1).click()
  await expect(page.locator('.preview-form-container .preview-form-remove-action')).toHaveCount(0)
}

async function openConditionsDialogForField(page: Page, fieldName: string) {
  await page.locator(`[data-field-name="${fieldName}"] .overlay-preview-element`).click()
  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText(fieldName)
  await drawer.getByRole('button', { name: 'Editar condições' }).click()
  await expect(conditionsDialog(page)).toBeVisible()
}

function conditionsDialog(page: Page) {
  return page.locator('.q-dialog .q-card').filter({ hasText: 'Condições' }).last()
}

async function getVisibleMenuItemTexts(page: Page) {
  const menu = page.getByRole('listbox').last()
  await expect(menu).toBeVisible()
  return menu.getByRole('option').evaluateAll(elements =>
    elements
      .map(element => element.textContent?.replace(/\s+/g, ' ').trim())
      .filter((text): text is string => Boolean(text)),
  )
}

async function selectConditionTargetField(page: Page, fieldName: string) {
  await conditionsDialog(page).getByLabel('Campo').first().click()
  await page.getByRole('option', { name: fieldName, exact: true }).click()
  await conditionsDialog(page).getByRole('heading', { name: 'Condições' }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
}

async function expectConditionOperators(page: Page, fieldName: string, expected: string[], unexpected: string[] = []) {
  await selectConditionTargetField(page, fieldName)
  await conditionsDialog(page).getByLabel('Operador').first().click()
  const labels = await getVisibleMenuItemTexts(page)

  expect(labels).toEqual(expected)
  for (const label of unexpected) {
    expect(labels).not.toContain(label)
  }

  await page.keyboard.press('Escape')
}

function evaluateFormKitExpression(expression: string, source: Record<string, unknown>): boolean {
  const condition = compile(expression).provide((tokens: string[]) => {
    return Object.fromEntries(tokens.map(token => [token, () => source[token]]))
  })
  return Boolean(condition())
}

async function selectConditionOperator(page: Page, label: string, index = 0) {
  await conditionsDialog(page).getByLabel('Operador').nth(index).click()
  await page.getByRole('option', { name: label, exact: true }).click()
  await conditionsDialog(page).getByRole('heading', { name: 'Condições' }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
}

async function expectSchemaMounted(page: Page, schema: typeof componentSchemas[number]['schema']) {
  if ('$formkit' in schema && schema.$formkit === 'q-stepper') {
    await expect(page.locator('.q-stepper')).toBeVisible()
    return
  }

  if ('$formkit' in schema && schema.inputType === 'hidden') {
    await expect(page.locator(`[data-field-name="${schema.name}"]`)).toHaveCount(1)
    return
  }

  await expect(page.locator(`[data-field-name="${schema.name}"]`)).toBeVisible()
}

test('theme preference is stored in a cookie and restored before the builder hydrates', async ({ page, context }) => {
  await context.addCookies([{ name: 'theme', value: 'dark', url: 'http://127.0.0.1:3010', sameSite: 'Lax' }])

  await page.goto('/')
  await page.waitForFunction(() => document.body.textContent?.includes('Construtor de Formulários'))

  await expect(page.locator('header')).toHaveClass(/bg-grey-10/)
  await page.locator('.q-toggle').click()
  await expect.poll(async () => {
    const cookies = await context.cookies()
    return cookies.find(cookie => cookie.name === 'theme')?.value
  }).toBe('light')

  await page.reload()
  await expect(page.locator('header')).toHaveClass(/bg-white/)
})

test('builder shell supports title props and extension slots', async ({ page }) => {
  await page.goto('/custom-shell')

  await expect(page.locator('header')).toContainText('Editor de Contratos')
  await expect(page.getByTestId('back-button')).toBeVisible()
  await expect(page.getByTestId('save-button')).toBeVisible()
  await expect(page.locator('header').locator('.q-toggle')).toHaveCount(0)
  await expect(page.getByTestId('right-drawer-extra')).toHaveText('Campos no formulário: 0')
  await expect(page.locator('.my-form-wrapper')).toBeVisible({ timeout: 10000 })

  await page.getByTestId('save-button').click()
  await expect(page.getByTestId('save-status')).toHaveText('Salvo: 0')
})

test('builder shell can hide the header and default floating controls', async ({ page }) => {
  await page.goto('/minimal-shell')

  await expect(page.locator('.my-form-wrapper')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('header')).toHaveCount(0)
  await expect(page.locator('.q-page-sticky')).toHaveCount(0)
})

test('public drawer and builder components compose in a custom layout', async ({ page }) => {
  await page.goto('/custom-layout')

  await expect(page.locator('header')).toContainText('Layout próprio')
  await expect(page.getByTestId('left-drawer-extra')).toBeVisible()
  await expect(page.getByTestId('properties-extra')).toContainText('Meu Formulário')
  await expect(page.locator('.my-form-wrapper')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('preview-mode')).toHaveText('editing')

  await page.getByTestId('custom-preview').click()
  await expect(page.getByTestId('preview-mode')).toHaveText('previewing')
})

test('form viewer emits value lifecycle and validation events for cache integrations', async ({ page }) => {
  await page.goto('/viewer-events')

  await expect(page.getByTestId('ready-count')).toHaveText('1')
  await expect(page.getByTestId('ready-fields-count')).toHaveText('2')

  await page.getByRole('button', { name: 'Finalizar' }).click()
  await expect(page.getByTestId('invalid-count')).toHaveText('1')
  await expect(page.getByTestId('submit-count')).toHaveText('0')

  const updateCountBefore = Number(await page.getByTestId('update-count').textContent())
  const fieldChangeCountBefore = Number(await page.getByTestId('field-change-count').textContent())

  await page.getByLabel('Nome').fill('Maria')

  await expect.poll(async () => Number(await page.getByTestId('update-count').textContent())).toBeGreaterThan(updateCountBefore)
  await expect.poll(async () => Number(await page.getByTestId('field-change-count').textContent())).toBeGreaterThan(fieldChangeCountBefore)
  await expect(page.getByTestId('latest-changed-fields')).toContainText('name')
  await expect(page.getByTestId('latest-field-change')).toHaveText('name:Maria')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-viewer-draft') || '{}'
    return JSON.parse(raw).name
  })).toBe('Maria')

  await page.getByRole('button', { name: 'Finalizar' }).click()
  await expect(page.getByTestId('submit-count')).toHaveText('1')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-viewer-submit') || '{}'
    return JSON.parse(raw).name
  })).toBe('Maria')
})

test('form viewer phone mask options emit the unmasked Quasar model value', async ({ page }) => {
  await page.goto('/phone-mask-events')
  await page.waitForFunction(() => Boolean(document.querySelector('input[aria-label="Telefone"]')?.id))

  const input = page.locator('input[aria-label="Telefone"]')
  await expect(input).toHaveValue('(__) _____-____')

  await input.fill('67')
  await expect(input).toHaveValue('(__) _____-__67')
  await expect(page.getByTestId('phone-model-value')).toHaveText('67')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-phone-mask-draft') || '{}'
    return JSON.parse(raw).phone
  })).toBe('67')

  await input.fill('67999991234')
  await expect(input).toHaveValue('(67) 99999-1234')
  await expect(page.getByTestId('phone-model-value')).toHaveText('67999991234')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-phone-mask-draft') || '{}'
    return JSON.parse(raw).phone
  })).toBe('67999991234')

  await page.getByTestId('toggle-unmasked-value').click()
  await expect(page.getByTestId('phone-unmasked-state')).toHaveText('false')
  await input.fill('67999991234')
  await expect(input).toHaveValue('(67) 99999-1234')
  await expect(page.getByTestId('phone-model-value')).toHaveText('(67) 99999-1234')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-phone-mask-draft') || '{}'
    return JSON.parse(raw).phone
  })).toBe('(67) 99999-1234')

  await page.getByTestId('toggle-unmasked-value').click()
  await expect(page.getByTestId('phone-unmasked-state')).toHaveText('true')
  await input.fill('67999991234')
  await expect(input).toHaveValue('(67) 99999-1234')
  await expect(page.getByTestId('phone-model-value')).toHaveText('67999991234')
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem('qfb-phone-mask-draft') || '{}'
    return JSON.parse(raw).phone
  })).toBe('67999991234')
})

test.describe('builder component parity smoke', () => {
  for (const item of componentSchemas) {
    test(`${item.group}: mounts ${item.schema.name}`, async ({ page }) => {
      await loadBuilder(page, [item.schema])
      await expectSchemaMounted(page, item.schema)
    })
  }
})

test('elements drawer search filters catalog items', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => document.body.textContent?.includes('Construtor de Formulários'))

  await expect.poll(async () => {
    return page.locator('.elements-drawer-scroll').evaluate(element => element.scrollWidth - element.clientWidth)
  }).toBeLessThanOrEqual(1)
  await expect(page.locator('[data-catalog-name="text"] .tool-description').first()).toHaveCSS('white-space', 'normal')
  await expect(page.locator('[data-catalog-name="text"] .tool-description').first()).toHaveCSS('overflow-wrap', 'anywhere')

  await page.getByPlaceholder('Buscar elementos').fill('divid')

  await expect(page.getByText('Separador')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Campos' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Estáticos' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Estruturas' })).toHaveCount(0)
  await expect(page.getByText('Cabeçalho H1')).toHaveCount(0)

  await page.getByPlaceholder('Buscar elementos').fill('sem resultado improvavel')
  await expect(page.getByText('Nenhum elemento encontrado').first()).toBeVisible()
})

test('tree drawer shows the form root and syncs selection with the canvas', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [
        { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
        { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' },
      ],
    },
  ])

  await page.getByRole('tab', { name: 'Árvore' }).click()
  const treePanel = page.locator('.tree-drawer-panel')
  await expect(treePanel).toContainText('Meu Formulário')
  await expect(treePanel).toContainText('container')
  await expect(treePanel).toContainText('Container')
  await expect(treePanel).toContainText('text')
  await expect(treePanel).toContainText('Texto')
  await expect(treePanel).not.toContainText('q-input')
  await expect(treePanel.locator('.tree-node__icon').first()).toBeVisible()
  await expect(treePanel.locator('.tree-node__icon').first()).toHaveClass(/rounded-borders/)
  await expect(treePanel.locator('.tree-node__label').first()).toHaveCSS('font-weight', '400')

  const textTreeItem = treePanel.getByRole('treeitem', { name: 'text Texto', exact: true })
  await textTreeItem.click()
  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveClass(/__active/)
  const selectedTreeNode = treePanel.locator('.q-tree__node--selected').first()
  await expect(selectedTreeNode).toContainText('text')
  const selectedTreeNodeHeader = treePanel.locator('.q-tree__node-header.q-tree__node--selected, .q-tree__node--selected > .q-tree__node-header').first()
  await expect(selectedTreeNodeHeader.locator('.q-tree__node-header-content')).toHaveCSS('color', 'rgb(41, 128, 185)')
  await expect(selectedTreeNode.locator('.tree-node__icon').first()).toHaveCSS('background-color', 'rgb(41, 128, 185)')
  await expect(selectedTreeNode.locator('.tree-node__icon').first()).toHaveCSS('color', 'rgb(255, 255, 255)')
  await textTreeItem.click()
  await expect(treePanel.locator('.q-tree__node--selected')).toContainText('text')

  await page.locator('[data-field-name="number"] .overlay-preview-element').click()
  await expect(treePanel.locator('.q-tree__node--selected')).toContainText('number')
})

test('tree drawer represents an empty form and root-only steps without q wrappers', async ({ page }) => {
  await loadBuilder(page, [])

  await page.getByRole('tab', { name: 'Árvore' }).click()
  const emptyTreePanel = page.locator('.tree-drawer-panel')
  await expect(emptyTreePanel).toContainText('Meu Formulário')
  await expect(emptyTreePanel).not.toContainText('Nenhum campo no formulário')

  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [
        { name: 'details', label: 'Detalhes', children: [{ $formkit: 'q-input', name: 'title', label: 'Título', inputType: 'text' }] },
        { name: 'location', label: 'Localização', children: [] },
      ],
    },
  ])

  await page.getByRole('tab', { name: 'Árvore' }).click()
  const stepTreePanel = page.locator('.tree-drawer-panel')
  await expect(stepTreePanel).toContainText('Meu Formulário')
  await expect(stepTreePanel).toContainText('Detalhes')
  await expect(stepTreePanel).toContainText('Localização')
  await expect(stepTreePanel).toContainText('title')
  await expect(stepTreePanel).not.toContainText('q-stepper')
  await expect(stepTreePanel).not.toContainText('stepper')
})

test('hidden input exposes data and attribute settings', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'hidden', label: 'Oculto', inputType: 'hidden' },
  ])

  const hiddenMarker = page.locator('[data-field-name="hidden"] .hidden-input-marker')
  await expect(hiddenMarker).toHaveText('(oculto)')
  await expect(hiddenMarker).toHaveCSS('border-top-style', 'none')
  await expect(hiddenMarker).toHaveCSS('font-style', 'italic')
  await expect(page.locator('[data-field-name="hidden"] .overlay-preview-element')).not.toHaveClass(/__active/)

  await page.locator('[data-field-name="hidden"] .overlay-preview-element').click()
  await expect(page.locator('[data-field-name="hidden"] .overlay-preview-element')).toHaveClass(/__active/)
  await expect(page.locator('[data-field-name="hidden"] .preview-form-name')).toHaveText('hidden')
  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText('Dados')
  await expect(drawer).toContainText('Valor padrão')
  await expect(drawer).toContainText('ID')
  await expect(drawer).not.toContainText('Decorações')

  await drawer.locator('.q-expansion-item').filter({ hasText: 'Dados' }).getByRole('textbox').fill('token')
  await drawer.locator('.q-expansion-item').filter({ hasText: 'Atributos' }).getByRole('textbox').fill('hidden-token')

  await expect.poll(async () => {
    const fields = await readFields(page)
    return {
      defaultValue: fields[0].default,
      id: fields[0].attrs?.id,
    }
  }).toEqual({ defaultValue: 'token', id: 'hidden-token' })

  await page.locator('.q-tab').filter({ hasText: 'visibility' }).click()
  await expect(page.locator('[data-field-name="hidden"] .hidden-input-marker')).toHaveCount(0)
  await expect(page.locator('[data-field-name="hidden"]')).toHaveCSS('display', 'none')
  await expect(page.locator('input[type="hidden"][id="hidden-token"]')).toHaveCount(1)
})

test('separator supports vertical configuration', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-separator', name: 'separator', vertical: true, color: 'primary', spaced: true },
  ])

  await expect(page.locator('[data-field-name="separator"] .q-separator--vertical')).toHaveCount(1)

  await page.locator('[data-field-name="separator"] .overlay-preview-element').click()
  await expect(page.getByText('Opções do separador')).toBeVisible()
  await expect(page.getByText('Vertical', { exact: true })).toBeVisible()
})

test('matrix settings keep row and column values unique', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-matrix', name: 'matrix', label: 'Matriz', rows, columnsConfig },
  ])

  await page.locator('[data-field-name="matrix"] .overlay-preview-element').click()
  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText('Tipo padrão')
  await expect(drawer.locator('.condition-icon-button').first()).toContainText('[ ]')

  const configItems = drawer.locator('.matrix-config-item')
  await expect(configItems).toHaveCount(4)

  await configItems.nth(1).locator('input').nth(1).fill('column_1')
  await configItems.nth(1).locator('input').nth(1).blur()
  await configItems.nth(3).locator('input').nth(1).fill('row_1')
  await configItems.nth(3).locator('input').nth(1).blur()

  const fields = await readFields(page)
  expect(fields[0].rows.map((row: { value: string }) => row.value)).toEqual(['row_1', 'row_2'])
  expect(fields[0].columnsConfig.map((column: { value: string }) => column.value)).toEqual(['column_1', 'column_2'])
})

test('slider honors min max step and vertical orientation', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-slider', name: 'verticalSlider', label: 'Slider vertical', vertical: true, min: 10, max: 20, step: 5 },
  ])

  const slider = page.getByRole('slider').first()
  await expect(slider).toHaveAttribute('aria-valuemin', '10')
  await expect(slider).toHaveAttribute('aria-valuemax', '20')
  await expect(page.locator('.q-slider--v')).toHaveCount(1)
})

test('dragging a tab child over another tab moves it into that tab and clears selection', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        { name: 'tab_1', label: 'Aba 1', children: [{ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }] },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('.structure-tabs .q-tab').filter({ hasText: 'Aba 2' })).toHaveCount(1)

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const tab = Array.from(document.querySelectorAll('.structure-tabs .q-tab')).find(el => el.textContent?.includes('Aba 2'))
    if (!source || !tab) throw new Error('tab drag target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    tab.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    tab.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
  })

  await expect(page.locator('[data-field-name="text"]')).toHaveCount(1)
  const fields = await readFields(page)
  expect(fields[0].tabs[0].children).toHaveLength(0)
  expect(fields[0].tabs[1].children[0].name).toBe('text')
  await expect(page.locator('.overlay-preview-element.__active')).toHaveCount(0)
})

test('tab headers can be selected and configured individually', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        { name: 'tab_1', label: 'Aba 1', children: [] },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  const tabTwo = page.locator('.structure-tabs .q-tab').filter({ hasText: 'Aba 2' })
  await tabTwo.click()

  await expect(page.locator('[data-drawer="right"]')).toContainText('Aba 2')
  await expect(page.locator('[data-drawer="right"]')).toContainText('Condições')
  await expect(tabTwo).toHaveClass(/structure-tabs__tab--selected/)
  await expect(tabTwo.locator('.overlay-preview-element')).toHaveClass(/__active/)

  await tabTwo.click()
  await expect(page.locator('[data-drawer="right"]')).toContainText('Aba 2')
  await expect(tabTwo).toHaveClass(/structure-tabs__tab--selected/)
  await expect(tabTwo.locator('.overlay-preview-element')).toHaveClass(/__active/)

  const selectedTabOverlayMetrics = await tabTwo.evaluate((tab) => {
    const overlay = tab.querySelector('.overlay-preview-element')
    if (!overlay) throw new Error('selected tab overlay not found')
    const tabRect = tab.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()

    return {
      left: Math.abs(overlayRect.left - tabRect.left),
      right: Math.abs(overlayRect.right - tabRect.right),
      top: Math.abs(overlayRect.top - tabRect.top),
      bottom: Math.abs(overlayRect.bottom - tabRect.bottom),
    }
  })

  expect(selectedTabOverlayMetrics.left).toBeLessThan(1)
  expect(selectedTabOverlayMetrics.right).toBeLessThan(1)
  expect(selectedTabOverlayMetrics.top).toBeLessThan(1)
  expect(selectedTabOverlayMetrics.bottom).toBeLessThan(1)

  await page.locator('[data-drawer="right"] input').first().fill('Dados')
  const fields = await readFields(page)
  expect(fields[0].tabs[1].label).toBe('Dados')
})

test('step headers can be selected and configured individually with the field overlay', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [
        { name: 'step_1', label: 'Passo 1', children: [] },
        { name: 'step_2', label: 'Passo 2', children: [] },
      ],
    },
  ])

  const stepTwo = page.locator('.q-stepper__tab').filter({ hasText: 'Passo 2' })
  await stepTwo.click()

  await expect(page.locator('[data-drawer="right"]')).toContainText('Passo 2')
  await expect(page.locator('[data-drawer="right"]')).toContainText('Condições')
  await expect(page.locator('.stepper-header-overlay-wrapper .overlay-preview-element')).toHaveClass(/__active/)

  await stepTwo.click()
  await expect(page.locator('[data-drawer="right"]')).toContainText('Passo 2')
  await expect(page.locator('.stepper-header-overlay-wrapper .overlay-preview-element')).toHaveClass(/__active/)
})

test('step conditions react to fields nested inside list structures', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [
        {
          name: 'step_1',
          label: 'Passo 1',
          children: [
            {
              $formkit: 'q-list-structure',
              name: 'list',
              label: 'Lista',
              nested: false,
              children: [
                { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' },
                { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
              ],
            },
          ],
        },
        {
          name: 'step_2',
          label: 'Passo 2',
          if: '$number == 4',
          children: [{ $el: 'p', name: 'result', children: 'Etapa visível' }],
        },
      ],
    },
  ])

  await switchToPreviewMode(page)
  await expect(page.locator('.q-stepper__tab').filter({ hasText: 'Passo 2' })).toHaveCount(0)

  await page.getByLabel('Número').fill('4')

  await expect(page.locator('.q-stepper__tab').filter({ hasText: 'Passo 2' })).toBeVisible()
})

test('condition operator list follows the selected target field semantics', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'subject', label: 'Campo com condição', inputType: 'text' },
    { $formkit: 'q-input', name: 'title', label: 'Título', inputType: 'text' },
    { $formkit: 'q-input', name: 'amount', label: 'Valor', inputType: 'number' },
    { $formkit: 'q-signature', name: 'signature', label: 'Assinatura' },
    { $formkit: 'q-checkbox', name: 'accepted', label: 'Aceite' },
    { $formkit: 'q-select', name: 'choices', label: 'Escolhas', multiple: true, options: defaultOptions },
    { $formkit: 'q-date-range', name: 'period', label: 'Período' },
    { $formkit: 'q-time', name: 'hour', label: 'Hora' },
    { $formkit: 'q-btn', name: 'submit', buttonLabel: 'Enviar', ignore: true, type: 'submit' },
    { $el: 'p', name: 'paragraph', children: 'Texto estático' },
    { $formkit: 'q-grid', name: 'grid', rowsCount: 1, columnsCount: 1, cells: [] },
  ])

  await openConditionsDialogForField(page, 'subject')

  await conditionsDialog(page).getByLabel('Campo').first().click()
  const targetLabels = await getVisibleMenuItemTexts(page)
  expect(targetLabels).toContain('signature')
  expect(targetLabels).not.toContain('subject')
  expect(targetLabels).not.toContain('submit')
  expect(targetLabels).not.toContain('paragraph')
  expect(targetLabels).not.toContain('grid')
  await page.keyboard.press('Escape')

  await expectConditionOperators(page, 'signature', ['está vazio', 'não está vazio'], ['contém', 'é igual a'])
  await expectConditionOperators(page, 'title', ['está vazio', 'não está vazio', 'é igual a', 'é diferente de', 'contém', 'começa com', 'termina com'])
  await expectConditionOperators(page, 'amount', ['está vazio', 'não está vazio', 'é igual a', 'é diferente de', '> do que', '>= do que', '< do que', '<= do que'], ['contém'])
  await expectConditionOperators(page, 'accepted', ['é verdadeiro', 'é falso'], ['é igual a'])
  await expectConditionOperators(page, 'choices', ['está vazio', 'não está vazio', 'contém'], ['é igual a'])
  await expectConditionOperators(page, 'period', ['está vazio', 'não está vazio'], ['é hoje'])
  await expectConditionOperators(page, 'hour', ['está vazio', 'não está vazio', 'é igual a', 'é diferente de'], ['é hoje'])
})

test('saveLogic serializes pending equality tag values', () => {
  const saved: Record<string, unknown> = {}

  saveLogic(
    {
      logicFields: [
        {
          name: 'title',
          operator: 'equals',
          value: 'VIP',
          values: [],
          or: [
            {
              name: 'status',
              operator: 'notEquals',
              value: 'blocked',
              values: [],
              or: [],
            },
          ],
        },
      ],
    },
    'if',
    (property, value) => {
      saved[property] = value
    },
  )

  expect(saved.if).toBe('($title == "VIP" || $status != "blocked")')
})

test('saveLogic groups or expressions before and expressions', () => {
  const saved: Record<string, unknown> = {}

  saveLogic(
    {
      logicFields: [
        {
          name: 'text',
          operator: 'notEquals',
          value: '',
          values: ['12'],
          or: [
            {
              name: 'text',
              operator: 'notEquals',
              value: '',
              values: ['14'],
              or: [],
            },
          ],
        },
        {
          name: 'signature',
          operator: 'notEmpty',
          value: '',
          values: [],
          or: [],
        },
      ],
    },
    'if',
    (property, value) => {
      saved[property] = value
    },
  )

  const expression = saved.if as string
  const parsed = parseLogic(expression)

  expect(expression).toBe('($text != 12 || $text != 14) && !$empty($signature)')
  expect(generateHumanReadableText(parsed, getAllConditionOperators())).toBe('(text é diferente de [12] ou text é diferente de [14]) e signature não está vazio')
  expect(parsed).toMatchObject([
    {
      name: 'text',
      operator: 'notEquals',
      values: ['12'],
      or: [
        {
          name: 'text',
          operator: 'notEquals',
          values: ['14'],
        },
      ],
    },
    {
      name: 'signature',
      operator: 'notEmpty',
      or: [],
    },
  ])

  expect(parseLogic('$text != 12 || $text != 14 && !$empty($signature)')).toMatchObject(parsed)
  expect(evaluateLogicString(expression, { text: 15, signature: '' })).toBe(false)
  expect(evaluateLogicString(expression, { text: 15, signature: 'signed' })).toBe(true)
  expect(evaluateFormKitExpression(expression, { text: 15, signature: '', empty })).toBe(false)
  expect(evaluateFormKitExpression(expression, { text: 15, signature: 'signed', empty })).toBe(true)
})

test('saving equality conditions commits the focused pending tag input', async ({ page }) => {
  const cases = [
    { operatorLabel: 'é igual a', value: 'VIP', expected: '$title == "VIP"' },
    { operatorLabel: 'é diferente de', value: 'blocked', expected: '$title != "blocked"' },
  ]

  for (const scenario of cases) {
    await loadBuilder(page, [
      { $formkit: 'q-input', name: 'subject', label: 'Campo com condição', inputType: 'text' },
      { $formkit: 'q-input', name: 'title', label: 'Título', inputType: 'text' },
    ])

    await openConditionsDialogForField(page, 'subject')
    await selectConditionTargetField(page, 'title')
    await selectConditionOperator(page, scenario.operatorLabel)

    const dialog = conditionsDialog(page)
    const valueInput = dialog.getByLabel('valor')
    await valueInput.fill(scenario.value)
    await expect(valueInput).toBeFocused()
    await dialog.getByRole('button', { name: 'Salvar' }).evaluate((button: HTMLElement) => button.click())

    await expect.poll(async () => {
      const fields = await readFields(page)
      return fields.find((field: { name: string }) => field.name === 'subject')?.if
    }).toBe(scenario.expected)
  }
})

test('text prefix and suffix condition operators evaluate in preview mode', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'title', label: 'Título', inputType: 'text' },
    { $formkit: 'q-input', name: 'prefixTarget', label: 'Prefixo', inputType: 'text', if: '$startsWith($title,"VIP")' },
    { $formkit: 'q-input', name: 'suffixTarget', label: 'Sufixo', inputType: 'text', if: '$endsWith($title,".com")' },
  ])

  await switchToPreviewMode(page)
  await expect(page.locator('[data-field-name="prefixTarget"]')).toBeHidden()
  await expect(page.locator('[data-field-name="suffixTarget"]')).toBeHidden()

  await page.getByLabel('Título').fill('VIP cliente')
  await expect(page.locator('[data-field-name="prefixTarget"]')).toBeVisible()
  await expect(page.locator('[data-field-name="suffixTarget"]')).toBeHidden()

  await page.getByLabel('Título').fill('portal.com')
  await expect(page.locator('[data-field-name="prefixTarget"]')).toBeHidden()
  await expect(page.locator('[data-field-name="suffixTarget"]')).toBeVisible()
})

test('stepper navigation buttons move between visible steps in preview mode', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [
        {
          name: 'step_1',
          label: 'Passo 1',
          children: [{ $el: 'p', name: 'step_1_text', children: 'Conteúdo do primeiro passo' }],
        },
        {
          name: 'step_2',
          label: 'Passo 2',
          children: [{ $el: 'p', name: 'step_2_text', children: 'Conteúdo do segundo passo' }],
        },
      ],
    },
  ])

  await switchToPreviewMode(page)

  await expect(page.getByText('Conteúdo do primeiro passo')).toBeVisible()
  await page.getByRole('button', { name: 'Avançar' }).click()
  await expect(page.getByText('Conteúdo do segundo passo')).toBeVisible()
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByText('Conteúdo do primeiro passo')).toBeVisible()
})

test('hidden input preview does not pass undefined q-input props to native input', async ({ page }) => {
  const invalidPropMessages: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (text.includes('Failed setting prop "prefix"') || text.includes('Cannot set property prefix')) {
      invalidPropMessages.push(text)
    }
  })

  await loadBuilder(page, [
    {
      $formkit: 'q-input',
      name: 'hidden',
      label: 'Oculto',
      inputType: 'hidden',
      prefix: undefined,
      suffix: undefined,
      attrs: { 'id': 'hidden-field', 'data-print-key': 'hidden', 'prefix': undefined },
    },
  ])

  await switchToPreviewMode(page)
  await page.waitForTimeout(250)

  await expect(page.locator('body')).not.toContainText('(oculto)')
  expect(invalidPropMessages).toEqual([])
})

test('quasar input labels are not duplicated by the FormKit wrapper in preview mode', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'number', label: 'Número 33', inputType: 'number' },
  ])

  const field = page.locator('[data-field-name="number"]')
  await expect(field.locator('.formkit-label')).toBeHidden()
  await expect(field.locator('.q-field__label')).toHaveText('Número 33')

  await switchToPreviewMode(page)

  await expect(field.locator('.formkit-label')).toBeHidden()
  await expect(field.locator('.q-field__label')).toHaveText('Número 33')
})

test('tabs structure does not show whole-structure active overlay', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        { name: 'tab_1', label: 'Aba 1', children: [] },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  await page.locator('[data-field-name="tabs"]').hover()
  await expect(page.locator('[data-field-name="tabs"] .preview-form-name')).toHaveCount(0)
  await expect(page.locator('[data-field-name="tabs"] .overlay-preview-element.__active')).toHaveCount(0)
  await expect(page.locator('[data-field-name="tabs"] .overlay-preview-element.__latest')).toHaveCount(0)
})

test('container accepts existing fields dropped into its empty canvas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('[data-field-name="container"] .overlay-drop-here')).toBeVisible()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="container"] .overlay-drop-here')
    if (!source || !target) throw new Error('container drag target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
  })

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].children[0].name).toBe('text')
})

test('tabs and stepper dropped in root migrate fields into the new root structure', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const tabsSchema = { $formkit: 'q-tabs', name: 'tabs', tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }] }

  await dropCatalogField(page, tabsSchema, '[data-field-name="first"] .preview-element-area-top')
  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-tabs')
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['first', 'second'])
})

test('stepper dropped in root migrates fields into the first step', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const stepperSchema = { $formkit: 'q-stepper', name: 'stepper', steps: [{ name: 'step_1', label: 'Passo 1', children: [] }] }

  await dropCatalogField(page, stepperSchema, '[data-field-name="first"] .preview-element-area-top')
  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-stepper')
  expect(fields[0].steps[0].children.map((field: { name: string }) => field.name)).toEqual(['first', 'second'])
})

test('replacing tabs with stepper asks for confirmation and migrates tab fields', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        { name: 'tab_1', label: 'Aba 1', children: [{ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }] },
      ],
    },
  ])

  await dropCatalogField(page, {
    $formkit: 'q-stepper',
    name: 'stepper',
    steps: [{ name: 'step_1', label: 'Passo 1', children: [] }],
  }, '[data-field-name="tabs"] > .preview-element-area-top')

  await expect(page.getByText('Substituir Abas por Passos?')).toBeVisible()
  await page.getByRole('button', { name: 'Substituir' }).click()

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-stepper')
  expect(fields[0].steps[0].children[0].name).toBe('text')
})

test('tabs dropped at the top of root remain root-only', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  await dropCatalogField(page, { $formkit: 'q-tabs', name: 'tabs', tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }] }, '[data-field-name="first"] .preview-element-area-top')
  const fields = await readFields(page)
  expect(fields[0].$formkit).toBe('q-tabs')
  expect(fields).toHaveLength(1)
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['first', 'second'])
})

test('tabs dropped over structures away from the root start are placed at the root start', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
  ])

  await dropCatalogField(page, {
    $formkit: 'q-tabs',
    name: 'tabs',
    tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }],
  }, '[data-field-name="container"] .overlay-drop-here')

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-tabs')
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['container'])
})

test('list structures accept existing fields dropped into their empty canvas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' },
  ])

  await dragExistingField(page, '[data-field-name="text"] .overlay-preview-element', '[data-field-name="list"] .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="number"] .overlay-preview-element', '[data-field-name="nestedList"] .overlay-drop-here')

  const fields = await readFields(page)
  expect(fields).toHaveLength(2)
  expect(fields[0].children[0].name).toBe('text')
  expect(fields[1].children[0].name).toBe('number')
})

test('container and list children can be reordered inside their structures', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [
        { $formkit: 'q-input', name: 'containerFirst', label: 'Primeiro container', inputType: 'text' },
        { $formkit: 'q-input', name: 'containerSecond', label: 'Segundo container', inputType: 'text' },
        { $formkit: 'q-input', name: 'containerThird', label: 'Terceiro container', inputType: 'text' },
      ],
    },
    {
      $formkit: 'q-list-structure',
      name: 'list',
      label: 'Lista',
      nested: false,
      children: [
        { $formkit: 'q-input', name: 'listFirst', label: 'Primeiro lista', inputType: 'text' },
        { $formkit: 'q-input', name: 'listSecond', label: 'Segundo lista', inputType: 'text' },
        { $formkit: 'q-input', name: 'listThird', label: 'Terceiro lista', inputType: 'text' },
      ],
    },
    {
      $formkit: 'q-list-structure',
      name: 'nestedList',
      label: 'Lista aninhada',
      nested: true,
      children: [
        { $formkit: 'q-input', name: 'nestedFirst', label: 'Primeiro aninhada', inputType: 'text' },
        { $formkit: 'q-input', name: 'nestedSecond', label: 'Segundo aninhada', inputType: 'text' },
        { $formkit: 'q-input', name: 'nestedThird', label: 'Terceiro aninhada', inputType: 'text' },
      ],
    },
  ])

  await dragExistingField(page, '[data-field-name="containerFirst"] .overlay-preview-element', '[data-field-name="containerThird"] .preview-element-area-bottom')
  await dragExistingField(page, '[data-field-name="listThird"] .overlay-preview-element', '[data-field-name="listFirst"] .preview-element-area-top')
  await dragExistingField(page, '[data-field-name="nestedSecond"] .overlay-preview-element', '[data-field-name="nestedThird"] .preview-element-area-bottom')

  const fields = await readFields(page)
  expect(fields[0].children.map((field: { name: string }) => field.name)).toEqual(['containerSecond', 'containerThird', 'containerFirst'])
  expect(fields[1].children.map((field: { name: string }) => field.name)).toEqual(['listThird', 'listFirst', 'listSecond'])
  expect(fields[2].children.map((field: { name: string }) => field.name)).toEqual(['nestedFirst', 'nestedThird', 'nestedSecond'])

  expect(await readStructureFieldOrder(page, 'children:container')).toEqual(['containerSecond', 'containerThird', 'containerFirst'])
  expect(await readStructureFieldOrder(page, 'children:list')).toEqual(['listThird', 'listFirst', 'listSecond'])
  expect(await readStructureFieldOrder(page, 'children:nestedList')).toEqual(['nestedFirst', 'nestedThird', 'nestedSecond'])
})

test('field wrapper honors configured columns in the builder canvas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number', columns: { container: 5 } },
    { $formkit: 'q-time', name: 'time', label: 'Hora', columns: { container: 7 } },
  ])

  await expect(page.locator('[data-field-name="number"]')).toHaveCSS('grid-column-end', 'span 5')
  await expect(page.locator('[data-field-name="time"]')).toHaveCSS('grid-column-end', 'span 7')
})

test('field wrapper uses responsive column breakpoints from schema', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await loadBuilder(page, [
    {
      $formkit: 'q-input',
      name: 'responsiveText',
      label: 'Responsivo',
      inputType: 'text',
      columns: {
        container: 12,
        sm: { container: 6 },
        lg: { container: 4 },
      },
    },
  ])

  await expect(page.locator('[data-field-name="responsiveText"]')).toHaveCSS('grid-column-end', 'span 4')

  await page.setViewportSize({ width: 800, height: 800 })
  await expect(page.locator('[data-field-name="responsiveText"]')).toHaveCSS('grid-column-end', 'span 6')

  await page.setViewportSize({ width: 500, height: 800 })
  await expect(page.locator('[data-field-name="responsiveText"]')).toHaveCSS('grid-column-end', 'span 12')
})

test('field wrapper honors configured columns inside structures', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [
        { $formkit: 'q-input', name: 'insideContainer', label: 'Dentro', inputType: 'text', columns: { container: 5 } },
      ],
    },
    {
      $formkit: 'q-grid',
      name: 'grid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          label: 'Linha 1 / Coluna 1',
          row: 'row_1',
          column: 'column_1',
          children: [
            { $formkit: 'q-time', name: 'insideGrid', label: 'Hora', columns: { container: 6 } },
          ],
        },
      ],
    },
  ])

  await expect(page.locator('[data-field-name="insideContainer"]')).toHaveCSS('grid-column-end', 'span 5')
  await expect(page.locator('[data-field-name="insideGrid"]')).toHaveCSS('grid-column-end', 'span 6')
})

test('field overlays show current column span badges for root and nested fields', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'defaultWidth', label: 'Padrão', inputType: 'text' },
    { $formkit: 'q-input', name: 'customWidth', label: 'Customizado', inputType: 'text', columns: { container: 5 } },
    {
      $formkit: 'q-input',
      name: 'responsiveWidth',
      label: 'Responsivo',
      inputType: 'text',
      columns: {
        default: { container: 12 },
        sm: { container: 8 },
        lg: { container: 4 },
      },
    },
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [
        { $formkit: 'q-input', name: 'insideContainer', label: 'Dentro', inputType: 'text', columns: { container: 6 } },
      ],
    },
  ])

  const columnBadge = (fieldName: string) => page.locator(`[data-field-name="${fieldName}"] > .preview-element-columns-display`)

  await expect(page.locator('.preview-element-columns-display')).toHaveCount(0)
  await page.locator('[data-field-name="defaultWidth"] > .overlay-preview-element').hover()
  await expect(columnBadge('defaultWidth')).toHaveText('12')
  await expect(columnBadge('customWidth')).toHaveCount(0)
  await page.mouse.move(1, 1)
  await expect(page.locator('.preview-element-columns-display')).toHaveCount(0)

  await page.locator('[data-field-name="defaultWidth"] > .overlay-preview-element').click()
  await expect(columnBadge('defaultWidth')).toHaveText('12')
  await expect(columnBadge('customWidth')).toHaveCount(0)

  await page.locator('[data-field-name="customWidth"] > .overlay-preview-element').click()
  await expect(columnBadge('customWidth')).toHaveText('5')
  await expect(columnBadge('defaultWidth')).toHaveCount(0)

  await page.locator('[data-field-name="container"] > .overlay-preview-element').click()
  await expect(columnBadge('container')).toHaveText('12')
  await expect(columnBadge('insideContainer')).toHaveCount(0)

  await page.locator('[data-field-name="insideContainer"] > .overlay-preview-element').click()
  await expect(columnBadge('insideContainer')).toHaveText('6')
  await page.mouse.move(1, 1)
  await expect(columnBadge('container')).toHaveCount(0)

  await page.locator('[data-field-name="responsiveWidth"] > .overlay-preview-element').click()
  await expect(columnBadge('responsiveWidth')).toHaveText('12')
  const drawer = page.locator('[data-drawer="right"]')
  await drawer.getByRole('button', { name: 'Tablet' }).click()
  await expect(columnBadge('responsiveWidth')).toHaveText('8')
  await drawer.getByRole('button', { name: 'Desktop' }).click()
  await expect(columnBadge('responsiveWidth')).toHaveText('4')
})

test('column changes from the settings panel update the builder layout and persisted schema', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' },
  ])

  await page.locator('[data-field-name="number"] .overlay-preview-element').click()
  const drawer = page.locator('[data-drawer="right"]')
  await drawer.getByRole('checkbox', { name: 'Largura de coluna padrão' }).click()
  await drawer.getByRole('button', { name: '5' }).click()

  await expect(page.locator('[data-field-name="number"]')).toHaveCSS('grid-column-end', 'span 5')
  const fields = await readFields(page)
  expect(fields[0].columns.container).toBe(5)
})

test('structures with existing children render the children and hide the empty layer', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [{ $formkit: 'q-input', name: 'insideContainer', label: 'Dentro', inputType: 'text' }],
    },
    {
      $formkit: 'q-list-structure',
      name: 'list',
      label: 'Lista',
      nested: false,
      children: [{ $formkit: 'q-input', name: 'insideList', label: 'Na lista', inputType: 'text' }],
    },
  ])

  await expect(page.locator('[data-field-name="insideContainer"]')).toBeVisible()
  await expect(page.locator('[data-field-name="insideList"]')).toBeVisible()
  await expect(page.locator('[data-field-name="container"] .overlay-drop-here')).toHaveCount(0)
  await expect(page.locator('[data-field-name="list"] .overlay-drop-here')).toHaveCount(0)
})

test('catalog fields dropped over structure bodies are inserted as structure children', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [{ $formkit: 'q-input', name: 'existingContainerChild', label: 'Existente', inputType: 'text' }],
    },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-grid', name: 'grid', rowsCount: 1, columnsCount: 2, cells: [] },
  ])

  await dropCatalogField(page, { $formkit: 'q-input', name: 'containerText', label: 'No container', inputType: 'text' }, '[data-field-name="container"] .form-canvas')
  await dropCatalogField(page, { $formkit: 'q-input', name: 'listText', label: 'Na lista', inputType: 'text' }, '[data-field-name="list"] .overlay-drop-here')
  await dropCatalogField(page, { $formkit: 'q-input', name: 'gridText', label: 'No grid', inputType: 'text' }, '[data-field-name="grid"] .structure-grid__cell .overlay-drop-here')

  const fields = await readFields(page)
  expect(fields[0].children.map((field: { name: string }) => field.name)).toEqual(['existingContainerChild', 'containerText'])
  expect(fields[1].children[0].name).toBe('listText')
  expect(fields[2].cells[0].children[0].name).toBe('gridText')

  await expect(page.locator('[data-field-name="containerText"]')).toBeVisible()
  await expect(page.locator('[data-field-name="listText"]')).toBeVisible()
  await expect(page.locator('[data-field-name="gridText"]')).toBeVisible()

  await page.locator('[data-field-name="gridText"] .overlay-preview-element').click()
  await expect(page.locator('[data-drawer="right"]')).toContainText('gridText')
})

test('catalog and existing fields drop into all structure slot types', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] },
    { $formkit: 'q-grid', name: 'grid', rowsCount: 2, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'threeColumns', rowsCount: 1, columnsCount: 3, cells: [] },
    { $formkit: 'q-grid', name: 'fourColumns', rowsCount: 1, columnsCount: 4, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
    { $formkit: 'q-input', name: 'moveContainer', label: 'Mover container', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveList', label: 'Mover lista', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveNestedList', label: 'Mover lista aninhada', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveGrid', label: 'Mover grid', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveTwoColumns', label: 'Mover duas colunas', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveThreeColumns', label: 'Mover tres colunas', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveFourColumns', label: 'Mover quatro colunas', inputType: 'text' },
    { $formkit: 'q-input', name: 'moveTable', label: 'Mover tabela', inputType: 'text' },
  ])

  await dropCatalogItem(page, 'text', '[data-field-name="container"] .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveContainer"] .overlay-preview-element', '[data-field-name="container"] .form-canvas')

  await dropCatalogItem(page, 'number', '[data-field-name="list"] .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveList"] .overlay-preview-element', '[data-field-name="list"] .form-canvas')

  await dropCatalogItem(page, 'email', '[data-field-name="nestedList"] .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveNestedList"] .overlay-preview-element', '[data-field-name="nestedList"] .form-canvas')

  await dropCatalogItem(page, 'textarea', '[data-field-name="grid"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveGrid"] .overlay-preview-element', '[data-field-name="grid"] .structure-grid__cell:nth-child(2) .overlay-drop-here')

  await dropCatalogItem(page, 'url', '[data-field-name="twoColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveTwoColumns"] .overlay-preview-element', '[data-field-name="twoColumns"] .structure-grid__cell:nth-child(2) .overlay-drop-here')

  await dropCatalogItem(page, 'select', '[data-field-name="threeColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveThreeColumns"] .overlay-preview-element', '[data-field-name="threeColumns"] .structure-grid__cell:nth-child(2) .overlay-drop-here')

  await dropCatalogItem(page, 'time', '[data-field-name="fourColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveFourColumns"] .overlay-preview-element', '[data-field-name="fourColumns"] .structure-grid__cell:nth-child(2) .overlay-drop-here')

  await dropCatalogItem(page, 'date', '[data-field-name="table"] .structure-table__cell:nth-of-type(1) .overlay-drop-here')
  await dragExistingField(page, '[data-field-name="moveTable"] .overlay-preview-element', '[data-field-name="table"] .structure-table__cell:nth-of-type(2) .overlay-drop-here')

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['container', 'list', 'nestedList', 'grid', 'twoColumns', 'threeColumns', 'fourColumns', 'table'])
  expect(fields[0].children.map((field: { name: string }) => field.name)).toEqual(['text', 'moveContainer'])
  expect(fields[1].children.map((field: { name: string }) => field.name)).toEqual(['number', 'moveList'])
  expect(fields[2].children.map((field: { name: string }) => field.name)).toEqual(['email', 'moveNestedList'])
  expect(fields[3].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['textarea'])
  expect(fields[3].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['moveGrid'])
  expect(fields[4].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['url'])
  expect(fields[4].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['moveTwoColumns'])
  expect(fields[5].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['select'])
  expect(fields[5].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['moveThreeColumns'])
  expect(fields[6].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['time'])
  expect(fields[6].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['moveFourColumns'])
  expect(fields[7].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['date'])
  expect(fields[7].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['moveTable'])

  await expect(page.locator('[data-field-name="container"] [data-field-name="text"]')).toBeVisible()
  await expect(page.locator('[data-field-name="list"] [data-field-name="number"]')).toBeVisible()
  await expect(page.locator('[data-field-name="nestedList"] [data-field-name="email"]')).toBeVisible()
  await expect(page.locator('[data-field-name="grid"] [data-field-name="textarea"]')).toBeVisible()
  await expect(page.locator('[data-field-name="twoColumns"] [data-field-name="url"]')).toBeVisible()
  await expect(page.locator('[data-field-name="threeColumns"] [data-field-name="select"]')).toBeVisible()
  await expect(page.locator('[data-field-name="fourColumns"] [data-field-name="time"]')).toBeVisible()
  await expect(page.locator('[data-field-name="table"] [data-field-name="date"]')).toBeVisible()
})

test('catalog items can be dragged from the drawer into an empty root canvas', async ({ page }) => {
  await loadBuilder(page, [])

  await dragCatalogItemFromDrawer(page, 'text', '.preview-form-container .overlay-drop-here', { expectHighlight: false })

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['text'])
  await expect(page.locator('[data-field-name="text"]')).toBeVisible()
  await expect(page.locator('body')).not.toHaveClass(/qfb-builder-dragging/)
})

test('visible structure slots sit above structure overlays and accept catalog drops', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] },
    { $formkit: 'q-grid', name: 'grid', rowsCount: 2, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'threeColumns', rowsCount: 1, columnsCount: 3, cells: [] },
    { $formkit: 'q-grid', name: 'fourColumns', rowsCount: 1, columnsCount: 4, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
  ])

  await dropCatalogItemOnReachableSlot(page, 'text', '[data-field-name="container"] .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'number', '[data-field-name="list"] .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'email', '[data-field-name="nestedList"] .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'textarea', '[data-field-name="grid"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'url', '[data-field-name="twoColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'select', '[data-field-name="threeColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'time', '[data-field-name="fourColumns"] .structure-grid__cell:nth-child(1) .overlay-drop-here')
  await dropCatalogItemOnReachableSlot(page, 'date', '[data-field-name="table"] .structure-table__cell:nth-of-type(1) .overlay-drop-here')

  const fields = await readFields(page)
  expect(fields[0].children.map((field: { name: string }) => field.name)).toEqual(['text'])
  expect(fields[1].children.map((field: { name: string }) => field.name)).toEqual(['number'])
  expect(fields[2].children.map((field: { name: string }) => field.name)).toEqual(['email'])
  expect(fields[3].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['textarea'])
  expect(fields[4].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['url'])
  expect(fields[5].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['select'])
  expect(fields[6].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['time'])
  expect(fields[7].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['date'])
})

test('structure slots keep explicit drop targets even after dragging over another form area', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-grid', name: 'fourColumns', rowsCount: 1, columnsCount: 4, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
  ])

  const result = await page.evaluate(async () => {
    const rootTarget = document.querySelector('[data-field-name="first"] .preview-element-area-bottom')
    const drops = [
      {
        schema: { $formkit: 'q-input', name: 'containerText', label: 'Container', inputType: 'text' },
        selector: '[data-field-name="container"] .overlay-drop-here',
      },
      {
        schema: { $formkit: 'q-input', name: 'listText', label: 'Lista', inputType: 'text' },
        selector: '[data-field-name="list"] .overlay-drop-here',
      },
      {
        schema: { $formkit: 'q-input', name: 'gridText', label: 'Grid', inputType: 'text' },
        selector: '[data-field-name="fourColumns"] .structure-grid__cell:nth-child(2) .overlay-drop-here',
      },
      {
        schema: { $formkit: 'q-input', name: 'tableText', label: 'Tabela', inputType: 'text' },
        selector: '[data-field-name="table"] .structure-table__cell .overlay-drop-here',
      },
    ]

    if (!rootTarget) throw new Error('root target not found')

    for (const item of drops) {
      const target = document.querySelector(item.selector)
      if (!target) throw new Error(`drop target not found: ${item.selector}`)

      const data = new DataTransfer()
      data.setData('text', JSON.stringify(item.schema))

      rootTarget.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
      rootTarget.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
      await new Promise(requestAnimationFrame)

      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
      await new Promise(requestAnimationFrame)
    }

    const rawFields = localStorage.getItem('form-fields') || '[]'
    return JSON.parse(rawFields.startsWith('__q_strn|') ? rawFields.slice('__q_strn|'.length) : rawFields)
  })

  expect(result.map((field: { name: string }) => field.name)).toEqual(['first', 'container', 'list', 'fourColumns', 'table'])
  expect(result[1].children.map((field: { name: string }) => field.name)).toEqual(['containerText'])
  expect(result[2].children.map((field: { name: string }) => field.name)).toEqual(['listText'])
  expect(result[3].cells[1].children.map((field: { name: string }) => field.name)).toEqual(['gridText'])
  expect(result[4].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['tableText'])
})

test('internal structure placeholders render as icon-only drop surfaces', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] },
    { $formkit: 'q-grid', name: 'fourColumns', rowsCount: 1, columnsCount: 4, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
  ])

  const surfaces = await page.locator('.preview-form-container .overlay-drop-here').evaluateAll((zones) => {
    return zones.map((zone) => {
      return {
        hasIcon: Boolean(zone.querySelector('.overlay-drop-here__icon')),
        labelCount: zone.querySelectorAll('.overlay-drop-here__label').length,
        text: zone.textContent?.trim() || '',
      }
    })
  })

  expect(surfaces).toHaveLength(11)
  for (const surface of surfaces) {
    expect(surface.hasIcon).toBe(true)
    expect(surface.labelCount).toBe(0)
    expect(surface.text).not.toContain('Linha 1 / Coluna 1')
    expect(surface.text).not.toContain('Solte aqui')
    expect(surface.text).not.toContain('Container vazio')
    expect(surface.text).not.toContain('Item repetível vazio')
    expect(surface.text).not.toContain('Arraste os elementos aqui')
  }
})

test('structure body drop indicator is shown while dragging over a child structure', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
  ])

  await expect(page.locator('[data-field-name="container"] .overlay-drop-here')).toBeVisible()

  const isVisible = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="container"] .overlay-drop-here')
    if (!target) throw new Error('container structure drop zone not found')
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const style = window.getComputedStyle(target)
    return target.classList.contains('overlay-drop-here--highlighted')
      && style.display !== 'none'
      && style.visibility !== 'hidden'
  })

  expect(isVisible).toBe(true)
})

test('empty tab and step drop surfaces are icon-only subtle drop targets', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [{ name: 'step_1', label: 'Passo 1', children: [] }],
    },
  ])

  const stepMetrics = await page.locator('.q-stepper .overlay-drop-here').evaluate((zone) => {
    const style = window.getComputedStyle(zone)
    return {
      text: zone.textContent?.trim(),
      hasIcon: Boolean(zone.querySelector('.overlay-drop-here__icon')),
      labelCount: zone.querySelectorAll('.overlay-drop-here__label').length,
      borderTopWidth: style.borderTopWidth,
      backgroundColor: style.backgroundColor,
    }
  })

  expect(stepMetrics.text).not.toContain('Arraste os elementos aqui')
  expect(stepMetrics.hasIcon).toBe(true)
  expect(stepMetrics.labelCount).toBe(0)
  expect(stepMetrics.borderTopWidth).toBe('0px')
  expect(stepMetrics.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')

  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }],
    },
  ])

  const tabMetrics = await page.evaluate(async () => {
    const zone = document.querySelector('.structure-tabs .overlay-drop-here')
    if (!zone) throw new Error('tab drop zone not found')
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }))
    zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const style = window.getComputedStyle(zone)
    return {
      text: zone.textContent?.trim(),
      hasIcon: Boolean(zone.querySelector('.overlay-drop-here__icon')),
      labelCount: zone.querySelectorAll('.overlay-drop-here__label').length,
      visible: zone.classList.contains('overlay-drop-here--highlighted'),
      borderTopWidth: style.borderTopWidth,
      backgroundColor: style.backgroundColor,
    }
  })

  expect(tabMetrics.text).not.toContain('Arraste os elementos aqui')
  expect(tabMetrics.hasIcon).toBe(true)
  expect(tabMetrics.labelCount).toBe(0)
  expect(tabMetrics.visible).toBe(true)
  expect(tabMetrics.borderTopWidth).toBe('0px')
  expect(tabMetrics.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
})

test('empty tabs and steps accept catalog fields in their active panels', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }],
    },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'tabText', label: 'Texto da aba', inputType: 'text' },
    '.structure-tabs .overlay-drop-here',
  )

  let fields = await readFields(page)
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['tabText'])
  await expect(page.locator('[data-field-name="tabText"]')).toBeVisible()

  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [{ name: 'step_1', label: 'Passo 1', children: [] }],
    },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'stepText', label: 'Texto do passo', inputType: 'text' },
    '.q-stepper .overlay-drop-here',
  )

  fields = await readFields(page)
  expect(fields[0].steps[0].children.map((field: { name: string }) => field.name)).toEqual(['stepText'])
  await expect(page.locator('[data-field-name="stepText"]')).toBeVisible()
})

test('structure drop surface is hidden after the first field is present', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $formkit: 'q-input', name: 'tabText', label: 'Texto', inputType: 'text' },
          ],
        },
      ],
    },
  ])

  const result = await page.evaluate(async () => {
    const zone = document.querySelector('.structure-tabs .overlay-drop-here')
    const fieldBottom = document.querySelector('[data-field-name="tabText"] .preview-element-area-bottom')
    const field = document.querySelector('[data-field-name="tabText"]')
    if (!fieldBottom || !field) throw new Error('tab field drop targets not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'nextText', label: 'Texto 2', inputType: 'text' }))
    fieldBottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleLabels = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })
    const labelRect = visibleLabels[0]?.getBoundingClientRect()
    const fieldRect = field.getBoundingClientRect()

    return {
      zoneExists: Boolean(zone),
      labelText: visibleLabels[0]?.textContent?.trim() || '',
      labelNearField: labelRect
        ? Math.abs((labelRect.top + labelRect.height / 2) - fieldRect.bottom) < 24
        : false,
    }
  })

  expect(result.zoneExists).toBe(false)
  expect(result.labelText).toBe('Arraste aqui')
  expect(result.labelNearField).toBe(true)
})

test('drop indicator is cleared when dragging over blank space after the last tab field', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
            { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
          ],
        },
      ],
    },
  ])

  const result = await page.evaluate(async () => {
    const fieldBottom = document.querySelector('[data-field-name="heading"] .preview-element-area-bottom')
    const canvas = document.querySelector('.structure-tabs__panel .form-canvas')
    if (!fieldBottom || !canvas) throw new Error('tab blank-space drop targets not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'nextText', label: 'Texto 2', inputType: 'text' }))

    fieldBottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleBefore = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleAfter = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      visibleBefore: visibleBefore.length,
      visibleAfter: visibleAfter.length,
    }
  })

  expect(result.visibleBefore).toBe(1)
  expect(result.visibleAfter).toBe(0)
})

test('catalog drag outside valid drop targets clears a stale insertion guide', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
    { $el: 'img', name: 'image', attrs: { src: 'https://placehold.co/640x360', alt: 'Imagem' } },
    { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
  ])

  const result = await page.evaluate(async () => {
    const staleTarget = document.querySelector('[data-field-name="heading"] .preview-element-area-bottom')
    const previewContainer = document.querySelector('.preview-form-container')
    if (!staleTarget || !previewContainer) throw new Error('stale guide target not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'nextText', label: 'Texto 2', inputType: 'text' }))

    staleTarget.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleDuring = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    const previewRect = previewContainer.getBoundingClientRect()
    previewContainer.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: previewRect.left + 4,
      clientY: previewRect.top + 4,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const visibleAfterPreviewBlank = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    document.body.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: 4,
      clientY: 4,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const visibleAfter = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      visibleDuring: visibleDuring.length,
      visibleAfterPreviewBlank: visibleAfterPreviewBlank.length,
      visibleAfter: visibleAfter.length,
    }
  })

  expect(result.visibleDuring).toBe(1)
  expect(result.visibleAfterPreviewBlank).toBe(0)
  expect(result.visibleAfter).toBe(0)
})

test('dragging an existing field over itself does not keep a stale insertion target', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
            { $el: 'img', name: 'image', attrs: { src: 'https://placehold.co/640x360', alt: 'Imagem' } },
            { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
          ],
        },
      ],
    },
  ])

  const result = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const staleTarget = document.querySelector('[data-field-name="heading"] .preview-element-area-bottom')
    const sameField = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const canvas = document.querySelector('.structure-tabs__panel .form-canvas')
    if (!source || !staleTarget || !sameField || !canvas) throw new Error('same-field drag targets not found')

    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    staleTarget.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    sameField.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleLabels = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))

    return {
      visibleLabels: visibleLabels.length,
    }
  })

  expect(result.visibleLabels).toBe(0)

  const fields = await readFields(page)
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['text', 'image', 'heading'])
})

test('dropping a catalog field on occupied blank canvas space is ignored', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
            { $el: 'img', name: 'image', attrs: { src: 'https://placehold.co/640x360', alt: 'Imagem' } },
            { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
          ],
        },
      ],
    },
  ])

  const result = await page.evaluate(async () => {
    const canvas = document.querySelector('.structure-tabs__panel .form-canvas')
    if (!canvas) throw new Error('tab canvas not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' }))
    canvas.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleLabels = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))

    return {
      visibleLabels: visibleLabels.length,
    }
  })

  expect(result.visibleLabels).toBe(0)

  const fields = await readFields(page)
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['text', 'image', 'heading'])
})

test('tab panels do not create an internal vertical scrollbar', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $el: 'h1', name: 'title', children: 'Lorem ipsum dolor' },
            { $el: 'h1', name: 'title_2', children: 'Lorem ipsum dolor' },
            { $el: 'img', name: 'image', attrs: { src: 'https://placehold.co/640x360', alt: 'Imagem', class: 'full-width rounded-borders' } },
            { $el: 'p', name: 'content', children: 'Conteúdo estático' },
            { $el: 'h1', name: 'title_3', children: 'Lorem ipsum dolor' },
          ],
        },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  const overflow = await page.locator('.structure-tabs__panel').first().evaluate((panel) => {
    const scrollCandidates = [panel, ...panel.querySelectorAll('.q-panel, .q-tab-panel, .scroll')]
    const overflowingNodes = scrollCandidates
      .map((el) => {
        const style = window.getComputedStyle(el)
        return {
          className: el.className,
          overflowY: style.overflowY,
        }
      })
      .filter(item => item.overflowY === 'auto' || item.overflowY === 'scroll')

    return {
      overflowingNodes,
      hasQuasarScrollWrapper: Boolean(panel.closest('.q-panel.scroll') || panel.querySelector('.q-panel.scroll')),
    }
  })

  expect(overflow.overflowingNodes).toEqual([])
  expect(overflow.hasQuasarScrollWrapper).toBe(false)
})

test('structure body drop indicator is cleared when the item is dropped outside the form', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  const result = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="container"] .overlay-drop-here')
    if (!source || !target) throw new Error('container drag target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
    const visibleDuringDrag = target.classList.contains('overlay-drop-here--highlighted')

    document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    return {
      visibleDuringDrag,
      visibleAfterOutsideDrop: target.classList.contains('overlay-drop-here--highlighted'),
      visibility: window.getComputedStyle(target).visibility,
    }
  })

  expect(result.visibleDuringDrag).toBe(true)
  expect(result.visibleAfterOutsideDrop).toBe(false)
  expect(result.visibility).toBe('visible')
})

test('existing fields stay in place when dragged out of a valid structure target', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="container"] .overlay-drop-here')
    const canvas = document.querySelector('.form-canvas')
    if (!source || !target || !canvas) throw new Error('drag target not found')

    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
  })

  const fields = await readFields(page)
  expect(fields.map((field: any) => field.name)).toEqual(['container', 'text'])
  expect(fields[0].children || []).toEqual([])
})

test('grid structure drop zones are scoped to each column block', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] },
  ])

  await expect(page.locator('[data-field-name="twoColumns"] .structure-grid__cell .overlay-drop-here').first()).toBeVisible()

  const metrics = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="twoColumns"] .structure-grid__cell .overlay-drop-here')
    if (!target) throw new Error('grid drop zone not found')
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const cells = Array.from(document.querySelectorAll('[data-field-name="twoColumns"] .structure-grid__cell'))
    const zones = Array.from(document.querySelectorAll('[data-field-name="twoColumns"] .structure-grid__cell .overlay-drop-here'))

    return {
      count: zones.length,
      withinCells: zones.map((zone, index) => {
        const zoneRect = zone.getBoundingClientRect()
        const cellRect = cells[index].getBoundingClientRect()

        return {
          hasSize: zoneRect.width > 0 && zoneRect.height > 0,
          fitsLeft: zoneRect.left >= cellRect.left - 1,
          fitsRight: zoneRect.right <= cellRect.right + 1,
          fitsTop: zoneRect.top >= cellRect.top - 1,
          fitsBottom: zoneRect.bottom <= cellRect.bottom + 1,
        }
      }),
    }
  })

  expect(metrics.count).toBe(2)
  for (const item of metrics.withinCells) {
    expect(item).toEqual({
      hasSize: true,
      fitsLeft: true,
      fitsRight: true,
      fitsTop: true,
      fitsBottom: true,
    })
  }
})

test('grid cell fields use replacement feedback instead of side insertion lines', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'grid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            { $formkit: 'q-input', name: 'insideGrid', label: 'Dentro', inputType: 'text' },
          ],
        },
      ],
    },
    { $formkit: 'q-input', name: 'outside', label: 'Fora', inputType: 'text' },
  ])

  const metrics = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="outside"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="insideGrid"] .overlay-preview-element')
    if (!source || !target) throw new Error('grid replacement target not found')

    const data = new DataTransfer()
    const targetRect = target.getBoundingClientRect()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: targetRect.right - 2,
      clientY: targetRect.top + targetRect.height / 2,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const visibleSideLines = Array.from(document.querySelectorAll('[data-field-name="insideGrid"] .preview-element-label-wrapper__left, [data-field-name="insideGrid"] .preview-element-label-wrapper__right')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      replacementVisible: target.classList.contains('__replace-target'),
      replacementIconVisible: Boolean(document.querySelector('[data-field-name="insideGrid"] .preview-cell-replace-indicator')),
      visibleSideLineCount: visibleSideLines.length,
    }
  })

  expect(metrics).toEqual({
    replacementVisible: true,
    replacementIconVisible: true,
    visibleSideLineCount: 0,
  })
})

test('fields inside nested grid cells stay within the available cell width', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'outerGrid',
      rowsCount: 2,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            {
              $formkit: 'q-grid',
              name: 'innerGrid',
              rowsCount: 2,
              columnsCount: 2,
              cells: [
                {
                  name: 'row_1__column_2',
                  row: 'row_1',
                  column: 'column_2',
                  children: [
                    { $el: 'p', name: 'p_1', children: 'Lorem ipsum dolor', attrs: { class: 'no-margin' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number', columns: { container: 6 } },
    { $formkit: 'q-input', name: 'url', label: 'URL', inputType: 'url', columns: { container: 6 } },
  ])

  await page.locator('[data-field-name="p_1"] .overlay-preview-element').click()

  const metrics = await page.evaluate(() => {
    const field = document.querySelector('[data-field-name="p_1"]')!
    const overlay = field.querySelector('.overlay-preview-element')!
    const cell = field.closest('.structure-grid__cell')!
    const canvas = field.closest('.form-canvas')!
    const fieldRect = field.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()
    const cellRect = cell.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const columnGap = Number.parseFloat(window.getComputedStyle(canvas).columnGap)

    return {
      fieldHasSize: fieldRect.width > 0 && fieldRect.height > 0,
      fieldFitsLeft: fieldRect.left >= cellRect.left - 1,
      fieldFitsRight: fieldRect.right <= cellRect.right + 1,
      overlayFitsLeft: overlayRect.left >= cellRect.left - 1,
      overlayFitsRight: overlayRect.right <= cellRect.right + 1,
      canvasFitsRight: canvasRect.right <= cellRect.right + 1,
      totalGridGapFitsCell: columnGap * 11 < cellRect.width,
    }
  })

  expect(metrics).toEqual({
    fieldHasSize: true,
    fieldFitsLeft: true,
    fieldFitsRight: true,
    overlayFitsLeft: true,
    overlayFitsRight: true,
    canvasFitsRight: true,
    totalGridGapFitsCell: true,
  })
})

test('catalog fields dropped on an inner grid cell are inserted into the inner grid', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'outerGrid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            {
              $formkit: 'q-grid',
              name: 'innerGrid',
              rowsCount: 1,
              columnsCount: 2,
              cells: [],
            },
          ],
        },
      ],
    },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'innerText', label: 'Dentro', inputType: 'text' },
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(2) .overlay-drop-here',
  )

  const fields = await readFields(page)
  const innerGrid = fields[0].cells[0].children[0]
  expect(innerGrid.name).toBe('innerGrid')
  expect(innerGrid.cells[1].children.map((field: { name: string }) => field.name)).toEqual(['innerText'])
  await expect(page.locator('[data-field-name="innerGrid"]')).toBeVisible()
  await expect(page.locator('[data-field-name="innerText"]')).toBeVisible()
})

test('catalog fields dropped on the inner grid overlay replace the inner grid', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'outerGrid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            {
              $formkit: 'q-grid',
              name: 'innerGrid',
              rowsCount: 1,
              columnsCount: 2,
              cells: [],
            },
          ],
        },
      ],
    },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'replacementText', label: 'Substituto', inputType: 'text' },
    '[data-field-name="innerGrid"] > .overlay-preview-element',
  )

  const fields = await readFields(page)
  expect(fields[0].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['replacementText'])
  await expect(page.locator('[data-field-name="innerGrid"]')).toHaveCount(0)
  await expect(page.locator('[data-field-name="replacementText"]')).toBeVisible()
})

test('subgrid cells reject another grid but still allow non-grid fields', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'outerGrid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            {
              $formkit: 'q-grid',
              name: 'innerGrid',
              rowsCount: 1,
              columnsCount: 2,
              cells: [],
            },
          ],
        },
      ],
    },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-grid', name: 'blockedGrid', rowsCount: 1, columnsCount: 2, cells: [] },
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(1) .overlay-drop-here',
  )

  let fields = await readFields(page)
  let innerGrid = fields[0].cells[0].children[0]
  expect(innerGrid.name).toBe('innerGrid')
  expect(innerGrid.cells.every((cell: { children?: unknown[] }) => !cell.children?.length)).toBe(true)
  await expect(page.locator('[data-field-name="blockedGrid"]')).toHaveCount(0)

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'allowedText', label: 'Permitido', inputType: 'text' },
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(1) .overlay-drop-here',
  )

  fields = await readFields(page)
  innerGrid = fields[0].cells[0].children[0]
  expect(innerGrid.cells[0].children.map((field: { name: string }) => field.name)).toEqual(['allowedText'])
  await expect(page.locator('[data-field-name="allowedText"]')).toBeVisible()
})

test('side drop indicator text is horizontal and the line sits outside the field edge', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const metrics = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="first"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="second"] .overlay-preview-element')
    if (!source || !target) throw new Error('side indicator targets not found')

    const data = new DataTransfer()
    const targetRect = target.getBoundingClientRect()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: targetRect.right - 2,
      clientY: targetRect.top + targetRect.height / 2,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const field = document.querySelector('[data-field-name="second"]')!
    const line = field.querySelector('.preview-element-label-wrapper__right:not(.hidden)')!
    const label = line.querySelector('.preview-element-label--side')!
    const fieldRect = field.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()
    const matrix = new DOMMatrixReadOnly(window.getComputedStyle(label).transform)

    return {
      lineStartsOutside: lineRect.left >= fieldRect.right - 1,
      lineExtendsOutside: lineRect.right > fieldRect.right,
      hasNoRotation: Math.abs(matrix.b) < 0.001 && Math.abs(matrix.c) < 0.001,
    }
  })

  expect(metrics).toEqual({
    lineStartsOutside: true,
    lineExtendsOutside: true,
    hasNoRotation: true,
  })
})

test('active field label and actions stay above the field edges', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
  ])

  await page.locator('[data-field-name="first"] .overlay-preview-element').click()

  const metrics = await page.evaluate(() => {
    const field = document.querySelector('[data-field-name="first"]')!
    const name = field.querySelector('.preview-form-name')!
    const copy = field.querySelector('.preview-form-copy-action')!
    const remove = field.querySelector('.preview-form-remove-action')!
    const fieldRect = field.getBoundingClientRect()
    const nameRect = name.getBoundingClientRect()
    const copyRect = copy.getBoundingClientRect()
    const removeRect = remove.getBoundingClientRect()

    return {
      nameAtLeft: Math.abs(nameRect.left - fieldRect.left) < 1,
      nameAboveField: nameRect.bottom <= fieldRect.top + 1,
      removeAtRight: Math.abs(removeRect.right - fieldRect.right) < 1,
      removeAboveField: removeRect.bottom <= fieldRect.top + 1,
      copyBeforeRemove: copyRect.right <= removeRect.left + 1,
    }
  })

  expect(metrics).toEqual({
    nameAtLeft: true,
    nameAboveField: true,
    removeAtRight: true,
    removeAboveField: true,
    copyBeforeRemove: true,
  })

  await page.locator('[data-field-name="first"] .preview-form-copy-action').hover()
  await expect(page.getByText('Clonar')).toBeVisible()
  await page.locator('[data-field-name="first"] .preview-form-remove-action').hover()
  await expect(page.getByText('Excluir')).toBeVisible()
})

test('grid uses editing surfaces instead of structural borders', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-grid', name: 'grid', rowsCount: 2, columnsCount: 2, cells: [] },
  ])

  const metrics = await page.evaluate(() => {
    const grid = document.querySelector('[data-field-name="grid"] .structure-grid')!
    const gridStyle = window.getComputedStyle(grid)
    const cells = Array.from(document.querySelectorAll('[data-field-name="grid"] .structure-grid__cell'))
    return {
      hasEditingClass: grid.classList.contains('structure-grid--editing'),
      gridHasSurface: gridStyle.backgroundColor !== 'rgba(0, 0, 0, 0)',
      gridBorder: gridStyle.borderWidth,
      cellBorders: cells.map((cell) => {
        const style = window.getComputedStyle(cell)
        return {
          bottom: style.borderBottomWidth,
          right: style.borderRightWidth,
        }
      }),
    }
  })

  expect(metrics).toEqual({
    hasEditingClass: true,
    gridHasSurface: true,
    gridBorder: '0px',
    cellBorders: [
      { bottom: '0px', right: '0px' },
      { bottom: '0px', right: '0px' },
      { bottom: '0px', right: '0px' },
      { bottom: '0px', right: '0px' },
    ],
  })
})

test('grid keeps column gaps when switching to preview mode', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'grid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [{ $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' }],
        },
        {
          name: 'row_1__column_2',
          row: 'row_1',
          column: 'column_2',
          children: [{ $formkit: 'q-input', name: 'url', label: 'URL', inputType: 'url' }],
        },
      ],
    },
  ])

  await switchToPreviewMode(page)

  const metrics = await page.evaluate(() => {
    const grid = document.querySelector('[data-field-name="grid"] .structure-grid')!
    const style = window.getComputedStyle(grid)
    const first = document.querySelector('[data-field-name="number"]')!.getBoundingClientRect()
    const second = document.querySelector('[data-field-name="url"]')!.getBoundingClientRect()
    return {
      hasEditingClass: grid.classList.contains('structure-grid--editing'),
      columnGap: Number.parseFloat(style.columnGap || style.gap),
      visualGap: second.left - first.right,
    }
  })

  expect(metrics.hasEditingClass).toBe(false)
  expect(metrics.columnGap).toBeGreaterThan(0)
  expect(metrics.visualGap).toBeGreaterThan(0)
})

test('non tab step structures render without borders in editing mode', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
  ])

  const metrics = await page.evaluate(() => {
    const selectors = ['.structure-container', '.structure-list', '.structure-table']
    return selectors.map((selector) => {
      const element = document.querySelector(selector)!
      const style = window.getComputedStyle(element)
      return {
        selector,
        hasSurface: style.backgroundColor !== 'rgba(0, 0, 0, 0)',
        borderWidth: style.borderWidth,
      }
    })
  })

  expect(metrics).toEqual([
    { selector: '.structure-container', hasSurface: true, borderWidth: '0px' },
    { selector: '.structure-list', hasSurface: true, borderWidth: '0px' },
    { selector: '.structure-table', hasSurface: true, borderWidth: '0px' },
  ])
})

test('container list grid and table structures can be selected', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-grid', name: 'grid', rowsCount: 1, columnsCount: 2, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
  ])

  await expect(page.locator('.preview-structure-select-handle')).toHaveCount(0)
  for (const fieldName of ['container', 'list', 'grid', 'table']) {
    await page.locator(`[data-field-name="${fieldName}"] > .overlay-preview-element`).click()
    await expect(page.locator(`[data-field-name="${fieldName}"] > .overlay-preview-element`)).toHaveClass(/__active/)
    await expect(page.locator(`[data-field-name="${fieldName}"] > .preview-structure-select-handle`)).toHaveCount(0)
    await expect(page.locator('[data-drawer="right"]')).toContainText(fieldName)
  }
})

test('structure headers render configured labels and descriptions', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Grupo de campos', description: 'Campos agrupados', children: [] },
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista de itens', description: 'Itens repetidos', nested: false, children: [] },
    { $formkit: 'q-grid', name: 'grid', label: 'Grid principal', description: 'Campos em grade', rowsCount: 1, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'twoColumns', label: 'Duas colunas', description: 'Preset com duas colunas', rowsCount: 1, columnsCount: 2, cells: [] },
    { $formkit: 'q-grid', name: 'threeColumns', label: 'Três colunas', description: 'Preset com três colunas', rowsCount: 1, columnsCount: 3, cells: [] },
    { $formkit: 'q-grid', name: 'fourColumns', label: 'Quatro colunas', description: 'Preset com quatro colunas', rowsCount: 1, columnsCount: 4, cells: [] },
    { $formkit: 'q-table-structure', name: 'table', label: 'Tabela de campos', description: 'Campos em tabela', rows, columnsConfig, cells: [] },
  ])

  const expectedHeaders = [
    ['container', 'Grupo de campos', 'Campos agrupados'],
    ['list', 'Lista de itens', 'Itens repetidos'],
    ['grid', 'Grid principal', 'Campos em grade'],
    ['twoColumns', 'Duas colunas', 'Preset com duas colunas'],
    ['threeColumns', 'Três colunas', 'Preset com três colunas'],
    ['fourColumns', 'Quatro colunas', 'Preset com quatro colunas'],
    ['table', 'Tabela de campos', 'Campos em tabela'],
  ] as const

  for (const [fieldName, label, description] of expectedHeaders) {
    const structure = page.locator(`[data-field-name="${fieldName}"]`)
    await expect(structure).toContainText(label)
    await expect(structure).toContainText(description)
  }
})

test('removing a structure migrates its internal fields to the parent list', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-container',
      name: 'container',
      label: 'Container',
      children: [
        { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
        { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
      ],
    },
    { $formkit: 'q-input', name: 'after', label: 'Depois', inputType: 'text' },
  ])

  await page.locator('[data-field-name="container"] > .overlay-preview-element').click({ position: { x: 8, y: 8 } })
  await page.locator('[data-field-name="container"] > .preview-form-remove-action').click()

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['first', 'second', 'after'])
})

test('replacing the unique stepper asks for confirmation and preserves internal fields', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [
        { name: 'step_1', label: 'Passo 1', children: [] },
        { name: 'step_2', label: 'Passo 2', children: [{ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }] },
      ],
    },
  ])

  await page.evaluate(() => {
    const wrapper = document.querySelector('.steps-wrapper')
    if (!wrapper) throw new Error('stepper wrapper not found')
    const rect = wrapper.getBoundingClientRect()
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({
      $formkit: 'q-stepper',
      name: 'stepper',
      steps: [{ name: 'step_1', label: 'Passo 1', children: [] }],
    }))
    wrapper.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientY: rect.top,
      dataTransfer: data,
    }))
    wrapper.dispatchEvent(new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      clientY: rect.top,
      dataTransfer: data,
    }))
  })

  await expect(page.getByText('Substituir estrutura de passos?')).toBeVisible()
  await page.getByRole('button', { name: 'Substituir' }).click()

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-stepper')
  expect(fields[0].steps).toHaveLength(1)
  expect(fields[0].steps[0].children[0].name).toBe('text')
})

test('grid accepts existing fields inside a specific cell', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-grid', name: 'grid', rowsCount: 2, columnsCount: 2, cells: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('[data-field-name="grid"] .structure-grid__cell .overlay-drop-here').first()).toBeVisible()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="grid"] .structure-grid__cell .overlay-drop-here')
    if (!source || !target) throw new Error('grid cell drop target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
  })

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].cells[0].children[0].name).toBe('text')
})

test('grid cells replace occupied content and hide clone controls for cell children', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'grid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            { $formkit: 'q-input', name: 'insideGrid', label: 'Dentro', inputType: 'text' },
          ],
        },
      ],
    },
  ])

  await page.locator('[data-field-name="insideGrid"] .overlay-preview-element').click()
  await expect(page.locator('[data-field-name="insideGrid"] .preview-form-name')).toBeVisible()
  await expect(page.locator('[data-field-name="insideGrid"] .preview-form-copy-action')).toHaveCount(0)

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'replacement', label: 'Substituto', inputType: 'text' },
    '[data-field-name="insideGrid"] .overlay-preview-element',
  )

  const fields = await readFields(page)
  expect(fields[0].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['replacement'])
  await expect(page.locator('[data-field-name="insideGrid"]')).toHaveCount(0)
  await expect(page.locator('[data-field-name="replacement"]')).toBeVisible()
})

test('occupied grid cells show replacement feedback instead of an extra cell drop zone', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-grid',
      name: 'grid',
      rowsCount: 1,
      columnsCount: 2,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            { $formkit: 'q-input', name: 'insideGrid', label: 'Dentro', inputType: 'text' },
          ],
        },
      ],
    },
    { $formkit: 'q-input', name: 'outside', label: 'Fora', inputType: 'text' },
  ])

  const metrics = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="outside"] .overlay-preview-element')
    const cell = document.querySelector('[data-field-name="insideGrid"]')?.closest('.structure-grid__cell')
    const target = document.querySelector('[data-field-name="insideGrid"] .overlay-preview-element')
    const canvas = cell?.querySelector('.form-canvas')
    if (!source || !target || !cell || !canvas) throw new Error('occupied grid replacement targets not found')

    const data = new DataTransfer()
    const cellRect = cell.getBoundingClientRect()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    canvas.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: cellRect.left + cellRect.width / 2,
      clientY: cellRect.bottom - 4,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const zone = cell.querySelector('.overlay-drop-here')
    const visibleLabels = Array.from(document.querySelectorAll('[data-field-name="insideGrid"] .preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      replacementVisible: target.classList.contains('__replace-target'),
      replacementIconVisible: Boolean(document.querySelector('[data-field-name="insideGrid"] .preview-cell-replace-indicator')),
      cellZoneVisible: zone?.classList.contains('overlay-drop-here--highlighted') ?? false,
      fieldLineCount: visibleLabels.length,
    }
  })

  expect(metrics).toEqual({
    replacementVisible: true,
    replacementIconVisible: true,
    cellZoneVisible: false,
    fieldLineCount: 0,
  })
})

test('table accepts existing fields inside a specific cell', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('[data-field-name="table"] .structure-table__cell .overlay-drop-here').first()).toBeVisible()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="table"] .structure-table__cell .overlay-drop-here')
    if (!source || !target) throw new Error('table cell drop target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: data }))
  })

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].cells[0].children[0].name).toBe('text')
})

test('occupied table cells replace their content with an existing field', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-table-structure',
      name: 'table',
      rows,
      columnsConfig,
      cells: [
        {
          name: 'row_1__column_1',
          row: 'row_1',
          column: 'column_1',
          children: [
            { $formkit: 'q-input', name: 'insideTable', label: 'Dentro', inputType: 'text' },
          ],
        },
      ],
    },
    { $formkit: 'q-input', name: 'outsideTable', label: 'Fora', inputType: 'text' },
  ])

  await dragExistingField(page, '[data-field-name="outsideTable"] .overlay-preview-element', '[data-field-name="insideTable"] .overlay-preview-element')

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].cells[0].children.map((field: { name: string }) => field.name)).toEqual(['outsideTable'])
  await expect(page.locator('[data-field-name="insideTable"]')).toHaveCount(0)
  await expect(page.locator('[data-field-name="outsideTable"]')).toBeVisible()
})

test('tabs header actions add tabs and removing tabs migrates children', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        { name: 'tab_1', label: 'Aba 1', children: [{ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }] },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  await page.getByLabel('Adicionar aba').click()
  let fields = await readFields(page)
  expect(fields[0].tabs).toHaveLength(3)

  await page.getByLabel('Remover abas').click()
  fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].name).toBe('text')
})

test('option and matrix fields render configured data and persist settings changes', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-option-group', name: 'radioGroup', label: 'Opções', groupType: 'radio', options: defaultOptions },
    { $formkit: 'q-option-group', name: 'radioBlocks', label: 'Blocos', groupType: 'radio', optionStyle: 'blocks', options: [{ label: 'Bloco A', value: 'block_a' }] },
    { $formkit: 'q-btn-toggle', name: 'radioTabs', label: 'Abas', options: [{ label: 'Aba A', value: 'tab_a' }] },
    { $formkit: 'q-matrix', name: 'matrix', label: 'Matriz', rows: [{ label: 'Pessoa', value: 'person' }], columnsConfig: [{ label: 'Nota', value: 'score' }] },
  ])

  await expect(page.getByText('Opção 1')).toBeVisible()
  await expect(page.getByText('Bloco A')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aba A' })).toBeVisible()
  await expect(page.locator('.matrix-field')).toContainText('Pessoa')
  await expect(page.locator('.matrix-field')).toContainText('Nota')

  await page.locator('[data-field-name="radioGroup"] .overlay-preview-element').click()
  await page.locator('[data-drawer="right"] input[placeholder="texto"]').first().fill('Sim')
  await page.locator('[data-drawer="right"] input[placeholder="texto"]').first().press('Tab')

  const fields = await readFields(page)
  expect(fields[0].options[0].label).toBe('Sim')
  await expect(page.getByRole('radio', { name: 'Sim' })).toBeVisible()
})

test('time field shows time-specific settings instead of date settings', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-time', name: 'time', label: 'Hora' },
  ])

  await page.locator('[data-field-name="time"] .overlay-preview-element').click()

  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText('Opções de hora')
  await expect(drawer).toContainText('Formato 24h')
  await expect(drawer).toContainText('Exibir segundos')
  await expect(drawer).toContainText('Botão agora')
  await expect(drawer).not.toContainText('Data mínima')
  await expect(drawer).not.toContainText('Datas desabilitadas')
})

test('quasar input settings propagate declared FormKit props to the rendered field', async ({ page }) => {
  await loadBuilder(page, [
    {
      '$formkit': 'q-input',
      'name': 'phone',
      'label': 'Telefone',
      'inputType': 'tel',
      'outlined': true,
      'rounded': true,
      'dark': true,
      'clearable': true,
      'counter': true,
      'loading': true,
      'stackLabel': true,
      'prefix': '+55',
      'suffix': 'BR',
      'mask': '##',
      'fill-mask': true,
      'reverse-fill-mask': true,
      'unmasked-value': true,
    },
  ])

  const field = page.locator('[data-field-name="phone"] .q-field').first()
  await expect(field).toHaveClass(/q-field--outlined/)
  await expect(field).toHaveClass(/q-field--rounded/)
  await expect(field).toHaveClass(/q-field--dark/)
  await expect(field).toContainText('+55')
  await expect(field).toContainText('BR')
  await expect(page.locator('[data-field-name="phone"] .q-spinner')).toBeVisible()
})

test('phone input renders fill-mask in the visible mask', async ({ page }) => {
  await loadBuilder(page, [
    {
      '$formkit': 'q-input',
      'name': 'phone',
      'label': 'Telefone',
      'inputType': 'tel',
      'mask': '(##) #####-####',
      'fill-mask': true,
      'unmasked-value': true,
    },
  ])

  const input = page.locator('[data-field-name="phone"] input').first()
  await expect(input).toHaveValue('(__) _____-____')
  await input.fill('67')
  await expect(input).toHaveValue('(67) _____-____')
})

test('phone mask settings from the drawer persist and update rendered mask behavior', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-input',
      name: 'phone',
      label: 'Telefone',
      inputType: 'tel',
      mask: '(##) #####-####',
    },
  ])

  await page.locator('[data-field-name="phone"] .overlay-preview-element').click()
  const drawer = page.locator('[data-drawer="right"]')
  const input = page.locator('[data-field-name="phone"] input').first()
  await drawer.locator('#input-fill-mask').click()
  await expect(input).toHaveValue('(__) _____-____')
  await drawer.locator('#input-fill-mask').click()
  await expect(input).toHaveValue('')
  await drawer.locator('#input-reverse-fill-mask').click()
  await drawer.locator('#input-unmasked-value').click()

  const fields = await readFields(page)
  expect(fields[0]).toMatchObject({
    'fill-mask': true,
    'reverse-fill-mask': true,
    'unmasked-value': true,
  })

  await page.reload()
  await expect(page.locator('[data-field-name="phone"]')).toHaveCount(1)
  await page.waitForFunction(() => Boolean(document.querySelector('[data-field-name="phone"] input')?.id))
  await expect(input).toHaveValue('(__) _____-____')
  await input.fill('67')
  await expect(input).toHaveValue('(__) _____-__67')

  await input.fill('')
  await expect(input).toHaveValue('(__) _____-____')
  await input.pressSequentially('12345678901234567890')
  const rawValue = (await input.inputValue()).replace(/\D/g, '')
  expect(rawValue).toHaveLength(11)
})

test('matrix table renders themed dividers and supports dynamic rows', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-matrix',
      name: 'matrixTable',
      label: 'Tabela matriz',
      matrixView: 'table',
      table: true,
      rowsMode: 'dynamic',
      initialRows: 1,
      minRows: 1,
      maxRows: 2,
      canAddRows: true,
      canRemoveRows: true,
      columnsConfig: [
        { label: 'Texto', value: 'text', type: 'text', width: 160 },
        { label: 'Ativo', value: 'active', type: 'checkbox', width: 90 },
      ],
    },
  ])

  const matrix = page.locator('[data-field-name="matrixTable"] .matrix-field')
  await expect(matrix).toContainText('Texto')
  await expect(matrix).toContainText('Ativo')
  await expect(matrix.locator('tbody tr')).toHaveCount(1)

  await matrix.getByRole('button', { name: '+ Adicionar' }).evaluate((button: HTMLButtonElement) => button.click())
  await expect(matrix.locator('tbody tr')).toHaveCount(2)
  await expect(matrix.getByRole('button', { name: '+ Adicionar' })).toBeDisabled()

  const styles = await matrix.evaluate((element) => {
    const header = element.querySelector('.matrix-field__column-label')!
    const row = element.querySelector('.matrix-field__row-label')!
    const cell = element.querySelector('.matrix-field__cell')!
    return {
      headerBackground: getComputedStyle(header).backgroundColor,
      rowBackground: getComputedStyle(row).backgroundColor,
      cellBorderTop: getComputedStyle(cell).borderTopWidth,
      cellBorderLeft: getComputedStyle(cell).borderLeftWidth,
    }
  })

  expect(styles.headerBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(styles.rowBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(styles.cellBorderTop).toBe('1px')
  expect(styles.cellBorderLeft).toBe('1px')
})

test('matrix default column type is editable and inherited by default columns', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-matrix',
      name: 'matrix',
      label: 'Matriz',
      matrixView: 'table',
      defaultColumnType: 'time',
      rows,
      columnsConfig: [
        { label: 'Coluna 1', value: 'column_1', type: 'default' },
        { label: 'Coluna 2', value: 'column_2', type: 'default' },
      ],
    },
  ])

  const matrix = page.locator('[data-field-name="matrix"] .matrix-field')
  await expect(matrix.locator('input[type="time"]')).toHaveCount(4)

  await page.locator('[data-field-name="matrix"] .overlay-preview-element').click()
  const drawer = page.locator('[data-drawer="right"]')
  await expect(drawer).toContainText('Tipo padrão')

  await drawer.locator('.q-select').first().click()
  await page.getByRole('option', { name: 'Toggle' }).click()

  const fields = await readFields(page)
  expect(fields[0].defaultColumnType).toBe('toggle')
  await expect(matrix.locator('.q-toggle')).toHaveCount(4)
})

test('matrix table with two columns fits the preview without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await loadBuilder(page, [
    {
      $formkit: 'q-matrix',
      name: 'matrix',
      label: 'Tabela matriz',
      matrixView: 'table',
      rows,
      columnsConfig: [
        { label: 'Coluna 1', value: 'column_1', type: 'default' },
        { label: 'Coluna 2', value: 'column_2', type: 'default' },
      ],
    },
  ])

  const hasOverflow = await page.locator('[data-field-name="matrix"] .matrix-field').evaluate((element) => {
    return element.scrollWidth > element.clientWidth + 1
  })

  expect(hasOverflow).toBe(false)
})

test('preview form keeps a responsive Vueform-like content width', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  const desktopMetrics = await page.locator('.preview-form-container').evaluate((element) => {
    const container = element.getBoundingClientRect()
    const content = element.querySelector('.my-form-wrapper')!.getBoundingClientRect()
    return {
      containerWidth: container.width,
      contentWidth: content.width,
      pageOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })

  expect(desktopMetrics.containerWidth).toBeGreaterThanOrEqual(500)
  expect(desktopMetrics.containerWidth).toBeLessThanOrEqual(520)
  expect(desktopMetrics.contentWidth).toBeGreaterThanOrEqual(420)
  expect(desktopMetrics.contentWidth).toBeLessThanOrEqual(440)
  expect(desktopMetrics.pageOverflows).toBe(false)

  await page.setViewportSize({ width: 360, height: 800 })
  await page.waitForTimeout(300)

  const mobileOverflows = await page.locator('.preview-form-container').evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })

  expect(mobileOverflows).toBe(false)
})

test('drop indicator shows a single horizontal line', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  await expect(page.locator('[data-field-name="first"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('[data-field-name="second"] .preview-element-area-bottom')).toHaveCount(1)
  await expect(page.locator('[data-field-name="second"] .preview-element-area-top')).toHaveCount(1)

  const count = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="first"] .overlay-preview-element')
    const bottom = document.querySelector('[data-field-name="second"] .preview-element-area-bottom')
    const top = document.querySelector('[data-field-name="second"] .preview-element-area-top')
    if (!source || !bottom || !top) throw new Error('drop areas not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    bottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    top.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
    return Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    }).length
  })

  expect(count).toBe(1)
})

test('horizontal drop indicator is centered in the gap between fields', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const metrics = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="first"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="second"] .preview-element-area-top')
    if (!source || !target) throw new Error('drop indicator targets not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const firstRect = document.querySelector('[data-field-name="first"]')!.getBoundingClientRect()
    const secondRect = document.querySelector('[data-field-name="second"]')!.getBoundingClientRect()
    const lineRect = document.querySelector('[data-field-name="second"] .preview-element-label-wrapper__top:not(.hidden)')!.getBoundingClientRect()

    return {
      firstBottom: firstRect.bottom,
      secondTop: secondRect.top,
      lineCenter: lineRect.top + lineRect.height / 2,
    }
  })

  expect(metrics.lineCenter).toBeGreaterThan(metrics.firstBottom)
  expect(metrics.lineCenter).toBeLessThan(metrics.secondTop)
})

test('side drop indicator only appears near field side edges', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const result = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="first"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="second"] .overlay-preview-element')
    if (!source || !target) throw new Error('drop indicator targets not found')

    const visibleClasses = () => Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    }).map(el => el.className)

    const data = new DataTransfer()
    const rect = target.getBoundingClientRect()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)
    const centerClasses = visibleClasses()

    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: rect.right - 2,
      clientY: rect.top + rect.height / 2,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)
    const edgeClasses = visibleClasses()

    return { centerClasses, edgeClasses }
  })

  expect(result.centerClasses).toHaveLength(1)
  expect(result.centerClasses[0]).not.toContain('preview-element-label-wrapper__left')
  expect(result.centerClasses[0]).not.toContain('preview-element-label-wrapper__right')
  expect(result.edgeClasses).toHaveLength(1)
  expect(result.edgeClasses[0]).toContain('preview-element-label-wrapper__right')
})

test('root-only structures always show the guide at the first root position inside valid form areas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
  ])

  const result = await page.evaluate(async () => {
    const tabsSchema = { $formkit: 'q-tabs', name: 'tabs', tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }] }
    const data = new DataTransfer()
    data.setData('text', JSON.stringify(tabsSchema))

    const secondBottom = document.querySelector('[data-field-name="second"] .preview-element-area-bottom')
    const firstRight = document.querySelector('[data-field-name="first"] .preview-element-area-right')
    const firstTop = document.querySelector('[data-field-name="first"] .preview-element-area-top')
    const structureZone = document.querySelector('[data-field-name="container"] .overlay-drop-here')
    const previewContainer = document.querySelector('.preview-form-container')
    if (!secondBottom || !firstRight || !firstTop || !structureZone || !previewContainer) throw new Error('root-only drop areas not found')

    secondBottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    firstRight.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    structureZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleAfterNonTopTargets = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })
    const rootLabelAfterNonTopTargets = firstTop.querySelector('.preview-element-label-wrapper')

    firstTop.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const validVisible = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    const previewRect = previewContainer.getBoundingClientRect()
    previewContainer.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: previewRect.left + 4,
      clientY: previewRect.top + 4,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    const visibleOutsideDropSurface = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      nonTopVisibleCount: visibleAfterNonTopTargets.length,
      nonTopClassName: visibleAfterNonTopTargets[0]?.className || '',
      nonTopText: visibleAfterNonTopTargets[0]?.textContent?.trim() || '',
      nonTopIsRootLabel: rootLabelAfterNonTopTargets === visibleAfterNonTopTargets[0],
      structureZoneVisible: structureZone.classList.contains('overlay-drop-here--highlighted'),
      validVisibleCount: validVisible.length,
      validClassName: validVisible[0]?.className || '',
      validText: validVisible[0]?.textContent?.trim() || '',
      visibleOutsideDropSurface: visibleOutsideDropSurface.length,
    }
  })

  expect(result.nonTopVisibleCount).toBe(1)
  expect(result.nonTopClassName).toContain('preview-element-label-wrapper__top')
  expect(result.nonTopText).toBe('Arraste aqui')
  expect(result.nonTopIsRootLabel).toBe(true)
  expect(result.structureZoneVisible).toBe(false)
  expect(result.validVisibleCount).toBe(1)
  expect(result.validClassName).toContain('preview-element-label-wrapper__top')
  expect(result.validText).toBe('Arraste aqui')
  expect(result.visibleOutsideDropSurface).toBe(0)
})

test('root-only drag markers pin the guide to the first root position and clear it outside drop areas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $el: 'img', name: 'image', src: 'https://placehold.co/640x360', alt: 'Imagem' },
    { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
  ])

  const result = await page.evaluate(async () => {
    const data = new DataTransfer()
    data.setData('application/x-builder-field-type', 'q-stepper')
    data.setData('application/x-builder-root-only', 'true')

    const target = document.querySelector('[data-field-name="heading"] .preview-element-area-bottom')
    const firstTop = document.querySelector('[data-field-name="first"] .preview-element-area-top')
    if (!target || !firstTop) throw new Error('root-only mime guide targets not found')

    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleLabels = () => Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    const labelsWhileInside = visibleLabels()
    const rootLabel = firstTop.querySelector('.preview-element-label-wrapper')

    document.body.dispatchEvent(new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
      clientX: 1,
      clientY: 1,
      dataTransfer: data,
    }))
    await new Promise(requestAnimationFrame)

    return {
      visibleInsideCount: labelsWhileInside.length,
      insideClassName: labelsWhileInside[0]?.className || '',
      insideText: labelsWhileInside[0]?.textContent?.trim() || '',
      insideIsRootLabel: rootLabel === labelsWhileInside[0],
      visibleAfterLeaving: visibleLabels().length,
    }
  })

  expect(result.visibleInsideCount).toBe(1)
  expect(result.insideClassName).toContain('preview-element-label-wrapper__top')
  expect(result.insideText).toBe('Arraste aqui')
  expect(result.insideIsRootLabel).toBe(true)
  expect(result.visibleAfterLeaving).toBe(0)
})

test('catalog fields cannot be inserted above an existing root-only tabs structure', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [{ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }],
        },
        { name: 'tab_2', label: 'Aba 2', children: [] },
      ],
    },
  ])

  const visibleDropIndicators = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="tabs"] > .preview-element-area-top')
    if (!target) throw new Error('tabs top drop target not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const labels = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    return labels.length
  })

  expect(visibleDropIndicators).toBe(0)

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-tabs')
  expect(fields[0].tabs[0].children.map((field: { name: string }) => field.name)).toEqual(['text'])
})

test('root-only structures dragged inside tabs do not show a false nested guide', async ({ page }) => {
  await loadBuilder(page, [
    {
      $formkit: 'q-tabs',
      name: 'tabs',
      tabs: [
        {
          name: 'tab_1',
          label: 'Aba 1',
          children: [
            { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
            { $el: 'h3', name: 'heading', children: 'Lorem ipsum dolor' },
          ],
        },
      ],
    },
  ])

  const result = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="heading"] .preview-element-area-bottom')
    const rootTop = document.querySelector('[data-field-name="tabs"] > .preview-element-area-top')
    if (!target || !rootTop) throw new Error('root-only nested guide targets not found')

    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-stepper', name: 'stepper', steps: [{ name: 'step_1', label: 'Passo 1', children: [] }] }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleLabels = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    const rootLabel = rootTop.querySelector('.preview-element-label-wrapper')

    return {
      visibleCount: visibleLabels.length,
      className: visibleLabels[0]?.className || '',
      text: visibleLabels[0]?.textContent?.trim() || '',
      isRootLabel: rootLabel === visibleLabels[0],
    }
  })

  expect(result.visibleCount).toBe(1)
  expect(result.className).toContain('preview-element-label-wrapper__top')
  expect(result.text).toBe('Arraste aqui')
  expect(result.isRootLabel).toBe(true)
})

test('root-only structures dropped at the root end are placed at the root start', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-stepper', name: 'stepper', steps: [{ name: 'step_1', label: 'Passo 1', children: [] }] },
    '[data-field-name="second"] .preview-element-area-bottom',
  )

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-stepper')
  expect(fields[0].steps[0].children.map((field: { name: string }) => field.name)).toEqual(['first', 'second'])
})

test('dropping a catalog field beside a full-width field creates a 6 by 6 row', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-time', name: 'time', label: 'Hora' },
    '[data-field-name="first"] .preview-element-area-right',
  )

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['first', 'time'])
  expect(fields[0].columns.container).toBe(6)
  expect(fields[1].columns.container).toBe(6)
  await expect(page.locator('[data-field-name="first"]')).toHaveCSS('grid-column-end', 'span 6')
  await expect(page.locator('[data-field-name="time"]')).toHaveCSS('grid-column-end', 'span 6')
})

test('fields with complementary columns render in the same visual row', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'five', label: 'Cinco', inputType: 'text', columns: { container: 5 } },
    { $formkit: 'q-input', name: 'seven', label: 'Sete', inputType: 'text', columns: { container: 7 } },
    { $formkit: 'q-input', name: 'fourA', label: 'Quatro A', inputType: 'text', columns: { container: 4 } },
    { $formkit: 'q-input', name: 'fourB', label: 'Quatro B', inputType: 'text', columns: { container: 4 } },
    { $formkit: 'q-input', name: 'fourC', label: 'Quatro C', inputType: 'text', columns: { container: 4 } },
  ])

  const metrics = await page.evaluate(() => {
    const box = (name: string) => document.querySelector(`[data-field-name="${name}"]`)!.getBoundingClientRect()
    const five = box('five')
    const seven = box('seven')
    const fourA = box('fourA')
    const fourB = box('fourB')
    const fourC = box('fourC')

    return {
      fiveSevenSameRow: Math.abs(five.top - seven.top) < 2 && five.right <= seven.left,
      fourFieldsSameRow: Math.abs(fourA.top - fourB.top) < 2
        && Math.abs(fourB.top - fourC.top) < 2
        && fourA.right <= fourB.left
        && fourB.right <= fourC.left,
    }
  })

  expect(metrics.fiveSevenSameRow).toBe(true)
  expect(metrics.fourFieldsSameRow).toBe(true)
})

test('fields wrap when their columns exceed one row', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'eight', label: 'Oito', inputType: 'text', columns: { container: 8 } },
    { $formkit: 'q-input', name: 'six', label: 'Seis', inputType: 'text', columns: { container: 6 } },
  ])

  const wrapped = await page.evaluate(() => {
    const eight = document.querySelector('[data-field-name="eight"]')!.getBoundingClientRect()
    const six = document.querySelector('[data-field-name="six"]')!.getBoundingClientRect()
    return six.top > eight.bottom
  })

  expect(wrapped).toBe(true)
})

test('moving an existing field to the side preserves the existing column spans', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text', columns: { container: 5 } },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  await dragExistingField(
    page,
    '[data-field-name="second"] .overlay-preview-element',
    '[data-field-name="first"] .preview-element-area-left',
  )

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['second', 'first'])
  expect(fields[0].columns?.container).toBeUndefined()
  expect(fields[1].columns.container).toBe(5)
  await expect(page.locator('[data-field-name="second"]')).toHaveCSS('grid-column-end', 'span 12')
  await expect(page.locator('[data-field-name="first"]')).toHaveCSS('grid-column-end', 'span 5')
})

test('dropping a field into an occupied row redistributes all row columns evenly', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text', columns: { container: 4 } },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text', columns: { container: 4 } },
    { $formkit: 'q-input', name: 'third', label: 'Terceiro', inputType: 'text', columns: { container: 4 } },
  ])

  await dropCatalogField(
    page,
    { $formkit: 'q-time', name: 'time', label: 'Hora' },
    '[data-field-name="first"] .preview-element-area-right',
  )

  const fields = await readFields(page)
  expect(fields.map((field: { name: string }) => field.name)).toEqual(['first', 'time', 'second', 'third'])
  expect(fields.map((field: { columns: { container: number } }) => field.columns.container)).toEqual([3, 3, 3, 3])

  for (const fieldName of ['first', 'time', 'second', 'third']) {
    await expect(page.locator(`[data-field-name="${fieldName}"]`)).toHaveCSS('grid-column-end', 'span 3')
  }
})

test('resize updates the field width while dragging before mouseup', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number', columns: { container: 12 } },
  ])

  await page.locator('[data-field-name="number"] .overlay-preview-element').click()
  const resizerBox = await page.locator('[data-field-name="number"] .preview-element-resizer').boundingBox()
  const wrapperBox = await page.locator('.my-form-wrapper').boundingBox()
  if (!resizerBox || !wrapperBox) throw new Error('resize handles not found')

  const startX = resizerBox.x + resizerBox.width / 2
  const startY = resizerBox.y + resizerBox.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX - wrapperBox.width / 12, startY)
  await page.waitForTimeout(50)

  await expect(page.locator('[data-field-name="number"]')).toHaveCSS('grid-column-end', 'span 11')
  await page.mouse.up()
})
