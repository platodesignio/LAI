import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "error" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium uppercase tracking-wider",
        {
          "bg-black text-white": variant === "default",
          "border border-black text-black bg-transparent": variant === "outline",
          "bg-red-100 text-red-700": variant === "error",
          "bg-green-100 text-green-700": variant === "success",
          "bg-yellow-100 text-yellow-700": variant === "warning",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
