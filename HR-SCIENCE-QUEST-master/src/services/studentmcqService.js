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
