import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely (later classes override earlier conflicting ones).
 * Standard shadcn/ui helper, works with NativeWind v4.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
