'use client'

import { useCallback, useEffect } from 'react';
import { isInsideInputField, findElementInContainer, dispatchCustomEvent } from '@/utils/domUtils';
import { ExtractedField } from '@/types';

interface Fields extends ExtractedField {
  originalValue: string;
  modifiedValue: string;
  status: "modified" | "original";
}

interface UseKeyboardNavigationProps {
  fields: Fields[];
  focusedFieldIndex: number;
  setFocusedFieldIndex: (updater: (prev: number) => number) => void;
  onHighlightField: (field: ExtractedField) => void;
  userInitiatedHighlightRef: React.RefObject<string | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const useKeyboardNavigation = ({
  fields,
  focusedFieldIndex,
  setFocusedFieldIndex,
  onHighlightField,
  userInitiatedHighlightRef,
  containerRef
}: UseKeyboardNavigationProps) => {
  
  // Memoize keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (fields.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedFieldIndex((prev: number) => 
          prev < fields.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedFieldIndex((prev: number) => 
          prev > 0 ? prev - 1 : fields.length - 1
        );
        break;
        
      case 'Enter':
        // Only trigger highlight if we're not inside an input field
        if (!isInsideInputField(document.activeElement) && focusedFieldIndex >= 0 && focusedFieldIndex < fields.length) {
          event.preventDefault();
          const field = fields[focusedFieldIndex];
          userInitiatedHighlightRef.current = field.id;
          onHighlightField(field);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setFocusedFieldIndex(() => -1);
        break;
        
      case 'e':
        if (event.ctrlKey || event.metaKey) { // Ctrl+E or Cmd+E
          // Only trigger if we're not inside an input field
          if (!isInsideInputField(document.activeElement)) {
            event.preventDefault();
            if (focusedFieldIndex >= 0 && focusedFieldIndex < fields.length) {
              // Trigger edit mode for the focused field
              const focusedElement = findElementInContainer(containerRef.current, `[data-field-index="${focusedFieldIndex}"]`);
              if (focusedElement) {
                // Find the FieldInput component within the focused field and trigger double-click
                const fieldInput = focusedElement.querySelector('[data-field-input]') as HTMLElement;
                if (fieldInput) {
                  dispatchCustomEvent(fieldInput, 'dblclick', {
                    bubbles: true,
                    cancelable: true    
                  });
                }
              }
            }
          }
        }
        break;
    }
  }, [fields, focusedFieldIndex, setFocusedFieldIndex, onHighlightField, userInitiatedHighlightRef, containerRef]);

  // Set up keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, containerRef]);

  return {
    handleKeyDown
  };
};
