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
  <title>Leonardo — Design Workbench</title>
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

    /* ── Layout ─────────────────────────────────────── */
    .shell { display: flex; flex-direction: column; height: 100vh; }
    .topbar {
      display: flex; align-items: center; gap: 12px;
      padding: 0 20px; height: 52px; min-height: 52px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg);
      z-index: 10;
    }
    .topbar-brand {
      font-family: var(--font-serif);
      font-size: 1.15rem; font-weight: 400;
      letter-spacing: -0.02em;
      color: var(--color-text);
      white-space: nowrap;
    }
    .agent-bar {
      flex: 1; display: flex; align-items: center;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px; padding: 0 12px; height: 34px;
      margin: 0 8px;
    }
    .agent-bar-icon { color: var(--color-text-secondary); font-size: 13px; margin-right: 8px; }
    .agent-bar input {
      flex: 1; border: none; background: none; outline: none;
      font-family: var(--font-body); font-size: 13px;
      color: var(--color-text);
    }
    .agent-bar input::placeholder { color: var(--color-text-faint); }
    .topbar-actions { display: flex; gap: 6px; }
    .topbar-btn {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
      padding: 6px 12px; border-radius: 6px; border: 1px solid var(--color-border);
      background: var(--color-bg); color: var(--color-text-secondary);
      cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
    }
    .topbar-btn:hover { background: var(--color-surface); color: var(--color-text); }
    .topbar-btn.primary {
      background: var(--color-accent); color: #fff; border-color: var(--color-accent);
    }
    .topbar-btn.primary:hover { opacity: 0.9; }
    .topbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .body { display: flex; flex: 1; overflow: hidden; }

    /* ── Sidebar ────────────────────────────────────── */
    .sidebar {
      width: 180px; min-width: 180px;
      border-right: 1px solid var(--color-border);
      padding: 16px 0; overflow-y: auto;
      background: var(--color-bg);
    }
    .sidebar-section {
      font-family: var(--font-mono); font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;
      color: var(--color-text-faint); padding: 12px 20px 6px;
    }
    .sidebar-item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 20px; font-size: 13px; color: var(--color-text-secondary);
      cursor: pointer; transition: all 0.12s ease;
      border-left: 2px solid transparent;
    }
    .sidebar-item:hover { color: var(--color-text); background: var(--color-surface); }
    .sidebar-item.active {
      color: var(--color-accent); background: var(--color-accent-light);
      border-left-color: var(--color-accent); font-weight: 500;
    }
    .sidebar-icon { width: 16px; text-align: center; font-size: 14px; }

    /* ── Main Panel ─────────────────────────────────── */
    .main { flex: 1; overflow-y: auto; padding: 32px 40px 80px; }
    .panel { display: none; }
    .panel.active { display: block; }
    .panel-title {
      font-family: var(--font-serif);
      font-size: clamp(1.3rem, 1.3rem + 0.4vw, 1.6rem);
      font-weight: 400; letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .panel-desc {
      font-size: 13px; color: var(--color-text-secondary);
      margin-bottom: 32px; max-width: 560px; line-height: 1.6;
    }
    .section-label {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;
      color: var(--color-text-secondary); margin: 32px 0 12px;
    }
    .section-label:first-child { margin-top: 0; }

    /* ── Token Editors ──────────────────────────────── */
    .token-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
    .token-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      transition: border-color 0.15s ease;
    }
    .token-row:hover { border-color: var(--color-border-light); }
    .token-swatch {
      width: 28px; height: 28px; border-radius: 6px;
      border: 1px solid rgba(0,0,0,0.08); cursor: pointer;
      position: relative; flex-shrink: 0;
    }
    .token-swatch input[type="color"] {
      position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%;
      cursor: pointer; border: none;
    }
    .token-info { flex: 1; min-width: 0; }
    .token-name {
      font-size: 12px; font-weight: 500; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .token-value {
      font-family: var(--font-mono); font-size: 11px;
      color: var(--color-text-secondary);
    }

    /* ── Scale Row ──────────────────────────────────── */
    .scale-strip { display: flex; gap: 3px; margin-bottom: 16px; }
    .scale-chip {
      flex: 1; text-align: center; cursor: pointer;
      position: relative;
    }
    .scale-chip-swatch {
      height: 36px; border-radius: 6px; margin-bottom: 3px;
      border: 1px solid rgba(0,0,0,0.04);
      position: relative;
    }
    .scale-chip-swatch input[type="color"] {
      position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer;
    }
    .scale-chip-label {
      font-family: var(--font-mono); font-size: 9px; color: var(--color-text-faint);
    }

    /* ── Typography Editor ──────────────────────────── */
    .type-preview {
      padding: 12px 0; border-bottom: 1px solid var(--color-border);
      display: flex; align-items: baseline; gap: 16px;
    }
    .type-preview:last-child { border-bottom: none; }
    .type-label {
      font-family: var(--font-mono); font-size: 10px;
      color: var(--color-text-faint); width: 40px; flex-shrink: 0;
    }
    .type-sample { line-height: 1.3; color: var(--color-text); }
    .font-card {
      padding: 20px; border: 1px solid var(--color-border);
      border-radius: 10px; margin-bottom: 10px;
    }
    .font-card-label {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-faint); margin-bottom: 8px;
    }

    /* ── Component Gallery ──────────────────────────── */
    .comp-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .comp-card {
      border: 1px solid var(--color-border); border-radius: 10px;
      padding: 24px; background: var(--color-bg);
    }
    .comp-card-title {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-faint); margin-bottom: 16px;
    }
    .comp-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .comp-row + .comp-row { margin-top: 12px; }

    /* Component preview styles */
    .preview-btn {
      font-family: var(--font-body); font-size: 13px; font-weight: 500;
      padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;
      transition: all 0.15s ease;
    }
    .preview-btn.primary { background: var(--color-accent); color: #fff; }
    .preview-btn.primary:hover { opacity: 0.9; }
    .preview-btn.secondary {
      background: var(--color-bg); color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .preview-btn.secondary:hover { background: var(--color-surface); }
    .preview-btn.ghost {
      background: none; color: var(--color-accent); padding: 8px 12px;
    }
    .preview-btn.ghost:hover { background: var(--color-accent-light); }
    .preview-btn.sm { font-size: 12px; padding: 5px 12px; border-radius: 6px; }
    .preview-btn.danger { background: var(--color-danger); color: #fff; }

    .preview-card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: 10px; padding: 20px; width: 100%;
    }
    .preview-card-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .preview-card-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }

    .preview-input {
      font-family: var(--font-body); font-size: 13px;
      padding: 8px 12px; border-radius: 8px;
      border: 1px solid var(--color-border);
      background: var(--color-bg); color: var(--color-text);
      width: 100%; outline: none; transition: border-color 0.15s ease;
    }
    .preview-input:focus { border-color: var(--color-accent); }
    .preview-input::placeholder { color: var(--color-text-faint); }

    .preview-badge {
      display: inline-block; font-family: var(--font-mono);
      font-size: 10px; font-weight: 500; text-transform: uppercase;
      letter-spacing: 0.06em; padding: 3px 8px; border-radius: 4px;
    }
    .preview-badge.accent { background: var(--color-accent-light); color: var(--color-accent); }
    .preview-badge.success { background: #E8F5EE; color: var(--color-success); }
    .preview-badge.warning { background: #FEF3CD; color: var(--color-warning); }
    .preview-badge.danger { background: #FDE8E8; color: var(--color-danger); }
    .preview-badge.neutral { background: var(--color-surface); color: var(--color-text-secondary); }

    .preview-alert {
      padding: 12px 16px; border-radius: 8px; font-size: 13px;
      display: flex; align-items: center; gap: 8px; width: 100%;
    }
    .preview-alert.success { background: #E8F5EE; color: var(--color-success); border: 1px solid #A3D7C1; }
    .preview-alert.warning { background: #FEF3CD; color: var(--color-warning); border: 1px solid #F5D77B; }
    .preview-alert.danger { background: #FDE8E8; color: var(--color-danger); border: 1px solid #F0A0A0; }

    .preview-toggle {
      width: 40px; height: 22px; border-radius: 11px;
      background: var(--color-border); cursor: pointer;
      position: relative; transition: background 0.2s ease;
    }
    .preview-toggle.on { background: var(--color-accent); }
    .preview-toggle-knob {
      width: 18px; height: 18px; border-radius: 50%;
      background: #fff; position: absolute; top: 2px; left: 2px;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .preview-toggle.on .preview-toggle-knob { transform: translateX(18px); }

    .preview-table { width: 100%; border-collapse: collapse; }
    .preview-table th {
      font-family: var(--font-mono); font-size: 10px;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-faint); text-align: left;
      padding: 8px 12px; border-bottom: 1px solid var(--color-border);
    }
    .preview-table td {
      font-size: 13px; padding: 10px 12px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
    }
    .preview-table tr { transition: background 0.15s ease; }
    .preview-table tbody tr:hover { background: rgba(42,122,91,0.03); }

    /* ── Apps Panel ─────────────────────────────────── */
    .app-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border: 1px solid var(--color-border);
      border-radius: 10px; margin-bottom: 8px;
      transition: border-color 0.15s ease;
    }
    .app-row:hover { border-color: var(--color-border-light); }
    .app-name { font-weight: 500; font-size: 14px; }
    .app-meta {
      font-family: var(--font-mono); font-size: 11px;
      color: var(--color-text-secondary); margin-left: 8px;
    }
    .app-actions { display: flex; gap: 6px; align-items: center; }
    .app-status {
      font-family: var(--font-mono); font-size: 10px;
      color: var(--color-text-faint); margin-right: 8px;
    }

    /* ── Toast ──────────────────────────────────────── */
    .toast {
      position: fixed; bottom: 24px; right: 24px;
      background: var(--color-text); color: var(--color-bg);
      font-size: 13px; padding: 10px 20px; border-radius: 8px;
      opacity: 0; transform: translateY(8px);
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: none; z-index: 100;
      font-family: var(--font-body);
    }
    .toast.show { opacity: 1; transform: translateY(0); pointer-events: auto; }

    /* ── Responsive ─────────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { padding: 24px 16px 80px; }
      .comp-grid { grid-template-columns: 1fr; }
      .token-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="shell">
  <!-- Top Bar -->
  <div class="topbar">
    <div class="topbar-brand">Leonardo</div>
    <div class="agent-bar">
      <span class="agent-bar-icon">\u2318</span>
      <input type="text" id="agentInput" placeholder="Describe a change\u2026 \u201cmake accent warmer\u201d, \u201cadd a tooltip component\u201d" />
    </div>
    <div class="topbar-actions">
      <button class="topbar-btn" onclick="saveTokens()">Save</button>
      <button class="topbar-btn primary" onclick="pushAll()">Push All</button>
    </div>
  </div>

  <div class="body">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-section">Tokens</div>
      <div class="sidebar-item active" data-panel="colors">
        <span class="sidebar-icon">\u25CF</span> Colors
      </div>
      <div class="sidebar-item" data-panel="typography">
        <span class="sidebar-icon">Aa</span> Typography
      </div>
      <div class="sidebar-item" data-panel="spacing">
        <span class="sidebar-icon">\u2506</span> Spacing
      </div>
      <div class="sidebar-item" data-panel="motion">
        <span class="sidebar-icon">\u279C</span> Motion
      </div>
      <div class="sidebar-section">Preview</div>
      <div class="sidebar-item" data-panel="components">
        <span class="sidebar-icon">\u25A1</span> Components
      </div>
      <div class="sidebar-section">System</div>
      <div class="sidebar-item" data-panel="apps">
        <span class="sidebar-icon">\u26A1</span> Apps
      </div>
      <div class="sidebar-item" data-panel="assets">
        <span class="sidebar-icon">\u2193</span> Assets
      </div>
    </div>

    <!-- Main -->
    <div class="main">

      <!-- COLORS PANEL -->
      <div id="panel-colors" class="panel active">
        <div class="panel-title">Colors</div>
        <div class="panel-desc">Edit brand colors and scales. Changes update the component previews in real-time.</div>

        <div class="section-label">Brand</div>
        <div class="token-grid" id="brand-colors"></div>

        <div class="section-label">Semantic</div>
        <div class="token-grid" id="semantic-colors"></div>

        <div class="section-label">Accent Scale</div>
        <div class="scale-strip" id="accent-scale"></div>

        <div class="section-label">Gray Scale</div>
        <div class="scale-strip" id="gray-scale"></div>
      </div>

      <!-- TYPOGRAPHY PANEL -->
      <div id="panel-typography" class="panel">
        <div class="panel-title">Typography</div>
        <div class="panel-desc">Font families, type scale, and weight system.</div>

        <div class="section-label">Font Families</div>
        <div class="font-card">
          <div class="font-card-label">Display / Headings</div>
          <div style="font-family:var(--font-serif);font-size:clamp(1.6rem,1.5rem + 0.8vw,2rem);font-weight:400;letter-spacing:-0.02em">Cormorant Garamond</div>
        </div>
        <div class="font-card">
          <div class="font-card-label">Body / UI</div>
          <div style="font-family:var(--font-body);font-size:14px">DM Sans \u2014 The quick brown fox jumps over the lazy dog. 0123456789</div>
        </div>
        <div class="font-card">
          <div class="font-card-label">Labels / Code</div>
          <div style="font-family:var(--font-mono);font-size:12px">DM Mono \u2014 The quick brown fox jumps over the lazy dog. 0123456789</div>
        </div>

        <div class="section-label">Type Scale</div>
        <div id="type-scale"></div>
      </div>

      <!-- SPACING PANEL -->
      <div id="panel-spacing" class="panel">
        <div class="panel-title">Spacing</div>
        <div class="panel-desc">Base unit and spacing scale. All spacing derives from ${spacing.base}${spacing.unit} base.</div>
        <div class="section-label">Scale</div>
        <div style="display:flex;gap:4px;align-items:flex-end">
          ${[1,2,3,4,6,8,12,16,24,32].map(m => {
            const px = spacing.base * m;
            return `<div style="text-align:center">
              <div style="width:${Math.min(px, 80)}px;height:${Math.min(px, 80)}px;background:var(--color-accent-light);border:1px solid var(--color-accent);border-radius:4px;margin:0 auto 4px"></div>
              <span style="font-family:var(--font-mono);font-size:9px;color:var(--color-text-faint)">${px}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="section-label">Scrollbar</div>
        <div class="token-grid">
          <div class="token-row"><div class="token-info"><div class="token-name">Width</div><div class="token-value">${spacing.scrollbar.width}</div></div></div>
          <div class="token-row"><div class="token-info"><div class="token-name">Thumb Radius</div><div class="token-value">${spacing.scrollbar.thumbRadius}</div></div></div>
        </div>
        <div class="section-label">Focus Ring</div>
        <div class="token-grid">
          <div class="token-row"><div class="token-info"><div class="token-name">Outline Width</div><div class="token-value">${spacing.focus.outlineWidth}</div></div></div>
          <div class="token-row"><div class="token-info"><div class="token-name">Outline Offset</div><div class="token-value">${spacing.focus.outlineOffset}</div></div></div>
        </div>
      </div>

      <!-- MOTION PANEL -->
      <div id="panel-motion" class="panel">
        <div class="panel-title">Motion</div>
        <div class="panel-desc">Easing curves, keyframe animations, and transitions.</div>
        <div class="section-label">Easing</div>
        <div class="token-grid">
          ${Object.entries(motion.easing).map(([k, v]) => `
            <div class="token-row">
              <div class="token-info"><div class="token-name">${k.replace('--','')}</div><div class="token-value">${v}</div></div>
            </div>`).join('')}
        </div>
        <div class="section-label">Transitions</div>
        <div class="token-grid">
          ${Object.entries(motion.transitions).map(([k, v]) => `
            <div class="token-row">
              <div class="token-info"><div class="token-name">${k}</div><div class="token-value">${v}</div></div>
            </div>`).join('')}
        </div>
        <div class="section-label">Animations</div>
        <div class="token-grid">
          ${Object.entries(motion.animations).map(([k, v]) => `
            <div class="token-row">
              <div class="token-info"><div class="token-name">${k}</div><div class="token-value">${v}</div></div>
            </div>`).join('')}
        </div>
      </div>

      <!-- COMPONENTS PANEL -->
      <div id="panel-components" class="panel">
        <div class="panel-title">Components</div>
        <div class="panel-desc">Live preview of components using current tokens. Edit colors or type and watch these update.</div>

        <div class="comp-grid">
          <!-- Buttons -->
          <div class="comp-card">
            <div class="comp-card-title">Buttons</div>
            <div class="comp-row">
              <button class="preview-btn primary">Primary</button>
              <button class="preview-btn secondary">Secondary</button>
              <button class="preview-btn ghost">Ghost</button>
            </div>
            <div class="comp-row">
              <button class="preview-btn primary sm">Small</button>
              <button class="preview-btn danger sm">Danger</button>
              <button class="preview-btn secondary sm" disabled>Disabled</button>
            </div>
          </div>

          <!-- Card -->
          <div class="comp-card">
            <div class="comp-card-title">Card</div>
            <div class="preview-card">
              <div class="preview-card-title">Card Title</div>
              <div class="preview-card-desc">A card component using surface color, border, and text hierarchy tokens.</div>
            </div>
          </div>

          <!-- Input -->
          <div class="comp-card">
            <div class="comp-card-title">Text Input</div>
            <div class="comp-row">
              <input class="preview-input" placeholder="Placeholder text\u2026" />
            </div>
            <div class="comp-row" style="margin-top:8px">
              <input class="preview-input" value="Filled input" />
            </div>
          </div>

          <!-- Badges -->
          <div class="comp-card">
            <div class="comp-card-title">Badges</div>
            <div class="comp-row">
              <span class="preview-badge accent">Accent</span>
              <span class="preview-badge success">Success</span>
              <span class="preview-badge warning">Warning</span>
              <span class="preview-badge danger">Danger</span>
              <span class="preview-badge neutral">Neutral</span>
            </div>
          </div>

          <!-- Alerts -->
          <div class="comp-card">
            <div class="comp-card-title">Alerts</div>
            <div class="comp-row" style="flex-direction:column;gap:8px">
              <div class="preview-alert success">\u2713 Changes saved successfully</div>
              <div class="preview-alert warning">\u26A0 Review required before push</div>
              <div class="preview-alert danger">\u2717 Build failed \u2014 check token syntax</div>
            </div>
          </div>

          <!-- Toggle -->
          <div class="comp-card">
            <div class="comp-card-title">Toggle</div>
            <div class="comp-row" style="gap:16px">
              <div style="display:flex;align-items:center;gap:8px">
                <div class="preview-toggle on" onclick="this.classList.toggle('on')"><div class="preview-toggle-knob"></div></div>
                <span style="font-size:13px">Enabled</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="preview-toggle" onclick="this.classList.toggle('on')"><div class="preview-toggle-knob"></div></div>
                <span style="font-size:13px">Disabled</span>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="comp-card" style="grid-column:1/-1">
            <div class="comp-card-title">Table</div>
            <table class="preview-table">
              <thead><tr><th>Name</th><th>Framework</th><th>Port</th><th>Status</th></tr></thead>
              <tbody>
                ${Object.entries(apps).slice(0, 4).map(([, cfg]) => `
                <tr>
                  <td style="font-weight:500">${cfg.label}</td>
                  <td><code style="font-size:12px">${cfg.framework}</code></td>
                  <td>${cfg.port || '\u2014'}</td>
                  <td><span class="preview-badge success">synced</span></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- APPS PANEL -->
      <div id="panel-apps" class="panel">
        <div class="panel-title">Connected Apps</div>
        <div class="panel-desc">Push token changes to all apps, or push individually. Pull latest from git.</div>

        <div style="display:flex;gap:8px;margin-bottom:24px">
          <button class="topbar-btn primary" onclick="pushAll()">Push All Apps</button>
          <button class="topbar-btn" onclick="gitPull()">Git Pull</button>
          <button class="topbar-btn" onclick="gitStatus()">Git Status</button>
        </div>

        <div id="apps-list">
          ${Object.entries(apps).map(([key, cfg]) => `
            <div class="app-row" id="app-${key}">
              <div>
                <span class="app-name">${cfg.label}</span>
                <span class="app-meta">${cfg.framework} ${cfg.port ? ':' + cfg.port : ''}</span>
              </div>
              <div class="app-actions">
                <span class="app-status" id="status-${key}">\u2014</span>
                <button class="topbar-btn" onclick="pushApp('${key}')" style="font-size:9px;padding:4px 10px">Push</button>
              </div>
            </div>`).join('')}
        </div>

        <div class="section-label">Git</div>
        <pre id="git-output" style="font-family:var(--font-mono);font-size:12px;color:var(--color-text-secondary);background:var(--color-surface);padding:16px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;min-height:60px">\u2014</pre>
      </div>

      <!-- ASSETS PANEL -->
      <div id="panel-assets" class="panel">
        <div class="panel-title">Dist Assets</div>
        <div class="panel-desc">Download compiled CSS files for manual integration.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="./gravity.css" class="topbar-btn" style="text-decoration:none;display:inline-block">gravity.css</a>
          <a href="./gravity-tw4.css" class="topbar-btn" style="text-decoration:none;display:inline-block">gravity-tw4.css</a>
          <a href="./gravity-tw4-inline.css" class="topbar-btn" style="text-decoration:none;display:inline-block">gravity-tw4-inline.css</a>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// ── State ──────────────────────────────────────────────
const STATE = {
  tokens: ${embeddedTokens},
  apps: ${embeddedApps},
  dirty: false
};

// ── Navigation ─────────────────────────────────────────
document.querySelectorAll('.sidebar-item[data-panel]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('panel-' + item.dataset.panel).classList.add('active');
  });
});

// ── Toast ──────────────────────────────────────────────
function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ── Color Editors ──────────────────────────────────────
function renderColorGrid(containerId, obj, tokenPath) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const [key, value] of Object.entries(obj)) {
    if (!key.startsWith('--')) continue;
    const name = key.replace(/^--color-/, '');
    const row = document.createElement('div');
    row.className = 'token-row';
    row.innerHTML =
      '<div class="token-swatch" style="background:' + value + '">' +
        '<input type="color" value="' + toHex(value) + '" data-token="' + key + '" data-path="' + tokenPath + '">' +
      '</div>' +
      '<div class="token-info">' +
        '<div class="token-name">' + name + '</div>' +
        '<div class="token-value">' + value + '</div>' +
      '</div>';
    row.querySelector('input').addEventListener('input', onColorChange);
    container.appendChild(row);
  }
}

function renderScale(containerId, obj) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const [key, value] of Object.entries(obj)) {
    const step = key.replace(/--color-\\w+-/, '');
    const chip = document.createElement('div');
    chip.className = 'scale-chip';
    chip.innerHTML =
      '<div class="scale-chip-swatch" style="background:' + value + '">' +
        '<input type="color" value="' + toHex(value) + '" data-token="' + key + '">' +
      '</div>' +
      '<div class="scale-chip-label">' + step + '</div>';
    chip.querySelector('input').addEventListener('input', onScaleChange);
    container.appendChild(chip);
  }
}

function onColorChange(e) {
  const token = e.target.dataset.token;
  const val = e.target.value;
  document.documentElement.style.setProperty(token, val);
  e.target.parentElement.style.background = val;
  e.target.closest('.token-row').querySelector('.token-value').textContent = val;

  // Update state
  const path = e.target.dataset.path;
  if (path) updateNestedToken(STATE.tokens.color, path, token, val);
  STATE.dirty = true;
}

function onScaleChange(e) {
  const token = e.target.dataset.token;
  const val = e.target.value;
  document.documentElement.style.setProperty(token, val);
  e.target.parentElement.style.background = val;

  // Update state in scales
  for (const scale of Object.values(STATE.tokens.color.scales)) {
    if (scale[token] !== undefined) { scale[token] = val; break; }
  }
  STATE.dirty = true;
}

function updateNestedToken(obj, path, token, val) {
  const parts = path.split('.');
  let ref = obj;
  for (const p of parts) ref = ref[p];
  if (ref) ref[token] = val;
}

function toHex(color) {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color.length === 4
    ? '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3]
    : color;
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const m = color.match(/[\\d.]+/g);
    if (m && m.length >= 3) {
      const r = parseInt(m[0]).toString(16).padStart(2,'0');
      const g = parseInt(m[1]).toString(16).padStart(2,'0');
      const b = parseInt(m[2]).toString(16).padStart(2,'0');
      return '#' + r + g + b;
    }
  }
  return '#888888';
}

// ── Type Scale ─────────────────────────────────────────
function renderTypeScale() {
  const container = document.getElementById('type-scale');
  container.innerHTML = '';
  for (const [key, value] of Object.entries(STATE.tokens.typography.scale)) {
    const name = key.replace('--text-', '');
    const row = document.createElement('div');
    row.className = 'type-preview';
    row.innerHTML =
      '<div class="type-label">' + name + '</div>' +
      '<div class="type-sample" style="font-size:' + value + '">The quick brown fox jumps over the lazy dog</div>';
    container.appendChild(row);
  }
}

// ── Init Renders ───────────────────────────────────────
renderColorGrid('brand-colors', STATE.tokens.color.brand, 'brand');
renderColorGrid('semantic-colors', STATE.tokens.color.semantic, 'semantic');
renderScale('accent-scale', STATE.tokens.color.scales.indigo);
renderScale('gray-scale', STATE.tokens.color.scales.gray);
renderTypeScale();

// ── API Calls ──────────────────────────────────────────
async function saveTokens() {
  if (!STATE.dirty) { toast('No changes to save'); return; }
  try {
    await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: 'color.json', data: STATE.tokens.color })
    });
    STATE.dirty = false;
    toast('Tokens saved');
  } catch (e) { toast('Save failed: ' + e.message); }
}

async function pushAll() {
  toast('Pushing to all apps\u2026');
  try {
    const res = await fetch('/api/push', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      toast('Push complete');
      document.getElementById('git-output').textContent = data.output || 'Done';
    } else {
      toast('Push failed');
      document.getElementById('git-output').textContent = data.error || 'Unknown error';
    }
  } catch (e) { toast('Push failed: ' + e.message); }
}

async function pushApp(key) {
  const statusEl = document.getElementById('status-' + key);
  statusEl.textContent = 'pushing\u2026';
  try {
    const res = await fetch('/api/push', { method: 'POST' });
    const data = await res.json();
    statusEl.textContent = data.ok ? 'pushed' : 'failed';
    setTimeout(() => statusEl.textContent = '\u2014', 3000);
  } catch (e) { statusEl.textContent = 'error'; }
}

async function gitPull() {
  toast('Pulling latest\u2026');
  try {
    const res = await fetch('/api/git', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pull' })
    });
    const data = await res.json();
    document.getElementById('git-output').textContent = data.output || data.error || JSON.stringify(data);
    toast(data.ok ? 'Pull complete' : 'Pull failed');
  } catch (e) { toast('Pull failed: ' + e.message); }
}

async function gitStatus() {
  try {
    const res = await fetch('/api/git');
    const data = await res.json();
    document.getElementById('git-output').textContent =
      'Branch: ' + data.branch + '\\n\\nStatus:\\n' + data.status + '\\n\\nRecent commits:\\n' + data.log;
  } catch (e) {
    document.getElementById('git-output').textContent = 'Error: ' + e.message;
  }
}

// ── Agent Bar ──────────────────────────────────────────
document.getElementById('agentInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    const cmd = this.value.trim();
    toast('Agent command: "' + cmd + '" \u2014 processing on server requires Claude integration');
    this.value = '';
  }
});
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
