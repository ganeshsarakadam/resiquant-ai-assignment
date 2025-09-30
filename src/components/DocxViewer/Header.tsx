'use client';

import { File, Download, RefreshCw } from 'lucide-react';
import React from 'react';

interface HeaderProps {
  currentPage: number;
  pageCount: number;
  onDownload: () => void;
  onRetry: () => void;
  hasPages: boolean;
}

export const DocxViewerHeader: React.FC<HeaderProps> = ({ currentPage, pageCount, onDownload, onRetry, hasPages }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <File className="size-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Word Document</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        {hasPages && (
          <span className="hidden sm:block">
            Page {currentPage} of {pageCount}
          </span>
        )}
        <button
          onClick={onDownload}
          title="Download document"
          className="flex items-center cursor-pointer gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <Download className="size-3 cursor-pointer" /> Download
        </button>
        <button
          onClick={onRetry}
          title="Retry render"
          className="flex items-center cursor-pointer gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <RefreshCw className="size-3 cursor-pointer" /> Retry
        </button>
      </div>
    </div>
  );
};
