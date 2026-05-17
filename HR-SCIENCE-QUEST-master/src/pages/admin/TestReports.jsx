import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getTestReports } from "../../services/testService";
import { formatGradeLevel } from "../../utils/grade";
import {
  FiArrowLeft,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiAward,
  FiTarget,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.max(0, Math.round(Number(seconds)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="text-lg" />
        </div>
      </div>
      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default function TestReports() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // "all" | "best" | "latest" — when more than one attempt per student exists
  const [attemptFilter, setAttemptFilter] = useState("all");
  // Grade filter — value is a grade_level (number as string) or "all"
  const [gradeFilter, setGradeFilter] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getTestReports(testId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load test reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const test = data?.test;
  const summary = data?.summary;
  const attempts = data?.attempts || [];

  // Per-student grouping: attempt index (chronological), total attempts,
  // best attempt id, latest attempt id. Computed once across the full set so
  // that "Attempt 2 of 3" stays correct even after status/search filters.
  const perStudentStats = (() => {
    const stats = {};
    const byStudent = {};
    attempts.forEach((a) => {
      const sid = a.student_id;
      if (sid == null) return;
      if (!byStudent[sid]) byStudent[sid] = [];
      byStudent[sid].push(a);
    });
    Object.entries(byStudent).forEach(([sid, list]) => {
      // Sort chronologically by start_time string (IST formatted, sortable as text)
      list.sort((x, y) => String(x.start_time || "").localeCompare(String(y.start_time || "")));
      let bestId = null;
      let bestScore = -Infinity;
      list.forEach((a, i) => {
        const score = a.is_submitted ? Number(a.final_score ?? -Infinity) : -Infinity;
        if (score > bestScore) {
          bestScore = score;
          bestId = a.attempt_id;
        }
        stats[a.attempt_id] = {
          attempt_number: i + 1,
          total_attempts: list.length,
          best_attempt_id: null, // filled below
          latest_attempt_id: list[list.length - 1].attempt_id,
        };
      });
      list.forEach((a) => {
        stats[a.attempt_id].best_attempt_id = bestId;
      });
    });
    return stats;
  })();

  // Build the list of distinct grades present in the data so the dropdown
  // shows only grades that actually have attempts (avoids dead options).
  const gradeOptions = Array.from(
    new Set(
      attempts
        .map((a) => a.grade_level)
        .filter((g) => g !== null && g !== undefined && g !== "")
    )
  ).sort((a, b) => Number(a) - Number(b));

  const filteredAttempts = attempts.filter((a) => {
    if (statusFilter === "submitted" && !a.is_submitted) return false;
    if (statusFilter === "in_progress" && a.is_submitted) return false;
    if (gradeFilter !== "all" && String(a.grade_level) !== String(gradeFilter)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = `${a.student_name || ""} ${a.student_email || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (attemptFilter === "best") {
      const s = perStudentStats[a.attempt_id];
      if (!s || s.best_attempt_id !== a.attempt_id) return false;
    } else if (attemptFilter === "latest") {
      const s = perStudentStats[a.attempt_id];
      if (!s || s.latest_attempt_id !== a.attempt_id) return false;
    }
    return true;
  });

  // Sort: highest score first among submitted
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (a.is_submitted && !b.is_submitted) return -1;
    if (!a.is_submitted && b.is_submitted) return 1;
    return (b.final_score ?? 0) - (a.final_score ?? 0);
  });

  const passPercentage = (a) => {
    if (!a.is_submitted || !test?.max_total_marks) return null;
    const pct = (a.final_score / test.max_total_marks) * 100;
    return Number.isFinite(pct) ? Math.round(pct) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <AdminSidebar />

      <main className="min-h-screen pt-24 transition-all duration-300 lg:ml-64 lg:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Back + Title */}
          <button
            onClick={() => navigate("/admin/tests")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft /> Back to Tests
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Test Reports</h1>
              {test ? (
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  <span className="font-semibold text-gray-900">{test.test_name}</span>
                  {test.subject_name ? <> · {test.subject_name}</> : null}
                  <> · {formatGradeLevel(test.target_grade_level)}</>
                  <> · {test.duration_minutes} min</>
                  <> · Max {test.max_total_marks} marks</>
                </p>
              ) : (
                <p className="text-gray-500 text-sm mt-1">Loading test details…</p>
              )}
            </div>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-semibold disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
              <StatCard
                icon={FiUsers}
                label="Total Attempts"
                value={summary.total_attempts}
                accent="bg-indigo-100 text-indigo-700"
              />
              <StatCard
                icon={FiCheckCircle}
                label="Submitted"
                value={summary.submitted_attempts}
                accent="bg-emerald-100 text-emerald-700"
              />
              <StatCard
                icon={FiClock}
                label="In Progress"
                value={summary.in_progress_attempts}
                accent="bg-amber-100 text-amber-700"
              />
              <StatCard
                icon={FiTrendingUp}
                label="Avg Score"
                value={summary.average_score?.toFixed(2) ?? "0"}
                accent="bg-blue-100 text-blue-700"
              />
              <StatCard
                icon={FiAward}
                label="Highest"
                value={summary.highest_score?.toFixed(2) ?? "0"}
                accent="bg-purple-100 text-purple-700"
              />
              <StatCard
                icon={FiTarget}
                label="Avg Time"
                value={formatDuration(summary.average_time_seconds)}
                accent="bg-rose-100 text-rose-700"
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              title="Filter attempts by the student's grade"
            >
              <option value="all">All grades</option>
              {gradeOptions.map((g) => (
                <option key={g} value={String(g)}>
                  {formatGradeLevel(g)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted only</option>
              <option value="in_progress">In progress only</option>
            </select>
            <select
              value={attemptFilter}
              onChange={(e) => setAttemptFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              title="When a student has multiple attempts, narrow to best or latest"
            >
              <option value="all">All attempts</option>
              <option value="best">Best per student</option>
              <option value="latest">Latest per student</option>
            </select>
          </div>

          {/* Attempts table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Attempts</h2>
              <span className="text-sm text-gray-500">
                {loading ? "Loading…" : `${sortedAttempts.length} of ${attempts.length}`}
              </span>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Grade</th>
                    <th className="text-left px-4 py-3">Attempt</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Score</th>
                    <th className="text-right px-4 py-3">Correct / Wrong</th>
                    <th className="text-right px-4 py-3">Duration</th>
                    <th className="text-left px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttempts.map((a, idx) => {
                    const pct = passPercentage(a);
                    const ps = perStudentStats[a.attempt_id];
                    const attemptLabel = ps
                      ? `Attempt ${ps.attempt_number}${ps.total_attempts > 1 ? ` / ${ps.total_attempts}` : ""}`
                      : "—";
                    const isBest = ps && ps.best_attempt_id === a.attempt_id && ps.total_attempts > 1;
                    return (
                      <tr
                        key={a.attempt_id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {a.student_name || "—"}
                          </div>
                          <div className="text-xs text-gray-500">{a.student_email || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.grade_level ? formatGradeLevel(a.grade_level) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                              {attemptLabel}
                            </span>
                            {isBest && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {a.is_submitted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                              In progress
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.is_submitted ? (
                            <div>
                              <span className="font-bold text-gray-900">
                                {Number(a.final_score).toFixed(2)}
                              </span>
                              {test?.max_total_marks ? (
                                <span className="text-xs text-gray-500"> / {test.max_total_marks}</span>
                              ) : null}
                              {pct !== null ? (
                                <div
                                  className={`text-xs font-semibold ${
                                    pct >= 75
                                      ? "text-emerald-600"
                                      : pct >= 40
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {pct}%
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {a.is_submitted
                            ? `${a.total_correct ?? 0} / ${a.total_incorrect ?? 0}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatDuration(a.duration_seconds)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {a.submit_time || a.start_time || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && sortedAttempts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        {attempts.length === 0
                          ? "No one has attempted this test yet."
                          : "No attempts match your filter."}
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
