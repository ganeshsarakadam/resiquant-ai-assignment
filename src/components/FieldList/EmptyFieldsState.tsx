'use client'

import { FileWarning, RefreshCw } from "lucide-react";

interface EmptyFieldsStateProps {
  isLoading: boolean;
  onRefetch: () => void;
}

export const EmptyFieldsState = ({ isLoading, onRefetch }: EmptyFieldsStateProps) => {
  return (
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
            onClick={onRefetch}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center gap-1 text-xs px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Retry'}
          </button>
        </div>
      </div>
    </div>
  );
};
