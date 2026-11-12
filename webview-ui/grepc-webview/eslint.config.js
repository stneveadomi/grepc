// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
    {
        files: ['src/**/*.ts'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic,
            ...angular.configs.tsRecommended,
            eslintConfigPrettier,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase',
                },
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case',
                },
            ],
            // angular-eslint 20 dropped these from `tsRecommended`; keep enforcing them as before.
            '@angular-eslint/component-class-suffix': 'error',
            '@angular-eslint/directive-class-suffix': 'error',
            // angular-eslint 20 added `prefer-inject` to `tsRecommended`. The app uses constructor
            // injection throughout (including the Draggable/Droppable base classes that take
            // services via `super(...)`); moving to `inject()` is a separate refactor.
            '@angular-eslint/prefer-inject': 'off',
            // angular-eslint 22 adds this to `tsRecommended`. Angular 22 made OnPush the default
            // and its migration pinned every component to `ChangeDetectionStrategy.Eager` to keep
            // the previous behaviour (components rely on in-place mutation of shared rule
            // objects). Moving to OnPush is a separate, behaviour-changing refactor.
            '@angular-eslint/prefer-on-push-component-change-detection': 'off',
        },
    },
    {
        files: ['src/**/*.html'],
        extends: [
            ...angular.configs.templateRecommended,
            ...angular.configs.templateAccessibility,
        ],
        rules: {},
    },
    {
        ignores: ['node_modules', 'dist', '.angular'],
    },
);
