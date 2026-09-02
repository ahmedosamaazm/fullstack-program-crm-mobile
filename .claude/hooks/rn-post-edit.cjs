#!/usr/bin/env node
// Claude Code PostToolUse hook (Write|Edit) — the React Native analogue of the global
// dart-post-edit.cjs. Dispatches on the edited file:
//
//   .ts / .tsx under src/ or scripts/  -> eslint --fix on that file. Remaining eslint errors
//                                          are fed back to the model (exit 2) — eslint.config.js
//                                          enforces hard rules 2–5, so a violation is caught at
//                                          edit time, not review.
//                                          Prettier is deliberately NOT run here: the repo has no
//                                          prettier config and was never formatted with it
//                                          (`prettier --check src` flags ~145 files), so a per-edit
//                                          run would bury each change under a whole-file rewrite.
//                                          Re-add `prettier --write` once a .prettierrc exists and
//                                          a one-time format commit has landed.
//   src/core/lib/i18n/locales/*.json   -> en.json and ar.json must have IDENTICAL key trees.
//                                          Arabic-first app: a missing Arabic key ships as an
//                                          English fallback silently. Mismatch -> exit 2.
//   package.json                       -> `npx expo install --check` — every Expo/RN dep must
//                                          be at the SDK-compatible version (CLAUDE.md: always
//                                          `npx expo install`, never plain `npm install`).
//
// Exit 0 = fine. Exit 2 + stderr = surface the problem to the model so it fixes it now.
// Anything else is intentionally a no-op.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function run(cmd, args, opts = {}) {
  // shell:true so `npx` resolves to npx.cmd on Windows and plain npx elsewhere.
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: true,
    cwd: opts.cwd,
    timeout: opts.timeout || 90_000,
    windowsHide: true,
  });
}

function findRepoRoot(start) {
  let dir = path.dirname(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'app.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Flatten a JSON object to a sorted, de-duplicated list of dotted key paths, with i18next
 * plural suffixes collapsed onto their base key. Arabic has six CLDR plural categories
 * (`_zero` … `_other`) and English two, so `rowLabel_few` existing only in ar.json is
 * correct — what must match is that BOTH languages define `rowLabel` at all.
 */
const PLURAL = /_(zero|one|two|few|many|other)$/;
function keyPaths(obj, prefix = '', out = new Set()) {
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) keyPaths(v, full, out);
    else out.add(full.replace(PLURAL, ''));
  }
  return [...out].sort();
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw.replace(/^﻿/, ''));
  } catch {
    process.exit(0);
  }

  const p = input && input.tool_input && input.tool_input.file_path;
  if (!p || !fs.existsSync(p)) process.exit(0);

  const norm = String(p).replace(/\\/g, '/');
  const root = findRepoRoot(p);
  if (!root) process.exit(0);

  // ---- 1. TypeScript: lint-fix, then report what's left ---------------------------------
  if (/\.(ts|tsx)$/.test(norm) && /\/(src|scripts)\//.test(norm)) {
    const lint = run('npx', ['--no-install', 'eslint', '--fix', JSON.stringify(p)], { cwd: root, timeout: 120_000 });
    if (lint.status !== 0) {
      const out = `${lint.stdout || ''}${lint.stderr || ''}`.trim();
      process.stderr.write(
        `eslint still reports problems in ${path.relative(root, p)} after --fix. ` +
          `These are hard-rule violations (see eslint.config.js + CLAUDE.md "Hard rules") — fix them before continuing:\n${out}\n`,
      );
      process.exit(2);
    }
    process.exit(0);
  }

  // ---- 2. Locale JSON: en.json and ar.json must carry the same key tree -----------------
  if (/\/src\/core\/lib\/i18n\/locales\/(en|ar)\.json$/.test(norm)) {
    const dir = path.dirname(p);
    const files = { en: path.join(dir, 'en.json'), ar: path.join(dir, 'ar.json') };
    const parsed = {};
    for (const [lang, f] of Object.entries(files)) {
      try {
        parsed[lang] = JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (e) {
        process.stderr.write(`${path.relative(root, f)} is not valid JSON: ${e.message}\n`);
        process.exit(2);
      }
    }
    const en = new Set(keyPaths(parsed.en));
    const ar = new Set(keyPaths(parsed.ar));
    const onlyEn = [...en].filter((k) => !ar.has(k));
    const onlyAr = [...ar].filter((k) => !en.has(k));
    if (onlyEn.length || onlyAr.length) {
      const lines = [
        'Locale key trees diverge — every key must exist in BOTH en.json and ar.json (Arabic-first app; a missing Arabic key silently falls back to English).',
      ];
      if (onlyEn.length) lines.push(`  missing from ar.json (${onlyEn.length}):\n    ${onlyEn.join('\n    ')}`);
      if (onlyAr.length) lines.push(`  missing from en.json (${onlyAr.length}):\n    ${onlyAr.join('\n    ')}`);
      process.stderr.write(lines.join('\n') + '\n');
      process.exit(2);
    }
    process.exit(0);
  }

  // ---- 3. package.json: dependency versions must match the Expo SDK ---------------------
  if (path.basename(p) === 'package.json' && path.dirname(p) === root) {
    const check = run('npx', ['--no-install', 'expo', 'install', '--check'], { cwd: root, timeout: 120_000 });
    if (check.status !== 0) {
      // Drop Expo's `env: load .env` / `env: export …` preamble — variable names only, but
      // there is no reason to echo anything about .env into the transcript.
      const out = `${check.stdout || ''}${check.stderr || ''}`
        .split('\n')
        .filter((l) => !/^env: /.test(l))
        .join('\n')
        .trim();
      process.stderr.write(
        'package.json changed and `npx expo install --check` reports SDK-incompatible versions. ' +
          'Dependencies here are added with `npx expo install <pkg>`, never plain `npm install` (CLAUDE.md "Commands"). ' +
          'Run `npx expo install --fix`, and say whether the package needs a development build.\n' +
          out +
          '\n',
      );
      process.exit(2);
    }
    process.exit(0);
  }

  process.exit(0);
});
