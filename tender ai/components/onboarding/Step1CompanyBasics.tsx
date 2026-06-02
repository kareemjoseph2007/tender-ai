"use client";

import { useState } from "react";
import { COUNTRIES, LANGUAGES } from "@/lib/constants";
import { isValidUrl } from "@/lib/utils";
import { ChipSelector } from "@/components/ui/ChipSelector";
import { FormField, SelectInput, TextInput } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export interface Step1Data {
  name: string;
  website: string;
  country: string;
  team_size: number;
  years_in_business: number;
  languages: string[];
}

interface Step1Props {
  initialData: Partial<Step1Data>;
  onNext: (data: Step1Data) => Promise<void>;
}

export function Step1CompanyBasics({ initialData, onNext }: Step1Props) {
  const [form, setForm] = useState<Step1Data>({
    name: initialData.name ?? "",
    website: initialData.website ?? "",
    country: initialData.country ?? "",
    team_size: initialData.team_size ?? 0,
    years_in_business: initialData.years_in_business ?? 0,
    languages: initialData.languages ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1Data, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (field?: keyof Step1Data) => {
    const nextErrors: Partial<Record<keyof Step1Data, string>> = { ...errors };

    const check = (key: keyof Step1Data) => {
      switch (key) {
        case "name":
          nextErrors.name = form.name.trim() ? undefined : "Company name is required";
          break;
        case "website":
          nextErrors.website =
            form.website && !isValidUrl(form.website)
              ? "Enter a valid website URL"
              : undefined;
          break;
        case "country":
          nextErrors.country = form.country ? undefined : "Select your country";
          break;
        case "team_size":
          nextErrors.team_size =
            form.team_size > 0 ? undefined : "Team size must be at least 1";
          break;
        case "years_in_business":
          nextErrors.years_in_business =
            form.years_in_business >= 0
              ? undefined
              : "Years in business is required";
          break;
        case "languages":
          nextErrors.languages =
            form.languages.length > 0
              ? undefined
              : "Select at least one language";
          break;
      }
    };

    if (field) {
      check(field);
    } else {
      (Object.keys(form) as (keyof Step1Data)[]).forEach(check);
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((e) => !e);
  };

  const handleBlur = (field: keyof Step1Data) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      website: true,
      country: true,
      team_size: true,
      years_in_business: true,
      languages: true,
    });

    if (!validate()) return;

    setSubmitting(true);
    await onNext(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        label="Company name"
        required
        error={touched.name ? errors.name : undefined}
      >
        <TextInput
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onBlur={() => handleBlur("name")}
          placeholder="Acme Software Ltd"
          error={!!errors.name && touched.name}
        />
      </FormField>

      <FormField
        label="Website"
        hint="Optional — helps us understand your positioning"
        error={touched.website ? errors.website : undefined}
      >
        <TextInput
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          onBlur={() => handleBlur("website")}
          placeholder="https://yourcompany.com"
          error={!!errors.website && touched.website}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Country"
          required
          error={touched.country ? errors.country : undefined}
        >
          <SelectInput
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            onBlur={() => handleBlur("country")}
            error={!!errors.country && touched.country}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField
          label="Team size"
          required
          error={touched.team_size ? errors.team_size : undefined}
        >
          <TextInput
            type="number"
            min={1}
            value={form.team_size || ""}
            onChange={(e) =>
              setForm({ ...form, team_size: parseInt(e.target.value) || 0 })
            }
            onBlur={() => handleBlur("team_size")}
            placeholder="12"
            error={!!errors.team_size && touched.team_size}
          />
        </FormField>
      </div>

      <FormField
        label="Years in business"
        required
        error={touched.years_in_business ? errors.years_in_business : undefined}
      >
        <TextInput
          type="number"
          min={0}
          value={form.years_in_business || ""}
          onChange={(e) =>
            setForm({
              ...form,
              years_in_business: parseInt(e.target.value) || 0,
            })
          }
          onBlur={() => handleBlur("years_in_business")}
          placeholder="5"
          error={!!errors.years_in_business && touched.years_in_business}
        />
      </FormField>

      <FormField
        label="Languages"
        required
        hint="Languages your team can deliver projects in"
        error={touched.languages ? errors.languages : undefined}
      >
        <ChipSelector
          options={LANGUAGES}
          value={form.languages}
          onChange={(languages) => {
            setForm({ ...form, languages });
            setTouched((prev) => ({ ...prev, languages: true }));
            setTimeout(() => validate("languages"), 0);
          }}
          error={touched.languages ? errors.languages : undefined}
        />
      </FormField>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
