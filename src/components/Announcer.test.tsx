import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LiveRegionProvider } from '../context/LiveRegionContext.js';
import { Announcer } from './Announcer.js';
import { useAnnounce } from '../hooks/useAnnounce.js';

function TestComponent() {
  const announce = useAnnounce();
  return (
    <div>
      <button onClick={() => announce('Test message')}>Announce</button>
      <button onClick={() => announce('Urgent!', { priority: 'assertive' })}>
        Announce Assertive
      </button>
      <button onClick={() => announce('Auto clear', { clearAfter: 500 })}>
        Announce Clear After
      </button>
    </div>
  );
}

describe('Announcer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders visually hidden live region elements', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
      </LiveRegionProvider>,
    );

    const politeEl = document.getElementById('test-polite');
    const assertiveEl = document.getElementById('test-assertive');

    expect(politeEl).toBeDefined();
    expect(assertiveEl).toBeDefined();
    expect(politeEl?.getAttribute('aria-live')).toBe('polite');
    expect(assertiveEl?.getAttribute('aria-live')).toBe('assertive');
  });

  it('sets correct ARIA attributes', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
      </LiveRegionProvider>,
    );

    const politeEl = document.getElementById('test-polite');
    const assertiveEl = document.getElementById('test-assertive');

    expect(politeEl?.getAttribute('aria-atomic')).toBe('true');
    expect(politeEl?.getAttribute('role')).toBe('status');
    expect(assertiveEl?.getAttribute('aria-atomic')).toBe('true');
    expect(assertiveEl?.getAttribute('role')).toBe('alert');
  });

  it('applies visually hidden styles', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
      </LiveRegionProvider>,
    );

    const politeEl = document.getElementById('test-polite');
    expect(politeEl?.style.position).toBe('absolute');
    expect(politeEl?.style.width).toBe('1px');
    expect(politeEl?.style.height).toBe('1px');
  });

  it('announces polite messages', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('test-polite');
    expect(politeEl?.textContent).toBe('Test message');
  });

  it('announces assertive messages', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce Assertive').click();
    });

    vi.advanceTimersToNextFrame();

    const assertiveEl = document.getElementById('test-assertive');
    expect(assertiveEl?.textContent).toBe('Urgent!');
  });

  it('works alongside the default body-level announcer', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="modal" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    vi.advanceTimersToNextFrame();

    // Both announcers should have the message
    const bodyAnnouncer = document.getElementById('react-aria-live-polite');
    const modalAnnouncer = document.getElementById('modal-polite');

    expect(bodyAnnouncer?.textContent).toBe('Test message');
    expect(modalAnnouncer?.textContent).toBe('Test message');
  });

  it('supports multiple Announcer instances', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="modal1" />
        <Announcer id="modal2" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce').click();
    });

    vi.advanceTimersToNextFrame();

    const modal1 = document.getElementById('modal1-polite');
    const modal2 = document.getElementById('modal2-polite');

    expect(modal1?.textContent).toBe('Test message');
    expect(modal2?.textContent).toBe('Test message');
  });

  it('generates unique IDs when no id prop is provided', () => {
    const { container } = render(
      <LiveRegionProvider>
        <Announcer />
        <Announcer />
      </LiveRegionProvider>,
    );

    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    // Should have 2 from the Announcer components (body-level is outside container)
    expect(liveRegions.length).toBe(2);

    // IDs should be different
    const ids = Array.from(liveRegions).map((el) => el.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('clears its region after clearAfter ms', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce Clear After').click();
    });
    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('test-polite');
    expect(politeEl?.textContent).toBe('Auto clear');

    vi.advanceTimersByTime(500);
    expect(politeEl?.textContent).toBe('');
  });
});
