'use client';

import { 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  Mail, 
  File 
} from "lucide-react";
import { Document, DocumentType } from "@/types";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";

interface DocumentListProps {
    documents: Document[];
}

// Helper function to get the appropriate icon for each document type
const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
        case 'pdf':
            return <FileText className="size-4 text-red-500" />;
        case 'image':
            return <FileImage className="size-4 text-green-500" />;
        case 'xlsx':
            return <FileSpreadsheet className="size-4 text-green-600" />;
        case 'eml':
            return <Mail className="size-4 text-blue-500" />;
        case 'docx':
            return <File className="size-4 text-blue-600" />;
        default:
            return <FileText className="size-4 text-gray-500" />;
    }
};

export const DocumentList = ({ documents}: DocumentListProps) => {
    const { state, setDocumentId } = useSelectionUrlState();
        return (
            <div className="p-4">
                <ul className="space-y-1" role="listbox" aria-label="Documents">
                    {documents.map((doc) => {
                        const isActive = state.documentId === doc.id;
                        return (
                            <li key={doc.id} role="option" aria-selected={isActive}>
                                <button
                                    type="button"
                                    className={`w-full cursor-pointer text-left flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                                        isActive
                                            ? 'bg-blue-50 border border-blue-200 text-blue-900'
                                            : 'hover:bg-gray-100 text-gray-900'
                                    }`}
                                    onClick={() => setDocumentId(doc.id)}
                                    aria-current={isActive || undefined}
                                >
                                    <div className="flex-shrink-0" aria-hidden="true">
                                        {getDocumentIcon(doc.type)}
                                    </div>
                                    <Tooltip delayDuration={500}>
                                        <TooltipTrigger asChild>
                                            <span className="text-sm font-medium text-gray-900 truncate min-w-0 flex-1">{doc.name}</span>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs" role="tooltip">
                                            <p>{doc.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
};