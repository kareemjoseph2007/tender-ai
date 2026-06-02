"use client";

import { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  error,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-[42px] flex-wrap gap-2 rounded-lg border bg-white px-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20",
          error ? "border-red-300" : "border-slate-200 focus-within:border-brand-500"
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-slate-400 hover:text-slate-600"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
