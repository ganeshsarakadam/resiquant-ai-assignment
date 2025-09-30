## Resiquant AI - Submission Document Explorer

Submission Document Explorer for multi‑document insurance submissions (PDF, DOCX, XLS/XLSX) with provenance overlays and making corrections on the fields based on the document preview.

Note: Add the submission folders (sub_2, sub_5, sub_7, sub_19, sub_56) under public/submissions/

---
## 1. Prerequisites
- Node.js 18+ (Next.js 15 requirement) – check with `node -v`.
- npm (default). You may optionally use pnpm or yarn, but instructions below assume npm.

## 2. Install Dependencies
```bash
npm install
```


## 3. Project Structure (Key Paths)
```
public/
	submissions/               # Raw submission files (PDFDOCX/XLS/XLSX)
	data/
		extraction_sub_<id>.json  # Extraction output per submission (optional)
src/
	data/                       # Manifests linking submissions & documents
	components/                 # Viewers & overlay components
	hooks/                      # URL + highlight state hooks
```

## 4. Running the App
Development (Turbopack):
```bash
npm run dev
```
Then open: http://localhost:3000

Production build:
```bash
npm run build
npm start
```

## 5. Adding Submission Data
There are two required pieces to surface new documents:
1. Physical files placed under: `public/submissions/<submissionId>/<OriginalFileName>`
2. Manifest entry in `src/data/submissions.manifest.ts` (and optionally `documents.manifest.ts` if individual lookup needed).




## 6. Deep Linking / URL State
The hook `useSelectionUrlState` persists: `submissionId`, `documentId`, and `page` as query params. You can copy a URL and share the exact document page context.


## 8. Common Tasks
Add a new document to existing submission:
1. Drop file into `public/submissions/<submissionId>/`.
2. Append a matching document object in the `documents` array for that submission in `submissions.manifest.ts`.
3. (Optional) Add extraction entries referencing the new document in the JSON file.

Create a new submission:
1. Make folder: `public/submissions/sub_99/`
2. Add files.
3. Add a new submission object to `submissions.manifest.ts` with `submissionId: "sub_99"`.
4. (Optional) Add `extraction_sub_99.json`.



## 10. Scripts
```bash
npm run dev     # run dev server
npm run build   # production build
npm start       # start built app
npm run lint    # lint codebase
```

## 11. License / Usage
Assignment / demo purposes only. No production warranty.

---
See `DESIGN.md` for architecture, math, and trade-offs.
