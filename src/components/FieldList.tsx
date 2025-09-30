'use client'

import { useEffect, useState, useCallback, useMemo } from "react"
import { FileWarning, RefreshCw } from 'lucide-react';
import { FieldListViewerSkeleton } from "@/components/Skeletons/FieldListViewerSkeleton";
import { FieldCard } from "./FieldCard"
import { ExtractedField } from "@/types";
import { loadExtractionData } from "@/data/extractions";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { useHighlightedField, useHighlightSetter } from "@/contexts/HighlightContext";

const MODIFIED_FIELDS_STORAGE_PREFIX = 'modified_fields_';

// Helper functions for localStorage operations
// const getFieldsFromStorage = (submissionId: string): VersionedField[] | null => {
//     try {
//         const key = `${FIELDS_STORAGE_PREFIX}${submissionId}`;
//         const stored = localStorage.getItem(key);
//         return stored ? JSON.parse(stored) : null;
//     } catch (error) {
//         console.warn('Failed to load fields from localStorage:', error);
//         return null;
//     }
// };



// const clearFieldsFromStorage = (submissionId: string): void => {
//     try {
//         const key = `${FIELDS_STORAGE_PREFIX}${submissionId}`;
//         localStorage.removeItem(key);
//     } catch (error) {
//         console.warn('Failed to clear fields from localStorage:', error);
//     }
// };



interface VersionedField extends ExtractedField {
    originalValue: string;
    modifiedValue?: string;
}

const FieldList = () => {
    // Base extracted fields (immutably replaced on submission change)
    const [baseFields, setBaseFields] = useState<VersionedField[]>([]);
    // Only store modified entries (with originalValue + modifiedValue)
    const [modifiedFields, setModifiedFields] = useState<VersionedField[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { state } = useSelectionUrlState();
    const highlightedField = useHighlightedField();
    const highlightField = useHighlightSetter();

    // Merge base + modifications into a single derived array for rendering (declare early for downstream effects)
    const mergedFields: VersionedField[] = useMemo(() => {
        if (!baseFields.length) return [];
        if (!modifiedFields.length) return baseFields;
        const modMap = new Map(modifiedFields.map(m => [m.id, m]));
        return baseFields.map(f => {
            const mod = modMap.get(f.id);
            if (!mod) return f;
            return { ...f, modifiedValue: mod.modifiedValue };
        });
    }, [baseFields, modifiedFields]);

    const loadModifiedFields = useCallback((submissionId: string): VersionedField[] => {
        try {
            const key = `${MODIFIED_FIELDS_STORAGE_PREFIX}${submissionId}`;
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : [];
            if (Array.isArray(parsed)) {
                setModifiedFields(parsed);
                return parsed;
            }
            setModifiedFields([]);
            return [];
        } catch (error) {
            console.warn('Failed to load modified fields from localStorage:', error);
            setModifiedFields([]);
            return [];
        }
    }, []);

    const saveModifiedFields = useCallback((submissionId: string, mods: VersionedField[]): void => {
        try {
            const key = `${MODIFIED_FIELDS_STORAGE_PREFIX}${submissionId}`;
            // Persist only necessary info: id, originalValue, modifiedValue
            localStorage.setItem(key, JSON.stringify(mods.map(m => ({
                id: m.id,
                originalValue: m.originalValue,
                modifiedValue: m.modifiedValue,
                name: m.name,
                confidence: m.confidence,
                provenance: m.provenance,
                value: m.value
            }))));
        } catch (error) {
            console.warn('Failed to save modified fields to localStorage:', error);
        }
    }, []);

    /**
     * React to context highlight requests
     * @returns void
     * @description This is the useEffect hook that reacts to context highlight requests and scrolls to the highlighted field
     */
    // Primary highlight effect (triggered when highlightedField changes)
    useEffect(() => {
        if (!highlightedField) return;
        const fieldExists = mergedFields.some(f => f.id === highlightedField.id);
        if (!fieldExists) return; // wait until data arrives
        const scrollTo = () => {
            const fieldElement = document.querySelector(`[data-field-value="${highlightedField.id}"]`);
            if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        };
        const t = window.setTimeout(scrollTo, 40);
        return () => window.clearTimeout(t);
    }, [highlightedField, mergedFields]);

    // Secondary effect: if fields arrive after highlight was set, attempt scroll
    useEffect(() => {
        if (!highlightedField) return;
        const fieldExists = mergedFields.some(f => f.id === highlightedField.id);
        if (!fieldExists) return;
        // If we got here due to mergedFields change, ensure element highlight styling applies (no scroll if already in view)
        const el = document.querySelector(`[data-field-value="${highlightedField.id}"]`);
        if (!el) return;
        el.classList.add('data-highlight-active');
        const cleanup = () => el.classList.remove('data-highlight-active');
        return cleanup;
    }, [mergedFields, highlightedField]);


    /**
     * Load the fields based the submission id
     * @returns void
     * @description This is the useEffect hook that loads the fields based the submission id
     */
    const getExtractedFields = useCallback(async () => {
        if (!state.submissionId) return;
        const result = await loadExtractionData(state.submissionId);
        const incoming = result?.extractedFields || [];
        const versioned = incoming.map(f => ({ ...f, originalValue: f.value }));
        setBaseFields(versioned);
        loadModifiedFields(state.submissionId);
    }, [state.submissionId, loadModifiedFields]);

    useEffect(() => {
        const loadFields = async () => {
            if (!state.submissionId) return;
            try {
                setIsLoading(true);
                await getExtractedFields();
            } catch (error) {
                console.error('Failed to load extraction data:', error);
                setBaseFields([]);
                setModifiedFields([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadFields();
    }, [state.submissionId, getExtractedFields]);

    const handleRefetch = useCallback(async () => {
        if (!state.submissionId) return;
        try {
            setIsLoading(true);
            await getExtractedFields();
        } catch (e) {
            console.error('Refetch failed', e);
        } finally {
            setIsLoading(false);
        }
    }, [state.submissionId, getExtractedFields]);


    const handleEdit = useCallback((id: string, newValue: string) => {
        setModifiedFields(prev => {
            // Find base field for original value
            const base = baseFields.find(f => f.id === id);
            if (!base) return prev; // unknown id
            const existing = prev.find(f => f.id === id);
            let updated: VersionedField[];
            if (existing) {
                updated = prev.map(m => m.id === id ? { ...m, modifiedValue: newValue } : m);
            } else {
                updated = [...prev, { ...base, modifiedValue: newValue }];
            }
            if (state.submissionId) {
                saveModifiedFields(state.submissionId, updated);
            }
            return updated;
        });
    }, [baseFields, state.submissionId, saveModifiedFields]);

    // Revert a modified field when user cancels while draft differs from original and hasn't been confirmed
    const handleCancelEdit = useCallback((id: string) => {
        setModifiedFields(prev => {
            const existing = prev.find(f => f.id === id);
            if (!existing) return prev; // nothing to revert
            // Remove the modified record so we fall back to originalValue
            const updated = prev.filter(f => f.id !== id);
            if (state.submissionId) {
                saveModifiedFields(state.submissionId, updated);
            }
            return updated;
        });
    }, [state.submissionId, saveModifiedFields]);

    // Utility function to reset all fields to original values
    const resetFields = useCallback(async () => {
        if (!state.submissionId) return;
        setModifiedFields([]);
        saveModifiedFields(state.submissionId, []);
        try {
            // Re-fetch to ensure baseFields reflect original extraction values in case they were mutated downstream
            const result = await loadExtractionData(state.submissionId);
            const incoming = result?.extractedFields || [];
            const versioned = incoming.map(f => ({ ...f, originalValue: f.value }));
            setBaseFields(versioned);
        } catch (e) {
            console.warn('Reset refetch failed', e);
        }
    }, [state.submissionId, saveModifiedFields]);



    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {/* Header (hidden while loading) */}
            {!isLoading && (
                <div className="shrink-0 px-4 py-2 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Field List</h2>
                        {
                            modifiedFields.length > 0 && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={resetFields}
                                        className="text-xs px-2 cursor-pointer py-1 bg-red-100 hover:bg-red-200 rounded text-red-700"
                                        title="Reset all fields to original values"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            )
                        }
                    </div>
                </div>
            )}
            {/* Scrollable list region */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm">
                        <FieldListViewerSkeleton />
                    </div>
                )}
                {!isLoading && mergedFields.length === 0 && (
                    <div className="flex items-center justify-center py-10 select-none">
                        <div className="border rounded-md bg-white shadow-sm p-6 w-full max-w-sm text-center space-y-3">
                            <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <FileWarning className="h-6 w-6 text-amber-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No Extracted Fields</h3>
                            <p className="text-xs text-gray-500">
                                We couldn't find any extracted fields for this submission.
                            </p>
                            <div className="pt-1 flex justify-center">
                                <button
                                    onClick={handleRefetch}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={"h-3 w-3 "} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!isLoading && mergedFields.length > 0 && mergedFields.map((field, i: number) => {
                    const effectiveValue = field.modifiedValue ?? field.value;
                    const isModified = field.modifiedValue !== undefined && field.modifiedValue !== field.originalValue;
                    const isHighlighted = highlightedField?.id === field.id;
                    return (
                        <FieldCard
                            key={field.id ?? i}
                            data-field-value={field.id}
                            data-highlighted={isHighlighted || undefined}
                            label={field.name}
                            value={effectiveValue}
                            placeholder={field.originalValue}
                            onEdit={(v) => handleEdit(field.id, v)}
                            onCancel={() => handleCancelEdit(field.id)}
                            onDelete={() => { }}
                            editable={true}
                            disabled={false}
                            status={isModified ? "modified" : "original"}
                            onCopy={() => { }}
                            confidence={field.confidence}
                            provenanceSnippet={field.provenance?.snippet}
                            onSnippetClick={(snippet) => {
                                highlightField(field);
                            }}
                            className={isHighlighted ? "ring-2 ring-blue-500/70 outline outline-2 outline-blue-400 bg-blue-50/60 shadow-sm transition-colors" : "transition-colors"}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default FieldList