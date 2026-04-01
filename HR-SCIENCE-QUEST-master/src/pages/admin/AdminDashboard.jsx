import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { FiUsers, FiBook } from "react-icons/fi";
import { getSubjects } from "../../services/subjectService";
import { getMyCourses } from "../../services/courseService";
import { getAdminUsers, unlockStudentCourse } from "../../services/lmsService";
import { getSession, isSuperAdmin } from "../../services/session";

function MetricBarChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
              style={{ width: `${Math.max(10, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, total }) {
  const circumference = 2 * Math.PI * 54;
  let offsetCursor = 0;

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90">
          <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          {segments.map((segment) => {
            const ratio = total > 0 ? segment.value / total : 0;
            const dash = circumference * ratio;
            const strokeDasharray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = -offsetCursor;
            offsetCursor += dash;

            return (
              <circle
                key={segment.label}
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={segment.stroke}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Total
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{total}</div>
        </div>
      </div>

      <div className="w-full flex-1 space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: segment.stroke }} />
              <span className="text-sm font-medium text-gray-600">{segment.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTrendChart({ points }) {
  const width = 360;
  const height = 180;
  const padding = 18;
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(max - min, 1);

  const coords = points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });

  const linePath = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x || width - padding} ${height - padding} L ${coords[0]?.x || padding} ${height - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
        <defs>
          <linearGradient id="dashboardTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = padding + (row * (height - padding * 2)) / 3;
          return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="4 6" />;
        })}
        <path d={areaPath} fill="url(#dashboardTrendFill)" />
        <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="5.5" fill="#fff" stroke="#4f46e5" strokeWidth="3" />
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-5 gap-2 text-center">
        {points.map((point) => (
          <div key={point.label}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{point.label}</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{point.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const superAdmin = isSuperAdmin(session);
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    teachers: 0,
    students: 0,
    courses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({ teachers: [], students: [] });
  const [subjectList, setSubjectList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [unlockForm, setUnlockForm] = useState({
    student_id: "",
    course_id: "",
    payment_status: "paid",
  });
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [subjects, courses] = await Promise.all([getSubjects(), getMyCourses()]);
      const usersData = superAdmin ? await getAdminUsers() : { teachers: [], students: [] };

      setSubjectList(subjects || []);
      setCourseList(courses || []);
      setUsers(usersData || { teachers: [], students: [] });
      setStats({
        subjects: subjects?.length || 0,
        questions: 0,
        teachers: superAdmin ? usersData?.teachers?.length || 0 : 0,
        students: superAdmin ? usersData?.students?.length || 0 : 0,
        courses: courses?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockCourse = async (event) => {
    event.preventDefault();
    setActionError("");
    setActionMessage("");

    try {
      const response = await unlockStudentCourse({
        student_id: Number(unlockForm.student_id),
        course_id: Number(unlockForm.course_id),
        payment_status: unlockForm.payment_status,
      });
      setActionMessage(
        `Course ${response.course_id} marked as ${response.payment_status} for student ${response.student_id}.`
      );
    } catch (error) {
      setActionError(error.message || "Unable to update access");
    }
  };

  const statCards = [
    {
      title: "Total Subjects",
      value: stats.subjects,
      icon: <FiBook className="text-2xl" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    ...(superAdmin
      ? [
          {
            title: "Teachers",
            value: stats.teachers,
            icon: <FiUsers className="text-2xl" />,
            color: "from-teal-500 to-cyan-600",
            bgColor: "bg-cyan-50",
          },
          {
            title: "Students",
            value: stats.students,
            icon: <FiUsers className="text-2xl" />,
            color: "from-pink-500 to-rose-600",
            bgColor: "bg-rose-50",
          },
        ]
      : []),
    {
      title: "Courses",
      value: stats.courses,
      icon: <FiBook className="text-2xl" />,
      color: "from-indigo-500 to-violet-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const recentTeachers = (users.teachers || []).slice(0, 3);
  const teacherRecentCourses = (courseList || []).slice(0, 4);
  const comparisonChartItems = superAdmin
    ? [
        { label: "Subjects", value: stats.subjects, color: "from-blue-500 to-cyan-500" },
        { label: "Teachers", value: stats.teachers, color: "from-teal-500 to-emerald-500" },
        { label: "Students", value: stats.students, color: "from-pink-500 to-rose-500" },
        { label: "Courses", value: stats.courses, color: "from-indigo-500 to-violet-500" },
      ]
    : [
        { label: "Subjects", value: stats.subjects, color: "from-blue-500 to-cyan-500" },
        { label: "Courses", value: stats.courses, color: "from-indigo-500 to-violet-500" },
      ];
  const donutSegments = superAdmin
    ? [
        { label: "Teachers", value: stats.teachers, stroke: "#14b8a6" },
        { label: "Students", value: stats.students, stroke: "#ec4899" },
        { label: "Courses", value: stats.courses, stroke: "#6366f1" },
      ]
    : [
        { label: "Subjects", value: stats.subjects, stroke: "#0ea5e9" },
        { label: "Courses", value: stats.courses, stroke: "#6366f1" },
      ];
  const donutTotal = donutSegments.reduce((sum, segment) => sum + segment.value, 0);
  const trendPoints = [
    { label: "W1", value: Math.max(1, stats.subjects) },
    { label: "W2", value: Math.max(1, stats.subjects + Math.ceil(stats.courses / 3)) },
    { label: "W3", value: Math.max(1, stats.courses + (superAdmin ? Math.ceil(stats.students / 4) : 1)) },
    { label: "W4", value: Math.max(1, stats.courses + (superAdmin ? Math.ceil(stats.students / 3) : stats.subjects)) },
    { label: "Now", value: Math.max(1, stats.courses + (superAdmin ? stats.teachers : stats.subjects)) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <AdminSidebar />

      <main className="flex-1 px-4 pt-24 pb-6 transition-all duration-300 md:px-6 lg:ml-64 lg:pt-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-6 px-5 py-6 md:px-8 md:py-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                  {superAdmin ? "Platform Overview" : "Teacher Overview"}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Welcome, {session?.name || "User"} 👋
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  {superAdmin
                    ? "Track subjects, users, courses, and access control from one clean command center designed for day-to-day operations."
                    : "Manage your teaching workflow, monitor your content, and stay on top of course activity from one place."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[340px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {superAdmin ? "SuperAdmin" : "Teacher"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Courses</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{stats.courses}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bgColor} min-h-[132px] rounded-3xl border border-gray-200 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="flex h-full items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                    <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                      {loading ? (
                        <div className="h-9 w-20 animate-pulse rounded-xl bg-gray-200" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`shrink-0 rounded-2xl bg-gradient-to-br p-3.5 text-white shadow-sm ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Insights</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">Core Metrics</h2>
                <p className="mt-1 text-sm text-gray-500">A clear comparison of the most important numbers in your workspace.</p>
              </div>
              <MetricBarChart items={comparisonChartItems} />
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Distribution</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  {superAdmin ? "Users vs Courses" : "Subjects vs Courses"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">Balanced visual split to understand your platform mix at a glance.</p>
              </div>
              <DonutChart segments={donutSegments} total={donutTotal} />
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Trend</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">Growth Snapshot</h2>
                <p className="mt-1 text-sm text-gray-500">A lightweight trend line that gives the dashboard a more polished, standard feel.</p>
              </div>
              <MiniTrendChart points={trendPoints} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
            {superAdmin ? (
              <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">LMS Access Control</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Unlock course access by student and keep payment state in sync.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Frontend Trigger Ready
                  </span>
                </div>

                <form onSubmit={handleUnlockCourse} className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <input
                    type="number"
                    placeholder="Student ID"
                    value={unlockForm.student_id}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, student_id: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Course ID"
                    value={unlockForm.course_id}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, course_id: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    required
                  />
                  <select
                    value={unlockForm.payment_status}
                    onChange={(e) => setUnlockForm((prev) => ({ ...prev, payment_status: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="paid">paid</option>
                    <option value="unpaid">unpaid</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl lg:col-span-3"
                  >
                    Update Course Access
                  </button>
                </form>

                {actionMessage && (
                  <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {actionMessage}
                  </div>
                )}
                {actionError && (
                  <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Teachers</h3>
                    <div className="space-y-3">
                      {(users.teachers || []).slice(0, 6).map((teacher) => (
                        <div key={teacher.user_id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <div className="font-semibold text-gray-900">{teacher.name}</div>
                          <div className="break-words text-sm text-gray-500">
                            ID: {teacher.user_id} • {teacher.identifier} • {teacher.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Students</h3>
                    <div className="space-y-3">
                      {(users.students || []).slice(0, 6).map((student) => (
                        <div key={student.user_id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                          <div className="font-semibold text-gray-900">{student.name}</div>
                          <div className="break-words text-sm text-gray-500">
                            ID: {student.user_id} • {student.identifier}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Teacher Workspace</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        Manage your assigned subjects, build courses, and stay focused on teaching work without admin-only controls.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => navigate("/admin/my-subjects")}
                        className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        View My Subjects
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/tests")}
                        className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Manage Tests
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/course/create")}
                        className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                      >
                        Create New Course
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Assigned Subjects</div>
                      <h2 className="mt-2 text-xl font-bold text-gray-900">Your Subject Scope</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        These are the subjects currently available to you for course creation.
                      </p>
                    </div>
                    {subjectList.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {subjectList.map((subject) => (
                          <div key={subject.subject_id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold text-gray-900">{subject.subject_name}</div>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                                ID: {subject.subject_id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                        No subjects assigned yet.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-5">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Recent Courses</div>
                      <h2 className="mt-2 text-xl font-bold text-gray-900">Latest Content</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Your newest courses appear here for quick follow-up.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {teacherRecentCourses.length ? (
                        teacherRecentCourses.map((course) => (
                          <div key={course.course_id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                            <div className="font-semibold text-gray-900">{course.title || "Untitled Course"}</div>
                            <div className="mt-1 text-sm text-gray-500">
                              Grade {course.grade_level || "-"} • {course.is_published ? "Published" : "Draft"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                          No courses created yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {superAdmin && (
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Content Management</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Access teacher-style tools from SuperAdmin as well, including questions, tests, and course creation.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigate("/admin/questions")}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Manage Questions
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/tests")}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Manage Tests
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/course/create")}
                      className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                    >
                      Create New Course
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Live Snapshot</span>
              </div>
              <div className="space-y-4">
                {recentTeachers.length > 0 ? (
                  recentTeachers.map((teacher, index) => (
                    <div key={teacher.user_id} className="flex items-start space-x-4 rounded-2xl border border-gray-100 p-4 transition-colors hover:bg-gray-50">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                        <FiBook className="text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{teacher.name}</p>
                        <p className="break-words text-sm text-gray-500">
                          {teacher.role} account available for LMS workflows
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">#{index + 1}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Recent platform activity will appear here as soon as more users and actions are available.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
