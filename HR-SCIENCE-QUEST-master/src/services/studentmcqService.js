import { apiRequest } from "./api";

// 1. Get tests by subject
export const getStudentTests = (subjectId, page = 1, size = 10) => {
  return apiRequest(
    `/mcq/tests/student?subject_id=${subjectId}&page=${page}&size=${size}`
  );
};

// 2. Start test
export const startMcqTest = (testId) => {
  return apiRequest(`/mcq/tests/start?test_id=${testId}`, {
    method: "PUT",
  });
};

// 3. Attempt status
export const getAttemptStatus = (attemptId) => {
  return apiRequest(`/mcq/attempt/status?attempt_id=${attemptId}`);
};

// 4. Get question
export const getQuestion = (attemptId, order) => {
  return apiRequest(
    `/mcq/get_question?attempt_id=${attemptId}&question_order=${order}`
  );
};

// 5. Save answer
export const saveAnswer = (payload) => {
  return apiRequest(`/mcq/save_answer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// 6. Submit test
export const submitTest = (attemptId) => {
  return apiRequest(`/mcq/submit_test?attempt_id=${attemptId}`, {
    method: "PUT",
  });
};

// 7. Get past result by attempt id (for re-viewing from history)
export const getTestResult = (attemptId) =>
  apiRequest(`/mcq/test_result?attempt_id=${Number(attemptId)}`);

// 8. List submitted tests for a subject (used by Results page)
export const getSubmittedTests = (subjectId, page = 1, size = 50) =>
  apiRequest(
    `/mcq/submitted_test?subject_id=${Number(subjectId)}&page=${page}&size=${size}`
  );
