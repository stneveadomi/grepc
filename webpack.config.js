//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'webworker', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './ext-src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
    mainFields: ['browser', 'module', 'main'],
    //modules: ['node_modules']
    // fallback: {
    //   assert: require.resolve('assert'),
    //   buffer: require.resolve('buffer'),
    //   console: require.resolve('console-browserify'),
    //   constants: require.resolve('constants-browserify'),
    //   crypto: require.resolve('crypto-browserify'),
    //   domain: require.resolve('domain-browser'),
    //   events: require.resolve('events'),
    //   http: require.resolve('stream-http'),
    //   https: require.resolve('https-browserify'),
    //   os: require.resolve('os-browserify/browser'),
    //   path: require.resolve('path-browserify'),
    //   punycode: require.resolve('punycode'),
    //   process: require.resolve('process/browser'),
    //   querystring: require.resolve('querystring-es3'),
    //   stream: require.resolve('stream-browserify'),
    //   string_decoder: require.resolve('string_decoder'),
    //   sys: require.resolve('util'),
    //   timers: require.resolve('timers-browserify'),
    //   tty: require.resolve('tty-browserify'),
    //   url: require.resolve('url'),
    //   util: require.resolve('util'),
    //   vm: require.resolve('vm-browserify'),
    //   zlib: require.resolve('browserify-zlib'),
    // },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                  //"module": "es6", // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
              }
            }
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];