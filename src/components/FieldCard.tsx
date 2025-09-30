"use client";

import { cn } from "@/lib/utils";
import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useFieldCardEditing } from "@/hooks/useFieldCardEditing";
import { FieldCardHeader } from "@/components/FieldCardHeader";
import { FieldCardValue } from "@/components/FieldCardValue";


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


type DataAttrPrimitive = string | number | boolean | undefined;
type DataAttributes = { [K in `data-${string}`]?: DataAttrPrimitive };
type ExtraDivProps = DataAttributes & { id?: string };

export interface FieldCardProps extends VariantProps<typeof fieldCardVariants>, ExtraDivProps {
    label: string;
    value: string;
    placeholder: string;
    status: "modified" | "original";
    onEdit: (value: string) => void;
    onCopy: (copied: string) => void;
    onDelete: () => void; 
    onCancel?: () => void; 
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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  isActive?: boolean; 
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
    onCopy,
    onDelete,
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


  const wasModified = useMemo(() => status === 'modified' || value !== placeholder, [status, value, placeholder]);

  /**
   * Size styles for label and value text based on size variant
   * - default: regular padding and font sizes
   * - compact: reduced padding and slightly smaller fonts
   * - ultra: minimal padding and smallest fonts
   */
  const SIZE_STYLES = useMemo(() => ({
    default: { label: 'text-sm font-medium', value: 'text-sm', provenance: '' },
    compact: { label: 'text-xs font-medium', value: 'text-xs', provenance: '' },
    ultra: { label: 'text-[11px] font-medium', value: 'text-[11px]', provenance: '' },
  } as const), []);
  const sz = SIZE_STYLES[size];


  /**
   * Editing state management via custom hook
   * - handles isEditing, draft value, input ref, and edit lifecycle (start, confirm, cancel)
   * - disables editing if not editable or disabled
   * - calls onEdit when confirmed with changed value
   * - calls onCancel prop if provided when edit is cancelled
   * - notifies parent of editing state changes via onEditingChange callback
   */
  const editingApi = useFieldCardEditing({
    value,
    editable,
    disabled,
    onEdit,
    onConfirm: () => {},
  onCancel: props.onCancel || (() => {}),
    onEditingChange,
  });


  /**
   * Expose imperative methods to parent via ref
   * - focus: focus the input if editing
   * - startEdit: begin editing mode
   * - cancelEdit: cancel current edit and revert value
   */
  useImperativeHandle(ref, () => ({
    focus: () => editingApi.inputRef.current?.focus(),
    startEdit: () => editingApi.startEdit(),
    cancelEdit: () => editingApi.cancelEdit(),
  }));


  /**
   * Truncate provenance snippet if too long, adding ellipsis
   * - shows full snippet on hover via title attribute
   * - maxSnippetChars controls truncation length (default 120)
   */
  const truncatedSnippet = useMemo(() => {
    if (!provenanceSnippet) return provenanceSnippet;
    if (provenanceSnippet.length <= maxSnippetChars) return provenanceSnippet;
    return provenanceSnippet.slice(0, maxSnippetChars - 1).trimEnd() + '…';
  }, [provenanceSnippet, maxSnippetChars]);

  const isEmpty = !value;

/**
 * Determine visual state for styling
 * - disabled: when disabled prop is true
 * - normal: when editing or unmodified
 * - modified: when not editing and value was modified (differs from placeholder or status is 'modified')
 */
  const visualState: 'normal' | 'modified' | 'disabled' = disabled
    ? 'disabled'
    : editingApi.isEditing
      ? 'normal'
      : (wasModified || status === 'modified')
        ? 'modified'
        : 'normal';

  return (
    <BaseCard
      className={cn(
  fieldCardVariants({ size, state: visualState }),
        editingApi.isEditing && 'ring-0 outline-none ring-transparent',
        !editingApi.isEditing && isActive && 'outline outline-2 outline-blue-400',
        editingApi.isEditing && 'bg-white',
        className,
        'relative'
      )}
  role="group"
      onClick={(e) => {
        if (editingApi.isEditing) { e.stopPropagation(); return; }
        onClick?.(e);
      }}
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
              e.currentTarget.blur();
              const container = document.querySelector('[data-field-list-container]');
              if (container) {
                (container as HTMLElement).focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
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

