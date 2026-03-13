import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { RevokeSessionButton } from "./revoke-session-button";
import { DeleteAccountButton } from "./delete-account-button";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [user, userSessions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    }),
    db.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-black mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">
          Manage your account, sessions, and security.
        </p>
      </div>

      {/* Account section */}
      <section>
        <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
          Account
        </h2>
        <div className="border border-gray-200 rounded p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Email</span>
            <span className="text-black font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Name</span>
            <span className="text-black font-medium">
              {user.name ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Role</span>
            <span className="text-black font-medium">{user.role}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/profile"
              className="text-sm text-gray-500 hover:text-black underline underline-offset-2"
            >
              Edit profile and change password →
            </Link>
          </div>
        </div>
      </section>

      {/* Sessions section */}
      <section>
        <h2 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
          Active sessions
        </h2>
        {userSessions.length === 0 ? (
          <p className="text-sm text-gray-500">No sessions found.</p>
        ) : (
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    IP Address
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Expires
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userSessions.map((s) => {
                  const expired = s.expiresAt < now;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                        {s.ipAddress ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.createdAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.expiresAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            expired
                              ? "bg-gray-100 text-gray-500"
                              : "bg-green-50 text-green-700",
                          ].join(" ")}
                        >
                          {expired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RevokeSessionButton sessionId={s.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">
          Danger zone
        </h2>
        <div className="border border-red-200 rounded p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-black">Delete account</p>
              <p className="text-xs text-gray-500 mt-1">
                Permanently delete your account and all associated data. This
                cannot be undone.
              </p>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </section>
    </div>
  );
}
