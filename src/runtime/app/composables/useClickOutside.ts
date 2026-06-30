/**
 * Adds an event listener to the outer element that triggers a handler function
 * when a click occurs outside the specified target element.
 *
 * @param outerElement - A VueJS reference to the outer HTML element to listen for click events on.
 * @param target - A VueJS reference to the target HTML element to check for outside clicks.
 * @param handler - A function to handle the click event when it occurs outside the target element.
 * @param {boolean | AddEventListenerOptions} [options] - Optional options object for the event listener.
 * @returns A function to remove the event listener.
 *
 * @example
 * ```typescript
 * const outerElement = ref<HTMLElement | null>(null);
 * const targetElement = ref<HTMLElement | null>(null);
 * const handleClickOutside = (e: MouseEvent) => { console.log('Clicked outside!'); };
 * const stopListening = useClickOutside(outerElement, targetElement, handleClickOutside);
 *
 * // To remove the event listener later:
 * stopListening();
 * ```
 */
type EventTargetRef = Ref<EventTarget | null> | EventTarget | null

export function useClickOutside<F extends Ref<HTMLElement | null>, Fn extends (e: MouseEvent) => void>(
  outerElement: EventTargetRef,
  target: F,
  handler: Fn,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const eventHandler = (e: MouseEvent) => {
    const el = unref(target)
    const shouldHandle = !!(el && !e.composedPath().includes(el))
    if (shouldHandle)
      handler(e)
  }

  const eventTarget = unref(outerElement) ?? document
  const stop = useEventListener(eventTarget, 'click', eventHandler, options)

  return stop
}
