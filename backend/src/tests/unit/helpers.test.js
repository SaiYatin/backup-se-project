/**
 * Unit tests for Helper Functions
 * Tests utility and helper functions used across the application
 */

const helpers = require('../../src/utils/helpers');
const logger = require('../../src/utils/logger');

// Mock logger to avoid actual logging during tests
jest.mock('../../src/utils/logger');

describe('Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(helpers.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(helpers.formatCurrency(100)).toBe('$100.00');
      expect(helpers.formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle zero and negative numbers', () => {
      expect(helpers.formatCurrency(0)).toBe('$0.00');
      expect(helpers.formatCurrency(-100)).toBe('-$100.00');
    });

    it('should handle large numbers', () => {
      expect(helpers.formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(helpers.formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle edge cases', () => {
      expect(helpers.formatCurrency(null)).toBe('$0.00');
      expect(helpers.formatCurrency(undefined)).toBe('$0.00');
      expect(helpers.formatCurrency(NaN)).toBe('$0.00');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress percentage correctly', () => {
      expect(helpers.calculateProgress(500, 1000)).toBe(50);
      expect(helpers.calculateProgress(750, 1000)).toBe(75);
      expect(helpers.calculateProgress(1000, 1000)).toBe(100);
      expect(helpers.calculateProgress(1200, 1000)).toBe(120);
    });

    it('should handle zero target', () => {
      expect(helpers.calculateProgress(100, 0)).toBe(0);
    });

    it('should handle zero current amount', () => {
      expect(helpers.calculateProgress(0, 1000)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(helpers.calculateProgress(-100, 1000)).toBe(0);
      expect(helpers.calculateProgress(100, -1000)).toBe(0);
    });

    it('should round to specified decimal places', () => {
      expect(helpers.calculateProgress(333, 1000, 2)).toBe(33.3);
      expect(helpers.calculateProgress(333, 1000, 0)).toBe(33);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(helpers.validateEmail('test@example.com')).toBe(true);
      expect(helpers.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(helpers.validateEmail('firstname+lastname@example.org')).toBe(true);
      expect(helpers.validateEmail('email@123.123.123.123')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(helpers.validateEmail('invalid-email')).toBe(false);
      expect(helpers.validateEmail('@example.com')).toBe(false);
      expect(helpers.validateEmail('test@')).toBe(false);
      expect(helpers.validateEmail('test..email@example.com')).toBe(false);
      expect(helpers.validateEmail('')).toBe(false);
      expect(helpers.validateEmail(null)).toBe(false);
      expect(helpers.validateEmail(undefined)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(helpers.sanitizeInput('<script>alert("xss")</script>')).toBe('');
      expect(helpers.sanitizeInput('<p>Hello World</p>')).toBe('Hello World');
      expect(helpers.sanitizeInput('Text with <b>bold</b> formatting')).toBe('Text with bold formatting');
    });

    it('should handle special characters', () => {
      expect(helpers.sanitizeInput('Text & symbols < > "')).toBe('Text &amp; symbols &lt; &gt; &quot;');
    });

    it('should preserve normal text', () => {
      expect(helpers.sanitizeInput('Normal text without HTML')).toBe('Normal text without HTML');
    });

    it('should handle empty and null inputs', () => {
      expect(helpers.sanitizeInput('')).toBe('');
      expect(helpers.sanitizeInput(null)).toBe('');
      expect(helpers.sanitizeInput(undefined)).toBe('');
    });
  });

  describe('generateReferenceId', () => {
    it('should generate unique reference IDs', () => {
      const id1 = helpers.generateReferenceId();
      const id2 = helpers.generateReferenceId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should include prefix when provided', () => {
      const id = helpers.generateReferenceId('TEST');
      expect(id).toMatch(/^TEST-/);
    });

    it('should generate consistent format', () => {
      const id = helpers.generateReferenceId();
      // Should match pattern like: 1643723400000-ABC123
      expect(id).toMatch(/^\d+-[A-Z0-9]+$/);
    });
  });

  describe('parseAmount', () => {
    it('should parse valid numeric strings', () => {
      expect(helpers.parseAmount('100')).toBe(100);
      expect(helpers.parseAmount('123.45')).toBe(123.45);
      expect(helpers.parseAmount('0.99')).toBe(0.99);
    });

    it('should parse currency formatted strings', () => {
      expect(helpers.parseAmount('$100')).toBe(100);
      expect(helpers.parseAmount('$1,234.56')).toBe(1234.56);
      expect(helpers.parseAmount('USD 500')).toBe(500);
    });

    it('should handle numbers directly', () => {
      expect(helpers.parseAmount(100)).toBe(100);
      expect(helpers.parseAmount(123.45)).toBe(123.45);
    });

    it('should return 0 for invalid inputs', () => {
      expect(helpers.parseAmount('')).toBe(0);
      expect(helpers.parseAmount('invalid')).toBe(0);
      expect(helpers.parseAmount(null)).toBe(0);
      expect(helpers.parseAmount(undefined)).toBe(0);
      expect(helpers.parseAmount(NaN)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(helpers.parseAmount('-100')).toBe(0); // Should not allow negative
      expect(helpers.parseAmount(-100)).toBe(0);
    });
  });

  describe('generateSlug', () => {
    it('should create URL-friendly slugs', () => {
      expect(helpers.generateSlug('Hello World')).toBe('hello-world');
      expect(helpers.generateSlug('Help Build School Library')).toBe('help-build-school-library');
      expect(helpers.generateSlug('Event with Special Characters!')).toBe('event-with-special-characters');
    });

    it('should handle special characters and spaces', () => {
      expect(helpers.generateSlug('Test @ Event #1')).toBe('test-event-1');
      expect(helpers.generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
      expect(helpers.generateSlug('UPPERCASE text')).toBe('uppercase-text');
    });

    it('should handle empty and edge cases', () => {
      expect(helpers.generateSlug('')).toBe('');
      expect(helpers.generateSlug('   ')).toBe('');
      expect(helpers.generateSlug('123')).toBe('123');
    });

    it('should handle unicode characters', () => {
      expect(helpers.generateSlug('Café & Restaurant')).toBe('cafe-restaurant');
      expect(helpers.generateSlug('François\'s Event')).toBe('francois-s-event');
    });
  });

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(helpers.isValidDate(new Date())).toBe(true);
      expect(helpers.isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(helpers.isValidDate('2024-01-15')).toBe(true);
      expect(helpers.isValidDate('01/15/2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(helpers.isValidDate('invalid-date')).toBe(false);
      expect(helpers.isValidDate('')).toBe(false);
      expect(helpers.isValidDate(null)).toBe(false);
      expect(helpers.isValidDate(undefined)).toBe(false);
      expect(helpers.isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(helpers.isValidDate('2024-02-30')).toBe(false); // Invalid February date
      expect(helpers.isValidDate('2024-13-01')).toBe(false); // Invalid month
    });
  });

  describe('formatDateRange', () => {
    it('should format date ranges correctly', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');
      
      const result = helpers.formatDateRange(start, end);
      expect(result).toMatch(/Jan 1, 2024 - Jan 7, 2024/);
    });

    it('should handle same start and end dates', () => {
      const date = new Date('2024-01-15');
      
      const result = helpers.formatDateRange(date, date);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should handle different years', () => {
      const start = new Date('2023-12-25');
      const end = new Date('2024-01-05');
      
      const result = helpers.formatDateRange(start, end);
      expect(result).toMatch(/Dec 25, 2023 - Jan 5, 2024/);
    });
  });

  describe('calculateDaysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-08');
      
      expect(helpers.calculateDaysBetween(date1, date2)).toBe(7);
      expect(helpers.calculateDaysBetween(date2, date1)).toBe(7); // Absolute value
    });

    it('should handle same dates', () => {
      const date = new Date('2024-01-15');
      expect(helpers.calculateDaysBetween(date, date)).toBe(0);
    });

    it('should handle string dates', () => {
      expect(helpers.calculateDaysBetween('2024-01-01', '2024-01-08')).toBe(7);
    });

    it('should handle invalid dates', () => {
      expect(helpers.calculateDaysBetween('invalid', '2024-01-01')).toBe(0);
      expect(helpers.calculateDaysBetween(null, undefined)).toBe(0);
    });
  });

  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(helpers.truncateText(text, 20)).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(helpers.truncateText(text, 20)).toBe('Short text');
    });

    it('should handle custom suffix', () => {
      const text = 'Long text here';
      expect(helpers.truncateText(text, 8, ' [more]')).toBe('Long tex [more]');
    });

    it('should handle edge cases', () => {
      expect(helpers.truncateText('', 10)).toBe('');
      expect(helpers.truncateText(null, 10)).toBe('');
      expect(helpers.truncateText('Text', 0)).toBe('...');
    });
  });

  describe('deepClone', () => {
    it('should create deep copies of objects', () => {
      const original = {
        name: 'Test',
        nested: {
          value: 123,
          array: [1, 2, 3]
        }
      };
      
      const cloned = helpers.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
    });

    it('should handle arrays', () => {
      const original = [1, { test: 'value' }, [2, 3]];
      const cloned = helpers.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should handle primitive values', () => {
      expect(helpers.deepClone('string')).toBe('string');
      expect(helpers.deepClone(123)).toBe(123);
      expect(helpers.deepClone(true)).toBe(true);
      expect(helpers.deepClone(null)).toBe(null);
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first try', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      
      const result = await helpers.retryOperation(successOperation, 3);
      
      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await helpers.retryOperation(operation, 3);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(helpers.retryOperation(operation, 2))
        .rejects.toThrow('Always fails');
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle custom delay', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await helpers.retryOperation(operation, 2, 100);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle functions with invalid inputs gracefully', () => {
      // Test that helper functions don't throw unexpected errors
      expect(() => helpers.formatCurrency('invalid')).not.toThrow();
      expect(() => helpers.calculateProgress('a', 'b')).not.toThrow();
      expect(() => helpers.sanitizeInput(123)).not.toThrow();
      expect(() => helpers.generateSlug(null)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const largeText = 'a'.repeat(10000);
      
      const start = Date.now();
      helpers.sanitizeInput(largeText);
      helpers.truncateText(largeText, 100);
      helpers.generateSlug(largeText);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});