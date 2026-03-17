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
    `   Generated by gravity-core/build.js — DO NOT EDIT MANUALLY`,
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

  console.log('Built dist/:');
  console.log('  gravity.css');
  console.log('  gravity-tw4.css');
  console.log('  gravity-tw4-inline.css');
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
