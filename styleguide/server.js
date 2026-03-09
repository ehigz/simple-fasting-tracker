#!/usr/bin/env node
/**
 * InterFast Design System Dev Server
 *
 * Features:
 *   · Serves styleguide/index.html at http://localhost:4321
 *   · /api/stats  — computed design system health from manifest + tokens
 *   · /api/events — SSE stream for live dashboard updates
 *   · File watcher on src/ui/ — broadcasts updates when tokens/manifest change
 *   · Detects when theme.ts is newer than last Figma sync (code ahead of Figma)
 *
 * No external npm dependencies — uses only Node.js built-ins.
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const PORT          = 4321;
const STYLEGUIDE    = __dirname;
const SRC_UI        = path.join(__dirname, '../src/ui');
const MANIFEST_PATH = path.join(SRC_UI, 'design-system-manifest.json');
const TOKENS_PATH   = path.join(SRC_UI, 'design-tokens.json');
const THEME_PATH    = path.join(SRC_UI, 'theme.ts');
const AUDIT_CACHE   = path.join(__dirname, '.audit-cache.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// ── SSE clients ────────────────────────────────────────────────────────────────
const sseClients = new Set();

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch (_) { sseClients.delete(res); }
  }
}

// ── Stats computation ──────────────────────────────────────────────────────────
function safeRead(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

function countDeep(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  if (obj.$type) return 1;
  return Object.values(obj).reduce((s, v) => s + countDeep(v), 0);
}

function computeStats() {
  const manifest = safeRead(MANIFEST_PATH);
  const tokens   = safeRead(TOKENS_PATH);
  const audit    = safeRead(AUDIT_CACHE);

  if (!manifest || !tokens) {
    return { error: 'Could not read manifest or tokens — check src/ui/ path.' };
  }

  const IF = tokens.InterFast || {};
  const now = new Date();

  // ── Token inventory ──────────────────────────────────────────────────────────
  const primitiveColorCount = countDeep(IF.Primitives || {});
  const semanticColorCount  = Object.keys(IF.colors || {}).length;
  const fontWeightCount     = Object.keys(IF.fontWeight   || {}).length;
  const fontSizeCount       = Object.keys(IF.fontSize     || {}).length;
  const lsCount             = Object.keys(IF.letterSpacing|| {}).length;
  const lhCount             = Object.keys(IF.lineHeight   || {}).length;
  const ffCount             = Object.keys(IF.fontFamily   || {}).length;
  const typoScaleCount      = Object.keys(IF.typography   || {}).length;
  const radiusCount         = Object.keys(IF.radius       || {}).length;
  const motionCount         = Object.keys((IF.motion || {}).duration || {}).length;
  const layoutCount         = 3; // screen.paddingH, header.offset, tabBar.offset
  const componentTokenCount = countDeep(IF.components || {});

  const totalTokens =
    primitiveColorCount + semanticColorCount +
    fontWeightCount + fontSizeCount + lsCount + lhCount + ffCount + typoScaleCount +
    radiusCount + motionCount + layoutCount + componentTokenCount;

  // ── Figma coverage ───────────────────────────────────────────────────────────
  const missingFigmaIds = [];
  const manifestTokens  = manifest.tokens || {};

  // Color tokens
  Object.entries(manifestTokens.colors || {}).forEach(([name, t]) => {
    if (!t.figmaVariableId) missingFigmaIds.push({ token: `colors.${name}`, type: 'variable' });
  });
  // Radius tokens
  Object.entries(manifestTokens.radius || {}).forEach(([name, t]) => {
    if (!t.figmaVariableId) missingFigmaIds.push({ token: `radius.${name}`, type: 'variable' });
  });
  // Typography scales
  Object.entries((manifestTokens.typography || {}).scales || {}).forEach(([name, t]) => {
    if (!t.figmaStyleId) missingFigmaIds.push({ token: `typography.${name}`, type: 'style' });
  });
  // Motion durations
  Object.entries((manifestTokens.motion || {}).duration || {}).forEach(([name, t]) => {
    if (!t.figmaVariableId) missingFigmaIds.push({ token: `motion.duration.${name}`, type: 'variable' });
  });

  const totalWirings  = (Object.keys(manifestTokens.colors || {}).length) +
                        (Object.keys(manifestTokens.radius  || {}).length) +
                        (Object.keys((manifestTokens.typography || {}).scales || {}).length) +
                        (Object.keys((manifestTokens.motion || {}).duration  || {}).length);
  const wiredCount    = totalWirings - missingFigmaIds.length;
  const coveragePct   = totalWirings > 0 ? Math.round(wiredCount / totalWirings * 100) : 100;

  // ── Time since sync ──────────────────────────────────────────────────────────
  const lastSync        = new Date(manifest.lastSyncedAt);
  const hoursSinceSync  = (now - lastSync) / (1000 * 60 * 60);

  // ── Code vs Figma drift ──────────────────────────────────────────────────────
  let themeMtime  = null;
  let codeAhead   = false;
  try {
    const stat = fs.statSync(THEME_PATH);
    themeMtime  = stat.mtime.toISOString();
    codeAhead   = stat.mtime > lastSync;
  } catch (_) {}

  // ── Drift notices (ordered by severity) ─────────────────────────────────────
  const driftNotices = [];

  if (codeAhead) {
    driftNotices.push({
      level: 'warn',
      icon:  '⚠️',
      title: 'theme.ts changed after last sync',
      msg:   `theme.ts was modified ${timeAgo(new Date(themeMtime))}. Figma is behind — run push.`,
      action: '/design-system-architect push',
    });
  }
  if (hoursSinceSync > 72) {
    driftNotices.push({
      level: 'error',
      icon:  '🔴',
      title: 'Sync is overdue',
      msg:   `Last sync was ${Math.round(hoursSinceSync / 24)} days ago. Figma may have drifted.`,
      action: '/design-system-architect drift',
    });
  } else if (hoursSinceSync > 24) {
    driftNotices.push({
      level: 'warn',
      icon:  '🟡',
      title: 'Sync aging',
      msg:   `Last sync was ${Math.round(hoursSinceSync)}h ago. Consider a drift check.`,
      action: '/design-system-architect drift',
    });
  }
  if (missingFigmaIds.length > 0) {
    driftNotices.push({
      level: 'warn',
      icon:  '🔗',
      title: `${missingFigmaIds.length} tokens missing Figma wiring`,
      msg:   `These tokens exist in code but have no Figma variable/style ID.`,
      action: '/design-system-architect push',
    });
  }

  // ── Action items (human review required) ─────────────────────────────────────
  const actionItems = [];

  // Audit results from cache (populated by audit_codebase.py)
  if (audit) {
    if (audit.hardcodedHex > 0) {
      actionItems.push({
        type:     'hardcoded-hex',
        severity: 'error',
        icon:     '🚨',
        title:    `${audit.hardcodedHex} hardcoded hex values in source`,
        desc:     'Replace with colors.* from theme.ts. Run: npm run audit:tokens',
        files:    audit.hexFiles || [],
      });
    }
    if (audit.bareComponents > 0) {
      actionItems.push({
        type:     'bare-components',
        severity: 'warn',
        icon:     '⚠️',
        title:    `${audit.bareComponents} bare View/Text/Pressable usage`,
        desc:     'Replace with design system components (Card, Button, Typography primitives).',
        files:    audit.bareFiles || [],
      });
    }
  }

  // Components never parity-checked
  const components    = manifest.components || {};
  const unchecked     = Object.entries(components).filter(([, c]) => c.parityScore === null).map(([n]) => n);
  const lowParity     = Object.entries(components).filter(([, c]) => c.parityScore !== null && c.parityScore < 80).map(([n, c]) => ({ name: n, score: c.parityScore }));

  if (lowParity.length > 0) {
    actionItems.push({
      type:       'low-parity',
      severity:   'error',
      icon:       '📐',
      title:      `${lowParity.length} component${lowParity.length > 1 ? 's' : ''} below 80% Figma parity`,
      desc:       'Visual drift detected. Review and reconcile with Figma.',
      components: lowParity,
    });
  }
  if (unchecked.length > 0) {
    actionItems.push({
      type:       'parity-unchecked',
      severity:   'info',
      icon:       '🔍',
      title:      `${unchecked.length} components never parity-checked`,
      desc:       `Run: /design-system-architect parity <name>`,
      components: unchecked,
    });
  }
  if (!manifest.figma.lastFigmaVersion) {
    actionItems.push({
      type:     'no-figma-version',
      severity: 'info',
      icon:     '📝',
      title:    'Figma version not tracked',
      desc:     'Run a pull or drift check to record the current Figma file version.',
      action:   '/design-system-architect drift',
    });
  }

  // Webhook setup suggestion (always shown until resolved)
  actionItems.push({
    type:     'figma-webhook',
    severity: 'info',
    icon:     '🔔',
    title:    'Figma→Code automation not yet set up',
    desc:     'A Figma webhook requires a backend endpoint. Currently, use scheduled drift checks or manual pull.',
    action:   'See docs/decisions/ for ADR on automation strategy',
    isResearch: true,
  });

  // ── Component map ─────────────────────────────────────────────────────────────
  const componentMap = Object.entries(components).map(([name, c]) => ({
    name,
    parityScore:  c.parityScore,
    variants:     (c.variants || []).length,
    states:       (c.states   || []).length,
    figmaLinked:  !!c.figmaNodeId,
    metadataFile: !!c.metadataFile,
    sourceFile:   c.sourceFile,
  }));

  // ── Implementation score (composite) ─────────────────────────────────────────
  const implementationScore = Math.round(
    (coveragePct * 0.4) +                                              // 40% Figma coverage
    (componentMap.filter(c => c.figmaLinked).length / componentMap.length * 100 * 0.3) + // 30% components linked
    (componentMap.filter(c => c.metadataFile).length / componentMap.length * 100 * 0.3)  // 30% metadata files present
  );

  return {
    generatedAt:       now.toISOString(),
    version:           manifest.version,
    lastSyncedAt:      manifest.lastSyncedAt,
    syncDirection:     manifest.syncDirection,
    hoursSinceSync:    Math.round(hoursSinceSync),
    figmaFileKey:      manifest.figma.fileKey,
    figmaFileUrl:      manifest.figma.fileUrl,
    codeAhead,
    themeMtime,
    tokenInventory: {
      total:                totalTokens,
      primitiveColors:      primitiveColorCount,
      semanticColors:       semanticColorCount,
      componentTokens:      componentTokenCount,
      typographyPrimitives: fontWeightCount + fontSizeCount + lsCount + lhCount + ffCount,
      typographyScales:     typoScaleCount,
      radius:               radiusCount,
      motion:               motionCount,
      layout:               layoutCount,
    },
    figmaCoverage: {
      total:   totalWirings,
      wired:   wiredCount,
      pct:     coveragePct,
      missing: missingFigmaIds,
    },
    implementationScore,
    componentMap,
    driftNotices,
    actionItems,
    auditCached: !!audit,
  };
}

function timeAgo(date) {
  const s = Math.round((Date.now() - date) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.round(s/60)}m ago`;
  if (s < 86400) return `${Math.round(s/3600)}h ago`;
  return `${Math.round(s/86400)}d ago`;
}

// ── File watcher ───────────────────────────────────────────────────────────────
let statsCache     = null;
let debounceTimer  = null;

function refreshStats() {
  statsCache = computeStats();
  broadcast('stats', statsCache);
  console.log(`[${new Date().toLocaleTimeString()}] Stats refreshed`);
}

function watchFiles() {
  const watchPaths = [MANIFEST_PATH, TOKENS_PATH, THEME_PATH];
  watchPaths.forEach(p => {
    try {
      fs.watch(p, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(refreshStats, 300);
      });
    } catch (_) {}
  });
  // Also watch all *.metadata.ts files
  try {
    fs.watch(SRC_UI, (_, filename) => {
      if (filename && (filename.endsWith('.ts') || filename.endsWith('.json'))) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(refreshStats, 300);
      }
    });
  } catch (_) {}
}

// ── HTTP server ────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── /api/stats ──────────────────────────────────────────────────────────────
  if (pathname === '/api/stats') {
    const data = statsCache || computeStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data, null, 2));
  }

  // ── /api/events (SSE) ───────────────────────────────────────────────────────
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    sseClients.add(res);
    // Send current state immediately
    res.write(`event: stats\ndata: ${JSON.stringify(statsCache || computeStats())}\n\n`);
    // Keep alive ping every 25s
    const ping = setInterval(() => {
      try { res.write(`: ping\n\n`); } catch (_) { clearInterval(ping); sseClients.delete(res); }
    }, 25000);
    req.on('close', () => { sseClients.delete(res); clearInterval(ping); });
    return;
  }

  // ── /api/reload ─────────────────────────────────────────────────────────────
  if (pathname === '/api/reload') {
    refreshStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  // ── Static files ─────────────────────────────────────────────────────────────
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(STYLEGUIDE, filePath);
  const ext      = path.extname(fullPath);

  // Security: only serve files inside styleguide dir
  if (!fullPath.startsWith(STYLEGUIDE)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`Not found: ${filePath}`);
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// ── Boot ───────────────────────────────────────────────────────────────────────
statsCache = computeStats();
watchFiles();

server.listen(PORT, () => {
  console.log(`\n  InterFast Design System Styleguide`);
  console.log(`  ──────────────────────────────────`);
  console.log(`  🎨  http://localhost:${PORT}`);
  console.log(`  📊  http://localhost:${PORT}/api/stats`);
  console.log(`  📡  http://localhost:${PORT}/api/events  (SSE)`);
  console.log(`\n  Watching: src/ui/*.ts · src/ui/*.json`);
  console.log(`  Live reload active — edits appear in seconds.\n`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`  Port ${PORT} in use — kill existing process or change PORT in server.js`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
