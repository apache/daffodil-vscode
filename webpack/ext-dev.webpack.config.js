/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict'

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require('path')
const unzip = require('unzip-stream')
const fs = require('fs')
const jsoncParse = require('jsonc-parser').parse

const localModulePath = (module) => {
  return path.resolve(__dirname, '../', 'src', module)
}
const localModuleAliases = {
  dataEditor: localModulePath('dataEditor'),
  tdmlEditor: localModulePath('tdmlEditor'),
  language: localModulePath('language'),
  launchWizard: localModulePath('launchWizard/launchWizard'),
  infoset: localModulePath('infoset'),
  rootCompletion: localModulePath('rootCompletion'),
}

const packageData = jsoncParse(
  fs.readFileSync(path.resolve('package.json')).toString()
)
const pkg_version = packageData['version']
const daffodilVersion = packageData['daffodilVersion']
const serverPackage = `daffodil-debugger-${daffodilVersion}-${pkg_version}`
const zipFilePath = path.resolve(
  `debugger/target/universal/${serverPackage}.zip`
)

module.exports = /** @type WebpackConfig */ {
  context: path.dirname(__dirname),
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  target: 'node', // vscode extensions run in a Node.js-context
  entry: {
    extension: './src/adapter/extension.ts',
  },
  resolve: {
    // support reading TypeScript and JavaScript files
    extensions: ['.ts', '.js'],
    alias: { ...localModuleAliases },
  },
  node: {
    __dirname: false, // leave the __dirname-behaviour intact
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            // configure TypeScript loader:
            // * enable sources maps for end-to-end source maps
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                sourceMap: true,
                declaration: false,
              },
            },
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed
  },
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, '../dist/ext'),
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../../[resource-path]',
    hashFunction: 'sha512',
    clean: true, // makes sure the output directory is remade
  },
  devtool: 'source-map',
  plugins: [
    {
      // unzip server package file
      apply: (compiler) => {
        compiler.hooks.done.tap('extra', async () => {
          const serverPackageFolder = path.join(
            path.resolve('dist/package'),
            serverPackage
          )

          // remove debugger package folder if exists
          if (fs.existsSync(serverPackageFolder)) {
            fs.rmSync(serverPackageFolder, { recursive: true })
          }

          await new Promise(async (resolve, reject) =>
            fs
              .createReadStream(zipFilePath)
              // @ts-ignore
              .pipe(unzip.Extract({ path: '.' }))
              .on('close', async () => {
                try {
                  resolve(zipFilePath)
                } catch (err) {
                  reject(err)
                }
              })
          )
        })
      },
    },
  ],
}
