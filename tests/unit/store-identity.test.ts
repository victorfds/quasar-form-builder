import { createPinia, setActivePinia } from 'pinia'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFormHistoryStore } from '../../src/runtime/app/stores/formHistoryStore'
import { useFormStore } from '../../src/runtime/app/stores/formStore'

const { stored } = vi.hoisted(() => ({ stored: new Map<string, string>() }))
vi.mock('quasar', () => ({ useQuasar: () => ({ notify: vi.fn() }) }))
vi.mock('../../src/runtime/app/utils/storageConfig', () => ({
  getFormBuilderStorageConfig: () => ({ formFieldsKey: 'fields' }),
}))
vi.mock('../../src/runtime/app/utils/browserStorage', () => ({
  getBrowserStorageItem: (key: string) => stored.get(key) || null,
  getBrowserJsonItem: (key: string, fallback: unknown) => (stored.has(key) ? JSON.parse(stored.get(key)!) : fallback),
  setBrowserStorageItem: (key: string, value: string) => stored.set(key, value),
}))

describe('builder domain identity and history', () => {
  beforeEach(() => {
    stored.clear()
    setActivePinia(createPinia())
  })
  it('preserves selection and identity across atomic rename, move, undo and redo', () => {
    const store = useFormStore()
    const history = useFormHistoryStore()
    store.setFormFields([
      { $formkit: 'q-input', name: 'question' },
      { $formkit: 'q-input', name: 'dependent', if: '$question == "question"' },
    ])
    const id = store.getFieldByName('question')?.fieldId
    assert(id)
    store.setActiveField(store.getFieldById(id))
    expect(store.updateNameField('question', 'renamed')).toBeUndefined()
    expect(store.activeField?.fieldId).toBe(id)
    expect(store.getFieldByName('dependent')?.if).toContain('$renamed == "question"')
    store.setFormFields(JSON.parse(history.goBack()))
    expect(store.getFieldById(id)?.name).toBe('question')
    store.setFormFields(JSON.parse(history.goForward()))
    expect(store.getFieldById(id)?.name).toBe('renamed')
    store.moveFieldToList('renamed', 'root', 2)
    expect(store.getFieldById(id)?.fieldId).toBe(id)
    expect(store.getFieldLocationById(id)?.index).toBe(1)
  })
  it('does not partially rename a definition with unresolved conditions', () => {
    const store = useFormStore()
    store.setFormFields([
      { $formkit: 'q-input', name: 'question' },
      { $formkit: 'q-input', name: 'dependent', if: '$missing == 1' },
    ])
    const before = JSON.stringify(store.formFields)
    expect(store.updateNameField('question', 'renamed')).toBeInstanceOf(Error)
    expect(JSON.stringify(store.formFields)).toBe(before)
    expect(() => store.exportSchema()).toThrow('Unresolved')
  })
  it('duplicates complete steps in two passes with fresh IDs and copied sibling references', () => {
    const store = useFormStore()
    store.setFormFields([
      {
        $formkit: 'q-stepper',
        name: 'steps',
        steps: [
          {
            name: 'step_1',
            children: [
              { $formkit: 'q-input', name: 'first', if: '$second == "second"' },
              { $formkit: 'q-input', name: 'second', if: '$first == 1' },
            ],
          },
        ],
      },
    ])
    const steps = store.formFields[0]?.steps
    assert(steps?.[0])
    const original = JSON.parse(JSON.stringify(steps[0]))
    store.duplicateStep('step_1')
    const copied = store.formFields[0]?.steps?.[1]
    assert(copied?.children?.[0] && copied.children[1])
    expect(copied.fieldId).not.toBe(original.fieldId)
    expect(copied.children[0]!.fieldId).not.toBe(original.children[0].fieldId)
    expect(copied.children[0]!.if).toContain('$second_1 == "second"')
    expect(copied.children[1]!.if).toContain('$first_1 == 1')
  })
  it('drops the abandoned redo branch after an edit following undo', () => {
    const store = useFormStore()
    const history = useFormHistoryStore()
    store.setFormFields([{ $formkit: 'q-input', name: 'question' }])
    const id = store.getFieldByName('question')?.fieldId
    assert(id)
    store.updateNameField('question', 'second')
    store.setFormFields(JSON.parse(history.goBack()))
    store.updateNameField('question', 'different')
    expect(history.isForwardDisabled()).toBe(true)
    store.setFormFields(JSON.parse(history.goBack()))
    expect(store.getFieldById(id)?.name).toBe('question')
    store.setFormFields(JSON.parse(history.goForward()))
    expect(store.getFieldById(id)?.name).toBe('different')
  })
})
