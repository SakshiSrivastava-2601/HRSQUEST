import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { getNotifyEventName } from "../../services/notify";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    icon: "text-emerald-600",
    ring: "border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700",
  },
  error: {
    icon: "text-red-600",
    ring: "border-red-200",
    badge: "bg-red-50 text-red-700",
  },
  warning: {
    icon: "text-amber-600",
    ring: "border-amber-200",
    badge: "bg-amber-50 text-amber-700",
  },
  info: {
    icon: "text-blue-600",
    ring: "border-blue-200",
    badge: "bg-blue-50 text-blue-700",
  },
};

export default function GlobalPopup() {
  const [popup, setPopup] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const clearExisting = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleNotify = (event) => {
      clearExisting();
      const nextPopup = event.detail || {};
      setPopup(nextPopup);

      const duration = Number(nextPopup.duration || 2600);
      timerRef.current = setTimeout(() => {
        setPopup(null);
        timerRef.current = null;
      }, duration);
    };

    window.addEventListener(getNotifyEventName(), handleNotify);

    return () => {
      clearExisting();
      window.removeEventListener(getNotifyEventName(), handleNotify);
    };
  }, []);

  if (!popup) return null;

  const type = popup.type || "info";
  const Icon = ICONS[type] || ICONS.info;
  const style = STYLES[type] || STYLES.info;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-5">
      <div
        className={`pointer-events-auto w-full max-w-lg rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-300 ${style.ring}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-xl p-2.5 ${style.badge}`}>
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">
              {popup.title || "Notice"}
            </div>
            <div className="mt-0.5 whitespace-pre-line text-sm leading-5 text-slate-600">
              {popup.message || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
