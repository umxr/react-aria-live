import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LiveRegionProvider } from '../context/LiveRegionContext.js';
import { useAnnounce } from './useAnnounce.js';

function TestComponent() {
  const announce = useAnnounce();

  return (
    <div>
      <button onClick={() => announce('Hello')}>Say Hello</button>
      <button onClick={() => announce('Alert!', { priority: 'assertive' })}>
        Alert
      </button>
      <button onClick={() => announce('Clear', { clearQueue: true })}>
        Clear and Announce
      </button>
    </div>
  );
}

describe('useAnnounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces polite messages', () => {
    render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Say Hello').click();
    });

    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('react-aria-live-polite');
    expect(politeEl?.textContent).toBe('Hello');
  });

  it('announces assertive messages', () => {
    render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Alert').click();
    });

    vi.advanceTimersToNextFrame();

    const assertiveEl = document.getElementById('react-aria-live-assertive');
    expect(assertiveEl?.textContent).toBe('Alert!');
  });

  it('returns stable function reference', () => {
    let announceRef1: ReturnType<typeof useAnnounce>;
    let announceRef2: ReturnType<typeof useAnnounce>;

    function Tracker() {
      const announce = useAnnounce();
      if (!announceRef1) {
        announceRef1 = announce;
      } else {
        announceRef2 = announce;
      }
      return <button onClick={() => announce('test')}>Click</button>;
    }

    const { rerender } = render(
      <LiveRegionProvider>
        <Tracker />
      </LiveRegionProvider>,
    );

    rerender(
      <LiveRegionProvider>
        <Tracker />
      </LiveRegionProvider>,
    );

    expect(announceRef1).toBe(announceRef2!);
  });
});
