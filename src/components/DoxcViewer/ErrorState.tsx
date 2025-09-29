'use client';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DocxViewerErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-white">
      <div className="max-w-sm text-center">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Failed to render DOCX</h3>
        <p className="text-xs text-gray-600 whitespace-pre-wrap mb-4">{message}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
