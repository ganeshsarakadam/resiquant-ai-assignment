'use client';

import { Document } from "@/types";
import { File, Download } from "lucide-react";

interface DocxViewerProps {
    document: Document;
}

export const DocxViewer = ({ document }: DocxViewerProps) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <File className="size-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Document Viewer</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50">
                        <Download className="size-3" />
                        Download
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto bg-white flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <File className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Word Document</h3>
                    <p className="text-gray-500 mb-4">
                        DOCX files cannot be previewed directly. Click download to view the document.
                    </p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Download className="size-4" />
                        Download {document.name}
                    </button>
                </div>
            </div>
        </div>
    );
};
