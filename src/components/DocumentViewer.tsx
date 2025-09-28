'use client'

import { useSelectionUrlState } from "@/hooks/useSelectionUrlState"
import { EmailViewer } from "@/components/EmailViewer"
import { submissions } from "@/data/submissions.manifest"
import { FileText } from "lucide-react"
import { document_map } from "@/data/documents.manifest"
import dynamic from "next/dynamic"
import { ImageViewer } from "@/components/ImageViewer"
import { SheetViewer } from "@/components/SheetViewer"
import { DocxViewer } from "@/components/DocxViewer"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useState, useEffect } from "react"
import { getDocumentById } from "@/data"
import { DocumentViewerSkeleton } from "./Skeletons/DocumentViewerSkeleton"
import { PdfPageSkeleton } from "./Skeletons/PdfPageSkeleton"
// @ts-ignore - bundler moduleResolution may not pick up .tsx during type phase
import { PdfCarousel } from './PdfCarousel'

const DocumentViewer = () => {
    const { state, setPageNumber } = useSelectionUrlState();
    const [current, setCurrent] = useState(0);
    const [numPages, setNumPages] = useState<number>(0);
    const [isPdfLoading, setIsPdfLoading] = useState(true);
    const [pdfProgress, setPdfProgress] = useState(0);
    
    // Get the current document from the selected submission
    const document = getDocumentById(state.documentId);


    // Page syncing handled inside PdfCarousel now

    // on document load success
    const onDocumentLoadSuccess = (pdf: any) => {
        setNumPages(pdf.numPages);
        console.log('onDocumentLoadSuccess', pdf);
        setIsPdfLoading(false);
    }

    // on document load error
    const onDocumentLoadError = (error: Error) => {
        console.log('onDocumentLoadError', error);
        setIsPdfLoading(false);
    }

    const onDocumentLoadProgress = (ratio: number) => {
        setPdfProgress(ratio);
    }
    
    // Render different viewers based on document type
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
                    <PdfCarousel
                        document={document}
                        initialPage={state.page || 1}
                        onDocumentLoadSuccess={onDocumentLoadSuccess}
                        onDocumentLoadError={onDocumentLoadError}
                        onDocumentLoadProgress={(r: number) => setPdfProgress(r)}
                        onPageChange={(p: number) => { setCurrent(p - 1); setPageNumber(p); }}
                    />
                );
            case 'image':
                return <ImageViewer document={document} />;
            case 'xlsx':
                return <SheetViewer document={document} />;
            case 'docx':
                return <DocxViewer document={document} />;
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
                    <div className="flex items-center gap-4">
                        {document && document.type === 'pdf' && (
                            <span className="text-xs text-gray-500">
                                Page {current + 1} of {numPages || '?'}
                            </span>
                        )}
                        {document && (
                            <span className="text-xs text-gray-500 capitalize">
                                {document.type.toUpperCase()} Document
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto relative">
                {/* High-level skeleton while we don't yet know numPages (initial parse) */}
                {state.documentId && isPdfLoading && (!numPages || numPages === 0) && (
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