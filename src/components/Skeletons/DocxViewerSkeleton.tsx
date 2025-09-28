'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface DocxViewerSkeletonProps {
  pageCountGuess?: number;
}

export const DocxViewerSkeleton = ({ pageCountGuess = 3 }: DocxViewerSkeletonProps) => {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading Word document" role="status">
      {Array.from({ length: pageCountGuess }).map((_, i) => (
        <div key={i} className="mx-auto w-[min(800px,95%)] bg-white shadow rounded-md border p-6 space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[92%]" />
            <Skeleton className="h-3 w-[88%]" />
            <Skeleton className="h-3 w-[70%]" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-[95%]" />
            <Skeleton className="h-3 w-[60%]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
