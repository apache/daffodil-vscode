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

# Welcome
If you would like the latest stable release of the extension, please reference the README.md for instructions on how to retrieve that.
You can download a zip archive of the source code for the extension. You can extract this to any directory of your choice and open it within vscode to begin poking around.

The project currently has many components and is growing, please refer to the wiki for an overview of what the extension includes. There is also user documentation on the right side with additional release specific use case guides. Here is the one for v1.3.1:
https://github.com/apache/daffodil-vscode/wiki/Apache-Daffodil%E2%84%A2-Extension-for-Visual-Studio-Code:-v1.3.1 

## Contributing
Due to this being an Apache project, if you would like to contribute, you will need to fork the daffodil-vscode main branch to your own repo of choice and create pull requests to the main branch with your code changes.
 ![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/160ff687-4b37-4730-b867-128d063950b7)
 
Once forked, you can clone that forked repository to your own local environment. This can be done by using `git clone`, followed by copy and pasting the https or ssh urls shown under the “Code” dropdown.
 ![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/e32b5ebf-a45d-4362-aa44-5aa817d4bd0b)

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/cfed66de-6418-4456-bbec-4ef01653e171)

If you have not setup your ssh keys for github, you can follow this guide here: https://docs.github.com/en/authentication/connecting-to-github-with-ssh. Or you can use https or another method of your choice.

Once cloned, you can now create branches, commits, and push changes back to your remote fork. You may make changes with any IDE, but because the extension is built for vscode, we recommend using that to maximize testing ability. 

Ensure that you keep your fork synced with the daffodil-vscode main by using the sync fork button, this ensures that you are developing with up to date code, so that you can be sure your changes work with present code.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/3555a2c6-3ee6-43a0-99b6-d4885b713e9b)


If any changes were made while you were working on yours, you will need to pull these changes down to your local environment and merge them with your changes before pushing back to remote.

Once changes are pushed, you can make pull requests with completed changes back to the main daffodil-vscode branch. You can use the contribute drop down to create a pull request back to the main branch.

![image](https://github.com/ctc-oss/daffodil-vscode/assets/131286323/76d83f38-d39c-49b3-a872-95cb281f0956)

## Building
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


## Testing
For testing, there is multiple components within the project. While there is unit testing and some testing framework in the CI pipeline once you create a pull request, somethings are still manually tested.

We have a testing checklist that was created and can be found here:
https://github.com/apache/daffodil-vscode/blob/8c70937f6badc8b0e8eec5b4d34d3657e0676a32/src/tests/README.md 


## Thank you for your interest in contributing to this project!
You can ask questions on the dev@daffodil.apache.org or users@daffodil.apache.org mailing lists. You can report bugs via GitHub Issues.

