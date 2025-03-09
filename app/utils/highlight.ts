import { createHighlighter } from "shiki"

/**
 * Creates a JSON highlighter function for rendering JSON with syntax highlighting.
 *
 * Initializes a Shiki highlighter with JSON support and 'vitesse-dark'/'vitesse-light' themes.
 * The returned function can be used to highlight JSON data as HTML, ideal for Vue computed properties.
 *
 * @example
 * ```typescript
 * // In a Vue component
 * const useHighlight = await highlightJson();
 *
 * const htmlValues = computed(() => {
 *   return useHighlight(<VALUES>, <IS-DARK>);
 * });
 *
 * // In your template
 * // <div v-html="htmlValues" />
 * ```
 *
 * @throws {Error} If Shiki fails to initialize (e.g., network issues loading themes/languages).
 */
export async function highlightJson(): Promise<(data: any, isDark: boolean) => string> {
  const highlighter = await createHighlighter({
    langs: ['json'],
    themes: ['vitesse-dark', 'vitesse-light']
  })

  return function highlightData(data: any, isDark: boolean): string {
    return highlighter.codeToHtml(JSON.stringify(data, null, 2), {
      lang: 'json',
      theme: isDark ? 'vitesse-dark' : 'vitesse-light',
      colorReplacements: {
        'vitesse-dark': {
          '#121212': '#1D1D1D',
        },
      },
    })
  }
}
