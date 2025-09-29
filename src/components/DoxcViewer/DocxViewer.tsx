'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Document as DocType, ExtractedField } from '@/types';
import { useSelectionUrlState } from '@/hooks/useSelectionUrlState';
import { DocxViewerHeader } from './Header';
import { DocxViewerErrorState } from './ErrorState';
import { PageCarousel } from './PageCarousel';
import type { CarouselApi } from '@/components/ui/carousel';
import '@/styles/docx-preview.css';

export interface DocxViewerProps {
  document: DocType;
  initialPage?: number;
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
  onPageChange?: (page: number) => void;
  extractedFields: ExtractedField[];
  onHighlightClick?: (field: ExtractedField) => void;
}

export const DocxViewer = ({ document: doc, initialPage = 1, extractedFields, onReady, onError, onPageChange, onHighlightClick }: DocxViewerProps) => {
  const [error, setError] = useState<string | null>(null);
  const { state, setPageNumber } = useSelectionUrlState();
  const stagingRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<HTMLElement[]>([]);
  const [api, setApi] = useState<CarouselApi | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      try {
        setError(null);
        setPages([]);
        let buf: ArrayBuffer;
        if (typeof doc.url === 'string') {
          const res = await fetch(doc.url);
          if (!res.ok) throw new Error(`Failed to fetch document: ${res.statusText}`);
          buf = await res.arrayBuffer();
        } else {
          buf = await (doc.url as File).arrayBuffer();
        }
        const staging = stagingRef.current;
        if (!staging) return;
        staging.innerHTML = '';
        await renderAsync(buf, staging, undefined, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          renderChanges: true,
          trimXmlDeclaration: true,
          useBase64URL: false,
        });
        if (!isMounted) return;
        const pageNodes = Array.from(staging.querySelectorAll<HTMLElement>('.docx-wrapper > .docx')) as HTMLElement[];
        pageNodes.forEach((n) => { n.parentElement?.removeChild(n); });
        setPages(pageNodes);
        const initialPageIndex = Math.max(0, Math.min((initialPage || state.page || 1) - 1, pageNodes.length - 1));
        setCurrentIndex(initialPageIndex);
        try { onReady?.({ pageCount: pageNodes.length }); } catch (cbErr) { console.warn('[DocxViewer] onReady callback error', cbErr); }
        if (api) {
          try { api.reInit(); } catch (e) { console.warn('[DocxViewer] api.reInit failed', e); }
        }
      } catch (err) {
        console.error('Error rendering DOCX:', err);
        const e = err instanceof Error ? err : new Error('Failed to render document');
        if (isMounted) setError(e.message);
        try { onError?.(e); } catch (cbErr) { console.warn('[DocxViewer] onError callback error', cbErr); }
      }
    }
    run();
    return () => { isMounted = false; };
  }, [doc.url]);

  const fieldsByPage = useMemo(() => {
    if (!extractedFields) return new Map<number, ExtractedField[]>();
    const map = new Map<number, ExtractedField[]>();
    for (const f of extractedFields) {
      if (f.provenance.docName === doc.name && f.provenance.bbox && f.provenance.page) {
        const arr = map.get(f.provenance.page) || [];
        arr.push(f);
        map.set(f.provenance.page, arr);
      }
    }
    return map;
  }, [extractedFields, doc.name]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      const desired = idx + 1;
      setCurrentIndex(idx);
      if (state.page !== desired) {
        setPageNumber(desired);
      }
      try { onPageChange?.(desired); } catch (e) { console.warn('[DocxViewer] onPageChange callback error', e); }
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, state.page, onPageChange, setPageNumber]);

  useEffect(() => {
    if (!api || !pages.length) return;
    const targetPage = Math.max(0, Math.min((initialPage || state.page || 1) - 1, pages.length - 1));
    const current = api.selectedScrollSnap();
    if (current !== targetPage) {
      api.scrollTo(targetPage);
      setCurrentIndex(targetPage);
    }
  }, [api, state.page, pages.length, initialPage]);

  const handleRetry = useCallback(() => { setError(null); }, []);
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = doc.url as string;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [doc.url, doc.name]);

  return (
    <div className="h-full flex flex-col">
      <DocxViewerHeader
        currentPage={currentIndex + 1}
        pageCount={pages.length}
        hasPages={pages.length > 0}
        onDownload={handleDownload}
        onRetry={handleRetry}
      />
      <div className="flex-1 overflow-auto bg-white">
        {error && <DocxViewerErrorState message={error} onRetry={handleRetry} />}
        {!error && pages.length > 0 && (
          <PageCarousel
            pages={pages}
            fieldsByPage={fieldsByPage}
            setApi={setApi}
            api={api}
            showArrows={pages.length > 1}
            onHighlightClick={onHighlightClick}
          />
        )}
        <div
          ref={stagingRef}
          className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
          aria-hidden
        />
      </div>
    </div>
  );
};
