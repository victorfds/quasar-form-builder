import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { useQfbMediaController } from '../../src/runtime/app/composables/useQfbMediaController'
import { qfbMediaControllerKey, qfbViewerReadonlyKey } from '../../src/runtime/app/constants/injectionKeys'
import * as media from '../../src/runtime/media'
import * as schema from '../../src/runtime/schema'
import { isQfbConditionalRule } from '../../src/runtime/utils/schemaGuards'
import manifest from '../fixtures/public-exports.json'

const runtime = fileURLToPath(new URL('../../src/runtime', import.meta.url))
function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? filesIn(join(directory, entry.name)) : [join(directory, entry.name)],
  )
}

describe('nuxt runtime organization', () => {
  it('keeps domain implementations in conventional runtime directories', () => {
    for (const directory of ['media', 'schema']) expect(existsSync(join(runtime, 'app', directory))).toBe(false)
    expect(existsSync(join(runtime, 'app', 'types.ts'))).toBe(false)
    for (const file of filesIn(runtime).filter(file => /\.(?:ts|vue)$/.test(file))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/#qfb\/(?:media|schema|types)['"/]/)
    }
  })

  it('keeps contracts free of runtime statements and imports', () => {
    for (const file of filesIn(join(runtime, 'types'))) {
      const result = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
        fileName: file,
      })
      expect(result.outputText.trim(), file).toBe('export {};')
    }
    expect(isQfbConditionalRule({ if: '$enabled', then: true })).toBe(true)
    expect(isQfbConditionalRule(null)).toBe(false)
  })

  it('keeps standalone SDK graphs independent of Nuxt consumer aliases', () => {
    const visited = new Set<string>()
    const visit = (file: string) => {
      if (visited.has(file)) return
      visited.add(file)
      const imports = ts.preProcessFile(readFileSync(file, 'utf8')).importedFiles
      for (const { fileName } of imports) {
        expect(fileName, file).not.toMatch(/^#/)
        if (!fileName.startsWith('.')) continue
        const target = resolve(dirname(file), fileName.replace(/\.js$/, ''))
        const dependency = [`${target}.ts`, join(target, 'index.ts')].find(existsSync)
        expect(dependency, `${file}: ${fileName}`).toBeDefined()
        if (dependency) visit(dependency)
      }
    }
    visit(join(runtime, 'media.ts'))
    visit(join(runtime, 'schema.ts'))
    expect(visited.size).toBeGreaterThan(10)
  })

  it('preserves public exports and a single controller and injection-key identity', () => {
    expect(Object.keys(media).sort()).toEqual(manifest.runtime.media)
    expect(Object.keys(schema).sort()).toEqual(manifest.runtime.schema)
    expect(media.useQfbMediaController).toBe(useQfbMediaController)
    expect(media.qfbMediaControllerKey).toBe(qfbMediaControllerKey)
    expect(media.qfbViewerReadonlyKey).toBe(qfbViewerReadonlyKey)
  })
})
