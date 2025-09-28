'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { FileText } from "lucide-react"

export const DocumentViewerSkeleton = () => {
    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Header skeleton - matches DocumentViewer header */}
            <div className="px-4 py-2 border-b bg-white">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" /> {/* Document Viewer title */}
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-3 w-16" /> {/* Page info */}
                        <Skeleton className="h-3 w-20" /> {/* Document type */}
                    </div>
                </div>
            </div>
            
            {/* Content skeleton - matches main content area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <Skeleton className="h-6 w-48 mx-auto mb-2" /> {/* Loading title */}
                        <Skeleton className="h-4 w-64 mx-auto" /> {/* Loading subtitle */}
                    </div>
                </div>
            </div>
        </div>
    )
}