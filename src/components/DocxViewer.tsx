'use client';

// Logging: module evaluated
console.log('[DocxViewer] module loaded');

import { Document as DocType } from "@/types";
import { File, Download, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { DocxViewerSkeleton } from "./Skeletons/DocxViewerSkeleton";
import { renderAsync } from "docx-preview";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";

// shadcn/ui carousel
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

/* ---------- helper: load fonts (optional) ---------- */
async function loadFonts(
  list: { name: string; url: string }[]
): Promise<{ name: string; data: ArrayBuffer }[]> {
  const out: { name: string; data: ArrayBuffer }[] = [];
  for (const f of list) {
    try {
      const res = await fetch(f.url);
      if (res.ok) out.push({ name: f.name, data: await res.arrayBuffer() });
    } catch (e) {
      console.warn(`Failed to load font ${f.name}:`, e);
    }
  }
  return out;
}

/* ---------- mounts a raw DOM node into a div ---------- */
function PageMount({ node }: { node: HTMLElement }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(node); // move node (not clone)
    return () => {
      if (host.contains(node)) host.removeChild(node);
    };
  }, [node]);
  return <div ref={hostRef} className="flex justify-center" />;
}

interface DocxViewerProps {
  document: DocType;
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
}

export const DocxViewer = ({ document: doc, onReady, onError }: DocxViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL state integration
  const { state, setPageNumber } = useSelectionUrlState();

  // hidden staging container where docx-preview renders initially
  const stagingRef = useRef<HTMLDivElement>(null);

  // pages to show in the carousel
  const [pages, setPages] = useState<HTMLElement[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  // Refs to manage initial sync logic
  const hadInitialPageParamRef = useRef<boolean>(state.page != null);
  const firstSelectRef = useRef<boolean>(true);
  const initialAppliedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
  console.log('[DocxViewer] start render run()', { url: doc.url, hadInitialPage: state.page });
        setIsLoading(true);
        setError(null);
        setPages([]);
        // Reset sync guards when document changes
        hadInitialPageParamRef.current = state.page != null;
        firstSelectRef.current = true;
        initialAppliedRef.current = false;

        // fetch doc as ArrayBuffer
        let buf: ArrayBuffer;
        if (typeof doc.url === "string") {
          const res = await fetch(doc.url);
          if (!res.ok) throw new Error(`Failed to fetch document: ${res.statusText}`);
          buf = await res.arrayBuffer();
        } else {
          buf = await (doc.url as File).arrayBuffer();
        }

        // optional: load fonts
        let fonts: { name: string; data: ArrayBuffer }[] = [];
        try {
          fonts = await loadFonts([
            { name: "Times New Roman", url: "/fonts/TimesNewRoman.ttf" },
            { name: "Calibri", url: "/fonts/Calibri.ttf" },
          ]);
        } catch {}

        const staging = stagingRef.current;
        if (!staging) return;
        staging.innerHTML = "";

  console.log('[DocxViewer] fetched buffer, invoking renderAsync');
        await renderAsync(buf, staging, undefined, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false, // honor Word's page markers
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          renderChanges: true,
          trimXmlDeclaration: true,
          useBase64URL: false,
          ...(fonts.length > 0 && { fonts }),
        });

        if (!isMounted) return;

        // each page is a .docx under .docx-wrapper
        const pageNodes = Array.from(
          staging.querySelectorAll<HTMLElement>(".docx-wrapper > .docx")
        ) as HTMLElement[];
  console.log('[DocxViewer] renderAsync complete; pages extracted', { count: pageNodes.length });

        // detach from staging so we can mount in slides
        pageNodes.forEach((n) => { (n as HTMLElement).parentElement?.removeChild(n); });
        setPages(pageNodes);
        setCurrentIndex(0);
        setIsLoading(false);
  console.log('[DocxViewer] pages state set, isLoading=false');
        // Fire onReady once after successful load
        try {
          onReady?.({ pageCount: pageNodes.length });
        } catch (cbErr) {
          console.warn('[DocxViewer] onReady callback error', cbErr);
        }
        // If carousel api already exists (hot reload scenario) reInit to pick up new slides
        if (api) {
          try { api.reInit(); console.log('[DocxViewer] api.reInit after pages set'); } catch (e) { console.warn('[DocxViewer] api.reInit failed', e); }
        }
      } catch (err) {
        console.error("Error rendering DOCX:", err);
        const e = err instanceof Error ? err : new Error('Failed to render document');
        if (isMounted) {
          setError(e.message);
          setIsLoading(false);
        }
        try { onError?.(e); } catch (cbErr) { console.warn('[DocxViewer] onError callback error', cbErr); }
      }
    }

    run();
    return () => { isMounted = false; };
  }, [doc.url]);

  // Embla select -> update local index (and maybe URL) after initial sync
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      const desired = idx + 1; // 1-based
      // If initial URL param existed and we haven't applied it yet, skip until URL->carousel effect runs
      if (firstSelectRef.current && hadInitialPageParamRef.current && !initialAppliedRef.current) {
        console.log('[DocxViewer] early select ignored pending initial URL scroll');
        return;
      }
      if (firstSelectRef.current) {
        firstSelectRef.current = false; // consume flag if we reach here
      }
      if (state.page !== desired) {
        setPageNumber(desired);
        console.log('[DocxViewer] onSelect -> setPageNumber', { desired });
      }
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, setPageNumber, state.page]);

  // URL -> carousel (initial + subsequent external changes)
  useEffect(() => {
    if (!api) return;
    if (!pages.length) return; // need pages to target
    const urlPage = state.page || 1;
    const clamped = Math.min(Math.max(urlPage, 1), pages.length) - 1;
    const current = api.selectedScrollSnap();
    const needsScroll = current !== clamped || !initialAppliedRef.current;
    if (needsScroll) {
      const jump = !initialAppliedRef.current; // jump on first application
      api.scrollTo(clamped, jump);
      console.log('[DocxViewer] URL->carousel scrollTo', { urlPage, clamped, jump });
    }
    if (!initialAppliedRef.current) {
      initialAppliedRef.current = true;
      firstSelectRef.current = false; // we've now applied initial position; allow future selects to update URL
      setCurrentIndex(clamped);
      console.log('[DocxViewer] initialAppliedRef set true', { clamped });
      if (state.page !== clamped + 1) {
        // Normalize URL if it was out of bounds
        setPageNumber(clamped + 1);
        console.log('[DocxViewer] normalized out-of-range page param', { newPage: clamped + 1 });
      }
    }
  }, [state.page, api, pages.length]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = doc.url as string;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [doc.url, doc.name]);

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <File className="size-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Word Document</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {pages.length > 0 && (
            <span className="hidden sm:block">
              Page {currentIndex + 1} of {pages.length}
            </span>
          )}
          <button
            onClick={handleDownload}
            title="Download document"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <Download className="size-3" /> Download
          </button>
          <button
            onClick={handleRetry}
            title="Retry render"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      </div>

      {/* Main viewer: white background + single outer scrollbar */}
      <div className="flex-1 overflow-auto bg-white">
        {/* Loading / Error overlays */}
        {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            {/* <DocxViewerSkeleton /> */}
          </div>
        )}
        {error && !isLoading && (
          <div className="w-full h-full flex items-center justify-center p-6 bg-white">
            <div className="max-w-sm text-center">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Failed to render DOCX</h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel with arrows overlayed; no inner scrollboxes */}
        {!isLoading && !error && pages.length > 0 && (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <Carousel
                setApi={setApi}
                className="relative w-full h-full"
                opts={{ align: "center", loop: false, skipSnaps: false, dragFree: false }}
              >
                <CarouselContent className="h-full">
                  {pages.map((node: HTMLElement, idx: number) => (
                    <CarouselItem
                      key={idx}
                      className="h-full basis-full flex items-start justify-center p-4"
                    >
                      <PageMount node={node} />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {/* overlay controls */}
                {
                    pages.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2 z-20 cursor-pointer" />
                            <CarouselNext className="right-2 z-20 cursor-pointer" />
                        </>
                    )
                }
               
               
              </Carousel>
            </div>
          </div>
        )}

        {/* hidden staging area */}
        <div
          ref={stagingRef}
          className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          aria-hidden
        />
      </div>
    </div>
  );
};
