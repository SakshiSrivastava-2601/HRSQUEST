import { ChevronDown, ChevronUp, Download, FileText, PlayCircle, X } from "lucide-react";

import { resolveApiUrl } from "../../../services/api";

const VISIBLE_HEIGHT = {
  collapsed: 88,
  half: 360,
  full: 620,
};

const extractYouTubeId = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return match?.[1] || null;
};

const extractVimeoId = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  const match = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
};

export default function BottomSheetPanel({
  state,
  setState,
  lesson,
  courseTitle,
  onClose,
}) {
  if (!lesson) return null;

  const attachments = lesson.attachments || [];
  const visibleHeight = VISIBLE_HEIGHT[state] || VISIBLE_HEIGHT.collapsed;
  const transform = `translateY(calc(100% - ${visibleHeight}px))`;
  const hasVideo = Boolean(lesson.video_url);
  const hasNotes = Boolean(lesson.notes);
  const youtubeId = extractYouTubeId(lesson.video_url);
  const vimeoId = extractVimeoId(lesson.video_url);
  const embeddedVideoUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}`
      : null;
  const pdfAttachments = attachments.filter((attachment) => {
    const type = String(attachment.resource_type || "").toLowerCase();
    const mime = String(attachment.mime_type || "").toLowerCase();
    const url = String(attachment.file_url || "").toLowerCase();
    return type.includes("pdf") || mime.includes("pdf") || url.endsWith(".pdf");
  });
  const otherAttachments = attachments.filter((attachment) => !pdfAttachments.includes(attachment));

  const cycleState = () => {
    if (state === "collapsed") {
      setState("half");
      return;
    }
    if (state === "half") {
      setState("full");
      return;
    }
    setState("half");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:left-72">
      <div
        className="mx-auto h-[86vh] max-w-5xl rounded-t-[32px] border border-slate-200 bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out"
        style={{ transform }}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 pb-4 pt-3">
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                onClick={cycleState}
                className="h-1.5 w-16 rounded-full bg-slate-300 transition hover:bg-slate-400"
                aria-label="Expand lesson panel"
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Now exploring
                </div>
                <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
                  {lesson.title || "Selected lesson"}
                </h3>
                <p className="mt-1 truncate text-sm text-slate-500">{courseTitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setState(state === "full" ? "half" : "full")}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Toggle sheet size"
                >
                  {state === "full" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Close lesson panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
            {hasVideo ? (
              <div className="overflow-hidden rounded-[26px] bg-slate-950">
                {embeddedVideoUrl ? (
                  <iframe
                    title={lesson.title || "Lesson video"}
                    src={embeddedVideoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={`w-full border-0 ${state === "full" ? "h-[42vh]" : "h-[220px] sm:h-[260px]"}`}
                  />
                ) : (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className={`w-full ${state === "full" ? "h-[42vh]" : "h-[220px] sm:h-[260px]"}`}
                    src={resolveApiUrl(lesson.video_url)}
                  />
                )}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-slate-50 text-center">
                <div>
                  <PlayCircle className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No video attached for this lesson</p>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Lesson Description
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {lesson.description || "No lesson description available."}
              </p>
            </div>

            <div className="mt-5 rounded-[26px] border border-slate-200 bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Notes
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {hasNotes ? lesson.notes : "No notes added for this lesson yet."}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                PDFs
              </div>

              {pdfAttachments.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {pdfAttachments.map((attachment) => (
                    <a
                      key={attachment.resource_id}
                      href={resolveApiUrl(attachment.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {attachment.resource_title}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          PDF
                        </div>
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-indigo-600" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No PDFs attached for this lesson yet.
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-indigo-600" />
                Extra Materials
              </div>

              {otherAttachments.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {otherAttachments.map((attachment) => (
                    <a
                      key={attachment.resource_id}
                      href={resolveApiUrl(attachment.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {attachment.resource_title}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {attachment.resource_type}
                        </div>
                      </div>
                      <Download className="h-4 w-4 shrink-0 text-indigo-600" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No extra materials attached for this lesson yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
