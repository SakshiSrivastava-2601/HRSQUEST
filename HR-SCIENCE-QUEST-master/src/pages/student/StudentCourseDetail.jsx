import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  IndianRupee,
  Lock,
  PlayCircle,
  Zap,
} from "lucide-react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getStudentCourseDetail, getStudentCourses } from "../../services/lmsService";
import {
  createRazorpayOrder,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "../../services/paymentService";
import usePageRefresh from "../../hooks/usePageRefresh";

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lockedMeta, setLockedMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [openSections, setOpenSections] = useState({});
  const [showAllSections, setShowAllSections] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const loadCourseData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentCourseDetail(courseId);
      setCourse(data);
      setLockedMeta(null);
      setOpenSections((prev) => {
        if (prev && Object.keys(prev).length) return prev;
        const init = {};
        (data?.modules || []).forEach((m, i) => {
          init[String(m.section_id || i)] = i === 0;
        });
        return init;
      });
    } catch (err) {
      setCourse(null);
      setError(err.message || "Unable to load course");
      try {
        const courses = await getStudentCourses();
        const meta = (courses || []).find(
          (item) => Number(item.course_id) === Number(courseId)
        );
        setLockedMeta(meta || null);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  usePageRefresh(loadCourseData, [courseId]);

  const normalizedModules = useMemo(() => {
    const modules = course?.modules || [];
    return modules.map((module, moduleIndex) => ({
      ...module,
      lessons: (module.lessons || []).map((lesson, lessonIndex) => ({
        ...lesson,
        _lessonKey:
          lesson.lesson_id || `${module.section_id || moduleIndex}-${lessonIndex}`,
      })),
    }));
  }, [course]);

  const allLessons = useMemo(
    () => normalizedModules.flatMap((m) => m.lessons || []),
    [normalizedModules]
  );

  const completedMap = useMemo(() => {
    try {
      const saved = localStorage.getItem(`completed_${courseId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, [courseId]);

  const completedCount = allLessons.filter((l) => completedMap[l._lessonKey]).length;
  const totalLessons = allLessons.length;
  const progressPercent =
    totalLessons > 0 ? ((completedCount / totalLessons) * 100).toFixed(2) : "0.00";

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handlePayAndUnlock = async () => {
    try {
      setPaying(true);
      setPayMessage("");
      await loadRazorpayScript();
      const order = await createRazorpayOrder(courseId);
      if (order?.payment_status === "paid") {
        setPayMessage("Course unlocked successfully.");
        await loadCourseData();
        return;
      }
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "HR Science Quest",
        description: `Course #${order.course_id}`,
        order_id: order.order_id,
        handler: async (response) => {
          const verified = await verifyRazorpayPayment({
            course_id: order.course_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verified?.payment_status === "paid") {
            setPayMessage("Payment successful. Course unlocked.");
            await loadCourseData();
          } else {
            setPayMessage("Payment received, confirmation pending.");
          }
        },
        theme: { color: "#2563EB" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setPayMessage(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <StudentSidebar />
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  /* -- LOCKED COURSE: PRICING PLANS -- */
  if (error && !course) {
    const basePrice = Number(lockedMeta?.price || 0);
    const proPrice = basePrice > 0 ? Math.round(basePrice * 1.6) : 0;
    const isFree = basePrice === 0;

    const standardFeatures = [
      "Access to all video lessons",
      "Downloadable resources",
      "Progress tracking",
      "Access on any device",
    ];
    const proFeatures = [
      ...standardFeatures,
      "1-on-1 mentor support",
      "Course completion certificate",
      "Priority community access",
      "Lifetime content updates",
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <StudentSidebar />

        <main className="px-4 py-6 md:px-8 lg:px-10">
          <div className="max-w-4xl mx-auto">
            {/* Course preview card */}
            {lockedMeta && (
              <div className="rounded-2xl overflow-hidden shadow-lg mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="relative h-48 bg-blue-600">
                  {lockedMeta.thumbnail_url ? (
                    <img
                      src={lockedMeta.thumbnail_url}
                      alt={lockedMeta.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-14 w-14 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                        Course Locked
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-white">{lockedMeta.title}</h1>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Unlock this course and start learning today
              </p>
            </div>

            {/* Plans grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Standard */}
              <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                  Standard
                </p>
                <div className="flex items-end gap-1 mb-1">
                  {isFree ? (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      Free
                    </span>
                  ) : (
                    <>
                      <IndianRupee className="h-6 w-6 text-gray-900 dark:text-white mb-1.5" />
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {basePrice.toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  One-time payment
                </p>
                <ul className="space-y-3 flex-1 mb-6">
                  {standardFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handlePayAndUnlock}
                  disabled={paying}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 dark:border-blue-500 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60 transition"
                >
                  <CreditCard className="h-4 w-4" />
                  {paying ? "Processing..." : isFree ? "Enroll Free" : "Buy Standard"}
                </button>
              </div>

              {/* Professional */}
              <div className="rounded-2xl border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-800 p-6 flex flex-col relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" /> Most Popular
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
                  Professional
                </p>
                <div className="flex items-end gap-1 mb-1">
                  {isFree ? (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      Free
                    </span>
                  ) : (
                    <>
                      <IndianRupee className="h-6 w-6 text-gray-900 dark:text-white mb-1.5" />
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {proPrice.toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  One-time payment
                </p>
                <ul className="space-y-3 flex-1 mb-6">
                  {proFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handlePayAndUnlock}
                  disabled={paying}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-60 transition"
                >
                  <CreditCard className="h-4 w-4" />
                  {paying ? "Processing..." : isFree ? "Enroll Free" : "Buy Professional"}
                </button>
              </div>
            </div>

            {payMessage && (
              <div className="mt-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 text-center">
                {payMessage}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* -- COURSE DETAIL: UNLOCKED -- */
  const totalSections = normalizedModules.length;
  const firstLesson = allLessons[0] || null;
  const SECTIONS_VISIBLE = 3;
  const DESC_LIMIT = 200;
  const desc = course?.description || "";
  const descLong = desc.length > DESC_LIMIT;
  const visibleDesc = descLong && !descExpanded ? desc.slice(0, DESC_LIMIT).trimEnd() : desc;
  const visibleModules = showAllSections ? normalizedModules : normalizedModules.slice(0, SECTIONS_VISIBLE);
  const hiddenCount = totalSections - SECTIONS_VISIBLE;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />

      <main className="max-w-4xl mx-auto px-4 py-8 md:px-6">

        {/* -- Top card: thumbnail + title + progress + Continue -- */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Thumbnail */}
            <div className="relative w-full sm:w-56 md:w-64 shrink-0 h-44 sm:h-auto bg-blue-600">
              {course?.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-14 w-14 text-white/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between p-5 flex-1 gap-4">
              <div>
                <button
                  onClick={() => navigate("/student/courses")}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
                >
                  &larr; Back to courses
                </button>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-snug">
                  {course?.title}
                </h1>
              </div>

              <div>
                <button
                  onClick={() =>
                    navigate(`/student/courses/${courseId}/watch`, {
                      state: { lessonId: firstLesson?._lessonKey },
                    })
                  }
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 transition"
                >
                  {Number(progressPercent) > 0 ? "Continue" : "Start"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -- Contents -- */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Contents</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {totalSections} section{totalSections !== 1 ? "s" : ""} &bull;{" "}
              {totalLessons} lecture{totalLessons !== 1 ? "s" : ""}
            </p>
          </div>

          <div>
            {visibleModules.map((module, moduleIndex) => {
              const moduleId = String(module.section_id || moduleIndex);
              const isOpen = !!openSections[moduleId];
              const lessons = module.lessons || [];
              const completedInModule = lessons.filter((l) => completedMap[l._lessonKey]).length;

              return (
                <div key={moduleId} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(moduleId)}
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {module.title || `Day ${moduleIndex + 1}`}
                      </span>
                    </div>
                    <span className="shrink-0 ml-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {lessons.length} lecture{lessons.length !== 1 ? "s" : ""}
                      {completedInModule > 0 ? ` \u2022 ${completedInModule}/${lessons.length}` : ""}
                      {module.duration ? ` \u2022 ${module.duration}` : ""}
                    </span>
                  </button>

                  {/* Lessons */}
                  {isOpen && lessons.map((lesson, lessonIndex) => {
                    const isCompleted = !!completedMap[lesson._lessonKey];
                    const attachments = lesson.attachments || [];

                    return (
                      <button
                        key={lesson._lessonKey}
                        onClick={() =>
                          navigate(`/student/courses/${courseId}/watch`, {
                            state: { lessonId: lesson._lessonKey },
                          })
                        }
                        className="flex w-full items-center gap-3 pl-10 pr-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/20 transition border-t border-gray-100 dark:border-gray-700 group"
                      >
                        <div
                          className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center border-2 transition ${
                            isCompleted
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-gray-300 dark:border-gray-600 group-hover:border-blue-600"
                          }`}
                        >
                          {isCompleted && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <PlayCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {lesson.title || `Lesson ${lessonIndex + 1}`}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {attachments.length > 0 && `Resources (${attachments.length})`}
                          {attachments.length > 0 && lesson.duration ? " \u2022 " : ""}
                          {lesson.duration || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Show more sections */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllSections(!showAllSections)}
              className="w-full py-3.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition border-t border-gray-100 dark:border-gray-700"
            >
              {showAllSections
                ? "Show less"
                : `${hiddenCount} more section${hiddenCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        {/* -- Description -- */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5 md:p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            Description
          </h2>
          <p className="text-sm leading-7 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
            {visibleDesc}
            {descLong && !descExpanded && (
              <button
                onClick={() => setDescExpanded(true)}
                className="ml-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                ...more
              </button>
            )}
          </p>
          {descLong && descExpanded && (
            <button
              onClick={() => setDescExpanded(false)}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Show less
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
