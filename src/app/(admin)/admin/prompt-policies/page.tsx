import type { Metadata } from "next";
import type { ModeType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getModeDisplayName } from "@/lib/ai/modes";
import { ActivateButton, CreateVersionButton } from "./prompt-policy-actions";

export const metadata: Metadata = {
  title: "Prompt Policies",
};

const ALL_MODES: ModeType[] = [
  "QUIET_MIRROR",
  "STRATEGIC_GOVERNANCE",
  "CONFLICT_DISSOLUTION",
  "PERSONAL_DISCIPLINE",
  "INSTITUTIONAL_JUDGMENT",
];

export default async function AdminPromptPoliciesPage() {
  await requireAdmin();

  // Fetch all prompt versions ordered by mode and version desc
  const allVersions = await db.promptVersion.findMany({
    orderBy: [{ mode: "asc" }, { version: "desc" }],
  });

  // Group by mode
  const byMode = new Map<ModeType, typeof allVersions>();
  for (const mode of ALL_MODES) {
    byMode.set(
      mode,
      allVersions.filter((v) => v.mode === mode)
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Prompt Policies</h1>
        <CreateVersionButton />
      </div>

      <div className="space-y-8">
        {ALL_MODES.map((mode) => {
          const versions = byMode.get(mode) ?? [];
          const activeVersion = versions.find((v) => v.isActive);

          return (
            <section key={mode}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-white">
                  {getModeDisplayName(mode)}
                </h2>
                <span className="text-xs font-mono text-gray-500">{mode}</span>
              </div>

              {versions.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No versions yet.
                </p>
              ) : (
                <div className="border border-gray-700 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                          Version
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                          Active
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                          System Prompt (preview)
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                          Notes
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                          Created
                        </th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {versions.map((v) => (
                        <tr
                          key={v.id}
                          className={[
                            "hover:bg-gray-800 transition-colors",
                            v.isActive ? "bg-gray-800/50" : "",
                          ].join(" ")}
                        >
                          <td className="px-4 py-3 text-gray-300 text-xs font-mono">
                            v{v.version}
                          </td>
                          <td className="px-4 py-3">
                            {v.isActive ? (
                              <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">
                                Active
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px] font-mono leading-relaxed">
                            <span className="line-clamp-2 block">
                              {v.systemPrompt.slice(0, 120)}
                              {v.systemPrompt.length > 120 ? "…" : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                            {v.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {v.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!v.isActive && (
                              <ActivateButton versionId={v.id} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeVersion && (
                <div className="mt-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded text-xs text-gray-500">
                  Active: v{activeVersion.version} — created{" "}
                  {activeVersion.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
