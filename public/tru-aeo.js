/**
 * TruAEO / TruSignal — Modern Deterministic AEO/SEO & Multi-Platform Syndication Widget
 * 
 * Works on ANY site (HTML, WordPress, Shopify, Webflow, Next.js, etc.).
 * Zero AI fluff / hallucinated text. Pure structured semantic data & high-conversion syndication.
 * 
 * Capabilities:
 * 1. Semantic Schema.org Entity Injection (JSON-LD): Injects valid Schema.org
 *    (Product, Offer, LocalBusiness, AutoDealer, Organization, BreadcrumbList)
 *    parsed either from declared attributes or scraped directly from DOM.
 * 2. Multi-Platform 1-Tap Sharing:
 *    - WhatsApp: Pre-formatted qualified lead CTA with title, stock/SKU, price, and canonical link.
 *    - Facebook, LinkedIn, X (Twitter), Telegram, Native Web Share Sheet.
 * 3. Owner/Dealer Posting Accelerator (?post=1):
 *    - Auto-copies sales copy with link + hashtags directly to clipboard.
 *    - Opens business page composer (Facebook Page, LinkedIn, etc.) directly.
 * 4. AEO Head Metadata Synchronization:
 *    - Injects canonical, og:*, and twitter:* tags dynamically if missing.
 */
(function (root) {
  "use strict";

  // Prevent duplicate initialization
  if (root.__TRU_AEO_INITIALIZED__) return;
  root.__TRU_AEO_INITIALIZED__ = true;

  // Resolve script element & configuration
  var scr = document.currentScript || document.querySelector("script[src*='tru-aeo']");
  function attr(name, fallback) {
    return (scr && scr.getAttribute(name)) || fallback;
  }

  var config = {
    businessName: attr("data-business", document.title || "Business"),
    businessType: attr("data-business-type", attr("data-industry", "LocalBusiness")),
    industry: attr("data-industry", attr("data-business-type", "localbusiness")),
    siteUrl: String(attr("data-site", location.origin)).replace(/\/$/, ""),
    phone: (attr("data-phone", "") || "").replace(/\D/g, ""),
    whatsapp: (attr("data-wa", "") || attr("data-phone", "") || "").replace(/\D/g, ""),
    currency: attr("data-currency", "R"),
    price: attr("data-price", ""),
    sku: attr("data-sku", ""),
    title: attr("data-title", ""),
    image: attr("data-image", ""),
    accent: attr("data-accent", "#1e40af"),
    postFlag: attr("data-post-flag", "post"),
    fbPage: attr("data-fb-page", ""),
    igHandle: attr("data-ig-handle", ""),
    gbp: attr("data-gbp", ""),
    linkedin: attr("data-linkedin", ""),
    xHandle: attr("data-x", ""),
    position: attr("data-position", "bottom-right"),
    bottomOffset: attr("data-bottom", "20px"),
    sideOffset: attr("data-offset-x", "20px"),
    widgetSize: attr("data-size", "compact"), // 'compact' (small icon badge) | 'regular' | 'hidden'
    showUI: attr("data-ui", "true") !== "false" && attr("data-headless", "false") !== "true",
    autoSchema: attr("data-auto-schema", "true") !== "false",
    leadMessage: attr("data-lead-message", "")
  };

  // Helper Utilities
  var clean = function (s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); };

  var formatCurrency = function (amount, sym) {
    var num = parseInt(String(amount || "").replace(/\D/g, ""), 10);
    if (!num) return "";
    var formatted = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (sym ? sym + " " : "") + formatted;
  };

  // Extract Page Entity from Meta or DOM if not explicitly passed
  function extractEntity() {
    var ogTitle = (document.querySelector('meta[property="og:title"]') || {}).content;
    var ogDesc = (document.querySelector('meta[property="og:description"]') || {}).content;
    var ogImg = (document.querySelector('meta[property="og:image"]') || {}).content;
    var ogPrice = (document.querySelector('meta[property="product:price:amount"]') || {}).content;

    var h1 = (document.querySelector("h1") || {}).innerText;
    var rawTitle = config.title || ogTitle || h1 || document.title;
    var rawImg = config.image || ogImg || (document.querySelector("img") || {}).src || "";

    var rawPrice = config.price || ogPrice;
    if (!rawPrice) {
      var priceMatch = document.body.innerText.match(/(?:R|\$|£|€)\s*([0-9]{1,3}(?:[ ,.][0-9]{3})+|[0-9]{2,7})/);
      if (priceMatch && priceMatch[1]) {
        rawPrice = priceMatch[1].replace(/[,. ]/g, "");
      }
    }

    var canonicalEl = document.querySelector('link[rel="canonical"]');
    var canonicalUrl = canonicalEl ? canonicalEl.href : location.href.split("?")[0];

    return {
      title: clean(rawTitle),
      description: clean(ogDesc || document.title),
      image: rawImg,
      price: rawPrice ? parseInt(String(rawPrice).replace(/\D/g, ""), 10) : null,
      priceFormatted: rawPrice ? formatCurrency(rawPrice, config.currency) : "",
      url: canonicalUrl,
      sku: config.sku || ""
    };
  }

  // Inject standard Schema.org JSON-LD
  function injectSchema(entity) {
    if (!config.autoSchema) return;

    var existingLd = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < existingLd.length; i++) {
      if (existingLd[i].getAttribute("data-tru-aeo")) return; // already injected
    }

    var preset = (root.OmniSchema && root.OmniSchema.resolveIndustry(config.industry || config.businessType)) || {
      schemaType: config.businessType || "LocalBusiness",
      itemType: "Product",
      actionText: "Inquire via WhatsApp",
      leadPlaceholder: "Hi! I am interested in: {title} (Price: {price}). Link: {url}"
    };

    var graph = [];

    // Organization / LocalBusiness node
    var sameAs = [];
    if (config.gbp) sameAs.push(config.gbp);
    if (config.fbPage) sameAs.push(config.fbPage.startsWith("http") ? config.fbPage : "https://www.facebook.com/" + config.fbPage);
    if (config.igHandle) sameAs.push(config.igHandle.startsWith("http") ? config.igHandle : "https://www.instagram.com/" + config.igHandle.replace(/^@/, ""));
    if (config.linkedin) sameAs.push(config.linkedin.startsWith("http") ? config.linkedin : "https://www.linkedin.com/company/" + config.linkedin);
    if (config.xHandle) sameAs.push(config.xHandle.startsWith("http") ? config.xHandle : "https://x.com/" + config.xHandle.replace(/^@/, ""));

    var businessNode = {
      "@context": "https://schema.org",
      "@type": preset.schemaType,
      "@id": config.siteUrl + "/#organization",
      "name": config.businessName,
      "url": config.siteUrl
    };
    if (sameAs.length > 0) businessNode.sameAs = sameAs;
    if (config.phone) businessNode.telephone = config.phone;
    graph.push(businessNode);

    // If on a product / item detail page
    if (entity.price || entity.sku || document.querySelector('[itemtype*="Product"]')) {
      var productNode = {
        "@context": "https://schema.org",
        "@type": preset.itemType || (config.businessType === "AutoDealer" ? "Car" : "Product"),
        "name": entity.title,
        "description": entity.description,
        "url": entity.url,
        "image": entity.image ? [entity.image] : undefined
      };

      if (entity.sku) productNode.sku = entity.sku;

      if (entity.price) {
        productNode.offers = {
          "@type": "Offer",
          "priceCurrency": config.currency === "R" ? "ZAR" : (config.currency === "£" ? "GBP" : (config.currency === "$" ? "USD" : "ZAR")),
          "price": entity.price,
          "availability": "https://schema.org/InStock",
          "url": entity.url,
          "seller": {
            "@id": config.siteUrl + "/#organization"
          }
        };
      }
      graph.push(productNode);
    }

    var scriptEl = document.createElement("script");
    scriptEl.type = "application/ld+json";
    scriptEl.setAttribute("data-tru-aeo", "1");
    scriptEl.textContent = JSON.stringify(graph.length === 1 ? graph[0] : { "@context": "https://schema.org", "@graph": graph }, null, 2);
    document.head.appendChild(scriptEl);
  }

  // Synchronize Open Graph tags if missing
  function syncMeta(entity) {
    function setMeta(prop, val) {
      if (!val) return;
      var el = document.querySelector('meta[property="' + prop + '"]') || document.querySelector('meta[name="' + prop + '"]');
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(prop.indexOf("og:") === 0 ? "property" : "name", prop);
        document.head.appendChild(el);
      }
      if (!el.content) el.content = val;
    }

    setMeta("og:title", entity.priceFormatted ? entity.title + " — " + entity.priceFormatted : entity.title);
    setMeta("og:description", entity.description);
    setMeta("og:url", entity.url);
    if (entity.image) setMeta("og:image", entity.image);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", entity.title);
  }

  // Check if current user is owner/staff via query parameter
  function isDealerMode() {
    var params = new URLSearchParams(location.search);
    return params.has(config.postFlag) || sessionStorage.getItem("__tru_aeo_dealer_mode__") === "1";
  }

  // Render Syndication & Action UI
  function renderUI(entity) {
    var isDealer = isDealerMode();
    if (isDealer) sessionStorage.setItem("__tru_aeo_dealer_mode__", "1");

    var host = document.createElement("div");
    host.id = "tru-aeo-root";

    // Attach Shadow DOM for zero CSS collisions
    var shadow = host.attachShadow({ mode: "open" });

    // If UI is disabled, do not render trigger button or modal, but expose JS API
    if (!config.showUI || config.widgetSize === "hidden") {
      root.TruAEO = {
        open: function () {},
        close: function () {},
        getEntity: function () { return entity; },
        isDealerMode: isDealer
      };
      return;
    }

    var style = document.createElement("style");
    var isLeft = config.position === "bottom-left" || config.position === "left";
    var isTop = config.position === "top-left" || config.position === "top-right";
    var sideRule = isLeft ? "left: " + config.sideOffset + ";" : "right: " + config.sideOffset + ";";
    var vertRule = isTop ? "top: " + config.bottomOffset + ";" : "bottom: " + config.bottomOffset + ";";

    style.textContent = `
      :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: #0f172a;
        box-sizing: border-box;
      }
      *, *:before, *:after { box-sizing: inherit; }

      .tru-hub-trigger {
        position: fixed;
        ${sideRule}
        ${vertRule}
        z-index: 999990;
        background: ${config.accent};
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        padding: ${config.widgetSize === "compact" ? "8px 12px" : "10px 16px"};
        font-size: ${config.widgetSize === "compact" ? "12px" : "13px"};
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        opacity: 0.92;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, opacity 0.2s ease;
      }
      .tru-hub-trigger:hover {
        transform: translateY(-2px);
        opacity: 1;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
      }
      .tru-hub-trigger svg { 
        width: ${config.widgetSize === "compact" ? "15px" : "18px"}; 
        height: ${config.widgetSize === "compact" ? "15px" : "18px"}; 
        fill: currentColor; 
      }

      .tru-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 999995;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .tru-modal-backdrop.open { display: flex; }

      .tru-card {
        background: #ffffff;
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: truPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes truPop {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      .tru-card-head {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .tru-card-title {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .tru-badge {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 3px 8px;
        border-radius: 6px;
        background: #dbeafe;
        color: #1e40af;
      }
      .tru-badge.dealer {
        background: #fef3c7;
        color: #92400e;
      }
      .tru-close-btn {
        background: transparent;
        border: none;
        font-size: 20px;
        color: #64748b;
        cursor: pointer;
        line-height: 1;
        padding: 4px;
      }
      .tru-card-body { padding: 20px; }

      .tru-preview-box {
        display: flex;
        gap: 12px;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 18px;
      }
      .tru-preview-img {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        object-fit: cover;
        background: #cbd5e1;
      }
      .tru-preview-info { flex: 1; min-width: 0; }
      .tru-preview-name {
        font-weight: 600;
        font-size: 13px;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tru-preview-price {
        font-weight: 700;
        color: ${config.accent};
        font-size: 14px;
        margin-top: 2px;
      }

      .tru-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .tru-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .tru-btn:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      .tru-btn.primary-wa {
        background: #25D366;
        color: #ffffff;
        border-color: #22c55e;
        grid-column: span 2;
      }
      .tru-btn.primary-wa:hover {
        background: #20ba5a;
      }
      .tru-btn.primary-fb {
        background: #1877F2;
        color: #ffffff;
        border-color: #166fe5;
      }
      .tru-btn.primary-fb:hover {
        background: #1565cf;
      }

      .tru-toast {
        margin-top: 14px;
        padding: 8px 12px;
        border-radius: 6px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        font-size: 12px;
        text-align: center;
        display: none;
      }
    `;

    var modal = document.createElement("div");
    modal.className = "tru-modal-backdrop";

    // Construct social links
    var cleanUrl = encodeURIComponent(entity.url);
    var preset = (root.OmniSchema && root.OmniSchema.resolveIndustry(config.industry || config.businessType)) || {
      actionText: "Inquire via WhatsApp",
      leadPlaceholder: "Hi! I am interested in: {title} (Price: {price}). Link: {url}"
    };

    var waTemplate = config.leadMessage || preset.leadPlaceholder || "Hi! I am interested in: {title} (Price: {price}). Link: {url}";
    var waText = waTemplate
      .replace("{title}", entity.title)
      .replace("{price}", entity.priceFormatted || "")
      .replace("{url}", entity.url)
      .replace("{sku}", entity.sku || "");
    var waUrl = "https://wa.me/" + config.whatsapp + "?text=" + encodeURIComponent(waText);

    var shareCaption = (entity.priceFormatted ? entity.title + " — " + entity.priceFormatted : entity.title) +
      "\n\nDirect link: " + entity.url +
      (config.businessName ? "\n" + config.businessName : "");

    var fbPostUrl = config.fbPage
      ? "https://www.facebook.com/" + config.fbPage + "/posts"
      : "https://www.facebook.com/sharer/sharer.php?u=" + cleanUrl;

    var xUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(entity.title + (entity.priceFormatted ? " (" + entity.priceFormatted + ")" : "")) + "&url=" + cleanUrl;
    var inUrl = "https://www.linkedin.com/sharing/share-offsite/?url=" + cleanUrl;

    var actionCtaText = isDealer ? "Post / Share" : (preset.actionText || "Inquire via WhatsApp");

    modal.innerHTML = `
      <div class="tru-card">
        <div class="tru-card-head">
          <div>
            <h3 class="tru-card-title">${isDealer ? "Dealership Posting Hub" : "Share & Inquire"}</h3>
            <span class="tru-badge ${isDealer ? "dealer" : ""}">${isDealer ? "Staff Syndication" : "Direct Connect"}</span>
          </div>
          <button class="tru-close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="tru-card-body">
          <div class="tru-preview-box">
            ${entity.image ? `<img src="${entity.image}" class="tru-preview-img" alt="${entity.title}">` : ""}
            <div class="tru-preview-info">
              <div class="tru-preview-name">${entity.title}</div>
              ${entity.priceFormatted ? `<div class="tru-preview-price">${entity.priceFormatted}</div>` : ""}
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">SEO & Social Verified</div>
            </div>
          </div>

          <div class="tru-grid">
            ${config.whatsapp ? `
              <a href="${waUrl}" target="_blank" rel="noopener" class="tru-btn primary-wa">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.084-2.17-.525-1.748-.724-2.883-2.483-2.971-2.599-.088-.116-.714-.95-.714-1.815 0-.865.452-1.292.613-1.468.161-.176.353-.22.47-.22.118 0 .235.001.338.006.109.006.255-.041.399.304.148.354.507 1.235.551 1.324.044.089.073.193.015.309-.059.117-.088.19-.176.294-.088.103-.185.23-.264.31-.088.088-.18.184-.078.36.102.176.454.748.974 1.212.67.597 1.234.782 1.41.87.176.088.279.074.382-.044.103-.117.44-.513.558-.689.117-.176.235-.147.396-.088.161.059 1.025.484 1.202.572.176.088.293.132.337.206.044.074.044.426-.1 1.026z"/></svg>
                ${isDealer ? "WhatsApp Customer Lead" : "Inquire via WhatsApp"}
              </a>
            ` : ""}

            <button class="tru-btn primary-fb" id="tru-btn-fb">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              ${isDealer ? "Post to Facebook" : "Facebook"}
            </button>

            <a href="${xUrl}" target="_blank" rel="noopener" class="tru-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </a>

            <a href="${inUrl}" target="_blank" rel="noopener" class="tru-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>
              LinkedIn
            </a>

            <button class="tru-btn" id="tru-btn-copy" style="grid-column: span 2;">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/><path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/></svg>
              ${isDealer ? "Copy Post Caption + Link" : "Copy Verified Link"}
            </button>
          </div>

          <div class="tru-toast" id="tru-toast">Caption & link copied to clipboard!</div>
        </div>
      </div>
    `;

    var triggerBtn = document.createElement("button");
    triggerBtn.className = "tru-hub-trigger";
    triggerBtn.setAttribute("aria-label", "Open Share & AEO Hub");
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
      <span>${isDealer ? "Post Studio" : "Share"}</span>
    `;

    shadow.appendChild(style);
    shadow.appendChild(triggerBtn);
    shadow.appendChild(modal);
    document.body.appendChild(host);

    // Event bindings
    var openModal = function () { modal.classList.add("open"); };
    var closeModal = function () { modal.classList.remove("open"); };

    triggerBtn.addEventListener("click", openModal);
    modal.querySelector(".tru-close-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    var toast = modal.querySelector("#tru-toast");
    var showToast = function (msg) {
      toast.textContent = msg;
      toast.style.display = "block";
      setTimeout(function () { toast.style.display = "none"; }, 3000);
    };

    // Facebook Post / Share Handler
    modal.querySelector("#tru-btn-fb").addEventListener("click", function () {
      if (isDealer) {
        // In dealer mode, copy caption first so it's ready in clipboard, then open composer
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareCaption);
          showToast("Caption copied! Opening Facebook...");
        }
        setTimeout(function () {
          window.open(fbPostUrl, "_blank", "noopener,noreferrer");
        }, 300);
      } else {
        window.open(fbPostUrl, "_blank", "noopener,noreferrer,width=600,height=500");
      }
    });

    // Copy Handler
    modal.querySelector("#tru-btn-copy").addEventListener("click", function () {
      var textToCopy = isDealer ? shareCaption : entity.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(function () {
          showToast(isDealer ? "Caption copied to clipboard!" : "Link copied to clipboard!");
        });
      } else {
        var ta = document.createElement("textarea");
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copied to clipboard!");
      }
    });

    // Expose programmatic API on root
    root.TruAEO = {
      open: openModal,
      close: closeModal,
      getEntity: function () { return entity; },
      isDealerMode: isDealer
    };
  }

  // Initialize once DOM is ready
  function init() {
    var entity = extractEntity();
    syncMeta(entity);
    injectSchema(entity);
    renderUI(entity);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
