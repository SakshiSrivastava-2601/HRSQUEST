import { Moon, Sun, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CourseTopNav({ title, left, right, dark, onToggleDark }) {
  return (
    <header className="sticky top-0 z-50 h-16 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] dark:from-[#4C1D95] dark:to-[#164E63] shadow-lg">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {left || (
            <Link to="/student/courses" className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white font-bold text-sm shrink-0">
                HR
              </div>
              <span className="hidden sm:block font-bold text-white text-sm truncate">
                HR Science Quest
              </span>
            </Link>
          )}
        </div>

        {/* Center */}
        <div className="flex-1 text-center">
          <span className="text-white font-semibold text-sm md:text-base truncate">
            {title || "My Learning"}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {right}
          <button
            onClick={() => onToggleDark(!dark)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
            <UserCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
