import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiBook,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiEye,
  FiBookOpen,
  FiUser,
  FiMenu,
  FiPlusCircle,
  FiX
} from 'react-icons/fi';
import { getSession, isSuperAdmin } from "../../services/session";


export default function AdminSidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const session = getSession();
  const superAdmin = isSuperAdmin(session);
  const roleLabel = String(session?.role || "").toLowerCase();
  const panelTitle =
    roleLabel === "teacher"
      ? "Teacher Panel"
      : roleLabel === "superadmin"
        ? "SuperAdmin Panel"
        : "Admin Panel";
  const panelSubtitle =
    roleLabel === "teacher"
      ? "Teaching workspace"
      : "Education Management";
  // Avoid hijacking browser back/forward navigation (causes confusing redirects).

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);


  const navItems = superAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 />, path: '/admin/dashboard' },
        { id: 'subjects', label: 'Subjects', icon: <FiBook />, path: '/admin/subjects' },
        { id: 'questions', label: 'Questions', icon: <FiFileText />, path: '/admin/questions' },
        { id: 'tests', label: 'Tests', icon: <FiFileText />, path: '/admin/tests' },
        { id: 'teacher-courses', label: 'Courses', icon: <FiBookOpen />, path: '/admin/courses' },
        { id: 'users-reports', label: 'Users & Reports', icon: <FiEye />, path: '/admin/users-reports' },
        { id: 'profile', label: 'Profile', icon: <FiUser />, path: '/admin/profile' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 />, path: '/admin/dashboard' },
        { id: 'my-subjects', label: 'My Subjects', icon: <FiBook />, path: '/admin/my-subjects' },
        { id: 'questions', label: 'Questions', icon: <FiFileText />, path: '/admin/questions' },
        { id: 'tests', label: 'Tests', icon: <FiFileText />, path: '/admin/tests' },
        { id: 'teacher-courses', label: 'Courses', icon: <FiBookOpen />, path: '/admin/courses' },
        { id: 'profile', label: 'Profile', icon: <FiUser />, path: '/admin/profile' },
      ];

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    // navigate("/", { replace: true });
    localStorage.removeItem("role");
    window.location.replace("/");
  }


  const sidebarContent = (
    <>
      <div className="p-5 lg:p-6 border-b border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <FiHome className="text-white text-xl" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{panelTitle}</h2>
                <p className="text-gray-400 text-xs">{panelSubtitle}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {!collapsed && session && (
          <div className="mt-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="text-xs text-gray-400">Welcome</div>
            <div className="text-sm font-semibold break-words">{session.name}</div>
            {session.role && (
              <div className="mt-2 inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-200">
                {String(session.role).toLowerCase()}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={`text-xl ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-8 p-4 bg-gray-800/50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {superAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/course/create")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiPlusCircle />
                    <span>Create Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/questions")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiFileText />
                    <span>Create Questions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/tests")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiFileText />
                    <span>Manage Tests</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/users-reports")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiEye />
                    <span>View Reports</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/my-subjects")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiBook />
                    <span>My Subjects</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/course/create")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiPlusCircle />
                    <span>Create Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/questions")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiFileText />
                    <span>Create Questions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/tests")}
                    className="w-full flex items-center space-x-2 text-sm text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiFileText />
                    <span>Manage Tests</span>
                  </button>
                </>
              )}

              <button
                onClick={handleLogout}
                className="mt-10 w-full bg-red-500 py-2 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="hidden lg:block p-4 border-t border-gray-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <FiChevronRight className="text-xl" /> : <FiChevronLeft className="text-xl" />}
          {!collapsed && <span className="text-sm">Minimise</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-600">
              {roleLabel === "teacher" ? "Teacher Workspace" : "Admin Workspace"}
            </div>
            <div className="text-base font-semibold text-gray-900 truncate">
              {panelTitle}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-gray-200 p-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            aria-label="Open navigation"
          >
            <FiMenu className="text-xl" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-gradient-to-b from-gray-900 to-black text-white transition-transform duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
