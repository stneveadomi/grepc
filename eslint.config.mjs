import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    {
        files: ['ext-src/**/*.{js,mjs,cjs,ts}'],
    },
    {
        languageOptions: { globals: globals.browser },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        // Carried over from the legacy .eslintrc.json, which ESLint 9+ never read once this file
        // existed. Listed after eslint-config-prettier because it turns `curly` off; the default
        // "all" option does not conflict with Prettier.
        rules: {
            curly: 'warn',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase'],
                },
            ],
        },
    },
];
