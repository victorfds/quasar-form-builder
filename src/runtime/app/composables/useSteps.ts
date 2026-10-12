import type { FormKitNode } from '@formkit/core'
import { createMessage } from '@formkit/core'
import { reactive, ref, toRef } from 'vue'

export default function useSteps() {
  const activeStep = ref('')
  const steps = reactive<Record<string, { valid?: boolean, errorCount?: number, blockingCount?: number }>>({})
  const visitedSteps = ref<string[]>([]) // track visited steps
  const nodes = new Map<string, FormKitNode>()

  function revealVisitedStepErrors() {
    visitedSteps.value.forEach((step) => {
      const node = nodes.get(step)
      node?.walk((n) => {
        n.store.set(
          createMessage({
            key: 'submitted',
            value: true,
            visible: false,
          }),
        )
      })
    })
  }

  function setActiveStep(stepName: string) {
    const oldStep = activeStep.value
    if (oldStep && !visitedSteps.value.includes(oldStep)) {
      visitedSteps.value.push(oldStep)
    }
    activeStep.value = stepName
    revealVisitedStepErrors()
  }

  const setStep = (delta: number) => {
    const stepNames = Object.keys(steps)
    const currentIndex = stepNames.indexOf(activeStep.value)
    setActiveStep(stepNames[currentIndex + delta]!)
  }

  const stepPlugin = (node: FormKitNode) => {
    if (node.props.type === 'group') {
      nodes.set(node.name, node)
      node.on('destroying', () => {
        nodes.delete(node.name)
        delete steps[node.name]
      })
      // builds an object of the top-level groups
      steps[node.name] = steps[node.name] || {}

      node.on('created', () => {
        // use 'on created' to ensure context object is available
        if (node.context) Object.assign(steps[node.name]!, { valid: toRef(node.context.state, 'valid') })
      })

      // listen for changes in error count and store it
      node.on('count:errors', ({ payload: count }) => {
        steps[node.name]!.errorCount = Number(count)
      })

      // listen for changes in count of blocking validations messages
      node.on('count:blocking', ({ payload: count }) => {
        steps[node.name]!.blockingCount = Number(count)
      })

      // set the active tab to the 1st tab
      if (activeStep.value === '') {
        setActiveStep(node.name)
      }

      // Stop plugin inheritance to descendant nodes
      return false
    }
  }

  // NEW: include visitedSteps in our return
  return { activeStep, visitedSteps, steps, stepPlugin, setStep, setActiveStep }
}
