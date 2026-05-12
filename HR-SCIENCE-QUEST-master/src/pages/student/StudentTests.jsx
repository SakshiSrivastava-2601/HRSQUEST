import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";

import StudentSidebar from "../../components/student/StudentSidebar";
import { getStudentTests, startMcqTest } from "../../services/studentmcqService";
import usePageRefresh from "../../hooks/usePageRefresh";

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

  const loadTests = useCallback(async () => {
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
  }, [subjectId]);

  usePageRefresh(loadTests, [subjectId]);

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
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-slate-50 to-blue-50 dark:bg-none dark:bg-gray-800 shadow-sm">
            <div className="flex flex-col gap-4 sm:gap-5 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <button
                  type="button"
                  onClick={() => navigate("/student/subjects")}
                  className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Back to subjects</span>
                  <span className="sm:hidden">Back</span>
                </button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Subject Tests
                </h1>
                <p className="mt-2 sm:mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400 md:text-base">
                  {subjectId
                    ? `Showing tests for ${subjectName || `subject #${subjectId}`}.`
                    : "Choose a subject first, then open its test list from the subjects page."}
                </p>
              </div>
              {subjectId ? (
                <div className="self-start md:self-auto rounded-2xl border border-white/70 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 px-3 py-2 sm:px-4 sm:py-3 shadow-sm backdrop-blur">
                  <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Selected Subject</div>
                  <div className="mt-0.5 sm:mt-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {subjectName || `Subject #${subjectId}`}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {error && (
            <div className="mt-4 sm:mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" />
              ))}
            </div>
          ) : !subjectId ? (
            <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-12 text-center shadow-sm">
              <BookOpen className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">Choose a subject first</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Open the subjects page and select the subject you want to practice.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/subjects")}
                className="mt-4 sm:mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Browse Subjects
              </button>
            </div>
          ) : tests.length === 0 ? (
            <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-12 text-center shadow-sm">
              <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No tests found for this subject.</div>
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div
                  key={test.test_id}
                  className="flex flex-col rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Test</div>
                  <div className="mt-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 break-words">
                    {test.test_name}
                  </div>

                  {test.description && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-3 break-words">
                      {test.description}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    <div className="rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/20 px-1.5 py-2">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Duration</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {test.duration_minutes || test.duration || "-"} min
                      </div>
                    </div>
                    <div className="rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-2">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">Max Marks</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {test.max_total_marks || "-"}
                      </div>
                    </div>
                    <div className="rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-900/20 px-1.5 py-2">
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold">Questions</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {test.total_questions ?? "-"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest(test)}
                    className="mt-4 sm:mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm transition"
                  >
                    <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
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
