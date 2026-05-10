import { useEffect, useState } from "react";
import { Lock, Mail, Phone, Save, User } from "lucide-react";

import StudentSidebar from "../../components/student/StudentSidebar";
import { apiRequest } from "../../services/api";
import { getStudentCourses } from "../../services/lmsService";
import { changePassword } from "../../services/authService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";
import { syncStudentSessionProfile } from "../../services/session";
import { formatGradeLevel } from "../../utils/grade";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    student_name: "",
    email: "",
    phone_number: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const [data, enrolledCourses] = await Promise.all([
          apiRequest("/student/info"),
          getStudentCourses().catch(() => []),
        ]);
        setProfile(data);
        setCourses(Array.isArray(enrolledCourses) ? enrolledCourses : []);
        setForm({
          student_name: data?.student_name || "",
          email: data?.email || "",
          phone_number: data?.phone_number || "",
        });
        syncStudentSessionProfile(data);
      } catch (err) {
        setError(err.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    if (!form.student_name.trim()) {
      const message = "Full name is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    if (!form.email.trim()) {
      const message = "Email is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    if (!form.phone_number.trim()) {
      const message = "Phone number is required.";
      setError(message);
      showValidationPopup(message);
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const updated = await apiRequest("/student/info", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setForm({
        student_name: updated?.student_name || "",
        email: updated?.email || "",
        phone_number: updated?.phone_number || "",
      });
      syncStudentSessionProfile(updated);
      setMessage("Profile updated successfully.");
      showSuccessPopup("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.old_password.trim()) {
      showValidationPopup("Current password is required.");
      return;
    }
    if (!passwordForm.new_password.trim()) {
      showValidationPopup("New password is required.");
      return;
    }
    if (passwordForm.new_password.trim().length < 8) {
      showValidationPopup("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showValidationPopup("New password and confirm password must match.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      showSuccessPopup("Password updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const enrolledCourseIds = courses
    .map((course) => course?.course_id)
    .filter((courseId) => courseId !== undefined && courseId !== null);
  const unlockedCourseIds = courses
    .filter((course) => course?.is_unlocked)
    .map((course) => course?.course_id)
    .filter((courseId) => courseId !== undefined && courseId !== null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <StudentSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Your account details.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="h-48 animate-pulse rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm" />
          ) : profile ? (
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                  {(profile.student_name || "S").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Student</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">{profile.student_name}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{formatGradeLevel(profile.current_grade_level || profile.grade_level)}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Student ID
                    </div>
                    <div className="mt-2 text-xl font-bold text-blue-900">
                      {profile.student_id || "-"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Enrolled Courses
                    </div>
                    <div className="mt-2 text-xl font-bold text-emerald-900">
                      {enrolledCourseIds.length}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                      Unlocked Course IDs
                    </div>
                    <div className="mt-2 text-xl font-bold text-amber-900">
                      {unlockedCourseIds.length}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.student_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, student_name: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Student ID
                  </div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">{profile.student_id}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Course IDs
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enrolledCourseIds.length ? (
                      enrolledCourseIds.map((courseId) => {
                        const unlocked = unlockedCourseIds.includes(courseId);
                        return (
                          <span
                            key={courseId}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              unlocked
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            Course ID: {courseId}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No enrolled courses yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Change Password
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Update your password securely from your profile.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New password"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
