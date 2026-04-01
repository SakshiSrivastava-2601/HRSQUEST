import { BookOpen, PlayCircle } from "lucide-react";

export default function CourseHeader({
  course,
  totalLessons,
  totalMaterials,
  onOpenSheet,
}) {
  const previewLabel = course?.teacher_name || "Instructor";

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="px-5 py-6 md:px-7 md:py-7">
          <div className="mb-3 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700">
            {course?.status || "Published"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">
            {course?.title}
          </h1>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-600 md:text-base">
            {course?.description || "Course description not available."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Lessons</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{totalLessons}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Materials</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{totalMaterials}</div>
            </div>
            <button
              type="button"
              onClick={onOpenSheet}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <PlayCircle className="h-4 w-4" />
              Open lesson panel
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-[240px] flex-col justify-between rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
            <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-950 via-indigo-700 to-violet-500">
              {course?.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course?.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center text-white">
                  <BookOpen className="h-14 w-14 opacity-90" />
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Course Preview
              </div>
              <div className="mt-1 text-base font-semibold text-slate-900">{previewLabel}</div>
              <div className="mt-1 text-sm text-slate-500">
                Scroll through the lessons and use the bottom panel for continuous viewing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
