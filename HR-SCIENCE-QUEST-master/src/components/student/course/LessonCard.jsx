import { CirclePlay, FileText, PlayCircle } from "lucide-react";

export default function LessonCard({ lesson, index, isActive, onSelect }) {
  const attachmentsCount = (lesson.attachments || []).length;
  const hasVideo = Boolean(lesson.video_url);
  const hasNotes = Boolean(lesson.notes);

  return (
    <button
      type="button"
      onClick={() => onSelect(lesson)}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
        isActive
          ? "border-purple-200 bg-purple-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className={`mt-0.5 shrink-0 h-8 w-8 flex items-center justify-center rounded-full border ${
        isActive ? "border-purple-300 bg-purple-100" : "border-gray-200 bg-white"
      }`}>
        {hasVideo ? (
          <CirclePlay className={`h-4 w-4 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
        ) : attachmentsCount > 0 ? (
          <FileText className={`h-4 w-4 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
        ) : (
          <PlayCircle className={`h-4 w-4 ${isActive ? "text-purple-600" : "text-gray-400"}`} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium leading-snug ${isActive ? "text-gray-900" : "text-gray-700"}`}>
          <span className="text-gray-400 mr-1">{String(index + 1).padStart(2, "0")}</span>
          {lesson.title || `Lesson ${index + 1}`}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
          {hasVideo && <span>Video</span>}
          {hasNotes && <span>Notes</span>}
          {attachmentsCount > 0 && <span>Resources ({attachmentsCount})</span>}
        </div>
      </div>
    </button>
  );
}
