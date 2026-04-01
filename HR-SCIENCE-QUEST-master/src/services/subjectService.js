import { apiRequest } from "./api";

export const getSubjects = () =>
  apiRequest("/subjects/info");


export const createSubject = (payload) =>
  apiRequest(
    `/subjects/create?subject_name=${encodeURIComponent(
      payload.subject_name
    )}`
  );

  export const updateSubject = (payload) =>
  apiRequest(
    `/subjects/update?subject_id=${payload.subject_id}&subject_name=${encodeURIComponent(
      payload.subject_name
    )}`,
    {
      method: "PUT",
    }
  );

export const deleteSubject = (subjectId) =>
  apiRequest(`/subjects/delete?subject_id=${Number(subjectId)}`, {
    method: "DELETE",
  });
