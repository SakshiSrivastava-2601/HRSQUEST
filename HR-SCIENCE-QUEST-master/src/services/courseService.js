import { apiRequest } from "./api";

// CREATE course
export const createCourse = (courseData) =>
  apiRequest("/teacher/course/create", {
    method: "POST",
    body: JSON.stringify(courseData),
  });

// GET my courses
export const getMyCourses = () =>
  apiRequest("/teacher/course/my-courses", {
    method: "GET",
  });

// GET course by ID
export const getCourse = (courseId) =>
  apiRequest(`/teacher/course/get_course/${courseId}`, {
    method: "GET",
  });

// UPDATE course
export const updateCourse = (courseId, courseData) =>
  apiRequest(`/teacher/course/update/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(courseData),
  });

// PUBLISH course
export const publishCourse = (courseId) =>
  apiRequest(`/teacher/course/publish/${courseId}`, {
    method: "PUT",
  });

// GET full course with all sections, lectures, and resources
export const getFullCourse = (courseId) =>
  apiRequest(`/teacher/course/${courseId}/full`, {
    method: "GET",
  });

// Section Management APIs

// CREATE section
export const createSection = (sectionData) =>
  apiRequest("/teacher/course/section/create", {
    method: "POST",
    body: JSON.stringify(sectionData),
  });

export const updateSection = (sectionData) =>
  apiRequest("/teacher/course/section/update", {
    method: "PUT",
    body: JSON.stringify(sectionData),
  });

// GET sections by course ID
export const getSections = (courseId) =>
  apiRequest(`/teacher/course/${courseId}/sections`, {
    method: "GET",
  });

// Lecture Management APIs

// CREATE lecture
export const createLecture = (lectureData) =>
  apiRequest("/teacher/course/lecture/create", {
    method: "POST",
    body: JSON.stringify(lectureData),
  });

export const getTeacherCourseCatalog = getMyCourses;

// GET lectures by course ID and section ID
export const getLectures = (courseId, sectionId) =>
  apiRequest(`/teacher/course/${courseId}/sections/${sectionId}/lectures`, {
    method: "GET",
  });

// Resource Management APIs

// ADD resource to lecture
export const addResource = (resourceData) =>
  apiRequest("/teacher/course/lecture/resource/add", {
    method: "POST",
    body: JSON.stringify(resourceData),
  });

export const updateResource = (resourceData) =>
  apiRequest("/teacher/course/lecture/resource/update", {
    method: "PUT",
    body: JSON.stringify(resourceData),
  });

export const deleteResource = (resourceId) =>
  apiRequest(`/teacher/course/lecture/resource/${resourceId}`, {
    method: "DELETE",
  });

// GET resources by lecture ID
export const getResources = (lectureId) =>
  apiRequest(`/teacher/course/lecture/${lectureId}/resources`, {
    method: "GET",
  });
