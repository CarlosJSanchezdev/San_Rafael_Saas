import React from "react";
import Card from "./Card";
import Button from "./Button";
import { HiOutlineInbox } from "react-icons/hi";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon = <HiOutlineInbox size={48} />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card
      className="ui-empty-state"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 2rem",
        gap: "1rem",
      }}
    >
      <div style={{ color: "var(--text-light, #9CA3AF)" }}>{icon}</div>
      <h3 style={{ margin: 0, color: "var(--text-primary, #2D2C2F)", fontSize: "1.125rem" }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: 0, color: "var(--text-secondary, #6B7280)", maxWidth: 400 }}>
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}
