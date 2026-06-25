# @umxr/react-aria-live

## 1.1.0

### Minor Changes

- bb4b44b: Add a `clearAfter` option to `announce()`. When set, the live region is cleared after the given number of milliseconds, so announcing the same message again is detected as a content change and re-read by screen readers. Both the default body-level region and the modal `<Announcer />` component honor it. Resolves #3.

## 1.0.1

### Patch Changes

- 69e8329: Add Announcer component for modal and focus-trap compatibility. The Announcer component renders live regions that can be placed inside modals or other focus-trapped containers, ensuring screen reader announcements work correctly when focus is constrained. All Announcer instances subscribe to the same announcement queue, so calls to useAnnounce() are heard by the announcer in the active focus context.
