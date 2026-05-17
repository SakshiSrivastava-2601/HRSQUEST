import { apiRequest } from "./api";

// CREATE TEST
export const createTest = (payload) =>
  apiRequest("/mcq/test/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// GET TESTS
export const getTests = ({ subject_id, page = 1, size = 100 }) =>
  apiRequest(
    `/mcq/tests?${subject_id ? `subject_id=${Number(subject_id)}&` : ""}page=${page}&size=${size}`
  );

export const getTestDetail = (test_id) => {
  if (!test_id || isNaN(test_id)) {
    throw new Error("Invalid test_id");
  }

  return apiRequest(`/mcq/test/detail?test_id=${Number(test_id)}`);
};

// ADD QUESTION TO TEST   
export const addQuestionToTest = ({
  test_id,
  question_id,
  correct_marks,
  negative_marks,
}) => {
  if (!test_id || isNaN(test_id)) {
    throw new Error("Invalid test_id");
  }

  return apiRequest("/mcq/test/question/add", {
    method: "POST",
    body: JSON.stringify({
      test_id: Number(test_id),
      question_id: Number(question_id),
      correct_marks,
      negative_marks,
    }),
  });
};

// GET QUESTIONS OF A TEST 
export const getTestQuestions = (test_id, page = 1, size = 100) => {
  if (!test_id || isNaN(test_id)) {
    throw new Error("Invalid test_id");
  }

  return apiRequest(
    `/mcq/test/questions?test_id=${Number(test_id)}&page=${page}&size=${size}`
  );
};

export const updateTest = (test_id, payload) =>
  apiRequest(`/mcq/test/update?test_id=${test_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteTest = (test_id) =>
  apiRequest(`/mcq/test/delete?test_id=${test_id}`, {
    method: "DELETE",
  });

// Update a per-test question row (mcq_test_questions). The caller MUST pass
// the master `question_id` inside payload — we do NOT inject it from the URL
// id, because that would clobber the FK to mcq_questions.
export const updateTestQsn = (testQuestionId, payload) => {
  return apiRequest(
    `/mcq/test/question/update?test_question_id=${Number(testQuestionId)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
};

export const deleteTestQsn = (question_id, payload) =>
  apiRequest(`/mcq/test/question/delete?test_question_id=${question_id}`, {
    method: "DELETE",
  });

export const publishTest = (testId) => {
  return apiRequest(`/mcq/test/publish?test_id=${testId}`);
};

export const activateTest = (testId) => {
  return apiRequest(`/mcq/test/active?test_id=${testId}`);
};

export const deactivateTest = (testId) => {
  return apiRequest(`/mcq/test/deactive?test_id=${testId}`);
};

// GET TEST REPORTS — admin analytics for a single test
export const getTestReports = (testId) => {
  if (!testId || isNaN(testId)) {
    throw new Error("Invalid test_id");
  }
  return apiRequest(`/mcq/test/reports?test_id=${Number(testId)}`);
};
