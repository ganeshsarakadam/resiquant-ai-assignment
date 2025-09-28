'use client';

import { Document as DocType } from "@/types";
import { File, Download, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { renderAsync } from "docx-preview";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";


/**
 * 
 * @param list list of fonts to load
 * @returns list of fonts loaded
 */

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


/**
 * @param param0 node to mount into a div
 * @returns div with the node mounted into it
 */

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
  initialPage?: number;
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
  onPageChange?: (page: number) => void;
}

/**
 * 
 * @param param0 document to render
 * @param initialPage initial page to render
 * @param onReady callback when document is loaded
 * @param onError callback when document fails to load
 * @param onPageChange callback when page changes
 * @returns docx viewer
 */

export const DocxViewer = ({ document: doc, initialPage = 1, onReady, onError, onPageChange }: DocxViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const { state, setPageNumber } = useSelectionUrlState();

  /**
   * hidden staging container where docx-preview renders initially
   */
  const stagingRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<HTMLElement[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      try {
        setError(null);
        setPages([]);

        /**
         * Fetch doc as ArrayBuffer
         * If the doc is a string, fetch it as a string
         * If the doc is a File, fetch it as a File
         */
        let buf: ArrayBuffer;
        if (typeof doc.url === "string") {
          const res = await fetch(doc.url);
          if (!res.ok) throw new Error(`Failed to fetch document: ${res.statusText}`);
          buf = await res.arrayBuffer();
        } else {
          buf = await (doc.url as File).arrayBuffer();
        }

        /**
         * Optional: load fonts
         * If the fonts are not loaded, the document will not be rendered
         */
        let fonts: { name: string; data: ArrayBuffer }[] = [];
        try {
          fonts = await loadFonts([
            { name: "Times New Roman", url: "/fonts/TimesNewRoman.ttf" },
            { name: "Calibri", url: "/fonts/Calibri.ttf" },
          ]);
        } catch { }

        const staging = stagingRef.current;
        if (!staging) return;
        staging.innerHTML = "";
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

        /**
         * Each page is a .docx under .docx-wrapper
         * pages is an array of page nodes
         * detach the pages from the staging container
         * set the pages state
         * set the initial page index
         * set the current index
         * fire the onReady callback
         */
        const pageNodes = Array.from(
          staging.querySelectorAll<HTMLElement>(".docx-wrapper > .docx")
        ) as HTMLElement[];
        pageNodes.forEach((n) => { (n as HTMLElement).parentElement?.removeChild(n); });
        setPages(pageNodes);
        const initialPageIndex = Math.max(0, Math.min((initialPage || state.page || 1) - 1, pageNodes.length - 1));
        setCurrentIndex(initialPageIndex);
        try {
          onReady?.({ pageCount: pageNodes.length });
        } catch (cbErr) {
          console.warn('[DocxViewer] onReady callback error', cbErr);
        }
        
        /**
         * If the carousel api already exists (hot reload scenario) reInit to pick up new slides
         */
        if (api) {
          try { api.reInit(); } catch (e) { console.warn('[DocxViewer] api.reInit failed', e); }
        }
      } catch (err) {
        /**
         * If the error is not an instance of Error, create a new Error
         * Set the error message
         * Fire the onError callback
         */
        console.error("Error rendering DOCX:", err);
        const e = err instanceof Error ? err : new Error('Failed to render document');
        if (isMounted) {
          setError(e.message);
        }
        /**
         * Fire the onError callback
         */
        try { onError?.(e); } catch (cbErr) { console.warn('[DocxViewer] onError callback error', cbErr); }
      }
    }

    run();
    return () => { isMounted = false; };
  }, [doc.url]);

 /**
  * This is the onSelect callback for the carousel
  * It updates the current index and the page number
  * It also fires the onPageChange callback
  */
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      const desired = idx + 1; 
      if (state.page !== desired) {
        setPageNumber(desired);
      }
      onPageChange?.(desired);
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api]);

 
  /**
   * This is the useEffect hook that syncs the carousel with the URL state
   * It scrolls to the target page and updates the current index
   */
  useEffect(() => {
    if (!api || !pages.length) return;

    const targetPage = Math.max(0, Math.min((initialPage || state.page || 1) - 1, pages.length - 1));
    const current = api.selectedScrollSnap();

    if (current !== targetPage) {
      api.scrollTo(targetPage);
      setCurrentIndex(targetPage);
    }
  }, [api, state.page]);

  /**
   * This is the handleRetry callback
   * It sets the error to null
   */
  const handleRetry = useCallback(() => {
    setError(null);
  }, []);

  /**
   * This is the handleDownload callback
   * It creates a new a element and downloads the document
   */
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
        {/* Error overlays */}

        {error && (
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
        {!error && pages.length > 0 && (
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

        {
          /**
           * Hidden staging area
           */
        }
        <div
          ref={stagingRef}
          className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          aria-hidden
        />
      </div>
    </div>
  );
};
