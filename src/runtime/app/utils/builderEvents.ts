import type { BuilderEventMap } from '#qfb/types'

type BuilderEventDetail<EventName extends keyof BuilderEventMap>
  = BuilderEventMap[EventName] extends CustomEvent<infer Detail> ? Detail : never

export function dispatchBuilderEvent<EventName extends keyof BuilderEventMap>(
  eventName: EventName,
  detail?: BuilderEventDetail<EventName>,
): void {
  if (!import.meta.client) return
  window.dispatchEvent(new CustomEvent(eventName, { detail }) as BuilderEventMap[EventName])
}
