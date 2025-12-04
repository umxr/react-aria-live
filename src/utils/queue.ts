import type { Announcement } from '../types.js';

let idCounter = 0;

export function generateId(): string {
  return `announcement-${++idCounter}-${Date.now()}`;
}

export function createAnnouncement(
  message: string,
  priority: 'polite' | 'assertive',
): Announcement {
  return {
    id: generateId(),
    message,
    priority,
    timestamp: Date.now(),
  };
}

export function isDuplicate(
  queue: Announcement[],
  message: string,
  thresholdMs: number = 100,
): boolean {
  const now = Date.now();
  return queue.some(
    (item) => item.message === message && now - item.timestamp < thresholdMs,
  );
}
