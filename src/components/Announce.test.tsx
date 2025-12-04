import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LiveRegionProvider } from '../context/LiveRegionContext.js';
import { Announce } from './Announce.js';

// Mock the context to test Announce component behavior
const mockAnnounce = vi.fn();
vi.mock('../context/LiveRegionContext.js', async () => {
  const actual = await vi.importActual('../context/LiveRegionContext.js');
  return {
    ...actual,
    useLiveRegionContext: () => ({
      announce: mockAnnounce,
      queue: [],
      clearQueue: vi.fn(),
    }),
  };
});

describe('Announce', () => {
  beforeEach(() => {
    mockAnnounce.mockClear();
  });

  it('renders nothing visible', () => {
    const { container } = render(
      <LiveRegionProvider>
        <Announce message="Test" />
      </LiveRegionProvider>,
    );
    // Announce should render nothing visible
    expect(container.textContent).toBe('');
  });

  it('calls announce with message on mount', () => {
    render(
      <LiveRegionProvider>
        <Announce message="Hello world" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).toHaveBeenCalledWith('Hello world', {
      priority: 'polite',
    });
  });

  it('calls announce with assertive priority', () => {
    render(
      <LiveRegionProvider>
        <Announce message="Alert!" priority="assertive" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).toHaveBeenCalledWith('Alert!', {
      priority: 'assertive',
    });
  });

  it('calls announce when message changes', () => {
    const { rerender } = render(
      <LiveRegionProvider>
        <Announce message="First" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).toHaveBeenCalledWith('First', { priority: 'polite' });
    mockAnnounce.mockClear();

    rerender(
      <LiveRegionProvider>
        <Announce message="Second" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).toHaveBeenCalledWith('Second', { priority: 'polite' });
  });

  it('does not re-announce same message', () => {
    const { rerender } = render(
      <LiveRegionProvider>
        <Announce message="Same" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).toHaveBeenCalledTimes(1);
    mockAnnounce.mockClear();

    rerender(
      <LiveRegionProvider>
        <Announce message="Same" />
      </LiveRegionProvider>,
    );

    expect(mockAnnounce).not.toHaveBeenCalled();
  });
});
