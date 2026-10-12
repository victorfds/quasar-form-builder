import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from '@playwright/test'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmpRoot = resolve(rootDir, '.tmp', 'consumer-test')
const packDir = join(tmpRoot, 'pack')
const appDir = join(tmpRoot, 'app')
const port = await new Promise((resolvePort, reject) => {
  const probe = createServer()
  probe.once('error', reject)
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address()
    probe.close(() => resolvePort(address.port))
  })
})
const baseURL = `http://127.0.0.1:${port}`
const nuxtVersion = process.env.QFB_TEST_NUXT_VERSION || '4.6.1'

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
      throw new Error(`Consumer returned ${response.status}: ${await response.text()}`)
    }
    catch (error) {
      if (error.message.startsWith('Consumer returned')) throw error
      // Keep polling until the production server is ready.
    }

    await new Promise(resolveWait => setTimeout(resolveWait, 500))
  }

  throw new Error(`Consumer app did not start at ${url}`)
}

async function createConsumerApp(packagePath) {
  await writeFile(
    join(appDir, 'package.json'),
    JSON.stringify(
      {
        private: true,
        type: 'module',
        scripts: {
          build: 'nuxt build',
        },
        dependencies: {
          'nuxt': nuxtVersion,
          'nuxt-quasar-form-builder': `file:${packagePath}`,
          'vue': '3.5.43',
          'pinia': '4.0.3',
        },
        devDependencies: { 'typescript': '^5.9.3', '@types/node': '^26.0.0' },
      },
      null,
      2,
    ),
  )

  await writeFile(join(appDir, 'pnpm-workspace.yaml'), await readFile(join(rootDir, 'pnpm-workspace.yaml')))
  await cp(join(rootDir, 'patches'), join(appDir, 'patches'), { recursive: true })

  await writeFile(
    join(appDir, 'nuxt.config.ts'),
    `export default defineNuxtConfig({
  ssr: process.env.QFB_TEST_SPA !== '1',
  modules: ['nuxt-quasar-form-builder'],
  formBuilder: {
    prefix: 'Qfb',
    route: '/form-builder',
  },
  devtools: { enabled: false },
  compatibilityDate: '2025-01-28',
})
`,
  )

  await mkdir(join(appDir, 'app/pages'), { recursive: true })
  await writeFile(
    join(appDir, 'app/pages/viewer.vue'),
    `<script setup lang="ts">
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
    <pre data-testid="viewer-values">{{ JSON.stringify(values) }}</pre>
  </main>
</template>
`,
  )
}

async function createMediaFixtures() {
  await writeFile(
    join(appDir, 'app/pages/media.vue'),
    `<script setup lang="ts">
import { ref, shallowRef, onMounted, onScopeDispose, watch } from 'vue'
import { createQfbIndexedDbStorage, createQfbHttpMediaTransport, useQfbMediaController } from 'nuxt-quasar-form-builder/media'
const fields = [{ $formkit: 'q-file', name: 'files', fieldId: '00000000-0000-4000-8000-000000000001', label: 'Arquivos persistentes', multiple: true }]
const values = ref({ files: [] })
const ready = shallowRef(false)
const storage = createQfbIndexedDbStorage({ databaseName: 'packed-media-consumer' })
const transport = {
  list: async () => [],
  upload: async options => ({ kind: 'linked', field: options.field, value: { ...options.value, documentId: 'packed-document' } }),
  access: async () => ({ url: 'https://example.test/unused', release() {} }),
  remove: async () => {},
}
const controller = useQfbMediaController({ scope: { userKey: 'consumer', formId: 'form', responseKey: 'draft' }, policy: { maxFileSize: 1024, allowedMimeTypes: ['text/plain'], allowedExtensions: ['txt'] }, storage, transport })
createQfbHttpMediaTransport({ urls: { list: () => '/', upload: () => '/', remove: () => '/', access: () => '/' }, toRemote: dto => dto, toAccess: dto => dto })
onMounted(() => { values.value = JSON.parse(localStorage.getItem('packed-values') || '{"files":[]}'); ready.value = true })
watch(values, () => { if (ready.value) localStorage.setItem('packed-values', JSON.stringify(values.value)) }, { deep: true })
onScopeDispose(controller.dispose)
</script>
<template>
  <main>
    <h1>Consumidor de mídia</h1>
    <QfbFormViewer v-if="ready" v-model="values" :form-fields="fields" :media-controller="controller" />
    <pre data-testid="packed-values">{{ JSON.stringify(values) }}</pre>
    <QfbAudioRecorder label="Áudio público" readonly />
    <QfbMediaAttachments :items="[]" :media-controller="controller" />
  </main>
</template>
`,
  )
  await writeFile(
    join(appDir, 'types-smoke.ts'),
    `import type { QfbMediaValue, QfbMediaSnapshot, QfbMediaUploadOptions } from 'nuxt-quasar-form-builder/media'
import { createQfbIndexedDbStorage, createQfbHttpMediaTransport, useQfbMediaController } from 'nuxt-quasar-form-builder/media'
import { adoptQfbSchema, extractFormData } from 'nuxt-quasar-form-builder/schema'
const fields = adoptQfbSchema([{ $formkit: 'q-file', name: 'media' }]).fields
const fieldId: string | undefined = fields[0]?.fieldId
const storage = createQfbIndexedDbStorage()
const transport = createQfbHttpMediaTransport({ urls: { list: () => '/', upload: () => '/', remove: () => '/', access: () => '/' }, toRemote: dto => dto as never, toAccess: dto => dto as never })
const controller = useQfbMediaController({ scope: { userKey: 'user', formId: 'form', responseKey: 'draft' }, policy: null, storage, transport })
const value: QfbMediaValue = { version: 1, clientId: 'client', name: 'file.txt', mimeType: 'text/plain', size: 1 }
const binary: QfbMediaUploadOptions['binary'] = { kind: 'native', uri: 'native://file' }
// @ts-expect-error persistent references must not include bytes
const invalid: QfbMediaValue = { ...value, blob: new Blob() }
const snapshot: Promise<QfbMediaSnapshot> = controller.prepare({ media: value })
const answers = extractFormData(fields, { media: value }).answers
void [fieldId, binary, invalid, snapshot, answers]
`,
  )
}

async function assertConsumerPages(engine) {
  const browser = process.env.QFB_BROWSER_WS
    ? await engine.connect(process.env.QFB_BROWSER_WS)
    : await engine.launch()
  const page = await browser.newPage()
  page.setDefaultTimeout(15_000)
  page.setDefaultNavigationTimeout(30_000)
  const runtimeErrors = []

  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))

  try {
    await page.goto(`${baseURL}/form-builder`, { waitUntil: 'networkidle' })
    await page.getByText('Construtor de Formulários').waitFor()
    await page.getByText('Elementos', { exact: true }).waitFor()

    await page.goto(`${baseURL}/viewer`, { waitUntil: 'networkidle' })
    await page.getByText('Visualizador consumidor').waitFor()
    await page.getByLabel('Nome').waitFor()
    await page.locator('.q-stepper').waitFor()
    await page.getByText('Passo 1').waitFor()
    await page.getByLabel('Campo interno').waitFor()

    await page.goto(`${baseURL}/media`)
    await page.getByLabel('Arquivos persistentes', { exact: true }).waitFor()
    await page.waitForFunction(
      () => !document.querySelector('input[type="file"][aria-label="Arquivos persistentes"]')?.disabled,
    )
    await page
      .getByLabel('Arquivos persistentes', { exact: true })
      .setInputFiles({ name: 'packed.txt', mimeType: 'text/plain', buffer: Buffer.from('durable package') })
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="packed-values"]').textContent).files?.[0]?.clientId,
    )
    const original = JSON.parse(await page.getByTestId('packed-values').textContent()).files[0]
    await page.waitForFunction(
      () => !document.querySelector('input[type="file"][aria-label="Arquivos persistentes"]')?.disabled,
    )
    await page
      .getByLabel('Arquivos persistentes', { exact: true })
      .setInputFiles({ name: 'packed-next.txt', mimeType: 'text/plain', buffer: Buffer.from('another durable file') })
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="packed-values"]').textContent).files?.length === 2,
    )
    if (JSON.parse(await page.getByTestId('packed-values').textContent()).files[0].clientId !== original.clientId)
      throw new Error('Packed media replaced the previous selection')
    await page.reload()
    await page.waitForFunction(
      clientId =>
        JSON.parse(document.querySelector('[data-testid="packed-values"]').textContent).files?.[0]?.clientId === clientId,
      original.clientId,
    )
    await page.getByRole('button', { name: 'Baixar packed.txt' }).waitFor()
    await page.getByRole('button', { name: 'Baixar packed-next.txt' }).waitFor()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Baixar packed.txt' }).click()
    const download = await downloadPromise
    if (download.suggestedFilename() !== 'packed.txt') throw new Error('Packed media source was not restored')
    await page.getByRole('button', { name: 'Gravar', exact: true }).waitFor()
    if (!(await page.getByRole('button', { name: 'Gravar', exact: true }).isDisabled()))
      throw new Error('Public audio recorder readonly is not enforced')

    if (runtimeErrors.length) {
      throw new Error(`Consumer app emitted runtime errors:\n${runtimeErrors.join('\n')}`)
    }
  }
  catch (error) {
    throw new Error(`${engine.name()} failed with ${runtimeErrors.join('; ')}: ${error.message}`, { cause: error })
  }
  finally {
    await browser.close()
  }
}

await rm(tmpRoot, { force: true, recursive: true })
await mkdir(packDir, { recursive: true })
await mkdir(appDir, { recursive: true })

await run('pnpm', ['pack', '--pack-destination', packDir])
const packageFile = (await readdir(packDir)).find(file => file.endsWith('.tgz'))
if (!packageFile) throw new Error('pnpm pack did not create a tarball')

await createConsumerApp(join(packDir, packageFile))
await createMediaFixtures()
await run('pnpm', ['install'], { cwd: appDir })
await run(
  'pnpm',
  [
    'exec',
    'tsc',
    '--noEmit',
    '--strict',
    '--skipLibCheck',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2022',
    '--lib',
    'ES2022,DOM',
    'types-smoke.ts',
  ],
  { cwd: appDir },
)
await run(
  'node',
  [
    '--input-type=module',
    '-e',
    `const media = await import('nuxt-quasar-form-builder/media'); const schema = await import('nuxt-quasar-form-builder/schema'); if (typeof media.createQfbIndexedDbStorage !== 'function' || typeof schema.adoptQfbSchema !== 'function') throw new Error('Missing public exports'); media.createQfbIndexedDbStorage(); console.log('Public media/schema exports import without browser globals');`,
  ],
  { cwd: appDir },
)

for (const mode of ['ssr', 'spa']) {
  await run('pnpm', ['build'], { cwd: appDir, env: { ...process.env, QFB_TEST_SPA: mode === 'spa' ? '1' : '0' } })
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
    for (const engine of [chromium, firefox, webkit]) {
      await assertConsumerPages(engine)
      console.log(`Packed consumer Nuxt ${nuxtVersion} ${mode} ${engine.name()} passed on ${process.version}`)
    }
  }
  finally {
    if (server.exitCode === null) {
      await new Promise((resolveClose) => {
        server.once('close', resolveClose)
        server.kill('SIGTERM')
      })
    }
    await rm(serverTmpDir, { force: true, recursive: true })
  }
}
