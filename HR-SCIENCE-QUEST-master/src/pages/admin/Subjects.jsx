import Swal from "sweetalert2";
import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../services/subjectService";
import {
  FiBook,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubjects = async () => {
    try {
      setPageLoading(true);
      setError("");
      const data = await getSubjects();
      setSubjects(data || []);
    } catch (err) {
      setError(err.message || "Unable to load subjects.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        subject.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [subjects, searchTerm]
  );

  const subjectStats = useMemo(() => {
    const total = subjects.length;
    const visible = filteredSubjects.length;
    const searchActive = searchTerm.trim().length > 0;

    return { total, visible, searchActive };
  }, [subjects.length, filteredSubjects.length, searchTerm]);

  const resetEditState = () => {
    setEditingId(null);
    setEditValue("");
    setSavingId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Subject name required",
        text: "Please enter a valid subject name.",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createSubject({ subject_name: name.trim() });

      Swal.fire({
        icon: "success",
        title: "Subject created",
        text: `${name.trim()} added successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });

      setName("");
      await fetchSubjects();
    } catch (err) {
      const msg =
        err?.message?.includes("already")
          ? "This subject already exists."
          : err?.message || "Something went wrong";

      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (subject) => {
    setEditingId(subject.subject_id);
    setEditValue(subject.subject_name || "");
  };

  const handleSaveEdit = async (id) => {
    if (!editValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Subject name required",
        text: "Please enter a valid subject name before saving.",
      });
      return;
    }

    try {
      setSavingId(id);
      await updateSubject({
        subject_id: id,
        subject_name: editValue.trim(),
      });

      Swal.fire({
        icon: "success",
        title: "Subject updated",
        timer: 1200,
        showConfirmButton: false,
      });

      resetEditState();
      await fetchSubjects();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err?.message || "Something went wrong",
      });
      setSavingId(null);
    }
  };

  const handleDelete = async (subject) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete subject?",
      text: `This will remove "${subject.subject_name}" only if it is not linked anywhere.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });

    if (!confirm.isConfirmed) return;

    try {
      setDeletingId(subject.subject_id);
      await deleteSubject(subject.subject_id);
      Swal.fire({
        icon: "success",
        title: "Subject deleted",
        timer: 1200,
        showConfirmButton: false,
      });
      if (editingId === subject.subject_id) resetEditState();
      await fetchSubjects();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.message || "Unable to delete subject.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
        <AdminSidebar />
        <main className="px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-white/70 bg-white/80 shadow-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="text-sm font-medium text-slate-600">Loading subjects...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      <AdminSidebar />

      <main className="px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:px-8 lg:pt-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <FiBook className="text-sm" />
                  Academic Setup
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Subjects Management
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                  Create subjects, keep names consistent, and manage your course categories from one clean place.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total subjects</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{subjectStats.total}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Visible now</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{subjectStats.visible}</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Search status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {subjectStats.searchActive ? "Filtered view" : "Showing all"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Subject</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add short and clear names so teachers can identify subjects quickly.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-500">
                  <FiPlus className="text-lg" />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="For example: Mathematics, Physics, Chemistry"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    Tip: keep names unique and avoid extra spaces so reports stay clean.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiPlus />
                    {loading ? "Creating..." : "Create Subject"}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick Search</h2>
              <p className="mt-1 text-sm text-slate-500">
                Find an existing subject and update its name instantly.
              </p>

              <div className="relative mt-6">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by subject name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How this works</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>1. Create a subject with a simple name.</li>
                  <li>2. Use search to find any existing subject quickly.</li>
                  <li>3. Click edit, update the name, and save instantly.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subject Directory</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review all subjects and keep names professional and consistent.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""} shown
              </div>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <FiBook className="text-2xl text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No subjects found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {searchTerm ? "Try a different search term." : "Create your first subject to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">#</th>
                      <th className="px-6 py-4 text-left font-semibold">Subject ID</th>
                      <th className="px-6 py-4 text-left font-semibold">Subject Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((subject, index) => {
                      const isEditing = editingId === subject.subject_id;
                      const isSaving = savingId === subject.subject_id;
                      const isDeleting = deletingId === subject.subject_id;

                      return (
                        <tr
                          key={subject.id || subject.subject_id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {subject.subject_id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(subject.subject_id);
                                  if (e.key === "Escape") resetEditState();
                                }}
                                className="w-full max-w-md rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                  <FiBook className="text-base" />
                                </div>
                                <div className="font-semibold text-slate-900">
                                  {subject.subject_name}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(subject.subject_id)}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                    title="Save subject"
                                  >
                                    <FiCheck />
                                  </button>
                                  <button
                                    onClick={resetEditState}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    title="Cancel"
                                  >
                                    <FiX />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(subject)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    title="Edit subject"
                                  >
                                    <FiEdit2 />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(subject)}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                    title="Delete subject"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
