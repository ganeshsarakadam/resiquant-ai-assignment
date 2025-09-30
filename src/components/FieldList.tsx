'use client'

import { useEffect, useState, useCallback, useMemo } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import { FieldListViewerSkeleton } from "@/components/Skeletons/FieldListViewerSkeleton";
import { FieldCard } from "./FieldCard";
import { ExtractedField } from "@/types";
import { loadExtractionData } from "@/data/extractions";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { useHighlightedField, useHighlightSetter } from "@/contexts/HighlightContext";

const MODIFIED_FIELDS_STORAGE_PREFIX = 'modified_fields_';

// LocalStorage schema: array of { id, modifiedValue } persisted per submission

interface VersionedField extends ExtractedField {
    originalValue: string;
    modifiedValue?: string;
}

const FieldList = () => {
    const [baseFields, setBaseFields] = useState<VersionedField[]>([]);
    const [modMap, setModMap] = useState<Record<string, string>>({}); // id -> modifiedValue
    const [isLoading, setIsLoading] = useState(true);
    const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1); // keyboard/mouse selection (not yet highlighted)
    const { state } = useSelectionUrlState();
    const highlightedField = useHighlightedField();
    const highlightField = useHighlightSetter();

    const mergedFields = useMemo(() => (
        baseFields.map(f => (
            modMap[f.id] !== undefined ? { ...f, modifiedValue: modMap[f.id] } : f
        ))
    ), [baseFields, modMap]);

    const loadModifiedFields = useCallback((submissionId: string) => {
        try {
            const stored = localStorage.getItem(`${MODIFIED_FIELDS_STORAGE_PREFIX}${submissionId}`);
            if (!stored) { setModMap({}); return; }
            const arr: Array<{ id: string; modifiedValue?: string }> = JSON.parse(stored);
            const next: Record<string, string> = {};
            arr.forEach(r => { if (r.modifiedValue !== undefined) next[r.id] = r.modifiedValue; });
            setModMap(next);
        } catch (e) {
            console.warn('Failed to load modified fields', e); setModMap({});
        }
    }, []);

    const persistMods = useCallback((submissionId: string, map: Record<string, string>) => {
        try {
            const arr = Object.entries(map).map(([id, modifiedValue]) => ({ id, modifiedValue }));
            localStorage.setItem(`${MODIFIED_FIELDS_STORAGE_PREFIX}${submissionId}`, JSON.stringify(arr));
        } catch (e) { console.warn('Failed saving modified fields', e); }
    }, []);

    /**
     * React to context highlight requests
     * @returns void
     * @description This is the useEffect hook that reacts to context highlight requests and scrolls to the highlighted field
     */
    // Highlight + scroll (single effect)
    useEffect(() => {
        if (!highlightedField) return;
        const id = highlightedField.id;
        const exists = mergedFields.some(f => f.id === id);
        if (!exists) return;
        const el = document.querySelector(`[data-field-value="${id}"]`);
        if (!el) return;
        el.classList.add('data-highlight-active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const t = setTimeout(() => el.classList.remove('data-highlight-active'), 1500);
        return () => clearTimeout(t);
    }, [highlightedField, mergedFields]);

    // Sync activeIndex when a field becomes highlighted externally (snippet or other trigger)
    useEffect(() => {
        if (!highlightedField) return;
        const idx = mergedFields.findIndex(f => f.id === highlightedField.id);
        if (idx !== -1) setActiveIndex(idx);
    }, [highlightedField, mergedFields]);

    // Keyboard navigation: arrows change activeIndex only; Enter triggers highlight
    useEffect(() => {
        const handleKeyDown = (event: Event) => {
            const e = event as KeyboardEvent;
            if (mergedFields.length === 0) return;
            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    setIsKeyboardNavigating(true);
                    setActiveIndex(prev => {
                        if (prev < 0) return 0;
                        return (prev + 1) % mergedFields.length;
                    });
                    break; }
                case 'ArrowUp': {
                    e.preventDefault();
                    setIsKeyboardNavigating(true);
                    setActiveIndex(prev => {
                        if (prev < 0) return mergedFields.length - 1;
                        return (prev - 1 + mergedFields.length) % mergedFields.length;
                    });
                    break; }
                case 'Enter': {
                    if (activeIndex >= 0 && activeIndex < mergedFields.length) {
                        e.preventDefault();
                        highlightField(mergedFields[activeIndex]);
                    }
                    break; }
                case 'Escape': {
                    e.preventDefault();
                    setIsKeyboardNavigating(false);
                    setActiveIndex(-1);
                    break; }
            }
        };
        const container = document.querySelector('[data-field-list-container]');
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            return () => container.removeEventListener('keydown', handleKeyDown);
        }
    }, [mergedFields, activeIndex, highlightField]);

    // Scroll active field into view when navigating via keyboard
    useEffect(() => {
        if (activeIndex < 0 || !isKeyboardNavigating) return;
        const field = mergedFields[activeIndex];
        if (!field) return;
        const el = document.querySelector(`[data-field-value="${field.id}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }, [activeIndex, isKeyboardNavigating, mergedFields]);


    /**
     * Load the fields based the submission id
     * @returns void
     * @description This is the useEffect hook that loads the fields based the submission id
     */
    const getExtractedFields = useCallback(async () => {
        if (!state.submissionId) return;
        const result = await loadExtractionData(state.submissionId);
        const incoming = (result?.extractedFields || []).map(f => ({ ...f, originalValue: f.value }));
        setBaseFields(incoming);
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
                setModMap({});
            } finally {
                setIsLoading(false);
            }
        };
        loadFields();
    }, [state.submissionId, getExtractedFields]);

    const handleRefetch = useCallback(async () => {
        if (!state.submissionId) return;
        setIsLoading(true);
        try { await getExtractedFields(); }
        catch (e) { console.error('Refetch failed', e); }
        finally { setIsLoading(false); }
    }, [state.submissionId, getExtractedFields]);


    const handleEdit = useCallback((id: string, newValue: string) => {
        setModMap(prev => {
            if (!state.submissionId) return prev;
            const base = baseFields.find(f => f.id === id);
            if (!base) return prev; // ignore unknown
            const next = { ...prev, [id]: newValue };
            // If value matches original remove entry
            if (newValue === base.originalValue) { delete next[id]; }
            persistMods(state.submissionId, next);
            return next;
        });
    }, [baseFields, state.submissionId, persistMods]);

    // Revert a modified field when user cancels while draft differs from original and hasn't been confirmed
    const handleCancelEdit = useCallback((id: string) => {
        if (!state.submissionId) return;
        setModMap(prev => {
            if (!(id in prev)) return prev;
            const next = { ...prev }; delete next[id];
            persistMods(state.submissionId!, next);
            return next;
        });
    }, [state.submissionId, persistMods]);

    // Utility function to reset all fields to original values
    const resetFields = useCallback(async () => {
        if (!state.submissionId) return;
        setModMap({});
        persistMods(state.submissionId, {});
        try { await getExtractedFields(); }
        catch (e) { console.warn('Reset refetch failed', e); }
    }, [state.submissionId, persistMods, getExtractedFields]);



    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {/* Header (hidden while loading) */}
            {!isLoading && (
                <div className="shrink-0 px-4 py-2 border-b bg-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium">Field List</h2>
                        {Object.keys(modMap).length > 0 && (
                            <div className="flex gap-1">
                                <button
                                    onClick={resetFields}
                                    className="text-xs px-2 cursor-pointer py-1 bg-red-100 hover:bg-red-200 rounded text-red-700"
                                    title="Reset all fields to original values"
                                >
                                    Reset to Default
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        ↑↓ move selection • Enter (or snippet) highlights document • Click selects only • Esc clears selection
                    </div>
                </div>
            )}
            {/* Scrollable list region */}
            <div 
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative"
                data-field-list-container
                tabIndex={0}
                role="listbox"
                aria-label="Field list"
                aria-activedescendant={activeIndex >= 0 ? `field-${mergedFields[activeIndex]?.id}` : undefined}
            >
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
                {!isLoading && mergedFields.length > 0 && mergedFields.map((field, index) => {
                    const effectiveValue = field.modifiedValue ?? field.value;
                    const isModified = field.modifiedValue !== undefined && field.modifiedValue !== field.originalValue;
                    const isHighlighted = highlightedField?.id === field.id; // document highlight state
                    const isActive = activeIndex === index || isHighlighted; // active selection OR highlighted
                    return (
                        <FieldCard
                            key={field.id}
                            id={`field-${field.id}`}
                            data-field-value={field.id}
                            data-field-index={index}
                            data-active={isActive || undefined}
                            label={field.name}
                            value={effectiveValue}
                            placeholder={field.originalValue}
                            onEdit={(v) => handleEdit(field.id, v)}
                            onCancel={() => handleCancelEdit(field.id)}
                            onDelete={() => { }}
                            onClick={() => setActiveIndex(index)}
                            editable
                            disabled={false}
                            status={isModified ? 'modified' : 'original'}
                            onCopy={() => { }}
                            confidence={field.confidence}
                            provenanceSnippet={field.provenance?.snippet}
                            onSnippetClick={() => highlightField(field)}
                            isActive={isActive}
                            className={`transition-colors ${isActive ? "ring-2 ring-blue-500/70 outline outline-2 outline-blue-400 bg-blue-50/60 shadow-sm" : ""}`}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default FieldList