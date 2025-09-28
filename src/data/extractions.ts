import { ExtractionData } from '@/types';

// Load extraction data for a specific submission
export async function loadExtractionData(submissionId: string): Promise<ExtractionData | null> {
  try {
    const response = await fetch(`/data/extraction_${submissionId}.json`);
    if (!response.ok) {
      console.warn(`No extraction data found for submission ${submissionId}`);
      return null;
    }
    const data: ExtractionData = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading extraction data for ${submissionId}:`, error);
    return null;
  }
}

