import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { createTest, getTests, updateTest, deleteTest, publishTest, activateTest, deactivateTest } from "../../services/testService";
import { getSubjects } from "../../services/subjectService";
import { FiPlus, FiClock, FiBarChart2, FiUsers, FiEye, FiSearch, FiFileText, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";
import Swal from "sweetalert2";


export default function Tests() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Modal and edit state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    test_name: "",
    subject_id: "",
    target_grade_level: "",
    duration_minutes: "",
    max_total_marks: "",
    description: "",
  });

  // Fetch subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const data = await getSubjects();
      setSubjects(data || []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to load subjects",
        text: "Could not fetch subjects from server.",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handlePublish = async (testId) => {
    try {
      await publishTest(testId);

      Swal.fire({
        icon: "success",
        title: "Test Published",
        timer: 2000,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      });

      fetchTests();
    } catch (err) {
      Swal.fire("Error", err.message || "Publish failed", "error");
    }
  };

  const handleActivate = async (testId) => {
    try {
      await activateTest(testId);

      Swal.fire({
        icon: "success",
        title: "Test Activated",
        timer: 1500,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      });

      fetchTests();
    } catch (err) {
      Swal.fire("Error", err.message || "Activation failed", "error");
    }
  };

  const handleDeactivate = async (testId) => {
    try {
      await deactivateTest(testId);

      Swal.fire({
        icon: "success",
        title: "Test Deactivated",
        timer: 1500,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
      });

      fetchTests();
    } catch (err) {
      Swal.fire("Error", err.message || "Deactivation failed", "error");
    }
  };


  // 🔹 Fetch tests - Updated to use selectedSubjectId
  const fetchTests = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await getTests({ subject_id: selectedSubjectId });
      setTests(data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🔹 Handle subject change in filter
  const handleSubjectFilterChange = (e) => {
    setSelectedSubjectId(e.target.value);
  };

  // 🔹 Open Create Modal
  const openCreateModal = () => {
    // Pre-fill subject from filter if selected
    setFormData({
      test_name: "",
      subject_id: selectedSubjectId || "",
      target_grade_level: "",
      duration_minutes: "",
      max_total_marks: "",
      description: "",
    });

    setIsEditMode(false);
    setEditingTestId(null);
    setShowModal(true);
  };

  // 🔹 Open Edit Modal
  const openEditModal = (test) => {
    setFormData({
      test_name: test.test_name || "",
      subject_id: test.subject_id?.toString() || "",
      target_grade_level: test.target_grade_level?.toString() || "",
      duration_minutes: test.duration_minutes?.toString() || "",
      max_total_marks: test.max_total_marks?.toString() || "",
      description: test.description || "",
    });

    setIsEditMode(true);
    setEditingTestId(test.test_id);
    setShowModal(true);
  };

  // 🔹 Close Modal
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingTestId(null);

    // Reset form when closing
    setFormData({
      test_name: "",
      subject_id: "",
      target_grade_level: "",
      duration_minutes: "",
      max_total_marks: "",
      description: "",
    });
  };

  // 🔹 Handle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!formData.subject_id) {
      setError("Please select a subject");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        test_name: formData.test_name,
        subject_id: Number(formData.subject_id),
        target_grade_level: Number(formData.target_grade_level),
        duration_minutes: Number(formData.duration_minutes),
        max_total_marks: Number(formData.max_total_marks),
        description: formData.description,
      };

      if (isEditMode && editingTestId) {
        // Update existing test
        await updateTest(editingTestId, payload);

        Swal.fire({
          icon: "success",
          title: "Test Updated!",
          text: "Test has been updated successfully!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: 'white',
        });
      } else {
        // Create new test
        await createTest(payload);

        Swal.fire({
          icon: "success",
          title: "Test Created!",
          text: "Your test has been created successfully!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: 'white',
        });
      }

      // Reset form and close modal
      closeModal();

      // Reload tests list if same subject is selected
      if (selectedSubjectId === formData.subject_id) {
        fetchTests();
      }
    } catch (err) {
      const msg = err.message || "Failed to save test. Check your input.";
      setError(msg);

      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId) => {
    // Confirm deletion
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await deleteTest(testId);

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Test has been deleted successfully!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: 'white',
        });

        // Refresh tests list
        fetchTests();

      } catch (err) {
        console.error("Error deleting test:", err);
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.message || "Failed to delete test",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.subject_id === subjectId);
    return subject ? subject.subject_name : `Subject ${subjectId}`;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <AdminSidebar />

      <main className="flex-1 px-4 pt-24 pb-6 md:px-6 lg:ml-64 lg:pt-6 transition-all duration-300">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Test Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create, manage, and preview tests for your students
            </p>
          </div>

          {/* Create New Test Button */}
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-gray-900 to-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <FiPlus />
            <span>Create New Test</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* FILTER SECTION */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiSearch className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Tests</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={selectedSubjectId}
                onChange={handleSubjectFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={loadingSubjects}
              >
                <option value="">Select Subject</option>
                {loadingSubjects ? (
                  <option value="" disabled>Loading subjects...</option>
                ) : subjects.length === 0 ? (
                  <option value="" disabled>No subjects available</option>
                ) : (
                  subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))
                )}
              </select>
              {loadingSubjects && (
                <div className="text-xs text-gray-500 mt-1">Loading subjects...</div>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchTests}
                disabled={loading || !selectedSubjectId}
                className="w-full md:w-auto bg-gradient-to-r from-gray-900 to-black text-white px-8 py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <FiSearch />
                    Load Tests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TESTS LIST */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiFileText className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">Tests List</h2>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {tests.length} test{tests.length !== 1 ? 's' : ''} found
              {selectedSubjectId && ` for ${getSubjectName(parseInt(selectedSubjectId))}`}
            </span>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiFileText className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
              <p className="text-gray-500 mb-6">
                {selectedSubjectId
                  ? `No tests found for ${getSubjectName(parseInt(selectedSubjectId))}`
                  : "Select a subject and load tests or create a new test."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tests.map((test) => (
                <div
                  key={test.test_id}
                  className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{test.test_name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-500">
                          Test ID: <span className="font-mono">{test.test_id}</span>
                        </p>
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                          {getSubjectName(test.subject_id)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => openEditModal(test)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit test"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(test.test_id)}
                        disabled={loading}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Delete test"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                      {test.is_published
                        ? test.is_active
                          ? "Active"
                          : "Deactive"
                        : "Draft"}
                    </span>
                  </div>

                  {/* Test Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiClock className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium">{test.duration_minutes} mins</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiBarChart2 className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Max Marks</p>
                        <p className="font-medium">{test.max_total_marks}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FiUsers className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Grade Level</p>
                        <p className="font-medium">{test.target_grade_level}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-700 font-bold">Q</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Questions</p>
                        <p className="font-medium">{test.total_questions || 0}</p>
                      </div>
                    </div>
                  </div>

                  {test.description && (
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2">{test.description}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/admin/tests/${test.test_id}`)}
                      className="flex-1 bg-gradient-to-r from-gray-900 to-black text-white py-2.5 rounded-lg hover:opacity-90 transition-all text-center"
                    >
                      Add Questions
                    </button>

                    <button
                      onClick={() => navigate(`/admin/tests/${test.test_id}/preview`)}
                      className="px-4 py-2.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                      <FiEye />
                      Preview
                    </button>
                  </div>

                  {/* Publish / Active / Deactive Buttons */}
                  <div className="flex gap-3 mt-4">
                    {/* Publish */}
                    {!test.is_published && (
                      <button
                        onClick={() => handlePublish(test.test_id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}

                    {/* Active */}
                    {test.is_published && !test.is_active && (
                      <button
                        onClick={() => handleActivate(test.test_id)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                      >
                        Active
                      </button>
                    )}

                    {/* Deactive */}
                    {test.is_published && test.is_active && (
                      <button
                        onClick={() => handleDeactivate(test.test_id)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Deactive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE/EDIT TEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEditMode ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {isEditMode ? (
                      <FiEdit2 className="text-blue-600 text-xl" />
                    ) : (
                      <FiPlus className="text-green-600 text-xl" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isEditMode ? 'Edit Test' : 'Create New Test'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {isEditMode ? 'Update the test details' : 'Fill in all required fields to add a new test'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-gray-500 text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Test Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Name *
                    </label>
                    <input
                      name="test_name"
                      placeholder="e.g., Mathematics Mid-term Exam"
                      value={formData.test_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Subject and Grade Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        name="subject_id"
                        value={formData.subject_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        disabled={loadingSubjects}
                      >
                        <option value="">Select Subject</option>
                        {loadingSubjects ? (
                          <option value="" disabled>Loading subjects...</option>
                        ) : subjects.length === 0 ? (
                          <option value="" disabled>No subjects available</option>
                        ) : (
                          subjects.map((subject) => (
                            <option key={subject.subject_id} value={subject.subject_id}>
                              {subject.subject_name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Grade Level *
                      </label>
                      <input
                        name="target_grade_level"
                        type="number"
                        placeholder="e.g., 10"
                        value={formData.target_grade_level}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Duration and Max Marks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        name="duration_minutes"
                        type="number"
                        placeholder="e.g., 60"
                        value={formData.duration_minutes}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Marks *
                      </label>
                      <input
                        name="max_total_marks"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.max_total_marks}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      placeholder="Brief description about the test..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all flex-1 disabled:opacity-50 flex items-center justify-center gap-2 ${isEditMode
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                        : 'bg-gradient-to-r from-green-600 to-green-700'
                        }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isEditMode ? 'Saving...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          {isEditMode ? <FiSave /> : <FiPlus />}
                          {isEditMode ? 'Save Changes' : 'Create Test'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
