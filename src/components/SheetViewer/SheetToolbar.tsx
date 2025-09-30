import React from 'react';
import { FileSpreadsheet, Download, RefreshCw } from 'lucide-react';

interface SheetToolbarProps {
  sheetCount: number;
  currentIndex: number;
  currentSheetName?: string;
  onDownload: () => void;
  onRetry: () => void;
}

export const SheetToolbar: React.FC<SheetToolbarProps> = ({ sheetCount, currentIndex, currentSheetName, onDownload, onRetry }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-green-600" />
        <span className="text-sm font-medium text-gray-700">Excel Spreadsheet</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600">
        {sheetCount > 0 && (
          <span className="hidden sm:block">
            Sheet {currentIndex + 1} of {sheetCount}: {currentSheetName}
          </span>
        )}
        <button
          onClick={onDownload}
          title="Download document"
          className="flex items-center cursor-pointer gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <Download className="size-3" /> Download
        </button>
        <button
          onClick={onRetry}
          title="Retry render"
          className="flex items-center cursor-pointer gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
        >
          <RefreshCw className="size-3" /> Retry
        </button>
      </div>
    </div>
  );
};
