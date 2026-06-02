"use client";

import { useState } from "react";
import { CERTIFICATIONS, INDUSTRIES, SERVICES } from "@/lib/constants";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export interface Step2Data {
  services: string[];
  industries: string[];
  certifications: string[];
}

interface Step2Props {
  initialData: Partial<Step2Data>;
  onNext: (data: Step2Data) => Promise<void>;
  onBack: () => void;
}

export function Step2WhatYouDo({ initialData, onNext, onBack }: Step2Props) {
  const [form, setForm] = useState<Step2Data>({
    services: initialData.services ?? [],
    industries: initialData.industries ?? [],
    certifications: initialData.certifications ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step2Data, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (field?: keyof Step2Data) => {
    const nextErrors: Partial<Record<keyof Step2Data, string>> = { ...errors };

    const check = (key: keyof Step2Data) => {
      if (key === "services") {
        nextErrors.services =
          form.services.length > 0
            ? undefined
            : "Select at least one service";
      }
      if (key === "industries") {
        nextErrors.industries =
          form.industries.length > 0
            ? undefined
            : "Select at least one industry";
      }
      if (key === "certifications") {
        nextErrors.certifications = undefined;
      }
    };

    if (field) {
      check(field);
    } else {
      check("services");
      check("industries");
      check("certifications");
    }

    setErrors(nextErrors);
    return !nextErrors.services && !nextErrors.industries;
  };

  const updateField = (field: keyof Step2Data, value: string[]) => {
    setForm({ ...form, [field]: value });
    setTouched((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => validate(field), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ services: true, industries: true, certifications: true });
    if (!validate()) return;

    setSubmitting(true);
    await onNext(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Services offered"
        required
        error={touched.services ? errors.services : undefined}
      >
        <ChipSelector
          options={SERVICES}
          value={form.services}
          onChange={(services) => updateField("services", services)}
          error={touched.services ? errors.services : undefined}
        />
      </FormField>

      <FormField
        label="Industries you've worked in"
        required
        error={touched.industries ? errors.industries : undefined}
      >
        <ChipSelector
          options={INDUSTRIES}
          value={form.industries}
          onChange={(industries) => updateField("industries", industries)}
          error={touched.industries ? errors.industries : undefined}
        />
      </FormField>

      <FormField
        label="Certifications held"
        hint="Optional — select any that apply"
      >
        <ChipSelector
          options={CERTIFICATIONS}
          value={form.certifications}
          onChange={(certifications) =>
            updateField("certifications", certifications)
          }
        />
      </FormField>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
