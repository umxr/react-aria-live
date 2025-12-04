import { createElement } from 'react';
import type { LiveRegionProps } from '../types.js';
import { VISUALLY_HIDDEN_STYLES } from '../utils/constants.js';

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = false,
  relevant,
  role,
  visible = true,
  as: Component = 'div',
  className,
}: LiveRegionProps) {
  const ariaProps: Record<string, string | boolean> = {
    'aria-live': priority,
    'aria-atomic': atomic,
  };

  if (relevant) {
    ariaProps['aria-relevant'] = relevant;
  }

  if (role) {
    ariaProps.role = role;
  }

  const style = visible ? undefined : VISUALLY_HIDDEN_STYLES;

  return createElement(
    Component,
    {
      ...ariaProps,
      style,
      className,
    },
    children,
  );
}
