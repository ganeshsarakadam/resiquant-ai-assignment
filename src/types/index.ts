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

export interface Field {
  id: string;
  name: string;
  value: string;

}

export interface ExtractedField extends Field {
  confidence: number;
  fieldType: string;
  provenance: FieldProvenance;
}


export interface FieldProvenance {
  docId: string;
  docName: string;
  documentType: DocumentType;
  page: number;
  location: string;
  snippet: string;
  bbox?: [number, number, number, number]; 
  cellRange?: [string, string];
}

export interface ExtractionData {
  submissionId: string;
  title: string;
  extractedFields: ExtractedField[];
  extractionMetadata: ExtractionMetadata;
}

export interface ExtractionMetadata {
  extractedAt: string;
  extractionMethod: string;
  totalFields: number;
  averageConfidence: number;
  documentsProcessed: DocumentProcessed[];
}

export interface DocumentProcessed {
  docId: string;
  docName: string;
  pages: number;
  fieldsExtracted: number;
}

// Minimal subset of a PDF.js document we rely on in viewers. Extend here if more properties needed later.
export interface PdfDocumentMinimal {
  numPages: number;
}

