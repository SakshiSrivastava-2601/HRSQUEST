import StudentSidebar from "../../components/student/StudentSidebar";
import { useCallback, useState } from "react";
import { getSubjects } from "../../services/subjectService";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";
import usePageRefresh from "../../hooks/usePageRefresh";

export default function StudentResults() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data || []);
      if ((data || []).length > 0) {
        setSubjectId((current) => current || String(data[0].subject_id));
      }
    } catch (e) {
      setError(e.message || "Failed to load subjects");
    }
  }, []);

  const loadResults = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError("");
    try {
      const list = await apiRequest(
        `/mcq/submitted_test?subject_id=${Number(subjectId)}&page=1&size=50`
      );
      setResults(list || []);
    } catch (e) {
      setError(e.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  usePageRefresh(loadSubjects);
  usePageRefresh(loadResults, [subjectId]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Your submitted tests and scores.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="w-full sm:w-auto px-3 py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s.subject_id} value={String(s.subject_id)}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Submitted Tests</h2>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {loading ? "Loading..." : `${results.length} attempts`}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3">Test</th>
                    <th className="text-left px-4 py-3">Submitted</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.attempt_id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.test_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.submit_time}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.final_score}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                          onClick={() => navigate(`/student/tests/result/${r.attempt_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No submitted tests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((r) => (
                <div key={r.attempt_id} className="p-4">
                  <div className="font-semibold text-gray-900 dark:text-white break-words">
                    {r.test_name}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Submitted</div>
                      <div className="text-gray-800 dark:text-gray-200 truncate">{r.submit_time || "—"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Score</div>
                      <div className="text-gray-800 dark:text-gray-200 font-semibold">{r.final_score ?? "—"}</div>
                    </div>
                  </div>
                  <button
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                    onClick={() => navigate(`/student/tests/result/${r.attempt_id}`)}
                  >
                    View Result
                  </button>
                </div>
              ))}
              {results.length === 0 && !loading && (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No submitted tests yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
