import { apiRequest } from "./api";

export const studentRegister = (payload, options = {}) =>
  apiRequest("/registration/student", {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  });

export const studentLogin = (payload, options = {}) =>
  apiRequest("/login/student", {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  });

export const adminLogin = (payload, options = {}) =>
  apiRequest("/login/teacher", {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  });

export const changeAdminPassword = (payload) =>
  apiRequest("/change_password/teacher", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const changePassword = (payload) =>
  apiRequest("/change_password/student", {
    method: "POST",
    body: JSON.stringify(payload),
  });
