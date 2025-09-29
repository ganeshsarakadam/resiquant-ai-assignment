'use client';

import { ExtractedField } from '@/types';
import { HighlightOverlay } from '@/components/HighlightOverlay';
import { PageMount } from './PageMount';

interface PageSlideProps {
  node: HTMLElement;
  index: number;
  pageFields: ExtractedField[];
  onHighlightClick?: (field: ExtractedField) => void;
}

export function PageSlide({ node, index, pageFields, onHighlightClick }: PageSlideProps) {
  const width = node.getBoundingClientRect().width || 800;
  const height = node.getBoundingClientRect().height || 1000;
  return (
    <div
      key={index}
      className="h-full basis-full flex items-start justify-center py-2 sm:py-4 px-2 sm:px-4 relative overflow-y-auto"
    >
      <div className="relative w-full flex justify-center">
        <div className="relative bg-white shadow-sm rounded-sm docx-page-wrapper max-w-[880px] w-full md:w-auto md:max-w-[900px]">
          <PageMount node={node} />
          {pageFields.length > 0 && (
            <HighlightOverlay
              width={width}
              height={height}
              boxes={pageFields.map(f => f.provenance.bbox!).filter(Boolean)}
              overlayFields={pageFields}
              onClickBox={(field) => onHighlightClick?.(field)}
              documentType="docx"
              opacity={0.25}
              color="#f59e0b"
              showLabels={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
