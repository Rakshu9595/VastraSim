(function () {
  "use strict";

  const metaBase = document.querySelector('meta[name="api-base-url"]');
  const configuredBase = window.FITMIRROR_API_BASE || (metaBase && metaBase.content) || "/api";
  const apiBase = String(configuredBase).replace(/\/+$/, "");
  const defaultTimeout = 30000;

  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.name = "ApiError";
      this.status = status || 0;
      this.details = details || null;
    }
  }

  function endpoint(path) {
    return apiBase + (path.charAt(0) === "/" ? path : "/" + path);
  }

  async function request(path, options) {
    const settings = options || {};
    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, settings.timeout || defaultTimeout);
    const headers = new Headers(settings.headers || {});
    if (settings.body && !(settings.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    try {
      const url = /^https?:\/\//i.test(path) ? path : endpoint(path);
      const response = await fetch(url, {
        method: settings.method || "GET",
        headers: headers,
        body: settings.body,
        signal: controller.signal,
        credentials: "same-origin"
      });
      const contentType = response.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (response.status !== 204) {
        const text = await response.text();
        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text);
        data = text && !looksLikeHtml ? { message: text.slice(0, 400) } : null;
      }
      if (!response.ok) {
        let message = data && (data.message || data.error) ? data.message || data.error : "The service returned an error (" + response.status + ").";
        if (response.status === 401 || response.status === 403) {
          message = "You are not authorized to perform this action. Please check your session and try again.";
        } else if (typeof message !== "string") {
          message = "The service returned an error (" + response.status + ").";
        }
        message = message.slice(0, 400);
        throw new ApiError(message, response.status, data);
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === "AbortError") {
        throw new ApiError("The request timed out. Please try again.", 0);
      }
      throw new ApiError("The service could not be reached. Check that the backend is running and try again.", 0, error);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function get(path, options) {
    return request(path, options);
  }

  function postJson(path, value) {
    return request(path, { method: "POST", body: JSON.stringify(value) });
  }

  function postForm(path, formData, timeout) {
    return request(path, { method: "POST", body: formData, timeout: timeout || 120000 });
  }

  function remove(path) {
    return request(path, { method: "DELETE" });
  }

  function unwrap(value) {
    return value && typeof value === "object" && value.data && typeof value.data === "object" ? value.data : value;
  }

  function getProduct(url) {
    return postJson("/products/extract", { url: url });
  }

  function createTryOn(formData) {
    return postForm("/tryon", formData, 120000);
  }

  function getTryOn(id) {
    return get("/tryon/" + encodeURIComponent(id), { timeout: 20000 });
  }

  function getHistory(cursor) {
    return get("/history" + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""));
  }

  function getHealth() {
    const base = /^https?:\/\//i.test(apiBase) ? new URL(apiBase) : new URL(window.location.origin);
    return get(new URL("/health", base.origin).href);
  }

  function deleteHistory(id) {
    return remove("/history/" + encodeURIComponent(id));
  }

  function uploadPerson(file) {
    const body = new FormData();
    body.append("personImage", file, file.name);
    return postForm("/uploads/person", body);
  }

  window.FitMirrorAPI = {
    ApiError: ApiError,
    baseUrl: apiBase,
    createTryOn: createTryOn,
    deleteHistory: deleteHistory,
    getHistory: getHistory,
    getHealth: getHealth,
    getProduct: getProduct,
    getTryOn: getTryOn,
    unwrap: unwrap,
    uploadPerson: uploadPerson
  };
}());