'use client'

import { useSelectionUrlState } from "@/hooks/useSelectionUrlState"
import { EmailViewer } from "@/components/EmailViewer"
import { FileText } from "lucide-react"
import { ImageViewer } from "@/components/ImageViewer"
import { SheetViewer } from "@/components/SheetViewer"
import { DocxViewer } from "@/components/DocxViewer"
import { useState, useEffect } from "react"
import { PdfViewer } from "@/components/PdfViewer"
import { getDocumentById } from "@/data"
import { DocumentViewerSkeleton } from "./Skeletons/DocumentViewerSkeleton"
import { useHighlight } from "@/contexts/HighlightContext"
import { ExtractedField } from "@/types"
import { loadExtraction } from "@/lib/utils"

interface DocumentViewerProps {
    onFieldHighlight?: (id: string) => void;
}

const DocumentViewer = ({ onFieldHighlight }: DocumentViewerProps) => {
    const { state, setPageNumber } = useSelectionUrlState();
    const { highlightedField, highlightField } = useHighlight();
    const [numPages, setNumPages] = useState<number>(0);
    const [isDocumentLoadingInProgress, setIsDocumentLoadingInProgress] = useState(true);
    const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);

    useEffect(() => {
        // console.log('state.submissionId', state.submissionId)
        const fetchExtraction = async () => {
            const extraction = await loadExtraction(state.submissionId);
            console.log('extraction', extraction)
            setExtractedFields(extraction?.extractedFields || []);
        };
        fetchExtraction();
    }, [state.submissionId]);

    /**
     * This function can be easily extended to support documents on cloud storage systems
     * such as S3BlobStorage, Azure Blob Storage, etc.
     */
    const document = getDocumentById(state.documentId);

    


    /**
     * On document load success, we set the number of pages and the loading state to false
     * @param pdf 
     */
    const onDocumentLoadSuccess = (pdf: any) => {
        setNumPages(pdf.numPages);
        setIsDocumentLoadingInProgress(false);
    }

    /**
     * On document load error, we set the loading state to false
     * @param error 
     */
    const onDocumentLoadError = (error: Error) => {
        setIsDocumentLoadingInProgress(false);
    }


    /**
     * On document change, we reset the number of pages and set the loading state to true
     * If no document is selected, we set the loading state to false
     * If a document is selected, we set the loading state to true
     */
    useEffect(() => {
        setNumPages(0);
        if (!document) {
            setIsDocumentLoadingInProgress(false);
            return;
        }
        setIsDocumentLoadingInProgress(true);
    }, [document]);

    /**
     * Listen for page changes from context (when field provenance is clicked)
     */
    // useEffect(() => {
    //     if (highlightedField?.provenance?.page && document) {
    //         const pageNumber = highlightedField.provenance.page;
    //         console.log('DocumentViewer: Navigating to page', pageNumber);
    //         setPageNumber(pageNumber);
    //         setCurrentPage(pageNumber - 1);
    //     }
    // }, [highlightedField, document, setPageNumber]);


    /**
     * Render different viewers based on document type
     * If no document is selected, we show a message to select a document
     * If a document is selected, we render the appropriate viewer based on the document type   
     */

    const renderDocumentViewer = () => {
        if (!document) {
            return (
                <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Document Selected
                        </h3>
                        <p className="text-gray-500">
                            Select a document from the sidebar to view it here.
                        </p>
                    </div>
                </div>
            );
        }

        switch (document.type) {
            case 'pdf':
                                return (
                                    <PdfViewer
                                        extractedFields={extractedFields}   
                                        document={document}
                                        initialPage={state.page || 1}
                                        onDocumentLoadSuccess={onDocumentLoadSuccess}
                                        onDocumentLoadError={onDocumentLoadError}
                                        submissionId={state.submissionId}
                                        onHighlightClick={(field) => {
                                            if (!field) return;
                                            // Use context to highlight field - it will handle document selection automatically
                                            highlightField(field);
                                            onFieldHighlight?.(field.id);
                                        }}
                                    />
                                );
            case 'image':
                return <ImageViewer document={document} />;
            case 'xlsx':
                return <SheetViewer document={document} onReady={() => { setIsDocumentLoadingInProgress(false); }} onError={() => { setIsDocumentLoadingInProgress(false); }} />;
            case 'docx':
                return <DocxViewer  document={document}  onHighlightClick={(field) => {
                    if (!field) return;
                    // Use context to highlight field - it will handle document selection automatically
                    highlightField(field);
                    onFieldHighlight?.(field.id);
                }}  extractedFields={extractedFields} initialPage={state.page || 1}  onReady={() => { setIsDocumentLoadingInProgress(false); }} onError={() => { setIsDocumentLoadingInProgress(false); }} />;
            case 'eml':
                return <EmailViewer document={document} />;
            default:
                return (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Unsupported Document Type
                            </h3>
                            <p className="text-gray-500">
                                This document type ({document.type}) is not supported for preview.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="px-4 py-2 border-b bg-white">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Document Viewer</h2>
                    {/* <div className="flex items-center gap-4">
                        {document && document.type === 'pdf' && (
                            <span className="text-xs text-gray-500">
                                Page {currentPage + 1} of {numPages || '?'}
                            </span>
                        )}
                        {document && (
                            <span className="text-xs text-gray-500 capitalize">
                                {document.type.toUpperCase()} Document
                            </span>
                        )}
                    </div> */}
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto relative">
                {document && isDocumentLoadingInProgress && (
                    <div className="absolute inset-0 z-20">
                        <DocumentViewerSkeleton />
                    </div>
                )}
                {renderDocumentViewer()}
            </div>
        </div>
    )
}

export default DocumentViewer