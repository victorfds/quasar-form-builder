import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

export interface QfbMediaValue {
  version: 1
  clientId: string
  documentId?: string
  name: string
  mimeType: string
  size: number
  durationMs?: number
}
export type QfbMediaFieldValue = QfbMediaValue | QfbMediaValue[] | null
export interface QfbMediaFieldContext {
  fieldId: string
  fieldPath: string[]
}
export interface QfbMediaScope {
  userKey: string
  formId: string
  responseKey: string
}
export interface QfbMediaPolicy {
  maxFileSize: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}
export type QfbMediaBinary = { kind: 'blob', blob: Blob } | { kind: 'native', uri: string }
export interface QfbMediaSource {
  url: string
  expiresAt?: string
  release: () => void
}
export interface QfbMediaStorageAdapter {
  write: (scope: QfbMediaScope, value: QfbMediaValue, binary: QfbMediaBinary) => Promise<void>
  read: (scope: QfbMediaScope, clientId: string) => Promise<QfbMediaBinary>
  has: (scope: QfbMediaScope, clientId: string) => Promise<boolean>
  remove: (scope: QfbMediaScope, clientId: string) => Promise<void>
  source: (scope: QfbMediaScope, clientId: string) => Promise<QfbMediaSource>
}
export interface QfbLinkedRemoteMedia {
  kind: 'linked'
  value: QfbMediaValue
  field: QfbMediaFieldContext
}
export interface QfbUnassignedRemoteMedia {
  kind: 'unassigned'
  document: { documentId: string, name: string, mimeType: string, size: number, durationMs?: number }
}
export type QfbRemoteMedia = QfbLinkedRemoteMedia | QfbUnassignedRemoteMedia
export interface QfbMediaProgress {
  clientId: string
  loaded: number
  total?: number
}
export interface QfbMediaUploadOptions {
  responseId: string
  value: QfbMediaValue
  field: QfbMediaFieldContext
  binary: QfbMediaBinary
  idempotencyKey: string
  signal: AbortSignal
  onProgress: (progress: QfbMediaProgress) => void
}
export interface QfbMediaTransportAdapter {
  list: (responseId: string, signal: AbortSignal) => Promise<QfbRemoteMedia[]>
  upload: (options: QfbMediaUploadOptions) => Promise<QfbLinkedRemoteMedia>
  access: (documentId: string, signal: AbortSignal) => Promise<QfbMediaSource>
  remove: (responseId: string, documentId: string, idempotencyKey: string, signal: AbortSignal) => Promise<void>
}
export interface QfbMediaFieldOptions {
  multiple?: boolean
  maxFileSize?: number
  maxTotalSize?: number
  maxFiles?: number
  accept?: string
  mediaKind?: 'file' | 'image' | 'video' | 'audio'
  readonly?: boolean
  disabled?: boolean
}
export type QfbMediaState = 'staging' | 'local' | 'queued' | 'uploading' | 'uploaded' | 'error' | 'removing'
export type QfbMediaErrorCode
  = | 'readonly'
    | 'policy-unavailable'
    | 'invalid-value'
    | 'invalid-snapshot'
    | 'scope-mismatch'
    | 'field-unavailable'
    | 'file-limit'
    | 'mime-type'
    | 'extension'
    | 'storage'
    | 'missing-source'
    | 'transport'
    | 'conflict'
    | 'cancelled'
    | 'disposed'
    | 'capture'
export interface QfbMediaErrorDescription {
  code: QfbMediaErrorCode
  message: string
  recoverable: boolean
  field?: QfbMediaFieldContext
  clientId?: string
}
export interface QfbMediaChange {
  field: QfbMediaFieldContext
  clientId: string
  state: QfbMediaState
  recovery?: boolean
}
export interface QfbMediaRuntimeItem {
  value: QfbMediaValue
  field: QfbMediaFieldContext
  state: QfbMediaState
  progress?: QfbMediaProgress
  error?: QfbMediaErrorDescription
  recovery?: boolean
}
export interface QfbMediaUploadItem {
  value: QfbMediaValue
  field: QfbMediaFieldContext
  idempotencyKey: string
}
export interface QfbMediaRemoval {
  documentId: string
  clientId: string
  idempotencyKey: string
}
export interface QfbMediaSnapshot {
  version: 1
  snapshotId: string
  scope: QfbMediaScope
  values: Record<string, unknown>
  committedValues: Record<string, unknown>
  fields: QfbMediaFieldContext[]
  uploads: QfbMediaUploadItem[]
  removals: QfbMediaRemoval[]
}
export interface QfbMediaRecoveryItem {
  value: QfbMediaValue
  field: QfbMediaFieldContext
}
export interface QfbMediaRecoveryState {
  version: 1
  scope: QfbMediaScope
  items: QfbMediaRecoveryItem[]
}
export interface QfbMediaUploadResult {
  results: QfbLinkedRemoteMedia[]
  errors: QfbMediaErrorDescription[]
}
export interface QfbMediaReconciliation {
  linked: Record<string, QfbLinkedRemoteMedia>
  unassigned: QfbUnassignedRemoteMedia[]
  errors: QfbMediaErrorDescription[]
}
export interface QfbMediaCandidate {
  binary: QfbMediaBinary
  name: string
  mimeType: string
  size: number
  durationMs?: number
}
export interface QfbMediaControllerOptions {
  scope: QfbMediaScope
  policy: MaybeRefOrGetter<QfbMediaPolicy | undefined | null>
  storage: QfbMediaStorageAdapter
  transport: QfbMediaTransportAdapter
  concurrency?: number
  readonly?: MaybeRefOrGetter<boolean>
  initialValues?: Record<string, unknown>
  initialSnapshot?: QfbMediaSnapshot
  initialRecovery?: QfbMediaRecoveryState
}
export interface QfbMediaController {
  readonly scope: Readonly<QfbMediaScope>
  readonly readonly: ComputedRef<boolean>
  readonly policy: ComputedRef<QfbMediaPolicy | undefined | null>
  readonly items: Readonly<Ref<Record<string, QfbMediaRuntimeItem>>>
  readonly recovery: ComputedRef<QfbMediaRecoveryState>
  readonly busy: ComputedRef<boolean>
  registerField: (
    field: QfbMediaFieldContext,
    options: () => QfbMediaFieldOptions,
    getValue: () => unknown,
  ) => () => void
  associateViewer: (
    readonly: () => boolean,
    onChange: (event: QfbMediaChange) => void,
    onError: (error: QfbMediaErrorDescription) => void,
  ) => () => void
  stage: (field: QfbMediaFieldContext, candidate: File | QfbMediaCandidate) => Promise<QfbMediaValue>
  beginCapture: (field: QfbMediaFieldContext) => {
    finish: (candidate: QfbMediaCandidate, recovery?: boolean) => Promise<QfbMediaValue>
    release: () => void
  }
  canApply: (clientId: string) => boolean
  prepare: (values: Record<string, unknown>) => Promise<QfbMediaSnapshot>
  uploadPending: (responseId: string, snapshot: QfbMediaSnapshot) => Promise<QfbMediaUploadResult>
  reconcile: (responseId: string) => Promise<QfbMediaReconciliation>
  applyRemote: (values: Record<string, unknown>, results: QfbLinkedRemoteMedia[]) => Record<string, unknown>
  applyRemovals: (responseId: string, snapshot: QfbMediaSnapshot) => Promise<QfbMediaErrorDescription[]>
  restore: (snapshot: QfbMediaSnapshot) => void
  markCommitted: (values: Record<string, unknown>) => void
  rollback: () => Record<string, unknown>
  confirmRecovered: (clientId: string, field?: QfbMediaFieldContext) => Promise<QfbMediaValue>
  discardRecovered: (clientId: string) => Promise<void>
  getSource: (value: QfbMediaValue | { documentId: string }) => Promise<QfbMediaSource>
  cancel: (clientId: string) => void
  dispose: () => void
}
