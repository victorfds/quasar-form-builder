import type { ModuleOptions, QfbSchemaField } from 'nuxt-quasar-form-builder'
import type { QfbMediaStorageAdapter, QfbMediaValue, useQfbMediaController } from 'nuxt-quasar-form-builder/media'
import { createQfbIndexedDbStorage } from 'nuxt-quasar-form-builder/media'
import { adoptQfbSchema, extractFormData } from 'nuxt-quasar-form-builder/schema'

const storage: QfbMediaStorageAdapter = createQfbIndexedDbStorage()
const fields = adoptQfbSchema([{ $formkit: 'q-file', name: 'file' }]).fields
const value: QfbMediaValue = { version: 1, clientId: 'client', name: 'file.txt', mimeType: 'text/plain', size: 1 }
const answers = extractFormData(fields, { file: value }).answers
type Options = Parameters<typeof useQfbMediaController>[0]
const scope: Options['scope'] = { userKey: 'user', formId: 'form', responseKey: 'draft' }
const path: string[] = answers[0]!.fieldPath
const options: ModuleOptions = { route: false, prefix: 'Acme', autoImport: false, includeCss: true }
const definition: QfbSchemaField = { $formkit: 'q-file', name: 'files', fieldId: 'stable', multiple: true }
// @ts-expect-error field identities are strings, not editable numeric DOM ids
const invalid: QfbSchemaField = { $formkit: 'q-input', fieldId: 1 }
void [storage, scope, path, options, definition, invalid]
