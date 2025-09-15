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

![Apache Daffodil](https://daffodil.apache.org/assets/themes/apache/img/apache-daffodil-logo.png)

# Release Notes

</div>

## 1.4.1

  ### Debugger:
  - Added appropriate warning or error messages when data is left over after the parse operation is completed.
      - After a parse operation is completed, the debugger will check if data is left over. When data is left over the debugger will log an error message to the console.
      - All errors relayed to extension, e.g. left over data, parse errors, bad schema definition, etc. will have a more aggressive popup in the center of the screen.
  - Enhanced Debugging in Visual Studio Code (VS Code) by developing a dedicated command panel for DFDL. Now, all debugging-related commands are conveniently grouped in one place, making them easier to find and use. This command panel dynamically updates to only show relevant commands based on the current debug mode and can be quickly executed using a play button.
  - Upgraded to Apache Daffodil 3.10.0.
  - Created a dropdown list for Log Level setting in launch configuration wizard.
  - Implemented functionality to auto-suggest DFDL schema root element and root namespace based on the selected schema within the launch configuration.
  - Fixed a bug where the Infoset Diff View does not consistently show XML syntax highlighting on the previous screen.
  - Fixed an issue with respecting global settings from settings.json before respecting local settings from launch.json.
  - Fixed an issue with the launch configuration wizard resetting the form when switching back and forth with another tab.
  - Fixed a bug that could cause the debugger to hang for larger schema and data files.
  - Fixed the launch configuration issue with not loading correct default values for the following fields when creating a new configuration from the wizard menu. Launch configuration now loads the proper default values for the following fields:
      - Absolute path to the DFDL schema file
      - Name of the root element
      - Namespace of the root element
      - Daffodil Debugger Settings - Log File
      - Daffodil Debugger Settings - Log Level
  ### Data Editor:
   - Fixed a bug where the OmegaEdit server fails to shut down when running yarn test on Windows 10.
   - Reworked the Data Editor heartbeat structure to fix the issue with the data editor continuing to log after the debug operation is completed.
   - Fixed a bug with a message popup after the last data editor tab closed for the OmegaEdit server failed to shut down, even after the OmegaEdit server successfully shut down.
   - Fixed a bug where Data Editor Server no longer closes after debug completes in certain scenarios.
   - Fixed a bug where Data Editor can Seek beyond data in data file.
   - Fixed a bug when exporting profiler data as CSV, it inserts invalid 256 as a byte value.
   - Fixed data profiler not displaying all byte values for certain window sizes or monitor resolution.
   - Added hoverable tooltip for Disk Size and Computed Size in Data Editor.
  ### IntelliSense:
   - Implemented functionality to return different element-level results based on the namespace prefix within the dfdl schema.
   - Fixed an issue with Intellisense, which doesn't handle CTRL+Space within an attribute name consistently in every instance.
   - Fixed a bug with a misleading hover popup on dfdl:format attributes.
   - Fixed incorrect suggestion choices for properties in dfdl:format.
   - Fixed a bug with the closing tag trigger would not work for multiple tags on a single line.
   - Fixed discrepancy Between dropdown Items' namespace and inserted items' namespace where incorrect nsprefix was applied to dfdl element.
  ### TDML:
   - Added error message and user notification for a duplicate test case found during Append TDML operation.
   - Addressed incorrect relative paths when copying or appending TDML.
   - Addressed inability to execute TDML Test Case on Ubuntu OS.
   - Enabled reproducible JAXB generated TDML code.
   - Fixed tdmlConfig portion of launch.json to be consistent with the TDML Action section of the Launch Config Wizard.
  ### Documentation:
   - Created an “Introduction to Daffodil VS Code Extension” wiki page for beginners.
   - Consolidated Development Information from wiki page and Development.md file Into Development.MD to prevent duplicate information about the development environment.
   - Corrected a Wiki page for VS Code extension installation instructions.
  ### Known Issues:
   - Some nightly tests are still failing intermittently due to GitHub runners.
   - Ubuntu 24.04 (release date 04/25/2024) When using the debugger to step through a dfdl schema utilizing the step over action, the step over action will trigger dfdl intellisense to display a list of suggestions when a line in the schema is reached that results in output to the infoset. This problem can be mitigated by disabling "WaylandEnable" by uncommenting "#WaylandEnable=false" in the /etc/gdm3/custom.conf configuration file and rebooting the system.
   - At this time the debugger step into and step out actions have no code behind them, using either button results in an unrecoverable error. We have not found a way to disable the step into and step out buttons. This problem occurs in all Operating Systems. This is noted as a GitHub Issue.

## 1.4.0
  ### Debugger:
   - Simplification of the configuration and setup of the extension through changes to the launch wizard.
   - Added settings to launch configurations for root element name and namespace to debug schema files from a jar.
   - Fixed issue with empty infoset files being created.
   - Fixed issue with infoset file extension not matching output format.
     - Users now receive a warning that file path does not end with the correct extension and will be updated appropriately.
   - Changed how late-arriving events were handled when requesting old state.
   - Resolved issues with zip file corruption in VS Code debug sessions.
   - Resolved issues when running in Java 17+.
   - Provide better feedback to user to understand error and debug messages.
   - Upgraded to Apache Daffodil 3.8.0.
  ### Data Editor:
   - Removed HexView and replaced with Ωedit™.
   - Highlighting of bytes/bits to track the infoset when debugging.
   - Providing a more intuitive data representation of First and Last Byte.
   - Fixed issue where binary display radix would still display 16 bytes per row, instead of 8.
   - Fixed inability to edit a "non-regular" sized file ( file size < 2 ).
   - Rerouted all file / viewport UI offset traversal to use toplevel seek() function.
   - Implemented new Help layout for larger/enhanced Tooltip implementations.
   - Fixed issue where the editor edit instructions were difficult to read on smaller width/height windows.
   - Better traversal and navigation of data and byte index.
   - Added Relative and Absolute seek offset determination and traversal.
   - Addition of Multicharacter encodings, Byte Order Maker, and language detection.
   - Improved viewport geometries configurations, management, and manipulation: including bytes per rows, number of rows, togglable views, reframing, * persisting selections, etc.
   - Ability to write selection to a file operation.
   - Ability to navigate to a certain relative byte index.
   - Data profiling improvements.
   - Saving selected segments to a file.
  ### IntelliSense:
   - Added hover functionality to display the attributes available to specific tags.
   - Making XPath validation more complete.
   - Better under the hood testing to ensure a smoother development process for adding new IntelliSense suggestions.
   - Continue developing on a Matrix Spreadsheet for the DFDL community to reference in regard to the specifications.
  ### TDML:
   - Created a custom TDML GUI editor.
   - Copy, Append and Execute TDML test case functionality.
  ### Documentation:
   - Improved the barrier to entry for contributors by providing additional documentation on how to get started and work with our team.
  ### Known Issues:
   - Nightly tests failing intermittently
   - TDML Copy, Execute and Append Functionality is currently not working on MacOS Platform
   - TDML functionality currently do not have proper error messages to help user identify the root cause.
   - Data Editor Continues Logging Upon Debug Completion
   - Byte highlighting doesn't always work when scrolling through the results in the Data Editor

## 1.3.1
   - Upgrade to Daffodil version 3.5.0.
   - Use ```jsonc-parser``` when reading in JSON files, allows for the file to not be strict JSON.
   - Fix bug where, when using ```"useExistingServer": true```, some functionality would be lost.
   - Fix bug where, the ```AskForProgramName``` and ```AskForDataName``` commands were not setting ```program``` and ```data``` properly.
  ### Debugger updates:
   - Log to console and file.
   - Allow setting the log level of the debugger.
   - Allow setting the log filepath of the debugger.
   - Change default log level from ```DEBUG``` to ```INFO```.
   - Default log filepath is ```/tmp/daffodil-debugger.log```.
   - Extracted debugger zip is packaged instead of the zip.
   - Binds to localhost interface vs 0.0.0.0.
   - Support JDK 17 + JAXB reflection at runtime.
   - Allow some errors to not cause the session and debugger to stop.
  ### Launch Wizard Updates:
   - Fix duplicate descriptions.
   - Copying configuration items inconsistent.
   - Add items for daffodil debugger log level and log filepath.
   - Fix issue where debug classpath items would linger from different configs.
  ### Intellisense updates:
   - Add element items: ```xs:pattern```, ```xs:totalDigits```, ```xs:fractionDigits```, ```dfdl:property``` and ```xs:enumeration```.
   - Add missing ```xs:restriction``` child elements.
   - Add missing ```dfdl:escapeScheme``` element and the ```escapeScheme``` attributes.
   - Add additional missing ```dfdl:format``` attributes.
   - Add a preceeding space if missing when auto completing an attribute.
   - Add additional missing attributes.
   - Add a space after inserting an attribute if missing.
   - Add missing attribute items ```dfdl:binaryBooleanTrueRep``` and ```dfdl:binaryBooleanFalseRep```.
   - Add missing ```dfdl:newVariableInstance``` element, also add it as a child of the ```xs:appinfo``` element.
   - Add additional hierarchy levels to determine dfdl elements to suggest.
   - Add ```dfdl:element``` to list of suggestions for ```xs:element/annotation/app```.
  ### Data Editor updates:
   - Add support for large file editing and "infinite" scrolling.
   - Added support for editing in several Data Editors simultaneously.
   - Implement Incremental Search and Replace, and Save As functionality.
   - Consolidate single-byte and multi-byte view and edit modes.
   - Values are editable in the Data Inspector.
   - Content-type discovery using Apache Tika.
   - Initial implementation of a data profiler.
   - Implement "overwrite only" mode that will keep the file size the same, even when performing operations like Search and Replace where the token sizes aren't the same.
   - Add semantic highlighting for XPath expressions.
   - Fix bug of TDML generation on Windows creating bad paths.
   - Rename DataEditor hierarchy varibles in Launch Config:
       - From:
          ```
          "dataEditor": {
              "logFile": "${workspaceFolder}/dataEditor-${omegaEditPort}.log",
              "logLevel": "info"
          }
          ```
          To:
          ```
            "dataEditor": {
              "logging": {
                "logFile": "${workspaceFolder}/dataEditor-${omegaEditPort}.log",
                "logLevel": "info"
              }
            }
          ```
   - Code refactoring and cleanup.
   - Packaging process improvements.

## 1.3.0

 - Uses omega-edit data editor (no longer experimental).
 - Makes many improvements in the omega-edit data editor:
   - Includes new UI using Svelte.
   - Moves more of the server handling to omega-edit from the extension.
   - Closes many issues with the data editor and its new UI setup.
 - Makes Intellisense enhancements.
 - Adds support for outputting Infosets to JSON.
 - Reduces the number of platform conditionals being used.
 - Now supports Java 8.
 - Relays diagnostics in the "Parse" section of variables.
 - Allows for running Daffodil's "limited validation".
 - Improves Launch Wizard Classpath manipulation.
 - Removes unnecessary dependencies.
 - Allows values to be applied to variables in Debugger.
 - Updates LICENSE and NOTICE to add missing dependencies and remove some dependencies.
 - Adds initial support for generating TDML files.
 - Updates name of extension to "Apache Daffodil™ Extension for Visual Studio Code" from "VS Code extension for Apache Daffodil".

## 1.2.0

 - Use Apache Daffodil v3.4.0.
 - Add debug option that uses configuration of last debug.
 - Update version of node and Scala dependencies.
 - omega-edit updates:
   - Implement search.
   - Implement search and replace.
   - Update UI to support both search and replace.
   - Update redo and undo to use server instead of work around.
   - Update omega-edit script to be omega-edit-grpc-server instead of example-grpc-server.
 - Fix launch wizard display issues on light themes.
 - Keep hexview opened on debug stop.
 - ```xs:choice```, fixed snippet return for ```choiceDispatchKey```, fixed brace autocomplete for choice dispatchkey.
 - Test suite updates:
   - Move test suite to use @vscode/test-electron, so that we can now test all available code not just things that don't call the vscode api.
   - Create additonal unit tests, adding on to previous ones already made.
 - Restructure some code to make code flow better and easier to test.
 - Remove deprecated function ```substr``` to ```substring```
 - Fix issue with Intellisense inserting an extra ```<``` symbol.

## 1.1.0

 - Initial data editor client.
   - Enabled via command palette command so that it is hidden by default.
   - The UI displays a number of panels. The offset, encoded data, decoded data (main editing area). As well as 3 viewports set to specific bytes of the file currently. Some of the dropdowns and areas are not currently interactive but will be in the future.
   - Actions currently supported:
     - Adding
     - Deleting
     - Inserting
     - Undo & Redo
     - Copy & Paste
     - Saving edition session file:
     - Either to a new file or overwrite the existing file.
 - Creation of the "dfdl" language extension, replaces the snippets
 - Added debug option to use the same configuration as your last debug session.
 - New build script
 - Addition of Scala-Steward and Dependabot checks

## 1.0.0

 - DFDL schema debugging
 - Output infoset to console, file or none
 - Scala implementation of the daffodil debugger
 - Infoset View
   - This view dynamically updates to show the user what the current state of the infoset looks like
 - Infoset Diff View
   - This view dynamically updates to show the user the difference of the infoset from the previous step to the current one
 - Hex View
   - This view displays to the user the hexadeciaml of their data file
   - This view also highlights the current byte of the data file being read
 - Session launch configuration:
   - Both options are done utilizing file called .vscode/launch.json. This file can hold multiple different debugging profiles that can be selected between in VS Code
   - Configuration via Launch wizard:
     - The launch wizard is an interactive GUI that helps user set the values they want for the debugging configuration
     - The launch wizard allows for creating the 1st debug profile, creating additional debug profiles and updating existing debug profiles.
     - If the profile created is the first one the file .vscode/launch.json is automatically created with the profile in it
     - If the profile is an additional profile it will be appended to the list at .vscode/launch.json
     - If the profile already exists in .vscode/launch.json, the profile in the file will be updated upon saving
   - via Manual Editing:
     - The other way to customized the launch configuration is by manually editing the .vscode/launch.json file.
     - This is done by editing the specific profile you wish to change. This allows easy changing of the schema file, data file and other settings.
 - Run currently opened schema file
 - Debug currently opened schema file
 - Daffodil toolbar and Command Palette:
   - Open Infoset View
   - Open Infoset Diff View
   - Open Hex View
   - Open Launch Wizard
   - NOTE: These commands only become available when debugging has been started
 - Set breakpoints inside of main schema file
 - Set breakpoints inside of imported schemas


Copyright © 2025 [The Apache Software Foundation](https://www.apache.org/). Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). 
<br/>
Apache, Apache Daffodil, Daffodil, and the Apache Daffodil logo are trademarks of The Apache Software Foundation.
