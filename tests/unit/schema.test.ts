import { compile } from '@formkit/core'
import { empty } from '@formkit/utils'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { parseLogic, saveLogic } from '../../src/runtime/app/utils/formUtils'
import { extractFormData } from '../../src/runtime/utils/formData'
import {
  normalizeQfbConditions,
  removeQfbConditionsReferencing,
  transformQfbExpression,
  validateQfbConditions,
} from '../../src/runtime/utils/schemaExpressions'
import {
  adoptQfbSchema,
  cloneQfbSchemaAsTemplate,
  duplicateQfbSchema,
  renameQfbField,
  validateQfbSchema,
  walkQfbSchema,
} from '../../src/runtime/utils/schemaIdentity'

describe('schema identity', () => {
  it.each(['__proto__', 'constructor', 'prototype'])('rejects reserved field name %s', (name) => {
    expect(() => adoptQfbSchema([{ $formkit: 'q-input', name }])).toThrow('Reserved')
  })
  it('duplicates named HTML fields with unique names as well as identities', () => {
    const fields = adoptQfbSchema([{ $el: 'p', name: 'paragraph', children: 'Text' }]).fields
    const copied = duplicateQfbSchema(fields, ['paragraph']).fields
    expect(copied[0]!.name).toBe('paragraph_1')
    expect(copied[0]!.fieldId).not.toBe(fields[0]!.fieldId)
  })
  it('adopts reactive definitions once and preserves identities on round trips', () => {
    const original = reactive([
      {
        $formkit: 'q-container',
        name: 'group',
        children: [{ $formkit: 'q-input', name: 'answer', label: 'Original question' }],
      },
    ])
    const adopted = adoptQfbSchema(original)
    expect(adopted.changed).toBe(true)
    expect(original[0]).not.toHaveProperty('fieldId')
    expect(adoptQfbSchema(adopted.fields)).toEqual({ fields: adopted.fields, changed: false })
    expect(validateQfbSchema(adopted.fields)).toEqual([])
  })
  it('rejects duplicated identities and globally ambiguous input names', () => {
    const fields = adoptQfbSchema([{ $formkit: 'q-input', name: 'first' }]).fields
    expect(() => adoptQfbSchema([...fields, ...fields])).toThrow('Duplicate')
    const diagnostic = validateQfbSchema([...fields, { ...fields[0], name: 'second' }])[0]!
    expect(diagnostic.code).toBe('duplicate-id')
    expect(diagnostic.message).not.toContain(fields[0]!.fieldId)
    expect(diagnostic.message).toContain('second')
    expect(() =>
      adoptQfbSchema([
        { $formkit: 'q-input', name: 'same' },
        { $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-input', name: 'same' }] },
      ]),
    ).toThrow('Duplicate field name')
  })
  it('assigns independent identities to steps, tabs and layout cells', () => {
    const { fields } = adoptQfbSchema([
      {
        $formkit: 'q-stepper',
        name: 'steps',
        steps: [
          {
            name: 'step_1',
            children: [
              {
                $formkit: 'q-grid',
                name: 'grid',
                cells: [{ name: '0__0', children: [{ $formkit: 'q-input', name: 'text' }] }],
              },
            ],
          },
        ],
      },
    ])
    const ids: string[] = []
    walkQfbSchema(fields, field => ids.push(field.fieldId))
    expect(ids).toHaveLength(5)
    expect(new Set(ids).size).toBe(ids.length)
    const copied = cloneQfbSchemaAsTemplate(fields)
    walkQfbSchema(copied, field => expect(ids).not.toContain(field.fieldId))
  })
  it('renames atomically across all condition types and preserves literals and old schemas', () => {
    const fields = adoptQfbSchema([
      { $formkit: 'q-input', name: 'old', label: 'Original question' },
      {
        $formkit: 'q-input',
        name: 'dependent',
        if: '$old == "old"',
        validation: { if: '$empty($old)', then: 'required', else: '' },
        disabled: { if: '$old != "do not replace old"', then: true, else: false },
        readonly: { if: '!$empty($old)', then: true, else: false },
      },
    ]).fields
    const id = fields[0]!.fieldId
    const renamed = renameQfbField(fields, id, 'new')
    expect(renamed[0]!.fieldId).toBe(id)
    expect(renamed[1]!.if).toContain('$new == "old"')
    expect(renamed[1]!.disabled!.if).toContain('"do not replace old"')
    expect(renamed[1]!.readonly!.if).toContain('$empty($new) == false')
    expect(fields[0]!.name).toBe('old')
    expect(fields[0]!.label).toBe('Original question')
    expect(validateQfbConditions(renamed)).toEqual([])
    const unresolved = [{ ...fields[0] }, { ...fields[1], if: '$missing == 1' }]
    expect(() => renameQfbField(unresolved, id, 'new')).toThrow('Unresolved')
  })
  it('copies sibling references in two passes while preserving external references', () => {
    const fields = adoptQfbSchema([
      {
        $formkit: 'q-container',
        name: 'group',
        children: [
          { $formkit: 'q-input', name: 'a', if: '$b == "b" || $external == 1' },
          { $formkit: 'q-input', name: 'b', if: '$a == 2' },
        ],
      },
    ]).fields
    const result = duplicateQfbSchema(fields, ['group', 'a', 'b', 'external'])
    const children = result.fields[0]!.children
    expect(children[0]!.if).toContain('$b_1 == "b"')
    expect(children[0]!.if).toContain('$external == 1')
    expect(children[1]!.if).toContain('$a_1 == 2')
    expect(result.fields[0]!.fieldId).not.toBe(fields[0]!.fieldId)
    expect(fields[0]!.children[0]!.name).toBe('a')
  })
})

describe('conditions and value addresses', () => {
  it('removes only parsed references, including nested fields and attributes, preserving literals', () => {
    const fields = adoptQfbSchema([
      { $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-input', name: 'text' }] },
      { $formkit: 'q-input', name: 'other' },
      { $formkit: 'q-input', name: 'literal', if: '$other == "text"' },
      { $formkit: 'q-input', name: 'nested', if: '$group.text == 1', attrs: { readonly: { if: '$group.text != 2', then: true, else: false } } },
      { $formkit: 'q-input', name: 'dependent', validation: { if: '$text == 1', then: 'required', else: 'email' } },
    ]).fields
    removeQfbConditionsReferencing(fields, 'text')
    expect(fields[2]!.if).toBe('$other == "text"')
    expect(fields[3]!.if).toBeUndefined()
    expect(fields[3]!.attrs!.readonly).toBe(false)
    expect(fields[4]!.validation).toBe('email')
  })
  it('does not interpret data objects or option values as schema conditions', () => {
    const fields = adoptQfbSchema([
      { $formkit: 'q-input', name: 'old' },
      {
        $formkit: 'q-select',
        name: 'dependent',
        if: '$old == 1',
        value: { if: '$old == 2', name: 'fake' },
        options: [{ label: 'Literal', value: { if: '$old == 3' } }],
      },
    ]).fields
    const renamed = renameQfbField(fields, fields[0]!.fieldId, 'new')
    expect(renamed[1]!.if).toContain('$new')
    expect(renamed[1]!.value!.if).toBe('$old == 2')
    expect(renamed[1]!.options![0]!.value.if).toBe('$old == 3')
    expect(validateQfbConditions([{ ...fields[1], if: '$fake == 1' }])[0]?.message).toContain('Unresolved')
  })
  it('reopens conditions after AST rewriting and does not rename unrelated object properties', () => {
    const fields = adoptQfbSchema([
      { $formkit: 'q-container', name: 'group', children: [{ $formkit: 'q-input', name: 'old' }] },
      { $formkit: 'q-matrix', name: 'matrix' },
      {
        $formkit: 'q-input',
        name: 'dependent',
        if: '($old == "old" || $group.old == 1) && $matrix.old == 2 && $old != 3',
      },
    ]).fields
    const child = fields[0]!.children![0]! as Record<string, any>
    const renamed = renameQfbField(fields, child.fieldId, 'new')
    const expression = renamed[2]!.if
    expect(expression).toContain('$group.new')
    expect(expression).toContain('$matrix.old')
    expect(parseLogic(expression)).toHaveLength(3)
  })
  it('makes legacy not-empty expressions work for arrays with the actual FormKit compiler', () => {
    const schema = { if: '(!$empty($files) || $text == "!$empty($files)") && $allowed == true' }
    const normal = normalizeQfbConditions(schema)
    const evaluate = (files: unknown) => {
      const data: Record<string, unknown> = { files, text: '', allowed: true, empty }
      return compile(normal.if).provide(tokens =>
        Object.fromEntries(tokens.map(token => [token, () => data[token]])),
      )()
    }
    expect(evaluate([])).toBe(false)
    expect(evaluate(null)).toBe(false)
    expect(evaluate([{ name: 'file' }])).toBe(true)
    expect(normal.if).toContain('"!$empty($files)"')
    expect(schema.if).toContain('!$empty($files)')
  })
  it('round-trips not-empty and grouped OR conditions without losing pending equality values', () => {
    let saved = ''
    saveLogic(
      {
        logicFields: [
          { name: 'text', operator: 'equals', value: 'VIP', values: [], or: [] },
          { name: 'files', operator: 'notEmpty', value: '', values: [], or: [] },
        ],
      },
      'if',
      (_key, value) => {
        saved = String(value)
      },
    )
    expect(saved).toBe('$text == "VIP" && $empty($files) == false')
    expect(parseLogic(saved)[1]?.operator).toBe('notEmpty')
    expect(transformQfbExpression('($a == 1 || $b == 2) && $c == 3').references).toEqual(['a', 'b', 'c'])
  })
  it('uses actual collection paths for steps, tabs, cells and native lists', () => {
    const fields = [
      {
        $formkit: 'q-stepper',
        name: 'steps',
        steps: [
          {
            name: 'step',
            children: [
              {
                $formkit: 'q-grid',
                name: 'grid',
                cells: [{ name: 'cell', children: [{ $formkit: 'q-input', name: 'answer' }] }],
              },
            ],
          },
        ],
      },
      {
        $formkit: 'q-tabs',
        name: 'tabs',
        tabs: [{ name: 'visual_tab', children: [{ $formkit: 'q-file', name: 'photo' }] }],
      },
      { $formkit: 'list', name: 'list', children: [{ $formkit: 'q-input', name: 'item' }] },
    ]
    const values = { steps: { step: { grid: { answer: 'yes' } } }, tabs: { photo: 'reference' }, list: ['listed'] }
    const result = extractFormData(adoptQfbSchema(fields).fields, values)
    expect(result.answers.map(answer => [answer.fieldPath, answer.value])).toEqual([
      [['steps', 'step', 'grid', 'answer'], 'yes'],
      [['tabs', 'photo'], 'reference'],
      [['list', '0'], 'listed'],
    ])
    expect(result.answers[0]?.path).toContain('cell')
    expect(result.answers.every(answer => answer.fieldId)).toBe(true)
  })
})
