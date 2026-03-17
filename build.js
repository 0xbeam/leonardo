#!/usr/bin/env node

/**
 * Gravity Design System — Build & Push
 *
 * Usage:
 *   node build.js           Build dist/ CSS from tokens
 *   node build.js --push    Build + inject into all apps
 *   node build.js --diff    Build + show what would change (dry run)
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TOKENS_DIR = path.join(ROOT, 'tokens');
const EXT_DIR = path.join(ROOT, 'extensions');
const DIST_DIR = path.join(ROOT, 'dist');

const MARKER_START = '/* GRAVITY-START */';
const MARKER_END = '/* GRAVITY-END */';

// ── Load tokens ──────────────────────────────────────────────────────────────

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function flattenTokens(obj, result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && key.startsWith('--')) {
      result[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      flattenTokens(value, result);
    }
  }
  return result;
}

// ── CSS Generation ───────────────────────────────────────────────────────────

function generateThemeBlock(themeDirective, tokens) {
  const lines = [`${themeDirective} {`];
  let lastGroup = '';

  for (const [key, value] of Object.entries(tokens)) {
    // Add blank line between groups (color-bg vs color-indigo, text vs font, etc.)
    const group = key.replace(/^--/, '').replace(/-\d+$/, '').replace(/-[a-z]+$/, '');
    if (lastGroup && group !== lastGroup) {
      lines.push('');
    }
    lastGroup = group;

    lines.push(`  ${key}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function generateKeyframes(motion, extensions = []) {
  const lines = [];
  const allKeyframes = { ...motion.keyframes };
  const allAnimations = { ...motion.animations };

  // Merge extensions
  for (const ext of extensions) {
    if (ext.keyframes) Object.assign(allKeyframes, ext.keyframes);
    if (ext.animations) Object.assign(allAnimations, ext.animations);
  }

  for (const [name, frames] of Object.entries(allKeyframes)) {
    lines.push(`@keyframes ${name} {`);
    for (const [selector, props] of Object.entries(frames)) {
      lines.push(`  ${selector} { ${props}; }`);
    }
    lines.push('}');
    // Add animation class
    if (allAnimations[name]) {
      const className = name === 'pulse-dot' ? 'pulse-dot'
        : name === 'slide-in' ? 'animate-in'
        : name === 'view-fade' ? 'view-enter'
        : name === 'shimmer' ? 'skeleton-shimmer'
        : name === 'blink' ? 'animate-blink'
        : name === 'pulse-subtle' ? 'animate-pulse-subtle'
        : `animate-${name}`;

      if (name === 'shimmer') {
        lines.push(`.${className} {`);
        lines.push(`  background: linear-gradient(90deg, var(--color-stone-200) 25%, var(--color-stone-100) 50%, var(--color-stone-200) 75%);`);
        lines.push(`  background-size: 200% 100%;`);
        lines.push(`  animation: ${allAnimations[name]};`);
        lines.push('}');
      } else {
        lines.push(`.${className} { animation: ${allAnimations[name]}; }`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateUtilities(typography, spacing, motion) {
  const lines = [];

  // Selection
  lines.push(`::selection {`);
  lines.push(`  background: var(--color-accent);`);
  lines.push(`  color: #fff;`);
  lines.push(`}`);
  lines.push('');

  // Base HTML
  lines.push(`html {`);
  lines.push(`  font-size: ${typography.base.htmlFontSize};`);
  if (typography.base.scrollPaddingTop) {
    lines.push(`  scroll-padding-top: ${typography.base.scrollPaddingTop};`);
  }
  lines.push(`}`);
  lines.push('');

  // Body
  lines.push(`body {`);
  lines.push(`  font-family: var(--font-body);`);
  lines.push(`  color: var(--color-text);`);
  lines.push(`  background: var(--color-bg);`);
  lines.push(`  -webkit-font-smoothing: antialiased;`);
  lines.push(`  -moz-osx-font-smoothing: grayscale;`);
  lines.push(`  overflow-x: hidden;`);
  lines.push(`  font-weight: ${typography.base.bodyFontWeight};`);
  lines.push(`}`);
  lines.push('');

  // Scrollbar
  lines.push(`::-webkit-scrollbar { width: ${spacing.scrollbar.width}; }`);
  lines.push(`::-webkit-scrollbar-track { background: transparent; }`);
  lines.push(`::-webkit-scrollbar-thumb { background: ${spacing.scrollbar.thumbColor}; border-radius: ${spacing.scrollbar.thumbRadius}; }`);
  lines.push(`::-webkit-scrollbar-thumb:hover { background: ${spacing.scrollbar.thumbHoverColor}; }`);
  lines.push('');

  // Typography utilities
  lines.push(`.text-eyebrow {`);
  lines.push(`  font-family: var(--font-mono);`);
  lines.push(`  font-size: 0.56rem;`);
  lines.push(`  text-transform: uppercase;`);
  lines.push(`  letter-spacing: 0.08em;`);
  lines.push(`  font-weight: 500;`);
  lines.push(`  color: var(--color-text-secondary);`);
  lines.push(`}`);
  lines.push('');
  lines.push(`.font-serif { font-family: var(--font-serif); }`);
  lines.push(`.tracking-tight-editorial { letter-spacing: -0.02em; }`);
  lines.push(`.tracking-wide-editorial { letter-spacing: 0.08em; }`);
  lines.push('');

  // Layout utilities
  lines.push(`.hairline-b { border-bottom: 1px solid var(--color-border); }`);
  lines.push(`.hairline-t { border-top: 1px solid var(--color-border); }`);
  lines.push(`.hairline-l { border-left: 1px solid var(--color-border); }`);
  lines.push(`.hairline-r { border-right: 1px solid var(--color-border); }`);
  lines.push('');

  // Noise overlay
  lines.push(`.noise-overlay::before {`);
  lines.push(`  content: "";`);
  lines.push(`  position: fixed;`);
  lines.push(`  inset: 0;`);
  lines.push(`  z-index: 9999;`);
  lines.push(`  pointer-events: none;`);
  lines.push(`  opacity: ${spacing.noise.opacity};`);
  lines.push(`  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");`);
  lines.push(`  background-repeat: repeat;`);
  lines.push(`  background-size: ${spacing.noise.size} ${spacing.noise.size};`);
  lines.push(`}`);
  lines.push('');

  // Row hover
  lines.push(`.row-hover {`);
  lines.push(`  transition: ${motion.transitions['row-hover']};`);
  lines.push(`}`);
  lines.push(`.row-hover:hover {`);
  lines.push(`  padding-left: 4px;`);
  lines.push(`  background-color: rgba(42, 122, 91, 0.03);`);
  lines.push(`}`);
  lines.push('');

  // Interactive transitions
  lines.push(`button, a, [role="button"] { transition: ${motion.transitions.interactive}; }`);
  lines.push('');

  // Focus ring
  lines.push(`:focus-visible {`);
  lines.push(`  outline: ${spacing.focus.outlineWidth} solid var(--color-accent);`);
  lines.push(`  outline-offset: ${spacing.focus.outlineOffset};`);
  lines.push(`}`);
  lines.push('');

  // Reduced motion
  lines.push(`@media (prefers-reduced-motion: reduce) {`);
  lines.push(`  *, *::before, *::after {`);
  lines.push(`    animation-duration: 0.01ms !important;`);
  lines.push(`    transition-duration: 0.01ms !important;`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');

  // Gravity label
  lines.push(`.gravity-label {`);
  lines.push(`  font-family: var(--font-mono);`);
  lines.push(`  font-size: 0.6rem;`);
  lines.push(`  font-weight: 500;`);
  lines.push(`  text-transform: uppercase;`);
  lines.push(`  letter-spacing: 0.06em;`);
  lines.push(`  color: var(--color-text-secondary);`);
  lines.push(`}`);
  lines.push('');

  // Mobile
  lines.push(`@media (max-width: ${typography.base.mobileBreakpoint}) {`);
  lines.push(`  html { font-size: ${typography.base.htmlFontSizeMobile}; }`);
  lines.push(`}`);
  lines.push('');

  // Card hover
  lines.push(`.card-hover {`);
  lines.push(`  transition: ${motion.transitions['card-hover-transform']};`);
  lines.push(`}`);
  lines.push(`.card-hover:hover {`);
  lines.push(`  transform: translateY(-1px);`);
  lines.push(`  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);`);
  lines.push(`}`);

  return lines.join('\n');
}

function buildCSS(themeDirective, extensionNames = []) {
  const color = loadJSON(path.join(TOKENS_DIR, 'color.json'));
  const typography = loadJSON(path.join(TOKENS_DIR, 'typography.json'));
  const motion = loadJSON(path.join(TOKENS_DIR, 'motion.json'));
  const spacing = loadJSON(path.join(TOKENS_DIR, 'spacing.json'));

  // Flatten all theme tokens
  const tokens = {};
  Object.assign(tokens, flattenTokens(color.brand));
  Object.assign(tokens, flattenTokens(color.semantic));
  Object.assign(tokens, flattenTokens(color.scales));
  Object.assign(tokens, flattenTokens(typography.fonts));
  Object.assign(tokens, flattenTokens(typography.scale));
  Object.assign(tokens, flattenTokens(motion.easing));

  // Load extensions
  const extensions = extensionNames.map(name => {
    return loadJSON(path.join(EXT_DIR, `${name}.json`));
  });

  const fontImport = `@import url('${typography.fonts.import}');`;
  const tailwindImport = `@import "tailwindcss";`;
  const header = [
    `/* ═══════════════════════════════════════════════════════════════════════════`,
    `   Gravity Design System`,
    `   Editorial minimal aesthetic · Forest green accent · Warm neutrals`,
    `   Generated by leonardo/build.js — DO NOT EDIT MANUALLY`,
    `   ═══════════════════════════════════════════════════════════════════════════ */`,
  ].join('\n');

  const themeBlock = generateThemeBlock(themeDirective, tokens);
  const utilities = generateUtilities(typography, spacing, motion);
  const keyframes = generateKeyframes(motion, extensions);

  return [fontImport, tailwindImport, '', header, '', themeBlock, '', utilities, '', keyframes].join('\n');
}

// ── Push to apps ─────────────────────────────────────────────────────────────

function pushToApp(appName, appConfig) {
  const appRoot = path.resolve(ROOT, appConfig.path);
  const cssPath = path.join(appRoot, appConfig.css);

  if (!fs.existsSync(cssPath)) {
    console.error(`  ✗ ${appName}: CSS file not found at ${cssPath}`);
    return false;
  }

  const original = fs.readFileSync(cssPath, 'utf-8');
  const gravityCSS = buildCSS(appConfig.theme, appConfig.extensions || []);

  // Check for existing markers
  const hasMarkers = original.includes(MARKER_START) && original.includes(MARKER_END);

  let newContent;
  if (hasMarkers) {
    // Replace between markers
    const before = original.substring(0, original.indexOf(MARKER_START));
    const after = original.substring(original.indexOf(MARKER_END) + MARKER_END.length);
    newContent = before + MARKER_START + '\n' + gravityCSS + '\n' + MARKER_END + after;
  } else {
    // First time: wrap entire file content, keeping any app-specific CSS after
    // We replace everything from the font import through the end of the gravity section
    newContent = MARKER_START + '\n' + gravityCSS + '\n' + MARKER_END + '\n';
  }

  const changed = newContent !== original;

  if (args.includes('--diff')) {
    if (changed) {
      console.log(`  ~ ${appName}: would change (${cssPath})`);
    } else {
      console.log(`  ✓ ${appName}: no changes`);
    }
    return changed;
  }

  fs.writeFileSync(cssPath, newContent, 'utf-8');
  console.log(`  ${changed ? '~' : '✓'} ${appName}: ${changed ? 'updated' : 'unchanged'} (${appConfig.css})`);
  return changed;
}

// ── Dist build ───────────────────────────────────────────────────────────────

function buildIndex() {
  const color = loadJSON(path.join(TOKENS_DIR, 'color.json'));
  const typography = loadJSON(path.join(TOKENS_DIR, 'typography.json'));
  const motion = loadJSON(path.join(TOKENS_DIR, 'motion.json'));
  const spacing = loadJSON(path.join(TOKENS_DIR, 'spacing.json'));
  const apps = loadJSON(path.join(ROOT, 'apps.json'));

  // Embed all tokens as JSON for client-side state
  const embeddedTokens = JSON.stringify({ color, typography, motion, spacing });
  const embeddedApps = JSON.stringify(apps);

  // Build CSS variables from tokens for live preview
  const allTokens = {};
  Object.assign(allTokens, flattenTokens(color.brand));
  Object.assign(allTokens, flattenTokens(color.semantic));
  Object.assign(allTokens, flattenTokens(color.scales));
  Object.assign(allTokens, flattenTokens(typography.fonts));
  Object.assign(allTokens, flattenTokens(typography.scale));
  Object.assign(allTokens, flattenTokens(motion.easing));
  const cssVars = Object.entries(allTokens).map(([k, v]) => `  ${k}: ${v};`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leonardo \u2014 Design OS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${typography.fonts.import}" rel="stylesheet">
  <style>
    :root {
${cssVars}
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 14px; height: 100%; }
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      background: var(--color-bg);
      -webkit-font-smoothing: antialiased;
      height: 100%;
      overflow: hidden;
    }
    code, .mono { font-family: var(--font-mono); }

    /* ── Layout Shell ───────────────────────────────── */
    .shell { display: flex; flex-direction: column; height: 100vh; }

    /* ── Command Bar (the primary interface) ────────── */
    .command-bar {
      display: flex; align-items: center; gap: 16px;
      padding: 0 24px; height: 64px; min-height: 64px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg); z-index: 10;
    }
    .command-bar-brand {
      font-family: var(--font-serif); font-size: 1.2rem; font-weight: 400;
      letter-spacing: -0.02em; white-space: nowrap; color: var(--color-accent);
    }
    .command-input-wrap {
      flex: 1; display: flex; align-items: center;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: 12px; padding: 0 16px; height: 42px;
      transition: border-color 0.2s var(--ease-smooth), box-shadow 0.2s var(--ease-smooth);
    }
    .command-input-wrap:focus-within { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-light); }
    .command-input-wrap svg { color: var(--color-text-faint); margin-right: 12px; flex-shrink: 0; }
    .command-input {
      flex: 1; border: none; background: none; outline: none;
      font-family: var(--font-body); font-size: 14px; color: var(--color-text);
    }
    .command-input::placeholder { color: var(--color-text-faint); transition: opacity 0.3s ease; }
    .command-hint {
      font-family: var(--font-mono); font-size: 10px; color: var(--color-text-faint);
      padding: 3px 8px; background: var(--color-bg); border-radius: 5px;
      border: 1px solid var(--color-border); white-space: nowrap;
    }
    .bar-actions { display: flex; gap: 8px; }
    .btn {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
      padding: 7px 14px; border-radius: 7px; border: 1px solid var(--color-border);
      background: var(--color-bg); color: var(--color-text-secondary);
      cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
    }
    .btn:hover { background: var(--color-surface); color: var(--color-text); }
    .btn.primary { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
    .btn.primary:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Three-Column Body ──────────────────────────── */
    .body-wrap { display: flex; flex: 1; overflow: hidden; }

    /* Left: Navigation */
    .nav {
      width: 56px; min-width: 56px; border-right: 1px solid var(--color-border);
      display: flex; flex-direction: column; align-items: center;
      padding: 14px 0; gap: 2px; background: var(--color-bg);
    }
    .nav-btn {
      width: 40px; height: 40px; border-radius: 10px; border: none;
      background: none; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: var(--color-text-secondary);
      transition: all 0.15s var(--ease-smooth); position: relative;
    }
    .nav-btn svg { width: 18px; height: 18px; stroke-width: 1.5; }
    .nav-btn:hover { background: var(--color-surface); color: var(--color-text); }
    .nav-btn.active { background: var(--color-accent-light); color: var(--color-accent); }
    .nav-btn .tip {
      display: none; position: absolute; left: 52px; top: 50%; transform: translateY(-50%);
      font-family: var(--font-mono); font-size: 10px; white-space: nowrap;
      background: var(--color-text); color: var(--color-bg); padding: 4px 10px;
      border-radius: 6px; pointer-events: none; z-index: 20;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .nav-btn:hover .tip { display: block; }
    .nav-sep { width: 28px; height: 1px; background: var(--color-border); margin: 6px 0; }

    /* Center: Canvas */
    .canvas { flex: 1; overflow-y: auto; padding: 40px 48px 80px; }
    .panel { display: none; }
    .panel.active { display: block; }
    .panel-title {
      font-family: var(--font-serif); font-size: clamp(1.4rem, 1.3rem + 0.5vw, 1.8rem);
      font-weight: 400; letter-spacing: -0.02em; margin-bottom: 6px;
    }
    .panel-sub {
      font-size: 13px; color: var(--color-text-secondary);
      margin-bottom: 28px; max-width: 600px; line-height: 1.6;
    }
    .label {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
      color: var(--color-text-secondary); margin: 28px 0 10px;
    }
    .label:first-child { margin-top: 0; }

    /* Right: Activity Feed */
    .activity {
      width: 280px; min-width: 280px; border-left: 1px solid var(--color-border);
      display: flex; flex-direction: column; background: var(--color-bg);
    }
    .activity-header {
      font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.06em; font-weight: 500; color: var(--color-text-faint);
      padding: 14px 16px 10px; border-bottom: 1px solid var(--color-border);
    }
    .activity-feed { flex: 1; overflow-y: auto; padding: 8px 0; }
    .activity-item {
      padding: 10px 16px; font-size: 12px; border-bottom: 1px solid rgba(0,0,0,0.03);
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .activity-item .time {
      font-family: var(--font-mono); font-size: 9px; color: var(--color-text-faint);
      margin-bottom: 2px;
    }
    .activity-item .msg { color: var(--color-text-secondary); line-height: 1.5; }
    .activity-item .msg strong { color: var(--color-text); font-weight: 500; }
    .activity-item.success .msg { color: var(--color-success); }
    .activity-item.error .msg { color: var(--color-danger); }

    /* ── Token Editors ──────────────────────────────── */
    .token-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; }
    .token-row {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px; border-radius: 8px; border: 1px solid var(--color-border);
      background: var(--color-bg); transition: border-color 0.15s ease;
    }
    .token-row:hover { border-color: var(--color-border-light); }
    .token-swatch {
      width: 26px; height: 26px; border-radius: 6px;
      border: 1px solid rgba(0,0,0,0.08); cursor: pointer;
      position: relative; flex-shrink: 0;
    }
    .token-swatch input[type="color"] {
      position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; border: none;
    }
    .token-info { flex: 1; min-width: 0; }
    .token-name { font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .token-value { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-secondary); }

    .scale-strip { display: flex; gap: 2px; margin-bottom: 12px; }
    .scale-chip { flex: 1; text-align: center; cursor: pointer; }
    .scale-chip-swatch { height: 32px; border-radius: 6px; margin-bottom: 2px; border: 1px solid rgba(0,0,0,0.04); position: relative; }
    .scale-chip-swatch input[type="color"] { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
    .scale-chip-label { font-family: var(--font-mono); font-size: 8px; color: var(--color-text-faint); }

    /* ── Component Cards ────────────────────────────── */
    .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .comp-card { border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .comp-card:hover { border-color: var(--color-border-light); box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .comp-card-title {
      font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--color-text-faint); margin-bottom: 14px;
    }
    .comp-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .comp-row + .comp-row { margin-top: 10px; }

    /* Preview components */
    .p-btn { font-family: var(--font-body); font-size: 13px; font-weight: 500; padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s ease; }
    .p-btn.primary { background: var(--color-accent); color: #fff; }
    .p-btn.secondary { background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border); }
    .p-btn.ghost { background: none; color: var(--color-accent); }
    .p-btn.sm { font-size: 12px; padding: 5px 12px; border-radius: 6px; }
    .p-btn.danger { background: var(--color-danger); color: #fff; }
    .p-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px; width: 100%; }
    .p-card h4 { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .p-card p { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
    .p-input { font-family: var(--font-body); font-size: 13px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); width: 100%; outline: none; }
    .p-input:focus { border-color: var(--color-accent); }
    .p-badge { display: inline-block; font-family: var(--font-mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 4px; }
    .p-badge.accent { background: var(--color-accent-light); color: var(--color-accent); }
    .p-badge.success { background: #E8F5EE; color: var(--color-success); }
    .p-badge.warning { background: #FEF3CD; color: var(--color-warning); }
    .p-badge.danger { background: #FDE8E8; color: var(--color-danger); }
    .p-alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; width: 100%; }
    .p-alert.success { background: #E8F5EE; color: var(--color-success); border: 1px solid #A3D7C1; }
    .p-alert.warning { background: #FEF3CD; color: var(--color-warning); border: 1px solid #F5D77B; }
    .p-alert.danger { background: #FDE8E8; color: var(--color-danger); border: 1px solid #F0A0A0; }
    .p-toggle { width: 40px; height: 22px; border-radius: 11px; background: var(--color-border); cursor: pointer; position: relative; transition: background 0.2s ease; }
    .p-toggle.on { background: var(--color-accent); }
    .p-toggle-knob { width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .p-toggle.on .p-toggle-knob { transform: translateX(18px); }

    /* ── Create Panel ───────────────────────────────── */
    .create-form { display: grid; gap: 12px; max-width: 640px; }
    .create-field label {
      display: block; font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-secondary);
      margin-bottom: 4px;
    }
    .create-field input, .create-field textarea {
      width: 100%; font-family: var(--font-mono); font-size: 13px;
      padding: 10px 12px; border-radius: 8px; border: 1px solid var(--color-border);
      background: var(--color-bg); color: var(--color-text); outline: none;
      transition: border-color 0.15s ease;
    }
    .create-field input:focus, .create-field textarea:focus { border-color: var(--color-accent); }
    .create-field textarea { min-height: 120px; resize: vertical; font-size: 12px; }
    .create-preview {
      border: 1px solid var(--color-border); border-radius: 10px;
      padding: 24px; background: var(--color-surface); min-height: 100px;
    }

    /* ── Apps Panel ─────────────────────────────────── */
    .app-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border: 1px solid var(--color-border);
      border-radius: 10px; margin-bottom: 6px;
    }
    .app-row:hover { border-color: var(--color-border-light); }
    .app-name { font-weight: 500; font-size: 13px; }
    .app-meta { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-secondary); margin-left: 8px; }
    .app-status { font-family: var(--font-mono); font-size: 10px; color: var(--color-text-faint); margin-right: 8px; }

    /* ── Toast ──────────────────────────────────────── */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px);
      background: var(--color-text); color: var(--color-bg);
      font-size: 13px; padding: 10px 24px; border-radius: 10px;
      opacity: 0; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: none; z-index: 100; font-family: var(--font-body);
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }

    @media (max-width: 900px) {
      .activity { display: none; }
      .canvas { padding: 24px 16px 80px; }
    }
    @media (max-width: 600px) {
      .nav { width: 44px; min-width: 44px; }
      .nav-btn { width: 32px; height: 32px; }
    }
  </style>
</head>
<body>
<div class="shell">
  <!-- Command Bar -->
  <div class="command-bar">
    <div class="command-bar-brand">Leonardo</div>
    <div class="command-input-wrap">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input class="command-input" id="cmdInput" placeholder="set accent to #3B82F6" autofocus />
      <span class="command-hint">\u2318K</span>
    </div>
    <div class="bar-actions">
      <button class="btn" onclick="saveTokens()">Save</button>
      <button class="btn primary" onclick="agentCmd('push')">Push All</button>
    </div>
  </div>

  <div class="body-wrap">
    <!-- Icon Nav -->
    <div class="nav">
      <button class="nav-btn active" data-panel="canvas" title="Canvas"><span class="tip">Canvas</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>
      <button class="nav-btn" data-panel="colors" title="Colors"><span class="tip">Colors</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3"/></svg></button>
      <button class="nav-btn" data-panel="type" title="Typography"><span class="tip">Type</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></button>
      <button class="nav-btn" data-panel="motion" title="Motion"><span class="tip">Motion</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      <div class="nav-sep"></div>
      <button class="nav-btn" data-panel="create" title="Create"><span class="tip">Create</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg></button>
      <div class="nav-sep"></div>
      <button class="nav-btn" data-panel="apps" title="Apps"><span class="tip">Apps</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></button>
    </div>

    <!-- Canvas -->
    <div class="canvas">
      <!-- CANVAS: Component Gallery (default view) -->
      <div id="panel-canvas" class="panel active">
        <div class="panel-title">Canvas</div>
        <div class="panel-sub">Live components rendered with current tokens. Change a color and watch everything update.</div>
        <div class="comp-grid">
          <div class="comp-card">
            <div class="comp-card-title">Buttons</div>
            <div class="comp-row">
              <button class="p-btn primary">Primary</button>
              <button class="p-btn secondary">Secondary</button>
              <button class="p-btn ghost">Ghost</button>
            </div>
            <div class="comp-row">
              <button class="p-btn primary sm">Small</button>
              <button class="p-btn danger sm">Danger</button>
              <button class="p-btn secondary sm" disabled>Disabled</button>
            </div>
          </div>
          <div class="comp-card">
            <div class="comp-card-title">Card</div>
            <div class="p-card"><h4>Card Title</h4><p>Surface color, border, text hierarchy tokens in action.</p></div>
          </div>
          <div class="comp-card">
            <div class="comp-card-title">Input</div>
            <div class="comp-row"><input class="p-input" placeholder="Placeholder text\u2026" /></div>
            <div class="comp-row" style="margin-top:8px"><input class="p-input" value="Filled input" /></div>
          </div>
          <div class="comp-card">
            <div class="comp-card-title">Badges</div>
            <div class="comp-row">
              <span class="p-badge accent">Accent</span>
              <span class="p-badge success">Success</span>
              <span class="p-badge warning">Warning</span>
              <span class="p-badge danger">Danger</span>
            </div>
          </div>
          <div class="comp-card">
            <div class="comp-card-title">Alerts</div>
            <div class="comp-row" style="flex-direction:column;gap:8px">
              <div class="p-alert success">\u2713 Changes saved</div>
              <div class="p-alert warning">\u26A0 Review required</div>
              <div class="p-alert danger">\u2717 Build failed</div>
            </div>
          </div>
          <div class="comp-card">
            <div class="comp-card-title">Toggle</div>
            <div class="comp-row" style="gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <div class="p-toggle on" onclick="this.classList.toggle('on')"><div class="p-toggle-knob"></div></div>
                <span style="font-size:13px">Enabled</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="p-toggle" onclick="this.classList.toggle('on')"><div class="p-toggle-knob"></div></div>
                <span style="font-size:13px">Off</span>
              </div>
            </div>
          </div>
        </div>
        <div class="label">Custom Components</div>
        <div class="comp-grid" id="custom-components"></div>
      </div>

      <!-- COLORS -->
      <div id="panel-colors" class="panel">
        <div class="panel-title">Colors</div>
        <div class="panel-sub">Click any swatch to edit. Changes update the canvas in real-time.</div>
        <div class="label">Brand</div>
        <div class="token-grid" id="brand-colors"></div>
        <div class="label">Semantic</div>
        <div class="token-grid" id="semantic-colors"></div>
        <div class="label">Accent Scale</div>
        <div class="scale-strip" id="accent-scale"></div>
        <div class="label">Gray Scale</div>
        <div class="scale-strip" id="gray-scale"></div>
      </div>

      <!-- TYPOGRAPHY -->
      <div id="panel-type" class="panel">
        <div class="panel-title">Typography</div>
        <div class="panel-sub">Font families and type scale.</div>
        <div class="label">Families</div>
        <div style="display:grid;gap:8px">
          <div style="padding:16px;border:1px solid var(--color-border);border-radius:10px">
            <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-faint);margin-bottom:6px">Display</div>
            <div style="font-family:var(--font-serif);font-size:clamp(1.4rem,1.3rem+0.6vw,1.8rem);font-weight:400;letter-spacing:-0.02em">Cormorant Garamond</div>
          </div>
          <div style="padding:16px;border:1px solid var(--color-border);border-radius:10px">
            <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-faint);margin-bottom:6px">Body</div>
            <div style="font-family:var(--font-body);font-size:14px">DM Sans \u2014 The quick brown fox jumps over the lazy dog</div>
          </div>
          <div style="padding:16px;border:1px solid var(--color-border);border-radius:10px">
            <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-faint);margin-bottom:6px">Mono</div>
            <div style="font-family:var(--font-mono);font-size:12px">DM Mono \u2014 The quick brown fox jumps over the lazy dog</div>
          </div>
        </div>
        <div class="label">Scale</div>
        <div id="type-scale"></div>
      </div>

      <!-- MOTION -->
      <div id="panel-motion" class="panel">
        <div class="panel-title">Motion</div>
        <div class="panel-sub">Easing, keyframes, and transitions.</div>
        <div class="label">Easing</div>
        <div class="token-grid">
          ${Object.entries(motion.easing).map(([k, v]) => `<div class="token-row"><div class="token-info"><div class="token-name">${k.replace('--','')}</div><div class="token-value">${v}</div></div></div>`).join('')}
        </div>
        <div class="label">Transitions</div>
        <div class="token-grid">
          ${Object.entries(motion.transitions).map(([k, v]) => `<div class="token-row"><div class="token-info"><div class="token-name">${k}</div><div class="token-value">${v}</div></div></div>`).join('')}
        </div>
      </div>

      <!-- CREATE -->
      <div id="panel-create" class="panel">
        <div class="panel-title">Create</div>
        <div class="panel-sub">Define new components. Write HTML that uses CSS variables \u2014 it renders live on the canvas.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="create-form">
            <div class="create-field">
              <label>Component Name</label>
              <input id="create-name" placeholder="e.g. Stat Card, Nav Item, Avatar" />
            </div>
            <div class="create-field">
              <label>HTML (uses CSS vars)</label>
              <textarea id="create-html" placeholder='<div style="padding:16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px">\\n  <h3 style="font-size:14px;font-weight:600">Title</h3>\\n  <p style="font-size:13px;color:var(--color-text-secondary)">Description</p>\\n</div>'></textarea>
            </div>
            <div class="create-field">
              <label>CSS (optional)</label>
              <textarea id="create-css" placeholder="Additional styles\u2026" style="min-height:60px"></textarea>
            </div>
            <button class="btn primary" onclick="createComponent()">Create Component</button>
          </div>
          <div>
            <div class="label" style="margin-top:0">Live Preview</div>
            <div class="create-preview" id="create-preview"></div>
          </div>
        </div>
      </div>

      <!-- APPS -->
      <div id="panel-apps" class="panel">
        <div class="panel-title">Connected Apps</div>
        <div class="panel-sub">Push tokens to all apps. Pull latest from every repo.</div>
        <div style="display:flex;gap:8px;margin-bottom:20px">
          <button class="btn primary" onclick="agentCmd('push')">Push All</button>
          <button class="btn" onclick="agentCmd('pull all')">Pull All Repos</button>
          <button class="btn" onclick="agentCmd('status')">Git Status</button>
        </div>
        <div id="apps-list">
          ${Object.entries(apps).map(([key, cfg]) => `
            <div class="app-row" id="app-${key}">
              <div>
                <span class="app-name">${cfg.label}</span>
                <span class="app-meta">${cfg.framework} ${cfg.port ? ':' + cfg.port : ''}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span class="app-status" id="status-${key}">\u2014</span>
              </div>
            </div>`).join('')}
        </div>
        <div class="label">Output</div>
        <pre id="git-output" style="font-family:var(--font-mono);font-size:11px;color:var(--color-text-secondary);background:var(--color-surface);padding:14px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;min-height:60px">\u2014</pre>
      </div>
    </div>

    <!-- Activity Feed -->
    <div class="activity">
      <div class="activity-header">Activity</div>
      <div class="activity-feed" id="activity-feed">
        <div class="activity-item"><div class="time">now</div><div class="msg">Leonardo ready. Type a command or click the canvas.</div></div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const STATE = { tokens: ${embeddedTokens}, apps: ${embeddedApps}, dirty: false };

// ── Navigation ─────────────────────────────────────────
document.querySelectorAll('.nav-btn[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

// ── Toast + Activity ───────────────────────────────────
function toast(msg, dur = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

function log(msg, type = '') {
  const feed = document.getElementById('activity-feed');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const item = document.createElement('div');
  item.className = 'activity-item ' + type;
  item.innerHTML = '<div class="time">' + now + '</div><div class="msg">' + msg + '</div>';
  feed.insertBefore(item, feed.firstChild);
}

// ── Agent Command System ───────────────────────────────
async function agentCmd(command) {
  log('Running: <strong>' + command + '</strong>');
  toast('Executing: ' + command);
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const data = await res.json();
    if (data.ok) {
      log('<strong>' + (data.message || data.action) + '</strong>', 'success');
      toast(data.message || 'Done');
      // Apply color changes live
      if (data.action === 'color-change') {
        document.documentElement.style.setProperty('--color-' + data.token, data.value);
        // Refresh token state from server
        refreshTokens();
      }
      if (data.action === 'font-change') refreshTokens();
      if (data.action === 'pull-all' && data.results) {
        const out = Object.entries(data.results).map(([k,v]) => k + ': ' + v).join('\\n');
        document.getElementById('git-output').textContent = out;
      }
      if (data.output) document.getElementById('git-output').textContent = data.output;
    } else {
      log(data.message || data.error || 'Command failed', 'error');
      toast(data.message || 'Unknown command');
    }
  } catch (e) {
    log('Error: ' + e.message, 'error');
    toast('Error: ' + e.message);
  }
}

async function refreshTokens() {
  try {
    const res = await fetch('/api/tokens');
    const tokens = await res.json();
    STATE.tokens = tokens;
    renderColorGrid('brand-colors', tokens.color.brand, 'brand');
    renderColorGrid('semantic-colors', tokens.color.semantic, 'semantic');
    renderScale('accent-scale', tokens.color.scales.indigo);
    renderScale('gray-scale', tokens.color.scales.gray);
    renderTypeScale();
  } catch (e) { /* server might not be running */ }
}

// Command bar
document.getElementById('cmdInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    agentCmd(this.value.trim());
    this.value = '';
  }
});

// ── Color Editors ──────────────────────────────────────
function renderColorGrid(id, obj, path) {
  const c = document.getElementById(id); if (!c) return; c.innerHTML = '';
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('--')) continue;
    const row = document.createElement('div'); row.className = 'token-row';
    row.innerHTML = '<div class="token-swatch" style="background:' + value + '"><input type="color" value="' + toHex(value) + '" data-token="' + key + '" data-path="' + path + '"></div><div class="token-info"><div class="token-name">' + key.replace(/^--color-/,'') + '</div><div class="token-value">' + value + '</div></div>';
    row.querySelector('input').addEventListener('input', onColor);
    c.appendChild(row);
  }
}
function renderScale(id, obj) {
  const c = document.getElementById(id); if (!c) return; c.innerHTML = '';
  for (const [key, value] of Object.entries(obj)) {
    const chip = document.createElement('div'); chip.className = 'scale-chip';
    chip.innerHTML = '<div class="scale-chip-swatch" style="background:' + value + '"><input type="color" value="' + toHex(value) + '" data-token="' + key + '"></div><div class="scale-chip-label">' + key.replace(/--color-\\w+-/,'') + '</div>';
    chip.querySelector('input').addEventListener('input', function(e) {
      document.documentElement.style.setProperty(e.target.dataset.token, e.target.value);
      e.target.parentElement.style.background = e.target.value;
      STATE.dirty = true;
    });
    c.appendChild(chip);
  }
}
function onColor(e) {
  const t = e.target.dataset.token, v = e.target.value;
  document.documentElement.style.setProperty(t, v);
  e.target.parentElement.style.background = v;
  e.target.closest('.token-row').querySelector('.token-value').textContent = v;
  const p = e.target.dataset.path;
  if (p) { let ref = STATE.tokens.color; for (const k of p.split('.')) ref = ref[k]; if (ref) ref[t] = v; }
  STATE.dirty = true;
}
function toHex(c) {
  if (c.startsWith('#') && c.length >= 4) return c.length === 4 ? '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c;
  if (c.startsWith('rgb')) { const m = c.match(/[\\d.]+/g); if (m&&m.length>=3) return '#'+[0,1,2].map(i=>parseInt(m[i]).toString(16).padStart(2,'0')).join(''); }
  return '#888888';
}

// ── Type Scale ─────────────────────────────────────────
function renderTypeScale() {
  const c = document.getElementById('type-scale'); if (!c) return; c.innerHTML = '';
  for (const [key, value] of Object.entries(STATE.tokens.typography.scale)) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:baseline;gap:16px;padding:10px 0;border-bottom:1px solid var(--color-border)';
    row.innerHTML = '<div style="font-family:var(--font-mono);font-size:10px;color:var(--color-text-faint);width:36px">' + key.replace('--text-','') + '</div><div style="font-size:' + value + ';line-height:1.3">The quick brown fox jumps over the lazy dog</div>';
    c.appendChild(row);
  }
}

// ── Save Tokens ────────────────────────────────────────
async function saveTokens() {
  if (!STATE.dirty) { toast('No changes'); return; }
  try {
    await fetch('/api/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: 'color.json', data: STATE.tokens.color }) });
    STATE.dirty = false; toast('Saved'); log('Tokens saved to disk', 'success');
  } catch (e) { toast('Save failed'); log('Save error: ' + e.message, 'error'); }
}

// ── Create Component ───────────────────────────────────
document.getElementById('create-html').addEventListener('input', function() {
  document.getElementById('create-preview').innerHTML = this.value;
});

async function createComponent() {
  const name = document.getElementById('create-name').value.trim();
  const html = document.getElementById('create-html').value.trim();
  const css = document.getElementById('create-css').value.trim();
  if (!name || !html) { toast('Need name and HTML'); return; }
  try {
    const res = await fetch('/api/components', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, html, css })
    });
    const data = await res.json();
    if (data.ok) {
      toast('Component created: ' + name);
      log('Created component: <strong>' + name + '</strong>', 'success');
      document.getElementById('create-name').value = '';
      document.getElementById('create-html').value = '';
      document.getElementById('create-css').value = '';
      document.getElementById('create-preview').innerHTML = '';
      loadCustomComponents();
    } else { toast('Error: ' + (data.error || 'unknown')); }
  } catch (e) { toast('Error: ' + e.message); }
}

async function loadCustomComponents() {
  const container = document.getElementById('custom-components');
  try {
    const res = await fetch('/api/components');
    const components = await res.json();
    container.innerHTML = '';
    if (!components.length) { container.innerHTML = '<div style="font-size:13px;color:var(--color-text-faint)">No custom components yet. Use the Create panel or type "create component" in the command bar.</div>'; return; }
    for (const comp of components) {
      const card = document.createElement('div'); card.className = 'comp-card';
      card.innerHTML = '<div class="comp-card-title">' + comp.name + '</div>' + comp.html;
      container.appendChild(card);
    }
  } catch (e) { container.innerHTML = '<div style="font-size:12px;color:var(--color-text-faint)">Run <code>node server.js</code> locally for full features.</div>'; }
}

// ── Cycling Placeholder ─────────────────────────────────
const hints = [
  'set accent to #3B82F6',
  'change body font to Inter',
  'pull all',
  'push',
  'build',
  'status',
  'set bg to #0D1117',
  'set surface to #161B22',
];
let hintIdx = 0;
const cmdInput = document.getElementById('cmdInput');
setInterval(() => {
  if (document.activeElement === cmdInput && cmdInput.value) return;
  hintIdx = (hintIdx + 1) % hints.length;
  cmdInput.placeholder = hints[hintIdx];
}, 3000);

// ── Keyboard shortcut ───────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    cmdInput.focus();
    cmdInput.select();
  }
});

// ── Init ───────────────────────────────────────────────
renderColorGrid('brand-colors', STATE.tokens.color.brand, 'brand');
renderColorGrid('semantic-colors', STATE.tokens.color.semantic, 'semantic');
renderScale('accent-scale', STATE.tokens.color.scales.indigo);
renderScale('gray-scale', STATE.tokens.color.scales.gray);
renderTypeScale();
loadCustomComponents();
log('Try: <strong>set accent to #3B82F6</strong> or <strong>pull all</strong>');
</script>
</body>
</html>`;
}

function buildDist() {
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  // Full CSS (default theme)
  const full = buildCSS('@theme');
  fs.writeFileSync(path.join(DIST_DIR, 'gravity.css'), full, 'utf-8');

  // TW4 variant
  fs.writeFileSync(path.join(DIST_DIR, 'gravity-tw4.css'), full, 'utf-8');

  // TW4 inline (Next.js)
  const inline = buildCSS('@theme inline');
  fs.writeFileSync(path.join(DIST_DIR, 'gravity-tw4-inline.css'), inline, 'utf-8');

  // Landing page
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), buildIndex(), 'utf-8');

  console.log('Built dist/:');
  console.log('  gravity.css');
  console.log('  gravity-tw4.css');
  console.log('  gravity-tw4-inline.css');
  console.log('  index.html');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

buildDist();

if (args.includes('--push') || args.includes('--diff')) {
  console.log('');
  console.log(args.includes('--diff') ? 'Diff (dry run):' : 'Pushing to apps:');

  const apps = loadJSON(path.join(ROOT, 'apps.json'));
  let changed = 0;

  for (const [name, config] of Object.entries(apps)) {
    if (pushToApp(name, config)) changed++;
  }

  console.log('');
  console.log(`Done. ${changed} app(s) ${args.includes('--diff') ? 'would change' : 'updated'}.`);
}
