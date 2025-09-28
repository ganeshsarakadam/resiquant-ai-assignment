import { Submission } from "@/types"
import { Document } from "@/types"
/**
 * 
 * @param submissionId - The submission id
 * @param fileName - The file name
 * @returns The URL of the document (to be used in the document viewer, subjected to be localized, can be extended later to load the documents from the cloud storage)
 */
export const createDocUrl = (submissionId: string, fileName: string): string => {
    return `/submissions/${submissionId}/${encodeURIComponent(fileName)}`
}


/**
 * The submissions manifest is a list of submissions and their documents.
 * It is used to list the documents and load them in the document viewer.
 * @type {Submission[]}
 */
export const submissions: Submission[] = [
    {
        submissionId: "sub_2",
        title: "Submission 2",
        documents: [
            {
                id: "pdf-town-squire-owners-association",
                name: "Resiquant Mail - FW_ Town Squire Owners Association, File # BR138084-01.pdf",
                type: "pdf",
                url: createDocUrl("sub_2", "Resiquant Mail - FW_ Town Squire Owners Association, File # BR138084-01.pdf")
            },
            {
                id: "xlsx-town-squire",
                name: "24-25 DIC SOV - $8,104,498.xlsx",
                type: "xlsx",
                url: createDocUrl("sub_2", "24-25 DIC SOV - $8,104,498.xlsx")
            }
        ]
    }, {
        submissionId: "sub_5",
        title: "Submission 5",
        documents: [
            {
                id: "pdf-attachment",
                name: "Attachment.pdf",
                type: "pdf",
                url: createDocUrl("sub_5", "Attachment.pdf")
            },
            {
                id: "pdf-attachment-email",
                name: "Mail - Francisco Galvis - Outlook.pdf",
                type: "pdf",
                url: createDocUrl("sub_5", "Mail - Francisco Galvis - Outlook.pdf")
            },
            {
                id: "docx-ganesh-sarakadam",
                name: "Ganesh-Sarakadam-Resume.docx",
                type: "docx",
                url: createDocUrl("sub_5", "Ganesh-Sarakadam-Resume.docx")
            }
        ]
    },
    {
        submissionId: "sub_7",
        title: "Submission 7",
        documents: [
            {
                id: "pdf-remmet-bushman-prop",
                name: "2024-25 8010 REMMET BUSHMAN PROP.pdf",
                type: "pdf",
                url: createDocUrl("sub_7", "2024-25 8010 REMMET BUSHMAN PROP.pdf")
            },
            {
                id: "pdf-remmet-gen",
                name: "2024-25 8010 REMMET GEN 1.pdf",
                type: "pdf",
                url: createDocUrl("sub_7", "2024-25 8010 REMMET GEN 1.pdf")
            },
            {
                id: "docx-coverage-summary",
                name: "8010 Remmet Ave LLC - Coverage Summary - 2024.docx",
                type: "docx",
                url: createDocUrl("sub_7", "8010 Remmet Ave LLC - Coverage Summary - 2024.docx")
            },
            {
                id: "xlsx-sov-remmet",
                name: "8010 Remmet Ave LLC - SOV - 2024.xls",
                type: "xlsx",
                url: createDocUrl("sub_7", "8010 Remmet Ave LLC - SOV - 2024.xls")
            },
            {
                id: "pdf-mail-remmet",
                name: "Resiquant Mail - FW_ 8010 REMMET AVE LLC - Eff. 10-30-24.pdf",
                type: "pdf",
                url: createDocUrl("sub_7", "Resiquant Mail - FW_ 8010 REMMET AVE LLC - Eff. 10-30-24.pdf")
            }
        ]
    },
    {
        submissionId: "sub_19",
        title: "Submission 19",
        documents: [
            {
                id: "xlsx-quake-sov",
                name: "Quake SOV 9.16.2024.xlsx",
                type: "xlsx",
                url: createDocUrl("sub_19", "Quake SOV 9.16.2024.xlsx")
            },
            {
                id: "pdf-mail-harbour",
                name: "Resiquant Mail - FW_ Harbour Benefit Holdings, Inc - Submission Eff 10_31_2024.pdf",
                type: "pdf",
                url: createDocUrl("sub_19", "Resiquant Mail - FW_ Harbour Benefit Holdings, Inc - Submission Eff 10_31_2024.pdf")
            }
        ]
    },
    {
        submissionId: "sub_56",
        title: "Submission 56",
        documents: [
            {
                id: "pdf-earthquake-app",
                name: "Earthquake_Application.PDF",
                type: "pdf",
                url: createDocUrl("sub_56", "Earthquake_Application.PDF")
            },
            {
                id: "pdf-earthquake-app-1",
                name: "Earthquake_Application[1].PDF",
                type: "pdf",
                url: createDocUrl("sub_56", "Earthquake_Application[1].PDF")
            },
            {
                id: "pdf-earthquake-app-2",
                name: "Earthquake_Application[2].PDF",
                type: "pdf",
                url: createDocUrl("sub_56", "Earthquake_Application[2].PDF")
            },
            {
                id: "pdf-file-summary",
                name: "FILE SUMMARY.PDF",
                type: "pdf",
                url: createDocUrl("sub_56", "FILE SUMMARY.PDF")
            },
            {
                id: "pdf-mail-clinica",
                name: "Resiquant Mail - FW_ DIC Submission Clinica Msr. Oscar A. Romero eff 10_01_24.pdf",
                type: "pdf",
                url: createDocUrl("sub_56", "Resiquant Mail - FW_ DIC Submission Clinica Msr. Oscar A. Romero eff 10_01_24.pdf")
            }
        ]
    }
]


export const submission_document_map: Record<string, Document[]> = {    
    "sub_2": submissions[0].documents,
    "sub_5": submissions[1].documents,
    "sub_7": submissions[2].documents,
    "sub_19": submissions[3].documents,
    "sub_56": submissions[4].documents
}