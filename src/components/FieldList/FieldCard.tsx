'use client'

import { useState } from "react";
import {  CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { FieldInput } from "@/components/FieldList/FieldInput";
import { Badge } from "@/components/ui/badge";

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
                default: "py-2 pl-3 pr-3",
                compact: "py-1.5 pl-2 pr-2",
                ultra: "py-1 pl-1.5 pr-1.5",
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

interface FieldCardProps extends VariantProps<typeof fieldCardVariants>, ExtraDivProps {
  label: string;
  value: string;
  placeholder: string;
  status: "modified" | "original";
  onEdit: (value: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  editable: boolean;
  disabled: boolean;
  variant?: "default" | "compact" | "ultra";
  confidence?: number;
  provenanceSnippet?: string;
  onSnippetClick?: (snippet: string) => void;
  className?: string;
}
export const FieldCard = (props: FieldCardProps) => {
  const {
    label,
    value,
    placeholder,
    status,
    onEdit, 
    onConfirm,
    onCancel,
    editable,
    disabled,
    provenanceSnippet,
    onSnippetClick,
    confidence,
    className,
    ...rest
  } = props;

  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (newValue: string) => {
    onEdit(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };


  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 0.9) return "default"; 
    if (confidence >= 0.5) return "secondary"; 
    return "destructive"; 
  };

  return(
    <BaseCard 
      className={cn(fieldCardVariants({ size: "default", state: status === 'modified' ? 'modified' : 'normal' }), "w-full", className)}
      {...rest}
    >
      <CardHeader className="py-1 px-0 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-gray-900">{label}</CardTitle>
            {status === 'modified' && (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                Modified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={confidence ? getConfidenceVariant(confidence) : "outline"} 
              className={cn(
                "text-xs",
                confidence !== undefined && confidence >= 0.9 && "bg-green-100 text-green-800 border-green-300",
                confidence !== undefined && confidence >= 0.5 && confidence < 0.9 && "bg-yellow-100 text-yellow-800 border-yellow-300",
                confidence !== undefined && confidence < 0.5 && "bg-red-100 text-red-800 border-red-300",
                confidence === undefined && "bg-gray-100 text-gray-600 border-gray-300"
              )}
            >
              {confidence !== undefined ? `${Math.round(confidence * 100)}%` : "?"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-0 px-0 pt-1">
        <div className="space-y-1">
           {
             value ? (
               <FieldInput
                 label={label}
                 value={value}
                 placeholder={placeholder}
                 onEdit={handleEdit}
                 onCancel={handleCancel}
                 onEditingChange={setIsEditing}
                 disabled={disabled}
               />
             ) : (
               <p className="text-sm text-gray-700">{value}</p>
             )
           }

           {provenanceSnippet && !isEditing && (
             <button 
               onClick={() => onSnippetClick?.(provenanceSnippet)}
               className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 border hover:bg-blue-200 transition-colors cursor-pointer"
               title={`Click to highlight ${label} in document`}
             >
               <span className="font-medium text-gray-500 mr-1">{label}:</span>
               <span>{provenanceSnippet}</span>
             </button>
           )}
        </div>
      </CardContent>
    </BaseCard>
  )
}