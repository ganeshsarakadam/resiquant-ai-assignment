'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState"
import {
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { DocumentList } from "@/components/DocumentList";
import { SideMenuSkeleton } from "@/components/Skeletons/SideMenuSkeleton";
import { useState, useEffect } from "react";
import { getDocumentsById } from "@/data";
import { Document } from "@/types";
import { SelectionUrlState } from "@/hooks/useSelectionUrlState";

interface SideMenuProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const SideMenu = ({ collapsed, setCollapsed }: SideMenuProps) => {
    const { state } = useSelectionUrlState();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);

      useEffect(() => {
        if (!state?.submissionId) return;
        setIsLoading(true);

        /**
         * Simulate loading delay to show skeleton
         */
        setTimeout(() => {
          setDocuments(getDocumentsById(state.submissionId));
          setIsLoading(false);
        }, 500);
      }, [state?.submissionId])

    // Show skeleton while loading
    if (isLoading) {
        return <SideMenuSkeleton collapsed={collapsed} />;
    }

    return (
        <aside
        className={[
          "relative h-full border-r bg-white shrink-0",
          "transition-[width] duration-200 ease-in-out",
          collapsed ? "w-8" : "w-64", // keep a thin strip when collapsed
        ].join(" ")}
      >
        {/* MAIN MENU CONTENT (hidden when collapsed) */}
        <div className={collapsed ? "hidden" : "h-full flex flex-col"}>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-sm font-medium text-gray-700">Documents - {documents.length}</div>
            <div className="flex items-center gap-2">
             
              <button
                onClick={() => setCollapsed(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                title="Collapse menu"
              >
                <PanelLeftClose className="size-3.5 cursor-pointer" /> Hide
              </button>
            </div>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto">
            <DocumentList documents={documents}  />
          </div>
        </div>
  
        {/* ALWAYS-MOUNTED REVEAL BUTTON (visible only when collapsed) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute right-1 top-2 z-10 inline-flex items-center justify-center
                       h-7 w-6 rounded-md border bg-white hover:bg-gray-50 cursor-pointer"
            title="Show menu"
            aria-label="Show menu"
          >
            <PanelLeftOpen className="h-4 w-4 cursor-pointer" />
          </button>
        )}
      </aside>
    )
}

export default SideMenu