import { useState, useEffect, useRef, useCallback } from 'react';

interface UseFieldCardEditingOptions {
  value: string;
  editable: boolean;
  disabled: boolean;
  onEdit: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEditingChange?: (editing: boolean) => void;
}

export function useFieldCardEditing({
  value,
  editable,
  disabled,
  onEdit,
  onConfirm,
  onCancel,
  onEditingChange,
}: UseFieldCardEditingOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value when not editing
  useEffect(() => { if (!isEditing) setDraft(value); }, [value, isEditing]);

  // Auto focus/select when entering edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const emitEditing = useCallback((next: boolean) => onEditingChange?.(next), [onEditingChange]);

  const startEdit = useCallback(() => {
    if (!editable || disabled) return;
    setDraft(value);
    setIsEditing(true);
    emitEditing(true);
  }, [editable, disabled, value, emitEditing]);

  const confirmEdit = useCallback(() => {
    setIsEditing(false);
    emitEditing(false);
    if (draft !== value) {
      onEdit(draft);
      onConfirm();
    }
  }, [draft, value, onEdit, onConfirm, emitEditing]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraft(value);
    emitEditing(false);
    onCancel();
  }, [value, onCancel, emitEditing]);

  // Always debounce edits (250ms) while editing
  useEffect(() => {
    if (!isEditing) return;
    if (draft === value) return;
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => onEdit(draft), 250);
    return () => { if (liveTimerRef.current) clearTimeout(liveTimerRef.current); };
  }, [draft, isEditing, onEdit, value]);

  return {
    isEditing,
    draft,
    setDraft,
    inputRef,
    startEdit,
    confirmEdit,
    cancelEdit,
  };
}
