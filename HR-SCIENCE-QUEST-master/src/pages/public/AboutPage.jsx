import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";

export default function AboutPage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState("login");

  const openAuth = (type) => {
    setAuthType(type || "login");
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">About HR Science Quest</h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Guiding students towards excellence in Board Exams, IIT-JEE, and NEET
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome to HR Science Quest</h2>
              <p className="text-gray-700 leading-relaxed text-lg mb-4">
                HR Science Quest is a dedicated educational platform created with the vision of guiding students 
                towards excellence in Board Exams, IIT-JEE, and NEET.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                This platform is powered by the experience and legacy of <span className="font-semibold text-blue-600">E = MC² Institute</span>, 
                which has been successfully running for the last <span className="font-semibold">15 years</span>, helping students build strong 
                concepts and achieve outstanding results in science.
              </p>
            </div>

            {/* Our Philosophy */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Teaching Philosophy</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                At HR Science Quest, we believe that learning science is not just about memorizing formulas, 
                but about understanding concepts deeply and applying them with confidence.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: "💡", text: "Strong conceptual clarity" },
                  { icon: "🎯", text: "Problem-solving skills" },
                  { icon: "📝", text: "Real exam-oriented preparation" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-gray-800">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Achievements</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                We are proud to share that through our guidance and teaching methods, many students have successfully 
                cracked <span className="font-semibold text-blue-600">IIT-JEE</span> and <span className="font-semibold text-blue-600">NEET</span>, 
                and achieved excellent results in board examinations.
              </p>
            </div>

            {/* YouTube Presence */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl p-8 mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">▶️</span>
                <h3 className="text-2xl font-bold text-gray-900">YouTube Platform</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                In addition to classroom learning, HR Science Quest is also growing as a YouTube platform, 
                where we provide high-quality educational content to reach and support students everywhere.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed">
                  To make quality science education accessible, affordable, and effective for every student, 
                  and to guide them from basics to top competitive levels.
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
                <p className="text-gray-700 leading-relaxed">
                  To create a generation of confident learners who can excel in academics and competitive 
                  exams like IIT-JEE and NEET.
                </p>
              </div>
            </div>

            {/* Legacy Badge */}
            <div className="mt-12 text-center">
              <div className="inline-block bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-6 py-3">
                <p className="text-gray-800 font-semibold">
                  ✨ 15+ Years of Excellence | Powered by E = MC² Institute ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "15+", label: "Years of Excellence" },
              { value: "10,000+", label: "Students Mentored" },
              { value: "500+", label: "IIT-JEE Selections" },
              { value: "800+", label: "NEET Selections" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-blue-100 mb-8">Join thousands of successful students on HR Science Quest</p>
          <button
            onClick={() => {
              setAuthType("student-register");
              setAuthOpen(true);
            }}
            className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Get Started Free
          </button>
        </div>
      </section>

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