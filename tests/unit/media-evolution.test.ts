import { readFileSync } from 'node:fs'
import { createMessage, createNode } from '@formkit/core'
import { describe, expect, it } from 'vitest'
import { applyQfbExternalErrors } from '../../src/runtime/app/utils/fieldErrors'
import { extractFormData } from '../../src/runtime/utils/formData'
import { createQfbMediaError, QfbMediaError } from '../../src/runtime/utils/mediaErrors'
import { validateMediaSelection } from '../../src/runtime/utils/mediaPolicy'
import { createQfbSchemaError, QfbSchemaError, validateQfbSchema } from '../../src/runtime/utils/schemaIdentity'
import { walkQfbSchemaStructure } from '../../src/runtime/utils/schemaStructure'

const fixtures = JSON.parse(readFileSync(new URL('../fixtures/gmf-media-structures.json', import.meta.url), 'utf8')) as Array<{ name: string, schema: any[], expectedPath: string[] }>
const fieldId = '11111111-1111-4111-8111-111111111111'

describe('shared structural contract', () => {
  it.each(fixtures)('extracts $name with the same collector address', ({ schema, expectedPath }) => {
    const path = expectedPath.map(segment => segment === '*' ? '0' : segment)
    const value = { version: 1, clientId: 'client', name: 'photo.png', mimeType: 'image/png', size: 10 }
    const values: Record<string, any> = {}
    let target = values
    path.forEach((segment, index) => {
      if (index === path.length - 1) target[segment] = value
      else target = target[segment] = /^\d+$/.test(path[index + 1]!) ? [] : {}
    })
    expect(extractFormData(schema, values).answers).toContainEqual(expect.objectContaining({ fieldId, fieldPath: path, value }))
  })

  it('keeps all repeated contexts and compares UUIDs without case distinctions', () => {
    const schema = fixtures.find(fixture => fixture.name === 'list-repeated-group')!.schema
    const contexts = [0, 1].map(index => ({ fieldId: fieldId.toUpperCase(), fieldPath: ['itens', String(index), 'foto'] }))
    const answers = extractFormData(schema, { itens: [{ foto: 'first' }, { foto: 'second' }] }, { fieldContexts: contexts }).answers
    expect(answers.map(answer => [answer.fieldPath, answer.value])).toEqual([[contexts[0]!.fieldPath, 'first'], [contexts[1]!.fieldPath, 'second']])
    const original = { $formkit: 'q-file', name: 'photo', fieldId }
    expect(validateQfbSchema([original, { ...original, name: 'second', fieldId: fieldId.toUpperCase() }])).toContainEqual(expect.objectContaining({ code: 'duplicate-id' }))
  })

  it('uses filled aliases, reports divergence, and does not visit option objects', () => {
    const ids: string[] = []
    const issues: any[] = []
    walkQfbSchemaStructure([{ $formkit: 'q-container', name: 'group', children: [], attrs: { structureChildren: [{ $formkit: 'q-file', name: 'photo', fieldId }] }, options: [{ name: 'fake', fieldId: 'fake' }] }], node => ids.push(node.name), issues)
    expect(ids).toEqual(['group', 'photo'])
    expect(issues).toEqual([])
    expect(validateQfbSchema([{ $formkit: 'q-container', name: 'group', fieldId, children: [{ $formkit: 'q-file', name: 'a' }], structureChildren: [{ $formkit: 'q-file', name: 'b' }] }], false)).toContainEqual(expect.objectContaining({ code: 'AMBIGUOUS_SCHEMA_CHILDREN' }))
  })
})

describe('public error and validation contracts', () => {
  it('retains constructor, instanceof and Error compatibility', () => {
    for (const error of [new QfbMediaError('storage', 'bytes preserved'), createQfbMediaError('storage', 'bytes preserved')]) {
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(QfbMediaError)
      expect(error.description.code).toBe('storage')
    }
    for (const error of [new QfbSchemaError([]), createQfbSchemaError([])]) expect(error).toBeInstanceOf(QfbSchemaError)
  })

  it('applies historical field limits to confirmed media and current policy to new files', () => {
    const value = { version: 1 as const, clientId: 'client', documentId: 'doc', name: 'photo.png', mimeType: 'image/png', size: 100 }
    const policy = { maxFileSize: 1, allowedMimeTypes: ['audio/wav'], allowedExtensions: ['.wav'] }
    const field = { fieldId, fieldPath: ['photo'] }
    expect(() => validateMediaSelection([value], policy, {}, field)).not.toThrow()
    expect(() => validateMediaSelection([{ ...value, documentId: undefined }], policy, {}, field)).toThrow()
    expect(() => validateMediaSelection([value], undefined, { maxFileSize: 50 }, field)).toThrow()
    expect(() => validateMediaSelection([{ ...value, durationMs: 2000 }], undefined, { maxDurationSeconds: 1 }, field)).toThrow('duração')
  })

  it('replaces only external errors at actual list addresses', async () => {
    const root = createNode({ type: 'group', name: 'form' })
    const list = createNode({ type: 'list', name: 'items', parent: root })
    const row = createNode({ type: 'group', parent: list })
    const photo = createNode({ name: 'photo', props: { type: 'q-file' }, parent: row })
    photo.store.set(createMessage({ key: 'validation', type: 'error', value: 'Internal', meta: { source: 'validation' } }))
    applyQfbExternalErrors(root, [], [{ fieldPath: ['items', '0', 'photo', '1'], messages: ['File error'] }])
    expect(Object.values(photo.store).map(message => message.value)).toContain('File error [1]')
    applyQfbExternalErrors(root)
    expect(Object.values(photo.store).map(message => message.value)).toEqual(['Internal'])
    root.destroy()
  })
})
