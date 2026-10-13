/**
 * Structural contract shared by normalization, media validation and compatibility inspection.
 * No renderer, browser APIs or generated identities are needed to inspect an existing snapshot.
 */
export interface QfbStructureIssue { code: string, schemaPath: string[], fieldId?: string }
export interface QfbStructureCompatibility { writable: boolean, issues: QfbStructureIssue[] }
export interface QfbSchemaPosition {
  schemaPath: string[]
  valuePath: string[]
  role: 'input' | 'group' | 'list' | 'layout'
  indexed: boolean
}

type RecordNode = Record<string, any>
const GROUPS = new Set(['group', 'form', 'q-stepper', 'q-tabs', 'q-grid', 'q-table-structure', 'q-container', 'q-list-structure'])
const LISTS = new Set(['list', 'repeater'])
const LAYOUTS = new Set(['q-stepper', 'q-tabs', 'q-grid', 'q-table-structure', 'q-container', 'q-list-structure'])
const STATIC = new Set(['q-btn', 'q-separator'])
const RESERVED = new Set(['__proto__', 'constructor', 'prototype', '*'])
export const isQfbSchemaRecord = (value: unknown): value is RecordNode => !!value && typeof value === 'object' && !Array.isArray(value)

function stable(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (isQfbSchemaRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

function arrays(node: RecordNode, key: string): Array<{ value: any[], path: string[] }> {
  const keys = key === 'children' && LAYOUTS.has(String(node.$formkit)) ? ['children', 'structureChildren'] : [key]
  const result: Array<{ value: any[], path: string[] }> = []
  for (const source of [[], ['props'], ['attrs']]) {
    // Attributes are data except for the explicit child slots of known structures.
    if (source.length && !LAYOUTS.has(String(node.$formkit))) continue
    const owner = source.length ? node[source[0]!] : node
    if (!isQfbSchemaRecord(owner)) continue
    for (const name of keys) {
      if (Array.isArray(owner[name])) result.push({ value: owner[name], path: [...source, name] })
    }
  }
  return result
}

function slot(node: RecordNode, key: string, path: string[], issues: QfbStructureIssue[]) {
  const candidates = arrays(node, key)
  const filled = candidates.filter(candidate => candidate.value.length)
  if (filled.some(candidate => stable(candidate.value) !== stable(filled[0]!.value))) {
    issues.push({ code: 'AMBIGUOUS_SCHEMA_CHILDREN', schemaPath: [...path, key], fieldId: node.fieldId })
  }
  return filled[0] || candidates[0]
}

/** Normalize aliases on a copy, never on a historical record. */
export function normalizeQfbStructureAliases(schema: any): { schema: any, issues: QfbStructureIssue[] } {
  const copy = JSON.parse(JSON.stringify(schema))
  const issues: QfbStructureIssue[] = []
  walkQfbSchemaStructure(copy, () => {}, issues)
  walkQfbSchemaStructure(copy, (node, position) => {
    if (!LAYOUTS.has(String(node.$formkit))) return
    const keys = node.$formkit === 'q-stepper' ? ['steps'] : node.$formkit === 'q-tabs' ? ['tabs'] : ['children', 'cells']
    for (const key of keys) {
      const candidates = arrays(node, key)
      if (!candidates.length) continue
      const chosen = slot(node, key, position.schemaPath, [])
      for (const candidate of candidates) {
        const owner = candidate.path.length === 1 ? node : node[candidate.path[0]!]
        delete owner[candidate.path.at(-1)!]
      }
      node[key] = chosen!.value
    }
  })
  return { schema: copy, issues }
}

/** A list child is indexed; a loop creates a path template, a static child a fixed index. */
export function walkQfbSchemaStructure(
  schema: any,
  visit: (node: RecordNode, position: QfbSchemaPosition) => void,
  issues: QfbStructureIssue[] = [],
): void {
  interface Collector { kind: 'group' | 'list', path: string[], index: number }
  function walk(value: any, schemaPath: string[], parent: Collector, forced?: 'group' | 'layout', loop = false): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...schemaPath, String(index)], parent, forced, loop))
      return
    }
    if (!isQfbSchemaRecord(value)) return
    const type = String(value.$formkit || value.$cmp || '')
    const marked = Boolean(type || value.$el || typeof value.name === 'string' || value.children !== undefined || forced)
    if (!marked) {
      if (typeof value.if === 'string') visit(value, { schemaPath, valuePath: parent.path, role: 'layout', indexed: false })
      // Only schema wrappers and actual conditional branches, never arbitrary option/value objects.
      if ('schema' in value) walk(value.schema, [...schemaPath, 'schema'], parent)
      for (const branch of ['then', 'else']) {
        if (isQfbSchemaRecord(value[branch]) || Array.isArray(value[branch])) walk(value[branch], [...schemaPath, branch], { ...parent }, undefined, loop)
      }
      return
    }
    const role = forced || (LISTS.has(type) ? 'list' : GROUPS.has(type) ? 'group' : value.$formkit && !STATIC.has(type) ? 'input' : 'layout')
    const dataNode = role !== 'layout'
    const indexed = dataNode && parent.kind === 'list'
    const name = typeof value.name === 'string' && value.name.trim() ? value.name : undefined
    const repeat = loop || Array.isArray(value.for)
    const segment = indexed ? repeat ? '*' : String(parent.index++) : name
    const valuePath = dataNode && segment !== undefined ? [...parent.path, segment] : parent.path
    if (dataNode && !indexed && !name) issues.push({ code: 'UNNAMED_SCHEMA_FIELD', schemaPath, fieldId: value.fieldId })
    if (name && RESERVED.has(name)) issues.push({ code: 'INVALID_FIELD_NAME', schemaPath, fieldId: value.fieldId })
    visit(value, { schemaPath, valuePath, role, indexed })
    const collector: Collector = role === 'group' || role === 'list' ? { kind: role, path: valuePath, index: 0 } : parent
    if (type === 'q-stepper' || type === 'q-tabs') {
      const key = type === 'q-stepper' ? 'steps' : 'tabs'
      const selected = slot(value, key, schemaPath, issues)
      if (selected) walk(selected.value, [...schemaPath, ...selected.path], collector, key === 'steps' ? 'group' : 'layout')
    }
    else if (type === 'q-grid' || type === 'q-table-structure') {
      const cells = slot(value, 'cells', schemaPath, issues)
      const children = slot(value, 'children', schemaPath, issues)
      if (cells?.value.length && children?.value.length) issues.push({ code: 'AMBIGUOUS_SCHEMA_CHILDREN', schemaPath, fieldId: value.fieldId })
      if (cells?.value.length) walk(cells.value, [...schemaPath, ...cells.path], collector, 'layout')
      else if (children) walk(children.value, [...schemaPath, ...children.path], collector, undefined, role === 'layout' && repeat)
    }
    else {
      const children = slot(value, 'children', schemaPath, issues)
      if (children) walk(children.value, [...schemaPath, ...children.path], collector, undefined, role === 'layout' && repeat)
      else if (isQfbSchemaRecord(value.children)) walk(value.children, [...schemaPath, 'children'], collector)
    }
    for (const branch of ['then', 'else']) {
      if (isQfbSchemaRecord(value[branch]) || Array.isArray(value[branch])) walk(value[branch], [...schemaPath, branch], { ...parent }, undefined, repeat)
    }
  }
  walk(schema, [], { kind: 'group', path: [], index: 0 })
}
