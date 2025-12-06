---
"@umxr/react-aria-live": patch
---

Add Announcer component for modal and focus-trap compatibility. The Announcer component renders live regions that can be placed inside modals or other focus-trapped containers, ensuring screen reader announcements work correctly when focus is constrained. All Announcer instances subscribe to the same announcement queue, so calls to useAnnounce() are heard by the announcer in the active focus context.
