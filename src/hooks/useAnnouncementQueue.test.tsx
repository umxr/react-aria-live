import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LiveRegionProvider } from '../context/LiveRegionContext.js';
import { useAnnounce } from './useAnnounce.js';
import { useAnnouncementQueue } from './useAnnouncementQueue.js';

function TestComponent() {
  const announce = useAnnounce();
  const { queue, clear, isPending } = useAnnouncementQueue();

  return (
    <div>
      <button onClick={() => announce('Message 1')}>Announce 1</button>
      <button onClick={() => announce('Message 2')}>Announce 2</button>
      <button onClick={clear}>Clear</button>
      <span data-testid="queue-length">{queue.length}</span>
      <span data-testid="is-pending">{isPending.toString()}</span>
    </div>
  );
}

describe('useAnnouncementQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns queue state', () => {
    render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    expect(screen.getByTestId('queue-length').textContent).toBe('0');
    expect(screen.getByTestId('is-pending').textContent).toBe('false');
  });

  it('tracks announcements in queue', () => {
    render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce 1').click();
    });

    expect(screen.getByTestId('queue-length').textContent).toBe('1');
    expect(screen.getByTestId('is-pending').textContent).toBe('true');
  });

  it('clears queue', () => {
    render(
      <LiveRegionProvider>
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce 1').click();
    });

    act(() => {
      screen.getByText('Clear').click();
    });

    expect(screen.getByTestId('queue-length').textContent).toBe('0');
    expect(screen.getByTestId('is-pending').textContent).toBe('false');
  });
});
