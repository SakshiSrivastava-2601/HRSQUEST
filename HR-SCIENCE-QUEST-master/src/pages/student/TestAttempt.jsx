import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAttemptStatus,
  getQuestion,
  saveAnswer,
  submitTest,
} from "../../services/studentmcqService";

export default function StudentTestAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [order, setOrder] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({}); // Store all selected options
  const [attemptData, setAttemptData] = useState(null);
  const [questionStatus, setQuestionStatus] = useState({});
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0); // Store total duration in seconds
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    loadStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (attemptData && totalDuration > 0) {
      initializeTimer();
    }
  }, [attemptData, totalDuration]);

  const initializeTimer = () => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calculate initial time left based on start time if available
    let initialTimeLeft = totalDuration;
    
    if (attemptData.started_at) {
      const startedAt = new Date(attemptData.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      initialTimeLeft = Math.max(0, totalDuration - elapsedSeconds);
    }
    
    setTimeLeft(initialTimeLeft);
    
    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setShowTimeUpModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getAttemptStatus(attemptId);
      setAttemptData(status);
      setOrder(status.current_question_order || 1);
      
      // Set total duration from test details (convert minutes to seconds)
      if (status.test_duration_minutes) {
        setTotalDuration(status.test_duration_minutes * 60);
      } else if (status.duration_minutes) {
        setTotalDuration(status.duration_minutes * 60);
      } else if (status.duration) {
        // Fallback if duration is already in minutes
        setTotalDuration(status.duration * 60);
      }
      
      const statusMap = {};
      if (status.total_questions) {
        for (let i = 1; i <= status.total_questions; i++) {
          statusMap[i] = { answered: false, skipped: false };
        }
      }
      setQuestionStatus(statusMap);
      
      await loadQuestion(status.current_question_order || 1);
    } catch (error) {
      console.error("Error loading status:", error);
      showCustomAlert("Error loading test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestion = async (qOrder) => {
    setIsLoading(true);
    try {
      const q = await getQuestion(attemptId, qOrder);
      setQuestion(q);
      
      // Get the previously selected option for this question
      const previouslySelected = selectedOptions[qOrder];
      // If question has a selected_option_id from API, use it, otherwise use local state
      if (q.selected_option_id) {
        setSelectedOptions(prev => ({
          ...prev,
          [qOrder]: q.selected_option_id
        }));
      } else if (previouslySelected) {
        // Keep the locally selected option
        setSelectedOptions(prev => ({
          ...prev,
          [qOrder]: previouslySelected
        }));
      }
    } catch (error) {
      console.error("Error loading question:", error);
      showCustomAlert("Error loading question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuestionStatus = (questionOrder, statusUpdate) => {
    setQuestionStatus(prev => ({
      ...prev,
      [questionOrder]: {
        ...prev[questionOrder],
        ...statusUpdate
      }
    }));
  };

  const handleOptionSelect = async (optionId) => {
    if (isTransitioning) return;
    
    // Update selected option for current question
    setSelectedOptions(prev => ({
      ...prev,
      [order]: optionId
    }));
    
    updateQuestionStatus(order, { answered: true, skipped: false });
    
    // Save answer to backend
    try {
      await saveAnswer({
        attempt_id: Number(attemptId),
        question_order: order,
        option_id: optionId,
      });
      console.log(`Saved answer for Q${order}: Option ${optionId}`);
    } catch (error) {
      console.error("Error saving answer:", error);
      showCustomAlert("Error saving your answer. Please try again.");
    }
  };

  const handleNavigation = async (targetOrder) => {
    if (targetOrder < 1 || targetOrder > attemptData?.total_questions || isTransitioning) return;
    
    setIsTransitioning(true);
    setOrder(targetOrder);
    
    setTimeout(async () => {
      await loadQuestion(targetOrder);
      setIsTransitioning(false);
    }, 400);
  };

  const handlePrevious = () => {
    handleNavigation(order - 1);
  };

  const handleNext = async () => {
    if (!selectedOptions[order]) {
      showCustomAlert("Please select an option before moving to the next question.");
      return;
    }
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const next = order + 1;
    
    // Make sure answer is saved
    if (selectedOptions[order]) {
      try {
        await saveAnswer({
          attempt_id: Number(attemptId),
          question_order: order,
          option_id: selectedOptions[order],
        });
      } catch (error) {
        console.error("Error saving answer:", error);
        showCustomAlert("Error saving your answer. Please try again.");
      }
    }
    
    setTimeout(async () => {
      if (next <= (attemptData?.total_questions || 0)) {
        setOrder(next);
        await loadQuestion(next);
      }
      setIsTransitioning(false);
    }, 400);
  };

  const handleSkip = async () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    updateQuestionStatus(order, { answered: false, skipped: true });
    
    // Clear selection for skipped question
    setSelectedOptions(prev => ({
      ...prev,
      [order]: null
    }));
    
    const next = order + 1;
    
    setTimeout(async () => {
      if (next <= (attemptData?.total_questions || 0)) {
        setOrder(next);
        await loadQuestion(next);
      }
      setIsTransitioning(false);
    }, 400);
  };

  const handleSubmit = async () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    setIsLoading(true);
    try {
      // Clear timer before submitting
      if (timerRef.current) clearInterval(timerRef.current);
      
      const result = await submitTest(attemptId);
      console.log("Submit Test Result:", result);
      localStorage.setItem('testResult', JSON.stringify(result));
      navigate("/student/test/result", { 
        state: { resultData: result } 
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      showCustomAlert("Error submitting test. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    setShowTimeUpModal(false);
    setIsLoading(true);
    try {
      const result = await submitTest(attemptId);
      localStorage.setItem('testResult', JSON.stringify(result));
      navigate("/student/test/result", { 
        state: { resultData: result } 
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      showCustomAlert("Error submitting test. Please try again.");
      setIsLoading(false);
    }
  };

  const getQuestionStatusColor = (qOrder) => {
    const status = questionStatus[qOrder];
    if (!status) return "bg-gray-200 text-gray-800";
    if (status.answered) return "bg-green-500 text-white";
    if (status.skipped) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getCurrentSelectedOption = () => {
    return selectedOptions[order] || null;
  };

  // Get warning level based on time left
  const getTimeWarningLevel = () => {
    if (totalDuration === 0) return 'normal';
    const percentageLeft = (timeLeft / totalDuration) * 100;
    
    if (timeLeft < 300) return 'critical'; // Less than 5 minutes
    if (timeLeft < 600) return 'warning'; // Less than 10 minutes
    if (percentageLeft < 30) return 'alert'; // Less than 30% time left
    return 'normal';
  };

  // Calculate percentage of time used
  const getTimePercentage = () => {
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  if (isLoading && !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading Test...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Time's Up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⏰</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Time's Up!</h3>
                <p className="text-gray-600">Your test time has ended. The test will be submitted automatically.</p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-red-700 font-medium">Please wait while we submit your answers...</p>
                </div>
              </div>
              
              <button
                onClick={handleAutoSubmit}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Submit Test</h3>
                <p className="text-gray-600">Are you sure you want to submit your test? This action cannot be undone.</p>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Test Summary:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Answered</div>
                    <div className="text-xl font-bold text-gray-800">
                      {Object.values(questionStatus).filter(s => s.answered).length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Skipped</div>
                    <div className="text-xl font-bold text-gray-800">
                      {Object.values(questionStatus).filter(s => s.skipped).length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">ℹ️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Notice</h3>
                <p className="text-gray-600">{alertMessage}</p>
              </div>
              
              <button
                onClick={() => setShowAlert(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-xl">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Practice Test</h1>
                <p className="text-sm text-gray-500">Question: {order} of {attemptData?.total_questions || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer with Progress Bar */}
              <div className="flex flex-col items-end">
                {/* Timer Box */}
                <div className={`px-4 py-3 rounded-xl border-2 ${
                  getTimeWarningLevel() === 'critical' 
                    ? 'border-red-300 bg-red-50 animate-pulse' 
                    : getTimeWarningLevel() === 'warning' 
                    ? 'border-orange-300 bg-orange-50' 
                    : getTimeWarningLevel() === 'alert'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-blue-200 bg-blue-50'
                }`}>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                    <div className={`text-xl font-bold ${
                      getTimeWarningLevel() === 'critical' 
                        ? 'text-red-600' 
                        : getTimeWarningLevel() === 'warning'
                        ? 'text-orange-600'
                        : getTimeWarningLevel() === 'alert'
                        ? 'text-yellow-600'
                        : 'text-gray-800'
                    }`}>
                      {formatTime(timeLeft || 0)}
                    </div>
                    {totalDuration > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Total: {Math.floor(totalDuration / 60)} min
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                {totalDuration > 0 && (
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Time Used</span>
                      <span>{Math.floor(getTimePercentage())}%</span>
                    </div>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          getTimeWarningLevel() === 'critical' 
                            ? 'bg-red-500' 
                            : getTimeWarningLevel() === 'warning'
                            ? 'bg-orange-500'
                            : getTimeWarningLevel() === 'alert'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${getTimePercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowSidePanel(!showSidePanel)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
              >
                {showSidePanel ? '◀ Hide Panel' : 'Show Panel ▶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Question Section */}
          <div className={`${showSidePanel ? 'lg:w-2/3' : 'w-full'}`}>
            <div className={`bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg">
                      Question {order}
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      {question?.marks} Marks
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      Single Correct
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={handlePrevious}
                      disabled={order <= 1}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        order <= 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      ← Previous
                    </button>
                    <button 
                      onClick={handleSkip}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium"
                    >
                      Skip →
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {question?.question_text}
                  </h2>
                  {question?.image_url && (
                    <div className="my-6">
                      <img 
                        src={question.image_url} 
                        alt="Question" 
                        className="max-w-lg mx-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {question?.options.map((opt, index) => {
                    const optionLetters = ['A', 'B', 'C', 'D'];
                    const isSelected = getCurrentSelectedOption() === opt.option_id;
                    
                    return (
                      <div
                        key={opt.option_id}
                        onClick={() => handleOptionSelect(opt.option_id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                            isSelected
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {optionLetters[index]}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 text-lg">{opt.option_text}</p>
                            {opt.image_url && (
                              <div className="mt-3">
                                <img 
                                  src={opt.image_url} 
                                  alt="Option" 
                                  className="max-w-xs rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>🚀</span>
                    <span>Submit Test</span>
                  </button>
                  
                  <div className="flex space-x-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
                      <div className="text-blue-600 mr-2">✓</div>
                      <div className="text-sm">
                        <span className="font-medium text-blue-700">Selected:</span>
                        <span className="text-blue-600 ml-1">
                          {getCurrentSelectedOption() ? 'Option ' + 
                            ['A', 'B', 'C', 'D'][
                              question?.options.findIndex(opt => opt.option_id === getCurrentSelectedOption())
                            ] || '' 
                            : 'None'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleNext}
                      disabled={!getCurrentSelectedOption()}
                      className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                        getCurrentSelectedOption()
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white hover:shadow-xl'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Next Question</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
                
                {/* Time Status Message */}
                {timeLeft > 0 && (
                  <div className={`mt-6 p-4 rounded-xl border ${
                    getTimeWarningLevel() === 'critical' 
                      ? 'border-red-200 bg-red-50' 
                      : getTimeWarningLevel() === 'warning'
                      ? 'border-orange-200 bg-orange-50'
                      : getTimeWarningLevel() === 'alert'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`text-xl ${
                        getTimeWarningLevel() === 'critical' 
                          ? 'text-red-500' 
                          : getTimeWarningLevel() === 'warning'
                          ? 'text-orange-500'
                          : getTimeWarningLevel() === 'alert'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}>
                        {getTimeWarningLevel() === 'critical' ? '⏰' : 
                         getTimeWarningLevel() === 'warning' ? '⚠️' : '⏱️'}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          getTimeWarningLevel() === 'critical' 
                            ? 'text-red-700' 
                            : getTimeWarningLevel() === 'warning'
                            ? 'text-orange-700'
                            : getTimeWarningLevel() === 'alert'
                            ? 'text-yellow-700'
                            : 'text-blue-700'
                        }`}>
                          {getTimeWarningLevel() === 'critical' 
                            ? 'Time is running out!' 
                            : getTimeWarningLevel() === 'warning'
                            ? 'Warning: Less than 10 minutes remaining.'
                            : getTimeWarningLevel() === 'alert'
                            ? 'Note: Less than 30% of time left.'
                            : 'You have sufficient time to complete the test.'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          getTimeWarningLevel() === 'critical' 
                            ? 'text-red-600' 
                            : getTimeWarningLevel() === 'warning'
                            ? 'text-orange-600'
                            : getTimeWarningLevel() === 'alert'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`}>
                          Time remaining: {formatTime(timeLeft)} of {formatTime(totalDuration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Side Panel */}
          {showSidePanel && (
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
                {/* Panel Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Question Palette</h3>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {Object.values(questionStatus).filter(s => s.answered).length}
                          </div>
                          <div className="text-xs text-gray-600">Answered</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {Object.values(questionStatus).filter(s => s.skipped).length}
                          </div>
                          <div className="text-xs text-gray-600">Skipped</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {Object.values(questionStatus).filter(s => !s.answered && !s.skipped).length}
                          </div>
                          <div className="text-xs text-gray-600">Not Visited</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Numbers Grid */}
                <div className="mb-6">
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {Array.from({ length: attemptData?.total_questions || 0 }, (_, i) => i + 1).map(qNum => {
                      const isCurrent = order === qNum;
                      const isAnswered = questionStatus[qNum]?.answered;
                      const isSkipped = questionStatus[qNum]?.skipped;
                      
                      let bgColor = "bg-gray-200";
                      let textColor = "text-gray-800";
                      
                      if (isCurrent) {
                        bgColor = "bg-blue-500";
                        textColor = "text-white";
                      } else if (isAnswered) {
                        bgColor = "bg-green-500";
                        textColor = "text-white";
                      } else if (isSkipped) {
                        bgColor = "bg-yellow-500";
                        textColor = "text-white";
                      }
                      
                      return (
                        <button
                          key={qNum}
                          onClick={() => handleNavigation(qNum)}
                          className={`aspect-square rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                            isCurrent 
                              ? 'ring-2 ring-blue-500 ring-offset-1 scale-110 shadow-md' 
                              : 'hover:scale-105 hover:shadow'
                          } ${bgColor} ${textColor}`}
                        >
                          {qNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Status Legend</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Answered</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-gray-600">Skipped</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-600">Not Visited</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    const unanswered = Object.entries(questionStatus)
                      .find(([num, status]) => !status.answered && !status.skipped);
                    if (unanswered) handleNavigation(parseInt(unanswered[0]));
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>📝</span>
                  <span>Review Unanswered</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animation for modals */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function formatTime(seconds) {
  if (seconds < 0) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}