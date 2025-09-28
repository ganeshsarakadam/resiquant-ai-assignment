'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

interface SideMenuSkeletonProps {
    collapsed: boolean;
}

export const SideMenuSkeleton = ({ collapsed }: SideMenuSkeletonProps) => {
    return (
        <aside
            className={[
                "relative h-full border-r bg-white shrink-0",
                "transition-[width] duration-200 ease-in-out",
                collapsed ? "w-8" : "w-64", // match SideMenu width behavior
            ].join(" ")}
        >
            {/* MAIN MENU CONTENT (hidden when collapsed) */}
            <div className={collapsed ? "hidden" : "h-full flex flex-col"}>
                {/* Header skeleton */}
                <div className="flex items-center justify-between px-3 py-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-12" />
                </div>
                <Separator />
                
                {/* Document list skeleton */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                                <Skeleton className="size-4 rounded" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    )
}