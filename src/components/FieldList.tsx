'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { FileWarning, RefreshCw } from "lucide-react";
import { FieldListViewerSkeleton } from "@/components/Skeletons/FieldListViewerSkeleton";
import { FieldCard } from "./FieldCard";
import { ExtractedField } from "@/types";
import { loadExtractionData } from "@/data/extractions";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { useHighlightedField, useHighlightSetter } from "@/contexts/HighlightContext";

/**
 * Prefix for storing modified fields in localStorage
 * @constant {string}
 */
const MODIFIED_FIELDS_STORAGE_PREFIX = 'modified_fields_';


interface VersionedField extends ExtractedField {
    originalValue: string;
    modifiedValue?: string;
}

const FieldList = () => {
    const [baseFields, setBaseFields] = useState<VersionedField[]>([]);
    const [modMap, setModMap] = useState<Record<string, string>>({}); 
    const [isLoading, setIsLoading] = useState(true);
    const [attemptedLoad, setAttemptedLoad] = useState(false); 
    const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1); 
    const { state } = useSelectionUrlState();
    const highlightedField = useHighlightedField();
    const highlightField = useHighlightSetter();

    /**
     * Merge base fields with modified values
     * @returns Merged array of fields with modifications applied
     * @description This is the mergedFields function that merges base fields with modified values
     */
    const mergedFields = useMemo(() => (
        baseFields.map(f => (
            modMap[f.id] !== undefined ? { ...f, modifiedValue: modMap[f.id] } : f
        ))
    ), [baseFields, modMap]);

    /**
     * Load modified fields from localStorage
     * @returns void
     * @description This is the loadModifiedFields function that loads modified fields from localStorage
     */
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

    /**
     * Persist modified fields to localStorage
     * @returns void
     * @description This is the persistMods function that saves modified fields to localStorage
     */
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

    
    /**
     * Sync activeIndex with highlightedField changes
     * @returns void
     * @description This is the useEffect hook that syncs activeIndex with highlightedField changes
     */
    useEffect(() => {
        if (!highlightedField) return;
        const idx = mergedFields.findIndex(f => f.id === highlightedField.id);
        if (idx !== -1) setActiveIndex(idx);
    }, [highlightedField, mergedFields]);

    
    const mergedFieldsRef = useRef(mergedFields);
    const activeIndexRef = useRef(activeIndex);
    const highlightRef = useRef(highlightField);
    useEffect(() => { mergedFieldsRef.current = mergedFields; }, [mergedFields]);
    useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
    useEffect(() => { highlightRef.current = highlightField; }, [highlightField]);

    /**
     * Handle keyboard navigation within the field list
     * @returns void
     * @description This is the useEffect hook that handles keyboard navigation within the field list
     */
    useEffect(() => {
        const handleKeyDown = (event: Event) => {
            const e = event as KeyboardEvent;
            const fields = mergedFieldsRef.current;
            if (fields.length === 0) return;
            if ((e.target as HTMLElement | null)?.closest('[data-editing="true"]')) return;
            if (document.querySelector('[data-editing="true"]')) return;
            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    setIsKeyboardNavigating(true);
                    setActiveIndex(prev => prev < 0 ? 0 : (prev + 1) % fields.length);
                    break; }
                case 'ArrowUp': {
                    e.preventDefault();
                    setIsKeyboardNavigating(true);
                    setActiveIndex(prev => prev < 0 ? fields.length - 1 : (prev - 1 + fields.length) % fields.length);
                    break; }
                case 'Enter': {
                    const idx = activeIndexRef.current;
                    if (idx >= 0 && idx < fields.length) {
                        e.preventDefault();
                        highlightRef.current(fields[idx]);
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
        if (!container) return;
        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, []);

    /**
        * Scroll active item into view when navigating via keyboard
        * @returns void
        * @description This is the useEffect hook that scrolls the active item into view when navigating via keyboard
     */
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


    /**
     * Load fields when submissionId changes
     * @returns void
     * @description This is the useEffect hook that loads the fields when the submissionId changes
     */
    useEffect(() => {
        const loadFields = async () => {
            if (!state.submissionId) {
                setIsLoading(false);
                setAttemptedLoad(false);
                setBaseFields([]);
                setModMap({});
                return;
            }
            try {
                setIsLoading(true);
                setAttemptedLoad(true);
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
            if (!base) return prev; 
            const next = { ...prev, [id]: newValue };
            
            if (newValue === base.originalValue) { delete next[id]; }
            persistMods(state.submissionId, next);
            return next;
        });
    }, [baseFields, state.submissionId, persistMods]);

    
    const handleCancelEdit = useCallback((_id: string) => {
        
    }, []);

    
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
                                    className="text-xs px-2 cursor-pointer py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
                                    title="Reset all fields to original values"
                                >
                                    Reset to Default
                                </button>
                            </div>
                        )}
                    </div>
                    {
                    baseFields.length > 0 && (
                        <div className="mt-1">
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600 leading-tight">
                                <li className="flex items-center gap-1"><span className="inline-flex items-center gap-0.5"><kbd className="px-1 py-0.5 rounded border bg-gray-50">↑</kbd><kbd className="px-1 py-0.5 rounded border bg-gray-50">↓</kbd></span><span className="text-gray-500">navigate</span></li>
                                <li className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border bg-gray-50">Enter</kbd><span className="text-gray-500">highlight</span></li>
                                <li className="flex items-center gap-1"><span className="px-1 py-0.5 rounded border bg-gray-50">snippet</span><span className="text-gray-500">= highlight</span></li>
                                <li className="flex items-center gap-1"><span className="px-1 py-0.5 rounded border bg-gray-50">Double‑click</span><span className="text-gray-500">edit value</span></li>
                                <li className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border bg-gray-50">Esc</kbd><span className="text-gray-500">clear</span></li>
                            </ul>
                        </div>
                    )}
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
                {/* No submission selected */}
                {!isLoading && !state.submissionId && (
                    <div className="flex items-center justify-center py-10 select-none">
                        <div className="border rounded-md bg-white shadow-sm p-6 w-full max-w-sm text-center space-y-3">
                            <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                                <FileWarning className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No Submission Selected</h3>
                            <p className="text-xs text-gray-500">Choose a submission above to load its extracted fields.</p>
                        </div>
                    </div>
                )}
                {/* Submission selected, attempted load, but no fields */}
                {!isLoading && state.submissionId && attemptedLoad && mergedFields.length === 0 && (
                    <div className="flex items-center justify-center py-10 select-none">
                        <div className="border rounded-md bg-white shadow-sm p-6 w-full max-w-sm text-center space-y-3">
                            <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                                <FileWarning className="h-6 w-6 text-amber-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No Extracted Fields</h3>
                            <p className="text-xs text-gray-500">
                                We couldn&apos;t find any extracted fields for this submission.
                            </p>
                            <div className="pt-1 flex justify-center">
                                <button
                                    onClick={handleRefetch}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={"h-3 w-3 cursor-pointer"} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!isLoading && mergedFields.length > 0 && mergedFields.map((field, index) => {
                    const effectiveValue = field.modifiedValue ?? field.value;
                    const isModified = field.modifiedValue !== undefined && field.modifiedValue !== field.originalValue;
                    const isHighlighted = highlightedField?.id === field.id; 
                    const isActive = activeIndex === index || isHighlighted; 
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
                            className={`transition-colors ${isActive ? "ring-2 ring-blue-500/70 outline-2 bg-blue-50/60 shadow-sm" : ""}`}
                        />
                    );
                })}
            </div>
        </div>
    )
}

export default FieldList