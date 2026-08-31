import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      'generated/',
      '**/*.d.ts',
      'coverage/',
      'prisma.config.ts',
      'vitest.config.ts',
      'eslint.config.js',
    ],
  },

  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules (strict with projectService for typed linting)
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.ts', 'tests/**/*.ts', 'prisma/**/*.ts'],
  })),

  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'prisma/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforce functional style
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // TypeScript strictness
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],

      // Disallow default exports in application code
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message:
            'Prefer named exports. Default exports make refactoring harder and reduce IDE discoverability.',
        },
      ],
    },
  },

  // Overrides for Prisma dynamic types
  {
    files: ['prisma/**/*.ts', 'src/lib/prisma.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  // Prettier must be last — disables all formatting-related ESLint rules
  eslintConfigPrettier,
);
