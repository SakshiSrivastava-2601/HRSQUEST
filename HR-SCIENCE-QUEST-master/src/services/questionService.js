import { apiRequest } from "./api";

// CREATE MCQ question
export const createQuestion = (payload) =>
  apiRequest("/mcq/question/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getQuestions = (payload) =>
  apiRequest("/mcq/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  export const getTopics = ({ subject_id, grade_level }) =>
  apiRequest(
    `/topic_tags/get?subject_id=${subject_id}&grade_level=${grade_level}`
  );

// UPDATE MCQ question 
export const updateQuestion = (questionId, payload) =>
  apiRequest(`/mcq/question/update?question_id=${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// DELETE MCQ question
export const deleteQuestion = (questionId) =>
  apiRequest(`/mcq/question/delete?question_id=${questionId}`, {
    method: "DELETE",
  });

// UPLOAD question image (returns { image_path: "/media/question-image/<file>" })
export const uploadQuestionImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/teacher/upload/image", {
    method: "POST",
    body: formData,
  });
};
