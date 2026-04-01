import { useState } from "react";
import { studentLogin } from "../../services/authService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";

export default function StudentLoginForm({ onSuccess, switchToRegister }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.username.trim()) {
      const message = "Email is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    if (!formData.password.trim()) {
      const message = "Password is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    setLoading(true);

	    try {
	      const data = await studentLogin(formData);
	      localStorage.setItem("token", data.access_token);
	      if (data?.refresh_token) {
	        localStorage.setItem("student_refresh_token", data.refresh_token);
	      }
        showSuccessPopup("Student login successful.");
	      if (typeof onSuccess === "function") onSuccess();
	    } catch (err) {
	      setError(err.message || "Login failed");
	    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Compact Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl shadow-lg mb-3">
          <span className="text-xl text-white">👨‍🎓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome Back!
        </h2>
        <p className="text-sm text-gray-600">
          Continue your learning journey
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-sm mt-0.5">⚠</span>
            <p className="text-xs text-red-600 flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Compact Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-blue-600 text-sm">📧</span>
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              name="username"
              placeholder="student@example.com"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              ✉️
            </div>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-blue-600 text-sm">🔒</span>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pl-9 pr-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              🔑
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5">
            <input 
              type="checkbox" 
              className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500" 
            />
            <span className="text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Logging in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm">🚀</span>
              <span>Login to Continue</span>
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="px-3 text-xs text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Switch to Register */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              if (typeof switchToRegister === "function") switchToRegister();
            }}
            className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-0.5 text-xs group"
          >
            Register here
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </p>
      </div>
    </div>
  );
}
