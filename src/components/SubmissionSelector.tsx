'use client';

import { submissions } from "@/data/submissions.manifest";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * SubmissionSelector component to select a submission
 * @returns SubmissionSelector component
 * @description This component is used to select a submission from the submissions manifest
 */

export default function SubmissionSelector() {
    const { state, setSubmissionId } = useSelectionUrlState();

    return (
        <div className="submission-selector">
            <label htmlFor="submission-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select a submission
            </label>
            <Select onValueChange={setSubmissionId} value={state.submissionId || ""}>
                <SelectTrigger className="w-65 cursor-pointer">
                    <SelectValue placeholder="Choose a submission..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                    {submissions.map((submission) => (
                        <SelectItem className="cursor-pointer" key={submission.submissionId} value={submission.submissionId}>
                            {submission.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}