import React from "react";
import { HiOutlineX } from "react-icons/hi";
import "./Modal.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="ui-modal-overlay" onClick={handleOverlayClick}>
      <div className={`ui-modal ui-modal--${size}`}>
        {(title || onClose) && (
          <div className="ui-modal-header">
            {title && <h3 className="ui-modal-title">{title}</h3>}
            <button className="ui-modal-close" onClick={onClose} aria-label="Cerrar">
              <HiOutlineX size={20} />
            </button>
          </div>
        )}
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
