import type { Ref } from 'vue'
import type { BuilderEventMap } from '#qfb/types'
import { unref } from 'vue'

/**
 * A composable for adding and removing an event listener.
 *
 *
 * @param target - A VueJS reference to the target HTML element to listen for events on.
 * @param eventType - The type of the event to listen for.
 * @param handler - A function to handle the event when it occurs.
 * @param [options] - Optional options object for the event listener.
 *
 * @returns {() => void} - A function to remove the event listener.
 *
 * @example
 * ```ts
 * const stop = useEventListener(refElement, 'click', (e) => {
 *   console.log('Element clicked:', e);
 * });
 *
 * onUnmounted(() => {
 *   stop();
 * });
 * ```
 */
type EventTargetRef = Ref<EventTarget | null> | EventTarget | null

type KnownEventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap & GlobalEventHandlersEventMap & BuilderEventMap

export function useEventListener<
  E extends keyof KnownEventMap,
  Fn extends (e: KnownEventMap[E]) => void,
>(
  target: EventTargetRef,
  eventType: E,
  handler: Fn,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const element = unref(target)

  const eventHandler = (e: KnownEventMap[E]) => {
    handler(e)
  }

  element?.addEventListener(eventType, eventHandler as EventListener, options)

  const stop = () => {
    element?.removeEventListener(eventType, eventHandler as EventListener, options)
  }

  return stop
}
