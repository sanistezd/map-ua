import { nextConfig } from '@root/eslint-config/next';

/** Deep imports past a slice's public `index.ts` — flat or grouped features. */
const deepSliceImportPatterns = [
  '@/shared/*/**',
  '@/entities/*/**',
  '@/widgets/*/**',
  // Flat feature slices: features/<slice>/{ui,model,api,lib}/...
  '@/features/*/ui/**',
  '@/features/*/model/**',
  '@/features/*/api/**',
  '@/features/*/lib/**',
  // Grouped feature slices: features/<group>/<slice>/{ui,model,api,lib}/...
  '@/features/*/*/ui/**',
  '@/features/*/*/model/**',
  '@/features/*/*/api/**',
  '@/features/*/*/lib/**',
];

const publicApiPattern = {
  group: deepSliceImportPatterns,
  message: 'Import a slice through its public index instead of a deep path.',
};

const restrictedLayers = (layers, message) => [
  'error',
  {
    patterns: [
      publicApiPattern,
      ...layers.map((layer) => ({ group: [`@/${layer}/**`], message })),
    ],
  },
];

const config = [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...nextConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [publicApiPattern],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedLayers(
        ['entities', 'features', 'widgets', 'app'],
        'The shared layer cannot depend on higher FSD layers.',
      ),
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedLayers(
        ['features', 'widgets', 'app'],
        'An entity cannot depend on features, widgets, or app.',
      ),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedLayers(
        ['widgets', 'app'],
        'A feature cannot depend on widgets or app.',
      ),
    },
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedLayers(
        ['app'],
        'A widget cannot depend on the app layer.',
      ),
    },
  },
  {
    files: ['src/middleware.ts', 'src/app/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: deepSliceImportPatterns.filter(
                (p) => p !== '@/shared/*/**',
              ),
              message:
                'Import a slice through its public index instead of a deep path.',
            },
          ],
        },
      ],
    },
  },
];

export default config;
