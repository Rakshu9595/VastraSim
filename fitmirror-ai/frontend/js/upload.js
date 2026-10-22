(function () {
  "use strict";

  const defaultLimits = { garment: 8 * 1024 * 1024, person: 10 * 1024 * 1024 };
  const configuredLimits = window.FITMIRROR_UPLOAD_LIMITS || {};
  const limits = {
    garment: Number.isFinite(configuredLimits.garment) && configuredLimits.garment > 0 ? configuredLimits.garment : defaultLimits.garment,
    person: Number.isFinite(configuredLimits.person) && configuredLimits.person > 0 ? configuredLimits.person : defaultLimits.person
  };
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
  const uploads = {
    garment: { file: null, url: null, objectUrl: null },
    person: { file: null, url: null, objectUrl: null }
  };

  function showError(kind, message) {
    const error = document.getElementById(kind + "-error");
    if (!error) return;
    error.textContent = message || "";
    error.hidden = !message;
  }

  function revoke(kind) {
    const item = uploads[kind];
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    item.objectUrl = null;
  }

  function setFile(kind, file) {
    if (!uploads[kind]) return false;
    showError(kind, "");
    if (!file) return false;
    if (!acceptedTypes.includes(file.type)) {
      showError(kind, "Choose a JPG, PNG, or WebP image.");
      return false;
    }
    if (file.size > limits[kind]) {
      showError(kind, "This file is too large. The maximum size is " + (limits[kind] / 1024 / 1024) + " MB.");
      return false;
    }
    revoke(kind);
    const objectUrl = URL.createObjectURL(file);
    uploads[kind] = { file: file, url: objectUrl, objectUrl: objectUrl };
    const image = document.getElementById(kind + "-preview-image");
    const filename = document.getElementById(kind + "-file-name");
    const empty = document.getElementById(kind + "-empty");
    const filled = document.getElementById(kind + "-filled");
    if (image) image.src = objectUrl;
    if (filename) filename.textContent = file.name;
    if (empty) empty.hidden = true;
    if (filled) filled.hidden = false;
    document.dispatchEvent(new CustomEvent("fitmirror:uploadchange", { detail: { kind: kind, file: file } }));
    return true;
  }

  function setRemoteGarment(url) {
    if (!url || !/^https?:\/\//i.test(url)) {
      showError("garment", "The product service did not return a usable clothing image.");
      return false;
    }
    revoke("garment");
    uploads.garment = { file: null, url: url, objectUrl: null };
    const image = document.getElementById("garment-preview-image");
    const filename = document.getElementById("garment-file-name");
    const empty = document.getElementById("garment-empty");
    const filled = document.getElementById("garment-filled");
    if (image) {
      image.onerror = function () {
        showError("garment", "This clothing image could not be displayed. Upload an image instead.");
        clear("garment");
      };
      image.src = url;
    }
    if (filename) filename.textContent = "Product image";
    if (empty) empty.hidden = true;
    if (filled) filled.hidden = false;
    showError("garment", "");
    document.dispatchEvent(new CustomEvent("fitmirror:uploadchange", { detail: { kind: "garment", file: null, url: url } }));
    return true;
  }

  function clear(kind) {
    if (!uploads[kind]) return;
    revoke(kind);
    uploads[kind] = { file: null, url: null, objectUrl: null };
    const image = document.getElementById(kind + "-preview-image");
    const input = document.getElementById(kind + "-file");
    const empty = document.getElementById(kind + "-empty");
    const filled = document.getElementById(kind + "-filled");
    if (image) {
      image.removeAttribute("src");
      image.onerror = null;
    }
    if (input) input.value = "";
    if (empty) empty.hidden = false;
    if (filled) filled.hidden = true;
    showError(kind, "");
    document.dispatchEvent(new CustomEvent("fitmirror:uploadchange", { detail: { kind: kind, file: null } }));
  }

  document.querySelectorAll("[data-browse]").forEach(function (button) {
    button.addEventListener("click", function () {
      const input = document.getElementById(button.dataset.browse);
      if (input) input.click();
    });
  });
  document.querySelectorAll("[data-remove]").forEach(function (button) {
    button.addEventListener("click", function () {
      clear(button.dataset.remove);
    });
  });
  ["garment", "person"].forEach(function (kind) {
    const input = document.getElementById(kind + "-file");
    const card = document.querySelector('[data-upload-card="' + kind + '"]');
    if (!input || !card) return;
    const sizeHint = card.querySelector("[data-upload-limit]");
    if (sizeHint) sizeHint.textContent = "JPG, PNG or WebP · up to " + (limits[kind] / 1024 / 1024) + " MB";
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) setFile(kind, input.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (eventName) {
      card.addEventListener(eventName, function (event) {
        event.preventDefault();
        card.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach(function (eventName) {
      card.addEventListener(eventName, function (event) {
        event.preventDefault();
        card.classList.remove("is-dragging");
      });
    });
    card.addEventListener("drop", function (event) {
      if (event.dataTransfer && event.dataTransfer.files[0]) setFile(kind, event.dataTransfer.files[0]);
    });
  });
  window.addEventListener("beforeunload", function () {
    revoke("garment");
    revoke("person");
  });
  window.FitMirrorUploads = {
    clear: clear,
    get: function (kind) { return uploads[kind] || null; },
    limits: Object.assign({}, limits),
    setRemoteGarment: setRemoteGarment,
    setFile: setFile
  };
}());