"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updatePastProjectForProposal } from "@/app/actions/proposals";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  matchProjectsByTitles,
  matchTeamByNames,
} from "@/lib/proposals/context";
import { createEmptySections } from "@/lib/proposals/sections";
import type {
  ProposalSectionKey,
  ProposalSections,
  ProposalStage,
  TenderAnalysis,
} from "@/lib/proposals/types";
import {
  GENERATION_SECTION_ORDER,
  PROPOSAL_SECTION_LABELS,
} from "@/lib/proposals/types";
import type { CompanyProfile, PastProject, TeamMember } from "@/lib/types";

interface OpportunityMeta {
  id: string;
  title: string | null;
  buyer_name: string | null;
}

export function ProposalWriter({
  opportunityId,
  initialDraft,
}: {
  opportunityId: string;
  initialDraft: {
    id: string;
    sections: ProposalSections;
    status: string;
  } | null;
}) {
  const [stage, setStage] = useState<ProposalStage>(
    initialDraft?.sections?.executive_summary?.content
      ? "editor"
      : "analyzing"
  );
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [projects, setProjects] = useState<PastProject[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [opportunity, setOpportunity] = useState<OpportunityMeta | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [certValid, setCertValid] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cannotWriteAnswers, setCannotWriteAnswers] = useState<
    Record<string, string>
  >({});

  const [generatingSection, setGeneratingSection] = useState<string | null>(
    null
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [sections, setSections] = useState<ProposalSections>(
    initialDraft?.sections ?? createEmptySections()
  );
  const [activeSection, setActiveSection] =
    useState<ProposalSectionKey>("executive_summary");
  const [rewritingSection, setRewritingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const suggestedProjects = useMemo(() => {
    if (!analysis) return projects;
    return matchProjectsByTitles(projects, analysis.projects_to_use);
  }, [analysis, projects]);

  const suggestedTeam = useMemo(() => {
    if (!analysis) return teamMembers;
    return matchTeamByNames(teamMembers, analysis.team_members_to_use);
  }, [analysis, teamMembers]);

  const runAnalysis = useCallback(async () => {
    setStage("analyzing");
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/proposals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      setAnalysis(data.analysis);
      setProfile(data.profile);
      setProjects(data.projects);
      setTeamMembers(data.teamMembers);
      setOpportunity(data.opportunity);

      const projectMatches = matchProjectsByTitles(
        data.projects,
        data.analysis.projects_to_use
      );
      setSelectedProjectIds(new Set(projectMatches.map((p: PastProject) => p.id)));

      const teamMatches = matchTeamByNames(
        data.teamMembers,
        data.analysis.team_members_to_use
      );
      setSelectedTeamIds(new Set(teamMatches.map((m: TeamMember) => m.id)));

      const certs: Record<string, boolean> = {};
      for (const cert of data.profile.certifications ?? []) {
        certs[cert] = true;
      }
      setCertValid(certs);

      setStage("review");
    } catch (error) {
      setAnalyzeError(
        error instanceof Error ? error.message : "Failed to analyze tender"
      );
    }
  }, [opportunityId]);

  useEffect(() => {
    if (stage === "analyzing") {
      runAnalysis();
    }
  }, [stage, runAnalysis]);

  const requiredMissing = useMemo(() => {
    if (!analysis) return true;
    return analysis.needs_user_input
      .filter((item) => item.required)
      .some((item) => !answers[item.field]?.trim());
  }, [analysis, answers]);

  const aiSectionCount = GENERATION_SECTION_ORDER.filter(
    (key) => key !== "pricing"
  ).length;

  const handleGenerate = async () => {
    if (!analysis || selectedProjectIds.size === 0) return;

    setStage("generating");
    setGenerateError(null);
    setGeneratingSection(null);

    const preGenerationAnswers = {
      ...answers,
      ...Object.fromEntries(
        Object.entries(cannotWriteAnswers).map(([k, v]) => [
          `cannot_write_${k}`,
          v,
        ])
      ),
      certification_confirmations: JSON.stringify(certValid),
    };

    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          preGenerationAnswers,
          confirmedProjectIds: Array.from(selectedProjectIds),
          confirmedTeamMemberIds: Array.from(selectedTeamIds),
          analysis,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      const nextSections = createEmptySections();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            section?: ProposalSectionKey;
            content?: string;
            status?: string;
            draftId?: string;
            error?: string;
          };

          if (event.type === "started" && event.draftId) {
            setDraftId(event.draftId);
          }

          if (event.type === "progress" && event.section) {
            setGeneratingSection(event.section);
          }

          if (event.type === "section" && event.section && event.content != null) {
            nextSections[event.section] = {
              content: event.content,
              status: (event.status as "draft" | "user_fill") ?? "draft",
              last_edited: new Date().toISOString(),
            };
            setSections({ ...nextSections });
          }

          if (event.type === "section_error" && event.section) {
            nextSections[event.section] = {
              content: "",
              status: "error",
              last_edited: new Date().toISOString(),
              error: event.error ?? "Generation failed",
            };
            setSections({ ...nextSections });
          }

          if (event.type === "fatal") {
            throw new Error(event.error ?? "Generation failed");
          }

          if (event.type === "done") {
            setStage("editor");
            setGeneratingSection(null);
          }
        }
      }
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : "Generation failed"
      );
      setStage("review");
    }
  };

  const handleRewrite = async (sectionKey: ProposalSectionKey) => {
    if (!analysis || !draftId) return;

    setRewritingSection(sectionKey);
    try {
      const res = await fetch("/api/proposals/rewrite-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          draftId,
          sectionKey,
          preGenerationAnswers: answers,
          confirmedProjectIds: Array.from(selectedProjectIds),
          confirmedTeamMemberIds: Array.from(selectedTeamIds),
          analysis,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");

      setSections((prev) => ({
        ...prev,
        [sectionKey]: {
          content: data.content,
          status: "draft",
          last_edited: data.last_edited,
        },
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Rewrite failed");
    } finally {
      setRewritingSection(null);
    }
  };

  const handleRetrySection = (sectionKey: ProposalSectionKey) => {
    handleRewrite(sectionKey);
  };

  const handleSave = async () => {
    if (!draftId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/proposals/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateSectionContent = (key: ProposalSectionKey, content: string) => {
    setSections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        content,
        last_edited: new Date().toISOString(),
      },
    }));
  };

  if (stage === "analyzing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <h2 className="text-xl font-semibold text-slate-900">
          Analyzing tender requirements…
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Claude is reading the tender and your company profile to plan your
          proposal.
        </p>
        {analyzeError && (
          <div className="mt-6 max-w-md">
            <p className="text-sm text-red-600">{analyzeError}</p>
            <Button className="mt-4" onClick={runAnalysis}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (stage === "review" && analysis && profile) {
    const manualCount =
      1 + (analysis.cannot_write?.length ?? 0);
    const noProjects = projects.length === 0;
    const noSelectedProjects = selectedProjectIds.size === 0;

    if (noProjects) {
      return (
        <Card className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Add a past project first
          </h2>
          <p className="mt-3 text-slate-600">
            You need at least one past project in your profile to write a
            proposal. Add one in Settings.
          </p>
          <LinkButton href="/onboard" className="mt-6">
            Go to onboarding
          </LinkButton>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {opportunity?.title ?? "Proposal"}
          </h1>
          <p className="mt-2 text-slate-600">
            Before we write your proposal, confirm what we&apos;ll use and fill
            in any gaps.
          </p>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {analysis.tender_summary}
          </p>
        </div>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            What we&apos;ll use from your profile
          </h2>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Past projects</h3>
            {suggestedProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                checked={selectedProjectIds.has(project.id)}
                onToggle={(checked) => {
                  setSelectedProjectIds((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(project.id);
                    else next.delete(project.id);
                    return next;
                  });
                }}
                editing={editingProjectId === project.id}
                onEdit={() => setEditingProjectId(project.id)}
                onCancelEdit={() => setEditingProjectId(null)}
                onSaved={(updated) => {
                  setProjects((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  );
                  setEditingProjectId(null);
                }}
              />
            ))}
          </div>

          {teamMembers.length === 0 ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No team members found in your profile. Add them in Settings for a
              stronger proposal. The team section will include placeholders.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-slate-700">Team members</h3>
              {suggestedTeam.map((member) => (
                <TeamRow
                  key={member.id}
                  member={member}
                  checked={selectedTeamIds.has(member.id)}
                  onToggle={(checked) => {
                    setSelectedTeamIds((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(member.id);
                      else next.delete(member.id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}

          {profile.certifications.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-slate-700">Certifications</h3>
              {profile.certifications.map((cert) => (
                <label
                  key={cert}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={certValid[cert] ?? false}
                    onChange={(e) =>
                      setCertValid((prev) => ({
                        ...prev,
                        [cert]: e.target.checked,
                      }))
                    }
                  />
                  {cert} — still valid?
                </label>
              ))}
            </div>
          )}
        </Card>

        {analysis.needs_user_input.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              This tender specifically needs
            </h2>
            <div className="space-y-5">
              {analysis.needs_user_input.map((item) => (
                <div key={item.field}>
                  <label className="block text-sm font-medium text-slate-900">
                    {item.question}
                    {item.required && (
                      <span className="ml-1 text-red-600">*</span>
                    )}
                  </label>
                  <p className="mt-1 text-xs text-slate-500">{item.why_needed}</p>
                  <textarea
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    value={answers[item.field] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [item.field]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {analysis.cannot_write.length > 0 && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Sections we can&apos;t write automatically
            </h2>
            <div className="space-y-4">
              {analysis.cannot_write.map((item) => (
                <div key={item.section}>
                  <p className="font-medium text-slate-900">{item.section}</p>
                  <p className="text-sm text-slate-600">{item.reason}</p>
                  <textarea
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Write this section yourself (optional)"
                    value={cannotWriteAnswers[item.section] ?? ""}
                    onChange={(e) =>
                      setCannotWriteAnswers((prev) => ({
                        ...prev,
                        [item.section]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Summary before generating
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-600">
            <li>{aiSectionCount} sections will be written by AI</li>
            <li>{manualCount} section(s) you need to complete manually (pricing always)</li>
          </ul>
          {requiredMissing && (
            <p className="mt-3 text-sm font-medium text-red-600">
              Fill in all required fields above before generating.
            </p>
          )}
          {noSelectedProjects && (
            <p className="mt-3 text-sm font-medium text-red-600">
              Select at least one past project to include.
            </p>
          )}
          {generateError && (
            <p className="mt-3 text-sm text-red-600">{generateError}</p>
          )}
          <Button
            className="mt-6"
            size="lg"
            disabled={requiredMissing || noSelectedProjects}
            onClick={handleGenerate}
          >
            Generate Proposal
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "generating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <h2 className="text-xl font-semibold text-slate-900">
          Writing your proposal…
        </h2>
        {generatingSection && (
          <p className="mt-2 text-sm text-slate-600">
            Writing {PROPOSAL_SECTION_LABELS[generatingSection as ProposalSectionKey]}…
          </p>
        )}
      </div>
    );
  }

  const current = sections[activeSection];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link
            href={`/opportunities/${opportunityId}`}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            ← Back to opportunity
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {opportunity?.title ?? "Proposal draft"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled title="Coming soon">
            Export coming soon
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="space-y-1">
          {GENERATION_SECTION_ORDER.map((key) => {
            const section = sections[key];
            const dot =
              section.status === "user_fill"
                ? "bg-amber-400"
                : section.status === "error"
                  ? "bg-red-400"
                  : section.content
                    ? "bg-emerald-400"
                    : "bg-slate-300";

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  activeSection === key
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                {PROPOSAL_SECTION_LABELS[key]}
              </button>
            );
          })}
        </nav>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            {PROPOSAL_SECTION_LABELS[activeSection]}
          </h2>

          {current.status === "error" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                {current.error ?? "This section failed to generate."}
              </p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleRetrySection(activeSection)}
                disabled={rewritingSection === activeSection}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <SectionEditor
                key={`${activeSection}-${current.last_edited}`}
                content={current.content}
                onBlur={(text) => updateSectionContent(activeSection, text)}
              />

              <div className="mt-4 flex flex-wrap gap-3">
                {activeSection !== "pricing" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={rewritingSection === activeSection}
                    onClick={() => handleRewrite(activeSection)}
                  >
                    {rewritingSection === activeSection
                      ? "Rewriting…"
                      : "Rewrite this section"}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function SectionEditor({
  content,
  onBlur,
}: {
  content: string;
  onBlur: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = content;
    }
  }, [content]);

  return (
    <div
      ref={ref}
      className="min-h-[280px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onBlur(e.currentTarget.textContent ?? "")}
    />
  );
}

function ProjectRow({
  project,
  checked,
  onToggle,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  project: PastProject;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (project: PastProject) => void;
  editing: boolean;
}) {
  const [form, setForm] = useState({
    title: project.title,
    outcome: project.outcome ?? "",
    budget: project.budget ?? 0,
  });

  if (editing) {
    return (
      <div className="rounded-lg border border-slate-200 p-4">
        <input
          className="mb-2 w-full rounded border px-2 py-1 text-sm"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="mb-2 w-full rounded border px-2 py-1 text-sm"
          rows={2}
          value={form.outcome}
          onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={async () => {
              const result = await updatePastProjectForProposal(project.id, {
                ...project,
                title: form.title,
                outcome: form.outcome,
                budget: form.budget,
                sector: project.sector ?? "",
                description: project.description ?? "",
                client_type: project.client_type,
                team_size_on_project: project.team_size_on_project ?? 0,
                duration_months: project.duration_months ?? 0,
                technologies_used: project.technologies_used,
              });
              if (!result.error) {
                onSaved({
                  ...project,
                  title: form.title,
                  outcome: form.outcome,
                  budget: form.budget,
                });
              }
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{project.title}</p>
        <p className="text-sm text-slate-600">
          {project.client_type}
          {project.budget != null && ` · £${project.budget.toLocaleString()}`}
          {project.outcome && ` · ${project.outcome}`}
        </p>
        <button
          type="button"
          className="mt-1 text-xs font-medium text-brand-600"
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          Edit
        </button>
      </div>
    </label>
  );
}

function TeamRow({
  member,
  checked,
  onToggle,
}: {
  member: TeamMember;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1"
      />
      <div>
        <p className="font-medium text-slate-900">{member.name}</p>
        <p className="text-sm text-slate-600">
          {member.role ?? "Role not set"}
          {member.years_experience != null &&
            ` · ${member.years_experience} years experience`}
        </p>
      </div>
    </label>
  );
}
