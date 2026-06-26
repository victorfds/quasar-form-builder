type FieldDesignAttrs = Record<string, any>

export function getQuasarFieldDesignAttrs(attrs: FieldDesignAttrs) {
  const {
    filled: _filled,
    outlined,
    standout,
    borderless,
    ...rest
  } = attrs

  if (outlined) return { ...rest, outlined: true }
  if (standout) return { ...rest, standout: true }
  if (borderless) return { ...rest, borderless: true }

  return { ...rest, filled: true }
}
