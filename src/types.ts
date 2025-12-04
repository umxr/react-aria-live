import type { ElementType, ReactNode } from 'react';

export type AriaPoliteness = 'polite' | 'assertive' | 'off';

export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all';

export type LiveRegionRole = 'alert' | 'status' | 'log' | 'marquee' | 'timer';

export interface AnnounceOptions {
  priority?: 'polite' | 'assertive';
  clearQueue?: boolean;
  delay?: number;
}

export interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

export interface AnnouncementQueue {
  queue: Announcement[];
  clear: () => void;
  isPending: boolean;
}

export interface LiveRegionContextValue {
  announce: (message: string, options?: AnnounceOptions) => void;
  queue: Announcement[];
  clearQueue: () => void;
}

export interface LiveRegionProviderProps {
  children: ReactNode;
  clearOnUnmount?: boolean;
}

export interface LiveRegionProps {
  children: ReactNode;
  priority?: AriaPoliteness;
  atomic?: boolean;
  relevant?: AriaRelevant;
  role?: LiveRegionRole;
  visible?: boolean;
  as?: ElementType;
  className?: string;
}

export interface AnnounceProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export interface AlertProps {
  children: ReactNode;
  className?: string;
}

export interface StatusProps {
  children: ReactNode;
  className?: string;
}

export interface LogProps {
  children: ReactNode;
  className?: string;
}
