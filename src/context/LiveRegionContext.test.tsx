import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
