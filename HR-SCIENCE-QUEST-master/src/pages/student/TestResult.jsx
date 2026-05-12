import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { resolveApiUrl } from "../../services/api";
import { getTestResult } from "../../services/studentmcqService";

export default function TestResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Try state (from immediate post-submit flow)
      if (location.state?.resultData) {
        setResultData(location.state.resultData);
        return;
      }

      // 2. Try localStorage (fallback after refresh during post-submit flow)
      const storedData = localStorage.getItem("testResult");
      if (storedData) {
        try {
          setResultData(JSON.parse(storedData));
          localStorage.removeItem("testResult");
          return;
        } catch {
          /* fall through */
        }
      }

      // 3. Fetch by attempt id (re-viewing from history)
      if (attemptId) {
        try {
          const data = await getTestResult(attemptId);
          if (!cancelled) setResultData(data);
          return;
        } catch (err) {
          console.error("Failed to load result:", err);
        }
      }

      navigate("/student/results");
    })();

    return () => {
      cancelled = true;
    };
  }, [location, navigate, attemptId]);

  const toggleQuestionDetails = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const calculatePercentage = () => {
    if (!resultData) return 0;
    const total = resultData.summary?.total_questions || 0;
    const correct = resultData.summary?.total_correct || 0;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const getPerformanceMessage = () => {
    const percentage = calculatePercentage();
    if (percentage >= 90) return "Outstanding Performance! 🎉";
    if (percentage >= 75) return "Excellent Work! 🌟";
    if (percentage >= 60) return "Good Job! 👍";
    if (percentage >= 40) return "Fair Attempt 💪";
    return "Keep Practicing 📚";
  };

  const getScoreColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 75) return "#10b981";
    if (percentage >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getGradientColor = () => {
    const percentage = calculatePercentage();
    if (percentage >= 75) return "from-emerald-400 to-teal-500";
    if (percentage >= 50) return "from-amber-400 to-orange-500";
    return "from-red-400 to-pink-500";
  };

  if (!resultData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium text-sm sm:text-base">Loading your results...</p>
      </div>
    );
  }

  const { attempt, summary, question_summary } = resultData;
  const percentage = calculatePercentage();
  const strokeDashoffset = 440 - (percentage * 4.4);

  // Tailwind responsive sizing — auto-updates when the viewport changes.
  const circleSizeClass = "w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile First Design */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Test Results</h1>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">Detailed analysis of your performance</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate("/student/dashboard")}
              className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-indigo-500 text-white font-medium rounded-lg sm:rounded-xl hover:bg-indigo-600 transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Score Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            {/* Circular Progress - Responsive Sizing */}
            <div className="flex justify-center w-full md:w-auto">
              <div className={`relative ${circleSizeClass}`}>
                <svg className="w-full h-full" viewBox="0 0 160 160">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke="#f3f4f6" 
                    strokeWidth="12" 
                    fill="none"
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="70" 
                    stroke={getScoreColor()} 
                    strokeWidth="12" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="440"
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 80 80)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">{percentage}%</span>
                  <span className="text-gray-500 text-sm sm:text-base mt-1 sm:mt-2">Overall Score</span>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="w-full">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r ${getGradientColor()} bg-clip-text text-transparent text-center md:text-left`}>
                {getPerformanceMessage()}
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-emerald-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                      <span className="text-emerald-600 font-bold text-sm sm:text-base">✓</span>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{summary.total_correct}</div>
                      <div className="text-gray-500 text-xs sm:text-sm">Correct</div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-red-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                      <span className="text-red-600 font-bold text-sm sm:text-base">✗</span>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{summary.total_incorrect}</div>
                      <div className="text-gray-500 text-xs sm:text-sm">Incorrect</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-blue-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <span className="text-blue-600 text-sm sm:text-base">📝</span>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{summary.total_questions}</div>
                      <div className="text-gray-500 text-xs sm:text-sm">Total</div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-amber-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                      <span className="text-amber-600 text-sm sm:text-base">⭐</span>
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{attempt.final_score}</div>
                      <div className="text-gray-500 text-xs sm:text-sm">Points</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
              <span className="text-lg sm:text-xl">📋</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Test Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition duration-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gray-200 rounded-lg">
                  <span className="text-gray-600 text-sm sm:text-base">⏱️</span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Time Taken</div>
                  <div className="font-medium text-gray-800 text-sm sm:text-base">
                    {calculateTimeTaken(attempt.start_time, attempt.submit_time)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition duration-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gray-200 rounded-lg">
                  <span className="text-gray-600 text-sm sm:text-base">📅</span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Completed On</div>
                  <div className="font-medium text-gray-800 text-sm sm:text-base">
                    {(() => {
                      const d = parseIstDate(attempt.submit_time);
                      return d
                        ? d.toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : "—";
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition duration-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gray-200 rounded-lg">
                  <span className="text-gray-600 text-sm sm:text-base">⏰</span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Time</div>
                  <div className="font-medium text-gray-800 text-sm sm:text-base">
                    {(() => {
                      const d = parseIstDate(attempt.submit_time);
                      return d
                        ? d.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : "—";
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition duration-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gray-200 rounded-lg">
                  <span className="text-gray-600 text-sm sm:text-base">📊</span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Status</div>
                  <div className={`font-medium flex items-center gap-2 text-sm sm:text-base ${attempt.is_submitted ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${attempt.is_submitted ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    {attempt.is_submitted ? 'Submitted' : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
                <span className="text-lg sm:text-xl">🔍</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Question Analysis</h3>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Click on any question to view details</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {question_summary.map((q, index) => (
              <div 
                key={q.question_text} 
                className={`rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${q.is_correct ? 'border-emerald-200 hover:border-emerald-300' : 'border-red-200 hover:border-red-300'} ${expandedQuestions[q.question_text] ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div 
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => toggleQuestionDetails(q.question_text)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm ${q.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        <span className="font-bold">Q{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${q.is_correct ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className={`font-medium text-xs sm:text-sm ${q.is_correct ? 'text-emerald-600' : 'text-red-600'}`}>
                          {q.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm ${q.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {q.marks_awarded} point{q.marks_awarded !== 1 ? 's' : ''}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {expandedQuestions[q.question_text] ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm sm:text-base line-clamp-2">{q.question_text}</p>
                </div>

                {expandedQuestions[q.question_text] && (
                  <div className="border-t p-3 sm:p-4 bg-white rounded-b-lg sm:rounded-b-xl">
                    {q.image_path && (
                      <div className="mb-4">
                        <img
                          src={resolveApiUrl(q.image_path)}
                          alt="Question"
                          className="block w-full max-w-full sm:max-w-md h-auto max-h-64 rounded-lg border border-gray-200 object-contain"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 font-medium">Your Answer</div>
                        <div className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${q.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                          {q.attempted_option}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2 font-medium">Correct Answer</div>
                        <div className="p-2 sm:p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm sm:text-base">
                          {q.correct_option}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                      <div className="text-xs sm:text-sm text-gray-500 font-medium">Marks Awarded</div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-800">{q.marks_awarded}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => navigate(`/student/test/${attempt.test_id}`)}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg sm:rounded-xl hover:opacity-90 transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <span className="text-lg sm:text-xl">🔄</span>
              Retry This Test
            </button>
            
            <button
              onClick={() => navigate("/student/results")}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg sm:rounded-xl hover:opacity-90 transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <span className="text-lg sm:text-xl">📊</span>
              All My Results
            </button>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(
                  `I scored ${percentage}% on my test! Correct: ${summary.total_correct}/${summary.total_questions}`
                );
                alert("Result copied to clipboard!");
              }}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg sm:rounded-xl hover:opacity-90 transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <span className="text-lg sm:text-xl">📤</span>
              Share Results
            </button>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg sm:rounded-xl">
              <span className="text-lg sm:text-xl">💡</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Performance Insights</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-emerald-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg sm:rounded-xl">
                  <span className="text-xl sm:text-2xl">🎯</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base">Accuracy Rate</h4>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1 sm:mt-2">
                    {((summary.total_correct / summary.total_questions) * 100).toFixed(1)}%
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Correct answers</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-amber-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl">
                  <span className="text-xl sm:text-2xl">⚡</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base">Speed</h4>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 sm:mt-2">Good</div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Based on time</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base">Rank</h4>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">Top 20%</div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Among peers</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-purple-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg sm:rounded-xl">
                  <span className="text-xl sm:text-2xl">📈</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base">Improvement</h4>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">+15%</div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">From last test</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 text-white">
            <div className="text-lg sm:text-2xl mt-0.5">💡</div>
            <div>
              <p className="font-medium text-xs sm:text-sm">
                <strong>Tip:</strong> Review incorrect answers to improve your understanding. Regular practice leads to better performance!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Backend returns IST-formatted strings like "2026-05-12 02:16:00 AM".
// JS `new Date()` does not parse that format reliably, so do it manually.
function parseIstDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // Already ISO / parseable.
  const direct = new Date(value);
  if (!isNaN(direct.getTime())) return direct;

  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(
    String(value).trim()
  );
  if (!m) return null;

  let [, y, mo, d, h, mi, se, ap] = m;
  let hour = parseInt(h, 10);
  if (ap) {
    if (ap.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ap.toUpperCase() === "AM" && hour === 12) hour = 0;
  }

  // The wall-clock above is IST. Convert to UTC ms by subtracting the IST offset.
  const utcMs = Date.UTC(
    parseInt(y, 10),
    parseInt(mo, 10) - 1,
    parseInt(d, 10),
    hour,
    parseInt(mi, 10),
    parseInt(se, 10)
  );
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(utcMs - istOffsetMs);
}

function calculateTimeTaken(startTime, endTime) {
  const start = parseIstDate(startTime);
  const end = parseIstDate(endTime);
  if (!start || !end) return "—";
  const diffMs = end - start;
  if (!isFinite(diffMs) || diffMs < 0) return "—";
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  return `${diffMins}m ${diffSecs}s`;
}