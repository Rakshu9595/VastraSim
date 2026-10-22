(function () {
  "use strict";

  const loading = document.getElementById("history-loading");
  if (!loading) return;
  const grid = document.getElementById("history-grid");
  const empty = document.getElementById("history-empty");
  const errorBox = document.getElementById("history-error");
  const dialog = document.getElementById("session-dialog");
  const deleteDialog = document.getElementById("delete-dialog");
  let sessions = [];
  let pendingDeleteId = "";
  let nextCursor = null;

  function asString(value, fallback) {
    return typeof value === "string" && value ? value : fallback;
  }

  function imageUrl(value) {
    if (typeof value !== "string" || !value) return "";
    try {
      const parsed = new URL(value, window.location.href);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }

  function field(session, keys) {
    for (const key of keys) {
      const value = session[key];
      if (typeof value === "string" && value) return value;
      if (value && typeof value === "object" && typeof value.url === "string") return value.url;
    }
    return "";
  }

  function sessionId(session) {
    return session.id || session._id || session.sessionId || "";
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }

  function statusClass(status) {
    return String(status || "unknown").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  }

  function createCard(session) {
    const id = sessionId(session);
    const card = makeElement("article", "history-card");
    const figure = makeElement("div", "history-card-image");
    const resultUrl = imageUrl(field(session, ["resultImageUrl", "imageUrl", "outputImageUrl", "resultImage"]));
    if (resultUrl) {
      const image = document.createElement("img");
      image.src = resultUrl;
      image.alt = "Virtual try-on result";
      image.loading = "lazy";
      image.addEventListener("error", function () {
        image.replaceWith(makeElement("div", "image-fallback", "Image unavailable"));
      }, { once: true });
      figure.appendChild(image);
    } else {
      figure.appendChild(makeElement("div", "image-fallback", "No result image"));
    }
    const status = asString(session.status, "Unknown");
    const badge = makeElement("span", "status-badge status-" + statusClass(status));
    badge.textContent = status;
    figure.appendChild(badge);

    const body = makeElement("div", "history-card-body");
    const title = makeElement("h2", "", asString(session.productName || session.name, "Virtual try-on"));
    const meta = makeElement("div", "history-card-meta");
    const category = makeElement("span", "", asString(session.category, "Category unavailable"));
    const date = makeElement("time", "", formatDate(session.createdAt || session.created_at || session.date));
    const timeValue = session.createdAt || session.created_at || session.date;
    if (timeValue) date.dateTime = String(timeValue);
    meta.append(category, date);
    const actions = makeElement("div", "history-card-actions");
    const view = makeElement("button", "btn btn-outline-soft", "View look");
    view.type = "button";
    view.addEventListener("click", function () { showDetails(session); });
    const remove = makeElement("button", "btn delete-session");
    remove.type = "button";
    remove.setAttribute("aria-label", "Delete " + (session.productName || "saved try-on"));
    remove.innerHTML = '<i class="bi bi-trash3"></i>';
    remove.addEventListener("click", function () {
      pendingDeleteId = id ? String(id) : "";
      deleteDialog.showModal();
    });
    actions.append(view, remove);
    body.append(title, meta, actions);
    card.append(figure, body);
    return card;
  }

  function showDetails(session) {
    const content = document.getElementById("dialog-content");
    content.replaceChildren();
    const resultUrl = imageUrl(field(session, ["resultImageUrl", "imageUrl", "outputImageUrl", "resultImage"]));
    if (resultUrl) {
      const image = document.createElement("img");
      image.className = "dialog-image";
      image.src = resultUrl;
      image.alt = "Virtual try-on result";
      content.appendChild(image);
    }
    const meta = makeElement("div", "dialog-meta");
    [
      ["Product", asString(session.productName || session.name, "Virtual try-on")],
      ["Category", asString(session.category, "Not provided")],
      ["Status", asString(session.status, "Unknown")],
      ["Created", formatDate(session.createdAt || session.created_at || session.date)]
    ].forEach(function (item) {
      const span = makeElement("span");
      const strong = makeElement("strong", "", item[0] + ": ");
      span.append(strong, document.createTextNode(item[1]));
      meta.appendChild(span);
    });
    content.appendChild(meta);
    dialog.showModal();
  }

  function showState(state, message) {
    loading.hidden = state !== "loading";
    empty.hidden = state !== "empty";
    errorBox.hidden = state !== "error";
    grid.hidden = state !== "items";
    document.getElementById("history-content").setAttribute("aria-busy", String(state === "loading"));
    if (state === "error" && message) document.getElementById("history-error-message").textContent = message;
  }

  function appendSessions(items) {
    items.forEach(function (session) {
      sessions.push(session);
      grid.appendChild(createCard(session));
    });
  }

  async function loadHistory(append) {
    if (!append) {
      sessions = [];
      grid.replaceChildren();
      showState("loading");
    }
    try {
      const response = window.FitMirrorAPI.unwrap(await window.FitMirrorAPI.getHistory(append ? nextCursor : null));
      const items = response && (response.sessions || response.history);
      if (!Array.isArray(items)) throw new Error("The history service returned an unexpected response.");
      nextCursor = response.nextCursor || null;
      appendSessions(items);
      if (sessions.length === 0) {
        showState("empty");
      } else {
        showState("items");
        updateLoadMore();
      }
    } catch (loadError) {
      showState("error", loadError.message || "History is unavailable right now. Please try again.");
    }
  }

  function updateLoadMore() {
    let button = document.getElementById("load-more-history");
    if (!nextCursor) {
      if (button) button.remove();
      return;
    }
    if (!button) {
      button = makeElement("button", "btn btn-outline-soft history-load-more", "Load more");
      button.id = "load-more-history";
      button.type = "button";
      button.addEventListener("click", function () {
        button.disabled = true;
        loadHistory(true).finally(function () { button.disabled = false; });
      });
    }
    if (!button.isConnected) grid.insertAdjacentElement("afterend", button);
  }

  document.getElementById("refresh-history").addEventListener("click", function () { loadHistory(false); });
  document.getElementById("retry-history").addEventListener("click", function () { loadHistory(false); });
  document.getElementById("close-session-dialog").addEventListener("click", function () { dialog.close(); });
  document.getElementById("cancel-delete").addEventListener("click", function () { deleteDialog.close(); pendingDeleteId = ""; });
  document.getElementById("cancel-delete-x").addEventListener("click", function () { deleteDialog.close(); pendingDeleteId = ""; });
  document.getElementById("confirm-delete").addEventListener("click", async function () {
    if (!pendingDeleteId) {
      window.FitMirrorUI.notify("This session has no identifier and cannot be deleted.", "error");
      deleteDialog.close();
      return;
    }
    const button = document.getElementById("confirm-delete");
    button.disabled = true;
    try {
      await window.FitMirrorAPI.deleteHistory(pendingDeleteId);
      deleteDialog.close();
      window.FitMirrorUI.notify("The saved look was deleted.", "success");
      await loadHistory(false);
    } catch (deleteError) {
      window.FitMirrorUI.notify(deleteError.message || "This look could not be deleted.", "error");
    } finally {
      pendingDeleteId = "";
      button.disabled = false;
    }
  });
  [dialog, deleteDialog].forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) modal.close();
    });
  });
  loadHistory(false);
}());