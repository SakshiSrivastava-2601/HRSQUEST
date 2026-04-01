const NOTIFY_EVENT = "app:notify";

export function showAppPopup({
  type = "info",
  title = "",
  message = "",
  duration = 2600,
} = {}) {
  window.dispatchEvent(
    new CustomEvent(NOTIFY_EVENT, {
      detail: { type, title, message, duration },
    })
  );
}

export function showErrorPopup(message, title = "Something went wrong") {
  showAppPopup({ type: "error", title, message });
}

export function showSuccessPopup(message, title = "Success") {
  showAppPopup({ type: "success", title, message });
}

export function showValidationPopup(message, title = "Please check this") {
  showAppPopup({ type: "warning", title, message });
}

export function getNotifyEventName() {
  return NOTIFY_EVENT;
}
