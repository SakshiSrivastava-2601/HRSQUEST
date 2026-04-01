import { adminApiRequest, apiRequest, studentApiRequest } from "./api";

export const getAdminUsers = () =>
  adminApiRequest("/admin/users", {
    method: "GET",
  });

export const createTeacherAccount = (payload) =>
  adminApiRequest("/admin/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const resetTeacherPassword = (teacherId, payload) =>
  adminApiRequest(`/admin/teachers/${Number(teacherId)}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateTeacherAccount = (teacherId, payload) =>
  adminApiRequest(`/admin/teachers/${Number(teacherId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteTeacherAccount = (teacherId) =>
  adminApiRequest(`/admin/teachers/${Number(teacherId)}`, {
    method: "DELETE",
  });

export const updateStudentAccount = (studentId, payload) =>
  adminApiRequest(`/admin/students/${Number(studentId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteStudentAccount = (studentId) =>
  adminApiRequest(`/admin/students/${Number(studentId)}`, {
    method: "DELETE",
  });

export const getTeacherReport = () =>
  adminApiRequest("/admin/reports/teachers", { method: "GET" });

export const getStudentReport = () =>
  adminApiRequest("/admin/reports/students", { method: "GET" });

export const getPurchaseReport = () =>
  adminApiRequest("/admin/reports/purchases", { method: "GET" });

export const unlockStudentCourse = (payload) =>
  adminApiRequest("/admin/course-access", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getStudentCourses = () =>
  studentApiRequest("/student/courses", {
    method: "GET",
  });

export const getStudentCourseDetail = (courseId) =>
  studentApiRequest(`/student/course/${courseId}`, {
    method: "GET",
  });

export const uploadLessonVideo = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return apiRequest("/teacher/upload/video", {
    method: "POST",
    body: formData,
  });
};

export const uploadLessonMaterial = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return apiRequest("/teacher/upload/material", {
    method: "POST",
    body: formData,
  });
};
