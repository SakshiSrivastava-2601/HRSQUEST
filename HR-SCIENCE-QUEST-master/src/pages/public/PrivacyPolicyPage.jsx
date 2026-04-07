import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Your privacy matters to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-gray-300 mt-4">Last Updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* Introduction */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                HR Science Quest ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our learning platform, website, and services.
              </p>
            </div>

            {/* Data We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information You Provide:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><span className="font-semibold">Contact Information:</span> Name, email address, phone number</li>
                  <li><span className="font-semibold">Account Credentials:</span> Username, password, profile information</li>
                  <li><span className="font-semibold">Academic Information:</span> Grade/class, subjects of interest, learning goals</li>
                  <li><span className="font-semibold">Payment Information:</span> Transaction details (processed securely via Razorpay)</li>
                  <li><span className="font-semibold">Communication:</span> Messages, feedback, support requests</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><span className="font-semibold">Usage Data:</span> Course progress, test scores, time spent, learning patterns</li>
                  <li><span className="font-semibold">Device Information:</span> IP address, browser type, operating system</li>
                  <li><span className="font-semibold">Cookies:</span> Preferences and session data for better user experience</li>
                </ul>
              </div>
            </div>

            {/* How We Use Data */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Provide and maintain our educational services",
                  "Personalize learning experience based on your progress",
                  "Process payments and prevent fraud",
                  "Communicate updates, offers, and support",
                  "Analyze and improve platform performance",
                  "Generate progress reports and analytics",
                  "Ensure platform security and prevent abuse",
                  "Comply with legal obligations"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Third-Party Tools */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Third-Party Tools & Services</h2>
              <p className="text-gray-700 mb-4">We use the following third-party services to enhance our platform:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="font-semibold">Razorpay:</span>
                  <span className="text-gray-600">Secure payment processing. Your payment details are encrypted and never stored on our servers.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="font-semibold">Analytics Tools:</span>
                  <span className="text-gray-600">To understand user behavior and improve our services.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="font-semibold">Cloud Hosting:</span>
                  <span className="text-gray-600">Secure storage of your data on encrypted servers.</span>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>256-bit SSL encryption for all data transmission</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Secure authentication protocols</li>
                <li>Limited employee access to user data</li>
                <li>Regular data backups</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed 
                to provide you services. You may request account deletion at any time, and we will remove 
                your personal information within 30 days, subject to legal retention requirements.
              </p>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Access your personal data",
                  "Correct inaccurate information",
                  "Delete your account and data",
                  "Opt-out of marketing communications",
                  "Download your data",
                  "Restrict data processing"
                ].map((right, index) => (
                  <div key={index} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                    <span className="text-blue-500 text-xl">🔒</span>
                    <span className="text-gray-700">{right}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our platform is designed for students of all ages. For students under 18, we recommend 
                parental guidance and consent. We do not knowingly collect personal information from 
                children without parental consent. Parents/guardians may review or request deletion of 
                their child's information by contacting us.
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies to enhance your experience, remember preferences, and analyze platform usage. 
                You can control cookie settings through your browser preferences. Essential cookies cannot 
                be disabled as they're required for platform functionality.
              </p>
            </div>

            {/* Updates to Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                via email or platform notification. Continued use of our services constitutes acceptance 
                of the updated policy.
              </p>
            </div>

            {/* Contact for Privacy */}
            <div className="bg-green-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Privacy Questions?</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">📧 <span className="font-semibold">Email:</span> hrsciencequest@gmail.com</p>
                <p className="text-gray-700">📞 <span className="font-semibold">Phone:</span> +91 9693613221</p>
                <p className="text-gray-700">📍 <span className="font-semibold">Address:</span> Professors Colony Road No. 18, Near JKS College, Mango, Jamshedpur, Jharkhand - 831012</p>
              </div>
            </div>

            {/* Effective Date */}
            <div className="text-center text-gray-500 text-sm pt-6 border-t">
              <p>© 2025 HR Science Quest. All Rights Reserved.</p>
              <p className="mt-2">This Privacy Policy is effective as of January 1, 2025</p>
            </div>
          </div>
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