"use client";

import { useState } from "react";
import type { ClientType, PastProjectInput } from "@/lib/types";
import { CLIENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FormField, SelectInput, TextArea, TextInput } from "@/components/ui/FormField";
import { TagInput } from "@/components/ui/TagInput";
import { Button } from "@/components/ui/Button";

const emptyProject = (): PastProjectInput => ({
  title: "",
  client_type: "government",
  sector: "",
  description: "",
  budget: 0,
  team_size_on_project: 0,
  duration_months: 0,
  outcome: "",
  technologies_used: [],
});

interface Step3Props {
  initialProjects: PastProjectInput[];
  onNext: (projects: PastProjectInput[]) => Promise<void>;
  onBack: () => void;
}

export function Step3PastProjects({ initialProjects, onNext, onBack }: Step3Props) {
  const [projects, setProjects] = useState<PastProjectInput[]>(
    initialProjects.length > 0 ? initialProjects : []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(
    initialProjects.length === 0 ? null : null
  );
  const [draft, setDraft] = useState<PastProjectInput>(emptyProject());
  const [errors, setErrors] = useState<Partial<Record<keyof PastProjectInput, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PastProjectInput, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(initialProjects.length === 0);

  const validateDraft = (field?: keyof PastProjectInput) => {
    const nextErrors: Partial<Record<keyof PastProjectInput, string>> = { ...errors };

    const check = (key: keyof PastProjectInput) => {
      switch (key) {
        case "title":
          nextErrors.title = draft.title.trim() ? undefined : "Title is required";
          break;
        case "sector":
          nextErrors.sector = draft.sector.trim() ? undefined : "Sector is required";
          break;
        case "description":
          nextErrors.description = draft.description.trim()
            ? undefined
            : "Description is required";
          break;
        case "budget":
          nextErrors.budget = draft.budget > 0 ? undefined : "Budget must be greater than 0";
          break;
        case "team_size_on_project":
          nextErrors.team_size_on_project =
            draft.team_size_on_project > 0
              ? undefined
              : "Team size must be at least 1";
          break;
        case "duration_months":
          nextErrors.duration_months =
            draft.duration_months > 0 ? undefined : "Duration is required";
          break;
        case "outcome":
          nextErrors.outcome = draft.outcome.trim() ? undefined : "Outcome is required";
          break;
        case "technologies_used":
          nextErrors.technologies_used =
            draft.technologies_used.length > 0
              ? undefined
              : "Add at least one technology";
          break;
      }
    };

    if (field) {
      check(field);
    } else {
      (
        [
          "title",
          "sector",
          "description",
          "budget",
          "team_size_on_project",
          "duration_months",
          "outcome",
          "technologies_used",
        ] as (keyof PastProjectInput)[]
      ).forEach(check);
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((e) => !e);
  };

  const handleBlur = (field: keyof PastProjectInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateDraft(field);
  };

  const openAddForm = () => {
    if (projects.length >= 10) return;
    setDraft(emptyProject());
    setEditingIndex(null);
    setErrors({});
    setTouched({});
    setShowForm(true);
  };

  const openEditForm = (index: number) => {
    setDraft({ ...projects[index] });
    setEditingIndex(index);
    setErrors({});
    setTouched({});
    setShowForm(true);
  };

  const saveProject = () => {
    setTouched({
      title: true,
      sector: true,
      description: true,
      budget: true,
      team_size_on_project: true,
      duration_months: true,
      outcome: true,
      technologies_used: true,
    });

    if (!validateDraft()) return;

    if (editingIndex !== null) {
      const updated = [...projects];
      updated[editingIndex] = draft;
      setProjects(updated);
    } else {
      setProjects([...projects, draft]);
    }

    setShowForm(false);
    setEditingIndex(null);
    setDraft(emptyProject());
    setFormError(null);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projects.length < 3) {
      setFormError("Please add at least 3 past projects before continuing.");
      return;
    }
    if (projects.length > 10) {
      setFormError("Maximum 10 projects allowed.");
      return;
    }

    setSubmitting(true);
    await onNext(projects);
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-800">
        The AI uses your past projects when writing proposals. The more detail here,
        the better the output.
      </div>

      {projects.length === 0 && !showForm && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">
            📁
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Your project history powers smarter proposals
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Add 3–10 relevant projects. Government clients especially value
            evidence of similar work delivered.
          </p>
          <Button size="lg" className="mt-6" onClick={openAddForm}>
            Add your first project
          </Button>
        </div>
      )}

      {projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id ?? index}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-medium text-slate-900">{project.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {CLIENT_TYPES.find((c) => c.value === project.client_type)?.label}
                    {" · "}
                    {project.sector}
                    {" · "}
                    ${project.budget.toLocaleString()} USD
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.technologies_used.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {projects.length < 10 && !showForm && (
            <Button type="button" variant="secondary" onClick={openAddForm}>
              + Add another project ({projects.length}/10)
            </Button>
          )}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-medium text-slate-900">
            {editingIndex !== null ? "Edit project" : "New project"}
          </h3>
          <div className="space-y-4">
            <FormField
              label="Project title"
              required
              error={touched.title ? errors.title : undefined}
            >
              <TextInput
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onBlur={() => handleBlur("title")}
                placeholder="Citizen portal redesign"
                error={!!errors.title && touched.title}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Client type" required>
                <SelectInput
                  value={draft.client_type}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      client_type: e.target.value as ClientType,
                    })
                  }
                >
                  {CLIENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField
                label="Sector"
                required
                error={touched.sector ? errors.sector : undefined}
              >
                <TextInput
                  value={draft.sector}
                  onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                  onBlur={() => handleBlur("sector")}
                  placeholder="Public sector / Healthcare"
                  error={!!errors.sector && touched.sector}
                />
              </FormField>
            </div>

            <FormField
              label="Description"
              required
              error={touched.description ? errors.description : undefined}
            >
              <TextArea
                rows={3}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                onBlur={() => handleBlur("description")}
                placeholder="What was the project scope and your role?"
                error={!!errors.description && touched.description}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                label="Budget (USD)"
                required
                error={touched.budget ? errors.budget : undefined}
              >
                <TextInput
                  type="number"
                  min={1}
                  value={draft.budget || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      budget: parseInt(e.target.value) || 0,
                    })
                  }
                  onBlur={() => handleBlur("budget")}
                  error={!!errors.budget && touched.budget}
                />
              </FormField>

              <FormField
                label="Team size"
                required
                error={
                  touched.team_size_on_project
                    ? errors.team_size_on_project
                    : undefined
                }
              >
                <TextInput
                  type="number"
                  min={1}
                  value={draft.team_size_on_project || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      team_size_on_project: parseInt(e.target.value) || 0,
                    })
                  }
                  onBlur={() => handleBlur("team_size_on_project")}
                  error={
                    !!errors.team_size_on_project && touched.team_size_on_project
                  }
                />
              </FormField>

              <FormField
                label="Duration (months)"
                required
                error={
                  touched.duration_months ? errors.duration_months : undefined
                }
              >
                <TextInput
                  type="number"
                  min={1}
                  value={draft.duration_months || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      duration_months: parseInt(e.target.value) || 0,
                    })
                  }
                  onBlur={() => handleBlur("duration_months")}
                  error={!!errors.duration_months && touched.duration_months}
                />
              </FormField>
            </div>

            <FormField
              label="Outcome"
              required
              hint="What was delivered or achieved?"
              error={touched.outcome ? errors.outcome : undefined}
            >
              <TextArea
                rows={2}
                value={draft.outcome}
                onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
                onBlur={() => handleBlur("outcome")}
                error={!!errors.outcome && touched.outcome}
              />
            </FormField>

            <FormField
              label="Technologies used"
              required
              error={
                touched.technologies_used ? errors.technologies_used : undefined
              }
            >
              <TagInput
                value={draft.technologies_used}
                onChange={(technologies_used) => {
                  setDraft({ ...draft, technologies_used });
                  setTouched((prev) => ({ ...prev, technologies_used: true }));
                  setTimeout(() => validateDraft("technologies_used"), 0);
                }}
                placeholder="React, Node.js, AWS..."
                error={
                  touched.technologies_used ? errors.technologies_used : undefined
                }
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={saveProject}>
                {editingIndex !== null ? "Save changes" : "Add project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {formError && (
        <p className="text-sm text-red-600">{formError}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between pt-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            type="submit"
            disabled={submitting || projects.length < 3}
            className={cn(projects.length < 3 && "opacity-60")}
          >
            {submitting ? "Saving..." : `Continue (${projects.length}/3 min)`}
          </Button>
        </div>
      </form>
    </div>
  );
}
