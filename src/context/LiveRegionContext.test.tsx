import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { StrictMode } from 'react';
import {
  LiveRegionProvider,
  useLiveRegionContext,
} from './LiveRegionContext.js';

function TestConsumer() {
  const { announce, queue, clearQueue } = useLiveRegionContext();
  return (
    <div>
      <button onClick={() => announce('Test message')}>Announce</button>
      <button onClick={() => announce('Urgent!', { priority: 'assertive' })}>
        Announce Assertive
      </button>
      <button onClick={clearQueue}>Clear</button>
      <span data-testid="queue-length">{queue.length}</span>
    </div>
  );
}

function ClearAfterConsumer() {
  const { announce } = useLiveRegionContext();
  return (
    <div>
      <button onClick={() => announce('Saved', { clearAfter: 500 })}>
        Save
      </button>
      <button onClick={() => announce('Saved')}>Save No Clear</button>
      <button onClick={() => announce('First', { clearAfter: 500 })}>
        First
      </button>
      <button onClick={() => announce('Second', { clearAfter: 5000 })}>
        Second
      </button>
      <button
        onClick={() => announce('Delayed', { delay: 1000, clearAfter: 500 })}
      >
        Delayed
      </button>
    </div>
  );
}

describe('LiveRegionProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <LiveRegionProvider>
        <div>Child content</div>
      </LiveRegionProvider>,
    );
    expect(screen.getByText('Child content')).toBeDefined();
  });

  it('creates announcer elements on mount', () => {
    render(
      <LiveRegionProvider>
        <div>Content</div>
      </LiveRegionProvider>,
    );
    expect(document.getElementById('react-aria-live-polite')).toBeDefined();
    expect(document.getElementById('react-aria-live-assertive')).toBeDefined();
  });

  it('provides announce function', async () => {
    render(
      <LiveRegionProvider>
        <TestConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('react-aria-live-polite');
    expect(politeEl?.textContent).toBe('Test message');
  });

  it('provides assertive announce function', async () => {
    render(
      <LiveRegionProvider>
        <TestConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce Assertive').click();
    });

    vi.advanceTimersToNextFrame();

    const assertiveEl = document.getElementById('react-aria-live-assertive');
    expect(assertiveEl?.textContent).toBe('Urgent!');
  });

  it('tracks queue', async () => {
    render(
      <LiveRegionProvider>
        <TestConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByTestId('queue-length').textContent).toBe('1');
  });

  it('clears queue', async () => {
    render(
      <LiveRegionProvider>
        <TestConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    act(() => {
      screen.getByText('Clear').click();
    });

    expect(screen.getByTestId('queue-length').textContent).toBe('0');
  });

  it('throws error when used outside provider', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useLiveRegionContext must be used within a LiveRegionProvider',
    );

    consoleError.mockRestore();
  });
});

describe('clearAfter option', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the live region after clearAfter ms', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();

    const el = document.getElementById('react-aria-live-polite');
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');
  });

  it('does not clear the live region without clearAfter', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Save No Clear').click();
    });
    vi.advanceTimersToNextFrame();

    const el = document.getElementById('react-aria-live-polite');
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(5000);
    expect(el?.textContent).toBe('Saved');
  });

  it('re-announces the same message after a clear', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Saved');
  });

  it('cancels a pending clear when a newer message replaces it', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('First').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('First');

    vi.advanceTimersByTime(300);

    act(() => {
      screen.getByText('Second').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Second');

    // Pass First's original 500ms deadline; Second must NOT be wiped.
    vi.advanceTimersByTime(300);
    expect(el?.textContent).toBe('Second');
  });

  it('measures clearAfter from announce time when combined with delay', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('Delayed').click();
    });

    // Delay fires -> message announced (setQueue runs, so wrap in act).
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Delayed');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');
  });

  it('keeps a newer message under StrictMode (no leaked clear timer)', () => {
    render(
      <StrictMode>
        <LiveRegionProvider>
          <ClearAfterConsumer />
        </LiveRegionProvider>
      </StrictMode>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('First').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('First');

    vi.advanceTimersByTime(300);

    act(() => {
      screen.getByText('Second').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Second');

    // StrictMode double-invokes the announce updater; verify no stale/leaked
    // timer from 'First' wipes 'Second' at First's original 500ms deadline.
    vi.advanceTimersByTime(300);
    expect(el?.textContent).toBe('Second');
  });
});
