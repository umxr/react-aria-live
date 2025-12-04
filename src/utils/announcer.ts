import { VISUALLY_HIDDEN_STYLES } from './constants.js';

interface AnnouncerElements {
  polite: HTMLDivElement | null;
  assertive: HTMLDivElement | null;
}

let elements: AnnouncerElements = {
  polite: null,
  assertive: null,
};

let refCount = 0;

function createAnnouncerElement(
  priority: 'polite' | 'assertive',
): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  Object.assign(el.style, VISUALLY_HIDDEN_STYLES);
  el.id = `react-aria-live-${priority}`;
  return el;
}

export function setupAnnouncer(): void {
  refCount++;

  if (refCount > 1) {
    return;
  }

  if (typeof document === 'undefined') {
    return;
  }

  elements.polite = createAnnouncerElement('polite');
  elements.assertive = createAnnouncerElement('assertive');

  document.body.appendChild(elements.polite);
  document.body.appendChild(elements.assertive);
}

export function teardownAnnouncer(): void {
  refCount--;

  if (refCount > 0) {
    return;
  }

  if (elements.polite?.parentNode) {
    elements.polite.parentNode.removeChild(elements.polite);
  }
  if (elements.assertive?.parentNode) {
    elements.assertive.parentNode.removeChild(elements.assertive);
  }

  elements = { polite: null, assertive: null };
}

export function announceMessage(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
): void {
  const el = elements[priority];

  if (!el) {
    return;
  }

  // Clear the element first, then set content in next frame
  // This ensures screen readers detect the change
  el.textContent = '';

  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

export function clearAnnouncer(priority?: 'polite' | 'assertive'): void {
  if (priority) {
    const el = elements[priority];
    if (el) {
      el.textContent = '';
    }
  } else {
    if (elements.polite) elements.polite.textContent = '';
    if (elements.assertive) elements.assertive.textContent = '';
  }
}
