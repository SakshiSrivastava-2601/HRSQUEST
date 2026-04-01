import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Lock,
  Menu,
  PlayCircle,
  X,
} from "lucide-react";
import StudentSidebar from "../../components/student/StudentSidebar";
import { getStudentCourseDetail, getStudentCourses } from "../../services/lmsService";
import {
  createRazorpayOrder,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "../../services/paymentService";
import { resolveApiUrl } from "../../services/api";

const extractYouTubeId = (url) => {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return m?.[1] || null;
};
const extractVimeoId = (url) => {
  if (!url) return null;
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] || null;
};
const saveCompleted = (cid, map) => {
  try { localStorage.setItem(`completed_${cid}`, JSON.stringify(map)); } catch {}
};
const loadCompleted = (cid) => {
  try {
    const s = localStorage.getItem(`completed_${cid}`);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
};

export default function StudentVideoPlayer() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lockedMeta, setLockedMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(location.state?.lessonId || null);
  const [openSections, setOpenSections] = useState({});
  const [completedMap, setCompletedMap] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => { setCompletedMap(loadCompleted(courseId)); }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudentCourseDetail(courseId);
      setCourse(data);
      setLockedMeta(null);
      const init = {};
      (data?.modules || []).forEach((m, i) => { init[String(m.section_id || i)] = true; });
      setOpenSections(init);
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
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const normalizedModules = useMemo(() => {
    const modules = course?.modules || [];
    return modules.map((module, mi) => ({
      ...module,
      lessons: (module.lessons || []).map((lesson, li) => ({
        ...lesson,
        _lessonKey: lesson.lesson_id || `${module.section_id || mi}-${li}`,
        _moduleTitle: module.title || `Day ${mi + 1}`,
      })),
    }));
  }, [course]);

  const allLessons = useMemo(
    () => normalizedModules.flatMap((m) => m.lessons || []),
    [normalizedModules]
  );

  const selectedLesson = useMemo(
    () => allLessons.find((l) => String(l._lessonKey) === String(selectedLessonId)) || allLessons[0] || null,
    [allLessons, selectedLessonId]
  );

  useEffect(() => {
    if (!selectedLesson && allLessons.length > 0) setSelectedLessonId(allLessons[0]._lessonKey);
  }, [allLessons, selectedLesson]);

  const completedCount = allLessons.filter((l) => completedMap[l._lessonKey]).length;
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleSection = (id) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));

  const toggleComplete = (key, e) => {
    e?.stopPropagation();
    const updated = { ...completedMap, [key]: !completedMap[key] };
    setCompletedMap(updated);
    saveCompleted(courseId, updated);
  };

  const handleSelectLesson = (lesson) => {
    setSelectedLessonId(lesson._lessonKey);
    setActiveTab("description");
    if (!completedMap[lesson._lessonKey]) {
      const updated = { ...completedMap, [lesson._lessonKey]: true };
      setCompletedMap(updated);
      saveCompleted(courseId, updated);
    }
    setSidebarOpen(false);
  };

  const handleDownloadNotes = () => {
    if (!selectedLesson) return;
    const content = selectedLesson.notes || selectedLesson.description ||
      `Notes for: ${selectedLesson.title || "Lesson"}\n\nNo notes available.`;
    const blob = new Blob(
      [`${selectedLesson.title || "Notes"}\n${"=".repeat(50)}\n\n${content}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedLesson.title || "notes").replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        key: order.key_id, amount: order.amount, currency: order.currency,
        name: "HR Science Quest", description: `Course #${order.course_id}`,
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
          } else setPayMessage("Payment received, pending confirmation.");
        },
        theme: { color: "#2563EB" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setPayMessage(err.message || "Payment failed");
    } finally { setPaying(false); }
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

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <StudentSidebar />
        <div className="flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center shadow-lg">
            <Lock className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Course Locked
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            {lockedMeta && (
              <>
                <button
                  onClick={handlePayAndUnlock}
                  disabled={paying}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white disabled:opacity-60 transition"
                >
                  <CreditCard className="h-4 w-4" />
                  {paying ? "Processing..." : "Pay & Unlock"}
                </button>
                {payMessage && (
                  <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{payMessage}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const videoUrl = selectedLesson?.video_url;
  const youtubeId = extractYouTubeId(videoUrl);
  const vimeoId = extractVimeoId(videoUrl);
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;

  const attachments = selectedLesson?.attachments || [];
  const pdfAttachments = attachments.filter((a) => {
    const t = String(a.resource_type || "").toLowerCase();
    const m = String(a.mime_type || "").toLowerCase();
    const u = String(a.file_url || "").toLowerCase();
    return t.includes("pdf") || m.includes("pdf") || u.endsWith(".pdf");
  });
  const otherAttachments = attachments.filter((a) => !pdfAttachments.includes(a));

  /* -- SIDEBAR CONTENT (shared between desktop and mobile drawer) -- */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          Content
        </h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden h-8 w-8 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {normalizedModules.map((module, moduleIndex) => {
          const moduleId = String(module.section_id || moduleIndex);
          const isOpen = !!openSections[moduleId];
          const lessons = module.lessons || [];
          const completedInModule = lessons.filter((l) => completedMap[l._lessonKey]).length;

          return (
            <div key={moduleId} className="border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => toggleSection(moduleId)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {module.title || `Day ${moduleIndex + 1}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {completedInModule} of {lessons.length}
                    {module.duration ? ` \u2022 ${module.duration}` : ""}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                )}
              </button>

              {isOpen && lessons.map((lesson, li) => {
                const isCompleted = !!completedMap[lesson._lessonKey];
                const isActive = String(selectedLesson?._lessonKey) === String(lesson._lessonKey);
                const lessonAtts = lesson.attachments || [];

                return (
                  <button
                    key={lesson._lessonKey}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition border-l-[3px] ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-500"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <div
                      role="checkbox"
                      aria-checked={isCompleted}
                      onClick={(e) => toggleComplete(lesson._lessonKey, e)}
                      className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center border-2 cursor-pointer transition ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-emerald-400"
                      }`}
                    >
                      {isCompleted && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        isActive
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-gray-300"
                      }`}>
                        <span className="text-gray-500 dark:text-gray-400 mr-1 text-xs">
                          {String(li + 1).padStart(2, "0")}
                        </span>
                        {lesson.title || `Lesson ${li + 1}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        {lesson.video_url && <span>Video</span>}
                        {lessonAtts.length > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Resources ({lessonAtts.length})
                          </span>
                        )}
                        {lesson.duration && <span>{lesson.duration}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 space-y-2.5 bg-white dark:bg-gray-800">
        <button
          onClick={handleDownloadNotes}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-sm font-semibold text-white transition"
        >
          <Download className="h-4 w-4" />
          Download Notes
        </button>
        <Link
          to={`/student/courses/${courseId}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Course Overview
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors">
      {/* Top nav */}
      <StudentSidebar />

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-32 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {completedCount}/{totalLessons}
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 transition"
        >
          <Menu className="h-3.5 w-3.5" />
          Content
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video + Tabs */}
        <div className="flex flex-col flex-1 overflow-y-auto min-w-0">
          {/* Video */}
          <div className="bg-black w-full shrink-0" style={{ aspectRatio: "16/9" }}>
            {videoUrl ? (
              embedUrl ? (
                <iframe
                  key={String(selectedLesson?._lessonKey)}
                  title={selectedLesson?.title || "Video"}
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  key={String(selectedLesson?._lessonKey)}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full"
                  src={resolveApiUrl(videoUrl)}
                />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <PlayCircle className="h-16 w-16 text-gray-600" />
                <p className="text-sm text-gray-500">No video for this lesson</p>
              </div>
            )}
          </div>

          {/* Below video */}
          <div className="p-4 md:p-6 flex-1 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <button
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {course?.title}
                </button>
                {selectedLesson?._moduleTitle && (
                  <>
                    <span className="mx-1.5">&rsaquo;</span>
                    <span>{selectedLesson._moduleTitle}</span>
                  </>
                )}
              </p>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {selectedLesson?.title || "Select a lesson"}
              </h1>

              {/* Tabs */}
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-5">
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                  {["description", "resources", "qna"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-sm font-medium capitalize transition ${
                        activeTab === tab
                          ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {tab === "qna" ? "Q&A" : tab === "resources" ? `Resources (${attachments.length})` : "Description"}
                    </button>
                  ))}
                </div>
                <div className="p-4 md:p-5">
                  {activeTab === "description" && (
                    <p className="text-sm leading-7 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedLesson?.description || selectedLesson?.notes || "No description available."}
                    </p>
                  )}
                  {activeTab === "resources" && (
                    <div className="space-y-3">
                      {attachments.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No resources for this lesson.</p>
                      ) : (
                        [...pdfAttachments, ...otherAttachments].map((att) => (
                          <a
                            key={att.resource_id}
                            href={resolveApiUrl(att.file_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white truncate">{att.resource_title}</span>
                            </div>
                            <Download className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0 ml-3" />
                          </a>
                        ))
                      )}
                    </div>
                  )}
                  {activeTab === "qna" && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Q&amp;A coming soon.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-[360px] xl:w-[400px] shrink-0 flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Drawer overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
          <div
            className="w-[85vw] max-w-sm bg-white dark:bg-gray-800 flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}
