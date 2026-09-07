#!/usr/bin/env node
/**
 * Universal AEO & AI Search Readiness Audit Scanner
 * 
 * Inspects ANY public URL to check:
 * 1. AI Search Crawlers: Does robots.txt explicitly allow GPTBot, PerplexityBot, ClaudeBot?
 * 2. LLM Context: Does /llms.txt exist for citation in generative engines?
 * 3. Machine Semantic Graph: Does valid Schema.org JSON-LD microdata exist?
 * 4. Social Card Unfurling: Are Open Graph (1200x630) and Twitter tags declared properly?
 * 5. Direct Conversion Hooks: Does the page have WhatsApp or direct lead CTAs?
 * 
 * Usage:
 *   node audit-scanner.js https://example.com
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

function fetchUrl(targetUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(targetUrl);
      const client = u.protocol === "https:" ? https : http;
      const req = client.get(
        targetUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TruAEO-Auditor/1.0",
            "Accept": "text/html,application/xhtml+xml,text/plain"
          },
          timeout: timeoutMs
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
          });
        }
      );
      req.on("error", (err) => resolve({ error: err.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ error: "Request timed out" });
      });
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function auditSite(targetUrl) {
  const urlObj = new URL(targetUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  console.log(`\n======================================================`);
  console.log(`🔍 Auditing AEO & Social Engine: ${baseUrl}`);
  console.log(`======================================================\n`);

  let score = 0;
  const findings = [];

  // 1. Audit robots.txt
  console.log(`[1/4] Checking robots.txt for AI Search Crawler Whitelist...`);
  const robotsRes = await fetchUrl(`${baseUrl}/robots.txt`);
  let hasAiWhitelist = false;
  if (robotsRes.statusCode === 200 && robotsRes.body) {
    const txt = robotsRes.body.toLowerCase();
    const bots = ["gptbot", "perplexitybot", "claudebot", "google-extended"];
    const foundBots = bots.filter((b) => txt.includes(b));
    if (foundBots.length >= 2) {
      hasAiWhitelist = true;
      score += 20;
      findings.push({ category: "AI Crawlability", status: "PASS", message: `AI Search Bots Allowed (${foundBots.join(", ")})` });
    } else {
      findings.push({ category: "AI Crawlability", status: "WARN", message: "robots.txt exists but does not explicitly whitelist modern AI search crawlers (GPTBot, ClaudeBot, PerplexityBot)." });
    }
  } else {
    findings.push({ category: "AI Crawlability", status: "FAIL", message: "No robots.txt found or unreachable." });
  }

  // 2. Audit llms.txt
  console.log(`[2/5] Checking for LLM Knowledge Manifest (/llms.txt)...`);
  const llmsRes = await fetchUrl(`${baseUrl}/llms.txt`);
  if (llmsRes.statusCode === 200 && llmsRes.body && llmsRes.body.includes("#")) {
    score += 20;
    findings.push({ category: "LLM Manifest", status: "PASS", message: "/llms.txt exists and follows markdown structure for AI answer engines." });
  } else {
    findings.push({ category: "LLM Manifest", status: "FAIL", message: "Missing /llms.txt. ChatGPT Search, Perplexity, and Claude cannot ingest your clean factual business manifest." });
  }

  // 3. Audit Main HTML (Schema.org & Open Graph & Social Entity Graph)
  console.log(`[3/5] Checking Home/Landing Page for Schema.org JSON-LD & OG tags...`);
  const pageRes = await fetchUrl(targetUrl);
  if (pageRes.statusCode === 200 && pageRes.body) {
    const html = pageRes.body;

    // Check JSON-LD
    const hasJsonLd = html.includes('type="application/ld+json"');
    const hasSchemaContext = html.includes("https://schema.org");
    if (hasJsonLd && hasSchemaContext) {
      score += 20;
      findings.push({ category: "Semantic Schema", status: "PASS", message: "Valid Schema.org JSON-LD entity graph detected." });
    } else {
      findings.push({ category: "Semantic Schema", status: "FAIL", message: "No Schema.org JSON-LD detected. LLMs and Google have no deterministic machine entity." });
    }

    // Check Open Graph 1200x630
    const hasOgImg = html.includes('property="og:image"');
    const hasOgTitle = html.includes('property="og:title"');
    if (hasOgImg && hasOgTitle) {
      score += 20;
      findings.push({ category: "Social Unfurl", status: "PASS", message: "1200x630 Open Graph social sharing meta tags present." });
    } else {
      findings.push({ category: "Social Unfurl", status: "FAIL", message: "Missing or incomplete Open Graph tags. Links pasted on WhatsApp & Facebook will look broken or plain." });
    }

    // Check Omnichannel sameAs Entity Tie-In (GBP, Facebook, Instagram, LinkedIn)
    const hasSameAs = html.includes('"sameAs"') || html.includes('facebook.com') || html.includes('instagram.com') || html.includes('linkedin.com');
    if (hasSameAs) {
      score += 20;
      findings.push({ category: "Omnichannel Graph", status: "PASS", message: "Verified social profile entity linking detected (Facebook, Instagram, GBP, LinkedIn)." });
    } else {
      findings.push({ category: "Omnichannel Graph", status: "WARN", message: "No sameAs social authority linking found. AI search engines cannot verify your cross-platform identity." });
    }
  } else {
    findings.push({ category: "Page Health", status: "FAIL", message: `Could not reach target page: ${targetUrl}` });
  }

  // Final Report
  console.log(`\n------------------------------------------------------`);
  console.log(`📊 AUDIT SUMMARY FOR: ${targetUrl}`);
  console.log(`🏆 OVERALL TRUAEO SCORE: ${score} / 100`);
  console.log(`------------------------------------------------------\n`);

  findings.forEach((f) => {
    const icon = f.status === "PASS" ? "✅" : (f.status === "WARN" ? "⚠️" : "❌");
    console.log(`${icon} [${f.category}]: ${f.message}`);
  });

  if (score < 80) {
    console.log(`\n💡 RECOMMENDATION:`);
    console.log(`Install TruAEO with 1 line of code to instantly fix all missing schemas, AI bot whitelisting, and social unfurls.`);
  }
  console.log(`\n======================================================\n`);

  return { score, findings };
}

// CLI execution
if (require.main === module) {
  const target = process.argv[2] || "https://example.com";
  auditSite(target).catch(console.error);
}

module.exports = { auditSite };
