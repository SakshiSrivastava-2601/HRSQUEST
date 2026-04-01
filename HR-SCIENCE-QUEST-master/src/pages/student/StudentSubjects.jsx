import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, ClipboardList, Layers3 } from "lucide-react";

import StudentSidebar from "../../components/student/StudentSidebar";
import { getSubjects } from "../../services/subjectService";
import { apiRequest } from "../../services/api";

export default function StudentSubjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectTestCounts, setSubjectTestCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const data = await getSubjects();
        setSubjects(data || []);
        const counts = await Promise.all(
          (data || []).map(async (subject) => {
            try {
              const testList = await apiRequest(
                `/mcq/tests/student?subject_id=${Number(subject.subject_id)}`
              );
              return [subject.subject_id, Array.isArray(testList) ? testList.length : 0];
            } catch {
              return [subject.subject_id, 0];
            }
          })
        );
        setSubjectTestCounts(Object.fromEntries(counts));
      } catch (err) {
        setError(err.message || "Unable to load subjects");
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                  Subject Explorer
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Choose Your Subject
                </h1>
                <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
                  Browse subjects first, then open tests only when you are ready. This keeps the learning flow clearer and easier to follow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Subjects</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{subjects.length}</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Tests Visible</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {Object.values(subjectTestCounts).reduce((sum, value) => sum + Number(value || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-56 animate-pulse rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-12 text-center shadow-sm">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No subjects found</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Subjects will appear here once created by admin.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject.subject_id}
                  className="group rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      ID: {subject.subject_id}
                    </span>
                  </div>

                  <div className="mt-5">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {subject.subject_name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Open this subject when you want to review the available tests in a separate focused screen.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <Layers3 className="h-4 w-4" />
                        Subject
                      </div>
                      <div className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                        Ready
                      </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <ClipboardList className="h-4 w-4" />
                        Tests
                      </div>
                      <div className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                        {subjectTestCounts[subject.subject_id] || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Review subject first, then continue to tests.
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/student/tests?subject_id=${subject.subject_id}&subject_name=${encodeURIComponent(
                            subject.subject_name || ""
                          )}`
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      View Tests
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
