import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert.js';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Error message</Alert>);
    expect(screen.getByText('Error message')).toBeDefined();
  });

  it('sets aria-live to assertive', () => {
    render(<Alert>Error</Alert>);
    const element = screen.getByRole('alert');
    expect(element.getAttribute('aria-live')).toBe('assertive');
  });

  it('sets role to alert', () => {
    render(<Alert>Error</Alert>);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('sets aria-atomic to true', () => {
    render(<Alert>Error</Alert>);
    const element = screen.getByRole('alert');
    expect(element.getAttribute('aria-atomic')).toBe('true');
  });

  it('applies className', () => {
    render(<Alert className="error-alert">Error</Alert>);
    const element = screen.getByRole('alert');
    expect(element.classList.contains('error-alert')).toBe(true);
  });
});
