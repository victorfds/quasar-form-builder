import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const policy = JSON.parse(await readFile(new URL('./audit-exceptions.json', import.meta.url), 'utf8'))
assert(Date.now() < Date.parse(`${policy.expiresAt}T00:00:00Z`), 'Security review expired; review documented exceptions before updating the date')

function audit(args) {
  const run = spawnSync('pnpm', ['audit', '--json', ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (run.error) throw run.error
  const report = JSON.parse(run.stdout)
  assert(report.advisories && report.metadata, `Audit service failed: ${run.stderr || run.stdout}`)
  return Object.values(report.advisories)
}

const production = audit(['--prod'])
assert.equal(production.length, 0, 'Published runtime has a dependency advisory')
for (const advisory of audit([])) {
  if (!['high', 'critical'].includes(advisory.severity)) {
    console.warn(`Tooling advisory (${advisory.severity}): ${advisory.github_advisory_id} ${advisory.module_name}`)
    continue
  }
  const exception = policy.exceptions.find(item => item.id === advisory.github_advisory_id)
  assert(exception, `Unreviewed ${advisory.severity} advisory: ${advisory.github_advisory_id}`)
  assert.equal(advisory.module_name, exception.package)
  assert.equal(advisory.vulnerable_versions, exception.range)
  for (const path of advisory.findings.flatMap(item => item.paths)) {
    assert(exception.paths.includes(path), `Advisory reached an unreviewed dependency path: ${path}`)
  }
  console.warn(`Reviewed tooling exception until ${policy.expiresAt}: ${exception.id}. ${exception.reason}`)
}
console.log('Audit gate passed: no runtime advisories or unreviewed high/critical tooling advisories')
