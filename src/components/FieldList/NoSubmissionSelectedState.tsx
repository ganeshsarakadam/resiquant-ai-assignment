'use client'

import { FileWarning } from "lucide-react";

export const NoSubmissionSelectedState = () => {
  return (
    <div className="flex items-center justify-center py-10 select-none">
      <div className="border rounded-md bg-white shadow-sm p-6 w-full max-w-sm text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
          <FileWarning className="h-6 w-6 text-blue-500" />
        </div>
        <h3 className="text-sm font-medium text-gray-900">No Submission Selected</h3>
        <p className="text-xs text-gray-500">Choose a submission above to load its extracted fields.</p>
      </div>
    </div>
  );
};
