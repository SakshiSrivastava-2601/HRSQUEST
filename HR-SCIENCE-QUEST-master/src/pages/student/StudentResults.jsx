import StudentSidebar from "../../components/student/StudentSidebar";
import { useCallback, useMemo, useState } from "react";
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

  // Filters
  const [testFilter, setTestFilter] = useState(""); // "" = all tests, else test_id
  const [attemptFilter, setAttemptFilter] = useState("all"); // "all" | "best" | "latest"

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
        `/mcq/submitted_test?subject_id=${Number(subjectId)}&page=1&size=200`
      );
      setResults(list || []);
      // Reset filters when subject changes
      setTestFilter("");
      setAttemptFilter("all");
    } catch (e) {
      setError(e.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  usePageRefresh(loadSubjects);
  usePageRefresh(loadResults, [subjectId]);

  // Build the unique list of tests for the filter dropdown
  const testOptions = useMemo(() => {
    const map = new Map();
    (results || []).forEach((r) => {
      if (r?.test_id != null && !map.has(r.test_id)) {
        map.set(r.test_id, { test_id: r.test_id, test_name: r.test_name });
      }
    });
    return Array.from(map.values());
  }, [results]);

  // Stats per (test_id) — best score, latest attempt id, attempt count.
  const perTestStats = useMemo(() => {
    const stats = {};
    (results || []).forEach((r) => {
      const tid = r.test_id;
      if (tid == null) return;
      const s = stats[tid] || {
        bestScore: -Infinity,
        bestAttemptId: null,
        latestAttemptId: null,
        latestNumber: 0,
        count: 0,
      };
      const score = Number(r.final_score ?? -Infinity);
      if (score > s.bestScore) {
        s.bestScore = score;
        s.bestAttemptId = r.attempt_id;
      }
      const attemptNum = Number(r.attempt_number || 0);
      if (attemptNum > s.latestNumber) {
        s.latestNumber = attemptNum;
        s.latestAttemptId = r.attempt_id;
      }
      s.count += 1;
      stats[tid] = s;
    });
    return stats;
  }, [results]);

  const filteredResults = useMemo(() => {
    let rows = results;
    if (testFilter) {
      rows = rows.filter((r) => String(r.test_id) === String(testFilter));
    }
    if (attemptFilter === "best") {
      rows = rows.filter((r) => perTestStats[r.test_id]?.bestAttemptId === r.attempt_id);
    } else if (attemptFilter === "latest") {
      rows = rows.filter((r) => perTestStats[r.test_id]?.latestAttemptId === r.attempt_id);
    }
    return rows;
  }, [results, testFilter, attemptFilter, perTestStats]);

  const fmtScore = (r) => {
    if (r.final_score == null) return "—";
    if (r.max_total_marks != null) return `${Number(r.final_score)} / ${Number(r.max_total_marks)}`;
    return String(Number(r.final_score));
  };

  const attemptBadge = (r) => {
    const total = perTestStats[r.test_id]?.count || r.test_attempt_count || 0;
    if (!r.attempt_number) return null;
    return `Attempt ${r.attempt_number}${total > 1 ? ` / ${total}` : ""}`;
  };

  const isBest = (r) =>
    perTestStats[r.test_id]?.bestAttemptId === r.attempt_id &&
    (perTestStats[r.test_id]?.count || 0) > 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Your submitted tests and scores.
              </p>
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

          {/* Filter bar */}
          <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Test
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={testFilter}
                onChange={(e) => setTestFilter(e.target.value)}
              >
                <option value="">All tests</option>
                {testOptions.map((t) => (
                  <option key={t.test_id} value={String(t.test_id)}>
                    {t.test_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-56">
              <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Attempts
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={attemptFilter}
                onChange={(e) => setAttemptFilter(e.target.value)}
              >
                <option value="all">All attempts</option>
                <option value="best">Best per test</option>
                <option value="latest">Latest per test</option>
              </select>
            </div>
          </div>

          {/* Results list */}
          <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Submitted Tests
              </h2>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading..."
                  : `${filteredResults.length} of ${results.length} attempts`}
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3">Test</th>
                    <th className="text-left px-4 py-3">Attempt</th>
                    <th className="text-left px-4 py-3">Submitted</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((r) => (
                    <tr key={r.attempt_id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {r.test_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                            {attemptBadge(r) || "—"}
                          </span>
                          {isBest(r) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.submit_time}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        {fmtScore(r)}
                      </td>
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
                  {filteredResults.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {results.length === 0
                          ? "No submitted tests yet."
                          : "No attempts match the current filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filteredResults.map((r) => (
                <div key={r.attempt_id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-900 dark:text-white break-words">
                      {r.test_name}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                        {attemptBadge(r) || "—"}
                      </span>
                      {isBest(r) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                          Best
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Submitted</div>
                      <div className="text-gray-800 dark:text-gray-200 truncate">{r.submit_time || "—"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Score</div>
                      <div className="text-gray-800 dark:text-gray-200 font-semibold">{fmtScore(r)}</div>
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
              {filteredResults.length === 0 && !loading && (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {results.length === 0
                    ? "No submitted tests yet."
                    : "No attempts match the current filters."}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
