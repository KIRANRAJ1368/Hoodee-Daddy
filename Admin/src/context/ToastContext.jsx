import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Trash2, Info, X } from "lucide-react";
import "./ToastContext.css";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentErrors = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const normalizedMessage = String(message || "").trim();
      if (!normalizedMessage) return;
      const id = ++idCounter;
      if (type === "error") {
        const lastShown = recentErrors.current.get(normalizedMessage) || 0;
        if (Date.now() - lastShown < 4000) return;
        recentErrors.current.set(normalizedMessage, Date.now());
      }
      setToasts((prev) => {
        return [...prev.slice(type === "error" ? -1 : -4), { id, message: normalizedMessage, type }];
      });
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    delete: (msg) => push(msg, "delete"),
    danger: (msg) => push(msg, "delete"),
    info: (msg) => push(msg, "info")
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            <div className="toast-icon">
              {t.type === "success" && <CheckCircle2 size={18} />}
              {t.type === "error" && <AlertCircle size={18} />}
              {t.type === "delete" && <Trash2 size={18} />}
              {t.type === "info" && <Info size={18} />}
            </div>
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
