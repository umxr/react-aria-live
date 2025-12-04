import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupAnnouncer,
  teardownAnnouncer,
  announceMessage,
  clearAnnouncer,
} from './announcer.js';

describe('announcer', () => {
  beforeEach(() => {
    setupAnnouncer();
  });

  afterEach(() => {
    teardownAnnouncer();
  });

  it('creates polite and assertive live region elements', () => {
    const politeEl = document.getElementById('react-aria-live-polite');
    const assertiveEl = document.getElementById('react-aria-live-assertive');

    expect(politeEl).toBeDefined();
    expect(assertiveEl).toBeDefined();
    expect(politeEl?.getAttribute('aria-live')).toBe('polite');
    expect(assertiveEl?.getAttribute('aria-live')).toBe('assertive');
  });

  it('sets aria-atomic on live regions', () => {
    const politeEl = document.getElementById('react-aria-live-polite');
    expect(politeEl?.getAttribute('aria-atomic')).toBe('true');
  });

  it('sets appropriate roles', () => {
    const politeEl = document.getElementById('react-aria-live-polite');
    const assertiveEl = document.getElementById('react-aria-live-assertive');

    expect(politeEl?.getAttribute('role')).toBe('status');
    expect(assertiveEl?.getAttribute('role')).toBe('alert');
  });

  it('removes elements on teardown', () => {
    teardownAnnouncer();
    expect(document.getElementById('react-aria-live-polite')).toBeNull();
    expect(document.getElementById('react-aria-live-assertive')).toBeNull();
  });

  it('announces polite messages', async () => {
    vi.useFakeTimers();
    announceMessage('Hello world', 'polite');

    // requestAnimationFrame is used
    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('react-aria-live-polite');
    expect(politeEl?.textContent).toBe('Hello world');
    vi.useRealTimers();
  });

  it('announces assertive messages', async () => {
    vi.useFakeTimers();
    announceMessage('Alert!', 'assertive');

    vi.advanceTimersToNextFrame();

    const assertiveEl = document.getElementById('react-aria-live-assertive');
    expect(assertiveEl?.textContent).toBe('Alert!');
    vi.useRealTimers();
  });

  it('clears announcer content', async () => {
    vi.useFakeTimers();
    announceMessage('Test', 'polite');
    vi.advanceTimersToNextFrame();

    clearAnnouncer();

    const politeEl = document.getElementById('react-aria-live-polite');
    expect(politeEl?.textContent).toBe('');
    vi.useRealTimers();
  });

  it('clears specific priority', async () => {
    vi.useFakeTimers();
    announceMessage('Polite message', 'polite');
    announceMessage('Assertive message', 'assertive');
    vi.advanceTimersToNextFrame();

    clearAnnouncer('polite');

    const politeEl = document.getElementById('react-aria-live-polite');
    const assertiveEl = document.getElementById('react-aria-live-assertive');

    expect(politeEl?.textContent).toBe('');
    expect(assertiveEl?.textContent).toBe('Assertive message');
    vi.useRealTimers();
  });

  it('handles multiple setup/teardown cycles', () => {
    // First cycle already set up in beforeEach
    teardownAnnouncer();

    // Second cycle
    setupAnnouncer();
    expect(document.getElementById('react-aria-live-polite')).toBeDefined();
    teardownAnnouncer();
    expect(document.getElementById('react-aria-live-polite')).toBeNull();
  });
});
