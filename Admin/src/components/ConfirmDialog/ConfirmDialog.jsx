import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../Modal/Modal";

/**
 * useConfirm() returns [confirm, ConfirmDialogElement]. Call
 * confirm({ title, message }) and await it — resolves true/false based on
 * the user's choice. Render <ConfirmDialogElement /> once near the root of
 * the page that uses it.
 */
export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, danger, resolve }

  const confirm = ({ title = "Are you sure?", message, danger = true } = {}) =>
    new Promise((resolve) => {
      setState({ title, message, danger, resolve });
    });

  function handle(result) {
    state?.resolve(result);
    setState(null);
  }

  const element = state ? (
    <Modal title={state.title} onClose={() => handle(false)} width={460}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: state.danger ? "var(--danger-bg)" : "var(--primary-light)",
            color: state.danger ? "var(--danger)" : "var(--primary-text)",
            border: state.danger ? "1px solid var(--danger-border)" : "1px solid rgba(250, 167, 3, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div style={{ flex: 1 }}>
          {state.danger ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "12px 14px"
              }}
            >
              <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#b91c1c", lineHeight: 1.5 }}>
                {state.message}
              </p>
              <span style={{ display: "block", marginTop: "6px", fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
                ⚠️ Warning: This deletion is permanent and cannot be undone.
              </span>
            </div>
          ) : (
            state.message && (
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.55 }}>
                {state.message}
              </p>
            )
          )}
        </div>
      </div>
      <div className="form-actions" style={{ marginTop: 0 }}>
        <button type="button" className="btn btn-secondary" onClick={() => handle(false)}>
          Cancel
        </button>
        <button
          type="button"
          className={state.danger ? "btn btn-danger" : "btn btn-accent"}
          onClick={() => handle(true)}
        >
          {state.danger ? (state.confirmText || "Delete") : (state.confirmText || "Confirm")}
        </button>
      </div>
    </Modal>
  ) : null;

  return [confirm, () => element];
}
