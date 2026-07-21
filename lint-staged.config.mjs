import path from 'node:path';

const quote = (file) => `"${file}"`;

const eslintFix = (appDir, filterName) => (files) => {
  const relativeFiles = files
    .map((file) => path.relative(appDir, file))
    .map(quote)
    .join(' ');
  return `pnpm --filter ${filterName} exec eslint --fix ${relativeFiles}`;
};

export default {
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'apps/web/**/*.{ts,tsx}': [
    eslintFix('apps/web', '@root/web'),
    'prettier --write',
  ],
  'apps/api/**/*.ts': [eslintFix('apps/api', '@root/api'), 'prettier --write'],
  'packages/**/*.{ts,tsx}': ['prettier --write'],
};
