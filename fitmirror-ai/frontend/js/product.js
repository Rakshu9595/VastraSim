(function () {
  "use strict";

  const form = document.getElementById("product-form");
  if (!form) return;
  const urlInput = document.getElementById("product-url");
  const error = document.getElementById("product-error");
  const fetchButton = document.getElementById("fetch-product");
  const preview = document.getElementById("product-preview");
  const selectedNote = document.getElementById("selected-product-note");
  let productUrl = "";

  function message(text) {
    error.textContent = text || "";
    error.hidden = !text;
  }

  function validProductUrl(value) {
    try {
      const parsed = new URL(value);
      return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname.includes("."));
    } catch (_) {
      return false;
    }
  }

  function setBusy(busy) {
    fetchButton.disabled = busy;
    fetchButton.querySelector(".button-label").hidden = busy;
    fetchButton.querySelector(".button-spinner").hidden = !busy;
  }

  function productData(response) {
    const data = window.FitMirrorAPI.unwrap(response);
    const product = data && (data.product || data.item || data);
    if (!product || typeof product !== "object") return null;
    const image = product.imageUrl || product.image || product.productImage || product.image_url;
    const name = product.name || product.title || product.productName;
    return {
      image: typeof image === "string" ? image : "",
      name: typeof name === "string" ? name : "Product from your link",
      metadata: product.brand || product.price || "",
      category: product.category || product.garmentCategory || ""
    };
  }

  function showProduct(data) {
    preview.replaceChildren();
    const image = document.createElement("img");
    image.alt = "";
    image.src = data.image;
    image.loading = "lazy";
    image.addEventListener("error", function () {
      image.remove();
      message("The product service returned an image that could not be displayed. Upload a clothing image instead.");
      window.FitMirrorUploads.clear("garment");
      preview.hidden = true;
    }, { once: true });
    const details = document.createElement("div");
    details.className = "product-preview-details";
    const title = document.createElement("strong");
    title.textContent = data.name;
    const meta = document.createElement("span");
    meta.textContent = data.metadata ? String(data.metadata) : "Product image found";
    details.append(title, meta);
    const link = document.createElement("a");
    link.className = "product-external";
    link.href = productUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "Open the product store in a new tab");
    link.innerHTML = '<i class="bi bi-box-arrow-up-right"></i>';
    preview.append(image, details, link);
    preview.hidden = false;
    if (!window.FitMirrorUploads.setRemoteGarment(data.image)) return;
    selectedNote.hidden = false;
    document.getElementById("selected-product-label").textContent = data.name + " selected from product link";
    document.dispatchEvent(new CustomEvent("fitmirror:productselected", { detail: { url: productUrl, name: data.name, category: data.category } }));
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    message("");
    if (!validProductUrl(urlInput.value.trim())) {
      message("Enter a complete product URL beginning with http:// or https://.");
      urlInput.focus();
      return;
    }
    if (!window.FitMirrorAPI) {
      message("Product lookup is not available. Upload a clothing image instead.");
      return;
    }
    const requestedUrl = urlInput.value.trim();
    setBusy(true);
    try {
      const response = await window.FitMirrorAPI.getProduct(requestedUrl);
      const parsed = productData(response);
      if (!parsed || !parsed.image || !/^https?:\/\//i.test(parsed.image)) {
        throw new Error("The product service did not return a usable product image. Upload a clothing image instead.");
      }
      productUrl = requestedUrl;
      showProduct(parsed);
    } catch (requestError) {
      message(requestError.message || "We couldn't fetch this product. Upload a clothing image instead.");
    } finally {
      setBusy(false);
    }
  });

  document.getElementById("paste-url").addEventListener("click", async function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      message("Clipboard access is unavailable here. Paste the product URL into the field.");
      urlInput.focus();
      return;
    }
    try {
      urlInput.value = await navigator.clipboard.readText();
      urlInput.focus();
      message("");
    } catch (_) {
      message("Clipboard access was blocked. Paste the product URL into the field.");
      urlInput.focus();
    }
  });
  document.getElementById("clear-product").addEventListener("click", function () {
    productUrl = "";
    preview.hidden = true;
    selectedNote.hidden = true;
    urlInput.value = "";
    window.FitMirrorUploads.clear("garment");
  });
  document.addEventListener("fitmirror:uploadchange", function (event) {
    if (event.detail.kind === "garment" && event.detail.file) {
      productUrl = "";
      preview.hidden = true;
      selectedNote.hidden = true;
    }
    if (event.detail.kind === "garment" && !event.detail.file && !event.detail.url) {
      productUrl = "";
      selectedNote.hidden = true;
    }
  });
  window.FitMirrorProduct = {
    getUrl: function () { return productUrl; },
    isValidUrl: validProductUrl
  };
}());