'use client'

import { Skeleton } from '@/components/ui/skeleton'

export const EmailViewerSkeleton = () => {
  return (
    <div className="w-full h-full flex items-start justify-center p-6" aria-label="Loading email" role="status">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-[90%]" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading email...</span>
    </div>
  )
}
