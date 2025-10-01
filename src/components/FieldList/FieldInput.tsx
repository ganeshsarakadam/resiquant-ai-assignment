'use client'

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onEdit: (newValue: string) => void;
  onCancel?: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const FieldInput = ({  
  value,
  placeholder,
  onEdit,
  onCancel,
  onEditingChange,
  disabled = false,
  className
}: FieldInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setDraftValue(value);
  }, [value]);


  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setDraftValue(value);
    onEditingChange?.(true);
  };

  const handleConfirm = () => {
    if (draftValue !== value) {
      onEdit(draftValue);
    }
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleCancel = () => {
    setDraftValue(value);
    setIsEditing(false);
    onEditingChange?.(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={inputRef}
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleConfirm}
          className="h-8 w-8 cursor-pointer p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={disabled}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 cursor-pointer p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      data-field-input
      className={cn(
        "text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      onDoubleClick={handleDoubleClick}
      title={disabled ? "Cannot edit" : "Double-click to edit"}
    >
      {value || placeholder || "No value"}
    </div>
  );
};
