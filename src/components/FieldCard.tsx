"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useFieldCardEditing } from "@/hooks/useFieldCardEditing";
import { FieldCardHeader } from "@/components/FieldCardHeader";
import { FieldCardValue } from "@/components/FieldCardValue";


// Static BaseCard (no motion)
type BaseCardDivProps = React.HTMLAttributes<HTMLDivElement>;
const BaseCard: React.FC<BaseCardDivProps> = ({ className, ...rest }) => (
  <div
    className={cn(
      "bg-white border rounded-md shadow-sm",
      className
    )}
    {...rest}
  />
);

const fieldCardVariants = cva(
    "relative border shadow-sm transition-colors rounded-md group focus-within:border-blue-500 hover:border-gray-300 bg-white",
    {
        variants: {
            size: {
                default: "py-3 px-4",
                compact: "py-2 px-3",
                ultra: "py-1.5 px-2",
            },
      state: {
        normal: "",
          // Remove yellow styling for modified fields; keep base look (could add a subtle dot later if needed)
        modified: "",
        disabled: "opacity-60 cursor-not-allowed bg-gray-50",
      },
        },
    compoundVariants: [],
        defaultVariants: {
            size: "default",
            state: "normal",
        },
    }
);

type ExtraDivProps = {
  // Allow passing arbitrary data-* attributes and id for scrolling/highlight
  id?: string;
  [dataAttr: `data-${string}`]: any; // index signature for data-* only
};

export interface FieldCardProps extends VariantProps<typeof fieldCardVariants>, ExtraDivProps {
    label: string;
    value: string;
    placeholder: string;
    status: "modified" | "original";
    onEdit: (value: string) => void;
    onCopy: (copied: string) => void; // retained for compatibility (not used yet)
    onDelete: () => void; // retained for compatibility (not used yet)
  onCancel?: () => void; // new: invoked when user cancels editing
    editable: boolean;
    disabled: boolean;
    variant?: never;
    size?: "default" | "compact" | "ultra";
    confidence?: number;
    provenanceSnippet?: string;
    onSnippetClick?: (snippet: string) => void;
    maxSnippetChars?: number;
  onEditingChange?: (editing: boolean) => void;
  className?: string;
  // live updates always enabled with fixed 250ms debounce (props removed)
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isActive?: boolean; // new: active (focused or highlighted) visual state
}

export interface FieldCardHandle {
    focus: () => void;
    startEdit: () => void;
    cancelEdit: () => void;
}

export const FieldCard = React.memo(forwardRef<FieldCardHandle, FieldCardProps>((props, ref) => {
  const {
    label,
    value,
    placeholder,
    onEdit,
    onCopy, // keep extracted but do not spread
    onDelete, // keep extracted but do not spread
    editable,
    disabled,
    size = "default",
    confidence,
    provenanceSnippet,
    onSnippetClick,
    maxSnippetChars = 120,
    onEditingChange,
  className,
  status,
  onClick,
  isActive = false,
  ...rest } = props;

  // Derive modified state directly: either status prop or value differs from placeholder
  const wasModified = useMemo(() => status === 'modified' || value !== placeholder, [status, value, placeholder]);

  const sizeClasses = {
    default: { label: 'text-sm font-medium', value: 'text-sm', provenance: '' },
    compact: { label: 'text-xs font-medium', value: 'text-xs', provenance: '' },
    ultra: { label: 'text-[11px] font-medium', value: 'text-[11px]', provenance: '' },
  } as const;
  const sz = sizeClasses[size];

  const handleConfirm = useCallback(() => {/* no-op: parent already updated */}, []);

  const editingApi = useFieldCardEditing({
    value,
    editable,
    disabled,
    onEdit,
    onConfirm: handleConfirm,
  onCancel: props.onCancel || (() => {}),
    onEditingChange,
  });

  useImperativeHandle(ref, () => ({
    focus: () => editingApi.inputRef.current?.focus(),
    startEdit: () => editingApi.startEdit(),
    cancelEdit: () => editingApi.cancelEdit(),
  }));

  const truncatedSnippet = provenanceSnippet && provenanceSnippet.length > maxSnippetChars
    ? provenanceSnippet.slice(0, maxSnippetChars - 1).trimEnd() + '…'
    : provenanceSnippet;

  const isEmpty = !value;

  // Determine visual state: suppress amber modified ring while actively editing so only blue shows
  const visualState = disabled
    ? 'disabled'
    : editingApi.isEditing
      ? 'normal'
      : (wasModified || status === 'modified')
        ? 'modified'
        : 'normal';

  return (
    <BaseCard
      className={cn(
        fieldCardVariants({ size, state: visualState as any }),
        editingApi.isEditing && 'ring-2 ring-blue-500/40',
        isActive && 'outline outline-2 outline-blue-400',
        className,
        'relative'
      )}
      role="group"
      onClick={onClick}
      aria-disabled={disabled || undefined}
      data-label={label}
      data-editing={editingApi.isEditing || undefined}
      data-active={isActive || undefined}
      {...Object.fromEntries(Object.entries(rest).filter(([k]) => !['onCopy','onDelete'].includes(k)))}
    >
      <div className="flex flex-col gap-1 pr-8" aria-live="polite">
        <FieldCardHeader label={label} wasModified={wasModified} status={status} sizeClasses={{ label: sz.label }} confidence={confidence} />
        <FieldCardValue
          value={value}
          placeholder={placeholder}
          isEmpty={isEmpty}
          editable={editable}
          disabled={disabled}
          isEditing={editingApi.isEditing}
          draft={editingApi.draft}
          setDraft={editingApi.setDraft}
          startEdit={editingApi.startEdit}
          confirmEdit={editingApi.confirmEdit}
          cancelEdit={editingApi.cancelEdit}
          inputRef={editingApi.inputRef}
          sizeClasses={{ value: sz.value }}
        />
        {truncatedSnippet && !editingApi.isEditing && (
          <button
            type="button"
            onClick={(e) => {
              onSnippetClick?.(provenanceSnippet!);
              // Prevent focus from staying on this button
              e.currentTarget.blur();
              // Move focus back to container
              const container = document.querySelector('[data-field-list-container]');
              if (container) {
                (container as HTMLElement).focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                // When tabbing from snippet, ensure focus moves properly to next element
                e.currentTarget.blur();
              }
            }}
            className="mt-1 w-fit text-[10px] rounded cursor-pointer px-1.5 py-0.5 bg-gray-100 hover:bg-blue-200 text-gray-600 hover:text-gray-800 transition-colors "
            aria-label={`View provenance snippet for ${label}`}
            title={provenanceSnippet}
            data-full-snippet={provenanceSnippet}
          >
            <span className="font-semibold text-gray-500">{label}:</span> {truncatedSnippet}
          </button>
        )}
      </div>
    </BaseCard>
  );
}));

FieldCard.displayName = "FieldCard";

