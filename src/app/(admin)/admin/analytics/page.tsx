import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Analytics",
};

interface DayCount {
  date: string;
  count: number;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // All queries run in parallel
  const [
    recentMessages,
    allConversations,
    feedbackItems,
    activeUsersWithConv,
    allMessages,
  ] = await Promise.all([
    // Messages in last 14 days (for per-day breakdown)
    db.message.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
    // All conversations with mode
    db.conversation.findMany({
      select: { mode: true },
    }),
    // All feedback with rating
    db.feedback.findMany({
      where: { rating: { not: null } },
      select: { rating: true },
    }),
    // Active users (had conversation in last 7 days)
    db.conversation.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    // All messages for model/provider tracking — select executionId as proxy
    db.message.findMany({
      where: { role: "ASSISTANT" },
      select: { executionId: true },
    }),
  ]);

  // Build messages per day for last 14 days
  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }
  for (const msg of recentMessages) {
    const key = msg.createdAt.toISOString().slice(0, 10);
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
  }
  const messagesPerDay: DayCount[] = Array.from(dayMap.entries()).map(
    ([date, count]) => ({ date, count })
  );

  // Conversations per mode
  const modeMap = new Map<string, number>();
  for (const conv of allConversations) {
    modeMap.set(conv.mode, (modeMap.get(conv.mode) ?? 0) + 1);
  }
  const conversationsPerMode = Array.from(modeMap.entries())
    .map(([mode, count]) => ({ mode, count }))
    .sort((a, b) => b.count - a.count);

  // Feedback rating distribution
  const ratingMap = new Map<number, number>();
  for (let i = 1; i <= 5; i++) ratingMap.set(i, 0);
  for (const fb of feedbackItems) {
    if (fb.rating !== null && fb.rating !== undefined) {
      const r = fb.rating as number;
      ratingMap.set(r, (ratingMap.get(r) ?? 0) + 1);
    }
  }
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  // Active users count
  const activeUserCount = activeUsersWithConv.length;

  // Model/execution counts — use executionId prefix as proxy for "provider"
  // Since we don't have model info in messages, we show total assistant responses and
  // count those with executionIds vs without as a proxy
  const withExecId = allMessages.filter((m) => m.executionId !== null).length;
  const withoutExecId = allMessages.filter(
    (m) => m.executionId === null
  ).length;

  const modeLabels: Record<string, string> = {
    QUIET_MIRROR: "Quiet Mirror",
    STRATEGIC_GOVERNANCE: "Strategic Governance",
    CONFLICT_DISSOLUTION: "Conflict Dissolution",
    PERSONAL_DISCIPLINE: "Personal Discipline",
    INSTITUTIONAL_JUDGMENT: "Institutional Judgment",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-8">Analytics</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Messages per day */}
        <section>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Messages per day (last 14 days)
          </h2>
          <div className="border border-gray-700 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                    Date
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">
                    Messages
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {messagesPerDay.map(({ date, count }) => {
                  const maxCount = Math.max(
                    ...messagesPerDay.map((d) => d.count),
                    1
                  );
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <tr
                      key={date}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                        {date}
                      </td>
                      <td className="px-4 py-2 text-right text-white text-xs font-medium">
                        {count}
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div
                            className="h-full bg-white rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conversations per mode */}
        <section>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Conversations per mode
          </h2>
          <div className="border border-gray-700 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                    Mode
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">
                    Count
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {conversationsPerMode.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-gray-500 text-xs"
                    >
                      No data.
                    </td>
                  </tr>
                )}
                {conversationsPerMode.map(({ mode, count }) => {
                  const maxCount = Math.max(
                    ...conversationsPerMode.map((m) => m.count),
                    1
                  );
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <tr
                      key={mode}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-300 text-xs">
                        {modeLabels[mode] ?? mode}
                      </td>
                      <td className="px-4 py-2 text-right text-white text-xs font-medium">
                        {count}
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div
                            className="h-full bg-white rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Feedback rating distribution */}
        <section>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Feedback rating distribution
          </h2>
          <div className="border border-gray-700 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                    Rating
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">
                    Count
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {ratingDistribution.map(({ rating, count }) => {
                  const maxCount = Math.max(
                    ...ratingDistribution.map((r) => r.count),
                    1
                  );
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <tr
                      key={rating}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-2 text-gray-300 text-xs">
                        {"★".repeat(rating)}{"☆".repeat(5 - rating)} ({rating})
                      </td>
                      <td className="px-4 py-2 text-right text-white text-xs font-medium">
                        {count}
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div
                            className="h-full bg-white rounded"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Active users + model usage */}
        <section className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Active users (last 7 days)
            </h2>
            <div className="border border-gray-700 rounded p-5">
              <p className="text-4xl font-semibold text-white">
                {activeUserCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Unique users with at least one conversation
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
              Model execution coverage
            </h2>
            <div className="border border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-400 text-xs">
                      Type
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-gray-400 text-xs">
                      Responses
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  <tr className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-2 text-gray-300 text-xs">
                      With execution ID
                    </td>
                    <td className="px-4 py-2 text-right text-white text-xs font-medium">
                      {withExecId}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-2 text-gray-300 text-xs">
                      Without execution ID
                    </td>
                    <td className="px-4 py-2 text-right text-white text-xs font-medium">
                      {withoutExecId}
                    </td>
                  </tr>
                  <tr className="bg-gray-900">
                    <td className="px-4 py-2 text-gray-400 text-xs font-medium">
                      Total assistant responses
                    </td>
                    <td className="px-4 py-2 text-right text-white text-xs font-bold">
                      {withExecId + withoutExecId}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
