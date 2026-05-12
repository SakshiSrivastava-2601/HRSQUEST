import { useState } from "react";
import { adminLogin, studentLogin } from "../../services/authService";
import {
  showErrorPopup,
  showSuccessPopup,
  showValidationPopup,
} from "../../services/notify";

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function UnifiedLoginForm({ onSuccess, switchToRegister }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const loginAutomatically = async () => {
    try {
      const studentData = await studentLogin(formData, { notify: false });
      return { data: studentData, loginAs: "student" };
    } catch (studentError) {
      const message = String(studentError?.message || "").toLowerCase();
      // If the student account exists but the password is wrong, don't silently
      // try the teacher endpoint — surface the password error to the user.
      const isPasswordError =
        message.includes("incorrect password") || message.includes("wrong password");
      if (isPasswordError) {
        throw studentError;
      }
    }

    try {
      const teacherData = await adminLogin(formData, { notify: false });
      return { data: teacherData, loginAs: "teacher" };
    } catch (teacherError) {
      const teacherMsg = String(teacherError?.message || "").toLowerCase();
      const teacherIsPasswordError =
        teacherMsg.includes("incorrect password") || teacherMsg.includes("wrong password");
      if (teacherIsPasswordError) {
        throw teacherError;
      }
      // Neither student nor teacher matched — surface a single clear message.
      throw new Error(
        "No account found with this email, phone, or username. Please register first."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.username.trim()) {
      const message = "Email, phone, or username is required.";
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
      const { data, loginAs } = await loginAutomatically();

      if (loginAs === "teacher") {
        localStorage.setItem("admin_token", data.access_token);
        if (data?.refresh_token) localStorage.setItem("admin_refresh_token", data.refresh_token);
      } else {
        localStorage.setItem("token", data.access_token);
        if (data?.refresh_token)
          localStorage.setItem("student_refresh_token", data.refresh_token);
      }

      // Notify app shell/navbar to re-render session state.
      window.dispatchEvent(new Event("auth:changed"));

      const payload = decodeJwtPayload(data.access_token);
      const role = String(payload?.role || "").toLowerCase();
      showSuccessPopup("Login successful.");

      if (typeof onSuccess === "function") {
        onSuccess({ role, loginAs });
      }
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      showErrorPopup(message, "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg mb-3">
          <span className="text-xl text-white">👨‍🎓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back!</h2>
        <p className="text-sm text-gray-600">
          Continue your learning journey
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-sm mt-0.5">⚠</span>
            <p className="text-xs text-red-600 flex-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-blue-600 text-sm">👤</span>
            Email / Phone / Username
          </label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
            placeholder="Enter your email, phone, or username"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="text-blue-600 text-sm">🔒</span>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pr-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="text-center pt-4 border-t border-gray-100 mt-6">
        <p className="text-xs text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              if (typeof switchToRegister === "function") switchToRegister();
            }}
            className="text-blue-600 font-semibold hover:text-blue-700"
          >
            Register here →
          </button>
        </p>
      </div>
    </div>
  );
}
