import type { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
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
      <select
        id={id}
        className={clsx(
          "w-full border bg-white px-3 py-2 text-sm appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-500" : "border-gray-300",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-system-error">{error}</p>
      )}
    </div>
  );
}
