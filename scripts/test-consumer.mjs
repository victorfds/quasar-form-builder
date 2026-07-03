import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmpRoot = resolve(rootDir, '.tmp', 'consumer-test')
const packDir = join(tmpRoot, 'pack')
const appDir = join(tmpRoot, 'app')
const port = 3021
const baseURL = `http://127.0.0.1:${port}`

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options,
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function waitForServer(url, timeout = 60_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    }
    catch {
      // Keep polling until the production server is ready.
    }

    await new Promise(resolveWait => setTimeout(resolveWait, 500))
  }

  throw new Error(`Consumer app did not start at ${url}`)
}

async function createConsumerApp(packagePath) {
  await writeFile(join(appDir, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    scripts: {
      build: 'nuxt build',
    },
    dependencies: {
      'nuxt': '^4.4.8',
      'nuxt-quasar-form-builder': `file:${packagePath}`,
      'vue': '^3.5.39',
    },
  }, null, 2))

  await writeFile(join(appDir, 'nuxt.config.ts'), `export default defineNuxtConfig({
  modules: ['nuxt-quasar-form-builder'],
  formBuilder: {
    prefix: 'Qfb',
    route: '/form-builder',
  },
  devtools: { enabled: false },
  compatibilityDate: '2025-01-28',
})
`)

  await mkdir(join(appDir, 'app/pages'), { recursive: true })
  await writeFile(join(appDir, 'app/pages/viewer.vue'), `<script setup lang="ts">
import { ref } from 'vue'

const values = ref({})
const fields = [
  {
    $formkit: 'q-input',
    name: 'name',
    label: 'Nome',
    inputType: 'text',
  },
  {
    $formkit: 'q-stepper',
    name: 'stepper',
    steps: [
      {
        name: 'step_1',
        label: 'Passo 1',
        children: [
          {
            $formkit: 'q-input',
            name: 'inside_step',
            label: 'Campo interno',
            inputType: 'text',
          },
        ],
      },
    ],
  },
]
</script>

<template>
  <main>
    <h1>Visualizador consumidor</h1>
    <QfbFormViewer v-model="values" :form-fields="fields" />
  </main>
</template>
`)
}

async function assertConsumerPages() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const runtimeErrors = []

  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(`${baseURL}/form-builder`, { waitUntil: 'networkidle' })
  await page.getByText('Construtor de Formulários').waitFor()
  await page.getByText('Elementos', { exact: true }).waitFor()

  await page.goto(`${baseURL}/viewer`, { waitUntil: 'networkidle' })
  await page.getByText('Visualizador consumidor').waitFor()
  await page.getByLabel('Nome').waitFor()
  await page.locator('.q-stepper').waitFor()
  await page.getByText('Passo 1').waitFor()
  await page.getByLabel('Campo interno').waitFor()

  await browser.close()

  if (runtimeErrors.length) {
    throw new Error(`Consumer app emitted runtime errors:\n${runtimeErrors.join('\n')}`)
  }
}

await rm(tmpRoot, { force: true, recursive: true })
await mkdir(packDir, { recursive: true })
await mkdir(appDir, { recursive: true })

await run('pnpm', ['pack', '--pack-destination', packDir])
const packageFile = (await readdir(packDir)).find(file => file.endsWith('.tgz'))
if (!packageFile) throw new Error('pnpm pack did not create a tarball')

await createConsumerApp(join(packDir, packageFile))
await run('pnpm', ['install'], { cwd: appDir })
await run('pnpm', ['build'], { cwd: appDir })

const serverTmpDir = await mkdtemp(join(tmpdir(), 'qfb-consumer-'))
const server = spawn('node', [join(appDir, '.output/server/index.mjs')], {
  cwd: appDir,
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(port),
    NITRO_PORT: String(port),
    TMPDIR: serverTmpDir,
  },
  stdio: ['ignore', 'inherit', 'inherit'],
})

try {
  await waitForServer(`${baseURL}/form-builder`)
  await assertConsumerPages()
}
finally {
  server.kill('SIGTERM')
  await rm(serverTmpDir, { force: true, recursive: true })
}
