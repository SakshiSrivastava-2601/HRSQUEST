
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../../services/api";

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

function readSession() {
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

  const payload = decodeJwtPayload(activeSession.token);
  const role = String(payload?.role || "").toLowerCase();
  const name =
    payload?.student_name ||
    payload?.teacher_name ||
    payload?.username ||
    payload?.email ||
    "User";

  return { name, role, uiRole: activeSession.uiRole };
}

export default function Navbar({ openAuth }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readSession());

  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener("storage", sync);
    window.addEventListener("auth:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth:changed", sync);
    };
  }, []);

  const dashboardHref = useMemo(() => {
    if (!session) return null;
    if (session.uiRole === "STUDENT") return "/student/dashboard";
    return "/admin/dashboard";
  }, [session]);

  const handleDashboardClick = () => {
    if (!dashboardHref) return;
    navigate(dashboardHref);
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow">
      <h1 className="text-xl font-bold text-blue-600">HR Science Quest</h1>
      <div className="hidden md:flex items-center gap-6">
    <Link to="/" className="...">Home</Link>
    <Link to="/about" className="...">About Us</Link>
    <Link to="/contact" className="...">Contact Us</Link>
  </div>

      {!session ? (
        <button
          onClick={() => openAuth("login")}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
        >
          Login
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 leading-none">Signed in</div>
            <div className="text-sm font-semibold text-gray-900 leading-tight">
              {session.name}
              {session.role ? (
                <span className="ml-2 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {session.role}
                </span>
              ) : null}
            </div>
          </div>

          {dashboardHref ? (
            <button
              type="button"
              onClick={handleDashboardClick}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition"
            >
              Dashboard
            </button>
          ) : null}

          <button
            onClick={() => logout(session.uiRole)}
            className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-700 font-semibold hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
