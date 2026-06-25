import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Announcement,
  AnnounceOptions,
  LiveRegionContextValue,
  LiveRegionProviderProps,
} from '../types.js';
import {
  announceMessage,
  clearAnnouncer,
  setupAnnouncer,
  teardownAnnouncer,
} from '../utils/announcer.js';
import { DEFAULT_DEBOUNCE_MS } from '../utils/constants.js';
import { createAnnouncement, isDuplicate } from '../utils/queue.js';

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({
  children,
  clearOnUnmount = true,
}: LiveRegionProviderProps) {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutsRef = useRef<{
    polite: ReturnType<typeof setTimeout> | null;
    assertive: ReturnType<typeof setTimeout> | null;
  }>({ polite: null, assertive: null });

  const cancelClearTimeout = useCallback((priority: 'polite' | 'assertive') => {
    const existing = clearTimeoutsRef.current[priority];
    if (existing) {
      clearTimeout(existing);
      clearTimeoutsRef.current[priority] = null;
    }
  }, []);

  const cancelAllClearTimeouts = useCallback(() => {
    cancelClearTimeout('polite');
    cancelClearTimeout('assertive');
  }, [cancelClearTimeout]);

  useEffect(() => {
    setupAnnouncer();
    return () => {
      if (clearOnUnmount) {
        clearAnnouncer();
      }
      teardownAnnouncer();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelAllClearTimeouts();
    };
  }, [clearOnUnmount, cancelAllClearTimeouts]);

  const clearQueue = useCallback(() => {
    cancelAllClearTimeouts();
    setQueue([]);
    clearAnnouncer();
  }, [cancelAllClearTimeouts]);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const {
        priority = 'polite',
        clearQueue: shouldClear,
        delay = 0,
        clearAfter = 0,
      } = options;

      if (!message.trim()) {
        return;
      }

      const doAnnounce = () => {
        setQueue((currentQueue) => {
          if (isDuplicate(currentQueue, message, DEFAULT_DEBOUNCE_MS)) {
            return currentQueue;
          }

          if (shouldClear) {
            cancelAllClearTimeouts();
            clearAnnouncer();
          }

          const announcement = createAnnouncement(
            message,
            priority,
            clearAfter,
          );
          announceMessage(message, priority);

          // A new message now occupies this region. Cancel any pending clear
          // for this priority so a stale timer can't wipe it, then schedule a
          // fresh clear if requested.
          cancelClearTimeout(priority);
          if (clearAfter > 0) {
            clearTimeoutsRef.current[priority] = setTimeout(() => {
              clearAnnouncer(priority);
              clearTimeoutsRef.current[priority] = null;
            }, clearAfter);
          }

          const newQueue = shouldClear
            ? [announcement]
            : [...currentQueue, announcement];

          // Clean up old announcements (older than 5 seconds)
          const now = Date.now();
          return newQueue.filter((a) => now - a.timestamp < 5000);
        });
      };

      if (delay > 0) {
        timeoutRef.current = setTimeout(doAnnounce, delay);
      } else {
        doAnnounce();
      }
    },
    [cancelAllClearTimeouts, cancelClearTimeout],
  );

  const value = useMemo<LiveRegionContextValue>(
    () => ({
      announce,
      queue,
      clearQueue,
    }),
    [announce, queue, clearQueue],
  );

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
    </LiveRegionContext.Provider>
  );
}

export function useLiveRegionContext(): LiveRegionContextValue {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error(
      'useLiveRegionContext must be used within a LiveRegionProvider',
    );
  }
  return context;
}

export { LiveRegionContext };
