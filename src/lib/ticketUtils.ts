// Utility functions for ticket operations

/**
 * Calculate ticket age in hours
 * @param createdAt - The ticket creation date
 * @returns The age of the ticket in hours
 */
export function getTicketAgeInHours(createdAt: string | Date): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / 3600000);
}
