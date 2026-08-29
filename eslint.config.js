// Flat config, CommonJS — package.json has no "type": "module". The
// `typescript-eslint` meta-package isn't installed (only the plugin +
// parser), so this is composed by hand rather than via `tseslint.config()`.
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier');

const HEX_LITERAL = '/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/';

module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // 1. Single-font enforcement — only `Text.tsx`/`TextInput.tsx` may
      // import the raw react-native primitives; everywhere else must go
      // through the core `Text`/`TextInput` components.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message:
                "Import 'Text'/'TextInput' from '@/core/components' instead — they enforce the single-font rule.",
            },
          ],
          patterns: [
            {
              // Rule 4 (CLAUDE.md) — features are barrel-only, everywhere.
              group: ['@/features/*/*'],
              message: "Import from a feature's barrel ('@/features/<name>') instead of a deep path.",
            },
          ],
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          // 2. Colour literals — only theme/primitives.ts may contain hex.
          selector: `Literal[value=${HEX_LITERAL}]`,
          message: 'Hex colour literals belong only in core/lib/theme/primitives.ts — use a theme token.',
        },
        {
          // 3. fontWeight/fontFamily must never reach a style object outside
          // theme/** — Android does not synthesise weight for custom
          // families, so the two must never coexist off a resolved token.
          selector: 'Property[key.name=/^(fontWeight|fontFamily)$/]',
          message:
            "Don't set 'fontWeight'/'fontFamily' directly — use the `weight` prop on Text/TextInput, which resolves through theme/typography.ts.",
        },
        {
          // 4. Physical layout props are banned — logical (start/end) only,
          // so the app works in RTL. `Text.tsx` is the sole exception for
          // `textAlign`, carved out below.
          selector:
            'Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius|left|right)$/]',
          message: "Use logical layout props ('Start'/'End') instead — this app must work in RTL.",
        },
        {
          selector: "Property[key.name='textAlign'][value.value=/^(left|right)$/]",
          message:
            "Don't set a physical textAlign — use Text's `align` prop ('start'/'end'), which resolves through useDirection().",
        },
      ],
    },
  },
  {
    // Rule 3 (CLAUDE.md) — core never imports from features; the dependency
    // is one-way. Scoped to core only — route files and other features are
    // expected to import feature barrels.
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/*/*'],
              message: "'@/core/**' must never import from '@/features/**' — the dependency is one-way.",
            },
          ],
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message:
                "Import 'Text'/'TextInput' from '@/core/components' instead — they enforce the single-font rule.",
            },
          ],
        },
      ],
    },
  },
  {
    // The two sanctioned exceptions to the single-font import ban.
    files: ['src/core/components/Text.tsx', 'src/core/components/TextInput.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // The one file permitted to emit physical `left`/`right` via `textAlign`.
    files: ['src/core/components/Text.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${HEX_LITERAL}]`,
          message: 'Hex colour literals belong only in core/lib/theme/primitives.ts — use a theme token.',
        },
        {
          selector: 'Property[key.name=/^(fontWeight|fontFamily)$/]',
          message:
            "Don't set 'fontWeight'/'fontFamily' directly — use the `weight` prop on Text/TextInput, which resolves through theme/typography.ts.",
        },
        {
          selector:
            'Property[key.name=/^(marginLeft|marginRight|paddingLeft|paddingRight|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius|left|right)$/]',
          message: "Use logical layout props ('Start'/'End') instead — this app must work in RTL.",
        },
      ],
    },
  },
  {
    // theme/** legitimately builds `{ fontWeight, fontFamily }` theme
    // objects (ThemeProvider.tsx, typography.ts) — exempt the Property-key
    // ban there, but keep the hex-literal ban scoped to primitives.ts only.
    files: ['src/core/lib/theme/**/*.{ts,tsx}'],
    ignores: ['src/core/lib/theme/primitives.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${HEX_LITERAL}]`,
          message: 'Hex colour literals belong only in core/lib/theme/primitives.ts — use a theme token.',
        },
      ],
    },
  },
  {
    // The ONLY file in the repo permitted to contain colour literals.
    files: ['src/core/lib/theme/primitives.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  prettierConfig,
];
