import StudentSidebar from "../../components/student/StudentSidebar";
import { useCallback, useMemo, useState } from "react";
import { getSubjects } from "../../services/subjectService";
import { apiRequest } from "../../services/api";
import usePageRefresh from "../../hooks/usePageRefresh";

export default function StudentProgress() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const subs = await getSubjects();
      setSubjects(subs || []);

      // Aggregate last attempts by calling submitted_test per subject (fast enough for small subject list).
      const lists = await Promise.all(
        (subs || []).map((s) =>
          apiRequest(`/mcq/submitted_test?subject_id=${Number(s.subject_id)}&page=1&size=50`).catch(
            () => []
          )
        )
      );
      const combined = lists.flat();
      combined.sort((a, b) => String(b.submit_time || "").localeCompare(String(a.submit_time || "")));
      setAttempts(combined);
    } catch (e) {
      setError(e.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(loadProgress);

  const stats = useMemo(() => {
    const total = attempts.length;
    const scores = attempts.map((a) => Number(a.final_score || 0));
    const avg = total ? scores.reduce((x, y) => x + y, 0) / total : 0;
    const best = total ? Math.max(...scores) : 0;
    return { total, avg, best };
  }, [attempts]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your overall performance snapshot.</p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{loading ? "Loading..." : ""}</div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">Submitted Tests</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">Average Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.avg.toFixed(2)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">Best Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.best}</div>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{subjects.length} subjects</span>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3">Test</th>
                    <th className="text-left px-4 py-3">Submitted</th>
                    <th className="text-left px-4 py-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 20).map((a) => (
                    <tr key={a.attempt_id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{a.test_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.submit_time}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.final_score}</td>
                    </tr>
                  ))}
                  {attempts.length === 0 && !loading && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
