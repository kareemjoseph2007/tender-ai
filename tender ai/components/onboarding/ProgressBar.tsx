import { ONBOARDING_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900">
          Step {currentStep} of {ONBOARDING_STEPS.length}
        </span>
        <span className="text-slate-500">
          {ONBOARDING_STEPS[currentStep - 1]?.title}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 hidden gap-2 sm:flex">
        {ONBOARDING_STEPS.map((step) => (
          <div
            key={step.number}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors",
              step.number === currentStep
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : step.number < currentStep
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 bg-white text-slate-400"
            )}
          >
            {step.title}
          </div>
        ))}
      </div>
    </div>
  );
}
