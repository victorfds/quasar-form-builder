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
  { group: 'statics', schema: { $el: 'hr', name: 'separator', attrs: { class: 'q-my-sm', style: 'border: none; height: 1px; background-color: #aaa;' } } },
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

test.describe('builder component parity smoke', () => {
  for (const item of componentSchemas) {
    test(`${item.group}: mounts ${item.schema.name}`, async ({ page }) => {
      await loadBuilder(page, [item.schema])
      await expectSchemaMounted(page, item.schema)
    })
  }
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
  await expect(page.locator('[data-field-name="container"] .structure-drop-zone')).toBeVisible()

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

  await dropCatalogField(page, tabsSchema, '[data-field-name="first"] .preview-element-area-bottom')
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

  await dropCatalogField(page, stepperSchema, '[data-field-name="second"] .preview-element-area-bottom')
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

test('tabs cannot be dropped inside structures', async ({ page }) => {
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
  expect(fields[0].name).toBe('container')
  expect(fields[0].children || []).toHaveLength(0)
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

test('grid structure drop zones are scoped to each column block', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-grid', name: 'twoColumns', rowsCount: 1, columnsCount: 2, cells: [] },
  ])

  const metrics = await page.evaluate(() => {
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
  await expect(page.locator('[data-field-name="grid"] .structure-grid__cell .structure-drop-zone').first()).toBeVisible()

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

test('table accepts existing fields inside a specific cell', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-table-structure', name: 'table', rows, columnsConfig, cells: [] },
    { $formkit: 'q-input', name: 'text', label: 'Texto', inputType: 'text' },
  ])

  await expect(page.locator('[data-field-name="text"] .overlay-preview-element')).toHaveCount(1)
  await expect(page.locator('[data-field-name="table"] .structure-table__cell .structure-drop-zone').first()).toBeVisible()

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

test('root-only structures only show a guide at the first root position', async ({ page }) => {
  await loadBuilder(page, [
    { $formkit: 'q-input', name: 'first', label: 'Primeiro', inputType: 'text' },
    { $formkit: 'q-input', name: 'second', label: 'Segundo', inputType: 'text' },
  ])

  const result = await page.evaluate(async () => {
    const tabsSchema = { $formkit: 'q-tabs', name: 'tabs', tabs: [{ name: 'tab_1', label: 'Aba 1', children: [] }] }
    const data = new DataTransfer()
    data.setData('text', JSON.stringify(tabsSchema))

    const secondBottom = document.querySelector('[data-field-name="second"] .preview-element-area-bottom')
    const firstRight = document.querySelector('[data-field-name="first"] .preview-element-area-right')
    const firstTop = document.querySelector('[data-field-name="first"] .preview-element-area-top')
    if (!secondBottom || !firstRight || !firstTop) throw new Error('root-only drop areas not found')

    secondBottom.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    firstRight.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const invalidVisibleCount = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    }).length

    firstTop.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: data }))
    await new Promise(requestAnimationFrame)

    const validVisible = Array.from(document.querySelectorAll('.preview-element-label-wrapper')).filter((el) => {
      const style = window.getComputedStyle(el)
      return !el.classList.contains('hidden') && style.display !== 'none' && style.visibility !== 'hidden'
    })

    return {
      invalidVisibleCount,
      validVisibleCount: validVisible.length,
      validClassName: validVisible[0]?.className || '',
    }
  })

  expect(result.invalidVisibleCount).toBe(0)
  expect(result.validVisibleCount).toBe(1)
  expect(result.validClassName).toContain('preview-element-label-wrapper__top')
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

test('moving an existing field to the side preserves the target width and fills the remaining columns', async ({ page }) => {
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
  expect(fields[0].columns.container).toBe(7)
  expect(fields[1].columns.container).toBe(5)
  await expect(page.locator('[data-field-name="second"]')).toHaveCSS('grid-column-end', 'span 7')
  await expect(page.locator('[data-field-name="first"]')).toHaveCSS('grid-column-end', 'span 5')
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
