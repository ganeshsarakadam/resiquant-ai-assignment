'use client'

interface FieldListHeaderProps {
  isModified: boolean;
  fieldsCount: number;
  onResetToDefault: () => void;
}

export const FieldListHeader = ({ 
  isModified, 
  fieldsCount, 
  onResetToDefault 
}: FieldListHeaderProps) => {
  return (
    <div className="shrink-0 px-4 py-2 border-b bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Field List</h2>
        {isModified && (
          <div className="flex gap-1">
            <button
              onClick={onResetToDefault}
              className="text-xs px-2 cursor-pointer py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
              title="Reset all fields to original values"
            >
              Reset to Default
            </button>
          </div>
        )}
      </div>
      {fieldsCount > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Use ↑↓ arrow keys to navigate, Enter to highlight, Ctrl+E to edit, Escape to clear focus
        </div>
      )}
    </div>
  );
};
