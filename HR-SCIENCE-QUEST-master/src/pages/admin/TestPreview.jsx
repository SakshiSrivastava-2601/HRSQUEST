import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import {
  getTestQuestions,
  deleteTestQsn,
  updateTestQsn
} from "../../services/testService";
import { resolveApiUrl } from "../../services/api";
import { 
  FiCheckCircle, FiClock, FiBarChart2, FiArrowLeft, 
  FiPrinter, FiDownload, FiBook, FiAlertCircle, 
  FiLoader, FiEdit2, FiTrash2, FiX, FiSave
} from "react-icons/fi";
import Swal from "sweetalert2";

export default function TestPreview() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const numericTestId = testId ? Number(testId) : null;
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testSummary, setTestSummary] = useState({
    totalMarks: 0,
    totalQuestions: 0,
    duration: 0
  });
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    question_text: "",
    correct_marks: "",
    negative_marks: 0,
    difficulty_level: "MEDIUM",
    explanation_text: "",
    options: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Helper function to safely extract array from API response
  const ensureArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.questions && Array.isArray(data.questions)) return data.questions;
    if (data.items && Array.isArray(data.items)) return data.items;
    
    // Try to find any array in the response object
    if (typeof data === 'object' && data !== null) {
      const arrays = Object.values(data).filter(val => Array.isArray(val));
      if (arrays.length > 0) return arrays[0];
    }
    
    return [];
  };

  // Helper to safely access options
  const getOptions = (question) => {
    if (!question) return [];
    if (Array.isArray(question.options)) return question.options;
    if (question.options?.data && Array.isArray(question.options.data)) return question.options.data;
    return [];
  };

  // Show notification using SweetAlert2
  const showNotification = (type, title, text, timer = 3000) => {
    Swal.fire({
      icon: type,
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: type === 'success' ? '#10B981' : 
                 type === 'error' ? '#EF4444' : 
                 type === 'info' ? '#3B82F6' : '#F59E0B',
      color: 'white',
    });
  };

  // Fetch questions from API - will be called after every update/delete
  const fetchQuestions = useCallback(async () => {
    if (!numericTestId || isNaN(numericTestId)) {
      setError("Invalid Test ID");
      setLoading(false);
      showNotification('error', "Invalid Test ID", "Please check the test ID and try again.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await getTestQuestions(numericTestId);
      
      // Safely extract questions array
      const questionsArray = ensureArray(response);
      
      if (questionsArray.length === 0) {
        console.log("No questions found for test:", numericTestId);
      }
      
      setQuestions(questionsArray);
      
      // Calculate test summary
      if (questionsArray.length > 0) {
        const totalMarks = questionsArray.reduce((sum, q) => {
          const marks = Number(q.correct_marks);
          return sum + (isNaN(marks) ? 1 : marks);
        }, 0);
        const totalQuestions = questionsArray.length;
        const duration = Math.ceil(totalQuestions * 1.5); // 1.5 minutes per question
        
        setTestSummary({
          totalMarks,
          totalQuestions,
          duration
        });
      } else {
        setTestSummary({
          totalMarks: 0,
          totalQuestions: 0,
          duration: 0
        });
      }
    } catch (err) {
      console.error("Error fetching test questions:", err);
      const errorMessage = err.message || "Failed to load test preview. Please check your connection and try again.";
      setError(errorMessage);
      showNotification('error', "Load Failed", errorMessage);
      setQuestions([]);
      setTestSummary({
        totalMarks: 0,
        totalQuestions: 0,
        duration: 0
      });
    } finally {
      setLoading(false);
    }
  }, [numericTestId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handle edit button click
  const handleEditClick = (question) => {
    if (!question || !question.question_id) {
      showNotification('error', "Invalid Question", "Cannot edit invalid question");
      return;
    }

    const options = getOptions(question);
    
    setEditingQuestionId(question.question_id);
    setEditFormData({
      question_text: question.question_text || "",
      correct_marks: question.marks || 1,
      negative_marks: question.negative_marks || 0,
      difficulty_level: question.difficulty_level || question.complexity_level || "MEDIUM",
      explanation_text: question.explanation_text || "",
      options: options.map(opt => ({
        option_id: opt.option_id || null,
        option_text: opt.option_text || "",
        is_correct: Boolean(opt.is_correct)
      }))
    });
  };

  // Handle delete button click - ALWAYS REFRESH FROM API
  const handleDeleteClick = async (questionId) => {
    if (!questionId) {
      showNotification('error', "Invalid Question", "Cannot delete invalid question");
      return;
    }

    // Confirm deletion using SweetAlert2
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This question will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setActionInProgress(`delete-${questionId}`);
      setIsSubmitting(true);
      
      // Call API to delete question
      await deleteTestQsn(questionId);
      
      // Show success message
      showNotification('success', "Deleted!", "Question has been deleted successfully!", 2000);
      
      // If we were editing this question, cancel edit mode
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
        setEditFormData({
          question_text: "",
          correct_marks: "",
          negative_marks: 0,
          difficulty_level: "MEDIUM",
          explanation_text: "",
          options: []
        });
      }
      
      // IMPORTANT: Refresh data from API to get updated list
      await fetchQuestions();
      
    } catch (err) {
      console.error("Error deleting question:", err);
      let errorMsg = err.message || "Failed to delete question. Please try again.";
      
      // Handle specific error cases
      if (err.message.includes('network') || err.message.includes('Network')) {
        errorMsg = "Network error. Please check your connection and try again.";
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMsg = "You don't have permission to delete this question.";
      } else if (err.message.includes('404')) {
        errorMsg = "Question not found. It may have already been deleted.";
      }
      
      showNotification('error', "Delete Failed", errorMsg);
    } finally {
      setIsSubmitting(false);
      setActionInProgress(null);
    }
  };

  // Handle edit form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'correct_marks' || name === 'negative_marks' ? 
        (value === '' ? '' : Number(value)) : value
    }));
  };

  // Handle option input changes
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...editFormData.options];
    
    // For radio button (is_correct), we need special handling
    if (field === 'is_correct') {
      // Uncheck all other options
      updatedOptions.forEach((opt, i) => {
        opt.is_correct = i === index;
      });
    } else {
      updatedOptions[index] = {
        ...updatedOptions[index],
        [field]: value
      };
    }
    
    setEditFormData(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  // Save edited question - ALWAYS REFRESH FROM API
  const handleSaveEdit = async () => {
    if (!editingQuestionId) {
      showNotification('error', "Invalid Action", "No question selected for editing");
      return;
    }

    try {
      // Validate form
      if (!editFormData.question_text.trim()) {
        showNotification('error', "Validation Error", "Question text is required");
        return;
      }
      
      // Validate correct marks
      if (isNaN(editFormData.correct_marks) || editFormData.correct_marks <= 0) {
        showNotification('error', "Validation Error", "Correct marks must be a positive number");
        return;
      }
      
      // Filter non-empty options
      const nonEmptyOptions = editFormData.options.filter(opt => 
        opt && opt.option_text && opt.option_text.trim() !== ""
      );
      
      if (nonEmptyOptions.length < 2) {
        showNotification('error', "Validation Error", "At least 2 options are required");
        return;
      }
      
      const hasCorrectOption = nonEmptyOptions.some(opt => opt.is_correct);
      if (!hasCorrectOption) {
        showNotification('error', "Validation Error", "Please mark one option as correct");
        return;
      }

      // Validate negative marks (stored as a positive penalty, must be ≥ 0)
      if (editFormData.negative_marks < 0 || isNaN(editFormData.negative_marks)) {
        showNotification('error', "Validation Error", "Negative marks must be 0 or a positive number");
        return;
      }

      setActionInProgress(`save-${editingQuestionId}`);
      setIsSubmitting(true);
      
      // Prepare data for API
      const questionData = {
        test_id: Number(numericTestId),
        question_text: String(editFormData.question_text || "").trim(),
        correct_marks: Number(editFormData.correct_marks) || 1,
        negative_marks: editFormData.negative_marks <= 0 ? Number(editFormData.negative_marks) : 0,
        difficulty_level: String(editFormData.difficulty_level || "MEDIUM"),
        explanation_text: String(editFormData.explanation_text || "").trim(),
        options: nonEmptyOptions.map((opt, index) => ({
          option_id: opt.option_id || null,
          option_text: String(opt.option_text || "").trim(),
          is_correct: Boolean(opt.is_correct),
          option_order: Number(index + 1)
        }))
      };
      
      // Call API to update question
      await updateTestQsn(Number(editingQuestionId), questionData);
      
      // Reset edit mode
      setEditingQuestionId(null);
      setEditFormData({
        question_text: "",
        correct_marks: "",
        negative_marks: 0,
        difficulty_level: "MEDIUM",
        explanation_text: "",
        options: []
      });
      
      // Show success message
      showNotification('success', "Updated!", "Question has been updated successfully!", 2000);
      
      // IMPORTANT: Refresh data from API to get updated list
      await fetchQuestions();
      
    } catch (err) {
      console.error("Error updating question:", err);
      let errorMsg = err.message || "Failed to update question. Please try again.";
      
      // Handle specific error cases
      if (err.message.includes('network') || err.message.includes('Network')) {
        errorMsg = "Network error. Please check your connection and try again.";
      } else if (err.message.includes('401') || err.message.includes('403')) {
        errorMsg = "You don't have permission to update this question.";
      } else if (err.message.includes('validation') || err.message.includes('required')) {
        errorMsg = `Validation error: ${err.message}`;
      } else if (err.message.includes('404')) {
        errorMsg = "Question not found. It may have been deleted.";
      }
      
      showNotification('error', "Update Failed", errorMsg);
    } finally {
      setIsSubmitting(false);
      setActionInProgress(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData({
      question_text: "",
      correct_marks: "",
      negative_marks: 0,
      difficulty_level: "MEDIUM",
      explanation_text: "",
      options: []
    });
  };

  const handlePrint = () => {
    try {
      const content = document.getElementById("test-preview-content");
      
      if (!content) {
        showNotification('error', "Print Error", "Print content not found");
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showNotification('error', "Print Error", "Please allow popups to print");
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Preview - Test ${testId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              line-height: 1.6; 
              font-size: 12px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
            }
            .question { 
              margin-bottom: 25px; 
              page-break-inside: avoid; 
            }
            .question-number { 
              font-weight: bold; 
              color: #4f46e5; 
              margin-bottom: 8px; 
              display: inline-block;
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .question-text { 
              margin-bottom: 15px; 
              font-size: 14px;
            }
            .option { 
              margin-bottom: 8px; 
              padding-left: 20px; 
            }
            .correct-option { 
              color: #059669; 
              font-weight: bold; 
            }
            .marks-info { 
              margin-top: 10px; 
              font-size: 0.9em; 
              color: #666; 
            }
            .summary { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
              font-size: 14px;
            }
            @media print {
              .no-print { display: none !important; }
              body { font-size: 11px; }
              .question-text { font-size: 12px; }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Test Preview</h1>
            <p>Test ID: ${testId} | Total Questions: ${testSummary.totalQuestions} | Total Marks: ${testSummary.totalMarks} | Duration: ${testSummary.duration} minutes</p>
            <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>
          ${content.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close window after printing
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 500);
    } catch (err) {
      console.error("Print error:", err);
      showNotification('error', "Print Failed", "Failed to print. Please try again.");
    }
  };

  const handleDownload = () => {
    try {
      const content = `
Test Preview - Test ID: ${testId}
Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Total Questions: ${testSummary.totalQuestions}
Total Marks: ${testSummary.totalMarks}
Estimated Duration: ${testSummary.duration} minutes

${questions.map((q, index) => {
  const options = getOptions(q);
  const correctOption = options.find(opt => opt.is_correct);
  
  return `
Question ${index + 1} (Marks: ${q.correct_marks || 1}, Negative: ${q.negative_marks || 0})
${q.question_text || `Question ${index + 1}`}

${options.map((opt, optIndex) => 
  `${String.fromCharCode(65 + optIndex)}. ${opt.option_text || `Option ${optIndex + 1}`}${opt.is_correct ? ' ✓' : ''}`
).join('\n')}

${q.explanation_text ? `Explanation: ${q.explanation_text}\n` : ''}
`;
}).join('\n')}

Answer Key:
${questions.map((q, index) => {
  const options = getOptions(q);
  const correctOption = options.find(opt => opt.is_correct);
  const optionLetter = correctOption 
    ? String.fromCharCode(65 + options.indexOf(correctOption))
    : '-';
  return `Q${index + 1}: ${optionLetter}`;
}).join(', ')}
      `;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-${testId}-preview-${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      showNotification('error', "Download Failed", "Failed to download. Please try again.");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 px-3 pt-24 pb-6 sm:px-4 md:px-6 lg:ml-64 lg:pt-6 transition-all duration-300">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Loading Test Preview</h3>
              <p className="text-sm text-gray-500">Please wait while we load the test content...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 print:bg-white overflow-x-hidden">
      <AdminSidebar />

      <main className="flex-1 px-3 pt-24 pb-6 sm:px-4 md:px-6 lg:ml-64 lg:pt-6 transition-all duration-300 print:ml-0 print:p-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  disabled={isSubmitting}
                >
                  <FiArrowLeft className="text-gray-600" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Test Preview
                  </h1>
                  <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">
                    Review the test before publishing
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={fetchQuestions}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <FiLoader className={isSubmitting ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <FiPrinter />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <FiDownload />
                Download
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Error Loading Test</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button
                    onClick={fetchQuestions}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
                    disabled={isSubmitting}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 print:grid-cols-3 print:gap-4 print:mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl md:rounded-2xl p-4 md:p-6 print:rounded-lg">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <FiBarChart2 className="text-blue-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-blue-700">Total Questions</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{testSummary.totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl md:rounded-2xl p-4 md:p-6 print:rounded-lg">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <FiCheckCircle className="text-green-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-green-700">Maximum Marks</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{testSummary.totalMarks}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl md:rounded-2xl p-4 md:p-6 print:rounded-lg">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <FiClock className="text-purple-600 text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-purple-700">Estimated Duration</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{testSummary.duration} mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div id="test-preview-content" className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-200 print:rounded-none print:border-none print:shadow-none">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 print:px-0 print:py-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Test Questions</h2>
              <div className="text-xs md:text-sm text-gray-500 print:hidden">
                Test ID: <span className="font-mono font-medium">{testId}</span>
              </div>
            </div>
          </div>

          {safeQuestions.length === 0 ? (
            <div className="text-center py-8 md:py-12 print:py-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <FiBook className="text-gray-400 text-xl md:text-2xl" />
              </div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">No Questions Added</h3>
              <p className="text-gray-500 text-sm md:text-base">
                This test doesn't have any questions yet.
                {error && (
                  <span className="block mt-2 text-red-500">Error: {error}</span>
                )}
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6 print:p-0">
              {/* Instructions */}
              <div className="mb-6 md:mb-8 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl print:mb-6">
                <p className="text-xs md:text-sm text-blue-800 font-medium mb-2">Instructions:</p>
                <ul className="text-xs md:text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Each question has only one correct answer</li>
                  <li>Correct answers are highlighted in green with a checkmark (✓)</li>
                  <li>Review all questions carefully before publishing</li>
                  <li>Click the edit icon (✎) to modify a question</li>
                  <li>Click the delete icon (🗑) to remove a question</li>
                  <li>Note: Negative marks are stored as a positive penalty value (e.g., 0.5 means −0.5)</li>
                  <li>Please save your changes after editing</li>
                </ul>
              </div>

              {/* Questions List */}
              <div className="space-y-6 md:space-y-8 print:space-y-6">
                {safeQuestions.map((q, index) => {
                  const options = getOptions(q);
                  const isEditing = editingQuestionId === q.question_id;
                  const isDeleting = actionInProgress === `delete-${q.question_id}`;
                  const isSavingThis = actionInProgress === `save-${q.question_id}`;
                  
                  return (
                    <div
                      key={q.question_id || index}
                      className={`border ${isEditing ? 'border-indigo-300 shadow-lg' : 'border-gray-200'} rounded-lg md:rounded-xl p-4 md:p-6 print:border-gray-300 print:p-4 ${isEditing ? 'bg-indigo-50' : ''}`}
                    >
                      {/* Question Header with Edit/Delete Buttons */}
                      <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6 print:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 text-indigo-800 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          {isEditing ? (
                            // Edit Question Form
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Question Text *
                                </label>
                                <textarea
                                  name="question_text"
                                  value={editFormData.question_text}
                                  onChange={handleInputChange}
                                  rows="3"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                  placeholder="Enter question text"
                                  required
                                  disabled={isSubmitting}
                                />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correct Marks *
                                  </label>
                                  <input
                                    type="number"
                                    name="correct_marks"
                                    value={editFormData.correct_marks}
                                    onChange={handleInputChange}
                                    min="0.5"
                                    step="0.5"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                    required
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Negative Marks (≥ 0)
                                  </label>
                                  <input
                                    type="number"
                                    name="negative_marks"
                                    value={editFormData.negative_marks}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.5"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                    title="Stored as a positive penalty (e.g., 0.5 means −0.5 deducted)"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Difficulty Level *
                                  </label>
                                  <select
                                    name="difficulty_level"
                                    value={editFormData.difficulty_level}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                    required
                                    disabled={isSubmitting}
                                  >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Display Question
                            <>
                              <h3 className="font-semibold text-gray-900 text-base md:text-lg print:text-base">
                                {q.question_text || `Question ${index + 1}`}
                              </h3>
                              <div className="flex flex-wrap gap-2 mt-2 md:mt-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs md:text-sm font-medium rounded-full">
                                  Marks: +{Number(q.correct_marks ?? 1)}
                                </span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs md:text-sm font-medium rounded-full">
                                  Negative: −{Number(q.negative_marks ?? 0)}
                                </span>
                                {q.complexity_level && (
                                  <span className={`px-2 py-1 text-xs md:text-sm font-medium rounded-full ${
                                    q.complexity_level === 'EASY' 
                                      ? 'bg-green-100 text-green-800'
                                      : q.complexity_level === 'MEDIUM'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {q.complexity_level}
                                  </span>
                                )}
                                {q.topic_tag && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs md:text-sm font-medium rounded-full">
                                    Topic: {q.topic_tag}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Edit/Delete Buttons */}
                        {!isEditing && (
                          <div className="flex gap-2 print:hidden">
                            <button
                              onClick={() => handleEditClick(q)}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit Question"
                              disabled={isSubmitting || isDeleting}
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(q.question_id)}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Question"
                              disabled={isSubmitting || isDeleting}
                            >
                              {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FiTrash2 size={18} />
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Save/Cancel Buttons when editing */}
                        {isEditing && (
                          <div className="flex gap-2 print:hidden">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSubmitting || isSavingThis}
                            >
                              {isSavingThis ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FiSave size={16} />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSubmitting || isSavingThis}
                            >
                              <FiX size={16} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Question image (master question) */}
                      {!isEditing && q.image_path && (
                        <div className="mb-4 ml-10 md:ml-14">
                          <img
                            src={resolveApiUrl(q.image_path)}
                            alt="Question"
                            className="block w-full max-w-full sm:max-w-md h-auto rounded-lg border border-gray-200 object-contain"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        </div>
                      )}

                      {/* Options Grid */}
                      {isEditing ? (
                        // Edit Options Form
                        <div className="space-y-3 ml-10 md:ml-14">
                          <h4 className="text-sm font-medium text-gray-700">
                            Options * (Exactly {editFormData.options.length} options)
                          </h4>
                          {editFormData.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={opt.option_text || ""}
                                  onChange={(e) => handleOptionChange(i, 'option_text', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                  required
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                  type="radio"
                                  id={`correct-${i}`}
                                  name="correct_option"
                                  checked={opt.is_correct || false}
                                  onChange={(e) => handleOptionChange(i, 'is_correct', e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                  disabled={isSubmitting}
                                />
                                <label htmlFor={`correct-${i}`} className="text-sm text-gray-600">
                                  Correct
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Display Options
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 ml-10 md:ml-14 print:ml-12">
                          {options.map((opt, i) => (
                            <div
                              key={opt.option_id || i}
                              className={`p-3 md:p-4 rounded-lg md:rounded-xl border flex items-start gap-2 md:gap-3 print:p-3 ${
                                opt.is_correct
                                  ? "bg-green-50 border-green-300 shadow-sm"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 print:w-6 print:h-6 ${
                                opt.is_correct
                                  ? "bg-green-100 text-green-700 font-bold"
                                  : "bg-gray-100 text-gray-700"
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs md:text-sm ${opt.is_correct ? "text-green-800 font-medium" : "text-gray-800"}`}>
                                  {opt.option_text || `Option ${String.fromCharCode(65 + i)}`}
                                </p>
                              </div>
                              {opt.is_correct && (
                                <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                              )}
                            </div>
                          ))}
                          
                          {/* Fallback if no options */}
                          {options.length === 0 && (
                            <div className="col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-700 text-sm">No options available for this question</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {isEditing ? (
                        <div className="mt-4 ml-10 md:ml-14">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Explanation (Optional)
                          </label>
                          <textarea
                            name="explanation_text"
                            value={editFormData.explanation_text}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                            placeholder="Enter explanation for the correct answer"
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : (
                        q.explanation_text && (
                          <div className="mt-4 md:mt-6 ml-10 md:ml-14 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl print:ml-12 print:p-3">
                            <p className="text-xs md:text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                            <p className="text-blue-800 text-xs md:text-sm">{q.explanation_text}</p>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Answer Key Summary */}
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 print:mt-8 print:pt-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 print:mb-4">Answer Key Summary</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3 print:grid-cols-10 print:gap-2">
                  {safeQuestions.map((q, index) => {
                    const options = getOptions(q);
                    const correctOption = options.find(opt => opt.is_correct);
                    const optionLetter = correctOption 
                      ? String.fromCharCode(65 + options.indexOf(correctOption))
                      : '-';
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-1 md:mb-2 print:w-8 print:h-8">
                          <span className="font-bold text-gray-900 text-sm md:text-base">{index + 1}</span>
                        </div>
                        <div className={`text-xs md:text-sm font-medium px-1 md:px-2 py-1 rounded ${
                          optionLetter !== '-'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {optionLetter}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 print:hidden">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 text-xs md:text-sm text-gray-600">
                <div>
                  <span className="font-medium">Test ID:</span>{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{testId}</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div>
                  <span className="font-medium">Generated on:</span>{' '}
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button
            onClick={handleBack}
            className="px-4 md:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            <FiArrowLeft />
            <span className="hidden md:inline">Back to Tests</span>
            <span className="md:hidden">Back</span>
          </button>
        </div>
      </main>
    </div>
  );
}
