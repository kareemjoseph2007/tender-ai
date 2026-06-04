import {
  formatDeadlineCountdown,
  formatDeadlineDateLine,
  getDeadlineColorClass,
} from "@/lib/opportunities/format";

export function DeadlineDisplay({
  deadline,
  className = "",
}: {
  deadline: string | null;
  className?: string;
}) {
  const countdown = formatDeadlineCountdown(deadline);
  const dateLine = formatDeadlineDateLine(deadline);
  const colorClass = getDeadlineColorClass(deadline);

  return (
    <div className={className}>
      <p className={`text-sm font-medium ${colorClass}`}>{countdown}</p>
      {dateLine && (
        <p className="text-xs text-slate-500">{dateLine}</p>
      )}
    </div>
  );
}
