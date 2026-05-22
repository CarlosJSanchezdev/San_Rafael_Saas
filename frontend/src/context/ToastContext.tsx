import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiCheckCircle, HiXCircle, HiExclamationCircle, HiInformationCircle } from "react-icons/hi";
import "./Toast.css";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  undoAction?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, undoAction?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success", undoAction?: () => void) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, undoAction }]);

    const duration = undoAction ? 5000 : 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success": return <HiCheckCircle />;
      case "error": return <HiXCircle />;
      case "warning": return <HiExclamationCircle />;
      case "info": return <HiInformationCircle />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              style={{ cursor: toast.undoAction ? "default" : "pointer" }}
              onClick={() => { if (!toast.undoAction) removeToast(toast.id); }}
            >
              <span className="toast-icon">{getIcon(toast.type)}</span>
              <span className="toast-message">{toast.message}</span>
              {toast.undoAction && (
                <button
                  className="toast-undo"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.undoAction?.();
                    removeToast(toast.id);
                  }}
                >
                  Deshacer
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
