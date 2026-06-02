import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}
