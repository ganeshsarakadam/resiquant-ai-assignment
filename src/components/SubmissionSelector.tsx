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
                <label htmlFor="submission-select-trigger" className="block text-sm font-medium text-gray-700 mb-2" id="submission-select-label">
                    Select a submission
                </label>
                <p id="submission-select-help" className="sr-only">Choosing a submission loads its related documents and extracted fields.</p>
                <Select onValueChange={setSubmissionId} value={state.submissionId || ""}>
                    <SelectTrigger
                        id="submission-select-trigger"
                        aria-labelledby="submission-select-label"
                        aria-describedby="submission-select-help"
                        className="w-65 cursor-pointer"
                    >
                        <SelectValue placeholder="Choose a submission..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white" aria-label="Submission options">
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