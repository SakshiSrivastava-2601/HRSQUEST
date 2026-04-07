import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";

export default function RefundPolicyPage() {
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
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Refund Policy</h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Please read our refund policy carefully before making a purchase
          </p>
          <p className="text-gray-300 mt-4">Last Updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">

            {/* No Refund Policy - Main Notice */}
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-3xl font-bold text-red-700 mb-4">NO REFUND POLICY</h2>
              <p className="text-red-600 text-lg font-semibold">
                Once a course is purchased, no refunds will be issued under any circumstances.
              </p>
              <div className="mt-4 p-4 bg-red-100 rounded-xl">
                <p className="text-red-800">
                  By purchasing any course or service from HR Science Quest, you acknowledge and agree 
                  to this No Refund Policy.
                </p>
              </div>
            </div>

            {/* Why No Refunds */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why We Have a No Refund Policy</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: "Digital Product Nature",
                    desc: "Our courses are digital products that provide immediate access to all content"
                  },
                  {
                    title: "Intellectual Property",
                    desc: "Once accessed, course materials cannot be 'returned' like physical products"
                  },
                  {
                    title: "Investment in Quality",
                    desc: "We invest heavily in creating high-quality, exam-oriented content"
                  },
                  {
                    title: "Commitment to Results",
                    desc: "We're committed to your success and provide extensive support throughout"
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What We Recommend Before Purchase */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Recommend Before Purchase</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">1️⃣</span>
                  <p className="text-gray-700"><span className="font-semibold">Watch Demo Lectures:</span> We provide free demo content to help you understand our teaching style</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">2️⃣</span>
                  <p className="text-gray-700"><span className="font-semibold">Contact Support:</span> Reach out to our team with any questions before enrolling</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">3️⃣</span>
                  <p className="text-gray-700"><span className="font-semibold">Review Course Content:</span> Carefully read the course curriculum and requirements</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">4️⃣</span>
                  <p className="text-gray-700"><span className="font-semibold">Check Device Compatibility:</span> Ensure your device meets technical requirements</p>
                </div>
              </div>
            </div>

            {/* Exceptions - None */}
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Exceptions</h2>
              <p className="text-gray-700 leading-relaxed">
                There are <span className="font-bold text-red-600">NO EXCEPTIONS</span> to this refund policy, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>Change of mind or personal circumstances</li>
                <li>Lack of time to study</li>
                <li>Difficulty understanding content (we provide support for this)</li>
                <li>Technical issues on your end (we help resolve these)</li>
                <li>Accidental purchases</li>
                <li>Unsatisfactory results (individual outcomes vary)</li>
              </ul>
            </div>

            {/* Course Transfer Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Transfer Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                While refunds are not allowed, we may consider <span className="font-semibold">course transfers</span> under exceptional 
                circumstances. If you wish to transfer to a different course, please contact our support 
                team within 7 days of purchase. Transfer approvals are at our sole discretion and may 
                require payment of any price differences.
              </p>
            </div>

            {/* Payment Disputes */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Disputes & Chargebacks</h2>
              <p className="text-gray-700 leading-relaxed">
                By making a purchase, you agree not to initiate chargebacks or payment disputes. If a 
                chargeback is initiated, your account will be immediately suspended, and we reserve the 
                right to pursue legal action to recover our fees plus any associated costs.
              </p>
            </div>

            {/* Technical Issues */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Issues</h2>
              <p className="text-gray-700 leading-relaxed">
                If you experience technical issues accessing your course, please contact our support team 
                immediately at <span className="font-semibold">hrsciencequest@gmail.com</span>. We are committed to resolving any technical 
                problems promptly. However, technical difficulties do not qualify for refunds as we provide 
                continuous support to resolve such issues.
              </p>
            </div>

            {/* Cancellation Policy */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Cancellation</h2>
              <p className="text-gray-700 leading-relaxed">
                For subscription-based services, you may cancel your subscription at any time. However, 
                no refunds will be provided for the current billing period. Your access will continue 
                until the end of the paid period.
              </p>
            </div>

            {/* Contact for Concerns */}
            <div className="bg-green-50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Have Concerns Before Purchase?</h2>
              <p className="text-gray-700 mb-4">
                We encourage you to reach out to us BEFORE making a purchase if you have any concerns:
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">📧 <span className="font-semibold">Email:</span> hrsciencequest@gmail.com</p>
                <p className="text-gray-700">📞 <span className="font-semibold">Phone:</span> +91 9693613221</p>
                <p className="text-gray-700">💬 <span className="font-semibold">Support Hours:</span> Monday-Saturday, 9 AM - 7 PM</p>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="bg-gray-100 rounded-2xl p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">By Purchasing, You Acknowledge That:</h2>
              <p className="text-gray-700">
                You have read, understood, and agreed to this No Refund Policy. You understand that 
                once payment is made, no refunds will be provided under any circumstances.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-gray-600 text-sm">
                  © 2025 HR Science Quest. All Rights Reserved.
                </p>
              </div>
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