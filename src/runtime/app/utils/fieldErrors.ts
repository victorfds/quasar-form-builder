import type { FormKitNode } from '@formkit/core'
import type { QfbFormFieldError } from '../../types'
import { createMessage } from '@formkit/core'

const source = 'qfb-external'
const reserved = new Set(['__proto__', 'constructor', 'prototype', '*'])

/** Replace only messages owned by the external-error adapter. */
export function applyQfbExternalErrors(root: FormKitNode, formErrors: string[] = [], fieldErrors: QfbFormFieldError[] = []): void {
  const targets = new Map<FormKitNode, string[]>([[root, [...formErrors]]])
  for (const error of fieldErrors) {
    const path = error.fieldPath
    if (!path.length || path.some(segment => reserved.has(segment))) {
      targets.get(root)!.push(...error.messages)
      continue
    }
    let target = root.at([...path])
    let suffix = ''
    if (!target && /^\d+$/.test(path.at(-1)!)) {
      const collection = root.at(path.slice(0, -1))
      if (collection?.type === 'input' && ['q-file', 'q-audio-recorder'].includes(String(collection.props.type))) {
        target = collection
        suffix = ` [${path.at(-1)}]`
      }
    }
    if (target) targets.set(target, [...(targets.get(target) || []), ...error.messages.map(message => `${message}${suffix}`)])
    else targets.get(root)!.push(...error.messages.map(message => `${path.join(' › ')}: ${message}`))
  }
  const apply = (node: FormKitNode) => {
    node.store.apply((targets.get(node) || []).map((value, index) => createMessage({ key: `${source}:${index}`, type: 'error', value, visible: true, blocking: true, meta: { source, autoClear: false } })), message => message.meta.source === source)
  }
  apply(root)
  root.walk(apply)
}
