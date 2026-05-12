import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { getQuestions } from "../../services/questionService";
import { getSubjects } from "../../services/subjectService";
import { addQuestionToTest, getTestDetail, getTestQuestions } from "../../services/testService";
import { GRADE_OPTIONS, formatGradeLevel } from "../../utils/grade";
import { FiPlus, FiSearch, FiFilter, FiBook, FiCheckCircle, FiAlertCircle, FiLoader, FiX, FiRefreshCw } from "react-icons/fi";

export default function TestQuestions() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const numericTestId = Number(testId);

  const [questions, setQuestions] = useState([]);
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [testInfo, setTestInfo] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingAddedQuestions, setLoadingAddedQuestions] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total } while adding all

  // Helper function to safely handle arrays
  const ensureArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.questions && Array.isArray(data.questions)) return data.questions;
    return [];
  };

  useEffect(() => {
    fetchSubjects();
    if (numericTestId) {
      fetchTestDetail();
      fetchAddedQuestions();
    }
  }, [numericTestId]);

  useEffect(() => {
    if (selectedSubjectId && gradeLevel && numericTestId) {
      fetchQuestions({
        subjectId: selectedSubjectId,
        grade: gradeLevel,
      });
    }
  }, [selectedSubjectId, gradeLevel, numericTestId]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const data = await getSubjects();
      setSubjects(ensureArray(data));
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Failed to load subjects");
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTestDetail = async () => {
    try {
      const data = await getTestDetail(numericTestId);
      setTestInfo(data || null);
      if (data?.subject_id) {
        setSelectedSubjectId(String(data.subject_id));
      }
      if (data?.target_grade_level) {
        setGradeLevel(String(data.target_grade_level));
      }
    } catch (err) {
      console.error("Error fetching test detail:", err);
      setError(err.message || "Failed to load test details");
    }
  };

  // Fetch available questions
  const fetchQuestions = async (overrides = {}) => {
    const subjectId = overrides.subjectId || selectedSubjectId;
    const grade = overrides.grade || gradeLevel;

    if (!subjectId || !grade) {
      setError("Please select both Subject and Grade Level");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoadingQuestions(true);
      const data = await getQuestions({
        subject_id: Number(subjectId),
        grade_level: Number(grade),
        test_id: numericTestId,
      });
      
      // Get the array of questions from the response
      const fetchedQuestions = ensureArray(data?.data || data);
      
      // Filter out questions that are already added
      const safeAddedQuestions = ensureArray(addedQuestions);
      const availableQuestions = fetchedQuestions.filter(q => 
        !safeAddedQuestions.some(aq => aq && String(aq.question_id) === String(q.question_id))
      );
      
      setQuestions(availableQuestions);
      
      if (availableQuestions.length === 0 && fetchedQuestions.length > 0) {
        setSuccess(`All questions for ${getSubjectName(subjectId)}, Grade ${grade} are already added to the test`);
      } else if (fetchedQuestions.length === 0) {
        setError(`No questions found for ${getSubjectName(subjectId)}, Grade ${grade}`);
      }
      
    } catch (err) {
      setError(err.message || "Failed to fetch questions");
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch already added questions
  const fetchAddedQuestions = async () => {
    if (!numericTestId) {
      setAddedQuestions([]);
      return;
    }

    try {
      setLoadingAddedQuestions(true);
      const data = await getTestQuestions(numericTestId);
      
      // Handle different response structures
      let questionsArray = [];
      
      if (Array.isArray(data)) {
        questionsArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        questionsArray = data.data;
      } else if (data && data.questions && Array.isArray(data.questions)) {
        questionsArray = data.questions;
      } else if (data && data.items && Array.isArray(data.items)) {
        questionsArray = data.items;
      } else if (data && typeof data === 'object') {
        // Try to extract any array from the response
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          questionsArray = possibleArrays[0];
        }
      }
      
      setAddedQuestions(questionsArray);
      
    } catch (err) {
      console.error("Error fetching added questions:", err);
      setAddedQuestions([]);
      setError("Failed to load added questions. Please try refreshing.");
    } finally {
      setLoadingAddedQuestions(false);
    }
  };

  // Add question to test
  const addToTest = async (question) => {
    if (!numericTestId) {
      setError("Test ID is missing");
      return;
    }

    setAddingQuestion(question.question_id);
    try {
      const correctMarks = Number(question.marks) > 0 ? Number(question.marks) : 1;
      const negativeMarks =
        question.negative_marks !== null && question.negative_marks !== undefined
          ? Number(question.negative_marks)
          : 0;

      // Call API to add question to test (carry over the question's own marks config)
      await addQuestionToTest({
        test_id: numericTestId,
        question_id: Number(question.question_id),
        correct_marks: correctMarks,
        negative_marks: negativeMarks,
      });

      // Add the question to added questions list
      setAddedQuestions(prev => {
        const current = ensureArray(prev);
        const questionToAdd = {
          question_id: question.question_id,
          question_text: question.question_text,
          subject_id: question.subject_id,
          subject_name: question.subject_name || getSubjectName(question.subject_id),
          grade_level: question.grade_level,
          complexity_level: question.complexity_level,
          correct_marks: correctMarks,
          negative_marks: negativeMarks,
        };
        return [...current, questionToAdd];
      });
      
      // Remove from available questions
      setQuestions(prev => {
        const current = ensureArray(prev);
        return current.filter(q => String(q.question_id) !== String(question.question_id));
      });
      
      setSuccess(`Question "${question.question_text.substring(0, 50)}..." added successfully!`);
      
    } catch (err) {
      console.error("Error adding question:", err);
      setError(err.message || "Failed to add question. Please check if question is already added.");
    } finally {
      setAddingQuestion(null);
    }
  };

  // Add every currently-listed available question to the test.
  const addAllToTest = async () => {
    if (!numericTestId) {
      setError("Test ID is missing");
      return;
    }

    const queue = ensureArray(questions).filter(
      (q) => !isQuestionAdded(q.question_id)
    );
    if (queue.length === 0) return;

    setError("");
    setSuccess("");
    setBulkProgress({ done: 0, total: queue.length });

    const addedNow = [];
    const failures = [];

    for (let i = 0; i < queue.length; i++) {
      const question = queue[i];
      const correctMarks = Number(question.marks) > 0 ? Number(question.marks) : 1;
      const negativeMarks =
        question.negative_marks !== null && question.negative_marks !== undefined
          ? Number(question.negative_marks)
          : 0;

      try {
        await addQuestionToTest({
          test_id: numericTestId,
          question_id: Number(question.question_id),
          correct_marks: correctMarks,
          negative_marks: negativeMarks,
        });
        addedNow.push({
          question_id: question.question_id,
          question_text: question.question_text,
          subject_id: question.subject_id,
          subject_name:
            question.subject_name || getSubjectName(question.subject_id),
          grade_level: question.grade_level,
          complexity_level: question.complexity_level,
          correct_marks: correctMarks,
          negative_marks: negativeMarks,
        });
      } catch (err) {
        failures.push({
          question_id: question.question_id,
          message: err?.message || "Failed to add",
        });
      } finally {
        setBulkProgress({ done: i + 1, total: queue.length });
      }
    }

    if (addedNow.length > 0) {
      const addedIds = new Set(addedNow.map((q) => String(q.question_id)));
      setAddedQuestions((prev) => [...ensureArray(prev), ...addedNow]);
      setQuestions((prev) =>
        ensureArray(prev).filter((q) => !addedIds.has(String(q.question_id)))
      );
    }

    setBulkProgress(null);

    if (failures.length === 0) {
      setSuccess(`Added all ${addedNow.length} question${addedNow.length === 1 ? "" : "s"} to the test.`);
    } else if (addedNow.length === 0) {
      setError(`Failed to add questions. ${failures[0].message}`);
    } else {
      setSuccess(`Added ${addedNow.length} of ${queue.length} questions.`);
      setError(`${failures.length} question${failures.length === 1 ? "" : "s"} could not be added.`);
    }
  };

  // Check if question is already added
  const isQuestionAdded = (questionId) => {
    const safeAddedQuestions = ensureArray(addedQuestions);
    return safeAddedQuestions.some(aq => aq && String(aq.question_id) === String(questionId));
  };

  // Get subject name by ID
  const getSubjectName = (subjectId) => {
    if (!subjectId) return "Unknown Subject";
    const subject = subjects.find(s => s.subject_id == subjectId);
    if (subject) return subject.subject_name;
    if (testInfo?.subject_id == subjectId && testInfo?.subject_name) {
      return testInfo.subject_name;
    }
    return `Subject ${subjectId}`;
  };

  // Refresh all data
  const refreshAll = async () => {
    setError("");
    setSuccess("Refreshing...");
    
    if (selectedSubjectId && gradeLevel) {
      await fetchQuestions({ subjectId: selectedSubjectId, grade: gradeLevel });
    }
    
    if (numericTestId) {
      await fetchAddedQuestions();
    }
    
    setSuccess("Data refreshed successfully!");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Auto-clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Get available questions
  const availableQuestions = ensureArray(questions);
  const safeAddedQuestions = ensureArray(addedQuestions);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-x-hidden">
      <AdminSidebar />

      <main className="flex-1 px-3 pt-24 pb-6 sm:px-4 md:px-6 lg:ml-64 lg:pt-6 transition-all duration-300">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Questions to Test</h1>
                <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2 flex items-center gap-2 flex-wrap">
                  <span>Test ID:</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded border border-gray-300">{testId}</span>
                </p>
                {testInfo && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 break-words">
                    {testInfo.test_name} · {testInfo.subject_name || getSubjectName(testInfo.subject_id)} · {formatGradeLevel(testInfo.target_grade_level)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={refreshAll}
                  className="px-3 py-2 sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm"
                  title="Refresh both lists"
                >
                  <FiRefreshCw className={loadingAddedQuestions ? "animate-spin" : ""} />
                  Refresh
                </button>
                <div className="px-3 py-2 sm:px-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-xs sm:text-sm font-medium text-indigo-700">
                    {safeAddedQuestions.length} added
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Display */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">Success</p>
                  <p className="text-green-600 text-sm mt-1">{success}</p>
                </div>
                <button 
                  onClick={() => setSuccess("")}
                  className="text-green-500 hover:text-green-700"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button 
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Panel - Available Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-200 overflow-hidden">
              {/* Panel Header */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FiFilter className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">Available Questions</h2>
                      <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Select Subject and Grade Level to load questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      {availableQuestions.length} available
                    </span>
                    <button
                      onClick={addAllToTest}
                      disabled={
                        bulkProgress !== null ||
                        addingQuestion !== null ||
                        availableQuestions.length === 0
                      }
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap ${
                        bulkProgress !== null ||
                        addingQuestion !== null ||
                        availableQuestions.length === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                      }`}
                      title="Add every question shown below"
                    >
                      {bulkProgress !== null ? (
                        <>
                          <FiLoader className="animate-spin" />
                          Adding {bulkProgress.done}/{bulkProgress.total}
                        </>
                      ) : (
                        <>
                          <FiPlus />
                          Add All
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Section */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Subject Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
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
                      <p className="text-xs text-gray-500 mt-1">Loading subjects...</p>
                    )}
                  </div>

                  {/* Grade Level Input — locked to the test's target grade so
                       only matching-grade questions can be added. */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Level *
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      disabled={!!testInfo?.target_grade_level}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        testInfo?.target_grade_level
                          ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    >
                      <option value="">Select Grade</option>
                      {GRADE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      {testInfo?.target_grade_level
                        ? `Locked to this test's grade (${formatGradeLevel(testInfo.target_grade_level)}).`
                        : "Choose Grade 9–12 or Dropper"}
                    </p>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={fetchQuestions}
                      disabled={loadingQuestions || !selectedSubjectId || !gradeLevel}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        !selectedSubjectId || !gradeLevel
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800'
                      }`}
                    >
                      {loadingQuestions ? (
                        <>
                          <FiLoader className="animate-spin" />
                          Loading Questions...
                        </>
                      ) : (
                        <>
                          <FiSearch />
                          Load Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {(!selectedSubjectId || !gradeLevel) && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Please select both Subject and Grade Level to load questions
                    </p>
                  </div>
                )}

                {/* Selected Subject Info */}
                {selectedSubjectId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Loading questions for: <span className="font-bold">{getSubjectName(selectedSubjectId)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="h-[calc(100vh-400px)] overflow-y-auto">
                {loadingQuestions ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">
                        Loading questions for {getSubjectName(selectedSubjectId)}, Grade {gradeLevel}...
                      </p>
                    </div>
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 p-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FiBook className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedSubjectId && gradeLevel ? 'No questions available' : 'Select filters to load questions'}
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                      {selectedSubjectId && gradeLevel 
                        ? `No questions found for ${getSubjectName(selectedSubjectId)}, Grade ${gradeLevel}`
                        : 'Select Subject and Grade Level above to see available questions'
                      }
                    </p>
                    {selectedSubjectId && gradeLevel && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={refreshAll}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                        >
                          Refresh List
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/questions?subjectId=${selectedSubjectId}&grade=${gradeLevel}&openCreate=1`
                            )
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Create Question
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableQuestions.map((question) => (
                      <div
                        key={question.question_id}
                        className="p-4 sm:p-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-medium shadow-sm flex-shrink-0">
                                Q
                              </div>
                              <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                {formatGradeLevel(question.grade_level)}
                              </span>
                              <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium ${
                                question.complexity_level === 'EASY'
                                  ? 'bg-green-100 text-green-800'
                                  : question.complexity_level === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {question.complexity_level}
                              </span>
                              <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full">
                                {question.subject_name || getSubjectName(question.subject_id)}
                              </span>
                            </div>

                            <p className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-lg break-words">
                              {question.question_text}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                              {question.options?.slice(0, 4).map((option, index) => (
                                <div
                                  key={option.option_id}
                                  className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${
                                    option.is_correct
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                                    option.is_correct
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + index)}
                                  </div>
                                  <span className={`text-xs sm:text-sm break-words ${option.is_correct ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                                    {option.option_text}
                                    {option.is_correct && (
                                      <span className="ml-2 text-green-600">✓</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {question.topic_tag && (
                              <div className="flex items-center gap-2 mt-2 sm:mt-3">
                                <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full">
                                  Topic: {question.topic_tag}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 sm:self-start">
                            <button
                              onClick={() => addToTest(question)}
                              disabled={
                                addingQuestion === question.question_id ||
                                isQuestionAdded(question.question_id) ||
                                bulkProgress !== null
                              }
                              className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm ${
                                addingQuestion === question.question_id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                                  : isQuestionAdded(question.question_id)
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300'
                                  : bulkProgress !== null
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md'
                              }`}
                            >
                              {addingQuestion === question.question_id ? (
                                <>
                                  <FiLoader className="animate-spin" />
                                  Adding...
                                </>
                              ) : isQuestionAdded(question.question_id) ? (
                                <>
                                  <FiCheckCircle />
                                  Added
                                </>
                              ) : (
                                <>
                                  <FiPlus />
                                  Add to Test
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Added Questions */}
          <div>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-200 overflow-hidden lg:sticky lg:top-6">
              {/* Panel Header */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <FiCheckCircle className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">Added Questions</h2>
                      <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Questions in this test</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {loadingAddedQuestions && (
                      <FiLoader className="animate-spin text-green-600" />
                    )}
                    <div className="text-base sm:text-lg font-bold text-green-700">
                      {safeAddedQuestions.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Added Questions List */}
              <div className="max-h-[60vh] lg:h-[calc(100vh-400px)] overflow-y-auto">
                {loadingAddedQuestions ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">
                        Loading added questions...
                      </p>
                    </div>
                  </div>
                ) : safeAddedQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 p-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FiPlus className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Test is empty</h3>
                    <p className="text-gray-500 text-center max-w-xs">
                      Add questions from the available list to build your test
                    </p>
                    <button
                      onClick={fetchAddedQuestions}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Refresh List
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {safeAddedQuestions.map((question, index) => (
                      <div
                        key={question.question_id || index}
                        className="p-4 hover:bg-gray-50 transition-colors group relative"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-lg flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
                              {question.question_text || `Question ${question.question_id || index + 1}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {question.subject_name || getSubjectName(question.subject_id)}
                              </span>
                              <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                Marks: {question.correct_marks || 1}
                              </span>
                              <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                Negative: {question.negative_marks || 0}
                              </span>
                              {question.grade_level && (
                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                                  {formatGradeLevel(question.grade_level)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-1 sm:mb-2 flex-wrap">
                    <div className="text-xs sm:text-sm">
                      <span className="text-gray-600">Questions: </span>
                      <span className="font-bold text-gray-900">{safeAddedQuestions.length}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>
                    <div className="text-xs sm:text-sm">
                      <span className="text-gray-600">Total Marks: </span>
                      <span className="font-bold text-gray-900">
                        {safeAddedQuestions.reduce((sum, q) => sum + (q.correct_marks || 1), 0)}
                      </span>
                    </div>
                  </div>
                  {selectedSubjectId && (
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 break-words">
                      Subject: {getSubjectName(selectedSubjectId)} | Grade: {gradeLevel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
