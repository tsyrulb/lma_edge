/**
 * Date Formatter Utility
 * Provides multiple format modes for displaying dates in human-readable format.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

export type DateFormatMode = 'short' | 'medium' | 'long' | 'relative';

export interface DateFormatOptions {
  format?: DateFormatMode;
  showTime?: boolean;
  fallback?: string;
}

const DEFAULT_FALLBACK = '—';

/**
 * Formats a date value according to the specified format mode.
 * 
 * @param date - The date to format (Date, string, number, null, or undefined)
 * @param options - Formatting options
 * @returns Formatted date string or fallback for invalid/null dates
 * 
 * Format modes:
 * - 'short': "Jan 15, 2026"
 * - 'medium': "January 15, 2026"
 * - 'long': "Monday, January 15, 2026"
 * - 'relative': "in 3 days" or "2 days ago" (for dates within 7 days)
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  const { format = 'short', showTime = false, fallback = DEFAULT_FALLBACK } = options;

  // Handle null/undefined inputs (Requirement 1.4)
  if (date === null || date === undefined) {
    return fallback;
  }

  // Parse the date
  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return fallback;
  }

  // Format based on mode
  switch (format) {
    case 'relative':
      return formatRelativeDate(parsedDate, fallback);
    case 'short':
      return formatShortDate(parsedDate, showTime);
    case 'medium':
      return formatMediumDate(parsedDate, showTime);
    case 'long':
      return formatLongDate(parsedDate, showTime);
    default:
      return formatShortDate(parsedDate, showTime);
  }
}

/**
 * Parses various date input types into a Date object.
 */
function parseDate(date: Date | string | number): Date | null {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Formats date in short format: "Jan 15, 2026"
 * Requirement 1.1
 */
function formatShortDate(date: Date, showTime: boolean): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  if (showTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats date in medium format: "January 15, 2026"
 */
function formatMediumDate(date: Date, showTime: boolean): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  if (showTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats date in long format: "Monday, January 15, 2026"
 * Requirement 1.3 (with time for obligation details)
 */
function formatLongDate(date: Date, showTime: boolean): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  if (showTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.timeZoneName = 'short';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats date as relative time: "in 3 days" or "2 days ago"
 * Only for dates within 7 days of current date.
 * Requirement 1.2
 */
function formatRelativeDate(date: Date, fallback: string): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Only use relative format for dates within 7 days
  if (Math.abs(diffDays) > 7) {
    return formatShortDate(date, false);
  }

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays === -1) {
    return 'yesterday';
  } else if (diffDays > 0) {
    return `in ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}

/**
 * Calculates the number of days between a date and now.
 * Positive = future, negative = past.
 */
export function getDaysDifference(date: Date | string | number | null | undefined): number | null {
  if (date === null || date === undefined) {
    return null;
  }

  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return null;
  }

  const now = new Date();
  const diffMs = parsedDate.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is within the specified number of days from now.
 */
export function isWithinDays(
  date: Date | string | number | null | undefined,
  days: number
): boolean {
  const diff = getDaysDifference(date);
  if (diff === null) {
    return false;
  }
  return Math.abs(diff) <= days;
}
