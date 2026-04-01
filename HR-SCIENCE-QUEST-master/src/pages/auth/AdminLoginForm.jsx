import { useState } from "react";
import { adminLogin } from "../../services/authService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";

export default function AdminLoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      const message = "Admin username is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    if (!formData.password.trim()) {
      const message = "Admin password is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    setLoading(true);
    setError("");

	    try {
	      const data = await adminLogin(formData);
	      localStorage.setItem("admin_token", data.access_token);
	      if (data?.refresh_token) {
	        localStorage.setItem("admin_refresh_token", data.refresh_token);
	      }
        showSuccessPopup("Admin login successful.");
	      onSuccess();
	    } catch (err) {
	      setError(err.message || "Admin login failed");
	    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Compact Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-lg mb-3">
          <span className="text-xl text-white">👨‍💼</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Admin Portal
        </h2>
        <p className="text-sm text-gray-600">
          Manage platform content
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
        {/* Username Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-gray-600 text-sm">👤</span>
            Admin Username
          </label>
          <div className="relative">
            <input
              name="username"
              placeholder="admin_username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              🔧
            </div>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-gray-600 text-sm">🔐</span>
            Admin Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pl-9 pr-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-all duration-200"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              🗝️
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


        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span>Access Admin Dashboard</span>
            </div>
          )}
        </button>
      </form>

      {/* Footer Note */}
      <div className="text-center pt-4 border-t border-gray-100 mt-6">
        <p className="text-xs text-gray-500">
          For security, log out after each session
          <br />
          <span className="text-xs text-red-500 font-medium">⚠ Restricted Access Area</span>
        </p>
      </div>
    </div>
  );
}
