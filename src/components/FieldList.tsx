'use client'

import { useEffect, useState, useCallback } from "react"
import { FieldCard } from "./FieldCard"
import { ExtractedField } from "@/types";
import { loadExtractionData } from "@/data/extractions";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { useHighlightedField, useHighlightSetter } from "@/contexts/HighlightContext";

const FIELDS_STORAGE_PREFIX = 'extracted_fields_';

// Helper functions for localStorage operations
const getFieldsFromStorage = (submissionId: string): VersionedField[] | null => {
    try {
        const key = `${FIELDS_STORAGE_PREFIX}${submissionId}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.warn('Failed to load fields from localStorage:', error);
        return null;
    }
};

const saveFieldsToStorage = (submissionId: string, fields: VersionedField[]): void => {
    try {
        const key = `${FIELDS_STORAGE_PREFIX}${submissionId}`;
        localStorage.setItem(key, JSON.stringify(fields));
    } catch (error) {
        console.warn('Failed to save fields to localStorage:', error);
    }
};

const clearFieldsFromStorage = (submissionId: string): void => {
    try {
        const key = `${FIELDS_STORAGE_PREFIX}${submissionId}`;
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to clear fields from localStorage:', error);
    }
};



interface VersionedField extends ExtractedField {
    originalValue: string;
    modifiedValue?: string;
}

const FieldList = () => {
    const [fields, setFields] = useState<VersionedField[]>([]);
    const { state } = useSelectionUrlState();
    const highlightedField = useHighlightedField();
    const highlightField = useHighlightSetter();

    // React to context highlight requests
    useEffect(() => {
      if (!highlightedField) return;
      // Ensure fields are loaded before attempting scroll
      const fieldExists = fields.some(f => f.id === highlightedField.id);
      if (!fieldExists) return;
      
      const scrollTo = () => {
        const fieldElement = document.querySelector(`[data-field-value="${highlightedField.id}"]`);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      };
      // slight delay to let layout settle
      setTimeout(scrollTo, 50);
    }, [highlightedField, fields]);

    useEffect(() => {
        const loadFields = async () => {
            if (!state.submissionId) return;
            const storedFields = getFieldsFromStorage(state.submissionId);
            if (storedFields && storedFields.length > 0) {
                setFields(storedFields);
            } else {
                try {
                    const result = await loadExtractionData(state.submissionId);
                    // console.log('Loaded extraction data:', result);
                    const incoming = result?.extractedFields || [];
                    const versionedFields = incoming.map(f => ({ ...f, originalValue: f.value }));
                    setFields(versionedFields);
                    if (versionedFields.length > 0) {
                        saveFieldsToStorage(state.submissionId, versionedFields);
                    }
                } catch (error) {
                    console.error('Failed to load extraction data:', error);
                    setFields([]);
                }
            }
        };

        loadFields();
    }, [state.submissionId]);

    const handleEdit = useCallback((id: string, newValue: string) => {
        setFields(prev => {
            const updated = prev.map(f => {
                if ((f.id ?? "") === id) {
                    return { ...f, modifiedValue: newValue };
                }
                return f;
            });
            if (state.submissionId) {
                saveFieldsToStorage(state.submissionId, updated);
            }

            return updated;
        });
    }, [state.submissionId]);

    // Utility function to reset all fields to original values
    const resetFields = useCallback(() => {
        if (!state.submissionId) return;

        setFields(prev => {
            const reset = prev.map(f => ({ ...f, modifiedValue: undefined }));
            saveFieldsToStorage(state.submissionId, reset);
            return reset;
        });
    }, [state.submissionId]);



    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {/* Header (not scrollable) */}
            <div className="shrink-0 px-4 py-2 border-b bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Field List</h2>
                    <div className="flex gap-1">
                        <button
                            onClick={resetFields}
                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700"
                            title="Reset all fields to original values"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
            {/* Scrollable list region */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                {fields.map((field, i: number) => {
                    const effectiveValue = field.modifiedValue ?? field.originalValue;
                    const isModified = field.modifiedValue !== undefined && field.modifiedValue !== field.originalValue;
                    const isHighlighted = highlightedField?.id === field.id;
                    
                    if (isHighlighted) {
                        // console.log('Field is highlighted:', field.name, field.id);
                    }
                    
                                        return (
                                                                        <FieldCard
                                                                                key={field.id ?? i}
                                                                                data-field-value={field.id}
                            label={field.name}
                            value={effectiveValue}
                            placeholder={field.originalValue}
                            onEdit={(v) => handleEdit(field.id, v)}
                            onDelete={() => { }}
                            editable={true}
                            disabled={false}
                            status={isModified ? "modified" : "original"}
                            onCopy={() => { }}
                            confidence={field.confidence}
                            provenanceSnippet={field.provenance?.snippet}
                            onSnippetClick={(snippet) => {
                                // console.log('Provenance snippet clicked:', snippet, 'from field', field.name);
                                
                                // Use context to highlight field - it will handle document selection automatically
                                highlightField(field);
                            }}
                            className={isHighlighted ? "ring-2 ring-blue-500 bg-blue-50/50 !ring-opacity-100" : ""}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default FieldList