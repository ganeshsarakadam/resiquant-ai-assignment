"use client";
import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

export interface DocumentViewerErrorProps {
  title?: string;
  message: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const DocumentViewerError: React.FC<DocumentViewerErrorProps> = ({
  title = 'Failed to load document',
  message,
  hint,
  onRetry,
  retryLabel = 'Retry'
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="max-w-sm text-center border rounded-md bg-white shadow-sm px-6 py-8">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-red-600 mb-2">{title}</h3>
        <p className="text-xs text-gray-600 whitespace-pre-wrap mb-3 break-words">{message}</p>
        {hint && <p className="text-[11px] text-gray-500 mb-4">{hint}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
          >
            <RefreshCw className="h-3 w-3" /> {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerError;