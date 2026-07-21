import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

import { commonRules, importPlugins } from './base.js';

export const nextConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    plugins: importPlugins,
    rules: commonRules,
  },
];
