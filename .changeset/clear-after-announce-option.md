---
'@umxr/react-aria-live': minor
---

Add a `clearAfter` option to `announce()`. When set, the live region is cleared after the given number of milliseconds, so announcing the same message again is detected as a content change and re-read by screen readers. Both the default body-level region and the modal `<Announcer />` component honor it. Resolves #3.
