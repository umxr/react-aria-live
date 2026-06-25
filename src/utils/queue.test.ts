import { describe, it, expect } from 'vitest';
import { createAnnouncement, isDuplicate, generateId } from './queue.js';

describe('queue utilities', () => {
  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with announcement prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^announcement-/);
    });
  });

  describe('createAnnouncement', () => {
    it('creates announcement with message and priority', () => {
      const announcement = createAnnouncement('Test message', 'polite');
      expect(announcement.message).toBe('Test message');
      expect(announcement.priority).toBe('polite');
      expect(announcement.id).toBeDefined();
      expect(announcement.timestamp).toBeDefined();
    });

    it('creates assertive announcements', () => {
      const announcement = createAnnouncement('Urgent!', 'assertive');
      expect(announcement.priority).toBe('assertive');
    });

    it('stores clearAfter when provided', () => {
      const announcement = createAnnouncement('Saved', 'polite', 500);
      expect(announcement.clearAfter).toBe(500);
    });

    it('leaves clearAfter undefined when not provided', () => {
      const announcement = createAnnouncement('Saved', 'polite');
      expect(announcement.clearAfter).toBeUndefined();
    });
  });

  describe('isDuplicate', () => {
    it('returns false for empty queue', () => {
      expect(isDuplicate([], 'test', 100)).toBe(false);
    });

    it('returns true for duplicate message within threshold', () => {
      const now = Date.now();
      const queue = [
        {
          id: '1',
          message: 'test',
          priority: 'polite' as const,
          timestamp: now,
        },
      ];
      expect(isDuplicate(queue, 'test', 100)).toBe(true);
    });

    it('returns false for duplicate message outside threshold', () => {
      const queue = [
        {
          id: '1',
          message: 'test',
          priority: 'polite' as const,
          timestamp: Date.now() - 200,
        },
      ];
      expect(isDuplicate(queue, 'test', 100)).toBe(false);
    });

    it('returns false for different message', () => {
      const queue = [
        {
          id: '1',
          message: 'other',
          priority: 'polite' as const,
          timestamp: Date.now(),
        },
      ];
      expect(isDuplicate(queue, 'test', 100)).toBe(false);
    });
  });
});
