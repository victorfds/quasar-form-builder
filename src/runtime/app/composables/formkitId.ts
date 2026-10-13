import type { FormKitNode, FormKitPlugin } from '@formkit/core'
import { getCurrentInstance, useId } from 'vue'

export function createFormKitIdPlugin(): FormKitPlugin {
  const initialized = new WeakSet<FormKitNode>()
  function assignId(node: FormKitNode) {
    const instance = getCurrentInstance()
    if (!instance || initialized.has(node)) return
    initialized.add(node)
    const id = `qfb-${useId()}`
    if (!instance.props.id) node.props.id = id
    // The synthetic root name appears in HTML but is not a response key.
    if (node.props.type === 'form' && !node.parent && !instance.props.name) node.name = `${id}-form`
  }
  // Input features may derive child IDs while the library defines the node.
  assignId.library = assignId
  return assignId
}
