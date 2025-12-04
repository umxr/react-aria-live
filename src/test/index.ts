interface MockAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

let mockAnnouncements: MockAnnouncement[] = [];

export function getAnnouncements(): string[] {
  return mockAnnouncements.map((a) => a.message);
}

export function getAnnouncementsWithPriority(): MockAnnouncement[] {
  return [...mockAnnouncements];
}

export function clearMockAnnouncements(): void {
  mockAnnouncements = [];
}

export function getLastAnnouncement(): string | undefined {
  return mockAnnouncements[mockAnnouncements.length - 1]?.message;
}

export function hasAnnouncement(message: string): boolean {
  return mockAnnouncements.some((a) => a.message === message);
}

export function getAnnouncementsByPriority(
  priority: 'polite' | 'assertive',
): string[] {
  return mockAnnouncements
    .filter((a) => a.priority === priority)
    .map((a) => a.message);
}

// Internal function used by mock announcer
export function _recordAnnouncement(
  message: string,
  priority: 'polite' | 'assertive',
): void {
  mockAnnouncements.push({
    message,
    priority,
    timestamp: Date.now(),
  });
}
