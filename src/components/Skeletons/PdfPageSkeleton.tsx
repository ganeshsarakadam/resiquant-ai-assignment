'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface PdfPageSkeletonProps {
  pageNumber?: number;
  progress?: number; // 0 - 1
}

export const PdfPageSkeleton = ({ pageNumber, progress }: PdfPageSkeletonProps) => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="w-full flex flex-col items-center py-8 px-4">
        <div className="relative w-[min(800px,90%)] aspect-[8.5/11] bg-white shadow rounded overflow-hidden flex items-center justify-center">
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 flex flex-col items-center gap-2 text-xs text-gray-500">
            <span>Rendering PDF{typeof pageNumber === 'number' ? ` – Page ${pageNumber}` : ''}</span>
            {typeof progress === 'number' && progress < 1 && (
              <div className="w-40 h-2 bg-gray-200 rounded">
                <div
                  className="h-full bg-gray-400 rounded transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 w-[min(800px,90%)] flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}
