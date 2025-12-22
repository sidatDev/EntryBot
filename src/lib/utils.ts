import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Determines if a document should be flagged for QA based on a random sampling rate.
 * @param percentage 0-100 (e.g. 10 for 10%)
 */
export function shouldFlagForQA(percentage: number = 10): boolean {
  return Math.random() * 100 < percentage;
}
