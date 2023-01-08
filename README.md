<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->


<div align="center">

<img src="https://daffodil.apache.org/assets/themes/apache/img/apache-daffodil-logo.png" height="85" alt="Apache Daffodil"/>

# Apache Daffodil™ Extension for Visual Studio Code

[![CI](https://github.com/apache/daffodil-vscode/workflows/CI/badge.svg)](https://github.com/apache/daffodil-vscode/actions/workflows/CI.yml)

</div>

This is an extension for Visual Studio Code (VS Code) which enables the interactive debugging of DFDL schema parsing using [Apache Daffodil](https://daffodil.apache.org/).

## Build Requirements

- Java Development Kit (JDK) 11 or higher
- SBT 0.13.8 or higher
- Node 10 or higher
- Yarn (https://yarnpkg.com/getting-started/install)

## Download - Prebuilt

Until the extension is available in the [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode), please download the latest `.vsix` file from the [releases page](https://github.com/apache/daffodil-vscode/releases).

## Package VSIX and Debugger

:exclamation:**NOT necessary if using prebuilt VSIX**:exclamation:

:exclamation:**NOT necessary if running extension via VS Code without VSIX but a `yarn install` will be required**:exclamation:

Run full package

  ```bash
  yarn package
  ```

* This command performs the following tasks:
  * Create sbt zip package
  * Install dependencies
  * Compiles Extension
  * Packages Extension
  * Creates Files
    ```
    server/core/target/universal/daffodil-debugger-*.zip
    apache-daffodil-vscode-*.vsix
    ```

## Running Debug Server

The debug server will automatically be run by the extension unless `useExistingServer` is to set to `true` inside of `.vscode/launch.json`

If you wish to run the debug server manually the scripts to do so are at the following locations:
* Debugging through VS Code with or without VSIX:
  * Linux = `/home/USERNAME/.local/share/daffodil-dap`
  * Mac = `/Users/USERNAME/Library/Application\ Support/daffodil-dap`
  * Windows = `C:\\Users\\USERNAME\\AppData\\Roaming\\daffodil-dap`

## Installation

Once you have either downloaded the VSIX file or created it you can now install it. There are two options to do this:

* Via "Extensions: Install from VSIX" command from within VS Code.
  * Open the Command Palette with Shift-Command-P (Mac) OR Shift-Ctrl-P (Windows/Linux)
  * Type `vsix` to bring up the command and pointing it at the `vsix` file

* Via command line
  ```bash
  code --install-extension apache-daffodil-vscode-*.vsix
  ```

## Usage

Please refer to the Wiki page at https://github.com/apache/daffodil-vscode/wiki

## Getting Help

You can ask questions on the dev@daffodil.apache.org or
users@daffodil.apache.org mailing lists.  You can report bugs via
[GitHub Issues].

## License

Apache Daffodil™ Extension for Visual Studio Code is licensed under the [Apache License, v2.0].

[Apache License, v2.0]: https://www.apache.org/licenses/LICENSE-2.0
[GitHub Issues]: https://github.com/apache/daffodil-vscode/issues

This product includes the [logback](https://github.com/qos-ch/logback) library, which is available under the Eclipse Public License v1.0.

This product includes the [Java Debug Server for Visual Studio Code](https://github.com/microsoft/java-debug) library, which is available under the Eclipse Public License v1.0.
