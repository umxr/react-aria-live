import { useState } from 'react';
import {
  LiveRegionProvider,
  useAnnounce,
  useAnnouncementQueue,
  LiveRegion,
  Announce,
  Announcer,
  Alert,
  Status,
  Log,
} from '@umxr/react-aria-live';
import './App.css';

// Example 1: Basic useAnnounce hook
function BasicAnnounce() {
  const announce = useAnnounce();
  const [count, setCount] = useState(0);

  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    announce(`Count updated to ${newCount}`);
  };

  return (
    <section>
      <h2>1. Basic useAnnounce Hook</h2>
      <p>Click the button to increment and announce the new count.</p>
      <button onClick={handleClick}>Count: {count}</button>
    </section>
  );
}

// Example 2: Different priorities
function PriorityExample() {
  const announce = useAnnounce();

  return (
    <section>
      <h2>2. Announcement Priorities</h2>
      <p>
        Polite announcements wait for the user to be idle. Assertive
        announcements interrupt immediately.
      </p>
      <div className="button-group">
        <button onClick={() => announce('This is a polite announcement')}>
          Polite
        </button>
        <button
          onClick={() =>
            announce('URGENT: This is assertive!', { priority: 'assertive' })
          }
        >
          Assertive
        </button>
      </div>
    </section>
  );
}

// Example 3: LiveRegion component
function LiveRegionExample() {
  const [message, setMessage] = useState('Initial status');

  return (
    <section>
      <h2>3. LiveRegion Component</h2>
      <p>Content changes in the LiveRegion are automatically announced.</p>
      <LiveRegion priority="polite" atomic>
        <strong>Status:</strong> {message}
      </LiveRegion>
      <div className="button-group">
        <button onClick={() => setMessage('Loading...')}>Set Loading</button>
        <button onClick={() => setMessage('Complete!')}>Set Complete</button>
        <button
          onClick={() =>
            setMessage(`Updated at ${new Date().toLocaleTimeString()}`)
          }
        >
          Update Time
        </button>
      </div>
    </section>
  );
}

// Example 4: Announce component
function AnnounceExample() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <section>
      <h2>4. Announce Component</h2>
      <p>
        The Announce component triggers an announcement when mounted or when its
        message changes.
      </p>
      <button onClick={handleSubmit}>Submit Form</button>
      {showSuccess && <Announce message="Form submitted successfully!" />}
      {showSuccess && (
        <p className="success-message">Form submitted successfully!</p>
      )}
    </section>
  );
}

// Example 5: Specialized components (Alert, Status, Log)
function SpecializedExample() {
  const [cartItems, setCartItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addToCart = () => {
    setCartItems((prev) => prev + 1);
  };

  const triggerError = () => {
    setError('Payment failed. Please try again.');
    setTimeout(() => setError(null), 3000);
  };

  const addLog = () => {
    setLogs((prev) => [
      ...prev,
      `Log entry at ${new Date().toLocaleTimeString()}`,
    ]);
  };

  return (
    <section>
      <h2>5. Specialized Components</h2>

      <div className="subsection">
        <h3>Status (polite, role="status")</h3>
        <Status>{cartItems} items in cart</Status>
        <button onClick={addToCart}>Add to Cart</button>
      </div>

      <div className="subsection">
        <h3>Alert (assertive, role="alert")</h3>
        {error && <Alert>{error}</Alert>}
        <button onClick={triggerError}>Trigger Error</button>
      </div>

      <div className="subsection">
        <h3>Log (polite, role="log")</h3>
        <Log>
          {logs.map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </Log>
        <button onClick={addLog}>Add Log Entry</button>
      </div>
    </section>
  );
}

// Example 6: Queue management
function QueueExample() {
  const announce = useAnnounce();
  const { queue, clear, isPending } = useAnnouncementQueue();

  const announceMultiple = () => {
    announce('First message');
    setTimeout(() => announce('Second message'), 200);
    setTimeout(() => announce('Third message'), 400);
  };

  return (
    <section>
      <h2>6. Queue Management</h2>
      <p>View and manage the announcement queue.</p>
      <div className="queue-info">
        <p>
          <strong>Queue length:</strong> {queue.length}
        </p>
        <p>
          <strong>Is pending:</strong> {isPending ? 'Yes' : 'No'}
        </p>
      </div>
      <div className="button-group">
        <button onClick={announceMultiple}>Announce Multiple</button>
        <button onClick={clear}>Clear Queue</button>
      </div>
    </section>
  );
}

// Example 7: Modal with Announcer
function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const announce = useAnnounce();

  return (
    <section>
      <h2>7. Modal with Announcer</h2>
      <p>
        When focus is trapped in a modal, announcements from the body-level
        announcer may not be heard. Use the Announcer component inside your
        modal.
      </p>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Announcer inside modal ensures announcements are heard */}
            <Announcer id="modal" />

            <h3 id="modal-title">Modal Dialog</h3>
            <p>
              This modal has its own Announcer component. Try the buttons below
              - announcements will work even with focus trapped here.
            </p>
            <div className="button-group">
              <button onClick={() => announce('Button 1 clicked!')}>
                Announce 1
              </button>
              <button onClick={() => announce('Button 2 clicked!')}>
                Announce 2
              </button>
              <button
                onClick={() =>
                  announce('Alert from modal!', { priority: 'assertive' })
                }
              >
                Assertive Alert
              </button>
            </div>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              Close Modal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Example 8: Delayed announcements
function DelayedExample() {
  const announce = useAnnounce();

  return (
    <section>
      <h2>8. Delayed Announcements</h2>
      <p>Announcements can be delayed using the delay option.</p>
      <div className="button-group">
        <button onClick={() => announce('Immediate announcement')}>
          Immediate
        </button>
        <button
          onClick={() => announce('Delayed by 1 second', { delay: 1000 })}
        >
          1s Delay
        </button>
        <button
          onClick={() => announce('Delayed by 2 seconds', { delay: 2000 })}
        >
          2s Delay
        </button>
      </div>
    </section>
  );
}

function App() {
  return (
    <LiveRegionProvider>
      <main>
        <h1>@umxr/react-aria-live Examples</h1>
        <p className="intro">
          This page demonstrates all the features of the react-aria-live
          library. Enable a screen reader to hear the announcements.
        </p>

        <BasicAnnounce />
        <PriorityExample />
        <LiveRegionExample />
        <AnnounceExample />
        <SpecializedExample />
        <QueueExample />
        <ModalExample />
        <DelayedExample />
      </main>
    </LiveRegionProvider>
  );
}

export default App;
