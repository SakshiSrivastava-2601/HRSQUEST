import { useState } from "react";
import { FiLock, FiShield, FiUser } from "react-icons/fi";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { changeAdminPassword } from "../../services/authService";
import { showSuccessPopup, showValidationPopup } from "../../services/notify";
import { getSession } from "../../services/session";

export default function AdminProfile() {
  const session = getSession();
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      setSaving(true);
      setError("");
      await changeAdminPassword({
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
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                  Profile Security
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  My Profile
                </h1>
                <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
                  Review your account identity and update your password securely.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                    {session?.role || "teacher"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {session?.teacher_id || "-"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <FiUser className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Account Info</h2>
                  <p className="mt-1 text-sm text-gray-500">Your current admin or teacher identity.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</div>
                  <div className="mt-2 text-base font-semibold text-gray-900">{session?.name || "-"}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Username</div>
                  <div className="mt-2 text-base font-semibold text-gray-900 break-words">{session?.username || "-"}</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher ID</div>
                  <div className="mt-2 text-base font-semibold text-gray-900">{session?.teacher_id || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gray-900 p-3 text-white">
                  <FiShield className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Update Password</h2>
                  <p className="mt-1 text-sm text-gray-500">Change your password for this account.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handlePasswordUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                >
                  <FiLock />
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
