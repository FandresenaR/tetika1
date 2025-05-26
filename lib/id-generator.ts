/**
 * Utility for generating unique IDs consistently across the application
 */

// Counter to ensure uniqueness even when timestamps are the same
let idCounter = 0;

/**
 * Generates a unique ID using a combination of timestamp, counter, and random string
 * @returns A unique string ID
 */
export function generateUniqueId(): string {
  const timestamp = Date.now();
  const counter = (idCounter++).toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${counter}-${randomPart}`;
}
