/**
 * Small vanilla island for the HTMX UI.
 * - Bootstrap modal confirm before destructive HTMX deletes
 * - Bootstrap toasts (HX-Trigger: showToast)
 * - Dismiss flash messages
 * - Send CSRF header on HTMX requests when meta csrf-token is present
 */
(function () {
  "use strict";

  var pendingConfirmEl = null;

  function confirmDialog() {
    return document.getElementById("confirm-dialog");
  }

  function confirmMessageEl() {
    return document.getElementById("confirm-dialog-message");
  }

  function openConfirm(el) {
    var dialog = confirmDialog();
    var messageEl = confirmMessageEl();
    if (!dialog || !messageEl || !window.bootstrap) {
      return false;
    }
    pendingConfirmEl = el;
    messageEl.textContent = el.getAttribute("data-confirm") || "Are you sure?";
    window.bootstrap.Modal.getOrCreateInstance(dialog).show();
    return true;
  }

  function closeConfirm() {
    var dialog = confirmDialog();
    pendingConfirmEl = null;
    if (!dialog || !window.bootstrap) {
      return;
    }
    var instance = window.bootstrap.Modal.getInstance(dialog);
    if (instance) {
      instance.hide();
    }
  }

  function toastRegion() {
    return document.getElementById("toast-region");
  }

  function showToast(message, level) {
    var region = toastRegion();
    if (!region || !message || !window.bootstrap) {
      return;
    }
    var toast = document.createElement("div");
    toast.className = "toast " + (level === "error" ? "text-bg-danger" : "text-bg-success");
    toast.setAttribute("role", "status");

    var flex = document.createElement("div");
    flex.className = "d-flex";

    var body = document.createElement("div");
    body.className = "toast-body";
    body.textContent = message;

    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "btn-close btn-close-white me-2 m-auto";
    dismiss.setAttribute("data-bs-dismiss", "toast");
    dismiss.setAttribute("aria-label", "Dismiss");

    flex.appendChild(body);
    flex.appendChild(dismiss);
    toast.appendChild(flex);
    region.appendChild(toast);

    toast.addEventListener("hidden.bs.toast", function () {
      toast.remove();
    });
    window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 3500 }).show();
  }

  document.body.addEventListener("click", function (event) {
    var dismiss = event.target.closest(".flash-dismiss");
    if (dismiss) {
      var flash = dismiss.closest(".flash, .alert");
      if (flash) {
        flash.remove();
      }
      return;
    }

    var deleteBtn = event.target.closest(".js-confirm-delete");
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      if (!openConfirm(deleteBtn)) {
        var message = deleteBtn.getAttribute("data-confirm") || "Are you sure?";
        if (window.confirm(message)) {
          htmx.trigger(deleteBtn, "confirmed-delete");
        }
      }
    }
  }, true);

  document.body.addEventListener("click", function (event) {
    if (event.target.closest("[data-confirm-cancel]")) {
      closeConfirm();
      return;
    }
    if (event.target.closest("[data-confirm-ok]")) {
      var el = pendingConfirmEl;
      closeConfirm();
      if (el && window.htmx) {
        htmx.trigger(el, "confirmed-delete");
      }
    }
  });

  document.body.addEventListener("showToast", function (event) {
    var detail = event.detail || {};
    showToast(detail.message, detail.level);
  });

  document.body.addEventListener("htmx:configRequest", function (event) {
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (!meta) {
      return;
    }
    var token = meta.getAttribute("content");
    if (token && !event.detail.headers["X-CSRF-Token"]) {
      event.detail.headers["X-CSRF-Token"] = token;
    }
  });
})();
