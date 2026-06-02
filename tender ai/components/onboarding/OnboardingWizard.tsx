"use client";

import { useState } from "react";
import type { OnboardingData } from "@/lib/types";
import {
  completeOnboarding,
  saveOnboardingStep1,
  saveOnboardingStep2,
  saveOnboardingStep3,
} from "@/app/actions/onboarding";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Step1CompanyBasics } from "@/components/onboarding/Step1CompanyBasics";
import { Step2WhatYouDo } from "@/components/onboarding/Step2WhatYouDo";
import { Step3PastProjects } from "@/components/onboarding/Step3PastProjects";
import { Step4BudgetPreferences } from "@/components/onboarding/Step4BudgetPreferences";
import { Card, CardHeader } from "@/components/ui/Card";

const STEP_HEADERS = [
  {
    title: "Tell us about your company",
    description:
      "We'll use this to match you with relevant government tenders and tailor proposal drafts to your strengths.",
  },
  {
    title: "What does your agency do best?",
    description:
      "Select the services and sectors where you have proven delivery experience.",
  },
  {
    title: "Showcase your track record",
    description:
      "Past projects are the foundation of compelling tender responses.",
  },
  {
    title: "Set your tender preferences",
    description:
      "Define the opportunities you want to pursue and how selective alerts should be.",
  },
];

interface OnboardingWizardProps {
  initialData: Partial<OnboardingData>;
}

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>(initialData);
  const [error, setError] = useState<string | null>(null);

  const header = STEP_HEADERS[step - 1];

  const handleStep1 = async (stepData: Parameters<typeof saveOnboardingStep1>[0]) => {
    setError(null);
    const result = await saveOnboardingStep1(stepData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setData((prev) => ({ ...prev, ...stepData }));
    setStep(2);
  };

  const handleStep2 = async (stepData: Parameters<typeof saveOnboardingStep2>[0]) => {
    setError(null);
    const result = await saveOnboardingStep2(stepData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setData((prev) => ({ ...prev, ...stepData }));
    setStep(3);
  };

  const handleStep3 = async (
    projects: Parameters<typeof saveOnboardingStep3>[0]
  ) => {
    setError(null);
    const result = await saveOnboardingStep3(projects);
    if (result.error) {
      setError(result.error);
      return;
    }
    setData((prev) => ({ ...prev, projects }));
    setStep(4);
  };

  const handleStep4 = async (
    stepData: Parameters<typeof completeOnboarding>[0]
  ) => {
    setError(null);
    const result = await completeOnboarding(stepData);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <>
      <ProgressBar currentStep={step} />
      <Card>
        <CardHeader title={header.title} description={header.description} />
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {step === 1 && (
          <Step1CompanyBasics initialData={data} onNext={handleStep1} />
        )}
        {step === 2 && (
          <Step2WhatYouDo
            initialData={data}
            onNext={handleStep2}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3PastProjects
            initialProjects={data.projects ?? []}
            onNext={handleStep3}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4BudgetPreferences
            initialData={data}
            summary={data}
            onComplete={handleStep4}
            onBack={() => setStep(3)}
          />
        )}
      </Card>
    </>
  );
}
