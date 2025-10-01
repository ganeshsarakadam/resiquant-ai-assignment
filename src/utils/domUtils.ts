/**
 * Utility functions for DOM operations and element detection
 */

/**
 * Checks if the given element is an input field (INPUT, TEXTAREA, or contentEditable)
 */
export const isInsideInputField = (element: Element | null): boolean => {
  return element !== null && (
    element.tagName === 'INPUT' || 
    element.tagName === 'TEXTAREA' ||
    (element as HTMLElement).contentEditable === 'true'
  );
};

/**
 * Safely scrolls an element into view with error handling
 */
export const scrollToElement = (element: HTMLElement | null, options?: ScrollIntoViewOptions): void => {
  if (!element) return;
  
  try {
    element.scrollIntoView(options || { 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
  } catch (error) {
    console.warn('Failed to scroll element into view:', error);
  }
};

/**
 * Safely finds an element by selector within a container
 */
export const findElementInContainer = (
  container: HTMLElement | null, 
  selector: string
): HTMLElement | null => {
  if (!container) return null;
  
  try {
    return container.querySelector(selector) as HTMLElement | null;
  } catch (error) {
    console.warn(`Failed to find element with selector "${selector}":`, error);
    return null;
  }
};

/**
 * Safely dispatches a custom event
 */
export const dispatchCustomEvent = (
  element: HTMLElement | null,
  eventType: string,
  options?: EventInit
): boolean => {
  if (!element) return false;
  
  try {
    return element.dispatchEvent(new Event(eventType, options));
  } catch (error) {
    console.warn(`Failed to dispatch "${eventType}" event:`, error);
    return false;
  }
};

