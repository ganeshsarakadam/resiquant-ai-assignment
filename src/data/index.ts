import { document_map } from "./documents.manifest"
import { submission_document_map } from "./submissions.manifest"
import { Document } from "@/types"




export const getDocumentsById = (id: string): Document[] => {
    return submission_document_map[id]
}

export const getDocumentById = (id: string): Document => {
    return document_map[id as keyof typeof document_map]
}