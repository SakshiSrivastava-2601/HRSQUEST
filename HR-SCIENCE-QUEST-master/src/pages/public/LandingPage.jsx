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

  // Enhanced stats
  const stats = [
    { value: "10K+", label: "MCQs", icon: "📚", color: "from-blue-500 to-cyan-400" },
    { value: "24x7", label: "Accessible", icon: "⏰", color: "from-purple-500 to-pink-500" },
    { value: "100+", label: "Concepts", icon: "💡", color: "from-amber-500 to-orange-500" },
    { value: "95%", label: "Success Rate", icon: "📈", color: "from-emerald-500 to-green-400" },
  ];

  // Enhanced features
  const features = [
    {
      title: "Adaptive Learning",
      description: "Personalized learning paths based on your performance",
      icon: "✨",
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-50"
    },
    {
      title: "Real-time Analytics",
      description: "Track progress with detailed performance insights",
      icon: "📊",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50"
    },
    {
      title: "Expert Guidance",
      description: "Teacher-created content and assessments",
      icon: "🏆",
      gradient: "bg-gradient-to-br from-amber-50 to-orange-50"
    }
  ];

  // Learning categories with enhanced details
  const categories = [
    {
      title: "School Foundation",
      description: "Class-wise conceptual learning with interactive modules",
      icon: "📖",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      stats: "Grades 10-12"
    },
    {
      title: "Competitive Prep",
      description: "MCQs & mock tests for various entrance exams",
      icon: "🎯",
      color: "text-red-600",
      bgColor: "bg-red-100",
      stats: "JEE, NEET, UPSC"
    },
    {
      title: "Skill Building",
      description: "Practice-oriented growth with real-world applications",
      icon: "⚡",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      stats: "500+ Skills"
    }
  ];

  // How it works steps
  const steps = [
    {
      number: "01",
      title: "Learn Concepts",
      description: "Interactive lessons with animations",
      icon: "📚",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      number: "02",
      title: "Practice MCQs",
      description: "Topic-wise practice with explanations",
      icon: "✅",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      number: "03",
      title: "Attempt Tests",
      description: "Timed mock tests with rankings",
      icon: "🏆",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      number: "04",
      title: "Track Progress",
      description: "Detailed analytics and insights",
      icon: "📈",
      gradient: "from-emerald-500 to-green-400"
    }
  ];

  // Courses/Services short description
  const courses = [
    {
      title: "Class 10 Foundation",
      description: "Complete syllabus coverage with NCERT & exemplar problems",
      duration: "1 Year",
      level: "Beginner to Advanced"
    },
    {
      title: "Class 12 Board Prep",
      description: "Board exam focused preparation with PYQs and sample papers",
      duration: "1 Year",
      level: "Intermediate"
    },
    {
      title: "JEE Main + Advanced",
      description: "Complete IIT-JEE preparation with concept videos & test series",
      duration: "2 Years",
      level: "Advanced"
    },
    {
      title: "NEET UG",
      description: "Medical entrance preparation with Biology, Physics & Chemistry",
      duration: "2 Years",
      level: "Advanced"
    },
    {
      title: "Competitive Edge",
      description: "Crash courses for Olympiads, NTSE, and other scholarship exams",
      duration: "6 Months",
      level: "All Levels"
    },
    {
      title: "Skill Development",
      description: "Coding, Communication & Career readiness programs",
      duration: "3-6 Months",
      level: "Beginner Friendly"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <Navbar openAuth={openAuth} />

      {/* ================= ENHANCED HERO SECTION ================= */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 lg:pt-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* LEFT CONTENT */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span className="text-yellow-300">✨</span>
                <span className="text-sm font-semibold text-white">
                  India's #1 Learning Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Master Every Concept with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mt-2">
                  HR Science Quest
                </span>
              </h1>

              <p className="text-xl text-gray-200 max-w-2xl">
                Interactive learning, smart practice, and personalized guidance —
                everything you need to excel in your academic journey.
              </p>
              

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => {
                    setAuthType("login");
                    setAuthOpen(true);
                  }}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <span>▶</span>
                  Start Learning Free
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>

                <button
                  onClick={() => {
                    setAuthType("login");
                    setAuthOpen(true);
                  }}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Teach on Platform
                </button>
              </div>

              {/* Trust indicators */}
              <div className="pt-8">
                <div className="flex items-center gap-6 text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🛡️</span>
                    <span>Secure Platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">👥</span>
                    <span>50,000+ Students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT - ENHANCED CARD */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-white/20 shadow-2xl">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl rotate-12 shadow-xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    What You'll Achieve
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Concept Mastery with Interactive Lessons",
                      "Personalized Practice Sessions",
                      "Real-time Performance Analytics",
                      "Expert Teacher Guidance",
                      "Certificate of Completion",
                      "24/7 Progress Tracking"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-200">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-300">Average Improvement</p>
                        <p className="text-2xl font-bold text-white">+87%</p>
                      </div>
                      <div className="w-20 h-20">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">87%</span>
                          </div>
                          <svg className="w-20 h-20" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeDasharray="87, 100"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ENHANCED STATS BAR ================= */}
      <section className="relative -mt-16 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg transform group-hover:-translate-y-1 transition-all duration-300"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white text-xl mb-4`}>
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-full font-semibold mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Smarter Learning Experience
            </h2>
            <p className="text-xl text-gray-600">
              Our platform adapts to your learning style for maximum efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.gradient} rounded-3xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2`}
              >
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-lg text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {feature.description}
                </p>
                <button className="text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  Learn More
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COURSES SECTION ================= */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 rounded-full font-semibold mb-4">
              Our Courses
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Programs We Offer
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive courses designed for academic excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 border border-gray-100"
              >
                <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl text-white text-2xl mb-6">
                  📘
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {course.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {course.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                  <span>⏱️ {course.duration}</span>
                  <span>📊 {course.level}</span>
                </div>
                <button
                  onClick={() => {
                    setAuthType("student-register");
                    setAuthOpen(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  Enroll Now
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ENHANCED CATEGORIES ================= */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Learning Categories
            </h2>
            <p className="text-xl text-gray-600">
              Structured pathways for every learning goal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 border border-gray-100"
              >
                <div className={`inline-flex p-4 ${category.bgColor} rounded-2xl text-2xl mb-6`}>
                  <span className={category.color}>
                    {category.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
                <div className="text-sm font-semibold text-gray-500 mb-6">
                  {category.stats}
                </div>
                <button className="w-full py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-gray-600">
                  Explore Category
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ENHANCED HOW IT WORKS ================= */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to transform your learning journey
            </p>
          </div>

          <div className="relative">
            {/* Connection line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 transform -translate-y-1/2"></div>

            <div className="grid lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 group">
                    {/* Step number badge */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className={`inline-flex p-4 bg-gradient-to-r ${step.gradient} text-white rounded-2xl text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {step.icon}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>

                    {/* Step connector */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= ENHANCED CTA ================= */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:40px_40px]"></div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl text-2xl mb-6">
            🏆
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>

          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of successful students who have improved their scores with HR Science Quest
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setAuthType("student-register");
                setAuthOpen(true);
              }}
              className="group px-10 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              Get Started Free
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </button>

            <button
              onClick={() => {
                setAuthType("student-login");
                setAuthOpen(true);
              }}
              className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </button>
          </div>

          <p className="text-blue-100 mt-8">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
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