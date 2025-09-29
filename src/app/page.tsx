'use client';

import SideMenu from "@/components/SideMenu";
import DocumentViewer from "@/components/DocumentViewer";
import FieldList from "@/components/FieldList";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import { HighlightProvider } from "@/contexts/HighlightContext";
import SubmissionSelector from "@/components/SubmissionSelector";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PanelLeftOpen } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setDocumentAndPage } = useSelectionUrlState();
  

  return (
    <div className="flex flex-col h-dvh bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-2 xl:px-4">
          <div className="h-14 flex items-center justify-between gap-2">
            {/* Mobile: open sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden">
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[90vw] sm:w-[420px]">
                <SheetHeader className="px-4 py-3 border-b">
                  <SheetTitle>Documents</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100vh-3.25rem)] overflow-y-auto">
                    <SideMenu
                    collapsed={false}
                    setCollapsed={() => {}}
                    // onSelect={() => setMobileMenuOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="text-xl font-semibold tracking-tight">
              Submission Document Explorer
            </div>

            <div className="w-9" />
          </div>
        </div>
      </header>

      {/* Submission selector */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-7 py-3">
          <SubmissionSelector />
        </div>
      </div>

      {/* Main: sidebar | content */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden">
        {/* Desktop sidebar (xl and up) */}
        <div className="hidden xl:block flex-none">
          <SideMenu collapsed={menuCollapsed} setCollapsed={setMenuCollapsed} />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Desktop: horizontal split (only on xl) */}
          <ResizablePanelGroup
            direction="horizontal"
            className="hidden xl:flex h-full w-full"
          >
            <HighlightProvider onDocumentSelect={(field) => setDocumentAndPage(field.provenance?.docId || '', field.provenance?.page || 1)}>
              <ResizablePanel
                defaultSize={menuCollapsed ? 70 : 60}
                minSize={30}
                className="min-w-0"
              >
                <div className="h-full bg-white min-h-0 overflow-hidden">
                  <DocumentViewer />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={40}
                minSize={18}
                maxSize={45}
                className="min-w-0"
              >
                <div className="h-full border-l bg-white min-h-0">
                  <FieldList />
                </div>
              </ResizablePanel>
            </HighlightProvider>
          </ResizablePanelGroup>

          {/* Mobile/Tablet: vertical split */}
          {/* <ResizablePanelGroup
            direction="vertical"
            autoSaveId="home-mobile-vertical"
            className="flex xl:hidden h-full w-full"
          >
            <ResizablePanel defaultSize={65} minSize={40} collapsible className="min-h-0">
              <div className="h-full bg-white min-h-0 overflow-hidden">
                <DocumentViewer />
              </div>
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="data-[panel-group-direction=vertical]:h-4 data-[panel-group-direction=vertical]:my-1"
            />
            <ResizablePanel defaultSize={35} minSize={20} collapsible className="min-h-0">
              <div className="h-full border-t bg-white min-h-0 overflow-hidden">
                <FieldList />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup> */}
        </div>
      </div>
    </div>
  );
}
