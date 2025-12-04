import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Status } from './Status.js';

describe('Status', () => {
  it('renders children', () => {
    render(<Status>3 items in cart</Status>);
    expect(screen.getByText('3 items in cart')).toBeDefined();
  });

  it('sets aria-live to polite', () => {
    render(<Status>Status message</Status>);
    const element = screen.getByRole('status');
    expect(element.getAttribute('aria-live')).toBe('polite');
  });

  it('sets role to status', () => {
    render(<Status>Status message</Status>);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('applies className', () => {
    render(<Status className="status-bar">Status</Status>);
    const element = screen.getByRole('status');
    expect(element.classList.contains('status-bar')).toBe(true);
  });
});
