import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";

import StudentSidebar from "../../components/student/StudentSidebar";
import { getStudentTests, startMcqTest } from "../../services/studentmcqService";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function StudentTests() {
  const navigate = useNavigate();
  const query = useQuery();
  const subjectId = query.get("subject_id");
  const subjectName = query.get("subject_name");

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTests = async () => {
      if (!subjectId) {
        setLoading(false);
        setTests([]);
        return;
      }

      try {
        setLoading(true);
        const data = await getStudentTests(Number(subjectId), 1, 50);
        setTests(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        setError(err.message || "Unable to load tests");
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [subjectId]);

  const handleStartTest = async (test) => {
    try {
      if (test.is_active === false) {
        throw new Error("This test is currently inactive.");
      }
      const res = await startMcqTest(test.test_id);
      navigate(`/student/tests/attempt/${res.attempt_id}`);
    } catch (err) {
      setError(err.message || "Unable to start test");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <button
                  type="button"
                  onClick={() => navigate("/student/subjects")}
                  className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to subjects
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Subject Tests
                </h1>
                <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
                  {subjectId
                    ? `Showing tests for ${subjectName || `subject #${subjectId}`}.`
                    : "Choose a subject first, then open its test list from the subjects page."}
                </p>
              </div>
              {subjectId ? (
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Selected Subject</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {subjectName || `Subject #${subjectId}`}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" />
              ))}
            </div>
          ) : !subjectId ? (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-12 text-center shadow-sm">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Choose a subject first</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Open the subjects page and select the subject you want to practice.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/subjects")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Browse Subjects
              </button>
            </div>
          ) : tests.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-12 text-center shadow-sm">
              <div className="text-gray-500 dark:text-gray-400">No tests found for this subject.</div>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {tests.map((test) => (
                <div
                  key={test.test_id}
                  className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400">Test</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{test.test_name}</div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Duration: {test.duration_minutes || test.duration || "-"} mins &bull; Max marks:{" "}
                    {test.max_total_marks || "-"}
                  </div>
                  <button
                    onClick={() => handleStartTest(test)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
