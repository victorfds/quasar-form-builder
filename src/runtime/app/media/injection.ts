import type { InjectionKey, Ref } from 'vue'
import type { QfbMediaController, QfbMediaErrorDescription } from './types'

export const qfbMediaControllerKey: InjectionKey<Readonly<Ref<QfbMediaController | undefined>>>
  = Symbol('qfb-media-controller')
export const qfbViewerReadonlyKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('qfb-viewer-readonly')
export const qfbMediaErrorKey: InjectionKey<(error: QfbMediaErrorDescription) => void> = Symbol('qfb-media-error')
