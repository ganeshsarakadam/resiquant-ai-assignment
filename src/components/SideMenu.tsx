'use client'

import { Separator } from "@/components/ui/separator"
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState"
import { DocumentList } from "@/components/DocumentList";
import { SideMenuSkeleton } from "@/components/Skeletons/SideMenuSkeleton";
import { useState, useEffect } from "react";
import { getDocumentsById } from "@/data";
import { Document } from "@/types";

// Simplified: static (non-collapsible) side menu
const SideMenu = () => {
    const { state } = useSelectionUrlState();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);

      useEffect(() => {
        if (!state?.submissionId) return;
        setIsLoading(true);
        let cancelled = false;
        const timer = setTimeout(() => {
          if (cancelled) return;
            setDocuments(getDocumentsById(state.submissionId));
            setIsLoading(false);
        }, 500);
        return () => { cancelled = true; clearTimeout(timer); };
      }, [state?.submissionId])

    // Show skeleton while loading
    if (isLoading) {
      return (
        <div aria-busy="true" aria-live="polite" role="status">
          <SideMenuSkeleton />
          <span className="sr-only">Loading documents…</span>
        </div>
      );
    }

    return (
      <aside
        className="relative h-full shrink-0 w-64 border-r bg-white flex flex-col shadow-sm"
        aria-label="Document side menu"
      >
        <div className="flex items-center justify-between px-3 py-2 shrink-0">
          <div className="text-sm font-medium text-gray-700">Documents - {documents.length}</div>
        </div>
        <Separator />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DocumentList documents={documents} />
        </div>
      </aside>
    )
}

export default SideMenu