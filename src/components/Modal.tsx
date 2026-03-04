import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { tokens as T } from "@/styles/tokens";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (el) {
      const focusable = el.querySelectorAll<HTMLElement>(
        "input,textarea,button:not([disabled])"
      );
      if (focusable.length) focusable[0].focus();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="modal-panel"
        style={{
          width: "100%",
          maxWidth: "460px",
          maxHeight: "90vh",
          background: T.white,
          borderRadius: T.r2xl,
          boxShadow: T.shadowSm,
          display: "flex",
          flexDirection: "column",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            padding: "24px 24px 0",
          }}
        >
          <div>
            {title && (
              <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600, lineHeight: "24px", color: T.black }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{ margin: 0, fontSize: "14px", color: T.textSecondary, lineHeight: "20px" }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{
              flexShrink: 0,
              width: "32px",
              height: "32px",
              borderRadius: T.rMd,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.greyDark,
              transition: "color 0.15s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", fontSize: "14px", color: T.black, lineHeight: "22px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ display: "flex", gap: "12px", padding: "8px 24px 24px", justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
