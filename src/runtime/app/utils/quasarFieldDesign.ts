import type { FormKitFrameworkContext } from '@formkit/core'

type FieldDesignAttrs = Record<string, any>
type ContextWithAttrs = FormKitFrameworkContext & {
  attrs?: FieldDesignAttrs
  [key: string]: any
}

export function cleanUndefinedAttrs(attrs: FieldDesignAttrs = {}) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([, value]) => value !== undefined),
  )
}

export function getFormKitContextAttrs(context: ContextWithAttrs, propNames: string[] = []) {
  const propsFromContext = propNames.reduce<FieldDesignAttrs>((acc, propName) => {
    if (Object.prototype.hasOwnProperty.call(context, propName) && context[propName] !== undefined) {
      acc[propName] = context[propName]
    }
    return acc
  }, {})

  return cleanUndefinedAttrs({
    ...propsFromContext,
    ...(context.attrs || {}),
  })
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

  if (outlined) return cleanUndefinedAttrs({ ...stateAttrs, outlined: true })
  if (standout) return cleanUndefinedAttrs({ ...stateAttrs, standout: true })
  if (borderless) return cleanUndefinedAttrs({ ...stateAttrs, borderless: true })

  return cleanUndefinedAttrs({ ...stateAttrs, filled: true })
}
