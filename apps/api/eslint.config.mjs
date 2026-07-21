import { nestConfig } from '@root/eslint-config/nest';

const moduleEncapsulationPattern = [
  [
    '@/modules/*/application/**',
    '@/modules/*/domain/**',
    '@/modules/*/infrastructure/**',
    '@/modules/*/presentation/**',
  ],
  'Do not deep-import another module. Use its public module API.',
];

const architectureRule = (patterns) => [
  'error',
  {
    patterns: [...patterns, moduleEncapsulationPattern].map(
      ([group, message]) => ({ group, message }),
    ),
  },
];

export default [
  { ignores: ['dist/**', 'drizzle/**'] },
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': architectureRule([
        [
          ['@nestjs/**', 'drizzle-orm/**', 'class-validator'],
          'Domain code must remain framework and persistence independent.',
        ],
        [
          ['../application/**', '../infrastructure/**', '../presentation/**'],
          'The domain layer cannot depend on outer module layers.',
        ],
      ]),
    },
  },
  {
    files: ['src/modules/*/application/**/*.ts'],
    rules: {
      'no-restricted-imports': architectureRule([
        [
          ['@nestjs/**', '@root/shared/**', '@/modules/**'],
          'Application code may depend only on its domain ports and models.',
        ],
        [
          ['../infrastructure/**', '../presentation/**'],
          'Application code may depend on domain code, not infrastructure or presentation.',
        ],
      ]),
    },
  },
  {
    files: ['src/modules/*/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': architectureRule([
        [
          ['../infrastructure/**'],
          'Presentation code must call application services instead of infrastructure directly.',
        ],
      ]),
    },
  },
  {
    files: ['src/database/**/*.ts', 'src/config/**/*.ts'],
    rules: {
      'no-restricted-imports': architectureRule([
        [
          ['../modules/**', '@/modules/**'],
          'Core infrastructure cannot depend on business modules.',
        ],
      ]),
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // False positive on `expect(mock.method).toHaveBeenCalledWith(...)` —
      // the rule can't tell a vi.fn() mock apart from a real unbound method.
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
