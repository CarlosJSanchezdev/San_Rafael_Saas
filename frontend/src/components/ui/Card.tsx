import React from "react";
import "./Card.css";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "compact" | "comfortable";
}

export default function Card({
  children,
  className = "",
  hoverable = false,
  padding = "comfortable",
}: CardProps) {
  const classes = [
    "ui-card",
    hoverable ? "ui-card--hoverable" : "",
    `ui-card--${padding}`,
    className,
  ].join(" ");

  return <div className={classes}>{children}</div>;
}
