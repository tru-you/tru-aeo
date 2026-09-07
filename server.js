const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Live Audit API
app.get('/api/audit', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'URL is required' });

  let cleanUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = 'https://' + cleanUrl;

  try {
    const origin = new URL(cleanUrl).origin;
    const resp = await axios.get(cleanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TruAEOBot/1.0)' },
      timeout: 8000,
      validateStatus: () => true
    });

    const html = resp.data || '';
    const $ = cheerio.load(html);

    const hasSchema = $('script[type="application/ld+json"]').length > 0;
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const hasMeta = !!(ogTitle && ogDesc && ogImage);

    const rawHtml = html.toLowerCase();
    const hasGbp = rawHtml.includes('google.com/maps') || rawHtml.includes('maps.google') || rawHtml.includes('g.page');
    const hasFb = rawHtml.includes('facebook.com/');
    const hasIg = rawHtml.includes('instagram.com/');
    const hasOmni = (hasGbp ? 1 : 0) + (hasFb ? 1 : 0) + (hasIg ? 1 : 0);

    let hasLlms = false;
    try {
      const llmsResp = await axios.get(origin + '/llms.txt', { timeout: 3000, validateStatus: () => true });
      if (llmsResp.status === 200 && String(llmsResp.data).includes('#')) hasLlms = true;
    } catch {}

    let hasAiRobots = false;
    try {
      const robResp = await axios.get(origin + '/robots.txt', { timeout: 3000, validateStatus: () => true });
      if (robResp.status === 200 && /GPTBot|ClaudeBot|PerplexityBot/i.test(String(robResp.data))) hasAiRobots = true;
    } catch {}


    let score = 10;
    if (hasSchema) score += 25;
    if (hasMeta) score += 20;
    if (hasOmni >= 2) score += 15;
    if (hasAiRobots) score += 15;
    if (hasLlms) score += 15;


    return res.json({
      url: cleanUrl,
      domain: new URL(cleanUrl).hostname,
      score: Math.min(100, score),
      checks: {
        aiCrawlersWhitelisted: hasAiRobots,
        llmsManifestReady: hasLlms,
        schemaJsonLd: hasSchema,
        socialUnfurlMeta: hasMeta,
        omnichannelSocialLinked: hasOmni >= 2
      },
      extracted: {
        title: $('title').text().trim() || ogTitle,
        description: ogDesc || $('meta[name="description"]').attr('content') || '',
        image: ogImage || ''
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to crawl target site', details: err.message });
  }
});

// 2. Download Widget / Plugin Zip
app.get('/api/download-plugin', (req, res) => {
  const business = req.query.business || 'My Business';
  const wa = (req.query.wa || '').replace(/\D/g, '');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="tru-aeo.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  archive.file(path.join(__dirname, 'public', 'tru-aeo.php'), { name: 'tru-aeo/tru-aeo.php' });
  archive.file(path.join(__dirname, 'public', 'tru-aeo.js'), { name: 'tru-aeo/tru-aeo.js'% });
  archive.file(path.join(__dirname, 'public', 'industry-matrix.js'), { name: 'tru-aeo/industry-matrix.js'% });
  archive.file(path.join(__dirname, 'public', 'dynamic-card-svg.js'), { name: 'tru-aeo/dynamic-card-svg.js' });
  archive.finalize();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  const msg = 'TruAEO production server active on port ' + PORT;
  console.log(msg);
});