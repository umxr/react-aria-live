import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Log } from './Log.js';

describe('Log', () => {
  it('renders children', () => {
    render(<Log>Log entry</Log>);
    expect(screen.getByText('Log entry')).toBeDefined();
  });

  it('sets aria-live to polite', () => {
    render(<Log>Entry</Log>);
    const element = screen.getByRole('log');
    expect(element.getAttribute('aria-live')).toBe('polite');
  });

  it('sets role to log', () => {
    render(<Log>Entry</Log>);
    expect(screen.getByRole('log')).toBeDefined();
  });

  it('sets aria-relevant to additions', () => {
    render(<Log>Entry</Log>);
    const element = screen.getByRole('log');
    expect(element.getAttribute('aria-relevant')).toBe('additions');
  });

  it('applies className', () => {
    render(<Log className="chat-log">Entry</Log>);
    const element = screen.getByRole('log');
    expect(element.classList.contains('chat-log')).toBe(true);
  });
});
