"use client";

import { cn } from "@/lib/utils";

interface ChipSelectorProps {
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  allowCustom?: boolean;
  customLabel?: string;
}

export function ChipSelector({
  options,
  value,
  onChange,
  error,
  allowCustom = false,
  customLabel = "Other",
}: ChipSelectorProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const hasOtherSelected = value.some((v) => !options.includes(v));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                selected
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
              )}
            >
              {option}
            </button>
          );
        })}
        {allowCustom && hasOtherSelected && (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm text-brand-700">
            + custom
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {allowCustom && options.includes(customLabel) && value.includes(customLabel) && (
        <p className="text-xs text-slate-500">
          Add specific details in the project description where relevant.
        </p>
      )}
    </div>
  );
}
