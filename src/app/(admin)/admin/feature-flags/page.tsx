import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ToggleFlagButton, CreateFlagButton } from "./feature-flag-actions";

export const metadata: Metadata = {
  title: "Feature Flags",
};

export default async function AdminFeatureFlagsPage() {
  await requireAdmin();

  const flags = await db.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Feature Flags</h1>
        <CreateFlagButton />
      </div>

      {flags.length === 0 ? (
        <p className="text-sm text-gray-500">No feature flags defined yet.</p>
      ) : (
        <div className="border border-gray-700 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-400">
                  Key
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">
                  Enabled
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">
                  Description
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">
                  Metadata
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {flags.map((flag) => {
                // metadata is Prisma Json type — cast safely
                const metaStr =
                  flag.metadata !== null && flag.metadata !== undefined
                    ? JSON.stringify(flag.metadata).slice(0, 80)
                    : "—";

                return (
                  <tr
                    key={flag.id}
                    className="hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white">
                      {flag.key}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ToggleFlagButton
                          flagId={flag.id}
                          enabled={flag.enabled}
                        />
                        <span
                          className={[
                            "text-xs",
                            flag.enabled
                              ? "text-green-400"
                              : "text-gray-500",
                          ].join(" ")}
                        >
                          {flag.enabled ? "On" : "Off"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs max-w-[200px]">
                      {flag.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[200px] truncate">
                      {metaStr}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {flag.updatedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
