import {createHighlighter} from "shiki"

const highlighter = await createHighlighter({langs: ['json'], themes: ['vitesse-dark', 'vitesse-light']})

export function highlightJson(text: any, isDark: boolean) {

  return highlighter.codeToHtml(JSON.stringify(text, null, 2), {
    lang: 'json',
    theme: isDark ? 'vitesse-dark' : 'vitesse-light',
    colorReplacements: {
      'vitesse-dark': {
        '#121212': '#1D1D1D',
      },
    },
  })
}