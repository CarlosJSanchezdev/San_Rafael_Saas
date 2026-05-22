import React from "react";
import Button from "./Button";
import "./Wizard.css";

export interface WizardStep {
  label: string;
  content: React.ReactNode;
}

export interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  canProceed?: boolean;
  loading?: boolean;
  finishLabel?: string;
  backLabel?: string;
  nextLabel?: string;
}

export default function Wizard({
  steps,
  currentStep,
  onNext,
  onBack,
  onFinish,
  canProceed = true,
  loading = false,
  finishLabel = "Finalizar",
  backLabel = "Atrás",
  nextLabel = "Siguiente",
}: WizardProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="ui-wizard">
      <div className="ui-wizard-progress">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <div
                  className={`ui-wizard-connector ${isCompleted ? "ui-wizard-connector--completed" : ""}`}
                />
              )}
              <div className="ui-wizard-step">
                <div
                  className={`ui-wizard-step-indicator ${
                    isActive ? "ui-wizard-step-indicator--active" : ""
                  } ${isCompleted ? "ui-wizard-step-indicator--completed" : ""}`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={`ui-wizard-step-label ${
                    isActive ? "ui-wizard-step-label--active" : ""
                  } ${isCompleted ? "ui-wizard-step-label--completed" : ""}`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="ui-wizard-content">{steps[currentStep].content}</div>

      <div className="ui-wizard-actions">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isFirst || loading}
        >
          {backLabel}
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            onClick={onFinish}
            disabled={!canProceed || loading}
            loading={loading}
          >
            {finishLabel}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!canProceed || loading}
            loading={loading}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
