import { spawn } from 'node:child_process'
import process from 'node:process'

const versions = process.env.QFB_TEST_NUXT_VERSION ? [process.env.QFB_TEST_NUXT_VERSION] : ['4.5.1', '4.6.1']
for (const version of versions) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/test-consumer.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, QFB_TEST_NUXT_VERSION: version },
    })
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Nuxt ${version} consumer failed: ${code}`)))
  })
}
