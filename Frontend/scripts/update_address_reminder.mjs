import fs from 'node:fs';

const file = 'frontend/src/components/Modals/AddressReminder.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF first for reliable regex replacements
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add constants
content = content.replace(
  'import "./AddressReminder.css";\n\nexport default function AddressReminder',
  'import "./AddressReminder.css";\n\nconst REMINDER_DELAY_MS = 5 * 60 * 1000; // 5 minutes of website usage\nconst REMINDER_VERSION = 3;\n\nexport default function AddressReminder'
);

// 2. Replace reminder initialization & timer logic in useEffect
const oldEffect = `  useEffect(() => {
    if (!visitor || hasDeliveryAddress(visitor) || open || !canShow) return;
    const stored = visitor.addressReminder;
    const reminder =
      stored?.version === 2
        ? stored
        : {
            version: 2,
            count: 0,
            status: "waiting",
            nextAt: Date.now() + 30000
          };
    if (reminder !== stored) {
      remember({ ...visitor, addressReminder: reminder });
      return;
    }
    if (reminder.status === "dismissed") return;
    if (reminder.status === "open") {
      setForm(checkoutVisitorFields(visitor));
      setError("");
      setOpen(true);
      return;
    }
    const nextAt = reminder.nextAt || Date.now() + 30000;
    const timer = setTimeout(() => {
      const latest = memory.current;
      if (!latest || hasDeliveryAddress(latest) || document.visibilityState === "hidden") return;
      remember({
        ...latest,
        addressReminder: {
          version: 2,
          count: (latest.addressReminder?.count || 0) + 1,
          status: "open",
          nextAt: null
        }
      });
      setForm(checkoutVisitorFields(latest));
      setError("");
      setOpen(true);
    }, Math.max(0, nextAt - Date.now()));
    return () => clearTimeout(timer);
  }, [visitor, open, canShow]);`;

const newEffect = `  useEffect(() => {
    if (!visitor || hasDeliveryAddress(visitor) || open || !canShow) return;
    const stored = visitor.addressReminder;

    // If already dismissed or already displayed once, never show again
    if (stored?.status === "dismissed" || (stored?.count && stored.count >= 1 && stored.status !== "open")) {
      if (stored.version !== REMINDER_VERSION) {
        remember({
          ...visitor,
          addressReminder: {
            version: REMINDER_VERSION,
            count: stored.count || 1,
            status: "dismissed",
            nextAt: null
          }
        });
      }
      return;
    }

    const reminder =
      stored?.version === REMINDER_VERSION
        ? stored
        : {
            version: REMINDER_VERSION,
            count: 0,
            status: "waiting",
            nextAt: Date.now() + REMINDER_DELAY_MS
          };

    if (reminder !== stored) {
      remember({ ...visitor, addressReminder: reminder });
      return;
    }

    if (reminder.status === "open") {
      setForm(checkoutVisitorFields(visitor));
      setError("");
      setOpen(true);
      return;
    }

    const nextAt = reminder.nextAt || Date.now() + REMINDER_DELAY_MS;
    const timer = setTimeout(() => {
      const latest = memory.current;
      if (!latest || hasDeliveryAddress(latest) || document.visibilityState === "hidden") return;
      remember({
        ...latest,
        addressReminder: {
          version: REMINDER_VERSION,
          count: 1,
          status: "open",
          nextAt: null
        }
      });
      setForm(checkoutVisitorFields(latest));
      setError("");
      setOpen(true);
    }, Math.max(0, nextAt - Date.now()));
    return () => clearTimeout(timer);
  }, [visitor, open, canShow]);`;

content = content.replace(oldEffect, newEffect);

// 3. Replace dismiss function (no 60s retry, permanent dismissal on 1st dismiss)
const oldDismiss = `  const dismiss = useCallback(() => {
    const latest = memory.current;
    if (latest) {
      const count = latest.addressReminder?.count || 1;
      remember({
        ...latest,
        addressReminder: {
          version: 2,
          count,
          status: count >= 2 ? "dismissed" : "waiting",
          nextAt: count >= 2 ? null : Date.now() + 60000
        }
      });
    }
    setOpen(false);
  }, []);`;

const newDismiss = `  const dismiss = useCallback(() => {
    const latest = memory.current;
    if (latest) {
      remember({
        ...latest,
        addressReminder: {
          version: REMINDER_VERSION,
          count: 1,
          status: "dismissed",
          nextAt: null
        }
      });
    }
    setOpen(false);
  }, []);`;

content = content.replace(oldDismiss, newDismiss);

// 4. Replace submit addressReminder version
content = content.replace(
  'addressReminder: { version: 2, count: 2, status: "dismissed", nextAt: null }',
  'addressReminder: { version: REMINDER_VERSION, count: 1, status: "dismissed", nextAt: null }'
);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated AddressReminder.jsx');
