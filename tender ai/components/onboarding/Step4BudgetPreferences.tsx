"use client";

import { useState } from "react";
import { COUNTRIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { FormField, TextInput } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { OnboardingData } from "@/lib/types";

export interface Step4Data {
  budget_min: number;
  budget_max: number;
  countries_served: string[];
  alert_threshold: number;
}

interface Step4Props {
  initialData: Partial<Step4Data>;
  summary: Partial<OnboardingData>;
  onComplete: (data: Step4Data) => Promise<void>;
  onBack: () => void;
}

export function Step4BudgetPreferences({
  initialData,
  summary,
  onComplete,
  onBack,
}: Step4Props) {
  const [form, setForm] = useState<Step4Data>({
    budget_min: initialData.budget_min ?? 10000,
    budget_max: initialData.budget_max ?? 500000,
    countries_served: initialData.countries_served ?? [],
    alert_threshold: initialData.alert_threshold ?? 75,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step4Data, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step4Data, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (field?: keyof Step4Data) => {
    const nextErrors: Partial<Record<keyof Step4Data, string>> = { ...errors };

    const check = (key: keyof Step4Data) => {
      switch (key) {
        case "budget_min":
          nextErrors.budget_min =
            form.budget_min > 0 ? undefined : "Minimum budget is required";
          break;
        case "budget_max":
          nextErrors.budget_max =
            form.budget_max > form.budget_min
              ? undefined
              : "Maximum must be greater than minimum";
          break;
        case "countries_served":
          nextErrors.countries_served =
            form.countries_served.length > 0
              ? undefined
              : "Select at least one country to monitor";
          break;
      }
    };

    if (field) {
      check(field);
    } else {
      check("budget_min");
      check("budget_max");
      check("countries_served");
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((e) => !e);
  };

  const handleBlur = (field: keyof Step4Data) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      budget_min: true,
      budget_max: true,
      countries_served: true,
      alert_threshold: true,
    });
    if (!validate()) return;

    setSubmitting(true);
    await onComplete(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Minimum bid budget (USD)"
          required
          error={touched.budget_min ? errors.budget_min : undefined}
        >
          <TextInput
            type="number"
            min={1}
            value={form.budget_min || ""}
            onChange={(e) =>
              setForm({ ...form, budget_min: parseInt(e.target.value) || 0 })
            }
            onBlur={() => handleBlur("budget_min")}
            error={!!errors.budget_min && touched.budget_min}
          />
        </FormField>

        <FormField
          label="Maximum bid budget (USD)"
          required
          error={touched.budget_max ? errors.budget_max : undefined}
        >
          <TextInput
            type="number"
            min={1}
            value={form.budget_max || ""}
            onChange={(e) =>
              setForm({ ...form, budget_max: parseInt(e.target.value) || 0 })
            }
            onBlur={() => handleBlur("budget_max")}
            error={!!errors.budget_max && touched.budget_max}
          />
        </FormField>
      </div>

      <FormField
        label="Countries to monitor tenders from"
        required
        error={touched.countries_served ? errors.countries_served : undefined}
      >
        <ChipSelector
          options={COUNTRIES}
          value={form.countries_served}
          onChange={(countries_served) => {
            setForm({ ...form, countries_served });
            setTouched((prev) => ({ ...prev, countries_served: true }));
            setTimeout(() => validate("countries_served"), 0);
          }}
          error={touched.countries_served ? errors.countries_served : undefined}
        />
      </FormField>

      <FormField
        label={`Minimum match score for alerts: ${form.alert_threshold}%`}
        hint="Only notify me about tenders scoring above this threshold"
      >
        <input
          type="range"
          min={60}
          max={95}
          step={1}
          value={form.alert_threshold}
          onChange={(e) =>
            setForm({ ...form, alert_threshold: parseInt(e.target.value) })
          }
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>60% — more alerts</span>
          <span>95% — highly targeted</span>
        </div>
      </FormField>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Review your profile
        </h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="font-medium text-slate-900">{summary.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Country</dt>
            <dd className="font-medium text-slate-900">
              {summary.country || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Services</dt>
            <dd className="font-medium text-slate-900">
              {summary.services?.slice(0, 3).join(", ") || "—"}
              {(summary.services?.length ?? 0) > 3 &&
                ` +${(summary.services?.length ?? 0) - 3} more`}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Past projects</dt>
            <dd className="font-medium text-slate-900">
              {summary.projects?.length ?? 0} added
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Bid range</dt>
            <dd className="font-medium text-slate-900">
              {formatCurrency(form.budget_min)} – {formatCurrency(form.budget_max)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Alert threshold</dt>
            <dd className="font-medium text-slate-900">{form.alert_threshold}%</dd>
          </div>
        </dl>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving profile..." : "Complete setup"}
        </Button>
      </div>
    </form>
  );
}
