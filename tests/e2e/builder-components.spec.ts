import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

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

  await treePanel.getByRole('treeitem', { name: 'text Texto', exact: true }).click()
  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveClass(/__active/)
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

  await page.locator('[data-field-name="hidden"] .overlay-preview-element').click()
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
  await expect(page.locator('[data-drawer="right"]')).toContainText('Tipo padrão')

  const configItems = page.locator('[data-drawer="right"] .matrix-config-item')
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

  await page.locator('.structure-tabs .q-tab').filter({ hasText: 'Aba 2' }).click()

  await expect(page.locator('[data-drawer="right"]')).toContainText('Aba 2')
  await expect(page.locator('[data-drawer="right"]')).toContainText('Condições')
  await expect(page.locator('.structure-tabs .q-tab').filter({ hasText: 'Aba 2' })).toHaveClass(/structure-tabs__tab--selected/)

  await page.locator('[data-drawer="right"] input').first().fill('Dados')
  const fields = await readFields(page)
  expect(fields[0].tabs[1].label).toBe('Dados')
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
  await expect(page.locator('[data-field-name="container"] .structure-drop-zone')).toBeHidden()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="container"] .structure-drop-zone')
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

test('tabs dropped over structures are placed at the root start instead of inside the structure', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
  ])

  await dropCatalogField(page, {
    $formkit: 'q-tabs',
    name: 'tabs',
    tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }],
  }, '[data-field-name="container"] .structure-drop-zone')

  const fields = await readFields(page)
  expect(fields).toHaveLength(1)
  expect(fields[0].$formkit).toBe('q-tabs')
  expect(fields[0].tabs[0].children[0].name).toBe('container')
  expect(fields[0].tabs[0].children[0].children || []).toHaveLength(0)
})

test('list structures accept existing fields dropped into their empty canvas', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-list-structure', name: 'list', label: 'Lista', nested: false, children: [] },
    { $formkit: 'q-list-structure', name: 'nestedList', label: 'Lista aninhada', nested: true, children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
    { $formkit: 'q-input', name: 'number', label: 'Número', inputType: 'number' },
  ])

  await dragExistingField(page, '[data-field-name="text"] .overlay-preview-element', '[data-field-name="list"] .structure-drop-zone')
  await dragExistingField(page, '[data-field-name="number"] .overlay-preview-element', '[data-field-name="nestedList"] .structure-drop-zone')

  const fields = await readFields(page)
  expect(fields).toHaveLength(2)
  expect(fields[0].children[0].name).toBe('text')
  expect(fields[1].children[0].name).toBe('number')
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

  await dropCatalogField(page, { $formkit: 'q-input', name: 'containerText', label: 'No container', inputType: 'text' }, '[data-field-name="container"] .structure-drop-zone')
  await dropCatalogField(page, { $formkit: 'q-input', name: 'listText', label: 'Na lista', inputType: 'text' }, '[data-field-name="list"] .structure-drop-zone')
  await dropCatalogField(page, { $formkit: 'q-input', name: 'gridText', label: 'No grid', inputType: 'text' }, '[data-field-name="grid"] .structure-grid__cell .structure-drop-zone')

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

test('structure body drop indicator is shown while dragging over a child structure', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
  ])

  await expect(page.locator('[data-field-name="container"] .structure-drop-zone')).toBeHidden()

  const isVisible = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="container"] .structure-drop-zone')
    if (!target) throw new Error('container structure drop zone not found')
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const style = window.getComputedStyle(target)
    return target.classList.contains('structure-drop-zone--visible')
      && target.classList.contains('structure-drop-zone--active')
      && style.display !== 'none'
      && style.visibility !== 'hidden'
  })

  expect(isVisible).toBe(true)
})

test('structure body drop indicator is cleared when the item is dropped outside the form', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-container', name: 'container', label: 'Container', children: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  const result = await page.evaluate(async () => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="container"] .structure-drop-zone')
    if (!source || !target) throw new Error('container drag target not found')
    const data = new DataTransfer()
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)
    const visibleDuringDrag = target.classList.contains('structure-drop-zone--visible')

    document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    return {
      visibleDuringDrag,
      visibleAfterOutsideDrop: target.classList.contains('structure-drop-zone--visible'),
      visibility: window.getComputedStyle(target).visibility,
    }
  })

  expect(result.visibleDuringDrag).toBe(true)
  expect(result.visibleAfterOutsideDrop).toBe(false)
  expect(result.visibility).toBe('hidden')
})

test('grid structure drop zones are scoped to each column block', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] },
  ])

  await expect(page.locator('[data-field-name="twoColumns"] .structure-grid__cell .structure-drop-zone').first()).toBeHidden()

  const metrics = await page.evaluate(async () => {
    const target = document.querySelector('[data-field-name="twoColumns"] .structure-grid__cell .structure-drop-zone')
    if (!target) throw new Error('grid drop zone not found')
    const data = new DataTransfer()
    data.setData('text', JSON.stringify({ $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' }))
    target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const cells = Array.from(document.querySelectorAll('[data-field-name="twoColumns"] .structure-grid__cell'))
    const zones = Array.from(document.querySelectorAll('[data-field-name="twoColumns"] .structure-grid__cell .structure-drop-zone'))

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
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(2) .structure-drop-zone',
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
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(1) .structure-drop-zone',
  )

  let fields = await readFields(page)
  let innerGrid = fields[0].cells[0].children[0]
  expect(innerGrid.name).toBe('innerGrid')
  expect(innerGrid.cells.every((cell: { children?: unknown[] }) => !cell.children?.length)).toBe(true)
  await expect(page.locator('[data-field-name="blockedGrid"]')).toHaveCount(0)

  await dropCatalogField(
    page,
    { $formkit: 'q-input', name: 'allowedText', label: 'Permitido', inputType: 'text' },
    '[data-field-name="innerGrid"] .structure-grid__cell:nth-child(1) .structure-drop-zone',
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

  for (const fieldName of ['container', 'list', 'grid', 'table']) {
    await page.locator(`[data-field-name="${fieldName}"] > .preview-structure-select-handle`).click()
    await expect(page.locator('[data-drawer="right"]')).toContainText(fieldName)
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

  await page.locator('[data-field-name="container"] > .preview-structure-select-handle').click()
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

  await dropCatalogField(page, {
    $formkit: 'q-stepper',
    name: 'stepper',
    steps: [{ name: 'step_1', label: 'Passo 1', children: [] }],
  }, '.q-stepper .overlay-drop-here')

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
  await expect(page.locator('[data-field-name="grid"] .structure-grid__cell .structure-drop-zone').first()).toBeHidden()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="grid"] .structure-grid__cell .structure-drop-zone')
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
    '[data-field-name="grid"] .structure-grid__cell .structure-drop-zone',
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

    const zone = cell.querySelector('.structure-drop-zone')
    const visibleLabels = Array.from(document.querySelectorAll('[data-field-name="insideGrid"] .preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      replacementVisible: target.classList.contains('__replace-target'),
      replacementIconVisible: Boolean(document.querySelector('[data-field-name="insideGrid"] .preview-cell-replace-indicator')),
      cellZoneVisible: zone?.classList.contains('structure-drop-zone--visible') ?? false,
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
  await expect(page.locator('[data-field-name="table"] .structure-table__cell .structure-drop-zone').first()).toBeHidden()

  await page.evaluate(() => {
    const source = document.querySelector('[data-field-name="text"] .overlay-preview-element')
    const target = document.querySelector('[data-field-name="table"] .structure-table__cell .structure-drop-zone')
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

test('root-only structures always show the guide at the first root position', async ({ page }) => {
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
    const structureZone = document.querySelector('[data-field-name="container"] .structure-drop-zone')
    if (!secondBottom || !firstRight || !firstTop || !structureZone) throw new Error('root-only drop areas not found')

    secondBottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    firstRight.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    structureZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const visibleAfterInvalidTargets = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    firstTop.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const validVisible = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      invalidVisibleCount: visibleAfterInvalidTargets.length,
      invalidClassName: visibleAfterInvalidTargets[0]?.className || '',
      validVisibleCount: validVisible.length,
      validClassName: validVisible[0]?.className || '',
    }
  })

  expect(result.invalidVisibleCount).toBe(1)
  expect(result.invalidClassName).toContain('preview-element-label-wrapper__top')
  expect(result.validVisibleCount).toBe(1)
  expect(result.validClassName).toContain('preview-element-label-wrapper__top')
})

test('root-only structures dropped at the root end are inserted at the root start', async ({ page }) => {
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
