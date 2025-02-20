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
* [Windows](https://code.visualstudio.com/docs/setup/windows)
* [Linux](https://code.visualstudio.com/docs/setup/linux)
* [MacOS](https://code.visualstudio.com/docs/setup/mac)

## Installing Build Requirements
This section will provide describe what requirements are needed to build with a step-by-step guide to assist developers of varying skill levels. The steps provide recommended methods for installing build requirements, but don't have to be followed exactly one-to-one.   

### Summary of Build Requirements

- Java Development Kit (JDK) 17 or lower, but higher than or equal to 8
- SBT 0.13.8 or higher
- Node 16 or higher
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
* [Windows Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Windows.html)
  * Preferable method: install via .msi
* [Linux Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Linux.html)
* [MacOS Instructions](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Mac.html)

#### Enabling Yarn from Within Node

##### Do Not Use the Latest Version of Yarn
Do not upgrade versions of Yarn for repository. Do not follow the [instructions on Yarn’s official website](https://yarnpkg.com/getting-started/install). This will break the extension packaging process. 
##### How to Enable
Type into the console `corepack enable yarn`. 

## Contributing

### Forking the Project

Due to this being an Apache project, if you would like to contribute, you will need to fork the daffodil-vscode main branch to your own repo of choice and create pull requests to the main branch with your code changes.
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

### Verifying Setup is Done Correctly
Navigate inside your cloned folder in a terminal. Enter `yarn` to install required packages. If it prompts you to install yarn 1.22.XX, type `y`. 

Then type in `yarn package`. If there’s new .vsix file in the folder, then you have successfully set up your development environment correctly. 


### Building
If you would like to build to confirm that your changes compile, you can run the extension through the vscode debugger as shown below. Under the run and debugger, you should see a launch.json already loaded for the extension, just hit the green play button. This will open a new debug window of vscode that will have the extension built and running. You can then test any changes made and ensure it is operating as intended.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/db202ff3-81fb-4578-9001-a8c2c7008568)

You can do this manually on the CLI with the following command: 
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

### Testing
For testing, there is multiple components within the project. While there is unit testing and some testing framework in the CI pipeline once you create a pull request, somethings are still manually tested.

We have a testing checklist that was created and can be found here:
https://github.com/apache/daffodil-vscode/blob/8c70937f6badc8b0e8eec5b4d34d3657e0676a32/src/tests/README.md 


## Thank you for your interest in contributing to this project!
You can ask questions on the dev@daffodil.apache.org or users@daffodil.apache.org mailing lists. You can report bugs via GitHub Issues.

