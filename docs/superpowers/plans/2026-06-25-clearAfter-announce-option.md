# clearAfter Announce Option Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in `clearAfter` (milliseconds) option to `announce()` that wipes the live region after a delay, so an identical message announced later is re-read by screen readers.

**Architecture:** `clearAfter` is stored on the `Announcement` object so each live-region surface clears its own DOM independently. The body-level region (managed by `LiveRegionContext`) and the modal `<Announcer />` component each keep per-priority clear timers, cancel a pending timer when a newer message takes the region, and clear their timers on unmount. The announcement queue is never mutated by `clearAfter` — it is purely a presentation concern.

**Tech Stack:** React 18/19, TypeScript, Vitest + @testing-library/react (jsdom), changesets.

## Global Constraints

- Package name: `@umxr/react-aria-live`.
- React peer dependency: `^18.0.0 || ^19.0.0` — no APIs outside that range.
- Module system: ESM. Local imports use the `.js` extension (e.g. `from '../types.js'`).
- Formatting: Prettier (single quotes, 2-space indent, semicolons, trailing commas). Run `npm run format` before committing.
- Fully backward compatible: omitting `clearAfter` (or `0`/negative) preserves current behavior.
- Tests use `vi.useFakeTimers()`; advance rAF with `vi.advanceTimersToNextFrame()` and timers with `vi.advanceTimersByTime(ms)`. Wrap any timer advance that triggers a React state update (`setQueue`) in `act(...)`; timer advances that only touch DOM `textContent` do not need `act`.

---

### Task 1: Data model — `clearAfter` on options, announcement, and `createAnnouncement`

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/queue.ts`
- Test: `src/utils/queue.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `AnnounceOptions.clearAfter?: number`
  - `Announcement.clearAfter?: number`
  - `createAnnouncement(message: string, priority: 'polite' | 'assertive', clearAfter?: number): Announcement` — the returned object includes `clearAfter` (verbatim, may be `undefined`).

- [ ] **Step 1: Write the failing tests**

Add these two tests inside the existing `describe('createAnnouncement', ...)` block in `src/utils/queue.test.ts` (after the existing `creates assertive announcements` test):

```ts
    it('stores clearAfter when provided', () => {
      const announcement = createAnnouncement('Saved', 'polite', 500);
      expect(announcement.clearAfter).toBe(500);
    });

    it('leaves clearAfter undefined when not provided', () => {
      const announcement = createAnnouncement('Saved', 'polite');
      expect(announcement.clearAfter).toBeUndefined();
    });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/utils/queue.test.ts`
Expected: FAIL — `stores clearAfter when provided` fails because `announcement.clearAfter` is `undefined` (param not yet wired).

- [ ] **Step 3: Add `clearAfter` to the types**

In `src/types.ts`, update `AnnounceOptions` and `Announcement`:

```ts
export interface AnnounceOptions {
  priority?: 'polite' | 'assertive';
  clearQueue?: boolean;
  delay?: number;
  clearAfter?: number;
}

export interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
  clearAfter?: number;
}
```

- [ ] **Step 4: Wire `clearAfter` through `createAnnouncement`**

In `src/utils/queue.ts`, replace the `createAnnouncement` function with:

```ts
export function createAnnouncement(
  message: string,
  priority: 'polite' | 'assertive',
  clearAfter?: number,
): Announcement {
  return {
    id: generateId(),
    message,
    priority,
    timestamp: Date.now(),
    clearAfter,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/utils/queue.test.ts`
Expected: PASS — all `queue utilities` tests pass.

- [ ] **Step 6: Commit**

```bash
npm run format
git add src/types.ts src/utils/queue.ts src/utils/queue.test.ts
git commit -m "feat: add clearAfter to AnnounceOptions, Announcement, and createAnnouncement"
```

---

### Task 2: Body-level region clears after `clearAfter` ms

**Files:**
- Modify: `src/context/LiveRegionContext.tsx`
- Test: `src/context/LiveRegionContext.test.tsx`

**Interfaces:**
- Consumes: `createAnnouncement(message, priority, clearAfter?)` and `AnnounceOptions.clearAfter` from Task 1; `clearAnnouncer(priority?)` from `src/utils/announcer.js` (already clears a specific priority's element, or all when no argument).
- Produces: `announce(message, { clearAfter })` schedules `clearAnnouncer(priority)` after `clearAfter` ms; per-priority pending clear timers are cancelled when a newer message takes the same priority region, on `clearQueue`, on `clearQueue: true`, and on unmount.

- [ ] **Step 1: Write the failing tests**

In `src/context/LiveRegionContext.test.tsx`, add a new test component near the existing `TestConsumer` (after it, before the `describe`):

```tsx
function ClearAfterConsumer() {
  const { announce } = useLiveRegionContext();
  return (
    <div>
      <button onClick={() => announce('Saved', { clearAfter: 500 })}>Save</button>
      <button onClick={() => announce('Saved')}>Save No Clear</button>
      <button onClick={() => announce('First', { clearAfter: 500 })}>First</button>
      <button onClick={() => announce('Second', { clearAfter: 5000 })}>
        Second
      </button>
      <button
        onClick={() => announce('Delayed', { delay: 1000, clearAfter: 500 })}
      >
        Delayed
      </button>
    </div>
  );
}
```

Then add this `describe` block at the end of the file (inside the top-level `describe('LiveRegionProvider')`'s sibling scope — i.e. after the closing `});` of `describe('LiveRegionProvider', ...)`):

```tsx
describe('clearAfter option', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the live region after clearAfter ms', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();

    const el = document.getElementById('react-aria-live-polite');
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');
  });

  it('does not clear the live region without clearAfter', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Save No Clear').click();
    });
    vi.advanceTimersToNextFrame();

    const el = document.getElementById('react-aria-live-polite');
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(5000);
    expect(el?.textContent).toBe('Saved');
  });

  it('re-announces the same message after a clear', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Saved');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');

    act(() => {
      screen.getByText('Save').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Saved');
  });

  it('cancels a pending clear when a newer message replaces it', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('First').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('First');

    vi.advanceTimersByTime(300);

    act(() => {
      screen.getByText('Second').click();
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Second');

    // Pass First's original 500ms deadline; Second must NOT be wiped.
    vi.advanceTimersByTime(300);
    expect(el?.textContent).toBe('Second');
  });

  it('measures clearAfter from announce time when combined with delay', () => {
    render(
      <LiveRegionProvider>
        <ClearAfterConsumer />
      </LiveRegionProvider>,
    );

    const el = document.getElementById('react-aria-live-polite');

    act(() => {
      screen.getByText('Delayed').click();
    });

    // Delay fires -> message announced (setQueue runs, so wrap in act).
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    vi.advanceTimersToNextFrame();
    expect(el?.textContent).toBe('Delayed');

    vi.advanceTimersByTime(500);
    expect(el?.textContent).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/context/LiveRegionContext.test.tsx`
Expected: FAIL — `clears the live region after clearAfter ms` fails (`el.textContent` is still `'Saved'` after 500ms because no clear is scheduled yet).

- [ ] **Step 3: Implement clear scheduling and timer management**

Replace the entire contents of `src/context/LiveRegionContext.tsx` with:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Announcement,
  AnnounceOptions,
  LiveRegionContextValue,
  LiveRegionProviderProps,
} from '../types.js';
import {
  announceMessage,
  clearAnnouncer,
  setupAnnouncer,
  teardownAnnouncer,
} from '../utils/announcer.js';
import { DEFAULT_DEBOUNCE_MS } from '../utils/constants.js';
import { createAnnouncement, isDuplicate } from '../utils/queue.js';

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({
  children,
  clearOnUnmount = true,
}: LiveRegionProviderProps) {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutsRef = useRef<{
    polite: ReturnType<typeof setTimeout> | null;
    assertive: ReturnType<typeof setTimeout> | null;
  }>({ polite: null, assertive: null });

  const cancelClearTimeout = useCallback(
    (priority: 'polite' | 'assertive') => {
      const existing = clearTimeoutsRef.current[priority];
      if (existing) {
        clearTimeout(existing);
        clearTimeoutsRef.current[priority] = null;
      }
    },
    [],
  );

  const cancelAllClearTimeouts = useCallback(() => {
    cancelClearTimeout('polite');
    cancelClearTimeout('assertive');
  }, [cancelClearTimeout]);

  useEffect(() => {
    setupAnnouncer();
    return () => {
      if (clearOnUnmount) {
        clearAnnouncer();
      }
      teardownAnnouncer();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cancelAllClearTimeouts();
    };
  }, [clearOnUnmount, cancelAllClearTimeouts]);

  const clearQueue = useCallback(() => {
    cancelAllClearTimeouts();
    setQueue([]);
    clearAnnouncer();
  }, [cancelAllClearTimeouts]);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const {
        priority = 'polite',
        clearQueue: shouldClear,
        delay = 0,
        clearAfter = 0,
      } = options;

      if (!message.trim()) {
        return;
      }

      const doAnnounce = () => {
        setQueue((currentQueue) => {
          if (isDuplicate(currentQueue, message, DEFAULT_DEBOUNCE_MS)) {
            return currentQueue;
          }

          if (shouldClear) {
            cancelAllClearTimeouts();
            clearAnnouncer();
          }

          const announcement = createAnnouncement(message, priority, clearAfter);
          announceMessage(message, priority);

          // A new message now occupies this region. Cancel any pending clear
          // for this priority so a stale timer can't wipe it, then schedule a
          // fresh clear if requested.
          cancelClearTimeout(priority);
          if (clearAfter > 0) {
            clearTimeoutsRef.current[priority] = setTimeout(() => {
              clearAnnouncer(priority);
              clearTimeoutsRef.current[priority] = null;
            }, clearAfter);
          }

          const newQueue = shouldClear
            ? [announcement]
            : [...currentQueue, announcement];

          // Clean up old announcements (older than 5 seconds)
          const now = Date.now();
          return newQueue.filter((a) => now - a.timestamp < 5000);
        });
      };

      if (delay > 0) {
        timeoutRef.current = setTimeout(doAnnounce, delay);
      } else {
        doAnnounce();
      }
    },
    [cancelAllClearTimeouts, cancelClearTimeout],
  );

  const value = useMemo<LiveRegionContextValue>(
    () => ({
      announce,
      queue,
      clearQueue,
    }),
    [announce, queue, clearQueue],
  );

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
    </LiveRegionContext.Provider>
  );
}

export function useLiveRegionContext(): LiveRegionContextValue {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error(
      'useLiveRegionContext must be used within a LiveRegionProvider',
    );
  }
  return context;
}

export { LiveRegionContext };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/context/LiveRegionContext.test.tsx`
Expected: PASS — all `LiveRegionProvider` and `clearAfter option` tests pass, including the existing `returns stable function reference` expectation is unaffected (the existing test lives in `useAnnounce.test.tsx`; run it too in the next step).

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: PASS — entire suite green (the `useAnnounce` "returns stable function reference" test still passes because `announce` depends only on the two stable `useCallback` helpers).

- [ ] **Step 6: Commit**

```bash
npm run format
git add src/context/LiveRegionContext.tsx src/context/LiveRegionContext.test.tsx
git commit -m "feat: clear body-level live region after clearAfter ms"
```

---

### Task 3: Modal `<Announcer />` clears after `clearAfter` ms

**Files:**
- Modify: `src/components/Announcer.tsx`
- Test: `src/components/Announcer.test.tsx`

**Interfaces:**
- Consumes: `Announcement.clearAfter` from Task 1; the announcement queue from `useLiveRegionContext()`.
- Produces: a mounted `<Announcer />` clears its own polite/assertive `textContent` `clearAfter` ms after writing a message, cancels a pending clear when a newer message takes that region, and clears timers on unmount.

- [ ] **Step 1: Write the failing test**

In `src/components/Announcer.test.tsx`, add a button to the existing `TestComponent` (inside its returned `<div>`, after the `Announce Assertive` button):

```tsx
      <button onClick={() => announce('Auto clear', { clearAfter: 500 })}>
        Announce Clear After
      </button>
```

Then add this test at the end of the `describe('Announcer', ...)` block:

```tsx
  it('clears its region after clearAfter ms', () => {
    render(
      <LiveRegionProvider>
        <Announcer id="test" />
        <TestComponent />
      </LiveRegionProvider>,
    );

    act(() => {
      screen.getByText('Announce Clear After').click();
    });
    vi.advanceTimersToNextFrame();

    const politeEl = document.getElementById('test-polite');
    expect(politeEl?.textContent).toBe('Auto clear');

    vi.advanceTimersByTime(500);
    expect(politeEl?.textContent).toBe('');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Announcer.test.tsx`
Expected: FAIL — `clears its region after clearAfter ms` fails because `test-polite` still reads `'Auto clear'` after 500ms.

- [ ] **Step 3: Implement clear scheduling in the Announcer**

Replace the entire contents of `src/components/Announcer.tsx` with:

```tsx
import { useEffect, useRef, useId } from 'react';
import type { RefObject } from 'react';
import type { Announcement } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';
import { VISUALLY_HIDDEN_STYLES } from '../utils/constants.js';

export interface AnnouncerProps {
  /**
   * Optional ID prefix for the announcer elements.
   * Useful when you have multiple Announcers and need unique IDs.
   */
  id?: string;
}

/**
 * Renders visually hidden live region elements that announce messages.
 *
 * Use this component inside modals or other focus-trapped containers
 * where the default body-level announcer may not be heard by screen readers.
 *
 * @example
 * ```tsx
 * <Modal>
 *   <Announcer />
 *   <ModalContent />
 * </Modal>
 * ```
 */
export function Announcer({ id }: AnnouncerProps) {
  const { queue } = useLiveRegionContext();
  const reactId = useId();
  const announcerId = id || `announcer-${reactId}`;

  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedRef = useRef<{ polite: string; assertive: string }>({
    polite: '',
    assertive: '',
  });
  const clearTimeoutsRef = useRef<{
    polite: ReturnType<typeof setTimeout> | null;
    assertive: ReturnType<typeof setTimeout> | null;
  }>({ polite: null, assertive: null });

  useEffect(() => {
    const announceTo = (
      ref: RefObject<HTMLDivElement | null>,
      latest: Announcement | undefined,
      priority: 'polite' | 'assertive',
    ) => {
      if (
        !latest ||
        !ref.current ||
        lastAnnouncedRef.current[priority] === latest.id
      ) {
        return;
      }

      lastAnnouncedRef.current[priority] = latest.id;
      const el = ref.current;

      // A new message now occupies this region; cancel any pending clear.
      const pending = clearTimeoutsRef.current[priority];
      if (pending) {
        clearTimeout(pending);
        clearTimeoutsRef.current[priority] = null;
      }

      el.textContent = '';
      requestAnimationFrame(() => {
        el.textContent = latest.message;
      });

      if (latest.clearAfter && latest.clearAfter > 0) {
        clearTimeoutsRef.current[priority] = setTimeout(() => {
          el.textContent = '';
          clearTimeoutsRef.current[priority] = null;
        }, latest.clearAfter);
      }
    };

    const latestPolite = [...queue]
      .reverse()
      .find((a) => a.priority === 'polite');
    const latestAssertive = [...queue]
      .reverse()
      .find((a) => a.priority === 'assertive');

    announceTo(politeRef, latestPolite, 'polite');
    announceTo(assertiveRef, latestAssertive, 'assertive');
  }, [queue]);

  useEffect(() => {
    const timeouts = clearTimeoutsRef.current;
    return () => {
      if (timeouts.polite) {
        clearTimeout(timeouts.polite);
      }
      if (timeouts.assertive) {
        clearTimeout(timeouts.assertive);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={politeRef}
        id={`${announcerId}-polite`}
        aria-live="polite"
        aria-atomic="true"
        role="status"
        style={VISUALLY_HIDDEN_STYLES}
      />
      <div
        ref={assertiveRef}
        id={`${announcerId}-assertive`}
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        style={VISUALLY_HIDDEN_STYLES}
      />
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/Announcer.test.tsx`
Expected: PASS — all `Announcer` tests pass, including the new `clears its region after clearAfter ms`.

- [ ] **Step 5: Commit**

```bash
npm run format
git add src/components/Announcer.tsx src/components/Announcer.test.tsx
git commit -m "feat: clear modal Announcer region after clearAfter ms"
```

---

### Task 4: Documentation and changeset

**Files:**
- Modify: `README.md`
- Create: `.changeset/clear-after-announce-option.md`

**Interfaces:**
- Consumes: the public `clearAfter` option from Tasks 1–3.
- Produces: documentation and a release note. No runtime code.

- [ ] **Step 1: Document the option in the README**

In `README.md`, in the `### useAnnounce` section, add this example inside the code block (after the `// Clear queue before announcing` example, before the closing fence):

```tsx
// Clear the region after a delay so the same message can be announced again
announce('Cart note saved', { clearAfter: 500 });
```

Then add this row to the `**Options:**` table immediately after the `delay` row:

```markdown
| `clearAfter` | `number`                  | `0`        | Clear the live region this many ms after announcing, so an identical message announced later is re-read |
```

- [ ] **Step 2: Create the changeset**

Create `.changeset/clear-after-announce-option.md` with exactly:

```markdown
---
'@umxr/react-aria-live': minor
---

Add a `clearAfter` option to `announce()`. When set, the live region is cleared after the given number of milliseconds, so announcing the same message again is detected as a content change and re-read by screen readers. Both the default body-level region and the modal `<Announcer />` component honor it. Resolves #3.
```

- [ ] **Step 3: Verify the full CI pipeline passes**

Run: `npm run build && npm run check-format && npm run test`
Expected: PASS — TypeScript build succeeds, Prettier reports no formatting issues, all tests pass.

If `check-format` fails, run `npm run format`, then re-run the command.

- [ ] **Step 4: Commit**

```bash
git add README.md .changeset/clear-after-announce-option.md
git commit -m "docs: document clearAfter option and add changeset"
```

---

## Self-Review

**Spec coverage:**
- API `clearAfter?: number` on `AnnounceOptions` → Task 1. ✓
- Stored on `Announcement` / `createAnnouncement` → Task 1. ✓
- Body-level region clears after delay → Task 2. ✓
- `<Announcer />` clears after delay → Task 3. ✓
- Queue untouched (presentation-only) → Tasks 2 & 3 never mutate the queue for clears. ✓
- Per-priority timers; cancel-on-new-message; cancel on `clearQueue`/`clearQueue: true`; cleanup on unmount → Task 2 (context) and Task 3 (Announcer). ✓
- Edge cases: `clearAfter <= 0`/omitted (no clear), `delay` composition, re-announce after clear, cancellation → Task 2 tests. ✓
- Docs + changeset → Task 4. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases" — every code step shows complete code. ✓

**Type consistency:** `createAnnouncement(message, priority, clearAfter?)` defined in Task 1 and called with three args in Task 2. `Announcement.clearAfter` defined in Task 1 and read in Task 3. `clearTimeoutsRef` shape `{ polite, assertive }` consistent across Tasks 2 and 3. ✓
