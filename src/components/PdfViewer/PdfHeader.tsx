'use client'

import { Download, RefreshCw, FileText } from 'lucide-react'

interface PdfHeaderProps {
  numPages: number
  currentPage: number
  onDownload?: () => void
  onRetry?: () => void
}

export const PdfHeader = ({ 
  numPages, 
  currentPage, 
  onDownload, 
  onRetry 
}: PdfHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-red-500" />
        <span className="text-sm font-medium text-gray-700">PDF Document</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        {numPages > 0 && (
          <span className="hidden sm:block">
            Page {currentPage} of {numPages}
          </span>
        )}
        <button
          type="button"
          onClick={onDownload}
          title="Download document"
          className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <Download className="size-3" /> Download
        </button>
        <button
          type="button"
          onClick={onRetry}
          title="Retry render"
          className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <RefreshCw className="size-3" /> Retry
        </button>
      </div>
    </div>
  )
}
