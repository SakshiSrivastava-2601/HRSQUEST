import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Moon, Sun, Menu, X, LogOut, LayoutDashboard, BookOpen, FlaskConical, ClipboardList, BarChart2, GraduationCap, UserCircle } from "lucide-react";
import { getSession } from "../../services/session";
import useDarkMode from "../../hooks/useDarkMode";

const navItems = [
  { to: "/student/dashboard",   label: "Dashboard",  Icon: LayoutDashboard },
  { to: "/student/courses",     label: "My Learning", Icon: BookOpen },
  { to: "/student/my-courses",  label: "My Courses",  Icon: GraduationCap },
  { to: "/student/subjects",    label: "Subjects",    Icon: FlaskConical },
  { to: "/student/tests",       label: "Tests",       Icon: ClipboardList },
  { to: "/student/results",     label: "Results",     Icon: BarChart2 },
  { to: "/student/profile",     label: "Profile",     Icon: UserCircle },
];

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("student_refresh_token");
  localStorage.removeItem("role");
  window.location.replace("/");
}

export default function StudentSidebar() {
  const session = getSession();
  const [dark, setDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (session?.name || "S").slice(0, 1).toUpperCase();

  return (
    <>
      {/* ── Top nav bar ── */}
      <header className="sticky top-0 z-50 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex h-full items-center justify-between px-4 md:px-6">

          {/* Logo */}
          <NavLink to="/student/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              HR
            </div>
            <div className="hidden sm:block leading-none">
              <p className="text-sm font-bold text-gray-900 dark:text-white">HR Science Quest</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Student Portal</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Logout – desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
              {initials}
            </div>

            {/* Hamburger – mobile */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex-1 bg-black/40" />

          <div
            className="w-72 bg-white dark:bg-gray-900 flex flex-col shadow-xl border-l border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session?.name || "Student"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {session?.role || "student"}
                    {session?.grade_level ? ` • Grade ${session.grade_level}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-3 space-y-0.5">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
