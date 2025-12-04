import type { LogProps } from '../types.js';
import { LiveRegion } from './LiveRegion.js';

export function Log({ children, className }: LogProps) {
  return (
    <LiveRegion
      priority="polite"
      role="log"
      relevant="additions"
      className={className}
    >
      {children}
    </LiveRegion>
  );
}
