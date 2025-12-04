import type { StatusProps } from '../types.js';
import { LiveRegion } from './LiveRegion.js';

export function Status({ children, className }: StatusProps) {
  return (
    <LiveRegion priority="polite" role="status" className={className}>
      {children}
    </LiveRegion>
  );
}
