import { createNode } from '@formkit/core'
import { expect, it } from 'vitest'
import useSteps from '../../src/runtime/app/composables/useSteps'

it('reveals errors in its own visited step without relying on global DOM IDs', () => {
  const steps = useSteps()
  const group = createNode({ name: 'first', type: 'group', props: { type: 'group' }, plugins: [steps.stepPlugin] })
  const input = createNode({ name: 'answer', parent: group })
  steps.setActiveStep('second')
  expect(input.store.submitted?.value).toBe(true)
  group.destroy()
})
