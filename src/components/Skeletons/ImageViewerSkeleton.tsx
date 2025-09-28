'use client'

import { Skeleton } from '@/components/ui/skeleton'

export const ImageViewerSkeleton = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8" aria-label="Loading image" role="status">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <span className="sr-only">Loading image...</span>
    </div>
  )
}
