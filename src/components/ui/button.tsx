"use client";

import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          // Variants
          "bg-black text-white hover:bg-gray-800 active:bg-gray-900":
            variant === "primary",
          "border border-black text-black bg-white hover:bg-gray-50 active:bg-gray-100":
            variant === "secondary",
          "text-black hover:bg-gray-100 active:bg-gray-200":
            variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800":
            variant === "danger",
          // Sizes
          "text-xs px-3 py-1.5 h-7": size === "sm",
          "text-sm px-4 py-2 h-9": size === "md",
          "text-sm px-6 py-3 h-11": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 border border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
