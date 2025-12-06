# @umxr/react-aria-live

React hooks and components for managing ARIA live regions. Announce dynamic content changes to screen reader users with a simple, declarative API.

## Installation

```bash
npm install @umxr/react-aria-live
```

## Quick Start

Wrap your app with `LiveRegionProvider` and use the `useAnnounce` hook to make announcements:

```tsx
import { LiveRegionProvider, useAnnounce } from '@umxr/react-aria-live';

function App() {
  return (
    <LiveRegionProvider>
      <SaveButton />
    </LiveRegionProvider>
  );
}

function SaveButton() {
  const announce = useAnnounce();

  const handleSave = async () => {
    await saveData();
    announce('Document saved successfully');
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## API

### LiveRegionProvider

Context provider that manages live region announcements. Wrap your app with this component.

```tsx
<LiveRegionProvider clearOnUnmount={true}>{children}</LiveRegionProvider>
```

| Prop             | Type      | Default | Description                                        |
| ---------------- | --------- | ------- | -------------------------------------------------- |
| `clearOnUnmount` | `boolean` | `true`  | Clear pending announcements when provider unmounts |

### useAnnounce

Hook for making announcements programmatically.

```tsx
const announce = useAnnounce();

// Polite announcement (default)
announce('Items updated');

// Assertive announcement (interrupts)
announce('Error: Failed to save', { priority: 'assertive' });

// With delay
announce('Auto-saved', { delay: 1000 });

// Clear queue before announcing
announce('New message', { clearQueue: true });
```

**Options:**

| Option       | Type                      | Default    | Description                       |
| ------------ | ------------------------- | ---------- | --------------------------------- |
| `priority`   | `'polite' \| 'assertive'` | `'polite'` | Announcement urgency              |
| `clearQueue` | `boolean`                 | `false`    | Clear pending announcements first |
| `delay`      | `number`                  | `0`        | Delay in milliseconds             |

### useAnnouncementQueue

Hook for accessing the announcement queue state.

```tsx
const { queue, clear, isPending } = useAnnouncementQueue();
```

| Property    | Type             | Description                       |
| ----------- | ---------------- | --------------------------------- |
| `queue`     | `Announcement[]` | Current pending announcements     |
| `clear`     | `() => void`     | Clear all pending announcements   |
| `isPending` | `boolean`        | Whether announcements are pending |

### LiveRegion

Declarative component for content that should be announced when it changes.

```tsx
<LiveRegion priority="polite" atomic>
  {statusMessage}
</LiveRegion>
```

| Prop        | Type                                                   | Default    | Description                          |
| ----------- | ------------------------------------------------------ | ---------- | ------------------------------------ |
| `priority`  | `'polite' \| 'assertive' \| 'off'`                     | `'polite'` | Announcement urgency                 |
| `atomic`    | `boolean`                                              | `false`    | Announce entire region on any change |
| `relevant`  | `'additions' \| 'removals' \| 'text' \| 'all'`         | -          | Types of changes to announce         |
| `role`      | `'alert' \| 'status' \| 'log' \| 'marquee' \| 'timer'` | -          | ARIA role                            |
| `visible`   | `boolean`                                              | `true`     | Whether content is visually visible  |
| `as`        | `ElementType`                                          | `'div'`    | HTML element to render               |
| `className` | `string`                                               | -          | CSS class                            |

### Announce

Component for one-off announcements without rendering visible content.

```tsx
{
  isSuccess && <Announce message="Form submitted successfully" />;
}
```

| Prop       | Type                      | Default    | Description          |
| ---------- | ------------------------- | ---------- | -------------------- |
| `message`  | `string`                  | required   | Message to announce  |
| `priority` | `'polite' \| 'assertive'` | `'polite'` | Announcement urgency |

### Announcer

Renders live region elements that can be placed inside modals or other focus-trapped containers.

By default, the library creates announcer elements at the document body level. However, screen readers may not announce content from live regions outside a focused modal. Use the `Announcer` component inside your modal to ensure announcements are heard.

```tsx
import { Announcer } from '@umxr/react-aria-live';

function Modal({ children }) {
  return (
    <div role="dialog" aria-modal="true">
      <Announcer />
      {children}
    </div>
  );
}
```

| Prop | Type     | Default        | Description                      |
| ---- | -------- | -------------- | -------------------------------- |
| `id` | `string` | auto-generated | ID prefix for announcer elements |

**How it works:**

- All `Announcer` components subscribe to the same announcement queue
- When `useAnnounce()` is called, ALL mounted announcers receive the message
- The screen reader hears the announcer that's in the active focus context

### Specialized Components

Pre-configured components for common patterns:

#### Alert

Assertive announcements with `role="alert"`.

```tsx
<Alert>Payment failed. Please try again.</Alert>
```

#### Status

Polite status updates with `role="status"`.

```tsx
<Status>{itemCount} items in cart</Status>
```

#### Log

Sequential content like chat messages with `role="log"`.

```tsx
<Log>
  {messages.map((m) => (
    <p key={m.id}>{m.text}</p>
  ))}
</Log>
```

## Testing

The package exports test utilities for verifying announcements in your tests:

```tsx
import {
  getAnnouncements,
  clearMockAnnouncements,
} from '@umxr/react-aria-live/test';

test('announces on save', async () => {
  render(<SaveButton />);

  await userEvent.click(screen.getByRole('button'));

  expect(getAnnouncements()).toContain('Document saved');
});
```

**Test utilities:**

| Function                               | Description                            |
| -------------------------------------- | -------------------------------------- |
| `getAnnouncements()`                   | Get all announcement messages          |
| `getLastAnnouncement()`                | Get the most recent announcement       |
| `hasAnnouncement(message)`             | Check if a message was announced       |
| `clearMockAnnouncements()`             | Clear the announcement history         |
| `getAnnouncementsByPriority(priority)` | Get announcements filtered by priority |

## Best Practices

1. **Use polite by default** - Reserve `assertive` for critical, time-sensitive information
2. **Keep messages concise** - Screen reader users benefit from brief, clear announcements
3. **Avoid duplicate announcements** - The library automatically deduplicates within 150ms
4. **Test with real screen readers** - Automated tests can't catch all accessibility issues

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## License

MIT
