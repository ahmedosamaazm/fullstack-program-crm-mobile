#!/usr/bin/env node
// Claude Code PreToolUse hook (Read|Write|Edit) — block access to files this repo says
// must never be hand-touched. The React Native analogue of the global dart-guard.cjs.
//
// Node rather than PowerShell/bash so Windows and macOS run the SAME file.
// Exit 2 + stderr = block the tool call and show the reason to the model.
//
// Rules enforced (each cites its source in the message):
//   - src/core/types/database.ts   CLAUDE.md hard rule 6: generated, never hand-edited
//   - .squad/secrets.yaml          CLAUDE.md: never read into context or echo
//   - /ios, /android               CLAUDE.md: native config goes in app.json only
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let input;
  try {
    // Strip a UTF-8 BOM — PowerShell prepends one when piping to a native command.
    input = JSON.parse(raw.replace(/^﻿/, ''));
  } catch {
    process.exit(0);
  }

  const p = input && input.tool_input && input.tool_input.file_path;
  if (!p) process.exit(0);

  const tool = (input.tool_name || '').toString();
  // Normalise to forward slashes so one set of patterns covers both platforms.
  const norm = String(p).replace(/\\/g, '/');

  let blocked = null;
  if (/\/\.squad\/secrets\.ya?ml$/.test(norm)) {
    blocked =
      'the squad-kit secrets file. It is gitignored and must never be read into context, echoed, or edited by Claude (CLAUDE.md "Working in this repo")';
  } else if (tool !== 'Read') {
    if (/\/src\/core\/types\/database\.ts$/.test(norm)) {
      blocked =
        'generated Supabase types (hard rule 6). Never hand-edit — run `npm run gen:types` to regenerate';
    } else if (/\/(ios|android)\/[^/]/.test(norm) && !/\/node_modules\//.test(norm)) {
      blocked =
        'a generated native folder. /ios and /android are gitignored; native config belongs in app.json (CLAUDE.md "Entry and fonts")';
    }
  }

  if (blocked) {
    process.stderr.write(`BLOCKED: ${p} is ${blocked}.\n`);
    process.exit(2);
  }
  process.exit(0);
});
