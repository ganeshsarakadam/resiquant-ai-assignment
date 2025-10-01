'use client'

import { FieldCard } from "@/components/FieldList/FieldCard";
import { EmptyFieldsState } from "@/components/FieldList/EmptyFieldsState";
import { useEffect, useRef } from "react";
import { ExtractedField } from "@/types";
import { useHighlight } from "@/contexts/HighlightContext";
import { useExtractionFields } from "@/hooks/useExtractionFields";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";

interface Fields extends ExtractedField {
  originalValue: string;
  modifiedValue: string;
  status: "modified" | "original";
}

interface FieldListContainerProps {
  fields: Fields[];
  focusedFieldIndex: number;
  highlightedField: ExtractedField | null;
  onFieldEdit: (fieldId: string, newValue: string) => void;
  onSnippetClick: (field: Fields) => void;
  setFocusedFieldIndex: (updater: (prev: number) => number) => void;
  userInitiatedHighlightRef: React.RefObject<string | null>;
}

export const FieldListContainer = ({
  fields,
  focusedFieldIndex,
  highlightedField,
  onFieldEdit,
  onSnippetClick,
  setFocusedFieldIndex,
  userInitiatedHighlightRef
}: FieldListContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { highlightField } = useHighlight();
  const { state } = useSelectionUrlState();
  const { loadExtractionFields, isLoading } = useExtractionFields();

  const handleRefetch = async () => {
    if (state.submissionId) {
      await loadExtractionFields(state.submissionId, true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
          const activeElement = document.activeElement;
          const isInsideInput = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement as HTMLElement).contentEditable === 'true'
          );
          
          if (!isInsideInput && focusedFieldIndex >= 0 && focusedFieldIndex < fields.length) {
            event.preventDefault();
            const field = fields[focusedFieldIndex];
            userInitiatedHighlightRef.current = field.id;
            highlightField(field);
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          setFocusedFieldIndex(() => -1);
          break;
          
        case 'e':
          if (event.ctrlKey || event.metaKey) { // Ctrl+E or Cmd+E
            // Only trigger if we're not inside an input field
            const activeElement = document.activeElement;
            const isInsideInput = activeElement && (
              activeElement.tagName === 'INPUT' || 
              activeElement.tagName === 'TEXTAREA' ||
              (activeElement as HTMLElement).contentEditable === 'true'
            );
            
            if (!isInsideInput) {
              event.preventDefault();
              if (focusedFieldIndex >= 0 && focusedFieldIndex < fields.length) {
                // Trigger edit mode for the focused field
                const focusedElement = document.querySelector(`[data-field-index="${focusedFieldIndex}"]`);
                if (focusedElement) {
                  // Find the FieldInput component within the focused field and trigger double-click
                  const fieldInput = focusedElement.querySelector('[data-field-input]');
                  if (fieldInput) {
                    fieldInput.dispatchEvent(new MouseEvent('dblclick', {
                      bubbles: true,
                      cancelable: true    
                    }));
                  }
                }
              }
            }
          }
          break;
      }
    };

    // Add event listener to the container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [fields, focusedFieldIndex, highlightField, setFocusedFieldIndex, userInitiatedHighlightRef]);

  // Scroll focused field into view
  useEffect(() => {
    if (focusedFieldIndex >= 0 && containerRef.current) {
      const focusedElement = document.querySelector(`[data-field-index="${focusedFieldIndex}"]`);
      if (focusedElement) {
        focusedElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [focusedFieldIndex]);

  // Listen to highlighted field changes (only scroll if not user-initiated)
  useEffect(() => {
    if (highlightedField) {
      // Only scroll if the highlight came from external source 
      // Skip scrolling if user just clicked a snippet (they're already looking at it)
      const isUserInitiated = userInitiatedHighlightRef.current === highlightedField.id;
      
      if (!isUserInitiated) {
        let element = document.querySelector(`[data-key-value="${highlightedField.id}"]`);   
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        // Clear keyboard focus only for external highlights (from document viewer)
        // This prevents mixed visual states (green focus + blue highlight)
        setFocusedFieldIndex(() => -1);
      } else {
        // For user-initiated highlights (Enter key), maintain keyboard focus
        // Find the index of the highlighted field to keep navigation continuity
        const highlightedIndex = fields.findIndex(field => field.id === highlightedField.id);
        if (highlightedIndex >= 0) {
          setFocusedFieldIndex(() => highlightedIndex);
        }
      }
      
      // Clear the ref after processing
      userInitiatedHighlightRef.current = null;
    }
  }, [highlightedField, fields, setFocusedFieldIndex]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 focus:outline-none"
      tabIndex={0}
      role="listbox"
      aria-label="Field list"
      aria-activedescendant={focusedFieldIndex >= 0 ? `field-${fields[focusedFieldIndex]?.id}` : undefined}
    >
      {fields.length > 0 && fields.map((field, index) => {
        const isHighlighted = highlightedField?.id === field.id;
        const isFocused = focusedFieldIndex === index;
        const value = field.modifiedValue || field.originalValue;
        
        // Priority: Highlighted > Focused (both use same blue styling)
        const getFieldStyles = () => {
          if (isHighlighted || isFocused) {
            return "ring-2 ring-blue-500 bg-blue-50";
          }
          return "";
        };
        
        return (
          <FieldCard
            data-key-value={field.id}
            data-field-index={index}
            key={field.id}
            label={field.name}
            value={value}
            placeholder={field.originalValue}
            status={field.status}
            onEdit={(newValue: string) => onFieldEdit(field.id, newValue)}
            onDelete={() => { }}
            onConfirm={() => { }}
            onCancel={() => { }}
            editable={true}
            disabled={false}
            confidence={field.confidence}
            provenanceSnippet={field.provenance?.snippet}
            onSnippetClick={() => onSnippetClick(field)}
            className={getFieldStyles()}
          />
        );
      })}
      {fields.length === 0 && (
        <EmptyFieldsState isLoading={isLoading} onRefetch={handleRefetch} />
      )}
    </div>
  );
};
