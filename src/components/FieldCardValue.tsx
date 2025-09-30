import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface Props {
  value: string;
  placeholder: string;
  isEmpty: boolean;
  editable: boolean;
  disabled: boolean;
  isEditing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  startEdit: () => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  sizeClasses: { value: string };
}

export const FieldCardValue: React.FC<Props> = ({
  value,
  placeholder,
  isEmpty,
  editable,
  disabled,
  isEditing,
  draft,
  setDraft,
  startEdit,
  confirmEdit,
  cancelEdit,
  inputRef,
  sizeClasses,
}) => {
  return (
    <div className="flex items-start gap-1.5">
      {!isEditing && (
        <div
          className={cn(
            sizeClasses.value,
            'text-gray-700 break-words whitespace-pre-wrap',
            editable && !disabled && 'cursor-text'
          )}
          onDoubleClick={() => { if (!isEditing && editable && !disabled) startEdit(); }}
          title={editable && !disabled ? 'Double-click to edit' : undefined}
          data-edit-trigger="value"
        >
          {isEmpty ? <span className="text-gray-400 italic">{placeholder}</span> : value}
        </div>
      )}
      {isEditing && (
        <div
          className="flex items-center gap-2 w-full mt-1 animate-none"
        >
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); }
              else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
            }}
            className="flex-1 text-xs h-8"
            aria-label={`Edit ${placeholder}`}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={confirmEdit}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 bg-green-500 text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors active:scale-[0.97]"
            aria-label="Confirm edit"
            title="Confirm"
          >
            <Check className="h-4 w-4 cursor-pointer" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 bg-muted/40 bg-gray-200 text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors active:scale-[0.97]"
            aria-label="Cancel edit"
            title="Cancel"
          >
            <X className="h-4 w-4 cursor-pointer" />
          </button>
        </div>
      )}
    </div>
  );
};
