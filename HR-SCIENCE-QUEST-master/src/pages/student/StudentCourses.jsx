import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, BookLock, IndianRupee, Lock, PlayCircle } from "lucide-react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getStudentCourses } from "../../services/lmsService";

export default function StudentCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getStudentCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "Unable to load courses"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <StudentSidebar />

      <main className="px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Learning
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Browse and purchase courses
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  <div className="h-48 animate-pulse bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                    <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                No courses yet
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Courses you enroll in will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progress = Number(course.progress_percentage || 0);
                const locked = !course.is_unlocked;
                const price = Number(course.price || 0);
                const isFree = price === 0;

                return (
                  <article
                    key={course.course_id}
                    onClick={() => navigate(`/student/courses/${course.course_id}`)}
                    className="group rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden bg-blue-600">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          {locked ? (
                            <BookLock className="h-12 w-12 text-white/50" />
                          ) : (
                            <BookOpen className="h-12 w-12 text-white/50" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                      {/* Price badge */}
                      <div className={`absolute top-2.5 right-2.5 flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-bold shadow ${
                        isFree ? "bg-emerald-500 text-white" : "bg-white text-gray-900"
                      }`}>
                        {isFree ? "Free" : (
                          <><IndianRupee className="h-3 w-3" />{price.toLocaleString("en-IN")}</>
                        )}
                      </div>

                      {/* Lock badge */}
                      {locked && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                          <Lock className="h-3 w-3" />
                          Locked
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-4">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h2>

                      {course.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {course.description}
                        </p>
                      )}

                      {course.teacher_name && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          By {course.teacher_name}
                        </p>
                      )}

                      {/* Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${course.course_id}`); }}
                        className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                          locked
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {locked ? (
                          <><Lock className="h-3.5 w-3.5" />View Plans</>
                        ) : (
                          <><PlayCircle className="h-3.5 w-3.5" />{progress > 0 ? "Continue" : "Start"}</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
