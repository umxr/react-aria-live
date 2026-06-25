import { useEffect, useRef, useId } from 'react';
import type { RefObject } from 'react';
import type { Announcement } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';
import { VISUALLY_HIDDEN_STYLES } from '../utils/constants.js';

export interface AnnouncerProps {
  /**
   * Optional ID prefix for the announcer elements.
   * Useful when you have multiple Announcers and need unique IDs.
   */
  id?: string;
}

/**
 * Renders visually hidden live region elements that announce messages.
 *
 * Use this component inside modals or other focus-trapped containers
 * where the default body-level announcer may not be heard by screen readers.
 *
 * @example
 * ```tsx
 * <Modal>
 *   <Announcer />
 *   <ModalContent />
 * </Modal>
 * ```
 */
export function Announcer({ id }: AnnouncerProps) {
  const { queue } = useLiveRegionContext();
  const reactId = useId();
  const announcerId = id || `announcer-${reactId}`;

  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedRef = useRef<{ polite: string; assertive: string }>({
    polite: '',
    assertive: '',
  });
  const clearTimeoutsRef = useRef<{
    polite: ReturnType<typeof setTimeout> | null;
    assertive: ReturnType<typeof setTimeout> | null;
  }>({ polite: null, assertive: null });

  useEffect(() => {
    const announceTo = (
      ref: RefObject<HTMLDivElement | null>,
      latest: Announcement | undefined,
      priority: 'polite' | 'assertive',
    ) => {
      if (
        !latest ||
        !ref.current ||
        lastAnnouncedRef.current[priority] === latest.id
      ) {
        return;
      }

      lastAnnouncedRef.current[priority] = latest.id;
      const el = ref.current;

      // A new message now occupies this region; cancel any pending clear.
      const pending = clearTimeoutsRef.current[priority];
      if (pending) {
        clearTimeout(pending);
        clearTimeoutsRef.current[priority] = null;
      }

      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = latest.message;
      });

      if (latest.clearAfter && latest.clearAfter > 0) {
        clearTimeoutsRef.current[priority] = setTimeout(() => {
          el.textContent = '';
          clearTimeoutsRef.current[priority] = null;
        }, latest.clearAfter);
      }
    };

    const latestPolite = [...queue]
      .reverse()
      .find((a) => a.priority === 'polite');
    const latestAssertive = [...queue]
      .reverse()
      .find((a) => a.priority === 'assertive');

    announceTo(politeRef, latestPolite, 'polite');
    announceTo(assertiveRef, latestAssertive, 'assertive');
  }, [queue]);

  useEffect(() => {
    const timeouts = clearTimeoutsRef.current;
    return () => {
      if (timeouts.polite) {
        clearTimeout(timeouts.polite);
      }
      if (timeouts.assertive) {
        clearTimeout(timeouts.assertive);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={politeRef}
        id={`${announcerId}-polite`}
        aria-live="polite"
        aria-atomic="true"
        role="status"
        style={VISUALLY_HIDDEN_STYLES}
      />
      <div
        ref={assertiveRef}
        id={`${announcerId}-assertive`}
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        style={VISUALLY_HIDDEN_STYLES}
      />
    </>
  );
}
