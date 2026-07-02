import type { FormKitFrameworkContext } from '@formkit/core'

type FieldDesignAttrs = Record<string, any>
type ContextWithAttrs = FormKitFrameworkContext & {
  attrs?: FieldDesignAttrs
  [key: string]: any
}

const quasarPropAliases: Record<string, string> = {
  'fill-mask': 'fillMask',
  'reverse-fill-mask': 'reverseFillMask',
  'unmasked-value': 'unmaskedValue',
  'stack-label': 'stackLabel',
  'use-chips': 'useChips',
  'use-input': 'useInput',
  'fill-input': 'fillInput',
  'hide-selected': 'hideSelected',
  'options-dense': 'optionsDense',
  'options-cover': 'optionsCover',
  'new-value-mode': 'newValueMode',
  'max-values': 'maxValues',
  'input-debounce': 'inputDebounce',
  'max-file-size': 'maxFileSize',
  'max-total-size': 'maxTotalSize',
  'max-files': 'maxFiles',
}

export function cleanUndefinedAttrs(attrs: FieldDesignAttrs = {}) {
  return Object.fromEntries(
    Object.entries(attrs).filter(([, value]) => value !== undefined),
  )
}

function normalizeQuasarPropAliases(attrs: FieldDesignAttrs = {}) {
  return Object.entries(attrs).reduce<FieldDesignAttrs>((acc, [name, value]) => {
    const propName = quasarPropAliases[name] || name
    if (value === false && propName !== name) return acc
    acc[propName] = value
    return acc
  }, {})
}

export function getFormKitContextAttrs(context: ContextWithAttrs, propNames: string[] = []) {
  const propsFromContext = propNames.reduce<FieldDesignAttrs>((acc, propName) => {
    if (Object.hasOwn(context, propName) && context[propName] !== undefined) {
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
  const normalizedAttrs = normalizeQuasarPropAliases(attrs)
  if (!normalizedAttrs.fillMask) {
    delete normalizedAttrs.reverseFillMask
  }

  const {
    filled: _filled,
    outlined,
    standout,
    borderless,
    disabled,
    disable,
    ...rest
  } = normalizedAttrs

  const stateAttrs = {
    ...rest,
    disable: Boolean(disable ?? disabled),
  }

  if (outlined) return cleanUndefinedAttrs({ ...stateAttrs, outlined: true })
  if (standout) return cleanUndefinedAttrs({ ...stateAttrs, standout: true })
  if (borderless) return cleanUndefinedAttrs({ ...stateAttrs, borderless: true })

  return cleanUndefinedAttrs({ ...stateAttrs, filled: true })
}
