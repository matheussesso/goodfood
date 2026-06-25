import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge tailwind classes safely.
 *
 * @param inputs - Class names or conditional class objects
 * @returns Merged string of classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
