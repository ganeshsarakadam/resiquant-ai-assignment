import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ExtractionData } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Load extraction JSON for a given submissionId from /public/data.
 * Returns null if not found or on error.
 */
export async function loadExtraction(submissionId: string): Promise<ExtractionData | null> {
  if (!submissionId) return null
  const path = `/data/extraction_${submissionId}.json`
  try {
    await delay(500);
    const res = await fetch(path)
    if (!res.ok) return null
    const data = await res.json() as ExtractionData
    return data
  } catch (e) {
    console.warn('loadExtraction failed', e)
    return null
  }
}


export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}
