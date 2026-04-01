import { ChevronDown, ChevronRight } from "lucide-react";
import LessonCard from "./LessonCard";

export default function CourseContentList({
  modules,
  openSections,
  onToggleSection,
  activeLessonId,
  onSelectLesson,
}) {
  return (
    <section className="space-y-2">
      {modules.map((module, moduleIndex) => {
        const moduleId = String(module.section_id || moduleIndex);
        const isOpen = !!openSections[moduleId];
        const lessons = module.lessons || [];

        return (
          <div key={moduleId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => onToggleSection(moduleId)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Day {moduleIndex + 1}
                </div>
                <h2 className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
                  {module.title || `Module ${moduleIndex + 1}`}
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs text-gray-500">
                  {lessons.length} lecture{lessons.length !== 1 ? "s" : ""}
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 border-t border-gray-100 px-3 py-3">
                  {lessons.map((lesson, lessonIndex) => (
                    <LessonCard
                      key={lesson.lesson_id || `${moduleId}-${lessonIndex}`}
                      lesson={lesson}
                      index={lessonIndex}
                      isActive={
                        String(activeLessonId) ===
                        String(lesson.lesson_id || `${moduleId}-${lessonIndex}`)
                      }
                      onSelect={onSelectLesson}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
