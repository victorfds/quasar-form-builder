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

export function useEventListener<
  E extends keyof GlobalEventHandlersEventMap,
  Fn extends (e: GlobalEventHandlersEventMap[E]) => void,
>(
  target: EventTargetRef,
  eventType: E,
  handler: Fn,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const element = unref(target)

  const eventHandler = (e: GlobalEventHandlersEventMap[E]) => {
    handler(e)
  }

  element?.addEventListener(eventType, eventHandler as EventListener, options)

  const stop = () => {
    element?.removeEventListener(eventType, eventHandler as EventListener, options)
  }

  return stop
}
