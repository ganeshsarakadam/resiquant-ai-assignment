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
          <Badge
            variant={confidence >= 0.9 ? 'default' : confidence >= 0.6 ? 'secondary' : confidence >= 0.4 ? 'outline' : 'destructive'}
            aria-label={`Confidence ${(confidence * 100).toFixed(1)} percent`}
            title={`Confidence: ${(confidence * 100).toFixed(1)}%`}
          >
            {(confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      )}
    </div>
  );
};
