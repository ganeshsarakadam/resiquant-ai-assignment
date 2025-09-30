import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce interval for live inline edits (ms)
const LIVE_EDIT_DEBOUNCE_MS = 250;

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
  // Snapshot of the value when editing begins (could already be modified). Re-applied on cancel.
  const baselineRef = useRef(value);

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
    baselineRef.current = value; // capture baseline
    setDraft(value);
    setIsEditing(true);
    emitEditing(true);
  }, [editable, disabled, value, emitEditing]);

  const confirmEdit = useCallback(() => {
    if (liveTimerRef.current) { clearTimeout(liveTimerRef.current); liveTimerRef.current = null; }
    setIsEditing(false);
    emitEditing(false);
    if (draft !== value) {
      onEdit(draft);
      onConfirm();
    }
  }, [draft, value, onEdit, onConfirm, emitEditing]);

  const cancelEdit = useCallback(() => {
    if (liveTimerRef.current) { clearTimeout(liveTimerRef.current); liveTimerRef.current = null; }
    setIsEditing(false);
    // Revert draft to baseline (pre-edit) value
    setDraft(baselineRef.current);
    emitEditing(false);
    // If live debounced edits mutated external value, restore baseline via onEdit
    if (baselineRef.current !== value) {
      onEdit(baselineRef.current);
    }
    onCancel();
  }, [value, onCancel, emitEditing, onEdit]);

  // Debounced live edits while user is typing (only when the draft diverges from current external value)
  useEffect(() => {
    if (!isEditing) return;
    if (draft === value) return;
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => onEdit(draft), LIVE_EDIT_DEBOUNCE_MS);
    return () => { if (liveTimerRef.current) clearTimeout(liveTimerRef.current); };
  }, [draft, isEditing, onEdit, value]);

  // Cleanup on unmount (defensive)
  useEffect(() => {
    return () => { if (liveTimerRef.current) clearTimeout(liveTimerRef.current); };
  }, []);

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
