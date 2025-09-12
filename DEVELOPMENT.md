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

# Daffodil-VSCode Developer's Guide

## Build Status

[![CI](https://github.com/apache/daffodil-vscode/actions/workflows/CI.yml/badge.svg)](https://github.com/apache/daffodil-vscode/actions/workflows/CI.yml)
[![nightly tests](https://github.com/apache/daffodil-vscode/actions/workflows/nightly.yml/badge.svg)](https://github.com/apache/daffodil-vscode/actions/workflows/nightly.yml)

## Table of Contents

- [Daffodil-VSCode Developer's Guide](#daffodil-vscode-developers-guide)
  - [Build Status](#build-status)
  - [Table of Contents](#table-of-contents)
  - [Welcome](#welcome)
  - [Prerequisites](#prerequisites)
    - [Install Git](#install-git)
    - [Install Visual Studio Code (VSCode)](#install-visual-studio-code-vscode)
  - [Installing Build Requirements](#installing-build-requirements)
    - [Summary of Build Requirements](#summary-of-build-requirements)
    - [Step-by-step Guide for Installing Build Requirements](#step-by-step-guide-for-installing-build-requirements)
      - [Installing Node](#installing-node)
        - [Installing Node on Windows Note](#installing-node-on-windows-note)
      - [Installing Java (JDK 17)](#installing-java-jdk-17)
        - [Build Issues with Higher JDK Versions](#build-issues-with-higher-jdk-versions)
        - [Switching Java Versions on Linux](#switching-java-versions-on-linux)
      - [Installing SBT](#installing-sbt)
      - [Enabling Yarn from Within Node](#enabling-yarn-from-within-node)
        - [Do Not Use the Latest Version of Yarn](#do-not-use-the-latest-version-of-yarn)
        - [How to Enable](#how-to-enable)
  - [Contributing and Setup](#contributing-and-setup)
    - [Forking the Project](#forking-the-project)
    - [Cloning the Project to Local Environment](#cloning-the-project-to-local-environment)
      - [Setting up SSH Keys](#setting-up-ssh-keys)
    - [General Workflow](#general-workflow)
    - [Opening the Repository in VSCode](#opening-the-repository-in-vscode)
      - [Recommended VSCode Extensions](#recommended-vscode-extensions)
    - [Verifying Setup Can Build](#verifying-setup-can-build)
      - [Yarn Package](#yarn-package)
      - [Automated Testing Suite](#automated-testing-suite)
        - [Testing Against a Specific Version of VS Code](#testing-against-a-specific-version-of-vs-code)
    - [Debugging the Extension](#debugging-the-extension)
      - [Changing the sampleWorkspace folder name and location](#changing-the-sampleworkspace-folder-name-and-location)
      - [Test a Local Version of Apache Daffodil Debugger](#test-a-local-version-of-apache-daffodil-debugger)
      - [Debugging UI Source](#debugging-ui-source)
    - [Troubleshooting](#troubleshooting)
      - [Yarn Package Issues](#yarn-package-issues)
        - [If Yarn Keeps Updating to The Latest Version](#if-yarn-keeps-updating-to-the-latest-version)
      - [Yarn Test Issues](#yarn-test-issues)
        - [Data Editor Opens Test Case Failing](#data-editor-opens-test-case-failing)
        - [TLS Certificate Issues](#tls-certificate-issues)
      - [Debugging Issues](#debugging-issues)
        - [SELinux Port Functionality](#selinux-port-functionality)
        - [Windows Yarn Test Window Not Loading Extensions](#windows-yarn-test-window-not-loading-extensions)
        - [Variable Values Not Displaying in VSCode Debugger](#variable-values-not-displaying-in-vscode-debugger)
      - [Re-trying Verification After Errors](#re-trying-verification-after-errors)
  - [Building the Documentation](#building-the-documentation)
    - [Install Pandoc](#install-pandoc)
    - [Command to build the Documentation](#command-to-build-the-documentation)
  - [Reviewing and Verifying Dependency Bot Updates](#reviewing-and-verifying-dependency-bot-updates)
  - [Testing Information](#testing-information)
  - [Monitoring Project Status](#monitoring-project-status)
  - [Thank you for your interest in contributing to this project!](#thank-you-for-your-interest-in-contributing-to-this-project)

## Welcome

This guide contains developer-oriented instructions on how to setup your local development environment for contributing to this project.

If you would like the latest stable release of the extension, please reference the [README file](README.md).

The project is currently growing, please refer to the [wiki](https://github.com/apache/daffodil-vscode/wiki) for an overview of what the extension includes. There is also user documentation on the right pane with release specific use case guides.

## Prerequisites

### Install Git

If your system doesn’t have Git installed, [install Git](https://git-scm.com/downloads). Select the appropriate operating system and follow the listed instructions.
To verify git is installed on your system, enter git -v into your system’s terminal and it should display the version of git if properly installed.

### Install Visual Studio Code (VSCode)

Install VSCode per [official VSCode documentation](https://code.visualstudio.com/docs/setup/setup-overview):

- [Windows](https://code.visualstudio.com/docs/setup/windows)
- [Linux](https://code.visualstudio.com/docs/setup/linux)
- [MacOS](https://code.visualstudio.com/docs/setup/mac)

## Installing Build Requirements

This section will provide describe what requirements are needed to build with a step-by-step guide to assist developers of varying skill levels.

### Summary of Build Requirements

- Java Development Kit (JDK) between 8 and 17
- SBT 0.13.8 or higher
- Node 20 or higher
- [Yarn Classic](https://classic.yarnpkg.com/en/docs/install#windows-stable)

### Step-by-step Guide for Installing Build Requirements

#### Installing Node

Navigate to the [Node Download page](https://nodejs.org/en/download). Select the instructions for installing the latest LTS version of Node.js for your operating system using fnm with npm.

![Picture1](https://github.com/user-attachments/assets/40c9eecf-23b6-4b8b-b910-673bc942144b)

##### Installing Node on Windows Note

Make sure you have `winget` installed. If it’s not installed, you can install it by typing in `Install-Module -Name Microsoft.WinGet.Client` into PowerShell.
After following all the steps outlined on Node’s page, you want to [create a PowerShell profile](https://lazyadmin.nl/powershell/powershell-profile/) which is a PowerShell script that gets executed every time a new instance of PowerShell is opened. Then append `fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression` per [fnm's guidance](https://github.com/Schniz/fnm?tab=readme-ov-file#powershell).

#### Installing Java (JDK 17)

You can install [Oracle's JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) or alternatively install the OpenJDK equivalent.

##### Build Issues with Higher JDK Versions

Note that higher versions of the JDK may cause extension building issues and is not advised.

##### Switching Java Versions on Linux

You might have Java already installed. You can change the default Java provider and version by running `sudo update-alternatives --config java`.

#### Installing SBT

Install SBT for your appropriate operating system:

- [Windows Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Windows.html)
  - Preferable method: install via .msi
- [Linux Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Linux.html)
- [MacOS Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Mac.html)

#### Enabling Yarn from Within Node

##### Do Not Use the Latest Version of Yarn

Do not upgrade versions of Yarn for repository. Do not follow the [instructions on Yarn’s official website](https://yarnpkg.com/getting-started/install). This will break the extension packaging process.

##### How to Enable

Type into the console `corepack enable yarn`.

## Contributing and Setup

### Forking the Project

This is an Apache Project. If you would like to contribute, you will need to fork the [daffodil-vscode main branch](https://github.com/apache/daffodil-vscode) to your own repo of choice and create pull requests to the main branch with your code changes.
 ![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/160ff687-4b37-4730-b867-128d063950b7)

### Cloning the Project to Local Environment

Once forked, you can clone that forked repository to your own local environment. This can be done by using `git clone`, followed by copy and pasting the https or SSH urls shown under the “Code” dropdown. We recommend using SSH. Instructions for setting up SSH can be found in [Setting up SSH Keys](#setting-up-ssh-keys).

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/e32b5ebf-a45d-4362-aa44-5aa817d4bd0b)

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/cfed66de-6418-4456-bbec-4ef01653e171)

Once cloned, you can now create branches, commits, and push changes back to your remote fork. You may make changes with any IDE, but we highly encourage using VSCode for testing for maximum compatability.

#### Setting up SSH Keys

Enter ssh-keygen into your terminal to generate an RSA key. Follow the prompts for naming the public and private key files (optional) and giving the keys an optional passphrase.

The public and private keys are stored in a folder called .ssh in your users folder. The public key file is denoted with a .pub whereas the private key doesn’t have a file extension.

Navigate to [SSH and GPG keys GitHub settings](https://github.com/settings/keys). Log into your GitHub account if needed. Click on New SSH Key.

![ssh_keys](https://github.com/user-attachments/assets/f716ed77-d554-4773-9d08-81c3b40c2ae6)

Give your new SSH Key a name and paste the contents of the .pub file into the key textbox

![add_new_ssh_key](https://github.com/user-attachments/assets/bd3e31f2-fb15-45b9-9e39-7755cdfffb2a)

Note that the above image has parts of the key blurred out for confidentiality.

Click on Add SSH key and follow GitHub prompts for verification.

[GitHub has their own guide on setting up SSH keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) which can be alternatively followed.

### General Workflow

Ensure that you keep your fork synced with the daffodil-vscode main by using the sync fork button, this ensures that you are developing with up to date code, so that you can be sure your changes work with present code.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/3555a2c6-3ee6-43a0-99b6-d4885b713e9b)

If any changes were made while you were working on yours, you will need to pull these changes down to your local environment and merge them with your changes before pushing back to remote.

Once changes are pushed, you can make pull requests with completed changes back to the main daffodil-vscode branch. You can use the contribute drop down to create a pull request back to the main branch.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/76d83f38-d39c-49b3-a872-95cb281f0956)

### Opening the Repository in VSCode

There are multiple ways of opening the repository that you have cloned in VSCode:

1. In a terminal, type in `code <PATH TO THE CLONED REPOSITORY>`
2. Clicking on open folder at the VSCode homescreen

![open_folder_vscode](https://github.com/user-attachments/assets/aab662c0-3b45-4dfe-917a-c75e35cc62e2)

3. At the top options bar, File -> Open Folder

![file-open-folder](https://github.com/user-attachments/assets/34e06fc3-cafa-4d70-82a6-12bfb354bf3f)

#### Recommended VSCode Extensions

Upon opening, VSCode may prompt you to install recommended extensions. Go ahead and accept installing the recommended extensions.

- [Prettier - Code formatter - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

- [JAR Viewer - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=wmanth.jar-viewer)

### Verifying Setup Can Build

Navigate inside your cloned folder in a terminal. Enter `yarn` to install required packages. If it prompts you to install yarn 1.22.XX, type `y`.

Then type in `yarn package`. If there’s new .vsix file in the folder, then you have successfully set up your development environment correctly. For more information about `yarn package`, read [Yarn Package](#yarn-package).

![vsix](https://github.com/user-attachments/assets/7bcfd6ae-3ff0-4a2b-9fb8-182f64562b32)

Lastly, run `yarn test`. All tests should pass without any errors. More information can be found under [Automated Testing Suite (Yarn Test)](#automated-testing-suite)

![yarn_test_succ_output](https://github.com/user-attachments/assets/188cafb9-844b-4037-953f-2c70c75dc865)

Alternatively, you can run all of the commands in a single line by running `yarn && yarn package && yarn test && echo "All good!"`.

#### Yarn Package

If you would like to confirm that your changes compile, you can run the extension through the VSCode debugger as shown below. Under the run and debugger, you should see a launch.json already loaded for the extension, just hit the green play button. This will open a new debug window of vscode that will have the extension built and running. You can then test any changes made and ensure it is operating as intended. For more information on the debugging in VSCode, please reference [Debugging the Extension section](#debugging-the-extension).

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/db202ff3-81fb-4578-9001-a8c2c7008568)

You can also do this manually on the CLI with the following command:
`yarn package`

This command will perform the following tasks:

- Create sbt zip package and unzip it
- Install dependencies
- Compiles Extension
- Packages Extension
- Creates File
  - apache-daffodil-vscode-*.vsix

You can then take this .vsix file and install the extension into your vscode instance. Be sure you don’t already have the extension installed from the marketplace or the versioning could cause issues with seeing changes from your build.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/4d0fe825-0973-494d-bc8e-211319806f0d)

#### Automated Testing Suite

The Apache Daffodil VS Code Extension comes with an automated test suite.  Run it as follows:

```shell
yarn test
```

##### Testing Against a Specific Version of VS Code

By default, the test suite will use the earliest supported release of VS Code.  To test against any _specific_ version of VS Code (in this example, VS Code version 1.74.3), execute the test suite as follows, setting `DAFFODIL_TEST_VSCODE_VERSION` to the desired version:

```shell
DAFFODIL_TEST_VSCODE_VERSION=1.74.3 yarn test
```

Set `DAFFODIL_TEST_VSCODE_VERSION` to `stable` to use the latest stable release, or to `insiders` to use the latest (nightly) insiders build.

### Debugging the Extension

Create a `sampleWorkspace` folder in the folder one level higher than where `daffodil-vscode` currently resides. For example, if you have your `daffodil-vscode` folder stored in a folder called repos, then make a folder in repos called `sampleWorkspace`.

![sampleworkspace-loc](https://github.com/user-attachments/assets/6770a3b1-0363-42a9-b79a-e3fa5641a270)

It’s advised to copy sample data files and sample DFDL schemas (.dfdl.xsd) in here. You can find DFDL schemas at [DFDL Schemas for Commercial and Scientific Data Formats](https://github.com/DFDLSchemas).

Next start debugging the extension. Make sure the “Extension” debug configuration is currently selected. You can press the green run button or alternatively press F5.

![debug_loc](https://github.com/user-attachments/assets/3ad6d93c-5d9c-40c3-a8e4-a05fc83a8875)

Starting the debugging session creates a terminal inside of VSCode running `yarn watch` and builds the extension. `yarn watch` automatically recompiles changes to the code in real-time. It also displays problems that occur in the code in real-time. For the changes to take effect however, you will have to stop and restart debugging.

You may see this window pop up

![webpack_not_fully_loaded](https://github.com/user-attachments/assets/9d4f45f2-cc81-40de-a456-2aecbc3df9b7)

Click on debug anyway once `yarn watch` says webpack is fully compiled.

![webpack-fully-loaded](https://github.com/user-attachments/assets/5dd3202d-a853-4d9c-8b4a-48c381256d0f)

A new VSCode window should’ve popped up with the sampleWorkspace opened.

![debug-window](https://github.com/user-attachments/assets/4d7e4cca-3172-4ab3-bd5c-52a5061bd353)

Open the command palette with `Ctrl + Shift + P` and type in `Daffodil Debug`. Select the `Configure launch.json` option.

![config-launc-josn-command-pal](https://github.com/user-attachments/assets/d40f23c8-f47c-43ae-87ec-42ebb9c705c8)

Your window should look like this.

![daf-debug-settings](https://github.com/user-attachments/assets/ae682d7e-c579-4ba0-b613-91e4f8667f93)

Scroll down and check these following options

![open_3_checkbox](https://github.com/user-attachments/assets/6ca42872-3060-4d16-a72a-a95c25e356e2)

Click save

![bottom-daf-debug](https://github.com/user-attachments/assets/d1c7e622-f2cb-43ca-9fa9-d128174fa54d)

Click on the Run and Debug Icon. Wizard Config should show at the top.

![wiz-config](https://github.com/user-attachments/assets/aac7c1c3-1dd7-4219-b2ca-e053a10bae42)

Then select a schema file and a data file. (Note, if you want to hard code where the files are, you’re able to change the DFDL and data file path in the Daffodil Configure launch.json window)

![select-dfdl-schema](https://github.com/user-attachments/assets/17c6a731-2b53-45f9-9566-98efb1fb398e)

![select-test-image](https://github.com/user-attachments/assets/14a8cd56-38d3-423e-9430-cf78d40a258b)

Your window should look like the following. Note that you may have to move some tabs around.

![ide-debug](https://github.com/user-attachments/assets/dbc8a48e-b528-4861-8163-6c167c4d60fa)

Here’s an example view of the data editor (OmegaEdit) with the schema on the left.

![ide-debug2](https://github.com/user-attachments/assets/9b982947-2f9c-45b0-8d6f-7b86eef1bacd)

Here’s the infoset diff view. The infoset is the resulting output XML/JSON file.

![ide-debug4](https://github.com/user-attachments/assets/09e58522-e782-465f-b185-783eaf7ae592)

#### Changing the sampleWorkspace folder name and location

If you would like to specify a different name and/or location for the sampleWorkspace, modify the following line in `.vscode/launch.json`:

![change-sampleworkspace-name](https://github.com/user-attachments/assets/d269a25a-f229-418a-bf0b-70151a1c4ecd)

#### Test a Local Version of Apache Daffodil Debugger

The local Apache Daffodil™ Extension for Visual Studio Code downloads and caches the Apache Daffodil™ Debugger corresponding to the latest extension release. If you want to test a _local_ version of the Apache Daffodil Debugger, you need to:

- add `"useExistingServer": true` to the configuration in your `launch.json` in the sample workspace;
- launch the backend debugger locally, using a launch configuration like below:

    ```json
    {
      "type": "scala",
      "name": "DAPodil",
      "request": "launch",
      "mainClass": "org.apache.daffodil.debugger.dap.DAPodil",
      "args": []
    }
    ```

    This will start the debug adapter and await a connection from the Apache Daffodil VS Code Extension (usually on TCP port 4711); and
- debug your schema file, as long as your `launch.json` has the `useExistingServer` setting above.

#### Debugging UI Source

##### Inspecting the HTML

To inspect the HTML, open up the UI window (e.g., Configure launch.json, Data Editor) that you wish to inspect and open the Webview Developer Tools with `Ctrl + Shift + P` and typing `Developer: Open Webview Developer Tools`.

**NOTE:** This only debugs the UI from the DOM. It does not add any debugging functionality within the extension's JS/TS source files.

![ui-debug1](https://github.com/user-attachments/assets/77f44956-7536-4e96-b9ec-23b7ffbaecdc)

From the Elements tab, you can inspect the HTML by expanding and hovering elements to highlight them in the UI.

![ui-debug2](https://github.com/user-attachments/assets/a3378311-236e-4c54-9e58-ab34286da461)

Likewise, you can use the Inspect tool to click on items in the UI to see the corresponding HTML element.

![ui-debug3](https://github.com/user-attachments/assets/a601c5e8-9eff-46a2-9811-c62c16b2fe27)

![ui-debug4](https://github.com/user-attachments/assets/27c407f7-ded2-4780-b8e8-e5d6bb8d1f40)

##### Debugging the JavaScript 

To debug the JavaScript, add a `debugger` statement to the source code where you want to debug. The debugger statement acts like a breakpoint and pauses execution when reached.

![ui-debug5](https://github.com/user-attachments/assets/13b493d7-ea48-40dc-ba87-7beb42a9c7e5)

Start the Extension debug window and open the UI window (e.g., Configure launch.json, Data Editor) that you are debugging, and open the Webview Developer Tools with `Ctrl + Shift + P` and typing `Developer: Open Webview Developer Tools`. Then, complete the action necessary to reach the `debugger` statement if need be. After the `debugger` statement is reached, the execution will pause, and the source will be shown in the Webview Developer Tools window.

![ui-debug6](https://github.com/user-attachments/assets/a6f5af73-f285-4556-82de-88a5a569ec02)

You can then add breakpoints by clicking the line number.

![ui-debug7](https://github.com/user-attachments/assets/1243f7b2-29a0-4bbd-9878-617afa7d725b)

You can also use the bar on the right side to continue or step through the execution.

![ui-debug8](https://github.com/user-attachments/assets/69114004-6b88-42e1-b3a3-871a63197ebb)

To examine the value of a variable while stepping through the execution, you can add a watch expression in the right pane.

![ui-debug9](https://github.com/user-attachments/assets/9727f743-9704-40bc-bed9-2b8aa0de7831)

![ui-debug10](https://github.com/user-attachments/assets/26c9e2bc-0283-4f79-9091-88b0def8807b)

### Troubleshooting

You may run into issues with building, running tests, or debugging the extension. The follow sections will describe some issues you may encounter and discuss remedies.

#### Yarn Package Issues

##### If Yarn Keeps Updating to The Latest Version

As of typing this document (Feb 2025), the latest version of yarn is 4.6.0. If you type `yarn` and your console outputs the following or anything similar:

```PowerShell
➤ YN0087: Migrated your project to the latest Yarn version ��
➤ YN0000: · Yarn 4.6.0
➤ YN0000: ┌ Resolution step
➤ YN0085: │ + @omega-edit/client@npm:0.9.83, @tsconfig/svelte@npm:5.0.2, @types/glob@npm:8.1.0, @types/mocha@npm:10.0.6, @types/node@npm:20.11.30, @types/vscode-webview@npm:1.57.4, @types/vscode@npm:1.95.0, @viperproject/locate-java-home@npm:1.1.15, @vscode/debugadapter-testsupport@npm:1.65.0, @vscode/debugadapter@npm:1.67.0, @vscode/test-electron@npm:2.3.8, @vscode/vsce@npm:2.22.0, @vscode/webview-ui-toolkit@npm:1.4.0, await-notify@npm:1.0.1, chai@npm:4.4.1, and 703 more.
➤ YN0000: └ Completed in 9s 958ms
➤ YN0000: ┌ Post-resolution validation
➤ YN0002: │ apache-daffodil-vscode@workspace:. doesn't provide react (pa7c88), requested by @vscode/webview-ui-toolkit.
➤ YN0086: │ Some peer dependencies are incorrectly met by your project; run yarn explain peer-requirements <hash> for details, where <hash> is the six-letter p-prefixed code.
➤ YN0000: └ Completed
➤ YN0000: ┌ Fetch step
➤ YN0013: │ 696 packages were added to the project (+ 397.25 MiB).
➤ YN0000: └ Completed in 4m 47s
➤ YN0000: ┌ Link step
➤ YN0007: │ esbuild@npm:0.19.9 must be built because it never has been before or the last one failed
➤ YN0007: │ svelte-preprocess@npm:5.1.1 [5fe27] must be built because it never has been before or the last one failed
➤ YN0007: │ svelte-preprocess@npm:5.1.1 [ab741] must be built because it never has been before or the last one failed
➤ YN0007: │ keytar@npm:7.9.0 must be built because it never has been before or the last one failed
➤ YN0007: │ protobufjs@npm:7.4.0 must be built because it never has been before or the last one failed
➤ YN0000: └ Completed in 2m 40s
➤ YN0000: · Done with warnings in 7m 37s
```

this means that there is a yarn project that is initialized in a folder that’s higher up from the cloned repository folder. This will negatively affect the extension packaging process. A remedy for the issue is to remove all yarn files and the package.json file in the higher folder that the yarn project is initialized in.

To remedy this, you need to change versions of Yarn. Use `yarn set version 1.22.22` to change versions of Yarn. [Documentation for set-version](https://yarnpkg.com/cli/set/version).  

#### Yarn Test Issues

##### Data Editor Opens Test Case Failing

This means port 9000 is Occupied. See the current workarounds section in ["data editor opens" test fails if Port 9000 is Occupied · Issue #1175 · apache/daffodil-vscode](https://github.com/apache/daffodil-vscode/issues/1175).

##### TLS Certificate Issues

HTTPS TLS certificates are verified by default.  When running the test suite in certain environments (e.g., company VPN that uses endpoint protection), TLS certificate verifications may fail with a self-signed certificate error.  If this is the case, either have node trust the endpoint protection certificate, or use one of these workarounds to disable the certificate verification:

```shell
NODE_TLS_REJECT_UNAUTHORIZED=0 yarn test
```

or

```shell
node ./out/tests/runTest.js --disable_cert_verification
```

**WARNING:** Do not `export NODE_TLS_REJECT_UNAUTHORIZED=0` into your environment as it will disable TLS certificate verification on _all_ node HTTPS connections done in that shell session.

#### Debugging Issues

##### SELinux Port Functionality

If you’re running into frequent issues with connectivity or VSCode freezing, it may be worth it to disable SELInux enforcing mode.
To check to see if SELinux OS is in enforcing mode, you can type `getenforce` in a console. If it outputs Enforcing, you’ll want to set it to Permissive by using `sudo setenforce Permissive`.

##### Windows Yarn Test Window Not Loading Extensions

If you run `yarn test`, and are running into an issue where the test window is saying there’s a missing dependent extension

![missing-ext](https://github.com/user-attachments/assets/b9fea25d-fdde-4879-8138-648e8340c2d9)

and yarn tests under the `getCommands` section are failing,

![getCommands-test-fail](https://github.com/user-attachments/assets/6e19381c-4903-4e0c-9853-712b5feb0389)

Inside of src\tests\runTest.ts, replace

```TypeScript
      {
        encoding: 'utf-8',
        stdio: 'inherit',
      }
```

with

```TypeScript
      {
        encoding: 'utf-8',
        stdio: 'inherit',
        shell: os.platform().toLowerCase().startsWith('win'),
      }
```

and add
`import os from 'os'`
near the top of the file along with the other import statements.

##### Variable Values Not Displaying in VSCode Debugger

When debugging in VSCode, if you're noticing that it's not possible to view variables' values or they're appearing as uncaught references when they aren't supposed to, as shown below,

![image](https://github.com/user-attachments/assets/8d7c8d91-98ff-4e47-ac13-e9fe49b79182)

under `"scripts"` in `package.json`, modify the mode for webpack to be `production`. The line should look like `"webpack": "webpack --mode production --config ./webpack/ext-dev.webpack.config.js",`

#### Re-trying Verification After Errors

Type in `git clean -fdx`. Then run `yarn && yarn package && yarn test && echo "All good!"`.
If issues persist, you may want to uninstall Node and reinstall it. If that doesn’t remedy the issue, you may have to create a fresh VM.

## Building the Documentation

### Install Pandoc

Before running commands to build the documentation, be sure to [install Pandoc](https://pandoc.org/installing.html).

### Command to build the Documentation

To build `docx` (Word formatted) documentation, from the top of the cloned repository, run:

```shell
cd docs && make all
```

## Reviewing and Verifying Dependency Bot Updates

For GitHub CI action updates (pull requests that start with **Bump actions/...**), make sure the affected workflows still operate as expected (they are automatically CI tested).  GitHub CI actions update workflow YAML files, and are part of the CI infrastructure and not a code dependency.  These should be relatively quick and easy to assess compared to code dependencies.

If the updates are not GitHub CI action updates, then additional scrutiny is required.  When reviewing and verifying dependency bot updates that are part the software supply chain being distributed, please use the following checklist:

- [ ] **Do all automated continuous integration checks pass?**
- [ ] **Is the update a patch, minor, or major update?**
- [ ] **Is the license still compatible with ASF License Policy?**
- [ ] **Have any changes been made to LICENSE/NOTICE files that need to be incorporated?**
- [ ] **Have any transitive dependencies been added or changed?**

## Testing Information

Testing for this extension comprises of unit testing, CI/CD tests for pull requests (PRs), and manual tests.

List of manual tests can be found in the [testing README](https://github.com/apache/daffodil-vscode/blob/8c70937f6badc8b0e8eec5b4d34d3657e0676a32/src/tests/README.md).

## Monitoring Project Status

Milestone-level project status can be monitored using the [Projects tab](https://github.com/apache/daffodil-vscode/projects) in the [Project's GitHub repository](https://github.com/apache/daffodil-vscode).

## Thank you for your interest in contributing to this project

You can ask questions on the <dev@daffodil.apache.org> or <users@daffodil.apache.org> mailing lists. You can report bugs via GitHub Issues.
