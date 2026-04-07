import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";

export default function TermsPage() {
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
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Terms & Conditions</h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Please read these terms carefully before using our platform
          </p>
          <p className="text-gray-300 mt-4">Last Updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">

            {/* Agreement */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using HR Science Quest's website, mobile application, and services, 
                you agree to be bound by these Terms & Conditions. If you disagree with any part of 
                these terms, you may not access our services.
              </p>
            </div>

            {/* Account Registration */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Registration</h2>
              <div className="space-y-3 text-gray-700">
                <p>✓ You must provide accurate and complete information during registration</p>
                <p>✓ You are responsible for maintaining the confidentiality of your account credentials</p>
                <p>✓ You are responsible for all activities that occur under your account</p>
                <p>✓ You must notify us immediately of any unauthorized account access</p>
                <p>✓ One account per user - sharing accounts is strictly prohibited</p>
                <p>✓ We reserve the right to suspend or terminate accounts that violate these terms</p>
              </div>
            </div>

            {/* Course Access */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Access & License</h2>
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-gray-700 mb-4">
                  Upon successful enrollment, we grant you a limited, non-exclusive, non-transferable 
                  license to access our courses for personal, non-commercial use.
                </p>
                <h3 className="font-semibold text-gray-900 mt-4 mb-2">You may NOT:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Share, sell, or distribute course content to others</li>
                  <li>Record, download, or reproduce course videos</li>
                  <li>Use our content for commercial purposes</li>
                  <li>Access the platform through unauthorized means</li>
                  <li>Attempt to bypass security features</li>
                </ul>
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms</h2>
              <div className="space-y-3 text-gray-700">
                <p>💰 All course fees are displayed in Indian Rupees (INR)</p>
                <p>💰 Payments are processed securely through Razorpay</p>
                <p>💰 Course access is granted only after successful payment confirmation</p>
                <p>💰 Prices are subject to change without prior notice</p>
                <p>💰 Discounts and promotional offers cannot be combined</p>
              </div>
            </div>

            {/* Refund Policy Summary */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">⚠️ Refund Policy</h2>
              <p className="text-gray-700 font-semibold">
                NO REFUNDS ARE ALLOWED once a course is purchased.
              </p>
              <p className="text-gray-600 mt-2">
                Please review course details, watch demo lectures, and contact our support team 
                before making a purchase decision. For full details, refer to our Refund Policy page.
              </p>
            </div>

            {/* User Conduct */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Conduct</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "Respect other learners and instructors",
                  "No harassment, bullying, or inappropriate behavior",
                  "No cheating on tests or assignments",
                  "No posting of offensive or illegal content",
                  "No unauthorized sharing of test answers",
                  "Comply with all applicable laws"
                ].map((rule, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <span className="text-blue-500">📌</span>
                    <span className="text-gray-700">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content on HR Science Quest including but not limited to videos, text, graphics, 
                logos, question banks, test series, and course materials are the exclusive property 
                of HR Science Quest and are protected by copyright laws. Unauthorized use, reproduction, 
                or distribution is strictly prohibited and may result in legal action.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="bg-amber-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Third-Party Services</h2>
              <p className="text-gray-700 mb-3">Our platform integrates with:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><span className="font-semibold">Razorpay:</span> For payment processing. Their terms apply separately.</li>
                <li><span className="font-semibold">Analytics Services:</span> To improve our platform</li>
                <li><span className="font-semibold">Cloud Infrastructure:</span> For data storage and delivery</li>
              </ul>
              <p className="text-gray-600 text-sm mt-3">
                We are not responsible for the practices of third-party services.
              </p>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Suspension & Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account without prior notice for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
                <li>Violation of these Terms & Conditions</li>
                <li>Fraudulent or illegal activities</li>
                <li>Sharing account credentials</li>
                <li>Cheating or academic dishonesty</li>
                <li>Non-payment of fees</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are provided "as is" without any warranties. While we strive for accuracy 
                and quality, we do not guarantee specific results or outcomes. Individual results may vary 
                based on effort, dedication, and other factors.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, HR Science Quest shall not be liable for any 
                indirect, incidental, or consequential damages arising from your use of our platform, 
                including but not limited to loss of data, academic outcomes, or financial losses.
              </p>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising under these terms shall be subject to the exclusive jurisdiction 
                of the courts in Jamshedpur, Jharkhand.
              </p>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may modify these terms at any time. Continued use of our platform after changes 
                constitutes acceptance of the new terms. We will notify users of significant changes 
                via email or platform notification.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-green-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700 mb-3">
                For questions about these Terms & Conditions, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">📧 <span className="font-semibold">Email:</span> hrsciencequest@gmail.com</p>
                <p className="text-gray-700">📞 <span className="font-semibold">Phone:</span> +91 9693613221</p>
                <p className="text-gray-700">📍 <span className="font-semibold">Address:</span> Professors Colony Road No. 18, Near JKS College, Mango, Jamshedpur, Jharkhand - 831012</p>
              </div>
            </div>

            <div className="text-center text-gray-500 text-sm pt-6 border-t">
              <p>© 2025 HR Science Quest. All Rights Reserved.</p>
              <p className="mt-2">Last Updated: January 1, 2025</p>
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