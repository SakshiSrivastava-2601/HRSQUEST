import Navbar from "../../components/common/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";
import { getLastVisitedPath, getSession } from "../../services/session";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState("login");
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    const targetPath = getLastVisitedPath(session);
    if (targetPath && targetPath !== "/") {
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);

  const openAuth = (type) => {
    setAuthType(type || "login");
    setAuthOpen(true);
  };

  const openRegister = () => {
    setAuthType("student-register");
    setAuthOpen(true);
  };

  const openLogin = () => {
    setAuthType("login");
    setAuthOpen(true);
  };

  const heroStats = [
    { value: "5000+", label: "Active Students" },
    { value: "10K+", label: "Practice MCQs" },
    { value: "95%", label: "Success Rate" },
    { value: "24×7", label: "Doubt Support" },
  ];

  const tracks = [
    {
      title: "Foundation",
      subtitle: "Class 9 & 10",
      description: "Strong NCERT base, JEE / NEET foundation concepts, Olympiad prep, and chapter-wise tests.",
      icon: "🌱",
      accent: "from-emerald-500 to-teal-500",
      pill: "Grade 9–10",
    },
    {
      title: "JEE / NEET",
      subtitle: "Class 11 & 12",
      description: "Board mastery alongside JEE / NEET concept depth, PYQs, and full-length mock series.",
      icon: "🚀",
      accent: "from-blue-500 to-indigo-600",
      pill: "Grade 11–12",
    },
    {
      title: "Dropper Edge",
      subtitle: "Repeating after Class 12",
      description: "Rank-focused JEE / NEET revision, daily mocks, and a personal mentor through the year.",
      icon: "🎯",
      accent: "from-purple-500 to-pink-500",
      pill: "Dropper",
    },
  ];

  const batches = [
    {
      badge: "FOUNDATION",
      badgeColor: "bg-emerald-100 text-emerald-700",
      title: "Foundation Pack — Class 9 & 10",
      grade: "Class 9–10",
      languages: ["Hinglish"],
      features: [
        "NCERT line-by-line lessons",
        "JEE / NEET foundation concepts",
        "Olympiad & school exam prep",
      ],
      teachers: 8,
      priceOriginal: 4999,
      priceFinal: 2999,
    },
    {
      badge: "JEE TRACK",
      badgeColor: "bg-blue-100 text-blue-700",
      title: "JEE Edge — Class 11",
      grade: "Class 11",
      languages: ["English", "Hinglish"],
      features: [
        "Physics, Chemistry, Maths",
        "PYQ-rich practice sets",
        "Topic + chapter mock tests",
      ],
      teachers: 10,
      priceOriginal: 9999,
      priceFinal: 5999,
    },
    {
      badge: "NEET TRACK",
      badgeColor: "bg-emerald-100 text-emerald-700",
      title: "NEET Edge — Class 11",
      grade: "Class 11",
      languages: ["Hinglish"],
      features: [
        "Physics, Chemistry, Biology",
        "NCERT line-by-line revision",
        "Daily MCQ practice + analytics",
      ],
      teachers: 10,
      priceOriginal: 9999,
      priceFinal: 5999,
    },
    {
      badge: "JEE TRACK",
      badgeColor: "bg-indigo-100 text-indigo-700",
      title: "JEE Mastery — Class 12",
      grade: "Class 12",
      languages: ["English", "Hinglish"],
      features: [
        "Boards + JEE dual prep",
        "Full-length AITS mock series",
        "Rank predictor & analytics",
      ],
      teachers: 12,
      priceOriginal: 12999,
      priceFinal: 7499,
    },
    {
      badge: "NEET TRACK",
      badgeColor: "bg-rose-100 text-rose-700",
      title: "NEET Mastery — Class 12",
      grade: "Class 12",
      languages: ["Hinglish"],
      features: [
        "Boards + NEET dual prep",
        "Biology revision capsules",
        "AIIMS-level mock series",
      ],
      teachers: 12,
      priceOriginal: 12999,
      priceFinal: 7499,
    },
    {
      badge: "DROPPER",
      badgeColor: "bg-purple-100 text-purple-700",
      title: "Dropper Strategy — JEE / NEET",
      grade: "Dropper",
      languages: ["English", "Hinglish"],
      features: [
        "Full syllabus revision",
        "Daily live + recorded classes",
        "1:1 mentor & rank-focused plan",
      ],
      teachers: 14,
      priceOriginal: 14999,
      priceFinal: 8999,
    },
  ];

  const features = [
    { icon: "📡", title: "Live + Recorded", description: "Attend classes live or revisit any session anytime, on any device." },
    { icon: "📝", title: "Test-First Practice", description: "Topic, chapter and full-length tests with deep analytics on every attempt." },
    { icon: "👨‍🏫", title: "Mentor Support", description: "Personal mentor and 24×7 doubt-solving from subject experts." },
    { icon: "📊", title: "Rank Predictor", description: "AI-driven performance tracking and a clear week-on-week improvement plan." },
  ];

  const steps = [
    { number: "01", title: "Choose your track", description: "Pick Class 9-10, 11-12, or Dropper based on your current goal.", icon: "🎯" },
    { number: "02", title: "Attend live classes", description: "Concept + practice in every session, recorded for instant revision.", icon: "🎥" },
    { number: "03", title: "Take daily tests", description: "Topic-wise, chapter-wise, and full mocks with all-India ranking.", icon: "📝" },
    { number: "04", title: "Track and improve", description: "Get analytics, weak-area drills, and one-on-one mentor calls.", icon: "📈" },
  ];

  const testimonials = [
    {
      name: "Class 10 Student",
      achievement: "Foundation Pack",
      quote:
        "Chapter-wise MCQ practice helped me find exactly where I was weak. By exam time, every concept was clicking.",
      avatar: "🎓",
      avatarBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      rating: 5,
    },
    {
      name: "Class 12 Student",
      achievement: "JEE Mastery Track",
      quote:
        "The Hinglish concept videos + daily JEE mocks made the heavy syllabus actually manageable. My speed and accuracy both improved.",
      avatar: "📘",
      avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      rating: 5,
    },
    {
      name: "Dropper Student",
      achievement: "JEE / NEET Strategy Plan",
      quote:
        "Weekly mentor calls and the rank-focused mock series kept me sharp. Doubt-solving response time was the real game-changer this year.",
      avatar: "🎯",
      avatarBg: "bg-gradient-to-br from-purple-500 to-pink-500",
      rating: 5,
    },
  ];

  const formatPrice = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <Navbar openAuth={openAuth} />

      {/* ================= HERO ================= */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-12 lg:pt-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-8 text-white">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-sm font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Trusted by 5000+ Foundation, JEE & NEET aspirants
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1]">
                Crack JEE, NEET & Boards,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-300 to-fuchsia-300 mt-2">
                  Smarter, Together.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl">
                Live classes, expert faculty, and unlimited practice — purpose-built for Foundation (Class 9–10), JEE and NEET aspirants from Class 11 to Dropper.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={openRegister}
                  className="group px-8 py-4 bg-gradient-to-r from-amber-400 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  Get Started Free
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <a
                  href="#batches"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300 text-center"
                >
                  Explore Batches
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
                {heroStats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-xs sm:text-sm text-indigo-200 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              {/* Floating decorative cards */}
              <div className="hidden lg:block absolute -left-10 top-10 z-20 animate-float">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-2xl border border-white/40 flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Today's MCQs</p>
                    <p className="text-sm font-bold text-gray-900">+250 attempted</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute -right-6 top-1/2 z-20 animate-float-slow [animation-delay:1s]">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-2xl border border-white/40 flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Avg. rating</p>
                    <p className="text-sm font-bold text-gray-900">4.8 / 5</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute -left-4 -bottom-4 z-20 animate-float-fast [animation-delay:2s]">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-2xl border border-white/40 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">Live now</p>
                    <p className="text-sm font-bold text-gray-900">Class 12 Physics</p>
                  </div>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-amber-400 to-pink-500 rounded-2xl rotate-12 shadow-xl"></div>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Why HRsQuest</p>
                  <h3 className="text-2xl font-bold text-white mt-2 mb-6">
                    A complete prep ecosystem
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "JEE / NEET concept videos by expert faculty",
                      "Daily MCQs and PYQs with instant explanations",
                      "Full-length mocks with all-India performance ranking",
                      "Personal mentor + 24×7 doubt support",
                      "Hinglish & English language options",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-indigo-100">
                        <span className="mt-1 flex-shrink-0 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= GRADE TRACKS ================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Find your track</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Built for Foundation, JEE & NEET aspirants
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Whether you're laying down NCERT fundamentals or chasing an All-India Rank in JEE / NEET — there's a batch for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tracks.map((t) => (
              <div key={t.title} className="group relative bg-white rounded-3xl p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${t.accent} transition-opacity`}></div>
                <div className={`relative inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${t.accent} text-white text-2xl items-center justify-center mb-6`}>
                  {t.icon}
                </div>
                <span className="relative inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full mb-3">
                  {t.pill}
                </span>
                <h3 className="relative text-xl font-bold text-gray-900">{t.title}</h3>
                <p className="relative text-sm text-gray-500 mb-3">{t.subtitle}</p>
                <p className="relative text-gray-600">{t.description}</p>
                <button
                  onClick={openRegister}
                  className={`relative mt-6 inline-flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r ${t.accent} font-semibold hover:opacity-80`}
                >
                  Explore batches →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED BATCHES ================= */}
      <section id="batches" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Popular batches</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                Featured 2026 batches
              </h2>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Live classes, recorded backups, daily tests, and a mentor in your corner.
              </p>
            </div>
            <button
              onClick={openRegister}
              className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
            >
              View all batches →
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((b) => (
              <div key={b.title} className="group relative bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${b.badgeColor}`}>
                      {b.badge}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{b.grade}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">{b.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {b.languages.map((lang) => (
                      <span key={lang} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <ul className="space-y-2">
                    {b.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>👨‍🏫 {b.teachers} expert mentors</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
                    {b.priceFinal === 0 ? (
                      <p className="text-xl font-bold text-emerald-600">Free</p>
                    ) : (
                      <div>
                        <span className="text-sm text-gray-400 line-through mr-2">{formatPrice(b.priceOriginal)}</span>
                        <span className="text-xl font-bold text-gray-900">{formatPrice(b.priceFinal)}</span>
                      </div>
                    )}
                    <button
                      onClick={openRegister}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      Explore →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS STRIP ================= */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:30px_30px]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Why students pick HRsQuest</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {heroStats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl sm:text-5xl font-extrabold">{s.value}</p>
                <p className="text-sm sm:text-base text-indigo-100 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Why HRsQuest</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Everything you need under one roof
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-50 hover:bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              From day one to your final attempt
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full">
                  STEP {step.number}
                </div>
                <div className="text-3xl mt-4 mb-3">{step.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-indigo-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Student stories</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
              Real students. Real progress.
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Stories from students learning with HRsQuest — in their own words.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                  i === 1 ? "lg:-mt-6" : ""
                }`}
              >
                {/* Decorative gradient corner */}
                <div className={`absolute -top-3 -right-3 w-16 h-16 rounded-2xl ${t.avatarBg} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>

                {/* Big quote mark */}
                <span className="absolute top-4 right-6 text-7xl text-indigo-100 leading-none font-serif select-none">
                  &ldquo;
                </span>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                    <span key={idx} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>

                <p className="relative text-gray-700 leading-relaxed text-[15px]">
                  {t.quote}
                </p>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                  <div
                    className={`w-14 h-14 rounded-full ${t.avatarBg} flex items-center justify-center text-2xl shadow-lg ring-4 ring-white`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">{t.achievement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-12 lg:px-16 lg:py-16 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:30px_30px]"></div>
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Start your prep today —
                  <span className="block text-amber-300">your batch is waiting.</span>
                </h2>
                <p className="mt-4 text-indigo-100 max-w-xl">
                  Free trial classes, full demo content, and zero credit card needed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:justify-end gap-4">
                <button
                  onClick={openRegister}
                  className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold hover:bg-amber-300 hover:text-gray-900 transition"
                >
                  Get Started Free →
                </button>
                <button
                  onClick={openLogin}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold border border-white/30 hover:bg-white/20 transition"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ENHANCED FOOTER ================= */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white text-xl">
                  📚
                </div>
                <span className="text-2xl font-bold text-white">HR SCIENCE QUEST</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                A modern learning platform designed to help students master concepts through interactive lessons, smart practice, and personalized guidance.
              </p>
              <div className="flex gap-4">
                {/* YouTube Link */}
                <a
                  href="https://www.youtube.com/@HR-Science-Quest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 cursor-pointer transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* Instagram Link */}
                <a
                  href="https://www.instagram.com/hrsciquest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 cursor-pointer transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 cursor-pointer transition-colors">
                  <span className="text-sm font-semibold">📘</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">QUICK LINKS</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="hover:text-white cursor-pointer transition-colors block">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-white cursor-pointer transition-colors block">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white cursor-pointer transition-colors block">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Address */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">CONTACT US</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email:</p>
                  <a href="mailto:hrsciencequest@gmail.com" className="text-white hover:text-blue-400 transition-colors">
                    hrsciencequest@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone:</p>
                  <a href="tel:+919693613221" className="text-white hover:text-blue-400 transition-colors">
                    +91 9693613221
                  </a>
                </div>
              </div>
            </div>

            {/* Legal & Data Collection */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">LEGAL</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy-policy" className="hover:text-white cursor-pointer transition-colors block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white cursor-pointer transition-colors block">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-white cursor-pointer transition-colors block">
                    Refund Policy
                  </Link>
                </li>
              </ul>

            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
            <p>© 2025 HR SCIENCE QUEST. All Rights Reserved.</p>
            <p className="mt-2">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              {" • "}
              <Link to="/terms" className="hover:text-white transition-colors ml-2">
                Terms of Service
              </Link>
              {" • "}
              <Link to="/refund-policy" className="hover:text-white transition-colors ml-2">
                Refund Policy
              </Link>
              {" • "}
              <Link to="/contact" className="hover:text-white transition-colors ml-2">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal - UNCHANGED */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)}>
        {authType === "login" && (
          <UnifiedLoginForm
            onSuccess={({ role }) => {
              setAuthOpen(false);
              if (role === "teacher" || role === "superadmin") {
                navigate("/admin/dashboard");
                return;
              }
              navigate("/student/dashboard");
            }}
            switchToRegister={() => setAuthType("student-register")}
          />
        )}

        {authType === "student-register" && (
          <StudentRegisterForm
            onSuccess={() => {
              setAuthType("login");
            }}
            switchToLogin={() => setAuthType("login")}
          />
        )}
      </AuthModal>
    </div>
  );
}
