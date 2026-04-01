import { useState } from "react";
import { studentRegister } from "../../services/authService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";

export default function StudentRegister({ onSuccess, switchToLogin }) {
  const [formData, setFormData] = useState({
    student_name: "",
    email: "",
    phone_number: "",
    password: "",
    grade_level: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.student_name.trim()) {
      newErrors.student_name = "Student name is required";
    } else if (formData.student_name.length < 2) {
      newErrors.student_name = "Name must be at least 2 characters";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone_number.replace(/\D/g, ""))) {
      newErrors.phone_number = "Enter a valid 10-digit phone number";
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.grade_level) {
      newErrors.grade_level = "Grade is required";
    } else if (parseInt(formData.grade_level) < 1 || parseInt(formData.grade_level) > 12) {
      newErrors.grade_level = "Select a grade between 1 and 12";
    }

    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain letters and numbers";
    }

    return newErrors;
  };

  const validateCurrentStep = (step) => {
    const validators = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
    };

    const nextErrors = validators[step]?.() || {};
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = () => {
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const step3Errors = validateStep3();
    const allErrors = { ...step1Errors, ...step2Errors, ...step3Errors };

    setErrors(allErrors);

    if (Object.keys(step1Errors).length > 0) {
      setFormStep(1);
      showValidationPopup(Object.values(step1Errors)[0]);
      return false;
    }

    if (Object.keys(step2Errors).length > 0) {
      setFormStep(2);
      showValidationPopup(Object.values(step2Errors)[0]);
      return false;
    }

    if (Object.keys(step3Errors).length > 0) {
      setFormStep(3);
      showValidationPopup(Object.values(step3Errors)[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateAllSteps()) {
      return;
    }

    setLoading(true);
    try {
      await studentRegister({
        ...formData,
        grade_level: Number(formData.grade_level),
      });
      showSuccessPopup("Registration completed successfully.");
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!validateCurrentStep(formStep)) {
      const currentErrors = {
        ...errors,
        ...(formStep === 1 ? validateStep1() : formStep === 2 ? validateStep2() : validateStep3()),
      };
      const firstError = Object.values(currentErrors).find(Boolean);
      if (firstError) {
        showValidationPopup(firstError);
      }
      return;
    }

    if (formStep === 1) {
      setFormStep(2);
    } else if (formStep === 2) {
      setFormStep(3);
    }
  };

  const prevStep = () => {
    if (formStep > 1) setFormStep(formStep - 1);
  };

  const grades = Array.from({ length: 12 }, (_, i) => i + 1);


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header - Reduced size */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl shadow-lg mb-3">
          <span className="text-xl text-white">🎓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Start Your Journey
        </h2>
        <p className="text-sm text-gray-600">
          Join thousands of successful students
        </p>
      </div>

      {/* Progress Steps - Compact version */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {["Personal", "Education", "Account"].map((step, index) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                  formStep > index + 1
                    ? "bg-green-500 text-white"
                    : formStep === index + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {formStep > index + 1 ? "✓" : index + 1}
              </div>
              <span className="text-xs text-gray-600">{step}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
            style={{ width: `${((formStep - 1) / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Error Message - Compact */}
      {error && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-base">⚠</span>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Form Container - Max height with scroll if needed */}
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <form id="register-form" onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {formStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">👤</span>
                  Student Name *
                </label>
                <input
                  type="text"
                  name="student_name"
                  placeholder="Enter your full name"
                  value={formData.student_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm bg-gray-50 border ${
                    errors.student_name ? 'border-red-300' : 'border-gray-200'
                  } rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200`}
                />
                {errors.student_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.student_name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">📱</span>
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    📞
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    placeholder="10-digit number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    maxLength="10"
                    className={`w-full px-3 py-2 pl-9 text-sm bg-gray-50 border ${
                      errors.phone_number ? 'border-red-300' : 'border-gray-200'
                    } rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200`}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {formStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">📧</span>
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    ✉️
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pl-9 text-sm bg-gray-50 border ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    } rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">🏫</span>
                  Grade / Class *
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm bg-gray-50 border ${
                    errors.grade_level ? 'border-red-300' : 'border-gray-200'
                  } rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 appearance-none`}
                >
                  <option value="">Select your grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
                {errors.grade_level && (
                  <p className="text-xs text-red-500 mt-1">{errors.grade_level}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Account */}
          {formStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">🔒</span>
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min. 8 characters with letters & numbers"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pl-9 pr-9 text-sm bg-gray-50 border ${
                      errors.password ? 'border-red-300' : 'border-gray-200'
                    } rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200`}
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
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-1/3 h-1 rounded-full ${
                    formData.password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)
                      ? "bg-green-500"
                      : formData.password.length >= 4
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                  }`}></div>
                  <div className={`w-1/3 h-1 rounded-full ${
                    formData.password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)
                      ? "bg-green-500"
                      : formData.password.length >= 6
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                  }`}></div>
                  <div className={`w-1/3 h-1 rounded-full ${
                    formData.password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {formData.password.length}/8
                  </span>
                </div>
              </div>

              {/* Compact Tip Box */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 text-sm mt-0.5">💡</div>
                  <div>
                    <p className="text-xs font-medium text-blue-900">Pro Tip</p>
                    <p className="text-xs text-blue-700">
                      Use school email for exclusive resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 space-y-3">
        {formStep === 1 && (
          <button
            type="button"
            onClick={nextStep}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200"
          >
            Continue to Education
            <span className="ml-2">→</span>
          </button>
        )}

        {formStep === 2 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200"
            >
              Continue to Account
              <span className="ml-2">→</span>
            </button>
          </div>
        )}

        {formStep === 3 && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span>🎉</span>
                    <span>Complete</span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Submit button for validation on final submit */}
            <button
              type="submit"
              form="register-form"
              className="hidden"
              id="final-submit"
            />
          </div>
        )}
      </div>

      {/* Switch to Login - Compact */}
      <div className="text-center pt-4 border-t border-gray-100 mt-4">
        <p className="text-xs text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={switchToLogin}
            className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center gap-0.5 text-xs group"
          >
            Login here
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </p>
      </div>
    </div>
  );
}
