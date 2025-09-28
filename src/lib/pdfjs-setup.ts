import { pdfjs } from 'react-pdf';

// Set up PDF.js worker source to match the version used by react-pdf
if (typeof window !== 'undefined') {
  // Use CDN worker for better compatibility with react-pdf v10.1.0
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}
