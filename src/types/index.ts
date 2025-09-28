export type DocumentType = "pdf" | "image" | "xlsx" | "eml" | "docx";

/**
 * A document is a file that is uploaded to the platform or could be extracted from other cloud systems.
 * @interface Document
 */
export type Document = {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  pageCount?: number;
};

/**
 * A submission is a collection of documents that a single insurance provider.
 * @interface Submission
 */
export interface Submission {
    submissionId: string;
    title: string;
    documents: Document[];
}

