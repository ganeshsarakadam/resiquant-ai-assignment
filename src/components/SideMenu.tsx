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
            <SideMenuSkeleton collapsed={collapsed} />
            <span className="sr-only">Loading documents…</span>
          </div>
        );
    }

    return (
      <aside
        className={[
          "relative h-full shrink-0",
          // Reserve space only when expanded; when collapsed reserve a slim gutter for handle
          collapsed ? "w-4" : "w-64"
        ].join(" ")}
        aria-label="Document side menu"
      >
        {/* Sliding content (kept in flow to avoid overlay intercept issues) */}
        <div
          className={[
            "h-full w-64 border-r bg-white flex flex-col",
            "transition-transform duration-200 ease-out will-change-transform",
            "[contain:layout_paint_style] content-visibility-auto",
            collapsed ? "-translate-x-[calc(100%-0.25rem)]" : "translate-x-0",
            "shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-3 py-2 shrink-0">
            <div className="text-sm font-medium text-gray-700">Documents - {documents.length}</div>
            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
                title="Collapse menu"
                aria-label="Collapse menu"
                aria-expanded={!collapsed}
              >
                <PanelLeftClose className="h-4 w-4 cursor-pointer" /> Hide
              </button>
            )}
          </div>
          <Separator />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DocumentList documents={documents} />
          </div>
        </div>
        {/* Collapsed open button */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="absolute top-2 left-0 z-10 inline-flex items-center justify-center h-7 w-6 rounded-md border bg-white hover:bg-gray-50 shadow-sm"
            aria-label="Show menu"
            aria-expanded={!collapsed}
            title="Show menu"
          >
            <PanelLeftOpen className="h-4 w-4 cursor-pointer" />
          </button>
        )}
      </aside>
    )
}

export default SideMenu