'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface FieldListViewerSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

// A loading skeleton matching the visual structure of FieldList
export const FieldListViewerSkeleton = ({ rows = 8, showHeader = true }: FieldListViewerSkeletonProps) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-white animate-pulse" aria-label="Loading fields" role="status">
      {showHeader && (
        <div className="shrink-0 px-4 py-2 border-b bg-white flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-10" />
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border rounded-md p-3 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[85%]" />
              <Skeleton className="h-3 w-[72%]" />
            </div>
            <div className="pt-3 flex gap-2 flex-wrap">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
