import type { FormKitFrameworkContext } from '@formkit/core'

type FieldDesignAttrs = Record<string, any>
type ContextWithAttrs = FormKitFrameworkContext & {
  attrs?: FieldDesignAttrs
  [key: string]: any
}

export function getFormKitContextAttrs(context: ContextWithAttrs, propNames: string[] = []) {
  const propsFromContext = propNames.reduce<FieldDesignAttrs>((acc, propName) => {
    if (Object.prototype.hasOwnProperty.call(context, propName)) {
      acc[propName] = context[propName]
    }
    return acc
  }, {})

  return {
    ...propsFromContext,
    ...(context.attrs || {}),
  }
}

export function getQuasarFieldDesignAttrs(attrs: FieldDesignAttrs = {}) {
  const {
    filled: _filled,
    outlined,
    standout,
    borderless,
    disabled,
    disable,
    ...rest
  } = attrs

  const stateAttrs = {
    ...rest,
    disable: Boolean(disable ?? disabled),
  }

  if (outlined) return { ...stateAttrs, outlined: true }
  if (standout) return { ...stateAttrs, standout: true }
  if (borderless) return { ...stateAttrs, borderless: true }

  return { ...stateAttrs, filled: true }
}
