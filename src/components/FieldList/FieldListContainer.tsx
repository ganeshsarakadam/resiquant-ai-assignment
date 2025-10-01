'use client'

import { FieldCard } from "@/components/FieldList/FieldCard";
import { EmptyFieldsState } from "@/components/FieldList/EmptyFieldsState";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { ExtractedField } from "@/types";
import { useHighlight } from "@/contexts/HighlightContext";
import { useExtractionFields } from "@/hooks/useExtractionFields";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { scrollToElement, findElementInContainer } from "@/utils/domUtils";

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

  const handleRefetch = useCallback(async () => {
    if (state.submissionId) {
      await loadExtractionFields(state.submissionId, true);
    }
  }, [state.submissionId, loadExtractionFields]);

  // Use keyboard navigation hook
  useKeyboardNavigation({
    fields,
    focusedFieldIndex,
    setFocusedFieldIndex,
    onHighlightField: highlightField,
    userInitiatedHighlightRef,
    containerRef
  });

  // Memoize field styles calculation
  const fieldStylesMap = useMemo(() => {
    return fields.map((field, index) => {
      const isHighlighted = highlightedField?.id === field.id;
      const isFocused = focusedFieldIndex === index;
      const value = field.modifiedValue || field.originalValue;
      
      return {
        field,
        index,
        isHighlighted,
        isFocused,
        value,
        styles: isHighlighted || isFocused ? "ring-2 ring-blue-500 bg-blue-50" : ""
      };
    });
  }, [fields, highlightedField, focusedFieldIndex]);

  // Scroll focused field into view
  useEffect(() => {
    if (focusedFieldIndex >= 0) {
      const focusedElement = findElementInContainer(containerRef.current, `[data-field-index="${focusedFieldIndex}"]`);
      scrollToElement(focusedElement);
    }
  }, [focusedFieldIndex]);

  // Listen to highlighted field changes (only scroll if not user-initiated)
  useEffect(() => {
    if (highlightedField) {
      // Only scroll if the highlight came from external source 
      // Skip scrolling if user just clicked a snippet (they're already looking at it)
      const isUserInitiated = userInitiatedHighlightRef.current === highlightedField.id;
      
      if (!isUserInitiated) {
        const element = findElementInContainer(containerRef.current, `[data-key-value="${highlightedField.id}"]`);
        scrollToElement(element);
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
  }, [highlightedField, fields, setFocusedFieldIndex, userInitiatedHighlightRef]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 focus:outline-none"
      tabIndex={0}
      role="listbox"
      aria-label="Field list"
      aria-activedescendant={focusedFieldIndex >= 0 ? `field-${fields[focusedFieldIndex]?.id}` : undefined}
    >
      {fields.length > 0 && fieldStylesMap.map(({ field, index, value, styles }) => (
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
          onCancel={() => { }}
          disabled={false}
          confidence={field.confidence}
          provenanceSnippet={field.provenance?.snippet}
          onSnippetClick={() => onSnippetClick(field)}
          className={styles}
        />
      ))}
      {fields.length === 0 && (
        <EmptyFieldsState isLoading={isLoading} onRefetch={handleRefetch} />
      )}
    </div>
  );
};
