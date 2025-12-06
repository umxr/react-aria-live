import { useEffect, useRef, useId } from 'react';
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

  useEffect(() => {
    // Find the most recent announcement for each priority
    const latestPolite = [...queue]
      .reverse()
      .find((a) => a.priority === 'polite');
    const latestAssertive = [...queue]
      .reverse()
      .find((a) => a.priority === 'assertive');

    // Announce polite messages
    if (
      latestPolite &&
      politeRef.current &&
      lastAnnouncedRef.current.polite !== latestPolite.id
    ) {
      lastAnnouncedRef.current.polite = latestPolite.id;
      const el = politeRef.current;
      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = latestPolite.message;
      });
    }

    // Announce assertive messages
    if (
      latestAssertive &&
      assertiveRef.current &&
      lastAnnouncedRef.current.assertive !== latestAssertive.id
    ) {
      lastAnnouncedRef.current.assertive = latestAssertive.id;
      const el = assertiveRef.current;
      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = latestAssertive.message;
      });
    }
  }, [queue]);

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
