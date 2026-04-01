import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiBook, FiLayers } from "react-icons/fi";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { getSubjects } from "../../services/subjectService";
import { getMyCourses } from "../../services/courseService";

export default function TeacherSubjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [subjectData, courseData] = await Promise.all([
          getSubjects(),
          getMyCourses(),
        ]);
        setSubjects(subjectData || []);
        setCourses(courseData || []);
      } catch (err) {
        setError(err.message || "Unable to load your subjects.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const courseCountsBySubject = useMemo(() => {
    return (courses || []).reduce((acc, course) => {
      const key = Number(course.subject_id || 0);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [courses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                  Teaching Scope
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  My Subjects
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  Review all subjects assigned to you and jump straight into building courses for each one.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Assigned Subjects</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{subjects.length}</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Courses Created</div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">{courses.length}</div>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-3xl border border-gray-200 bg-white shadow-sm" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
              <FiBook className="mx-auto mb-4 text-4xl text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900">No subjects assigned yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Ask SuperAdmin to assign subjects so you can start creating course content.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => {
                const subjectCourseCount = courseCountsBySubject[Number(subject.subject_id)] || 0;
                return (
                  <div
                    key={subject.subject_id}
                    className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FiBook className="text-2xl" />
                      </div>
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Subject ID: {subject.subject_id}
                      </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900">{subject.subject_name}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Build lessons and course structure for this assigned subject.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <FiLayers />
                          Courses
                        </div>
                        <div className="mt-2 text-xl font-semibold text-gray-900">{subjectCourseCount}</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </div>
                        <div className="mt-2 text-base font-semibold text-emerald-700">Assigned</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        Open your courses area to create or manage related content.
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/courses")}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Open Courses
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
