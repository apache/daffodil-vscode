/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//@ts-check
'use strict'

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

// import packages
const path = require('path')
const unzip = require('unzip-stream')
const fs = require('fs')
const CopyPlugin = require('copy-webpack-plugin')

const pkg_dir = path.resolve('dist/package')

const packageData = JSON.parse(
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
    path: path.resolve(__dirname, '../dist/package/dist/ext'),
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../../[resource-path]',
    hashFunction: 'sha512',
    clean: true, // makes sure the output directory is remade
  },
  devtool: 'source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        // { from: 'build/package/.vscodeignore', to: pkg_dir },
        { from: 'build/package/LICENSE', to: `${pkg_dir}` },
        { from: 'build/package/NOTICE', to: `${pkg_dir}` },
        { from: 'dist/styles.css', to: `${pkg_dir}/dist/styles.css` },
        {
          from: 'dist/views/',
          to: `${pkg_dir}/dist/views/`,
        },
        { from: 'images', to: `${pkg_dir}/images` },
        { from: 'language', to: `${pkg_dir}/language` },
        { from: 'package.json', to: `${pkg_dir}` },
        {
          from: 'node_modules/@omega-edit/server/bin',
          to: `${pkg_dir}/node_modules/@omega-edit/server/bin`,
        },
        {
          from: 'node_modules/@omega-edit/server/lib',
          to: `${pkg_dir}/node_modules/@omega-edit/server/lib`,
        },
        {
          from: 'src/language/providers/intellisense/DFDLGeneralFormat.dfdl.xsd',
          to: `${pkg_dir}/src/language/providers/intellisense/DFDLGeneralFormat.dfdl.xsd`,
        },
        {
          from: 'src/launchWizard/launchWizard.js',
          to: `${pkg_dir}/src/launchWizard/launchWizard.js`,
        },
        {
          from: 'src/styles/styles.css',
          to: `${pkg_dir}/src/styles/styles.css`,
        },
      ],
    }),
    {
      apply: (compiler) => {
        compiler.hooks.done.tap('extra', async () => {
          // remove debugger package folder if exists
          const serverPackageFolder = path.join(
            path.resolve('dist/package'),
            serverPackage
          )

          // remove debugger package folder if exists
          if (fs.existsSync(serverPackageFolder)) {
            fs.rmSync(serverPackageFolder, { recursive: true })
          }

          // unzip debugger package file
          await new Promise(async (resolve, reject) =>
            fs
              .createReadStream(zipFilePath)
              // @ts-ignore
              .pipe(unzip.Extract({ path: 'dist/package' }))
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
