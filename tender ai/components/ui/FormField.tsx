import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-brand-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function TextInput({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        error ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-brand-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
