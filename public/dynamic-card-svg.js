// packages/standalone/tru-aeo/dynamic-card-svg.js
//
// Dynamic 1200x630 Billboard Social Image Generator
// Generates SVG-based high-contrast Open Graph cards without heavy headless Chrome dependencies.
//
// Features:
// - Universal 1200x630 canvas
// - High-contrast visual hierarchy (optimized for Facebook newsfeed & WhatsApp link previews)
// - Dynamic price tag / rate tag badge
// - Industry trust badges ("Bar Certified", "Emergency 24/7", "Verified Stock", "Licensed & Insured")
// - Prominent business branding and WhatsApp CTA banner

function escXml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateBillboardCard(data) {
  const width = 1200;
  const height = 630;

  const business = escXml(data.business || "Verified Business");
  const title = escXml(data.title || "Exclusive Offering");
  const price = escXml(data.price || "");
  const badge = escXml(data.badge || "Verified Offering");
  const accent = escXml(data.accent || "#2563eb");
  const imageUrl = data.imageUrl || "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#0f172a" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.4" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Embedded Photo (if present) -->
  ${imageUrl ? `<image href="${escXml(imageUrl)}" x="350" y="0" width="850" height="630" preserveAspectRatio="xMidYMid slice" />` : ""}

  <!-- Gradient Overlay for Readable Typography -->
  <rect width="${width}" height="${height}" fill="url(#overlayGrad)" />

  <!-- Left Accent Trust Bar -->
  <rect x="0" y="0" width="12" height="${height}" fill="${accent}" />

  <!-- Business Entity Header -->
  <g transform="translate(60, 60)">
    <!-- Top Pill Badge -->
    <rect x="0" y="0" width="220" height="34" rx="17" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="1.5" />
    <text x="110" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#60a5fa" text-anchor="middle" letter-spacing="1">
      ${badge.toUpperCase()}
    </text>

    <!-- Business Brand Name -->
    <text x="0" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#f8fafc">
      ${business}
    </text>
  </g>

  <!-- Main Product / Service Title -->
  <g transform="translate(60, 230)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#ffffff" filter="url(#shadow)">
      ${title.length > 34 ? title.substring(0, 32) + "..." : title}
    </text>

    <!-- Prominent Price / Rate Callout -->
    ${price ? `
      <g transform="translate(0, 50)">
        <rect x="0" y="0" width="300" height="68" rx="12" fill="${accent}" filter="url(#shadow)"/>
        <text x="24" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#ffffff">
          ${price}
        </text>
      </g>
    ` : ""}
  </g>

  <!-- Bottom Direct Lead Action Bar -->
  <g transform="translate(60, 510)">
    <rect x="0" y="0" width="440" height="54" rx="27" fill="#22c55e" filter="url(#shadow)" />
    <!-- WhatsApp Icon SVG -->
    <path d="M26 17c-5.5 0-10 4.5-10 10 0 1.8.5 3.5 1.4 5l-1.4 5.2 5.3-1.4c1.4.8 3.1 1.2 4.7 1.2 5.5 0 10-4.5 10-10s-4.5-10-10-10zm0 18c-1.4 0-2.8-.4-4-1.1l-.3-.2-3.1.8.8-3-.2-.3c-.8-1.2-1.2-2.7-1.2-4.2 0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" fill="#ffffff"/>
    <text x="56" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#ffffff">
      Direct WhatsApp Inquiries Available
    </text>
  </g>

  <!-- Verified Machine Readability Watermark -->
  <text x="1140" y="600" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="end">
    Verified Machine Schema • AEO Indexed
  </text>
</svg>`;
}

module.exports = { generateBillboardCard };
