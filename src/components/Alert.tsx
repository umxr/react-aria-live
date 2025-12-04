import type { AlertProps } from '../types.js';
import { LiveRegion } from './LiveRegion.js';

export function Alert({ children, className }: AlertProps) {
  return (
    <LiveRegion priority="assertive" role="alert" atomic className={className}>
      {children}
    </LiveRegion>
  );
}
