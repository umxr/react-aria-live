import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion.js';

describe('LiveRegion', () => {
  it('renders children', () => {
    render(<LiveRegion>Hello world</LiveRegion>);
    expect(screen.getByText('Hello world')).toBeDefined();
  });

  it('sets aria-live to polite by default', () => {
    render(<LiveRegion>Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.getAttribute('aria-live')).toBe('polite');
  });

  it('sets aria-live to assertive', () => {
    render(<LiveRegion priority="assertive">Urgent</LiveRegion>);
    const element = screen.getByText('Urgent');
    expect(element.getAttribute('aria-live')).toBe('assertive');
  });

  it('sets aria-atomic when specified', () => {
    render(<LiveRegion atomic>Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.getAttribute('aria-atomic')).toBe('true');
  });

  it('sets aria-relevant when specified', () => {
    render(<LiveRegion relevant="additions">Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.getAttribute('aria-relevant')).toBe('additions');
  });

  it('sets role when specified', () => {
    render(<LiveRegion role="status">Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.getAttribute('role')).toBe('status');
  });

  it('renders as custom element', () => {
    render(<LiveRegion as="span">Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.tagName.toLowerCase()).toBe('span');
  });

  it('applies className', () => {
    render(<LiveRegion className="custom-class">Content</LiveRegion>);
    const element = screen.getByText('Content');
    expect(element.classList.contains('custom-class')).toBe(true);
  });

  it('hides content visually when visible is false', () => {
    render(<LiveRegion visible={false}>Hidden</LiveRegion>);
    const element = screen.getByText('Hidden');
    expect(element.style.position).toBe('absolute');
    expect(element.style.width).toBe('1px');
    expect(element.style.height).toBe('1px');
  });
});
