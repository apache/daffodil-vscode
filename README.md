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
[![Nightly Tests](https://github.com/apache/daffodil-vscode/actions/workflows/nightly.yml/badge.svg)](https://github.com/apache/daffodil-vscode/actions/workflows/nightly.yml)

</div>

This is an extension for Visual Studio Code (VS Code) which enables the interactive debugging of DFDL schema parsing using [Apache Daffodil](https://daffodil.apache.org/).

## Build Requirements

- Java Development Kit (JDK) 17 or lower, but higher than or equal to 8
- SBT 0.13.8 or higher
- Node 16 or higher
- [Yarn Classic](https://classic.yarnpkg.com/en/docs/install#windows-stable)

Read [DEVELOPMENT.md](DEVELOPMENT.md) for further instructions on setting up your own development environment. 

## Download

### VS Code Marketplace

The easiest way to install the extension is through the VS Code Extension Marketplace. The steps are as follow:

- `Ctrl+P` (windown/linux) OR `Command+P` (macos)
- Type in `ext install ASF.apache-daffodil-vscode`, then hit `Enter`. This will begin installing the extension.

### Prebuilt VSIX

If you wish to download the VSIX file instead, perhaps to install a previous version of the extension. The prebuilt VSIX files used to released the extension are available at [Apache Daffodil VS Code Release Page](https://daffodil.apache.org/vscode/). The steps are as follow:

- Navigate to [Apache Daffodil VS Code Release Page](https://daffodil.apache.org/vscode/).
- Click on a release version.
- On the next page you will see `Binaries` click on the file listed to begin the download.
- See the `Installation From File` section for installing the prebuilt file.

## Package VSIX and Debugger

:exclamation:**NOT necessary if using prebuilt VSIX**:exclamation:

:exclamation:**NOT necessary if running extension via VS Code without VSIX but a `yarn install` will be required**:exclamation:

Run full package

  ```bash
  yarn package
  ```

* This command performs the following tasks:
  * Create sbt zip package and unzip it
  * Install dependencies
  * Compiles Extension
  * Packages Extension
  * Creates Files
    ```
    apache-daffodil-vscode-*.vsix
    ```

## Running Debug Server

The debug server will automatically be run by the extension unless `useExistingServer` is to set to `true` inside of `.vscode/launch.json`

If you wish to run the debug server manually the scripts to do so are at the following locations:
* Debugging through VS Code with or without VSIX:
  * Linux = `/home/USERNAME/.local/share/daffodil-dap`
  * Mac = `/Users/USERNAME/Library/Application\ Support/daffodil-dap`
  * Windows = `C:\\Users\\USERNAME\\AppData\\Roaming\\daffodil-dap`

## Installation From File

Once you have either downloaded the VSIX file or created it, you can now install it. There are two options to do this:

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

This product includes the [Xml Schema Object Model](https://github.com/kohsuke/xsom) library, which is licensed under the Common Development and Distribution License Version 1.1.

This product includes the Regular Mono [RedHatFont](https://github.com/RedHatOfficial/RedHatFont) font, which is licensed under the SIL Open Font License, Version 1.1.

This product includes the [space-grotesk](https://github.com/floriankarsten/space-grotesk) font, which is licensed under the SIL Open Font License, Version 1.1.
