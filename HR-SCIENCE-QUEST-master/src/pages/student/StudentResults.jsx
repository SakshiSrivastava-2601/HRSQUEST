import StudentSidebar from "../../components/student/StudentSidebar";
import { useEffect, useState } from "react";
import { getSubjects } from "../../services/subjectService";
import { apiRequest } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function StudentResults() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getSubjects();
        setSubjects(data || []);
        if ((data || []).length > 0) setSubjectId(String(data[0].subject_id));
      } catch (e) {
        setError(e.message || "Failed to load subjects");
      }
    })();
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    (async () => {
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
    })();
  }, [subjectId]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your submitted tests and scores.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Submitted Tests</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? "Loading..." : `${results.length} attempts`}
              </span>
            </div>
            <div className="overflow-auto">
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
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
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
          </div>
        </div>
      </main>
    </div>
  );
}
