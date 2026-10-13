import type { FormKitNode } from '@formkit/core'
import { createNode } from '@formkit/core'
import { defaultConfig, FormKit, plugin, resetCount, ssrComplete } from '@formkit/vue'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createFormKitIdPlugin } from '../../src/runtime/app/composables/formkitId'

async function renderForm(options: { id?: string, formId?: string, formName?: string, copies?: number, async?: boolean, idPrefix?: string, type?: 'text' | 'checkbox' } = {}) {
  const nodes: FormKitNode[] = []
  const forms: FormKitNode[] = []
  const fieldId = '11111111-1111-4111-8111-111111111111'
  const field = () => h(FormKit, {
    type: options.type || 'text',
    name: 'name',
    label: 'Name',
    id: options.id,
    options: options.type === 'checkbox' ? ['First', 'Second'] : undefined,
    fieldId,
    onNode: (node: FormKitNode) => nodes.push(node),
  })
  const AsyncField = defineComponent({
    async setup() {
      await Promise.resolve()
      return field
    },
  })
  const form = () => h(FormKit, { type: 'form', actions: false, id: options.formId, name: options.formName, onNode: (node: FormKitNode) => forms.push(node) }, { default: () => [options.async ? h(AsyncField) : field()] })
  const app = createSSRApp({ render: () => h('main', Array.from({ length: options.copies || 1 }, form)) })
  if (options.idPrefix) app.config.idPrefix = options.idPrefix
  const config = defaultConfig()
  config.plugins = [createFormKitIdPlugin(), ...(config.plugins || [])]
  app.use(plugin, config)
  try {
    const html = await renderToString(app)
    return {
      html,
      ids: nodes.map(node => node.props.id),
      fieldIds: nodes.map(node => node.props.attrs?.fieldId),
      fieldNames: nodes.map(node => node.name),
      formNames: forms.map(node => node.name),
      formIds: forms.map(node => node.props.id),
    }
  }
  finally {
    resetCount()
    ssrComplete(app)
  }
}

describe('formkit SSR identity', () => {
  it.each([false, true])('keeps generated IDs stable across concurrent requests (async=%s)', async (async) => {
    const results = await Promise.all(Array.from({ length: 8 }, () => renderForm({ async })))
    expect(results[0]!.ids).toHaveLength(1)
    for (const result of results) {
      expect(result.ids).toEqual(results[0]!.ids)
      expect(result.formNames).toEqual(results[0]!.formNames)
      expect(result.fieldNames).toEqual(['name'])
      expect(result.ids[0]).toMatch(/^qfb-v-/)
      expect(result.html).toContain(`for="${result.ids[0]}"`)
      expect(result.html).toContain(`id="${result.ids[0]}"`)
      expect(result.fieldIds).toEqual(['11111111-1111-4111-8111-111111111111'])
    }
  })

  it.each(['provided-id', 'input_1'])('preserves an explicit consumer ID %s', async (id) => {
    expect((await renderForm({ id })).ids).toEqual([id])
  })

  it('preserves explicit form IDs and names', async () => {
    const result = await renderForm({ formId: 'provided-form', formName: 'response' })
    expect(result.formIds).toEqual(['provided-form'])
    expect(result.formNames).toEqual(['response'])
    const automaticName = await renderForm({ formId: 'provided-form' })
    expect(automaticName.formIds).toEqual(['provided-form'])
    expect(automaticName.formNames).toEqual(['qfb-v-0-form'])
  })

  it('assigns IDs before input features derive option IDs', async () => {
    const results = await Promise.all(Array.from({ length: 4 }, () => renderForm({ type: 'checkbox' })))
    for (const result of results) {
      expect(result.ids).toEqual(results[0]!.ids)
      for (const option of ['first', 'second']) {
        expect(result.html).toContain(`id="${result.ids[0]}-option-${option}"`)
      }
    }
  })

  it('keeps simultaneous forms distinct and respects the Vue application ID prefix', async () => {
    const result = await renderForm({ copies: 2, idPrefix: 'consumer' })
    expect(new Set(result.ids).size).toBe(2)
    expect(result.ids.every(id => String(id).startsWith('qfb-consumer-'))).toBe(true)
  })

  it('leaves programmatic nodes outside Vue unchanged', () => {
    const node = createNode({ name: 'programmatic', plugins: [createFormKitIdPlugin()] })
    try {
      expect(node.props.id).toMatch(/^input_\d+$/)
    }
    finally {
      node.destroy()
    }
  })
})
