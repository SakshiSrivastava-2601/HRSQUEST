function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

const LAST_PATH_KEYS = {
  ADMIN: "last_admin_path",
  STUDENT: "last_student_path",
};

export function getSession() {
  const adminToken = localStorage.getItem("admin_token");
  const adminRefresh = localStorage.getItem("admin_refresh_token");
  const studentToken = localStorage.getItem("token");
  const studentRefresh = localStorage.getItem("student_refresh_token");

  const sessionCandidates = [
    {
      uiRole: "STUDENT",
      token: studentToken || studentRefresh || null,
    },
    {
      uiRole: "ADMIN",
      token: adminToken || adminRefresh || null,
    },
  ];

  const activeSession = sessionCandidates.find((candidate) => candidate.token);
  if (!activeSession?.token) return null;

  const payload = decodeJwtPayload(activeSession.token) || {};
  const role = String(payload.role || "").toLowerCase();

  const cachedStudentName = localStorage.getItem("student_profile_name");
  const cachedStudentEmail = localStorage.getItem("student_profile_email");
  const cachedStudentGrade = localStorage.getItem("student_profile_grade_level");
  const name =
    (activeSession.uiRole === "STUDENT" ? cachedStudentName : "") ||
    payload.student_name ||
    payload.teacher_name ||
    payload.username ||
    payload.email ||
    "User";

  return {
    uiRole: activeSession.uiRole,
    role,
    name,
    teacher_id: payload.teacher_id,
    student_id: payload.student_id,
    username: payload.username,
    email: (activeSession.uiRole === "STUDENT" ? cachedStudentEmail : "") || payload.email,
    grade_level: (activeSession.uiRole === "STUDENT" ? cachedStudentGrade : "") || payload.grade_level,
  };
}

export function getDefaultPathForSession(session) {
  if (!session) return "/";
  return session.uiRole === "STUDENT" ? "/student/dashboard" : "/admin/dashboard";
}

export function persistLastVisitedPath(pathname) {
  if (!pathname || pathname === "/") return;

  if (pathname.startsWith("/admin")) {
    localStorage.setItem(LAST_PATH_KEYS.ADMIN, pathname);
    return;
  }

  if (pathname.startsWith("/student")) {
    localStorage.setItem(LAST_PATH_KEYS.STUDENT, pathname);
  }
}

export function getLastVisitedPath(session) {
  if (!session) return "/";

  const key = LAST_PATH_KEYS[session.uiRole];
  const saved = key ? localStorage.getItem(key) : "";
  if (saved) return saved;
  return getDefaultPathForSession(session);
}

export function syncStudentSessionProfile(profile) {
  if (!profile) return;

  localStorage.setItem("student_profile_name", profile.student_name || "");
  localStorage.setItem("student_profile_email", profile.email || "");
  localStorage.setItem(
    "student_profile_grade_level",
    String(profile.current_grade_level || profile.grade_level || "")
  );
  window.dispatchEvent(new Event("auth:changed"));
}

export function isSuperAdmin(session) {
  return String(session?.role || "").toLowerCase() === "superadmin";
}
