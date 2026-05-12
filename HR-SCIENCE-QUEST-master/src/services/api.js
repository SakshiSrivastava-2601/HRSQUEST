import { showErrorPopup } from "./notify";

const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const API_BASE_URL = BASE_URL;

const FIELD_LABELS = {
  password: "Password",
  email: "Email",
  phone_number: "Phone number",
  student_name: "Name",
  teacher_name: "Name",
  username: "Username",
  grade_level: "Grade",
  old_password: "Old password",
  new_password: "New password",
};

function humanizeFieldName(raw) {
  if (!raw) return "";
  if (FIELD_LABELS[raw]) return FIELD_LABELS[raw];
  return String(raw)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeValidationMessage(msg) {
  if (!msg) return "";
  let m = String(msg);
  m = m.replace(/^String should have at least (\d+) characters?/i, "must be at least $1 characters");
  m = m.replace(/^String should have at most (\d+) characters?/i, "must be at most $1 characters");
  m = m.replace(/^Value error, /i, "");
  m = m.replace(/^value is not a valid email address.*/i, "must be a valid email address");
  m = m.replace(/^Field required$/i, "is required");
  m = m.replace(/^Input should be a valid integer.*/i, "must be a number");
  return m;
}

function stringifyValidationItem(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return String(item || "");

  const locParts = Array.isArray(item.loc) ? item.loc.filter((p) => p && p !== "body") : [];
  const fieldRaw = locParts.length ? locParts[locParts.length - 1] : "";
  const field = humanizeFieldName(fieldRaw);
  const message = humanizeValidationMessage(item.msg || item.message || item.detail || "");
  if (field && message) return `${field} ${message}`;
  return message || JSON.stringify(item);
}

function normalizeApiMessage(data) {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data.map(stringifyValidationItem).filter(Boolean).join("\n");
  }
  if (data && typeof data === "object") {
    if (Array.isArray(data.detail)) {
      return data.detail.map(stringifyValidationItem).filter(Boolean).join("\n");
    }
    if (typeof data.detail === "string") return data.detail;
    if (data.detail && typeof data.detail === "object") {
      return stringifyValidationItem(data.detail);
    }
    if (typeof data.message === "string") return data.message;
    return stringifyValidationItem(data);
  }
  return "API Error";
}

export function resolveApiUrl(url) {
  if (!url) return url;
  const value = String(url);
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${BASE_URL}${value}`;
  return `${BASE_URL}/${value}`;
}

// ===== TOKEN STORAGE KEYS =====
const TOKEN_KEYS = {
  ADMIN: 'admin_token',
  STUDENT: 'token'
};

const REFRESH_TOKEN_KEYS = {
  ADMIN: 'admin_refresh_token',
  STUDENT: 'student_refresh_token',
};

// ===== TOKEN MANAGER =====
class TokenManager {
  static getCurrentRole() {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return 'ADMIN';
    if (path.startsWith("/student")) return 'STUDENT';
    return null;
  }

  static getToken(role = null) {
    const targetRole = role || this.getCurrentRole();
    if (!targetRole) return null;
    
    return localStorage.getItem(TOKEN_KEYS[targetRole]);
  }

  static setToken(role, token) {
    if (role && token && TOKEN_KEYS[role]) {
      localStorage.setItem(TOKEN_KEYS[role], token);
    }
  }

  static clearToken(role) {
    if (role && TOKEN_KEYS[role]) {
      localStorage.removeItem(TOKEN_KEYS[role]);
    }
  }

  static clearAllTokens() {
    Object.values(TOKEN_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    Object.values(REFRESH_TOKEN_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static getRefreshToken(role = null) {
    const targetRole = role || this.getCurrentRole();
    if (!targetRole) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEYS[targetRole]);
  }

  static setRefreshToken(role, token) {
    if (role && token && REFRESH_TOKEN_KEYS[role]) {
      localStorage.setItem(REFRESH_TOKEN_KEYS[role], token);
    }
  }

  static clearRefreshToken(role) {
    if (role && REFRESH_TOKEN_KEYS[role]) {
      localStorage.removeItem(REFRESH_TOKEN_KEYS[role]);
    }
  }

  // Check which role is currently logged in
  static getActiveRole() {
    const adminToken = localStorage.getItem(TOKEN_KEYS.ADMIN);
    const studentToken = localStorage.getItem(TOKEN_KEYS.STUDENT);
    const adminRefresh = localStorage.getItem(REFRESH_TOKEN_KEYS.ADMIN);
    const studentRefresh = localStorage.getItem(REFRESH_TOKEN_KEYS.STUDENT);
    
    // Return the role that has a token
    if (adminToken || adminRefresh) return 'ADMIN';
    if (studentToken || studentRefresh) return 'STUDENT';
    return null;
  }

  // Get appropriate token for current route
  static getContextualToken() {
    const currentRole = this.getCurrentRole();
    const activeRole = this.getActiveRole();
    
    // If no specific route or public route
    if (!currentRole) {
      // Try to use the active role's token
      return this.getToken(activeRole);
    }
    
    // If we're in an admin route, use admin token
    if (currentRole === 'ADMIN') {
      return this.getToken('ADMIN');
    }
    
    // If we're in a student route, use student token
    if (currentRole === 'STUDENT') {
      return this.getToken('STUDENT');
    }
    
    return null;
  }
}

// ===== RENEW TOKEN (ROLE-AWARE) =====
export const renewToken = async () => {
  const currentRole = TokenManager.getCurrentRole();
  const activeRole = TokenManager.getActiveRole();
  
  // Determine which token to renew
  let targetRole = currentRole || activeRole;
  
  if (!targetRole) return false;
  
  try {
    // Prefer refresh-token flow (standard) if available.
    const refreshToken = TokenManager.getRefreshToken(targetRole);
    if (refreshToken) {
      const res = await fetch(`${BASE_URL}/refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      TokenManager.setToken(targetRole, data.access_token);
      return true;
    }

    const token = TokenManager.getToken(targetRole);
    if (!token) return false;

    // Backward compatible fallback (requires non-expired access token)
    const res = await fetch(`${BASE_URL}/renew_token?token=${encodeURIComponent(token)}`);
    if (!res.ok) return false;
    const data = await res.json();
    TokenManager.setToken(targetRole, data.access_token);
    return true;
  } catch {
    return false;
  }
};

// ===== MAIN API WITH TOKEN VALIDATION =====
// Endpoints that are reached BEFORE the user has a valid session. A 401 from
// any of these means "wrong credentials", not "session expired" — so we must
// NOT clear tokens or redirect to /login on a 401 here.
const UNAUTHENTICATED_ENDPOINTS = [
  "/login/",
  "/registration/",
  "/refresh_token",
  "/renew_token",
];

function isUnauthenticatedEndpoint(endpoint) {
  if (!endpoint) return false;
  const path = String(endpoint).split("?")[0];
  return UNAUTHENTICATED_ENDPOINTS.some((prefix) => path.startsWith(prefix));
}

export async function apiRequest(endpoint, options = {}) {
  const isFormData = options?.body instanceof FormData;
  const shouldNotify = options?.notify !== false;
  const skipSessionHandling = isUnauthenticatedEndpoint(endpoint);
  let token = TokenManager.getContextualToken();
  
  // If no token found for current context, try to use any available token
  if (!token) {
    const activeRole = TokenManager.getActiveRole();
    // If we only have a refresh token (common after reload), renew first so we don't spam 403s.
    const refreshOnly = TokenManager.getRefreshToken(activeRole);
    if (refreshOnly) {
      await renewToken();
    }
    token = TokenManager.getToken(activeRole);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  // Handle token expiration — but only for endpoints that require a session.
  // A 401 from login/registration just means "wrong credentials" and must
  // bubble up to the caller as a normal error (no token clear, no redirect).
  if (response.status === 401 && !skipSessionHandling) {
    // Try to renew token
    const renewed = await renewToken();
    
    if (renewed) {
      // Retry the request with new token
      const newToken = TokenManager.getContextualToken();
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...(!isFormData && { "Content-Type": "application/json" }),
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
          ...options.headers,
        },
      });
      
      const retryContentType = retryResponse.headers.get("content-type") || "";
      const retryData = retryContentType.includes("application/json")
        ? await retryResponse.json()
        : await retryResponse.text();
      
      if (!retryResponse.ok) {
        throw new Error(retryData?.message || retryData?.detail || "API Error");
      }
      
      return retryData;
    } else {
      // Token renewal failed, clear tokens and redirect to login
      TokenManager.clearAllTokens();
      if (shouldNotify) {
        showErrorPopup("Session expired. Please login again.", "Authentication required");
      }
      
      // Redirect based on current route
      const currentRole = TokenManager.getCurrentRole();
      if (currentRole === 'ADMIN') {
        window.location.href = '/login/admin';
      } else if (currentRole === 'STUDENT') {
        window.location.href = '/login/student';
      } else {
        window.location.href = '/';
      }
      
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!response.ok) {
    const message = normalizeApiMessage(data);
    if (shouldNotify) {
      showErrorPopup(message, "Request failed");
    }
    throw new Error(message);
  }

  return data;
}

// ===== ROLE-SPECIFIC API FUNCTIONS =====
export const adminApiRequest = async (endpoint, options = {}) => {
  const token = TokenManager.getToken('ADMIN');
  if (!token) {
    throw new Error("Admin token not found. Please login as admin.");
  }
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-Force-Admin': 'true' // Optional header to force admin context
    }
  });
};

export const studentApiRequest = async (endpoint, options = {}) => {
  const token = TokenManager.getToken('STUDENT');
  if (!token) {
    throw new Error("Student token not found. Please login as student.");
  }
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-Force-Student': 'true' // Optional header to force student context
    }
  });
};

// ===== LOGOUT FUNCTION =====
export const logout = (role = null) => {
  if (role) {
    TokenManager.clearToken(role);
    TokenManager.clearRefreshToken(role);
  } else {
    TokenManager.clearAllTokens();
  }
  
  // Redirect to appropriate login page
  const currentRole = TokenManager.getCurrentRole();
  if (currentRole === 'ADMIN') {
    window.location.href = '/login/admin';
  } else if (currentRole === 'STUDENT') {
    window.location.href = '/login/student';
  } else {
    window.location.href = '/';
  }
};

// ===== TOKEN VALIDATION ON APP START =====
export const validateTokens = () => {
  const adminToken = TokenManager.getToken('ADMIN');
  const studentToken = TokenManager.getToken('STUDENT');
  
  // Clear tokens that don't belong to current route
  const currentRole = TokenManager.getCurrentRole();
  
  if (currentRole === 'ADMIN' && studentToken) {
    // If in admin area but have student token, clear student token
    TokenManager.clearToken('STUDENT');
  } else if (currentRole === 'STUDENT' && adminToken) {
    // If in student area but have admin token, clear admin token
    TokenManager.clearToken('ADMIN');
  }
  
  return {
    hasAdminToken: !!adminToken,
    hasStudentToken: !!studentToken,
    currentRole
  };
};
