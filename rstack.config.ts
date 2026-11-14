import { execSync } from 'node:child_process';
import { GenerateSW } from '@aaroon/workbox-rspack-plugin';
import { type RsbuildPlugin } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSolid } from '@rsbuild/plugin-solid';
import solid from 'eslint-plugin-solid';
import { define } from 'rstack';

function getGitReference() {
  if (process.env.NODE_ENV === 'development') {
    return 'main';
  }
  try {
    return execSync('git describe --tags --exact-match HEAD').toString().trim();
  } catch (_e) {
    console.warn('Failed to get git tags, using commit hash instead');
  }
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (_e) {
    console.warn('Failed to get git commit hash');
  }
  return 'main';
}

const GIT_REFERENCE = getGitReference();

define.app({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
    pluginSass(),
  ],
  html: {
    template: './src/app/index.html',
    title: '',
  },
  output: {
    polyfill: 'usage',
    minify: {
      jsOptions: {
        minimizerOptions: {
          compress: {
            passes: 4,
          },
        },
      },
      css: true,
    },
  },
  server: {
    port: process.env.NODE_ENV === 'development' ? 3000 : 8080,
    publicDir: false,
  },

  source: {
    entry: {
      index: './src/app/index.tsx',
    },
    define: {
      IS_TAURI: false,
      CONFIG_ENABLE_PWA: true,
      'import.meta.env.GIT_REFERENCE': JSON.stringify(GIT_REFERENCE),
      'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
  },
  performance: {
    removeConsole: ['log'],
  },

  environments: {
    browser: {
      output: {
        distPath: {
          root: 'dist/browser',
        },
        copy: [{ from: './public', to: '.' }],
      },
      tools: {
        rspack: {
          plugins: [
            ...(process.env.NODE_ENV === 'development'
              ? []
              : [
                  new GenerateSW({
                    cacheId: 'puzzle-print',
                    cleanupOutdatedCaches: true,
                  }),
                ]),
          ],
        },
      },
      plugins: [
        {
          name: 'web-manifest-plugin',
          setup(api) {
            api.processAssets({ stage: 'additional' }, async ({ sources, compilation }) => {
              const { default: rawManifest } = await import('./src/app/manifest.json', {
                with: { type: 'json' },
              });
              const manifest: Record<string, unknown> = { ...rawManifest };
              delete manifest.$schema;
              const localeManifest = (await import('./scripts/manifest/localized.ts')).default;
              const mergedManifest = Object.assign(manifest, localeManifest);
              const source = new sources.RawSource(
                JSON.stringify(mergedManifest).replaceAll(
                  '<%= process.env.BASE_URL %>',
                  api.getRsbuildConfig('current').output?.assetPrefix ?? '/',
                ),
              );
              compilation.emitAsset('manifest.json', source);
            });
          },
        } satisfies RsbuildPlugin,
      ],
    },
    tauri: {
      output: {
        distPath: {
          root: 'dist/tauri',
        },
        copy: [],
      },
      source: {
        define: {
          IS_TAURI: true,
          CONFIG_ENABLE_PWA: false,
        },
      },
    },
  },
});

define.fmt({
  printWidth: 120,
  singleQuote: true,
  // markdown 由 rumdl、TOML 由 tombi 负责，YAML 保持现状，不让 Prettier 接管
  ignorePatterns: ['**/*.md', '**/*.yml', '**/*.yaml', '**/*.toml'],
});

define.lint((lint) => [
  lint.globalIgnores(['dist/**', 'src-tauri/gen/**', 'src-tauri/target/**']),
  lint.js.configs.recommended,
  lint.ts.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { solid },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Solid 把 <div ref={localVar}> 编译成对 localVar 的赋值，此规则看不到这层赋值
      'no-unassigned-vars': 'off',
      // Solid 惯用 `this.dep.length;` 在 getter 里显式建立依赖，不是无用表达式
      '@typescript-eslint/no-unused-expressions': 'off',
      'solid/no-destructure': 'error',
      'solid/no-react-specific-props': 'error',
      'solid/no-innerhtml': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/prefer-for': 'error',
    },
  },
]);
