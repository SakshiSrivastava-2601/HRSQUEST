import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import AuthModal from "../../components/auth/AuthModal";
import UnifiedLoginForm from "../auth/UnifiedLoginForm";
import StudentRegisterForm from "../auth/StudentRegisterForm";

export default function ContactPage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const openAuth = (type) => {
    setAuthType(type || "login");
    setAuthOpen(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission - Replace with your actual API endpoint
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setSubmitted(true);
      setLoading(false);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Contact Us</h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            We're here to help and answer any questions you might have
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left Side - Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">
                Have questions about our courses? Need guidance for exam preparation? 
                We're just a message away. Reach out to us anytime!
              </p>
              
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Our Address</h3>
                    <p className="text-gray-600 mt-1">
                      Professors Colony Road No. 18,<br />
                      Near JKS College, Mango,<br />
                      Jamshedpur, Jharkhand - 831012
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-xl group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                    📧
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Email Us</h3>
                    <a href="mailto:hrsciencequest@gmail.com" className="text-gray-600 hover:text-blue-600 block mt-1">
                      hrsciencequest@gmail.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    📞
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Call Us</h3>
                    <a href="tel:+919693613221" className="text-gray-600 hover:text-blue-600 block mt-1">
                      +91 9693613221
                    </a>
                    <p className="text-gray-500 text-sm mt-2">Mon-Sat: 9:00 AM - 7:00 PM</p>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 text-xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                    ⏰
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Business Hours</h3>
                    <p className="text-gray-600 mt-1">
                      Monday - Saturday: 9:00 AM - 7:00 PM<br />
                      Sunday: 10:00 AM - 4:00 PM (Online Support Only)
                    </p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-8">
                <div className="bg-gray-100 rounded-2xl overflow-hidden h-64">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3664.567!2d86.2145!3d22.8145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDQ4JzUyLjIiTiA4NsKwMTInNTIuMiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="HR Science Quest Location"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              {submitted && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-xl text-green-700">
                  ✅ Thank you for contacting us! We'll get back to you within 24 hours.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="Course Inquiry">Course Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Partnership">Partnership Opportunity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Message →"}
                </button>

                <p className="text-center text-gray-500 text-sm mt-4">
                  We'll respond to your message within 24 hours
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "How can I enroll in a course?",
                a: "Simply click on 'Get Started' button, create your account, and choose your desired course. You can start learning immediately after payment."
              },
              {
                q: "Do you provide doubt clearing sessions?",
                a: "Yes! We offer regular doubt clearing sessions with our expert faculty members."
              },
              {
                q: "Is there any demo available?",
                a: "Yes, we offer free demo lectures for all our courses. Contact us to schedule your demo session."
              },
              {
                q: "What is your refund policy?",
                a: "Please note that no refunds are allowed once the course is purchased. We recommend trying our demo sessions first."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Learning Journey?</h2>
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