"use client";

import { cn } from "@/lib/utils";
import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { useFieldCardEditing } from "@/hooks/useFieldCardEditing";
import { FieldCardHeader } from "@/components/FieldCardHeader";
import { FieldCardValue } from "@/components/FieldCardValue";


type MotionDivProps = React.ComponentProps<typeof motion.div>;
const BaseCard: React.FC<MotionDivProps> = ({ className, ...rest }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18, ease: [0.22, 0.98, 0.52, 0.99] }}
            whileHover={{ y: -2, boxShadow: "0 4px 10px -2px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.985 }}
            className={cn("bg-white border rounded-md shadow-sm will-change-transform", className)}
            {...rest}
        />
    );
};

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
        modified: "border-amber-400 bg-amber-50/40",
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

export interface FieldCardProps extends VariantProps<typeof fieldCardVariants> {
    label: string;
    value: string;
    placeholder: string;
    status: "modified" | "original";
    onEdit: (value: string) => void;
    onCopy: (copied: string) => void; // retained for compatibility (not used yet)
    onDelete: () => void; // retained for compatibility (not used yet)
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
  } = props;

  const [wasModified, setWasModified] = useState(status === 'modified');
  const modifiedRef = useRef(value);

  const sizeClasses = {
    default: { label: 'text-sm font-medium', value: 'text-sm', provenance: '' },
    compact: { label: 'text-xs font-medium', value: 'text-xs', provenance: '' },
    ultra: { label: 'text-[11px] font-medium', value: 'text-[11px]', provenance: '' },
  } as const;
  const sz = sizeClasses[size];

  const handleConfirm = useCallback(() => {
    setWasModified(true);
    modifiedRef.current = value;
  }, [value]);

  const editingApi = useFieldCardEditing({
    value,
    editable,
    disabled,
    onEdit,
    onConfirm: handleConfirm,
    onCancel: () => {},
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
        className
      )}
      role="group"
      aria-disabled={disabled || undefined}
      data-label={label}
      data-editing={editingApi.isEditing || undefined}
    >
      <div className="flex flex-col gap-1 pr-8" aria-live="polite">
        <FieldCardHeader
          label={label}
          wasModified={wasModified}
          status={status}
          sizeClasses={{ label: sz.label }}
          confidence={confidence}
        />
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
          <motion.button
            type="button"
            onClick={() => onSnippetClick?.(provenanceSnippet!)}
            whileTap={{ scale: 0.97 }}
            className="mt-1 w-fit text-[10px] rounded cursor-pointer px-1.5 py-0.5 bg-gray-100 hover:bg-blue-200 text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`View provenance snippet for ${label}`}
            title={provenanceSnippet}
            data-full-snippet={provenanceSnippet}
          >
            <span className="font-semibold text-gray-500">{label}:</span> {truncatedSnippet}
          </motion.button>
        )}
      </div>
    </BaseCard>
  );
}));

FieldCard.displayName = "FieldCard";

