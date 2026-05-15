import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getQuestions, createQuestion, getTopics, updateQuestion, deleteQuestion, uploadQuestionImage } from "../../services/questionService";
import { getSubjects } from "../../services/subjectService";
import { resolveApiUrl } from "../../services/api";
import { GRADE_OPTIONS, formatGradeLevel } from "../../utils/grade";
import { FiPlus, FiFilter, FiCheckCircle, FiXCircle, FiSearch, FiBook, FiX, FiRefreshCw, FiEdit2, FiTrash2, FiSave, FiImage, FiUpload } from "react-icons/fi";
import Swal from "sweetalert2";

export default function Questions() {
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterComplexity, setFilterComplexity] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [marks, setMarks] = useState("");
  const autoOpenedRef = useRef(false);

  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // ================= CREATE/EDIT QUESTION FORM STATE =================
  const [formData, setFormData] = useState({
    question_text: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correct_index: 0,
    subject_id: "",
    grade_level: "",
    topic_tag: "",
    complexity_level: "EASY",
    explanation_text: "",
    marks:"",
    negative_marks: "",
    image_path: "",
  });

  // Load subjects on component mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const prefillSubjectId = searchParams.get("subjectId");
    const prefillGrade = searchParams.get("grade");

    if (prefillSubjectId) {
      setSubjectId(prefillSubjectId);
    }
    if (prefillGrade) {
      setGradeLevel(prefillGrade);
    }
  }, [searchParams]);

  useEffect(() => {
    const shouldAutoOpen = searchParams.get("openCreate") === "1";
    if (!shouldAutoOpen || autoOpenedRef.current) {
      return;
    }

    if (subjectId && gradeLevel) {
      openCreateModal();
      autoOpenedRef.current = true;
    }
  }, [searchParams, subjectId, gradeLevel]);

  // Load topics when subject and grade level change
  useEffect(() => {
    // Check if both values exist and are valid numbers
    const subjectIdNum = parseInt(subjectId);
    const gradeLevelNum = parseInt(gradeLevel);

    if (!isNaN(subjectIdNum) && !isNaN(gradeLevelNum)) {
      fetchTopics(subjectIdNum, gradeLevelNum);
    } else {
      // Clear topics if invalid subject/grade
      setTopicsList([]);
      setFilterTopic("");
    }
  }, [subjectId, gradeLevel]);

  // ================= FETCH SUBJECTS =================
  const fetchSubjects = async () => {
    try {
      const sub = await getSubjects();
      setSubjectsList(sub || []);
    } catch (e) {
      console.log("Subjects load failed", e);
      Swal.fire({
        icon: "error",
        title: "Failed to load subjects",
        text: "Could not fetch subjects from server.",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    }
  };

  // ================= FETCH TOPICS =================
  const fetchTopics = async (subjectId, gradeLevel) => {
    // Validate parameters are valid numbers
    if (isNaN(subjectId) || isNaN(gradeLevel)) {
      console.error("Invalid parameters for fetchTopics:", { subjectId, gradeLevel });
      setTopicsList([]);
      return;
    }

    try {
      setLoadingTopics(true);
      setFilterTopic(""); // Reset topic filter when fetching new topics

      // Pass parameters as an object with the correct names
      const topicsResponse = await getTopics({
        subject_id: subjectId,
        grade_level: gradeLevel
      });

      // Handle different API response structures
      if (Array.isArray(topicsResponse)) {
        setTopicsList(topicsResponse);
      } else if (topicsResponse?.data && Array.isArray(topicsResponse.data)) {
        setTopicsList(topicsResponse.data);
      } else if (topicsResponse?.topic_tags && Array.isArray(topicsResponse.topic_tags)) {
        setTopicsList(topicsResponse.topic_tags);
      } else if (topicsResponse?.topics && Array.isArray(topicsResponse.topics)) {
        setTopicsList(topicsResponse.topics);
      } else {
        console.warn("Unexpected topics response format:", topicsResponse);
        setTopicsList([]);
      }

    } catch (e) {
      console.error("Topics load failed", e);
      setTopicsList([]);

      Swal.fire({
        icon: "error",
        title: "Failed to load topics",
        text: e.message || "Could not fetch topics for selected subject and grade.",
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } finally {
      setLoadingTopics(false);
    }
  };

  // ================= FETCH QUESTIONS =================
  const fetchQuestions = async () => {
    // Parse to integers for validation
    const subjectIdNum = parseInt(subjectId);
    const gradeLevelNum = parseInt(gradeLevel);

    if (isNaN(subjectIdNum) || isNaN(gradeLevelNum)) {
      setError("Subject and Grade Level must be valid numbers");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await getQuestions({
        subject_id: subjectIdNum,
        grade_level: gradeLevelNum,
        topic_tag: filterTopic ? [filterTopic] : undefined, // Filter expects array
        complexity_level: filterComplexity ? [filterComplexity] : undefined,
        size: 100,
        page: 1,
      });

      setQuestions(data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle subject change in filter
  const handleSubjectChange = (e) => {
    const value = e.target.value;
    setSubjectId(value);

    if (showModal) {
      setFormData(prev => ({
        ...prev,
        subject_id: value
      }));
    }
  };

  // Handle grade level change in filter
  const handleGradeChange = (e) => {
    const value = e.target.value;
    setGradeLevel(value);

    if (showModal) {
      setFormData(prev => ({
        ...prev,
        grade_level: value
      }));
    }
  };

  // ================= OPEN CREATE MODAL =================
  const openCreateModal = () => {
    // Pre-fill subject and grade from filters if they exist
    const subjectIdNum = parseInt(subjectId);
    const gradeLevelNum = parseInt(gradeLevel);

    if (!isNaN(subjectIdNum) && !isNaN(gradeLevelNum)) {
      setFormData(prev => ({
        ...prev,
        subject_id: subjectIdNum.toString(),
        grade_level: gradeLevelNum.toString()
      }));
    }

    // Reset to create mode
    setIsEditMode(false);
    setEditingQuestionId(null);
    setShowModal(true);
  };

  // ================= OPEN EDIT MODAL =================
  const openEditModal = (question) => {
    // Find the correct option index
    let correctIndex = 0;
    const options = question.options || [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].is_correct) {
        correctIndex = i;
        break;
      }
    }

    // Set form data for editing
    setFormData({
      question_text: question.question_text || "",
      option1: options[0]?.option_text || "",
      option2: options[1]?.option_text || "",
      option3: options[2]?.option_text || "",
      option4: options[3]?.option_text || "",
      correct_index: correctIndex,
      subject_id: question.subject_id?.toString() || "",
      grade_level: question.grade_level?.toString() || "",
      topic_tag: question.topic_tag || "",
      complexity_level: question.complexity_level || "EASY",
      explanation_text: question.explanation_text || "",
      marks: question.marks?.toString() || "",
      negative_marks:
        question.negative_marks !== null && question.negative_marks !== undefined
          ? question.negative_marks.toString()
          : "",
      image_path: question.image_path || "",
    });

    // Set edit mode
    setIsEditMode(true);
    setEditingQuestionId(question.question_id);
    setShowModal(true);
  };

  // ================= CLOSE MODAL =================
  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingQuestionId(null);

    // Reset form when closing
    setFormData({
      question_text: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct_index: 0,
      subject_id: "",
      grade_level: "",
      topic_tag: "",
      complexity_level: "EASY",
      explanation_text: "",
      marks:"",
      negative_marks: "",
      image_path: "",
    });
  };

  // ================= CREATE/UPDATE QUESTION =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.marks || Number(formData.marks) <= 0) {
  Swal.fire({
    icon: "warning",
    title: "Invalid Marks",
    text: "Please enter valid marks greater than 0.",
  });
  return;
}

    const negativeMarksRaw = formData.negative_marks?.toString().trim() ?? "";
    const negativeMarksNum = negativeMarksRaw === "" ? 0 : Number(negativeMarksRaw);
    if (Number.isNaN(negativeMarksNum) || negativeMarksNum < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Negative Marks",
        text: "Negative marks must be 0 or a positive number.",
      });
      return;
    }
    if (negativeMarksNum > Number(formData.marks)) {
      Swal.fire({
        icon: "warning",
        title: "Negative marks too high",
        text: "Negative marks cannot exceed the question's marks.",
      });
      return;
    }

    // Validate question text
    if (!formData.question_text.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Question is required",
        text: "Please enter a valid question.",
      });
      return;
    }

    // Validate all options are filled
    if (!formData.option1.trim() || !formData.option2.trim() ||
      !formData.option3.trim() || !formData.option4.trim()) {
      Swal.fire({
        icon: "warning",
        title: "All options required",
        text: "Please fill all four options.",
      });
      return;
    }

    // Validate subject_id and grade_level are valid numbers
    const subjectIdNum = parseInt(formData.subject_id);
    const gradeLevelNum = parseInt(formData.grade_level);

    if (isNaN(subjectIdNum) || isNaN(gradeLevelNum)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Input",
        text: "Subject and Grade Level must be valid numbers.",
      });
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Prepare topic_tag as STRING
      const topicTagValue = formData.topic_tag?.trim() || "General";

      if (isEditMode && editingQuestionId) {
        // For UPDATE mode - need to get the question first to get option IDs
        const currentQuestion = questions.find(q => q.question_id === editingQuestionId);

        // Prepare options with option_id for update
        const optionsPayload = formData.correct_index == 0 ? [
          { option_text: formData.option1, is_correct: true },
          { option_text: formData.option2, is_correct: false },
          { option_text: formData.option3, is_correct: false },
          { option_text: formData.option4, is_correct: false }
        ] : formData.correct_index == 1 ? [
          { option_text: formData.option1, is_correct: false },
          { option_text: formData.option2, is_correct: true },
          { option_text: formData.option3, is_correct: false },
          { option_text: formData.option4, is_correct: false }
        ] : formData.correct_index == 2 ? [
          { option_text: formData.option1, is_correct: false },
          { option_text: formData.option2, is_correct: false },
          { option_text: formData.option3, is_correct: true },
          { option_text: formData.option4, is_correct: false }
        ] : [
          { option_text: formData.option1, is_correct: false },
          { option_text: formData.option2, is_correct: false },
          { option_text: formData.option3, is_correct: false },
          { option_text: formData.option4, is_correct: true }
        ];

        // Add option_id if question exists and has options
        if (currentQuestion && currentQuestion.options) {
          for (let i = 0; i < optionsPayload.length; i++) {
            if (currentQuestion.options[i]) {
              optionsPayload[i].option_id = currentQuestion.options[i].option_id;
            }
          }
        }

        const payload = {
          question_text: formData.question_text,
          subject_id: subjectIdNum,
          topic_tag: topicTagValue,
          grade_level: gradeLevelNum,
          complexity_level: formData.complexity_level,
          explanation_text: formData.explanation_text || "",
          options: optionsPayload,
          marks: Number(formData.marks),
          negative_marks: negativeMarksNum,
          image_path: formData.image_path?.trim() || null,
        };

        console.log("Update payload:", payload); // For debugging
        await updateQuestion(editingQuestionId, payload);

        Swal.fire({
          icon: "success",
          title: "Question Updated!",
          text: "Question has been updated successfully!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: 'white',
        });
      } else {
        // For CREATE mode - no option_id needed
        const payload = {
          question_text: formData.question_text,
          subject_id: subjectIdNum,
          topic_tag: topicTagValue,
          grade_level: gradeLevelNum,
          complexity_level: formData.complexity_level,
          explanation_text: formData.explanation_text || "",
          marks: Number(formData.marks),
          negative_marks: negativeMarksNum,
          image_path: formData.image_path?.trim() || null,
          options: [
            { option_text: formData.option1, is_correct: formData.correct_index == 0 },
            { option_text: formData.option2, is_correct: formData.correct_index == 1 },
            { option_text: formData.option3, is_correct: formData.correct_index == 2 },
            { option_text: formData.option4, is_correct: formData.correct_index == 3 },
          ],
        };

        console.log("Create payload:", payload); // For debugging
        await createQuestion(payload);

        Swal.fire({
          icon: "success",
          title: "Question Created!",
          text: "Your question has been added successfully!",
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

      // Reload list if filters are applied
      const currentSubjectId = parseInt(subjectId);
      const currentGradeLevel = parseInt(gradeLevel);
      if (!isNaN(currentSubjectId) && !isNaN(currentGradeLevel)) {
        fetchQuestions();
      }
    } catch (err) {
      console.error("Error saving question:", err);
      console.error("Error details:", err.response?.data); // Log detailed error

      const msg =
        err?.message?.includes("already")
          ? "This question already exists."
          : err?.response?.data?.detail?.[0]?.msg || err?.message || "Something went wrong";

      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE QUESTION =================
  const handleDelete = async (questionId) => {
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
        await deleteQuestion(questionId);

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Question has been deleted successfully!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          background: '#10B981',
          color: 'white',
        });

        // Refresh questions list
        fetchQuestions();

      } catch (err) {
        console.error("Error deleting question:", err);
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.message || "Failed to delete question",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper function to extract topic name from topic object
  const getTopicName = (topic) => {
    if (typeof topic === '') return topic;
    if (topic?.topic_name) return topic.topic_name;
    if (topic?.name) return topic.name;
    if (topic?.tag) return topic.tag;
    if (topic?.label) return topic.label;
    if (topic?.value) return topic.value;
    if (topic?.topic_tag) return topic.topic_tag;
    return String(topic);
  };

  // Helper function to extract topic value from topic object
  const getTopicValue = (topic) => {
    if (typeof topic === 'string') return topic;
    if (topic?.topic_id) return topic.topic_id;
    if (topic?.id) return topic.id;
    if (topic?.topic_name) return topic.topic_name;
    if (topic?.name) return topic.name;
    if (topic?.value) return topic.value;
    if (topic?.topic_tag) return topic.topic_tag;
    return String(topic);
  };

  // ================= IMAGE UPLOAD =================
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "warning",
        title: "Unsupported file type",
        text: "Please upload a PNG, JPG, JPEG, GIF, or WEBP image.",
      });
      e.target.value = "";
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      Swal.fire({
        icon: "warning",
        title: "Image too large",
        text: "Image must be 10 MB or smaller.",
      });
      e.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      const res = await uploadQuestionImage(file);
      setFormData((prev) => ({ ...prev, image_path: res?.image_path || "" }));
      Swal.fire({
        icon: "success",
        title: "Image uploaded",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (err) {
      console.error("Image upload failed:", err);
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: err?.message || "Could not upload image.",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleClearImage = () => {
    setFormData((prev) => ({ ...prev, image_path: "" }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Refresh topics button handler
  const handleRefreshTopics = () => {
    const subjectIdNum = parseInt(subjectId);
    const gradeLevelNum = parseInt(gradeLevel);

    if (!isNaN(subjectIdNum) && !isNaN(gradeLevelNum)) {
      fetchTopics(subjectIdNum, gradeLevelNum);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-x-hidden">
      <AdminSidebar />

      {/* Main Content */}
      <main className="min-h-screen pt-24 transition-all duration-300 lg:ml-64 lg:pt-0">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">MCQ Questions Bank</h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                Create and manage multiple choice questions for your tests
              </p>
            </div>

            {/* Create New Question Button */}
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-gray-900 to-black text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiPlus />
              <span className="hidden md:inline">Create New Question</span>
              <span className="md:hidden">Create</span>
            </button>
          </div>

          {/* FILTER SECTION - Responsive */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow border border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filter Questions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={handleSubjectChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Subject</option>
                  {subjectsList.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  value={gradeLevel}
                  onChange={handleGradeChange}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Grade</option>
                  {GRADE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Tag Dropdown (Filter Section) */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Topic Tag
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshTopics}
                    disabled={!subjectId || !gradeLevel || loadingTopics}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
                    title="Refresh topics"
                  >
                    <FiRefreshCw className={`text-xs ${loadingTopics ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    disabled={!subjectId || !gradeLevel || loadingTopics}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">All Topics</option>
                    {!subjectId || !gradeLevel ? (
                      <option value="" disabled>Select subject and grade first</option>
                    ) : loadingTopics ? (
                      <option value="" disabled>Loading topics...</option>
                    ) : topicsList.length === 0 ? (
                      <option value="" disabled>No topics available for this subject/grade</option>
                    ) : (
                      topicsList.map((topic, index) => (
                        <option key={topic?.topic_id || topic?.id || index} value={getTopicValue(topic)}>
                          {getTopicName(topic)}
                        </option>
                      ))
                    )}
                  </select>
                  {loadingTopics && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {subjectId && gradeLevel && !loadingTopics && (
                  <p className="text-xs text-gray-500 mt-1">
                    {topicsList.length} topic{topicsList.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              {/* Complexity Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={filterComplexity}
                  onChange={(e) => setFilterComplexity(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Levels</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Load Button */}
              <div className="flex items-end">
                <button
                  onClick={fetchQuestions}
                  disabled={loading || !subjectId || !gradeLevel}
                  className="w-full bg-gradient-to-r from-gray-900 to-black text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden md:inline">Loading...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch />
                      <span>Load Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* QUESTIONS LIST - Responsive */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <FiBook className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Questions List</h2>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <FiXCircle className="text-gray-400 text-xl md:text-2xl" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">No questions found</h3>
                <p className="text-gray-500 text-sm md:text-base">
                  {subjectId && gradeLevel ? "No questions match your filters" : "Apply filters to load questions"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {questions.map((q, index) => (
                  <div
                    key={q.question_id}
                    className="border border-gray-200 rounded-xl p-4 md:p-5 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3 md:mb-4">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-100 text-indigo-800 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{q.question_text}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {formatGradeLevel(q.grade_level)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${q.complexity_level === 'EASY'
                              ? 'bg-green-100 text-green-800'
                              : q.complexity_level === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {q.complexity_level}
                          </span>
                          {q.topic_tag && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {q.topic_tag}
                            </span>
                          )}
                          {q.subject_name && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                              {q.subject_name}
                            </span>
                          )}
                          {q.marks != null && (
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                              +{q.marks} mark{q.marks === 1 ? "" : "s"}
                            </span>
                          )}
                          {q.negative_marks != null && Number(q.negative_marks) > 0 && (
                            <span className="text-xs px-2 py-1 bg-rose-100 text-rose-800 rounded">
                              -{q.negative_marks}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit question"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.question_id)}
                          disabled={loading}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Delete question"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {q.image_path && (
                      <div className="ml-10 md:ml-11 mb-3">
                        <img
                          src={resolveApiUrl(q.image_path)}
                          alt="Question"
                          className="max-h-48 rounded-md border border-gray-200 object-contain"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10 md:ml-11">
                      {q.options.map((opt, i) => (
                        <div
                          key={opt.option_id}
                          className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${opt.is_correct
                              ? "bg-green-50 border-green-200 text-green-800 font-medium"
                              : "border-gray-200 text-gray-700"
                            }`}
                        >
                          <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center ${opt.is_correct
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                            }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-sm">{opt.option_text}</span>
                          {opt.is_correct && (
                            <FiCheckCircle className="ml-auto text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation Section */}
                    {q.explanation_text && (
                      <div className="mt-3 ml-10 md:ml-11">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Explanation:</span> {q.explanation_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CREATE/EDIT QUESTION MODAL */}
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
                      {isEditMode ? 'Edit Question' : 'Create New Question'}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {isEditMode ? 'Update the question details' : 'Fill in all required fields to add a new question'}
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
                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      name="question_text"
                      placeholder="Enter your question here..."
                      value={formData.question_text}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Question Image (Optional) */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FiImage className="text-indigo-600" />
                      Question Image (Optional)
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-4 py-3 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload />
                            Upload from device
                          </>
                        )}
                      </button>
                      <input
                        name="image_path"
                        type="text"
                        placeholder="…or paste image URL"
                        value={formData.image_path}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG, GIF, or WEBP (max 10 MB). You can also paste a public image URL.
                    </p>

                    {formData.image_path?.trim() && (
                      <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-600">Preview</p>
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <FiX className="text-xs" /> Remove
                          </button>
                        </div>
                        <img
                          src={resolveApiUrl(formData.image_path)}
                          alt="Question preview"
                          className="max-h-48 rounded-md border border-gray-200 object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = "block";
                          }}
                          onLoad={(e) => {
                            e.target.style.display = "block";
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = "none";
                          }}
                        />
                        <p className="text-xs text-red-600 mt-1" style={{ display: "none" }}>
                          Could not load image. Check the URL.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option A * {formData.correct_index == 0 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </label>
                      <input
                        name="option1"
                        placeholder="Enter option A"
                        value={formData.option1}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option B * {formData.correct_index == 1 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </label>
                      <input
                        name="option2"
                        placeholder="Enter option B"
                        value={formData.option2}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option C * {formData.correct_index == 2 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </label>
                      <input
                        name="option3"
                        placeholder="Enter option C"
                        value={formData.option3}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option D * {formData.correct_index == 3 && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </label>
                      <input
                        name="option4"
                        placeholder="Enter option D"
                        value={formData.option4}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Correct Answer *
                    </label>
                    <select
                      name="correct_index"
                      value={formData.correct_index}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={0}>Option A is Correct</option>
                      <option value={1}>Option B is Correct</option>
                      <option value={2}>Option C is Correct</option>
                      <option value={3}>Option D is Correct</option>
                    </select>
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
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Subject</option>
                        {subjectsList.map((subject) => (
                          <option key={subject.subject_id} value={subject.subject_id}>
                            {subject.subject_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Level *
                      </label>
                      <select
                        name="grade_level"
                        value={formData.grade_level}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Grade</option>
                        {GRADE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Topic Tag (INPUT FIELD in Create/Edit Form) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Tag (Optional)
                    </label>
                    <input
                      name="topic_tag"
                      type="text"
                      placeholder="e.g., Algebra, Geometry, Calculus"
                      value={formData.topic_tag}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      list="suggested-topics"
                    />
                    {/* Suggestions datalist from backend topics */}
                    <datalist id="suggested-topics">
                      {topicsList.map((topic, index) => (
                        <option key={topic?.topic_id || topic?.id || index} value={getTopicName(topic)}>
                          {getTopicName(topic)}
                        </option>
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">
                      Type a topic or select from suggestions. If left empty, "General" will be used.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks *
                      </label>
                      <input
                        name="marks"
                        type="number"
                        min="1"
                        required
                        value={formData.marks}
                        onChange={handleChange}
                        placeholder="e.g. 2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Negative Marks
                      </label>
                      <input
                        name="negative_marks"
                        type="number"
                        min="0"
                        step="0.25"
                        value={formData.negative_marks}
                        onChange={handleChange}
                        placeholder="e.g. 0.5 (leave 0 for no penalty)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Marks deducted for an incorrect answer. 0 means no penalty.
                      </p>
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      name="complexity_level"
                      value={formData.complexity_level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      name="explanation_text"
                      placeholder="Provide explanation for the correct answer..."
                      value={formData.explanation_text}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
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
                          {isEditMode ? 'Save Changes' : 'Create Question'}
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
