'use client'

import { Skeleton } from '@/components/ui/skeleton'

export const SheetViewerSkeleton = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6" aria-label="Loading spreadsheet" role="status">
      <div className="w-full max-w-4xl space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading spreadsheet...</span>
    </div>
  )
}
