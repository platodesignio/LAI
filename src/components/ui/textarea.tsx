import type { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium uppercase tracking-widest mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(
          "w-full border bg-white px-3 py-2 text-sm resize-vertical",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-500" : "border-gray-300",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-system-error">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
