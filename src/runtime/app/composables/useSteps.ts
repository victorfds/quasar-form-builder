import type { FormKitNode } from '@formkit/core'
import { createMessage, getNode } from '@formkit/core'
import { reactive, ref, toRef } from 'vue'

export default function useSteps() {
  const activeStep = ref('')
  const steps = reactive({})
  const visitedSteps = ref<string[]>([]) // track visited steps

  function revealVisitedStepErrors() {
    visitedSteps.value.forEach((step) => {
      const node = getNode(step)
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
      // builds an object of the top-level groups
      // @ts-expect-error all step props are runtime defined
      steps[node.name] = steps[node.name] || {}

      node.on('created', () => {
        // use 'on created' to ensure context object is available
        // @ts-expect-error all step props are runtime defined
        steps[node.name].valid = toRef(node.context.state, 'valid')
      })

      // listen for changes in error count and store it
      node.on('count:errors', ({ payload: count }) => {
        // @ts-expect-error all step props are runtime defined
        steps[node.name].errorCount = count
      })

      // listen for changes in count of blocking validations messages
      node.on('count:blocking', ({ payload: count }) => {
        // @ts-expect-error all step props are runtime defined
        steps[node.name].blockingCount = count
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
