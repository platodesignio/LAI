import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Users",
};

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page ?? "1", 10));
  const q = resolvedParams.q?.trim() ?? "";
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const whereClause = q
    ? { email: { contains: q, mode: "insensitive" as const } }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.user.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Users</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 border border-gray-700 rounded px-3 py-1 cursor-default">
            Export (placeholder)
          </span>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="mb-6">
        <div className="flex items-center gap-3 max-w-md">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email…"
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-950"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black text-sm rounded hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin/users"
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="border border-gray-700 rounded overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Email
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Verified
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  {q ? `No users matching "${q}"` : "No users found."}
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {user.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3 text-white text-xs">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="hover:underline"
                  >
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">
                  {user.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded font-medium",
                      user.role === "ADMIN"
                        ? "bg-white text-black"
                        : "bg-gray-800 text-gray-300",
                    ].join(" ")}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span
                    className={
                      user.emailVerified
                        ? "text-green-400"
                        : "text-gray-500"
                    }
                  >
                    {user.emailVerified ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {user.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1)}
                className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl(page + 1)}
                className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
