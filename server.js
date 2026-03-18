#!/usr/bin/env node

/**
 * Leonardo — Local Design Server
 *
 * Serves the workbench + API routes with full filesystem access.
 * This is the real Leonardo — not the Vercel preview.
 *
 * Usage: node server.js [--port 4402]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const url = require('url');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const TOKENS_DIR = path.join(ROOT, 'tokens');
const COMPONENTS_DIR = path.join(ROOT, 'components');
const PORT = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--port') || '4402');

// ── Helpers ─────────────────────────────────────────────

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function run(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 30000 }).trim();
}

function loadJSON(fp) {
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function loadApps() {
  return loadJSON(path.join(ROOT, 'apps.json'));
}

// Build Google Fonts URL from font tokens
function buildGoogleFontsUrl(fonts) {
  const families = [];
  const seen = new Set();

  for (const [key, value] of Object.entries(fonts)) {
    if (key === 'import') continue;
    // Extract primary font name from stack like "\"Inter\", -apple-system, sans-serif"
    const primary = value.split(',')[0].replace(/"/g, '').trim();
    if (!primary || seen.has(primary)) continue;
    seen.add(primary);

    // Determine weights based on role
    let weights;
    if (key.includes('mono')) {
      weights = '400;500';
    } else if (key.includes('serif') || key.includes('display')) {
      weights = 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400';
    } else {
      weights = 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400';
    }

    const encoded = primary.replace(/\s+/g, '+');
    families.push(`family=${encoded}:${weights}`);
  }

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

// Resolve a font name to its Google Fonts URL for dynamic loading
function googleFontUrl(fontName) {
  const encoded = fontName.trim().replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap`;
}

// ── API Routes ──────────────────────────────────────────

const routes = {

  // ── Tokens: read all or write one ──
  'GET /api/tokens': (req, res) => {
    const files = ['color.json', 'typography.json', 'motion.json', 'spacing.json'];
    const tokens = {};
    for (const f of files) {
      tokens[f.replace('.json', '')] = loadJSON(path.join(TOKENS_DIR, f));
    }
    json(res, tokens);
  },

  'POST /api/tokens': async (req, res) => {
    const { file, data } = await readBody(req);
    const valid = ['color.json', 'typography.json', 'motion.json', 'spacing.json'];
    if (!file || !data || !valid.includes(file)) return json(res, { error: 'Invalid' }, 400);
    fs.writeFileSync(path.join(TOKENS_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
    json(res, { ok: true, file });
  },

  // ── Build + Push ──
  'POST /api/push': (req, res) => {
    try {
      const output = run('node build.js --push');
      json(res, { ok: true, output });
    } catch (e) {
      json(res, { ok: false, error: e.message, output: e.stdout || '' }, 500);
    }
  },

  'POST /api/build': (req, res) => {
    try {
      const output = run('node build.js');
      json(res, { ok: true, output });
    } catch (e) {
      json(res, { ok: false, error: e.message }, 500);
    }
  },

  // ── Git: multi-repo operations ──
  'GET /api/git': (req, res) => {
    try {
      const status = run('git status --porcelain');
      const branch = run('git rev-parse --abbrev-ref HEAD');
      const log = run('git log --oneline -5');
      json(res, { repo: 'leonardo', branch, status: status || 'clean', log });
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
  },

  'POST /api/git': async (req, res) => {
    const { action } = await readBody(req);
    if (action === 'pull-all') {
      // Pull leonardo + all connected apps
      const results = {};
      try {
        results.leonardo = run('git pull');
      } catch (e) {
        results.leonardo = 'error: ' + e.message;
      }
      const apps = loadApps();
      for (const [name, cfg] of Object.entries(apps)) {
        const appRoot = path.resolve(ROOT, cfg.path);
        try {
          if (fs.existsSync(path.join(appRoot, '.git'))) {
            results[name] = run('git pull', appRoot);
          } else {
            // Check parent dirs for .git (monorepo)
            let dir = appRoot;
            let found = false;
            while (dir !== path.dirname(dir)) {
              if (fs.existsSync(path.join(dir, '.git'))) {
                results[name] = run('git pull', dir);
                found = true;
                break;
              }
              dir = path.dirname(dir);
            }
            if (!found) results[name] = 'no git repo found';
          }
        } catch (e) {
          results[name] = 'error: ' + e.message;
        }
      }
      return json(res, { ok: true, results });
    }
    if (action === 'pull') {
      try { json(res, { ok: true, output: run('git pull') }); }
      catch (e) { json(res, { ok: false, error: e.message }, 500); }
      return;
    }
    if (action === 'status-all') {
      const results = {};
      const apps = loadApps();
      for (const [name, cfg] of Object.entries(apps)) {
        const appRoot = path.resolve(ROOT, cfg.path);
        try {
          let dir = appRoot;
          while (dir !== path.dirname(dir)) {
            if (fs.existsSync(path.join(dir, '.git'))) {
              const branch = run('git rev-parse --abbrev-ref HEAD', dir);
              const status = run('git status --porcelain', dir);
              results[name] = { branch, status: status || 'clean', path: dir };
              break;
            }
            dir = path.dirname(dir);
          }
        } catch (e) {
          results[name] = { error: e.message };
        }
      }
      return json(res, results);
    }
    json(res, { error: 'Unknown action. Use pull, pull-all, or status-all' }, 400);
  },

  // ── Apps manifest ──
  'GET /api/apps': (req, res) => {
    json(res, loadApps());
  },

  // ── Components: list, create, read ──
  'GET /api/components': (req, res) => {
    if (!fs.existsSync(COMPONENTS_DIR)) fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
    const files = fs.readdirSync(COMPONENTS_DIR).filter(f => f.endsWith('.json'));
    const components = files.map(f => loadJSON(path.join(COMPONENTS_DIR, f)));
    json(res, components);
  },

  'POST /api/components': async (req, res) => {
    const component = await readBody(req);
    if (!component.name || !component.html) return json(res, { error: 'Need name and html' }, 400);
    if (!fs.existsSync(COMPONENTS_DIR)) fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
    const slug = component.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filePath = path.join(COMPONENTS_DIR, `${slug}.json`);
    const data = {
      name: component.name,
      slug,
      html: component.html,
      css: component.css || '',
      variants: component.variants || [],
      tokens: component.tokens || [],
      created: new Date().toISOString(),
      ...(fs.existsSync(filePath) ? { updated: new Date().toISOString() } : {})
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    json(res, { ok: true, component: data });
  },

  // ── Fonts: change font for a role, rebuild import URL ──
  'POST /api/fonts': async (req, res) => {
    const { role, font } = await readBody(req);
    const validRoles = ['serif', 'display', 'body', 'sans', 'mono'];
    if (!role || !font || !validRoles.includes(role)) {
      return json(res, { error: 'Need role (serif|display|body|sans|mono) and font name' }, 400);
    }
    const typography = loadJSON(path.join(TOKENS_DIR, 'typography.json'));
    const key = `--font-${role}`;
    if (!typography.fonts[key]) return json(res, { error: `Unknown font role: ${role}` }, 400);

    const oldFont = typography.fonts[key].split(',')[0].replace(/"/g, '').trim();
    const trimmed = font.trim();
    typography.fonts[key] = typography.fonts[key].replace(oldFont, trimmed);

    // If serif changes, also update display (they're usually paired)
    if (role === 'serif' && typography.fonts['--font-display']) {
      const oldDisplay = typography.fonts['--font-display'].split(',')[0].replace(/"/g, '').trim();
      typography.fonts['--font-display'] = typography.fonts['--font-display'].replace(oldDisplay, trimmed);
    }
    if (role === 'body' && typography.fonts['--font-sans']) {
      const oldSans = typography.fonts['--font-sans'].split(',')[0].replace(/"/g, '').trim();
      typography.fonts['--font-sans'] = typography.fonts['--font-sans'].replace(oldSans, trimmed);
    }

    // Rebuild import URL
    typography.fonts.import = buildGoogleFontsUrl(typography.fonts);
    fs.writeFileSync(path.join(TOKENS_DIR, 'typography.json'), JSON.stringify(typography, null, 2), 'utf-8');
    json(res, { ok: true, role, font: trimmed, fontImport: typography.fonts.import, fonts: typography.fonts });
  },

  // ── Agent: execute design commands ──
  'POST /api/agent': async (req, res) => {
    const { command } = await readBody(req);
    if (!command) return json(res, { error: 'No command' }, 400);

    const result = executeAgentCommand(command);
    json(res, result);
  },
};

// ── Agent Command Parser ────────────────────────────────

function executeAgentCommand(command) {
  const cmd = command.toLowerCase().trim();
  const color = loadJSON(path.join(TOKENS_DIR, 'color.json'));
  const typography = loadJSON(path.join(TOKENS_DIR, 'typography.json'));

  // Color changes: "set accent to #3B82F6", "change bg to #111", "accent #FF0000"
  const colorMatch = cmd.match(/(?:set|change|make)?\s*(?:--color-)?([\w-]+)\s+(?:to\s+|=\s*|)?(#[0-9a-fA-F]{3,8})/);
  if (colorMatch) {
    const [, tokenName, value] = colorMatch;
    const key = `--color-${tokenName}`;
    let changed = false;
    for (const group of ['brand', 'semantic']) {
      if (color[group][key] !== undefined) {
        color[group][key] = value;
        changed = true;
      }
    }
    if (!changed) {
      // Try partial match
      for (const group of ['brand', 'semantic']) {
        for (const k of Object.keys(color[group])) {
          if (k.includes(tokenName)) {
            color[group][k] = value;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      fs.writeFileSync(path.join(TOKENS_DIR, 'color.json'), JSON.stringify(color, null, 2), 'utf-8');
      return { ok: true, action: 'color-change', token: tokenName, value, message: `Set ${tokenName} to ${value}` };
    }
  }

  // Font changes: "set body font to Inter", "serif font Playfair Display"
  // Use original command (not lowercased) to preserve font name casing
  const fontMatch = command.trim().match(/(?:set|change)?\s*(serif|body|mono|display|sans)\s*(?:font\s*)?(?:to\s+|=\s*)?["']?([^"']+)["']?/i);
  if (fontMatch) {
    const [, role, fontName] = fontMatch;
    const fontMap = { serif: '--font-serif', display: '--font-display', body: '--font-body', sans: '--font-sans', mono: '--font-mono' };
    const key = fontMap[role];
    if (key && typography.fonts[key]) {
      const oldFont = typography.fonts[key].split(',')[0].replace(/"/g, '').trim();
      const trimmed = fontName.trim();
      typography.fonts[key] = typography.fonts[key].replace(oldFont, trimmed);
      // Rebuild Google Fonts import URL from all current font families
      typography.fonts.import = buildGoogleFontsUrl(typography.fonts);
      fs.writeFileSync(path.join(TOKENS_DIR, 'typography.json'), JSON.stringify(typography, null, 2), 'utf-8');
      return { ok: true, action: 'font-change', role, font: trimmed, fontImport: typography.fonts.import, message: `Set ${role} font to ${trimmed}` };
    }
  }

  // Push: "push", "push all", "deploy"
  if (/^(push|deploy|push all)/.test(cmd)) {
    try {
      const output = run('node build.js --push');
      return { ok: true, action: 'push', message: 'Pushed to all apps', output };
    } catch (e) {
      return { ok: false, action: 'push', error: e.message };
    }
  }

  // Build: "build", "rebuild"
  if (/^(build|rebuild)/.test(cmd)) {
    try {
      const output = run('node build.js');
      return { ok: true, action: 'build', message: 'Built dist/', output };
    } catch (e) {
      return { ok: false, action: 'build', error: e.message };
    }
  }

  // Pull: "pull", "pull all", "git pull"
  if (/^(pull|git pull|pull all|fetch)/.test(cmd)) {
    const results = {};
    try { results.leonardo = run('git pull'); } catch (e) { results.leonardo = e.message; }
    const apps = loadApps();
    for (const [name, cfg] of Object.entries(apps)) {
      const appRoot = path.resolve(ROOT, cfg.path);
      try {
        let dir = appRoot;
        while (dir !== path.dirname(dir)) {
          if (fs.existsSync(path.join(dir, '.git'))) {
            results[name] = run('git pull', dir);
            break;
          }
          dir = path.dirname(dir);
        }
      } catch (e) { results[name] = e.message; }
    }
    return { ok: true, action: 'pull-all', message: 'Pulled all repos', results };
  }

  // Status: "status", "git status"
  if (/^(status|git status)/.test(cmd)) {
    try {
      const branch = run('git rev-parse --abbrev-ref HEAD');
      const status = run('git status --porcelain');
      return { ok: true, action: 'status', branch, status: status || 'clean' };
    } catch (e) {
      return { ok: false, action: 'status', error: e.message };
    }
  }

  return { ok: false, message: `Unknown command. Try: "set accent to #3B82F6", "push", "pull all", "build", "status"` };
}

// ── Static file server ──────────────────────────────────

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function serveStatic(req, res) {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// ── Server ──────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const parsed = url.parse(req.url, true);
  const routeKey = `${req.method} ${parsed.pathname}`;

  if (routes[routeKey]) {
    try {
      await routes[routeKey](req, res);
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return;
  }

  // Static files
  if (!parsed.pathname.startsWith('/api/')) {
    serveStatic(req, res);
    return;
  }

  json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => {
  console.log(`\n  Leonardo Design Server`);
  console.log(`  ─────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  API:     http://localhost:${PORT}/api/tokens`);
  console.log(`  Agent:   http://localhost:${PORT}/api/agent`);
  console.log(`\n  Commands via agent bar:`);
  console.log(`    "set accent to #3B82F6"`);
  console.log(`    "push all"`);
  console.log(`    "pull all"`);
  console.log(`    "build"`);
  console.log(`    "status"\n`);
});
