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
export function useEventListener<
  T extends Ref<HTMLElement | null>,
  E extends keyof HTMLElementEventMap,
  Fn extends (e: HTMLElementEventMap[E]) => void
>(
  target: T,
  eventType: E,
  handler: Fn,
  options?: boolean | AddEventListenerOptions
): () => void {
  const element = unref(target)

  const eventHandler = (e: HTMLElementEventMap[E]) => {
    handler(e);
  }

  element?.addEventListener(eventType, eventHandler, options)

  const stop = () => {
    element?.removeEventListener(eventType, eventHandler, options)
  }

  return stop
}
