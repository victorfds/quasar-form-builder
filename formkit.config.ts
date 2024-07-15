import { defineFormKitConfig } from "@formkit/vue"
import { en, pt } from "@formkit/i18n"
import { QuasarBtnToggle, QuasarCheckbox, QuasarDate, QuasarDatetime, QuasarEditor, QuasarInput, QuasarSelect } from "#components"

const quasarPlugin = () => { }
quasarPlugin.library = (node: FormKitNode) => {
  const type: string = node.props.type
  const quasarTypes = {
    'q-input': () => node.define({
      type: "input",
      props: ["inputType"],
      component: QuasarInput,
    }),
    'q-select': () => node.define({
      type: "input",
      component: QuasarSelect,
    }),
    'q-btn-toggle': () => node.define({
      type: "input",
      component: QuasarBtnToggle,
    }),
    'q-checkbox': () => node.define({
      type: "input",
      component: QuasarCheckbox,
    }),
    'q-editor': () => node.define({
      type: "input",
      component: QuasarEditor,
    }),
    'q-date': () => node.define({
      type: "input",
      component: QuasarDate,
    }),
    'q-datetime': () => node.define({
      type: "input",
      component: QuasarDatetime,
    }),

  }

  return quasarTypes[type]?.()
}

export default defineFormKitConfig({
  plugins: [
    quasarPlugin
  ],
  locales: { en, pt },
  locale: 'pt'
})
