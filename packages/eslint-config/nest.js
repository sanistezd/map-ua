import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { commonRules, importPlugins } from './base.js';

export const nestConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: { globals: globals.node },
    plugins: importPlugins,
    rules: {
      ...commonRules,
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
);
