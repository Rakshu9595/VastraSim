(function () {
  "use strict";

  const form = document.getElementById("product-form");
  if (!form) return;
  const generateButton = document.getElementById("generate-tryon");
  const helper = document.getElementById("generate-helper");
  const consent = document.getElementById("photo-consent");
  const sections = {
    clothing: document.getElementById("clothing-step"),
    photo: document.getElementById("photo-upload"),
    category: document.getElementById("category-step"),
    processing: document.getElementById("processing-state"),
    result: document.getElementById("result-state")
  };
  const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
  let category = "";
  let productUrl = "";
  let activeSessionId = "";
  let processingTimer = null;

  function uploads() {
    return window.FitMirrorUploads ? {
      garment: window.FitMirrorUploads.get("garment"),
      person: window.FitMirrorUploads.get("person")
    } : { garment: null, person: null };
  }

  function canGenerate() {
    const selected = uploads();
    return Boolean(selected.garment && (selected.garment.file || selected.garment.url) &&
      selected.person && selected.person.file && category && consent.checked);
  }

  function updateGenerateState() {
    const ready = canGenerate();
    generateButton.disabled = !ready;
    helper.hidden = ready;
  }

  function setCategory(value) {
    category = value;
    document.querySelectorAll(".category-card").forEach(function (button) {
      const active = button.dataset.category === value;
      button.setAttribute("aria-pressed", String(active));
    });
    const error = document.getElementById("category-error");
    error.hidden = true;
    updateGenerateState();
  }

  function setActiveStep(step) {
    indicators.forEach(function (indicator) {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("is-active", number === step);
      indicator.classList.toggle("is-complete", number < step);
    });
  }

  function showSection(name) {
    sections.clothing.hidden = name === "processing" || name === "result";
    sections.photo.hidden = name === "processing" || name === "result";
    sections.category.hidden = name === "processing" || name === "result";
    sections.processing.hidden = name !== "processing";
    sections.result.hidden = name !== "result";
    if (name === "processing") setActiveStep(3);
    if (name === "result") setActiveStep(3);
    if (name === "workflow") setActiveStep(1);
  }

  function goToStep(step) {
    const selected = uploads();
    if (step >= 2 && !(selected.garment && (selected.garment.file || selected.garment.url))) {
      window.FitMirrorUI.notify("Add a garment image or fetch a product image before continuing.", "error");
      sections.clothing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (step >= 3 && !(selected.person && selected.person.file)) {
      window.FitMirrorUI.notify("Add your photo before continuing.", "error");
      sections.photo.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (step >= 3 && !consent.checked) {
      window.FitMirrorUI.notify("Please give consent before requesting photo processing.", "error");
      consent.focus();
      return;
    }
    const target = step === 1 ? sections.clothing : step === 2 ? sections.photo : sections.category;
    setActiveStep(step);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function responseData(response) {
    return window.FitMirrorAPI.unwrap(response);
  }

  function sessionId(data) {
    return data && (data.sessionId || data.id || data._id || (data.session && (data.session.id || data.session._id)));
  }

  function resultUrl(data) {
    const source = data && (data.result || data.output || data.session || data);
    if (!source || typeof source !== "object") return "";
    const url = source.resultImageUrl || source.imageUrl || source.outputImageUrl ||
      (source.image && (source.image.url || source.image.imageUrl));
    return typeof url === "string" && /^https?:\/\//i.test(url) ? url : "";
  }

  function statusOf(data) {
    return data && String(data.status || data.state || "").toLowerCase();
  }

  function setError(message) {
    const error = document.getElementById("generation-error");
    error.textContent = message;
    error.hidden = false;
    document.getElementById("retry-generation").hidden = false;
    document.getElementById("processing-title").textContent = "We couldn't create your preview";
    document.getElementById("processing-message").textContent = "Your images were not presented as a successful result. You can try again when the service is ready.";
    document.getElementById("processing-status").textContent = "";
    document.querySelector(".processing-progress").hidden = true;
  }

  function showResult(url, data) {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("The service did not return a usable result image.");
    }
    if (processingTimer) window.clearInterval(processingTimer);
    const image = document.getElementById("result-image");
    image.src = url;
    document.getElementById("comparison-result-image").src = url;
    const selected = uploads();
    if (selected.person && selected.person.url) document.getElementById("comparison-person-image").src = selected.person.url;
    if (selected.garment && selected.garment.url) document.getElementById("result-garment-image").src = selected.garment.url;
    document.getElementById("result-product-name").textContent = document.getElementById("selected-product-label").textContent || "Uploaded clothing image";
    document.getElementById("result-product-category").textContent = category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ");
    image.onerror = function () {
      image.removeAttribute("src");
      showSection("processing");
      setError("The result image returned by the service could not be displayed.");
    };
    document.getElementById("download-result").href = url;
    document.getElementById("download-result").download = "fitmirror-virtual-look";
    const removeButton = document.getElementById("delete-result");
    const id = sessionId(data);
    activeSessionId = id ? String(id) : activeSessionId;
    removeButton.hidden = !activeSessionId;
    const backToStore = document.getElementById("back-to-store");
    if (productUrl && window.FitMirrorProduct.isValidUrl(productUrl)) {
      backToStore.href = productUrl;
      backToStore.hidden = false;
    }
    showSection("result");
  }

  async function pollSession(id, initialData) {
    const immediateUrl = resultUrl(initialData);
    if (immediateUrl) {
      showResult(immediateUrl, initialData);
      return;
    }
    const firstStatus = statusOf(initialData);
    if (["failed", "error", "cancelled"].includes(firstStatus)) {
      throw new Error(initialData.message || initialData.error || "The try-on service reported that generation failed.");
    }
    if (["completed", "complete", "succeeded", "success"].includes(firstStatus)) {
      throw new Error("The service marked the session complete but did not return a result image.");
    }
    if (!id) throw new Error("The service accepted the request but returned no session ID or result image.");

    const messages = ["Preparing your images...", "Processing your clothing selection...", "Generating your virtual look...", "Finalizing your preview..."];
    let index = 0;
    document.getElementById("processing-status").textContent = messages[0];
    processingTimer = window.setInterval(function () {
      index = (index + 1) % messages.length;
      document.getElementById("processing-status").textContent = messages[index];
    }, 5000);
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      await new Promise(function (resolve) { window.setTimeout(resolve, 2500); });
      const response = await window.FitMirrorAPI.getTryOn(id);
      const data = responseData(response);
      const url = resultUrl(data);
      if (url) {
        showResult(url, data);
        return;
      }
      const status = statusOf(data);
      if (["failed", "error", "cancelled"].includes(status)) {
        throw new Error(data.message || data.error || "The try-on service reported that generation failed.");
      }
      if (["completed", "complete", "succeeded", "success"].includes(status)) {
        throw new Error("The service marked the session complete but did not return a result image.");
      }
    }
    throw new Error("This try-on is taking longer than expected. Check your history later or retry.");
  }

  async function generate() {
    document.getElementById("generation-error").hidden = true;
    document.getElementById("retry-generation").hidden = true;
    document.querySelector(".processing-progress").hidden = false;
    document.getElementById("processing-title").textContent = "Creating your virtual look...";
    document.getElementById("processing-message").textContent = "Our AI is preparing your personalized fashion preview.";
    const selected = uploads();
    if (!canGenerate()) {
      updateGenerateState();
      window.FitMirrorUI.notify("Add the required images, choose a category, and give consent first.", "error");
      return;
    }
    productUrl = window.FitMirrorProduct.getUrl();
    const body = new FormData();
    body.append("category", category);
    body.append("personImage", selected.person.file, selected.person.file.name);
    if (selected.garment.file) body.append("garmentImage", selected.garment.file, selected.garment.file.name);
    else body.append("garmentImageUrl", selected.garment.url);
    if (productUrl) body.append("productUrl", productUrl);
    generateButton.disabled = true;
    generateButton.querySelector(".generate-label").hidden = true;
    generateButton.querySelector(".generate-spinner").hidden = false;
    showSection("processing");
    document.getElementById("processing-status").textContent = "Preparing your images...";
    try {
      const response = await window.FitMirrorAPI.createTryOn(body);
      const data = responseData(response);
      const id = sessionId(data);
      if (id) activeSessionId = String(id);
      await pollSession(activeSessionId, data);
    } catch (error) {
      if (processingTimer) window.clearInterval(processingTimer);
      setError(error.message || "The service could not create your preview.");
    } finally {
      generateButton.querySelector(".generate-label").hidden = false;
      generateButton.querySelector(".generate-spinner").hidden = true;
      updateGenerateState();
    }
  }

  document.querySelectorAll(".category-card").forEach(function (button) {
    button.addEventListener("click", function () { setCategory(button.dataset.category); });
  });
  document.querySelectorAll("[data-go-step]").forEach(function (button) {
    button.addEventListener("click", function () { goToStep(Number(button.dataset.goStep)); });
  });
  consent.addEventListener("change", updateGenerateState);
  document.addEventListener("fitmirror:uploadchange", updateGenerateState);
  document.addEventListener("fitmirror:productselected", function (event) {
    productUrl = event.detail.url;
    const extractedCategory = String(event.detail.category || "").toLowerCase();
    const categoryMap = { top: "tops", tops: "tops", bottom: "bottoms", bottoms: "bottoms", dress: "one-pieces", "one-piece": "one-pieces", "one-pieces": "one-pieces" };
    if (categoryMap[extractedCategory]) setCategory(categoryMap[extractedCategory]);
  });
  const resultRange = document.getElementById("result-comparison-range");
  resultRange.addEventListener("input", function () {
    document.getElementById("result-comparison").style.setProperty("--split", resultRange.value + "%");
  });
  generateButton.addEventListener("click", generate);
  document.getElementById("retry-generation").addEventListener("click", generate);
  document.getElementById("try-another").addEventListener("click", function () {
    showSection("workflow");
    setActiveStep(1);
    window.FitMirrorUploads.clear("person");
    window.FitMirrorUploads.clear("garment");
    consent.checked = false;
    setCategory("");
    productUrl = "";
    document.getElementById("product-url").value = "";
    document.getElementById("product-preview").hidden = true;
    document.getElementById("selected-product-note").hidden = true;
    document.getElementById("fitting-room").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("delete-result").addEventListener("click", async function () {
    if (!activeSessionId) return;
    if (!window.confirm("Delete this saved try-on session?")) return;
    try {
      await window.FitMirrorAPI.deleteHistory(activeSessionId);
      window.FitMirrorUI.notify("The session was deleted.", "success");
      activeSessionId = "";
      document.getElementById("delete-result").hidden = true;
    } catch (error) {
      window.FitMirrorUI.notify(error.message || "The session could not be deleted.", "error");
    }
  });

  const params = new URLSearchParams(window.location.search);
  const preset = params.get("category");
  if (["tops", "bottoms", "one-pieces"].includes(preset)) setCategory(preset);
  updateGenerateState();
}());