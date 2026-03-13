"use client";

import { clsx } from "clsx";
import type { ModeType } from "@prisma/client";

interface ModeSelectorProps {
  value: ModeType;
  onChange: (mode: ModeType) => void;
}

const MODES: Array<{ mode: ModeType; name: string; label: string }> = [
  {
    mode: "QUIET_MIRROR",
    name: "Quiet Mirror",
    label: "QM",
  },
  {
    mode: "STRATEGIC_GOVERNANCE",
    name: "Strategic Governance",
    label: "SG",
  },
  {
    mode: "CONFLICT_DISSOLUTION",
    name: "Conflict Dissolution",
    label: "CD",
  },
  {
    mode: "PERSONAL_DISCIPLINE",
    name: "Personal Discipline",
    label: "PD",
  },
  {
    mode: "INSTITUTIONAL_JUDGMENT",
    name: "Institutional Judgment",
    label: "IJ",
  },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-400 uppercase tracking-wider mr-1">
        Mode
      </span>
      {MODES.map(({ mode, name, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={name}
          className={clsx(
            "px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors",
            value === mode
              ? "bg-black text-white"
              : "border border-gray-300 text-gray-600 hover:border-black hover:text-black"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ModeDisplay({ mode }: { mode: ModeType }) {
  const found = MODES.find((m) => m.mode === mode);
  return (
    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
      {found?.name ?? mode}
    </span>
  );
}
