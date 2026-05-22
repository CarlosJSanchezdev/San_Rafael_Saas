import React from "react";
import "./Input.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  success,
  hint,
  icon,
  required,
  className = "",
  ...props
}: InputProps) {
  const status = error ? "error" : success ? "success" : "";

  return (
    <div className="ui-input-wrapper">
      {label && (
        <label className={`ui-input-label ${required ? "ui-input-label--required" : ""}`}>
          {label}
        </label>
      )}
      <div className="ui-input-container">
        {icon && <span className="ui-input-icon">{icon}</span>}
        <input
          className={`ui-input ${icon ? "ui-input--with-icon" : ""} ${status ? `ui-input--${status}` : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="ui-input-message ui-input-message--error">{error}</span>}
      {success && !error && <span className="ui-input-message ui-input-message--success">{success}</span>}
      {hint && !error && !success && <span className="ui-input-message ui-input-message--hint">{hint}</span>}
    </div>
  );
}
