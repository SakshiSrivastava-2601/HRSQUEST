import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/student/StudentSidebar";
import { apiRequest } from "../../services/api";
import { getStudentCourses } from "../../services/lmsService";
import { getSession, syncStudentSessionProfile } from "../../services/session";
import { formatGradeLevel } from "../../utils/grade";
import usePageRefresh from "../../hooks/usePageRefresh";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [subjectTestCounts, setSubjectTestCounts] = useState({});
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    completedSubjects: 0,
    rank: 0,
  });
  const [showInactiveAlert, setShowInactiveAlert] = useState(false);
  const [inactiveTestName, setInactiveTestName] = useState("");
  const [courseSummary, setCourseSummary] = useState({
    total: 0,
    unlocked: 0,
    locked: 0,
  });

  const fetchSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      const data = await apiRequest("/subjects/info");
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
      setError(err.message);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const fetchProfileSummary = useCallback(async () => {
    try {
      const [profile, summary] = await Promise.all([
        apiRequest("/student/info"),
        apiRequest("/student/summary"),
      ]);

      syncStudentSessionProfile(profile);
      setStats({
        totalTests: Number(summary?.total_tests || 0),
        averageScore: Number(summary?.average_score || 0),
        completedSubjects: Number(summary?.completed_subjects || 0),
        rank: 0,
      });
    } catch (err) {
      console.error("Error fetching student summary:", err);
    }
  }, []);

  const fetchTests = async (subjectId) => {
    try {
      setLoadingTests(true);
      const data = await apiRequest(
        `/mcq/tests/student?subject_id=${Number(subjectId)}`
      );
      setTests(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchCourseSummary = useCallback(async () => {
    try {
      const courses = await getStudentCourses();
      const total = courses?.length || 0;
      const unlocked = (courses || []).filter((course) => course.is_unlocked).length;
      setCourseSummary({
        total,
        unlocked,
        locked: total - unlocked,
      });
    } catch (err) {
      console.error("Error fetching course summary:", err);
    }
  }, []);

  usePageRefresh(fetchSubjects);
  usePageRefresh(fetchCourseSummary);
  usePageRefresh(fetchProfileSummary);

  const handleStartTest = async (test) => {
    try {
      // Check if test is active
      if (test.is_active === false) {
        setInactiveTestName(test.test_name);
        setShowInactiveAlert(true);
        return;
      }

      // Test is active, proceed with starting
      const res = await apiRequest(
        `/mcq/tests/start?test_id=${test.test_id}`,
        { method: "PUT" }
      );

      navigate(`/student/tests/attempt/${res.attempt_id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoBack = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <StudentSidebar />

      {/* Inactive Test Alert Modal */}
      {showInactiveAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl text-red-600 dark:text-red-400 font-bold">!</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Test Not Available</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The test "<span className="font-semibold">{inactiveTestName}</span>" is currently inactive.
                Please contact your instructor or try again later when the test becomes active.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowInactiveAlert(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition duration-200 flex-1"
                >
                  Close
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition duration-200 flex-1"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-5 sm:px-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, <span className="text-blue-600 dark:text-blue-400">{session?.name || "Student"}</span>!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Select a subject and start your test preparation
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(session?.name || "S").slice(0, 1).toUpperCase()}
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {String(session?.grade_level || "").slice(0, 1) || "S"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-lg font-bold">!</span>
              </div>
              <div>
                <p className="font-medium text-red-900 dark:text-red-400">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Tests", value: stats.totalTests, colorClass: "bg-blue-50 dark:bg-blue-900/20", iconBg: "bg-blue-600", textColor: "text-blue-600 dark:text-blue-400" },
            { label: "Average Score", value: `${stats.averageScore}%`, colorClass: "bg-green-50 dark:bg-green-900/20", iconBg: "bg-green-600", textColor: "text-green-600 dark:text-green-400" },
            { label: "Unlocked Courses", value: courseSummary.unlocked, colorClass: "bg-indigo-50 dark:bg-indigo-900/20", iconBg: "bg-indigo-600", textColor: "text-indigo-600 dark:text-indigo-400" },
            { label: "Locked Courses", value: courseSummary.locked, colorClass: "bg-amber-50 dark:bg-amber-900/20", iconBg: "bg-amber-600", textColor: "text-amber-600 dark:text-amber-400" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`${stat.colorClass} rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center text-white text-lg font-bold`}>
                  {index === 0 ? "T" : index === 1 ? "%" : index === 2 ? "U" : "L"}
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-full rounded-full ${stat.iconBg}`}
                  style={{ width: `${Math.min(100, (index + 1) * 25)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <section className="mb-10 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Professional LMS Courses</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Test the new LMS flow here: see locked/unlocked courses, open full modules, and access secure videos/materials.
              </p>
            </div>
            <button
              onClick={() => navigate("/student/courses")}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition"
            >
              Open My Courses
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Published courses</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{courseSummary.total}</p>
            </div>
            <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-green-700 dark:text-green-400">Unlocked after payment</p>
              <p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-300">{courseSummary.unlocked}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">Still locked</p>
              <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-300">{courseSummary.locked}</p>
            </div>
          </div>
        </section>

        {/* Subjects Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h2>
              <p className="text-gray-500 dark:text-gray-400">Select a subject to view available tests</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm border border-gray-200 dark:border-gray-600">
                Sort A-Z
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm">
                View All
              </button>
            </div>
          </div>

          {loadingSubjects ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 dark:text-gray-500 text-2xl font-bold">?</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Subjects Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Subjects will appear here once your teacher adds them to the curriculum.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {subjects.map((sub) => (
                <button
                  key={sub.subject_id}
                  onClick={() => {
                    setSelectedSubject(sub);
                    fetchTests(sub.subject_id);
                  }}
                  className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden ${
                    selectedSubject?.subject_id === sub.subject_id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-md"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-lg font-bold ${
                    selectedSubject?.subject_id === sub.subject_id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-blue-600 group-hover:text-white"
                  } transition-colors`}>
                    {sub.subject_name?.charAt(0) || "S"}
                  </div>

                  {/* Subject Name */}
                  <h3 className={`font-semibold mb-1 text-sm ${
                    selectedSubject?.subject_id === sub.subject_id
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400"
                  } transition-colors`}>
                    {sub.subject_name}
                  </h3>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>{subjectTestCounts[sub.subject_id] || 0} Tests</span>
                  </div>

                  {/* Selected Indicator */}
                  {selectedSubject?.subject_id === sub.subject_id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Tests Section */}
        {selectedSubject && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Available Tests</span>
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                    {selectedSubject.subject_name}
                  </span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400">Start a test to practice and improve your skills</p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {tests.length} test{tests.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loadingTests ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                      </div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tests.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-amber-600 dark:text-amber-400 text-2xl font-bold">0</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Tests Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  There are no tests available for {selectedSubject.subject_name} yet.
                </p>
                <button
                  onClick={() => navigate("/student/subjects")}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Browse Other Subjects
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((t) => (
                  <div
                    key={t.test_id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Test Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">T</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 flex items-center gap-2 transition-colors">
                              {t.test_name}
                              {/* Inactive Badge */}
                              {t.is_active === false && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                                  Inactive
                                </span>
                              )}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                                {formatGradeLevel(t.target_grade_level)}
                              </span>
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs">
                                {t.duration_minutes} mins
                              </span>
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs">
                                {t.max_total_marks} marks
                              </span>
                              {/* Status Badge */}
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                                t.is_active === false
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              }`}>
                                {t.is_active === false ? "Not Available" : "Active"}
                              </span>
                              {/* Attempt-status pill */}
                              {t.attempt_status === "in_progress" && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold">
                                  In progress
                                </span>
                              )}
                              {t.attempt_status === "submitted" && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                                  Attempted{Number(t.attempts_count || 0) > 1 ? ` × ${t.attempts_count}` : ""}
                                  {t.best_score != null && (
                                    <span className="ml-1 opacity-80">· Best {Number(t.best_score)}</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => navigate(`/student/tests/${t.test_id}/info`)}
                          className="px-5 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                          View Details
                        </button>
                        {t.is_active === false ? (
                          <button
                            onClick={() => {
                              setInactiveTestName(t.test_name);
                              setShowInactiveAlert(true);
                            }}
                            className="px-6 py-2.5 bg-gray-400 dark:bg-gray-600 text-white rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                            title="Test is currently inactive"
                          >
                            Not Available
                          </button>
                        ) : (
                          (() => {
                            const status = t.attempt_status || "new";
                            const cta =
                              status === "in_progress"
                                ? { label: "Resume Test", className: "bg-amber-500 hover:bg-amber-600" }
                                : status === "submitted"
                                ? { label: "Re-attempt", className: "bg-indigo-600 hover:bg-indigo-700" }
                                : { label: "Start Test", className: "bg-green-600 hover:bg-green-700" };
                            return (
                              <button
                                onClick={() => handleStartTest(t)}
                                className={`px-6 py-2.5 ${cta.className} text-white rounded-lg font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 group`}
                              >
                                {cta.label}
                                <span className="group-hover:translate-x-1 transition-transform">&#8594;</span>
                              </button>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
