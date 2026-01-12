import { formatDate, getDaysDifference, isWithinDays } from './date-formatter';

describe('Date Formatter', () => {
  describe('formatDate', () => {
    // Requirement 1.4: Handle null/undefined inputs
    it('should return fallback for null input', () => {
      expect(formatDate(null)).toBe('—');
    });

    it('should return fallback for undefined input', () => {
      expect(formatDate(undefined)).toBe('—');
    });

    it('should return custom fallback when provided', () => {
      expect(formatDate(null, { fallback: 'N/A' })).toBe('N/A');
    });

    it('should return fallback for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('—');
    });

    // Requirement 1.1: Short format "Jan 15, 2026"
    describe('short format', () => {
      it('should format date as "Jan 15, 2026"', () => {
        const date = new Date(2026, 0, 15); // January 15, 2026
        const result = formatDate(date, { format: 'short' });
        expect(result).toBe('Jan 15, 2026');
      });

      it('should include time when showTime is true', () => {
        const date = new Date(2026, 0, 15, 14, 30);
        const result = formatDate(date, { format: 'short', showTime: true });
        expect(result).toContain('Jan 15, 2026');
        expect(result).toMatch(/2:30\s*PM/i);
      });
    });

    // Medium format
    describe('medium format', () => {
      it('should format date as "January 15, 2026"', () => {
        const date = new Date(2026, 0, 15);
        const result = formatDate(date, { format: 'medium' });
        expect(result).toBe('January 15, 2026');
      });
    });

    // Long format
    describe('long format', () => {
      it('should format date with weekday', () => {
        const date = new Date(2026, 0, 15); // Thursday
        const result = formatDate(date, { format: 'long' });
        expect(result).toContain('Thursday');
        expect(result).toContain('January');
        expect(result).toContain('15');
        expect(result).toContain('2026');
      });
    });

    // Requirement 1.2: Relative format
    describe('relative format', () => {
      it('should show "today" for current date', () => {
        const today = new Date();
        const result = formatDate(today, { format: 'relative' });
        expect(result).toBe('today');
      });

      it('should show "tomorrow" for next day', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const result = formatDate(tomorrow, { format: 'relative' });
        expect(result).toBe('tomorrow');
      });

      it('should show "yesterday" for previous day', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = formatDate(yesterday, { format: 'relative' });
        expect(result).toBe('yesterday');
      });

      it('should show "in X days" for future dates within 7 days', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3);
        const result = formatDate(futureDate, { format: 'relative' });
        expect(result).toBe('in 3 days');
      });

      it('should show "X days ago" for past dates within 7 days', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        const result = formatDate(pastDate, { format: 'relative' });
        expect(result).toBe('3 days ago');
      });

      it('should fall back to short format for dates beyond 7 days', () => {
        const farFuture = new Date(2026, 5, 15); // June 15, 2026
        const result = formatDate(farFuture, { format: 'relative' });
        expect(result).toBe('Jun 15, 2026');
      });
    });

    // Accept various input types
    describe('input types', () => {
      it('should accept Date object', () => {
        const date = new Date(2026, 0, 15);
        expect(formatDate(date)).toBe('Jan 15, 2026');
      });

      it('should accept ISO string', () => {
        const result = formatDate('2026-01-15T00:00:00.000Z', { format: 'short' });
        expect(result).toContain('Jan');
        expect(result).toContain('2026');
      });

      it('should accept timestamp number', () => {
        const timestamp = new Date(2026, 0, 15).getTime();
        expect(formatDate(timestamp)).toBe('Jan 15, 2026');
      });
    });
  });

  describe('getDaysDifference', () => {
    it('should return null for null input', () => {
      expect(getDaysDifference(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getDaysDifference(undefined)).toBeNull();
    });

    it('should return 0 for today', () => {
      const today = new Date();
      expect(getDaysDifference(today)).toBe(0);
    });
  });

  describe('isWithinDays', () => {
    it('should return false for null input', () => {
      expect(isWithinDays(null, 7)).toBe(false);
    });

    it('should return true for today within 7 days', () => {
      const today = new Date();
      expect(isWithinDays(today, 7)).toBe(true);
    });

    it('should return true for date within range', () => {
      const nearFuture = new Date();
      nearFuture.setDate(nearFuture.getDate() + 3);
      expect(isWithinDays(nearFuture, 7)).toBe(true);
    });

    it('should return false for date outside range', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      expect(isWithinDays(farFuture, 7)).toBe(false);
    });
  });
});
