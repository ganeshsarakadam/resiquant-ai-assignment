import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  wasModified: boolean;
  status: 'modified' | 'original';
  sizeClasses: { label: string };
  confidence?: number;
}

export const FieldCardHeader: React.FC<Props> = ({
  label,
  wasModified,
  status,
  sizeClasses,
  confidence,
}) => {
  return (
    <div className="flex items-start justify-between pr-6">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            sizeClasses.label,
            'truncate select-none'
          )}
        >
          {label}
        </div>
        {(wasModified || status === 'modified') && (
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 h-4 leading-none tracking-wide bg-amber-200/80 text-amber-900 border-amber-300 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
            aria-label="Field modified"
            title="Field modified from original value"
          >
            Modified
          </Badge>
        )}
      </div>
      {confidence !== undefined && (
        <div className="absolute top-1 right-1">
          {(() => {
            const pct = confidence * 100;
            let colorClasses = '';
            if (pct >= 90) {
              colorClasses = 'bg-green-100 text-green-800 border-green-300';
            } else if (pct >= 70) {
              colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
            } else if (pct < 60) {
              colorClasses = 'bg-red-100 text-red-800 border-red-300';
            } else {
              colorClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            }
            return (
              <Badge
                variant="outline"
                className={cn('text-[10px] px-1 py-0 h-4 leading-none tracking-wide', colorClasses)}
                aria-label={`Confidence ${pct.toFixed(1)} percent`}
                title={`Confidence: ${pct.toFixed(1)}%`}
              >
                {pct.toFixed(0)}%
              </Badge>
            );
          })()}
        </div>
      )}
    </div>
  );
};
