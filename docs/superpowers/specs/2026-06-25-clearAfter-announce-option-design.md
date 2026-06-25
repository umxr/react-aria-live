# Design: `clearAfter` announce option

- **Issue:** [#3 — No built-in way to clear message after delay](https://github.com/umxr/react-aria-live/issues/3)
- **Date:** 2026-06-25
- **Status:** Approved

## Problem

Screen readers (VoiceOver and others) announce based on a **content change** in a
live region, not on a DOM mutation. The library's body-level region currently does:

```js
el.textContent = '';
requestAnimationFrame(() => {
  el.textContent = message;
});
```

The empty state lasts only ~one frame (~16ms) before the message is set again — too
brief for screen readers to register it as a real change. When the **same** message is
announced twice (for example, confirming that a cart note was saved a second time), the
final content equals the previous content, so no diff is detected and the message is not
re-read.

This breaks a common pattern: announcements used to confirm a repeatable action. The
reporter wants a per-call option to clear the region after a delay so a later identical
message becomes a genuine empty→text change.

## API

Add an optional `clearAfter` field (milliseconds) to `AnnounceOptions`:

```tsx
announce('Cart note saved', { clearAfter: 500 });
```

- When `clearAfter > 0`, the live region is wiped (`textContent = ''`) that many
  milliseconds **after** the message is announced.
- Omitted, `0`, negative, or `NaN` → current behavior (the message persists). Fully
  backward compatible.
- The clear is measured from **announce time**, so it composes with `delay`: the clear
  timer starts when the delayed announce actually fires.

Per-call opt-in only. No provider-level default in this change (YAGNI).

## Why this fixes it

Holding the region empty for a real interval means the next identical announcement is a
genuine empty→text content change, which screen readers detect — solving the "same
message twice isn't re-read" problem.

## Data flow (presentation-only, both surfaces)

The library has two live-region surfaces, and `clearAfter` must behave consistently on
both:

1. **Body-level region** — created by `setupAnnouncer`, written by `announceMessage`.
   This is what `useAnnounce` uses by default.
2. **`<Announcer />` component** — mounted inside modals/focus traps; subscribes to the
   same announcement queue and writes to its own DOM refs.

Design:

- Store `clearAfter` on the `Announcement` object so each surface can schedule clearing
  its **own** DOM independently. `createAnnouncement(message, priority, clearAfter?)`
  gains the parameter; the `Announcement` interface gains `clearAfter?: number`.
- **Body-level** (`LiveRegionContext.announce` → `doAnnounce`): after
  `announceMessage(message, priority)`, if `clearAfter > 0`, schedule
  `clearAnnouncer(priority)` after `clearAfter` ms.
- **`<Announcer />`**: in its queue effect, after writing the latest message to its ref,
  if that announcement's `clearAfter > 0`, schedule clearing that ref's `textContent`
  after `clearAfter` ms.
- **The queue is untouched.** `clearAfter` only clears the spoken region, not queue
  membership. The queue keeps its existing 5-second self-cleanup, and
  `useAnnouncementQueue().isPending` is unaffected. This also avoids the `<Announcer />`
  re-showing an older message when an entry is removed.

## Timer management

Both surfaces keep **per-priority** clear timers in a ref, shaped
`{ polite, assertive }`:

- Announcing a new message to a priority **cancels that priority's pending clear timer
  first**. Otherwise a stale clear timer from a previous message would wipe the newer
  message that now occupies the region.
- `clearQueue` (the manual context method) and the `clearQueue: true` option cancel
  pending clear timers (both priorities) since the region is being reset anyway.
- All clear timers are cleared on unmount. This extends the provider's existing cleanup,
  which today clears only the single `delay` timer.

## Edge cases

- `clearAfter <= 0`, `undefined`, or `NaN`: no clear scheduled (current behavior).
- `delay` + `clearAfter`: clear is measured from announce time (timer scheduled inside
  `doAnnounce`, which runs after the delay).
- Re-announcing the same message after a clear: region goes empty→text, so it is
  re-read.
- A new announce (same priority) before the timer fires: pending timer cancelled, new
  message preserved.
- After a clear fires, the announcement remains in the queue (until 5s cleanup); the
  `<Announcer />` `lastAnnouncedRef` still holds its id, so it is not re-shown.

## Testing (TDD)

Body-level (`LiveRegionContext` / `useAnnounce` tests):

- With `clearAfter`, region content is cleared after the delay.
- Without `clearAfter`, region content persists past that delay.
- Same message announced again after a clear sets the text again (re-announced).
- `clearAfter <= 0` / omitted → no clear.
- Cancellation: new announce to the same priority before the timer fires keeps the new
  message (no premature wipe).
- Composition: `delay` + `clearAfter` measures the clear from announce time.

`<Announcer />` component:

- Its ref's content is cleared after the delay when `clearAfter` is set.

Use `vi.useFakeTimers()` with `vi.advanceTimersByTime(...)` (and
`vi.advanceTimersToNextFrame()` for the rAF-driven message set), matching existing test
conventions.

## Docs

Add a `clearAfter` row to the `useAnnounce` options table in the README, with the
cart-note example showing repeated confirmation announcements.

## Out of scope

- Provider-level default `clearAfter`.
- Reworking the existing `delay` single-timer tracking beyond what is needed for correct
  cleanup of the new clear timers.
- Wiring the `/test` mock (`_recordAnnouncement`) into `announceMessage` (pre-existing
  gap, unrelated).
