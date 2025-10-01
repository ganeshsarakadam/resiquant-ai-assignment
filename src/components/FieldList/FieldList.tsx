'use client'

import { FieldListHeader } from "@/components/FieldList/FieldListHeader";
import { FieldListContainer } from "@/components/FieldList/FieldListContainer";
import { NoSubmissionSelectedState } from "@/components/FieldList/NoSubmissionSelectedState";
import { useEffect, useRef, useState } from "react";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { ExtractedField } from "@/types";
import { useHighlight } from "@/contexts/HighlightContext";
import { FieldListViewerSkeleton } from "@/components/Skeletons/FieldListViewerSkeleton";
import { useExtractionFields } from "@/hooks/useExtractionFields";

interface Fields extends ExtractedField {
    originalValue: string;
    modifiedValue: string;
    status: "modified" | "original";
}

const FieldList = () => {    
    const { highlightedField, highlightField } = useHighlight();
    const userInitiatedHighlightRef = useRef<string | null>(null);
    const [focusedFieldIndex, setFocusedFieldIndex] = useState<number>(-1);

    const { state } = useSelectionUrlState();
    const {
        fields,
        isLoading,
        isModified,
        loadExtractionFields,
        setFields,
        setIsModified
    } = useExtractionFields();

    const LOCAL_STORAGE_KEY = `extractedFields_${state.submissionId}`;

    const saveFieldsToLocalStorage = (fieldsToSave: Fields[]) => {
        console.log('Saving to localStorage:', LOCAL_STORAGE_KEY, fieldsToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fieldsToSave));
    }

    const handleFieldEdit = (fieldId: string, newValue: string) => {
        setFields(prevFields => {
            const updatedFields = prevFields.map(field => 
                field.id === fieldId 
                    ? { ...field, modifiedValue: newValue, status: "modified" as const }
                    : field
            );
            saveFieldsToLocalStorage(updatedFields);
            setIsModified(true);
            return updatedFields;
        });
    }

    const handleResetToDefault = () => {
                                            setFields(prevFields => 
                                                prevFields.map(field => ({
                                                    ...field,
                                                    modifiedValue: '',
                                                    status: "original" as const
                                                }))
                                            );
                                            // Clear localStorage
                                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                                            // Reset modified state
                                            setIsModified(false);
    };

    const handleSnippetClick = (field: Fields) => {
                                        userInitiatedHighlightRef.current = field.id;
                                        highlightField(field);
    };

    useEffect(() => {
        if (state.submissionId) {
            loadExtractionFields(state.submissionId);
        }
    }, [state.submissionId, loadExtractionFields]);
    
    return (
        <div className="flex flex-col h-full min-h-0 bg-white">
            {!state.submissionId ? (
                <NoSubmissionSelectedState />
            ) : isLoading ? (
                <FieldListViewerSkeleton />
            ) : (
                <>
                    <FieldListHeader 
                        isModified={isModified}
                        fieldsCount={fields.length}
                        onResetToDefault={handleResetToDefault}
                    />
                    
                    <FieldListContainer
                        fields={fields}
                        focusedFieldIndex={focusedFieldIndex}
                        highlightedField={highlightedField}
                        onFieldEdit={handleFieldEdit}
                        onSnippetClick={handleSnippetClick}
                        setFocusedFieldIndex={setFocusedFieldIndex}
                        userInitiatedHighlightRef={userInitiatedHighlightRef}
                    />
                </>
            )}
        </div>
    )
};

export default FieldList;