import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  createTeacherAccount,
  getPurchaseReport,
  getStudentReport,
  getTeacherReport,
  deleteStudentAccount,
  deleteTeacherAccount,
  resetTeacherPassword,
  updateStudentAccount,
  updateTeacherAccount,
} from "../../services/lmsService";
import { getSubjects } from "../../services/subjectService";
import { getSession, isSuperAdmin } from "../../services/session";
import { formatINR } from "../../utils/currency";

function moneyINR(paise) {
  const v = Number(paise || 0) / 100;
  return v.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function ReportBarChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
              style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportDonutChart({ segments, total }) {
  const circumference = 2 * Math.PI * 44;
  let offsetCursor = 0;

  return (
    <div className="flex flex-col items-center gap-5 md:flex-row">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#e5e7eb" strokeWidth="14" />
          {segments.map((segment) => {
            const ratio = total > 0 ? segment.value / total : 0;
            const dash = circumference * ratio;
            const strokeDasharray = `${dash} ${circumference - dash}`;
            const strokeDashoffset = -offsetCursor;
            offsetCursor += dash;

            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={segment.stroke}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Total
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{total}</div>
        </div>
      </div>
      <div className="w-full space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.stroke }} />
              <span className="text-sm font-medium text-gray-600">{segment.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) {
  if (totalPages <= 0) return null;

  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 1);
  const endPage = Math.min(totalPages, startPage + 2);

  for (let page = startPage; page <= endPage; page += 1) {
    pageNumbers.push(page);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-500"
        >
          {[5, 10, 20].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition ${
              currentPage === page
                ? "bg-gray-900 text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

async function showTeacherPasswordModal({ title, username, password }) {
  await Swal.fire({
    icon: "success",
    title,
    html: `
      <div style="text-align:left">
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">Username</div>
        <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;font-weight:600;word-break:break-word;">${username || "-"}</div>
        <div style="font-size:12px;color:#6b7280;margin:16px 0 8px;">Temporary Password</div>
        <div id="teacher-temp-password" style="padding:12px 14px;border:1px solid #c7d2fe;border-radius:14px;background:#eef2ff;font-weight:700;letter-spacing:0.04em;word-break:break-word;">${password}</div>
        <div style="margin-top:12px;font-size:12px;color:#6b7280;">Copy this password now. It is shown only to SuperAdmin.</div>
      </div>
    `,
    confirmButtonText: "Done",
    showDenyButton: true,
    denyButtonText: "Copy Password",
    preDeny: async () => {
      try {
        await navigator.clipboard.writeText(password);
        return false;
      } catch {
        return false;
      }
    },
  });
}

export default function UsersReports() {
  const session = getSession();
  const superAdmin = isSuperAdmin(session);
  const [tab, setTab] = useState("teachers"); // teachers | students | purchases
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({
    teachers: { page: 1, size: 5 },
    students: { page: 1, size: 5 },
    purchases: { page: 1, size: 5 },
  });

  // For superadmin visibility: store only locally (never in DB).
  const [passwordVault, setPasswordVault] = useState({}); // { teacher_id: { password, visible } }

  const [teacherForm, setTeacherForm] = useState({
    teacher_name: "",
    username: "",
    password: "",
    subject_ids: [],
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [t, s, p] = await Promise.all([
        getTeacherReport(),
        getStudentReport(),
        getPurchaseReport(),
      ]);
      setTeachers(t || []);
      setStudents(s || []);
      setPurchases(p || []);
      const subs = await getSubjects().catch(() => []);
      setSubjects(subs || []);
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (superAdmin) fetchAll();
  }, []);

  const updatePage = (key, page) => {
    setPagination((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        page,
      },
    }));
  };

  const updatePageSize = (key, size) => {
    setPagination((prev) => ({
      ...prev,
      [key]: {
        page: 1,
        size,
      },
    }));
  };

  const onCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        teacher_name: teacherForm.teacher_name,
        username: teacherForm.username,
        password: teacherForm.password,
        generate_password: false,
        subject_ids: teacherForm.subject_ids || [],
      };

      const res = await createTeacherAccount(payload);
      const resolvedPassword = res?.temporary_password || teacherForm.password;
      if (res?.teacher_id && resolvedPassword) {
        setPasswordVault((v) => ({
          ...v,
          [res.teacher_id]: { password: resolvedPassword, visible: false },
        }));
      }
      await showTeacherPasswordModal({
        title: "Teacher created successfully",
        username: res?.username || teacherForm.username,
        password: resolvedPassword,
      });
      setTeacherForm({
        teacher_name: "",
        username: "",
        password: "",
        subject_ids: [],
      });
      await fetchAll();
    } catch (e2) {
      Swal.fire("Error", e2.message || "Failed to create teacher", "error");
    }
  };

  const onResetTeacherPassword = async (teacherId) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Set new password",
        input: "text",
        inputLabel: "Temporary password",
        inputPlaceholder: "Enter new temporary password",
        inputAttributes: {
          autocapitalize: "off",
          autocorrect: "off",
        },
        showCancelButton: true,
        confirmButtonText: "Update Password",
        inputValidator: (value) => {
          if (!String(value || "").trim()) return "Password is required";
          if (String(value).trim().length < 8) return "Password must be at least 8 characters";
          return undefined;
        },
      });
      if (!confirm.isConfirmed) return;

      const newPassword = String(confirm.value || "").trim();
      const res = await resetTeacherPassword(teacherId, { password: newPassword });
      if (res?.temporary_password || newPassword) {
        setPasswordVault((v) => ({
          ...v,
          [teacherId]: { password: res?.temporary_password || newPassword, visible: true },
        }));
      }
      const teacher = teacherRows.find((row) => Number(row.teacher_id) === Number(teacherId));
      await showTeacherPasswordModal({
        title: "Password reset successful",
        username: teacher?.username || `Teacher #${teacherId}`,
        password: res?.temporary_password || newPassword,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to reset password", "error");
    }
  };

  const toggleTeacherPassword = (teacherId) => {
    setPasswordVault((vaultState) => {
      const current = vaultState[teacherId];
      if (!current?.password) return vaultState;
      return {
        ...vaultState,
        [teacherId]: {
          ...current,
          visible: !current.visible,
        },
      };
    });
  };

  const copyTeacherPassword = async (teacherId) => {
    const password = passwordVault[teacherId]?.password;
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      Swal.fire("Copied", "Temporary password copied to clipboard.", "success");
    } catch {
      Swal.fire("Error", "Unable to copy password.", "error");
    }
  };

  const onDeleteTeacher = async (teacherId) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Delete teacher?",
        text: "Teacher will be soft-deleted and their courses will be disabled.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#dc2626",
      });
      if (!confirm.isConfirmed) return;
      await deleteTeacherAccount(teacherId);
      Swal.fire("Deleted", "Teacher deleted successfully", "success");
      await fetchAll();
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to delete teacher", "error");
    }
  };

  const onEditTeacher = async (t) => {
    const subjectOptions = (subjects || [])
      .map((s) => `<option value="${s.subject_id}">${s.subject_name}</option>`)
      .join("");
    const result = await Swal.fire({
      title: "Edit Teacher",
      html: `
        <div style="text-align:left">
          <label style="font-size:12px">Name</label>
          <input id="t_name" class="swal2-input" value="${t.teacher_name || ""}" />
          <label style="font-size:12px">Username</label>
          <input id="t_user" class="swal2-input" value="${t.username || ""}" />
          <label style="font-size:12px">Role</label>
          <select id="t_role" class="swal2-select" style="width:100%; padding:10px; border:1px solid #e5e7eb; border-radius:12px; margin-top:6px;">
            <option value="teacher"${String(t.role).toLowerCase() === "teacher" ? " selected" : ""}>teacher</option>
            <option value="superadmin"${String(t.role).toLowerCase() === "superadmin" ? " selected" : ""}>superadmin</option>
          </select>
          <label style="font-size:12px; margin-top:10px; display:block">Subjects (hold Cmd/Ctrl to multi-select)</label>
          <select id="t_subjects" multiple class="swal2-select" style="width:100%; height:160px; padding:10px; border:1px solid #e5e7eb; border-radius:12px; margin-top:6px;">
            ${subjectOptions}
          </select>
        </div>
      `,
      didOpen: () => {
        // Preselect current subjects by name mapping
        const currentNames = new Set((t.subjects || []).map((x) => String(x)));
        const sel = document.getElementById("t_subjects");
        for (const opt of sel.options) {
          if (currentNames.has(String(opt.text))) opt.selected = true;
        }
      },
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const name = document.getElementById("t_name").value.trim();
        const username = document.getElementById("t_user").value.trim();
        const role = document.getElementById("t_role").value;
        const sel = document.getElementById("t_subjects");
        const subject_ids = Array.from(sel.selectedOptions).map((o) => Number(o.value));
        return { teacher_name: name, username, role, subject_ids };
      },
    });
    if (!result.isConfirmed) return;
    try {
      await updateTeacherAccount(t.teacher_id, result.value);
      Swal.fire("Saved", "Teacher updated", "success");
      await fetchAll();
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to update teacher", "error");
    }
  };

  const onEditStudent = async (s) => {
    const result = await Swal.fire({
      title: "Edit Student",
      html: `
        <div style="text-align:left">
          <label style="font-size:12px">Name</label>
          <input id="s_name" class="swal2-input" value="${s.student_name || ""}" />
          <label style="font-size:12px">Email</label>
          <input id="s_email" class="swal2-input" value="${s.email || ""}" />
          <label style="font-size:12px">Phone</label>
          <input id="s_phone" class="swal2-input" value="${s.phone_number || ""}" />
          <label style="font-size:12px">Grade</label>
          <input id="s_grade" class="swal2-input" value="${s.grade_level || ""}" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const student_name = document.getElementById("s_name").value.trim();
        const email = document.getElementById("s_email").value.trim();
        const phone_number = document.getElementById("s_phone").value.trim();
        const grade_level = Number(document.getElementById("s_grade").value || 0);
        return { student_name, email, phone_number, grade_level: grade_level || undefined };
      },
    });
    if (!result.isConfirmed) return;
    try {
      await updateStudentAccount(s.student_id, result.value);
      Swal.fire("Saved", "Student updated", "success");
      await fetchAll();
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to update student", "error");
    }
  };

  const onDeleteStudent = async (studentId) => {
    try {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Delete student?",
        text: "Student will be soft-deleted.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#dc2626",
      });
      if (!confirm.isConfirmed) return;
      await deleteStudentAccount(studentId);
      Swal.fire("Deleted", "Student deleted successfully", "success");
      await fetchAll();
    } catch (e) {
      Swal.fire("Error", e.message || "Failed to delete student", "error");
    }
  };

  const teacherRows = useMemo(() => teachers || [], [teachers]);
  const studentRows = useMemo(() => students || [], [students]);
  const purchaseRows = useMemo(() => purchases || [], [purchases]);
  const teacherTotalPages = Math.max(1, Math.ceil(teacherRows.length / pagination.teachers.size));
  const studentTotalPages = Math.max(1, Math.ceil(studentRows.length / pagination.students.size));
  const purchaseTotalPages = Math.max(1, Math.ceil(purchaseRows.length / pagination.purchases.size));
  const paginatedTeachers = teacherRows.slice(
    (pagination.teachers.page - 1) * pagination.teachers.size,
    pagination.teachers.page * pagination.teachers.size
  );
  const paginatedStudents = studentRows.slice(
    (pagination.students.page - 1) * pagination.students.size,
    pagination.students.page * pagination.students.size
  );
  const paginatedPurchases = purchaseRows.slice(
    (pagination.purchases.page - 1) * pagination.purchases.size,
    pagination.purchases.page * pagination.purchases.size
  );
  const paidPurchases = purchaseRows.filter(
    (purchase) => String(purchase.payment_status || "").toLowerCase() === "paid"
  );
  const pendingPurchases = purchaseRows.filter(
    (purchase) => String(purchase.payment_status || "").toLowerCase() !== "paid"
  );
  const totalRevenuePaise = paidPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.amount_paise || 0),
    0
  );
  const providerCounts = purchaseRows.reduce((acc, purchase) => {
    const provider = purchase.provider || "manual";
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {});
  const topCourses = Object.values(
    purchaseRows.reduce((acc, purchase) => {
      const key = purchase.course_id || purchase.course_title;
      if (!acc[key]) {
        acc[key] = {
          courseId: purchase.course_id,
          title: purchase.course_title || "Untitled Course",
          purchases: 0,
          revenuePaise: 0,
        };
      }
      acc[key].purchases += 1;
      acc[key].revenuePaise += Number(purchase.amount_paise || 0);
      return acc;
    }, {})
  )
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 5);
  const reportSummaryCards = [
    { label: "Total Revenue", value: moneyINR(totalRevenuePaise), tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
    { label: "Paid Orders", value: paidPurchases.length, tone: "border-blue-200 bg-blue-50 text-blue-900" },
    { label: "Pending Orders", value: pendingPurchases.length, tone: "border-amber-200 bg-amber-50 text-amber-900" },
    { label: "Teachers Active", value: teacherRows.length, tone: "border-violet-200 bg-violet-50 text-violet-900" },
  ];
  const purchaseChartItems = [
    { label: "Teachers", value: teacherRows.length, color: "from-violet-500 to-fuchsia-500" },
    { label: "Students", value: studentRows.length, color: "from-blue-500 to-cyan-500" },
    { label: "Paid Purchases", value: paidPurchases.length, color: "from-emerald-500 to-teal-500" },
    { label: "Pending Purchases", value: pendingPurchases.length, color: "from-amber-500 to-orange-500" },
  ];
  const providerSegments = Object.entries(providerCounts).map(([provider, value], index) => {
    const palette = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
    return {
      label: provider,
      value,
      stroke: palette[index % palette.length],
    };
  });
  const providerTotal = providerSegments.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      <AdminSidebar />
      <main className="flex-1 px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          {!superAdmin ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">Not Authorized</h1>
              <p className="mt-2 text-gray-600">
                Users and reports are available only to SuperAdmin.
              </p>
            </div>
          ) : null}

          {superAdmin ? (
          <>
          <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 shadow-sm">
            <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                  Admin Reporting Hub
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  Users and Reports
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  Manage teachers, review students, and track course purchases from one responsive workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Teachers</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{teacherRows.length}</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Students</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{studentRows.length}</div>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:col-span-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Purchases</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{purchaseRows.length}</div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
            {[
              { id: "teachers", label: `Teachers (${teacherRows.length})` },
              { id: "students", label: `Students (${studentRows.length})` },
              { id: "purchases", label: `Purchases (${purchaseRows.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl font-semibold border transition ${
                  tab === t.id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

            <button
              onClick={fetchAll}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold shadow-sm transition hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reportSummaryCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-[24px] border p-5 shadow-sm ${card.tone}`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                  {card.label}
                </div>
                <div className="mt-3 text-2xl font-bold tracking-tight">
                  {card.value}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Reporting View</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">Platform Activity Mix</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Compare users and transactions from one clean report snapshot.
                </p>
              </div>
              <ReportBarChart items={purchaseChartItems} />
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Payment Providers</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">Provider Breakdown</h2>
                <p className="mt-1 text-sm text-gray-500">
                  See how purchases are distributed across payment channels.
                </p>
              </div>
              <ReportDonutChart segments={providerSegments} total={providerTotal} />
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-900">Top Performing Courses</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Highest revenue and strongest purchase activity across courses.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Course ID</th>
                      <th className="px-4 py-3 text-left">Purchases</th>
                      <th className="px-4 py-3 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCourses.length ? (
                      topCourses.map((course) => (
                        <tr key={`${course.courseId}-${course.title}`} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-semibold text-gray-900">{course.title}</td>
                          <td className="px-4 py-3 text-gray-700">{course.courseId || "-"}</td>
                          <td className="px-4 py-3 text-gray-700">{course.purchases}</td>
                          <td className="px-4 py-3 text-gray-700">{moneyINR(course.revenuePaise)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={4}>
                          No course report data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Report Notes</div>
                <h2 className="mt-2 text-xl font-bold text-gray-900">What to Watch</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">Revenue Trend</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Paid transactions currently total {moneyINR(totalRevenuePaise)}.
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">Pending Follow-up</div>
                  <div className="mt-1 text-sm text-gray-600">
                    {pendingPurchases.length} purchase{pendingPurchases.length === 1 ? "" : "s"} still need attention.
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">Learner Base</div>
                  <div className="mt-1 text-sm text-gray-600">
                    {studentRows.length} students and {teacherRows.length} teachers are visible in the reporting hub.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {tab === "teachers" && (
            <section className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.6fr)]">
              <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-lg font-bold text-gray-900">Create Teacher</h2>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Set a temporary password manually. SuperAdmin can reveal or copy it from this screen when needed.
                </p>

                <form onSubmit={onCreateTeacher} className="mt-4 space-y-3">
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm"
                    placeholder="Teacher name"
                    value={teacherForm.teacher_name}
                    onChange={(e) =>
                      setTeacherForm((p) => ({ ...p, teacher_name: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm"
                    placeholder="Username (email)"
                    value={teacherForm.username}
                    onChange={(e) =>
                      setTeacherForm((p) => ({ ...p, username: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm"
                    type="text"
                    placeholder="Set temporary password"
                    value={teacherForm.password}
                    onChange={(e) =>
                      setTeacherForm((p) => ({ ...p, password: e.target.value }))
                    }
                    minLength={6}
                    required
                  />

                  <div className="pt-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Assign Subjects
                    </div>
                    <div className="max-h-40 space-y-2 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      {subjects.map((s) => {
                        const checked = (teacherForm.subject_ids || []).includes(s.subject_id);
                        return (
                          <label
                            key={s.subject_id}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const id = Number(s.subject_id);
                                setTeacherForm((p) => {
                                  const prev = p.subject_ids || [];
                                  if (e.target.checked) return { ...p, subject_ids: [...prev, id] };
                                  return { ...p, subject_ids: prev.filter((x) => x !== id) };
                                });
                              }}
                            />
                            <span>{s.subject_name}</span>
                          </label>
                        );
                      })}
                      {subjects.length === 0 && (
                        <div className="text-xs text-gray-500">No subjects found.</div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2">
                      Teacher will only see these subjects in their portal.
                    </div>
                  </div>

                  <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">
                    Create
                  </button>
                </form>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-5 md:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Teachers</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage roles, reset passwords, and review assigned subjects.</p>
                  </div>
                </div>

              <div className="space-y-4 p-4 lg:hidden">
                  {paginatedTeachers.map((t) => {
                    const vault = passwordVault[t.teacher_id];
                    const visible = !!vault?.visible;
                    const pw = vault?.password || "";
                    return (
                      <div key={t.teacher_id} className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-gray-900">{t.teacher_name}</div>
                            <div className="mt-1 break-words text-sm text-gray-500">{t.username}</div>
                          </div>
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            {t.role}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Courses</div>
                            <div className="mt-1 text-sm font-medium text-gray-900">{t.course_count}</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Subjects</div>
                            <div className="mt-1 text-sm text-gray-700">{(t.subjects || []).length ? (t.subjects || []).join(", ") : "-"}</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Temp Password</div>
                          {!pw ? (
                            <div className="mt-1 text-sm text-gray-400">Hidden</div>
                          ) : (
                            <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-3">
                              <code className="block break-all text-sm font-semibold text-gray-900">
                                {visible ? pw : "••••••••••"}
                              </code>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => toggleTeacherPassword(t.teacher_id)}
                                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  {visible ? "Hide" : "Show"}
                                </button>
                                <button
                                  onClick={() => copyTeacherPassword(t.teacher_id)}
                                  className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => onEditTeacher(t)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onResetTeacherPassword(t.teacher_id)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => onDeleteTeacher(t.teacher_id)}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {teacherRows.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      No teachers found.
                    </div>
                  )}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-[980px] w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Username</th>
                        <th className="text-left px-4 py-3">Role</th>
                        <th className="text-left px-4 py-3">Courses</th>
                        <th className="text-left px-4 py-3">Subjects</th>
                        <th className="text-left px-4 py-3">Temp Password</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTeachers.map((t) => {
                        const vault = passwordVault[t.teacher_id];
                        const visible = !!vault?.visible;
                        const pw = vault?.password || "";
                        return (
                          <tr key={t.teacher_id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {t.teacher_name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{t.username}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
                                {t.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{t.course_count}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {(t.subjects || []).length ? (t.subjects || []).join(", ") : "-"}
                            </td>
                            <td className="px-4 py-3">
                              {!pw ? (
                                <span className="text-gray-400 text-xs">Hidden</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                                    {visible ? pw : "••••••••••"}
                                  </code>
                                  <button
                                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                    onClick={() => toggleTeacherPassword(t.teacher_id)}
                                  >
                                    {visible ? "Hide" : "Show"}
                                  </button>
                                  <button
                                    className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                    onClick={() => copyTeacherPassword(t.teacher_id)}
                                  >
                                    Copy
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <button
                                  onClick={() => onEditTeacher(t)}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onResetTeacherPassword(t.teacher_id)}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold hover:bg-gray-50"
                                >
                                  Reset
                                </button>
                                <button
                                  onClick={() => onDeleteTeacher(t.teacher_id)}
                                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {teacherRows.length === 0 && (
                        <tr>
                          <td className="px-4 py-6 text-gray-500" colSpan={7}>
                            No teachers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentPage={pagination.teachers.page}
                  totalPages={teacherTotalPages}
                  rowsPerPage={pagination.teachers.size}
                  onPageChange={(page) =>
                    updatePage("teachers", Math.min(Math.max(page, 1), teacherTotalPages))
                  }
                  onRowsPerPageChange={(size) => updatePageSize("teachers", size)}
                />
              </div>
            </section>
          )}

          {tab === "students" && (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-900">Students</h2>
                <p className="mt-1 text-sm text-gray-500">Review student accounts, payment totals, and learning access at a glance.</p>
              </div>
              <div className="space-y-4 p-4 lg:hidden">
                {paginatedStudents.map((s) => (
                  <div key={s.student_id} className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                    <div className="text-base font-semibold text-gray-900">{s.student_name}</div>
                    <div className="mt-1 break-words text-sm text-gray-500">{s.email}</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Phone</div>
                        <div className="mt-1 text-sm text-gray-700">{s.phone_number}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Grade</div>
                        <div className="mt-1 text-sm text-gray-700">{s.grade_level}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Unlocked</div>
                        <div className="mt-1 text-sm text-gray-700">{s.unlocked_courses}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total Paid</div>
                        <div className="mt-1 text-sm text-gray-700">{moneyINR(s.total_paid_paise)}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">Last payment: {s.last_payment_at || "-"}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => onEditStudent(s)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteStudent(s.student_id)}
                        className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {studentRows.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    No students found.
                  </div>
                )}
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[960px] w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Phone</th>
                      <th className="text-left px-4 py-3">Grade</th>
                      <th className="text-left px-4 py-3">Unlocked</th>
                      <th className="text-left px-4 py-3">Total Paid</th>
                      <th className="text-left px-4 py-3">Last Payment</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((s) => (
                      <tr key={s.student_id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-semibold text-gray-900">{s.student_name}</td>
                        <td className="px-4 py-3 text-gray-700">{s.email}</td>
                        <td className="px-4 py-3 text-gray-700">{s.phone_number}</td>
                        <td className="px-4 py-3 text-gray-700">{s.grade_level}</td>
                        <td className="px-4 py-3 text-gray-700">{s.unlocked_courses}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {moneyINR(s.total_paid_paise)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.last_payment_at || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => onEditStudent(s)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteStudent(s.student_id)}
                              className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {studentRows.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={8}>
                          No students found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={pagination.students.page}
                totalPages={studentTotalPages}
                rowsPerPage={pagination.students.size}
                onPageChange={(page) =>
                  updatePage("students", Math.min(Math.max(page, 1), studentTotalPages))
                }
                onRowsPerPageChange={(size) => updatePageSize("students", size)}
              />
            </section>
          )}

          {tab === "purchases" && (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5 md:p-6">
                <h2 className="text-lg font-bold text-gray-900">Course Purchases</h2>
                <p className="mt-1 text-sm text-gray-500">Monitor transaction status, providers, and purchase history across the platform.</p>
              </div>
              <div className="space-y-4 p-4 lg:hidden">
                {paginatedPurchases.map((r, idx) => (
                  <div key={`${r.student_id}-${r.course_id}-${idx}`} className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-900">{r.course_title}</div>
                        <div className="mt-1 text-sm text-gray-500">{r.student_name} • {r.email}</div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        r.payment_status === "paid"
                          ? "bg-green-50 border-green-100 text-green-700"
                          : "bg-amber-50 border-amber-100 text-amber-700"
                      }`}>
                        {r.payment_status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Teacher</div>
                        <div className="mt-1 text-sm text-gray-700">{r.teacher_name}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Amount</div>
                        <div className="mt-1 text-sm text-gray-700">{r.amount_paise ? moneyINR(r.amount_paise) : "-"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Provider</div>
                        <div className="mt-1 text-sm text-gray-700">{r.provider || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Updated</div>
                        <div className="mt-1 text-sm text-gray-700">{r.payment_updated_at || r.unlocked_at || "-"}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {purchaseRows.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    No purchases found.
                  </div>
                )}
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">Student</th>
                      <th className="text-left px-4 py-3">Course</th>
                      <th className="text-left px-4 py-3">Teacher</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Provider</th>
                      <th className="text-left px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPurchases.map((r, idx) => (
                      <tr key={`${r.student_id}-${r.course_id}-${idx}`} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{r.student_name}</div>
                          <div className="text-xs text-gray-500">{r.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{r.course_title}</div>
                          <div className="text-xs text-gray-500">Price: {formatINR(r.price || 0)}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.teacher_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            r.payment_status === "paid"
                              ? "bg-green-50 border-green-100 text-green-700"
                              : "bg-amber-50 border-amber-100 text-amber-700"
                          }`}>
                            {r.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.amount_paise ? moneyINR(r.amount_paise) : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.provider || "-"}{" "}
                          <span className="text-xs text-gray-500">
                            {r.payment_provider_status ? `(${r.payment_provider_status})` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.payment_updated_at || r.unlocked_at || "-"}</td>
                      </tr>
                    ))}
                    {purchaseRows.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={7}>
                          No purchases found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={pagination.purchases.page}
                totalPages={purchaseTotalPages}
                rowsPerPage={pagination.purchases.size}
                onPageChange={(page) =>
                  updatePage("purchases", Math.min(Math.max(page, 1), purchaseTotalPages))
                }
                onRowsPerPageChange={(size) => updatePageSize("purchases", size)}
              />
            </section>
          )}
          </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
